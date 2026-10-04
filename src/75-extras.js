// ================================================================ 75-extras.js
try {
// ===== 75-extras: photo mode + the Solace Stars hunt  (OWNER: player) =====
// Photo mode (P, or Menu > Photo mode): the world freezes (AF.timeScale 0), a free camera flies within 150 m of where it started;
//   wheel = zoom, [ ] = time of day, F = freeze on/off, K / Enter = save a PNG, P / Esc = back. No new draws.
// Solace Stars: 30 glowing stars over streets, trails, the island and the sky (6 only a plane reaches). One InstancedMesh (1 draw,
//   no shadow), spun at 20 Hz, picked up at 10 Hz by whoever the player is (on foot, car, plane). Progress in localStorage.
{
  const UI = AF.ui, root = document.getElementById('ui'), I = AF.input;
  const style = document.createElement('style');
  style.textContent = `
    #ui.photo .hud,#ui.photo #h-toasts,#ui.photo #h-banner,#ui.photo .bubble,#ui.photo #h-prompt{display:none!important}
    #ui #h-photo{position:absolute;left:50%;bottom:max(18px,env(safe-area-inset-bottom));transform:translateX(-50%);padding:8px 12px;display:none;gap:12px;align-items:center;font-size:12px;color:var(--dim);transition:opacity .4s}
    #ui.photo #h-photo{display:flex}
    #ui #h-photo b{color:var(--ink);font-weight:600}
    #ui #h-clock .st{font-size:11px;color:#f3c84b;margin-left:2px;white-space:nowrap}
  `;
  document.head.appendChild(style);

  // ------------------------------------------------------------------ photo mode
  const PH = AF.photo = { on: false, prev: null, freeze: true, yaw: 0, pitch: 0, fov0: 50, pos: new THREE.Vector3(), origin: new THREE.Vector3(), shots: 0 };
  const dir = new THREE.Vector3(), fwd = new THREE.Vector3(), right = new THREE.Vector3();
  const bar = document.createElement('div'); bar.id = 'h-photo'; bar.className = 'panel pe';
  bar.innerHTML = AF.touch
    ? '<b>Photo mode</b><button class="btn" data-p="shot">Save photo</button><button class="btn" data-p="freeze">Freeze</button><button class="btn" data-p="exit">Done</button>'
    : '<b>Photo mode</b><span>WASD + mouse fly \u00b7 Space/C up/down \u00b7 Wheel zoom \u00b7 [ ] time \u00b7 F freeze \u00b7 K save \u00b7 P exit</span>';
  root.appendChild(bar);
  const ground = (x, z) => { try { return AF.W.groundY(x, z) || 0; } catch (e) { return 0; } };
  PH.enter = () => {
    if (PH.on || !AF.ready || !AF.mode || AF.mode === 'cine' || UI.modalOpen() || (UI.dialogueOpen && UI.dialogueOpen())) return false;
    const cam = AF.camera;
    PH.on = true; PH.prev = AF.mode; AF.mode = 'photo';   // no setMode: the frozen mode is resumed as it was, without exit/enter
    PH.fov0 = cam.fov; PH.pos.copy(cam.position); PH.origin.copy(cam.position);
    cam.getWorldDirection(dir); PH.yaw = Math.atan2(dir.x, dir.z); PH.pitch = Math.asin(AF.clamp(dir.y, -1, 1));
    AF.timeScale = PH.freeze ? 0 : 1;
    root.classList.add('photo'); bar.style.opacity = '1'; PH.hintT = 5;
    return true;
  };
  PH.exit = () => {
    if (!PH.on) return;
    PH.on = false; AF.mode = PH.prev; AF.timeScale = 1;
    AF.camera.fov = PH.fov0; AF.camera.updateProjectionMatrix();
    root.classList.remove('photo');
  };
  PH.capture = () => {
    const a = document.createElement('a'), d = new Date();
    a.download = 'port-solace-' + d.toISOString().slice(0, 19).replace(/[T:]/g, '-') + '.png';
    a.href = AF.capture(); a.click(); PH.shots++;
    UI.toast && setTimeout(() => UI.toast('Photo saved \u2014 ' + a.download), 0);
  };
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('[data-p]'); if (!b) return;
    if (b.dataset.p === 'shot') PH.capture(); else if (b.dataset.p === 'freeze') { PH.freeze = !PH.freeze; AF.timeScale = PH.freeze ? 0 : 1; } else PH.exit();
  });
  AF.modes.photo = {
    update() {
      if (UI.modalOpen()) { PH.exit(); return; }
      const dt = Math.min(0.1, AF.clock.real || 0), cam = AF.camera, m = I.mouse, k = 0.0022 * (AF.lookSens ? AF.lookSens() : 1);
      if (document.pointerLockElement || m.buttons) { PH.yaw -= m.dx * k; PH.pitch = AF.clamp(PH.pitch - m.dy * k, -1.5, 1.5); }
      fwd.set(Math.sin(PH.yaw) * Math.cos(PH.pitch), Math.sin(PH.pitch), Math.cos(PH.yaw) * Math.cos(PH.pitch));
      right.set(-Math.cos(PH.yaw), 0, Math.sin(PH.yaw));
      const sp = (I.key('ShiftLeft') || I.key('ShiftRight') ? 24 : 6) * dt;
      const f = (I.key('KeyW') ? 1 : 0) - (I.key('KeyS') ? 1 : 0) + (I.stick ? -(I.stick.y || 0) : 0), s = (I.key('KeyD') ? 1 : 0) - (I.key('KeyA') ? 1 : 0) + (I.stick ? (I.stick.x || 0) : 0);
      const u = (I.key('Space') ? 1 : 0) - (I.key('KeyC') || I.key('ControlLeft') ? 1 : 0);
      PH.pos.addScaledVector(fwd, f * sp).addScaledVector(right, s * sp); PH.pos.y += u * sp;
      // stay near the subject: 150 m leash, never below the ground
      dir.subVectors(PH.pos, PH.origin); if (dir.length() > 150) PH.pos.copy(PH.origin).addScaledVector(dir.normalize(), 150);
      PH.pos.y = Math.max(PH.pos.y, ground(PH.pos.x, PH.pos.z) + 0.4);
      if (m.wheel) { cam.fov = AF.clamp(cam.fov * Math.exp(m.wheel * 0.001), 12, 90); cam.updateProjectionMatrix(); }
      const T = AF.time; if (I.key('BracketLeft')) T.hours = (T.hours - dt * 1.5 + 24) % 24; if (I.key('BracketRight')) T.hours = (T.hours + dt * 1.5) % 24;
      if (I.hit('KeyF')) { PH.freeze = !PH.freeze; AF.timeScale = PH.freeze ? 0 : 1; }
      if (I.hit('KeyK') || I.hit('Enter')) PH.capture();
      cam.position.copy(PH.pos); AF.camTarget.copy(PH.pos).addScaledVector(fwd, 10); cam.lookAt(AF.camTarget);
      AF.shadowFocus.set(AF.camTarget.x, 0, AF.camTarget.z);
      if (PH.hintT > 0 && (PH.hintT -= dt) <= 0) bar.style.opacity = AF.touch ? '1' : '0.35';
    },
  };
  AF.onTick('photo-key', 149, () => {
    if (!AF.ready || !I.hit('KeyP') || (UI.state && UI.state.title)) return;
    if (PH.on) PH.exit(); else PH.enter();
  });
  AF.on('ready', () => {
    const stack = document.querySelector('#m-menu .stack'); if (!stack) return;
    const b = document.createElement('button'); b.className = 'btn'; b.textContent = 'Photo mode'; b.dataset.k = 'photo';
    b.addEventListener('click', () => { UI.toggleMenu(false); PH.enter(); });
    stack.insertBefore(b, stack.children[2] || null);
  });

  // ------------------------------------------------------------------ Solace Stars
  // [x, z, y] y = null: 1.3 m over the ground / road deck; a number: a sky star at that height (planes only, 14 m catch radius)
  const SPOTS = [
    [40, -80], [-120, 80], [-80, -40], [80, 120], [-240, -200], [160, -240], [-372, -120], [-560, 0], [320, -120], [444, 120],
    [240, -120], [380, 160], [-820, -10], [-980, 50], [-1200, 120], [50, -480], [700, -40], [820, 20], [800, -120], [290, -660],
    [-270, -640], [-600, -600], [-170, 640], [0, 540],
    [70, -80, 150], [-41, -110, 70], [-40, -650, 70], [-10, 625, 95], [-550, -150, 80], [0, 230, 55],
  ];
  const ST = AF.stars = { list: [], found: new Set(), total: SPOTS.length, mesh: null };
  try { for (const id of JSON.parse(localStorage.getItem('portSolace.stars') || '[]')) if (id >= 0 && id < SPOTS.length) ST.found.add(id); } catch (e) {}
  const save = () => { try { localStorage.setItem('portSolace.stars', JSON.stringify([...ST.found])); } catch (e) {} };
  const mat4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1), up = new THREE.Vector3(0, 1, 0);
  let counter = null;
  const showCount = () => { if (counter) counter.textContent = '\u2605 ' + ST.found.size + '/' + ST.total; };
  AF.onBuild('solace-stars', 890, () => {
    const gold = AF.col(0xffd24a, { emit: 0xffc23a, emitK: 2.4, mode: 'always', jitter: 0, edge: 0 }), m = new AF.Model(13, 13, 2);
    // five-point star in the xy plane (outer r 6.4, inner 2.6 voxels), 2 voxels thick
    const pts = []; for (let i = 0; i < 10; i++) { const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.6 : 6.4; pts.push([6.5 + Math.cos(a) * r, 6.5 + Math.sin(a) * r]); }
    const inside = (x, y) => { let c = false; for (let i = 0, j = 9; i < 10; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } return c; };
    for (let x = 0; x < 13; x++) for (let y = 0; y < 13; y++) if (inside(x + 0.5, y + 0.5)) { m.set(x, y, 0, gold); m.set(x, y, 1, gold); }
    const geo = AF.meshModel(m, { vs: 0.1, anchor: [0.5, 0.5, 0.5], flat: true });
    for (let i = 0; i < SPOTS.length; i++) {
      const [x, z, sky] = SPOTS[i], g = ground(x, z);
      let y = sky != null ? g + sky : g;
      if (sky == null) { const s = AF.surfaceBelow(x, z, g + 3, 8); if (s > -50) y = s; y += 1.3; }
      ST.list.push({ id: i, x, y, z, sky: sky != null, ph: i * 1.7 });
    }
    const mesh = ST.mesh = new THREE.InstancedMesh(geo, AF.mat.voxelInst, SPOTS.length);
    mesh.name = 'solace-stars'; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.matrixAutoUpdate = false;
    AF.scene.add(mesh);
    const clock = document.getElementById('h-clock');
    if (clock) { counter = document.createElement('div'); counter.className = 'st'; clock.appendChild(counter); showCount(); }
  });
  let spinT = 0, pickT = 0;
  const focus = () => AF.mode === 'walk' ? AF.player : AF.mode === 'drive' ? AF.vehicles && AF.vehicles.player : AF.mode === 'fly' ? AF.planes && AF.planes.cur : null;
  ST.collect = (s) => {
    if (ST.found.has(s.id)) return;
    ST.found.add(s.id); save(); showCount();
    if (UI.map) UI.map.revision++;
    const n = ST.found.size;
    UI.toast && UI.toast(n === ST.total ? '\u2605 You found every Solace Star! Fireworks over the harbour tonight.' : '\u2605 Solace Star ' + n + ' of ' + ST.total + (s.sky ? ' \u2014 a sky star!' : '') + ' \u00b7 the map (M) shows the rest');
    if (n === ST.total && AF.fireworks && AF.fireworks.launch) AF.fireworks.launch(12);
  };
  AF.onTick('solace-stars', 640, (dt, t) => {
    const mesh = ST.mesh; if (!mesh || !AF.ready) return;
    if ((spinT += dt) >= 0.05) {
      spinT = 0; let n = 0;
      for (const s of ST.list) {
        if (ST.found.has(s.id)) continue;
        q.setFromAxisAngle(up, t * 1.6 + s.ph); pos.set(s.x, s.y + Math.sin(t * 2 + s.ph) * 0.18, s.z);
        mat4.compose(pos, q, s.sky ? one.setScalar(4) : one.setScalar(1)); mesh.setMatrixAt(n++, mat4);
      }
      mesh.count = n; mesh.instanceMatrix.needsUpdate = true;
    }
    if ((pickT += dt) < 0.1) return;
    pickT = 0;
    const f = focus(); if (!f) return;
    const r = AF.mode === 'fly' ? 14 : AF.mode === 'drive' ? 4.5 : 2.2, fy = (f.y ?? 0) + (AF.mode === 'walk' ? 0.9 : 0);
    for (const s of ST.list) {
      if (ST.found.has(s.id) || (s.sky && AF.mode !== 'fly')) continue;
      const dx = s.x - f.x, dz = s.z - f.z; if (dx * dx + dz * dz > r * r) continue;
      if (Math.abs(s.y - fy) < r + 1) ST.collect(s);
    }
  });
  // map: uncollected stars as gold marks
  AF.on('ready', () => {
    const map = UI.map; if (!map) return;
    (map.overlays || (map.overlays = [])).push((g) => {
      g.save(); g.fillStyle = '#f3c84b'; g.strokeStyle = 'rgba(60,40,0,.7)'; g.lineWidth = 1.5; g.font = '700 14px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle';
      for (const s of ST.list) { if (ST.found.has(s.id)) continue; const p = map.worldToScreen(s.x, s.z); g.strokeText('\u2605', p.x, p.y); g.fillText('\u2605', p.x, p.y); }
      g.restore();
    });
  });

  AF.test('extras: photo mode freezes the world and hands the camera back', () => {
    const S = UI.state, saved = { title: S.title, menu: S.menu, help: S.help, map: S.map, dlg: S.dlg }, mode = AF.mode, hook = AF.hooks.tick.find((h) => h.name === 'photo-key');
    Object.assign(S, { title: false, menu: false, help: false, map: false, dlg: null }); const p0 = AF.camera.position.clone();
    I.tap('KeyP'); hook.fn(0); const on = PH.on && AF.mode === 'photo' && AF.timeScale === 0; I.pressed.delete('KeyP');
    AF.step(2);
    I.tap('KeyP'); hook.fn(0); I.pressed.delete('KeyP');
    const back = !PH.on && AF.mode === mode && AF.timeScale === 1;
    Object.assign(S, saved); AF.camera.position.copy(p0);
    return { ok: (!mode || on) && back, info: 'mode ' + mode + ', entered ' + on + ', restored ' + back };
  });
  AF.test('extras: Solace Stars are placed, drawn in one batch and collectable', () => {
    const before = new Set(ST.found), s = ST.list.find((x) => !ST.found.has(x.id));
    const placed = ST.list.length === SPOTS.length && ST.list.every((x) => isFinite(x.y) && x.y > -20 && x.y < 400);
    if (s) ST.collect(s);
    const got = !s || ST.found.has(s.id);
    ST.found = before; save(); showCount();
    return { ok: placed && got && !!ST.mesh && ST.mesh.isInstancedMesh, info: ST.list.length + ' stars, ' + before.size + ' found before' };
  });
}
} catch (e) { AF.partError('75-extras.js', e); }
