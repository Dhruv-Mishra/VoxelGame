# Port Solace — notes for agents

Single-page three.js (r160, CDN importmap) voxel city game. **Edit `src/` + `shell.html`, never `output*.html`.**
Read `PERF.md` before any change: it is the performance contract (locked items, budgets, harnesses).

## Build / run / deploy
- `node tools/build.mjs --check` — syntax-checks parts, concatenates `shell.html` + `src/*.js` (sorted) into `output.html`.
  `--min --out=output-min.html` = esbuild whitespace/syntax minify (identifiers kept: worker sources come from `Function.toString()`).
- `node tools/serve.mjs 8765` → http://127.0.0.1:8765/output.html. `?test` runs `AF.test` self-tests (title `passed/total`, ~35 s;
  only "boot under 30 s" may fail locally). Other flags: `?nostream ?nofade ?noupscale ?noworker ?mobile ?shot ?near=x,y,z`,
  `?join=CODE` (prefills the co-op code), `?signal=wss://…` (signaling override; also `localStorage['portSolace.signal']`).
  `serve.mjs` also serves dev signaling at `/signal/*` (same protocol as the Worker), so co-op works on localhost with no Worker.
- Deploy: rebuild both `output.html` and `output-min.html`, commit, `vercel --prod`. Vercel serves `/` → `output-min.html`
  (`vercel.json`; `.vercelignore` ships only the HTML, `assets/` and config).
- World map = baked images in `assets/` (`node tools/map-bake.mjs`, server running, `playwright` resolvable); re-bake after
  terrain / road / building edits.
- Sounds = `assets/sfx/*.mp3` + `CREDITS.txt`, built by `node tools/sfx-build.mjs [--list] [--only=a,b] [--force] [--reencode]` (Freesound CC0
  picks, Kenney packs, flite TTS for PA / radio lines; needs ffmpeg + flite; caches in `tools/tmp-sfx/`; `--reencode` rebuilds every
  file from the cached sources after an encoder / level change). Ids are wired in 75's `LIB`.
- Co-op signaling = Cloudflare Worker + Durable Object in `signal/` (`npx wrangler@4 deploy` from `signal/`). Its URL is `SIGNAL` in
  `79-net.js`; game origins must match `ALLOWED_ORIGINS` in `signal/wrangler.toml`. Optional TURN: `wrangler secret put
  TURN_KEY_ID` / `TURN_KEY_API_TOKEN`. The build stamps `'%%BUILD_HASH%%'`; hosts reject guests on another build.

## Architecture (global `AF`)
- Parts are plain scripts in one module, each wrapped in `try{}catch(e){AF.partError(...)}`; numeric prefix = load order.
  `AF` is `window.AF` (no local alias — worker sources reference it by name).
- Lifecycle: `AF.onBuild(name, order, fn)`, `AF.onTick(name, order, fn)`, `AF.onIdle`; streaming via `AF.stream.register`.
  Modes: `AF.modes[name]={enter,exit,update}`, `AF.setMode` (walk, aerial, drive, fly, jetski, photo, dead, carousel).
- Events: `AF.emit/on` (`toast`, `bubble`, `dialogue`, `ready`, `preloaded`, …). `AF.addInteract(obj)` keeps the same object.
- World: `AF.W` voxels at 0.25 m, x∈[-660,300) = the city. Outside it the outland (`AF.PLAN.world`, 4× the city): ground via
  `AF.outland.h(x,z)`. `AF.addBuilding/placeStatic/removeStatic/addLight/addLabel`, models `AF.Model` + `AF.meshModel`,
  colours `AF.col(hex,{metal,rough,emit})`. Layout lives in `05-plan.js` (`AF.PLAN`). Spawn positions need an explicit y.
- World clock (01, PERF.md §8c): tick hooks get `(dt, t)` with **t = W**, the shared world seconds (`AF.clock.w`, synced to the
  co-op host); `AF.clock.t` is the local monotonic clock for gameplay timers. Ambient life (time of day, lights, tram, ferries,
  boats, rides, planes, fireworks, crowd, residents, animals, traffic) must be a pure function of W and `AF.world.seed`
  (`AF.whash(a,b,c)`), never of `Math.random`, frame counts, the camera or `AF.clock.t`. Local reactions (talking, dodging, fleeing,
  pushes) are an offset or lag that eases back onto the schedule. Change the time of day only through `AF.time.set`.

## Parts map
- Engine: 00 prologue · 01 core/input/pointer lock · 01-stream (streaming engine, preload, travel veil, shader warm-up) ·
  02 voxels, region LOD, mesher workers · 03 renderer, tiers, LOD table, resolution · 04 `AF.Vehicle` base class ·
  60 atmosphere · 61 post (bloom, AO, grade, upscale) · 62 water · 63 sky.
- World: 05 plan · 07 outland height/colour + tile mesher (workers) · 10 terrain/coast · 11 streets · 12 nature ·
  13–43 districts · 44-farms/flora/island/sites/wayside · 44-key (Corsair Key: Silas's island east of Serena — airstrip, hangar,
  villa, jetty, lighthouse, a flyable Cub; built from Serena's cached kit; the heist's finale) · 45 friends colony (its road joins
  the highway, 49-roads) · 46 zoo (`ZOO.hours` 8–22, `AF.zoo.feed/feedAt/lure`) ·
  46-zoo-tree (Treetop Trail annex: Great Banyan, treehouse deck, boardwalk ramps, rope bridge, lookout — static voxels, no draws) ·
  46-zoo-visit (paw-print trails + arrows, fingerposts, trail board, ticket booth attendant, feeding stations, keepers on the
  feeding schedule, closing time, passport stamps in `AF.save.zoo`) · 47 airfield · 48 sea ·
  48-liner (SS Solace Queen off the Pleasure Pier: walkable hull model + colliders, Grand Casino, Gilded Room, purser's cage +
  vault doors `AF.liner.openVault/openStaff`, Starlight Lounge, sun deck, gangway, pontoon; `AF.liner.where/tables/spots`) ·
  49 outland quadtree · 49-roads.
- Actors: 50 vehicles · 51 traffic · 52 planes · 53 air traffic · 54 path walkers · 55 pedestrians · 56 animals ·
  56-wild outland fauna · 57 friends (cast, dialogue) · 58 pets (`AF.pets`: Paws & Claws store on Friends Lane, a following pet per
  friend in `AF.save.pets`; Hunar starts with Coco the toy poodle).
- Player/UI: 70 avatar + walk/aerial · 71 UI (title, minimal HUD, stacked toasts, menu, dialogue) · 72 touch ·
  73 mission kit (`AF.mission`: `blip/unblip` map + minimap blips with world markers (one instanced draw), `objective`, `bar`,
  `shard` big-message cards, `cut` cutscene player) · 74 map (`map.overlays`, `map.miniOverlays`) ·
  75 extras (photo mode `P`, Solace Stars collectibles) · 75-audio (`AF.audio`: samples, loops, zone ambience beds, footsteps,
  vehicles, PA; `play(id, {x,y,z})`, `hold(key, id, vol, rate, x, y, z)`) · 98 tests · 99 boot.
- Gameplay: 76 core (`AF.G` tuning, `AF.save`, money, health/death, `AF.shop` sheet, `AF.fx` particles, `AF.sfx`, `AF.hud`,
  forget policy) · 76-inventory (`AF.inv`: the bag on I / BAG — snacks, pet treats, `AF.inv.extra` rows lent by missions;
  `AF.save.inv`) · 77 combat (weapons, engaged peds, run-overs, police/wanted, autogyro, vehicle damage) · 78 jobs (jobs,
  counters, Body Works / Motor Exchange zones, carnival games, carousel, wardrobe, Westgate check-in) · 78-casino (`AF.casino`:
  slots, roulette, blackjack, craps, baccarat at the liner's tables) · 81 heist (`AF.heist`: "The Harbour Trust Job", a co-op
  story mission from Vera at the Blue Heron — plane, island, mob ambush, jet skis, casino lift, night bank stealth, getaway).
- Co-op: 79 net (`AF.net`: lobby, WebRTC links, reliable `send/on`, binary `fast/onFast`) · 80 coop (`AF.coop`: snapshots,
  remote avatars / vehicles / peds, `passenger` mode, hit forwarding, tags, lobby UI).

## Gameplay layer (76–78)
- Balance only in `AF.G` (prices, pay, damage, heat, star thresholds, forget distances). `AF.save` (money, guns, ammo, mags,
  outfits, a look per friend) is the only persisted game state; everything else is forgotten (runtime cars `car.temp` →
  `VV.forget` back to their kerb, engaged peds calm down past `G.pedForgetD`, wrecks after `G.wreckS`).
- Peds stay bare crowd instances until touched: `w.agg` (77 `engage`) makes 55's crowd tick call `AF.combat.stepPed`;
  `CB.release` returns them. Cops = 8 pooled walkers in the `cop` look; the mob = 8 pooled `goon` walkers (`CB.spawnGoon/goons/
  clearGoons`: hostile without a wanted level, no heat). Kids / wheelchair users only ever flee. The player starts with bare fists
  (weapon slot 0); a friend's signature melee and bought guns follow.
- Vehicles: `car.hp` → `car.dmg` (instanced `carDmg` attribute in the car paint shader); impacts arrive via `VV.onImpact`.
  The player always sits in the vehicle (`AF.Vehicle.seat`, `VV.seatLocal`). Camera distance is `AF.view` (C cycles
  first person / near / far) for walk, chase cams and planes — no wheel zoom.
- Jobs extend `class Job` (78): implement `plan()` → next stop `{x,z,r,wait,t,pay,label,done}` (null ends the shift).
  Counters: `counter(x,y,z,label,open)` + `AF.shop.open({title,sub,tabs,items(tab)})`; drive-in zones via `zone()`.
- Keys: Q / click attack, Z / right mouse aim, wheel / 1–5 / X weapon (hold X = weapon wheel), R reload, C camera, J job. Touch (72):
  stick to the rim runs; one context cluster bottom-right (big primary + ≤ 3 secondaries chosen per mode / weapon, `AF.touchUI`) +
  CAM / JOB utilities; WPN tap = next weapon, hold = the wheel (`AF.combat.wheelOpen/wheelAim/wheelClose`).
- Path walkers (54: airport, outland, island, liner, heist guards) react via `AF.walkers.near/knock/stagger/scare/isDown` (77 bumps,
  hits, run-overs, panic); `CB.onWalkerHit(a, kind)` returning true swallows a hit (the heist's takedowns).
- Missions (81): steps with checkpoints; `AF.respawnAt()` (76) lets a mission wake a knocked-out player at its checkpoint.
  The heist is host-authoritative (`heist` net ops; guests send `done`/`fail`/`retry`); it needs a crew of two to start but every
  step has a solo way through if a partner drops. `node tools/coop-heist.js` (server running, playwright resolvable, optional
  `CHROME=`) plays it end to end with two real clients: lockstep, the two-key step, fail → shared checkpoint, retry, payout.
  Modal overlays (`AF.shop`, the casino panel `UI.state.casino`) count in `UI.modalOpen()`; Escape closes them.

## Co-op (79–80)
- Star around the host (slot 0, guests 1–3) over WebRTC; the Worker only brokers the join. The host relays and stamps `from`;
  network messages can never fire local-only events (`INTERNAL` in 79). Register every reliable type with `N.on` and validate fields.
- Ownership: each client simulates its avatar, the vehicle it drives, the peds / police it engaged and its autogyro, and sends them
  in one binary snapshot (`C.build` / `C.ingest`; 20 Hz busy, half on foot, 2 Hz standing still). The ambient world is never
  sent: the guest adopts the host's seed + epoch on welcome and derives it. Traffic is the one simulation with history: the guest
  loads the host's fleet (`VV.trafficSave/Load`) on joining and again if the checksum riding on the host's pongs ever differs.
- Remote things: `car.net = slot` (drive `can()` refuses them), 16 pooled `w.net` walkers in 55, `AF.avatar.build` per remote player.
  Hits on something another player owns are forwarded to its owner (`CB.onNetPed/onNetCar/hurtPeer`); `CB.pvp` = friendly fire.
- Vehicles are matched by `v.netKey` (name + spawn cell, 04). Seated players and ride riders are placed from the receiver's own copy
  of the vehicle / ride (`anchorOf`), never their world pose. `passenger` mode = riding in another player's vehicle (F gets out).

## Rules of thumb
- Settings live in `localStorage['portSolace.*']` (gfx, fps, resH, lod, shadows, bright2, stars, view, sound; game state in `save`).
  Tiers (`TIER`, 03): `low` / Laptop (`high` + `AF.GFX.lite`) / `high` Balanced / `ultra` High.
- Title avatar turntable uses the main renderer (viewport + scissor); never add a second WebGLRenderer.
- Pointer lock persists across modes; Escape releases + pauses and never exits vehicles (E/F do).
- Streaming + boot preload are off in `?test/?shot/?near/?nostream`; harnesses measuring play wait for `__af.preloaded`.
- No shader program may link during play (PERF.md §3b): graphics changes that swap programs go through `AF.stream.regfx(apply)`,
  late objects through `AF.stream.compileAhead(obj)` (both light-pool variants) while hidden. `tools/hitch-probe.js` +
  `tools/play-scenario.js` list every runtime link with its stack, and every long frame with its cause.
- World matrices update once per frame for visible subtrees only (03 `updWorld`); a hidden object whose `matrixWorld` is read
  sets `userData.liveMatrix = true` (or call `updateWorldMatrix` yourself).
- One module script only (the original export ran the game twice).
- `create_file` cannot overwrite; terminal tools may strip `cd` (use absolute paths). Playwright screenshot paths must be absolute.
