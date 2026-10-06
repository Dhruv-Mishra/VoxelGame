// ================================================================ 72-touch.js
try {
// ===== 72-touch: phone + tablet controls — a floating stick on the left, drag-to-look on the right, pinch to zoom from the sky,
//       and a few mode-aware buttons (jump / run, brake / exit, throttle / exit). Everything feeds AF.input, so the modes don't care.  (OWNER: player) =====
{
  if (AF.touch) {
    const I = AF.input, root = document.getElementById('ui'), cv = document.getElementById('cv');
    const st = document.createElement('style');
    st.textContent = `
      #ui .tc-stick{position:absolute;width:112px;height:112px;margin:-56px 0 0 -56px;border-radius:50%;background:var(--bg);border:1px solid var(--line);display:none;pointer-events:none}
      #ui .tc-stick i{position:absolute;left:50%;top:50%;width:42px;height:42px;margin:-21px 0 0 -21px;border-radius:50%;background:rgba(238,241,242,.3)}
      #ui .tc-btns{position:absolute;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:flex-end;gap:10px}
      #ui .tc-row{display:flex;gap:10px;align-items:flex-end}
      #ui .tc{width:46px;height:46px;border-radius:50%;background:var(--bg);border:1px solid var(--line);color:var(--ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;touch-action:none;user-select:none;-webkit-user-select:none;transition:background .18s}
      #ui .tc svg{width:22px;height:22px;fill:none;stroke:currentColor;stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}
      #ui .tc small{font:500 8px var(--font);opacity:.7}
      #ui .tc.big{width:58px;height:58px} #ui .tc.big svg{width:26px;height:26px}
      #ui .tc.on,#ui .tc:active{background:var(--accent);color:#112723}
      #ui.titling .tc-btns,#ui.titling .tc-stick{display:none!important}
      #ui.touch #h-clock{padding:5px 11px;min-width:0} #ui.touch #h-clock .t{font-size:15px} #ui.touch #h-clock .p{font-size:11px;max-width:150px}
      #ui.touch #h-mini{width:84px;height:84px} #ui.touch .round{width:34px;height:34px;font-size:14px} #ui.touch #h-right{gap:6px}
      #ui.touch #h-prompt{font-size:12px;padding:7px 12px 7px 7px}`;
    document.head.appendChild(st);
    const stick = document.createElement('div'); stick.className = 'tc-stick'; stick.innerHTML = '<i></i>'; root.appendChild(stick);
    const knob = stick.firstChild;
    const pad = document.createElement('div'); pad.className = 'tc-btns hud'; root.appendChild(pad);
    const ic = (d, lab) => `<svg viewBox="0 0 24 24">${d}</svg>` + (lab ? `<small>${lab}</small>` : '');
    const IC = {
      jump: ic('<path d="M12 19V5M5 12l7-7 7 7"/>'), run: ic('<path d="M5 6l6 6-6 6M13 6l6 6-6 6"/>'), brake: ic('<rect x="6" y="6" width="12" height="12" rx="2"/>'),
      exit: ic('<path d="M14 4h5v16h-5M10 8l-4 4 4 4M6 12h10"/>'), up: ic('<path d="M12 5v14M5 12h14"/>', 'THR'), down: ic('<path d="M5 12h14"/>', 'THR'),
      walk: ic('<circle cx="12" cy="4.5" r="2"/><path d="M12 7v7M12 14l-3 6M12 14l3 6M8 10h8"/>'), chute: ic('<path d="M3 11a9 7 0 0 1 18 0zM4 11l8 8 8-8M12 11v8"/>'),
      hit: ic('<path d="M7 11V7a2 2 0 0 1 4 0v3M11 10V6a2 2 0 0 1 4 0v4M15 10V8a2 2 0 0 1 4 0v5a7 7 0 0 1-7 7h-1a6 6 0 0 1-6-6v-2a2 2 0 0 1 2-2z"/>', 'HIT'),
      aim: ic('<circle cx="12" cy="12" r="7"/><path d="M12 2v5M12 17v5M2 12h5M17 12h5"/>', 'AIM'), wpn: ic('<path d="M4 12h11l3-3h2v6h-2l-3-3M7 12v4h3"/>', 'WPN'),
      cam: ic('<rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.5" r="3.5"/><path d="M9 7l1.5-3h3L15 7"/>', 'CAM'), job: ic('<rect x="3" y="8" width="18" height="12" rx="2"/><path d="M9 8V5h6v3M3 13h18"/>', 'JOB'),
    };
    // buttons: [icon, key, hold?, modes, cls]
    const DEF = [
      [IC.run, 'run', 'toggle', ['walk']], [IC.jump, 'Space', 'tap', ['walk'], 'big'],
      [IC.aim, 'KeyZ', 'tap', ['walk']], [IC.hit, 'KeyQ', 'hold', ['walk'], 'big'], [IC.wpn, 'KeyX', 'tap', ['walk']], [IC.job, 'KeyJ', 'tap', ['walk', 'drive']], [IC.cam, 'KeyC', 'tap', ['walk', 'drive', 'fly', 'jetski']],
      [IC.exit, 'KeyE', 'tap', ['drive']], [IC.brake, 'Space', 'hold', ['drive'], 'big'],
      [IC.down, 'thr-', 'hold', ['fly']], [IC.up, 'thr+', 'hold', ['fly'], 'big'], [IC.exit, 'KeyF', 'tap', ['fly']], [IC.brake, 'KeyB', 'hold', ['fly']],
      [IC.walk, 'Tab', 'tap', ['aerial']], [IC.chute, 'Space', 'tap', ['skydive'], 'big'], [IC.exit, 'KeyE', 'tap', ['row', 'ride', 'funride', 'jetski', 'carousel'], 'big'],
    ];
    const rows = [document.createElement('div'), document.createElement('div')]; rows.forEach((r) => { r.className = 'tc-row'; pad.appendChild(r); });
    const btns = DEF.map(([label, key, kind, modes, cls], i) => {
      const b = document.createElement('button'); b.className = 'tc pe' + (cls ? ' ' + cls : ''); b.innerHTML = label; b.dataset.key = key;
      b.setAttribute('aria-label', { run: 'Run', Space: modes[0] === 'walk' ? 'Jump' : 'Brake', KeyE: 'Exit', KeyF: 'Exit plane', KeyB: 'Wheel brake', 'thr+': 'Increase throttle', 'thr-': 'Decrease throttle', Tab: 'Walk', KeyQ: 'Attack', KeyZ: 'Aim', KeyX: 'Switch weapon', KeyC: 'Camera view', KeyJ: 'Job' }[key] || 'Deploy parachute');
      (i % 2 ? rows[1] : rows[0]).appendChild(b);
      const down = (e) => {
        e.preventDefault(); e.stopPropagation();
        if (kind === 'toggle') { stickState.run = !stickState.run; b.classList.toggle('on', stickState.run); return; }
        if (key === 'thr+') { I.throttle = 1; return; } if (key === 'thr-') { I.throttle = -1; return; }
        I.pressed.add(key); if (kind === 'hold') I.down.add(key);
      };
      const up = (e) => { e.preventDefault(); if (key === 'thr+' || key === 'thr-') I.throttle = 0; else if (kind === 'hold') I.down.delete(key); };
      b.addEventListener('pointerdown', down); b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('pointerleave', up);
      return { b, modes };
    });
    const sync = () => { const m = AF.mode; for (const { b, modes } of btns) b.style.display = modes.includes(m) ? '' : 'none'; };
    AF.on('mode', sync); sync();

    // the stick (left 45% of the screen) and drag-to-look (the rest)
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
      if (e.pointerId === sId) { sId = null; stick.style.display = 'none'; stickState.x = stickState.y = 0; I.stick = stickState; }
      if (e.pointerId === lookId) { lookId = null; I.mouse.buttons = 0; }
    };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    // double tap on the sky view lands you there
    let lastTap = 0;
    cv.addEventListener('pointerup', (e) => { if (e.pointerType !== 'touch' || AF.mode !== 'aerial') return; const n = performance.now(); if (n - lastTap < 320) { const p = AF.pickWorld(e.clientX, e.clientY); if (p && AF.PL.flyDownTo) AF.PL.flyDownTo(p); } lastTap = n; });
    I.stick = stickState;
  }
}

} catch (e) { AF.partError('72-touch.js', e); }
