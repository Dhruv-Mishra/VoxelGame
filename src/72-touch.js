// ================================================================ 72-touch.js
try {
// ===== 72-touch: phone + tablet controls — a floating stick on the left, drag-to-look on the right, pinch to zoom from the sky,
//       and a few mode-aware buttons (jump / run, brake / exit, throttle / exit). Everything feeds AF.input, so the modes don't care.  (OWNER: player) =====
{
  if (AF.touch) {
    const I = AF.input, root = document.getElementById('ui'), cv = document.getElementById('cv');
    const st = document.createElement('style');
    st.textContent = `
      #ui .tc-stick{position:absolute;width:120px;height:120px;margin:-60px 0 0 -60px;border-radius:50%;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.22);display:none;pointer-events:none}
      #ui .tc-stick i{position:absolute;left:50%;top:50%;width:52px;height:52px;margin:-26px 0 0 -26px;border-radius:50%;background:rgba(255,240,210,.55);box-shadow:0 2px 10px rgba(0,0,0,.3)}
      #ui .tc-btns{position:absolute;right:max(16px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:flex-end;gap:12px}
      #ui .tc-row{display:flex;gap:12px}
      #ui .tc{width:64px;height:64px;border-radius:50%;background:rgba(10,20,30,.55);border:1px solid rgba(255,236,190,.3);color:#f4ead2;font:700 12px system-ui;letter-spacing:.06em;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);touch-action:none;user-select:none}
      #ui .tc.big{width:76px;height:76px;font-size:20px}
      #ui .tc.on,#ui .tc:active{background:rgba(240,200,112,.75);color:#1b1408}
      #ui.titling .tc-btns,#ui.titling .tc-stick{display:none!important}
      #ui .tc-hintL{position:absolute;left:max(24px,env(safe-area-inset-left));bottom:max(26px,env(safe-area-inset-bottom));font:12px system-ui;color:rgba(255,255,255,.45);pointer-events:none}`;
    document.head.appendChild(st);
    const stick = document.createElement('div'); stick.className = 'tc-stick'; stick.innerHTML = '<i></i>'; root.appendChild(stick);
    const knob = stick.firstChild;
    const hintL = document.createElement('div'); hintL.className = 'tc-hintL hud'; hintL.textContent = 'drag here to move'; root.appendChild(hintL);
    const pad = document.createElement('div'); pad.className = 'tc-btns hud'; root.appendChild(pad);
    // buttons: [label, key, hold?, modes, cls]
    const DEF = [
      ['RUN', 'run', 'toggle', ['walk']], ['&#x2B06;', 'Space', 'tap', ['walk'], 'big'],
      ['BRAKE', 'Space', 'hold', ['drive'], 'big'], ['EXIT', 'KeyE', 'tap', ['drive']],
      ['THR +', 'thr+', 'hold', ['fly']], ['THR &minus;', 'thr-', 'hold', ['fly']], ['EXIT', 'KeyF', 'tap', ['fly']], ['BRAKE', 'KeyB', 'hold', ['fly']],
      ['WALK', 'Tab', 'tap', ['aerial']],
    ];
    const rows = [document.createElement('div'), document.createElement('div')]; rows.forEach((r) => { r.className = 'tc-row'; pad.appendChild(r); });
    const btns = DEF.map(([label, key, kind, modes, cls], i) => {
      const b = document.createElement('button'); b.className = 'tc pe' + (cls ? ' ' + cls : ''); b.innerHTML = label; b.dataset.key = key;
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
    const sync = () => { const m = AF.mode; for (const { b, modes } of btns) b.style.display = modes.includes(m) ? '' : 'none'; hintL.style.display = m === 'walk' || m === 'drive' || m === 'fly' ? '' : 'none'; };
    AF.on('mode', sync); sync();

    // the stick (left 45% of the screen) and drag-to-look (the rest)
    const stickState = { x: 0, y: 0, run: false };
    let sId = null, sx = 0, sy = 0, lookId = null, lx = 0, ly = 0;
    const pinch = new Map();
    cv.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
    cv.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') return;
      e.preventDefault();
      if (AF.ui && AF.ui.titleOpen && AF.ui.titleOpen()) return;
      const left = e.clientX < innerWidth * 0.45 && AF.mode !== 'aerial';
      if (left && sId == null) { sId = e.pointerId; sx = e.clientX; sy = e.clientY; stick.style.left = sx + 'px'; stick.style.top = sy + 'px'; stick.style.display = 'block'; knob.style.transform = ''; hintL.style.opacity = '0'; }
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
