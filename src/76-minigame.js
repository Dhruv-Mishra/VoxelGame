// ================================================================ 76-minigame.js
try {
// ===== 76-minigame: lock / hack / forgery minigames — one DOM + Canvas2D overlay (no WebGL)  (OWNER: minigame) =====
// AF.minigame.play(kind, opts) -> Promise<{ ok, cancelled, ...extra }>   AF.minigame.open (bool) · cancel() · close(ok, extra) · msg(text, cls, s)
// Common opts: diff 0..1 (default 0.5) · title · sub (instruction line) · time (limit in s: fail { timeout:true } when it runs out).
// Kinds (extra result fields in brackets):
//  lockpick  pin tumbler: tension + set 4–6 pins in binding order, picks snap under force   opts.pins, opts.picks  [picks, snapped]
//  circuit   rotate tiles to route power to the target(s)                                     opts.size, opts.targets [moves]
//  flow      connect coloured endpoint pairs with non-crossing paths                          opts.size, opts.pairs  [moves, filled]
//  signal    match a waveform: frequency + phase (+ amplitude from diff 0.5), hold the lock   opts.hold             []
//  drill     keep the bit's heat in the green band, clear jams                                opts.work (≈ s of steady drilling, default
//            22 + 14·diff, capped at 0.7 × opts.time when a limit is set)                                          [overheats, jams, progress]
//  deal      baccarat dealing, stays open: Deal clean / Deal a bad hand (timed card swap)     opts.guest, opts.hands, opts.need,
//            opts.onBad(info), opts.onSloppy(info), opts.onHand(info), opts.onAction(kind, info), opts.noCatch  [bad, sloppy, hands, caught]
//  stamp     ID forgery: place the photo, press the seal on time, trace the signature         opts.pass             [score, steps]
//  keypad    deduce a 4-digit code from worn keys, mastermind feedback                        opts.attempts         [attempts]
// The world keeps running behind the overlay (co-op): the caller decides what happens if the player is caught meanwhile.
// While open: pointer lock is released (re-requested on close if it was held), game keys are swallowed (Esc cancels), the overlay
// counts in AF.ui.modalOpen(). ?mg=<kind>[&mgd=0.5&mgt=40] opens one after boot for testing. AF.minigame.solve() (debug) solves
// circuit / flow / keypad / signal; AF.minigame.state() is the running game's state.
{
  const UI = AF.ui, root = document.getElementById('ui');
  const MG = AF.minigame = { open: false, kind: null, KINDS: {}, gen: {}, last: null };
  const KINDS = MG.KINDS;
  const R = Math.random, ri = (n) => (Math.random() * n) | 0;
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1), t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const snd = (id, vol, rate) => { const A = AF.audio; if (A && A.LIB && A.LIB[id]) A.play(id, { bus: 'ui', vol: vol ?? 1, rate }); };
  const rr = (g, x, y, w, h, r) => { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  const COL = { ink: '#eef1f2', dim: '#a9b1b6', acc: '#8bd8c3', gold: '#f5c542', ok: '#7ddc8a', bad: '#ff6b6b', bg: '#070a0e' };
  class Minigame {
    constructor(def = {}) {
      this.label = def.label || '';
      this.title = def.title || '';
      this.winText = def.winText || 'Success';
      this.sub = def.sub || '';
      this.hint = def.hint || '';
      this.hintTouch = def.hintTouch || '';
      Object.assign(this, def);
    }
    init(c) {}
    update(c, quiet) {}
    frame(c, dt) {}
    down(c, x, y, e) {}
    move(c, x, y, e) {}
    up(c, x, y, e) {}
    key(c, code, down) {}
    solve(c) {}
    result(c) { return {}; }
    draw(c, g, w, h) {}
  }
  MG.Minigame = Minigame;
  MG.util = { rr, clamp, shuffle, COL };

  // ---------------------------------------------------------------- style + panel
  const st = document.createElement('style');
  st.textContent = `
  #ui #mg{position:absolute;inset:0;display:none;align-items:center;justify-content:center;z-index:12;box-sizing:border-box;padding:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));background:radial-gradient(ellipse at center,rgba(3,6,10,.28),rgba(2,4,8,.62));touch-action:none}
  #ui #mg.open{display:flex}
  #ui #mg .mg-p{position:relative;box-sizing:border-box;width:min(640px,100%);max-height:100%;display:grid;grid-template-columns:1fr;grid-template-areas:'hd' 'sub' 'tm' 'st' 'msg' 'ctl' 'hint';gap:8px;padding:14px 18px 12px;background:rgba(9,11,15,.94);border:1px solid rgba(255,255,255,.08);border-radius:8px;box-shadow:0 24px 70px rgba(0,0,0,.55);animation:uiIn .16s ease;transition:box-shadow .25s}
  #ui #mg .mg-p.f-bad{box-shadow:0 0 0 2px rgba(255,107,107,.75),0 24px 70px rgba(0,0,0,.55)} #ui #mg .mg-p.f-ok{box-shadow:0 0 0 2px rgba(125,220,138,.75),0 24px 70px rgba(0,0,0,.55)}
  #ui #mg .mg-hd{grid-area:hd;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;border-bottom:2px solid var(--gold);padding-bottom:6px}
  #ui #mg .mg-k{font:700 10px var(--font);letter-spacing:1.8px;text-transform:uppercase;color:var(--gold)}
  #ui #mg h2{margin:1px 0 0;font:400 22px/1.1 Limelight,Georgia,serif;letter-spacing:1px;color:#fff}
  #ui #mg .mg-x{flex:none;width:34px;height:34px;border-radius:6px;background:rgba(255,255,255,.07);font-size:16px;color:var(--dim);transition:background .15s,color .15s} #ui #mg .mg-x:hover{background:rgba(255,107,107,.22);color:#fff}
  #ui #mg .mg-sub{grid-area:sub;font-size:13px;color:var(--ink);opacity:.86;line-height:1.35}
  #ui #mg .mg-tm{grid-area:tm;height:4px;border-radius:2px;background:rgba(255,255,255,.08);overflow:hidden} #ui #mg .mg-tm.off{display:none}
  #ui #mg .mg-tm i{display:block;height:100%;width:100%;background:var(--gold);transform-origin:0 50%;transition:background .3s} #ui #mg .mg-tm.low i{background:#ff6b6b}
  #ui #mg .mg-st{grid-area:st;position:relative;height:clamp(200px,46vh,380px);border-radius:6px;overflow:hidden;background:#06080c;box-shadow:inset 0 0 0 1px rgba(255,255,255,.06);touch-action:none}
  #ui #mg .mg-st canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
  #ui #mg .mg-st.dom canvas{display:none} #ui #mg .mg-dom{position:absolute;inset:0;display:none} #ui #mg .mg-st.dom .mg-dom{display:block}
  #ui #mg .mg-res{position:absolute;inset:0;display:none;align-items:center;justify-content:center;flex-direction:column;background:rgba(4,6,10,.62);pointer-events:none}
  #ui #mg .mg-res.on{display:flex;animation:mgRes .28s cubic-bezier(.2,.9,.3,1.3)}
  #ui #mg .mg-res b{font:400 34px/1.1 Limelight,Georgia,serif;letter-spacing:2px;text-transform:uppercase;color:#7ddc8a;text-shadow:0 2px 14px rgba(0,0,0,.8)} #ui #mg .mg-res.bad b{color:#ff6b6b}
  #ui #mg .mg-res small{margin-top:6px;color:var(--dim);font-size:12px}
  @keyframes mgRes{from{opacity:0;transform:scale(1.15)}to{opacity:1;transform:none}}
  #ui #mg .mg-msg{grid-area:msg;min-height:18px;text-align:center;font-size:13px;color:var(--dim);font-variant-numeric:tabular-nums}
  #ui #mg .mg-msg.ok{color:#7ddc8a} #ui #mg .mg-msg.bad{color:#ff7b7b} #ui #mg .mg-msg.info{color:var(--gold)}
  #ui #mg .mg-ctl{grid-area:ctl;display:flex;flex-wrap:wrap;gap:8px;justify-content:center;align-items:center} #ui #mg .mg-ctl:empty{display:none}
  #ui #mg .mg-b{min-height:40px;min-width:92px;padding:0 16px;border-radius:6px;background:rgba(255,255,255,.08);font:600 13px var(--font);letter-spacing:.4px;color:#fff;transition:background .12s,transform .08s;touch-action:none}
  #ui #mg .mg-b:hover{background:rgba(255,255,255,.15)} #ui #mg .mg-b:active,#ui #mg .mg-b.on{transform:scale(.96);background:rgba(255,255,255,.2)}
  #ui #mg .mg-b.pri{background:var(--gold);color:#221a06} #ui #mg .mg-b.pri:hover{background:#ffd666} #ui #mg .mg-b.red{background:#a8323a} #ui #mg .mg-b.red:hover{background:#c23c46}
  #ui #mg .mg-b[disabled]{opacity:.35;pointer-events:none} #ui #mg .mg-b kbd{margin-left:6px;opacity:.75}
  #ui #mg .mg-hint{grid-area:hint;text-align:center;font-size:11px;color:var(--dim);line-height:1.6}
  #ui #mg .mg-sls{display:grid;grid-template-columns:auto 1fr auto;gap:4px 10px;align-items:center;width:100%}
  #ui #mg .mg-sls span{font:700 10px var(--font);letter-spacing:1.2px;text-transform:uppercase;color:var(--gold)} #ui #mg .mg-sls em{font-style:normal;font-size:12px;color:var(--dim);min-width:58px;text-align:right;font-variant-numeric:tabular-nums}
  #ui #mg input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:30px;background:transparent;margin:0;touch-action:none}
  #ui #mg input[type=range]::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:rgba(255,255,255,.14)}
  #ui #mg input[type=range]::-moz-range-track{height:6px;border-radius:3px;background:rgba(255,255,255,.14)}
  #ui #mg input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:24px;height:24px;margin-top:-9px;border-radius:50%;background:var(--gold);box-shadow:0 2px 6px rgba(0,0,0,.5)}
  #ui #mg input[type=range]::-moz-range-thumb{width:24px;height:24px;border:0;border-radius:50%;background:var(--gold)}
  #ui #mg .mg-arr{display:none;gap:8px} #ui #mg .mg-ctl.jam .mg-arr{display:flex} #ui #mg .mg-ctl.jam .mg-drillb{display:none}
  #ui #mg .mg-arr .mg-b{min-width:56px;font-size:20px}
  #ui.touch #mg .mg-b{min-height:46px}
  @media (orientation:landscape) and (max-height:560px){
    #ui #mg{padding:max(8px,env(safe-area-inset-top)) max(10px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(10px,env(safe-area-inset-left))}
    #ui #mg .mg-p{width:min(900px,100%);height:100%;grid-template-columns:minmax(190px,34%) 1fr;grid-template-rows:auto auto auto auto 1fr auto;grid-template-areas:'hd st' 'sub st' 'tm st' 'msg st' 'ctl st' 'hint st';align-content:start;gap:6px 12px;padding:10px 12px}
    #ui #mg .mg-st{height:auto;min-height:0}
    #ui #mg h2{font-size:18px} #ui #mg .mg-sub{font-size:12px} #ui #mg .mg-msg{text-align:left;font-size:12px} #ui #mg .mg-hint{text-align:left}
    #ui #mg .mg-ctl{justify-content:flex-start;align-self:end} #ui #mg .mg-b{min-width:0;padding:0 12px}
  }`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'mg'; el.className = 'pe';
  el.innerHTML = '<div class="mg-p"><div class="mg-hd"><div><div class="mg-k"></div><h2></h2></div><button class="mg-x" aria-label="Give up" title="Give up (Esc)">\u2715</button></div>' +
    '<div class="mg-sub"></div><div class="mg-tm off"><i></i></div><div class="mg-st"><canvas></canvas><div class="mg-dom"></div><div class="mg-res"><b></b><small></small></div></div>' +
    '<div class="mg-msg"></div><div class="mg-ctl"></div><div class="mg-hint"></div></div>';
  root.appendChild(el);
  const $ = (q) => el.querySelector(q);
  const pan = $('.mg-p'), kEl = $('.mg-k'), tEl = $('h2'), subEl = $('.mg-sub'), tmEl = $('.mg-tm'), tmFill = $('.mg-tm i'), stage = $('.mg-st'), cv = $('canvas'),
    domEl = $('.mg-dom'), resEl = $('.mg-res'), msgEl = $('.mg-msg'), ctlEl = $('.mg-ctl'), hintEl = $('.mg-hint');
  const g2 = cv.getContext('2d');
  let cur = null, raf = 0, last = 0;

  // ---------------------------------------------------------------- lifecycle
  const finish = (c, res) => {
    if (c.done) return; c.done = true;
    if (c.endTimer) clearTimeout(c.endTimer);
    if (c.K.exit) { try { c.K.exit(c); } catch (e) { console.error('[mg] exit', e); } }
    if (cur === c) {
      cur = null; MG.open = false; MG.kind = null; el.classList.remove('open'); resEl.className = 'mg-res';
      domEl.innerHTML = ''; ctlEl.innerHTML = ''; ctlEl.className = 'mg-ctl';
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      if (c.wasLocked && AF.input && AF.input.requestLock) AF.input.requestLock();
    }
    MG.last = res;
    c.resolve(res);
  };
  const end = (c, ok, extra, banner, sub, delay) => {
    if (!c || c.ending || c.done) return;
    c.ending = true;
    let res = { ok: !!ok, cancelled: false, kind: c.kind };
    if (c.K.result) Object.assign(res, c.K.result(c));
    if (extra) Object.assign(res, extra);
    c.res = res;
    if (!delay) { finish(c, res); return; }
    resEl.className = 'mg-res on' + (ok ? '' : ' bad'); resEl.querySelector('b').textContent = banner || (ok ? 'Done' : 'Failed'); resEl.querySelector('small').textContent = sub || '';
    c.endTimer = setTimeout(() => finish(c, res), delay);
  };
  const setMsg = (c, text, cls, secs) => { if (!c) return; c.msgT = secs == null ? 2.6 : secs; msgEl.className = 'mg-msg ' + (cls || 'info'); msgEl.textContent = text; };
  const showStatus = (c) => { if (c.msgT > 0) return; const t = c.statusText || ''; if (msgEl.textContent !== t || msgEl.className !== 'mg-msg') { msgEl.className = 'mg-msg'; msgEl.textContent = t; } };
  const makeCtx = (kind, K, opts, resolve) => {
    const c = {
      kind, K, opts, resolve, s: {}, held: new Set(), t: 0, msgT: 0, statusText: '', done: false, ending: false,
      diff: clamp(opts.diff == null ? 0.5 : +opts.diff || 0, 0, 1), time: opts.time > 0 ? +opts.time : 0, left: 0,
      dom: domEl, ctl: ctlEl, stage, touch: !!AF.touch, w: 0, h: 0,
    };
    c.left = c.time;
    c.snd = snd;
    c.msg = (text, cls, secs) => setMsg(c, text, cls, secs);
    c.status = (text) => { c.statusText = text; showStatus(c); };
    c.flash = (k) => { pan.classList.remove('f-bad', 'f-ok'); void pan.offsetWidth; pan.classList.add(k === 'ok' ? 'f-ok' : 'f-bad'); clearTimeout(c.flashT); c.flashT = setTimeout(() => pan.classList.remove('f-bad', 'f-ok'), 380); };
    c.win = (extra, banner, sub) => { if (c.ending) return; snd('jg_win', 0.8); c.flash('ok'); end(c, true, extra, banner || K.winText || 'Success', sub, 950); };
    c.fail = (extra, banner, sub) => { if (c.ending) return; snd('jg_fail', 0.8); c.flash('bad'); end(c, false, extra, banner || 'Failed', sub, 1300); };
    c.close = (ok, extra) => end(c, ok, extra);
    c.call = (name, ...args) => { const f = opts[name]; if (typeof f === 'function') { try { return f(...args); } catch (e) { console.error('[mg] ' + name, e); } } return undefined; };
    return c;
  };

  MG.play = (kind, opts = {}) => {
    const K = KINDS[kind];
    if (!K) return Promise.resolve({ ok: false, cancelled: true, kind, error: 'unknown minigame ' + kind });
    if (cur) { const p = cur; end(p, false, { cancelled: true }); if (!p.done) finish(p, p.res || { ok: false, cancelled: true, kind: p.kind }); }
    return new Promise((resolve) => {
      const c = cur = makeCtx(kind, K, opts, resolve);
      kEl.textContent = opts.label || K.label; tEl.textContent = opts.title || K.title; subEl.textContent = opts.sub || K.sub;
      hintEl.innerHTML = (c.touch ? K.hintTouch : K.hint) || K.hint || '';
      tmEl.classList.toggle('off', !c.time); tmEl.classList.remove('low'); tmFill.style.transform = 'scaleX(1)';
      msgEl.className = 'mg-msg'; msgEl.textContent = ''; resEl.className = 'mg-res'; ctlEl.innerHTML = ''; ctlEl.className = 'mg-ctl'; domEl.innerHTML = '';
      stage.classList.toggle('dom', !!K.dom);
      MG.open = true; MG.kind = kind;
      el.classList.add('open');
      c.wasLocked = !!document.pointerLockElement;
      if (AF.input) { AF.input.releaseLock(); AF.input.down.clear(); AF.input.mouse.buttons = 0; }
      if (AF.PL) AF.PL.aim = false;
      try { K.init(c); } catch (e) { console.error('[mg] init ' + kind, e); end(c, false, { cancelled: true, error: String(e) }); return; }
      snd('ui_open', 0.6); snd('jg_start', 0.5);
      last = performance.now();
      if (!raf) raf = requestAnimationFrame(loop);
    });
  };
  MG.cancel = () => { if (cur) end(cur, false, { cancelled: true }); };
  MG.close = (ok = true, extra) => { if (cur) end(cur, ok, extra); };
  MG.msg = (text, cls, secs) => setMsg(cur, text, cls || 'info', secs == null ? 3.5 : secs);
  MG.state = () => (cur ? cur.s : null);
  MG.ctx = () => cur;
  MG.solve = () => { if (cur && cur.K.solve && !cur.ending) { cur.K.solve(cur); return true; } return false; };
  MG.key = (code, down) => { if (cur && !cur.ending) { if (down) cur.held.add(code); else cur.held.delete(code); if (cur.K.key) cur.K.key(cur, code, down); } };

  // ---------------------------------------------------------------- frame loop (own rAF while open: smooth needles at any fps cap)
  const loop = (now) => {
    raf = 0;
    const c = cur; if (!c) return;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000)); last = now;
    if (!c.ending) {
      c.t += dt;
      if (c.time) {
        c.left -= dt; const k = clamp(c.left / c.time, 0, 1);
        tmFill.style.transform = 'scaleX(' + k.toFixed(4) + ')'; tmEl.classList.toggle('low', k < 0.25);
        if (c.left <= 0) c.fail({ timeout: true }, 'Out of time');
      }
      if (!c.ending && c.K.frame) { try { c.K.frame(c, dt); } catch (e) { console.error('[mg] frame', e); end(c, false, { cancelled: true, error: String(e) }); } }
    }
    if (c.msgT > 0) { c.msgT -= dt; if (c.msgT <= 0) showStatus(c); }
    if (!c.K.dom && c.K.draw && !c.done) {
      const w = cv.clientWidth, h = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (w > 0 && h > 0) {
        const W = Math.round(w * dpr), H = Math.round(h * dpr);
        if (cv.width !== W || cv.height !== H) { cv.width = W; cv.height = H; }
        c.w = w; c.h = h;
        g2.setTransform(dpr, 0, 0, dpr, 0, 0); g2.clearRect(0, 0, w, h);
        try { c.K.draw(c, g2, w, h); } catch (e) { console.error('[mg] draw', e); }
      }
    }
    if (cur === c && !c.done) raf = requestAnimationFrame(loop);
  };

  // ---------------------------------------------------------------- input
  const pt = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  cv.addEventListener('pointerdown', (e) => { const c = cur; if (!c || c.ending || !c.K.down) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (er) { /* no capture */ } const [x, y] = pt(e); c.K.down(c, x, y, e); });
  cv.addEventListener('pointermove', (e) => { const c = cur; if (!c || c.ending || !c.K.move) return; const [x, y] = pt(e); c.K.move(c, x, y, e); });
  const pUp = (e) => { const c = cur; if (!c || !c.K.up) return; const [x, y] = pt(e); c.K.up(c, x, y, e); };
  cv.addEventListener('pointerup', pUp); cv.addEventListener('pointercancel', pUp);
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  stage.addEventListener('wheel', (e) => { const c = cur; if (!c || c.ending) return; e.preventDefault(); if (c.K.wheel) c.K.wheel(c, e.deltaY); }, { passive: false });
  // on-screen buttons: data-a = action (K.act), data-key = tap a key, data-hold = hold a key while pressed
  ctlEl.addEventListener('click', (e) => { const b = e.target.closest('button'); const c = cur; if (!b || !c || c.ending) return; if (b.dataset.a && c.K.act) c.K.act(c, b.dataset.a, b); else if (b.dataset.key) { MG.key(b.dataset.key, true); MG.key(b.dataset.key, false); } });
  const holdOn = (e) => { const b = e.target.closest('button[data-hold]'); if (!b || !cur) return; e.preventDefault(); b.classList.add('on'); try { b.setPointerCapture(e.pointerId); } catch (er) { /* no capture */ } MG.key(b.dataset.hold, true); };
  const holdOff = (e) => { const b = e.target.closest('button[data-hold]'); if (!b) return; b.classList.remove('on'); if (cur) MG.key(b.dataset.hold, false); };
  ctlEl.addEventListener('pointerdown', holdOn); ctlEl.addEventListener('pointerup', holdOff); ctlEl.addEventListener('pointercancel', holdOff); ctlEl.addEventListener('lostpointercapture', holdOff);
  domEl.addEventListener('click', (e) => { const b = e.target.closest('[data-a]'); const c = cur; if (b && c && !c.ending && c.K.act) c.K.act(c, b.dataset.a, b); });
  $('.mg-x').addEventListener('click', () => MG.cancel());
  // keys go to the minigame, not the game (Escape still reaches 01-core -> 'escape' -> 71-ui cancels the minigame)
  addEventListener('keydown', (e) => {
    const c = cur; if (!c || e.code === 'Escape') return;
    e.stopImmediatePropagation();
    if (/^(Arrow|Space|Tab|Enter|Backspace|Digit|Numpad|Key[A-Z]$)/.test(e.code)) e.preventDefault();
    if (c.ending) return;
    if (e.repeat && !c.K.repeat) return;
    c.held.add(e.code); if (c.K.key) c.K.key(c, e.code, true, e);
  }, true);
  addEventListener('keyup', (e) => { const c = cur; if (!c) return; c.held.delete(e.code); if (!c.ending && c.K.key) c.K.key(c, e.code, false, e); }, true);
  addEventListener('blur', () => { const c = cur; if (c) { for (const k of c.held) if (c.K.key && !c.ending) c.K.key(c, k, false); c.held.clear(); } });
  AF.on('mode', (name) => { if (name === 'dead' && cur) end(cur, false, { cancelled: true, dead: true }); });

  // ---------------------------------------------------------------- kinds
  // ---- lockpick: a side cut-away of a pin-tumbler cylinder. Tension (Q/E, wheel or the gauge) loads the plug; only one pin binds
  // at a time (a fixed random order). Lifting the binding pin's key pin to the shear line under tension in the (hidden) sweet band
  // sets it with a click; too light and nothing catches, too heavy and the binding pin seizes and the pick bends until it snaps,
  // lifting past the line jams it (overset) until the tension is released, which drops every set pin.
  const LP = KINDS.lockpick = new Minigame({
    label: 'Lock', title: 'Pick the lock', winText: 'Unlocked',
    sub: 'Keep light tension on the plug, find the binding pin (it wobbles) and lift it to the shear line until it clicks.',
    hint: '<kbd>Drag</kbd> a pin up \u00b7 <kbd>\u2190</kbd><kbd>\u2192</kbd> choose pin \u00b7 hold <kbd>\u2191</kbd> lift \u00b7 <kbd>Q</kbd>/<kbd>E</kbd> or wheel: tension \u00b7 <kbd>Esc</kbd> give up',
    hintTouch: 'Drag a pin up to lift it \u00b7 drag the TENSION gauge on the left \u00b7 the binding pin wobbles',
    init(c) {
      const s = c.s, d = c.diff, o = c.opts;
      s.n = clamp((o.pins | 0) || 4 + Math.round(d * 2), 3, 7);
      s.order = shuffle([...Array(s.n).keys()]);
      s.need = []; for (let i = 0; i < s.n; i++) s.need.push(0.3 + R() * 0.45);
      s.tol = 0.06 - 0.025 * d; s.over = 0.17 - 0.07 * d;
      const mid = 0.4 + R() * 0.2, half = 0.17 - 0.07 * d; s.lo = mid - half; s.hi = mid + half;
      s.picks = (o.picks | 0) || (d < 0.34 ? 5 : d < 0.67 ? 4 : 3); s.snapped = 0;
      s.T = 0; s.sel = 0; s.lift = 0; s.h = new Float32Array(s.n); s.set = new Uint8Array(s.n); s.k = 0; s.overset = -1;
      s.stress = 0; s.wob = 0; s.drag = null; s.tdrag = false; s.open = 0; s.scrT = 0; s.warnT = 0; s.showBand = d < 0.5; s.G = null;
      LP.stat(c);
    },
    stat(c) { const s = c.s; c.status('Pins set ' + s.k + '/' + s.n + ' \u00b7 picks left ' + s.picks); },
    selPin(c, i) { const s = c.s; i = clamp(i, 0, s.n - 1); if (i !== s.sel) { s.sel = i; s.lift = 0; s.drag = null; snd('ui_click', 0.2, 1.4); } },
    frame(c, dt) {
      const s = c.s, H = c.held, d = c.diff;
      if (s.open) { s.open += dt; if (s.open > 0.75) c.win({ picks: s.picks, snapped: s.snapped }, 'Unlocked'); return; }
      if (H.has('KeyE') || H.has('NumpadAdd')) s.T += dt * 0.45;
      if (H.has('KeyQ') || H.has('NumpadSubtract')) s.T -= dt * 0.45;
      s.T = clamp(s.T, 0, 1);
      if (!s.drag) s.lift = clamp(s.lift + (H.has('ArrowUp') || H.has('KeyW') ? dt * 0.5 : -dt * 1.8), 0, 1);
      if (s.T < 0.1 && (s.k || s.overset >= 0)) {
        s.set.fill(0); s.k = 0; s.overset = -1; snd('latch', 0.45, 1.35); c.msg('Tension released \u2014 every pin dropped back.', 'bad', 2.5); LP.stat(c);
      }
      const bind = s.order[s.k];
      let stressing = false, probing = false;
      for (let i = 0; i < s.n; i++) {
        if (i === s.overset) continue;
        if (i !== s.sel) { s.h[i] = Math.max(0, s.h[i] - dt * 2.6); continue; }
        const prev = s.h[i];
        if (s.set[i]) { s.h[i] += (Math.min(s.lift, s.need[i]) - s.h[i]) * Math.min(1, dt * 16); continue; }
        if (i === bind && s.T > s.hi) {
          if (s.h[i] > s.lift) s.h[i] = s.lift;
          probing = s.lift > 0.02;
          if (s.lift > s.h[i] + 0.03) {
            stressing = true; s.stress += (s.lift - s.h[i]) * dt * (2.6 + 2 * d);
            if (s.warnT <= 0) { c.msg('The pin is seized solid \u2014 too much tension. The pick is bending!', 'bad', 2); s.warnT = 2; }
          }
          continue;
        }
        s.h[i] += (s.lift - s.h[i]) * Math.min(1, dt * 14);
        if (i !== bind || s.T < 0.1) continue;
        probing = s.lift > 0.02;
        const a = Math.min(prev, s.h[i]), b = Math.max(prev, s.h[i]), lo = s.need[i] - s.tol, hi = s.need[i] + s.tol;
        if (s.T >= s.lo) {
          if (s.h[i] > hi + s.over) {
            s.overset = i; s.h[i] = hi + s.over; snd('click_metal', 0.6, 0.7); c.flash('bad');
            c.msg('Overset! The key pin jammed above the shear line \u2014 ease the tension right off to reset.', 'bad', 4);
          } else if (b >= lo && a <= hi) {
            s.set[i] = 1; s.k++; snd('click_metal', 1, 1.2); snd('ui_click', 0.5, 0.8);
            if (s.k >= s.n) { s.open = 0.001; snd('latch', 1); c.msg('The plug turns\u2026', 'ok', 3); } else c.msg('Click \u2014 pin set (' + s.k + '/' + s.n + ').', 'ok', 1.6);
            LP.stat(c);
          }
        } else if (b >= lo && a <= hi && s.warnT <= 0) { c.msg('Too light \u2014 the pin passes the shear line but nothing catches. A touch more tension.', 'info', 2.4); s.warnT = 2.4; }
      }
      s.warnT -= dt;
      if (!stressing) s.stress = Math.max(0, s.stress - dt * 0.7);
      if (s.stress >= 1) {
        s.picks--; s.snapped++; s.stress = 0; s.lift = 0; s.drag = null; snd('click_metal', 1, 1.9); snd('dry', 0.7); c.flash('bad'); LP.stat(c);
        if (s.picks <= 0) { c.fail({ picks: 0, snapped: s.snapped }, 'Pick snapped', 'No picks left'); return; }
        c.msg('Snap! The pick broke \u2014 ' + s.picks + ' left. Ease off the tension.', 'bad', 3);
      }
      s.wob = probing ? Math.min(1, s.wob + dt * 6) : Math.max(0, s.wob - dt * 4);
      s.scrT -= dt; if (probing && s.scrT <= 0) { snd('ui_click', 0.12, 0.5 + R() * 0.25); s.scrT = 0.2 + R() * 0.12; }
    },
    key(c, code, down) {
      if (!down) return;
      if (code === 'ArrowLeft' || code === 'KeyA') LP.selPin(c, c.s.sel - 1);
      else if (code === 'ArrowRight' || code === 'KeyD') LP.selPin(c, c.s.sel + 1);
    },
    tension(c, y) { const G = c.s.G; c.s.T = clamp((G.yB - 4 - y) / (G.yB - 4 - G.yT), 0, 1); },
    down(c, x, y) {
      const s = c.s, G = s.G; if (!G) return;
      if (x < G.gx1 + 8) { s.tdrag = true; LP.tension(c, y); return; }
      LP.selPin(c, Math.floor((x - G.x0) / G.pitch)); s.drag = { y0: y, l0: s.lift };
    },
    move(c, x, y) { const s = c.s, G = s.G; if (!G) return; if (s.tdrag) LP.tension(c, y); else if (s.drag) s.lift = clamp(s.drag.l0 + (s.drag.y0 - y) / G.P, 0, 1); },
    up(c) { c.s.tdrag = false; c.s.drag = null; },
    wheel(c, dy) { c.s.T = clamp(c.s.T - dy * 0.0005, 0, 1); },
    result(c) { return { picks: c.s.picks, snapped: c.s.snapped }; },
    draw(c, g, w, h) {
      const s = c.s, n = s.n;
      const gw = Math.max(44, w * 0.075), gx0 = 12, gx1 = gx0 + gw;
      const x0 = gx1 + 30, x1 = w - Math.max(70, w * 0.13);
      const yT = h * 0.13, yS = h * 0.48, yB = h * 0.88, yKey = yB - (yB - yS) * 0.36;
      const P = (yKey - yS) * 0.86, pitch = (x1 - x0) / n, pw = Math.min(24, pitch * 0.42);
      s.G = { gx0, gx1, x0, x1, yT, yB, P, pitch };
      g.fillStyle = '#07090c'; g.fillRect(0, 0, w, h);
      let gr = g.createLinearGradient(0, yT, 0, yS); gr.addColorStop(0, '#5e4518'); gr.addColorStop(1, '#a8833c');
      g.fillStyle = gr; rr(g, x0 - 16, yT - 8, x1 - x0 + 32, yS - yT + 8, 8); g.fill();
      gr = g.createLinearGradient(0, yS, 0, yB); gr.addColorStop(0, '#dcb660'); gr.addColorStop(1, '#94722e');
      g.fillStyle = gr; rr(g, x0 - 16, yS + 1, w - x0 + 40, yB - yS - 1, 6); g.fill();
      const kw0 = yKey + 3, kw1 = yB - 8;
      g.fillStyle = '#17110a'; g.fillRect(x0 - 16, kw0, w, kw1 - kw0);
      const bind = s.order[s.k];
      for (let i = 0; i < n; i++) {
        const xi = x0 + (i + 0.5) * pitch;
        const wob = i === s.sel && i === bind && s.T >= 0.1 && !s.set[i] ? Math.sin(c.t * 70) * 1.6 * s.wob : 0;
        if (i === s.sel) { g.fillStyle = 'rgba(139,216,195,0.10)'; g.fillRect(xi - pitch / 2 + 3, yT - 8, pitch - 6, yB - yT + 8); }
        g.fillStyle = '#21180b'; g.fillRect(xi - pw / 2 - 3, yT, pw + 6, yKey - yT + 3);
        const L = (yKey - yS) - s.need[i] * P, keyBot = yKey - s.h[i] * P, keyTop = keyBot - L, D = (yS - yT) * 0.42;
        const drvBot = s.set[i] ? Math.min(yS - 1, keyTop) : keyTop, drvTop = drvBot - D, xw = xi + wob;
        g.strokeStyle = '#9aa3ab'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xi, yT + 2);
        for (let k = 1; k <= 14; k++) g.lineTo(xw + (k === 14 ? 0 : k % 2 ? pw * 0.42 : -pw * 0.42), yT + 2 + (drvTop - yT - 2) * k / 14);
        g.stroke();
        gr = g.createLinearGradient(xw - pw / 2, 0, xw + pw / 2, 0); gr.addColorStop(0, '#6f7880'); gr.addColorStop(0.45, '#e9eef2'); gr.addColorStop(1, '#848d95');
        g.fillStyle = gr; rr(g, xw - pw / 2, drvTop, pw, D, 3); g.fill();
        gr = g.createLinearGradient(xw - pw / 2, 0, xw + pw / 2, 0); gr.addColorStop(0, '#a87a22'); gr.addColorStop(0.45, '#ffe08a'); gr.addColorStop(1, '#b08428');
        g.fillStyle = gr; g.beginPath(); g.moveTo(xw - pw / 2, keyTop + 1); g.lineTo(xw + pw / 2, keyTop + 1); g.lineTo(xw + pw / 2, keyBot - pw * 0.4); g.lineTo(xw, keyBot); g.lineTo(xw - pw / 2, keyBot - pw * 0.4); g.closePath(); g.fill();
        g.fillStyle = s.set[i] ? COL.ok : i === s.overset ? COL.bad : '#2b3238'; g.beginPath(); g.arc(xi, yT - 20, 4.5, 0, 6.2832); g.fill();
      }
      g.strokeStyle = 'rgba(255,236,190,.6)'; g.lineWidth = 1; g.setLineDash([6, 4]); g.beginPath(); g.moveTo(x0 - 16, yS); g.lineTo(x1 + 16, yS); g.stroke(); g.setLineDash([]);
      if (w - x1 > 84) { g.fillStyle = 'rgba(255,236,190,.55)'; g.font = '600 9px system-ui,sans-serif'; g.textAlign = 'left'; g.fillText('SHEAR LINE', x1 + 20, yS + 3); }
      // pick: shaft along the keyway, hook under the chosen pin; bends red under stress
      const xs = x0 + (s.sel + 0.5) * pitch, yP = (kw0 + kw1) / 2, tipY = yKey - s.h[s.sel] * P - (s.drag || s.lift > 0.01 ? 0 : -2), st2 = s.stress;
      g.strokeStyle = 'rgb(' + Math.round(170 + 85 * st2) + ',' + Math.round(178 - 120 * st2) + ',' + Math.round(186 - 140 * st2) + ')';
      g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
      g.beginPath(); g.moveTo(w + 6, yP + 2); g.quadraticCurveTo((xs + w) / 2, yP - st2 * 30, xs + 8, Math.min(yP, tipY + 10)); g.lineTo(xs, tipY + 1); g.stroke();
      g.fillStyle = '#1b2024'; rr(g, Math.max(x1 + 30, w - 52), yP - 10, 60, 20, 6); g.fill();
      // tension wrench (tilts with load) + gauge
      g.strokeStyle = '#c4cbd1'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0 + 4, kw0 + 5); g.lineTo(gx1 + 12, kw0 + 5); g.lineTo(gx1 + 12 + s.T * 12, h - 4); g.stroke();
      g.fillStyle = '#12161b'; rr(g, gx0, yT - 8, gw, yB - yT + 8, 8); g.fill();
      const gy0 = yT, gy1 = yB - 4, gh = gy1 - gy0;
      if (s.showBand) { g.fillStyle = 'rgba(125,220,138,.18)'; g.fillRect(gx0 + 4, gy1 - s.hi * gh, gw - 8, (s.hi - s.lo) * gh); }
      if (s.T > 0.004) { g.fillStyle = s.T < 0.1 ? '#59626a' : COL.gold; rr(g, gx0 + 7, gy1 - s.T * gh, gw - 14, s.T * gh, 4); g.fill(); }
      g.fillStyle = '#fff'; g.fillRect(gx0 + 3, gy1 - s.T * gh - 1, gw - 6, 2);
      g.fillStyle = COL.dim; g.font = '700 9px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('TENSION', gx0 + gw / 2, yT - 14);
      g.textAlign = 'right'; g.fillStyle = COL.dim; g.fillText('PICKS', w - 12 - s.picks * 9 - 4, 16);
      g.strokeStyle = '#cfd6dc'; g.lineWidth = 2; for (let k = 0; k < s.picks; k++) { const px = w - 14 - k * 9; g.beginPath(); g.moveTo(px, 22); g.lineTo(px, 9); g.lineTo(px - 3, 7); g.stroke(); }
    },
  });

  // ---- circuit: rotate tiles of a random spanning tree ("Net") so power reaches every target. Always solvable (the tree itself).
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];   // N E S W = bits 1 2 4 8
  const rotM = (m, r) => { r &= 3; return ((m << r) | (m >> (4 - r))) & 15; };
  const bits = (m) => (m & 1) + ((m >> 1) & 1) + ((m >> 2) & 1) + ((m >> 3) & 1);
  MG.gen.circuit = (n, k) => {
    const N = n * n, sol = new Array(N).fill(0), seen = new Uint8Array(N), front = [], src = ri(n) * n;
    const add = (i) => { seen[i] = 1; const x = i % n, y = (i / n) | 0; for (let d = 0; d < 4; d++) { const xx = x + DX[d], yy = y + DY[d]; if (xx >= 0 && yy >= 0 && xx < n && yy < n && !seen[yy * n + xx]) front.push(i * 4 + d); } };
    add(src);
    while (front.length) {
      const j = ri(front.length), e = front[j]; front[j] = front[front.length - 1]; front.pop();
      const i = e >> 2, d = e & 3, t = i + DY[d] * n + DX[d];
      if (seen[t]) continue;
      sol[i] |= 1 << d; sol[t] |= 1 << ((d + 2) & 3); add(t);
    }
    const dist = new Int16Array(N).fill(-1), q = [src]; dist[src] = 0;
    for (let qi = 0; qi < q.length; qi++) { const i = q[qi]; for (let d = 0; d < 4; d++) if ((sol[i] >> d) & 1) { const t = i + DY[d] * n + DX[d]; if (dist[t] < 0) { dist[t] = dist[i] + 1; q.push(t); } } }
    const leaves = []; for (let i = 0; i < N; i++) if (i !== src && bits(sol[i]) === 1) leaves.push(i);
    leaves.sort((a, b) => dist[b] - dist[a]);
    const pool = shuffle(leaves.slice(0, Math.max(k, Math.ceil(leaves.length / 2))));
    return { n, src, targets: pool.slice(0, k), sol };
  };
  const circuitLit = (P, rot, out) => {
    const n = P.n; out.fill(0); out[P.src] = 1; const stack = [P.src];
    while (stack.length) {
      const i = stack.pop(), m = rotM(P.sol[i], rot[i]), x = i % n, y = (i / n) | 0;
      for (let d = 0; d < 4; d++) {
        if (!((m >> d) & 1)) continue;
        const xx = x + DX[d], yy = y + DY[d]; if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        const t = yy * n + xx; if (!out[t] && (rotM(P.sol[t], rot[t]) >> ((d + 2) & 3)) & 1) { out[t] = 1; stack.push(t); }
      }
    }
    return out;
  };
  MG.gen.circuitSolved = (P, rot) => { const lit = circuitLit(P, rot, new Uint8Array(P.n * P.n)); return P.targets.every((t) => lit[t]); };
  const bolt = (g, x, y, r) => { g.beginPath(); g.moveTo(x - 0.25 * r, y - 0.6 * r); g.lineTo(x + 0.3 * r, y - 0.1 * r); g.lineTo(x, y - 0.05 * r); g.lineTo(x + 0.25 * r, y + 0.6 * r); g.lineTo(x - 0.3 * r, y + 0.1 * r); g.lineTo(x, y + 0.05 * r); g.closePath(); g.fill(); };
  const CI = KINDS.circuit = new Minigame({
    label: 'Circuit', title: 'Reroute the power', winText: 'Power routed',
    sub: 'Rotate the tiles so the current runs from the source to every target.',
    hint: '<kbd>Click</kbd> rotate \u00b7 <kbd>Right-click</kbd> rotate back \u00b7 <kbd>Arrows</kbd> + <kbd>Space</kbd> \u00b7 <kbd>Esc</kbd> give up',
    hintTouch: 'Tap a tile to rotate it \u00b7 light up every target',
    init(c) {
      const s = c.s, d = c.diff, o = c.opts;
      s.n = clamp((o.size | 0) || 4 + Math.round(d * 2), 3, 8);
      s.k = clamp((o.targets | 0) || 1 + Math.round(d * 2), 1, 4);
      s.P = MG.gen.circuit(s.n, s.k); s.k = s.P.targets.length;
      const N = s.n * s.n; s.rc = new Int32Array(N); s.ang = new Float32Array(N); s.lit = new Uint8Array(N);
      for (let tries = 0; tries < 30; tries++) { for (let i = 0; i < N; i++) s.rc[i] = ri(4); if (!MG.gen.circuitSolved(s.P, s.rc)) break; }
      for (let i = 0; i < N; i++) s.ang[i] = s.rc[i] * Math.PI / 2;
      s.cx = 0; s.cy = (s.P.src / s.n) | 0; s.kb = false; s.moves = 0; s.won = 0; s.on = 0; s.G = null;
      CI.update(c, true);
    },
    update(c, quiet) {
      const s = c.s; circuitLit(s.P, s.rc, s.lit);
      let on = 0; for (const t of s.P.targets) if (s.lit[t]) on++;
      if (!quiet && on > s.on) snd('ui_check', 0.6);
      s.on = on; c.status('Targets powered ' + on + '/' + s.k + ' \u00b7 moves ' + s.moves);
      if (on === s.k && !s.won) { s.won = 0.001; snd('latch', 0.6); }
    },
    rotate(c, i, dir) { const s = c.s; if (s.won) return; s.rc[i] += dir; s.moves++; snd('ui_click', 0.45, dir > 0 ? 1.1 : 0.9); CI.update(c); },
    frame(c, dt) {
      const s = c.s, N = s.n * s.n, k = Math.min(1, dt * 18);
      for (let i = 0; i < N; i++) s.ang[i] += (s.rc[i] * 1.5707963 - s.ang[i]) * k;
      if (s.won) { s.won += dt; if (s.won > 0.45) c.win({ moves: s.moves }); }
    },
    cell(c, x, y) { const s = c.s, G = s.G; if (!G) return -1; const cx = Math.floor((x - G.ox) / G.cs), cy = Math.floor((y - G.oy) / G.cs); return cx >= 0 && cy >= 0 && cx < s.n && cy < s.n ? cy * s.n + cx : -1; },
    down(c, x, y, e) { const s = c.s, i = CI.cell(c, x, y); if (i < 0) return; s.kb = false; s.cx = i % s.n; s.cy = (i / s.n) | 0; CI.rotate(c, i, e.button === 2 ? -1 : 1); },
    key(c, code, down) {
      const s = c.s; if (!down) return;
      const mv = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[code];
      if (mv) { s.kb = true; s.cx = clamp(s.cx + mv[0], 0, s.n - 1); s.cy = clamp(s.cy + mv[1], 0, s.n - 1); return; }
      if (code === 'Space' || code === 'Enter') { s.kb = true; CI.rotate(c, s.cy * s.n + s.cx, 1); } else if (code === 'KeyR' || code === 'Backspace') { s.kb = true; CI.rotate(c, s.cy * s.n + s.cx, -1); }
    },
    solve(c) { const s = c.s; for (let i = 0; i < s.rc.length; i++) s.rc[i] = Math.round(s.rc[i] / 4) * 4; CI.update(c); },
    result(c) { return { moves: c.s.moves }; },
    draw(c, g, w, h) {
      const s = c.s, n = s.n, P = s.P, cs = Math.floor(Math.min(w, h) * 0.94 / n), ox = Math.round((w - cs * n) / 2), oy = Math.round((h - cs * n) / 2);
      s.G = { cs, ox, oy };
      g.fillStyle = COL.bg; g.fillRect(0, 0, w, h);
      g.lineCap = 'round';
      for (let i = 0; i < n * n; i++) {
        const x = ox + (i % n) * cs, y = oy + ((i / n) | 0) * cs, lit = s.lit[i], m = P.sol[i], half = cs / 2;
        g.fillStyle = lit ? '#0f1f1b' : '#12161b'; rr(g, x + 2, y + 2, cs - 4, cs - 4, Math.max(3, cs * 0.1)); g.fill();
        g.save(); g.translate(x + half, y + half); g.rotate(s.ang[i]);
        g.beginPath(); for (let d = 0; d < 4; d++) if ((m >> d) & 1) { g.moveTo(0, 0); g.lineTo(DX[d] * half, DY[d] * half); }
        g.lineWidth = cs * 0.2; g.strokeStyle = lit ? '#1f5a4e' : '#2a3239'; g.stroke();
        if (lit) { g.lineWidth = cs * 0.075; g.strokeStyle = COL.acc; g.shadowColor = COL.acc; g.shadowBlur = 8; g.stroke(); g.shadowBlur = 0; }
        g.fillStyle = lit ? COL.acc : '#3a444c'; g.beginPath(); g.arc(0, 0, cs * 0.11, 0, 6.2832); g.fill();
        g.restore();
      }
      const rs = cs * 0.26;
      { const x = ox + (P.src % n) * cs + cs / 2, y = oy + ((P.src / n) | 0) * cs + cs / 2; g.fillStyle = COL.gold; g.shadowColor = COL.gold; g.shadowBlur = 12; g.beginPath(); g.arc(x, y, rs, 0, 6.2832); g.fill(); g.shadowBlur = 0; g.fillStyle = '#2a2006'; bolt(g, x, y, rs); }
      for (const t of P.targets) {
        const x = ox + (t % n) * cs + cs / 2, y = oy + ((t / n) | 0) * cs + cs / 2, lit = s.lit[t];
        g.fillStyle = lit ? COL.ok : '#1a1f24'; if (lit) { g.shadowColor = COL.ok; g.shadowBlur = 14; } g.beginPath(); g.arc(x, y, rs, 0, 6.2832); g.fill(); g.shadowBlur = 0;
        g.lineWidth = 2.5; g.strokeStyle = lit ? '#dfffe4' : '#6a747c'; g.beginPath(); g.arc(x, y, rs * 0.55, 0, 6.2832); g.stroke();
        g.fillStyle = lit ? '#dfffe4' : '#6a747c'; g.beginPath(); g.arc(x, y, rs * 0.2, 0, 6.2832); g.fill();
      }
      if (s.kb) { g.strokeStyle = COL.gold; g.lineWidth = 2; rr(g, ox + s.cx * cs + 1, oy + s.cy * cs + 1, cs - 2, cs - 2, 6); g.stroke(); }
    },
  });

  // ---- flow: colour pairs on a grid. Generated from a random Hamiltonian path (snake + backbite moves) cut into k segments, so the
  // puzzle always has a solution that fills every cell; any non-crossing joining of all pairs wins.
  MG.gen.flow = (n, k) => {
    const N = n * n;
    for (let attempt = 0; attempt < 300; attempt++) {
      const path = []; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) path.push(y * n + (y & 1 ? n - 1 - x : x));
      for (let it = 0; it < N * 40; it++) {
        if (R() < 0.5) path.reverse();
        const e = path[N - 1], d = ri(4), xx = e % n + DX[d], yy = ((e / n) | 0) + DY[d];
        if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        const nb = yy * n + xx; if (nb === path[N - 2]) continue;
        for (let a = path.indexOf(nb) + 1, b = N - 1; a < b; a++, b--) { const t = path[a]; path[a] = path[b]; path[b] = t; }
      }
      for (let cut = 0; cut < 30; cut++) {
        const len = new Array(k).fill(3); for (let r = N - 3 * k; r > 0; r--) len[ri(k)]++;
        const segs = []; let p = 0, ok = true;
        for (let q = 0; q < k && ok; q++) {
          const sg = path.slice(p, p + len[q]), a = sg[0], b = sg[sg.length - 1]; p += len[q];
          if (Math.abs(a % n - b % n) + Math.abs(((a / n) | 0) - ((b / n) | 0)) < 2) ok = false; else segs.push(sg);
        }
        if (ok) return { n, k, sol: segs, ends: segs.map((sg) => [sg[0], sg[sg.length - 1]]) };
      }
    }
    return null;
  };
  const adj = (a, b, n) => Math.abs(a % n - b % n) + Math.abs(((a / n) | 0) - ((b / n) | 0)) === 1;
  // true when every pair is joined by its own path of adjacent cells and no cell is used twice
  MG.gen.flowCheck = (P, paths) => {
    const used = new Set();
    return P.ends.every(([a, b], ci) => {
      const p = paths[ci]; if (!p || p.length < 2) return false;
      if (!((p[0] === a && p[p.length - 1] === b) || (p[0] === b && p[p.length - 1] === a))) return false;
      for (let i = 0; i < p.length; i++) { if (used.has(p[i]) || (i && !adj(p[i - 1], p[i], P.n))) return false; used.add(p[i]); }
      return true;
    });
  };
  const FCOL = ['#ff5a5a', '#4a8cff', '#3ecf6e', '#f5d142', '#ff9a3c', '#3fd4e0', '#d65ad6', '#f2f2f2', '#b07a4a'];
  const FL = KINDS.flow = new Minigame({
    label: 'Wiring', title: 'Bridge the wires', winText: 'Wired up',
    sub: 'Join each pair of matching terminals. Wires can\u2019t cross.',
    hint: '<kbd>Drag</kbd> from a terminal \u00b7 drag back to undo \u00b7 <kbd>Arrows</kbd> + <kbd>Space</kbd> \u00b7 <kbd>Esc</kbd> give up',
    hintTouch: 'Drag from a terminal to its twin \u00b7 drag back to undo',
    init(c) {
      const s = c.s, d = c.diff, o = c.opts;
      s.n = clamp((o.size | 0) || 5 + Math.round(d * 2), 4, 9);
      s.k = clamp((o.pairs | 0) || s.n - 1 + (d > 0.6 ? 1 : 0), 2, FCOL.length);
      s.P = MG.gen.flow(s.n, s.k) || MG.gen.flow(s.n, s.k - 1); s.k = s.P.k;
      const N = s.n * s.n; s.endAt = new Int8Array(N).fill(-1);
      s.P.ends.forEach(([a, b], ci) => { s.endAt[a] = ci; s.endAt[b] = ci; });
      s.paths = s.P.ends.map(() => []); s.own = new Int8Array(N).fill(-1);
      s.act = -1; s.cx = s.P.ends[0][0] % s.n; s.cy = (s.P.ends[0][0] / s.n) | 0; s.kb = false; s.moves = 0; s.won = 0; s.done = 0; s.filled = 0; s.G = null;
      FL.update(c, true);
    },
    complete(s, ci) { const p = s.paths[ci]; return p.length > 1 && p[p.length - 1] !== p[0] && s.endAt[p[p.length - 1]] === ci; },
    update(c, quiet) {
      const s = c.s, N = s.n * s.n; s.own.fill(-1);
      s.paths.forEach((p, ci) => { for (const v of p) s.own[v] = ci; });
      let done = 0, f = 0; for (let ci = 0; ci < s.k; ci++) if (FL.complete(s, ci)) done++;
      for (let i = 0; i < N; i++) if (s.own[i] >= 0) f++;
      if (!quiet && done > s.done) snd('ui_check', 0.55);
      s.done = done; s.filled = f / N;
      c.status('Pairs joined ' + done + '/' + s.k + ' \u00b7 grid ' + Math.round(s.filled * 100) + '% filled');
      if (done === s.k && !s.won) { s.won = 0.001; s.act = -1; }
    },
    start(c, i) {
      const s = c.s; let ci = s.endAt[i];
      if (ci >= 0) { s.paths[ci] = [i]; } else if (s.own[i] >= 0) { ci = s.own[i]; const p = s.paths[ci]; p.length = p.indexOf(i) + 1; } else { s.act = -1; return; }
      s.act = ci; snd('ui_click', 0.3, 1.2); FL.update(c, true);
    },
    step(c, j) {
      const s = c.s, ci = s.act, p = s.paths[ci], n = s.n, last = p[p.length - 1];
      if (j === last) return;
      if (p.length >= 2 && j === p[p.length - 2]) { p.pop(); FL.update(c); return; }
      if (!adj(last, j, n) || FL.complete(s, ci)) return;
      if (s.endAt[j] >= 0 && (s.endAt[j] !== ci || j === p[0])) return;
      const back = p.indexOf(j); if (back >= 0) { p.length = back + 1; FL.update(c); return; }
      const o = s.own[j]; if (o >= 0 && o !== ci) { const q = s.paths[o]; q.length = q.indexOf(j); }
      p.push(j); s.moves++;
      if (s.endAt[j] === ci) snd('ui_ding', 0.5); else snd('ui_click', 0.16, 1.5);
      FL.update(c);
    },
    toward(c, i) {
      const s = c.s, n = s.n;
      for (let guard = 0; guard < 2 * n && s.act >= 0; guard++) {
        const p = s.paths[s.act], last = p[p.length - 1]; if (last === i) break;
        const lx = last % n, ly = (last / n) | 0, dx = i % n - lx, dy = ((i / n) | 0) - ly;
        const nx = Math.abs(dx) >= Math.abs(dy) ? lx + Math.sign(dx) : lx, ny = Math.abs(dx) >= Math.abs(dy) ? ly : ly + Math.sign(dy);
        FL.step(c, ny * n + nx);
        const q = s.paths[s.act]; if (!q || q[q.length - 1] === last) break;
      }
    },
    cell(c, x, y) { const s = c.s, G = s.G; if (!G) return -1; const cx = Math.floor((x - G.ox) / G.cs), cy = Math.floor((y - G.oy) / G.cs); return cx >= 0 && cy >= 0 && cx < s.n && cy < s.n ? cy * s.n + cx : -1; },
    down(c, x, y) { const s = c.s, i = FL.cell(c, x, y); if (i < 0 || s.won) return; s.kb = false; FL.start(c, i); },
    move(c, x, y) { const s = c.s; if (s.act < 0 || s.won) return; const i = FL.cell(c, x, y); if (i >= 0) FL.toward(c, i); },
    up(c) { c.s.act = -1; },
    key(c, code, down) {
      const s = c.s; if (!down || s.won) return;
      const mv = { ArrowLeft: [-1, 0], KeyA: [-1, 0], ArrowRight: [1, 0], KeyD: [1, 0], ArrowUp: [0, -1], KeyW: [0, -1], ArrowDown: [0, 1], KeyS: [0, 1] }[code];
      if (mv) {
        s.kb = true; const nx = clamp(s.cx + mv[0], 0, s.n - 1), ny = clamp(s.cy + mv[1], 0, s.n - 1);
        if (s.act >= 0) { FL.step(c, ny * s.n + nx); const p = s.paths[s.act] || []; const e = p[p.length - 1]; if (e != null) { s.cx = e % s.n; s.cy = (e / s.n) | 0; } if (s.act >= 0 && FL.complete(s, s.act)) s.act = -1; }
        else { s.cx = nx; s.cy = ny; }
        return;
      }
      if (code === 'Space' || code === 'Enter') { s.kb = true; if (s.act >= 0) s.act = -1; else FL.start(c, s.cy * s.n + s.cx); }
    },
    frame(c, dt) { const s = c.s; if (s.won) { s.won += dt; if (s.won > 0.4) c.win({ moves: s.moves, filled: s.filled }); } },
    solve(c) { const s = c.s; s.paths = s.P.sol.map((p) => p.slice()); s.act = -1; FL.update(c); },
    result(c) { return { moves: c.s.moves, filled: +c.s.filled.toFixed(3) }; },
    draw(c, g, w, h) {
      const s = c.s, n = s.n, cs = Math.floor(Math.min(w, h) * 0.94 / n), ox = Math.round((w - cs * n) / 2), oy = Math.round((h - cs * n) / 2), half = cs / 2;
      s.G = { cs, ox, oy };
      g.fillStyle = COL.bg; g.fillRect(0, 0, w, h);
      for (let i = 0; i < n * n; i++) {
        const x = ox + (i % n) * cs, y = oy + ((i / n) | 0) * cs;
        g.fillStyle = '#11151b'; g.fillRect(x + 1, y + 1, cs - 2, cs - 2);
        if (s.own[i] >= 0) { g.globalAlpha = 0.2; g.fillStyle = FCOL[s.own[i]]; g.fillRect(x + 1, y + 1, cs - 2, cs - 2); g.globalAlpha = 1; }
      }
      g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = cs * 0.32;
      s.paths.forEach((p, ci) => {
        if (p.length < 2) return;
        g.strokeStyle = FCOL[ci]; g.beginPath();
        p.forEach((v, k) => { const x = ox + (v % n) * cs + half, y = oy + ((v / n) | 0) * cs + half; if (k) g.lineTo(x, y); else g.moveTo(x, y); });
        g.stroke();
      });
      s.P.ends.forEach(([a, b], ci) => {
        const done = FL.complete(s, ci);
        for (const v of [a, b]) {
          const x = ox + (v % n) * cs + half, y = oy + ((v / n) | 0) * cs + half;
          g.fillStyle = FCOL[ci]; g.beginPath(); g.arc(x, y, cs * 0.36, 0, 6.2832); g.fill();
          if (done) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, cs * 0.42, 0, 6.2832); g.stroke(); }
          else if (ci === s.act) { g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, cs * 0.42 + Math.sin(c.t * 8) * 2, 0, 6.2832); g.stroke(); }
        }
      });
      if (s.kb) { g.strokeStyle = COL.gold; g.lineWidth = 2; rr(g, ox + s.cx * cs + 1, oy + s.cy * cs + 1, cs - 2, cs - 2, 4); g.stroke(); }
    },
  });

  // ---- signal: tune frequency + phase (+ amplitude) of your trace onto the target; the lock fills while the RMS error stays in
  // tolerance and drains outside it. From diff 0.5 amplitude counts and the target phase creeps, so the lock has to be held.
  const SG = KINDS.signal = new Minigame({
    label: 'Signal', title: 'Match the carrier', winText: 'Signal locked',
    sub: 'Tune your trace onto the intercepted waveform and hold it there until the lock fills.',
    hint: '<kbd>\u2190</kbd><kbd>\u2192</kbd> frequency \u00b7 <kbd>\u2191</kbd><kbd>\u2193</kbd> phase \u00b7 <kbd>Q</kbd><kbd>E</kbd> amplitude \u00b7 or drag the sliders \u00b7 <kbd>Esc</kbd> give up',
    hintTouch: 'Drag the sliders until the two traces line up, then hold them there',
    init(c) {
      const s = c.s, d = c.diff, o = c.opts;
      s.amp = o.amp != null ? !!o.amp : d >= 0.5;
      s.tf = 1.3 + R() * 3; s.tp = R() * 6.2832; s.ta = s.amp ? 0.45 + R() * 0.45 : 0.8;
      s.f = clamp(s.tf + (R() < 0.5 ? -1 : 1) * (0.9 + R() * 1.2), 0.6, 5.8); s.p = R() * 6.2832;
      s.a = s.amp ? clamp(s.ta + (R() < 0.5 ? -1 : 1) * (0.25 + R() * 0.2), 0.2, 1) : 0.8;
      s.tol = o.tol || 0.2 - 0.08 * d; s.hold = o.hold || 1.5 + d; s.drift = 0.06 * d;
      s.lock = 0; s.err = 1; s.inT = false; s.acc = 0; s.tick = 0; s.stT = 0; s.won = 0;
      const row = (k, label, mn, mx) => '<span>' + label + '</span><input type="range" min="' + mn + '" max="' + mx + '" step="0.001" data-p="' + k + '"><em data-v="' + k + '"></em>';
      c.ctl.innerHTML = '<div class="mg-sls">' + row('f', 'Frequency', 0.5, 6) + row('p', 'Phase', 0, 6.2832) + (s.amp ? row('a', 'Amplitude', 0.15, 1) : '') + '</div>';
      s.ui = {};
      for (const k of ['f', 'p', 'a']) {
        const inp = c.ctl.querySelector('[data-p=' + k + ']'); if (!inp) continue;
        s.ui[k] = inp; s.ui[k + 'v'] = c.ctl.querySelector('[data-v=' + k + ']');
        inp.addEventListener('input', () => { s[k] = +inp.value; SG.sync(c, true); });
      }
      SG.sync(c);
    },
    sync(c, fromSlider) {
      const s = c.s, U = s.ui;
      if (!fromSlider) { U.f.value = s.f; U.p.value = s.p; if (U.a) U.a.value = s.a; }
      U.fv.textContent = (s.f * 2.4).toFixed(2) + ' kHz'; U.pv.textContent = Math.round(s.p * 57.2958) + '\u00b0'; if (U.av) U.av.textContent = Math.round(s.a * 100) + '%';
    },
    frame(c, dt) {
      const s = c.s, H = c.held, sp = 0.15 + s.acc;
      let adj = false;
      if (H.has('ArrowLeft') || H.has('KeyA')) { s.f -= dt * 0.9 * sp; adj = true; }
      if (H.has('ArrowRight') || H.has('KeyD')) { s.f += dt * 0.9 * sp; adj = true; }
      if (H.has('ArrowUp') || H.has('KeyW')) { s.p += dt * 2.2 * sp; adj = true; }
      if (H.has('ArrowDown') || H.has('KeyS')) { s.p -= dt * 2.2 * sp; adj = true; }
      if (s.amp && H.has('KeyQ')) { s.a -= dt * 0.5 * sp; adj = true; }
      if (s.amp && H.has('KeyE')) { s.a += dt * 0.5 * sp; adj = true; }
      s.acc = adj ? Math.min(1.2, s.acc + dt * 0.9) : 0;
      if (adj) { s.f = clamp(s.f, 0.5, 6); s.p = (s.p % 6.2832 + 6.2832) % 6.2832; s.a = clamp(s.a, 0.15, 1); SG.sync(c); }
      s.tp = (s.tp + s.drift * dt) % 6.2832;
      let e2 = 0;
      for (let i = 0; i < 48; i++) { const x = i / 47, yt = s.ta * Math.sin(6.2832 * s.tf * x + s.tp), yp = s.a * Math.sin(6.2832 * s.f * x + s.p); e2 += (yp - yt) * (yp - yt); }
      s.err = Math.sqrt(e2 / 48) / s.ta;
      const inT = s.err < s.tol;
      if (inT && !s.inT) snd('ui_check', 0.35);
      s.inT = inT;
      s.lock = clamp(s.lock + (inT ? dt / s.hold : -dt * 0.5), 0, 1);
      if (inT) { s.tick -= dt; if (s.tick <= 0) { snd('ui_click', 0.3, 0.8 + s.lock * 0.8); s.tick = 0.22; } }
      s.stT -= dt; if (s.stT <= 0) { s.stT = 0.12; c.status((inT ? 'In tolerance \u2014 hold it' : 'Sync ' + Math.round(clamp(1 - s.err / (s.tol * 6), 0, 1) * 100) + '%') + ' \u00b7 lock ' + Math.round(s.lock * 100) + '%'); }
      if (s.lock >= 1 && !s.won) { s.won = 1; c.win({}, 'Signal locked'); }
    },
    solve(c) { const s = c.s; s.f = s.tf; s.p = s.tp; s.a = s.ta; SG.sync(c); },
    draw(c, g, w, h) {
      const s = c.s, pad = 14, mw = 30, sw = w - pad * 2 - mw - 8, cy = h * 0.46, amp = h * 0.34;
      let gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#04140d'); gr.addColorStop(1, '#020806');
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
      g.strokeStyle = 'rgba(90,255,170,.07)'; g.lineWidth = 1; g.beginPath();
      for (let i = 0; i <= 10; i++) { const x = pad + sw * i / 10; g.moveTo(x, pad); g.lineTo(x, h - 30); }
      for (let i = 0; i <= 8; i++) { const y = pad + (h - 30 - pad) * i / 8; g.moveTo(pad, y); g.lineTo(pad + sw, y); }
      g.stroke();
      g.strokeStyle = 'rgba(90,255,170,.16)'; g.beginPath(); g.moveTo(pad, cy); g.lineTo(pad + sw, cy); g.stroke();
      const sx = pad + ((c.t * 0.35) % 1) * sw; gr = g.createLinearGradient(sx - 40, 0, sx, 0); gr.addColorStop(0, 'rgba(90,255,170,0)'); gr.addColorStop(1, 'rgba(90,255,170,.10)');
      g.fillStyle = gr; g.fillRect(sx - 40, pad, 40, h - 30 - pad);
      const jit = 0.015 + 0.03 * c.diff;
      g.lineJoin = 'round'; g.lineWidth = 3.2; g.strokeStyle = 'rgba(245,197,66,.85)'; g.shadowColor = COL.gold; g.shadowBlur = 8; g.beginPath();
      for (let i = 0; i <= 140; i++) { const x = i / 140, y = s.ta * Math.sin(6.2832 * s.tf * x + s.tp) + jit * Math.sin(x * 97 + c.t * 13) * Math.sin(x * 23 - c.t * 3); const px = pad + x * sw, py = cy - amp * y; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke();
      g.lineWidth = 2; g.strokeStyle = s.inT ? COL.ok : COL.acc; g.shadowColor = g.strokeStyle; g.shadowBlur = 6; g.beginPath();
      for (let i = 0; i <= 140; i++) { const x = i / 140, y = s.a * Math.sin(6.2832 * s.f * x + s.p); const px = pad + x * sw, py = cy - amp * y; if (i) g.lineTo(px, py); else g.moveTo(px, py); }
      g.stroke(); g.shadowBlur = 0;
      const sync = clamp(1 - s.err / (s.tol * 6), 0, 1), mx = w - pad - mw, my0 = pad, mh = h - 30 - pad;
      g.fillStyle = '#0b1a13'; rr(g, mx, my0, mw, mh, 6); g.fill();
      g.fillStyle = s.inT ? COL.ok : sync > 0.5 ? COL.gold : '#c0563c'; rr(g, mx + 5, my0 + mh * (1 - sync), mw - 10, mh * sync, 4); g.fill();
      g.fillStyle = '#fff'; g.fillRect(mx + 2, my0 + mh / 6 - 1, mw - 4, 2);
      g.fillStyle = 'rgba(90,255,170,.55)'; g.font = '600 10px ui-monospace,Consolas,monospace'; g.textAlign = 'left';
      g.fillText('CH-7 INTERCEPT  \u25cf TARGET', pad + 4, pad + 12); g.fillStyle = s.inT ? COL.ok : COL.acc; g.fillText('\u25cf YOU', pad + 190, pad + 12);
      g.fillStyle = '#0b1a13'; rr(g, pad, h - 22, sw, 10, 5); g.fill();
      if (s.lock > 0.004) { g.fillStyle = s.inT ? COL.ok : COL.gold; rr(g, pad, h - 22, sw * s.lock, 10, 5); g.fill(); }
      g.fillStyle = COL.dim; g.textAlign = 'right'; g.fillText('LOCK ' + Math.round(s.lock * 100) + '%', w - pad, h - 13);
    },
  });

  // ---- drill: hold to feed the drill; heat follows pressure squared against cooling, so steady full pressure overheats and the bit
  // stalls (overheat = forced cool-down). Progress is fastest with the heat in the green band. Jams stop the bit until the shown
  // arrow sequence is entered (a wrong key restarts it and adds heat).
  const ARW = ['\u2191', '\u2192', '\u2193', '\u2190'];
  const DR = KINDS.drill = new Minigame({
    label: 'Drill', title: 'Drill the lock', winText: 'Drilled through',
    sub: 'Feed the drill in bursts and keep the bit\u2019s heat in the green band. Clear jams when the bit binds.',
    hint: 'Hold <kbd>Space</kbd> or the mouse to drill \u00b7 release to cool \u00b7 jam: press the <kbd>arrows</kbd> shown \u00b7 <kbd>Esc</kbd> give up',
    hintTouch: 'Hold DRILL in bursts \u2014 keep the heat in the green band \u00b7 tap the arrows to clear a jam',
    init(c) {
      const s = c.s, d = c.diff, o = c.opts;
      s.work = o.work > 0 ? +o.work : Math.min(22 + 14 * d, c.time ? c.time * 0.7 : 99);   // ≈ seconds of steady, in-band drilling
      const half = 0.17 - 0.06 * d; s.lo = 0.58 - half; s.hi = 0.58 + half;
      s.P = 0; s.H = 0.15; s.prog = 0; s.hot = 0; s.overheats = 0; s.jams = 0; s.jam = null; s.nextJam = 6 + R() * 4;
      s.spin = 0; s.hard = 1; s.hardT = 0; s.mouse = false; s.won = 0; s.stT = 0;
      s.spk = new Float32Array(48 * 5); s.smk = new Float32Array(16 * 4); s.spi = 0; s.smi = 0; s.spT = 0; s.smT = 0;
      c.ctl.innerHTML = '<button class="mg-b pri mg-drillb" data-hold="Space" style="min-width:180px">HOLD TO DRILL</button><div class="mg-arr">' +
        [3, 0, 2, 1].map((k) => '<button class="mg-b" data-key="' + ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'][k] + '">' + ARW[k] + '</button>').join('') + '</div>';
    },
    frame(c, dt) {
      const s = c.s, d = c.diff, A = AF.audio;
      const want = (c.held.has('Space') || s.mouse) && !s.hot && !s.jam;
      s.P = clamp(s.P + (want ? 1.5 : -2.4) * dt, 0, 1);
      s.hardT -= dt; if (s.hardT <= 0) { s.hard = 0.8 + R() * 0.5; s.hardT = 2 + R() * 3; }
      s.H = clamp(s.H + (s.P * s.P * (0.55 + 0.25 * d) * s.hard - (s.H - 0.05) * 0.32 * (s.hot ? 2.2 : 1)) * dt, 0, 1.15);
      if (!s.hot && s.H >= 1) { s.hot = 2.4 + d; s.overheats++; s.P = 0; snd('ui_alert', 0.7); c.flash('bad'); c.msg('Overheated! Let the bit cool\u2026', 'bad', s.hot); }
      if (s.hot) { s.hot -= dt; if (s.hot <= 0) { s.hot = 0; c.msg('Bit cooled \u2014 back to it.', 'info', 1.5); } }
      if (!s.jam && !s.hot && s.P > 0.05) {
        const k = s.H >= s.lo && s.H <= s.hi ? 1 : s.H < s.lo ? 0.35 : 0.7;
        s.prog = Math.min(1, s.prog + s.P * k * 1.9 * dt / s.work);
        s.nextJam -= dt * s.P;
        if (s.nextJam <= 0 && s.prog < 0.97) {
          const n = 3 + Math.round(d * 2); s.jam = { seq: [], i: 0, shake: 0 }; for (let i = 0; i < n; i++) s.jam.seq.push(ri(4));
          s.jams++; s.nextJam = 9 - 3 * d + R() * 4; s.P = 0; snd('click_metal', 0.9, 0.6); snd('ui_deny', 0.5);
          c.msg('Jammed! Rock the bit free with the arrows shown.', 'bad', 3); c.ctl.classList.add('jam');
        }
      }
      if (s.jam) s.jam.shake = Math.max(0, s.jam.shake - dt);
      s.spin += s.P * dt * 40;
      if (A && A.hold) A.hold('mg-drill', 'drill_loop', s.jam || s.hot ? 0 : 0.15 + 0.85 * s.P, 0.7 + 0.6 * s.P);
      // sparks + smoke (fixed pools)
      s.spT -= dt;
      if (s.P > 0.25 && !s.jam && !s.hot && s.spT <= 0) {
        s.spT = 0.035 / s.P;
        const o = s.spi * 5; s.spi = (s.spi + 1) % 48; const an = -Math.PI * (0.15 + R() * 0.7), v = 80 + R() * 160 * s.P;
        s.spk[o] = 0; s.spk[o + 1] = 0; s.spk[o + 2] = Math.cos(an) * v * (R() < 0.5 ? -1 : 1); s.spk[o + 3] = Math.sin(an) * v; s.spk[o + 4] = 0.35 + R() * 0.3;
      }
      for (let i = 0; i < 48; i++) { const o = i * 5; if (s.spk[o + 4] <= 0) continue; s.spk[o + 4] -= dt; s.spk[o] += s.spk[o + 2] * dt; s.spk[o + 1] += s.spk[o + 3] * dt; s.spk[o + 3] += 420 * dt; }
      s.smT -= dt;
      if ((s.hot || s.H > 0.9) && s.smT <= 0) { s.smT = 0.09; const o = s.smi * 4; s.smi = (s.smi + 1) % 16; s.smk[o] = (R() - 0.5) * 10; s.smk[o + 1] = 0; s.smk[o + 2] = 1.4; s.smk[o + 3] = 6 + R() * 6; }
      for (let i = 0; i < 16; i++) { const o = i * 4; if (s.smk[o + 2] <= 0) continue; s.smk[o + 2] -= dt; s.smk[o + 1] -= 40 * dt; s.smk[o] += 10 * dt; s.smk[o + 3] += 18 * dt; }
      s.stT -= dt; if (s.stT <= 0) { s.stT = 0.2; c.status('Depth ' + Math.round(s.prog * 100) + '% \u00b7 overheats ' + s.overheats + ' \u00b7 jams ' + s.jams); }
      if (s.prog >= 1 && !s.won) { s.won = 1; s.P = 0; snd('vault', 0.8); c.win({ overheats: s.overheats, jams: s.jams }, 'Drilled through'); }
    },
    key(c, code, down) {
      const s = c.s; if (!down || !s.jam) return;
      const dir = { ArrowUp: 0, KeyW: 0, ArrowRight: 1, KeyD: 1, ArrowDown: 2, KeyS: 2, ArrowLeft: 3, KeyA: 3 }[code]; if (dir == null) return;
      if (dir === s.jam.seq[s.jam.i]) {
        s.jam.i++; snd('click_metal', 0.6, 1 + s.jam.i * 0.1);
        if (s.jam.i >= s.jam.seq.length) { s.jam = null; c.ctl.classList.remove('jam'); snd('latch', 0.7); c.msg('Bit freed.', 'ok', 1.2); }
      } else { s.jam.i = 0; s.jam.shake = 0.3; s.H = Math.min(0.99, s.H + 0.08); snd('ui_deny', 0.6); }
    },
    down(c) { c.s.mouse = true; }, up(c) { c.s.mouse = false; },
    exit() { if (AF.audio && AF.audio.release) AF.audio.release('mg-drill'); },
    result(c) { return { overheats: c.s.overheats, jams: c.s.jams, progress: +c.s.prog.toFixed(3) }; },
    draw(c, g, w, h) {
      const s = c.s, mw = w * 0.76, cx = mw * 0.4, cy = h * 0.5, R0 = Math.min(mw * 0.3, h * 0.36);
      g.fillStyle = '#0a0c0f'; g.fillRect(0, 0, w, h);
      let gr = g.createLinearGradient(0, cy - R0 * 1.2, 0, cy + R0 * 1.2); gr.addColorStop(0, '#454c54'); gr.addColorStop(1, '#22272c');
      g.fillStyle = gr; rr(g, cx - R0 * 1.2, cy - R0 * 1.2, R0 * 2.4, R0 * 2.4, 14); g.fill();
      g.fillStyle = '#5c646c'; for (const [ax, ay] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { g.beginPath(); g.arc(cx + ax * R0 * 1.02, cy + ay * R0 * 1.02, 4, 0, 6.2832); g.fill(); }
      g.lineWidth = 9; g.strokeStyle = '#15191d'; g.beginPath(); g.arc(cx, cy, R0 * 0.78, 0, 6.2832); g.stroke();
      if (s.prog > 0) { g.strokeStyle = COL.gold; g.beginPath(); g.arc(cx, cy, R0 * 0.78, -1.5708, -1.5708 + s.prog * 6.2832); g.stroke(); }
      gr = g.createRadialGradient(cx - R0 * 0.15, cy - R0 * 0.15, 2, cx, cy, R0 * 0.55); gr.addColorStop(0, '#c3cad0'); gr.addColorStop(1, '#4d555c');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R0 * 0.55, 0, 6.2832); g.fill();
      const heat = clamp(s.H, 0, 1);
      gr = g.createRadialGradient(cx, cy, 1, cx, cy, R0 * 0.5); gr.addColorStop(0, 'rgba(255,' + Math.round(200 - 140 * heat) + ',60,' + (0.15 + 0.75 * heat * heat).toFixed(3) + ')'); gr.addColorStop(1, 'rgba(255,80,20,0)');
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R0 * 0.5, 0, 6.2832); g.fill();
      // drill: bit into the lock from the right, body behind it, fed in by pressure
      const sh = s.jam && s.jam.shake > 0 ? Math.sin(c.t * 90) * 3 : 0, feed = s.P * 6, bx0 = cx + 2 - feed + sh, bl = R0 * 0.95, bh = Math.max(8, R0 * 0.1);
      g.fillStyle = '#8c949b'; g.fillRect(bx0, cy - bh / 2, bl, bh);
      g.strokeStyle = '#4a5157'; g.lineWidth = 2; g.beginPath();
      for (let k = 0; k < 12; k++) { const x = bx0 + ((k * bl / 10 + s.spin * 3) % bl); g.moveTo(x, cy - bh / 2); g.lineTo(Math.min(bx0 + bl, x + bh * 0.8), cy + bh / 2); }
      g.stroke();
      const dx0 = bx0 + bl;
      g.fillStyle = '#2b2f33'; g.fillRect(dx0, cy - bh, R0 * 0.25, bh * 2);
      g.fillStyle = '#e0b02c'; rr(g, dx0 + R0 * 0.25, cy - R0 * 0.32, R0 * 1.1, R0 * 0.64, 10); g.fill();
      g.fillStyle = '#1c1f22'; rr(g, dx0 + R0 * 0.6, cy + R0 * 0.2, R0 * 0.32, R0 * 0.8, 8); g.fill();
      g.fillStyle = '#1c1f22'; g.fillRect(dx0 + R0 * 0.35, cy - R0 * 0.2, R0 * 0.8, 4);
      g.fillStyle = '#ffd27a';
      for (let i = 0; i < 48; i++) { const o = i * 5; if (s.spk[o + 4] <= 0) continue; g.globalAlpha = clamp(s.spk[o + 4] * 2.5, 0, 1); g.fillRect(cx + s.spk[o], cy + s.spk[o + 1], 2.5, 2.5); }
      for (let i = 0; i < 16; i++) { const o = i * 4; if (s.smk[o + 2] <= 0) continue; g.globalAlpha = clamp(s.smk[o + 2] * 0.35, 0, 0.5); g.fillStyle = '#9aa0a6'; g.beginPath(); g.arc(cx + s.smk[o], cy + s.smk[o + 1], s.smk[o + 3], 0, 6.2832); g.fill(); }
      g.globalAlpha = 1;
      g.fillStyle = COL.dim; g.font = '700 11px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('DEPTH ' + Math.round(s.prog * 100) + '%', cx, cy + R0 * 1.2 + 18 > h - 4 ? h - 6 : cy + R0 * 1.2 + 18);
      // heat gauge
      const gw = Math.max(26, (w - mw) * 0.34), gx = mw + (w - mw - gw) / 2, gy0 = h * 0.12, gy1 = h * 0.86, gh = gy1 - gy0;
      gr = g.createLinearGradient(0, gy1, 0, gy0); gr.addColorStop(0, '#2c6cc0'); gr.addColorStop(0.55, '#e8c040'); gr.addColorStop(1, '#e03c2c');
      g.fillStyle = '#12161b'; rr(g, gx - 6, gy0 - 6, gw + 12, gh + 12, 8); g.fill();
      g.globalAlpha = 0.55; g.fillStyle = gr; rr(g, gx, gy0, gw, gh, 4); g.fill(); g.globalAlpha = 1;
      g.fillStyle = 'rgba(125,220,138,.35)'; g.fillRect(gx - 4, gy1 - s.hi * gh, gw + 8, (s.hi - s.lo) * gh);
      g.strokeStyle = COL.ok; g.lineWidth = 2; g.strokeRect(gx - 4, gy1 - s.hi * gh, gw + 8, (s.hi - s.lo) * gh);
      const ny = gy1 - heat * gh; g.fillStyle = '#fff'; g.beginPath(); g.moveTo(gx - 10, ny - 6); g.lineTo(gx - 2, ny); g.lineTo(gx - 10, ny + 6); g.fill(); g.fillRect(gx - 2, ny - 1, gw + 4, 2);
      g.fillStyle = s.hot ? (c.t % 0.5 < 0.25 ? COL.bad : '#7a2a2a') : COL.dim; g.font = '700 10px system-ui,sans-serif';
      g.fillText(s.hot ? 'OVERHEAT' : 'HEAT', gx + gw / 2, gy0 - 12);
      if (s.jam) {
        const n = s.jam.seq.length, bs = Math.min(46, mw * 0.8 / n), tw = n * (bs + 8) - 8, jx = cx - tw / 2 + sh * 2, jy = cy - bs / 2;
        g.fillStyle = 'rgba(6,8,12,.86)'; rr(g, jx - 16, jy - 34, tw + 32, bs + 50, 10); g.fill();
        g.fillStyle = COL.bad; g.font = '700 12px system-ui,sans-serif'; g.fillText('JAMMED', cx, jy - 14);
        for (let i = 0; i < n; i++) {
          const x = jx + i * (bs + 8), done = i < s.jam.i, now = i === s.jam.i;
          g.fillStyle = done ? '#1d4a2a' : now ? 'rgba(245,197,66,' + (0.35 + 0.25 * Math.sin(c.t * 10)).toFixed(3) + ')' : '#1a1f24'; rr(g, x, jy, bs, bs, 6); g.fill();
          g.fillStyle = done ? COL.ok : now ? '#fff' : COL.dim; g.font = '700 ' + Math.round(bs * 0.55) + 'px system-ui,sans-serif'; g.fillText(ARW[s.jam.seq[i]], x + bs / 2, jy + bs * 0.7);
        }
      }
    },
  });

  // ---- deal: punto banco at the high-roller table. Each coup the guest bets; the player deals it straight or stacks it (a timed card
  // swap: hit the green window while the pit boss looks away). Stays open until the caller closes it, opts.hands coups are dealt, or
  // opts.need bad hands landed; a fumbled swap raises the pit boss's suspicion (full = caught, unless opts.noCatch).
  const st2 = document.createElement('style');
  st2.textContent = `
  #ui #mg .dl{position:absolute;inset:0;display:flex;flex-direction:column;gap:6px;padding:10px 12px;box-sizing:border-box;background:radial-gradient(ellipse at 50% 30%,#7a1c2a,#3a0a12 82%);box-shadow:inset 0 0 0 3px #6a4020,inset 0 0 0 5px rgba(216,176,74,.35)}
  #ui #mg .dl-top{display:flex;justify-content:space-between;align-items:center;gap:10px;font-size:13px;color:#f6e6c4}
  #ui #mg .dl-top b{color:#fff} #ui #mg .dl-top .amt{color:#ffd24a;font-weight:700}
  #ui #mg .dl-boss{display:flex;align-items:center;gap:7px;font-size:10px;color:rgba(255,236,190,.75);letter-spacing:.8px;text-transform:uppercase;white-space:nowrap}
  #ui #mg .dl-eye{width:22px;height:13px;border-radius:50%;background:#fbf8f0;position:relative;overflow:hidden;transition:height .12s}
  #ui #mg .dl-eye:after{content:'';position:absolute;left:50%;top:50%;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:#1a1a1e} #ui #mg .dl-eye.away{height:2px}
  #ui #mg .dl-sus{width:64px;height:6px;border-radius:3px;background:rgba(0,0,0,.4);overflow:hidden} #ui #mg .dl-sus i{display:block;height:100%;width:0;background:#ff6b6b;transition:width .3s}
  #ui #mg .dl-felt{flex:1;min-height:0;display:flex;justify-content:center;align-items:center;gap:clamp(10px,4vw,44px)}
  #ui #mg .dl-hand{text-align:center;padding:5px 10px;border-radius:12px;border:2px solid rgba(255,236,190,.3);min-width:118px;transition:box-shadow .2s,border-color .2s}
  #ui #mg .dl-hand.bet{border-color:#ffd24a;background:rgba(255,236,160,.07)} #ui #mg .dl-hand.win{box-shadow:0 0 0 2px #7ddc8a,0 0 20px rgba(125,220,138,.35)}
  #ui #mg .dl-hand small{display:block;font:700 10px var(--font);letter-spacing:1.4px;color:rgba(255,236,190,.85)}
  #ui #mg .dl-cards{display:flex;gap:5px;justify-content:center;min-height:60px;margin:5px 0 3px}
  #ui #mg .dl-cd{width:40px;height:58px;border-radius:6px;background:#fbf8f0;color:#1a1a1e;display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 15px Georgia,serif;box-shadow:0 2px 6px rgba(0,0,0,.45);animation:mgCd .2s ease-out}
  #ui #mg .dl-cd span{font-size:18px;line-height:1} #ui #mg .dl-cd.r{color:#c8202a}
  @keyframes mgCd{from{opacity:0;transform:translateY(-14px) rotate(-6deg)}to{opacity:1;transform:none}}
  #ui #mg .dl-tot{font:700 18px Georgia,serif;color:#fff;min-height:22px}
  #ui #mg .dl-swap{visibility:hidden;text-align:center} #ui #mg .dl-swap.on{visibility:visible}
  #ui #mg .dl-bar{position:relative;height:16px;border-radius:8px;background:rgba(0,0,0,.45);margin:0 auto;width:min(420px,92%);box-shadow:inset 0 0 0 1px rgba(255,236,190,.25)}
  #ui #mg .dl-win{position:absolute;top:0;bottom:0;background:rgba(125,220,138,.6);border-radius:8px}
  #ui #mg .dl-ndl{position:absolute;top:-5px;bottom:-5px;width:4px;margin-left:-2px;border-radius:2px;background:#fff;box-shadow:0 0 8px #fff}
  #ui #mg .dl-swap small{display:block;font-size:11px;color:rgba(255,236,190,.85);margin-top:4px}
  #ui #mg .dl-log{text-align:center;font-size:12px;color:#f6e6c4;min-height:16px}
  #ui #mg .kp{position:absolute;inset:0;display:flex;gap:18px;align-items:center;justify-content:center;padding:10px;box-sizing:border-box;background:radial-gradient(ellipse at 40% 40%,#1c2228,#0a0d10)}
  #ui #mg .kp-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;padding:12px;border-radius:12px;background:linear-gradient(#3a4148,#262b30);box-shadow:inset 0 1px 0 rgba(255,255,255,.12),0 8px 24px rgba(0,0,0,.5)}
  #ui #mg .kp-k{width:clamp(42px,9vh,60px);height:clamp(36px,7.6vh,50px);border-radius:7px;background:linear-gradient(#eceff1,#b9bfc4);color:#1a1d20;font:700 20px var(--font);position:relative;box-shadow:0 3px 0 #6c7378;overflow:hidden;touch-action:manipulation}
  #ui #mg .kp-k:active{transform:translateY(2px);box-shadow:0 1px 0 #6c7378}
  #ui #mg .kp-k.sm{color:#5e554a} #ui #mg .kp-k.sm:before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse at 40% 58%,rgba(105,84,52,.55),rgba(105,84,52,0) 58%),radial-gradient(ellipse at 64% 38%,rgba(120,98,66,.42),rgba(0,0,0,0) 46%)}
  #ui #mg .kp-k.fr:after{content:'';position:absolute;left:18%;top:14%;width:52%;height:46%;border-radius:50%;background:radial-gradient(ellipse at 45% 40%,rgba(255,255,255,.9),rgba(255,255,255,0) 62%)}
  #ui #mg .kp-k.fn{background:linear-gradient(#5a636b,#3c4349);color:#fff;font-size:14px;box-shadow:0 3px 0 #22272b} #ui #mg .kp-k.go{background:linear-gradient(#5fbf74,#3c8f50);color:#fff;box-shadow:0 3px 0 #23562f}
  #ui #mg .kp-side{display:flex;flex-direction:column;gap:8px;min-width:150px;max-width:230px}
  #ui #mg .kp-scr{display:flex;gap:6px;padding:8px 10px;border-radius:8px;background:#0b1a13;box-shadow:inset 0 0 0 1px rgba(90,255,170,.2);align-self:flex-start}
  #ui #mg .kp-scr b{width:26px;height:32px;display:grid;place-items:center;font:700 22px ui-monospace,Consolas,monospace;color:#7dffb4;border-bottom:2px solid rgba(125,255,180,.35)}
  #ui #mg .kp-h{display:flex;flex-direction:column;gap:4px;min-height:84px}
  #ui #mg .kp-row{display:flex;gap:4px;align-items:center} #ui #mg .kp-row i{width:22px;height:24px;border-radius:4px;display:grid;place-items:center;font:700 13px ui-monospace,Consolas,monospace;font-style:normal;color:#fff;background:#2a3036}
  #ui #mg .kp-row i.g{background:#2f8a4a} #ui #mg .kp-row i.y{background:#a8841c} #ui #mg .kp-row em{font-style:normal;font-size:11px;color:var(--dim);margin-left:6px;white-space:nowrap}
  #ui #mg .kp-led{display:flex;gap:6px;align-items:center;font-size:10px;letter-spacing:1px;color:var(--dim)} #ui #mg .kp-led i{width:9px;height:9px;border-radius:50%;background:#4a2424} #ui #mg .kp-led i.on{background:#ff4b4b;box-shadow:0 0 6px #ff4b4b} #ui #mg .kp-led i.ok{background:#45e07a;box-shadow:0 0 6px #45e07a}
  #ui #mg .kp-note{font-size:11px;color:var(--dim);line-height:1.4} #ui #mg .kp-note b{color:var(--gold)}
  @media (orientation:landscape) and (max-height:560px){#ui #mg .kp{gap:10px} #ui #mg .kp-pad{gap:5px;padding:8px} #ui #mg .kp-h{min-height:0} #ui #mg .dl-cd{width:34px;height:50px;font-size:13px} #ui #mg .dl-cards{min-height:50px}}`;
  document.head.appendChild(st2);
  const SUITS = ['\u2660', '\u2665', '\u2666', '\u2663'], RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const bval = (cd) => (cd % 13 >= 9 ? 0 : (cd % 13) + 1);
  const btot = (hd) => hd.reduce((a, cd) => a + bval(cd), 0) % 10;
  // one punto banco coup from an eight-deck shoe (draws treated as independent) with the full third-card tableau
  MG.gen.baccarat = () => {
    const p = [ri(52), ri(52)], b = [ri(52), ri(52)];
    let pt = btot(p), bt = btot(b), p3 = -1;
    if (pt < 8 && bt < 8) {
      if (pt <= 5) { const cd = ri(52); p.push(cd); p3 = bval(cd); pt = btot(p); }
      const draw = p3 < 0 ? bt <= 5 : bt <= 2 || (bt === 3 && p3 !== 8) || (bt === 4 && p3 >= 2 && p3 <= 7) || (bt === 5 && p3 >= 4 && p3 <= 7) || (bt === 6 && p3 >= 6 && p3 <= 7);
      if (draw) { b.push(ri(52)); bt = btot(b); }
    }
    return { p, b, pt, bt, win: pt > bt ? 'P' : bt > pt ? 'B' : 'T' };
  };
  const rigged = (side) => { let best = null; for (let i = 0; i < 3000; i++) { const h = MG.gen.baccarat(); if (h.win !== 'T' && h.win !== side && Math.abs(h.pt - h.bt) >= 4) return h; if (h.win !== 'T' && h.win !== side) best = h; } return best || MG.gen.baccarat(); };
  const cardHTML = (cd) => { const su = (cd / 13 | 0) % 4; return '<div class="dl-cd' + (su === 1 || su === 2 ? ' r' : '') + '">' + RANKS[cd % 13] + '<span>' + SUITS[su] + '</span></div>'; };
  const SIDE = { P: 'PLAYER', B: 'BANKER' };
  const DL = KINDS.deal = new Minigame({
    label: 'Baccarat', title: 'Deal the table', winText: 'Table dealt', dom: true,
    sub: 'Deal each coup to the guest \u2014 straight, or stack a rotten hand with a quick card swap.',
    hint: '<kbd>1</kbd> deal clean \u00b7 <kbd>2</kbd> deal a bad hand \u00b7 <kbd>Space</kbd> swap in the green window \u00b7 <kbd>Esc</kbd> leave the table',
    hintTouch: 'Deal clean, or deal a bad hand and tap SWAP while the needle is in the green',
    init(c) {
      const s = c.s, o = c.opts;
      s.guest = o.guest || 'Prescott'; s.hands = 0; s.bad = 0; s.sloppy = 0; s.susp = 0; s.caught = false; s.phase = 'choose';
      c.dom.innerHTML = '<div class="dl"><div class="dl-top"><div class="dl-bet"></div><div class="dl-boss">Pit boss <span class="dl-eye"></span><span class="dl-sus"><i></i></span></div></div>' +
        '<div class="dl-felt"><div class="dl-hand" data-s="P"><small>PLAYER</small><div class="dl-cards"></div><div class="dl-tot"></div></div><div class="dl-hand" data-s="B"><small>BANKER</small><div class="dl-cards"></div><div class="dl-tot"></div></div></div>' +
        '<div class="dl-swap"><div class="dl-bar"><div class="dl-win"></div><div class="dl-ndl"></div></div><small>Swap the cards while the pit boss looks away \u2014 hit the green</small></div><div class="dl-log"></div></div>';
      const q = (k) => c.dom.querySelector(k);
      s.el = { bet: q('.dl-bet'), eye: q('.dl-eye'), sus: q('.dl-sus i'), hP: q('[data-s=P]'), hB: q('[data-s=B]'), cP: q('[data-s=P] .dl-cards'), cB: q('[data-s=B] .dl-cards'), tP: q('[data-s=P] .dl-tot'), tB: q('[data-s=B] .dl-tot'), swap: q('.dl-swap'), win: q('.dl-win'), ndl: q('.dl-ndl'), log: q('.dl-log') };
      c.ctl.innerHTML = '<button class="mg-b" data-a="clean">Deal clean<kbd>1</kbd></button><button class="mg-b red" data-a="bad">Deal a bad hand<kbd>2</kbd></button><button class="mg-b pri" data-a="swap" style="min-width:150px">SWAP<kbd>Space</kbd></button>';
      s.btn = { clean: c.ctl.querySelector('[data-a=clean]'), bad: c.ctl.querySelector('[data-a=bad]'), swap: c.ctl.querySelector('[data-a=swap]') };
      snd('card_shuffle', 0.7);
      DL.newBet(c);
    },
    info(c) { const s = c.s, h = s.coup; return { hand: s.hands, side: s.side, amount: s.amt, result: h ? h.win : null, player: h ? h.pt : null, banker: h ? h.bt : null, bad: s.bad, sloppy: s.sloppy, suspicion: +s.susp.toFixed(2) }; },
    buttons(c) { const s = c.s, ch = s.phase === 'choose'; s.btn.clean.disabled = !ch; s.btn.bad.disabled = !ch; s.btn.swap.disabled = s.phase !== 'swap'; s.btn.swap.style.display = s.phase === 'swap' ? '' : 'none'; },
    newBet(c) {
      const s = c.s, E = s.el;
      s.side = R() < 0.5 ? 'P' : 'B'; s.amt = (2 + ri(15)) * 5000; s.phase = 'choose'; s.coup = null; s.rig = false;
      E.bet.innerHTML = '<b>' + esc(s.guest) + '</b> bets <span class="amt">$' + s.amt.toLocaleString('en-US') + '</span> on ' + SIDE[s.side];
      E.cP.innerHTML = ''; E.cB.innerHTML = ''; E.tP.textContent = ''; E.tB.textContent = '';
      E.hP.className = 'dl-hand' + (s.side === 'P' ? ' bet' : ''); E.hB.className = 'dl-hand' + (s.side === 'B' ? ' bet' : '');
      E.swap.classList.remove('on'); E.eye.classList.remove('away');
      c.status('Coup ' + (s.hands + 1) + ' \u00b7 bad hands ' + s.bad + (s.sloppy ? ' \u00b7 fumbles ' + s.sloppy : ''));
      DL.buttons(c);
    },
    act(c, a) {
      const s = c.s, d = c.diff;
      if (a === 'clean' && s.phase === 'choose') { c.call('onAction', 'clean', DL.info(c)); DL.deal(c, MG.gen.baccarat()); }
      else if (a === 'bad' && s.phase === 'choose') {
        s.phase = 'swap'; const wd = 0.2 - 0.1 * d;
        s.sw = { pos: R() < 0.5 ? 0 : 1, dir: 0, t: 0, c0: 0.22 + R() * 0.56, wd, v: 0.85 + 0.8 * d };
        s.sw.dir = s.sw.pos ? -1 : 1;
        s.el.win.style.left = ((s.sw.c0 - wd / 2) * 100).toFixed(2) + '%'; s.el.win.style.width = (wd * 100).toFixed(2) + '%';
        s.el.swap.classList.add('on'); snd('card_shuffle', 0.5); DL.buttons(c);
      } else if (a === 'swap' && s.phase === 'swap') {
        const sw = s.sw;
        if (Math.abs(sw.pos - sw.c0) <= sw.wd / 2) {
          s.bad++; s.rig = true; snd('card_place', 0.7); snd('cloth', 0.4); c.flash('ok'); c.msg('Clean swap \u2014 the shoe is stacked.', 'ok', 2);
          DL.deal(c, rigged(s.side));
        } else DL.sloppy(c, 'Fumbled the swap \u2014 a card flashed. The pit boss is watching you.');
      }
    },
    sloppy(c, why) {
      const s = c.s;
      s.sloppy++; s.susp = Math.min(1, s.susp + 0.25 + 0.15 * c.diff); s.el.sus.style.width = (s.susp * 100).toFixed(0) + '%';
      snd('ui_deny', 0.7); snd('card_place', 0.5, 0.8); c.flash('bad'); c.msg(why, 'bad', 3);
      c.call('onSloppy', DL.info(c)); c.call('onAction', 'sloppy', DL.info(c));
      if (s.susp >= 1 && !c.opts.noCatch) { s.caught = true; c.fail({ caught: true }, 'Spotted', 'The pit boss saw the swap'); return; }
      DL.deal(c, MG.gen.baccarat());
    },
    deal(c, coup) {
      const s = c.s; s.coup = coup; s.phase = 'deal'; s.di = 0; s.dt = 0.25; s.el.swap.classList.remove('on'); s.el.eye.classList.remove('away');
      s.seq = []; const n = Math.max(coup.p.length, coup.b.length);
      for (let i = 0; i < n; i++) { if (coup.p[i] != null) s.seq.push(['P', coup.p[i]]); if (coup.b[i] != null) s.seq.push(['B', coup.b[i]]); }
      DL.buttons(c);
    },
    frame(c, dt) {
      const s = c.s;
      if (s.phase === 'swap') {
        const sw = s.sw; sw.t += dt; sw.pos += sw.dir * sw.v * dt;
        if (sw.pos > 1) { sw.pos = 2 - sw.pos; sw.dir = -1; } else if (sw.pos < 0) { sw.pos = -sw.pos; sw.dir = 1; }
        s.el.ndl.style.left = (sw.pos * 100).toFixed(2) + '%';
        s.el.eye.classList.toggle('away', Math.abs(sw.pos - sw.c0) <= sw.wd / 2 + 0.03);
        if (sw.t > 2 / sw.v + 0.25) DL.sloppy(c, 'Too slow \u2014 you fumbled the cards in plain view.');
      } else if (s.phase === 'deal') {
        s.dt -= dt;
        if (s.dt <= 0 && s.di < s.seq.length) {
          const [sd, cd] = s.seq[s.di++]; (sd === 'P' ? s.el.cP : s.el.cB).insertAdjacentHTML('beforeend', cardHTML(cd)); snd('card_deal', 0.7); s.dt = 0.38;
        } else if (s.dt <= 0) {
          const h = s.coup, E = s.el; s.hands++;
          E.tP.textContent = h.pt; E.tB.textContent = h.bt;
          if (h.win !== 'T') (h.win === 'P' ? E.hP : E.hB).classList.add('win');
          const won = h.win === s.side, tie = h.win === 'T';
          E.log.textContent = (tie ? 'Tie ' + h.pt + '\u2013' + h.bt + '. Bets push.' : SIDE[h.win] + ' wins ' + Math.max(h.pt, h.bt) + '\u2013' + Math.min(h.pt, h.bt) + '. ') + (tie ? '' : s.guest + (won ? ' collects $' : ' loses $') + s.amt.toLocaleString('en-US') + '.');
          snd(won ? 'chips' : 'card_place', 0.6);
          if (s.rig) { c.call('onBad', DL.info(c)); c.call('onAction', 'bad', DL.info(c)); }
          c.call('onHand', DL.info(c));
          c.status('Coup ' + s.hands + ' dealt \u00b7 bad hands ' + s.bad + (s.sloppy ? ' \u00b7 fumbles ' + s.sloppy : ''));
          s.phase = 'result'; s.rt = 1.7; DL.buttons(c);
        }
      } else if (s.phase === 'result') {
        s.rt -= dt;
        if (s.rt <= 0) {
          const o = c.opts;
          if (o.need && s.bad >= o.need) c.win({}, 'Hand dealt', s.guest + ' is fuming');
          else if (o.hands && s.hands >= o.hands) { if (s.bad >= (o.need || 1)) c.win({}, 'Table dealt'); else c.fail({}, 'Shift over'); }
          else DL.newBet(c);
        }
      }
    },
    key(c, code, down) {
      if (!down) return;
      if (code === 'Digit1' || code === 'Numpad1' || code === 'KeyC') DL.act(c, 'clean');
      else if (code === 'Digit2' || code === 'Numpad2' || code === 'KeyB') DL.act(c, 'bad');
      else if (code === 'Space' || code === 'Enter') DL.act(c, 'swap');
    },
    result(c) { const s = c.s; return { bad: s.bad, sloppy: s.sloppy, hands: s.hands, caught: s.caught }; },
  });

  // ---- stamp: forge an aircrew certificate in three scored steps — slide the photo into its frame, press the embossing seal while
  // the swinging needle is in the zone, trace the signature (drag; keyboard: hold Space and steer). Pass = mean score >= opts.pass.
  const STEPS = ['Photo', 'Seal', 'Signature'];
  const ST = KINDS.stamp = new Minigame({
    label: 'Forgery', title: 'Forge the papers', winText: 'Papers pass',
    sub: 'Three steps: line the photo up, emboss the seal, sign along the guide.',
    hint: 'Photo: <kbd>drag</kbd> or <kbd>arrows</kbd>, <kbd>Enter</kbd> \u00b7 Seal: <kbd>Space</kbd> in the zone \u00b7 Sign: <kbd>drag</kbd> along the line, or hold <kbd>Space</kbd> + <kbd>\u2191</kbd><kbd>\u2193</kbd>',
    hintTouch: 'Drag the photo into its frame \u00b7 tap PRESS in the zone \u00b7 trace the signature with a finger',
    init(c) {
      const s = c.s, d = c.diff;
      s.step = 0; s.sc = [0, 0, 0]; s.wait = 0; s.serial = 'PS-' + (100000 + ri(899999));
      s.tx = 0.06; s.ty = 0.22; s.px = s.tx + 0.28 + R() * 0.25; s.py = s.ty + (R() - 0.5) * 0.24; s.acc = 0.05 - 0.02 * d; s.drag = null; s.placed = false;
      s.nd = 0; s.ph = R() * 6.28; s.spd = 2.2 + 2.2 * d; s.zc = 0.22 + R() * 0.56; s.zw = 0.14 - 0.06 * d; s.seal = -1; s.press = 0;
      const NP = 220, k = 5 + Math.round(d * 3), ph1 = R() * 6.28, ph2 = R() * 6.28, r = 0.04 + R() * 0.012;
      s.NP = NP; s.gd = new Float32Array(NP * 2);
      for (let i = 0; i < NP; i++) {
        const t = i / (NP - 1), a = 6.2832 * k * t;
        s.gd[i * 2] = 0.1 + 0.76 * t - r * Math.sin(a) * 1.4;
        s.gd[i * 2 + 1] = 0.5 - 0.2 * Math.cos(a) * (0.6 + 0.4 * Math.sin(6.2832 * 1.3 * t + ph1)) + 0.07 * Math.sin(6.2832 * 0.7 * t + ph2);
      }
      s.gi = 0; s.gf = 0; s.pen = false; s.kpen = false; s.off = 0; s.dv = 0; s.err = 0; s.cnt = 0; s.tr = new Float32Array(3000); s.tn = 0; s.offT = 0;
      ST.ctl(c);
    },
    ctl(c) {
      const s = c.s;
      c.ctl.innerHTML = s.step === 0 ? '<button class="mg-b pri" data-a="place">Place photo<kbd>Enter</kbd></button>' : s.step === 1 ? '<button class="mg-b pri" data-a="press" style="min-width:180px">PRESS SEAL<kbd>Space</kbd></button>' : '';
      c.status('Step ' + (s.step + 1) + '/3 \u00b7 ' + STEPS[s.step] + (s.step ? ' \u00b7 so far ' + Math.round(s.sc.slice(0, s.step).reduce((a, b) => a + b, 0) / s.step * 100) + '%' : ''));
    },
    next(c, score, text) {
      const s = c.s; s.sc[s.step] = clamp(score, 0, 1); c.msg(text + ' \u2014 ' + Math.round(s.sc[s.step] * 100) + '%', s.sc[s.step] >= 0.5 ? 'ok' : 'bad', 2);
      s.wait = 0.75; s.waitStep = s.step + 1;
    },
    G(c) { const w = c.w, h = c.h, dw = Math.min(w * 0.94, h * 0.94 * 1.58), dh = dw / 1.58; return { w, h, dw, dh, dx: (w - dw) / 2, dy: (h - dh) / 2 }; },
    perr(c) { const s = c.s, G = ST.G(c); return Math.hypot((s.px - s.tx) * G.dw, (s.py - s.ty) * G.dh) / G.dw; },
    place(c) {
      const s = c.s; if (s.step !== 0 || s.placed) return;
      const e = ST.perr(c);
      if (e > s.acc) { c.msg('Not lined up yet \u2014 fit the photo to the dashed frame.', 'bad', 1.8); snd('ui_deny', 0.4); return; }
      s.placed = true; s.px = s.tx; s.py = s.ty; snd('card_place', 0.8); ST.next(c, 1 - 0.7 * e / s.acc, 'Photo set');
    },
    pressSeal(c) {
      const s = c.s; if (s.step !== 1 || s.seal >= 0) return;
      const dist = Math.abs(s.nd - s.zc), inZ = dist <= s.zw / 2;
      s.seal = inZ ? 1 - 0.6 * dist / (s.zw / 2) : 0.15; s.press = 0.5;
      snd('latch', 1, 0.7); snd('click_metal', 0.6, 0.6); if (!inZ) c.flash('bad');
      ST.next(c, s.seal, inZ ? 'Crisp emboss' : 'Smudged seal');
    },
    signDone(c) { const s = c.s; s.pen = false; s.kpen = false; ST.next(c, 1.15 - s.err / Math.max(1, s.cnt), 'Signed'); },
    pad(c) { return { x: 14, y: c.h * 0.12, w: c.w - 28, h: c.h * 0.74 }; },
    penAt(c, x, y) {
      const s = c.s, P = ST.pad(c), Rr = P.h * (0.085 - 0.03 * c.diff);
      if (s.tn < 1498) { s.tr[s.tn * 2] = x; s.tr[s.tn * 2 + 1] = y; s.tn++; }
      for (let k = 0; k < 12 && s.gi < s.NP - 1; k++) { if (Math.hypot(P.x + s.gd[(s.gi + 1) * 2] * P.w - x, P.y + s.gd[(s.gi + 1) * 2 + 1] * P.h - y) < Rr * 1.25) s.gi++; else break; }
      let dm = 1e9; for (let i = Math.max(0, s.gi - 6); i <= Math.min(s.NP - 1, s.gi + 6); i++) dm = Math.min(dm, Math.hypot(P.x + s.gd[i * 2] * P.w - x, P.y + s.gd[i * 2 + 1] * P.h - y));
      s.err += Math.min(1, dm / Rr); s.cnt++;
      if (dm > Rr * 2.5 && s.offT <= 0) { c.msg('Off the line \u2014 come back to the guide.', 'bad', 1.2); s.offT = 1.2; }
      if (s.gi >= s.NP - 3) ST.signDone(c);
    },
    frame(c, dt) {
      const s = c.s, H = c.held;
      s.offT -= dt;
      if (s.wait > 0) { s.wait -= dt; if (s.wait <= 0) { s.step = s.waitStep; if (s.step > 2) { ST.finish(c); return; } ST.ctl(c); } return; }
      if (s.press > 0) s.press -= dt;
      if (s.step === 0 && !s.placed) {
        const v = dt * 0.18; let mv = false;
        if (H.has('ArrowLeft') || H.has('KeyA')) { s.px -= v; mv = true; } if (H.has('ArrowRight') || H.has('KeyD')) { s.px += v; mv = true; }
        if (H.has('ArrowUp') || H.has('KeyW')) { s.py -= v * 1.58; mv = true; } if (H.has('ArrowDown') || H.has('KeyS')) { s.py += v * 1.58; mv = true; }
        if (mv) { s.px = clamp(s.px, 0, 0.78); s.py = clamp(s.py, 0, 0.4); }
      } else if (s.step === 1 && s.seal < 0) { s.ph += dt * s.spd; s.nd = 0.5 - 0.5 * Math.cos(s.ph); }
      else if (s.step === 2 && s.kpen && c.w) {
        const P = ST.pad(c), Rr = P.h * (0.085 - 0.03 * c.diff);
        s.dv = (s.dv + (R() - 0.5) * dt * 7) * 0.985; s.off += s.dv * dt;
        if (H.has('ArrowUp') || H.has('KeyW')) s.off -= 1.4 * dt; if (H.has('ArrowDown') || H.has('KeyS')) s.off += 1.4 * dt;
        s.off = clamp(s.off, -2, 2);
        s.gf = Math.min(s.NP - 1, s.gf + dt * s.NP * 0.11); const i = Math.floor(s.gf); s.gi = i;
        const i2 = Math.min(s.NP - 1, i + 1), tx = s.gd[i2 * 2] - s.gd[i * 2], ty = s.gd[i2 * 2 + 1] - s.gd[i * 2 + 1], tl = Math.hypot(tx * P.w, ty * P.h) || 1;
        const x = P.x + s.gd[i * 2] * P.w - (ty * P.h / tl) * s.off * Rr, y = P.y + s.gd[i * 2 + 1] * P.h + (tx * P.w / tl) * s.off * Rr;
        if (s.tn < 1498) { s.tr[s.tn * 2] = x; s.tr[s.tn * 2 + 1] = y; s.tn++; }
        s.err += Math.min(1, Math.abs(s.off)); s.cnt++;
        if (s.gi >= s.NP - 3) ST.signDone(c);
      }
    },
    finish(c) {
      const s = c.s, score = (s.sc[0] + s.sc[1] + s.sc[2]) / 3, pass = c.opts.pass || 0.6 + 0.12 * c.diff, ex = { score: +score.toFixed(3), steps: s.sc.map((v) => +v.toFixed(3)) };
      if (score >= pass) c.win(ex, 'Papers pass', 'Forgery ' + Math.round(score * 100) + '%'); else c.fail(ex, 'Rejected', 'Forgery ' + Math.round(score * 100) + '% \u2014 needs ' + Math.round(pass * 100) + '%');
    },
    act(c, a) { if (a === 'place') ST.place(c); else if (a === 'press') ST.pressSeal(c); },
    key(c, code, down) {
      const s = c.s;
      if (s.step === 0 && down && (code === 'Enter' || code === 'Space')) ST.place(c);
      else if (s.step === 1 && down && (code === 'Space' || code === 'Enter')) ST.pressSeal(c);
      else if (s.step === 2 && code === 'Space' && !s.pen && s.wait <= 0) { s.kpen = down; if (down) { s.gf = s.gi; s.off = 0; s.dv = 0; } }
    },
    down(c, x, y) {
      const s = c.s; if (s.wait > 0) return;
      if (s.step === 0 && !s.placed) {
        const G = ST.G(c), X = G.dx + s.px * G.dw, Y = G.dy + s.py * G.dh;
        if (x >= X - 10 && x <= X + 0.22 * G.dw + 10 && y >= Y - 10 && y <= Y + 0.58 * G.dh + 10) { s.drag = { ox: x - X, oy: y - Y }; snd('cloth', 0.35); }
      } else if (s.step === 1) ST.pressSeal(c);
      else if (s.step === 2 && !s.kpen) {
        const P = ST.pad(c), Rr = P.h * (0.085 - 0.03 * c.diff), gx = P.x + s.gd[s.gi * 2] * P.w, gy = P.y + s.gd[s.gi * 2 + 1] * P.h;
        if (Math.hypot(x - gx, y - gy) < Rr * 2.4) { s.pen = true; ST.penAt(c, x, y); } else c.msg(s.gi ? 'Pick up where you left off (the green dot).' : 'Start at the green dot.', 'info', 1.6);
      }
    },
    move(c, x, y) {
      const s = c.s;
      if (s.drag) { const G = ST.G(c); s.px = clamp((x - s.drag.ox - G.dx) / G.dw, 0, 0.78); s.py = clamp((y - s.drag.oy - G.dy) / G.dh, 0, 0.42); }
      else if (s.pen) ST.penAt(c, x, y);
    },
    up(c) { const s = c.s; if (s.drag) { s.drag = null; if (ST.perr(c) <= s.acc) ST.place(c); } s.pen = false; },
    result(c) { const s = c.s, sc = (s.sc[0] + s.sc[1] + s.sc[2]) / 3; return { score: +sc.toFixed(3), steps: s.sc.map((v) => +v.toFixed(3)) }; },
    draw(c, g, w, h) {
      const s = c.s, G = ST.G(c), { dw, dh, dx, dy } = G, U = (x) => dx + x * dw, V = (y) => dy + y * dh;
      g.fillStyle = '#1a1510'; g.fillRect(0, 0, w, h);
      g.fillStyle = 'rgba(0,0,0,.45)'; rr(g, dx + 5, dy + 7, dw, dh, 10); g.fill();
      let gr = g.createLinearGradient(dx, dy, dx + dw, dy + dh); gr.addColorStop(0, '#f4ecd4'); gr.addColorStop(1, '#e2d3ac');
      g.fillStyle = gr; rr(g, dx, dy, dw, dh, 10); g.fill();
      g.save(); rr(g, dx, dy, dw, dh, 10); g.clip();
      g.strokeStyle = 'rgba(70,120,160,.16)'; g.lineWidth = 1;
      for (let k = 0; k < 7; k++) { g.beginPath(); for (let i = 0; i <= 60; i++) { const x = i / 60, y = 0.55 + 0.05 * k + 0.06 * Math.sin(x * 14 + k * 0.9) * Math.cos(x * 5 - k); if (i) g.lineTo(U(x), V(y)); else g.moveTo(U(x), V(y)); } g.stroke(); }
      g.fillStyle = '#1d3350'; g.fillRect(dx, dy, dw, dh * 0.14);
      g.restore();
      const fs = Math.max(8, dw * 0.022);
      g.fillStyle = '#f4e3b0'; g.font = '700 ' + fs + 'px Georgia,serif'; g.textAlign = 'left'; g.fillText('PORT SOLACE \u00b7 AIRCREW CERTIFICATE', U(0.04), V(0.09));
      g.textAlign = 'right'; g.font = '600 ' + (fs * 0.85) + 'px ui-monospace,Consolas,monospace'; g.fillText(s.serial, U(0.96), V(0.09));
      g.textAlign = 'left'; g.fillStyle = '#5a4a32'; g.font = '700 ' + (fs * 0.7) + 'px system-ui,sans-serif';
      const rows = [['NAME', 'J. HARTLEY'], ['RANK', 'FIRST OFFICER'], ['CARRIER', 'SOLACE AIR'], ['VALID TO', '12 / 1939']];
      rows.forEach(([k, v], i) => { const y = 0.26 + i * 0.12; g.fillStyle = '#7a6a50'; g.font = '700 ' + (fs * 0.62) + 'px system-ui,sans-serif'; g.fillText(k, U(0.36), V(y)); g.fillStyle = '#2a2418'; g.font = '600 ' + (fs * 0.95) + 'px Georgia,serif'; g.fillText(v, U(0.36), V(y + 0.06)); g.fillStyle = 'rgba(90,74,50,.3)'; g.fillRect(U(0.36), V(y + 0.075), dw * 0.36, 1); });
      g.fillStyle = 'rgba(90,74,50,.4)'; g.fillRect(U(0.36), V(0.9), dw * 0.34, 1); g.fillStyle = '#7a6a50'; g.font = '700 ' + (fs * 0.6) + 'px system-ui,sans-serif'; g.fillText('SIGNATURE', U(0.36), V(0.95));
      // photo frame + photo
      const pw = 0.22 * dw, ph = 0.58 * dh;
      g.strokeStyle = 'rgba(40,60,90,.65)'; g.lineWidth = 1.5; g.setLineDash([5, 4]); g.strokeRect(U(s.tx), V(s.ty), pw, ph); g.setLineDash([]);
      const X = U(s.px), Y = V(s.py);
      if (s.step === 0 && !s.placed) { g.fillStyle = 'rgba(0,0,0,.3)'; g.fillRect(X + 4, Y + 5, pw, ph); }
      g.fillStyle = '#9fb4c4'; g.fillRect(X, Y, pw, ph);
      g.fillStyle = '#3a4650'; g.beginPath(); g.arc(X + pw / 2, Y + ph * 0.4, pw * 0.2, 0, 6.2832); g.fill();
      g.beginPath(); g.ellipse(X + pw / 2, Y + ph * 1.0, pw * 0.42, ph * 0.32, 0, 3.1416, 6.2832); g.fill();
      g.fillStyle = '#2a3440'; g.fillRect(X + pw * 0.3, Y + ph * 0.18, pw * 0.4, ph * 0.06);
      if (s.step === 0 && !s.placed && ST.perr(c) <= s.acc) { g.strokeStyle = COL.ok; g.lineWidth = 2.5; g.strokeRect(X - 2, Y - 2, pw + 4, ph + 4); }
      // seal
      const sx = U(0.82), sy = V(0.66), sr = dw * 0.085;
      if (s.seal < 0) { g.strokeStyle = 'rgba(90,74,50,.35)'; g.setLineDash([3, 4]); g.beginPath(); g.arc(sx, sy, sr, 0, 6.2832); g.stroke(); g.setLineDash([]); }
      else {
        const q = s.seal, off = (1 - q) * 6;
        for (const [ox, a] of q < 0.5 ? [[off, 0.35], [-off, 0.5]] : [[0, 0.9]]) {
          g.globalAlpha = a; g.strokeStyle = '#8a6a1c'; g.lineWidth = 3; g.beginPath(); g.arc(sx + ox, sy, sr, 0, 6.2832); g.stroke(); g.lineWidth = 1.2; g.beginPath(); g.arc(sx + ox, sy, sr * 0.78, 0, 6.2832); g.stroke();
          g.fillStyle = '#8a6a1c'; g.beginPath(); for (let k = 0; k < 10; k++) { const an = -1.5708 + k * 0.6283, rad = k % 2 ? sr * 0.25 : sr * 0.55; g.lineTo(sx + ox + Math.cos(an) * rad, sy + Math.sin(an) * rad); } g.fill();
        }
        g.globalAlpha = 1;
      }
      // signature on the document once traced
      if (s.tn > 1 && s.step >= 2) {
        const P = ST.pad(c), bx = U(0.36), by = V(0.78), bw = dw * 0.34, bh = dh * 0.12;
        g.strokeStyle = '#1a2a6a'; g.lineWidth = 1.3; g.beginPath();
        for (let i = 0; i < s.tn; i++) { const x = bx + (s.tr[i * 2] - P.x) / P.w * bw, y = by + (s.tr[i * 2 + 1] - P.y) / P.h * bh; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
      }
      if (s.step === 1 && s.wait <= 0) {
        g.fillStyle = 'rgba(4,6,10,.62)'; g.fillRect(0, 0, w, h);
        const gx = w / 2, gy = h * 0.72, r = Math.min(w * 0.34, h * 0.55);
        g.lineWidth = Math.max(14, r * 0.12); g.strokeStyle = '#20262c'; g.beginPath(); g.arc(gx, gy, r, Math.PI, 0); g.stroke();
        g.strokeStyle = COL.ok; g.beginPath(); g.arc(gx, gy, r, Math.PI + (s.zc - s.zw / 2) * Math.PI, Math.PI + (s.zc + s.zw / 2) * Math.PI); g.stroke();
        const an = Math.PI + s.nd * Math.PI; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.moveTo(gx, gy); g.lineTo(gx + Math.cos(an) * r * 1.08, gy + Math.sin(an) * r * 1.08); g.stroke();
        g.fillStyle = COL.gold; g.beginPath(); g.arc(gx, gy, 9, 0, 6.2832); g.fill();
        g.fillStyle = COL.ink; g.font = '700 12px system-ui,sans-serif'; g.textAlign = 'center'; g.fillText('PRESS THE SEAL WHEN THE NEEDLE IS IN THE GREEN', gx, gy + 26 > h - 6 ? h - 8 : gy + 26);
      }
      if (s.step === 2 && s.wait <= 0) {
        const P = ST.pad(c), Rr = P.h * (0.085 - 0.03 * c.diff);
        g.fillStyle = 'rgba(4,6,10,.55)'; g.fillRect(0, 0, w, h);
        g.fillStyle = '#f4ecd4'; rr(g, P.x, P.y, P.w, P.h, 10); g.fill();
        g.lineCap = 'round'; g.lineJoin = 'round';
        g.strokeStyle = 'rgba(40,60,120,.14)'; g.lineWidth = Rr * 2; g.beginPath();
        for (let i = 0; i < s.NP; i++) { const x = P.x + s.gd[i * 2] * P.w, y = P.y + s.gd[i * 2 + 1] * P.h; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
        g.strokeStyle = 'rgba(40,60,120,.45)'; g.lineWidth = 1.5; g.setLineDash([4, 5]); g.stroke(); g.setLineDash([]);
        g.strokeStyle = '#1a2a6a'; g.lineWidth = 2.6; g.beginPath();
        for (let i = 0; i < s.tn; i++) { const x = s.tr[i * 2], y = s.tr[i * 2 + 1]; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke();
        const gx = P.x + s.gd[s.gi * 2] * P.w, gy = P.y + s.gd[s.gi * 2 + 1] * P.h;
        g.fillStyle = COL.ok; g.beginPath(); g.arc(gx, gy, 6 + Math.sin(c.t * 8) * 1.5, 0, 6.2832); g.fill();
        g.fillStyle = '#7a6a50'; g.font = '700 11px system-ui,sans-serif'; g.textAlign = 'left'; g.fillText('SIGN HERE \u2014 ' + Math.round(s.gi / (s.NP - 1) * 100) + '%', P.x + 12, P.y + 18);
      }
    },
  });

  // ---- keypad: the code's four keys are worn; the freshest print marks the last digit; from diff 0.5 one worn key is an old decoy.
  // Mastermind feedback (green right place, amber in the code elsewhere). Always solvable in 3 guesses (checked by minimax below).
  const kfb = (g, code) => {
    const out = ['', '', '', ''], left = [];
    for (let i = 0; i < 4; i++) if (g[i] === code[i]) out[i] = 'g'; else left.push(code[i]);
    for (let i = 0; i < 4; i++) if (!out[i]) { const j = left.indexOf(g[i]); if (j >= 0) { out[i] = 'y'; left.splice(j, 1); } }
    return out;
  };
  MG.gen.keypad = (d) => { const pool = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), code = pool.slice(0, 4); return { code, worn: (d >= 0.5 ? pool.slice(0, 5) : code.slice()).sort((a, b) => a - b), last: code[3] }; };
  // every code consistent with the clues can be found within `tries` guesses whatever the feedback (guesses from the worn digits)
  MG.gen.keypadSolvable = (P, tries) => {
    const W = P.worn, cands = [];
    for (const a of W) for (const b of W) for (const c2 of W) if (a !== b && a !== c2 && b !== c2 && ![a, b, c2].includes(P.last)) cands.push([a, b, c2, P.last]);
    if (!cands.some((x) => x.join('') === P.code.join(''))) return false;
    const G = []; for (const a of W) for (const b of W) for (const c2 of W) for (const e of W) G.push([a, b, c2, e]);
    const solve = (S, k) => {
      if (S.length === 1) return k >= 1; if (k <= 1) return false;
      for (const g of G) {
        const cls = new Map(); for (const x of S) { const f = kfb(g, x).join(); if (!cls.has(f)) cls.set(f, []); cls.get(f).push(x); }
        let ok = true; for (const [f, sub] of cls) { if (f === 'g,g,g,g') continue; if (sub.length === S.length || !solve(sub, k - 1)) { ok = false; break; } }
        if (ok) return true;
      }
      return false;
    };
    return solve(cands, tries);
  };
  const KP = KINDS.keypad = new Minigame({
    label: 'Keypad', title: 'Crack the keypad', winText: 'Access granted', dom: true,
    sub: 'Worn keys give the digits away. Deduce the order before the lockout.',
    hint: '<kbd>0</kbd>\u2013<kbd>9</kbd> enter \u00b7 <kbd>Backspace</kbd> delete \u00b7 <kbd>Enter</kbd> try code \u00b7 green = right place, amber = wrong place \u00b7 <kbd>Esc</kbd> give up',
    hintTouch: 'Tap the digits, then \u21b5 \u00b7 green = right place, amber = in the code elsewhere',
    init(c) {
      const s = c.s, d = c.diff;
      s.P = MG.gen.keypad(d); s.tries = (c.opts.attempts | 0) || 3; s.used = 0; s.entry = []; s.won = 0;
      const sm = new Set(s.P.worn), key = (lab, a, cls) => '<button class="kp-k ' + (cls || '') + '" data-a="' + a + '">' + lab + '</button>';
      let pad = ''; for (const n of [1, 2, 3, 4, 5, 6, 7, 8, 9]) pad += key(n, 'd' + n, (sm.has(n) ? 'sm' : '') + (n === s.P.last ? ' fr' : ''));
      pad += key('C', 'clr', 'fn') + key(0, 'd0', (sm.has(0) ? 'sm' : '') + (s.P.last === 0 ? ' fr' : '')) + key('\u21b5', 'ok', 'go');
      c.dom.innerHTML = '<div class="kp"><div class="kp-pad">' + pad + '</div><div class="kp-side"><div class="kp-scr"><b></b><b></b><b></b><b></b></div>' +
        '<div class="kp-led">TRIES ' + '<i></i>'.repeat(s.tries) + '</div><div class="kp-h"></div><div class="kp-note">Worn keys: <b>' + s.P.worn.join(' \u00b7 ') + '</b>. The freshest print is on the <b>' + s.P.last + '</b> \u2014 pressed last.' +
        (s.P.worn.length > 4 ? ' One smudge is old: only four digits are in the code.' : ' No digit repeats.') + '</div></div></div>';
      s.scr = c.dom.querySelectorAll('.kp-scr b'); s.leds = c.dom.querySelectorAll('.kp-led i'); s.hist = c.dom.querySelector('.kp-h');
      KP.show(c);
    },
    show(c) { const s = c.s; s.scr.forEach((b, i) => { b.textContent = s.entry[i] ?? ''; }); s.leds.forEach((l, i) => { l.className = s.won ? 'ok' : i < s.used ? 'on' : ''; }); c.status('Attempts left ' + (s.tries - s.used) + '/' + s.tries); },
    press(c, a) {
      const s = c.s; if (s.won) return;
      if (a[0] === 'd') { if (s.entry.length < 4) { s.entry.push(+a.slice(1)); snd('ui_click', 0.5, 1.3); } }
      else if (a === 'clr' || a === 'del') { if (a === 'clr') s.entry = []; else s.entry.pop(); snd('ui_click', 0.3, 0.9); }
      else if (a === 'ok') {
        if (s.entry.length < 4) { c.msg('Enter four digits first.', 'info', 1.4); snd('ui_deny', 0.4); return; }
        const f = kfb(s.entry, s.P.code); s.used++;
        s.hist.insertAdjacentHTML('beforeend', '<div class="kp-row">' + s.entry.map((n, i) => '<i class="' + f[i] + '">' + n + '</i>').join('') + '<em>' + f.filter((x) => x === 'g').length + ' placed \u00b7 ' + f.filter((x) => x === 'y').length + ' misplaced</em></div>');
        s.entry = [];
        if (f.every((x) => x === 'g')) { s.won = 1; KP.show(c); snd('latch', 0.9); snd('ui_check', 0.8); c.win({ attempts: s.used }, 'Access granted'); return; }
        if (s.used >= s.tries) { KP.show(c); snd('ui_alert', 0.8); c.fail({ attempts: s.used }, 'Locked out', 'The code was ' + s.P.code.join('')); return; }
        snd('ui_deny', 0.6); c.flash('bad'); c.msg('Wrong code \u2014 ' + (s.tries - s.used) + ' tr' + (s.tries - s.used > 1 ? 'ies' : 'y') + ' left.', 'bad', 2.2);
      }
      KP.show(c);
    },
    act(c, a) { KP.press(c, a); },
    key(c, code, down) {
      if (!down) return;
      const m = /^(Digit|Numpad)(\d)$/.exec(code);
      if (m) KP.press(c, 'd' + m[2]); else if (code === 'Backspace') KP.press(c, 'del'); else if (code === 'Delete' || code === 'KeyC') KP.press(c, 'clr'); else if (code === 'Enter' || code === 'NumpadEnter' || code === 'Space') KP.press(c, 'ok');
    },
    solve(c) { const s = c.s; s.entry = s.P.code.slice(); KP.press(c, 'ok'); },
    result(c) { return { attempts: c.s.used }; },
  });

  // ---------------------------------------------------------------- debug (?mg=kind) + self-tests
  {
    const qk = AF.Q.get('mg');
    if (qk) AF.on('preloaded', () => setTimeout(() => {
      if (UI.state && UI.state.title && UI.start) UI.start();
      setTimeout(() => MG.play(qk, { diff: AF.Q.has('mgd') ? +AF.Q.get('mgd') : 0.5, time: +AF.Q.get('mgt') || 0 }).then((r) => console.log('[mg] ' + qk + ' -> ' + JSON.stringify(r))), 500);
    }, 300));
  }
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  AF.test('minigame: generated circuit / flow / keypad puzzles are solvable', () => {
    let bad = '', n0 = 0;
    for (const d of [0, 0.5, 1]) for (let i = 0; i < 12; i++) {
      const n = 4 + Math.round(d * 2), k = 1 + Math.round(d * 2), P = MG.gen.circuit(n, k);
      if (P.targets.length !== k || !MG.gen.circuitSolved(P, new Int32Array(n * n))) bad += ' circuit' + n;
      const fn = 5 + Math.round(d * 2), F = MG.gen.flow(fn, fn - 1 + (d > 0.6 ? 1 : 0));
      if (!F || !MG.gen.flowCheck(F, F.sol) || F.sol.reduce((a, p) => a + p.length, 0) !== fn * fn) bad += ' flow' + fn;
      n0++;
    }
    for (const d of [0, 0.5, 1]) for (let i = 0; i < 3; i++) if (!MG.gen.keypadSolvable(MG.gen.keypad(d), 3)) bad += ' keypad' + d;
    return { ok: !bad, info: bad || n0 + ' circuit + flow puzzles, 9 keypads' };
  });
  AF.test('minigame: every kind opens as a modal and cancel resolves { ok:false, cancelled:true }', async () => {
    const out = [];
    for (const kind of Object.keys(KINDS)) {
      const p = MG.play(kind, { diff: 0.5 }), open = MG.open && MG.kind === kind && AF.ui.modalOpen();
      await wait(80); MG.cancel(); const r = await p;
      if (!(open && r.ok === false && r.cancelled === true && !MG.open)) out.push(kind + ':' + JSON.stringify(r) + ' open ' + open);
    }
    return { ok: !out.length, info: out.join(' | ') || Object.keys(KINDS).join(', ') };
  });
  AF.test('minigame: circuit / flow / keypad / signal solved through the debug hook resolve ok', async () => {
    const out = [];
    for (const kind of ['circuit', 'flow', 'keypad', 'signal']) {
      const p = MG.play(kind, { diff: 0.5 }); await wait(60);
      const t0 = performance.now(); let r = null;
      while (!r && performance.now() - t0 < 6000) { MG.solve(); r = await Promise.race([p, wait(150).then(() => null)]); }
      if (!r) { MG.cancel(); r = await p; }
      if (!r.ok) out.push(kind + ':' + JSON.stringify(r));
    }
    return { ok: !out.length, info: out.join(' | ') || 'all four solved' };
  });
}
} catch (e) { AF.partError('76-minigame.js', e); }
