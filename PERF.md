# Port Solace — performance & graphics spec

This is the contract every change must respect. **Never undo an item marked (locked)**; new content must make the
numbers below better or keep them flat. Measure before and after (see "Measuring").

## 1. Baseline (Oct 2026, desktop Standard tier, 1280×720, Windows/ANGLE D3D11, `?nostream`, before this spec)

| pose | frame ms (CPU+GPU synced) | GPU ms | draw calls | tris (incl. shadow) |
|---|---|---|---|---|
| street-downtown | 15.4 | 9.0 | 486 | 2.17 M |
| park-lake | 14.6 | 8.4 | 514 | 2.36 M |
| park-view (aerial 50 m) | 13.8 | 8.8 | 727 | 1.65 M |
| zoo-gate | 15.1 | 6.7 | 548 | 1.82 M |
| airfield | 10.0 | 3.4 | 318 | 0.62 M |

Hot spots found: Central Park actors = 272 draw calls for 35 k triangles (one mesh per body part); zoo = per-part
animal instancing + 22 water + 32 glass draws at the gate; world coarse/far copies dominate triangles.

After this spec (same harness, `tools/perf-areas.js`; CPU ms on this machine vary ±25 % run to run, compare draws/GPU):

| pose | GPU ms | draw calls | tris |
|---|---|---|---|
| street-downtown | 8.8 | 447 | 2.32 M |
| park-lake | 6.2 | 383 | 2.45 M |
| park-view (aerial 50 m) | 4.9 | 395 | 1.77 M |
| zoo-gate | 6.6 | 465 | 1.65 M |
| airfield (new terminal + AI traffic) | 3.2 | 315 | 0.67 M |

Main-pass draws at park-view 661 → 330. Streaming flight test (`tools/stream-fly.js`, 24 s at ~110 m/s): regions
showing their 1 m copy within 160 m of the camera 2350 → ~900 sample-regions, worst hitch 508 → ~200 ms, 30 fps held.

## 2. Frame pacing (locked)
- `AF.fpsCap` (default **30**, menu: 30 / 60; saved in `localStorage['portSolace.fps']`). The rAF loop skips callbacks
  until the next 1/cap slot; skipped callbacks run **idle work** (`AF.onIdle(name, fn(budgetMs))`) — region streaming
  and far-cluster builds use that spare time instead of the rendered frame.
- Auto-tier and dynamic resolution compare frame time against the cap interval, never against 16.7 ms.
- Sun-shadow refresh cadence is time based (≈30 Hz High/Balanced, ≈15 Hz Standard/Low at the 30 fps cap).
- Simulation code must use `dt` (≤ 0.1 s); nothing may assume 60 Hz.

## 2b. Renderer CPU (locked)
- Instanced voxel meshes use `AF.mat.voxelInst` / `voxelInstC` + `AF.mat.depthInst` (`AF.mat.splitInstanced`, run by the
  dyn-cull scan). Sharing `AF.mat.voxel` between plain and instanced meshes made three re-derive the program ~75× per
  pass (`getParameters` was the #2 CPU cost). New instanced voxel content: assign `AF.mat.voxelInst` directly.
- `inst-ranges` (03, order 895) uploads only `[0, count)` of every instanced buffer (117 k slots allocated, ~5 k live).
- Near sun shadows on Standard / Low / phones use a 4-fetch bilinear compare (`uShadowFast`) instead of PCF-soft (36).
- Flags (`civic-flags`) animate only on screen; beyond 90 m at 10 Hz.
- Profile with `tools/cpu-prof.js` (CDP sampling of `AF.step` in the open session page).
- Simulations are local (Oct 2026 survey, `tools/tick-survey.js` → `afTicks(poses)`): all ticks together cost 1.7–3.2 ms
  per frame anywhere on the map. Park, zoo, harbour, crowd, animals, flags, air traffic gate by distance/view; AI traffic
  runs full rate within 240 m, 1/4 rate beyond in view, 1/8 beyond and off screen. Keep new simulations under this rule.

## 3. Depth precision / z-fighting (locked)
- Precision of a 24-bit depth buffer (Windows ANGLE/D3D11) is ≈ d² / (near · 2²⁴). `near` is **dynamic** (`cam-near`
  tick, 03-render): 0.1 m on foot / driving, grows with altitude and chase distance (fly/aerial/cine) up to 6 m.
  Never hard-code `camera.near` back to 0.08.
- Never place two coplanar opaque surfaces (decals, flat props flush on voxel faces). Lift by ≥ 0.02 m or use
  `polygonOffset` on the overlay material.
- Shader hashes keyed on world position (fake window rooms, neon cells) must sample a few cm *behind* the face: faces lie
  exactly on the 0.25 m grid, so `floor()` of the face plane flips per pixel on D3D (looked like z-fighting on skyscraper
  windows).

## 4. LOD transitions (locked)
- Every LOD swap of voxel-material meshes (region full ↔ 0.5 m coarse, cluster full ↔ 1 m far, props near ↔ far,
  prop cull) is a **dithered cross-fade** (`AF.world.fade`, 0.3 s, shared `uFadeK` uniform, `fadeIn`/`fadeOut` material
  variants with `discard` only in those variants). Do not toggle `.visible` directly for those meshes; call the fade.
- Fade programs are precompiled (`AF.world.fade.warm()`) so the first swap never hitches.

## 5. Streaming (locked)
- Pending clusters are ranked by distance to the camera **and** to a 1.5 s velocity-predicted point (planes).
- Budget per frame is small (1.5 ms when idle slots run); the rest runs in idle slots of the fps cap (≤ 60 % of a display
  interval, max 10 ms desktop / 6 ms phone).
- **Partial reveal**: a pending cluster within view range shows each region as soon as it is meshed and hides that
  region's slice of the merged 1 m copy (geometry groups + an invisible material); the cluster only pays one extra draw
  per slice while half-loaded. `meshRegionG` must keep `hid: cl.lvl === 1 && !cl.part`.
  (`gfx-adapt`, checked every 4 s).
- Night light pools (6) on; no PMREM, no far cascade, no post chain, near-only shadows (unchanged memory rules).
- LOD ranges: full voxels to 50 m, 0.5 m copy to 125 m, 1 m clusters beyond.
- Brightness defaults to the slider maximum (2.0) everywhere (`localStorage['portSolace.bright2']`); `?shot`/`?test` use 1.0.

## 6b. Content already optimised (keep it that way)
- Central Park actors: shared per-part InstancedMeshes + merged far poses (`park-life-parts`, `park-life-far`,
  `park-moving-parts`), spectators baked into region props before meshing (build order 490), ticks gated by
  `parkDistance()`.
- Zoo: one merged far mesh per species beyond 52–62 m with a dithered swap, pools batched into two water meshes, Pride
  Rock is a supported stepped outcrop (lions rest on the sampled surface).
- Airfield: terminal/forecourt/jet bridges are voxels + static props (zero extra draws); AI traffic (`53-airtraffic.js`)
  is five InstancedMeshes, frustum-culled by instance bounds, hidden when nothing is within 2 km, zero per-frame allocation
- Self-test `voxel: one LOD copy per region on screen` guards §4/§5; `tools/lod-check.js` (`afLodCheck`) checks a live page.

## 6. Phone profile (`AF.MOBILE`)
- 30 fps cap, MSAA on (cheap on tile GPUs), render at 1 CSS px (was 0.75), adaptive resolution 0.8–1.0 holds 30 fps.
- Night light pools (6) on; no PMREM, no far cascade, no post chain, near-only shadows (unchanged memory rules).

## 7. Content rules (all parts, locked)
1. Static scenery → voxels (`W.fill`) or `AF.placeStatic` props (merged  (`--out=name.html` for a private copy when
  several agents work at once).
- Playwright: `tools/perf-areas.js` (per-pose ms / GPU ms / draws / tris / top ticks; set `globalThis.__psUrl =
  'tools/output-pre.html'` for the pre-spec baseline). `tools/session.js` keeps a booted page; then `tools/perf-list.js`
  (`afList(pose)`: what the main pass drew, grouped by owner) and `tools/perf-break.js`. `tools/stream-fly.js` = real-time
  streaming flight (late-LOD metric), `tools/test-run.js` = `?test` in a private context, `tools/look.js` = screenshots
  with the shipping defaults. perf-areas / session / stream-fly close other browser contexts: never run them while
  another agent uses the browserrs at reduced rate; no
   `new THREE.*` / array literals / closures inside per-frame code.
4. Lights: only through `AF.addLight` (pooled, tier-capped). Lamps are emissive voxels (`glow`). Never add
   `THREE.PointLight`/`SpotLight` in content parts.
5. No new transparent materials except glass/water; merge water bodies of one area into one mesh where possible.
6. `castShadow` only for objects > 1 m that are near the player; small movers are handled by `AF.CULL`.
7. New geometry: no `SphereGeometry`/`CylinderGeometry` above 12 segments for anything smaller than 2 m.

## 8. Measuring
- `node tools/serve.mjs 8765`, build with `node tools/build.mjs --check`.
- Playwright: `tools/perf-areas.js` (per-pose ms / GPU ms / draws / tris / top ticks; set `globalThis.__psUrl =
  'tools/output-pre.html'` for the pre-spec baseline). `tools/session.js` keeps a booted page; then `tools/perf-list.js`
  (`afList(pose)`: what the main pass drew, grouped by owner) and `tools/perf-break.js`.
- Any change that adds > 20 draw calls or > 100 k triangles to a pose in the table must be justified in its commit.
