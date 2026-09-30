// ================================================================ 71-ui.js
try {
// ===== 71-ui: title + character select, HUD (clock, place, minimap), prompt, toasts, dialogue, speech bubbles, menu, map, help  (OWNER: player) =====
{
  const UI = AF.ui = AF.ui || {};
  const root = document.getElementById('ui');
  const h = (tag, cls, html, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; (parent || root).appendChild(e); return e; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const TOUCH = AF.touch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  if (TOUCH) root.classList.add('touch');

  // ------------------------------------------------------------------ style
  const css = `
  #ui{--bg:rgba(10,20,30,.72);--bg2:rgba(10,20,30,.9);--line:rgba(255,236,190,.16);--ink:#f4ead2;--dim:#b9b2a0;--gold:#f0c870;--r:14px;
    font:14px/1.35 system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;color:var(--ink);-webkit-font-smoothing:antialiased}
  #ui .panel{background:var(--bg);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--line);border-radius:var(--r);box-shadow:0 10px 30px rgba(0,0,0,.35)}
  #ui button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
  #ui .btn{padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.08);border:1px solid var(--line);transition:background .15s,transform .1s}
  #ui .btn:hover{background:rgba(255,255,255,.16)} #ui .btn:active{transform:scale(.97)}
  #ui .btn.primary{background:linear-gradient(180deg,#f6d68a,#d9a445);color:#1b1408;border:0;font-weight:600}
  #ui .deco{font-family:Limelight,'Poiret One',Georgia,serif;letter-spacing:.18em}
  #ui kbd{display:inline-block;min-width:18px;padding:1px 6px;border-radius:6px;background:rgba(255,255,255,.14);font:600 12px system-ui;text-align:center}
  #ui .hide{display:none!important}
  #ui #t-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding:max(24px,4vh) max(28px,5vw) max(20px,env(safe-area-inset-bottom));pointer-events:none;background:none;transition:opacity .6s}
  #ui #t-title:before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(5,10,16,0) 30%,rgba(5,10,16,.5) 100%),linear-gradient(0deg,rgba(5,10,16,.55),rgba(5,10,16,0) 34%),linear-gradient(180deg,rgba(5,10,16,.45),rgba(5,10,16,0) 26%)}
  #ui #t-title .fade{position:absolute;inset:0;background:#04080d;opacity:1;transition:opacity .45s ease;pointer-events:none}
  #ui #t-title.out{opacity:0}
  #ui #t-title .logo{position:absolute;z-index:1;top:max(4vh,18px);left:max(28px,5vw);text-align:left}
  #ui #t-title h1{margin:0;font:400 clamp(26px,4.4vw,52px)/1 Limelight,Georgia,serif;letter-spacing:.24em;color:#ffe6a8;text-shadow:0 2px 0 rgba(60,36,8,.7),0 0 24px rgba(240,190,90,.35)}
  #ui #t-title .sub{margin-top:8px;color:#e9dcc0;font-style:italic;text-shadow:0 1px 3px #000}
  #ui #t-title .modal{pointer-events:auto;width:min(420px,92vw);max-height:100%;padding:16px 18px 18px;display:flex;flex-direction:column;align-items:center;gap:4px;position:relative;z-index:0;overflow:hidden;background:linear-gradient(180deg,rgba(10,18,28,.14),rgba(10,18,28,.14) 58%,rgba(10,18,28,.8) 74%);backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:0 24px 70px rgba(0,0,0,.45);animation:uiIn .35s ease}
  #ui #t-title .q{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);text-align:center}
  #ui #t-title .stage{position:relative;z-index:-1;width:100%;height:min(42vh,340px);min-height:190px;margin:6px 0 4px;border-radius:14px;overflow:hidden;background:none;cursor:grab;touch-action:none}
  #ui #t-title .arr{position:absolute;top:50%;transform:translateY(-50%);width:48px;height:48px;border-radius:50%;background:rgba(10,20,30,.6);border:1px solid var(--line);font-size:28px;line-height:1;display:flex;align-items:center;justify-content:center;color:#ffe6a8;transition:background .15s,transform .1s}
  #ui #t-title .arr:hover{background:rgba(240,200,112,.28)} #ui #t-title .arr:active{transform:translateY(-50%) scale(.94)}
  #ui #t-title .arr.l{left:10px} #ui #t-title .arr.r{right:10px}
  #ui #t-title .cnt{position:absolute;right:12px;top:10px;font-size:11px;color:var(--dim);letter-spacing:.12em}
  #ui #t-title .n{font:400 26px Limelight,Georgia,serif;letter-spacing:.1em;color:#ffe6a8;text-align:center}
  #ui #t-title .tg{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);text-align:center}
  #ui #t-title .d{color:var(--ink);opacity:.85;font-size:14px;text-align:center;min-height:38px;max-width:420px}
  #ui #t-title .dots{display:flex;gap:7px;margin:6px 0 10px}
  #ui #t-title .dots button{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.22);padding:0}
  #ui #t-title .dots button.on{background:var(--gold);transform:scale(1.25)}
  #ui #t-title .go{padding:13px 30px;font-size:16px;display:inline-flex;align-items:center;gap:10px;letter-spacing:.04em}
  #ui #t-title .go .ic{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#1b1408;color:#f6d68a;font-size:11px;padding-left:2px}
  @media (orientation:portrait) and (max-width:760px){#ui #t-title{align-items:center;justify-content:flex-end;padding-top:max(88px,12vh)} #ui #t-title .logo{left:0;right:0;text-align:center} #ui #t-title:before{background:linear-gradient(0deg,rgba(5,10,16,.7),rgba(5,10,16,0) 60%),linear-gradient(180deg,rgba(5,10,16,.5),rgba(5,10,16,0) 25%)}}
  @media (orientation:landscape) and (max-height:560px){
    #ui #t-title{padding:10px max(14px,env(safe-area-inset-right)) 10px max(14px,env(safe-area-inset-left));align-items:flex-end}
    #ui #t-title .logo{top:12px;left:max(18px,env(safe-area-inset-left))} #ui #t-title h1{font-size:22px} #ui #t-title .sub{display:none}
    #ui #t-title .modal{display:grid;grid-template-columns:minmax(150px,44%) 1fr;grid-template-rows:auto auto auto 1fr auto auto;column-gap:14px;row-gap:2px;width:min(640px,72vw);max-height:calc(100vh - 20px);padding:10px 12px;align-items:center}
    #ui #t-title .modal>.stage{grid-column:1;grid-row:1/7;height:calc(100vh - 42px);max-height:320px;min-height:0;margin:0}
    #ui #t-title .modal>:not(.stage){grid-column:2;justify-self:center}
    #ui #t-title .q{grid-row:1} #ui #t-title .n{grid-row:2;font-size:22px} #ui #t-title .tg{grid-row:3} #ui #t-title .d{grid-row:4;font-size:13px;min-height:0} #ui #t-title .dots{grid-row:5;margin:4px 0} #ui #t-title .go{grid-row:6;padding:11px 22px;font-size:15px}
  }
  #ui.titling .hud{display:none!important}
  #ui #h-clock{position:absolute;left:max(14px,env(safe-area-inset-left));top:max(14px,env(safe-area-inset-top));padding:8px 14px;display:flex;flex-direction:column;gap:1px;min-width:120px}
  #ui #h-clock .t{font-size:20px;font-weight:600}
  #ui #h-clock .t small{font-size:12px;color:var(--dim);margin-left:4px;font-weight:500}
  #ui #h-clock .p{font-size:12px;color:var(--dim);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:200px}
  #ui #h-right{position:absolute;right:max(14px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));display:flex;flex-direction:column;align-items:flex-end;gap:8px}
  #ui #h-mini{width:148px;height:148px;border-radius:50%;overflow:hidden;position:relative;padding:0;cursor:pointer}
  #ui.touch #h-mini{width:112px;height:112px}
  #ui #h-mini canvas{width:100%;height:100%;display:block}
  #ui #h-mini .n{position:absolute;left:50%;top:3px;transform:translateX(-50%);font:700 10px system-ui;color:#3a2718}
  #ui .round{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:17px}
  #ui #h-btns{display:flex;gap:8px}
  #ui #h-prompt{position:absolute;left:50%;bottom:max(96px,calc(env(safe-area-inset-bottom) + 96px));transform:translateX(-50%);padding:9px 18px 9px 10px;border-radius:999px;display:none;white-space:nowrap;font-size:15px;align-items:center;gap:10px}
  #ui #h-prompt b{display:inline-flex;align-items:center;justify-content:center;min-width:26px;height:26px;border-radius:8px;background:var(--gold);color:#1b1408;font-weight:700}
  #ui.touch #h-prompt{bottom:auto;top:60%;padding:12px 20px 12px 12px;font-size:16px}
  #ui #h-toasts{position:absolute;left:50%;top:max(14px,env(safe-area-inset-top));transform:translateX(-50%);display:flex;flex-direction:column;gap:6px;align-items:center;width:min(520px,62vw);pointer-events:none}
  @media (max-width:900px){#ui #h-toasts{width:min(420px,46vw)}}
  #ui #h-toasts .panel{padding:8px 16px;font-size:14px;text-align:center;animation:uiIn .3s ease;transition:opacity .5s}
  @keyframes uiIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
  #ui #h-hint{position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);padding:5px 14px;border-radius:999px;font-size:12px;color:var(--dim);display:none;white-space:nowrap}
  #ui #h-speed{position:absolute;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));padding:10px 16px;display:none;text-align:right;min-width:120px}
  #ui.touch #h-speed{display:none!important}
  #ui #h-rot{display:none;position:absolute;inset:0;z-index:30;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(6,12,18,.9);color:#ffe6a8;font-size:17px;letter-spacing:.04em}
  #ui #h-rot svg{width:64px;height:64px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;animation:uiRot 2.4s ease-in-out infinite}
  @keyframes uiRot{0%,20%{transform:rotate(0)}50%,80%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
  @media (orientation:portrait){#ui.touch:not(.titling):not(.portraitok) #h-rot{display:flex}}
  #ui #h-speed .v{font-size:30px;font-weight:700;line-height:1} #ui #h-speed .v small{font-size:12px;color:var(--dim);margin-left:4px;font-weight:500}
  #ui #h-speed .s{font-size:12px;color:var(--dim);margin-top:4px}
  #ui #h-speed .bar{height:4px;border-radius:4px;background:rgba(255,255,255,.12);margin-top:6px;overflow:hidden} #ui #h-speed .bar i{display:block;height:100%;background:var(--gold)}
  #ui #h-banner{position:absolute;left:50%;top:20%;transform:translateX(-50%);text-align:center;opacity:0;transition:opacity .7s;pointer-events:none;text-shadow:0 2px 8px rgba(0,0,0,.7)}
  #ui #h-banner.show{opacity:1} #ui #h-banner .k{font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#e9dcc0} #ui #h-banner .n{font:400 26px Limelight,Georgia,serif;letter-spacing:.06em;color:#ffe6a8}
  #ui #h-dlg{position:absolute;left:50%;bottom:max(22px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(600px,94vw);padding:14px 18px 12px 84px;display:none;min-height:66px;cursor:pointer}
  #ui #h-dlg .face{position:absolute;left:14px;top:12px;width:56px;height:56px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.08)}
  #ui #h-dlg .face svg{width:100%;height:100%}
  #ui #h-dlg .nm{font-weight:700;color:var(--gold)} #ui #h-dlg .rl{font-size:12px;color:var(--dim);margin-left:6px}
  #ui #h-dlg .ln{font-size:16px;margin-top:3px;min-height:22px}
  #ui #h-dlg .more{position:absolute;right:14px;bottom:6px;font-size:11px;color:var(--dim)}
  #ui .bubble{position:absolute;left:0;top:0;transform:translate(-50%,-100%);padding:6px 12px;border-radius:12px;background:rgba(255,250,238,.95);color:#2a1d12;font-size:14px;max-width:260px;text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.3);pointer-events:none}
  #ui .bubble:after{content:'';position:absolute;left:50%;bottom:-6px;margin-left:-6px;border:6px solid transparent;border-top-color:rgba(255,250,238,.95);border-bottom:0}
  #ui .bubble b{display:block;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#9a5a1a}
  #ui .sheet{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(4,10,16,.5);padding:16px}
  #ui .sheet.open{display:flex}
  #ui .sheet>.panel{background:var(--bg2);width:min(420px,100%);max-height:100%;overflow:auto;padding:18px}
  #ui .sheet h2{margin:0 0 12px;font:400 20px Limelight,Georgia,serif;letter-spacing:.14em;color:#ffe6a8;text-align:center}
  #ui .row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--line)}
  #ui .row label{flex:1;color:var(--dim)}
  #ui .seg{display:flex;background:rgba(255,255,255,.06);border-radius:999px;padding:3px}
  #ui .seg button{padding:6px 12px;border-radius:999px;font-size:13px;color:var(--dim)} #ui .seg button.on{background:var(--gold);color:#1b1408;font-weight:600}
  #ui input[type=range]{flex:1.2;accent-color:#e6b85a}
  #ui .stack{display:grid;gap:8px;margin-top:12px}
  #ui #m-help>.panel{width:min(560px,100%)}
  #ui #m-help .cols{display:grid;grid-template-columns:1fr 1fr;gap:4px 22px}
  #ui #m-help h3{margin:10px 0 4px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;color:var(--gold)}
  #ui #m-help .k{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:2px 0}
  @media (max-width:520px){#ui #m-help .cols{grid-template-columns:1fr}}
  #ui #m-map>.panel{width:auto;padding:12px}
  #ui #m-map .wrap{position:relative;border-radius:10px;overflow:hidden}
  #ui #m-map canvas{display:block}
  #ui #m-map .lab{position:absolute;transform:translate(-50%,-50%);font:600 11px system-ui;white-space:nowrap;cursor:pointer;color:#1b2a3a;text-shadow:0 0 3px #f5ecd6,0 0 3px #f5ecd6;padding:1px 4px;border-radius:5px}
  #ui #m-map .lab:hover{background:#1b2a3a;color:#fff;text-shadow:none}
  #ui #m-map .lab.view{background:rgba(27,42,58,.85);color:#ffe6a8;text-shadow:none;border-radius:999px;padding:2px 8px}
  #ui #m-map .hd{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:10px} #ui #m-map .hd span{color:var(--dim);font-size:12px}
  #ui #m-map .pick{position:absolute;transform:translateX(-50%);z-index:6;display:flex;flex-direction:column;gap:5px;padding:8px;background:var(--bg2);border:1px solid var(--line);border-radius:10px;min-width:150px}
  #ui #m-map .pick .t{font-weight:600;text-align:center}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  try { const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Limelight&display=swap'; document.head.appendChild(fl); } catch (e) {}
  root.addEventListener('pointerdown', (e) => { if (e.target.closest('.pe')) UI.pointerOnPanel = true; }, true);
  addEventListener('pointerup', () => { UI.pointerOnPanel = false; }, true);
  addEventListener('blur', () => { UI.pointerOnPanel = false; });

  // ------------------------------------------------------------------ portraits (SVG from an avatar look)
  const hx = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');
  UI.portrait = (L) => {
    if (!L) return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="#2d4a7a"/><path d="M12 64 Q14 50 32 50 Q50 50 52 64Z" fill="#1b2a3a"/><ellipse cx="32" cy="32" rx="13" ry="15" fill="#e9b48c"/></svg>`;
    const sk = hx(L.skin), hr = hx(L.hair), bg = hx(L.top ? L.top.col : 0x2d4a7a), hs = L.hairStyle || 'short';
    let hair = '', back = '';
    if (hs === 'long' || hs === 'wavy') back = `<rect x="16" y="20" width="32" height="34" rx="10" fill="${hr}"/>`;
    if (hs === 'pony') back = `<rect x="29" y="36" width="6" height="16" rx="3" fill="${hr}"/>`;
    if (hs === 'bun') hair += `<circle cx="32" cy="12" r="7" fill="${hr}"/>`;
    hair += hs === 'fade' ? `<path d="M19 27 Q20 14 32 14 Q44 14 45 27 Q40 21 32 21 Q24 21 19 27Z" fill="${hr}"/>`
      : hs === 'spiky' ? `<path d="M18 28 L20 14 L25 19 L28 11 L32 18 L36 11 L39 19 L44 14 L46 28 Q40 20 32 20 Q24 20 18 28Z" fill="${hr}"/>`
      : hs === 'messy' ? `<path d="M17 30 Q16 13 32 12 Q48 13 47 30 Q44 20 38 22 Q33 17 28 22 Q22 19 17 30Z" fill="${hr}"/>`
      : `<path d="M18 30 Q17 13 32 13 Q47 13 46 30 Q44 20 32 20 Q20 20 18 30Z" fill="${hr}"/>`;
    if (L.bangs) hair += `<rect x="20" y="17" width="24" height="7" rx="3" fill="${hr}"/>`;
    const gl = L.glasses != null ? `<g fill="none" stroke="${hx(L.glasses)}" stroke-width="2"><circle cx="26" cy="31" r="4.5"/><circle cx="38" cy="31" r="4.5"/><path d="M30.5 31h3"/></g>` : '';
    const bd = L.beard != null ? `<path d="M20 34 Q21 48 32 49 Q43 48 44 34 Q40 42 32 42 Q24 42 20 34Z" fill="${hx(L.beard)}"/>` : '';
    const hc = hx(L.hatCol || 0xe8c86a);
    const hat = L.hat === 'straw' ? `<ellipse cx="32" cy="17" rx="21" ry="4" fill="${hc}"/><rect x="21" y="7" width="22" height="10" rx="5" fill="${hc}"/><rect x="21" y="13" width="22" height="3" fill="#c0392b"/>`
      : L.hat === 'cap' ? `<path d="M18 22 Q18 10 32 10 Q46 10 46 22Z" fill="${hc}"/><rect x="28" y="20" width="20" height="3" rx="1.5" fill="${hc}"/>` : '';
    const bow = L.extra === 'bow' ? `<path d="M36 13 l6 -4 v8z M36 13 l-6 -4 v8z" fill="#ff4fa3"/>` : '';
    const lips = hx(L.lips || 0xa4544a);
    return `<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="32" fill="${bg}" opacity=".9"/>${back}<path d="M12 64 Q14 50 32 50 Q50 50 52 64Z" fill="${bg}" stroke="rgba(0,0,0,.25)"/><rect x="27" y="42" width="10" height="10" fill="${sk}"/>`
      + `<ellipse cx="32" cy="32" rx="13" ry="15" fill="${sk}"/>${bd}<circle cx="26.5" cy="31" r="1.6" fill="#2a211c"/><circle cx="37.5" cy="31" r="1.6" fill="#2a211c"/><path d="M28 39 Q32 42 36 39" stroke="${lips}" stroke-width="2" fill="none" stroke-linecap="round"/>${gl}${hair}${hat}${bow}</svg>`;
  };

  // ------------------------------------------------------------------ elements
  const title = h('div', '', `<div class="fade"></div><div class="logo"><h1>PORT SOLACE</h1><div class="sub">a harbour city where the lights never quite go out</div></div>
    <div class="modal panel pe" role="dialog" aria-modal="true" aria-label="Choose your character"><div class="q">Who are you today?</div>
    <div class="stage"><button class="arr l" aria-label="Previous character">&#8249;</button><button class="arr r" aria-label="Next character">&#8250;</button><div class="cnt"></div></div>
    <div class="n"></div><div class="tg"></div><div class="d"></div><div class="dots"></div>
    <button class="btn primary go"><span class="ic">&#9654;</span><span class="lb">Let's Play</span></button></div>`); title.id = 't-title';
  const clock = h('div', 'panel hud', `<div class="t"><span class="tm">4:30</span><small class="ap">PM</small></div><div class="p">Port Solace</div>`); clock.id = 'h-clock';
  const right = h('div', 'hud', `<div id="h-mini" class="panel pe"><canvas width="220" height="220"></canvas><div class="n">N</div></div><div id="h-btns">${TOUCH ? '<button class="panel round pe" data-k="full" title="Fullscreen">&#x26F6;</button>' : ''}<button class="panel round pe" data-k="map" title="Map (M)">&#x1F5FA;</button><button class="panel round pe" data-k="menu" title="Menu (Esc)">&#9776;</button></div>`); right.id = 'h-right';
  // phones: fullscreen + landscape lock from the Play tap (a user gesture); iOS Safari has neither API, so portrait gets a rotate hint
  const isFull = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const goFull = (on = true) => {
    const lock = () => { try { const o = screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) {} };
    try {
      if (!on) { if (isFull()) (document.exitFullscreen || document.webkitExitFullscreen).call(document); return; }
      const el = document.documentElement, rq = el.requestFullscreen || el.webkitRequestFullscreen;
      if (!rq || isFull()) { lock(); return; }
      const p = rq.call(el, { navigationUI: 'hide' }); if (p && p.then) p.then(lock, () => {}); else lock();
    } catch (e) { /* not allowed here */ }
  };
  UI.fullscreen = goFull;
  const rot = h('div', 'pe', `<svg viewBox="0 0 24 24"><rect x="7" y="2" width="10" height="20" rx="2"/><path d="M4 14a8 8 0 0 0 6 6M20 10a8 8 0 0 0-6-6"/></svg><div>Turn your phone sideways</div><button class="btn">Play in portrait</button>`); rot.id = 'h-rot';
  rot.querySelector('button').addEventListener('click', () => root.classList.add('portraitok'));
  const prompt = h('div', 'panel hud pe', ''); prompt.id = 'h-prompt';
  const toasts = h('div', '', ''); toasts.id = 'h-toasts';
  const hint = h('div', 'panel hud', ''); hint.id = 'h-hint';
  const speed = h('div', 'panel hud', `<div class="v"><span>0</span><small>mph</small></div><div class="s"></div><div class="bar hide"><i></i></div>`); speed.id = 'h-speed';
  const banner = h('div', '', `<div class="k"></div><div class="n"></div>`); banner.id = 'h-banner';
  const dlg = h('div', 'panel pe', `<div class="face"></div><div><span class="nm"></span><span class="rl"></span></div><div class="ln"></div><div class="more">${TOUCH ? 'tap' : 'E / click'} to continue</div>`); dlg.id = 'h-dlg';
  const bubbleEl = h('div', 'bubble', ''); bubbleEl.style.display = 'none';
  const menu = h('div', 'sheet pe', `<div class="panel"><h2>PAUSED</h2>
    <div class="row"><label>Graphics</label><div class="seg" data-k="gfx"><button data-v="low">Low</button><button data-v="lite" title="Default: Balanced without AO, god rays and MSAA">Standard</button><button data-v="high">Balanced</button><button data-v="ultra">High</button></div></div>
    <div class="row"><label>Resolution</label><div class="seg" data-k="res"><button data-v="0">Auto</button><button data-v="0.75">75%</button><button data-v="0.9">90%</button><button data-v="1">100%</button></div></div>
    <div class="row"><label></label><small class="rr" style="opacity:.75"></small></div>
    <div class="row"><label>Time of day</label><input data-k="hour" type="range" min="0" max="23.95" step="0.05"></div>
    <div class="row"><label>Clock</label><div class="seg" data-k="clock"><button data-v="run">Running</button><button data-v="stop">Stopped</button></div></div>
    <div class="row"><label>Look sensitivity</label><input data-k="sens" type="range" min="0.1" max="1.5" step="0.05"></div>
    <div class="stack"><button class="btn primary" data-k="resume">Resume</button><button class="btn" data-k="map">Map</button><button class="btn" data-k="help">Controls</button><button class="btn" data-k="switch">Switch friend</button></div></div>`); menu.id = 'm-menu';
  const help = h('div', 'sheet pe', ''); help.id = 'm-help';
  const mapEl = h('div', 'sheet pe', `<div class="panel"><div class="hd"><b class="deco" style="color:#ffe6a8">MAP</b><span>pick a place to go there</span><button class="btn" data-k="closemap">Close</button></div><div class="wrap"><canvas></canvas><div class="labs"></div></div></div>`); mapEl.id = 'm-map';
  const K = (k, d) => `<div class="k"><span>${d}</span><span>${k.split('+').map((x) => '<kbd>' + x + '</kbd>').join(' ')}</span></div>`;
  help.innerHTML = `<div class="panel"><h2>CONTROLS</h2>${TOUCH ? `<div class="cols"><div><h3>Moving</h3><div class="k"><span>Walk / drive / fly</span><span>left stick</span></div><div class="k"><span>Look around</span><span>drag the right side</span></div><div class="k"><span>Run</span><span>RUN button</span></div></div>
    <div><h3>Doing things</h3><div class="k"><span>Talk / get in / use</span><span>tap the prompt</span></div><div class="k"><span>Jump \u00b7 brake</span><span>round button</span></div><div class="k"><span>Get out</span><span>EXIT button</span></div><div class="k"><span>Map & menu</span><span>top right</span></div></div></div>`
    : `<div class="cols"><div><h3>On foot</h3>${K('W+A+S+D', 'Walk')}${K('Shift', 'Run')}${K('Space', 'Jump')}${K('Mouse', 'Look (click to capture)')}${K('E', 'Talk / get in / use')}${K('V', 'First person')}${K('Tab', 'Aerial view')}</div>
    <div><h3>Driving & riding</h3>${K('W+S', 'Throttle / reverse')}${K('A+D', 'Steer')}${K('Space', 'Brake')}${K('E', 'Get out')}<h3>Flying</h3>${K('Space+Shift', 'Throttle up / down (hold)')}${K('W+S', 'Nose up / down (I inverts)')}${K('A+D', 'Bank to turn / steer on the ground')}${K('Q+E', 'Rudder')}${K('X+B', 'Wheel brakes')}${K('S', 'Reverse (ground, throttle closed)')}${K('Mouse', 'Free look')}${K('Wheel', 'Camera zoom')}${K('F', 'Get out (on the ground)')}</div>
    <div><h3>From the sky</h3>${K('Drag', 'Rotate')}${K('Right-drag', 'Pan')}${K('Wheel', 'Zoom')}${K('Double-click', 'Land there')}</div>
    <div><h3>Anywhere</h3>${K('M', 'Map')}${K('Esc', 'Menu')}</div></div>`}
    <div class="stack"><button class="btn primary" data-k="closehelp">Got it</button></div></div>`;

  // ------------------------------------------------------------------ state + public api
  const S = UI.state = { title: true, map: false, help: false, menu: false, dlg: null, bannerB: null, bannerT: 0, hudT: -9, hud: null, toasts: [], pick: null };
  UI.titleOpen = () => S.title;
  UI.modalOpen = () => S.map || S.help || S.menu || S.title;
  UI.dialogueOpen = () => !!S.dlg;
  const show = (el, on, disp = 'block') => { const v = on ? disp : 'none'; if (el.style.display !== v) el.style.display = v; };
  UI.toast = (text, ms) => {
    if (!text) return;
    const t = h('div', 'panel', esc(text), toasts);
    S.toasts.push({ el: t, until: performance.now() + (ms || AF.clamp(2200 + String(text).length * 40, 2600, 7000)) });
    while (S.toasts.length > 2) S.toasts.shift().el.remove();
  };
  AF.on('toast', (text) => UI.toast(text));
  AF.on('hint', (text) => { hint.textContent = text || ''; show(hint, !!text && !TOUCH); });
  AF.toast = (msg) => AF.emit('toast', msg);
  const KIND = { shop: 'Shop', civic: 'Civic building', home: 'Residence', house: 'Home', station: 'Station', church: 'Chapel', school: 'School', diner: 'Diner', cinema: 'Picture house', hotel: 'Hotel', zoo: 'Zoo', airport: 'Airfield' };
  UI.banner = (name, kind) => { banner.querySelector('.k').textContent = kind ? (KIND[kind] || String(kind).replace(/[-_]/g, ' ')) : 'Now entering'; banner.querySelector('.n').textContent = name; banner.classList.add('show'); S.bannerT = performance.now() + 2800; };
  AF.on('hud', (d) => { if (!d || (d.speed == null && d.kmh == null)) { S.hudT = -9; return; } S.hudT = AF.clock.t; S.hud = d; });

  // ------------------------------------------------------------------ dialogue (typewriter; E / click / tap to continue)
  const dN = dlg.querySelector('.nm'), dR = dlg.querySelector('.rl'), dL = dlg.querySelector('.ln'), dF = dlg.querySelector('.face');
  AF.on('dialogue', (d) => {
    if (!d) { closeDlg(); return; }
    const lines = Array.isArray(d.lines) ? d.lines.slice() : [d.line || ''];
    S.dlg = { lines, i: 0, shown: 0, t: 0, frame: AF.clock.frame, hold: 0 };
    S.dlgFrom = AF.player ? { x: AF.player.x, z: AF.player.z } : null;
    dN.textContent = d.name || ''; dR.textContent = d.role ? '\u00b7 ' + String(d.role).replace(/\s*\u00b7\s*lives on .*$/i, '') : ''; dL.textContent = '';
    const fr = AF.friends && AF.friends.byId[String(d.name || '').toLowerCase()];
    dF.innerHTML = UI.portrait(fr ? fr.look : d.look || null);
    show(dlg, true); show(bubbleEl, false); BB.cur = null; exitLock();
  });
  const closeDlg = () => { const open = !!S.dlg; S.dlg = null; show(dlg, false); if (open) AF.input.requestLock(); };
  const advanceDlg = () => {
    const D = S.dlg; if (!D) return;
    const line = D.lines[D.i] || '';
    if (D.shown < line.length) { D.shown = line.length; dL.textContent = line; return; }
    if (D.i < D.lines.length - 1) { D.i++; D.shown = 0; D.t = 0; D.hold = 0; dL.textContent = ''; return; }
    closeDlg();
  };
  dlg.addEventListener('click', advanceDlg);

  // ------------------------------------------------------------------ speech bubbles: friends + staff greet you, townsfolk chatter as you pass
  const BB = { cur: null, until: 0, next: 3, seen: new Set() }, BV = new THREE.Vector3();
  const OVER = { paperboy: ['EXTRA! EXTRA! Blimp over the harbour!', 'Getcher Clarion, two cents!'], vendor: ['Getcher red-hots! Nickel a frank!', 'Hot roasted chestnuts!'], cabbie: ['Taxi, mister?', 'Harbour Cab, going anywhere!'],
    police: ['Keep it moving, folks.', 'Evening. Mind the streetcar.'], kid: ['Race you to the fountain!', 'Look, the blimp!', 'Have you been to the new zoo?'], fisherman: ['Mackerel are running tonight.'], conductor: ['All aboard for the loop!'],
    _: ['Evening!', 'Swell weather, ain\u2019t it?', 'Did you see the blimp?', 'Lovely evening for it.', 'Harbour Days on Saturday!', 'They opened a zoo out west, you know.', 'Heard you can fly planes from the new airfield!', 'Nice day for a drive.', 'Mind how you go.', 'Have we met?', 'Love the outfit!', 'You\u2019re new in town, aren\u2019t you?'] };
  AF.on('bubble', (b) => { if (!b || S.dlg) return; BB.cur = b; BB.until = AF.clock.t + (b.dur || 3.5); bubbleEl.innerHTML = (b.name ? '<b>' + esc(b.name) + '</b>' : '') + esc(b.text); });
  const bubbleTick = (dt) => {
    BB.next -= dt;
    if (AF.mode !== 'walk' || S.dlg || S.title || !AF.player) { show(bubbleEl, false); return; }
    const pl = AF.player, now = AF.clock.t;
    if (!BB.cur && BB.next <= 0 && AF.people) {
      BB.next = 3 + Math.random() * 3;
      let best = null, bd = 42;
      for (const q of AF.people) { if (!q || !q.root || !q.root.visible || q.hidden) continue; const d = (q.x - pl.x) ** 2 + (q.z - pl.z) ** 2; if (d < bd && d > 1.5 && Math.abs(q.y - pl.y) < 2 && !BB.seen.has(q.id)) { bd = d; best = q; } }
      if (best) {
        const k = String(best.roleKey || '').toLowerCase(), L = OVER[k] || OVER[Object.keys(OVER).find((r) => r !== '_' && k.includes(r))] || OVER._;
        AF.emit('bubble', { who: best, name: best.first || '', text: L[Math.floor(Math.random() * L.length)], dur: 3.4 });
        BB.seen.add(best.id); if (BB.seen.size > 30) BB.seen.clear();
      }
    }
    const b = BB.cur, q = b && b.who;
    if (!b || now > BB.until || !q || (q.root && !q.root.visible)) { show(bubbleEl, false); BB.cur = null; return; }
    const hgt = (q.parts && q.parts.root ? q.parts.root.scale.y : 1) * (q.parts && q.parts.sitting ? 1.7 : 2.15);
    BV.set(q.x, q.y + hgt, q.z).project(AF.camera);
    if (BV.z > 1 || Math.abs(BV.x) > 1.05 || Math.abs(BV.y) > 1.05) { show(bubbleEl, false); return; }
    const r = AF.renderer.domElement.getBoundingClientRect();
    bubbleEl.style.left = ((BV.x + 1) / 2 * r.width) + 'px'; bubbleEl.style.top = ((1 - BV.y) / 2 * r.height) + 'px'; show(bubbleEl, true);
  };

  // ------------------------------------------------------------------ title: pick your friend (modal, alphabetical, live 3D turntable)
  const tName = title.querySelector('.n'), tTag = title.querySelector('.tg'), tDesc = title.querySelector('.d'), tGo = title.querySelector('.go'), tDots = title.querySelector('.dots'), tCnt = title.querySelector('.cnt');
  const roster = () => ((AF.friends && AF.friends.cast) || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  UI.roster = roster;
  // drawn by the main renderer into the stage's screen rect after each frame (no second WebGL context)
  const stage = title.querySelector('.stage');
  const PV = { scene: null, cam: null, P: null, st: { phase: 0, speed: 0, air: 0, t: 0, land: 0 }, yaw: 0.4, drag: null, pop: 1, aspect: 0, size: new THREE.Vector2(), vp: new THREE.Vector4(), sc: new THREE.Vector4() };
  const pvInit = () => {
    if (PV.scene) return;
    const sc = new THREE.Scene();
    const bg = document.createElement('canvas'); bg.width = bg.height = 64;
    const g = bg.getContext('2d'), lin = g.createLinearGradient(0, 0, 0, 64); lin.addColorStop(0, '#1d2b3e'); lin.addColorStop(1, '#0b131d');
    g.fillStyle = lin; g.fillRect(0, 0, 64, 64);
    const rad = g.createRadialGradient(32, 45, 0, 32, 45, 38); rad.addColorStop(0, 'rgba(240,200,112,.22)'); rad.addColorStop(1, 'rgba(240,200,112,0)');
    g.fillStyle = rad; g.fillRect(0, 0, 64, 64);
    sc.background = new THREE.CanvasTexture(bg); sc.background.colorSpace = THREE.SRGBColorSpace;
    sc.add(new THREE.HemisphereLight(0xfff2dc, 0x34465a, 1.9));
    const key = new THREE.DirectionalLight(0xfff0d8, 2.6); key.position.set(2.5, 4, 3.5); sc.add(key);
    const rim = new THREE.DirectionalLight(0x8ec0ff, 1.4); rim.position.set(-3, 2.5, -3); sc.add(rim);
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.78, 0.08, 40), new THREE.MeshStandardMaterial({ color: 0x3a2c1e, roughness: 0.55, metalness: 0.25 }));
    disc.position.y = -0.04; sc.add(disc);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.018, 8, 48), new THREE.MeshStandardMaterial({ color: 0xf0c870, emissive: 0x6a4a10, roughness: 0.3, metalness: 0.8 }));
    ring.rotation.x = Math.PI / 2; sc.add(ring);
    const cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50); cam.position.set(0, 1.2, 5.2); cam.lookAt(0, 0.98, 0);
    Object.assign(PV, { scene: sc, cam });
  };
  stage.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; PV.drag = { x: e.clientX, yaw: PV.yaw }; try { stage.setPointerCapture(e.pointerId); } catch (er) {} stage.style.cursor = 'grabbing'; });
  stage.addEventListener('pointermove', (e) => { if (PV.drag) PV.yaw = PV.drag.yaw + (e.clientX - PV.drag.x) * 0.012; });
  const pvUp = () => { PV.drag = null; stage.style.cursor = ''; };
  stage.addEventListener('pointerup', pvUp); stage.addEventListener('pointercancel', pvUp);
  const pvShow = (look) => {
    PV.look = look;
    if (!AF.avatar) return;
    pvInit();
    if (PV.P) PV.scene.remove(PV.P.root);
    PV.P = AF.avatar.build(look); PV.scene.add(PV.P.root); PV.pop = 0;
  };
  AF.onTick('ui-preview', 946, (dt) => {
    if (!S.title) return;
    if (!PV.P && PV.look) pvShow(PV.look);
    if (!PV.P) return;
    if (!PV.drag) PV.yaw += dt * 0.55;
    PV.pop = Math.min(1, PV.pop + dt * 4);
    const e = 1 - Math.pow(1 - PV.pop, 3), s = (PV.P.root.userData.h0 || (PV.P.root.userData.h0 = PV.P.root.scale.x)) * (0.85 + 0.15 * e);
    PV.P.root.scale.setScalar(s); PV.P.root.rotation.y = PV.yaw;
    AF.avatar.animate(PV.P, PV.st, Math.min(dt, 0.05), 0, true);
  });
  AF.afterFrame = () => {
    if (!S.title || !PV.P) return;
    const R = AF.renderer, cr = R.domElement.getBoundingClientRect(), r = stage.getBoundingClientRect();
    R.getSize(PV.size);
    const k = PV.size.x / (cr.width || 1), w = r.width * k, hh = r.height * k;
    if (w < 2 || hh < 2) return;
    const x = (r.left - cr.left) * k, y = PV.size.y - (r.bottom - cr.top) * k;
    if (PV.aspect !== w / hh) { PV.aspect = w / hh; PV.cam.aspect = PV.aspect; PV.cam.updateProjectionMatrix(); }
    R.getViewport(PV.vp); R.getScissor(PV.sc);
    const rt = R.getRenderTarget(), sct = R.getScissorTest(), ac = R.autoClear, tm = R.toneMapping, ex = R.toneMappingExposure;
    try {
      R.setRenderTarget(null); R.autoClear = false; R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.2;
      R.setViewport(x, y, w, hh); R.setScissor(x, y, w, hh); R.setScissorTest(true);
      R.clearDepth(); R.render(PV.scene, PV.cam);
    } finally {
      R.setViewport(PV.vp); R.setScissor(PV.sc); R.setScissorTest(sct); R.autoClear = ac; R.toneMapping = tm; R.toneMappingExposure = ex; R.setRenderTarget(rt);
    }
  };
  AF.test('ui: title preview uses the main renderer', () => {
    const extra = title.querySelectorAll('canvas').length, has = !!(PV.P && PV.P.root.parent === PV.scene);
    return { ok: extra === 0 && !('r' in PV) && (!S.title || has), info: 'stage canvases ' + extra + ', title ' + (S.title ? 'open, avatar ' + has : 'closed') };
  });
  const select = (id) => {
    const c = AF.friends && AF.friends.byId[id]; if (!c) return;
    const R = roster(), i = R.findIndex((q) => q.id === id);
    S.pick = id;
    tName.textContent = c.name; tTag.textContent = c.tag; tDesc.textContent = c.blurb; tCnt.textContent = (i + 1) + ' / ' + R.length;
    tDots.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    tGo.querySelector('.lb').textContent = "Let's Play as " + c.name;
    pvShow(c.look);
  };
  const step = (d) => { const R = roster(); if (!R.length) return; const i = Math.max(0, R.findIndex((c) => c.id === S.pick)); select(R[(i + d + R.length) % R.length].id); };
  const buildTitle = () => {
    const R = roster();
    tDots.innerHTML = R.map((c) => `<button data-id="${c.id}" aria-label="${esc(c.name)}"></button>`).join('');
    let last = null; try { last = localStorage.getItem('portSolace.friend'); } catch (e) {}
    select(R.find((c) => c.id === last) ? last : R[0] && R[0].id);
  };
  const start = () => {
    if (!AF.ready || !S.pick || !S.title) return;
    S.title = false; root.classList.remove('titling'); title.classList.add('out'); setTimeout(() => { if (!S.title) title.style.display = 'none'; }, 600);
    if (TOUCH) goFull();
    AF.input.requestLock();
    AF.friends.play(S.pick);
    const c = AF.friends.current;
    UI.toast(`Welcome home, ${c.name}! Your friends live along Friends Lane \u2014 go say hi.`, 5200);
    setTimeout(() => UI.toast(TOUCH ? 'Tap a prompt to talk, or to get into a car, a bike or a plane.' : 'Walk up to anyone \u2014 or any car \u2014 and press E. M for the map, Esc for the menu.', 5400), 5600);
  };
  tDots.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) select(b.dataset.id); });
  title.querySelector('.arr.l').addEventListener('click', () => step(-1));
  title.querySelector('.arr.r').addEventListener('click', () => step(1));
  tGo.addEventListener('click', start);
  addEventListener('keydown', (event) => { if (S.title && (event.code === 'Enter' || event.code === 'Space') && !event.repeat && !(event.target && /INPUT|TEXTAREA/.test(event.target.tagName))) start(); });
  UI.showTitle = () => { S.title = true; root.classList.add('titling'); title.style.display = ''; title.classList.remove('out'); exitLock(); toggleMenu(false); closeDlg(); AF.setMode('cine'); };
  // ---- title cinematic: slow dolly shots across the city behind the character card, cut through a short fade
  {
    const fadeEl = title.querySelector('.fade');
    const SHOTS = [
      [[236, 64, 46], [80, 32, -86], [178, 50, -34], [60, 30, -126], 11],        // downtown towers at night
      [[14, 7, 214], [2, 6, 100], [9, 4.5, 150], [2, 5, 60], 10],                 // down the Great White Way
      [[70, 26, 306], [0, 5, 200], [-70, 24, 306], [-70, 5, 200], 11],           // the harbour front
      [[-512, 12, -170], [-546, 1, -154], [-578, 9, -132], [-546, 1, -154], 10],  // the zoo brook + Keeper's Bridge
      [[-360, 30, 218], [-480, 2, 150], [-560, 24, 196], [-480, 2, 150], 10],     // the airfield
      [[-372, 14, 18], [-372, 3, -70], [-376, 9, -118], [-372, 3, -210], 10],     // Friends Lane
      [[410, 40, 230], [388, 0, 60], [352, 26, 220], [388, 0, 0], 11],            // the Solace River through Eastport
      [[-230, 150, 330], [20, 12, -30], [120, 170, 320], [20, 12, -30], 12],     // the whole island
    ];
    const CV = { i: 0, t: 0, p: new THREE.Vector3(), q: new THREE.Vector3() };
    const ease = (k) => k * k * (3 - 2 * k);
    AF.modes.cine = {
      enter() { CV.t = 0; },
      exit() { fadeEl.style.opacity = 0; },
      update(dt) {
        let s = SHOTS[CV.i];
        CV.t += Math.min(dt, 0.1);
        if (CV.t > s[4]) { CV.i = (CV.i + 1) % SHOTS.length; CV.t = 0; s = SHOTS[CV.i]; }
        fadeEl.style.opacity = CV.t < 0.35 || CV.t > s[4] - 0.45 ? 1 : 0;
        const k = ease(Math.min(1, CV.t / s[4]));
        CV.p.set(s[0][0] + (s[2][0] - s[0][0]) * k, s[0][1] + (s[2][1] - s[0][1]) * k, s[0][2] + (s[2][2] - s[0][2]) * k);
        CV.q.set(s[1][0] + (s[3][0] - s[1][0]) * k, s[1][1] + (s[3][1] - s[1][1]) * k, s[1][2] + (s[3][2] - s[1][2]) * k);
        const cam = AF.camera; cam.position.copy(CV.p); cam.lookAt(CV.q); AF.camTarget.copy(CV.q);
        AF.shadowFocus.set(CV.q.x, 0, CV.q.z); AF.shadowRadius = 90;
      },
    };
    AF.onTick('title-cine', 149, () => { if (S.title && AF.ready && !AF.TEST && !AF.SHOT && (!AF.mode || AF.mode === 'aerial') && AF.modes.cine) AF.setMode('cine'); if ((!S.title || AF.mode !== 'cine') && fadeEl.style.opacity !== '0') fadeEl.style.opacity = 0; });
  }
  UI.go = (id) => { if (id) select(id); start(); };
  root.classList.add('titling');

  // ------------------------------------------------------------------ menu / help / map
  const G = AF.GFX;
  const syncMenu = () => {
    menu.querySelectorAll('[data-k=gfx] button').forEach((b) => b.classList.toggle('on', b.dataset.v === G.name));
    menu.querySelectorAll('[data-k=res] button').forEach((b) => b.classList.toggle('on', +b.dataset.v === G.res));
    const cv = AF.renderer.domElement, pr = AF.renderer.getPixelRatio();
    menu.querySelector('.rr').textContent = `Render ${cv.width}\u00d7${cv.height} (${pr.toFixed(2)}\u00d7 CSS px${devicePixelRatio > pr + 0.01 ? ', ' + Math.round(pr / devicePixelRatio * 100) + '% of display' : ''})${G.auto ? ' \u00b7 auto ' + G.name : ''}`;
    menu.querySelectorAll('[data-k=clock] button').forEach((b) => b.classList.toggle('on', (b.dataset.v === 'stop') === !!AF.time.paused));
    const hr = menu.querySelector('[data-k=hour]'); if (document.activeElement !== hr) hr.value = AF.time.hours.toFixed(2);
    menu.querySelector('[data-k=sens]').value = String(AF.lookSens());
  };
  const exitLock = () => AF.input.releaseLock();
  const toggleMenu = (on, resume = true) => { S.menu = on ?? !S.menu; if (S.menu) { syncMenu(); S.help = false; S.map = false; mapEl.classList.remove('open'); help.classList.remove('open'); exitLock(); } menu.classList.toggle('open', S.menu); if (!S.menu && resume) AF.input.requestLock(); };
  const toggleHelp = (on) => { S.help = on ?? !S.help; help.classList.toggle('open', S.help); if (S.help) { S.menu = false; menu.classList.remove('open'); exitLock(); } else AF.input.requestLock(); };
  UI.resume = () => { if (S.menu) toggleMenu(false); };
  AF.on('pointerunlock', (intentional) => { if (!intentional && !S.title && !UI.modalOpen() && !S.dlg) toggleMenu(true); });
  AF.on('escape', () => {
    if (S.title) return;
    if (S.map || S.help) { toggleMap(false); toggleHelp(false); }
    else if (S.dlg) closeDlg();
    else toggleMenu(true);
  });
  menu.addEventListener('click', (e) => {
    if (e.target === menu) { toggleMenu(false); return; }
    const b = e.target.closest('button'); if (!b) return;
    const seg = b.parentElement && b.parentElement.dataset.k;
    if (seg === 'gfx') { G.auto = false; G.set(b.dataset.v, 'menu'); try { localStorage.setItem('portSolace.gfx', b.dataset.v); } catch (er) {} }
    else if (seg === 'res') {
      G.res = +b.dataset.v; try { localStorage.setItem('portSolace.res', b.dataset.v); } catch (er) {}
      AF.renderer.setPixelRatio(AF.basePR() * G.scale); AF.resize();
    }
    else if (seg === 'clock') AF.time.paused = b.dataset.v === 'stop';
    else if (b.dataset.k === 'resume') toggleMenu(false);
    else if (b.dataset.k === 'map') { toggleMenu(false, false); toggleMap(true); }
    else if (b.dataset.k === 'help') { toggleMenu(false, false); toggleHelp(true); }
    else if (b.dataset.k === 'switch') { toggleMenu(false, false); UI.showTitle(); }
    syncMenu();
  });
  menu.querySelector('[data-k=hour]').addEventListener('input', (e) => { AF.time.hours = +e.target.value; });
  menu.querySelector('[data-k=sens]').addEventListener('input', (e) => AF.setLookSens(e.target.value));
  help.addEventListener('click', (e) => { if (e.target === help || e.target.closest('[data-k=closehelp]')) toggleHelp(false); });
  right.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { if (b.dataset.k === 'menu') toggleMenu(); else if (b.dataset.k === 'map') toggleMap(); else if (b.dataset.k === 'full') goFull(!isFull()); return; } if (e.target.closest('#h-mini')) toggleMap(true); });
  prompt.addEventListener('click', () => AF.input.tap('KeyE'));

  // map base: 1.5 px per metre over the whole world (AF.PLAN.bounds)
  const B = AF.PLAN.bounds || { x0: -300, z0: -300, x1: 300, z1: 300 }, BW = B.x1 - B.x0, BH = B.z1 - B.z0, PX = 1.5;
  const base = document.createElement('canvas'); base.width = Math.round(BW * PX); base.height = Math.round(BH * PX);
  const wx = (x) => (x - B.x0) * PX, wz = (z) => (z - B.z0) * PX;
  const drawBase = () => {
    const g = base.getContext('2d'), P = AF.PLAN, W = AF.W, NW = base.width, NH = base.height;
    const img = g.createImageData(NW, NH), D = img.data, paper = [238, 225, 192], hex = AF.PAL.hex;
    for (let py = 0; py < NH; py++) {
      const bz = Math.min(W.NZ - 1, Math.max(0, W.bz(B.z0 + py / PX)));
      for (let px = 0; px < NW; px++) {
        const bx = Math.min(W.NX - 1, Math.max(0, W.bx(B.x0 + px / PX))), i = bx * W.NZ + bz;
        const c = hex[W.C[i]] ?? 0x6f9a3e, hh = W.H[i], hW = W.H[Math.max(0, bx - 4) * W.NZ + bz], hN = W.H[bx * W.NZ + Math.max(0, bz - 4)];
        const sh = AF.clamp(1 + (hh - hW) * 0.05 + (hh - hN) * 0.04, 0.72, 1.2), o = (py * NW + px) * 4, k = 0.5;
        D[o] = AF.clamp((((c >> 16) & 255) * k + paper[0] * (1 - k)) * sh, 0, 255); D[o + 1] = AF.clamp((((c >> 8) & 255) * k + paper[1] * (1 - k)) * sh, 0, 255); D[o + 2] = AF.clamp(((c & 255) * k + paper[2] * (1 - k)) * sh * 0.96, 0, 255); D[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    g.fillStyle = 'rgba(92,140,170,.85)'; g.beginPath(); g.ellipse(wx(P.lake.cx), wz(P.lake.cz), P.lake.rx * PX, P.lake.rz * PX, 0, 0, Math.PI * 2); g.fill();
    g.lineCap = 'round'; g.strokeStyle = '#3a2718'; g.lineWidth = 10 * PX; g.beginPath();
    for (const r of P.roads) { g.moveTo(wx(r.a[0]), wz(r.a[1])); g.lineTo(wx(r.b[0]), wz(r.b[1])); } g.stroke();
    g.strokeStyle = '#f4ead0'; g.lineWidth = 7.5 * PX; g.stroke();
    for (const b of AF.buildings) { const Bx = b.box; if (!Bx || b.kind === 'zoo') continue; g.fillStyle = b.owner === 'west' ? '#c77a9a' : /home|house/i.test((b.kind || '') + (b.id || '')) ? '#c9905a' : '#a8743f'; g.fillRect(wx(Math.min(Bx[0], Bx[3])), wz(Math.min(Bx[2], Bx[5])), Math.abs(Bx[3] - Bx[0]) * PX, Math.abs(Bx[5] - Bx[2]) * PX); }
    const L = P.rail.length; g.beginPath(); for (let s = 0; s <= L; s += 4) { const p = P.railPoint(s); s ? g.lineTo(wx(p.x), wz(p.z)) : g.moveTo(wx(p.x), wz(p.z)); } g.closePath(); g.strokeStyle = '#2f5d3a'; g.lineWidth = 3; g.stroke();
  };
  const DIR = new THREE.Vector3();
  const focus = () => AF.mode === 'drive' && AF.vehicles.player ? AF.vehicles.player : AF.mode === 'fly' && AF.planes && AF.planes.cur ? AF.planes.cur : AF.player;
  const markers = (g, tx, tz, sc) => {
    if (sc > 0.9 && AF.people) { g.fillStyle = 'rgba(58,39,24,.8)'; for (const q of AF.people) { if (!q || q.hidden || !isFinite(q.x)) continue; g.fillRect(tx(q.x) - 1.5, tz(q.z) - 1.5, 3, 3); } }
    if (AF.npcs) { g.fillStyle = '#d9486f'; for (const n of AF.npcs) { if (n.hidden || !n.friend) continue; g.beginPath(); g.arc(tx(n.x), tz(n.z), 4, 0, 7); g.fill(); } }
    const cars = AF.vehicles && AF.vehicles.cars; if (cars) for (const c of cars) { if (!isFinite(c.x)) continue; g.fillStyle = c.type && c.type.lux ? '#e0a020' : '#6a5a48'; g.fillRect(tx(c.x) - 2, tz(c.z) - 2, 4, 4); }
    if (AF.planes) for (const p of AF.planes.list) { g.fillStyle = '#2d6aa8'; g.beginPath(); g.arc(tx(p.x), tz(p.z), 4, 0, 7); g.fill(); }
    const aerial = AF.mode === 'aerial', src = focus();
    const px = aerial ? AF.camTarget.x : src.x, pz = aerial ? AF.camTarget.z : src.z;
    AF.camera.getWorldDirection(DIR);
    g.save(); g.translate(tx(px), tz(pz)); g.rotate(-(aerial ? Math.atan2(DIR.x, DIR.z) : src.yaw ?? 0) + Math.PI);
    g.fillStyle = '#e8402b'; g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 6); g.lineTo(0, 3); g.lineTo(-6, 6); g.closePath(); g.stroke(); g.fill(); g.restore();
  };
  const mcv = right.querySelector('canvas'), mg = mcv.getContext('2d');
  const drawMini = () => {
    const N = mcv.width, src = focus(), aerial = AF.mode === 'aerial';
    const span = aerial ? AF.clamp(AF.PL.aerial.d * 1.4, 160, 700) : AF.mode === 'fly' ? 480 : AF.mode === 'drive' ? 220 : 140;
    const cx = aerial ? AF.camTarget.x : src.x, cz = aerial ? AF.camTarget.z : src.z, sc = N / span;
    mg.fillStyle = '#6a8fa8'; mg.fillRect(0, 0, N, N);
    mg.drawImage(base, wx(cx - span / 2), wz(cz - span / 2), span * PX, span * PX, 0, 0, N, N);
    markers(mg, (x) => (x - cx) * sc + N / 2, (z) => (z - cz) * sc + N / 2, sc);
  };
  const mapCv = mapEl.querySelector('canvas'), mapG = mapCv.getContext('2d'), labs = mapEl.querySelector('.labs');
  let mapW = 600, mapH = 375;
  const drawMap = () => { mapG.drawImage(base, 0, 0, mapW, mapH); markers(mapG, (x) => (x - B.x0) / BW * mapW, (z) => (z - B.z0) / BH * mapH, mapW / BW); };
  const buildLabels = () => {
    labs.innerHTML = ''; const boxes = [];
    const add = (name, x, z, cls, fn) => {
      const lx = (x - B.x0) / BW * mapW, lz = (z - B.z0) / BH * mapH, bw = name.length * 6.4 + 12, bh = 16, bb = [lx - bw / 2, lz - bh / 2, lx + bw / 2, lz + bh / 2];
      if (bb[0] < 2 || bb[2] > mapW - 2 || bb[1] < 2 || bb[3] > mapH - 2) return;
      for (const o of boxes) if (bb[0] < o[2] && bb[2] > o[0] && bb[1] < o[3] && bb[3] > o[1]) return;
      boxes.push(bb);
      const e = document.createElement('div'); e.className = 'lab ' + cls; e.textContent = name; e.style.left = lx + 'px'; e.style.top = lz + 'px';
      e.addEventListener('click', (ev) => {
        ev.stopPropagation(); const old = labs.querySelector('.pick'); if (old) old.remove();
        const pk = document.createElement('div'); pk.className = 'pick'; pk.style.left = AF.clamp(lx, 80, mapW - 80) + 'px'; pk.style.top = Math.min(lz + 12, mapH - 110) + 'px';
        pk.innerHTML = '<div class="t"></div><button class="btn primary" data-a="walk">Go there</button><button class="btn" data-a="fly">Fly over</button>';
        pk.querySelector('.t').textContent = name;
        pk.addEventListener('click', (e2) => { e2.stopPropagation(); const a = e2.target.dataset && e2.target.dataset.a; if (!a) return; pk.remove(); fn(a === 'walk'); });
        labs.appendChild(pk);
      });
      labs.appendChild(e);
    };
    const travel = (x, z, walk, b) => {
      toggleMap(false);
      if (!walk) { AF.flyTo([x + 38, 42, z + 52], [x, 2, z]); return; }
      let px = x, pz = z, yaw = 0;
      if (b && b.doors && b.doors.length) { const d = b.doors[0]; yaw = d.yaw || 0; px = d.x - Math.sin(yaw) * 1.4; pz = d.z - Math.cos(yaw) * 1.4; }
      AF.setMode('walk', { x: px, y: AF.surfaceBelow(px, pz, 80, 100), z: pz, yaw });
    };
    for (const v of AF.PLAN.views) add(v.name, v.target[0], v.target[2], 'view', (w) => { if (w) travel(v.target[0], v.target[2], true); else { toggleMap(false); AF.flyTo(v.pos, v.target); } });
    for (const l of AF.labels) { if (l.kind === 'street') continue; const b = l.kind === 'building' ? AF.buildings.find((q) => q.name === l.name) : null; if (b && b.kind === 'house' && b.owner !== 'west') continue; add(l.name, l.x, l.z, 'bld', (w) => travel(l.x, l.z, w, b)); }
  };
  const toggleMap = (on) => {
    S.map = on ?? !S.map;
    if (S.map) {
      const k = Math.min((innerWidth - 56) / BW, (innerHeight - 110) / BH);
      mapW = Math.round(BW * k); mapH = Math.round(BH * k); mapCv.width = mapW; mapCv.height = mapH; const wr = mapEl.querySelector('.wrap'); wr.style.width = mapW + 'px'; wr.style.height = mapH + 'px';
      buildLabels(); drawMap(); S.menu = false; menu.classList.remove('open'); exitLock();
    }
    mapEl.classList.toggle('open', S.map);
    if (!S.map) AF.input.requestLock();
  };
  mapEl.addEventListener('click', (e) => { if (e.target === mapEl || e.target.closest('[data-k=closemap]')) toggleMap(false); else { const pk = labs.querySelector('.pick'); if (pk && !e.target.closest('.pick')) pk.remove(); } });
  UI.toggleMap = toggleMap; UI.toggleHelp = toggleHelp; UI.toggleMenu = toggleMenu;

  // ------------------------------------------------------------------ build + tick
  AF.onBuild('ui', 830, () => { try { drawBase(); } catch (e) { console.warn('[af] ui map base failed', e); } buildTitle(); root.appendChild(title); });
  AF.on('mode', (name) => { if (name !== 'drive' && name !== 'fly') show(speed, false); });
  let frameN = 0;
  const fmt = (hrs) => { const hh = Math.floor(hrs) % 24, mm = Math.floor((hrs - Math.floor(hrs)) * 60); return [((hh + 11) % 12) + 1 + ':' + String(mm).padStart(2, '0'), hh < 12 ? 'AM' : 'PM']; };
  const placeName = () => {
    const pl = focus(); if (!pl) return '';
    const lot = AF.PLAN.lotAt(pl.x, pl.z), id = lot && lot.id;
    if (id === 'w-zoo') return 'Solace Zoo'; if (id === 'w-airfield') return 'Westgate Airfield';
    const nr = AF.PLAN.nearestRoad(pl.x, pl.z); return nr.d < 12 ? nr.road.name : pl.x < -300 ? 'The West Side' : 'Port Solace';
  };
  AF.onTick('ui', 950, (dt) => {
    frameN++;
    const I = AF.input;
    if (S.title) {
      if (I.hit('Enter') || I.hit('Space')) start();
      if (I.hit('ArrowRight') || I.hit('KeyD')) step(1);
      if (I.hit('ArrowLeft') || I.hit('KeyA')) step(-1);
    } else {
      if (I.hit('KeyM')) toggleMap();
      if (I.hit('KeyH') || I.hit('Slash')) toggleHelp();
      if (I.hit('Escape')) AF.emit('escape');
    }
    const D = S.dlg;
    if (D) {
      const line = D.lines[D.i] || '';
      if (D.shown < line.length) { D.t += dt * 45; const n = Math.min(line.length, Math.floor(D.t)); if (n !== D.shown) { D.shown = n; dL.textContent = line.slice(0, n); } }
      else { D.hold += dt; if (D.hold > 3.4 + line.length * 0.045) { if (D.i < D.lines.length - 1) { D.i++; D.shown = 0; D.t = 0; D.hold = 0; dL.textContent = ''; } else closeDlg(); } }
      if (S.dlg && I.hit('KeyE') && AF.clock.frame > D.frame) advanceDlg();
      if (S.dlg && AF.mode === 'walk' && AF.player && S.dlgFrom && Math.hypot(AF.player.x - S.dlgFrom.x, AF.player.z - S.dlgFrom.z) > 6) closeDlg();
    }
    try { bubbleTick(dt); } catch (e) { show(bubbleEl, false); }
    const it = AF.mode === 'walk' && !S.dlg && !UI.modalOpen() ? AF.interactTarget : null;
    if (it) { const lab = `<b>${TOUCH ? '&#9995;' : 'E'}</b>` + esc(it.label || 'Use'); if (prompt._l !== lab) { prompt.innerHTML = lab; prompt._l = lab; } }
    show(prompt, !!it, 'flex');
    const now = performance.now();
    for (let i = S.toasts.length - 1; i >= 0; i--) { const o = S.toasts[i]; if (now > o.until) { o.el.style.opacity = '0'; if (now > o.until + 500) { o.el.remove(); S.toasts.splice(i, 1); } } }
    if (frameN % 10 === 0 && !S.title) {
      let b = null;
      if (AF.mode === 'walk' && AF.player) b = AF.buildingAt(AF.player.x, AF.player.y + 1, AF.player.z);
      if (b !== S.bannerB) { S.bannerB = b; if (b && b.name && b.label !== false) UI.banner(b.name, b.kind); }
      const [t, ap] = fmt(AF.time.hours); clock.querySelector('.tm').textContent = t; clock.querySelector('.ap').textContent = ap;
      const place = b && b.name && b.label !== false ? b.name : placeName();
      clock.querySelector('.p').textContent = (AF.friends && AF.friends.current ? AF.friends.current.name + ' \u00b7 ' : '') + place;
      if (S.menu) syncMenu();
    }
    if (S.bannerT && now > S.bannerT) { banner.classList.remove('show'); S.bannerT = 0; }
    if (!S.title && frameN % 3 === 0) drawMini();
    if (S.map && frameN % 8 === 0) drawMap();
    const d = (AF.mode === 'drive' || AF.mode === 'fly') && AF.clock.t - S.hudT < 1.0 ? S.hud : null;
    show(speed, !!d);
    if (d && frameN % 3 === 0) {
      speed.querySelector('.v span').textContent = Math.round(d.speed || 0);
      speed.querySelector('.s').textContent = d.mode === 'fly' ? `${d.car || ''} \u00b7 ${Math.round(d.alt || 0)} m` : (d.car || '') + (d.gear === 'R' ? ' \u00b7 R' : '');
      const bar = speed.querySelector('.bar'); bar.classList.toggle('hide', d.mode !== 'fly'); if (d.mode === 'fly') bar.firstChild.style.width = Math.round((d.throttle || 0) * 100) + '%';
    }
  });
}

} catch (e) { AF.partError('71-ui.js', e); }
