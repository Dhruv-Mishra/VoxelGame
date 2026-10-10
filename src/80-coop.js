// ================================================================ 80-coop.js
try {
// ===== 80-coop: co-op play over AF.net  (OWNER: net) =====
// Everyone simulates what they own and sends it 20x a second (15 on phones) in one binary snapshot of ~60-700 bytes: their avatar
// (root pose + 11 joint angles, so every mode, ride, fight and fall looks right), the vehicle they drive (cars, bikes, planes, jet
// skis), their engaged peds and police (cops, squad cars, the autogyro) and the shots they fired since the last snapshot.
// Receivers keep a short time-ordered buffer per thing and draw it ~100 ms in the past (adapts 70-320 ms to rate and jitter): late
// or reordered packets slot into place, stale ones are dropped, a gap is bridged by extrapolating the last motion for up to 250 ms,
// then the pose holds. Seated players are placed from the receiver's own copy of the vehicle (or ride), never from their world
// position, so a passenger can't trail behind a car. Hits on something another player owns are sent to that owner (peds, cars, the
// autogyro, the player himself); friendly fire is off by default. Ambient life (crowd, traffic, animals) stays local to each player.
{
  const N = AF.net, PI = Math.PI, TAU = PI * 2, VV = AF.vehicles;
  const C = AF.coop = { pvp: false, players: new Map(), ride: null, stats: { rx: 0, stale: 0, extrap: 0 } };
  const MODES = ['walk', 'drive', 'fly', 'jetski', 'carousel', 'funride', 'ride', 'ferry-ride', 'row', 'skydive', 'dead', 'passenger', 'photo', 'aerial', 'cine', 'other'];
  const MODE_I = new Map(MODES.map((m, i) => [m, i])), M = Object.fromEntries(MODES.map((m, i) => [m, i]));
  const JP = ['legL', 'legR', 'armL', 'armL', 'armR', 'armR', 'armR', 'chest', 'chest', 'head', 'head'], JA = ['x', 'x', 'x', 'z', 'x', 'y', 'z', 'x', 'y', 'x', 'y'], NJ = JP.length;
  const HELD = [null, 'keyboard', 'bag', 'dumbbell', 'mic', 'bat', 'pan', 'cutlass', 'guitar', 'revolver', 'shotgun', 'tommy', 'rifle'];
  const FRAMES = ['a', 'p', 'b', 'sit', 'work', 'phone', 'chat', 'look', 'hail', 'runA', 'runB'], WF = ['a', 'p', 'b', 'p'];
  const SND = [null, 'shot', 'shotgun', 'shot', 'rifle'];
  const VK_CAR = 1, VK_PLANE = 2, VK_SKI = 3;
  const AK = { carousel: 1, wheel: 2, coaster: 3, train: 4, ferry: 5 };
  const COLORS = ['#ffd24a', '#5ad1ff', '#ff7ab8', '#9dff7a'];
  const F_VIS = 1, F_SIT = 2, F_TP = 4, F_GROUND = 8, F_AIM = 16, F_DEAD = 32;
  const V_ENGINE = 1, V_DEAD = 2, V_BURN = 4, V_SQUAD = 8, V_GROUND = 16;
  const HIT_KINDS = new Set(['gun', 'melee', 'car', 'boom']);
  const num = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
  const toast = (t) => AF.emit('toast', t);
  const wrap = (a) => AF.angDiff(0, a);
  const crowd = () => AF.peopleKit && AF.peopleKit.crowd;

  // ---------------------------------------------------------------- vehicle identity (AF.Vehicle.netKey: name @ spawn spot, same on every client)
  const fnv = (s) => { let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); } return h >>> 0; };
  const hashOf = (v) => v.netHash ?? (v.netHash = fnv(v.netKey || ''));
  const kindOf = (v) => v.type && v.wheels ? VK_CAR : AF.planes && AF.planes.list.includes(v) ? VK_PLANE : AF.island && AF.island.jetski && AF.island.jetski.skis.includes(v) ? VK_SKI : 0;
  const findVeh = (h) => {
    for (const v of AF.Vehicle.all) if (v.active !== false && hashOf(v) === h) return v;
    // a kerb car still merged into the street here: take it out exactly as walking up to it would
    for (const s of VV.parkedStatic) if (!s.noDrive && fnv(s.name + '@' + Math.round(s.x * 4) + ',' + Math.round(s.z * 4)) === h) return VV.unpark(s);
    return null;
  };
  const myVeh = () => {
    if (AF.mode === 'drive' && VV.player) return VV.player;
    if (AF.mode === 'fly' && AF.planes && AF.planes.cur) return AF.planes.cur;
    if (AF.mode === 'jetski' && AF.island && AF.island.jetski && AF.island.jetski.cur) return AF.island.jetski.cur;
    return null;
  };

  // ---------------------------------------------------------------- Track: time-ordered samples of k floats, interpolated at a render time
  // field kinds: 0 linear, 1 linear + extrapolated, 2 angle, 3 angle + extrapolated, 4 step (held until the next sample)
  class Track {
    constructor(kinds, n = 10) { this.kinds = kinds; this.k = kinds.length; this.n = n; this.t = new Float64Array(n); this.v = new Float32Array(n * this.k); this.len = 0; }
    clear() { this.len = 0; }
    // out-of-order safe: inserted by time; a duplicate, or anything older than a full buffer's oldest sample, is dropped
    push(t, src) {
      const k = this.k; let i = this.len;
      while (i > 0 && this.t[i - 1] > t) i--;
      if (i > 0 && this.t[i - 1] === t) return false;
      if (this.len === this.n) { if (i === 0) return false; this.t.copyWithin(0, 1, this.len); this.v.copyWithin(0, k, this.len * k); this.len--; i--; }
      this.t.copyWithin(i + 1, i, this.len); this.v.copyWithin((i + 1) * k, i * k, this.len * k);
      this.t[i] = t; for (let j = 0; j < k; j++) this.v[i * k + j] = src[j];
      this.len++; return true;
    }
    // -1 empty, 0 interpolated, 1 extrapolated (<= maxEx ms past the newest), 2 held
    sample(rt, out, maxEx) {
      const n = this.len, k = this.k, T = this.t, V = this.v, K = this.kinds; if (!n) return -1;
      if (rt <= T[0] || n === 1) { const b = rt <= T[0] ? 0 : n - 1; for (let j = 0; j < k; j++) out[j] = V[b * k + j]; return rt <= T[0] ? 0 : 2; }
      if (rt >= T[n - 1]) {
        const a = n - 2, b = n - 1, span = Math.max(40, T[b] - T[a]), over = rt - T[b], u = Math.min(over, maxEx) / span;
        for (let j = 0; j < k; j++) {
          const va = V[a * k + j], vb = V[b * k + j], kd = K[j];
          out[j] = kd === 1 ? vb + (vb - va) * u : kd === 3 ? vb + AF.angDiff(va, vb) * u : vb;
        }
        return over <= maxEx ? 1 : 2;
      }
      let b = 1; while (T[b] < rt) b++;
      const a = b - 1, u = (rt - T[a]) / (T[b] - T[a]);
      for (let j = 0; j < k; j++) {
        const va = V[a * k + j], vb = V[b * k + j], kd = K[j];
        out[j] = kd === 4 ? va : kd >= 2 ? va + AF.angDiff(va, vb) * u : va + (vb - va) * u;
      }
      return 0;
    }
  }
  C.Track = Track;
  // player: x y z yaw pitch roll | 11 joints | hips mode flags weapon vehLo vehHi seat anchorKind anchorIdx stat speed
  const P_HIPS = 17, P_MODE = 18, P_FLAGS = 19, P_WPN = 20, P_VLO = 21, P_VHI = 22, P_SEAT = 23, P_AK = 24, P_AI = 25, P_STAT = 26, P_SPD = 27;
  const PT = [1, 1, 1, 3, 2, 2].concat(new Array(NJ).fill(0), [0, 4, 4, 4, 4, 4, 4, 4, 4, 4, 0]);
  const VT = [1, 1, 1, 3, 2, 2, 0, 0, 4, 4];   // x y z yaw pitch roll v steer dmg flags
  const NT = [1, 1, 1, 3, 4, 4];               // x y z yaw look frame
  const HT = [1, 1, 1, 3, 4];                  // x y z yaw falling

  // per origin: offset = receive time - sender stamp, kept as a slowly rising minimum (the least delayed packet), plus jitter and
  // the sender's interval; render time = now - offset - delay
  const clockIn = (k, stamp, now) => {
    const off = now - stamp;
    if (k.off == null || off < k.off) k.off = off; else k.off += Math.min(0.5, (off - k.off) * 0.002);
    k.jit += (Math.abs(off - k.off) - k.jit) * 0.08;
    if (k.last) { const iv = stamp - k.last; if (iv > 0 && iv < 1000) k.iv += (iv - k.iv) * 0.15; }
    if (stamp > k.last) k.last = stamp;
    k.delay = AF.clamp(k.iv * 1.3 + k.jit * 2 + 8, 60, 320);
  };
  const renderT = (k, now) => now - k.off - k.delay;

  // ---------------------------------------------------------------- remote players
  const RP = C.players, RV = new Map(), RN = new Map();
  const tagLayer = document.getElementById('ui');
  const npcOf = (id) => AF.friends && AF.friends.npcs && AF.friends.npcs[id];
  const hideNpc = (id, h) => { const n = npcOf(id); if (n && AF.npc) AF.npc.setHidden(n, h || (AF.friends.current && AF.friends.current.id === id)); };
  const addRemote = (p) => {
    if (RP.has(p.slot)) return RP.get(p.slot);
    const tag = document.createElement('div'); tag.className = 'coop-tag hud'; tagLayer.appendChild(tag);
    const r = { slot: p.slot, peer: p, P: null, lookKey: '', heldId: null, held: null, tr: new Track(PT, 12), out: new Float32Array(PT.length), clk: { off: null, jit: 0, iv: 50, last: 0, delay: 100 },
      x: p.x || 0, y: 0, z: p.z || 0, seen: false, last: 0, mode: 0, stars: 0, hp: 1, dead: false, veh: 0, seat: 0, ak: 0, ai: 0, tag, tagKey: '', tagX: -1, tagY: -1,
      hit: { slot: p.slot, heli: false }, heliHit: { slot: p.slot, heli: true }, heli: null, tg: { x: 0, y: 0, z: 0, car: null, away: true, speed: 0, peer: p.slot } };
    RP.set(p.slot, r); hideNpc(p.friend, true);
    return r;
  };
  const removeRemote = (slot) => {
    const r = RP.get(slot); if (!r) return;
    RP.delete(slot);
    for (const e of [...RV.values()]) if (e.owner === slot) releaseVeh(e, null);
    for (const e of [...RN.values()]) if (e.owner === slot) freeNpc(e);
    if (r.P) { AF.scene.remove(r.P.root); AF.avatar.release(r.P); }
    if (r.heli && r.heli.grp) AF.scene.remove(r.heli.grp);
    r.tag.remove(); hideNpc(r.peer.friend, false);
    if (C.ride.veh && C.ride.veh.net === slot) C.ride.veh.net = null;
  };
  const ensureAvatar = (r) => {
    if (r.P && r.lookRef === r.peer.look) return;
    const key = JSON.stringify(r.peer.look); r.lookRef = r.peer.look;
    if (r.P && r.lookKey === key) return;
    if (r.P) { AF.scene.remove(r.P.root); AF.avatar.release(r.P); r.held = null; r.heldId = null; }
    r.P = AF.avatar.build(r.peer.look); r.lookKey = key; r.P.root.name = 'coop-player'; r.P.root.rotation.order = 'YXZ'; r.P.root.visible = false;
    AF.scene.add(r.P.root);
  };
  const setHeld = (r, id) => {
    if (r.heldId === id) return;
    if (r.held) { r.held.removeFromParent(); r.held = null; }
    r.heldId = id; const CB = AF.combat; if (!id || !CB || !CB.heldGeo) return;
    const geo = CB.heldGeo(id); if (!geo) return;
    const m = AF.modelMesh(geo); m.position.set(0, -0.52, 0.03); m.castShadow = false; m.name = 'held'; r.P.armR.add(m); r.held = m;
  };

  // ---------------------------------------------------------------- seats: the driver's seat (VV.seatLocal), the passenger mirrored / a pillion
  const SL = [0, 0, 0], POSE = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, roll: 0 };
  const isBike = (v) => v.type && v.type.kind === 'bike' && !!v.type.solo;
  const seatOf = (v, k, seat) => {
    if (k === VK_CAR) {
      const L = VV.seatLocal(v), bike = isBike(v); SL[0] = L[0]; SL[1] = L[1] - (bike ? 0 : 0.57); SL[2] = L[2];
      if (seat) { if (bike) { SL[1] += 0.06; SL[2] -= 0.55; } else SL[0] = -SL[0]; }
    } else if (k === VK_SKI) { SL[0] = 0; SL[1] = -0.05; SL[2] = seat ? -0.75 : -0.15; }
    else { SL[0] = 0; SL[1] = 1; SL[2] = 0; }
    return SL;
  };
  const seatPose = (v, k, l, out) => {
    const s = Math.sin(v.yaw), c = Math.cos(v.yaw);
    out.x = v.x + c * l[0] + s * l[2]; out.y = v.y + (k === VK_CAR ? v.bob || 0 : 0) + l[1]; out.z = v.z - s * l[0] + c * l[2];
    out.yaw = v.yaw; out.pitch = k === VK_SKI ? -(v.pitch || 0) : v.pitch || 0; out.roll = v.roll || 0;
    return out;
  };
  const vehByHash = (h) => {
    const e = RV.get(h); if (e) return e.obj;
    const mine = myVeh(); if (mine && hashOf(mine) === h) return mine;
    if (C.ride && C.ride.veh && hashOf(C.ride.veh) === h) return C.ride.veh;
    return null;
  };

  // ---------------------------------------------------------------- rides: a remote rider sits on this client's copy of the horse / gondola / car
  const V1 = new THREE.Vector3(), Q1 = new THREE.Quaternion(), E1 = new THREE.Euler(0, 0, 0, 'YXZ');
  const anchorOf = () => {
    const L = AF.land || {};
    if (AF.mode === 'carousel') { const J = AF.jobs && AF.jobs.carousel, H = L.carousel; const i = J && J.h && H ? H.horses.indexOf(J.h) : -1; return i >= 0 ? AK.carousel * 256 + i : 0; }
    if (AF.mode === 'funride') { const R = AF.rides && AF.rides.cur; return R ? (R.kind === 'wheel' ? AK.wheel * 256 + (R.gi & 255) : AK.coaster * 256) : 0; }
    if (AF.mode === 'ride') return AK.train * 256;
    if (AF.mode === 'ferry-ride') return AK.ferry * 256;
    return 0;
  };
  const objPose = (o, lx, ly, lz, out, yawAdd) => {
    o.updateMatrixWorld(); V1.set(lx, ly, lz).applyMatrix4(o.matrixWorld); o.getWorldQuaternion(Q1); E1.setFromQuaternion(Q1, 'YXZ');
    out.x = V1.x; out.y = V1.y; out.z = V1.z; out.yaw = E1.y + yawAdd; out.pitch = E1.x; out.roll = E1.z; return true;
  };
  // false when this client has no such ride (the rider then shows at their own world position)
  const anchorPose = (k, i, out) => {
    const L = AF.land || {};
    if (k === AK.carousel && L.carousel && L.carousel.horses[i]) { const ok = objPose(L.carousel.horses[i].m, 0, 0, 0, out, PI / 2); out.y += 0.22; out.pitch = out.roll = 0; return ok; }
    if (k === AK.wheel && L.ferris) {
      const FW = L.ferris, a = FW.wheel.rotation.x + i / FW.gonds.length * TAU;
      out.x = FW.WX - Math.cos(a) * (FW.WR - 0.4); out.y = FW.WY + Math.sin(a) * (FW.WR - 0.4) + 0.1 - 0.62 - 1.15; out.z = FW.WZ; out.yaw = PI; out.pitch = out.roll = 0; return true;
    }
    if (k === AK.coaster && L.coaster && L.coaster.cars[0]) return objPose(L.coaster.cars[0], 0, 0.6, -0.1, out, 0);
    if (k === AK.train && AF.train && AF.train.cars && AF.train.cars[0]) { const ok = objPose(AF.train.cars[0], -0.35, 1.15, -1.4, out, 0); out.pitch = out.roll = 0; return ok; }
    if (k === AK.ferry && AF.harbour && AF.harbour.ferry && AF.harbour.ferry.mesh) { const m = AF.harbour.ferry.mesh.position; out.x = m.x; out.y = m.y + 7; out.z = m.z; out.yaw = AF.harbour.ferry.mesh.rotation.y; out.pitch = out.roll = 0; return true; }
    return false;
  };

  // ---------------------------------------------------------------- sending
  const W = new N.Wr(1400), SHOTS = new Float32Array(24 * 7);
  let nShots = 0, seq = 0, sendAt = 0, lastX = 0, lastY = 0, lastZ = 0, sentVeh = null;
  const writeVeh = (w, v) => {
    const k = kindOf(v); w.u32(hashOf(v)); w.u8v(k);
    if (k === VK_CAR) { w.u8v(VV.TYPES.indexOf(v.type)); w.u8v(v.pi | 0); } else { w.u8v(0); w.u8v(0); }
    let f = 0;
    if (k !== VK_PLANE || v.engine) f |= V_ENGINE; if (v.dead) f |= V_DEAD; if (v.burnT > 0) f |= V_BURN; if (v.netOwned) f |= V_SQUAD; if (k !== VK_PLANE || v.onGround) f |= V_GROUND;
    w.u8v(f); w.f32(v.x); w.f32(v.y + (k === VK_CAR ? v.bob || 0 : 0)); w.f32(v.z);
    w.i16(wrap(v.yaw) * 10430); w.i8((v.pitch || 0) * 40); w.i8((v.roll || 0) * 40); w.i16((v.v || 0) * 100); w.i8((v.steer || 0) * 100); w.u8v((v.dmg || 0) * 255);
  };
  const peerNear = (x, z, R) => { for (const p of N.peers.values()) if ((p.x - x) ** 2 + (p.z - z) ** 2 < R * R) return true; return false; };
  // one snapshot of everything this client owns into W; returns its length
  C.build = (now) => {
    const P = AF.player, parts = P.parts, root = P.mesh;
    const w = W.reset();
    seq = (seq + 1) & 0xffff;
    w.u8v(1); w.u8v(N.me); w.u16(seq); w.u32(now);
    const x = root.position.x, y = root.position.y, z = root.position.z, veh = myVeh(), ride = AF.mode === 'passenger' && C.ride.veh, a = anchorOf();
    let fl = 0;
    if (P.visible) fl |= F_VIS; if (parts.sitting) fl |= F_SIT; if ((x - lastX) ** 2 + (y - lastY) ** 2 + (z - lastZ) ** 2 > 900) fl |= F_TP;
    if (P.body && P.body.onGround) fl |= F_GROUND; if (AF.PL.aim) fl |= F_AIM; if (AF.health && AF.health.dead) fl |= F_DEAD;
    lastX = x; lastY = y; lastZ = z;
    w.u8v(MODE_I.get(AF.mode) ?? M.other); w.u8v(fl); w.f32(x); w.f32(y); w.f32(z);
    w.i16(wrap(root.rotation.y) * 10430); w.i8(root.rotation.x * 40); w.i8(root.rotation.z * 40);
    for (let j = 0; j < NJ; j++) w.i8(parts[JP[j]].rotation[JA[j]] * 40);
    w.u8v(parts.hips.position.y * 100); w.u8v((AF.PL.walk && AF.PL.walk.speed || 0) * 10);
    const CB = AF.combat; w.u8v(CB ? Math.max(0, HELD.indexOf(CB.heldId)) : 0);
    w.u8v(((CB ? Math.min(7, CB.stars) : 0) << 5) | Math.round(AF.clamp(AF.health ? AF.health.v / AF.health.max : 1, 0, 1) * 31));
    const inV = veh || ride; w.u32(inV ? hashOf(inV) : 0); w.u8v(ride ? C.ride.seat : 0); w.u8v(a >> 8); w.u8v(a & 255);
    // vehicles: the one I drive and my police (squad cars)
    const vAt = w.o; w.u8v(0); let nv = 0;
    if (veh) { writeVeh(w, veh); nv++; }
    for (const c of VV.cars) if (c.netOwned && c.active !== false && c.net == null && nv < 5 && (c.x - x) ** 2 + (c.z - z) ** 2 < 160000) { writeVeh(w, c); nv++; }
    W.u8[vAt] = nv;
    // fights and police only matter to players nearby
    const near = peerNear(x, z, 320), CR = crowd();
    const nAt = w.o; w.u8v(0); let nn = 0;
    if (near && CR) for (const p of CR.walkers) {
      if (!p.act || !p.agg || nn >= 20) continue;
      const dx = p.x - x, dy = p.y - y, dz = p.z - z; if (dx * dx + dz * dz > 22500) continue;
      const V = CR.V[p.v], A = p.agg; let f = A.f; if (!V || !V.im[f]) f = f === 'runA' || f === 'runB' ? WF[Math.floor(p.ph) & 3] : 'p';
      w.u16(p.id); w.u8v(p.v); w.u8v(Math.max(0, FRAMES.indexOf(f)) | (A.lie ? 128 : 0)); w.i16(dx * 100); w.i16((dy + (A.dy || 0)) * 100); w.i16(dz * 100); w.u8v(((p.yaw % TAU + TAU) % TAU) / TAU * 256);
      nn++;
    }
    W.u8[nAt] = nn;
    const H = CB && CB.heli;
    if (near && H && H.on) { w.u8v(1); w.f32(H.x); w.f32(H.y); w.f32(H.z); w.i16(wrap(H.yaw) * 10430); w.u8v(H.fall ? 1 : 0); } else w.u8v(0);
    const sAt = w.o; w.u8v(0); let ns = 0;
    if (near) for (let i = 0; i < nShots; i++) { const o = i * 7; w.u8v(SHOTS[o]); w.i16((SHOTS[o + 1] - x) * 100); w.i16((SHOTS[o + 2] - y) * 100); w.i16((SHOTS[o + 3] - z) * 100); w.i16((SHOTS[o + 4] - x) * 10); w.i16((SHOTS[o + 5] - y) * 10); w.i16((SHOTS[o + 6] - z) * 10); ns++; }
    W.u8[sAt] = ns; nShots = 0;
    return w.o;
  };
  const sendTick = () => {
    const P = AF.player; if (!P.parts || !P.mesh) return;
    N.mine.x = P.mesh.position.x; N.mine.z = P.mesh.position.z;
    if (!N.live()) { nShots = 0; return; }
    const veh = myVeh();
    if (sentVeh && sentVeh !== veh) { const v = sentVeh; N.send('vleave', { h: hashOf(v), x: v.x, y: v.y, z: v.z, yaw: v.yaw, v: v.v || 0, g: kindOf(v) !== VK_PLANE || !!v.onGround }); }
    sentVeh = veh;
    const now = performance.now(); if (now - sendAt < 1000 / N.rate - 4) return;
    sendAt = now;
    N.fast(W.u8, C.build(now), seq);
  };
  const onShot = (wid, mx, my, mz, ex, ey, ez, hit) => {
    if (!N.live() || nShots >= 24) return;
    const o = nShots++ * 7; SHOTS[o] = (wid & 15) | ((hit & 3) << 4); SHOTS[o + 1] = mx; SHOTS[o + 2] = my; SHOTS[o + 3] = mz; SHOTS[o + 4] = ex; SHOTS[o + 5] = ey; SHOTS[o + 6] = ez;
  };

  // ---------------------------------------------------------------- receiving
  const RD = new N.Rd(), PV = new Float32Array(PT.length), VVb = new Float32Array(VT.length), NV = new Float32Array(NT.length), HV = new Float32Array(HT.length);
  C.ingest = (u8, from) => {
    if (u8[0] !== 1) return;
    const r = RP.get(from); if (!r) return;
    const R = RD.set(u8); R.u8v(); R.u8v(); R.u16(); const stamp = R.u32(), now = performance.now();
    if (r.tr.len && stamp < r.tr.t[0]) { C.stats.stale++; return; }
    clockIn(r.clk, stamp, now); C.stats.rx++;
    const mode = R.u8v(), fl = R.u8v(), x = R.f32(), y = R.f32(), z = R.f32();
    if (Math.abs(x) > 6000 || Math.abs(z) > 6000 || Math.abs(y) > 3000) return;
    PV[0] = x; PV[1] = y; PV[2] = z; PV[3] = R.i16() / 10430; PV[4] = R.i8() / 40; PV[5] = R.i8() / 40;
    for (let j = 0; j < NJ; j++) PV[6 + j] = R.i8() / 40;
    PV[P_HIPS] = R.u8v() / 100; PV[P_SPD] = R.u8v() / 10; PV[P_WPN] = R.u8v(); PV[P_STAT] = R.u8v();
    const vh = R.u32(); PV[P_VLO] = vh & 0xffff; PV[P_VHI] = vh >>> 16; PV[P_SEAT] = R.u8v(); PV[P_AK] = R.u8v(); PV[P_AI] = R.u8v();
    PV[P_MODE] = mode < MODES.length ? mode : M.other; PV[P_FLAGS] = fl;
    if (fl & F_TP) r.tr.clear();
    r.tr.push(stamp, PV); r.last = now;
    const peer = N.peers.get(from); if (peer) { peer.x = x; peer.z = z; }
    const nv = R.u8v();
    for (let i = 0; i < nv && i < 8; i++) {
      const h = R.u32(), kind = R.u8v(), type = R.u8v(), paint = R.u8v(), vf = R.u8v();
      VVb[0] = R.f32(); VVb[1] = R.f32(); VVb[2] = R.f32(); VVb[3] = R.i16() / 10430; VVb[4] = R.i8() / 40; VVb[5] = R.i8() / 40; VVb[6] = R.i16() / 100; VVb[7] = R.i8() / 100; VVb[8] = R.u8v(); VVb[9] = vf;
      if (Math.abs(VVb[0]) > 6000 || Math.abs(VVb[2]) > 6000 || VVb[1] < -500 || VVb[1] > 3000) continue;
      const e = vehicleFor(h, kind, type, paint, from); if (!e) continue;
      if ((VVb[0] - e.obj.x) ** 2 + (VVb[2] - e.obj.z) ** 2 > 2500 && e.tr.len && stamp > e.tr.t[e.tr.len - 1]) e.tr.clear();
      e.tr.push(stamp, VVb); e.last = now; e.squad = !!(vf & V_SQUAD);
    }
    const nn = R.u8v();
    for (let i = 0; i < nn && i < 24; i++) {
      const id = R.u16(), look = R.u8v(), fr = R.u8v();
      NV[0] = x + R.i16() / 100; NV[1] = y + R.i16() / 100; NV[2] = z + R.i16() / 100; NV[3] = R.u8v() / 256 * TAU; NV[4] = look; NV[5] = fr;
      if (id < 4096) npcIn(from, id, stamp, now);
    }
    if (R.u8v()) {
      HV[0] = R.f32(); HV[1] = R.f32(); HV[2] = R.f32(); HV[3] = R.i16() / 10430; HV[4] = R.u8v();
      if (Math.abs(HV[0] - x) < 1500 && Math.abs(HV[2] - z) < 1500 && HV[1] > -500 && HV[1] < 3000) {
        if (!r.heli) r.heli = { tr: new Track(HT, 8), out: new Float32Array(HT.length), grp: null, last: 0, x: 0, y: -1e4, z: 0 };
        r.heli.tr.push(stamp, HV); r.heli.last = now;
      }
    }
    const ns = R.u8v();
    for (let i = 0; i < ns && i < 32; i++) {
      const k = R.u8v(), mx = x + R.i16() / 100, my = y + R.i16() / 100, mz = z + R.i16() / 100, ex = x + R.i16() / 10, ey = y + R.i16() / 10, ez = z + R.i16() / 10;
      playShot(k & 15, k >> 4, mx, my, mz, ex, ey, ez, now);
    }
  };
  N.onFast(C.ingest);
  let sndAt = 0;
  const playShot = (wid, hit, mx, my, mz, ex, ey, ez, now) => {
    const FX = AF.fx; if (!FX || !FX.glow) return;
    const cp = AF.camera.position; if ((mx - cp.x) ** 2 + (mz - cp.z) ** 2 > 250000) return;
    FX.burst('flash', mx, my, mz, 1, { size: wid === 2 ? 0.9 : 0.6 }); FX.line(mx, my, mz, ex, ey, ez);
    if (hit === 1) FX.burst('dust', ex, ey, ez, 2); else if (hit === 2) FX.burst('hit', ex, ey, ez, 1); else if (hit === 3) FX.burst('spark', ex, ey, ez, 3, { spread: 4 });
    if (now - sndAt > 40) { sndAt = now; AF.sfx.play(SND[wid] || 'shot', mx, mz); }
  };

  // ---------------------------------------------------------------- remote vehicles: this client's copy of the car / plane / ski, driven by snapshots
  const takeOver = (v, owner, kind) => {
    v.net = owner; v.keep = true;
    if (kind === VK_CAR) {
      if (v.ai) { VV.detachTraffic(v); const i = VV.ai.indexOf(v); if (i >= 0) VV.ai.splice(i, 1); v.ai = null; }
      v.driver = -1; v.parked = false; v.pushLife = 0; v.burnT = 0;
    } else if (kind === VK_PLANE) v.ghost = false;
  };
  const vehicleFor = (h, kind, type, paint, owner) => {
    let e = RV.get(h);
    if (e && e.obj.active === false) { RV.delete(h); e = null; }
    // one owner per vehicle: another sender's claim waits until the current driver's entry is released
    if (e) return e.owner === owner ? e : null;
    if (kind < VK_CAR || kind > VK_SKI) return null;
    let n = 0; for (const q of RV.values()) if (q.owner === owner) n++;
    if (n >= 6) return null;   // the driven vehicle + 5 squad cars
    let v = findVeh(h), created = false;
    // I'm driving my own copy of it: theirs is shown as a second car
    if (v && (v === myVeh() || (v.net != null && v.net !== owner))) v = null;
    if (v && kindOf(v) !== kind) v = null;
    if (!v && kind === VK_CAR && VV.TYPES[type]) { v = VV.makeCar(VV.TYPES[type].id, paint & 15, VVb[0], VVb[2], VVb[3], { y: VVb[1] }); v.temp = true; v.netHash = h; created = true; }
    if (!v) return null;
    takeOver(v, owner, kind);
    e = { h, owner, kind, obj: v, tr: new Track(VT, 10), out: new Float32Array(VT.length), created, last: 0, squad: false, puff: 0 };
    RV.set(h, e);
    return e;
  };
  // cars made for a remote driver that they parked (vleave): kept like any runtime car, at most 6 at a time
  const KEPT = [];
  const releaseVeh = (e, m) => {
    if (RV.get(e.h) === e) RV.delete(e.h);
    const v = e.obj; v.net = null; v.keep = false;
    if (m) { v.x = m.x; v.y = m.y; v.z = m.z; v.yaw = m.yaw; }
    if (e.kind === VK_CAR) {
      // squad cars, and cars made for a driver who simply went quiet, leave with their owner
      if (e.created && (e.squad || (!m && C.ride.veh !== v))) { VV.removeCar(v); return; }
      v.v = v.vx = v.vz = 0; v.parked = true; VV.placeMesh(v); if (v.interact) v.sync();
      if (e.created) {
        v.temp = true; KEPT.push(v);
        while (KEPT.length > 6) { const o = KEPT.shift(); if (o.active !== false && o.net == null && o !== myVeh() && o !== C.ride.veh) VV.removeCar(o); }
      }
    } else if (e.kind === VK_PLANE) {
      if (m && !m.g) { v.ghost = true; v.v = Math.max(18, num(m.v, 0, 200) ? m.v : 25); } else { v.v = 0; v.engine = false; v.throttle = 0; }
      if (AF.planes.place) AF.planes.place(v);
    } else { v.v = 0; v.sync(); }
    if (C.ride.veh === v) toast('The driver got out \u2014 ' + (AF.touch ? 'EXIT to get out too.' : 'F to take the wheel, E to get out.'));
  };
  const applyVeh = (e, now, dt) => {
    const r = RP.get(e.owner);
    if (!r || now - e.last > 2500 || e.obj.active === false) { releaseVeh(e, null); return; }
    const o = e.out; if (e.tr.sample(renderT(r.clk, now), o, 250) < 0) return;
    const v = e.obj, f = o[9] | 0;
    v.x = o[0]; v.y = o[1]; v.z = o[2]; v.yaw = o[3]; v.pitch = o[4]; v.roll = o[5]; v.v = o[6];
    if (e.kind === VK_CAR) {
      v.steer = o[7]; v.dmg = o[8] / 255; v.bob = 0; v.vx = Math.sin(v.yaw) * v.v; v.vz = Math.cos(v.yaw) * v.v; v.pushLife = 0; v.parked = false;
      if ((f & V_DEAD) && !v.dead) { v.dead = true; v.deadT = AF.clock.t; v.dmg = 1; }
      if ((f & V_BURN || v.dmg > 0.5) && (e.puff -= dt) <= 0) { e.puff = 0.15; AF.fx.burst(f & V_BURN ? 'fire' : 'smoke', v.x + Math.sin(v.yaw) * (v.halfL - 0.7), v.y + 1, v.z + Math.cos(v.yaw) * (v.halfL - 0.7), 1); }
      if (v.interact) v.sync();
    } else if (e.kind === VK_PLANE) {
      v.engine = !!(f & V_ENGINE); v.onGround = !!(f & V_GROUND); v.ghost = false;
      if (AF.planes.place) AF.planes.place(v);
      if (v.engine) { v.spin += dt * (8 + Math.min(60, Math.abs(v.v))); for (const p of v.props) p.rotation.z = v.spin; }
    } else v.sync();
  };

  // ---------------------------------------------------------------- remote peds (engaged / police): proxies from 55-people's net pool
  const npcIn = (owner, id, stamp, now) => {
    const key = owner * 4096 + id; let e = RN.get(key);
    const CR = crowd(); if (!CR || NV[4] >= CR.V.length) return;
    if (!e) {
      let w = null; for (const q of CR.walkers) if (q.net && !q.netEntry) { w = q; break; }
      if (!w) return;
      e = { key, owner, id, w, tr: new Track(NT, 8), out: new Float32Array(NT.length), last: 0 }; w.netEntry = e; RN.set(key, e);
    }
    e.tr.push(stamp, NV); e.last = now;
  };
  const freeNpc = (e) => { RN.delete(e.key); e.w.act = false; e.w.netEntry = null; };
  const applyNpcs = (now) => {
    for (const e of RN.values()) {
      const r = RP.get(e.owner);
      if (!r || now - e.last > 1200) { freeNpc(e); continue; }
      const o = e.out; if (e.tr.sample(renderT(r.clk, now), o, 250) < 0) continue;
      const w = e.w, fr = o[5] | 0;
      w.x = o[0]; w.y = o[1]; w.z = o[2]; w.yaw = o[3]; w.v = w.vd = w.vn = o[4] | 0; w.nf = FRAMES[fr & 15] || 'p'; w.lie = !!(fr & 128); w.s = 1; w.act = true;
    }
  };

  // ---------------------------------------------------------------- remote players: pose, seat, ride, held item, the autogyro
  const applyPlayer = (r, now, dt) => {
    const o = r.out, st = r.tr.sample(renderT(r.clk, now), o, 250);
    if (st < 0) return;
    if (st === 1) C.stats.extrap++;
    ensureAvatar(r);
    const P = r.P, root = P.root, fl = o[P_FLAGS] | 0, mode = o[P_MODE] | 0;
    r.mode = mode; r.stars = (o[P_STAT] | 0) >> 5; r.hp = ((o[P_STAT] | 0) & 31) / 31; r.dead = !!(fl & F_DEAD);
    r.veh = (((o[P_VHI] | 0) << 16) | (o[P_VLO] | 0)) >>> 0; r.seat = o[P_SEAT] | 0; r.ak = o[P_AK] | 0; r.ai = o[P_AI] | 0;
    AF.avatar.sit(P, !!(fl & F_SIT), 0.6);
    for (let j = 0; j < NJ; j++) P[JP[j]].rotation[JA[j]] = o[6 + j];
    P.hips.position.y = o[P_HIPS];
    let vis = !!(fl & F_VIS);
    const v = r.veh ? vehByHash(r.veh) : null;
    if (v) {
      const k = kindOf(v);
      if (k === VK_PLANE) { vis = false; root.position.set(v.x, v.y + 1, v.z); }
      else { seatPose(v, k, seatOf(v, k, r.seat), POSE); root.position.set(POSE.x, POSE.y, POSE.z); root.rotation.set(POSE.pitch, POSE.yaw, POSE.roll, 'YXZ'); }
    } else { root.position.set(o[0], o[1], o[2]); root.rotation.set(o[4], o[3], o[5], 'YXZ'); }
    if (r.ak && !v) vis = true;   // ride anchors: placed after the rides move (coop-late)
    const cp = AF.camera.position, d2 = (root.position.x - cp.x) ** 2 + (root.position.z - cp.z) ** 2;
    root.visible = vis && d2 < 250000;
    setHeld(r, HELD[o[P_WPN] | 0] || null);
    r.x = root.position.x; r.y = root.position.y; r.z = root.position.z; r.seen = true;
    const T = r.tg; T.x = r.x; T.y = r.y; T.z = r.z; T.speed = o[P_SPD]; T.away = r.dead || !(mode === M.walk || mode === M.drive || mode === M.passenger || mode === M.jetski);
    // the remote autogyro (their 3+ star wanted level)
    const H = r.heli;
    if (H) {
      if (now - H.last > 2000) { if (H.grp) H.grp.visible = false; H.y = -1e4; }
      else {
        if (!H.grp) { const src = AF.combat && AF.combat.heli && AF.combat.heli.grp; if (src) { H.grp = src.clone(); H.grp.name = 'coop-autogyro'; AF.scene.add(H.grp); } }
        const ho = H.out; if (H.grp && H.tr.sample(renderT(r.clk, now), ho, 250) >= 0) {
          H.x = ho[0]; H.y = ho[1]; H.z = ho[2];
          H.grp.position.set(ho[0], ho[1], ho[2]); H.grp.rotation.set(0.12, ho[3], 0, 'YXZ'); H.grp.visible = true;
          if (H.grp.children[1]) H.grp.children[1].rotation.y += dt * 22;
        }
      }
    }
  };
  const lateAnchors = () => {
    for (const r of RP.values()) {
      if (!r.ak || !r.P || r.veh) continue;
      if (anchorPose(r.ak, r.ai, POSE)) { const root = r.P.root; root.position.set(POSE.x, POSE.y, POSE.z); root.rotation.set(POSE.pitch, POSE.yaw, POSE.roll, 'YXZ'); r.x = POSE.x; r.y = POSE.y; r.z = POSE.z; }
    }
  };

  // ---------------------------------------------------------------- riding along (passenger seat of another player's car, bike, plane or jet ski)
  const PR = C.ride = { veh: null, kind: 0, seat: 1, chase: new AF.Vehicle.Chase(), carO: { seatH: 0.45, lean: 0.1 }, bikeO: { seatH: 0.7, lean: 0.35 }, skiO: { seatH: 0.55, lean: 0.35 } };
  const seatTaken = (h) => { for (const r of RP.values()) if (r.veh === h && r.seat === 1) return true; return false; };
  AF.modes.passenger = {
    enter(o = {}) {
      const v = o.veh; if (!v) { AF.setMode('walk'); return; }
      PR.veh = v; PR.kind = kindOf(v); PR.seat = 1;
      const plane = PR.kind === VK_PLANE, big = v.type && v.type.big, L = PR.kind === VK_CAR ? VV.seatLocal(v) : null;
      const eye = PR.kind === VK_CAR ? (isBike(v) ? [0, L[1] + 1.45, L[2] - 0.55] : [-L[0], L[1] + 1.0, L[2] + 0.1]) : PR.kind === VK_SKI ? [0, 1.5, -0.7] : [0, v.G ? v.G.h * 0.62 : 2, 0];
      PR.chase.set({ dist: plane ? 9 + (v.G ? v.G.halfL * 1.3 : 6) : big ? 13 : PR.kind === VK_SKI ? 6.4 : 8.5, height: plane ? 2.5 : 1.3 + (big ? 1.2 : 0), shadow: plane ? 90 : 60, eye });
      AF.player.setVisible(!plane);
      const d = RP.get(v.net); N.send('seat', { h: hashOf(v), s: 1 });
      toast('You hop in' + (d ? ' with ' + d.peer.name : '') + '. ' + (AF.touch ? 'EXIT to get out.' : 'E to get out.'));
      AF.emit('hint', AF.touch ? '' : 'Mouse look \u00b7 C camera \u00b7 E get out');
    },
    exit() { PR.veh = null; AF.PL.seat = null; AF.player.setVisible(true); AF.emit('hud', { speed: null }); AF.emit('hint', ''); },
    update() {
      const v = PR.veh, I = AF.input; if (!v || (AF.ui.modalOpen && AF.ui.modalOpen())) return;
      if (I.hit('KeyF') && v.net == null) { takeWheel(); return; }
      if (I.hit('KeyE') || I.hit('KeyF')) getOut(false);
    },
  };
  const ridePlace = (dt) => {
    const v = PR.veh; if (!v) return;
    if (v.active === false) { getOut(true); return; }
    const P = AF.player;
    if (PR.kind !== VK_PLANE) {
      const S = AF.Vehicle.seat(v, seatOf(v, PR.kind, 1), PR.kind === VK_SKI ? PR.skiO : isBike(v) ? PR.bikeO : PR.carO);
      if (PR.kind === VK_SKI) S.pitch = -(v.pitch || 0);
      P.x = P.body.x = S.x; P.y = P.body.y = S.y; P.z = P.body.z = S.z;
    } else { AF.PL.seat = null; P.x = P.body.x = v.x; P.y = P.body.y = v.y; P.z = P.body.z = v.z; }
    P.body.vy = 0;
    PR.chase.update(dt, v.x, v.y, v.z, v.yaw, PR.kind === VK_PLANE ? 0 : v.pitch || 0, v.roll || 0);
    AF.Vehicle.hud(v.v || 0, v.name, ' \u00b7 passenger');
  };
  const getOut = (force) => {
    const v = PR.veh; if (!v) { AF.setMode('walk'); return; }
    const sp = Math.abs(v.v || 0), s = Math.sin(v.yaw), c = Math.cos(v.yaw);
    if (PR.kind === VK_PLANE && !(v.onGround && sp < 4)) {
      const h = v.y - AF.W.groundY(v.x, v.z), d = (v.G ? v.G.halfW : 3) + 1.5;
      if (h > 35) { AF.setMode('skydive', { x: v.x - c * d, y: v.y - 1, z: v.z + s * d, yaw: v.yaw, vx: s * sp * 0.6, vz: c * sp * 0.6, vy: 0 }); return; }
      if (!force) { toast('Too low to jump \u2014 climb above 35 m or wait for the landing.'); return; }
    }
    if (sp > 4 && !force) { toast('Wait until you slow down!'); return; }
    let spot = null;
    if (PR.kind === VK_CAR) {
      const lx = -(v.halfW + 0.7), x = v.x + lx * c + 0.4 * s, z = v.z - lx * s + 0.4 * c, y = AF.surfaceBelow(x, z, v.y + 1.5, 4);
      if (Number.isFinite(y) && !AF.boxBlocked(x, y + 0.05, z, 0.3, 1.7)) spot = { x, y, z };
    } else if (PR.kind === VK_PLANE) { const d = Math.min(v.G ? v.G.halfW : 3, 3) + 1.2; spot = { x: v.x - c * d, y: undefined, z: v.z + s * d }; }
    if (!spot) spot = AF.Vehicle.landing(v.x, v.z, PR.kind === VK_SKI ? AF.PLAN.harbour.waterY + 0.35 : -60, v.y + 4, 10);
    if (!spot) { if (!force) { toast('Pull up beside dry land to get out.'); return; } spot = { x: v.x + 2, y: v.y + 1, z: v.z }; }
    AF.setMode('walk', { x: spot.x, y: spot.y, z: spot.z, yaw: v.yaw });
  };
  const takeWheel = () => {
    const v = PR.veh, k = PR.kind;
    if (k === VK_CAR) AF.setMode('drive', { car: v }); else if (k === VK_PLANE) AF.setMode('fly', { plane: v }); else if (k === VK_SKI) AF.setMode('jetski', { ski: v });
  };
  C.getOut = getOut;
  // 'Ride with ...' follows the nearest vehicle another player is driving (slow, with a free seat)
  const rideIt = AF.addInteract({ x: 0, y: -999, z: 0, r: 2.4, prio: 0.05, label: 'Ride along', target: null,
    dist: (px, pz) => { const v = rideIt.target; if (!v) return 99; return kindOf(v) === VK_CAR ? VV.bodyDist(v, px, pz) : Math.max(0, Math.hypot(v.x - px, v.z - pz) - (v.G ? Math.min(3, v.G.halfW) : 1.5)); },
    can: () => AF.mode === 'walk' && !!rideIt.target && rideIt.target.net != null,
    act: () => { const v = rideIt.target; if (v) AF.setMode('passenger', { veh: v }); } });
  let rideT = 0;
  const rideScan = (dt) => {
    if ((rideT -= dt) > 0) return; rideT = 0.2;
    let best = null, bd = 100; const p = AF.player;
    if (AF.mode === 'walk') for (const e of RV.values()) {
      const v = e.obj; if (e.squad || Math.abs(v.v || 0) > 3 || seatTaken(e.h)) continue;
      const d = (v.x - p.x) ** 2 + (v.z - p.z) ** 2; if (d < bd) { bd = d; best = e; }
    }
    rideIt.target = best ? best.obj : null;
    if (best) { const r = RP.get(best.owner); rideIt.x = best.obj.x; rideIt.z = best.obj.z; rideIt.y = best.obj.y + 1; rideIt.label = 'Ride with ' + (r ? r.peer.name : 'your friend'); }
    else rideIt.y = -999;
  };

  // ---------------------------------------------------------------- combat hooks (77-combat): hits on things another player owns go to the owner
  const CB = AF.combat;
  if (CB) {
    CB.onShot = onShot;
    CB.peerTarget = (slot) => { const r = RP.get(slot); return r && r.seen ? r.tg : null; };
    CB.hurtPeer = (slot, dmg, src, px, pz) => { if (RP.has(slot)) N.send('hurt', { dmg: Math.round(dmg), src, px, pz }, slot); };
    CB.onNetPed = (w, dmg, kind, fx, fz, innocent) => {
      const e = w.netEntry; if (!e) return;
      N.send('hit', { id: e.id, dmg: Math.round(dmg), k: kind, fx, fz }, e.owner);
      if (!innocent) CB.crime(AF.G.heat.assault);
    };
    CB.onNetCar = (car, n) => { if (RP.has(car.net)) N.send('vhit', { h: hashOf(car), dmg: Math.round(n) }, car.net); };
    CB.onBoom = (car) => { if (N.live()) N.send('boom', { x: car.x, y: car.y, z: car.z, h: hashOf(car) }); };
    CB.hitPeer = (obj, dmg, kind, fx, fz) => {
      if (obj.heli) N.send('heli', { dmg: Math.round(dmg) }, obj.slot);
      else if (C.pvp) N.send('hurt', { dmg: Math.round(dmg), src: 'pvp', px: fx * 2, pz: fz * 2 }, obj.slot);
    };
    CB.rayPeers = (ox, oy, oz, dx, dy, dz, t0, HIT, rayCapsule, raySphere) => {
      for (const r of RP.values()) {
        if (C.pvp && r.P && r.P.root.visible && !r.dead) { const t = rayCapsule(ox, oy, oz, dx, dy, dz, r.x, r.y, r.z, 1.75, 0.35); if (t > t0 && t < HIT.t) { HIT.t = t; HIT.kind = 'peer'; HIT.obj = r.hit; } }
        const H = r.heli; if (H && H.grp && H.grp.visible) { const t = raySphere(ox, oy, oz, dx, dy, dz, H.x, H.y + 1, H.z, 3); if (t > t0 && t < HIT.t) { HIT.t = t; HIT.kind = 'peer'; HIT.obj = r.heliHit; } }
      }
    };
    CB.meleePeer = (px, py, pz, fx, fz, maxD, dmg) => {
      if (!C.pvp) return false;
      for (const r of RP.values()) {
        if (!r.P || !r.P.root.visible || r.dead || Math.abs(r.y - py) > 1.4) continue;
        const dx = r.x - px, dz = r.z - pz, d = Math.hypot(dx, dz);
        if (d > maxD || (d > 0.4 && (dx * fx + dz * fz) / d < 0.35)) continue;
        N.send('hurt', { dmg, src: 'pvp', px: fx * 3, pz: fz * 3 }, r.slot); FX_hit(r.x, r.y + 1.3, r.z); return true;
      }
      return false;
    };
  }
  const FX_hit = (x, y, z) => { if (AF.fx && AF.fx.glow) AF.fx.burst('hit', x, y, z, 1); };

  // ---------------------------------------------------------------- reliable events
  const timeMsg = () => ({ h: AF.time.hours, sp: AF.time.speed, p: !!AF.time.paused });
  const applyTime = (t) => {
    if (!t || !num(t.h, 0, 24)) return;
    const d = ((t.h - AF.time.hours + 36) % 24) - 12;
    AF.time.hours = Math.abs(d) > 0.25 ? t.h : (AF.time.hours + d * 0.5 + 24) % 24;
    if (num(t.sp, 0, 1)) AF.time.speed = t.sp; AF.time.paused = !!t.p;
  };
  const myOwned = (h) => { const v = myVeh(); if (v && hashOf(v) === h) return v; for (const c of VV.cars) if (c.netOwned && c.active !== false && hashOf(c) === h) return c; return null; };
  const npcNear = (owner, R) => {
    const p = AF.player.mesh ? AF.player.mesh.position : AF.player;
    for (const e of RN.values()) if (e.owner === owner && (e.w.x - p.x) ** 2 + (e.w.z - p.z) ** 2 < R * R) return true;
    return false;
  };
  N.on('hit', (m, from) => {
    const CR = crowd(), r = RP.get(from);
    if (!CR || !r || !CB || !num(m.id, 0, 4095) || !num(m.dmg, 0, 200) || !HIT_KINDS.has(m.k)) return;
    const w = CR.walkers[m.id]; if (!w || w.net || !w.act || (w.x - r.x) ** 2 + (w.z - r.z) ** 2 > 40000) return;
    CB.netHitPed(w, m.dmg, m.k, num(m.fx, -1, 1) ? m.fx : 0, num(m.fz, -1, 1) ? m.fz : 0, from);
  });
  N.on('hurt', (m, from) => {
    const r = RP.get(from); if (!r || !num(m.dmg, 0, 120) || !AF.health) return;
    const src = m.src === 'pvp' || m.src === 'melee' ? m.src : 'shot';
    // without friendly fire only the sender's peds / police can hurt me, and only when one of them is near me
    if (src === 'pvp' ? !C.pvp : !npcNear(from, 90)) return;
    const now = performance.now(); r.hb = Math.min(160, (r.hb ?? 160) + (now - (r.hbT || now)) * 0.12); r.hbT = now;
    if (m.dmg > r.hb) return; r.hb -= m.dmg;
    AF.health.hurt(m.dmg, src);
    if (AF.mode === 'walk' && num(m.px, -30, 30) && num(m.pz, -30, 30)) AF.PL.push(m.px, m.pz);
  });
  N.on('vhit', (m, from) => {
    const v = RP.has(from) && num(m.dmg, 0, 150) && myOwned(m.h >>> 0);
    if (v && CB && (v.netOwned || C.pvp)) CB.dmgCar(v, m.dmg, false);
  });
  N.on('heli', (m, from) => { if (RP.has(from) && num(m.dmg, 0, 200) && CB && CB.heliHit) CB.heliHit(m.dmg, true); });
  N.on('boom', (m, from) => {
    const r = RP.get(from);
    if (!r || !num(m.x, -6000, 6000) || !num(m.y, -500, 3000) || !num(m.z, -6000, 6000)) return;
    const now = performance.now(); if (now - (r.boomT || 0) < 400 || (m.x - r.x) ** 2 + (m.z - r.z) ** 2 > 90000) return;
    r.boomT = now;
    const cp = AF.camera.position; if ((m.x - cp.x) ** 2 + (m.z - cp.z) ** 2 > 640000) return;
    AF.fx.boom(m.x, m.y, m.z);
    if (CB) CB.blast(m.x, m.y, m.z, AF.G.boomR, false, true);
    // my copy of the same car becomes the same wreck
    for (const c of VV.cars) if (!c.player && c.net == null && !c.dead && hashOf(c) === m.h >>> 0 && (c.x - m.x) ** 2 + (c.z - m.z) ** 2 < 900) { c.dead = true; c.deadT = AF.clock.t; c.dmg = 1; c.temp = true; c.x = m.x; c.z = m.z; VV.placeMesh(c); break; }
  });
  N.on('vleave', (m, from) => {
    const e = RV.get(m.h >>> 0); if (!e || e.owner !== from) return;
    const ok = num(m.x, -6000, 6000) && num(m.y, -500, 3000) && num(m.z, -6000, 6000) && num(m.yaw, -10, 10);
    releaseVeh(e, ok ? m : null);
  });
  N.on('seat', (m, from) => {
    const r = RP.get(from), mine = myVeh(); if (!r || !mine || hashOf(mine) !== m.h >>> 0 || m.s !== 1) return;
    for (const q of RP.values()) if (q !== r && q.veh === m.h >>> 0 && q.seat === 1) { N.send('seatno', { h: m.h }, from); return; }
    toast(r.peer.name + ' hopped in.');
  });
  N.on('seatno', (m) => { if (AF.mode === 'passenger' && PR.veh && hashOf(PR.veh) === m.h >>> 0) { getOut(true); toast('Someone beat you to that seat.'); } });
  N.on('look', (m, from) => {
    const r = RP.get(from); if (!r) return;
    const B = AF.friends.byId;
    if (typeof m.friend === 'string' && Object.hasOwn(B, m.friend) && m.friend !== r.peer.friend) { hideNpc(r.peer.friend, false); r.peer.friend = m.friend; r.peer.name = B[m.friend].name; hideNpc(m.friend, true); }
    r.peer.look = N.cleanLook(m.look, B[r.peer.friend].look);
  });
  N.on('pvp', (m, from) => { if (from === 0 && N.role === 'guest') { C.pvp = !!m.on; if (CB) CB.pvp = C.pvp; toast(C.pvp ? 'Friendly fire is ON.' : 'Friendly fire is off.'); } });
  N.on('time', (m, from) => { if (from === 0 && N.role === 'guest') applyTime(m); });
  N.on('join', (p) => { addRemote(p); toast(p.name + ' joined.'); });
  N.on('left', (p) => { removeRemote(p.slot); toast(p.name + ' left.'); });
  N.on('end', (why) => { for (const slot of [...RP.keys()]) removeRemote(slot); if (AF.mode === 'passenger') getOut(true); C.pvp = false; if (CB) CB.pvp = false; if (why) toast(why); });
  N.on('hosting', (code) => toast('Hosting co-op \u2014 code ' + code + '. Esc \u2192 Co-op to share the invite link.'));
  N.on('welcome', (m) => {
    const x = m.extra || {};
    C.pvp = !!x.pvp; if (CB) CB.pvp = C.pvp; applyTime(x.time);
    for (const p of N.peers.values()) addRemote(p);
    const host = N.peers.get(0), name = host ? host.name : 'your friend';
    if (AF.ui.titleOpen && AF.ui.titleOpen()) AF.ui.start();
    const H = x.pos;
    if (H && num(H.x, -6000, 6000) && num(H.y, -500, 3000) && num(H.z, -6000, 6000)) {
      const a = Math.random() * TAU, px = H.x + Math.sin(a) * 2.5, pz = H.z + Math.cos(a) * 2.5;
      const go = () => { const y = AF.surfaceBelow(px, pz, H.y + 3, 40); AF.setMode('walk', { x: px, y: Number.isFinite(y) ? y : H.y, z: pz, yaw: a + PI, snap: true }); };
      if (AF.stream && AF.stream.travel) AF.stream.travel({ label: name, go }); else go();
    }
    toast('You joined ' + name + '\u2019s Port Solace.');
  });
  const myLook = (id) => (AF.save && AF.save.looks && AF.save.looks[id]) || (AF.friends.byId[id] && AF.friends.byId[id].look);
  N.hello = () => {
    const id = AF.friends.current ? AF.friends.current.id : AF.ui.pick && AF.ui.pick(), F = AF.friends.byId[id];
    return { name: F ? F.name : 'Friend', friend: id, look: AF.friends.current ? AF.player.look : myLook(id), x: N.mine.x, z: N.mine.z };
  };
  N.welcomeExtra = () => { const m = AF.player.mesh ? AF.player.mesh.position : AF.player; return { pvp: C.pvp, time: timeMsg(), pos: { x: m.x, y: m.y, z: m.z } }; };
  let lookT = 0;
  const sendLook = () => { if (N.live() && AF.friends.current) N.send('look', { friend: AF.friends.current.id, look: AF.player.look }); };
  AF.on('look', () => { lookT = 0.5; });
  AF.on('friend', () => { lookT = 0.5; for (const r of RP.values()) hideNpc(r.peer.friend, true); });
  C.setPvp = (on) => { if (N.role !== 'host') return; C.pvp = !!on; if (CB) CB.pvp = C.pvp; N.send('pvp', { on: C.pvp }); };
  C.goTo = (slot) => {
    const r = RP.get(slot); if (!r || !r.seen) return;
    const a = Math.random() * TAU, px = r.x + Math.sin(a) * 2.5, pz = r.z + Math.cos(a) * 2.5;
    const go = () => { const y = AF.surfaceBelow(px, pz, r.y + 3, 40); AF.setMode('walk', { x: px, y: Number.isFinite(y) ? y : r.y, z: pz, yaw: a + PI, snap: true }); };
    if (AF.stream && AF.stream.travel) AF.stream.travel({ label: r.peer.name, go }); else go();
  };

  // ---------------------------------------------------------------- ticks: apply after the local mode (150) and combat (151), before traffic draws cars (200)
  let timeT = 0;
  AF.onTick('coop', 155, (dt) => {
    if (!RP.size && !RV.size && !RN.size) { if (PR.veh) ridePlace(dt); return; }
    const now = performance.now();
    for (const e of RV.values()) applyVeh(e, now, dt);
    for (const r of RP.values()) applyPlayer(r, now, dt);
    applyNpcs(now);
    if (PR.veh) ridePlace(dt);
    rideScan(dt);
    if (N.role === 'host' && (timeT -= dt) <= 0) { timeT = 2; N.send('time', timeMsg()); }
    if (lookT > 0 && (lookT -= dt) <= 0) sendLook();
  });
  AF.onTick('coop-late', 341, () => { if (RP.size) lateAnchors(); });
  AF.onTick('coop-send', 990, () => { if (N.role !== 'off') sendTick(); });

  // ---------------------------------------------------------------- name tags + map dots
  const TAG = new THREE.Vector3();
  AF.onTick('coop-tags', 952, () => {
    if (!RP.size) return;
    const cam = AF.camera, W2 = innerWidth, H2 = innerHeight;
    for (const r of RP.values()) {
      const d2 = r.seen ? (r.x - cam.position.x) ** 2 + (r.y - cam.position.y) ** 2 + (r.z - cam.position.z) ** 2 : 1e12;
      let on = d2 < 22500 && !(AF.ui.modalOpen && AF.ui.modalOpen());
      if (on) { TAG.set(r.x, r.y + (r.P && r.P.sitting ? 1.75 : 2.15), r.z).project(cam); on = TAG.z < 1 && Math.abs(TAG.x) < 1.05 && Math.abs(TAG.y) < 1.05; }
      if (!on) { if (r.tag.style.display !== 'none') r.tag.style.display = 'none'; continue; }
      const key = r.peer.name + r.stars + (r.dead ? 'd' : '');
      if (key !== r.tagKey) { r.tagKey = key; r.tag.innerHTML = '<i style="background:' + COLORS[r.slot & 3] + '"></i>' + r.peer.name.replace(/[&<>"]/g, '') + (r.stars ? '<b>' + '\u2605'.repeat(r.stars) + '</b>' : '') + (r.dead ? ' \u00b7 down' : ''); }
      const x = Math.round((TAG.x + 1) / 2 * W2), y = Math.round((1 - TAG.y) / 2 * H2);
      if (x !== r.tagX || y !== r.tagY) { r.tagX = x; r.tagY = y; r.tag.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-100%)'; }
      if (r.tag.style.display !== 'block') r.tag.style.display = 'block';
    }
  });
  AF.on('ready', () => {
    const map = AF.ui && AF.ui.map; if (!map) return;
    const dot = (g, p, rad, slot, label) => {
      g.fillStyle = COLORS[slot & 3]; g.strokeStyle = '#111'; g.lineWidth = 2; g.beginPath(); g.arc(p.x, p.y, rad, 0, TAU); g.fill(); g.stroke();
      if (label) { g.font = '600 12px sans-serif'; g.fillStyle = '#fff'; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineWidth = 3; g.strokeText(label, p.x + rad + 4, p.y + 4); g.fillText(label, p.x + rad + 4, p.y + 4); }
    };
    (map.overlays || (map.overlays = [])).push((g) => { for (const r of RP.values()) if (r.seen) dot(g, map.worldToScreen(r.x, r.z), 7, r.slot, r.peer.name); });
    (map.miniOverlays || (map.miniOverlays = [])).push((g, to) => { for (const r of RP.values()) if (r.seen) dot(g, to(r.x, r.z), 5, r.slot, null); });
  });

  // ---------------------------------------------------------------- UI: Host / Join on the title card, a Co-op section in the menu
  const css = document.createElement('style');
  css.textContent = `
  #ui .coop-tag{position:absolute;left:0;top:0;padding:2px 8px;border-radius:9px;background:rgba(10,16,24,.6);color:#fff;font:600 11px var(--font);white-space:nowrap;pointer-events:none;display:none;will-change:transform}
  #ui .coop-tag i{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px} #ui .coop-tag b{color:#ffd24a;font-weight:400;margin-left:4px}
  #ui.photo .coop-tag{display:none!important}
  #ui .coop-t{display:flex;flex-direction:column;align-items:center;gap:6px;margin-top:4px;width:100%}
  #ui .coop-t .two{display:flex;gap:8px} #ui .coop-t .btn,#ui .coop-m .btn{font-size:12px;padding:6px 12px}
  #ui .coop-t .jn{display:flex;gap:6px} #ui .coop-t .jn.hide{display:none}
  #ui .coop-t input,#ui .coop-m input{width:96px;text-align:center;font:600 15px var(--font);letter-spacing:3px;text-transform:uppercase;background:rgba(255,255,255,.08);border:1px solid var(--line);border-radius:8px;color:var(--ink);padding:5px}
  #ui .coop-t .st,#ui .coop-m .st{font-size:11px;color:var(--dim);min-height:14px;text-align:center;max-width:300px}
  #ui .coop-m{border-top:1px solid var(--line);margin-top:6px;padding-top:4px}
  #ui .coop-m .code{font:600 16px var(--font);letter-spacing:3px;color:var(--accent)} #ui .coop-m .pl{display:flex;align-items:center;gap:8px;padding:3px 0;font-size:12px}
  #ui .coop-m .pl i{width:8px;height:8px;border-radius:50%} #ui .coop-m .pl span{flex:1} #ui .coop-m .pl small{color:var(--dim)}
  #ui .coop-m .acts{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  @media (orientation:landscape) and (max-height:560px){#ui #t-title .coop-t{grid-column:2}}`;
  document.head.appendChild(css);
  const title = document.querySelector('#t-title .modal');
  const T = document.createElement('div'); T.className = 'coop-t';
  T.innerHTML = '<div class="two"><button class="btn" data-c="host">Host co-op</button><button class="btn" data-c="join">Join co-op</button></div><div class="jn hide"><input class="code" maxlength="6" placeholder="CODE" autocomplete="off" spellcheck="false" aria-label="Lobby code"><button class="btn primary" data-c="go">Join</button></div><div class="st"></div>';
  if (title) title.appendChild(T);
  const tSt = T.querySelector('.st'), tJn = T.querySelector('.jn'), tIn = T.querySelector('input');
  const WHY = { version: 'Your friend is on a different version \u2014 both reload the page.', taken: 'That friend is already being played \u2014 pick someone else.', friend: 'Pick a friend first.', 'no such lobby': 'No game with that code (check it, or ask for a new one).', 'lobby full': 'That game is full (4 players).', full: 'That game is full (4 players).', code: 'Codes are 6 letters / digits.', timeout: 'Could not reach the lobby server.', closed: 'Could not reach the lobby server.' };
  const why = (e) => e && e.message === 'left' ? '' : WHY[e && e.message] || 'Could not connect (' + (e && e.message || 'error') + ').';
  const doHost = () => { if (!AF.ready) return; if (AF.ui.titleOpen && AF.ui.titleOpen()) AF.ui.start(); N.host().catch((e) => toast(why(e))); };
  const doJoin = (code, st) => {
    if (!AF.ready) return;
    st.textContent = 'Connecting\u2026';
    N.join(code).then(() => { st.textContent = ''; }).catch((e) => { st.textContent = why(e); });
  };
  T.addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]'); if (!b) return;
    if (b.dataset.c === 'host') doHost();
    else if (b.dataset.c === 'join') { tJn.classList.toggle('hide'); if (!tJn.classList.contains('hide')) tIn.focus(); }
    else if (b.dataset.c === 'go') doJoin(tIn.value, tSt);
  });
  tIn.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter') doJoin(tIn.value, tSt); });
  { const j = N.cleanCode(AF.Q.get('join')); if (N.validCode(j)) { tIn.value = j; tJn.classList.remove('hide'); tSt.textContent = 'Pick your friend, then Join.'; } }
  // menu section
  const menu = document.querySelector('#m-menu .panel'), stack = menu && menu.querySelector('.stack');
  const MN = document.createElement('div'); MN.className = 'coop-m';
  MN.innerHTML = '<div class="row"><label>Co-op</label><div class="acts"></div></div><div class="body"></div><div class="st"></div>';
  if (stack) menu.insertBefore(MN, stack);
  const mActs = MN.querySelector('.acts'), mBody = MN.querySelector('.body'), mSt = MN.querySelector('.st');
  let menuKey = '';
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const renderMenu = () => {
    const rows = [...RP.values()].map((r) => r.slot + r.peer.name + (N.peers.get(r.slot) ? Math.round(N.peers.get(r.slot).rtt / 10) : 0) + r.stars).join('|');
    const key = N.role + N.code + C.pvp + rows + N.status;
    if (key === menuKey) return; menuKey = key;
    if (N.role === 'off') {
      mActs.innerHTML = '<button class="btn" data-c="host">Host</button><input class="code" maxlength="6" placeholder="CODE" aria-label="Lobby code"><button class="btn" data-c="go">Join</button>';
      mBody.innerHTML = '';
    } else {
      mActs.innerHTML = (N.role === 'host' ? '<span class="code">' + esc(N.code) + '</span><button class="btn" data-c="copy">Copy invite link</button>' : '') + '<button class="btn" data-c="leave">Leave</button>';
      const me = '<div class="pl"><i style="background:' + COLORS[N.me & 3] + '"></i><span>' + esc(AF.friends.current ? AF.friends.current.name : 'You') + ' (you)</span></div>';
      const list = [...RP.values()].map((r) => { const p = N.peers.get(r.slot); return '<div class="pl"><i style="background:' + COLORS[r.slot & 3] + '"></i><span>' + esc(r.peer.name) + (r.stars ? ' <b style="color:#ffd24a">' + '\u2605'.repeat(r.stars) + '</b>' : '') + '</span><small>' + (p && p.rtt ? Math.round(p.rtt) + ' ms' : r.slot === 0 ? 'host' : 'via host') + '</small><button class="btn" data-go="' + r.slot + '">Go to</button>' + (N.role === 'host' ? '<button class="btn" data-kick="' + r.slot + '">Kick</button>' : '') + '</div>'; }).join('');
      mBody.innerHTML = me + list + (N.role === 'host' ? '<div class="row"><label>Friendly fire</label><div class="seg"><button data-c="pvp1" class="' + (C.pvp ? 'on' : '') + '">On</button><button data-c="pvp0" class="' + (C.pvp ? '' : 'on') + '">Off</button></div></div>' : '');
    }
    mSt.textContent = N.status;
  };
  MN.addEventListener('click', (e) => {
    e.stopPropagation();
    const b = e.target.closest('button'); if (!b) return;
    const c = b.dataset.c;
    if (c === 'host') N.host().catch((er) => { mSt.textContent = why(er); });
    else if (c === 'go') { const inp = MN.querySelector('input.code'); if (inp) doJoin(inp.value, mSt); }
    else if (c === 'leave') N.leave('You left the co-op session.');
    else if (c === 'copy') { const url = N.inviteUrl(); try { navigator.clipboard.writeText(url).then(() => { mSt.textContent = 'Invite link copied.'; }, () => { mSt.textContent = url; }); } catch (er) { mSt.textContent = url; } }
    else if (c === 'pvp1' || c === 'pvp0') C.setPvp(c === 'pvp1');
    else if (b.dataset.go != null) { AF.ui.resume && AF.ui.resume(); C.goTo(+b.dataset.go); }
    else if (b.dataset.kick != null) N.kick(+b.dataset.kick);
    menuKey = '';
  });
  MN.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.key === 'Enter' && e.target.matches('input')) doJoin(e.target.value, mSt); });
  N.on('status', (s) => { tSt.textContent = N.role === 'guest' || N.role === 'off' ? s : ''; menuKey = ''; });
  let menuT = 0;
  AF.onTick('coop-menu', 953, (dt) => { if ((menuT -= dt) > 0) return; menuT = 0.5; if (AF.ui.state && AF.ui.state.menu) renderMenu(); });

  // ---------------------------------------------------------------- tests (no network: packets go straight into the receive path)
  AF.test('coop: Track keeps time order, interpolates, extrapolates up to 250 ms, then holds', () => {
    const t = new Track([1, 3, 4], 4), o = new Float32Array(3);
    t.push(100, [0, 0, 1]); t.push(300, [20, 0.4, 3]); t.push(200, [10, 0.2, 2]);   // late packet slots in
    const stale = !t.push(200, [99, 9, 9]);
    t.push(400, [30, 0.6, 4]); t.push(500, [40, 0.8, 5]); const dropped = !t.push(50, [0, 0, 0]);
    const a = t.sample(350, o, 250), mid = Math.abs(o[0] - 25) < 1e-3 && o[2] === 3;
    const b = t.sample(600, o, 250), ex = Math.abs(o[0] - 50) < 1e-3;
    const c = t.sample(1000, o, 250), held = Math.abs(o[0] - 65) < 1e-3;
    return { ok: stale && dropped && a === 0 && mid && b === 1 && ex && c === 2 && held, info: `stale ${stale} dropped ${dropped} interp ${mid} extrap ${ex} held ${held} x ${o[0].toFixed(2)}` };
  });
  AF.test('coop: a snapshot round-trips into a remote avatar that follows reordered packets', () => {
    const fid = AF.friends.cast.find((c) => !AF.friends.current || c.id !== AF.friends.current.id).id;
    const peer = { slot: 3, name: 'Test', friend: fid, look: AF.friends.byId[fid].look, rtt: 0, x: 0, z: 0 };
    const savedMe = N.me, savedPeer = N.peers.get(3);
    try {
      N.me = 3; N.peers.set(3, peer); addRemote(peer);
      const P = AF.player, base = performance.now() - 1000, x0 = P.mesh.position.x;
      const pk = (dx, ms) => { P.mesh.position.x = x0 + dx; const n = C.build(base + ms); return W.u8.slice(0, n); };
      const a = pk(0, 0), b = pk(1, 50), c2 = pk(2, 100); P.mesh.position.x = x0;
      C.ingest(a, 3); C.ingest(c2, 3); C.ingest(b, 3);
      const r = RP.get(3); r.clk.off = performance.now() - (base + 75); r.clk.delay = 0;
      applyPlayer(r, performance.now(), 1 / 30);
      const got = r.P.root.position.x - x0;
      return { ok: Math.abs(got - 1.5) < 0.05 && r.tr.len === 3, info: 'x at t=75 ms: ' + got.toFixed(3) + ' (want 1.5), samples ' + r.tr.len };
    } finally { removeRemote(3); N.me = savedMe; if (savedPeer) N.peers.set(3, savedPeer); else N.peers.delete(3); }
  });
  AF.test('coop: riding along seats you in another player\u2019s car and lets you out', () => {
    const car = VV.cars.find((c) => !c.static && !c.player && !c.ai && c.active !== false && c.type.kind === 'car' && c.net == null); if (!car) return { ok: false, info: 'no car' };
    const was = AF.mode, peer = { slot: 2, name: 'Driver', friend: AF.friends.cast[0].id, look: AF.friends.cast[0].look, rtt: 0, x: car.x, z: car.z };
    try {
      N.peers.set(2, peer); addRemote(peer);
      const e = { h: hashOf(car), owner: 2, kind: VK_CAR, obj: car, tr: new Track(VT, 10), out: new Float32Array(VT.length), created: false, last: performance.now(), squad: false, puff: 0 };
      takeOver(car, 2, VK_CAR); RV.set(e.h, e);
      AF.setMode('passenger', { veh: car }); ridePlace(1 / 30);
      const S = AF.PL.seat, inside = AF.mode === 'passenger' && !!S && Math.hypot(S.x - car.x, S.z - car.z) < car.halfL && VV.bodyDist(car, S.x, S.z) === 0;
      releaseVeh(e, null); getOut(true);
      return { ok: inside && AF.mode === 'walk' && car.net == null, info: `seated ${inside}, out ${AF.mode}` };
    } finally { removeRemote(2); N.peers.delete(2); if (AF.mode !== was && was && AF.modes[was]) AF.setMode(was); }
  });
}
} catch (e) { AF.partError('80-coop.js', e); }
