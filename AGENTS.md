# Port Solace — notes for agents

Single-page three.js (r160, CDN importmap) voxel city game. **Edit `src/`, never `output.html`.**

## Build / run
- `node tools/build.mjs --check` — syntax-checks each part, concatenates `shell.html` + `src/*.js` (sorted) into `output.html`.
- `node tools/serve.mjs 8765` → http://127.0.0.1:8765/output.html (`?test` runs the `AF.test` self-tests; page title shows `passed/total`, currently 110/110; add `&v=<n>` to dodge browser cache). `file://` also works.
- Parts are plain scripts inside one module; each is wrapped in `try{}catch(e){AF.partError(...)}`. Numeric prefix = load order.
- Browser testing: delegate to the `tester` subagent (`.github/agents/tester.agent.md`) so Playwright output stays out of the main context.
- Scoped implementation: delegate well-specified, single-area changes to the `implementer` subagent (GPT-6.1 Sol, xhigh); keep planning and cross-cutting work in the main agent.

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
- Avatar parts are authored at 1/16 m then doubled to 1/32 m with a `FINE` detail pass (70). Zoo animals are refined 1/8 → 1/16 (46 `refine`).
- Title = modal with a second small WebGLRenderer turntable (71 `PV`), roster sorted by name.
- Ground cover (12, `AF.groundCover`): instanced tufts/flowers/ferns/shrubs scattered on green ground cells, drawn only within a tier radius of the camera and shrunk to zero at the edge.
- Crowd (55): per-9 m-cell density cap, groups (`w.lead` + `fl`/`fb` offsets: couples holding hands, parent + child, friends, wheelchair users), far walkers step at half rate.
- Friend homes (45 `upgradeHome`): per-friend `SHAPE`, bathroom annex, patio door, `GARDEN` (sunken `yardPool`, 1/16 `PROPS`).
- Planes (52): Space power + climb, Shift power off + descend, W/S taxi/brake, A/D bank-turn; keyboard pitch is soft-limited and auto-flares near the ground.

## Performance rules
- Tiers in `03-render.js` (`low`/`high`=Balanced default/`ultra`) gate pixel ratio, AO, shadow cadence, point lights, region/prop LOD distances. Auto-downgrade to low when frame EMA > 26 ms; choice saved in `localStorage['portSolace.gfx']`.
- Keep far work cheap: instanced meshes, reduced update rates beyond range (traffic, zoo animals), no per-frame allocations, tier-bounded light pools.
- Measured on NVIDIA T400: Balanced 31–46 fps, Low ~52–60. Boot ~20 s (meshing dominates).

## Gotchas
- One module script only; the original export ran the game twice.
- `create_file` cannot overwrite; terminal tools strip `cd` (use absolute paths).
