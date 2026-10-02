# Port Solace — notes for agents

Single-page three.js (r160, CDN importmap) voxel city game. **Edit `src/`, never `output.html`.**

## Build / run
- `node tools/build.mjs --check` — syntax-checks each part, concatenates `shell.html` + `src/*.js` (sorted) into `output.html`.
- `node tools/serve.mjs 8765` → http://127.0.0.1:8765/output.html. `?test` runs `AF.test` self-tests (title shows `passed/total`); add `&v=<n>` to dodge cache.
- Parts are plain scripts in one module, each wrapped in `try{}catch(e){AF.partError(...)}`. Numeric prefix = load order.

## Architecture (global `AF`)
- Lifecycle: `AF.onBuild(name, order, fn)` at boot, `AF.onTick(name, order, fn)` per frame. Modes: `AF.modes[name]={enter,exit,update}`, `AF.setMode(name, opts)` (walk, aerial, drive, fly).
- Events: `AF.emit/on` (`toast`, `bubble`, `dialogue`, …). `AF.addInteract(obj)` stores the **same object** (move it by mutating `x/y/z`); `dist`/`prio` pick the target.
- World: `AF.W` voxels at 0.25 m, x∈[-660,300). `AF.addBuilding/placeStatic/removeStatic/addLight/addLabel`, models via `AF.Model` + `AF.meshModel`, colours via `AF.col(hex,{metal,rough,emit})`.
- Layout: `05-plan.js` (`AF.PLAN`: roads, lots, `P.west` = colony/zoo/airfield, `P.pools`, views). Spawn/test positions need an explicit y or you land on roofs.

## Parts map
- Engine: 00 prologue, 01 core/input/pointer lock, 02 voxel + region LOD, 03 renderer + tiers, 60 atmosphere/fog, 61 post, 62 water, 63 sky.
- World: 10 terrain/coast (`AF.land.coastS(x,z)` = m inland, < 0 sea), 11 streets, 12 nature + ground cover, 13–42 districts, 45 friends colony/homes, 46 zoo, 47 airfield, 48 sea (ships, lighthouses, rig).
- Actors: 50 cars/bikes (player contacts), 52 planes (arcade flight, per-type `TYPES`), 55 pedestrians/crowd, 56 animals, 57 friends (cast, dialogue, NPCs).
- Player/UI: 70 avatar + walk/aerial, 71 UI (title, HUD, menu, map, dialogue), 72 touch, 98 tests, 99 boot.
- Title avatar turntable is drawn by the main renderer (viewport + scissor); never add a second WebGLRenderer.
- Pointer lock is held across modes; Escape releases + pauses and never exits vehicles (E/F do).

## Performance rules
- Tiers in `03-render.js` (`TIER`): `low` / Laptop (`high` + `AF.GFX.lite`) / `high` = Balanced / `ultra` = High. Choice saved in `localStorage['portSolace.gfx']`; auto-tier only when unset.
- Prefer lighter effects over lower resolution (sub-1.0 scales look soft).
- Region LOD (02): 0.25 m → 0.5 m beyond `AF.REGION_LOD` → 1 m far copy beyond `AF.FAR_LOD`, built lazily (`AF.world.buildFarAll()` for shots).
- Streaming (02, `AF.world.stream`): normal boots mesh only regions near `AF.PLAN.bootFocus` + all 1 m clusters; full regions stream in per cluster (`cl.pending`) and far clusters unload. Off in `?test`/`?shot`/`?near`/`?nostream`.
- Far work must stay cheap: instanced meshes, reduced update rates at range, no per-frame allocations, tier-bounded light pools. City-spanning instanced meshes stay `frustumCulled=false`.
- Memory (iOS dies near ~1.5 GB): check `AF.memStats()`. `AF.MOBILE` (`?mobile`) skips post, far shadows, PMREM, AO; phones cast shadows only near the focus.

## Gotchas
- One module script only; the original export ran the game twice.
- `create_file` cannot overwrite; terminal tools strip `cd` (use absolute paths).
