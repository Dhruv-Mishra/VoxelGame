# Port Solace — changes completed (performance, fixes, new weapons, the armoured-car job, guidance)

This pass applied the three.js performance guidance from `Perf_skill.md`, the Utsubo "100 three.js tips" article and the
MetaDesign "three.js performance optimization" article to the game, fixed the bugs found on the way, and added the requested
gameplay. Everything lives in `src/` (+ `shell.html`); `output.html` / `output-min.html` are rebuilt from it.

## How to run the game

```bash
# 1. build (syntax-checks every part, writes output.html)
node tools/build.mjs --check
# optional: the minified build Vercel serves
node tools/build.mjs --min --out=output-min.html

# 2. serve the folder (also hosts the co-op signaling at /signal/*)
node tools/serve.mjs 8765

# 3. play
#    http://127.0.0.1:8765/output.html          the game
#    http://127.0.0.1:8765/output.html?test     the self-tests (title shows passed/total)
```

Click **Play** on the title card. `F1` opens the controls sheet (now with a "How to play — finding your way" section).
The heist starts from Vera at the Blue Heron (the **H** on the map, `M`); it needs a co-op crew of two (host a game from the
pause menu and share the code) or pick "Go alone". The live build is deployed to Vercel (`vercel --prod`, `/` → `output-min.html`).

---

## 1. Performance — what was measured and what changed

### How it was measured
* `tools/play-perf.js` (new): boots the build the way a player does (streaming + boot preload on, fps cap off), starts the
  game, travels to 7 spots (downtown, park lake, zoo gate, harbour, airfield, the hills, downtown again) and samples 150 real
  frames at each: frame interval median / p95 / worst, CPU ms in tick hooks, CPU ms in `renderFrame`, CPU ms in the world-matrix
  pass (with the new dirty check on **and** off, in the same session), objects recomposed per frame, draw calls, triangles,
  GPU geometry count and JS heap. `__psThrottle=4` emulates a laptop CPU.
* `tools/perf-areas.js` (existing): per-pose draw calls / triangles / GPU ms at 13 fixed poses.
* A CDP sampling heap profile of 6 s of walking downtown (which functions allocate per frame).
* Baselines: `HEAD` (`tools/output-base.html`) and the working tree before this pass, which already contained another
  agent's uncommitted edits (`tools/output-pre.html`). All runs: desktop, 1280×720, Balanced tier, headless Chrome on ANGLE/D3D11.

### Results

**World-matrix pass (03-render `updWorld`) — measured in place, same session, dirty check on vs off**

| spot | ms / frame (off → on) | objects recomposed / frame (off → on) |
|---|---|---|
| downtown | 1.08 → 0.71 | 2 874 → 600 |
| park lake | 0.77 → 0.50 | 2 436 → 602 |
| zoo gate | 0.70 → 0.52 | 1 559 → 228 |
| harbour | 1.11 → 0.73 | 2 329 → 651 |
| airfield | 0.81 → 0.64 | 1 560 → 275 |
| hills | 0.51 → 0.34 | 1 498 → 217 |
| **average** | **0.86 → 0.62 ms (−28 %)** | **−80 % recomposed** |

With a 4× CPU throttle (laptop) the same pass goes from 4.1–4.6 ms to 2.8–3.5 ms per frame.

**Per-frame garbage (CDP sampling heap profiler, 6 s walking downtown)**

| allocator | before | after |
|---|---|---|
| total, per frame | 563 KB | 487 KB (−13 %, the rest is mostly streaming meshing + three's uniform uploads) |
| `Math.hypot` builtin | 11.8 MB | ~0 (replaced) |
| region / prop LOD tick (`prop-lod`) | 22.7 MB | 5.0 MB (−78 %) |
| interaction scan (`findInteract`) | 10.6 MB | 2.3 MB (−78 %) |
| residents (`peopleTick`) | 15.3 MB | below the top 15 |
| car instancing (`syncInstances`) | 31.1 MB | 16.7 MB (−46 %) |
| animals (`animalsTick`) | 25.8 MB | 18.6 MB (−28 %) |

**Whole-frame numbers (`play-perf.js`, averages of the 7 spots; frame times on this machine are noisy — ±20 % run to run)**

| build | tick ms | p95 frame ms | JS heap at the end | draws (downtown) | triangles (downtown) |
|---|---|---|---|---|---|
| HEAD | 1.94 | 12.6 | 1 159 MB | 520 | 5.1 M |
| before this pass | 2.19 | 14.0 | 1 069 MB | 522 | 5.2 M |
| **now** | **1.79 (−18 %)** | **11.7 (−16 %)** | **924 MB (−14 %)** | 513 | 5.1 M |

Draw calls and triangles stay flat at every pose (`perf-areas.js`: street 509 draws vs 545 at HEAD, aerial 930 vs 932); the
new content adds nothing while it is not in use (see `PERF.md` §7).

### The performance changes
1. **World-matrix dirty check** (`03-render.js`): an object whose position / quaternion / scale did not change keeps its
   local matrix and its subtree is not re-multiplied unless its parent moved (the Perf_skill "static transforms" rule, applied
   automatically instead of hand-flagging thousands of objects). `AF.perfStats` exposes the pass time and a switch.
2. **Allocation-free `Math.hypot`** (`00-prologue.js`): V8's builtin copied its arguments into a new array on every call and was
   among the top per-frame allocators (the game calls it thousands of times a frame). 1–3 finite arguments now use an exact
   square root; anything else falls back to the builtin. Bonus: `sqrt` is exactly rounded in every browser, so co-op clients
   agree on distances.
3. **No `Map` entry destructuring in the LOD tick** (`02-voxel.js`): `for (const [k, r] of map)` allocated an array per region
   per frame; now `keys()` + `get()`, and the three-argument distance checks are plain arithmetic.
4. **Interaction scan at 15 Hz** (`70-player.js`): walking mode searched every interact (hundreds of cars, doors, counters)
   every frame; it now runs at 15 Hz and immediately on E / F, so prompts still react instantly.
5. **Only drawn cars update wheel spin / brake lamps** (`50-vehicles.js`), **far animals skip their animation clock**
   (`56-animals.js`), **hidden residents stop moving their talk prompt** (`55-people.js`).
6. **Taller vehicles get a taller, longer chase camera** (`50-vehicles.js`): vans and the armoured car no longer fill the
   screen with their roof.

## 2. Bugs fixed
* **Car-stealing step lost the target car as soon as you sat in any car** (`81-heist.js`): the step's marker switched to the
  drop-off whenever you were in *a* car. Markers now check for *the* mission car (`inHeistCar()`), so a different car never
  hides the armoured car; the first leg (getting any car to the farm) now intentionally accepts any car.
* **The stash maze on Serena Isle was open to the sky** (`07-outland.js`): the earlier hillside change only partly covered the
  wide stash hall, so its ceiling sat above the natural ground and you could see into (and out of) the maze. The cover is now
  full over the hollow (2.2 m of rock, so coarse distant tiles never dip through and flicker) and eases back into the hill. The
  self-test that caught it (`island: smugglers' tunnel … under a roof`, failing at HEAD) passes again.
* **Heist voices did not play** (`assets/vo/fish-manifest.json`): the voice files had been re-encoded but the manifest still
  carried the old file hashes, so every line failed its hash check and fell back to subtitles. The manifest now carries the
  hashes of the shipped files (277 lines, all verified in game: no hash or freshness warnings).
* **Rockets bursting on the shooter's own cover**: launcher rounds arm after ~10 m.

## 3. Weapons
* **Fists are the default** for everyone (slot 1): no held stick any more — jabs and crosses (the baton model stays only as a
  prop). `G.fistDmg / fistReach / fistCd` tune it.
* **Bazooka** (straight rocket, 7 m blast) and **Seeker Launcher** (locks the best jet, autogyro or hostile car within ~9° of
  the crosshair — a red **LOCKED** tag shows it — and steers onto it). Sold at gun counters (rockets ×4 per pack), lent by the
  heist. Rockets are 8 pooled meshes compiled with the jet group (no new shader programs), with proximity fuses, smoke trails,
  back-blast, co-op replication (crewmates see the streak and the explosion).
* **Strike jets can now be shot down** (`G.jetHp`): bullets chip them, rockets bring them down; a downed jet spins in.
* **Armoured cars** (`car.armor`, `G.armorCarK`): take ~12 % of every hit.
* Remote players show the launchers in their hands; stealth treats them as weapons.

## 4. Heist: guns kept on checkpoint retries
When a checkpoint is reached, the lent weapons everyone holds (with their ammo) are recorded; every retry from that checkpoint
gives exactly those back (at least one full magazine each). Bought guns were already saved.

## 5. The armoured-car job (Act IV of the heist) and the jets
Replaces the old "pick up a car at the Motor Exchange" step with a five-step side job:
1. **Wheels** — any car (Vera leaves one at the Motor Exchange) out to **Southfield Farm**, west of the city.
2. **The farm** (stealth zone `farm`): six armed Moretti guards on rounds at midnight, three with torches. Crouch, take them down
   from behind, load the **launcher crate** into Moretti's **armoured car**, drive it out (an alarm turns it into a gunfight).
3. **The chase**: Moretti limousines (1 + crew size, max 4) come after the car — the host drives them; they pull alongside and
   shoot. **Passengers shoot from the windows** (drive-by), the driver to the front and sides; ramming works too. Destroy them all.
4. **The respray**: drive into a Body Works bay — the mission repaints and patches the car, and any police heat is lost.
5. **Park** it on Charter Street beside the bank.

Every client spawns the armoured car at the same spot so co-op matches the copies; chaser damage lands on whoever drives.
**The getaway** now has a **jets** step: after the crew is in the armoured car, strike jets (1 + crew size) hunt it with cannon
runs and missiles. The launchers come out of the boot; the crew must shoot every jet down before the run to the plane. The car is
armoured (and patched) so it takes a lot of hits; crewmates' jet kills are shared.
12 new radio lines (Vera, Tony Moretti) were generated with **Fish Audio Drama 3** (Fish voices "Laura" and "Jordan", as the
existing lines use) and imported with `tools/vo-build.mjs --fish-import` — no existing line was regenerated.

## 6. Instructions and finding your way
* **GPS route** (`73-mission.js`): the primary objective now gets an A* route over the city's road graph, drawn on the minimap
  and on the map instead of a straight dashed line.
* **Guidance line** under the objective: "↱ Turn right onto Wren Street · 190 m — 770 m to go", or off-road
  "↗ Head north-west · 1.2 km · Southfield Farm" (`AF.ui.placeAt` names the place).
* **Step tips**: heist steps that need a new control explain it when they start (top-left on desktop, a toast on touch) — lock
  picking, flying, stealth takedowns and carrying bodies, drive-by shooting, the launchers' lock-on, the respray.
* The **controls sheet** (F1) has a new "How to play — finding your way" section (gold objective line, blue directions line,
  gold route, edge arrow, missions, stealth, fighting, launchers), and a second opening tip points new players to Vera and the
  route.

## 7. Tests
* `?test`: 245/246 — the only failure is the documented local "boot under 30 s" timing (31.7 s on this busy machine).
  New self-tests: launchers / jets / armour / fists (77-combat) and the armoured-car job (marker never moves to another car,
  chasers spawn, respray, jets + launchers, checkpoint guns come back).
* Scenario runs (screenshots): fists, bazooka / seeker held, a seeker locking and downing two jets at the airfield, the heist
  from the Motor Exchange to the farm (guards, crate, armoured car), the chase (chasers alongside, armour soaking hits), the jets
  step (car hp 259 → 241 in 6 s under three jets), the GPS guidance while driving, the controls sheet.

## Files touched
`src/00-prologue.js`, `02-voxel.js`, `03-render.js`, `07-outland.js`, `50-vehicles.js`, `55-people.js`, `56-animals.js`,
`70-player.js`, `71-ui.js`, `73-mission.js`, `76-game.js`, `77-combat.js`, `78-jobs.js`, `80-coop.js`, `80-stealth.js`,
`81-heist.js`, `81-heist-sets.js`, `81-heist-lines.js`; `assets/vo/` (12 new lines, manifest); `tools/play-perf.js` (new);
`PERF.md`, `AGENTS.md`, this file.
