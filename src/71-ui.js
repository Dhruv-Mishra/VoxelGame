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
  #ui #t-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;padding:0 16px max(28px,env(safe-area-inset-bottom));pointer-events:none;background:linear-gradient(180deg,rgba(6,12,20,.55) 0,rgba(6,12,20,0) 30%,rgba(6,12,20,0) 45%,rgba(6,12,20,.75) 100%);transition:opacity .6s}
  #ui #t-title.out{opacity:0}
  #ui #t-title .logo{position:absolute;top:max(7vh,20px);left:0;right:0;text-align:center}
  #ui #t-title h1{margin:0;font:400 clamp(30px,6vw,60px)/1 Limelight,Georgia,serif;letter-spacing:.24em;padding-left:.24em;color:#ffe6a8;text-shadow:0 2px 0 rgba(60,36,8,.7),0 0 24px rgba(240,190,90,.35)}
  #ui #t-title .sub{margin-top:8px;color:#e9dcc0;font-style:italic;text-shadow:0 1px 3px #000}
  #ui #t-title .card{pointer-events:auto;width:min(720px,100%);padding:16px}
  #ui #t-title .q{font-size:12px;letter-spacing:.2em;text-transform:uppercase;color:var(--dim);text-align:center;margin-bottom:10px}
  #ui #t-title .grid{display:grid;grid-template-columns:repeat(7,1fr);gap:8px}
  #ui #t-title .pick{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 2px;border-radius:12px;border:1px solid transparent}
  #ui #t-title .pick:hover{background:rgba(255,255,255,.07)}
  #ui #t-title .pick.on{background:rgba(240,200,112,.14);border-color:rgba(240,200,112,.6)}
  #ui #t-title .pick svg{width:54px;height:54px}
  #ui #t-title .pick b{font-weight:600;font-size:13px}
  #ui #t-title .info{display:flex;align-items:center;gap:14px;margin-top:12px;padding-top:12px;border-top:1px solid var(--line)}
  #ui #t-title .info .txt{flex:1;min-width:0}
  #ui #t-title .info .n{font-weight:700;font-size:16px}
  #ui #t-title .info .d{color:var(--dim);font-size:13px}
  #ui #t-title .info .btn{padding:12px 22px;font-size:15px;white-space:nowrap}
  @media (max-width:620px){#ui #t-title .grid{grid-template-columns:repeat(4,1fr)} #ui #t-title .info{flex-direction:column;align-items:stretch;text-align:center}}
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
  #ui #h-toasts .panel{padding:8px 16px;font-size:14px;text-align:center;animation:uiIn .3s ease;transition:opacity .5s}
  @keyframes uiIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
  #ui #h-hint{position:absolute;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);padding:5px 14px;border-radius:999px;font-size:12px;color:var(--dim);display:none;white-space:nowrap}
  #ui #h-speed{position:absolute;right:max(18px,env(safe-area-inset-right));bottom:max(18px,env(safe-area-inset-bottom));padding:10px 16px;display:none;text-align:right;min-width:120px}
  #ui.touch #h-speed{right:auto;left:50%;transform:translateX(-50%);bottom:auto;top:max(66px,env(safe-area-inset-top));padding:6px 14px;min-width:0}
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
  const title = h('div', '', `<div class="logo"><h1>PORT SOLACE</h1><div class="sub">a harbour city where the lights never quite go out</div></div>
    <div class="card panel"><div class="q">Who are you today?</div><div class="grid"></div>
    <div class="info"><div class="txt"><div class="n"></div><div class="d"></div></div><button class="btn primary go">Play</button></div></div>`); title.id = 't-title';
  const clock = h('div', 'panel hud', `<div class="t"><span class="tm">4:30</span><small class="ap">PM</small></div><div class="p">Port Solace</div>`); clock.id = 'h-clock';
  const right = h('div', 'hud', `<div id="h-mini" class="panel pe"><canvas width="220" height="220"></canvas><div class="n">N</div></div><div id="h-btns"><button class="panel round pe" data-k="map" title="Map (M)">&#x1F5FA;</button><button class="panel round pe" data-k="menu" title="Menu (Esc)">&#9776;</button></div>`); right.id = 'h-right';
  const prompt = h('div', 'panel hud pe', ''); prompt.id = 'h-prompt';
  const toasts = h('div', '', ''); toasts.id = 'h-toasts';
  const hint = h('div', 'panel hud', ''); hint.id = 'h-hint';
  const speed = h('div', 'panel hud', `<div class="v"><span>0</span><small>mph</small></div><div class="s"></div><div class="bar hide"><i></i></div>`); speed.id = 'h-speed';
  const banner = h('div', '', `<div class="k"></div><div class="n"></div>`); banner.id = 'h-banner';
  const dlg = h('div', 'panel pe', `<div class="face"></div><div><span class="nm"></span><span class="rl"></span></div><div class="ln"></div><div class="more">${TOUCH ? 'tap' : 'E / click'} to continue</div>`); dlg.id = 'h-dlg';
  const bubbleEl = h('div', 'bubble', ''); bubbleEl.style.display = 'none';
  const menu = h('div', 'sheet pe', `<div class="panel"><h2>PAUSED</h2>
    <div class="row"><label>Graphics</label><div class="seg" data-k="gfx"><button data-v="low">Low</button><button data-v="high">Balanced</button><button data-v="ultra">High</button></div></div>
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
    <div><h3>Driving & riding</h3>${K('W+S', 'Throttle / reverse')}${K('A+D', 'Steer')}${K('Space', 'Brake')}${K('E', 'Get out')}<h3>Flying</h3>${K('W+S', 'Throttle')}${K('Mouse', 'Pitch & bank')}${K('A+D', 'Bank')}${K('Q+E', 'Rudder')}${K('F', 'Get out (on the ground)')}</div>
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
    show(dlg, true); show(bubbleEl, false); BB.cur = null;
  });
  const closeDlg = () => { S.dlg = null; show(dlg, false); };
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

  // ------------------------------------------------------------------ title: pick your friend
  const grid = title.querySelector('.grid'), tName = title.querySelector('.n'), tDesc = title.querySelector('.d'), tGo = title.querySelector('.go');
  const select = (id) => {
    const c = AF.friends && AF.friends.byId[id]; if (!c) return;
    S.pick = id;
    grid.querySelectorAll('.pick').forEach((b) => b.classList.toggle('on', b.dataset.id === id));
    tName.textContent = c.name + ' \u00b7 ' + c.tag; tDesc.textContent = c.blurb; tGo.textContent = 'Play as ' + c.name;
  };
  const buildTitle = () => {
    const cast = (AF.friends && AF.friends.cast) || [];
    grid.innerHTML = cast.map((c) => `<button class="pick" data-id="${c.id}">${UI.portrait(c.look)}<b>${esc(c.name)}</b></button>`).join('');
    let last = null; try { last = localStorage.getItem('portSolace.friend'); } catch (e) {}
    select(cast.find((c) => c.id === last) ? last : cast[0] && cast[0].id);
  };
  const start = () => {
    if (!AF.ready || !S.pick || !S.title) return;
    S.title = false; root.classList.remove('titling'); title.classList.add('out'); setTimeout(() => { if (!S.title) title.style.display = 'none'; }, 600);
    AF.friends.play(S.pick);
    const c = AF.friends.current;
    UI.toast(`Welcome home, ${c.name}! Your friends live along Friends Lane \u2014 go say hi.`, 5200);
    setTimeout(() => UI.toast(TOUCH ? 'Tap a prompt to talk, or to get into a car, a bike or a plane.' : 'Walk up to anyone \u2014 or any car \u2014 and press E. M for the map, Esc for the menu.', 5400), 5600);
  };
  grid.addEventListener('click', (e) => { const b = e.target.closest('.pick'); if (!b) return; if (S.pick === b.dataset.id && e.detail > 1) start(); else select(b.dataset.id); });
  tGo.addEventListener('click', start);
  UI.showTitle = () => { S.title = true; root.classList.add('titling'); title.style.display = ''; title.classList.remove('out'); toggleMenu(false); closeDlg(); if (AF.mode !== 'aerial') AF.setMode('aerial', { keep: true }); if (AF.flyTo) AF.flyTo(AF.PLAN.views[0].pos, AF.PLAN.views[0].target, 3); };
  UI.go = (id) => { if (id) select(id); start(); };
  root.classList.add('titling');

  // ------------------------------------------------------------------ menu / help / map
  const G = AF.GFX;
  const syncMenu = () => {
    menu.querySelectorAll('[data-k=gfx] button').forEach((b) => b.classList.toggle('on', b.dataset.v === G.tier));
    menu.querySelectorAll('[data-k=clock] button').forEach((b) => b.classList.toggle('on', (b.dataset.v === 'stop') === !!AF.time.paused));
    const hr = menu.querySelector('[data-k=hour]'); if (document.activeElement !== hr) hr.value = AF.time.hours.toFixed(2);
    menu.querySelector('[data-k=sens]').value = String(AF.lookSens());
  };
  const exitLock = () => { if (document.pointerLockElement) try { document.exitPointerLock(); } catch (e) {} };
  const toggleMenu = (on) => { S.menu = on ?? !S.menu; if (S.menu) { syncMenu(); S.help = false; S.map = false; mapEl.classList.remove('open'); help.classList.remove('open'); exitLock(); } menu.classList.toggle('open', S.menu); };
  const toggleHelp = (on) => { S.help = on ?? !S.help; help.classList.toggle('open', S.help); if (S.help) { S.menu = false; menu.classList.remove('open'); exitLock(); } };
  menu.addEventListener('click', (e) => {
    if (e.target === menu) { toggleMenu(false); return; }
    const b = e.target.closest('button'); if (!b) return;
    const seg = b.parentElement && b.parentElement.dataset.k;
    if (seg === 'gfx') { G.auto = false; G.set(b.dataset.v, 'menu'); try { localStorage.setItem('portSolace.gfx', b.dataset.v); } catch (er) {} }
    else if (seg === 'clock') AF.time.paused = b.dataset.v === 'stop';
    else if (b.dataset.k === 'resume') toggleMenu(false);
    else if (b.dataset.k === 'map') { toggleMenu(false); toggleMap(true); }
    else if (b.dataset.k === 'help') { toggleMenu(false); toggleHelp(true); }
    else if (b.dataset.k === 'switch') { toggleMenu(false); UI.showTitle(); }
    syncMenu();
  });
  menu.querySelector('[data-k=hour]').addEventListener('input', (e) => { AF.time.hours = +e.target.value; });
  menu.querySelector('[data-k=sens]').addEventListener('input', (e) => AF.setLookSens(e.target.value));
  help.addEventListener('click', (e) => { if (e.target === help || e.target.closest('[data-k=closehelp]')) toggleHelp(false); });
  right.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { if (b.dataset.k === 'menu') toggleMenu(); else if (b.dataset.k === 'map') toggleMap(); return; } if (e.target.closest('#h-mini')) toggleMap(true); });
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
      const cast = AF.friends ? AF.friends.cast : [], i = cast.findIndex((c) => c.id === S.pick);
      if (I.hit('Enter') || I.hit('Space')) start();
      if (cast.length && (I.hit('ArrowRight') || I.hit('KeyD'))) select(cast[(i + 1) % cast.length].id);
      if (cast.length && (I.hit('ArrowLeft') || I.hit('KeyA'))) select(cast[(i - 1 + cast.length) % cast.length].id);
    } else {
      if (I.hit('KeyM')) toggleMap();
      if (I.hit('KeyH') || I.hit('Slash')) toggleHelp();
      if (I.hit('Escape')) { if (S.map || S.help) { toggleMap(false); toggleHelp(false); } else if (S.dlg) closeDlg(); else if (AF.mode === 'walk' || AF.mode === 'aerial') toggleMenu(); }
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
