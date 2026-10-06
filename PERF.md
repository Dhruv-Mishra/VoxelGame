# Port Solace — performance contract

Never undo an item marked **(locked)**. New content keeps draws, triangles and tick time flat or lower for the poses in §1;
measure before/after (§9). Any change adding > 20 draws or > 100 k tris to a pose must say why in its commit.

## 1. Reference numbers (desktop Balanced, 1280×720, ANGLE/D3D11, `tools/perf-areas.js`)
| pose | GPU ms | draws | tris |
|---|---|---|---|
| street-downtown | 8.8 | 447 | 2.32 M |
| park-lake | 6.2 | 383 | 2.45 M |
| park-view (aerial 50 m) | 4.9 | 395 | 1.77 M |
| zoo-gate | 6.6 | 465 | 1.65 M |
| airfield | 3.2 | 315 | 0.67 M |

Boot (Laptop tier, headless, `tools/boot-time.js`): `ready` ≈ 16 s, `preloaded` ≈ 29 s. CPU ms vary ±25 % run to run;
compare draws and GPU ms.

## 2. Frame pacing (locked)
- `AF.fpsCap` 30 default (menu 30/60/Max, `portSolace.fps`). Skipped rAF callbacks run idle work (`AF.onIdle(name, fn(ms))`,
  ≤ 60 % of an interval, max 10 ms desktop / 6 ms phone). Auto-tier and dynamic resolution compare against the cap interval.
- Sun shadows refresh on a time cadence (≈30 Hz High/Balanced, ≈15 Hz lower) but every frame while the subject moves.
  Shadows setting Off/Low/High (`AF.gfx.setShadows`, `portSolace.shadows`); Low = near map only, 4-tap compare; phones default Low.
- Simulation uses `dt` (≤ 0.1 s); nothing assumes 60 Hz.

## 3. Renderer (locked)
- **Resolution / upscaling**: the scene renders at `AF.renderPR()` (= `basePR` × tier/dynres scale; menu target height,
  default 720p, `portSolace.resH`). When the post chain runs, the canvas stays at `AF.outputPR()` (display res, ≤ 2×) and the
  final `UPSCALE` pass (61-post) does Catmull-Rom 9-tap upsampling + contrast-adaptive sharpening; `?noupscale` / `?shot`
  turn it off. Change resolution only through `AF.applyPR()`. Point sprites size by `renderPR`.
- Instanced voxel meshes use `AF.mat.voxelInst` / `voxelInstC` + `AF.mat.depthInst` (sharing `AF.mat.voxel` made three
  re-derive programs ~75× per pass). `inst-ranges` uploads only `[0, count)` of instanced buffers.
- Dynamic near plane (`cam-near`): 0.1 m on foot/driving, up to 6 m when high. Never hard-code `camera.near`.
- No coplanar opaque surfaces (lift ≥ 0.02 m or `polygonOffset`). Position-keyed shader hashes sample a few cm behind the face.
- Post chain: bloom + AO (tier-gated) + grade + upscale. No tilt-shift/DOF (removed). Phones (`AF.MOBILE`) skip post.

## 4. LOD transitions (locked)
- Every LOD swap of voxel-material meshes is a dithered 0.3 s cross-fade (`AF.world.fade`, `fadeIn`/`fadeOut` variants).
  Never write `.visible` on such meshes while `owner.fadeE` is set — use `FADE.swap`. During `AF.stream.loading` swaps are instant.
- Fade programs are precompiled (`AF.world.fade.warm()`, via `AF.stream.compileAhead`) so the first swap never hitches.

## 5. Streaming (locked) — one engine, `01-stream.js`
- Post-boot content registers once: `AF.stream.register(name, { work(ms), near(), gen, order })`. `gen: true` = one-time
  generation the boot preload finishes. Never a bare `AF.onIdle` for content.
- One LOD table: `TIER` in 03-render → `AF.LOD` (× view distance `AF.lodScale`). Systems load `AF.LOD.prefetch` (1.3) × their
  display range, so every LOD change fades in something already resident. Shared look-ahead `AF.stream.ahead` (2.5 s, ≤ 400 m).
- Boot preload (`AF.stream.preload`, not in `?test`): gen systems, opening view, then `AF.stream.warm()` compiles every program
  with `compileAsync` (parallel link) against the post scene target. While `AF.stream.settling`, the renderer draws only every
  6th frame behind the veil. `AF.preloaded` / `preloaded` event mark the end.
- Travel: `AF.stream.travel({ label, go })` — veil, move, pump all systems until `near()` is empty, warm, reveal.
- City regions: 0.25 m full → 0.5 m coarse beyond `regLod` → 1 m cluster copy beyond `farLod`. Pending clusters reveal per
  region (partial reveal; `meshRegionG` keeps `hid: cl.lvl === 1 && !cl.part`).
- **Mesher workers** (02-voxel `AF.world.workers`): the greedy pass runs on 1–4 Web Workers (2 on phones, `hardwareConcurrency − 2`),
  batches of 16 chunks; output is byte-identical to the sync path. Generators yield `WAIT` while a batch is out; the streamer parks
  those jobs. Runtime edits mesh synchronously. `?noworker` or a worker error falls back to the main thread.
- Chunk decode uses a dense fast path + lookup-table `compactChunk`; terrain AO uses a precomputed table.

## 6. Outland (locked)
- Outside the `AF.W` grid: `07-outland` height/colour function, `49-outland` quadtree (64×64-cell tiles, 8 m shared edge profile,
  no skirts). Tiles mesh in up to 3 Web Workers (`O.meshTileArrays`), stale jobs dropped, ranked by distance + look-ahead.
  Budgets 960 nodes / 400 MB desktop, 720 / 224 MB phone. Budget: ≤ 20 draws, ≤ 250 k tris in city poses.
- Props via `AF.outland.addProp` (merged per tile, 3 LODs). Vegetation (`44-flora`) = 21 shared InstancedMeshes, near/mid/far-hull.
  Fauna (`56-wild`) = 5 InstancedMeshes, 15 Hz, wake within 260 m (hawks 700 m).
- Roads (`49-roads`): all ribbons + decks = one receive-only mesh; bridges/tunnels = one caster. Lookups through 64 m bucket
  grids, never a scan. `O.deckY` = highest ribbon under the wheel; ribbons sit 0.05 m up; terrain never pokes through.
- All outland water is one mesh (+ island lagoon). Idle-built lights register at build time.

## 7. Actors (locked)
- Traffic (`51`): lane graph, 15 Hz step + interpolation; full rate ≤ 240 m, 1/4 beyond in view, 1/8 off screen.
  `AF.vehicles.addRoute`, `placeParked` (merged static until used). Vehicles at `SPEED_K` 0.82.
- Walkers (`54`): `AF.walkers.addPath` — every path pedestrian shares 4 instanced draws (512 cap), limbs 5 Hz beyond 60 m.
- Air traffic (`53`): 7 instanced batches with per-instance livery; busy timetable only within 900 m.
- Park actors, zoo far LOD (merged per species, dithered), island jet skis: shared instanced/merged meshes.
- All ticks together cost 1.7–3.2 ms anywhere (`tools/tick-survey.js`). Keep new simulations distance/view gated.
- Crowd (`55`): 70 / 140 / 170 ambient walkers (low / Balanced / High). Fights, cops, run-overs only step peds the player engaged
  (`w.agg`, ≤ `G.engagedMax` + 8 cops), drawn through the same instanced frames (lying = a rotated instance, no new geometry).
- Gameplay (`76–78`): FX = 2 Points draws (glow additive, smoke dithered opaque) with an empty draw range when idle; job marker
  (2 draws), autogyro (2) and squad cars exist only while in use; police / run-over checks at 15 Hz within 60 m.

## 8. Content rules (locked)
1. Static → voxels (`W.fill`) or `AF.placeStatic`; outland → `AF.outland.addProp`.
2. Movers → shared InstancedMeshes, never one mesh per body part.
3. No `new THREE.*`, array literals or closures in per-frame code.
4. Lights only via `AF.addLight` (pooled, tier-capped); lamps are emissive voxels.
5. No new transparent materials except glass/water. 6. `castShadow` only for > 1 m objects near the player.
7. No sphere/cylinder > 12 segments for things < 2 m. 8. Map images are baked (`tools/map-bake.mjs`); re-bake after world edits.
9. Memory: iOS dies near 1.5 GB — check `AF.memStats()`. Runtime objects must have a forget path (76 forget policy, `AF.avatar.release`).

## 9. Measuring
- `node tools/serve.mjs 8765`; `node tools/build.mjs --check`. Baseline: `git show HEAD:output.html > tools/output-base.html`.
- Playwright (MCP run_code with `filename`): `test-run.js` (`?test`), `boot-time.js`, `perf-areas.js` (per-pose ms/draws/tris),
  `perf-run.js` (base vs current), `session.js` + `perf-list.js` / `perf-break.js` / `cpu-prof.js` / `gpu-prof.js` /
  `tick-survey.js` / `lod-check.js`, `stream-fly.js` / `city-fly.js` / `outland-drive.js` / `stream-test.js` (streaming hitches).
  Harnesses that boot their own page close other browser contexts.
