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
  ≤ 60 % of an interval, max 10 ms desktop / 6 ms phone). Auto-tier compares against the cap interval.
- Sun shadows refresh on a time cadence (≈30 Hz High/Balanced, ≈15 Hz lower) but every frame while the subject moves.
  Shadows setting Off/Low/High (`AF.gfx.setShadows`, `portSolace.shadows`); Low = near map only, 4-tap compare; phones default Off.
- Simulation uses `dt` (≤ 0.1 s); nothing assumes 60 Hz.

## 3. Renderer (locked)
- **Resolution / upscaling**: the scene renders at `AF.renderPR()` (= `basePR`: the menu target height, default 720p, 480p on
  phones, `portSolace.resH`) and stays there. There is **no dynamic resolution** (removed: every scale step reallocated the
  render targets and invalidated cached passes, which cost more than it saved, worst on iOS); auto-tier may still change the tier
  once on a sustained miss. Phone resizes (Safari toolbar) are debounced 180 ms. When the post chain runs, the canvas stays at `AF.outputPR()` (display res,
  ≤ 2×) and the final `UPSCALE` pass (61-post) does Catmull-Rom 9-tap upsampling + contrast-adaptive sharpening; `?noupscale` /
  `?shot` turn it off. Change resolution only through `AF.applyPR()`. Point sprites size by `renderPR`.
- **Phones** (`AF.MOBILE`) skip the post chain but not the upscaler (`AF.post.lite`): the scene renders into an MSAA RGBA8 target
  flagged `isXRRenderTarget` (three r160 then applies tone mapping + sRGB in the materials, the same programs as the screen) and one
  `UPSCALE` pass draws it to a canvas of ≤ 2× the render height (single-pass upscale + sharpen, the Snapdragon GSR 1 / FSR 1 idea
  without textureGather). Any error falls back to direct rendering. With the upscaler on, the canvas itself is created without
  MSAA (the MSAA target already resolves the scene; a second multisampled 2× canvas was pure bandwidth).
- **Lean phone shader** (`AF_LEAN`, 02-voxel, `AF.MOBILE` unless `?fullshader`): the voxel program drops the procedural surface
  patterns, fake-room windows, the far shadow cascade and cloud shadows at compile time; point lights skip the GGX term beyond
  their range everywhere. iOS (ANGLE-on-Metal) compiles and links slowly and every GL call is an IPC hop to the GPU process, so
  `checkShaderErrors` is off on iOS outside `?test`, and fewer/leaner programs matter more than raw ALU.
- Instanced voxel meshes use `AF.mat.voxelInst` / `voxelInstC` + `AF.mat.depthInst` (sharing `AF.mat.voxel` made three
  re-derive programs ~75× per pass). `inst-ranges` uploads only `[0, count)` of instanced buffers.
- Dynamic near plane (`cam-near`): 0.1 m on foot/driving, up to 6 m when high. Never hard-code `camera.near`.
- No coplanar opaque surfaces (lift ≥ 0.02 m or `polygonOffset`). Position-keyed shader hashes sample a few cm behind the face.
- Post chain: bloom + AO (tier-gated) + grade + upscale. No tilt-shift/DOF (removed). Phones use the lite path above.
- **World matrices** (03 `updWorld`): `scene.matrixWorldAutoUpdate` is off; the frame updates world matrices once, before it
  renders, for visible subtrees only (three's own pass recomposed every hidden pool, template and far avatar on every render:
  ~4 700 objects, ~1 ms desktop / ~4 ms laptop). A hidden subtree whose parent moved is marked stale and catches up the frame it is
  shown. Code that reads `matrixWorld` of a hidden object sets `userData.liveMatrix` (13-park pose batches) or calls
  `updateWorldMatrix` itself; direct `obj.updateMatrixWorld()` calls keep three's semantics.
- **World-matrix dirty check** (03 `updWorld`, `AF.perfStats`): an auto-matrix object whose position / quaternion / scale did not
  change since the last frame keeps its matrix, and its subtree is left alone unless the parent moved. ~600 of ~2 900 visited
  objects recompose per frame instead of all of them (−30 % pass time, more on a throttled CPU). Never write `obj.matrix` by hand
  on an object with `matrixAutoUpdate` on (set it off, as three expects). `AF.perfStats.skip = false` turns the check off to compare.
- **No per-frame garbage** (heap-sampled with `tools/play-perf.js` + a CDP sampling profile): `Math.hypot` is replaced in
  00-prologue by an allocation-free 1–3-argument version (V8's builtin copied its arguments into a new array on every call);
  `Map` loops in ticks use `keys()` / `values()`, never `for (const [k, v] of map)`; the walk-mode interact scan runs at 15 Hz
  (and at once on E / F); far animals skip their per-frame field writes. The region streamer's terrain mesher writes quads through
  `GeoBuf.quadS` with scratch corners and the chunk pads copy rows element by element (array literals per quad, a closure per side
  run and a subarray view per pad row were ~50 MB/s of garbage while walking; total 85 → 30 MB/s, `tools/garbage-probe.js`: a sampling heap profile incl. collected objects while walking / driving).

## 3b. No freezes in play (locked)
Measured with `tools/hitch-probe.js` + `tools/play-scenario.js` (title, run, steal + drive, guns, 4-star chase, map, bag, night,
travel to the liner and the hills; optionally under 4x CPU throttle). Rules:
- **No shader program links during play.** Every link stalls the frame (100-300 ms on ANGLE / D3D11 even on a fast GPU, seconds on
  laptops). The boot preload and every travel compile with `compileAsync` while `AF.stream.hold` stops rendering (a frame drawn
  mid-link would block on every unfinished program). Objects that appear later go through `AF.stream.compileAhead(obj)`, which
  compiles both light-pool variants, and stay hidden until it resolves.
- **Graphics changes that swap programs** (tier, shadows; menu or auto-tier) run through `AF.stream.regfx(apply)`: veil, apply,
  parallel compile, reveal. Auto-tier never fires during a travel.
- **First draws** (01-stream `ST.firstDraws`): a linked program is not finished on ANGLE / D3D11 (Chrome / Edge on Windows). Its
  first draw with unnormalized integer vertex formats (the voxel `aPal` Uint16 / `aAN` Uint8 / `aBU` Int16) compiles a vertex-input
  variant in the GPU process (15-25 ms each, `tools/d3d-variant.js`), a first point-sprite draw a geometry-shader variant,
  and three's first-use program-log query (`getProgramInfoLog`, synchronous) waits for all of them: these were the 100-460 ms
  frames at the first title cuts, at start, after travels and at the first shot. Every compile (`ST.warm`, `compileAhead`) also
  collects each new (program, vertex layout) and draws it once with a degenerate 3-vertex proxy on layer 31, alone, with the lights
  on that layer meanwhile (same light state = same program), both night-pool variants, after every ready program passed its first
  use. Behind a veil all at once; in play one (entry, light variant) a frame, paced by a GPU fence (never a synchronous wait);
  `compileAhead` resolves once drawn. The boot loader stays up until the `preloaded` listeners' first draws are done
  (`ST.drainFirstDraws`), and a veil only lifts once the GPU finished the proxies (`ST.gpuIdle`: a polled fence; lifted early, the
  first visible frame waited 100-140 ms on the variant compiles). Compile-ahead stand-ins must carry the real vertex formats (02 `FADE.warmGeo`). Proxies never link a
  program (`ST.firstDraws.newProgs` stays 0). The post chain's god-ray quads compile with the warm (`AF.post.warmJobs`).
- **Env reflections** (03 `env-refresh`, every ~20 s with the sky): the PMREM writes into two cube-UV targets used in turn (no
  allocation), and a persistent `pmrem-keep` mesh in the env scene keeps three r160's per-call background-box program cached (it
  relinked on every refresh before).
- **Teleports / first visits** stay cheap: `O.hB` answers a cold 16 m tile with the single exact sample and fills the tile (1 024
  heights) only after 6 misses (LRU 2 048 tiles desktop / 1 024 phones); outland quadtree nodes cache the ground under their
  nearest point (camera + look-ahead); LRU eviction is one sorted pass; wild herds wake at most 4 a frame; one-time scans
  (audio waterfalls) run at `preloaded`. After a teleport the first 6 frames cost ~20 ms total (was 120-300 ms).
- Per-frame code allocates nothing (8.3); periodic selections (chimney smoke, light pool) use fixed top-K arrays.

## 4. LOD transitions (locked)
- Every LOD swap of voxel-material meshes is a dithered 0.3 s cross-fade (`AF.world.fade`, `fadeIn`/`fadeOut` variants).
  Never write `.visible` on such meshes while `owner.fadeE` is set — use `FADE.swap`. During `AF.stream.loading` swaps are instant.
- Fade programs are precompiled (`AF.world.fade.warm()`, via `AF.stream.compileAhead`, both light-pool variants) so the first swap
  never hitches, by day or by night.
- View-aware thresholds (02 `prop-lod`: `viewAim` / `inView` / `leadAt`): on-screen regions, props and clusters keep their detail
  a band longer (×1.25 regions + props, ×1.15 clusters / prop cull) and, with the camera moving, upgrade 1.5 s of travel (≤ 90 m)
  earlier ahead; out of view the plain distances apply. Driving the length of Grand Avenue at 25 m/s: in-view swaps under 120 m
  went 82 → 1, median in-view swap distance 112 → 150 m.

## 5. Streaming (locked) — one engine, `01-stream.js`
- Post-boot content registers once: `AF.stream.register(name, { work(ms), near(), gen, order })`. `gen: true` = one-time
  generation the boot preload finishes. Never a bare `AF.onIdle` for content.
- One LOD table: `TIER` in 03-render → `AF.LOD` (× view distance `AF.lodScale`). Systems load `AF.LOD.prefetch` (1.3) × their
  display range, so every LOD change fades in something already resident. Shared look-ahead `AF.stream.ahead` (2.5 s, ≤ 400 m).
- Boot preload (`AF.stream.preload`, not in `?test`): gen systems, opening view, then `AF.stream.warm()` compiles every program
  with `compileAsync` (parallel link) against the post scene target. While `AF.stream.settling`, the renderer draws only every
  6th frame behind the veil. `AF.preloaded` / `preloaded` event mark the end.
- Travel: `AF.stream.travel({ label, go })` — veil, move, pump all systems until `near()` is empty, warm, reveal. The title
  cinematic sets `AF.stream.focus` on the next shot 4.5 s before each cut, so cuts never land on unbuilt, never-drawn meshes.
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
- Traffic (`51`): lane graph; every AI car steps at a fixed 15 Hz on the world clock wherever the viewer is (co-op clients must
  agree; ~0.3 ms/frame for the fleet), drawn interpolated. Turns are seeded per car (`AF.whash`), obstacles are only what every
  client sees (players, cars a player drove). A stall is caught up ≤ 12 steps a frame, never dropped.
  `AF.vehicles.addRoute`, `placeParked` (merged static until used). Vehicles at `SPEED_K` 0.82.
- Walkers (`54`): `AF.walkers.addPath` — every path pedestrian shares 4 instanced draws (512 cap), limbs 5 Hz beyond 60 m.
  Reactions (shoved / knocked flat / scared) are per-actor state on the same instances; only touched actors run `react`.
- Air traffic (`53`): 7 instanced batches with per-instance livery; busy timetable only within 900 m.
- Park actors, zoo far LOD (merged per species, dithered), island jet skis: shared instanced/merged meshes. A ridden (or remote) ski's
  spray reuses the 2 AF.fx Points draws (rooster tail + carve fans, ≤ ~250 live points), its wake + hull foam come from the water
  shader through an invisible, never-drawn hull proxy (`AF.water2.addBoat`); camera feel (`AF.camfx`) is a quaternion / fov nudge
  and a DOM overlay — no programs, no draws.
- All ticks together cost 1.7–3.2 ms anywhere (`tools/tick-survey.js`). Keep new simulations distance/view gated.
- Crowd (`55`): 70 / 140 / 170 ambient walkers (low / Balanced / High). Fights, cops, run-overs only step peds the player engaged
  (`w.agg`, ≤ `G.engagedMax` + 8 cops), drawn through the same instanced frames (lying = a rotated instance, no new geometry).
- Gameplay (`76–78`): FX = 2 Points draws (glow additive, smoke dithered opaque), hidden while empty (programs compiled at
  `preloaded`); job marker (2 draws), autogyro (2) and squad cars exist only while in use; police / run-over checks at 15 Hz within
  60 m, the wanted scan skipped while nobody is on duty. A driver seated in a closed car casts no shadow.
- The liner (`48`, anchored 1.2 km offshore): one hull mesh (hull, outboard stages and every sign merged; + its glass, ~72 k tris) and
  one InstancedMesh per furniture kind (1/8 m, 20 kinds), the furniture drawn only within 120 m of the hull; the two shore launches +
  Silas's launch are one 3-instance InstancedMesh (on the world clock). ~29 draws / ~150 k tris aboard (the city is out of view, so
  a pose aboard is ~170 draws / 0.45 M tris in all); its ~90 passengers, dealers, dancers, crew and launch pilots are path walkers
  (shared draws; 44-sites' test keeps every path walker within capacity - 160). The heist (`81`) shows each scene's people and props only while that scene is on (doors, gate,
  key boxes, cage, bags, 7 laser beams and 9 camera housings in the bank, drawn within 70 m at night); every guard is a path walker
  (shared draws), the mob reuses 55's pooled `goon` walkers. Stealth (`80-stealth`) senses at 15 Hz, only in the active zone,
  only within its radius, and only on the zone's authority client; alert markers are pooled DOM. While a heist is on `AF.quiet`
  binds 60 % of the ambient crowd (55), so a busy story frame costs no more than free roam. The stash maze and its rock fill are two
  outland props (merged into the tile meshes: no draws of their own) + merged colliders; siege reinforcements are 12 reserve path walkers
  (off stage until spawned), the ship's 6 officers and the 8 chase riders are path walkers too, and the chasers' hulls ride in the
  island's jet-ski InstancedMesh (20 instances) — the whole Act II / III expansion adds no draws.
  The Act IV armoured-car job (Southfield Farm) adds 6 farm guards (path walkers, shared draws), one crate mesh (1 draw, farm scene
  only), the armoured car (`armored` vehicle type: its own instanced car batch, 1–3 draws while one exists) and 2–4 chaser limousines
  (the existing `wagon` batch). Launchers fire up to 8 pooled rocket meshes kept in the strike-jet group (compiled with it at
  `preloaded`, hidden while idle); mission jets reuse the same 4 pooled jet meshes. Nothing new runs while the job is off.
  The midnight expansion adds no draws of its own: the bank's sky deck + stair tower and the City Hall ladder are world voxels (one
  existing ladder mesh moved), the roof watch (7) and the zoo's Kestrel guards (7) are path walkers on the shared draws, enabled only
  while their scene is on (`HB.roof`, `HS.show`); one zoo camera housing (1 draw within 70 m, the bank's camera geometry). Dry Creek
  Depot (44-hideout) and Serena's secret passage (44-island / 07 second tube) merge into the outland tiles; Vera's car is one runtime
  car on the existing batch. Kit and Vera move by writing NPC poses (no new objects).
- Audio (`75`): one AudioContext; samples (`assets/sfx`, mono MP3: one-shots 32 kHz / 48 kbps, loops + beds 24 kHz / 40 kbps,
  voice 16 kHz / 24 kbps; ~2.3 MB for 167 files) decode on first use, the core set at unlock; ≤ 32 voices (20 on phones); loops
  fade by distance and are reaped after 120 s unused; the context suspends while the page is hidden. Ambience beds are weighted by
  zone in a 4 Hz tick and each weight eases (~1.3 s) so zones crossfade; one master compressor glues the mix. Per frame only the
  player's own vehicle / wind / footsteps; nearby cars, sirens, flights at 15 Hz; water + farm machines + tram at 4 Hz. Nothing
  allocates per frame.
- Heist voices + music (`75`, block "spoken lines + heist music"): lines = `assets/vo/<id>.mp3` (`tools/vo-build.mjs`;
  mono 24 kHz / 32 kbps CBR, -16 LUFS, silence-trimmed; ~4 KB a second) + `assets/vo/index.json` (durations, fetched at unlock).
  Decoded on demand, ≤ 32 cached (16 phones), reaped after 90 s unused; they share the ≤ 32 voice cap at high priority; one radio and
  one plain line at a time, ≤ 3 positional barks. Music = `assets/music/<id>.mp3` (`tools/music-build.mjs`; mono 32 kHz / 48 kbps,
  -22 LUFS, 60–96 s loops, ~4.5 MB for 9) fetched only when first asked for; ≤ 2 tracks stay decoded (~18 MB each at 48 kHz). Speech
  ducks music (×0.4) and the ambience bus (×0.67) from a 15 Hz tick; nothing new per frame.
  New dialogue uses Fish Audio Drama 3 through its web UI: `--fish-export [--only=id,id] [--fish-export-dir=folder]`, save the
  matching downloads beside the exported manifest, then `--fish-import=folder`. The runtime manifest hashes the script and voice
  direction; stale recordings never play against rewritten subtitles. Keep downloaded originals unchanged; WAV originals can
  additionally become lossless FLAC masters. MP3 downloads are already lossy and must never be described as lossless masters.
  Radio speech shares filtered speech/noise processing in the existing AudioContext; retain the same voice/cache limits.
  Revalidate the small audio manifests at unlock; voice URLs use the imported file hash so CDN/browser caches cannot replay old takes.

## 8. Content rules (locked)
1. Static → voxels (`W.fill`) or `AF.placeStatic`; outland → `AF.outland.addProp`.
2. Movers → shared InstancedMeshes, never one mesh per body part.
3. No `new THREE.*`, array literals or closures in per-frame code.
4. Lights only via `AF.addLight` (pooled, tier-capped); lamps are emissive voxels.
5. No new transparent materials except glass/water; a double-sided transparent material needs `forceSinglePass: true` (three r160
   otherwise draws it twice and re-derives its program every frame). 6. `castShadow` only for > 1 m objects near the player.
7. No sphere/cylinder > 12 segments for things < 2 m. 8. Map images are baked (`tools/map-bake.mjs`); re-bake after world edits.
9. Memory: iOS dies near 1.5 GB — check `AF.memStats()`. Runtime objects must have a forget path (76 forget policy + the `AF.forget` stale sweep, `AF.avatar.release`).

## 8b. Co-op network (locked) — `79-net`, `80-coop`
- One binary snapshot per client on the unordered, no-retransmit `fast` channel, rate by activity: `N.rate` (20 Hz, 15 on phones)
  while driving, flying, fighting, aiming or falling, half on foot, 2 Hz standing still (each held 0.3 s after it ends). Header 8 B,
  player 26 B + 11 B of joints only while they change (and 3 snapshots after, and every 8th), positions as 3-byte centimetres,
  4 B of counts, 25 B per vehicle (driven + squad cars within 400 m), 11 B per engaged ped within 150 m (only while a peer is within 320 m), shots.
  Standing ≈ 80 B/s, walking ≈ 0.5 KB/s per direction per peer. Players > 250 m apart get 1/2 rate, > 500 m 1/4. The host bundles
  what it sends each guest (its snapshot + the newest relay per origin, ≤ 35 ms wait) into one datagram (type 2). A link skips
  `fast` sends while `bufferedAmount` > 32 KB. Reliable JSON (`rel`) is for rare events only (hits, seats, looks, time changes,
  traffic resync); pings every 4 s (2 s in a link's first 15 s); 120 msgs/s per link cap.
- Receivers: time-ordered buffer per thing, render delay = clamp(1.3·interval + 2·jitter + 8, 60, 320) ms (interval samples capped
  at 160 ms so an idle sender's 2 Hz doesn't inflate it), extrapolate ≤ 250 ms then hold; stale / duplicate samples are dropped.
  `C.build` / `C.ingest` reuse one writer and scratch arrays (no per-frame garbage).
- Remote players: ≤ 3 avatars (`AF.avatar.build`), hidden beyond 500 m; remote peds reuse 55's 16 `net` walkers (same instanced draws);
  remote cars are the local copies (or one runtime car each). Co-op adds no draws and no tick work while offline.
  Mission guards remain host-authoritative, including when viewed through CCTV. Reliable guard rows retain their existing
  12-field shape, encode alive/unconscious/dead separately, and skip unchanged rows. Ordinary ticks never revive a corpse;
  intentional spawning uses the lifecycle helpers. Expired reserve corpses are cleaned up, then stay hidden for at least one second
  before a new life enters at a reinforcement point; ordinary state updates never turn a visible corpse back into a guard.

## 8c. World clock (locked) — 01-core, everything ambient
- W = `AF.clock.w` = seconds since `AF.world.epoch` (UTC midnight of the session day) on the host's clock (`AF.world.off`, refined
  by min-RTT ping samples). Hooks get it as `t`. Frozen while `AF.timeScale` is 0, dt-stepped in `?test` / `?shot` / `AF.step`.
- Ambient systems are schedules of W + `AF.world.seed`: time of day (`AF.time.base`, `AF.time.at(W)`, changed via `AF.time.set`
  → one reliable `time` message), traffic lights, tram timetable, ferries / yachts / tugs, rides (carousel, wheel, coaster laps),
  air traffic (fixed 10 Hz sim), fireworks show, blimp, crowd tours (~880 global walkers bound near the camera), residents' plan
  loops, path walkers, animals (slot wanders), zoo plans, wild fauna, traffic (15 Hz fixed step). Nothing ambient is ever sent.
- Fixed-step sims never re-label steps when W nudges back a little (they wait) and never drop steps (backlog ≤ 12 a frame);
  only a jump of a minute or more restarts them.

## 9. Measuring
- `node tools/serve.mjs 8765`; `node tools/build.mjs --check`. Baseline: `git show HEAD:output.html > tools/output-base.html`.
- Playwright (MCP run_code with `filename`): `test-run.js` (`?test`), `boot-time.js`, `perf-areas.js` (per-pose ms/draws/tris),
  `perf-run.js` (base vs current), `play-perf.js` (real play: preload on, fps uncapped, per-spot frame time median / p95 / worst,
  tick + render + world-matrix ms with the dirty check on and off, draws, tris, geometries + heap; `__psThrottle = 4` for a laptop
  CPU, `__psUrl` for a baseline), `session.js` + `perf-list.js` / `perf-break.js` / `cpu-prof.js` / `gpu-prof.js` /
  `tick-survey.js` / `lod-check.js`, `stream-fly.js` / `city-fly.js` / `outland-drive.js` / `stream-test.js` (streaming hitches),
  `hitch-probe.js` (every rAF gap > 60 ms with its top hooks / GL calls, every runtime program link with its stack, worst single
  call per hook; `globalThis.__psExtraSrc` = `play-scenario.js` source + `__psScenario = 'play'`, `__psThrottle = 4` for a laptop,
  `__psTrace` for a browser-wide trace whose events land on each hitch; `veil` marks hitches behind the loader; summarise with
  `node tools/hitch-sum.js out.txt --ev`). From plain node: `node tools/pw-run.js tools/hitch-probe.js --g:__psScenario=play
  --g:__psExtraFile=tools/play-scenario.js` (NODE_PATH must resolve playwright). Other agents' headless browsers on the same machine
  inflate CPU ms and add GPU-process stalls: compare causes (links, first-use queries, hook names), not raw gaps.
  Long runs exceed the MCP timeout: start them un-awaited and stash the result on `page`.
  Harnesses that boot their own page close other browser contexts.
