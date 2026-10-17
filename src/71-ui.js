// ================================================================ 71-ui.js
try {
// ===== 71-ui: title + character select, HUD (clock, place, minimap), prompt, toasts, dialogue, speech bubbles, menu, map, help  (OWNER: player) =====
{
  const UI = AF.ui = AF.ui || {};
  const root = document.getElementById('ui');
  const h = (tag, cls, html, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; (parent || root).appendChild(e); return e; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const icons = { map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>', full: '<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>', me: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3"/>', in: '<path d="M5 12h14M12 5v14"/>', out: '<path d="M5 12h14"/>', close: '<path d="m6 6 12 12M18 6 6 18"/>' };
  UI.icon = name => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (icons[name] || icons.full) + '</svg>';
  const TOUCH = AF.touch = matchMedia('(pointer: coarse)').matches || ('ontouchstart' in window && navigator.maxTouchPoints > 0);
  if (TOUCH) root.classList.add('touch');

  // ------------------------------------------------------------------ style
  const css = `
  #ui{font:13px/1.4 var(--font);color:var(--ink);-webkit-font-smoothing:antialiased}
  #ui .panel{box-sizing:border-box;background:var(--bg);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border:1px solid var(--line);border-radius:var(--r)}
  #ui.touch .panel{backdrop-filter:none;-webkit-backdrop-filter:none}
  #ui button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
  #ui button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}
  #ui .round svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
  #ui .btn{padding:8px 14px;border-radius:8px;background:rgba(255,255,255,.06);transition:background .18s}
  #ui .btn:hover{background:rgba(255,255,255,.12)}
  #ui .btn.primary{background:var(--accent);color:#112723;font-weight:600}
  #ui kbd{display:inline-block;min-width:16px;padding:1px 5px;border-radius:4px;background:rgba(255,255,255,.1);font:500 11px var(--font);text-align:center}
  #ui .hide{display:none!important}
  #ui #t-title{position:absolute;inset:0;display:flex;flex-direction:column;align-items:flex-end;justify-content:center;padding:max(24px,4vh) max(28px,5vw) max(20px,env(safe-area-inset-bottom));pointer-events:none;background:none;transition:opacity .6s}
  #ui #t-title:before{content:'';position:absolute;inset:0;pointer-events:none;background:linear-gradient(90deg,rgba(5,10,16,0) 30%,rgba(5,10,16,.5) 100%),linear-gradient(0deg,rgba(5,10,16,.55),rgba(5,10,16,0) 34%),linear-gradient(180deg,rgba(5,10,16,.45),rgba(5,10,16,0) 26%)}
  #ui #t-title .fade{position:absolute;inset:0;background:#04080d;opacity:1;transition:opacity .45s ease;pointer-events:none}
  #ui #t-title.out{opacity:0}
  #ui #t-title .logo{position:absolute;z-index:1;top:max(4vh,18px);left:max(28px,5vw);text-align:left}
  #ui #t-title h1{margin:0;font:400 46px/1.1 Limelight,Georgia,serif;color:var(--ink)}
  #ui #t-title .sub{margin-top:8px;color:var(--dim);font-size:13px}
  #ui #t-title .modal{pointer-events:auto;width:min(380px,92vw);max-height:100%;padding:16px 16px 20px;display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;z-index:0;overflow:hidden;background:none;border:1px solid rgba(255,255,255,.12);border-radius:22px;backdrop-filter:none;-webkit-backdrop-filter:none;box-shadow:0 18px 50px rgba(0,0,0,.3);animation:uiIn .18s ease}
  #ui #t-title .q{font-size:12px;color:var(--dim);text-align:center}
  #ui #t-title .stage{position:relative;z-index:-1;width:100%;height:min(42vh,340px);min-height:190px;margin:6px 0 4px;border-radius:16px;overflow:visible;background:none;cursor:grab;touch-action:none;box-shadow:0 0 0 900px rgba(10,16,24,.5)}
  #ui #t-title .arr{position:absolute;top:50%;transform:translateY(-50%);width:36px;height:36px;border-radius:50%;background:var(--bg);font-size:26px;line-height:1;display:grid;place-items:center;color:var(--ink);transition:background .18s}
  #ui #t-title .arr:hover{background:rgba(255,255,255,.16)}
  #ui #t-title .arr.l{left:10px} #ui #t-title .arr.r{right:10px}
  #ui #t-title .cnt{position:absolute;right:12px;top:10px;font-size:11px;color:var(--dim)}
  #ui #t-title .n{font-size:24px;font-weight:600;color:var(--ink);text-align:center}
  #ui #t-title .tg{font-size:11px;color:var(--accent);text-align:center}
  #ui #t-title .d{color:var(--ink);opacity:.85;font-size:14px;text-align:center;min-height:38px;max-width:420px}
  #ui #t-title .dots{display:flex;gap:7px;margin:6px 0 10px}
  #ui #t-title .dots button{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.22);padding:0}
  #ui #t-title .dots button.on{background:var(--accent)}
  #ui #t-title .go{padding:11px 24px;font-size:14px;display:inline-flex;align-items:center;gap:10px;border-radius:999px}
  #ui #t-title .go .ic{font-size:11px}
  @media (orientation:portrait) and (max-width:760px){#ui #t-title{align-items:center;justify-content:flex-end;padding-top:max(88px,12vh)} #ui #t-title .logo{left:0;right:0;text-align:center} #ui #t-title:before{background:linear-gradient(0deg,rgba(5,10,16,.7),rgba(5,10,16,0) 60%),linear-gradient(180deg,rgba(5,10,16,.5),rgba(5,10,16,0) 25%)}}
  @media (orientation:landscape) and (max-height:560px){
    #ui #t-title{padding:10px max(14px,env(safe-area-inset-right)) 10px max(14px,env(safe-area-inset-left));align-items:flex-end}
    #ui #t-title .logo{top:12px;left:max(18px,env(safe-area-inset-left))} #ui #t-title h1{font-size:22px} #ui #t-title .sub{display:none}
    #ui #t-title .modal{display:grid;grid-template-columns:minmax(150px,44%) 1fr;grid-template-rows:auto auto auto 1fr auto auto;column-gap:14px;row-gap:2px;width:min(640px,72vw);max-height:calc(100vh - 20px);padding:10px 12px;align-items:center}
    #ui #t-title .modal>.stage{grid-column:1;grid-row:1/7;height:calc(100vh - 42px);max-height:320px;min-height:0;margin:0}
    #ui #t-title .modal>:not(.stage){grid-column:2;justify-self:center}
    #ui #t-title .q{grid-row:1} #ui #t-title .n{grid-row:2;font-size:22px} #ui #t-title .tg{grid-row:3} #ui #t-title .d{grid-row:4;font-size:13px;min-height:0} #ui #t-title .dots{grid-row:5;margin:4px 0} #ui #t-title .go{grid-row:6;padding:11px 22px;font-size:15px}
  }
  #ui.titling .hud,#ui.cine .hud,#ui.cine #h-toasts{display:none!important}
  #ui.mapping .hud,#ui.mapping #h-toasts,#ui.mapping .bubble,#ui.mapping #h-dlg{display:none!important}
  /* the HUD (GTA-style, minimal): minimap + health bottom-left with the notification feed above it, help text top-left, cash /
     wanted / weapon top-right, objective + subtitles bottom-centre, timer bars / speed / location bottom-right */
  #ui .hd{background:var(--hud);border-radius:3px;box-shadow:0 2px 10px rgba(0,0,0,.28)}
  #ui #h-mm{position:absolute;left:max(18px,env(safe-area-inset-left));bottom:max(16px,env(safe-area-inset-bottom));width:236px;display:flex;flex-direction:column;gap:5px}
  #ui #h-mini{position:relative;width:100%;height:150px;border-radius:5px;overflow:hidden;padding:0;cursor:pointer;border:2px solid rgba(6,8,12,.85);box-shadow:0 3px 16px rgba(0,0,0,.42);box-sizing:border-box}
  #ui #h-mini canvas{width:100%;height:100%;display:block}
  #ui #h-mini .n{position:absolute;left:50%;top:4px;transform:translateX(-50%);width:16px;height:16px;border-radius:50%;background:rgba(6,8,12,.78);display:grid;place-items:center;font:700 9px var(--font);color:#fff}
  #ui #h-btns{position:absolute;left:calc(100% + 6px);bottom:11px;display:flex;flex-direction:column;gap:5px}
  #ui .round{width:30px;height:30px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:15px}
  #ui #h-btns .round{background:var(--hud);border:0;opacity:.72;transition:opacity .15s;backdrop-filter:none;-webkit-backdrop-filter:none} #ui #h-btns .round:hover{opacity:1}
  #ui #h-right{position:absolute;right:max(20px,env(safe-area-inset-right));top:max(14px,env(safe-area-inset-top));display:flex;flex-direction:column;align-items:flex-end;gap:3px;text-shadow:0 1px 2px rgba(0,0,0,.95),0 0 8px rgba(0,0,0,.5)}
  #ui #h-tl{position:absolute;left:max(18px,env(safe-area-inset-left));top:max(16px,env(safe-area-inset-top));display:flex;flex-direction:column;align-items:flex-start;gap:6px;max-width:min(400px,calc(100% - 300px))}
  #ui #h-prompt{padding:9px 14px 9px 10px;display:none;font-size:14px;align-items:center;gap:10px;color:#fff;cursor:pointer}
  #ui #h-prompt b,#ui .key{display:inline-grid;place-items:center;min-width:24px;height:24px;padding:0 6px;box-sizing:border-box;border-radius:4px;background:#f2f4f5;color:#111;font:700 12px var(--font);box-shadow:0 1px 0 rgba(0,0,0,.4)}
  #ui #h-hint{padding:8px 12px;font-size:12px;line-height:1.45;color:#e6e9eb;display:none}
  #ui #h-hint.help{font-size:13.5px;color:#fff;padding:10px 14px}
  #ui #h-toasts{position:absolute;left:max(18px,env(safe-area-inset-left));bottom:calc(max(16px,env(safe-area-inset-bottom)) + 172px);width:300px;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;pointer-events:none}
  #ui .nt{position:relative;display:flex;gap:9px;align-items:flex-start;padding:8px 12px 9px 13px;background:var(--hud);border-radius:3px;color:#f2f4f5;font-size:13px;line-height:1.35;box-shadow:0 2px 10px rgba(0,0,0,.3);animation:ntIn .24s cubic-bezier(.2,.8,.3,1);transition:opacity .3s,transform .3s;--nc:#9cc8ff}
  #ui .nt:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:3px 0 0 3px;background:var(--nc)}
  #ui .nt .ic{flex:none;width:30px;height:30px;border-radius:4px;overflow:hidden;display:grid;place-items:center;background:rgba(255,255,255,.07);color:var(--nc)}
  #ui .nt .ic svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round} #ui .nt .ic.pt svg{width:100%;height:100%}
  #ui .nt .tx{min-width:0;overflow-wrap:anywhere} #ui .nt .tx b{display:block;font-size:10.5px;letter-spacing:1.1px;text-transform:uppercase;color:var(--nc);margin-bottom:1px;font-weight:700}
  #ui .nt .x{position:absolute;right:7px;top:5px;font-size:10px;color:var(--gold);font-weight:700}
  #ui .nt.out{opacity:0;transform:translateX(-14px)} #ui .nt.bump{animation:ntBump .3s}
  #ui .nt.k-ok,#ui .nt.k-money{--nc:#7ddc8a} #ui .nt.k-warn,#ui .nt.k-mission{--nc:#f5c542} #ui .nt.k-bad{--nc:#ff7a6a} #ui .nt.k-radio{--nc:#8bd8c3} #ui .nt.k-pet{--nc:#ff9ad2} #ui .nt.k-inv{--nc:#c9a7ff}
  @keyframes ntIn{from{opacity:0;transform:translateX(-26px)}to{opacity:1;transform:none}}
  @keyframes ntBump{50%{transform:scale(1.03)}}
  @keyframes uiIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
  #ui #h-br{position:absolute;right:max(20px,env(safe-area-inset-right));bottom:max(16px,env(safe-area-inset-bottom));display:flex;flex-direction:column;align-items:flex-end;gap:7px;max-width:46vw}
  #ui #h-clock{display:flex;flex-direction:column;align-items:flex-end;gap:0;text-align:right;text-shadow:0 1px 2px rgba(0,0,0,.95),0 0 10px rgba(0,0,0,.55);transition:opacity .8s;max-width:100%}
  #ui #h-clock .p{font-size:19px;font-weight:700;letter-spacing:.2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
  #ui #h-clock .k{font-size:10px;letter-spacing:1.6px;text-transform:uppercase;color:var(--gold);min-height:13px}
  #ui #h-clock .t{font-size:13px;font-weight:600;opacity:.9;font-variant-numeric:tabular-nums;white-space:nowrap}
  #ui #h-clock .t small{font-size:10px;margin-left:2px} #ui #h-clock .st{font-size:11px;color:var(--gold);opacity:.85}
  #ui #h-clock.dim{opacity:.5}
  #ui #h-speed{padding:7px 12px;display:none;text-align:right;min-width:96px}
  #ui #h-speed .v{font-size:24px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums} #ui #h-speed .v small{font-size:11px;color:var(--dim);margin-left:4px;font-weight:500}
  #ui #h-speed .s{font-size:11px;color:var(--dim);margin-top:3px;max-width:240px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #ui #h-speed .bar{height:3px;border-radius:3px;background:rgba(255,255,255,.12);margin-top:5px;overflow:hidden} #ui #h-speed .bar i{display:block;height:100%;background:var(--gold)}
  #ui #h-rot{display:none;position:absolute;inset:0;z-index:30;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:var(--bg2);color:var(--ink);font-size:15px}
  #ui #h-rot svg{width:64px;height:64px;fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round;animation:uiRot 2.4s ease-in-out infinite}
  @keyframes uiRot{0%,20%{transform:rotate(0)}50%,80%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
  @media (orientation:portrait){#ui.touch:not(.titling):not(.portraitok):not(.mapping) #h-rot{display:flex}}
  #ui #h-banner{display:none}
  #ui #h-dlg{position:absolute;left:50%;bottom:calc(max(16px,env(safe-area-inset-bottom)) + 64px);transform:translateX(-50%);width:min(660px,calc(100% - 560px));min-width:min(420px,calc(100% - 32px));box-sizing:border-box;padding:10px 18px 20px 64px;display:none;min-height:62px;cursor:pointer;text-align:left;
    background:linear-gradient(90deg,rgba(4,6,10,0),rgba(4,6,10,.62) 12%,rgba(4,6,10,.62) 88%,rgba(4,6,10,0));text-shadow:0 1px 2px #000}
  #ui #h-dlg .face{position:absolute;left:18px;top:11px;width:38px;height:38px;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.08);box-shadow:0 0 0 2px rgba(255,255,255,.12)}
  #ui #h-dlg .face svg{width:100%;height:100%}
  #ui #h-dlg .nm{font-weight:700;color:var(--gold);font-size:12px;letter-spacing:1px;text-transform:uppercase} #ui #h-dlg .rl{font-size:11px;color:var(--dim);margin-left:6px}
  #ui #h-dlg .ln{font-size:15px;margin-top:2px;min-height:20px;color:#fff}
  #ui #h-dlg .more{position:absolute;right:20px;bottom:4px;font-size:10px;color:var(--dim);letter-spacing:.5px}
  #ui .bubble{position:absolute;left:0;top:0;transform:translate(-50%,-100%);padding:6px 10px;border-radius:4px;background:var(--hud);color:var(--ink);font-size:12px;max-width:240px;text-align:center;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.3)}
  #ui .bubble b{display:block;font-size:10px;color:var(--gold);margin-bottom:2px;letter-spacing:.6px;text-transform:uppercase}
  #ui .sheet{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:radial-gradient(ellipse at center,rgba(4,8,12,.35),rgba(2,4,8,.72));padding:16px;z-index:10}
  #ui.paused .hud,#ui.paused #h-toasts,#ui.paused #h-shard{display:none!important}
  #ui .sheet.open{display:flex}
  #ui .sheet>.panel{background:rgba(9,11,15,.95);width:min(460px,100%);max-height:100%;overflow:auto;padding:18px 22px 20px;border-radius:6px;border:1px solid rgba(255,255,255,.07);scrollbar-width:thin;scrollbar-color:rgba(255,255,255,.16) transparent;animation:uiIn .14s ease;box-shadow:0 24px 60px rgba(0,0,0,.5)}
  #ui .sheet>.panel::-webkit-scrollbar{width:6px} #ui .sheet>.panel::-webkit-scrollbar-thumb{background:rgba(255,255,255,.16);border-radius:6px} #ui .sheet>.panel::-webkit-scrollbar-track{background:transparent}
  #ui .sheet h2{margin:0 0 10px;padding-bottom:8px;font:400 22px/1.1 Limelight,Georgia,serif;letter-spacing:1px;color:#fff;border-bottom:2px solid var(--gold)}
  #ui .sheet h4{margin:16px 0 2px;font:700 10px var(--font);letter-spacing:1.6px;text-transform:uppercase;color:var(--gold);opacity:.9}
  #ui .row{display:flex;align-items:center;gap:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)}
  #ui .row label{flex:1;color:var(--ink);opacity:.86}
  #ui .row label small{color:var(--dim);margin-left:4px}
  #ui .seg{display:flex;background:rgba(255,255,255,.05);border-radius:4px;padding:2px}
  #ui .seg button{padding:5px 9px;border-radius:3px;font-size:12px;color:var(--dim);transition:color .12s,background .12s} #ui .seg button.on{background:rgba(255,255,255,.12);color:#fff}
  #ui input[type=range]{flex:1.2;min-width:0;accent-color:var(--gold);height:4px}
  #ui .stack{display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:16px} #ui .stack .primary{grid-column:1/-1;padding:10px 14px}
  #ui #m-help>.panel{width:min(600px,100%)}
  #ui #m-help .cols{display:grid;grid-template-columns:1fr 1fr;gap:4px 22px}
  #ui #m-help h3{margin:10px 0 6px;font-size:11px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:var(--gold)}
  #ui #m-help .k{display:flex;justify-content:space-between;gap:10px;font-size:13px;padding:2px 0}
  @media (max-width:520px){#ui #m-help .cols{grid-template-columns:1fr}}
  @media(max-width:480px){#ui #t-title h1{font-size:30px}#ui .row{flex-wrap:wrap}#ui .sheet{padding:max(12px,env(safe-area-inset-top)) 12px max(12px,env(safe-area-inset-bottom))}}
  @media (max-width:900px){#ui #h-dlg{width:min(620px,calc(100% - 32px))}}
  /* phones + tablets: the stick lives bottom-left and the action cluster bottom-right, so the map + feed go top-left */
  #ui.touch #h-mm{top:max(10px,env(safe-area-inset-top));bottom:auto;left:max(12px,env(safe-area-inset-left));width:150px}
  #ui.touch #h-mini{height:96px}
  #ui.touch #h-btns{top:0;bottom:auto;flex-direction:row}
  #ui.touch #h-toasts{top:calc(max(10px,env(safe-area-inset-top)) + 114px);bottom:auto;left:max(12px,env(safe-area-inset-left));width:min(290px,42vw)}
  #ui.touch #h-tl{left:auto;right:calc(max(14px,env(safe-area-inset-right)) + 170px);top:auto;bottom:calc(max(14px,env(safe-area-inset-bottom)) + 92px);align-items:flex-end;max-width:40vw}
  #ui.touch #h-hint{display:none!important}
  #ui.touch #h-br{top:calc(max(10px,env(safe-area-inset-top)) + 78px);bottom:auto;right:max(14px,env(safe-area-inset-right))}
  #ui.touch #h-speed{display:none!important}
  #ui.touch #h-clock .p{font-size:14px} #ui.touch #h-clock .t{font-size:11px}
  #ui.touch #h-dlg{bottom:calc(max(12px,env(safe-area-inset-bottom)) + 56px);width:min(520px,calc(100% - 300px));min-width:0;padding:8px 14px 18px 56px}
  @media (orientation:portrait) and (max-width:620px){#ui.touch #h-toasts{width:calc(100% - 24px)} #ui.touch #h-dlg{width:calc(100% - 24px);bottom:200px} #ui.touch #h-tl{right:14px;bottom:200px;max-width:70vw}}
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
  const mm = h('div', 'hud', `<div id="h-mini" class="pe"><canvas width="354" height="225"></canvas><div class="n">N</div></div><div id="h-btns">${TOUCH ? '<button class="round pe" data-k="full" title="Fullscreen">&#x26F6;</button>' : '<button class="round pe" data-k="map" title="Map (M)">&#x1F5FA;</button>'}<button class="round pe" data-k="menu" title="Menu (Esc)">&#9776;</button></div>`); mm.id = 'h-mm';
  const right = h('div', 'hud', ''); right.id = 'h-right';
  for (const button of mm.querySelectorAll('button')) { button.innerHTML = UI.icon(button.dataset.k); button.setAttribute('aria-label', button.title); }
  const miniButton = mm.querySelector('#h-mini'); miniButton.setAttribute('role', 'button'); miniButton.setAttribute('aria-label', 'Open world map'); miniButton.tabIndex = 0;
  miniButton.addEventListener('keydown', event => { if (event.code === 'Enter' || event.code === 'Space') { event.preventDefault(); UI.toggleMap(true); } });
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
  const tl = h('div', 'hud', ''); tl.id = 'h-tl';
  const prompt = h('div', 'hd pe', '', tl); prompt.id = 'h-prompt';
  const hint = h('div', 'hd', '', tl); hint.id = 'h-hint';
  const toasts = h('div', '', ''); toasts.id = 'h-toasts';
  const br = h('div', 'hud', ''); br.id = 'h-br';
  const bars = h('div', '', '', br); bars.id = 'h-bars';
  const speed = h('div', 'hd', `<div class="v"><span>0</span><small>mph</small></div><div class="s"></div><div class="bar hide"><i></i></div>`, br); speed.id = 'h-speed';
  const clock = h('div', '', `<div class="k"></div><div class="p">Port Solace</div><div class="t"><span class="tm">4:30</span><small class="ap">PM</small></div>`, br); clock.id = 'h-clock';
  const banner = h('div', '', `<div class="k"></div><div class="n"></div>`); banner.id = 'h-banner';
  const dlg = h('div', 'pe', `<div class="face"></div><div><span class="nm"></span><span class="rl"></span></div><div class="ln"></div><div class="more">${TOUCH ? 'tap' : 'E / click'} to continue</div>`); dlg.id = 'h-dlg';
  const bubbleEl = h('div', 'bubble', ''); bubbleEl.style.display = 'none';
  const menu = h('div', 'sheet pe', `<div class="panel"><h2>Paused</h2>
    <h4>Display</h4>
    <div class="row"><label>Graphics</label><div class="seg" data-k="gfx"><button data-v="low">Low</button><button data-v="lite" title="Default: Balanced without AO, god rays and MSAA">Standard</button><button data-v="high">Balanced</button><button data-v="ultra">High</button></div></div>
    <div class="row"><label>Resolution <small class="rv"></small></label><input data-k="resH" type="range" min="360" max="2160" step="60" title="Render height in device pixels (default 720p, 480p on phones)"></div>
    <div class="row"><label>View distance <small class="lv"></small></label><input data-k="lod" type="range" min="0.6" max="2.5" step="0.1" title="How far full-detail terrain, buildings and trees reach before the lower LODs"></div>
    <div class="row"><label>Shadows</label><div class="seg" data-k="shadows"><button data-v="off" title="Default on phones">Off</button><button data-v="low" title="Near shadows only">Low</button><button data-v="high">High</button></div></div>
    <div class="row"><label>Frame rate</label><div class="seg" data-k="fps"><button data-v="30" title="Default: smooth, cool and battery-friendly">30</button><button data-v="60">60</button><button data-v="0">Max</button></div></div>
    <div class="row"><label>Brightness</label><input data-k="bright" type="range" min="0.6" max="2" step="0.05"></div>
    <div class="row"><label></label><small class="rr" style="opacity:.6"></small></div>
    <h4>World</h4>
    <div class="row"><label>Time of day</label><input data-k="hour" type="range" min="0" max="23.95" step="0.05"></div>
    <div class="row"><label>Clock</label><div class="seg" data-k="clock"><button data-v="run">Running</button><button data-v="stop">Stopped</button></div></div>
    <h4>Controls</h4>
    <div class="row"><label>Look sensitivity</label><input data-k="sens" type="range" min="0.1" max="1.5" step="0.05"></div>
    <h4>Co-op &amp; sound</h4>
    <div class="stack"><button class="btn primary" data-k="resume">Resume</button><button class="btn" data-k="map">Map</button><button class="btn" data-k="help">Controls</button><button class="btn" data-k="switch">Switch friend</button></div></div>`); menu.id = 'm-menu';
  const help = h('div', 'sheet pe', ''); help.id = 'm-help';
  const K = (k, d) => `<div class="k"><span>${d}</span><span>${k.split('+').map((x) => '<kbd>' + x + '</kbd>').join(' ')}</span></div>`;
  help.innerHTML = `<div class="panel"><h2>Controls</h2>${TOUCH ? `<div class="cols"><div><h3>Moving</h3><div class="k"><span>Walk / drive / fly</span><span>left stick</span></div><div class="k"><span>Look around</span><span>drag the right side</span></div><div class="k"><span>Run</span><span>push the stick to its edge</span></div><div class="k"><span>Camera \u00b7 job \u00b7 bag</span><span>small buttons</span></div></div>
    <div><h3>Doing things</h3><div class="k"><span>Talk / get in / use</span><span>tap the prompt</span></div><div class="k"><span>Main action</span><span>big button (HIT, FIRE, BRAKE, THR\u2026)</span></div><div class="k"><span>More</span><span>buttons around it change with what you do</span></div><div class="k"><span>Crouch</span><span>CROUCH button</span></div><div class="k"><span>Next weapon</span><span>tap \u25b8 by its name (top right)</span></div><div class="k"><span>Weapon wheel</span><span>hold the weapon name, slide, lift</span></div><div class="k"><span>Get out</span><span>EXIT button</span></div><div class="k"><span>Map & menu</span><span>beside the minimap</span></div></div></div>`
    : `<div class="cols"><div><h3>On foot</h3>${K('W+A+S+D', 'Walk')}${K('Shift', 'Run')}${K('Space', 'Jump')}${K('Mouse', 'Look (click to capture)')}${K('E', 'Talk / get in / use')}${K('I', 'Bag: snacks, pet treats, job items')}${K('C', 'Crouch (toggle) \u00b7 sneak')}${K('V', 'Camera: first person / near / far')}${K('Tab', 'Aerial view')}</div>
    <div><h3>Fighting</h3>${K('Click+Q', 'Attack / shoot')}${K('Right-drag+Z', 'Aim (hold / toggle)')}${K('Wheel+1-5+X', 'Switch weapon (or the \u25b8 by its name)')}${K('Hold X', 'Weapon wheel')}${K('R', 'Reload')}<h3>Work</h3>${K('J', 'Start / quit a job (taxi, bus, van, fire engine, on foot: courier)')}</div>
    <div><h3>Driving & riding</h3>${K('W+S', 'Throttle / reverse')}${K('A+D', 'Steer')}${K('Space', 'Brake')}${K('H', 'Horn / bell')}${K('E+F', 'Get out')}<h3>Flying</h3>${K('Space+Shift', 'Throttle up / down (hold)')}${K('W+S', 'Nose up / down (I inverts)')}${K('A+D', 'Bank to turn / steer on the ground')}${K('Q+E', 'Rudder')}${K('X+B', 'Wheel brakes')}${K('F', 'Get out (on the ground) \u00b7 bail out (high)')}</div>
    <div><h3>From the sky</h3>${K('Drag', 'Rotate')}${K('Right-drag', 'Pan')}${K('Wheel', 'Zoom')}${K('Double-click', 'Land there')}<h3>Anywhere</h3>${K('M', 'Map')}${K('P', 'Photo mode')}${K('F1+?', 'Controls (this list)')}${K('Esc', 'Close what is open \u00b7 else the menu')}${K('Space', 'Skip a cutscene')}</div></div>`}
    <div class="stack"><button class="btn primary" data-k="closehelp">Got it</button></div></div>`;

  // ------------------------------------------------------------------ state + public api
  const S = UI.state = { title: true, map: false, help: false, menu: false, dlg: null, bannerB: null, bannerT: 0, hudT: -9, hud: null, toasts: [], pick: null };
  UI.titleOpen = () => S.title;
  UI.modalOpen = () => S.map || S.help || S.menu || S.title || !!S.shop || !!S.casino || !!S.inv || !!(AF.minigame && AF.minigame.open);
  UI.dialogueOpen = () => !!S.dlg;
  const show = (el, on, disp = 'block') => { const v = on ? disp : 'none'; if (el.style.display !== v) el.style.display = v; };
  const text = (el, value) => { value = String(value); if (el.textContent !== value) el.textContent = value; };
  const clockTime = clock.querySelector('.tm'), clockAP = clock.querySelector('.ap'), clockPlace = clock.querySelector('.p'), clockKind = clock.querySelector('.k'), speedValue = speed.querySelector('.v span'), speedName = speed.querySelector('.s'), speedBar = speed.querySelector('.bar');
  // ---- the notification feed (GTA's: above the minimap, newest at the bottom, max 4). notify(text | { title, text, kind, look,
  // icon, ms, key }): kinds info | ok | warn | bad | money | mission | radio | pet | inv. A repeat of a visible one refreshes it (×n).
  // "Name: “words”" strings become a message from that person (portrait when it's a friend or someone who passes a look).
  const NI = { info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5v.5"/>', ok: '<path d="m5 12 5 5 9-10"/>', warn: '<path d="M12 4 2.5 20h19L12 4zM12 10v4M12 17v.5"/>', bad: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    money: '<path d="M12 3v18M16.5 7.5c-1-1.4-2.6-2-4.5-2-2.5 0-4.4 1.3-4.4 3.2 0 4.6 9.4 2.4 9.4 7.1 0 2-2 3.2-4.6 3.2-2 0-3.8-.8-4.9-2.3"/>', mission: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>',
    radio: '<path d="M4 5h16v11H9l-5 4z"/>', pet: '<circle cx="7" cy="10" r="2"/><circle cx="12" cy="7" r="2"/><circle cx="17" cy="10" r="2"/><path d="M8 17c0-3 2-5 4-5s4 2 4 5c0 2-2 2.5-4 2.5S8 19 8 17z"/>', inv: '<path d="M5 8h14l-1 12H6zM9 8V6a3 3 0 0 1 6 0v2"/>' };
  const RADIO = /^([A-Z][\w .'\u2019-]{0,28}):\s*[\u201c"](.+)[\u201d"]$/;
  UI.notify = (o, ms) => {
    if (!o) return;
    if (typeof o !== 'object') o = { text: String(o) };
    let title = o.title || '', body = String(o.text || ''), kind = o.kind || '', look = o.look || null;
    const m = !title && RADIO.exec(body);
    if (m) { title = m[1]; body = m[2]; kind = kind || 'radio'; }
    if (!kind) kind = /^\$|\+\$|\$\d/.test(body) ? 'money' : /^(Not enough|No |Too |Can.t|You can.t|Wait)/.test(body) ? 'warn' : 'info';
    if (kind === 'radio' && !look) { const fr = AF.friends && AF.friends.byId[title.toLowerCase()]; if (fr) look = fr.look; else if (UI.lookOf) look = UI.lookOf(title); }
    const key = o.key || title + '|' + body, now = performance.now(), life = o.ms || ms || AF.clamp(2600 + body.length * 45, 3200, 8500);
    const same = S.toasts.find((t) => t.key === key && !t.gone);
    if (same) { same.until = now + life; same.n++; same.x.textContent = '\u00d7' + same.n; same.el.classList.remove('bump'); void same.el.offsetWidth; same.el.classList.add('bump'); return; }
    const icon = look ? '<div class="ic pt">' + UI.portrait(look) + '</div>' : '<div class="ic"><svg viewBox="0 0 24 24">' + (NI[o.icon] || NI[kind] || NI.info) + '</svg></div>';
    const el = h('div', 'nt k-' + kind, icon + '<div class="tx">' + (title ? '<b>' + esc(title) + '</b>' : '') + esc(body) + '</div><span class="x"></span>', toasts);
    S.toasts.push({ el, x: el.lastChild, key, until: now + life, n: 1, gone: false });
    let live = 0; for (let i = S.toasts.length - 1; i >= 0; i--) { const t = S.toasts[i]; if (t.gone) continue; if (++live > 4) { t.gone = true; t.until = 0; t.el.classList.add('out'); } }
    if (AF.audio && AF.audio.ctxOk && AF.audio.ctxOk() && (kind === 'bad' || kind === 'mission' || kind === 'pet')) AF.audio.play(kind === 'bad' ? 'ui_alert' : 'ui_open', { vol: 0.3 });
  };
  UI.toast = UI.notify;
  AF.on('toast', (t) => UI.notify(t));
  AF.toast = (msg) => AF.emit('toast', msg);
  // ---- help text (top-left): the 'hint' event is the controls line of the current mode; UI.help(text, ms) a timed tutorial tip
  const HP = { hint: '', tip: '', until: 0 };
  const helpPaint = () => { const tip = HP.tip && performance.now() < HP.until; const v = tip ? HP.tip : TOUCH ? '' : HP.hint; if (hint._v !== v) { hint._v = v; hint.innerHTML = v; hint.classList.toggle('help', !!tip); } show(hint, !!v); };
  const keyed = (s) => esc(s).replace(/\[([^\]]{1,12})\]/g, '<span class="key">$1</span>');
  AF.on('hint', (t) => { HP.hint = t ? esc(t) : ''; helpPaint(); });
  UI.help = (t, ms = 6000) => { HP.tip = t ? keyed(t) : ''; HP.until = performance.now() + ms; helpPaint(); };
  // ---- location (bottom-right): building or area name, a kind line, the time; it dims after a few seconds unless it changes
  const KIND = { shop: 'Shop', civic: 'Civic building', home: 'Residence', house: 'Home', station: 'Station', church: 'Chapel', school: 'School', diner: 'Diner', cinema: 'Picture house', hotel: 'Hotel', zoo: 'Zoo', airport: 'Airfield', club: 'Club', pets: 'Pet store' };
  const LOC = { place: '', kind: '', t: 0 };
  const locate = (place, kind) => { if (place === LOC.place && kind === LOC.kind) return; LOC.place = place; LOC.kind = kind; LOC.t = performance.now(); text(clockPlace, place); text(clockKind, kind); clock.classList.remove('dim'); };
  UI.banner = (name, kind) => locate(name, kind ? (KIND[kind] || String(kind).replace(/[-_]/g, ' ')) : '');
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
  let bubbleW = innerWidth, bubbleH = innerHeight;
  const bubbleResize = () => { bubbleW = innerWidth; bubbleH = innerHeight; };
  addEventListener('resize', bubbleResize);
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
    const left = Math.round((BV.x + 1) / 2 * bubbleW) + 'px', top = Math.round((1 - BV.y) / 2 * bubbleH) + 'px';
    if (bubbleEl.style.left !== left) bubbleEl.style.left = left; if (bubbleEl.style.top !== top) bubbleEl.style.top = top; show(bubbleEl, true);
  };

  // ------------------------------------------------------------------ title: pick your friend (modal, alphabetical, live 3D turntable)
  const tName = title.querySelector('.n'), tTag = title.querySelector('.tg'), tDesc = title.querySelector('.d'), tGo = title.querySelector('.go'), tDots = title.querySelector('.dots'), tCnt = title.querySelector('.cnt');
  const roster = () => ((AF.friends && AF.friends.cast) || []).slice().sort((a, b) => a.name.localeCompare(b.name));
  UI.roster = roster;
  // drawn by the main renderer into the stage's screen rect after each frame (no second WebGL context)
  const stage = title.querySelector('.stage');
  const PV = { scene: null, cam: null, P: null, st: { phase: 0, speed: 0, air: 0, t: 0, land: 0 }, yaw: 0.4, drag: null, pop: 1, aspect: 0, rect: null, canvasRect: null, size: new THREE.Vector2(), rt: null, blit: null };
  const previewResize = () => { PV.rect = stage.getBoundingClientRect(); PV.canvasRect = AF.renderer.domElement.getBoundingClientRect(); };
  addEventListener('resize', previewResize);
  const previewObserver = new ResizeObserver(previewResize); previewObserver.observe(stage); previewObserver.observe(title.querySelector('.modal')); previewObserver.observe(AF.renderer.domElement);
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
    if (PV.P) { PV.scene.remove(PV.P.root); AF.avatar.release(PV.P); }
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
  // own target (depth + MSAA, drawing-buffer px) + one quad: never shares the world's depth/scissor (phones draw straight to the MSAA screen)
  const pvBlit = () => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]), 2));
    geo.setIndex([0, 2, 1, 2, 3, 1]);
    const mat = new THREE.ShaderMaterial({
      uniforms: { tMap: { value: null }, uSize: { value: new THREE.Vector2(1, 1) }, uR: { value: 16 } }, depthTest: false, depthWrite: false, toneMapped: true,
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
      // rounded corners: the card's CSS radius, in drawing-buffer pixels
      fragmentShader: 'uniform sampler2D tMap; uniform vec2 uSize; uniform float uR; varying vec2 vUv; void main(){ vec2 q = abs(vUv * uSize - 0.5 * uSize) - (0.5 * uSize - uR); if (length(max(q, 0.0)) > uR) discard; gl_FragColor = vec4(texture2D(tMap, vUv).rgb, 1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}',
    });
    const quad = new THREE.Mesh(geo, mat); quad.frustumCulled = false;
    const sc = new THREE.Scene(); sc.add(quad);
    return { sc, cam: new THREE.Camera(), pos: geo.attributes.position, mat };
  };
  const pvTarget = (W, H) => {
    if (PV.rt && PV.rt.width === W && PV.rt.height === H) return PV.rt;
    if (PV.rt) { PV.rt.setSize(W, H); return PV.rt; }
    const R = AF.renderer, half = !!AF.gfx.halfFloatTargets;
    PV.rt = new THREE.WebGLRenderTarget(W, H, { type: half ? THREE.HalfFloatType : THREE.UnsignedByteType, samples: R.capabilities.isWebGL2 ? 4 : 0 });
    if (!half && R.capabilities.isWebGL2) PV.rt.texture.colorSpace = THREE.SRGBColorSpace;   // 8-bit fallback: sRGB storage, no banding
    PV.rt.texture.name = 'af.title.preview';
    return PV.rt;
  };
  const pvRelease = () => { if (PV.rt) { PV.rt.dispose(); PV.rt = null; } };
  AF.afterFrame = () => {
    if (!S.title || !PV.P) return;
    if (!PV.rect) previewResize();
    const R = AF.renderer, cr = PV.canvasRect, r = PV.rect;
    R.getSize(PV.size);
    const k = PV.size.x / (cr.width || 1), w = r.width * k, hh = r.height * k;
    if (w < 2 || hh < 2) return;
    const x = (r.left - cr.left) * k, y = (r.top - cr.top) * k, pr = R.getPixelRatio();
    if (PV.aspect !== w / hh) { PV.aspect = w / hh; PV.cam.aspect = PV.aspect; PV.cam.updateProjectionMatrix(); }
    const rt = pvTarget(Math.max(1, Math.round(w * pr)), Math.max(1, Math.round(hh * pr)));
    const B = PV.blit || (PV.blit = pvBlit());
    const X0 = x / PV.size.x * 2 - 1, X1 = (x + w) / PV.size.x * 2 - 1, Y0 = 1 - y / PV.size.y * 2, Y1 = 1 - (y + hh) / PV.size.y * 2, p = B.pos.array;
    if (p[0] !== X0 || p[1] !== Y0 || p[3] !== X1 || p[7] !== Y1) { p[0] = p[6] = X0; p[3] = p[9] = X1; p[1] = p[4] = Y0; p[7] = p[10] = Y1; B.pos.needsUpdate = true; }
    B.mat.uniforms.tMap.value = rt.texture; B.mat.uniforms.uSize.value.set(w, hh); B.mat.uniforms.uR.value = 16 * k;
    const prev = R.getRenderTarget(), sct = R.getScissorTest(), ac = R.autoClear, tm = R.toneMapping, ex = R.toneMappingExposure;
    try {
      R.setScissorTest(false); R.autoClear = false;
      R.setRenderTarget(rt); R.clear(true, true, false); R.render(PV.scene, PV.cam);
      R.setRenderTarget(null); R.toneMapping = THREE.ACESFilmicToneMapping; R.toneMappingExposure = 1.2;
      R.render(B.sc, B.cam);
    } finally {
      R.setScissorTest(sct); R.autoClear = ac; R.toneMapping = tm; R.toneMappingExposure = ex; R.setRenderTarget(prev);
    }
  };
  AF.test('ui: title preview uses the main renderer', () => {
    const extra = title.querySelectorAll('canvas').length, has = !!(PV.P && PV.P.root.parent === PV.scene);
    if (S.title && has) { previewResize(); AF.afterFrame(); }
    const pr = AF.renderer.getPixelRatio(), r = PV.rect, rt = PV.rt;
    const sized = !S.title || !has || !r || r.width < 2 || !!(rt && Math.abs(rt.width - r.width * pr) <= 1 && Math.abs(rt.height - r.height * pr) <= 1);
    return { ok: extra === 0 && !('r' in PV) && (!S.title || has) && sized, info: 'stage canvases ' + extra + ', title ' + (S.title ? 'open, avatar ' + has + ', target ' + (rt ? rt.width + 'x' + rt.height + ' @' + pr.toFixed(2) : 'none') : 'closed') };
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
    pvRelease();
    if (TOUCH) goFull();
    AF.input.requestLock();
    AF.friends.play(S.pick);
    const c = AF.friends.current;
    UI.notify({ title: 'Port Solace', text: `Welcome home, ${c.name}! Your friends live along Friends Lane \u2014 go say hi.`, kind: 'ok', ms: 6000 });
    setTimeout(() => UI.help(TOUCH ? 'Tap a prompt to talk, or to get into a car, a bike or a plane.' : 'Walk up to anyone \u2014 or any car \u2014 and press [E]. [M] map \u00b7 [I] bag \u00b7 [F1] controls \u00b7 [Esc] menu', 9000), 1200);
  };
  tDots.addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) select(b.dataset.id); });
  title.querySelector('.arr.l').addEventListener('click', () => step(-1));
  title.querySelector('.arr.r').addEventListener('click', () => step(1));
  tGo.addEventListener('click', start);
  UI.start = start; UI.pick = () => S.pick;
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
    const CV = { i: 0, t: 0, p: new THREE.Vector3(), q: new THREE.Vector3(), focus: { x: 0, z: 0 } };
    const ease = (k) => k * k * (3 - 2 * k);
    // the last seconds of a shot stream the next one (AF.stream.focus), so the cut shows meshes already built and uploaded
    // instead of hitching on a burst of first draws
    const unfocus = () => { if (AF.stream.focus === CV.focus) AF.stream.focus = null; };
    AF.modes.cine = {
      enter() { CV.t = 0; },
      exit() { fadeEl.style.opacity = 0; unfocus(); },
      update(dt) {
        let s = SHOTS[CV.i];
        CV.t += Math.min(dt, 0.1);
        if (CV.t > s[4]) { CV.i = (CV.i + 1) % SHOTS.length; CV.t = 0; s = SHOTS[CV.i]; unfocus(); }
        if (CV.t > s[4] - 4.5 && AF.preloaded && !AF.stream.loading) { const n = SHOTS[(CV.i + 1) % SHOTS.length]; CV.focus.x = n[0][0] * 0.6 + n[1][0] * 0.4; CV.focus.z = n[0][2] * 0.6 + n[1][2] * 0.4; AF.stream.focus = CV.focus; }
        const fade = CV.t < 0.35 || CV.t > s[4] - 0.45 ? '1' : '0'; if (fadeEl.style.opacity !== fade) fadeEl.style.opacity = fade;
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
    menu.querySelectorAll('[data-k=shadows] button').forEach((b) => b.classList.toggle('on', b.dataset.v === AF.shadowQ));
    const resH = menu.querySelector('[data-k=resH]'), native = Math.max(360, Math.ceil((innerHeight || 720) * (devicePixelRatio || 1) / 60) * 60), rv = String(Math.min(native, G.resH || native));
    if (resH.max !== String(native)) resH.max = String(native); if (document.activeElement !== resH && resH.value !== rv) resH.value = rv;
    text(menu.querySelector('.rv'), (G.resH ? Math.min(native, G.resH) + 'p' : 'native'));
    const lod = menu.querySelector('[data-k=lod]'), lv = String(AF.lodScale || 1); if (AF.MOBILE && lod.max !== '1.5') lod.max = '1.5'; if (document.activeElement !== lod && lod.value !== lv) lod.value = lv;
    text(menu.querySelector('.lv'), '\u00d7' + (+lv).toFixed(1));
    const cv = AF.renderer.domElement, pr = AF.renderer.getPixelRatio(), rp = AF.renderPR(), rw = Math.round(cv.width * rp / pr), rh = Math.round(cv.height * rp / pr);
    text(menu.querySelector('.rr'), `Render ${rw}\u00d7${rh}${pr > rp * 1.02 ? ' \u2192 ' + cv.width + '\u00d7' + cv.height + ' upscaled' : devicePixelRatio > pr + 0.01 ? ' (' + Math.round(pr / devicePixelRatio * 100) + '% of display)' : ''}${G.auto ? ' \u00b7 auto ' + G.name : ''}`);
    menu.querySelectorAll('[data-k=clock] button').forEach((b) => b.classList.toggle('on', (b.dataset.v === 'stop') === !!AF.time.paused));
    const hr = menu.querySelector('[data-k=hour]'), hour = AF.time.hours.toFixed(2); if (document.activeElement !== hr && hr.value !== hour) hr.value = hour;
    const sens = menu.querySelector('[data-k=sens]'), sv = String(AF.lookSens()), bright = menu.querySelector('[data-k=bright]'), bv = String(AF.brightness ?? 1);
    if (sens.value !== sv) sens.value = sv; if (bright.value !== bv) bright.value = bv;
    menu.querySelectorAll('[data-k=fps] button').forEach((b) => b.classList.toggle('on', +b.dataset.v === AF.fpsCap));
  };
  const exitLock = () => AF.input.releaseLock();
  const toggleMenu = (on, resume = true) => { S.menu = on ?? !S.menu; if (S.menu) { syncMenu(); S.help = false; if (S.map) UI.toggleMap(false, false); help.classList.remove('open'); exitLock(); } menu.classList.toggle('open', S.menu); root.classList.toggle('paused', S.menu || S.help); if (!S.menu && resume) AF.input.requestLock(); };
  const toggleHelp = (on) => { S.help = on ?? !S.help; help.classList.toggle('open', S.help); if (S.help) { if (S.map) UI.toggleMap(false, false); S.menu = false; menu.classList.remove('open'); exitLock(); } else AF.input.requestLock(); root.classList.toggle('paused', S.menu || S.help); };
  UI.resume = () => { if (S.menu) toggleMenu(false); };
  // ---- Escape: ONE action per press. With something open it only closes the topmost thing (minigame, casino, shop, bag, map,
  // controls, pause menu, dialogue, weapon wheel, photo mode, a CCTV feed, or anything registered with UI.onEscape(fn -> true
  // if it closed something)); with nothing open it opens the pause menu (pointer lock released). A press while the pointer is
  // locked reaches us as a keydown, an unrequested pointer unlock, or both (browser-dependent), so the second within 400 ms is
  // the same press and is dropped.
  const ESC = { at: -1e9, hooks: [] };
  UI.onEscape = (fn) => { ESC.hooks.push(fn); };
  const escape = () => {
    const now = performance.now(); if (now - ESC.at < 400) return; ESC.at = now;
    if (AF.minigame && AF.minigame.open) { AF.minigame.cancel(); return; }
    if (S.title) return;
    const CB = AF.combat, PH = AF.photo, CC = AF.cctv;
    if (S.casino) AF.casino.close();
    else if (S.shop) AF.shop.close();
    else if (S.inv && AF.inv) AF.inv.close();
    else if (S.map) toggleMap(false);
    else if (S.help) toggleHelp(false);
    else if (S.menu) toggleMenu(false);
    else if (S.dlg) closeDlg();
    else if (CB && CB.wheel && CB.wheel.open) CB.wheelClose(false);
    else if (PH && PH.on) PH.exit();
    else if (CC && AF.mode === 'cctv' && !(CC.o && CC.o.locked)) CC.close();
    else { for (const fn of ESC.hooks) if (fn()) return; toggleMenu(true); }
  };
  AF.on('pointerunlock', (intentional) => {
    if (intentional || S.title) return;
    // focus lost (alt-tab, another window): pause, never close anything
    if (!document.hasFocus()) { if (!UI.modalOpen() && !S.dlg) toggleMenu(true); return; }
    escape();
  });
  AF.on('escape', escape);
  AF.test('ui: Escape closes only what is open, then opens / closes the menu; F1 (not H) is the controls sheet', () => {
    const title = S.title, I = AF.input, hook = AF.hooks.tick.find((x) => x.name === 'ui'); S.title = false;
    const press = () => { ESC.at = -1e9; AF.emit('escape'); };
    closeDlg(); if (AF.photo && AF.photo.on) AF.photo.exit(); if (S.menu) toggleMenu(false, false);
    UI.toggleMap(true, false); press(); const mapOnly = !S.map && !S.menu;
    press(); const menuOn = S.menu; press(); const menuOff = !S.menu;
    I.tap('KeyH'); hook.fn(0); I.pressed.delete('KeyH'); const hFree = !S.help;
    I.tap('F1'); hook.fn(0); I.pressed.delete('F1'); const f1 = S.help; press(); const helpOnly = !S.help && !S.menu;
    ESC.at = -1e9; S.title = title;
    return { ok: mapOnly && menuOn && menuOff && hFree && f1 && helpOnly, info: `map ${mapOnly}, menu ${menuOn}/${menuOff}, H free ${hFree}, F1 ${f1}, help ${helpOnly}, mode ${AF.mode}` };
  });
  menu.addEventListener('click', (e) => {
    if (e.target === menu) { toggleMenu(false); return; }
    const b = e.target.closest('button'); if (!b) return;
    const seg = b.parentElement && b.parentElement.dataset.k;
    if (seg === 'gfx') { const v = b.dataset.v; G.auto = false; AF.stream.regfx(() => G.set(v, 'menu')).then(() => { if (S.menu) syncMenu(); }); try { localStorage.setItem('portSolace.gfx', v); } catch (er) {} }
    else if (seg === 'res') {
      G.res = +b.dataset.v; try { localStorage.setItem('portSolace.res', b.dataset.v); } catch (er) {}
      AF.applyPR();
    }
    else if (seg === 'clock') AF.time.set({ paused: b.dataset.v === 'stop' });
    else if (seg === 'fps') AF.setFpsCap(b.dataset.v);
    else if (seg === 'shadows') { const v = b.dataset.v; AF.stream.regfx(() => AF.gfx.setShadows(v)).then(() => { if (S.menu) syncMenu(); }); }
    else if (b.dataset.k === 'resume') toggleMenu(false);
    else if (b.dataset.k === 'map') { toggleMenu(false, false); toggleMap(true); }
    else if (b.dataset.k === 'help') { toggleMenu(false, false); toggleHelp(true); }
    else if (b.dataset.k === 'switch') { toggleMenu(false, false); UI.showTitle(); }
    syncMenu();
  });
  menu.querySelector('[data-k=hour]').addEventListener('input', (e) => { AF.time.set({ hours: +e.target.value }); });
  menu.querySelector('[data-k=sens]').addEventListener('input', (e) => AF.setLookSens(e.target.value));
  menu.querySelector('[data-k=bright]').addEventListener('input', (e) => AF.setBrightness && AF.setBrightness(e.target.value));
  menu.querySelector('[data-k=resH]').addEventListener('change', (e) => { AF.gfx.setResH(e.target.value); syncMenu(); });
  menu.querySelector('[data-k=resH]').addEventListener('input', (e) => text(menu.querySelector('.rv'), e.target.value + 'p'));
  menu.querySelector('[data-k=lod]').addEventListener('change', (e) => { AF.gfx.setView(e.target.value); syncMenu(); });
  menu.querySelector('[data-k=lod]').addEventListener('input', (e) => text(menu.querySelector('.lv'), '\u00d7' + (+e.target.value).toFixed(1)));
  help.addEventListener('click', (e) => { if (e.target === help || e.target.closest('[data-k=closehelp]')) toggleHelp(false); });
  mm.addEventListener('click', (e) => { const b = e.target.closest('[data-k]'); if (b) { if (b.dataset.k === 'menu') toggleMenu(); else if (b.dataset.k === 'map') toggleMap(); else if (b.dataset.k === 'full') goFull(!isFull()); return; } if (e.target.closest('#h-mini')) toggleMap(true); });
  prompt.addEventListener('click', () => AF.input.tap(AF.mode==='ferry-ride'||AF.mode==='tender'?'Space':'KeyE'));

  const focus = () => UI.map && UI.map.focus ? UI.map.focus() : AF.mode === 'drive' && AF.vehicles.player ? AF.vehicles.player : AF.mode === 'fly' && AF.planes && AF.planes.cur ? AF.planes.cur : AF.player;
  const toggleMap = (...args) => UI.toggleMap && UI.toggleMap(...args);
  UI.toggleHelp = toggleHelp; UI.toggleMenu = toggleMenu;

  // ------------------------------------------------------------------ build + tick
  AF.onBuild('ui', 830, () => { buildTitle(); root.appendChild(title); });
  AF.on('mode', (name) => { if (name !== 'drive' && name !== 'fly') show(speed, false); });
  let frameN = 0;
  const fmt = (hrs) => { const hh = Math.floor(hrs) % 24, mm = Math.floor((hrs - Math.floor(hrs)) * 60); return [((hh + 11) % 12) + 1 + ':' + String(mm).padStart(2, '0'), hh < 12 ? 'AM' : 'PM']; };
  const placeName = () => {
    const pl = focus(); if (!pl) return '';
    const lot = AF.PLAN.lotAt(pl.x, pl.z), id = lot && lot.id, K2 = AF.PLAN.world.key;
    if (id === 'w-zoo' || id === 'w-zoo-annex') return 'Solace Zoo'; if (id === 'w-airfield') return 'Westgate Airfield';
    if (K2 && Math.abs(pl.x - K2.cx) < K2.rx * 1.3 && Math.abs(pl.z - K2.cz) < K2.rz * 1.3) return K2.name;
    const SI = AF.PLAN.world.island;
    if (AF.liner && Math.abs(pl.x - AF.liner.x) < 110 && Math.abs(pl.z - AF.liner.z) < 40) return 'SS Solace Queen';
    if (pl.z > 300) return Math.hypot((pl.x - SI.cx) / SI.rx, (pl.z - SI.cz) / SI.rz) < 1.4 ? 'Serena Isle' : 'Open sea'; if (pl.z < -300) return 'Solace Range'; if (pl.x < -660) return 'Westmoor'; if (pl.x > 460) return 'Eastwood';
    const nr = AF.PLAN.nearestRoad(pl.x, pl.z); return nr.road && nr.d < 12 ? nr.road.name : pl.x < -300 ? 'The West Side' : 'Port Solace';
  };
  const district = (x, z) => { const K2 = AF.PLAN.world.key; if (K2 && Math.abs(x - K2.cx) < K2.rx * 1.3 && Math.abs(z - K2.cz) < K2.rz * 1.3) return 'Private island';
    return x < -300 ? (z < -10 && x > -446 ? 'New Friends Colony' : 'The West Side') : x > 300 ? 'Eastport' : z > 160 ? 'The Harbour' : z < -160 ? 'Park Side' : x > 0 && z < 0 ? 'Downtown' : x < -120 ? 'Old Town' : 'Port Solace'; };
  AF.onTick('ui', 950, (dt) => {
    frameN++;
    const I = AF.input;
    if (S.title) {
      if (I.hit('Enter') || I.hit('Space')) start();
      if (I.hit('ArrowRight') || I.hit('KeyD')) step(1);
      if (I.hit('ArrowLeft') || I.hit('KeyA')) step(-1);
    } else {
      if (I.hit('KeyM')) toggleMap();
      if (I.hit('F1') || I.hit('Slash')) toggleHelp();
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
    const it = (AF.mode === 'walk'||AF.mode==='ferry-ride'||AF.mode==='tender') && !S.dlg && !UI.modalOpen() ? AF.interactTarget : null;
    if (it && (prompt._target !== it || prompt._label !== it.label)) { prompt._target = it; prompt._label = it.label; const lab = `<b>${TOUCH ? '&#9995;' : AF.mode==='ferry-ride'||AF.mode==='tender'?'Space':'E'}</b>` + esc(it.label || 'Use'); if (prompt._l !== lab) { prompt.innerHTML = lab; prompt._l = lab; } }
    show(prompt, !!it, 'flex');
    const now = performance.now();
    for (let i = S.toasts.length - 1; i >= 0; i--) { const o = S.toasts[i]; if (now > o.until) { if (!o.gone) { o.gone = true; o.el.classList.add('out'); o.until = now; } else if (now > o.until + 320) { o.el.remove(); S.toasts.splice(i, 1); } } }
    if (HP.tip && now > HP.until) { HP.tip = ''; helpPaint(); }
    if (frameN % 10 === 0 && !S.title) {
      let b = null;
      if (AF.mode === 'walk' && AF.player) b = AF.buildingAt(AF.player.x, AF.player.y + 1, AF.player.z);
      if (b !== S.bannerB) S.bannerB = b;
      const [t, ap] = fmt(AF.time.hours); text(clockTime, t); text(clockAP, ap);
      const inside = b && b.name && b.label !== false, f = focus();
      if (inside) UI.banner(b.name, b.kind); else locate(placeName(), f ? district(f.x, f.z) : '');
      if (!clock.classList.contains('dim') && now - LOC.t > 7000) clock.classList.add('dim');
      if (S.menu) syncMenu();
    }
    const d = (AF.mode === 'drive' || AF.mode === 'fly'||AF.mode==='ferry-ride'||AF.mode==='tender') && AF.clock.t - S.hudT < 1.0 ? S.hud : null;
    show(speed, !!d);
    if (d && frameN % 3 === 0) {
      text(speedValue, Math.round(d.speed || 0));
      text(speedName, d.mode === 'fly' ? `${d.car || ''} \u00b7 ${Math.round(d.alt || 0)} m` : (d.car || '') + (d.gear === 'R' ? ' \u00b7 R' : ''));
      if (speedBar.classList.contains('hide') !== (d.mode !== 'fly')) speedBar.classList.toggle('hide', d.mode !== 'fly');
      if (d.mode === 'fly') { const width = Math.round((d.throttle || 0) * 100) + '%'; if (speedBar.firstChild.style.width !== width) speedBar.firstChild.style.width = width; }
    }
  });
}

} catch (e) { AF.partError('71-ui.js', e); }
