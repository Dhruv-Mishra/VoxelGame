# Port Solace — notes for agents

Single-page three.js (r160, CDN importmap) voxel city game. **Edit `src/`, never `output.html`.**

## Build / run
- `node tools/build.mjs --check` — syntax-checks each part, concatenates `shell.html` + `src/*.js` (sorted) into `output.html`.
- `node tools/serve.mjs 8765` → http://127.0.0.1:8765/output.html (`?test` runs the `AF.test` self-tests; page title shows `passed/total`, currently 108/108; add `&v=<n>` to dodge browser cache). `file://` also works.
- Parts are plain scripts inside one module; each is wrapped in `try{}catch(e){AF.partError(...)}`. Numeric prefix = load order.

## Architecture (global `AF`)
- Lifecycle: `AF.onBuild(name, order, fn)` at boot, `AF.onTick(name, order, fn)` per frame. Modes: `AF.modes[name]={enter,exit,update}`, `AF.setMode(name, opts)` (walk, aerial, drive, fly).
- Events: `AF.emit/on` (`toast`, `bubble`, `dialogue`, …). Walk prompts: `AF.addInteract(obj)` stores the **same object** (move it by mutating `x/y/z`); `dist`/`prio` pick the target.
- World: `AF.W` voxels at 0.25 m, x∈[-660,300). `AF.addBuilding/placeStatic/removeStatic/addLight/addLabel`, models via `AF.Model` + `AF.meshModel`, colours via `AF.col(hex,{metal,rough,emit})`.
- Layout lives in `05-plan.js` (`AF.PLAN`: roads, lots, `P.west` = colony/zoo/airfield, `P.pools`, views). Spawn/test positions need an explicit y or you land on roofs.

## Parts map
- Engine: 00 prologue, 01 core/input, 02 voxel + region LOD, 03 renderer + graphics tiers, 60 atmosphere/lights, 61 post, 62 water, 63 sky.
- World: 10 terrain/horizon, 11 streets, 12–42 districts, 45 friends colony, 46 zoo, 47 airfield.
- Actors: 50 cars/bikes (+ kerb-car proxy), 52 planes, 55 pedestrians, 56 ambient animals, 57 friends (cast, dialogue lines, NPCs, garages).
- Player/UI: 70 avatar + walk/aerial, 71 UI (title select, HUD, menu, map, dialogue), 72 touch controls, 98 tests, 99 boot.

## Performance rules
- Tiers in `03-render.js` (`low`/`high`=Balanced default/`ultra`) gate pixel ratio, AO, shadow cadence, point lights, region/prop LOD distances. Auto-downgrade to low when frame EMA > 26 ms; choice saved in `localStorage['portSolace.gfx']`.
- Keep far work cheap: instanced meshes, reduced update rates beyond range (traffic, zoo animals), no per-frame allocations, tier-bounded light pools.
- Measured on NVIDIA T400: Balanced 31–46 fps, Low ~52–60. Boot ~20 s (meshing dominates).

## Gotchas
- One module script only; the original export ran the game twice.
- `create_file` cannot overwrite; terminal tools strip `cd` (use absolute paths).
