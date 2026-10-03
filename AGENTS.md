# Port Solace — notes for agents

Single-page three.js (r160, CDN importmap) voxel city game. **Edit `src/`, never `output.html`.**

## PERFORMANCE CONTRACT — read `PERF.md` before any change
- Never undo an optimisation marked *locked* in `PERF.md`: 30 fps cap + idle-slot work (`AF.fpsCap`, `AF.onIdle`), dynamic
  near plane (`cam-near`, z-fighting on Windows/D3D11), dithered LOD cross-fades (`AF.world.fade`), streaming lookahead +
  partial cluster reveal, phone profile (MSAA, 1 CSS px, adaptive res), instanced park actors / zoo far LOD / air traffic.
- New content must keep or lower draw calls, triangles and tick time for the poses in `PERF.md` §1; measure with
  `tools/perf-areas.js` before/after. Static things are voxels or `AF.placeStatic`; movers are shared InstancedMeshes with
  distance-gated ticks; lights only via `AF.addLight`; no per-frame allocations; use `dt` (never assume 60 Hz).
- Owners must not write `.visible` on world LOD meshes while `owner.fadeE` is set — go through `FADE.swap`.
- Streaming is ONE engine (`01-stream.js`, PERF.md §5): content built after boot registers with `AF.stream.register`
  (never a bare `AF.onIdle`), reads its ranges from `AF.LOD` (filled from the `TIER` table in 03-render), and one-time
  generation is `gen: true` so the boot preload finishes it. Teleports go through `AF.stream.travel({ label, go })`.

## Build / run
- `node tools/build.mjs --check` — syntax-checks each part, concatenates `shell.html` + `src/*.js` (sorted) into `output.html` (`--out=x.html` writes a private copy).
- `node tools/serve.mjs 8765` → http://127.0.0.1:8765/output.html. `?test` runs `AF.test` self-tests (title shows `passed/total`); add `&v=<n>` to dodge cache.
- Normal boots run `AF.stream.preload` after `ready` (generators, opening view, shader warm-up; ~10 s): harnesses that measure play wait for `__af.preloaded`, not `ready`. `?test` skips it.
- World map = baked images in `assets/` (`node tools/map-bake.mjs` with the server running; needs `playwright` resolvable, e.g. `NODE_PATH` to an npx cache); re-bake after terrain / road / building changes.
- Parts are plain scripts in one module, each wrapped in `try{}catch(e){AF.partError(...)}`. Numeric prefix = load order.

## Architecture (global `AF`)
- Lifecycle: `AF.onBuild(name, order, fn)` at boot, `AF.onTick(name, order, fn)` per frame. Modes: `AF.modes[name]={enter,exit,update}`, `AF.setMode(name, opts)` (walk, aerial, drive, fly).
- Events: `AF.emit/on` (`toast`, `bubble`, `dialogue`, …). `AF.addInteract(obj)` stores the **same object** (move it by mutating `x/y/z`); `dist`/`prio` pick the target.
- World: `AF.W` voxels at 0.25 m, x∈[-660,300) (the city). Outside it the procedural outland (`AF.PLAN.world`, 4× the city) — sample ground with `AF.outland.h(x,z)` there. `AF.addBuilding/placeStatic/removeStatic/addLight/addLabel`, models via `AF.Model` + `AF.meshModel`, colours via `AF.col(hex,{metal,rough,emit})`.
- Layout: `05-plan.js` (`AF.PLAN`: roads, lots, `P.west` = colony/zoo/airfield, `P.pools`, views). Spawn/test positions need an explicit y or you land on roofs.

## Parts map
- Engine: 00 prologue, 01 core/input/pointer lock, 01-stream (streaming engine, boot preload, travel veil, shader warm-up, `compileAhead`), 02 voxel + region LOD, 03 renderer + tiers + the LOD table, 04-vehicle (`AF.Vehicle` base class: pose, `attach`/`sync` interact prompt, shared `Vehicle.input()`, `Vehicle.Chase` camera, `landing`, `hud`; cars, planes and jet skis inherit it), 60 atmosphere/fog, 61 post, 62 water, 63 sky.
- World: 07 outland height/colour fn (`AF.outland`, everything outside the `AF.W` grid), 10 terrain/coast (`AF.land.coastS(x,z)` = m inland, < 0 sea), 11 streets, 12 nature + ground cover, 13–43 districts, 44-flora (outland vegetation: trees, palms, cacti, shrubs, rocks; instanced), 44-island (Serena Isle + ferry; painted runway with a flyable Cub, sunset party, bonfire, volleyball, raft, rideable `jetski` mode + AI riders), 44-sites (farms, villages, hamlets, wheat patches; `S.lib` geometry helpers with 3 LODs), 44-wayside (ring road stops; shops, motel rooms and WCs are enterable shells with per-wall colliders), 45 friends colony/homes, 46 zoo, 47 airfield (fenced perimeter; security at x -490/-484 z 56 is the only walk-in route; parked cars, drop-off routes, passengers/staff; jet bridges to stands x -450/-360, remote stand R3 x -325; runway 2 at z 188 + west crossing taxiway; GSE row), 48 sea, 49 outland quadtree mesher (`AF.outland.addProp`, `renderer.diagnose()`; tiles mesh in Web Workers via `O.meshTileArrays`, stale jobs dropped), 49-roads (road ribbons, bridges, tunnels, rural traffic, hikers; see PERF.md §5e).
- Actors: 50 vehicle models/player driving/parking (`AF.vehicles.placeParked`), 51 traffic sim (lane graph, 15 Hz, `AF.vehicles.addRoute`), 52 planes, 53 AI airliners (`AF.airTraffic`; busy 360 s timetable of 10 flights within 900 m of the airport, else 480 s; land R1, take off R2; liveried instanced batches; ground crew per stand), 54 path walkers (`AF.walkers.addPath`, 4 shared draws), 55 pedestrians/crowd, 56 animals, 56-wild (outland deer/rabbits/sheep/cows/hawks, instanced), 57 friends (cast, dialogue, NPCs; `visual:false` reuses walkers).
- Player/UI: 70 avatar + walk/aerial, 71 UI (title, HUD, menu, dialogue), 72 touch, 74 map (baked static images + labels, minimap, `AF.ui.toggleMap`), 98 tests, 99 boot.
- Title avatar turntable is drawn by the main renderer (viewport + scissor); never add a second WebGLRenderer.
- Pointer lock is held across modes; Escape releases + pauses and never exits vehicles (E/F do).

## Performance rules
- Tiers in `03-render.js` (`TIER`): `low` / Laptop (`high` + `AF.GFX.lite`) / `high` = Balanced / `ultra` = High. Choice saved in `localStorage['portSolace.gfx']`; auto-tier only when unset.
- Prefer lighter effects over lower resolution (sub-1.0 scales look soft). Render resolution is a menu slider (target height,
  default 720p by owner request, `portSolace.resH`); view distance scales every LOD range (`AF.lodScale`, `portSolace.lod`).
- Region LOD (02): 0.25 m → 0.5 m beyond `AF.REGION_LOD` → 1 m far copy beyond `AF.FAR_LOD`, built lazily (`AF.world.buildFarAll()` for shots). Swaps cross-fade (0.3 s, `?nofade` off); a half-streamed cluster reveals ready regions per slice.
- Streaming (02, `AF.world.stream`): normal boots mesh only regions near `AF.PLAN.bootFocus` + all 1 m clusters; full regions stream in per cluster (`cl.pending`) nearest/look-ahead first, mostly in idle slots of the fps cap; far clusters unload. Off in `?test`/`?shot`/`?near`/`?nostream`.
- Far work must stay cheap: instanced meshes, reduced update rates at range, no per-frame allocations, tier-bounded light pools. City-spanning instanced meshes stay `frustumCulled=false`.
- Memory (iOS dies near ~1.5 GB): check `AF.memStats()`. `AF.MOBILE` (`?mobile`) skips post, far shadows, PMREM, AO; phones cast shadows only near the focus.
- Frame cap: `AF.fpsCap` 30 default (menu 30/60/Max, `localStorage['portSolace.fps']`); auto-tier/dynres compare against the cap interval. Brightness defaults to 2.0 (`portSolace.bright2`).

## Gotchas
- One module script only; the original export ran the game twice.
- `create_file` cannot overwrite; terminal tools strip `cd` (use absolute paths).
- Playwright: harness files that boot their own page close other contexts (perf-areas, session, stream-fly); `?test` takes ~35 s and only "boot under 30 s" fails on this machine. Screenshot paths must be absolute.
