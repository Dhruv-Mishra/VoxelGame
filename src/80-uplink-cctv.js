// ================================================================ 80-uplink-cctv.js
try {
// ===== 80-uplink-cctv: the hacker's chair — live security-camera feeds of a stealth zone ('cctv' mode)  (OWNER: game) =====
// AF.cctv.open({ zone, actions(), tablet, onExit }) puts the view behind one of the zone's cameras (80-stealth S.camera: security cams
// that also detect, plus view-only feeds with range 0). The hacker pans (drag / mouse / arrows), switches feeds (Q/E, ◀ ▶, the list
// or 1-9) and sees every guard tagged with his state, the crewmate inside, light circuits and noise makers. Nothing is free: looping a
// camera, killing a light circuit, ringing a phone or a mission action (unlock a hatch, override the time lock, cut the lasers)
// runs a minigame (76-minigame) first, then has a cooldown. The body stays where it is (at the terminal, or crouched with a
// tablet in solo); in co-op the actions go to the zone's authority through 80-stealth's 'act' messages.
{
  const PI = Math.PI, S = AF.stealth;
  const css = document.createElement('style');
  css.textContent = `#cctv{position:fixed;inset:0;z-index:8;display:none;pointer-events:none;font:600 13px/1.25 ui-monospace,Menlo,Consolas,monospace;color:#cfe9d4;letter-spacing:.04em}
#cctv.on{display:block}
#cctv .scan{position:absolute;inset:0;background:repeating-linear-gradient(0deg,rgba(0,0,0,.18) 0 1px,transparent 1px 3px),radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(0,0,0,.65) 100%);}
#cctv .tint{position:absolute;inset:0;background:rgba(40,90,60,.16)}
#cctv .static{position:absolute;inset:0;opacity:0;background:repeating-radial-gradient(circle at 37% 41%,#777 0 1px,#111 1px 2px,#aaa 2px 3px);transition:opacity .15s}
#cctv .static.on{opacity:.92}
#cctv .top{position:absolute;left:18px;top:14px;right:18px;display:flex;justify-content:space-between;text-shadow:0 1px 2px #000}
#cctv .rec::before{content:'';display:inline-block;width:9px;height:9px;border-radius:50%;background:#e33;margin-right:7px;vertical-align:1px;animation:cc-blink 1s steps(2) infinite}
@keyframes cc-blink{50%{opacity:0}}
#cctv .name{font-size:16px;color:#fff}
#cctv .list{position:absolute;left:14px;top:60px;display:flex;flex-direction:column;gap:3px;pointer-events:auto}
#cctv .list button,#cctv .acts button,#cctv .nav button{font:inherit;color:#cfe9d4;background:rgba(8,20,14,.72);border:1px solid rgba(160,230,180,.35);border-radius:3px;padding:5px 10px;text-align:left;cursor:pointer}
#cctv .list button.cur{background:rgba(60,170,100,.55);color:#fff;border-color:#9fe8b8}
#cctv .list button.off{color:#f0b060}
#cctv .acts{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:92vw;pointer-events:auto}
#cctv .acts button{padding:8px 12px}
#cctv .acts button.mis{border-color:#ffd23a;color:#ffe9a0}
#cctv .acts button[disabled]{opacity:.45;cursor:default}
#cctv .nav{position:absolute;right:14px;top:60px;display:flex;gap:6px;pointer-events:auto}
#cctv .hint{position:absolute;right:18px;bottom:70px;opacity:.75;text-align:right;font-size:11px}
#cctv .tag{position:absolute;left:0;top:0;transform:translate(-50%,-100%);white-space:nowrap;font-size:11px;padding:1px 5px;border-radius:2px;background:rgba(0,0,0,.55);border:1px solid rgba(200,255,210,.35);display:none}
#cctv .tag.g1{border-color:#ffd23a;color:#ffe680}#cctv .tag.g2{border-color:#ff4040;color:#ff9090;background:rgba(80,0,0,.6)}
#cctv .tag.me{border-color:#5fd0ff;color:#bfefff}#cctv .tag.pt{pointer-events:auto;cursor:pointer;border-color:#9fe8b8}#cctv .tag.pt:hover{background:rgba(60,170,100,.7)}
#cctv .tag.lt{border-color:#ffe28a;color:#fff3c4}#cctv .tag.dn{opacity:.55;text-decoration:line-through}
#cctv .msg{position:absolute;left:50%;top:22%;transform:translateX(-50%);padding:6px 14px;background:rgba(0,0,0,.6);border:1px solid rgba(160,230,180,.4);opacity:0;transition:opacity .25s}
#cctv .msg.on{opacity:1}
#cctv.busy .tags,#cctv.busy .list,#cctv.busy .nav,#cctv.busy .acts,#cctv.busy .hint{display:none}
body.cctv-on #ui .hud,body.cctv-on #h-cross,body.cctv-on #h-xh,body.cctv-on #h-hm,body.cctv-on #alert-marks{display:none!important}`;
  document.head.appendChild(css);
  const el = document.createElement('div'); el.id = 'cctv';
  el.innerHTML = '<div class="tint"></div><div class="scan"></div><div class="static"></div><div class="top"><span class="rec">REC <span class="clock"></span></span><span class="name"></span><span class="feed"></span></div>' +
    '<div class="list"></div><div class="nav"><button data-n="-1">\u25c0 PREV</button><button data-n="1">NEXT \u25b6</button><button data-x="1">\u2715 EXIT</button></div><div class="tags"></div><div class="msg"></div><div class="hint"></div><div class="acts"></div>';
  document.body.appendChild(el);
  const $ = (s) => el.querySelector(s), nameEl = $('.name'), clockEl = $('.clock'), feedEl = $('.feed'), listEl = $('.list'), actsEl = $('.acts'), tagsEl = $('.tags'), staticEl = $('.static'), msgEl = $('.msg'), hintEl = $('.hint');
  const CC = AF.cctv = { on: false, o: null, zone: null, i: 0, pan: 0, tilt: 0, busy: false, cd: 0, msgT: 0 };
  const feeds = () => (CC.zone ? CC.zone.cams : []);
  const msg = (t) => { msgEl.textContent = t; msgEl.classList.add('on'); CC.msgT = 2.6; };
  CC.msg = msg;

  // ---------------------------------------------------------------- tags: guards, the crew inside, noise makers, light circuits (pooled DOM)
  const TAGS = []; let nTag = 0;
  // what the lens can see, re-checked ~7 times a second (tags through walls would give the maze away)
  const VIS = new Map(); let visT = 0;
  const seen = (key, x, y, z) => { let v = VIS.get(key); if (v === undefined) { const c = AF.camera.position; v = S.los(c.x, c.y, c.z, x, y, z); VIS.set(key, v); } return v; };
  const tagAt = (x, y, z, text, cls, onClick, key) => {
    if (key && !seen(key, x, y - 0.3, z)) return;
    const v = TV.set(x, y, z).project(AF.camera); if (v.z > 1 || v.x < -1.1 || v.x > 1.1 || v.y < -1.1 || v.y > 1.1) return;
    let t = TAGS[nTag];
    if (!t) { const e = document.createElement('div'); e.className = 'tag'; e.addEventListener('pointerdown', (ev) => { ev.stopPropagation(); if (e._click) e._click(); }); tagsEl.appendChild(e); t = TAGS[nTag] = { e, text: '', cls: '' }; }
    nTag++;
    if (t.text !== text) { t.text = text; t.e.textContent = text; }
    if (t.cls !== cls) { t.cls = cls; t.e.className = 'tag ' + cls; }
    t.e._click = onClick || null;
    t.e.style.transform = 'translate(' + ((v.x * 0.5 + 0.5) * innerWidth).toFixed(0) + 'px,' + ((-v.y * 0.5 + 0.5) * innerHeight).toFixed(0) + 'px) translate(-50%,-100%)';
    t.e.style.display = 'block';
  };
  const TV = new THREE.Vector3();
  const STL = { patrol: 'PATROL', sus: 'SUSPICIOUS', search: 'SEARCHING', look: 'SEARCHING', return: 'RETURNING', alert: 'ALERT', combat: 'HOSTILE', down: 'DOWN' };
  const drawTags = () => {
    nTag = 0; const z = CC.zone; if (!z) return;
    if ((visT -= AF.clock.dt || 0.016) <= 0) { visT = 0.15; VIS.clear(); }
    const busy = !!(AF.minigame && AF.minigame.open); if (busy !== el.classList.contains('busy')) el.classList.toggle('busy', busy);
    const cp = AF.camera.position;
    for (const g of z.guards) {
      const a = g.a; if (!a || g.hid || g.reserve && !g.live || (a.x - cp.x) ** 2 + (a.z - cp.z) ** 2 > 40 * 40) continue;
      if (g.path && !g.path.active && !a.ctl) continue;
      const lvl = g.down ? 'dn' : g.st === 'alert' || g.st === 'combat' ? 'g2' : g.lv > 0.25 ? 'g1' : '';
      const state = g.dead ? 'DEAD' : g.down ? 'UNCONSCIOUS' : a.rxOn && a.rx.st > 0 ? 'STAGGERED' : STL[g.st] || 'PATROL';
      tagAt(a.x, a.y + (g.down ? 0.6 : 2.2), a.z, (g.name || 'Guard').toUpperCase() + ' \u00b7 ' + state, lvl, null, g);
    }
    if (AF.coop && AF.coop.players) for (const r of AF.coop.players.values()) if (r && r.seen && S.inZone(z.id, r.x, r.y, r.z, 4)) tagAt(r.x, r.y + 2.1, r.z, '\u25c6 ' + (r.name || 'CREW').toUpperCase(), 'me', null, r);
    if (CC.o && CC.o.tablet) { const p = AF.player; tagAt(p.x, p.y + 2.1, p.z, '\u25c6 YOU', 'me'); }
    for (const p of z.points) { if ((p.x - cp.x) ** 2 + (p.z - cp.z) ** 2 > 32 * 32) continue; tagAt(p.x, p.y + 0.4, p.z, (p.cd > 0 ? '\u23f1 ' : '\u260e ') + p.name, 'pt', () => doAct({ kind: 'dist', id: p.i, label: p.name }), p); }
    for (const l of z.lights) { const x = (l.box[0] + l.box[2]) / 2, zz = (l.box[1] + l.box[3]) / 2; if ((x - cp.x) ** 2 + (zz - cp.z) ** 2 > 32 * 32) continue; tagAt(x, (l.y || 0.5) + 3.2, zz, (l.off > 0 ? '\u25cc ' : '\u2600 ') + l.name, 'pt lt', () => doAct({ kind: 'dark', id: l.i, label: l.name }), l); }
    for (let k = nTag; k < TAGS.length; k++) if (TAGS[k].e.style.display !== 'none') TAGS[k].e.style.display = 'none';
  };

  // ---------------------------------------------------------------- actions (each costs a minigame, then a cooldown)
  const GAME = { loop: 'signal', dark: 'circuit', dist: 'flow' };
  const VARIANT = { phone: 'signal', radio: 'signal', printer: 'circuit', alarm: 'flow', vending: 'circuit', pipe: 'flow' };
  const doAct = (a) => {
    if (CC.busy || !CC.on) return;
    if (CC.cd > 0) { msg('Uplink cooling down \u2014 ' + Math.ceil(CC.cd) + ' s'); return; }
    const z = CC.zone;
    if (a.kind === 'dist') { const p = z.points[a.id]; if (!p) return; if (p.cd > 0) { msg(p.name + ' \u2014 wait ' + Math.ceil(p.cd) + ' s'); return; } }
    if (a.kind === 'dark') { const l = z.lights[a.id]; if (!l || l.off > 0) return; }
    if (a.kind === 'loop') { const c = z.cams[a.id]; if (!c || c.off > 0 || !(c.range > 0)) return; }
    const kind = a.game || (a.kind === 'dist' ? VARIANT[(z.points[a.id] || {}).kind] || 'flow' : GAME[a.kind]) || 'circuit';
    CC.busy = true; render();
    const mg = AF.minigame && AF.minigame.play ? AF.minigame.play(kind, { title: a.label || a.kind, sub: a.sub || 'Kestrel uplink', diff: a.diff ?? 0.45, time: a.time ?? 40 }) : new Promise((r) => setTimeout(() => r({ ok: true }), 1200));
    mg.then((res) => {
      CC.busy = false;
      if (!CC.on) return;
      if (!res || !res.ok) { if (!(res && res.cancelled)) { msg('Countermeasure \u2014 try again'); say('kestrel.fail'); CC.cd = 3; } render(); return; }
      if (a.run) a.run();
      else if (a.kind === 'loop') { S.act('loop', a.id, 30); say('kestrel.loop'); msg(z.cams[a.id].name + ' looped for 30 s'); }
      else if (a.kind === 'dark') { S.act('dark', a.id, 25); say('kestrel.lights'); msg(z.lights[a.id].name + ' dark for 25 s'); }
      else if (a.kind === 'dist') { S.act('dist', a.id); say('kestrel.dist'); msg('Noise at ' + z.points[a.id].name); }
      CC.cd = a.cd ?? 5; render();
    }, () => { CC.busy = false; render(); });
  };
  // through the heist's story-line queue when it runs (so Kestrel never cuts Vera off mid-sentence), straight to the radio otherwise
  const say = (id) => { if (AF.heist && AF.heist.on && AF.heist.radio) AF.heist.radio(id, true); else if (AF.audio && AF.audio.voice) AF.audio.voice(id, { radio: true, vol: 0.7 }); };
  CC.act = doAct;
  let actKey = '';
  const render = () => {
    const z = CC.zone; if (!z) return;
    const cams = feeds();
    listEl.innerHTML = cams.map((c, i) => '<button data-i="' + i + '" class="' + (i === CC.i ? 'cur ' : '') + (c.off > 0 ? 'off' : '') + '">' + (i + 1) + ' \u00b7 ' + c.name + (c.off > 0 ? ' \u27f2' : '') + '</button>').join('');
    const c = cams[CC.i], list = [];
    if (c && c.range > 0) list.push({ kind: 'loop', id: c.i, label: 'Loop ' + c.name, sub: 'Feed a recorded loop to the guard desk' });
    const extra = (CC.o && CC.o.actions && CC.o.actions()) || [];
    actsEl.innerHTML = '';
    for (const a of extra.concat(list)) {
      const b = document.createElement('button'); b.textContent = (a.mission ? '\u2605 ' : '') + a.label + (CC.busy ? '' : ''); if (a.mission) b.className = 'mis';
      b.disabled = CC.busy || (a.kind === 'loop' && c.off > 0) || !!a.disabled;
      b.addEventListener('click', (e) => { e.stopPropagation(); doAct(a); });
      actsEl.appendChild(b);
    }
    actKey = extra.map((a) => a.label + (a.disabled ? 0 : 1)).join('|') + CC.busy + CC.i + (c && c.off > 0);
  };
  listEl.addEventListener('click', (e) => { const b = e.target.closest('[data-i]'); if (b) { e.stopPropagation(); setFeed(+b.dataset.i); } });
  el.querySelector('.nav').addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; e.stopPropagation(); if (b.dataset.x) CC.close(); else setFeed(CC.i + +b.dataset.n); });

  // ---------------------------------------------------------------- feed switching (a burst of static masks streaming the new view)
  let staticT = 0;
  const setFeed = (i) => {
    const n = feeds().length; if (!n) return;
    CC.i = ((i % n) + n) % n; CC.pan = 0; CC.tilt = 0; staticT = 0.35; staticEl.classList.add('on'); VIS.clear(); visT = 0;
    if (AF.audio) AF.audio.play('ui_click', { vol: 0.4 });
    render();
  };
  CC.setFeed = setFeed;
  CC.open = (o) => {
    const z = S.zones.get(o.zone); if (!z || !z.cams.length) return false;
    if (CC.on) CC.close();
    CC.o = o; CC.zone = z; CC.i = Math.min(o.feed || 0, z.cams.length - 1); CC.pan = CC.tilt = 0; CC.cd = 0; CC.busy = false;
    AF.setMode('cctv', o); return true;
  };
  CC.close = () => { if (AF.mode === 'cctv') AF.setMode('walk', { x: AF.player.x, y: AF.player.y, z: AF.player.z, yaw: AF.player.yaw, snap: true }); };
  AF.modes.cctv = {
    enter(o = {}) {
      CC.prevZone = S.zone;
      if (S.zone !== CC.zone) S.activate(CC.zone.id);
      CC.on = true; el.classList.add('on'); document.body.classList.add('cctv-on'); setFeed(CC.i);
      hintEl.innerHTML = AF.touch ? 'Drag to look \u00b7 tap a \u260e / \u2600 tag to use it' : 'Drag / mouse to look \u00b7 Q / E switch feeds \u00b7 1\u20139 pick \u00b7 click \u260e / \u2600 tags \u00b7 X exits';
      if (AF.input.releaseLock) AF.input.releaseLock();
      AF.interactTarget = null; AF.emit('hud', { speed: null }); AF.emit('hint', '');
      const P = AF.player; CC.seat = o.sit ? (AF.PL.seat = { x: P.x, y: P.y, z: P.z, yaw: P.yaw, seatH: 0.7, lean: 0.12 }) : null;
      if (P.mesh) { P.mesh.position.set(P.x, P.y, P.z); P.mesh.rotation.set(0, P.yaw, 0); }
      AF.camera.fov = 68; AF.camera.updateProjectionMatrix();
      if (CC.o && CC.o.onEnter) CC.o.onEnter();
    },
    exit() {
      CC.on = false; el.classList.remove('on'); document.body.classList.remove('cctv-on'); for (const t of TAGS) t.e.style.display = 'none';
      if (AF.minigame && AF.minigame.open && AF.minigame.cancel) AF.minigame.cancel();
      if (CC.seat && AF.PL.seat === CC.seat) AF.PL.seat = null; CC.seat = null;
      if (S.zone === CC.zone && CC.prevZone !== CC.zone) S.activate(CC.prevZone ? CC.prevZone.id : null);
      CC.prevZone = null;
      AF.camera.fov = 50; AF.camera.updateProjectionMatrix();
      const o = CC.o; CC.o = null; if (o && o.onExit) o.onExit();
    },
    update(dt) {
      const I = AF.input, m = I.mouse, cams = feeds(), c = cams[CC.i];
      if (!c) { CC.close(); return; }
      const modal = AF.ui && AF.ui.modalOpen && AF.ui.modalOpen();
      if (!modal) {
        if (I.hit('KeyQ') || I.hit('BracketLeft')) setFeed(CC.i - 1);
        if (I.hit('KeyE') || I.hit('BracketRight')) setFeed(CC.i + 1);
        for (let k = 1; k <= 9; k++) if (I.hit('Digit' + k) && k <= cams.length) setFeed(k - 1);
        if (I.hit('KeyX') && !(CC.o && CC.o.locked)) { CC.close(); return; }
        if ((m.buttons & 1) && (m.dx || m.dy)) { CC.pan -= m.dx * 0.004; CC.tilt += m.dy * 0.003; }
        const kx = (I.key('KeyA') || I.key('ArrowLeft') ? 1 : 0) - (I.key('KeyD') || I.key('ArrowRight') ? 1 : 0), ky = (I.key('KeyS') || I.key('ArrowDown') ? 1 : 0) - (I.key('KeyW') || I.key('ArrowUp') ? 1 : 0);
        CC.pan += kx * dt * 1.2; CC.tilt += ky * dt * 0.9;
        if (I.stick && (I.stick.x || I.stick.y)) { CC.pan -= I.stick.x * dt * 1.4; CC.tilt -= I.stick.y * dt; }
        CC.pan = AF.clamp(CC.pan, -1.3, 1.3); CC.tilt = AF.clamp(CC.tilt, -0.5, 0.55);
      }
      // a view-only feed holds its aim; a security camera's feed rides its sweep
      const yaw = (c.range > 0 ? c.yaw : c.yaw0) + CC.pan, pitch = c.pitch + CC.tilt, cam = AF.camera;
      cam.position.set(c.x, c.y, c.z); cam.up.set(0, 1, 0);
      TV.set(c.x + Math.sin(yaw) * Math.cos(pitch) * 10, c.y - Math.sin(pitch) * 10, c.z + Math.cos(yaw) * Math.cos(pitch) * 10);
      cam.lookAt(TV); AF.camTarget.copy(TV); AF.shadowFocus.set(c.x, 0, c.z); AF.shadowRadius = 30;
      if (staticT > 0 && (staticT -= dt) <= 0) staticEl.classList.remove('on');
      if (CC.cd > 0) CC.cd -= dt;
      if (CC.msgT > 0 && (CC.msgT -= dt) <= 0) msgEl.classList.remove('on');
      const h = AF.time.hours, hh = Math.floor(h), mm = Math.floor((h - hh) * 60), ss = Math.floor(((h - hh) * 60 - mm) * 60);
      clockEl.textContent = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
      const nm = (CC.zone.feedTitle || 'KESTREL') + ' \u00b7 ' + c.name + (c.off > 0 ? ' \u00b7 LOOPED ' + Math.ceil(c.off) + 's' : '');
      if (nameEl.textContent !== nm) nameEl.textContent = nm;
      const fd = (CC.i + 1) + ' / ' + cams.length + (CC.cd > 0 ? ' \u00b7 UPLINK ' + Math.ceil(CC.cd) + 's' : '');
      if (feedEl.textContent !== fd) feedEl.textContent = fd;
      const extra = (CC.o && CC.o.actions && CC.o.actions()) || [];
      const key = extra.map((a) => a.label + (a.disabled ? 0 : 1)).join('|') + CC.busy + CC.i + (c.off > 0);
      if (key !== actKey) render();
      drawTags();
    },
  };
  AF.on('mode', (name) => { if (name !== 'cctv' && CC.on) { CC.on = false; el.classList.remove('on'); document.body.classList.remove('cctv-on'); } });

  AF.test('cctv: opens a zone feed, switches cameras, places the view at the lens, closes back to walk', () => {
    if (!S) return { ok: false, info: 'no stealth' };
    const z = S.zones.get('cctv-test') || S.define('cctv-test', { box: [0, 0, 0, 10, 10, 10] });
    if (!z.cams.length) { S.camera('cctv-test', { x: 2, y: 3, z: 2, yaw0: 0, range: 0, name: 'A' }); S.camera('cctv-test', { x: 8, y: 3, z: 8, yaw0: PI, range: 0, name: 'B' }); }
    const mode = AF.mode, previousZone = S.zone, P = AF.player, k = { x: P.x, y: P.y, z: P.z, yaw: P.yaw };
    try {
      const opened = CC.open({ zone: 'cctv-test' }); AF.modes.cctv.update(0.016);
      const at0 = AF.camera.position.distanceTo(TV.set(2, 3, 2)) < 0.01 && S.zone === z;
      setFeed(1); AF.modes.cctv.update(0.016); const at1 = AF.camera.position.distanceTo(TV.set(8, 3, 8)) < 0.01;
      CC.close(); const back = AF.mode === 'walk' && S.zone === previousZone && Math.hypot(P.x - k.x, P.z - k.z) < 0.5;
      return { ok: opened && at0 && at1 && back, info: `open ${opened}, cam A ${at0}, cam B ${at1}, back ${back}` };
    } finally { if (AF.mode === 'cctv') CC.close(); if (mode !== 'walk') AF.setMode(mode === 'aerial' ? 'aerial' : 'walk', k); }
  });
}
} catch (e) { AF.partError('80-uplink-cctv.js', e); }
