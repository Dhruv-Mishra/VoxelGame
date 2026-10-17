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
- Heist voices = `assets/vo/<id>.mp3` + `index.json`, every line of `AF.VO` (`src/81-heist-lines.js`) spoken by Kokoro TTS:
  `node tools/vo-build.mjs [--list] [--only=a,b] [--force] [--reencode]` (needs python `pip install kokoro-onnx soundfile` + ffmpeg;
  model + raw WAVs cached in `tools/tmp-vo/`; only changed lines re-render). Music = `assets/music/<id>.mp3` + `CREDITS.txt`
  (Kevin MacLeod, CC BY 4.0 — keep the credit), `node tools/music-build.mjs [--only=a,b] [--force]` (cache `tools/tmp-music/`).
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
  04-camfx (`AF.camfx`: `shake(amp, s, freq)`, `rumble(key, amp, freq)`, `fov(deg)`, `wind(k)` DOM speed overlay; applied after the
  camera owners, undone next frame; `portSolace.shake` / menu "Camera shake") ·
  60 atmosphere · 61 post (bloom, AO, grade, upscale) · 62 water · 63 sky.
- World: 05 plan · 07 outland height/colour + tile mesher (workers) · 10 terrain/coast · 11 streets · 12 nature ·
  13–43 districts · 44-farms/flora/island/sites/wayside · 44-key (Corsair Key: Silas's island east of Serena — airstrip, hangar,
  villa, jetty, lighthouse, a flyable Cub; built from Serena's cached kit; the heist's finale) · 45 friends colony (its road joins
  the highway, 49-roads) · 46 zoo (`ZOO.hours` 8–22, `AF.zoo.feed/feedAt/lure`) ·
  46-zoo-tree (Treetop Trail annex: Great Banyan, treehouse deck, boardwalk ramps, rope bridge, lookout — static voxels, no draws) ·
  46-zoo-den (`AF.den`: Lion House night den + keepers' yard at Pride Rock's SE corner, and below it a 1941 bunker, a brick storm
  drain under the east walk, the Kestrel Systems fibre junction (server room) and a stair up to Westgate Road; underground rooms
  are carved by sinking heightmap columns and refilling them with soil voxels (`sink`); heist-only lions (5 instanced draws,
  `setActive`), `spots` for the heist) ·
  46-zoo-visit (paw-print trails + arrows, fingerposts, trail board, ticket booth attendant, feeding stations, keepers on the
  feeding schedule, closing time, passport stamps in `AF.save.zoo`) · 47 airfield · 48 sea ·
  48-liner (SS Solace Queen anchored at (-225, 1450), 190 m: walkable hull model + colliders; deck 1 grand atrium, double-height
  casino hall + gallery, purser's cage + vault + Silas's office (`AF.liner.openVault/openStaff`), crew corridor / pantry / crew lounge /
  crew stairs; deck 3 promenade, Palm Court, Starlight Lounge; deck 4 sun deck + High Rollers' Salon; boarding pontoon; the shore
  launch `AF.liner.tender` from the Pleasure Pier head, mode `tender`; `AF.liner.where/room/tables/spots`) ·
  49 outland quadtree · 49-roads.
- Actors: 50 vehicles · 51 traffic · 52 planes · 53 air traffic · 54 path walkers · 55 pedestrians · 56 animals ·
  56-wild outland fauna · 57 friends (cast, dialogue) · 58 pets (`AF.pets`: Paws & Claws store on Friends Lane, a following pet per
  friend in `AF.save.pets`; Hunar starts with Coco the toy poodle).
- Player/UI: 70 avatar + walk/aerial (walk swims in water > 1.25 m deep — `AF.player.swimming`, surface `AF.PL.waterAt(x, z)`;
  Space climbs / mantles a ledge ≤ 1.6 m (≤ 1.9 m out of the water) — `AF.player.climbing`) · 71 UI (title, minimal HUD, stacked toasts, menu, dialogue) · 72 touch ·
  73 mission kit (`AF.mission`: `blip/unblip` map + minimap blips with world markers (one instanced draw), `objective`, `bar`,
  `shard` big-message cards, `cut` cutscene player) · 74 map (`map.overlays`, `map.miniOverlays`) ·
  75 extras (photo mode `P`, Solace Stars collectibles) · 75-audio (`AF.audio`: samples, loops, zone ambience beds, footsteps,
  vehicles, PA; `play(id, {x,y,z})`, `hold(key, id, vol, rate, x, y, z)`; heist lines `voice(id, {x,y,z,radio}) → s`, `voiceLen`,
  `voicePreload`, `stopVoice`; `music(id | null, {fade, vol})`) · 98 tests · 99 boot.
- Gameplay: 76 core (`AF.G` tuning, `AF.save`, money, health/death, `AF.shop` sheet, `AF.fx` particles, `AF.sfx`, `AF.hud`,
  forget policy) · 76-inventory (`AF.inv`: the bag on I / BAG — snacks, pet treats, `AF.inv.extra` rows lent by missions;
  `AF.save.inv`) · 76-minigame (`AF.minigame.play(kind, opts) → Promise<{ ok, cancelled, … }>`: lockpick, circuit, flow, signal,
  drill, deal, stamp, keypad — a DOM + Canvas2D overlay counted in `AF.ui.modalOpen()`, Esc cancels; `?mg=<kind>` opens one) ·
  77 combat (weapons + gunplay: spread / recoil / tracers `CB.tracer` / headshots / hit markers, mission lending
  `CB.lend/unlend/has`, `'gunshot'` events, engaged peds + goon AI, run-overs, police/wanted, autogyro, vehicle damage) · 78 jobs (jobs,
  counters, Body Works / Motor Exchange zones, carnival games, carousel, wardrobe, Westgate check-in) · 78-casino (`AF.casino`:
  slots, roulette, blackjack, craps, baccarat at the liner's tables) · 81 heist (`AF.heist`: "The Harbour Trust Job", a co-op
  story mission from Vera at the Blue Heron — plane, island, mob ambush, jet skis, casino lift, night bank stealth, getaway).
- Co-op: 79 net (`AF.net`: lobby, WebRTC links, reliable `send/on`, binary `fast/onFast`) · 80 coop (`AF.coop`: snapshots,
  remote avatars / vehicles / peds, `passenger` mode, hit forwarding, tags, lobby UI).

## Gameplay layer (76–78)
- Balance only in `AF.G` (prices, pay, damage, heat, star thresholds, forget distances). `AF.save` (money, guns, ammo, mags,
  outfits, a look per friend) is the only persisted game state; everything else is forgotten (runtime cars `car.temp` →
  `VV.forget` back to their kerb, engaged peds calm down past `G.pedForgetD`, wrecks after `G.wreckS`). The stale sweep
  `AF.forget` (76) returns / drops whatever a player touched and left for `G.staleS` (300 s; cars, wrecks, cars out of traffic, boot
  cars, planes, jet skis, rowing boats), never within `G.staleNearD` of the camera, never `.net` / `.keep` / `.mission`, only wrecks
  mid-heist; `AF.forget.touch(obj)` stamps a use, `AF.forget.register(name, { list, busy, away, home, reset })` adds a system.
- Peds stay bare crowd instances until touched: `w.agg` (77 `engage`) makes 55's crowd tick call `AF.combat.stepPed`;
  `CB.release` returns them. Cops = 8 pooled walkers in the `cop` look; the mob = 8 pooled `goon` walkers (`CB.spawnGoon/goons/
  clearGoons`: hostile without a wanted level, no heat). Kids / wheelchair users only ever flee. The player starts with bare fists
  (weapon slot 0); a friend's signature melee and bought guns follow.
- Vehicles: `car.hp` → `car.dmg` (instanced `carDmg` attribute in the car paint shader); impacts arrive via `VV.onImpact`.
  The player always sits in the vehicle (`AF.Vehicle.seat`, `VV.seatLocal`). Camera distance is `AF.view` (V cycles
  first person / near / far) for walk, chase cams and planes — no wheel zoom.
- Jobs extend `class Job` (78): implement `plan()` → next stop `{x,z,r,wait,t,pay,label,done}` (null ends the shift).
  Counters: `counter(x,y,z,label,open)` + `AF.shop.open({title,sub,tabs,items(tab)})`; drive-in zones via `zone()`.
- Keys: Q / click attack, Z / right mouse aim, wheel / 1–5 / X weapon (hold X = weapon wheel; the weapon HUD's ▸ = next), R reload,
  C crouch (`AF.player.crouch/noise/eyeH`), V camera, J job, H horn (driving), F1 / ? controls sheet, P photo, M map, I bag.
  Drive-by: seated (drive, jetski, passenger, tender) the same aim / fire / switch / reload keys shoot from the seat (77 `fireSeat`,
  same gunfire path; passengers + jet-ski riders aim all round, a driver front + sides; aiming holds the look as the vehicle turns; own vehicle + crewmates aboard never hit); state
  `AF.combat.vfire` {on, aim, firing, arc, veh, driver, seat, t, shots, dir}, local 'gunshot' events carry `veh`; touch adds FIRE / AIM.
  Escape does ONE thing per press (71 `escape`): close the topmost open thing (minigame, casino, shop, bag, map, controls, menu,
  dialogue, weapon wheel, photo mode, an unlocked CCTV feed, or a `UI.onEscape(fn → true)` hook), else open the pause menu; a
  keydown + pointer unlock from the same press count once. Never bind a new key that an existing mode already uses. Touch (72):
  stick to the rim runs; one context cluster bottom-right (big primary + ≤ 3 secondaries chosen per mode / weapon, `AF.touchUI`) +
  CAM / JOB / BAG utilities; CROUCH in the cluster; weapons from the HUD chip (tap ▸ = next, hold = the wheel, `AF.combat.wheelOpen/wheelAim/wheelClose`).
- Path walkers (54: airport, outland, island, liner, heist guards) react via `AF.walkers.near/knock/stagger/scare/isDown` (77 bumps,
  hits, run-overs, panic); `CB.onWalkerHit(a, kind, fx, fz, { head, dmg, silenced, weapon })` returning true swallows a hit (the heist's takedowns).
- Missions (81): steps with checkpoints; `AF.respawnAt()` (76) lets a mission wake a knocked-out player at its checkpoint.
  The heist is host-authoritative (`heist` net ops; guests send `done`/`fail`/`retry`); it needs a crew of two to start but every
  step has a solo way through if a partner drops. No teleports mid-heist: `AF.noTravel()` makes map travel, go-to-friend and skip-crossing
  refuse; only cutscenes and checkpoint retries move the crew. `AF.quiet` (heist on) binds 60 % of the crowd. `node tools/coop-heist.js` (server running, playwright resolvable, optional
  `CHROME=`) plays it end to end with two real clients: lockstep, the two-key step, fail → shared checkpoint, retry, payout.
  Crew of 2–4: per-player tasks (`H.mg`: a padlock each on Kovac's grille, a uniform each off the rail, a licence each from Ezra; the
  shared fact lands when every crew slot is done, `mg` op) — the arms cache (one cracker, `crack`/`crackp`) and the night's roles are the
  exceptions. Act II: the stash maze (44-island fills chamber B with a 4 m-grid maze + rock; `AF.island.heist.nav/maze/racks/waveSpawns/holds`;
  the player is in first person inside the tube; the cache / racks answer only with a clear line to their front),
  cracking starts a siege (waves of reserve guards, `S.spawn`, sized by crew; in combat only `zone.hunters` (2) close in, the rest wait at
  `zone.holds` past the maze's way out), then a jet-ski chase (`chase` step, 1 + 2 per player, riders need line of sight + miss fast / off-screen targets, host-steered riders =
  'heist chase riders' path walkers with `actor.chase`, hulls in `AF.island.jetski.extra`; `ch`/`chit`/`chshot` ops). Act III: crews of
  3–4 take ship's-security uniforms (`sec0..5`) and distract the detective / pit boss (`hold`). Conditional radio lines:
  `radio(id, urgent, when)` re-checks `when()` at play time.
  Stealth (80-stealth): every guard is killable (armed 240 hp); one hit only from behind (melee or a headshot on a guard not yet fighting);
  guards steered off their path stay hittable (54 `WK.near` tests `ctl` actors outside the path bounds); `zone.strict` (the liner): a
  weapon in hand or a carried body seen = instant alarm, any witnessed violence = alarm (`S.witness`); bodies are carried / hidden with
  E (`zone.hides`, `carry`/`cpos` ops); `S.requestAlarm` routes a mission's alarm through the zone authority.
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
  of the vehicle / ride (`anchorOf`), never their world pose. `passenger` mode = riding in another player's vehicle (E/F gets out,
  beside your own seat; off a jet ski anywhere, into the water if no beach is near). Seats are indexed (`AF.coop.seats/freeSeat/seatOf/
  riders`): cars / vans / trucks / the bus 4 (driver, front, rear left, rear right), motorbikes / sidecar / jet skis 2, planes 4
  (unseen); the snapshot carries the seat, a reliable `seat {h, s}` claims it (s 0 = left) and the driver's client answers a taken
  one with `seatno {h, s, alt}` (another free seat, or -1 = full → out).

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
