# Port Solace: co-op multiplayer and gameplay performance pass (spec, 2026-10-10)

**Status (2026-10-10):** Part A is implemented (`src/79-net.js`, `src/80-coop.js`, `signal/` deployed to
`wss://port-solace-signal.whoisdhruv.workers.dev`). Part B's P0 items are done: `forceSinglePass`, the crowd `flowKey` crash,
`ensureIM` growth and the no-alloc `owned()`. The P1 items (car broadphase grid, frozen static transforms, FX LOD, SFX buffers and
fight gating) are still open. The text below is the original design and is kept for reference.

Part A covers multiplayer and Part B covers the performance pass.
Part B is listed first in the phasing because the extra player needs frame-time headroom that combat currently uses up.

---

## Part A: Multiplayer

### A1. Peer-to-peer or a server?

Peer-to-peer can work, with the host's browser acting as the game server. A few small services are still needed, though none of
them run game logic.

| Need | Why | Can the host's browser do it? |
|---|---|---|
| Simulation, rules and session state | ordinary game logic | **Yes**: the host is the session authority |
| Data transport between players | browsers can't open raw sockets | **Yes**: WebRTC DataChannels are peer-to-peer and DTLS-encrypted |
| **Signaling** (exchanging the WebRTC offer/answer + ICE candidates, resolving a lobby code) | two browsers can't find each other without a rendezvous point | **No**: a small rendezvous service is used only while players join |
| **NAT traversal** | STUN finds public addresses (free public servers exist); some NATs (mobile carriers/CGNAT, strict corporate or university networks) also need a **TURN relay** | **No**: STUN is free. TURN is a paid or free-tier relay that only the failing pairs use |

Vercel (our host) serves static files and short-lived functions, so it **can't hold WebSocket connections**. Signaling options, ranked:

1. **Cloudflare Worker + one Durable Object per lobby code** (WebSocket hibernation). About 100–150 lines. It creates and joins
   lobbies, relays SDP/ICE, reports presence and "host left", and hands out short-lived TURN credentials. Workers and Durable
   Objects have a free tier (check the current limits). **Recommended.**
2. **PeerJS cloud broker** (`0.peerjs.com`, free, nothing for us to deploy). This is the fastest route to a prototype. It is a
   third-party service with no SLA and its own client library (adds weight to the CDN importmap). Use it for a spike only.
3. **Copy-paste codes** (non-trickle ICE: one "invite" blob and one "reply" blob, about 1–2 KB base64 each). Needs no backend.
   The UX is clunky, so it fits best as an offline fallback or for LAN play.
4. Vercel function + KV store polling. This works but adds latency and complexity compared with option 1.

For development, `tools/serve.mjs` gets a `/signal` long-poll endpoint so two Playwright contexts can connect locally without
internet.

### A2. Authority model (recommended): host session authority + per-entity owner simulation

A pure host-authoritative design, where the host simulates everything and guests only send input, fits this engine poorly. All
ambient systems are centred on the camera:
- the crowd (`55`) spawns walkers around the camera,
- traffic (`51`) runs at full rate within 240 m of the camera and at 1/4–1/8 rate beyond that,
- streaming, LOD and outland fauna (`56-wild`) also follow the camera.

If the host had to simulate the guest's neighbourhood, every system would need multiple foci, and host CPU would roughly double.
That runs directly against the performance goal. The guest's own avatar and car also need local prediction anyway to feel
responsive.

So:
- **Host = session authority**: lobby, player ids, `netId` allocation, time of day, global flags (PvP), and arbitration
  (ownership conflicts, hit sanity checks, kicking).
- **Each client simulates what it owns** and broadcasts it:
  - its own avatar,
  - the vehicle it drives,
  - its own health, money and save (`AF.save` stays per-player and local),
  - its own wanted level and the police that level spawns,
  - the peds it engaged.
- **Others render proxies** with interpolation. Ownership moves (via the host) when an owner leaves or goes out of range.
- **Ambient life stays local** in v1 (crowd, traffic, animals, path walkers, trains, planes). When two players stand together,
  each sees a slightly different set of passers-by and traffic, which is acceptable for co-op. A later phase can add a "shared
  bubble": within 150 m of the guest, the host streams its traffic (already a 15 Hz lane sim with interpolation) and the guest
  suppresses its own.

### A3. Determinism we can rely on (no world transfer)

- World generation is seeded (`AF.rng`, `AF.hash2`). `Math.random` only shows up in cosmetics (flicker, toasts) and in runtime
  gameplay (`56-animals`, `60-atmos`, `76–78`). Both peers build the same city and outland, so **no world data is sent**.
- At join, the handshake checks `AF.BUILD` plus a content hash (for example a hash of `output-min.html`, or a palette and voxel
  checksum). On a mismatch the guest is refused with "update your game".
- Stable cross-client ids:
  - kerb and parked cars use a deterministic key `type:x*4:z*4` (the merged statics in `placeParked` turn into real cars only
    when used),
  - boot-time cars use their creation order,
  - runtime entities get a host-issued `netId`.
- Crowd looks (`w.v`) come from a seeded table, so an index refers to the same look on every client. A test must cover this.

### A4. Who owns what

| State | Authority | Replication |
|---|---|---|
| Lobby, player list, friend picks (unique), PvP flag | host | reliable, on change |
| Time of day (`AF.time.hours/speed/paused`) | host | reliable every 2 s plus on change; guests ease toward it |
| Player avatar (pose, mode, anim flags, held weapon, seat) | that player | fast, 20 Hz |
| Player health / death / respawn | that player | reliable events (`hurt`, `died`, `respawn`) |
| Money, guns, ammo, outfits, jobs | that player (local `AF.save`) | not replicated (jobs could become co-op in a later phase) |
| Driven vehicle (incl. passengers' car) | the driver | fast, 20 Hz; occupants reliable |
| Parked / ambient cars, kerb cars | local | a kerb car taken by a player becomes a net entity |
| Engaged peds (`w.agg`) | the client that engaged them | fast, only to players within 150 m |
| Wanted level / heat | each player for themselves | reliable on change (for HUD stars on teammates) |
| Cops, squad cars, autogyro | owner of the wanted level they serve | fast (relevance-filtered) |
| Explosions, wrecks | owner of the car | reliable event + wreck state |
| Shots / tracers / muzzle FX | shooter | fast (batched per tick) |
| Ambient crowd, traffic, animals, walkers, trains, air traffic | local | none (v1) |

### A5. Protocol

- **Channels per peer**:
  - `rel`: ordered, reliable. Carries lobby, events, spawn/despawn, ownership changes and chat.
  - `fast`: unordered, `maxRetransmits: 0`. Carries snapshots and shot batches.
- **Topology**: star around the host (2 players in v1, designed for 4). Guests send to the host and the host forwards. The host
  forwards owner snapshots without re-simulating them.
- **Binary codec**: one reused `ArrayBuffer`/`DataView` per channel and no JSON on `fast`. It complies with PERF.md §8.3: no
  per-frame allocations. Sizes:
  - Player (≈ 30 B): `id u8, seq u16, x y z f32, yaw i16, pitch i16, speed u8, mode u8, flags u8 (aim, swing, side, reload, sprint, air, lie, fp), weapon u8, vehicle u16, seat u8`.
  - Vehicle (≈ 32 B): `netId u16, x y z f32, yaw pitch roll i16, v i16 (cm/s), steer i8, dmg u8, flags u8 (lights, siren, burning, dead, horn)`.
  - NPC (≈ 17 B): `netId u16, x y z f32, yaw u8, frame u8, flags u8 (lie, cop, look high bits)`, plus `look u16` on spawn only.
  - Shot (≈ 20 B): `shooter u8, weapon u8, muzzle xyz i16 (rel. to shooter, cm), end xyz f32`.
- **Rates and bandwidth**: 20 Hz desktop and 15 Hz phones. A 2-player fight with 12 engaged peds, 3 squad cars and the autogyro
  comes to ≈ 0.5 KB per tick, about 10 KB/s per direction. The budget is ≤ 16 KB/s per peer.
- **Interpolation**: per-entity ring of 8 snapshots, rendered 100 ms behind host time. Vehicles use Hermite interpolation with
  velocity and extrapolate ≤ 250 ms on loss. A teleport flag snaps.
- **Clock**: NTP-style ping/pong on `rel` (4 samples, median, every 5 s) gives the host time offset.
- **Relevance**: NPC and vehicle snapshots only go to players within 150 m (vehicles 400 m). Players are always sent.
- **Keep-alive**: the net layer runs its own heartbeat (`setInterval` 250 ms), independent of `AF.frame`, so the travel veil and
  modal UI never drop the connection.

### A6. Features

**Lobby / UX (`71-ui`)**
- The title card gets **Play**, **Host co-op** and **Join co-op** buttons, plus deep link `?join=CODE`. A host shows an 8-character
  code from `crypto.getRandomValues` (Crockford base32) and a copyable invite link.
- Lobby sheet:
  - player list with friend picks (unique: two players can't both be Kush),
  - PvP toggle (default off),
  - Start; the host can kick.
- In game:
  - the pause menu lists players with ping and has a "Leave session" button,
  - toasts announce join/leave,
  - teammate dots and names appear on the map and minimap (`74` `map.overlays` / `miniOverlays`).
- The menu already doesn't stop the simulation; in MP its "PAUSED" title becomes "MENU". The hour slider and clock stop become
  host-only. Photo-mode freeze (`AF.timeScale = 0`) is disabled in MP; the camera still works.

**Remote players (`57-friends`, `70-player`)**
- A remote player is a friend from the cast, and every friend already has an NPC avatar (`AF.friends.npcs[id]`). **Reuse that
  avatar root**, the way `F.play` hides the local player's own NPC. This adds no new geometry, keeps the same draws, and frees the
  NPC's home slot.
- Extract the walk/run/air/aim/swing posing in `70-player` into `AV.animate(parts, state, dt)` so the local and remote avatars
  share it. Remote state comes from snapshot flags.
- Held items: `heldGeo(id)` from `77` is attached to the remote `armR`, keyed by the weapon byte.

**Vehicles with two (or more) seats ("double capacity")**
- `car.seats`: seat 0 is the current `seatLocal(car)` driver seat. Seat 1 mirrors x for cars and vans, sits behind the rider for
  `moto`, and is the sidecar for `sidecar`. Buses get N seats. Planes (Clipper) and jet skis follow in a later phase.
- `car.occ = [playerId|null, …]` is replicated reliably. The host grants seat requests, first come first served.
- New mode `passenger`:
  - the avatar is seated through a generalized `AF.Vehicle.seat(v, local, o, out)`, which writes into a per-avatar seat object
    instead of the single shared `AF.PL.seat`,
  - chase/first-person camera with free orbit,
  - E/F exits,
  - firing from the window ("drive-by") comes in a later phase.
- Interaction:
  - walking up to a car a teammate drives shows "Ride with Kush (E)" when a seat is free,
  - a remote driver can never be pulled out,
  - if the driver gets out, a passenger can "Take the wheel": ownership of the car moves to them.
- Physics: only the driver's client runs `VV.physics`. Every other client applies snapshots (as AI cars already interpolate in
  `syncInstances`). The passenger's camera follows the *interpolated* car (100 ms latency is fine for a passenger).

**Combat across players (`77-combat`)**
- `target()` stops assuming `AF.player`:
  - engaged peds store `A.tgt` (the player who provoked them) and chase or shoot that player's position (local, or interpolated
    remote),
  - police serve the wanted player who owns them.
- Shooting is resolved on the shooter's side ("favor the shooter"):
  - `CB.ray` adds remote player capsules (when PvP is on) and proxy peds,
  - a hit on something owned elsewhere sends `hit {target, dmg, kind, dir}` to its owner, which applies it (players run
    `AF.health.hurt`, owners run `hitPed`),
  - the host drops hits beyond weapon range + 10 m.
- Ambient peds: a player who hits a local ambient ped engages it locally, then asks the host for a `netId` and broadcasts
  `spawn(npc, look, pose)`. Teammates within 150 m see the proxy. Their own different local ped at that spot isn't touched.
- Wanted is per player. A teammate who shoots a cop picks up their own heat.
- Explosions: the car owner broadcasts `boom(netId)`. Every client plays FX and applies blast damage to its own avatar and its own
  owned peds.
- Shots: remote shots replay locally as `FX.line` + flash + positional SFX. They never run local hit tests.

**Time, weather, events**: host-owned time of day; fireworks/zeppelin/ambient events stay local cosmetics.

**Jobs and economy**: stay per-player and local in v1, no shared payouts. A later phase can add co-op taxi/delivery runs.

### A7. Code changes (new parts and hooks)

- **`src/79-net.js`** (new, OWNER: net): `AF.net` with
  - roles `off|host|guest`,
  - signaling adapters (`worker`, `peerjs`, `manual`, `dev`),
  - RTCPeerConnection + 2 DataChannels,
  - codec, clock sync, entity registry (`netId → {owner, kind, ref}`), relevance, heartbeat,
  - `AF.net.on(type, fn)` / `send`.
- **`src/80-coop.js`** (new, OWNER: net): gameplay glue covering remote avatars, seats/passenger mode, vehicle ownership and
  apply, shot/hit/boom events, NPC proxies, lobby UI glue and teammate map overlays.
- `04-vehicle`: `Vehicle.seat(v, l, o, out)` writes into a given seat object; seat tables per vehicle kind.
- `50-vehicles`: `car.seats/occ/netId/owner`; remote-driven cars skip local physics and apply snapshots; `exitCar` handles
  passengers; deterministic kerb-car keys.
- `55-people`: a reserved **net ped pool** (16 walkers, like the 8-cop pool) drawn through the existing instanced crowd frames.
  The proxies add no new draws.
- `57-friends`: hide the NPCs of remote players' friends; unique picks.
- `70-player`: `AV.animate` extraction; remote avatar seat/aim/lie poses.
- `71-ui`: title Host/Join, lobby sheet, players in the pause menu, MP-only menu rules.
- `74-map`: teammate overlays.
- `76-game`: `hurt` from remote sources; `died` / `respawn` broadcast; MP disables the photo freeze.
- `77-combat`: multi-target `target()`, `A.tgt`, remote hits, police per wanted player.
- `98-tests`: codec round-trip, interpolation, seat grant rules, loopback transport (in-page fake channel pair).
- `tools/serve.mjs`: dev `/signal`. `tools/net-test.js`: Playwright host + guest contexts (presence, drive with passenger,
  PvP-off hit, bandwidth, net tick ms). `tools/signal-worker/`: the Cloudflare Worker (deployed separately with wrangler).
- PERF.md gets a "Network" section (budgets in A10). AGENTS.md gets the parts map.

### A8. Edge cases

- **Travel veil / death respawn**: `AF.stream.travel` pauses the local sim. The owner's entities freeze briefly for others, which
  is acceptable. The heartbeat keeps the link up. Players respawn at their own friend's home.
- **Hidden tab**: on phones the loop stops when `document.hidden` is set. A guest just resyncs on return. If the host is hidden,
  guests show "Host is away" after 3 s and the session ends after 30 s. Recommend desktop hosts; host migration comes in a later
  phase.
- **Streaming**: each client streams around its own camera. A distant remote avatar is drawn at its replicated y (no local ground
  physics), so it may float over coarse LOD terrain far away, which is acceptable.
- **Disconnect**: the host reassigns the leaving player's entities (police and peds just calm down; their car parks where it is).
  If the host leaves, the session ends for everyone with a toast.
- **Same car, same moment**: the host arbitrates seat grants (first request wins) and denies the other with a toast.
- **Modes not networked in v1** (fly, jetski, carousel, rail ride, photo): the avatar is shown hidden or "busy". These are added
  later, one mode at a time.

### A9. Security and privacy

- WebRTC DataChannels are always encrypted (DTLS). Note that **peer-to-peer reveals each player's IP address to the others**.
  Offer a "relay only" toggle (`iceTransportPolicy: 'relay'` through TURN) for people who care.
- Lobby codes come from `crypto.getRandomValues` and expire. The Worker rate-limits create and join. TURN credentials are
  short-lived and issued by the Worker; no secrets live in the client.
- Every incoming message is untrusted:
  - fixed binary layouts with length checks,
  - enum ranges, finite floats, positions clamped to `AF.PLAN.world` bounds,
  - per-type rate limits; unknown types are dropped.
- Names and chat are rendered with `textContent` / `esc()`, never `innerHTML`. Nothing from the network is evaluated.

### A10. Performance budget for networking

- Net tick ≤ 0.3 ms per frame with 4 players; no per-frame allocations.
- Remote avatars reuse friend NPC roots (≤ 7 draws each, plus shadows only within `AF.CULL.shadow`).
- Proxy peds go through the crowd's instanced frames, and proxy cars through the existing per-type instanced paint batches. No new
  materials or programs, so there is nothing new to warm up.
- ≤ 16 KB/s per peer per direction.

### A11. Phases and acceptance

1. **Perf P0 + P1 from Part B** (makes room for the second player).
2. **Presence**:
   - signaling (dev + Worker), lobby, remote avatars walking/running, time sync, teammate map dots,
   - acceptance: two contexts connect locally in under 3 s, with remote avatar jitter-free at 100 ms latency and 5 % simulated
     loss (`tools/net-test.js`).
3. **Vehicles**:
   - owner-authoritative cars, passenger mode (2 seats in cars, pillion on motos), take-the-wheel, kerb-car ids,
   - acceptance: guest rides 2 minutes in the host's car with no visible snapping and correct seat on both screens.
4. **Combat**:
   - shots/FX, PvP toggle, hits, networked peds, per-player wanted and police, explosions/wrecks,
   - acceptance: 5-star fight with both players stays within the Part B fight budget on the host, at ≤ 16 KB/s.
5. **Later phases**:
   - shared traffic bubble, planes and jet-ski passengers, drive-by shooting,
   - co-op jobs, host migration, reconnect, relay-only privacy toggle polish.

### A12. Open questions

1. Signaling: Cloudflare Worker (recommended) or a PeerJS spike first?
2. Max players: 2 for v1, with the protocol designed for 4. Is that right?
3. PvP: off by default with a lobby toggle?
4. Is "everyone sees their own ambient crowd and traffic" acceptable for v1?
5. Do phones need to be able to host, or is joining from a phone enough for v1?

---

## Part B: Gameplay performance pass

### B1. Method

- New harness [tools/tmp-perf/combat.js](tools/tmp-perf/combat.js) runs through MCP with config in `page.context().__cb`.
  - It runs scenarios with `AF.step(1/30)`: walk idle/run, revolver, shotgun, tommy gun, a 5-star fight (cops, 3 squad cars,
    autogyro), six burning/exploding cars, and driving.
  - It records GPU-synced frame ms, tick ms with the top hooks, render CPU ms, GPU ms (timer query), draws and tris.
  - It also takes real-time rAF runs with the fps cap off, and optional CPU profiles with caller attribution.
- [tools/tmp-perf/attrib.js](tools/tmp-perf/attrib.js) toggles one subsystem at a time against a control run in the same session.
- Baseline is `tools/tmp-perf/base.html`, the build from commit `f2478e2`, just before the weapons and gameplay commits.
- **Caveat**: this machine (i5-13600KF, hybrid P/E cores) moves headless Chrome between fast and slow states. Identical runs
  differ by up to 2×. Only same-run comparisons and draw/GPU counts are reliable. Before/after for every fix must alternate base
  and current runs (or pin the browser to P-cores).

### B2. Measurements (desktop, Laptop tier `lite`, 1280×720, downtown street)

Same-run step measurements (fast state):

| scenario | frame ms | ticks ms | render CPU ms | GPU ms | draws |
|---|---|---|---|---|---|
| walk idle | 11.6 | 2.6 | 5.8 | 3.0 | 487 |
| walk / run | 11.1 | 2.8 | 4.8 | 3.2 | 500 |
| revolver | 12.0 | 2.6 | 6.1 | 3.2 | 500 |
| tommy gun (auto) | 10.5 | 2.4 | 4.8 | 2.9 | 498 |
| 5-star fight (8 cops, 3 squads, autogyro) | 19.2 | 4.4 | 8.4 | 5.7 | 500 |
| 6 cars burning → exploding | 24.9 | 5.5 | 11.7 | 6.9 | 498 |
| driving after the fights | 26.7 | 5.8 | 14.9 | 6.4 | 735 |

Real time, fps cap off:

| run | fps | p95 frame |
|---|---|---|
| walking | 168 | 5.7 ms |
| tommy gun | 132 | 11.2 ms |
| 5-star fight | 80 | 16.8 ms (p99 27.8 ms) |
| driving after fights | 82 | 16.8 ms |

Baseline `f2478e2`, alternated with current:
- walk idle 9.8 ms, about 172 fps in real time;
- driving 97 fps vs 99 fps for current in the same machine state.

**Walking and driving did not regress.** The drops come from **fights**:
- frame time rises 1.3–2.2× and **GPU time roughly doubles** (3 → 6–9 ms),
- on a discrete desktop GPU that stays hidden under the 30 fps cap,
- on a laptop iGPU or a phone the same doubling becomes visible FPS drops.

Shooting by itself is cheap (tommy gun ≈ walking). The cost comes from what a fight sets in motion: police AI and squad-car
physics, engaged peds, fire and smoke particles, knockback (which makes the shadow pass run every frame), and wrecks and squads
left behind afterwards.

### B3. Findings (ranked) → fix

| # | Finding (evidence) | Fix | Expected | Locked? |
|---|---|---|---|---|
| 1 | **Crowd tick crashes** (`TypeError … reading 'i'` in `flowKey`) once an engaged ped was a group follower: the density loop at [src/55-people.js](src/55-people.js#L1566-L1569) lacks `!w.agg`, so `w.A` is undefined. The crowd frame aborts (no instance updates) while that ped stays engaged. | skip `w.agg` (and guard `w.A`) in the density/flow loop | fixes frozen crowd frames and console spam | no |
| 2 | **Program re-derivation every frame**: the additive light beams at [src/15-harbour-2.js](src/15-harbour-2.js#L424) and [src/48-sea.js](src/48-sea.js#L213) are `transparent` + `DoubleSide`. three r160 then draws them in two passes and flips `material.side` with `needsUpdate` twice per object per frame, which forces `getParameters` / `getProgramCacheKey` (0.13–0.68 ms per frame in profiles) and doubles their draws. | `forceSinglePass = true` (additive needs no back-to-front pass) | −0.1…0.6 ms CPU, −8 draws | no |
| 3 | **Instanced car batches re-created per runtime car**: [src/50-vehicles.js](src/50-vehicles.js#L594) calls `ensureIM(type, count+4)`, which grows capacity by exactly 1 (dispose + new InstancedMesh + buffer upload) for every squad car and every kerb car taken. It also scans all cars to count. | geometric growth (×1.5, min +8); reserve police slots at build; keep a per-type count | removes spawn hitches | no |
| 4 | **Car broadphase is O(N)**: `nearby()` at [src/50-vehicles.js](src/50-vehicles.js#L643) is scanned over `VV.cars` (210) + `parkedStatic` (413) on every `moveAllowed` / `carContacts` / `carBlocked` call, several times per physics substep, for the player car, every squad car and pushed cars. Profile: `carContacts` 1.4 + `moveAllowed` 0.9 + `boxBlocked` 0.6 ms per frame in a chase. | 8 m uniform grid: static grid for `parkedStatic` (built once), dynamic grid updated when a car changes cell | −0.5…2 ms in chases | no |
| 5 | **Fights double GPU**: shadow pass every frame while knockback moves the subject (−2.1 ms GPU and −43 draws when disabled); large fire/smoke points near the camera (opaque *discard* smoke defeats early-Z; points clamp at 256 px). | cap point size by `renderPR` (≤ 96 px at 720p), distance LOD for fire/smoke (fewer, smaller beyond 40 m, none beyond 120 m), halve on phones; autogyro casts only within 60 m. The shadow cadence rule (§2) stays as is | −1…3 ms GPU in fights | §2 untouched |
| 6 | **Scene-graph traversal is the top CPU cost**: 6,800 objects, 4,516 with `matrixAutoUpdate`. **80 % (3,604) never move**: unnamed top-level groups/meshes (by lot: city-other 1,027, theatre-shops 443, harbour 233, civic 196, residential 171, downtown 114), `park-life` 310, `res-dyn` 149, 10 hidden friend avatars 106. `updateMatrixWorld` + `projectObject` + `intersectsObject` cost 1.7–5 ms per frame. | freeze static transforms (`matrixAutoUpdate=false` + one `updateMatrix`) at owner level; hidden avatars `matrixWorldAutoUpdate=false`; longer term, merge static props into voxels / `placeStatic` (PERF §8.1) | −0.5…2 ms CPU per frame everywhere | no |
| 7 | **Per-frame allocations in combat**: `owned()` at [src/77-combat.js](src/77-combat.js#L64) builds an array every frame through `cur()`, and on every HUD refresh. | cache the owned list; invalidate on `give`/purchase | less GC under fire | §8.3 compliance |
| 8 | **Audio graph churn**: every shot builds 5 WebAudio nodes (`hiss` + `tone` at [src/76-game.js](src/76-game.js#L283)); the tommy gun plus police shots means about 100 nodes/s. | render each synth sound once into an `AudioBuffer` (OfflineAudioContext); play = 1 BufferSource + 1 Gain; voice cap 12 with stealing | smoother auto-fire, less GC | no |
| 9 | **Fight simulation not distance-gated**: squad cars run full physics at any distance; engaged peds and cops step at full rate wherever they are; `panic` engages up to `engagedMax` on every shot. | squads beyond 120 m move kinematically along the road at 15 Hz; engaged peds beyond 50 m step at 10 Hz; panic engages at most 3 new peds per shot | −0.5…1.5 ms ticks in 5-star | §7 asks for this |
| 10 | **Fight leftovers**: after a fight, 12–18 engaged peds, squad cars and burning wrecks stay alive and draw at full detail while the player is near. | calm engaged peds 20 s after the last crime when out of sight; squads without a wanted player drive off and are forgotten at 150 m | returns to the walk budget faster | no |
| 11 | **Crowd draws**: each look × pose frame is its own InstancedMesh (≈ 37 draws, ×2 with shadows). | later phase: palette-instanced crowd (one batch per pose frame, per-instance look palette like the car paint shader) | −25…30 draws | no |

Also to verify with a hitch harness (frame > 25 ms):
- first shot, first squad car, first explosion, first autogyro, first engaged pose frame per look;
- pre-warm at `preloaded` through `AF.stream.compileAhead` where needed.

### B4. Plan and gates

- **P0 (small, low risk)**: #1, #2, #3, #7.
- **P1**: #4, #5, #6 (start with the hidden avatars, `park-life`, `res-dyn` and the top-level static props), #8, #9, #10.
- **P2**: #11, merging static props, and static/dynamic shadow caching (research only; must keep §2 behaviour).

Gates:
- every PERF.md §1 pose: draws and GPU unchanged or lower;
- new gameplay poses added to `tools/perf-areas.js` / `combat.js`:
  - **5-star fight ≤ 1.3× walk frame time** and **GPU ≤ 1.5× walk**,
  - burning cars ≤ 1.5× walk,
  - total ticks ≤ 3.5 ms in a 5-star fight,
  - no frame > 33 ms on first-of-kind events;
- `?test` passes (except the known boot-time check); phone check through `?mobile` plus one physical device.
- PERF.md gets the gameplay poses in §1 and the network budget (A10).
