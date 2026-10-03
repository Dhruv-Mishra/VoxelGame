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
- Sun-shadow refresh cadence is time based (≈30 Hz High/Balanced, ≈15 Hz Standard/Low at the 30 fps cap), but the near map
  re-renders **every frame while the shadow subject moves** (> 0.05 m/frame, not aerial/cine): a stale map made the driven
  car's own shadow lag and jitter on phones.
- Shadows setting (`AF.shadowQ`, menu Off / Low / High, `localStorage['portSolace.shadows']`, `?shadows=`): Low = near map
  only (≤ 1024, fast 4-tap compare, no far cascade, Standard cadence); phones default to Low. `AF.gfx.setShadows(q)`.
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
- LOD ranges: full voxels to 50 m, 0.5 m copy to 125 m, 1 m clusters beyond.
- Brightness defaults to the slider maximum (2.0) everywhere (`localStorage['portSolace.bright2']`); `?shot`/`?test` use 1.0.

## 5b. Outland (locked)
- Everything outside the `AF.W` city grid is the procedural **outland** (`07-outland.js` height/colour function
  `AF.outland.h/colTop/colSide/waterY`, `49-outland.js` quadtree mesher). The world is 4× the city
  (`AF.PLAN.world.play` x [-1220,1020], z [-900,300]) plus Serena Isle and a horizon ring; the grid size is unchanged.
- Tiles are 64×64 cells, built in idle slots (`outland-build`), swapped with `AF.world.fade`. Tile edges share a
  world-anchored 8 m boundary profile (no skirts); `AF.outland.renderer.diagnose()` checks gaps/overlaps on demand.
- Budget: outland ≤ 20 draws and ≤ 250 k triangles in city poses. Outland props go through `AF.outland.addProp`
  (merged per tile, coarse LOD), vegetation through `44-flora.js` (six shapes — broadleaf, conifer, palm, rock, cactus,
  shrub — in ≤ 10 shared instanced draws, ~13.6 k records with per-instance non-uniform scale/yaw/palette; near models
  44–172 triangles). Outland roads are looked up through a 64 m segment grid (`roadAt`), never a scan of every segment.
- All outland water (Lake Tamsin, Mirror Lake, ponds) is one mesh; the island lagoon is one more.
- Lights for idle-built content must be registered at build time: night light pools snapshot `AF.lights` once.

## 5c. Traffic, walkers, airport (locked)
- `51-traffic.js`: lane graph (nodes split at crossings, directed lanes, sampled connectors), intrusive per-lane queues,
  persistent junction ownership, fixed 15 Hz step with render interpolation; full rate within 240 m, 1/4 beyond in
  view, 1/8 off screen. Was 0.4–1.2 ms/frame, now 0.09–0.19 ms. Add drivers with `AF.vehicles.addRoute` (gated by
  `activeRadius`) and parked cars with `AF.vehicles.placeParked` (merged static, promoted to a car on use).
- `54-walkers.js`: `AF.walkers.addPath(name, points, opts)` — all path pedestrians (airport, island, outland) share four
  instanced draws, 512-actor cap, inactive paths freeze, limbs at 5 Hz beyond 60 m.
- Airport: fenced perimeter (security is the only walk-in route), parked cars are merged props, drop-off routes and
  passenger/staff paths gate at 350 m; the busy 600 s timetable (4 flights) runs only within 900 m, else the light
  480 s timetable. Airport hooks ≈ 0.17 ms near, < 0.02 ms elsewhere.

## 5e. Outland network (Oct 2026)
- Roads in `AF.PLAN.world.roads` are control points; `07-outland` (build 496) densifies them (Catmull-Rom, 5-6 m), profiles heights
  from smoothed terrain with a grade limit (ring 7 %, lanes 10 %, trails 30 %), anchors junctions/city joins and flags spans
  (1 bridge: over water or > 7 m fill; 2 tunnel: ring only, > 12 m cut). Rivers (`O.rivers`) carve channels after the city-edge
  blend; levels never rise downstream. Everything is looked up through 64 m bucket grids (roads +44 m, rivers +100 m).
- `49-roads`: all asphalt ribbons + bridge decks = **one** receive-only mesh, bridges/tunnels/piers = **one** shadow-casting mesh
  (~8 k + 1 k quads), built in idle slots. Ribbons use the city street palette (same `AF.col` keys). Physics reads
  `AF.outland.deckY` from `AF.surfaceBelow`; route cars use `addRoute(..., { yAt })`. Rural traffic is 14 cars on five loops.
- Measured (Standard, `perf-areas`): draws flat (-48..+10), GPU ms flat; triangles +40..115 k in city/aerial poses (ribbons +
  finer terrain colour runs). Boot +~110 ms (`outland-boundary` + roots).

## 5d. UI / map
- `74-map.js` rasterises the whole world (0.1 px/m) and the city (1.5 px/m) in idle slots (≤ 1.5 ms slices) after
  `ready`; canvases total ≈ 10–15 MB. Minimap redraws ≤ 10 Hz and only when the view changed. HUD text updates on
  change only. No backdrop blur on phones.

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
- 30 fps cap, MSAA on (cheap on tile GPUs), adaptive resolution 0.55-1.0 of the base holds 30 fps.
- Render resolution (all devices, menu slider, `localStorage['portSolace.resH']`): target height in device pixels, default
  **720p** in the screen's aspect ratio (`AF.basePR`); `?test`/`?shot` keep the tier defaults. View distance (`portSolace.lod`,
  `AF.lodScale` 0.6-2.5, phones <= 1.5) multiplies region/cluster/prop ranges, the outland quadtree split distance and flora
  near/far (`AF.gfx.setView`). Outland props carry three LODs (full / 2x / 4x at quadtree level >= 3; props < 3 m drop there).
- Night light pools (6) on; no PMREM, no far cascade, no post chain, near-only shadows (unchanged memory rules).

## 7. Content rules (all parts, locked)
1. Static scenery → voxels (`W.fill`) or `AF.placeStatic` props (merged per region); outside the grid
   `AF.outland.addProp`.
2. Movers → shared InstancedMeshes (`AF.walkers`, vehicle batches, park/zoo parts), never one mesh per body part.
3. Ticks are distance/view gated and run far movers at reduced rate; no `new THREE.*` / array literals / closures
   inside per-frame code.
4. Lights: only through `AF.addLight` (pooled, tier-capped). Lamps are emissive voxels (`glow`). Never add
   `THREE.PointLight`/`SpotLight` in content parts.
5. No new transparent materials except glass/water; merge water bodies of one area into one mesh where possible.
6. `castShadow` only for objects > 1 m that are near the player; small movers are handled by `AF.CULL`.
7. New geometry: no `SphereGeometry`/`CylinderGeometry` above 12 segments for anything smaller than 2 m.

## 8. Measuring
- `node tools/serve.mjs 8765`, build with `node tools/build.mjs --check`.
- Playwright: `tools/perf-areas.js` (per-pose ms / GPU ms / draws / tris / top ticks; set `globalThis.__psUrl =
  'tools/output-pre.html'` for the pre-spec baseline). `tools/session.js` keeps a booted page; then `tools/perf-list.js`
  (`afList(pose)`: what the main pass drew, grouped by owner) and `tools/perf-break.js`. `tools/stream-fly.js` = real-time
  streaming flight (late-LOD metric), `tools/test-run.js` = `?test` in a private context, `tools/look.js` = screenshots
  with the shipping defaults, `tools/tick-survey.js` = per-hook tick cost. perf-areas / session / stream-fly close other
  browser contexts: never run them while another agent uses the browser. Use `--out=name.html` for a private build.
- Any change that adds > 20 draw calls or > 100 k triangles to a pose in the table must be justified in its commit.
