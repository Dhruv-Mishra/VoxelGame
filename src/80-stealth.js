// ================================================================ 80-stealth.js
try {
// ===== 80-stealth: guards that see, hear, investigate and raise the alarm — the heist's sneaking (OWNER: game) =====
// A ZONE (the bank at night, the smugglers' tunnel, the liner's crew deck, the zoo yard, a shop) holds GUARDS (path walkers from
// 54 or static NPCs), security CAMERAS, LIGHT circuits and DISTRACTION points. Only the active zone simulates, at 15 Hz, and only
// while a player is near it. Per guard and player: sight (a 110-degree cone, range, line of sight, darkness, crouch, movement,
// disguise) and hearing (AF.player.noise footsteps, gunshots, thrown noises) raise AWARENESS 0..1, drawn as a '?' meter above the
// head (AF.alertMark). States, after Metal Gear Solid V:
//   patrol -> sus (stops, turns to the spot) -> search (walks there by the zone's nav graph, looks around) -> return (back onto
//   the timetable) | alert ('!': a REFLEX window — take him down before it ends and nobody knows) -> ALARM: every guard hunts the
//   last known position and shoots on sight (zone.mode 'fight'), or the job fails (zone.mode 'fail'). 45 s unseen = evasion over.
// Knocked-out guards stay down; a guard who sees one raises the alarm. A guard off its timetable is steered through actor.ctl (54)
// and walks back onto its route afterwards (the timetable resumes where he left: actor.lag).
// Co-op: one client is the zone's AUTHORITY (the lowest slot inside the zone, else the host). It runs every guard against every
// player (remote players from 80-coop's snapshots) and streams guard states at 6 Hz ('stealth' gs); the others render them and
// forward their hits / hacker actions ('hit', 'act'). Cameras sweep on the shared world clock W.
{
  const PI = Math.PI, N = AF.net, WK = () => AF.walkers;
  const online = () => !!N && N.role !== 'off';
  const mySlot = () => (online() ? Math.max(0, N.me) : 0);
  const send = (m, to) => { if (online()) N.send('stealth', m, to); };

  // ---------------------------------------------------------------- alert marks: DOM '?' meters / '!' above heads, clamped to the screen edge
  const css = document.createElement('style');
  css.textContent = `#alert-marks{position:fixed;inset:0;pointer-events:none;z-index:6;overflow:hidden}
#alert-marks .am{position:absolute;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;display:none;will-change:transform}
#alert-marks .am i{position:absolute;inset:0;border-radius:50%;background:conic-gradient(#ffd23a calc(var(--p,0)*1turn),rgba(10,12,16,.55) 0);
 -webkit-mask:radial-gradient(circle,transparent 52%,#000 54%);mask:radial-gradient(circle,transparent 52%,#000 54%);filter:drop-shadow(0 0 3px rgba(0,0,0,.6))}
#alert-marks .am b{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font:900 19px/1 system-ui,sans-serif;color:#ffd23a;text-shadow:0 1px 3px #000,0 0 6px rgba(0,0,0,.8)}
#alert-marks .am.al i{background:#e8262b;-webkit-mask:none;mask:none;box-shadow:0 0 14px rgba(255,40,40,.9)}
#alert-marks .am.al b{color:#fff;font-size:23px;text-shadow:0 1px 2px #600}
#alert-marks .am.al{animation:am-pulse .5s ease-in-out infinite alternate}
#alert-marks .am.cam i{background:conic-gradient(#ff8a2a calc(var(--p,0)*1turn),rgba(10,12,16,.55) 0)}
#alert-marks .am.cam b{color:#ff8a2a;font-size:14px}
#alert-marks .am.edge{width:26px;height:26px;margin:-13px 0 0 -13px;opacity:.95}
#alert-marks .am.edge b{font-size:15px}
#alert-marks .am.edge::after{content:'';position:absolute;left:50%;top:-9px;margin-left:-6px;border:6px solid transparent;border-bottom:9px solid #ffd23a;transform-origin:6px 22px;transform:rotate(var(--r,0rad))}
#alert-marks .am.edge.al::after{border-bottom-color:#e8262b}
@keyframes am-pulse{from{scale:1}to{scale:1.18}}
#stealth-vig{position:fixed;inset:0;pointer-events:none;z-index:5;opacity:0;transition:opacity .25s;box-shadow:inset 0 0 160px 40px rgba(220,20,20,.55)}
#stealth-vig.on{opacity:1}
#stealth-vig.reflex{animation:sv-flash .35s ease-in-out infinite alternate}
@keyframes sv-flash{from{opacity:.55}to{opacity:1}}
#stealth-tag{position:fixed;left:50%;top:16%;transform:translateX(-50%);z-index:7;pointer-events:none;font:800 15px/1.2 system-ui,sans-serif;letter-spacing:.14em;color:#fff;
 text-transform:uppercase;padding:6px 16px;border-radius:3px;background:rgba(160,10,14,.82);box-shadow:0 2px 12px rgba(0,0,0,.4);opacity:0;transition:opacity .2s}
#stealth-tag.on{opacity:1}#stealth-tag.caution{background:rgba(190,120,10,.85)}#stealth-tag.ok{background:rgba(20,110,70,.85)}`;
  document.head.appendChild(css);
  const layer = document.createElement('div'); layer.id = 'alert-marks'; document.body.appendChild(layer);
  const vig = document.createElement('div'); vig.id = 'stealth-vig'; document.body.appendChild(vig);
  const tag = document.createElement('div'); tag.id = 'stealth-tag'; document.body.appendChild(tag);
  const MKS = new Map(), V3 = new THREE.Vector3();
  const AM = AF.alertMark = {
    set(id, x, y, z, lv, st, cam) {
      let m = MKS.get(id);
      if (!m) { const el = document.createElement('div'); el.className = 'am'; el.innerHTML = '<i></i><b>?</b>'; layer.appendChild(el); m = { el, b: el.lastChild, x: 0, y: 0, z: 0, lv: -1, st: -1, cam: false, edge: false, t: 0, shown: false }; MKS.set(id, m); }
      m.x = x; m.y = y; m.z = z; m.t = AF.clock.t;
      const l = Math.round(AF.clamp(lv, 0, 1) * 40) / 40;
      if (l !== m.lv) { m.lv = l; m.el.style.setProperty('--p', l); }
      if (st !== m.st || !!cam !== m.cam) { m.st = st; m.cam = !!cam; m.el.classList.toggle('al', st === 2); m.el.classList.toggle('cam', !!cam && st !== 2); m.b.textContent = st === 2 ? '!' : cam ? '\u25c9' : '?'; }
    },
    clear(id) { const m = MKS.get(id); if (m && m.shown) { m.el.style.display = 'none'; m.shown = false; } if (m) m.st = 0; },
    clearAll() { for (const id of MKS.keys()) AM.clear(id); },
  };
  AF.onTick('alert-marks', 952, () => {
    if (!MKS.size) return;
    const cam = AF.camera, W = innerWidth, Hh = innerHeight, now = AF.clock.t;
    for (const m of MKS.values()) {
      const vis = m.st > 0 && now - m.t < 0.4;
      if (!vis) { if (m.shown) { m.el.style.display = 'none'; m.shown = false; } continue; }
      V3.set(m.x, m.y, m.z).project(cam);
      let sx = (V3.x * 0.5 + 0.5) * W, sy = (-V3.y * 0.5 + 0.5) * Hh;
      const behind = V3.z > 1, off = behind || sx < 20 || sx > W - 20 || sy < 20 || sy > Hh - 20;
      if (off) {
        // pin to the edge, pointing at it (MGS: a marker on the border shows where the threat is)
        let dx = sx - W / 2, dy = sy - Hh / 2; if (behind) { dx = -dx; dy = -dy; if (Math.abs(dy) < 1) dy = Hh; }
        const k = Math.min((W / 2 - 26) / Math.max(1e-3, Math.abs(dx)), (Hh / 2 - 26) / Math.max(1e-3, Math.abs(dy)));
        sx = W / 2 + dx * k; sy = Hh / 2 + dy * k;
        m.el.style.setProperty('--r', Math.atan2(dx, -dy) + 'rad');
      }
      if (off !== m.edge) { m.edge = off; m.el.classList.toggle('edge', off); }
      m.el.style.transform = 'translate(' + sx.toFixed(1) + 'px,' + sy.toFixed(1) + 'px)';
      if (!m.shown) { m.el.style.display = 'block'; m.shown = true; }
    }
  });

  // ---------------------------------------------------------------- zones
  const S = AF.stealth = { zones: new Map(), zone: null, alarm: false, reflex: null, reflexT: 0, rset: [], caution: 0, evadeT: 0, auth: 0, seenAny: false, hooks: [] };
  const Z = (id) => S.zones.get(id);
  S.define = (id, o) => {
    const z = Object.assign({ id, box: null, mode: 'fail', guards: [], cams: [], lights: [], points: [], nav: null, alarm: false, disguise: null, sight: 1, hearing: 1, radius: 90,
      voice: 'g1', reflexS: 1.8, onAlarm: null, onSpot: null, onKO: null, onCalm: null, seen: false, lastSeen: { x: 0, y: 0, z: 0, t: -99 } }, o);
    if (z.nav) prepNav(z);
    S.zones.set(id, z); return z;
  };
  // a guard: a path walker's actor (o.path.actors[0]) or an NPC-like object with x, y, z, yaw (o.npc). Path walker guards move.
  S.guard = (zid, o) => {
    const z = Z(zid); if (!z) return null;
    const g = Object.assign({ i: z.guards.length, z: zid, a: null, path: null, npc: null, voice: z.voice, name: 'Guard', range: 15, fov: 0.34, eye: 1.62, hp: 100, armed: true,
      st: 'patrol', lv: 0, t: 0, tgt: { x: 0, y: 0, z: 0 }, route: null, ri: 0, ctl: null, leftW: 0, barkT: -9, fireT: 0, look0: 0, lookT: 0, heard: 0, down: false, spotT: 0, who: -1, hid: false, carrier: -1 }, o);
    // armed guards soak a lot more (a takedown from behind is still one blow); everyone can be put down
    g.hp0 = o.hp != null ? o.hp : g.armed ? 240 : 100; g.hp = g.hp0;
    if (g.path) g.a = g.path.actors[0];
    if (g.npc) g.a = g.npc;
    z.guards.push(g); return g;
  };
  // a camera: x,y,z (lens), yaw0 + sweep amplitude (rad) over period s, pitch (down, rad), range, fov cos(half angle)
  S.camera = (zid, o) => {
    const z = Z(zid); if (!z) return null;
    const c = Object.assign({ i: z.cams.length, z: zid, name: 'CAM ' + (z.cams.length + 1), yaw0: 0, sweep: 0.7, period: 9, ph: 0, pitch: 0.42, range: 13, fov: 0.86, off: 0, lv: 0, yaw: 0, mesh: null, alarmed: false }, o);
    c.yaw = c.yaw0; z.cams.push(c); return c;
  };
  S.lights = (zid, o) => { const z = Z(zid); if (!z) return null; const l = Object.assign({ i: z.lights.length, z: zid, name: 'Lights', off: 0, lamps: [], meshes: [] }, o); z.lights.push(l); return l; };
  S.point = (zid, o) => { const z = Z(zid); if (!z) return null; const p = Object.assign({ i: z.points.length, z: zid, name: 'Noise', kind: 'phone', cd: 0, r: 12 }, o); z.points.push(p); return p; };

  // ---------------------------------------------------------------- nav graph: nodes [[x,y,z]], links [[i,j]] -> adjacency; BFS routes (state changes only)
  function prepNav(z) {
    const n = z.nav.pts.length, adj = []; for (let i = 0; i < n; i++) adj.push([]);
    for (const [a, b] of z.nav.links) { adj[a].push(b); adj[b].push(a); }
    z.nav.adj = adj;
  }
  const nearestNode = (z, x, y, zz) => {
    let best = -1, bd = 1e9; const P = z.nav.pts;
    for (let i = 0; i < P.length; i++) { const p = P[i], d = (p[0] - x) ** 2 + (p[2] - zz) ** 2 + ((p[1] - y) * 3) ** 2; if (d < bd && (d < 4 || los(p[0], p[1] + 0.9, p[2], x, y + 0.9, zz))) { bd = d; best = i; } }
    if (best < 0) for (let i = 0; i < P.length; i++) { const p = P[i], d = (p[0] - x) ** 2 + (p[2] - zz) ** 2 + ((p[1] - y) * 3) ** 2; if (d < bd) { bd = d; best = i; } }
    return best;
  };
  const route = (z, x0, y0, z0, x1, y1, z1) => {
    const out = [];
    if (z.nav && !los(x0, y0 + 0.9, z0, x1, y1 + 0.9, z1)) {
      const a = nearestNode(z, x0, y0, z0), b = nearestNode(z, x1, y1, z1);
      if (a >= 0 && b >= 0 && a !== b) {
        const prev = new Int32Array(z.nav.pts.length).fill(-1), q = [a]; prev[a] = a;
        for (let qi = 0; qi < q.length; qi++) { const u = q[qi]; if (u === b) break; for (const v of z.nav.adj[u]) if (prev[v] < 0) { prev[v] = u; q.push(v); } }
        if (prev[b] >= 0) { const chain = []; for (let u = b; u !== a; u = prev[u]) chain.push(u); chain.push(a); chain.reverse(); for (const u of chain) { const p = z.nav.pts[u]; out.push({ x: p[0], y: p[1], z: p[2] }); } }
        // already past the first node (between it and the next): don't walk back to it (a combat re-route every 1.5 s would oscillate)
        while (out.length >= 2 && Math.hypot(out[1].x - x0, out[1].z - z0) <= Math.hypot(out[1].x - out[0].x, out[1].z - out[0].z) + 0.3) out.shift();
      } else if (a >= 0) { const p = z.nav.pts[a]; out.push({ x: p[0], y: p[1], z: p[2] }); }
    }
    out.push({ x: x1, y: y1, z: z1 });
    return out;
  };
  // line of sight: exact (voxels, ground, colliders — 02 AF.segClear)
  const los = S.los = (x0, y0, z0, x1, y1, z1) => AF.segClear(x0, y0, z0, x1, y1, z1);
  const inBox = (b, x, y, z, pad = 0) => !!b && x > b[0] - pad && x < b[3] + pad && y > b[1] - pad && y < b[4] + pad && z > b[2] - pad && z < b[5] + pad;
  S.inZone = (zid, x, y, z, pad) => { const zz = Z(zid); return !!zz && inBox(zz.box, x, y, z, pad); };
  S.isDark = (z, x, y, zz) => { for (const l of z.lights) if (l.off > 0 && x > l.box[0] && x < l.box[2] && zz > l.box[1] && zz < l.box[3]) return true; return false; };

  // ---------------------------------------------------------------- players in the zone (local + remote), scratch objects, no garbage
  const PS = []; for (let k = 0; k < 4; k++) PS.push({ slot: k, x: 0, y: 0, z: 0, eye: 1.5, noise: 0, crouch: false, moving: false, on: false, px: 0, pz: 0, has: false, armed: false, carry: false });
  // what counts as a weapon in hand (80-coop's held ids): guns and melee weapons, not a guitar or a shopping bag
  const ARMS = new Set(['bat', 'pan', 'cutlass', 'revolver', 'shotgun', 'tommy', 'rifle', 'spistol', 'ssmg', 'lmg']);
  const carrying = (slot) => { const z = S.zone; if (!z) return false; for (const g of z.guards) if (g.carrier === slot) return true; return false; };
  const gather = (z) => {
    let n = 0; const me = mySlot(), p = AF.player;
    for (const q of PS) q.on = false;
    if (AF.mode === 'walk' && p && inBox(z.box, p.x, p.y, p.z, 6)) {
      const q = PS[me & 3]; q.on = true; q.x = p.x; q.y = p.y; q.z = p.z; q.eye = p.eyeH || (p.crouch ? 0.95 : 1.55); q.crouch = !!p.crouch;
      const sp = AF.PL && AF.PL.walk ? AF.PL.walk.speed || 0 : 0; q.moving = sp > 0.4;
      q.noise = p.noise != null ? p.noise : (sp > 4.5 ? 1 : sp > 0.4 ? 0.35 : 0); n++;
      q.armed = !!AF.combat && ARMS.has(AF.combat.heldId); q.carry = !!S.carrying;
    }
    if (online() && AF.coop && AF.coop.players) for (const [slot, r] of AF.coop.players) {
      if (!r || !r.seen || r.dead || r.veh || slot === me || !inBox(z.box, r.x, r.y, r.z, 6)) continue;
      const q = PS[slot & 3], sp = q.has ? Math.hypot(r.x - q.px, r.z - q.pz) * 15 : 0;
      q.on = true; q.x = r.x; q.y = r.y; q.z = r.z; q.crouch = !!r.crouch; q.eye = q.crouch ? 0.95 : 1.55; q.moving = sp > 0.4;
      q.noise = r.noise != null ? r.noise : q.crouch ? (sp > 0.4 ? 0.12 : 0) : sp > 4.5 ? 1 : sp > 0.4 ? 0.35 : 0; n++;
      q.armed = ARMS.has(r.heldId); q.carry = carrying(slot);
    }
    for (const q of PS) { if (q.on) { q.px = q.x; q.pz = q.z; q.has = true; } else q.has = false; }
    return n;
  };
  // who simulates a zone: the lowest slot standing in it, else the host
  const authority = (z) => {
    if (!online()) return 0;
    let a = 99; const me = mySlot(), p = AF.player;
    if (p && inBox(z.box, p.x, p.y, p.z, 4) && AF.mode !== 'cctv') a = me;
    if (AF.coop && AF.coop.players) for (const [slot, r] of AF.coop.players) if (r && r.seen && !r.dead && inBox(z.box, r.x, r.y, r.z, 4) && slot < a) a = slot;
    return a === 99 ? 0 : a;
  };
  S.isAuth = () => !!S.zone && S.auth === mySlot();

  // ---------------------------------------------------------------- guard voice + steering
  const bark = (g, key, force) => {
    const now = AF.clock.t; if (!force && (now - g.barkT < 3 || now < (g.barkEnd || 0))) return; g.barkT = now;
    const id = AF.voAlias ? AF.voAlias(g.voice + '.' + key) : g.voice + '.' + key, L = AF.voLine && AF.voLine(id), a = g.a;
    const len = AF.audio && AF.audio.voice && L ? AF.audio.voice(id, { x: a.x, y: a.y + 1.6, z: a.z }) : 0;
    g.barkEnd = now + (len || 1.2) + 0.2;   // a guard never talks over himself
    AF.emit('bubble', { who: a, name: L ? L[1] : g.name, text: L ? L[2] : key, dur: 2.2 });
  };
  S.bark = bark;
  const takeCtl = (g) => {
    const a = g.a; if (!g.path || a.ctl) return;
    a.ctl = { x: a.x, y: a.y, z: a.z, yaw: a.yaw, moving: false, ph: a.ph || 0 }; g.leftW = AF.clock.w;
    g.home = { x: a.x, y: a.y, z: a.z };
  };
  const dropCtl = (g) => {
    const a = g.a; if (!g.path || !a.ctl) return;
    a.ctl = null; a.lag = (a.lag || 0) + Math.max(0, AF.clock.w - g.leftW); a.aim = 0;
  };
  const faceTo = (g, x, z, dt, k = 4) => {
    const a = g.a, want = Math.atan2(x - a.x, z - a.z), d = AF.angDiff(a.yaw, want), s = Math.sign(d) * Math.min(Math.abs(d), k * dt);
    if (a.ctl) a.ctl.yaw += s; else a.yaw += s;
    return Math.abs(d) < 0.15;
  };
  const walk = (g, dt, speed) => {
    const a = g.a, c = a.ctl; if (!c || !g.route || g.ri >= g.route.length) { if (c) c.moving = false; return true; }
    const p = g.route[g.ri], dx = p.x - c.x, dz = p.z - c.z, d = Math.hypot(dx, dz);
    if (d < 0.35) { g.ri++; return g.ri >= g.route.length; }
    const st = Math.min(d, speed * dt); let nx = c.x + dx / d * st, nz = c.z + dz / d * st;
    const y0 = AF.surfaceBelow(nx, nz, c.y + 0.7, 2.5), y = Number.isFinite(y0) && Math.abs(y0 - c.y) < 1.2 ? y0 : c.y, by = Math.max(y, c.y) + 0.55;
    // blocked: slide along whichever axis is free (0.5 m floor steps are walked, like the player's 0.55 step), else skip ahead
    if (AF.boxBlocked(nx, by, nz, 0.22, 1.2)) {
      if (!AF.boxBlocked(nx, by, c.z, 0.22, 1.2)) nz = c.z; else if (!AF.boxBlocked(c.x, by, nz, 0.22, 1.2)) nx = c.x; else { g.ri++; return g.ri >= g.route.length; }
    }
    c.x = nx; c.z = nz; c.y = y;
    c.moving = true; c.ph += st * 4.2;
    const want = Math.atan2(dx, dz); c.yaw += AF.angDiff(c.yaw, want) * (1 - Math.exp(-dt * 9));
    return false;
  };
  const goTo = (g, x, y, z) => { const a = g.a, c = a.ctl || a; g.route = route(Z(g.z), c.x, c.y, c.z, x, y, z); g.ri = 0; };

  // ---------------------------------------------------------------- state changes
  const set = (g, st) => { g.st = st; g.t = 0; };
  const toSus = (g, x, y, z, why) => {
    if (g.down || g.st === 'combat' || g.st === 'alert') return;
    g.tgt.x = x; g.tgt.y = y; g.tgt.z = z;
    if (g.st === 'patrol' || g.st === 'return') { takeCtl(g); set(g, 'sus'); bark(g, why === 'noise' ? 'sus3' : AF.whash(g.i, AF.clock.t | 0) < 0.5 ? 'sus1' : 'sus2'); }
    else if (g.st === 'look') { set(g, 'search'); goTo(g, x, y, z); }
  };
  const toSearch = (g, key) => { takeCtl(g); set(g, 'search'); goTo(g, g.tgt.x, g.tgt.y, g.tgt.z); bark(g, key || (g.i & 1 ? 'check1' : 'check2')); };
  const toReturn = (g, quiet) => {
    if (!g.path) { set(g, 'patrol'); g.lv = Math.min(g.lv, 0.1); return; }
    if (!quiet) bark(g, AF.whash(g.i, 7, AF.clock.t | 0) < 0.5 ? 'clear1' : 'clear2');
    set(g, 'return'); const h = g.home || g.a; goTo(g, h.x, h.y, h.z);
  };
  const toAlert = (g, who) => {
    const z = Z(g.z); if (g.down || g.st === 'alert' || g.st === 'combat') return;
    takeCtl(g); set(g, 'alert'); g.lv = 1; g.who = who; bark(g, g.i & 1 ? 'spot2' : 'spot1', true);
    if (z.alarm) { toCombat(g); return; }
    // the REFLEX window: every guard who spots you inside it must go down before it closes
    if (!S.reflex) { S.reflex = g; S.reflexT = z.reflexS; S.rset.length = 0; emit('reflex', g); }
    if (!S.rset.includes(g)) S.rset.push(g);
    if (z.onSpot) z.onSpot(g);
  };
  const toCombat = (g) => { if (g.down) return; takeCtl(g); set(g, 'combat'); g.lv = 1; const z = Z(g.z); g.tgt.x = z.lastSeen.x; g.tgt.y = z.lastSeen.y; g.tgt.z = z.lastSeen.z; goTo(g, g.tgt.x, g.tgt.y, g.tgt.z); g.fireT = 0.6 + AF.whash(g.i, 3) * 0.6; };
  const emit = (type, g, extra) => { AF.emit('stealth', Object.assign({ type, zone: S.zone && S.zone.id, g }, extra)); };
  S.raiseAlarm = (why, g, remote) => {
    const z = S.zone; if (!z || z.alarm) return;
    z.alarm = true; S.alarm = true; S.reflex = null; S.rset.length = 0; S.evadeT = 0;
    if (g) bark(g, 'alarm', true);
    emit('alarm', g, { why });
    if (!remote && S.isAuth()) send({ op: 'alarm', z: z.id, why: String(why || '').slice(0, 80) });
    if (z.mode === 'fight') for (const q of z.guards) if (!q.down && q.armed) toCombat(q);
    if (z.onAlarm) z.onAlarm(why, g);
  };
  // a mission raising the alarm from any client: the zone's authority decides (and tells everyone)
  S.requestAlarm = (why) => { const z = S.zone; if (!z || z.alarm) return; if (S.isAuth() || !online()) S.raiseAlarm(why); else send({ op: 'areq', z: z.id, why: String(why || '').slice(0, 80) }, S.auth); };
  S.calm = (remote) => {
    const z = S.zone; if (!z || !z.alarm) return;
    z.alarm = false; S.alarm = false; S.caution = 60; emit('calm');
    for (const g of z.guards) if (!g.down && (g.st === 'combat' || g.st === 'alert')) { g.lv = 0.3; bark(g, 'lost'); toReturn(g, true); }
    if (!remote && S.isAuth()) send({ op: 'calm', z: z.id });
    if (z.onCalm) z.onCalm();
  };
  const knockOut = (g, fx, fz, how) => {
    if (g.down) return;
    const a = g.a, z = Z(g.z); takeCtl(g); g.down = true; g.lv = 0; set(g, 'down'); if (a.ctl) { a.ctl.moving = false; a.aim = 0; }
    if (g.path) AF.walkers.knock(a, fx || 0, fz || 1, 1.3, 1e6);
    else if (g.npc && g.npc.root) { g.npc.root.rotation.x = -PI / 2; g.npc.down = true; }
    const ri = S.rset.indexOf(g); if (ri >= 0) S.rset.splice(ri, 1);
    if (S.reflex && !S.rset.length) { S.reflex = null; emit('reflexOk', g); } else if (S.reflex === g) S.reflex = S.rset[0];
    AF.alertMark.clear('g' + g.z + g.i);
    emit('ko', g, { how }); if (z.onKO) z.onKO(g, how);
  };
  S.knockOut = knockOut;

  // ---------------------------------------------------------------- hits from 77-combat (the heist routes CB.onWalkerHit here)
  // melee from behind on an unaware guard = a silent takedown; a headshot on an unaware guard = down; otherwise every hit (fists,
  // bats, bullets) wears his health down until he drops — nobody is unkillable, armed guards just take a lot more
  // a one-hit takedown only ever comes from behind (a melee blow or a headshot on a guard who isn't fighting yet); from the front
  // every guard soaks hits until his health runs out
  const behindOf = (a, P) => { if (!P) return false; const dx = P.x - a.x, dz = P.z - a.z, d = Math.hypot(dx, dz) || 1, yaw = a.ctl ? a.ctl.yaw : a.yaw; return (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / d < 0; };
  S.hit = (a, kind, fx, fz, info, from) => {
    let z = S.zone, g = z ? z.guards.find((q) => q.a === a) : null;
    if (!g) {
      for (const zz of S.zones.values()) { const q = zz.guards.find((r) => r.a === a); if (q) { g = q; z = zz; break; } }
      if (!g) return false;
      // a guard of a zone that isn't running (nobody simulates it): plain damage, applied where the shot landed
      if (!g.down) { g.hp -= (info && info.dmg) || 20; if (g.hp <= 0 || kind === 'melee' && g.st !== 'combat' && behindOf(a, AF.player)) knockOut(g, fx, fz, kind); else AF.walkers.stagger(a, fx || 0, fz || 1); }
      return true;
    }
    if (g.down) return true;
    if (!S.isAuth() && online()) { send({ op: 'hit', z: z.id, i: g.i, k: kind === 'melee' ? 1 : 0, h: info && info.head ? 1 : 0, s: info && info.silenced ? 1 : 0, d: Math.round((info && info.dmg) || 30), fx: +(fx || 0).toFixed(2), fz: +(fz || 0).toFixed(2) }, S.auth); predictHit(g, kind, info); return true; }
    applyHit(g, kind, fx, fz, info, from == null ? mySlot() : from);
    return true;
  };
  const predictHit = (g, kind, info) => { if (g.st !== 'combat' && (kind === 'melee' || (info && info.head)) && behindOf(g.a, AF.player)) { g.down = true; if (g.path) AF.walkers.knock(g.a, 0, 1, 1.3, 1e6); } };
  // somebody else on duty sees (x, y, z)? (a takedown, a body being dragged, a brawl with a passenger) -> that guard, else null
  const witness = S.witness = (z, x, y, zz, not) => {
    if (!z) return null;
    for (const o of z.guards) {
      if (o === not || o.down || !o.a || (o.path && !o.path.active && !o.a.ctl)) continue;
      const a = o.a, yaw = a.ctl ? a.ctl.yaw : a.yaw, dx = x - a.x, dz = zz - a.z, d = Math.hypot(dx, dz);
      if (d > o.range * 0.85 || Math.abs(y - a.y) > 3 || (d > 1.5 && (dx * Math.sin(yaw) + dz * Math.cos(yaw)) / (d || 1) < o.fov)) continue;
      if (S.isDark(z, x, y, zz) && d > 4) continue;
      if (los(a.x, a.y + o.eye, a.z, x, y + 1.0, zz)) return o;
    }
    return null;
  };
  const seenViolence = (g, from) => {
    const z = Z(g.z), a = g.a, w = witness(z, a.x, a.y, a.z, g); if (!w || z.alarm) return;
    w.tgt.x = a.x; w.tgt.y = a.y; w.tgt.z = a.z; bark(w, 'body', true);
    if (z.strict) S.raiseAlarm('A guard saw the attack', w); else toAlert(w, from);
  };
  const applyHit = (g, kind, fx, fz, info, from) => {
    const a = g.a, P = from === mySlot() ? AF.player : AF.coop && AF.coop.players.get(from);
    const behind = behindOf(a, P), head = !!(info && info.head), dmg = (info && info.dmg) || 30, fighting = g.st === 'combat';
    if (kind === 'melee') {
      if (behind && !fighting) { knockOut(g, fx, fz, 'melee'); broadcastKO(g, fx, fz); seenViolence(g, from); return; }
      g.hp -= dmg * 1.5;
      if (g.hp <= 0) { knockOut(g, fx, fz, 'melee'); broadcastKO(g, fx, fz); seenViolence(g, from); return; }
      AF.walkers.stagger(a, fx || 0, fz || 1); toAlert(g, from); seenViolence(g, from); return;
    }
    g.hp -= head ? (behind && !fighting ? 1e4 : dmg * 2.5) : dmg;
    if (g.hp <= 0) { knockOut(g, fx, fz, head ? 'head' : 'shot'); broadcastKO(g, fx, fz); if (!(info && info.silenced)) S.noiseAt(a.x, a.y, a.z, 40, 'shot'); seenViolence(g, from); return; }
    AF.walkers.stagger(a, fx || 0, fz || 1);
    if (P) { const z = Z(g.z); z.lastSeen.x = P.x; z.lastSeen.y = P.y; z.lastSeen.z = P.z; z.lastSeen.t = AF.clock.t; }
    toAlert(g, from); seenViolence(g, from);
  };
  const broadcastKO = (g, fx, fz) => { if (S.isAuth()) send({ op: 'ko', z: g.z, i: g.i, fx: +(fx || 0).toFixed(2), fz: +(fz || 0).toFixed(2) }); };

  // ---------------------------------------------------------------- noises: footsteps (sensed), gunshots (events), distractions
  S.noiseAt = (x, y, z, r, kind) => {
    const Zn = S.zone; if (!Zn || !S.isAuth()) return;
    let n = 0;
    const order = Zn.guards.filter((g) => !g.down && Math.abs(g.a.y - y) < 4 && Math.hypot(g.a.x - x, g.a.z - z) < r * Zn.hearing).sort((p, q) => Math.hypot(p.a.x - x, p.a.z - z) - Math.hypot(q.a.x - x, q.a.z - z));
    for (const g of order) {
      if (kind === 'shot') { Zn.lastSeen.x = x; Zn.lastSeen.y = y; Zn.lastSeen.z = z; Zn.lastSeen.t = AF.clock.t; if (Zn.mode === 'fight' || Zn.alarm) { if (!Zn.alarm) S.raiseAlarm('Gunfire', g); toCombat(g); } else toAlert(g, -1); continue; }
      if (g.st === 'combat' || g.st === 'alert') continue;
      if (kind === 'distraction') { if (n >= 2) break; g.lv = Math.max(g.lv, 0.42); g.tgt.x = x; g.tgt.y = y; g.tgt.z = z; takeCtl(g); set(g, 'sus'); g.t = 0.6; bark(g, 'phone', true); n++; continue; }
      g.lv = Math.max(g.lv, 0.36); toSus(g, x, y, z, 'noise');
      if (++n >= 3) break;
    }
  };
  AF.on('gunshot', (e) => {
    const z = S.zone; if (!z || !e || !inBox(z.box, e.x, e.y, e.z, 30)) return;
    if (!S.isAuth()) return;
    S.noiseAt(e.x, e.y, e.z, e.silenced ? Math.min(e.loud || 7, 7) : Math.max(45, e.loud || 60), e.silenced ? 'noise' : 'shot');
  });

  // ---------------------------------------------------------------- hacker actions: loop a camera, kill a light circuit, ring a phone
  S.act = (kind, id, secs, remote) => {
    const z = S.zone; if (!z) return false;
    if (!S.isAuth() && !remote) { send({ op: 'act', z: z.id, k: kind, id, s: secs }, S.auth); applyAct(z, kind, id, secs, true); return true; }
    applyAct(z, kind, id, secs, false);
    if (S.isAuth()) send({ op: 'actx', z: z.id, k: kind, id, s: secs });
    return true;
  };
  const applyAct = (z, kind, id, secs, predict) => {
    if (kind === 'loop') { const c = z.cams[id]; if (c) { c.off = secs || 30; c.lv = 0; AF.alertMark.clear('c' + z.id + c.i); } }
    else if (kind === 'dark') { const l = z.lights[id]; if (l) { l.off = secs || 25; setLamps(l, false); if (!predict) for (const g of z.guards) if (!g.down && g.a.x > l.box[0] - 2 && g.a.x < l.box[2] + 2 && g.a.z > l.box[1] - 2 && g.a.z < l.box[3] + 2) { bark(g, 'dark'); break; } } }
    else if (kind === 'dist') { const p = z.points[id]; if (p) { p.cd = 12; if (AF.audio) AF.audio.play(p.sfx || 'phone_ring', { x: p.x, y: p.y, z: p.z }); if (!predict) S.noiseAt(p.x, p.y, p.z, p.r, 'distraction'); } }
    else if (kind === 'reset') { if (z.alarm && S.isAuth()) S.calm(); }
  };
  const setLamps = (l, on) => { for (const L of l.lamps) { if (L.i0 == null) L.i0 = L.intensity ?? 1; L.intensity = on ? L.i0 : 0; } for (const m of l.meshes) m.visible = on; };

  // ---------------------------------------------------------------- bodies: carry a downed guard over your shoulder (E), put him down (E)
  // or stash him in one of the zone's hiding places (zone.hides [{x, y, z, r, label}]) where nobody will find him. A body seen by a guard
  // raises the alarm; a guard who sees you carrying one in a strict zone (the liner) raises it at once. The zone's authority owns where
  // bodies lie (a carrier on another client streams the body's spot to it at 6 Hz; 'gs' carries it to everyone).
  S.carrying = null;
  const CARRY = { sendT: 0, hide: null };
  const hideNear = (z, x, y, zz) => { if (z && z.hides) for (const h of z.hides) if (Math.hypot(h.x - x, h.z - zz) < (h.r || 1.6) && Math.abs(h.y - y) < 2.4) return h; return null; };
  const bodyAt = (g, x, y, zz, yaw) => {
    const a = g.a; if (!a) return;
    if (!a.ctl) a.ctl = { x, y, z: zz, yaw, moving: false, ph: 0 };
    a.ctl.x = x; a.ctl.y = y; a.ctl.z = zz; a.ctl.yaw = yaw; a.ctl.moving = false;
    if (a.rx) { a.rx.ox = a.rx.oz = a.rx.vx = a.rx.vz = 0; }
  };
  const putDown = (g, x, y, zz, yaw, hid) => {
    g.carrier = -1; g.hid = !!hid; g.seenBy = null;
    bodyAt(g, x, hid ? y - 40 : y, zz, yaw);
  };
  const pickUp = (g) => {
    const z = S.zone; if (!z || !g || !g.down || g.hid || g.carrier >= 0 || S.carrying) return;
    S.carrying = g; g.carrier = mySlot(); CARRY.sendT = 0;
    if (AF.audio) AF.audio.play('cloth', { x: g.a.x, y: g.a.y, z: g.a.z });
    if (!S.isAuth()) send({ op: 'carry', z: z.id, i: g.i, on: 1 }, S.auth);
    const w = witness(z, g.a.x, g.a.y, g.a.z, g); if (w && !z.alarm) { bark(w, 'body', true); if (z.strict) S.raiseAlarm('A guard saw you carrying a body', w); else toAlert(w, mySlot()); }
  };
  const drop = () => {
    const g = S.carrying, z = S.zone; S.carrying = null; if (!g || !z) return;
    const p = AF.player, h = hideNear(z, p.x, p.y, p.z), fx = Math.sin(p.yaw), fz = Math.cos(p.yaw);
    const x = h ? h.x : p.x + fx * 0.9, zz = h ? h.z : p.z + fz * 0.9, y0 = h ? h.y : AF.surfaceBelow(x, zz, p.y + 1, 3), y = Number.isFinite(y0) ? y0 : p.y;
    putDown(g, x, y, zz, p.yaw, !!h);
    if (AF.audio) AF.audio.play(h ? 'latch' : 'cloth', { x, y, z: zz });
    if (h) AF.emit('toast', { text: 'Body hidden ' + (h.label || 'out of sight') + '.', kind: 'ok' });
    if (!S.isAuth()) send({ op: 'carry', z: z.id, i: g.i, on: 0, x: +x.toFixed(2), y: +y.toFixed(2), zz: +zz.toFixed(2), yaw: +p.yaw.toFixed(2), hid: h ? 1 : 0 }, S.auth);
    emit('body', g, { hid: !!h });
  };
  S.dropBody = () => { if (S.carrying) drop(); };
  // reinforcements: a reserve guard (S.guard {reserve: true}, off stage) walks on at (x, y, z) and joins the fight (81-heist's waves;
  // whoever decides sends it to everyone, the zone's authority then steers him)
  S.spawn = (zid, i, x, y, zz, remote) => {
    const z = Z(zid), g = z && z.guards[i]; if (!g || !g.reserve || !g.a || ![x, y, zz].every(Number.isFinite)) return null;
    const a = g.a;
    g.down = false; g.hid = false; g.live = true; g.carrier = -1; g.seenBy = null; g.hp = g.hp0; g.lv = 1; g.route = null; g.net = null;
    if (a.rx) { const R = a.rx; R.down = R.fall = R.st = R.fear = R.hold = 0; R.ox = R.oz = R.vx = R.vz = 0; }
    a.rxOn = false; a.tilt = a.lift = 0;
    a.ctl = { x, y, z: zz, yaw: 0, moving: false, ph: 0 }; g.home = { x, y, z: zz }; g.leftW = AF.clock.w;
    if (S.carrying === g) S.carrying = null;
    if (g.path) g.path.enabled = true;
    if (z.alarm) toCombat(g); else { set(g, 'search'); g.tgt.x = z.lastSeen.x; g.tgt.y = z.lastSeen.y; g.tgt.z = z.lastSeen.z; goTo(g, g.tgt.x, g.tgt.y, g.tgt.z); }
    if (!remote) send({ op: 'spawn', z: zid, i, x: +x.toFixed(2), y: +y.toFixed(2), zz: +zz.toFixed(2) });
    return g;
  };
  // the next free reserve of a zone: one never used, or a body nobody is near (reused off screen)
  S.freeReserve = (zid, far) => {
    const z = Z(zid); if (!z) return -1; const p = AF.player;
    for (const g of z.guards) if (g.reserve && !g.live) return g.i;
    for (const g of z.guards) if (g.reserve && g.down && g.carrier < 0 && Math.hypot(g.a.x - p.x, g.a.z - p.z) > (far || 25)) return g.i;
    return -1;
  };
  const bodyIt = AF.addInteract({ x: 0, y: -999, z: 0, r: 1.7, prio: 2.7, label: 'Carry the body', can: () => AF.mode === 'walk' && (!!S.carrying || !!bodyIt.g), act: () => { if (S.carrying) drop(); else pickUp(bodyIt.g); } });
  const carryTick = (z, dt) => {
    const p = AF.player, g = S.carrying;
    if (g) {
      if (!z || !z.guards.includes(g) || !g.down || AF.mode !== 'walk') { if (z && z.guards.includes(g) && g.down) drop(); else S.carrying = null; return; }
      // over the shoulder: the body lies across the carrier, its middle on the shoulder
      const yaw = p.yaw + PI / 2, sx = Math.sin(yaw), sz = Math.cos(yaw);
      bodyAt(g, p.x - sx * 0.8 - Math.sin(p.yaw) * 0.12, p.y + 1.18, p.z - sz * 0.8 - Math.cos(p.yaw) * 0.12, yaw);
      const h = hideNear(z, p.x, p.y, p.z);
      bodyIt.x = p.x; bodyIt.y = p.y + 1; bodyIt.z = p.z; bodyIt.label = h ? 'Hide the body ' + (h.label || 'here') : 'Put the body down';
      if (!S.isAuth() && (CARRY.sendT -= dt) <= 0) { CARRY.sendT = 1 / 6; send({ op: 'cpos', z: z.id, i: g.i, x: +g.a.ctl.x.toFixed(2), y: +g.a.ctl.y.toFixed(2), zz: +g.a.ctl.z.toFixed(2), yaw: +yaw.toFixed(2) }, S.auth); }
      return;
    }
    bodyIt.g = null; bodyIt.y = -999;
    if (!z || AF.mode !== 'walk') return;
    let bd = 2.2;
    for (const o of z.guards) {
      if (!o.down || o.hid || o.carrier >= 0 || !o.a) continue;
      const d = Math.hypot(o.a.x - p.x, o.a.z - p.z); if (d < bd && Math.abs(o.a.y - p.y) < 1.6) { bd = d; bodyIt.g = o; }
    }
    if (bodyIt.g) { const a = bodyIt.g.a; bodyIt.x = a.x; bodyIt.y = a.y + 0.6; bodyIt.z = a.z; bodyIt.label = hideNear(z, a.x, a.y, a.z) ? 'Hide the body' : 'Carry the body'; }
  };

  // ---------------------------------------------------------------- activation / reset
  S.activate = (zid) => {
    const z = zid ? Z(zid) : null;
    if (S.zone === z) return;
    if (S.zone) leave(S.zone);
    S.zone = z; S.alarm = false; S.reflex = null; S.rset.length = 0; S.caution = 0;
    if (z) { z.alarm = false; for (const g of z.guards) if (g.path) g.path.enabled = true; }
    hud(true);
  };
  const leave = (z) => {
    if (S.carrying && z.guards.includes(S.carrying)) { S.carrying.carrier = -1; S.carrying = null; }
    for (const g of z.guards) AF.alertMark.clear('g' + z.id + g.i);
    for (const c of z.cams) AF.alertMark.clear('c' + z.id + c.i);
  };
  S.reset = (zid) => {
    const z = Z(zid); if (!z) return;
    z.alarm = false; if (S.zone === z) { S.alarm = false; S.reflex = null; S.rset.length = 0; S.caution = 0; }
    for (const g of z.guards) {
      const a = g.a; g.down = false; g.lv = 0; g.hp = g.hp0 || 100; g.st = 'patrol'; g.t = 0; g.route = null; g.home = null; g.hid = false; g.carrier = -1; g.seenBy = null; g.flagged = false;
      if (g.path && S.carrying === g) S.carrying = null;
      if (g.path) { a.ctl = null; a.aim = 0; a.lag = 0; a.rx = null; a.rxOn = false; a.tilt = a.lift = 0; }
      if (g.npc && g.npc.root) { g.npc.root.rotation.x = 0; g.npc.down = false; }
      if (g.reserve) { g.down = true; g.hid = true; g.live = false; }
      AF.alertMark.clear('g' + z.id + g.i);
    }
    for (const c of z.cams) { c.off = 0; c.lv = 0; c.alarmed = false; AF.alertMark.clear('c' + z.id + c.i); }
    for (const l of z.lights) { l.off = 0; setLamps(l, true); }
    for (const p of z.points) p.cd = 0;
    hud(true);
  };

  // ---------------------------------------------------------------- the 15 Hz sense step (authority only) + per-frame motion
  let senseAcc = 0, syncAcc = 0;
  const sense = (z, dt) => {
    const np = gather(z); z.seen = false;
    const caution = S.caution > 0 ? 1.35 : 1;
    for (const g of z.guards) {
      if (g.down || !g.a || (g.path && !g.path.active && !g.a.ctl)) continue;
      const a = g.a, yaw = a.ctl ? a.ctl.yaw : a.yaw, fx = Math.sin(yaw), fz = Math.cos(yaw), ex = a.x, ey = a.y + g.eye, ez = a.z;
      let best = 0, bq = null;
      if (np) for (const q of PS) {
        if (!q.on) continue;
        const dx = q.x - ex, dz = q.z - ez, d = Math.hypot(dx, dz), dy = q.y - a.y;
        if (Math.abs(dy) > 3.2) continue;
        // hearing: footsteps carry noise * 15 m (sprint 15, walk ~5, crouch-walk ~2)
        const hr = q.noise * 15 * z.hearing;
        if (hr > 0.5 && d < hr && g.st !== 'combat' && g.st !== 'alert') { g.heard += dt; if (g.heard > 0.25) { g.heard = 0; g.lv = Math.max(g.lv, 0.36); toSus(g, q.x, q.y, q.z, 'noise'); } }
        // sight
        const rng = g.range * z.sight * caution * (z.alarm ? 1.5 : 1);
        if (d > rng) continue;
        const c = (dx * fx + dz * fz) / (d || 1);
        if (d > 1.3 && c < g.fov) continue;
        const ty = q.y + q.eye * 0.8;
        if (!los(ex, ey, ez, q.x, ty, q.z) && !los(ex, ey, ez, q.x, q.y + q.eye, q.z)) continue;
        let k = Math.pow(1 - d / rng, 0.55) * (c > 0.8 ? 1 : 0.5);
        if (d < 1.3) k = 0.9;
        if (S.isDark(z, q.x, q.y, q.z)) k *= d < 3 ? 0.7 : 0.32;
        if (q.crouch) k *= d < 3.5 ? 0.8 : 0.5;
        k *= q.moving ? (q.noise > 0.8 ? 1.35 : 1) : 0.6;
        // a weapon in hand or a body over the shoulder: no uniform covers that, and a strict zone (the liner) reacts at once
        const flagged = z.strict && (q.armed || q.carry);
        if (flagged) k = Math.max(k, 0.5) * 4;
        else if (z.disguise && z.disguise(q.slot)) k *= d < 2.2 && c > 0.8 ? 0.35 : 0.08;
        if (k > best) { best = k; bq = q; g.flagged = flagged; }
      }
      // bodies: a guard who sees a downed colleague raises the alarm (hidden bodies and ones being carried don't count)
      if (!best && !z.alarm && g.st !== 'alert') for (const o of z.guards) {
        if (!o.down || o === g || o.seenBy || o.hid || o.carrier >= 0) continue;
        const dx = o.a.x - ex, dz = o.a.z - ez, d = Math.hypot(dx, dz);
        if (d > 11 || Math.abs(o.a.y - a.y) > 3 || (dx * fx + dz * fz) / (d || 1) < g.fov || !los(ex, ey, ez, o.a.x, o.a.y + 0.3, o.a.z)) continue;
        o.seenBy = g; bark(g, 'body', true); g.tgt.x = o.a.x; g.tgt.y = o.a.y; g.tgt.z = o.a.z; toAlert(g, -1); break;
      }
      if (best > 0) {
        z.seen = true; z.lastSeen.x = bq.x; z.lastSeen.y = bq.y; z.lastSeen.z = bq.z; z.lastSeen.t = AF.clock.t;
        g.lastQ = bq.slot;
        if (g.st === 'combat') { g.tgt.x = bq.x; g.tgt.y = bq.y; g.tgt.z = bq.z; g.see = true; continue; }
        g.lv = Math.min(1, g.lv + best * 1.55 * dt);
        g.tgt.x = bq.x; g.tgt.y = bq.y; g.tgt.z = bq.z;
        if (g.lv >= 1) { toAlert(g, bq.slot); if (g.flagged && !z.alarm) S.raiseAlarm(bq.carry ? 'A guard saw you carrying a body' : 'A guard saw your weapon', g); }
        else if (g.lv > 0.3 && (g.st === 'patrol' || g.st === 'return' || g.st === 'look')) toSus(g, bq.x, bq.y, bq.z, 'sight');
      } else {
        g.see = false;
        if (g.st !== 'alert' && g.st !== 'combat') g.lv = Math.max(0, g.lv - dt * (g.st === 'search' || g.st === 'look' ? 0.06 : 0.16));
      }
    }
    // cameras: a cone on a sweep; a full meter trips the alarm at once (no reflex — have the hacker loop them)
    for (const c of z.cams) {
      if (c.off > 0) continue;
      let best = 0;
      if (np) for (const q of PS) {
        if (!q.on) continue;
        const cy = Math.cos(c.pitch), dx = q.x - c.x, dy = q.y + q.eye * 0.7 - c.y, dz = q.z - c.z, d = Math.hypot(dx, dy, dz);
        if (d > c.range) continue;
        const cc = (dx * Math.sin(c.yaw) * cy + dz * Math.cos(c.yaw) * cy - dy * Math.sin(c.pitch)) / (d || 1);
        if (cc < c.fov || !los(c.x, c.y - 0.2, c.z, q.x, q.y + q.eye * 0.7, q.z)) continue;
        let k = Math.pow(1 - d / c.range, 0.4); if (S.isDark(z, q.x, q.y, q.z)) k *= 0.45; if (q.crouch) k *= 0.8; if (z.disguise && z.disguise(q.slot)) k *= 0.1;
        if (k > best) { best = k; z.lastSeen.x = q.x; z.lastSeen.y = q.y; z.lastSeen.z = q.z; z.lastSeen.t = AF.clock.t; }
      }
      if (best > 0) { c.lv = Math.min(1, c.lv + best * 0.75 * dt); if (c.lv >= 1 && !z.alarm) { c.alarmed = true; S.raiseAlarm('A camera saw you', null); } }
      else c.lv = Math.max(0, c.lv - dt * 0.3);
    }
  };
  const motion = (z, dt) => {
    const auth = S.isAuth();
    for (const g of z.guards) {
      if (!g.a) continue;
      const a = g.a; g.t += dt;
      if (!auth || g.down) { if (!auth && g.net) remoteStep(g, dt); continue; }
      switch (g.st) {
        case 'sus':
          faceTo(g, g.tgt.x, g.tgt.z, dt, 3);
          if (g.lv >= 0.55 || (g.t > 1.6 && g.lv > 0.32)) toSearch(g);
          else if (g.t > 3 && g.lv < 0.3) toReturn(g);
          break;
        case 'search':
          if (walk(g, dt, 1.45)) { set(g, 'look'); g.look0 = a.ctl ? a.ctl.yaw : a.yaw; }
          break;
        case 'look':
          if (a.ctl) a.ctl.yaw = g.look0 + Math.sin(g.t * 1.4) * 1.1;
          if (g.t > 4.5) { if (g.lv > 0.6) { g.t = 0; } else toReturn(g); }
          break;
        case 'return':
          if (walk(g, dt, 1.3)) { dropCtl(g); set(g, 'patrol'); }
          if (g.lv > 0.32) toSus(g, g.tgt.x, g.tgt.y, g.tgt.z, 'sight');
          break;
        case 'alert':
          faceTo(g, g.tgt.x, g.tgt.z, dt, 6); if (a.ctl) a.aim = Math.min(1, (a.aim || 0) + dt * 3);
          if (!S.reflex && !z.alarm && g.t > 0.4) { S.raiseAlarm(z.mode === 'fight' ? 'A guard raised the alarm' : 'Spotted', g); }
          else if (z.alarm && z.mode === 'fight') toCombat(g);
          break;
        case 'combat': combat(z, g, dt); break;
      }
      if (g.st !== 'combat' && g.st !== 'alert' && a.ctl && a.aim) a.aim = Math.max(0, a.aim - dt * 2);
    }
    // the reflex window: take the guard down before it closes
    if (S.reflex) { S.reflexT -= dt; if (S.reflexT <= 0 && auth) { const g = S.rset.find((q) => !q.down) || null; S.reflex = null; S.rset.length = 0; if (g) S.raiseAlarm(z.mode === 'fight' ? 'A guard raised the alarm' : 'Spotted', g); } }
    // evasion: 45 s without anyone seeing a player ends the alarm (MGS: alert -> evasion -> caution)
    if (z.alarm && auth && z.mode === 'fight') { if (z.seen) S.evadeT = 0; else if ((S.evadeT += dt) > 45) S.calm(); }
    if (S.caution > 0) S.caution -= dt;
    for (const c of z.cams) { if (c.off > 0) c.off -= dt; c.yaw = c.yaw0 + Math.sin((AF.clock.w / c.period + c.ph) * PI * 2) * c.sweep; }
    for (const l of z.lights) if (l.off > 0 && (l.off -= dt) <= 0) { l.off = 0; setLamps(l, true); }
    for (const p of z.points) if (p.cd > 0) p.cd -= dt;
  };
  // zones with holds (the stash maze): only the `hunters` nearest the crew's last sighting close in; the rest each take the nearest free
  // hold point (re-dealt once a second) and wait there, firing at whoever comes into view
  const FIGHT = [];
  const dealRoles = (z) => {
    const now = AF.clock.t; if (now - (z.roleT || -9) < 1) return; z.roleT = now;
    const L = z.lastSeen, P = z.holds; FIGHT.length = 0;
    for (const g of z.guards) { if (!g.down && g.st === 'combat' && g.a && g.a.ctl) { g.rd = Math.hypot(g.a.ctl.x - L.x, g.a.ctl.z - L.z); FIGHT.push(g); } else g.hold = -1; }
    FIGHT.sort((a, b) => a.rd - b.rd);
    const used = new Set();
    FIGHT.forEach((g, k) => {
      if (k < (z.hunters || 2)) { g.hold = -1; return; }
      let best = g.hold >= 0 && !used.has(g.hold) ? g.hold : -1;
      if (best < 0) { let bd = 1e9; const c = g.a.ctl; for (let i = 0; i < P.length; i++) { if (used.has(i)) continue; const d = Math.hypot(P[i][0] - c.x, P[i][2] - c.z); if (d < bd) { bd = d; best = i; } } }
      if (best < 0) best = k % P.length;
      if (best !== g.hold) g.route = null;
      g.hold = best; used.add(best);
    });
  };
  const combat = (z, g, dt) => {
    const a = g.a, c = a.ctl; if (!c) return;
    if (z.holds && z.holds.length) dealRoles(z);
    const q = PS[g.lastQ & 3], tx = g.see && q && q.on ? q.x : g.tgt.x, tz = g.see && q && q.on ? q.z : g.tgt.z, d = Math.hypot(tx - c.x, tz - c.z);
    if (g.see && d < 24) {
      c.moving = false; faceTo(g, tx, tz, dt, 7); a.aim = Math.min(1, (a.aim || 0) + dt * 4);
      if ((g.fireT -= dt) <= 0 && a.aim > 0.8 && g.armed) { g.fireT = 0.85 + AF.whash(g.i, AF.clock.frame) * 0.6; shoot(g, q, d); }
      g.route = null;
    } else if (g.hold >= 0) {
      const h = z.holds[g.hold];
      if (Math.hypot(h[0] - c.x, h[2] - c.z) > 0.6) { if (!g.route || g.ri >= g.route.length) goTo(g, h[0], h[1], h[2]); walk(g, dt, 3.1); a.aim = Math.max(0.3, (a.aim || 0) - dt); }
      else { c.moving = false; g.route = null; faceTo(g, tx, tz, dt, 3); a.aim = Math.min(1, (a.aim || 0) + dt * 2); }
    } else {
      a.aim = Math.max(0.3, (a.aim || 0) - dt);
      if (!g.route || g.ri >= g.route.length || (g.t > 1.5 && (g.t = 0, true))) goTo(g, tx, g.tgt.y, tz);
      walk(g, dt, 3.1);
    }
  };
  const shoot = (g, q, d) => {
    const a = g.a, yaw = a.ctl.yaw, gx = a.x + Math.sin(yaw) * 0.5, gy = a.y + 1.35, gz = a.z + Math.cos(yaw) * 0.5;
    const hitP = AF.clamp(0.62 - d / 34 - (q.moving ? 0.18 : 0) - (q.crouch ? 0.12 : 0), 0.1, 0.7), hit = Math.random() < hitP;
    const tx = q.x + (hit ? 0 : (Math.random() - 0.5) * 2.2), ty = q.y + (hit ? 1.1 : 0.4 + Math.random() * 1.6), tz = q.z + (hit ? 0 : (Math.random() - 0.5) * 2.2);
    const CB = AF.combat;
    if (CB && CB.tracer) CB.tracer(gx, gy, gz, tx, ty, tz, false); else if (AF.fx && AF.fx.line) AF.fx.line(gx, gy, gz, tx, ty, tz);
    if (AF.audio) AF.audio.play('rev', { x: gx, y: gy, z: gz, vol: 0.8 });
    if (hit) {
      if (q.slot === mySlot()) { if (AF.health && !AF.health.dead) AF.health.hurt(7 + Math.round(Math.random() * 5), 'guard'); }
      else send({ op: 'shot', z: g.z, i: g.i, d: 10 }, q.slot);
    }
    if (S.isAuth()) send({ op: 'fire', z: g.z, i: g.i, x: +tx.toFixed(1), y: +ty.toFixed(1), zz: +tz.toFixed(1) });
  };

  // ---------------------------------------------------------------- co-op: guard state stream from the authority
  const GS = [];
  const syncOut = (z) => {
    GS.length = 0;
    for (const g of z.guards) {
      if (!g.a || (!g.a.ctl && g.lv < 0.02 && !g.down) || (g.reserve && !g.live)) continue;
      const a = g.a, c = a.ctl || a;
      GS.push([g.i, ST.indexOf(g.st), +c.x.toFixed(2), +c.y.toFixed(2), +c.z.toFixed(2), +c.yaw.toFixed(2), c.moving ? 1 : 0, +(a.aim || 0).toFixed(2), +g.lv.toFixed(2), g.down ? 1 : 0, g.hid ? 1 : 0, g.carrier + 1]);
    }
    const cams = z.cams.map((c) => +c.lv.toFixed(2));
    send({ op: 'gs', z: z.id, g: GS, c: cams, al: z.alarm ? 1 : 0 });
  };
  const ST = ['patrol', 'sus', 'search', 'look', 'return', 'alert', 'combat', 'down'];
  const remoteStep = (g, dt) => {
    const a = g.a, n = g.net; if (!a.ctl) return;
    const k = 1 - Math.exp(-dt * 10), c = a.ctl, dx = n.x - c.x, dz = n.z - c.z;
    if (dx * dx + dz * dz > 25) { c.x = n.x; c.z = n.z; } else { c.x += dx * k; c.z += dz * k; c.ph += Math.hypot(dx * k, dz * k) * 4.2; }
    c.y += (n.y - c.y) * k; c.yaw += AF.angDiff(c.yaw, n.yaw) * k; c.moving = n.mv; a.aim = n.aim;
  };
  const ingest = (z, list, cams, al) => {
    const seen = new Set();
    for (const r of list) {
      if (!Array.isArray(r) || r.length < 10) continue;
      const g = z.guards[r[0] | 0]; if (!g || !g.a) continue; seen.add(g);
      const st = ST[r[1] | 0] || 'patrol';
      if (r[9] && !g.down) { g.down = true; if (g.path) { takeCtl(g); AF.walkers.knock(g.a, 0, 1, 1.3, 1e6); } }
      g.st = st; g.lv = +r[8] || 0;
      if (g.down && r.length >= 12) {
        const cr = (r[11] | 0) - 1; g.hid = !!r[10];
        if (cr !== mySlot() || S.carrying !== g) { g.carrier = AF.clamp(cr, -1, 3); if (S.carrying === g) S.carrying = null; bodyAt(g, +r[2], +r[3], +r[4], +r[5]); }
      }
      if (g.path && !g.down) { if (!g.a.ctl) takeCtl(g); g.net = g.net || {}; Object.assign(g.net, { x: +r[2], y: +r[3], z: +r[4], yaw: +r[5], mv: !!r[6], aim: +r[7] || 0 }); }
    }
    for (const g of z.guards) if (!seen.has(g) && !g.down && g.a && g.a.ctl && g.net) { dropCtl(g); g.net = null; g.st = 'patrol'; g.lv = 0; }
    if (Array.isArray(cams)) cams.forEach((v, i) => { if (z.cams[i]) z.cams[i].lv = +v || 0; });
    if (al && !z.alarm) S.raiseAlarm('', null, true); else if (!al && z.alarm) S.calm(true);
  };
  if (N && N.on) N.on('stealth', (m, from) => {
    if (!m || typeof m.op !== 'string') return;
    const z = typeof m.z === 'string' ? Z(m.z) : null; if (!z || S.zone !== z) return;
    const int = (v, lo, hi) => Number.isInteger(v) && v >= lo && v <= hi;
    switch (m.op) {
      case 'gs': if (from === S.auth && from !== mySlot() && Array.isArray(m.g) && m.g.length <= 32) ingest(z, m.g, m.c, m.al); break;
      case 'hit': if (S.isAuth() && int(m.i, 0, z.guards.length - 1)) { const g = z.guards[m.i]; if (!g.down) applyHit(g, m.k ? 'melee' : 'shot', +m.fx || 0, +m.fz || 0, { head: !!m.h, silenced: !!m.s, dmg: AF.clamp(+m.d || 30, 1, 300) }, from); } break;
      case 'ko': if (from === S.auth && int(m.i, 0, z.guards.length - 1)) knockOut(z.guards[m.i], +m.fx || 0, +m.fz || 1, 'remote'); break;
      case 'act': if (S.isAuth() && ['loop', 'dark', 'dist', 'reset'].includes(m.k) && int(m.id, 0, 64)) S.act(m.k, m.id, AF.clamp(+m.s || 20, 1, 90), true); break;
      case 'actx': if (from === S.auth && ['loop', 'dark', 'dist', 'reset'].includes(m.k) && int(m.id, 0, 64)) applyAct(z, m.k, m.id, AF.clamp(+m.s || 20, 1, 90), true); break;
      case 'alarm': if (from === S.auth && !z.alarm) S.raiseAlarm(typeof m.why === 'string' ? m.why.slice(0, 80) : '', null, true); break;
      case 'calm': if (from === S.auth) S.calm(true); break;
      case 'carry': if (S.isAuth() && int(m.i, 0, z.guards.length - 1)) {
        const g = z.guards[m.i]; if (!g.down) break;
        if (m.on === 1) { if (g.carrier < 0 && !g.hid) g.carrier = from; }
        else if (g.carrier === from && [m.x, m.y, m.zz].every(Number.isFinite)) { putDown(g, m.x, m.y, m.zz, +m.yaw || 0, m.hid === 1 && !!hideNear(z, m.x, m.y, m.zz)); emit('body', g, { hid: g.hid }); }
      } break;
      case 'cpos': if (S.isAuth() && int(m.i, 0, z.guards.length - 1) && [m.x, m.y, m.zz].every(Number.isFinite)) { const g = z.guards[m.i]; if (g.down && g.carrier === from) bodyAt(g, m.x, m.y, m.zz, +m.yaw || 0); } break;
      case 'spawn': if (int(m.i, 0, z.guards.length - 1) && [m.x, m.y, m.zz].every(Number.isFinite)) S.spawn(z.id, m.i, m.x, m.y, m.zz, true); break;
      case 'areq': if (S.isAuth() && !z.alarm) S.raiseAlarm(typeof m.why === 'string' ? m.why.slice(0, 80) : 'Alarm'); break;
      case 'shot': if (AF.health && !AF.health.dead && AF.mode === 'walk') AF.health.hurt(AF.clamp(+m.d || 10, 1, 20), 'guard'); break;
      case 'fire': if (from === S.auth && int(m.i, 0, z.guards.length - 1) && [m.x, m.y, m.zz].every(Number.isFinite)) { const a = z.guards[m.i].a, CB = AF.combat; if (a && CB && CB.tracer) CB.tracer(a.x, a.y + 1.35, a.z, m.x, m.y, m.zz, false); if (AF.audio && a) AF.audio.play('rev', { x: a.x, y: a.y + 1.3, z: a.z, vol: 0.8 }); } break;
    }
  });

  // ---------------------------------------------------------------- HUD: marks, vignette, the phase tag (ALERT / EVASION / CAUTION)
  let tagTxt = '', vigOn = '';
  const hud = (force) => {
    const z = S.zone;
    const txt = !z ? '' : S.reflex ? 'Reflex \u2014 take him down!' : z.alarm ? (z.mode === 'fight' ? (z.seen ? 'Alert' : 'Evasion ' + Math.max(0, Math.ceil(45 - S.evadeT))) : 'Spotted') : S.caution > 0 ? 'Caution' : '';
    if (txt !== tagTxt || force) { tagTxt = txt; tag.textContent = txt; tag.classList.toggle('on', !!txt); tag.classList.toggle('caution', !!txt && !z.alarm && !S.reflex); }
    const v = !z ? '' : S.reflex ? 'reflex' : z.alarm && z.seen ? 'on' : '';
    if (v !== vigOn || force) { vigOn = v; vig.className = v === 'reflex' ? 'on reflex' : v; }
  };
  const marks = (z) => {
    const cp = AF.camera.position;
    for (const g of z.guards) {
      const id = 'g' + z.id + g.i;
      if (g.down || !g.a || (g.lv < 0.04 && g.st !== 'alert' && g.st !== 'combat') || (g.a.x - cp.x) ** 2 + (g.a.z - cp.z) ** 2 > (S.reflex === g ? 3600 : 900)) { AF.alertMark.clear(id); continue; }
      const st = g.st === 'alert' || g.st === 'combat' ? 2 : 1;
      AF.alertMark.set(id, g.a.x, g.a.y + 2.3, g.a.z, st === 2 ? 1 : g.lv, st);
    }
    for (const c of z.cams) { const id = 'c' + z.id + c.i; if (c.off > 0 || c.lv < 0.04) AF.alertMark.clear(id); else AF.alertMark.set(id, c.x, c.y + 0.5, c.z, c.lv, c.lv >= 1 ? 2 : 1, true); }
  };
  // camera models follow their sweep (only the active zone's, only when near)
  const camMeshes = (z) => {
    const cp = AF.camera.position;
    for (const c of z.cams) {
      const m = c.mesh; if (!m) continue;
      const near = (c.x - cp.x) ** 2 + (c.z - cp.z) ** 2 < 70 * 70; if (m.visible !== near) m.visible = near;
      if (near) { m.rotation.y = c.yaw; if (c.led) c.led.visible = c.off <= 0 && (AF.clock.t * 1.2) % 1 < 0.5; }
    }
  };

  AF.onTick('stealth', 430, (dt) => {
    const z = S.zone;
    if (!z) { if (S.carrying) S.carrying = null; if (bodyIt.g || bodyIt.y > -900) { bodyIt.g = null; bodyIt.y = -999; } if (tagTxt || vigOn) hud(true); return; }
    // only near the zone: everything sleeps when nobody is within its radius
    const cp = AF.camera.position, b = z.box, near = cp.x > b[0] - z.radius && cp.x < b[3] + z.radius && cp.z > b[2] - z.radius && cp.z < b[5] + z.radius;
    camMeshes(z);
    if (!near) return;
    carryTick(z, dt);
    S.auth = authority(z);
    if (S.isAuth()) { senseAcc += dt; if (senseAcc >= 1 / 15) { sense(z, Math.min(0.2, senseAcc)); senseAcc = 0; } }
    motion(z, dt);
    marks(z); hud(false);
    if (online() && S.isAuth() && (syncAcc += dt) > 1 / 6) { syncAcc = 0; syncOut(z); }
  });

  // ---------------------------------------------------------------- tests
  AF.test('stealth: a guard sees ahead not behind, hears a sprint, investigates and walks back onto his route', () => {
    const WKs = AF.walkers; if (!WKs || !WKs.addPath) return { ok: false, info: 'no walkers' };
    let path = S._tp;
    if (!path) { path = S._tp = WKs.addPath('stealth test', [[200, 60.5, 200], [210, 60.5, 200]], { count: 1, speed: 1, mode: 'pingpong', activeRadius: 200 }); }
    const z = Z('test') || S.define('test', { box: [190, 55, 190, 225, 70, 215], mode: 'fail' });
    if (!z.guards.length) S.guard('test', { path });
    const g = z.guards[0], a = g.a, keep = S.zone, P = AF.player, k0 = { x: P.x, y: P.y, z: P.z, yaw: P.yaw }, mode = AF.mode, cam = AF.camera.position.clone();
    const fake = { x: 0, y: 60.5, z: 0 };
    try {
      S.activate('test'); S.reset('test'); AF.camera.position.set(205, 63, 205); path.active = true;
      a.x = 205; a.y = 60.5; a.z = 200; a.yaw = 0;
      // in front, 5 m: suspicion rises; behind: nothing
      PS.forEach((q) => { q.on = false; });
      const look = (x, z2, noise) => { const q = PS[0]; q.on = true; q.x = x; q.y = 60.5; q.z = z2; q.eye = 1.5; q.crouch = false; q.moving = false; q.noise = noise; };
      g.lv = 0; look(205, 205, 0); const sawFront = (() => { const ex = a.x, ey = a.y + 1.62, ez = a.z; return los(ex, ey, ez, 205, 61.7, 205); })();
      g.lv = 0; g.st = 'patrol'; senseFor(z, g, 205, 205, 0); const front = g.lv > 0;
      S.reset('test'); a.x = 205; a.y = 60.5; a.z = 200; a.yaw = 0; senseFor(z, g, 205, 195, 0); const back = g.lv === 0 && g.st === 'patrol';
      S.reset('test'); a.x = 205; a.y = 60.5; a.z = 200; a.yaw = 0; senseFor(z, g, 205, 194, 1); const heard = g.st === 'sus' && !!a.ctl;
      // investigate then return: run the motion with a big dt
      for (let i = 0; i < 400 && g.st !== 'patrol'; i++) { g.lv = Math.min(g.lv, 0.2); motion(z, 0.1); }
      const back2 = g.st === 'patrol' && !a.ctl;
      return { ok: sawFront && front && back && heard && back2, info: `los ${sawFront}, front ${front}, behind ${back}, heard ${heard}, returned ${back2}` };
    } finally { S.reset('test'); S.activate(keep ? keep.id : null); path.enabled = false; AF.camera.position.copy(cam); if (mode === 'walk') P.teleport(k0.x, k0.y, k0.z, k0.yaw); void fake; }
  });
  // test helper: one sense step against a fake local player at (x, z)
  const senseFor = (z, g, x, zz, noise) => {
    const savedMode = AF.mode, p = AF.player, keep = { x: p.x, y: p.y, z: p.z, noise: p.noise, crouch: p.crouch };
    try { AF.mode = 'walk'; p.x = x; p.y = 60.5; p.z = zz; p.noise = noise; p.crouch = false; S.auth = mySlot(); for (let i = 0; i < 4; i++) sense(z, 0.25); }
    finally { AF.mode = savedMode; Object.assign(p, keep); }
  };
}
} catch (e) { AF.partError('80-stealth.js', e); }
