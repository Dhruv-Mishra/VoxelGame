# Port Solace — notes for agents

Single-page three.js (r160, CDN importmap) voxel city game. **Edit `src/` + `shell.html`, never `output*.html`.**
Read `PERF.md` before any change: it is the performance contract (locked items, budgets, harnesses).

## Build / run / deploy
- `node tools/build.mjs --check` — syntax-checks parts, concatenates `shell.html` + `src/*.js` (sorted) into `output.html`.
  `--min --out=output-min.html` = esbuild whitespace/syntax minify (identifiers kept: worker sources come from `Function.toString()`).
- `node tools/serve.mjs 8765` → http://127.0.0.1:8765/output.html. `?test` runs `AF.test` self-tests (title `passed/total`, ~35 s;
  only "boot under 30 s" may fail locally). Other flags: `?nostream ?nofade ?noupscale ?noworker ?mobile ?shot ?near=x,y,z`.
- Deploy: rebuild both `output.html` and `output-min.html`, commit, `vercel --prod`. Vercel serves `/` → `output-min.html`
  (`vercel.json`; `.vercelignore` ships only the HTML, `assets/` and config).
- World map = baked images in `assets/` (`node tools/map-bake.mjs`, server running, `playwright` resolvable); re-bake after
  terrain / road / building edits.

## Architecture (global `AF`)
- Parts are plain scripts in one module, each wrapped in `try{}catch(e){AF.partError(...)}`; numeric prefix = load order.
  `AF` is `window.AF` (no local alias — worker sources reference it by name).
- Lifecycle: `AF.onBuild(name, order, fn)`, `AF.onTick(name, order, fn)`, `AF.onIdle`; streaming via `AF.stream.register`.
  Modes: `AF.modes[name]={enter,exit,update}`, `AF.setMode` (walk, aerial, drive, fly, jetski, photo, dead, carousel).
- Events: `AF.emit/on` (`toast`, `bubble`, `dialogue`, `ready`, `preloaded`, …). `AF.addInteract(obj)` keeps the same object.
- World: `AF.W` voxels at 0.25 m, x∈[-660,300) = the city. Outside it the outland (`AF.PLAN.world`, 4× the city): ground via
  `AF.outland.h(x,z)`. `AF.addBuilding/placeStatic/removeStatic/addLight/addLabel`, models `AF.Model` + `AF.meshModel`,
  colours `AF.col(hex,{metal,rough,emit})`. Layout lives in `05-plan.js` (`AF.PLAN`). Spawn positions need an explicit y.

## Parts map
- Engine: 00 prologue · 01 core/input/pointer lock · 01-stream (streaming engine, preload, travel veil, shader warm-up) ·
  02 voxels, region LOD, mesher workers · 03 renderer, tiers, LOD table, resolution · 04 `AF.Vehicle` base class ·
  60 atmosphere · 61 post (bloom, AO, grade, upscale) · 62 water · 63 sky.
- World: 05 plan · 07 outland height/colour + tile mesher (workers) · 10 terrain/coast · 11 streets · 12 nature ·
  13–43 districts · 44-farms/flora/island/sites/wayside · 45 friends colony · 46 zoo · 47 airfield · 48 sea ·
  49 outland quadtree · 49-roads.
- Actors: 50 vehicles · 51 traffic · 52 planes · 53 air traffic · 54 path walkers · 55 pedestrians · 56 animals ·
  56-wild outland fauna · 57 friends (cast, dialogue).
- Player/UI: 70 avatar + walk/aerial · 71 UI (title, HUD, menu, dialogue) · 72 touch · 74 map (`map.overlays`, `map.miniOverlays`) ·
  75 extras (photo mode `P`, Solace Stars collectibles) · 98 tests · 99 boot.
- Gameplay: 76 core (`AF.G` tuning, `AF.save`, money, health/death, `AF.shop` sheet, `AF.fx` particles, `AF.sfx`, `AF.hud`,
  forget policy) · 77 combat (weapons, engaged peds, run-overs, police/wanted, autogyro, vehicle damage) · 78 jobs (jobs,
  counters, Body Works / Motor Exchange zones, carnival games, carousel, wardrobe, Westgate boarding pass).

## Gameplay layer (76–78)
- Balance only in `AF.G` (prices, pay, damage, heat, star thresholds, forget distances). `AF.save` (money, guns, ammo, mags,
  outfits, a look per friend) is the only persisted game state; everything else is forgotten (runtime cars `car.temp` →
  `VV.forget` back to their kerb, engaged peds calm down past `G.pedForgetD`, wrecks after `G.wreckS`).
- Peds stay bare crowd instances until touched: `w.agg` (77 `engage`) makes 55's crowd tick call `AF.combat.stepPed`;
  `CB.release` returns them. Cops = 8 pooled walkers in the `cop` look. Kids / wheelchair users only ever flee.
- Vehicles: `car.hp` → `car.dmg` (instanced `carDmg` attribute in the car paint shader); impacts arrive via `VV.onImpact`.
  The player always sits in the vehicle (`AF.Vehicle.seat`, `VV.seatLocal`). Camera distance is `AF.view` (C cycles
  first person / near / far) for walk, chase cams and planes — no wheel zoom.
- Jobs extend `class Job` (78): implement `plan()` → next stop `{x,z,r,wait,t,pay,label,done}` (null ends the shift).
  Counters: `counter(x,y,z,label,open)` + `AF.shop.open({title,sub,tabs,items(tab)})`; drive-in zones via `zone()`.
- Keys: Q / click attack, Z / right mouse aim, wheel / 1–5 / X weapon, R reload, C camera, J job. Touch: HIT AIM WPN CAM JOB.

## Rules of thumb
- Settings live in `localStorage['portSolace.*']` (gfx, fps, resH, lod, shadows, bright2, stars, view, sound; game state in `save`).
  Tiers (`TIER`, 03): `low` / Laptop (`high` + `AF.GFX.lite`) / `high` Balanced / `ultra` High.
- Title avatar turntable uses the main renderer (viewport + scissor); never add a second WebGLRenderer.
- Pointer lock persists across modes; Escape releases + pauses and never exits vehicles (E/F do).
- Streaming + boot preload are off in `?test/?shot/?near/?nostream`; harnesses measuring play wait for `__af.preloaded`.
- One module script only (the original export ran the game twice).
- `create_file` cannot overwrite; terminal tools may strip `cd` (use absolute paths). Playwright screenshot paths must be absolute.
