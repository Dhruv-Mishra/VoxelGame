// ================================================================ 72-touch.js
try {
// ===== 72-touch: phone + tablet controls — a floating stick on the left (push it to the rim to run), drag-to-look on the right, pinch to
//       zoom from the sky, and ONE context cluster bottom-right: a big primary action plus up to three secondaries picked from what the
//       player is doing (fists / melee, a gun drawn, driving, flying, riding, skydiving), with small utilities (camera, job) beside it.
//       Everything feeds AF.input, so the modes don't care.  (OWNER: player) =====
{
  if (AF.touch) {
    const I = AF.input, root = document.getElementById('ui'), cv = document.getElementById('cv');
    const st = document.createElement('style');
    st.textContent = `
      #ui .tc-stick{position:absolute;width:112px;height:112px;margin:-56px 0 0 -56px;border-radius:50%;background:var(--bg);border:1px solid var(--line);display:none;pointer-events:none;transition:border-color .15s}
      #ui .tc-stick i{position:absolute;left:50%;top:50%;width:42px;height:42px;margin:-21px 0 0 -21px;border-radius:50%;background:rgba(238,241,242,.3)}
      #ui .tc-stick.run{border-color:var(--accent)} #ui .tc-stick.run i{background:var(--accent)}
      #ui .tc-btns{position:absolute;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom));width:150px;height:150px;pointer-events:none}
      #ui .tc-util{position:absolute;right:calc(max(14px,env(safe-area-inset-right)) + 156px);bottom:max(14px,env(safe-area-inset-bottom));display:flex;gap:8px;align-items:flex-end}
      #ui .tc{position:absolute;width:54px;height:54px;border-radius:50%;background:var(--bg);border:1px solid var(--line);color:var(--ink);display:none;flex-direction:column;align-items:center;justify-content:center;gap:1px;touch-action:none;user-select:none;-webkit-user-select:none;pointer-events:auto;transition:background .18s}
      #ui .tc svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
      #ui .tc small{font:600 8px var(--font);letter-spacing:.4px;opacity:.75}
      #ui .tc.s0{right:0;bottom:0;width:72px;height:72px} #ui .tc.s0 svg{width:28px;height:28px}
      #ui .tc.s1{right:88px;bottom:4px} #ui .tc.s2{right:64px;bottom:64px} #ui .tc.s3{right:4px;bottom:88px}
      #ui .tc.s0,#ui .tc.s1,#ui .tc.s2,#ui .tc.s3{display:flex}
      #ui .tc-util .tc{position:static;width:42px;height:42px;display:none} #ui .tc-util .tc.u{display:flex} #ui .tc-util .tc svg{width:18px;height:18px}
      #ui .tc.on,#ui .tc:active{background:var(--accent);color:#112723}
      #ui.titling .tc-btns,#ui.titling .tc-util,#ui.titling .tc-stick,#ui.photo .tc-btns,#ui.photo .tc-util{display:none!important}
      #ui.touch #h-clock{padding:5px 11px;min-width:0} #ui.touch #h-clock .t{font-size:15px} #ui.touch #h-clock .p{font-size:11px;max-width:150px}
      #ui.touch #h-mini{width:84px;height:84px} #ui.touch .round{width:34px;height:34px;font-size:14px} #ui.touch #h-right{gap:6px}
      #ui.touch #h-prompt{font-size:12px;padding:7px 12px 7px 7px}`;
    document.head.appendChild(st);
    const stick = document.createElement('div'); stick.className = 'tc-stick'; stick.innerHTML = '<i></i>'; root.appendChild(stick);
    const knob = stick.firstChild;
    const pad = document.createElement('div'); pad.className = 'tc-btns hud'; root.appendChild(pad);
    const util = document.createElement('div'); util.className = 'tc-util hud'; root.appendChild(util);
    const ic = (d, lab) => `<svg viewBox="0 0 24 24">${d}</svg>` + (lab ? `<small>${lab}</small>` : '');
    const P = {
      up: '<path d="M12 19V5M5 12l7-7 7 7"/>', stop: '<rect x="6" y="6" width="12" height="12" rx="2"/>', exit: '<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>',
      fist: '<path d="M7 11V7a2 2 0 0 1 4 0v3M11 10V6a2 2 0 0 1 4 0v4M15 10V8a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2z"/>',
      aim: '<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>', fire: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.2"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
      gun: '<path d="M4 12h11l3-3h2v6h-2l-3-3M7 12v4h3"/>', cam: '<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M9 7l1.5-3h3L15 7"/>',
      job: '<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3M3 13h18"/>', plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
      walk: '<circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M12 14l-3 6M12 14l3 6M8 10h8"/>', chute: '<path d="M3 11a9 7 0 0 1 18 0zM4 11l8 8 8-8M12 11v8"/>',
    };
    // id: [icon, label, key, kind ('tap' one-frame press | 'hold' while touched | 'thr' throttle), aria]
    const DEF = {
      hit: [P.fist, 'HIT', 'KeyQ', 'hold', 'Attack'], fire: [P.fire, 'FIRE', 'KeyQ', 'hold', 'Fire'], aim: [P.aim, 'AIM', 'KeyZ', 'tap', 'Aim'],
      wpn: [P.gun, 'WPN', 'KeyX', 'tap', 'Switch weapon'], jump: [P.up, '', 'Space', 'tap', 'Jump'], stop: [P.stop, 'STOP', 'KeyE', 'tap', 'Stop the needle'],
      brake: [P.stop, 'BRAKE', 'Space', 'hold', 'Brake'], exit: [P.exit, 'EXIT', 'KeyE', 'tap', 'Get out'], fexit: [P.exit, 'EXIT', 'KeyF', 'tap', 'Get out of the plane'],
      thrU: [P.plus, 'THR', 'thr+', 'thr', 'Increase throttle'], thrD: [P.minus, 'THR', 'thr-', 'thr', 'Decrease throttle'], wbrake: [P.stop, 'BRAKE', 'KeyB', 'hold', 'Wheel brakes'],
      walk: [P.walk, 'WALK', 'Tab', 'tap', 'Walk'], chute: [P.chute, 'CHUTE', 'Space', 'tap', 'Deploy parachute'],
      cam: [P.cam, 'CAM', 'KeyC', 'tap', 'Camera view'], job: [P.job, 'JOB', 'KeyJ', 'tap', 'Job'],
    };
    const UTIL = new Set(['cam', 'job']), B = {};
    for (const id in DEF) {
      const [icon, label, key, kind, aria] = DEF[id];
      const b = document.createElement('button'); b.className = 'tc pe'; b.innerHTML = ic(icon, label); b.setAttribute('aria-label', aria);
      (UTIL.has(id) ? util : pad).appendChild(b);
      const down = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (kind === 'thr') { I.throttle = key === 'thr+' ? 1 : -1; return; }
        I.pressed.add(key); if (kind === 'hold') I.down.add(key);
      };
      const up = (e) => { e.preventDefault(); if (kind === 'thr') I.throttle = 0; else if (kind === 'hold') I.down.delete(key); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
      B[id] = b;
    }

    // ---------------------------------------------------------------- context: which buttons the current action needs (5 Hz, DOM only on change)
    const RIDES = new Set(['row', 'ride', 'funride', 'jetski', 'carousel', 'passenger']), CAM_MODES = new Set(['walk', 'drive', 'fly', 'jetski', 'passenger']);
    const JOB_CAR = (T) => !!(T && (T.cab || T.id === 'bus' || T.kind === 'van' || T.id === 'firetruck' || T.kind === 'bike'));
    const hasGuns = () => { const g = AF.save && AF.save.guns; if (g) for (const k in g) if (g[k]) return true; return false; };
    const act = [], use = [];
    const pick = () => {
      const m = AF.mode, CB = AF.combat, HUD = AF.hud, J = AF.jobs;
      act.length = 0; use.length = 0;
      if (m === 'walk') {
        const gal = CB && CB.gallery, gun = CB && (gal || CB.gun());
        if (HUD && HUD.meterOn && HUD.meterOn()) act.push('stop');
        else { act.push(gun ? 'fire' : 'hit', 'jump'); if (gun && !gal) act.push('aim'); if (!gal && hasGuns()) act.push('wpn'); }
      } else if (m === 'drive') act.push('brake', 'exit');
      else if (m === 'fly') { const pl = AF.planes && AF.planes.cur; act.push('thrU', 'thrD', 'fexit'); if (pl && pl.onGround) act.push('wbrake'); }
      else if (m === 'aerial') act.push('walk');
      else if (m === 'skydive') act.push('chute');
      else if (RIDES.has(m)) act.push('exit');
      if (CAM_MODES.has(m)) use.push('cam');
      if (J && (J.cur || m === 'walk' || (m === 'drive' && AF.vehicles.player && JOB_CAR(AF.vehicles.player.type)))) use.push('job');
    };
    let key = '';
    const sync = () => {
      pick();
      const k = act.join() + '|' + use.join();
      if (k !== key) {
        key = k;
        for (const id in B) { const b = B[id], i = act.indexOf(id); if (UTIL.has(id)) b.classList.toggle('u', use.includes(id)); else b.className = 'tc pe' + (i >= 0 ? ' s' + i : ''); }
        I.down.delete('KeyQ'); I.down.delete('Space'); I.down.delete('KeyB'); I.throttle = 0;   // a button that vanished mid-hold must not stay held
      }
      const CB = AF.combat; B.aim.classList.toggle('on', !!(CB && CB.aimToggle));
    };
    AF.on('mode', sync); sync();
    let syncT = 0;
    AF.onTick('touch-ui', 950, (dt) => { if ((syncT += dt) >= 0.2) { syncT = 0; sync(); } });
    AF.touchUI = { sync, buttons: () => act.slice(), utils: () => use.slice() };

    // the stick (left 45% of the screen) and drag-to-look (the rest); the stick pushed to its rim runs
    const stickState = { x: 0, y: 0, run: false };
    let sId = null, sx = 0, sy = 0, lookId = null, lx = 0, ly = 0;
    const pinch = new Map();
    cv.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    cv.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      e.preventDefault();
      if (AF.ui && AF.ui.modalOpen()) return;
      const left = e.clientX < innerWidth * 0.45 && AF.mode !== 'aerial';
      if (left && sId == null) { sId = e.pointerId; sx = e.clientX; sy = e.clientY; stick.style.left = sx + 'px'; stick.style.top = sy + 'px'; stick.style.display = 'block'; knob.style.transform = ''; }
      else if (lookId == null) { lookId = e.pointerId; lx = e.clientX; ly = e.clientY; I.mouse.buttons = 1; }
      else { pinch.set(e.pointerId, [e.clientX, e.clientY]); }
      if (lookId != null) pinch.set(lookId, [lx, ly]);
    }, { passive: false });
    cv.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'touch') return;
      if (e.pointerId === sId) {
        let dx = e.clientX - sx, dy = e.clientY - sy; const d = Math.hypot(dx, dy), R = 56;
        if (d > R) { dx *= R / d; dy *= R / d; }
        knob.style.transform = `translate(${dx}px,${dy}px)`;
        stickState.x = dx / R; stickState.y = -dy / R;
        const run = d > R * 0.92; if (run !== stickState.run) { stickState.run = run; stick.classList.toggle('run', run); }
        I.stick = stickState;
      } else if (pinch.size >= 2 && pinch.has(e.pointerId)) {
        const pts = [...pinch.values()], d0 = Math.hypot(pts[0][0] - pts[1][0], pts[0][1] - pts[1][1]);
        pinch.set(e.pointerId, [e.clientX, e.clientY]);
        const q = [...pinch.values()], d1 = Math.hypot(q[0][0] - q[1][0], q[0][1] - q[1][1]);
        I.mouse.wheel += (d0 - d1) * 4;
      } else if (e.pointerId === lookId) {
        I.mouse.dx += (e.clientX - lx) * 1.5; I.mouse.dy += (e.clientY - ly) * 1.5; lx = e.clientX; ly = e.clientY; I.mouse.buttons = 1;
        pinch.set(lookId, [lx, ly]);
      }
    });
    const end = (e) => {
      if (e.pointerType !== 'touch') return;
      pinch.delete(e.pointerId);
      if (e.pointerId === sId) { sId = null; stick.style.display = 'none'; stick.classList.remove('run'); stickState.x = stickState.y = 0; stickState.run = false; I.stick = stickState; }
      if (e.pointerId === lookId) { lookId = null; I.mouse.buttons = 0; }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    // double tap on the sky view lands you there
    let lastTap = 0;
    cv.addEventListener('pointerup', (e) => { if (e.pointerType !== 'touch' || AF.mode !== 'aerial') return; const n = performance.now(); if (n - lastTap < 320) { const p = AF.pickWorld(e.clientX, e.clientY); if (p && AF.PL.flyDownTo) AF.PL.flyDownTo(p); } lastTap = n; });
    I.stick = stickState;

    AF.test('touch: the action cluster follows the context (fists, gun drawn)', () => {
      const CB = AF.combat, S = AF.save, was = AF.mode, slot = CB.slot, had = S.guns.revolver;
      try {
        if (AF.mode !== 'walk') AF.setMode('walk', {});
        CB.slot = 0; sync(); const fists = act[0] === 'hit' && !act.includes('aim');
        S.guns.revolver = true; CB.slot = 1; sync(); const gun = act[0] === 'fire' && act.includes('aim') && act.includes('wpn');
        const max = act.length <= 4;
        return { ok: fists && gun && max && B.fire.classList.contains('s0'), info: `fists ${fists}, gun ${gun}, <=4 ${max}: ${act.join()}` };
      } finally { CB.slot = slot; if (!had) delete S.guns.revolver; if (was && was !== AF.mode) AF.setMode(was); sync(); }
    });
  }
}

} catch (e) { AF.partError('72-touch.js', e); }
