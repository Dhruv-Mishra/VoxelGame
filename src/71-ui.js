// ================================================================ 71-ui.js
try {
// ===== 71-ui: title card, prompts, toasts, dialogue, clock, minimap, full map, help, photo mode, debug  (OWNER: player) =====
{
  const UI = AF.ui = AF.ui || {};
  const root = document.getElementById('ui');
  const h = (tag, cls, html, parent) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; (parent || root).appendChild(e); return e; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ------------------------------------------------------------------ style
  const css = `
  #ui{--paper:#133a44;--paper2:#0b1d2b;--ink:#d9b45a;--ink2:#c8b88e;--red:#e8c460;--green:#2f7a6a;--gold:#e6c46a;--sh:0 8px 22px rgba(0,8,16,.55),0 1px 0 rgba(255,230,160,.18) inset;font-family:Georgia,'Times New Roman',serif;color:var(--ink)}
  #ui .card{background:linear-gradient(180deg,var(--paper),var(--paper2));border:2px solid var(--ink);border-radius:14px;box-shadow:var(--sh);position:relative}
  #ui .card:before{content:'';position:absolute;inset:4px;border:1px solid rgba(217,180,90,.45);border-radius:10px;pointer-events:none}
  #ui .btn{font-family:inherit;font-size:15px;color:#0b1d2b;background:linear-gradient(180deg,#f0d27a,#c8973a);border:2px solid #0b1d2b;border-radius:999px;padding:9px 18px;cursor:pointer;box-shadow:0 3px 0 var(--ink),0 5px 10px rgba(0,0,0,.25);letter-spacing:.5px;transition:transform .08s}
  #ui .btn:hover{transform:translateY(-1px);filter:brightness(1.07)}
  #ui .btn:active{transform:translateY(2px);box-shadow:0 1px 0 var(--ink)}
  #ui .btn.alt{background:linear-gradient(180deg,#2f8a78,#1b5a4e);color:#f3e6c4}
  #ui .btn.ghost{background:linear-gradient(180deg,#1c4652,#10303c);color:#e6c46a}
  #ui .btn.sm{font-size:12px;padding:3px 9px;box-shadow:0 2px 0 var(--ink)}
  #ui .btn.on{background:linear-gradient(180deg,#f7e3a0,#e0b650);color:#0b1d2b}
  /* title: a slim gold deco banner in the upper third + a thin button row at the bottom; the city stays unobstructed */
  #ui #af-title{position:absolute;inset:0;pointer-events:none;text-align:center;transition:opacity .9s}
  #ui #af-title.hide{opacity:0}
  #ui #af-title .band{position:absolute;left:0;right:0;top:8%;padding:8px 0 10px;background:linear-gradient(90deg,rgba(6,16,26,0) 0,rgba(6,16,26,.34) 26%,rgba(6,16,26,.34) 74%,rgba(6,16,26,0) 100%);opacity:0}
  #ui #af-title.go .band{animation:afTitleIn 1.8s ease 2.4s forwards}
  #ui #af-title.go .bar{animation:afTitleIn 1.4s ease 3.6s forwards}
  #ui #af-title .band:before,#ui #af-title .band:after{content:'';position:absolute;left:18%;right:18%;height:1px;background:linear-gradient(90deg,transparent,#e6c46a 20%,#e6c46a 80%,transparent)}
  #ui #af-title .band:before{top:0}#ui #af-title .band:after{bottom:0}
  #ui #af-title .sun{display:block;margin:0 auto -4px;opacity:.95}
  #ui #af-title h1{margin:0;font:400 clamp(34px,6.2vw,64px)/1.05 Limelight,'Poiret One',Georgia,serif;letter-spacing:.28em;padding-left:.28em;background:linear-gradient(180deg,#fff3c4 0%,#f0cf74 38%,#b8862e 62%,#f3d88a 100%);-webkit-background-clip:text;background-clip:text;color:transparent;filter:drop-shadow(0 2px 0 rgba(60,36,8,.75)) drop-shadow(0 0 14px rgba(240,190,90,.35))}
  #ui #af-title .est{font:600 12px/1.4 'Poiret One',Georgia,serif;letter-spacing:.55em;padding-left:.55em;color:#f1dfae;margin-top:6px;text-shadow:0 1px 2px rgba(0,0,0,.7)}
  #ui #af-title .est i{font-style:normal;color:#e6c46a;margin:0 .4em}
  #ui #af-title .tag{font:italic 15px Georgia,serif;color:#e9dcc0;margin-top:3px;text-shadow:0 1px 3px rgba(0,0,0,.8);letter-spacing:.04em}
  #ui #af-title .bar{position:absolute;left:0;right:0;bottom:4.5%;display:flex;flex-direction:column;align-items:center;gap:8px;opacity:0}
  #ui #af-title .row{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;pointer-events:auto}
  #ui #af-title .row .btn{font:400 13px/1 'Poiret One',Georgia,serif;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#f3e2b0;background:linear-gradient(180deg,rgba(10,26,36,.72),rgba(6,16,24,.82));border:1px solid rgba(230,196,106,.85);border-radius:2px;padding:10px 18px 9px;box-shadow:0 0 0 3px rgba(6,16,24,.35),0 0 0 4px rgba(230,196,106,.35);transition:background .2s,color .2s}
  #ui #af-title .row .btn:hover{background:linear-gradient(180deg,#f0d27a,#c8973a);color:#0b1d2b;transform:none}
  #ui #af-title .row .btn.first{color:#0b1d2b;background:linear-gradient(180deg,#f3d98a,#c8973a)}
  #ui #af-title .small{font:12px Georgia,serif;color:#e9dcc0;text-shadow:0 1px 2px rgba(0,0,0,.9);letter-spacing:.06em}
  #ui #af-title .small b{color:#f0cf74;font-weight:normal}
  @keyframes afTitleIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:none}}
  #ui.filming>*:not(#af-film){display:none!important}
  #ui #af-film{position:absolute;inset:0;pointer-events:none;display:none;z-index:40}
  #ui.filming #af-film,#ui.cine #af-film{display:block}
  #ui #af-film .blk{position:absolute;inset:0;background:#000;opacity:0}
  #ui #af-film .lb{position:absolute;left:0;right:0;height:0;background:#000;transition:height .8s ease}
  #ui #af-film .lb.t{top:0}#ui #af-film .lb.b{bottom:0}
  #ui #af-film.bars .lb{height:calc((100vh - 100vw / 2.39) / 2)}
  #ui #af-film .cap{position:absolute;left:5.5%;bottom:9%;text-align:left;opacity:0;transition:opacity 1.1s ease;color:#f3e2b0;text-shadow:0 1px 3px rgba(0,0,0,.85),0 0 18px rgba(0,0,0,.35)}
  #ui #af-film .cap.on{opacity:1}
  #ui #af-film .cap .n{font:400 clamp(20px,2.6vw,34px)/1.1 Limelight,'Poiret One',Georgia,serif;letter-spacing:.2em;background:linear-gradient(180deg,#fff3c4 0%,#f0cf74 40%,#b8862e 64%,#f3d88a 100%);-webkit-background-clip:text;background-clip:text;color:transparent}
  #ui #af-film .cap .r{width:120px;height:1px;margin:7px 0 6px;background:linear-gradient(90deg,#e6c46a,transparent)}
  #ui #af-film .cap .s{font:italic clamp(12px,1.15vw,16px) Georgia,serif;letter-spacing:.05em;color:#efe2c2}
  #ui #af-film .hk{position:absolute;left:50%;top:5%;transform:translateX(-50%);font:600 12px/1.5 'Poiret One',Georgia,serif;letter-spacing:.2em;color:#f1dfae;background:rgba(6,16,24,.6);border:1px solid rgba(230,196,106,.7);padding:6px 16px;opacity:0;transition:opacity .6s;white-space:nowrap}
  #ui #af-film .hk.on{opacity:1}
  #ui #af-film .hk b{color:#f0cf74}
  #ui.titling #af-clock,#ui.titling #af-mini,#ui.titling #af-corner,#ui.titling #af-hint,#ui.titling #af-prompt{display:none!important}
  /* prompt, toasts, hint */
  #ui #af-prompt{position:absolute;left:50%;bottom:118px;transform:translateX(-50%);padding:8px 18px;border-radius:999px;font-size:16px;white-space:nowrap;display:none}
  #ui #af-prompt b{display:inline-block;background:var(--ink);color:var(--paper);border-radius:6px;padding:0 7px;margin-right:8px;font-family:Georgia,serif}
  #ui #af-toasts{position:absolute;left:50%;top:16px;transform:translateX(-50%);display:flex;flex-direction:column;gap:8px;align-items:center;width:min(620px,90vw)}
  #ui #af-toasts .card{padding:9px 20px;font-size:15px;text-align:center;animation:afIn .35s ease;transition:opacity .5s}
  @keyframes afIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}
  #ui #af-hint{position:absolute;left:50%;bottom:18px;transform:translateX(-50%);padding:6px 16px;border-radius:999px;font-size:13px;background:rgba(58,39,24,.82);color:var(--paper);display:none;white-space:nowrap}
  /* dialogue */
  #ui #af-dlg{position:absolute;left:50%;bottom:34px;transform:translateX(-50%);width:min(640px,92vw);padding:16px 22px 14px 96px;display:none;min-height:70px}
  #ui #af-dlg .face{position:absolute;left:16px;top:12px;width:66px;height:66px;border-radius:50%;border:2px solid var(--ink);box-shadow:0 0 0 3px #0b1d2b,0 0 0 4px rgba(230,196,106,.6);display:flex;align-items:center;justify-content:center;font:26px Limelight,Georgia,serif;color:#fff3cf;text-shadow:0 2px 0 rgba(0,0,0,.45);overflow:hidden}
  #ui #af-dlg .face svg{position:absolute;inset:0}
  #ui #af-dlg .face span{position:relative}
  #ui #af-dlg.typing .face{animation:afBob .32s ease-in-out infinite alternate}
  @keyframes afBob{from{transform:translateY(0)}to{transform:translateY(-2px)}}
  #ui #af-dlg .lv{font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#9fb8b0;margin-top:1px}
  #ui #af-dlg .nm{font-size:18px;color:var(--red);letter-spacing:1px}
  #ui #af-dlg .rl{font-size:12px;font-style:italic;color:var(--ink2);margin-left:8px}
  #ui #af-dlg .ln{font-size:17px;line-height:1.4;margin-top:4px;min-height:24px}
  #ui #af-dlg .more{position:absolute;right:16px;bottom:8px;font-size:11px;color:var(--ink2)}
  /* banner */
  #ui #af-banner{position:absolute;left:50%;top:22%;transform:translateX(-50%);text-align:center;opacity:0;transition:opacity .8s;padding:10px 30px 12px;pointer-events:none}
  #ui #af-banner.show{opacity:1}
  #ui #af-banner .k{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:var(--ink2)}
  #ui #af-banner .n{font-size:28px;color:var(--ink);letter-spacing:1px}
  /* clock */
  #ui #af-clock{position:absolute;left:16px;top:16px;padding:10px 14px 10px;width:210px}
  #ui #af-clock .t{font-size:26px;letter-spacing:1px;display:flex;align-items:baseline;gap:8px}
  #ui #af-clock .t small{font-size:12px;color:var(--ink2);font-style:italic}
  #ui #af-clock .row{display:flex;gap:6px;margin-top:6px;align-items:center}
  #ui #af-clock input[type=range]{width:100%;accent-color:#a8322b;margin:8px 0 0}
  #ui #af-clock .mode{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--ink2)}
  /* minimap */
  #ui #af-mini{position:absolute;right:16px;top:16px;width:196px;height:222px;padding:0}
  #ui #af-mini canvas{position:absolute;left:8px;top:8px;width:180px;height:180px;border-radius:50%;border:2px solid var(--ink)}
  #ui #af-mini .lbl{position:absolute;left:0;right:0;bottom:8px;text-align:center;font-size:12px;color:var(--ink2);letter-spacing:1px}
  #ui #af-mini .n{position:absolute;left:92px;top:2px;font-size:11px;font-weight:bold;color:var(--red)}
  /* full map */
  #ui #af-map{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(30,20,10,.45)}
  #ui #af-map .sheet{position:relative;padding:16px 16px 12px}
  #ui #af-map .wrap{position:relative;border:2px solid var(--ink);border-radius:6px;overflow:hidden}
  #ui #af-map canvas{display:block}
  #ui #af-map .lab{color:#1b2a3a !important;position:absolute;transform:translate(-50%,-50%);font-size:11px;white-space:nowrap;cursor:pointer;color:var(--ink);text-shadow:0 0 3px #f5ecd6,0 0 3px #f5ecd6,0 0 2px #f5ecd6;padding:1px 3px;border-radius:4px}
  #ui #af-map .poi-pick{position:absolute;transform:translateX(-50%);z-index:6;display:flex;flex-direction:column;gap:5px;padding:8px 10px;background:var(--paper,#f5ecd6);border:2px solid var(--ink,#1b2a3a);border-radius:8px;box-shadow:0 6px 18px rgba(0,0,0,.35);min-width:150px}
  #ui #af-map .poi-pick .t{font:bold 12px Georgia,serif;color:var(--ink,#1b2a3a);text-align:center;margin-bottom:2px}
  #ui #af-map .poi-pick button{width:100%;cursor:pointer}
  #ui #af-map .lab:hover{background:var(--ink);color:var(--paper);text-shadow:none;z-index:3}
  #ui #af-map .lab.view{font-size:12px;background:var(--red);color:var(--paper);text-shadow:none;border:1px solid var(--ink);border-radius:999px;padding:1px 8px}
  #ui #af-map .lab.place{font-style:italic;font-size:13px;color:#2d4a5e}
  #ui #af-map .lab.street{font-size:10px;letter-spacing:1px;color:var(--ink2);text-transform:uppercase}
  #ui #af-map .hd{display:flex;flex-direction:column;align-items:center;margin:0 4px 8px;text-align:center}
  #ui #af-map .hd h2{margin:0;font-weight:normal;letter-spacing:4px;color:var(--red)}
  #ui #af-map .hd span{font-size:12px;color:var(--ink2);font-style:italic}
  /* help */
  #ui #af-help{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(720px,94vw);padding:20px 26px;display:none}
  #ui #af-help h2{margin:0 0 10px;font-weight:normal;letter-spacing:4px;color:var(--red);text-align:center}
  #ui #af-help .cols{display:grid;grid-template-columns:1fr 1fr;gap:6px 26px}
  #ui #af-help h3{margin:8px 0 4px;font-size:14px;letter-spacing:2px;text-transform:uppercase;color:var(--green)}
  #ui #af-help .k{display:flex;justify-content:space-between;font-size:14px;border-bottom:1px dotted rgba(58,39,24,.3);padding:2px 0}
  #ui #af-help kbd{font-family:Georgia,serif;background:var(--ink);color:var(--paper);border-radius:5px;padding:0 6px;font-size:12px}
  /* speedometer */
  #ui #af-speedo{position:absolute;right:24px;bottom:24px;width:150px;height:150px;border-radius:50%;display:none;padding:0}
  #ui #af-speedo canvas{width:150px;height:150px}
  /* debug */
  #ui #af-dbg{position:absolute;left:16px;bottom:16px;padding:8px 12px;font:12px/1.35 Menlo,monospace;white-space:pre;background:rgba(245,236,214,.92)}
  #ui #af-corner{position:absolute;right:16px;bottom:16px;display:flex;gap:6px}
  #ui.photo > *{display:none!important}
  #ui #af-over{position:absolute;left:0;top:0;transform:translate(-50%,-100%);padding:5px 12px 6px;border-radius:12px;background:#fbf4e2;color:#2a1d12;font:italic 14px Georgia,serif;white-space:nowrap;box-shadow:0 3px 10px rgba(0,0,0,.35);border:1px solid #8a6a3a;display:none;pointer-events:none;transition:opacity .4s}
  #ui #af-over:after{content:'';position:absolute;left:50%;bottom:-7px;margin-left:-6px;border:6px solid transparent;border-top-color:#fbf4e2;border-bottom:0}
  #ui #af-over b{font-style:normal;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a4a1a;margin-right:6px}
  /* photo mode: a GREETINGS FROM large-letter postcard frame */
  #ui #af-photo{position:absolute;inset:0;pointer-events:none;display:none}
  #ui.photo > #af-photo{display:block!important}
  #ui #af-photo .fr{position:absolute;inset:0;box-shadow:inset 0 0 0 14px #efe6d2,inset 0 0 0 16px #8a6a3a,inset 0 0 60px 16px rgba(40,24,8,.35)}
  #ui #af-photo .gr{position:absolute;left:34px;top:26px;font:italic 26px 'Poiret One',Georgia,serif;font-weight:700;color:#fff6dc;text-shadow:0 2px 0 #7a1f1a,0 3px 8px rgba(0,0,0,.6);letter-spacing:.06em}
  #ui #af-photo .big{position:absolute;left:30px;top:56px;font:clamp(40px,7vw,86px)/1 Limelight,Georgia,serif;letter-spacing:.06em;color:#f6d26a;-webkit-text-stroke:2px #5a1410;text-shadow:4px 4px 0 #5a1410,6px 6px 10px rgba(0,0,0,.4)}
  #ui #af-photo .cap{position:absolute;right:30px;bottom:24px;font:12px Georgia,serif;letter-spacing:.3em;color:#3a2718;background:#efe6d2;padding:5px 12px;border:1px solid #8a6a3a}
  #cv.ps-strip{filter:saturate(1.45) contrast(1.08) brightness(1.03)}
  #cv.ps-news{filter:grayscale(1) contrast(1.3) brightness(1.02)}
  #cv.ps-sepia{filter:sepia(.75) contrast(1.05) saturate(1.1)}
  `;
  root.addEventListener('mousedown', (e) => { if (e.target.closest('.pe')) UI.pointerOnPanel = true; }, true);
  addEventListener('mouseup', () => { UI.pointerOnPanel = false; }, true);
  addEventListener('blur', () => { UI.pointerOnPanel = false; });
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
  try { const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Limelight&family=Poiret+One&display=swap'; document.head.appendChild(fl); } catch (e) {}

  // ------------------------------------------------------------------ elements
  const sunburst = `<svg class="sun" width="120" height="40" viewBox="0 0 120 40"><g stroke="#e6c46a" stroke-width="1.3" opacity=".9">${Array.from({ length: 15 }, (_, i) => { const a = Math.PI * (i / 14), r = i % 2 ? 30 : 38; return `<line x1="${(60 - Math.cos(a) * 12).toFixed(1)}" y1="${(38 - Math.sin(a) * 12).toFixed(1)}" x2="${(60 - Math.cos(a) * r * 1.4).toFixed(1)}" y2="${(38 - Math.sin(a) * r).toFixed(1)}"/>`; }).join('')}</g><path d="M48 38a12 12 0 0 1 24 0z" fill="#e6c46a"/><path d="M54 38a6 6 0 0 1 12 0z" fill="#0b1d2b"/><line x1="4" y1="38.5" x2="116" y2="38.5" stroke="#e6c46a" stroke-width="1"/></svg>`;
  const title = h('div', '', `
    <div class="band">${sunburst}<h1>PORT SOLACE</h1>
      <div class="est">CHARTERED 1851<i>&#9670;</i>1936</div>
      <div class="tag">a harbour city where the lights never quite go out</div></div>
    <div class="bar"><div class="row pe">
      <button class="btn first" data-go="walk">Explore on foot</button>
      <button class="btn" data-go="train">Ride the streetcar</button>
      <button class="btn" data-go="drive">Take a cab</button>
      <button class="btn" data-go="look">Just look around</button>
      <button class="btn" data-go="film">Film mode</button>
    </div>
    <div class="small"><b>Enter</b> to explore &middot; <b>H</b> help &middot; <b>M</b> the city map &middot; <b>P</b> postcard &middot; <b>F</b> film mode &middot; <b>C</b> free camera</div></div>`);
  title.id = 'af-title';
  const prompt = h('div', 'card', ''); prompt.id = 'af-prompt';
  const toasts = h('div', '', ''); toasts.id = 'af-toasts';
  const hint = h('div', '', ''); hint.id = 'af-hint';
  const dlg = h('div', 'card pe', `<div class="face">?</div><div><span class="nm"></span><span class="rl"></span></div><div class="lv"></div><div class="ln"></div><div class="more">E to continue</div>`); dlg.id = 'af-dlg';
  const banner = h('div', 'card', `<div class="k"></div><div class="n"></div>`); banner.id = 'af-banner';
  const clock = h('div', 'card pe', `<div class="mode">Aerial view</div><div class="t"><span class="tm">4:30</span><small class="ap">PM</small><small class="day"></small></div>
    <div class="row"><button class="btn sm" data-sp="pause">&#10074;&#10074;</button><button class="btn sm on" data-sp="1">1&times;</button><button class="btn sm" data-sp="60">60&times;</button><span style="flex:1"></span><button class="btn sm ghost" data-k="film" title="Film mode: a cinematic tour for recording (F)">Film</button><button class="btn sm ghost" data-k="gfx" title="Graphics quality">Ultra</button><button class="btn sm ghost" data-k="help">?</button><button class="btn sm ghost" data-k="map">Map</button></div>
    <input type="range" min="0" max="23.95" step="0.05" value="16.5" aria-label="hour of day">
    <label class="sens" style="display:flex;align-items:center;gap:8px;font-size:11px;margin-top:6px;opacity:.85">Mouse <input data-k="sens" type="range" min="0.1" max="1.5" step="0.05" value="0.45" aria-label="mouse sensitivity" style="flex:1"></label>`); clock.id = 'af-clock';
  { const sl = clock.querySelector('[data-k="sens"]'); if (sl) { try { sl.value = String(AF.lookSens ? AF.lookSens() : 0.45); } catch (e) {} sl.addEventListener('input', () => { if (AF.setLookSens) AF.setLookSens(sl.value); }); } }
  const mini = h('div', 'card pe', `<canvas width="360" height="360"></canvas><div class="n">N</div><div class="lbl">Port Solace</div>`); mini.id = 'af-mini';
  const mapEl = h('div', 'pe', `<div class="sheet card"><div class="hd"><h2>A PICTORIAL MAP OF PORT SOLACE</h2><span>click a place to teleport there or fly over &middot; shift-click to walk there straight away &middot; M or Esc to close</span></div><div class="wrap"><canvas></canvas><div class="labs"></div></div></div>`); mapEl.id = 'af-map';
  const help = h('div', 'card pe', ''); help.id = 'af-help';
  const speedo = h('div', 'card', `<canvas width="300" height="300"></canvas>`); speedo.id = 'af-speedo';
  const photo = h('div', '', `<div class="fr"></div><div class="gr">Greetings from</div><div class="big">PORT SOLACE</div><div class="cap"></div>`); photo.id = 'af-photo';
  const PRESETS = [['ps-strip', 'THREE-STRIP 1936'], ['ps-news', 'NEWSREEL'], ['ps-sepia', 'PENNY POSTCARD']];
  const setPhoto = (i) => {
    const cv = document.getElementById('cv'); S.photoI = i;
    for (const [c] of PRESETS) cv && cv.classList.remove(c);
    S.photo = i >= 0; root.classList.toggle('photo', S.photo);
    if (S.photo) { cv && cv.classList.add(PRESETS[i][0]); photo.querySelector('.cap').textContent = PRESETS[i][1] + '  ·  P next  ·  Esc done'; }
  };
  UI.setPhoto = setPhoto;
  const over = h('div', '', ''); over.id = 'af-over';
  const film = h('div', '', `<div class="lb t"></div><div class="lb b"></div><div class="cap"><div class="n"></div><div class="r"></div><div class="s"></div></div><div class="blk"></div><div class="hk"><b>FILM MODE</b> &nbsp; \u2190 \u2192 shots &middot; space pause &middot; 1 2 3 speed &middot; T titles &middot; L letterbox &middot; Esc leave</div>`); film.id = 'af-film';
  const fBlk = film.querySelector('.blk'), fCap = film.querySelector('.cap'), fHk = film.querySelector('.hk');
  AF.on('film-shot', (i, S) => {
    if (i < 0 || !S) { fCap.classList.remove('on'); return; }
    fCap.querySelector('.n').textContent = String(S.name || '').toUpperCase(); fCap.querySelector('.s').textContent = S.sub || '';
    fCap.classList.remove('on');
  });
  const OVER = { paperboy: ['EXTRA! EXTRA! BLIMP OVER THE HARBOUR!', 'Getcher Clarion! Harbour Days Saturday!', 'EXTRA! Fleet sails in Saturday — read all about it!'], newsboy: ['EXTRA! EXTRA! BLIMP OVER THE HARBOUR!', 'Getcher Clarion here, two cents!'],
    vendor: ['Getcher red-hots! Nickel a frank!', 'Hot roasted chestnuts, warm your hands!'], cabbie: ['Taxi, mister?', 'Harbour Cab, going anywhere!'], driver: ['Taxi, mister?'], police: ['Keep it moving, folks, keep it moving.', 'Evening. Mind the streetcar.'], cop: ['Keep it moving, folks.'],
    kid: ['Race you to the fountain!', 'Look, the blimp!'], fisherman: ['Mackerel are running tonight.'], conductor: ['All aboard for the loop!'],
    _: ['Evening!', 'Swell weather, ain\'t it?', 'Did you see the blimp?', 'Lovely evening for it.', 'Harbour Days on Saturday!', 'Evening, stranger.'] };
  const OV = { p: null, until: 0, next: 4, seen: new Set() }, OVV = new THREE.Vector3();
  const overUpdate = (dt) => {
    OV.next -= dt;
    if (AF.mode !== 'walk' || S.dlg || S.title || S.photo || !AF.people || !AF.player) { over.style.display = 'none'; OV.p = null; return; }
    const pl = AF.player, now = AF.clock.t;
    if (!OV.p && OV.next <= 0) {
      OV.next = 5 + Math.random() * 4;
      let best = null, bd = 36;
      for (const q of AF.people) { if (!q || !q.root || !q.root.visible || q.hidden) continue; const d = (q.x - pl.x) ** 2 + (q.z - pl.z) ** 2; if (d < bd && d > 1.5 && Math.abs(q.y - pl.y) < 2 && !OV.seen.has(q.id)) { bd = d; best = q; } }
      if (best) {
        const k = String(best.roleKey || '').toLowerCase(), L = OVER[k] || OVER[Object.keys(OVER).find((r) => r !== '_' && k.includes(r))] || OVER._;
        over.innerHTML = '<b>' + esc(best.first || '') + '</b>' + esc(L[Math.floor(Math.random() * L.length)]);
        OV.p = best; OV.until = now + 3.6; OV.seen.add(best.id); if (OV.seen.size > 24) OV.seen.clear();
      }
    }
    const q = OV.p;
    if (!q || now > OV.until || !q.root || !q.root.visible) { over.style.display = 'none'; OV.p = null; return; }
    OVV.set(q.x, q.y + 2.15, q.z).project(AF.camera);
    if (OVV.z > 1 || Math.abs(OVV.x) > 1.1 || Math.abs(OVV.y) > 1.1) { over.style.display = 'none'; return; }
    const r = AF.renderer.domElement.getBoundingClientRect();
    over.style.left = ((OVV.x + 1) / 2 * r.width) + 'px'; over.style.top = ((1 - OVV.y) / 2 * r.height) + 'px'; over.style.display = 'block';
  };
  UI.overheard = () => OV;
  const dbg = AF.DBG ? h('div', 'card', '') : null; if (dbg) dbg.id = 'af-dbg';

  const K = (k, d) => `<div class="k"><span>${d}</span><span>${k.split('+').map((x) => '<kbd>' + x + '</kbd>').join(' ')}</span></div>`;
  help.innerHTML = `<h2>HOW TO GET AROUND</h2><div class="cols">
    <div><h3>On foot</h3>${K('W+A+S+D', 'Walk')}${K('Shift', 'Run')}${K('Space', 'Jump')}${K('Drag', 'Look around')}${K('E', 'Talk / use')}${K('V', 'First-person view')}${K('Tab', 'Aerial view')}${K('M', 'Town map')}${K('P', 'Photo mode')}</div>
    <div><h3>From the sky</h3>${K('Drag', 'Rotate')}${K('Right-drag', 'Pan')}${K('Wheel', 'Zoom')}${K('W+A+S+D', 'Glide')}${K('Q+E', 'Turn')}${K('Double-click', 'Walk there')}${K('Tab', 'Walk again')}</div>
    <div><h3>Driving</h3>${K('W+S', 'Gas / reverse')}${K('A+D', 'Steer')}${K('Space', 'Brake')}${K('E', 'Get in / out')}</div>
    <div><h3>On the streetcar</h3>${K('E', 'Board at a stop / step off')}${K('C', 'Change view')}${K('Drag', 'Look out')}</div>
    <div><h3>Anywhere</h3>${K('M', 'Town map')}${K('H', 'This card')}${K('P', 'Photo mode')}${K('F', 'Film mode (tour)')}${K('C', 'Free camera')}</div>
    <div><h3>Film mode</h3>${K('\u2190+\u2192', 'Previous / next shot')}${K('Space', 'Pause')}${K('1+2+3', 'Slow / normal / fast')}${K('T', 'Shot titles')}${K('L', 'Letterbox')}${K('Esc', 'Leave')}</div>
    <div><h3>Free camera</h3>${K('W+A+S+D', 'Fly')}${K('Q+E', 'Down / up')}${K('Drag', 'Look')}${K('Shift', 'Fast')}${K('Alt', 'Slow')}${K('Wheel', 'Lens')}</div>
    <div><h3>&nbsp;</h3><div style="font-size:13px;font-style:italic;color:#6b4f33">Catch a picture at the Paragon, feed the pigeons in Civic Plaza, and ride the streetcar all the way round the loop at dusk.</div></div>
  </div><div style="text-align:center;margin-top:12px"><button class="btn sm" data-k="closehelp">Close</button></div>`;

  // ------------------------------------------------------------------ boot poster: THE DAILY CLARION front page over the engine loader while the city is built
  if (!(AF.Q && AF.Q.has('test'))) try {
    const TIPS = ['Tip your hat: walk up to any resident and press E. Every soul in Port Solace has a name, a trade and an opinion.',
      'The streetcar runs the whole loop — six stops, a nickel a ride. Wait on the island and press E when she stops.',
      'Lost? Press M for the pictorial map and click any place to teleport there and walk around, or fly over for a look.',
      'Press P for a postcard: THREE-STRIP 1936, NEWSREEL or PENNY POSTCARD. Press it again for the next.',
      'Double-click anywhere from the air to land there on foot. Tab takes you back up.',
      'Neon comes on at dusk along Theatre Row. Stay up for the searchlights.'];
    const cl = document.createElement('div'); cl.id = 'af-clarion';
    cl.innerHTML = `<style>
      #af-clarion{position:fixed;inset:0;z-index:25;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,#1b3a46 0,#0a1822 70%);transition:opacity 1.1s;font-family:Georgia,'Times New Roman',serif}
      #af-clarion.done{opacity:0;pointer-events:none}
      #af-clarion .pg{width:min(720px,92vw);background:#efe6d2;color:#2a1d12;padding:22px 30px 18px;box-shadow:0 20px 60px rgba(0,0,0,.6);transform:rotate(-1.2deg);background-image:radial-gradient(ellipse at 30% 20%,rgba(255,255,255,.35),transparent 60%),radial-gradient(ellipse at 80% 90%,rgba(120,90,40,.18),transparent 55%)}
      #af-clarion .mh{text-align:center;font:52px/1 Limelight,'Old English Text MT',Georgia,serif;letter-spacing:.04em;border-bottom:3px double #2a1d12;padding-bottom:6px}
      #af-clarion .dl{display:flex;justify-content:space-between;font-size:11px;letter-spacing:.18em;text-transform:uppercase;border-bottom:1px solid #2a1d12;padding:4px 0;margin-bottom:10px}
      #af-clarion .hl{font:700 clamp(24px,4.4vw,40px)/1.02 Georgia,serif;text-align:center;text-transform:uppercase;letter-spacing:.01em}
      #af-clarion .sh{text-align:center;font-style:italic;font-size:15px;margin:6px 0 12px}
      #af-clarion .cols{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;font-size:12.5px;line-height:1.4;text-align:justify;border-top:1px solid #2a1d12;padding-top:10px}
      #af-clarion .cols b{display:block;font-size:11px;letter-spacing:.14em;text-transform:uppercase;margin-bottom:3px;text-align:left}
      #af-clarion .press{margin-top:14px;border-top:3px double #2a1d12;padding-top:8px;display:flex;align-items:center;gap:12px;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
      #af-clarion .rail{flex:1;height:6px;background:rgba(42,29,18,.15);border:1px solid #2a1d12}
      #af-clarion .ink{height:100%;width:0;background:#2a1d12;transition:width .3s}
      #af-clarion .msg{min-width:190px;text-align:right;font-style:italic;text-transform:none;letter-spacing:0}
    </style><div class="pg"><div class="mh">The Daily Clarion</div>
      <div class="dl"><span>Port Solace</span><span>Wednesday, September 23, 1936</span><span>Two Cents</span></div>
      <div class="hl">Harbour City Readies for Harbour Days</div>
      <div class="sh">Fleet Week and Founder's Day fall together Saturday, Sept. 26 — blimp SOLACE to moor at the tower mast at dusk</div>
      <div class="cols"><div><b>Lights of Theatre Row</b>The Paragon opens RHYTHM ON THE PIER tonight, with Cab Harlow and his Harbour Serenaders at the Rosewood till late.</div>
        <div><b>Visitor's Notice</b><span class="tip"></span></div>
        <div><b>Weather</b>Fair and mild. Golden evening, a fresh breeze off the water, leaves turning in Central Park. Sunset 6:41.</div></div>
      <div class="press"><span>The presses are rolling</span><div class="rail"><div class="ink"></div></div><span class="msg">setting the type…</span></div></div>`;
    document.body.appendChild(cl);
    const tipEl = cl.querySelector('.tip'), ink = cl.querySelector('.ink'), msg = cl.querySelector('.msg');
    let ti = Math.floor(Math.random() * TIPS.length), tk = 0; tipEl.textContent = TIPS[ti];
    const iv = setInterval(() => {
      const f = document.querySelector('#loader .fill'), m = document.querySelector('#loader .msg');
      if (f && f.style.width) ink.style.width = f.style.width; if (m && m.textContent) msg.textContent = m.textContent;
      if (++tk % 25 === 0) { ti = (ti + 1) % TIPS.length; tipEl.textContent = TIPS[ti]; }
      if (AF.ready) { clearInterval(iv); ink.style.width = '100%'; cl.classList.add('done'); setTimeout(() => cl.remove(), 1300); }
    }, 200);
  } catch (e) { console.warn('[af] clarion', e); }

  // ------------------------------------------------------------------ state + public api
  const S = UI.state = { title: true, map: false, help: false, photo: false, dlg: null, bannerB: null, bannerT: 0, hudT: -9, speed: 0, toasts: [] };
  UI.titleOpen = () => S.title;
  UI.modalOpen = () => S.map || S.help;
  UI.dialogueOpen = () => !!S.dlg;
  const show = (el, on, disp = 'block') => { el.style.display = on ? disp : 'none'; };

  // toasts
  UI.toast = (text, ms) => {
    if (!text) return;
    const t = h('div', 'card', esc(text), toasts);
    const life = ms || AF.clamp(2600 + String(text).length * 45, 3000, 9000);
    S.toasts.push({ el: t, until: performance.now() + life });
    while (S.toasts.length > 3) { const o = S.toasts.shift(); o.el.remove(); }
  };
  AF.on('toast', (text) => UI.toast(text));
  AF.on('hint', (text) => { hint.textContent = text || ''; show(hint, !!text); });
  AF.toast = (msg) => AF.emit('toast', msg);

  // dialogue
  const dN = dlg.querySelector('.nm'), dR = dlg.querySelector('.rl'), dL = dlg.querySelector('.ln'), dF = dlg.querySelector('.face');
  AF.on('dialogue', (d) => {
    if (!d) { closeDlg(); return; }
    const lines = Array.isArray(d.lines) ? d.lines.slice() : [d.line || ''];
    S.dlg = { name: d.name || '', role: d.role || '', lines, i: 0, shown: 0, t: 0, done: false, frame: AF.clock.frame, hold: 0 };
    const role0 = String(S.dlg.role || '').replace(/\s*\u00b7\s*lives on .*$/i, '');
    dN.textContent = S.dlg.name; dR.textContent = role0 ? '· ' + role0 : ''; dL.textContent = '';
    const pp = d.person || {}, lv = d.livesOn || pp.livesOn || (pp.home && pp.home.name ? pp.home.name.replace(/\s+home$/i, '') : '');
    dlg.querySelector('.lv').textContent = lv ? 'lives on ' + lv : (d.place ? d.place : '');
    // a deco medallion portrait: sunburst in a colour of their own + initials
    const nm = String(S.dlg.name || '?').trim(), ini = nm.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || '?';
    let hsh = 0; for (const ch of nm) hsh = (hsh * 31 + ch.charCodeAt(0)) >>> 0;
    const pal = [['#a8322b', '#5e1a16'], ['#2e7d6a', '#123d34'], ['#2d4a7a', '#142440'], ['#b8862e', '#5a3d10'], ['#7a3f6e', '#3a1834'], ['#3f6f8f', '#173548']][hsh % 6];
    dF.innerHTML = `<svg viewBox="0 0 66 66"><defs><radialGradient id="afpg" cx="50%" cy="40%" r="70%"><stop offset="0" stop-color="${pal[0]}"/><stop offset="1" stop-color="${pal[1]}"/></radialGradient></defs><rect width="66" height="66" fill="url(#afpg)"/><g stroke="#e6c46a" stroke-opacity=".35" stroke-width="1">${Array.from({ length: 16 }, (_, i) => { const a = i / 16 * Math.PI * 2; return `<line x1="33" y1="33" x2="${(33 + Math.cos(a) * 40).toFixed(1)}" y2="${(33 + Math.sin(a) * 40).toFixed(1)}"/>`; }).join('')}</g><circle cx="33" cy="33" r="19" fill="none" stroke="#e6c46a" stroke-opacity=".7"/></svg><span>${esc(ini)}</span>`;
    show(dlg, true);
  });
  const closeDlg = () => { S.dlg = null; show(dlg, false); };
  const advanceDlg = () => {
    const D = S.dlg; if (!D) return;
    const line = D.lines[D.i] || '';
    if (D.shown < line.length) { D.shown = line.length; dL.textContent = line; return; }
    if (D.i < D.lines.length - 1) { D.i++; D.shown = 0; D.hold = 0; dL.textContent = ''; return; }
    closeDlg();
  };
  dlg.addEventListener('click', advanceDlg);

  // banner
  const bK = banner.querySelector('.k'), bN = banner.querySelector('.n');
  const KIND = { shop: 'Shop', civic: 'Civic building', home: 'Residence', house: 'Residence', station: 'Railway station', church: 'Chapel', school: 'Schoolhouse', diner: 'Diner', cinema: 'Picture house', hotel: 'Hotel', farm: 'Farm' };
  UI.banner = (name, kind) => { bK.textContent = kind ? (KIND[kind] || String(kind).replace(/[-_]/g, ' ')) : 'Now entering'; bN.textContent = name; banner.classList.add('show'); S.bannerT = performance.now() + 3200; };

  // hud (drive)
  AF.on('hud', (d) => { if (!d) return; if (d.speed == null && d.mph == null && d.kmh == null) { S.hudT = -9; return; } S.hudT = AF.clock.t; S.speed = d.mph != null ? d.mph : (d.unit === 'mph' ? Math.abs(d.speed) : d.kmh != null ? d.kmh * 0.621 : Math.abs(d.speed || 0) * 2.237); S.gear = d.gear; S.car = d.car; });

  // time controls
  const setSpeedBtns = () => { clock.querySelectorAll('[data-sp]').forEach((b) => { const k = b.dataset.sp; b.classList.toggle('on', (k === 'pause' && AF.time.paused) || (!AF.time.paused && ((k === '1' && AF.time.speed < 0.1) || (k === '60' && AF.time.speed >= 0.9)))); }); };
  clock.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.sp === 'pause') AF.time.paused = !AF.time.paused;
    else if (b.dataset.sp === '1') { AF.time.paused = false; AF.time.speed = 1 / 240; }
    else if (b.dataset.sp === '60') { AF.time.paused = false; AF.time.speed = 1; }
    else if (b.dataset.k === 'gfx') { const G = AF.GFX; if (G && G.set) { const order = ['cinema', 'ultra', 'high', 'low'], cur = G.name || G.tier, nx = order[(order.indexOf(cur) + 1) % 4]; G.auto = false; G.set(nx); AF.emit('toast', 'Pictures set to ' + nx.toUpperCase() + (nx === 'low' ? ' — easy on the old machine.' : nx === 'ultra' ? ' — the full Hollywood treatment.' : nx === 'cinema' ? ' — capture quality for the newsreel cameras.' : '.')); } }
    else if (b.dataset.k === 'film') { if (AF.modes.film) AF.setMode('film', {}); }
    else if (b.dataset.k === 'help') toggleHelp();
    else if (b.dataset.k === 'map') toggleMap();
    setSpeedBtns(); b.blur();
  });
  const slider = clock.querySelector('input');
  slider.addEventListener('input', () => { AF.time.hours = +slider.value; S.sliding = true; });
  slider.addEventListener('change', () => { S.sliding = false; slider.blur(); document.getElementById('cv').focus(); });
  help.addEventListener('click', (e) => { if (e.target.closest('[data-k=closehelp]')) toggleHelp(false); });

  // title
  const dismissTitle = () => { S.title = false; root.classList.remove('titling'); title.classList.add('hide'); setTimeout(() => { if (!S.title) title.style.display = 'none'; }, 950); if (AF.PL && AF.PL.stopCine) AF.PL.stopCine(); };
  UI.showTitle = () => { S.title = true; root.classList.add('titling'); title.style.display = ''; title.classList.remove('hide'); };
  root.classList.add('titling');
  const surf = (x, z, y = 3) => AF.surfaceBelow ? AF.surfaceBelow(x, z, y, 6) : 0.25;
  const carPos = (c) => { if (!c) return null; const p = c.position || (c.mesh && c.mesh.position) || (c.group && c.group.position) || (c.obj && c.obj.position); if (p && isFinite(p.x)) return p; if (isFinite(c.x) && isFinite(c.z)) return c; return null; };
  UI.go = (what) => {
    dismissTitle();
    const P = AF.PLAN;
    if (what === 'walk') { const s = P.spawn; AF.setMode('walk', { x: s.x, y: s.y, z: s.z, yaw: s.yaw }); AF.emit('toast', 'Swell evening for a stroll! W A S D to walk · drag to look about · E to tip your hat.'); }
    else if (what === 'train') {
      const T = AF.train, sts = P.rail.stations;
      let st = sts[0], best = 1e9;
      for (const q of sts) { const t = T && T.nextArrival ? T.nextArrival(q.id) : 0; if (t > 6 && t < best) { best = t; st = q; } }
      const side = P.railSide(st.sC + 3, 3.1), x = side.x, z = side.z, tr = P.railPoint(st.sC + 3);
      AF.setMode('walk', { x, y: surf(x, z, 3), z, yaw: Math.atan2(tr.x - x, tr.z - z) });
      AF.emit('toast', `${st.name} stop. ${isFinite(best) && best < 1e8 ? 'The next car is due in ' + Math.round(best) + ' seconds' : 'The next car is on its way'} — a nickel a ride. Press E to hop aboard when she stops.`);
    } else if (what === 'drive') {
      const cars = AF.vehicles && (AF.vehicles.cars || AF.vehicles.list) || [];
      let best = null, bd = 1e9;
      for (const c of cars) { const p = carPos(c); if (!p) continue; const parked = c.parked || c.state === 'parked' || c.kind === 'parked' || c.ai === false; const cab = c.type && c.type.id === 'taxi'; const d = Math.hypot(p.x - P.spawn.x, p.z - P.spawn.z) + (parked ? 0 : 400) + (cab ? 0 : 900); if (d < bd) { bd = d; best = { c, p }; } }
      if (best) {
        const p = best.p, c = best.c, yaw = isFinite(c.yaw) ? c.yaw : 0, side = (c.halfW || 0.9) + 1.3;
        const cand = [1, -1].map((sg) => { const x = p.x + Math.cos(yaw) * side * sg, z = p.z - Math.sin(yaw) * side * sg; return { x, z, d: P.nearestRoad ? P.nearestRoad(x, z).d : 0 }; }).sort((a, b) => b.d - a.d)[0];
        AF.setMode('walk', { x: cand.x, y: surf(cand.x, cand.z, (c.y || 0) + 2), z: cand.z, yaw: Math.atan2(p.x - cand.x, p.z - cand.z) });
      } else {
        const x = 6.2, z = 74; AF.setMode('walk', { x, y: surf(x, z, 2), z, yaw: -Math.PI / 2 });
      }
      AF.emit('toast', 'A Harbour Cab Co. cab is idling at the kerb — step up and press E to take the wheel.');
    } else if (what === 'film') {
      if (AF.modes.film) AF.setMode('film', {});
    } else {
      if (AF.mode !== 'aerial' && AF.modes.aerial) AF.setMode('aerial', { keep: true });
      const LV = AF.PL && AF.PL.lookView; if (LV && AF.flyTo) AF.flyTo(LV.pos, LV.target, 3.2);
      AF.emit('toast', 'The whole city from the air. Drag to turn · wheel to zoom · double-click anywhere to land there.');
    }
  };
  title.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) UI.go(b.dataset.go); });

  // ------------------------------------------------------------------ maps
  const MAPPX = 1200, WS = 600;           // base map: 2 px per metre over x,z in [-300,300)
  const base = document.createElement('canvas'); base.width = base.height = MAPPX;
  const w2m = (x) => (x + 300) / WS * MAPPX;
  const drawBase = () => {
    const g = base.getContext('2d'), P = AF.PLAN, W = AF.W;
    const img = g.createImageData(MAPPX, MAPPX), D = img.data;
    const paper = [238, 225, 192];
    const hex = AF.PAL.hex;
    if (W && W.H) {
      for (let py = 0; py < MAPPX; py++) {
        const bz = Math.min(W.NZ - 1, Math.floor(py * W.NZ / MAPPX));
        for (let px = 0; px < MAPPX; px++) {
          const bx = Math.min(W.NX - 1, Math.floor(px * W.NX / MAPPX)), i = bx * W.NZ + bz;
          const c = hex[W.C[i]] ?? 0x6f9a3e, hh = W.H[i];
          const hW = W.H[Math.max(0, bx - 4) * W.NZ + bz], hN = W.H[bx * W.NZ + Math.max(0, bz - 4)];
          let shade = AF.clamp(1 + (hh - hW) * 0.05 + (hh - hN) * 0.04, 0.72, 1.2);
          const contour = hh > 3 && (hh % 16 === 0) && (hW !== hh || hN !== hh) ? 0.82 : 1;
          const r = (c >> 16) & 255, gg = (c >> 8) & 255, b = c & 255, k = 0.5;
          const o = (py * MAPPX + px) * 4;
          D[o] = AF.clamp((r * k + paper[0] * (1 - k)) * shade * contour, 0, 255);
          D[o + 1] = AF.clamp((gg * k + paper[1] * (1 - k)) * shade * contour, 0, 255);
          D[o + 2] = AF.clamp((b * k + paper[2] * (1 - k)) * shade * contour * 0.96, 0, 255);
          D[o + 3] = 255;
        }
      }
      g.putImageData(img, 0, 0);
    } else { g.fillStyle = '#eee1c0'; g.fillRect(0, 0, MAPPX, MAPPX); }
    const S2 = MAPPX / WS;
    // water
    g.fillStyle = 'rgba(92,140,170,.85)'; g.strokeStyle = '#3d6078'; g.lineWidth = 2;
    g.beginPath(); g.ellipse(w2m(P.lake.cx), w2m(P.lake.cz), P.lake.rx * S2, P.lake.rz * S2, 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.arc(w2m(P.pond.cx), w2m(P.pond.cz), P.pond.r * S2, 0, Math.PI * 2); g.fill(); g.stroke();
    g.lineCap = 'round'; g.lineJoin = 'round';
    g.strokeStyle = '#3d6078'; g.lineWidth = (P.river.width + 2) * S2 * 0.8;
    g.beginPath(); P.river.path.forEach(([x, z], i) => i ? g.lineTo(w2m(x), w2m(z)) : g.moveTo(w2m(x), w2m(z))); g.stroke();
    g.strokeStyle = 'rgba(110,160,190,1)'; g.lineWidth = P.river.width * S2 * 0.7; g.stroke();
    // roads
    g.strokeStyle = '#3a2718'; g.lineWidth = 11 * S2; g.beginPath();
    for (const r of P.roads) { g.moveTo(w2m(r.a[0]), w2m(r.a[1])); g.lineTo(w2m(r.b[0]), w2m(r.b[1])); } g.stroke();
    g.strokeStyle = '#f4ead0'; g.lineWidth = 8.5 * S2; g.stroke();
    // park
    g.fillStyle = 'rgba(96,140,72,.35)'; g.fillRect(w2m(P.park.x0), w2m(P.park.z0), (P.park.x1 - P.park.x0) * S2, (P.park.z1 - P.park.z0) * S2);
    // rail loop with ties
    const L = P.rail.length; g.beginPath();
    for (let s = 0; s <= L; s += 4) { const p = P.railPoint(s); s ? g.lineTo(w2m(p.x), w2m(p.z)) : g.moveTo(w2m(p.x), w2m(p.z)); }
    g.closePath(); g.strokeStyle = '#3a2718'; g.lineWidth = 5; g.stroke();
    g.setLineDash([2, 5]); g.strokeStyle = '#f4ead0'; g.lineWidth = 3; g.stroke(); g.setLineDash([]);
    // buildings
    for (const b of AF.buildings) {
      const B = b.box; if (!B) continue;
      const x = w2m(Math.min(B[0], B[3])), z = w2m(Math.min(B[2], B[5])), w = Math.abs(B[3] - B[0]) * S2, d = Math.abs(B[5] - B[2]) * S2;
      const civic = /civic|hall|hotel|library|church|school|fire|post|bank|station|depot/i.test((b.kind || '') + ' ' + (b.id || ''));
      g.fillStyle = civic ? '#b0563f' : (/home|house|cottage|farm|cabin|barn/i.test((b.kind || '') + (b.id || '')) ? '#c9905a' : '#a8743f');
      g.fillRect(x, z, w, d); g.strokeStyle = '#3a2718'; g.lineWidth = 1.5; g.strokeRect(x + 0.5, z + 0.5, w - 1, d - 1);
    }
    // stations
    for (const s of P.rail.stations) { const p = s.platform; g.fillStyle = '#6b4f33'; g.fillRect(w2m(p[0]), w2m(p[1]), (p[2] - p[0]) * S2, (p[3] - p[1]) * S2); }
    // vignette border
    const grd = g.createRadialGradient(MAPPX / 2, MAPPX / 2, MAPPX * 0.35, MAPPX / 2, MAPPX / 2, MAPPX * 0.75);
    grd.addColorStop(0, 'rgba(90,60,30,0)'); grd.addColorStop(1, 'rgba(90,60,30,.35)'); g.fillStyle = grd; g.fillRect(0, 0, MAPPX, MAPPX);
  };

  const markers = (g, tx, sc) => {         // tx(x) world->canvas, sc = px per metre
    const ppl = AF.people;
    if (ppl && ppl.length && sc > 0.5) { g.fillStyle = 'rgba(58,39,24,.8)'; for (const q of ppl) { if (!q || q.hidden || q.visible === false || !isFinite(q.x)) continue; g.fillRect(tx(q.x, 0) - 1.5, tx(q.z, 1) - 1.5, 3, 3); } }
    const T = AF.train;
    if (T && T.cars) { g.fillStyle = '#2f5d3a'; g.strokeStyle = '#1b130c'; g.lineWidth = 1; for (const c of T.cars) { if (!c.position) continue; g.beginPath(); g.arc(tx(c.position.x, 0), tx(c.position.z, 1), Math.max(2.2, 3 * sc), 0, 7); g.fill(); g.stroke(); } }
    const cars = AF.vehicles && (AF.vehicles.cars || AF.vehicles.list);
    if (cars && cars.length) { for (const c of cars) { const p = carPos(c); if (!p) continue; const id = c.type && c.type.id; g.fillStyle = id === 'taxi' ? '#e8b818' : id === 'bus' ? '#1f5a3a' : '#8a7a68'; const sz = id === 'bus' ? 6 : 4; g.fillRect(tx(p.x, 0) - sz / 2, tx(p.z, 1) - sz / 2, sz, sz); } }
    const c = AF.camera, pl = AF.player;
    // camera / player
    const walk = AF.mode === 'walk' && pl;
    const px = walk ? pl.x : (AF.camTarget ? AF.camTarget.x : 0), pz = walk ? pl.z : (AF.camTarget ? AF.camTarget.z : 0);
    const dir = new THREE.Vector3(); c.getWorldDirection(dir); const ang = Math.atan2(dir.x, dir.z);
    const X = tx(px, 0), Z = tx(pz, 1);
    g.save(); g.translate(X, Z);
    if (!walk) { g.fillStyle = 'rgba(168,50,43,.18)'; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 60, Math.PI / 2 - ang - 0.5, Math.PI / 2 - ang + 0.5); g.closePath(); g.fill(); }
    g.rotate(-(walk ? pl.yaw : ang) + Math.PI);
    g.fillStyle = '#a8322b'; g.strokeStyle = '#f5ecd6'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(0, -9); g.lineTo(6, 6); g.lineTo(0, 3); g.lineTo(-6, 6); g.closePath(); g.stroke(); g.fill();
    g.restore();
  };

  const mcv = mini.querySelector('canvas'), mg = mcv.getContext('2d'), mLbl = mini.querySelector('.lbl');
  const drawMini = () => {
    const N = mcv.width;
    const walk = AF.mode === 'walk' && AF.player;
    const span = walk ? 150 : (AF.mode === 'aerial' && AF.PL && AF.PL.aerial ? AF.clamp(AF.PL.aerial.d * 1.6, 160, 600) : 600);
    const cx = walk ? AF.player.x : (span >= 600 ? 0 : AF.camTarget.x), cz = walk ? AF.player.z : (span >= 600 ? 0 : AF.camTarget.z);
    const sc = N / span;
    mg.save(); mg.clearRect(0, 0, N, N);
    mg.beginPath(); mg.arc(N / 2, N / 2, N / 2, 0, 7); mg.clip();
    mg.fillStyle = '#e8d9b4'; mg.fillRect(0, 0, N, N);
    const s0 = (cx - span / 2 + 300) / WS * MAPPX, t0 = (cz - span / 2 + 300) / WS * MAPPX, sw = span / WS * MAPPX;
    mg.drawImage(base, s0, t0, sw, sw, 0, 0, N, N);
    markers(mg, (v, ax) => (v - (ax ? cz : cx)) * sc + N / 2, sc);
    mg.restore();
  };

  const mapCv = mapEl.querySelector('canvas'), mapG = mapCv.getContext('2d'), labs = mapEl.querySelector('.labs');
  let mapN = 600;
  mapEl.addEventListener('click', () => { const pk = labs.querySelector('.poi-pick'); if (pk) pk.remove(); });
  const buildMapLabels = () => {
    labs.innerHTML = '';
    const boxes = [];
    const add = (name, x, z, cls, fn) => {
      const lx = (x + 300) / WS * mapN, lz = (z + 300) / WS * mapN;
      const fw = cls === 'view' ? 7.2 : cls === 'place' ? 6.8 : 6.0, bw = name.length * fw + (cls === 'view' ? 18 : 6), bh = cls === 'view' ? 17 : 14;
      const bb = [lx - bw / 2, lz - bh / 2, lx + bw / 2, lz + bh / 2];
      if (bb[0] < 2 || bb[2] > mapN - 2 || bb[1] < 2 || bb[3] > mapN - 2) return;
      for (const o of boxes) if (bb[0] < o[2] && bb[2] > o[0] && bb[1] < o[3] && bb[3] > o[1]) return;
      boxes.push(bb);
      const e = document.createElement('div'); e.className = 'lab ' + cls; e.textContent = name;
      e.style.left = lx + 'px'; e.style.top = lz + 'px';
      e.addEventListener('click', (ev) => {
        ev.stopPropagation();
        if (ev.shiftKey) { fn(true); return; }
        // owner 09-28: clicking a place offers a choice: teleport there and walk around, or fly over for a look
        const old = labs.querySelector('.poi-pick'); if (old) old.remove();
        const pk = document.createElement('div'); pk.className = 'poi-pick';
        pk.style.left = lx + 'px'; pk.style.top = (lz + bh / 2 + 6) + 'px';
        pk.innerHTML = '<div class="t"></div><button class="btn sm" data-a="walk">Teleport here &amp; walk</button><button class="btn sm ghost" data-a="fly">Fly over</button>';
        pk.querySelector('.t').textContent = name.replace(/^★\s*/, '');
        pk.addEventListener('click', (e2) => { e2.stopPropagation(); const a = e2.target && e2.target.dataset && e2.target.dataset.a; if (!a) return; pk.remove(); fn(a === 'walk'); });
        labs.appendChild(pk);
      });
      labs.appendChild(e);
    };
    const seen = new Set();
    const travel = (x, z, shift, b) => {
      toggleMap(false);
      if (shift) {
        let px = x, pz = z, yaw = 0;
        if (b && b.doors && b.doors.length) { const d = b.doors[0]; yaw = d.yaw || 0; px = d.x - Math.sin(yaw) * 1.2; pz = d.z - Math.cos(yaw) * 1.2; }
        const y = AF.surfaceBelow ? AF.surfaceBelow(px, pz, 80, 100) : 0.25;
        AF.setMode('walk', { x: px, y, z: pz, yaw });
      } else AF.flyTo([x + 38, 42, z + 52], [x, 2, z]);
    };
    const views = [...AF.PLAN.views, ...(AF.viewpoints || []).filter((v) => !/inside|interior|lobby|room|nave|classroom|rotunda/i.test(v.name))];
    const vseen = new Set();
    for (const v of views) {
      if (vseen.has(v.name)) continue; vseen.add(v.name);
      add('★ ' + v.name, v.target[0], v.target[2] + 6, 'view', (sh) => { if (sh) travel(v.target[0], v.target[2], true); else { toggleMap(false); AF.flyTo(v.pos, v.target); } });
    }
    for (const l of [...AF.labels].sort((p, q) => (p.kind === 'building' ? 1 : 0) - (q.kind === 'building' ? 1 : 0))) {
      const key = l.name + '|' + Math.round(l.x / 10) + '|' + Math.round(l.z / 10); if (seen.has(key)) continue; seen.add(key);
      const b = l.kind === 'building' ? AF.buildings.find((B) => B.name === l.name) : null;
      if (b && /house|home|residence|cottage|cabin/i.test((b.kind || '') + ' ' + (b.id || '')) && !/farm|board|doctor/i.test(b.name + b.id)) continue;   // keep the map readable
      add(l.name, l.x, l.z, l.kind === 'building' ? 'bld' : (l.kind || 'place'), (sh) => travel(l.x, l.z, sh, b));
    }
  };
  const drawMap = () => {
    const N = mapCv.width;
    mapG.clearRect(0, 0, N, N); mapG.drawImage(base, 0, 0, N, N);
    markers(mapG, (v) => (v + 300) / WS * N, N / WS);
    mapG.save(); mapG.fillStyle = 'rgba(245,236,214,.9)'; mapG.strokeStyle = '#3a2718'; mapG.lineWidth = 1.5;
    mapG.font = '12px Georgia'; mapG.textBaseline = 'middle'; const ly = N - 22;
    const items = [['you', (x) => { mapG.fillStyle = '#a8322b'; mapG.beginPath(); mapG.moveTo(x + 5, ly - 6); mapG.lineTo(x + 10, ly + 5); mapG.lineTo(x, ly + 5); mapG.fill(); }],
      ['streetcar', (x) => { mapG.fillStyle = '#2f5d3a'; mapG.beginPath(); mapG.arc(x + 5, ly, 4, 0, 7); mapG.fill(); }],
      ['cabs', (x) => { mapG.fillStyle = '#e8b818'; mapG.fillRect(x + 2, ly - 3, 6, 6); }],
      ['motor cars', (x) => { mapG.fillStyle = '#8a7a68'; mapG.fillRect(x + 2, ly - 3, 6, 6); }],
      ['townsfolk', (x) => { mapG.fillStyle = 'rgba(58,39,24,.8)'; mapG.fillRect(x + 3.5, ly - 1.5, 3, 3); }]];
    let lw = 12; for (const [t] of items) lw += 16 + mapG.measureText(t).width + 12;
    mapG.fillStyle = 'rgba(239,230,210,.94)'; mapG.fillRect(10, N - 34, lw, 24); mapG.strokeRect(10.5, N - 33.5, lw - 1, 23);
    let lx = 18; for (const [t, ic] of items) { ic(lx); mapG.fillStyle = '#3a2718'; mapG.fillText(t, lx + 14, ly); lx += 16 + mapG.measureText(t).width + 12; }
    mapG.restore();
    // compass
    mapG.save(); mapG.translate(N - 46, 50); mapG.fillStyle = '#3a2718'; mapG.font = 'bold 16px Georgia'; mapG.textAlign = 'center'; mapG.fillText('N', 0, -22);
    mapG.beginPath(); mapG.moveTo(0, -18); mapG.lineTo(8, 10); mapG.lineTo(0, 4); mapG.lineTo(-8, 10); mapG.closePath(); mapG.fill(); mapG.restore();
  };
  const toggleMap = (on) => {
    S.map = on ?? !S.map;
    if (S.map) {
      mapN = Math.round(Math.max(320, Math.min(innerHeight - 110, innerWidth - 60, 900)));
      mapCv.width = mapCv.height = mapN; mapCv.style.width = mapCv.style.height = mapN + 'px'; const wr = mapEl.querySelector('.wrap'); wr.style.width = wr.style.height = mapN + 'px'; mapEl.querySelector('.sheet').style.width = mapN + 'px';
      buildMapLabels(); drawMap();
      S.help = false; show(help, false);
    }
    show(mapEl, S.map, 'flex');
  };
  mapEl.addEventListener('click', (e) => { if (e.target === mapEl) toggleMap(false); });
  const toggleHelp = (on) => { S.help = on ?? !S.help; if (S.help) { S.map = false; show(mapEl, false); } show(help, S.help); };
  UI.toggleMap = toggleMap; UI.toggleHelp = toggleHelp;

  // speedometer
  const sg = speedo.querySelector('canvas').getContext('2d');
  const drawSpeedo = (mph) => {
    const g = sg, N = 300, R = 128; g.clearRect(0, 0, N, N);
    g.save(); g.translate(150, 158);
    g.strokeStyle = '#3a2718'; g.fillStyle = '#3a2718'; g.textAlign = 'center'; g.font = '18px Georgia';
    for (let v = 0; v <= 80; v += 10) { const a = Math.PI * 0.75 + (v / 80) * Math.PI * 1.5; g.lineWidth = 3; g.beginPath(); g.moveTo(Math.cos(a) * (R - 8), Math.sin(a) * (R - 8)); g.lineTo(Math.cos(a) * (R - 26), Math.sin(a) * (R - 26)); g.stroke(); g.fillText(v, Math.cos(a) * (R - 46), Math.sin(a) * (R - 46) + 6); }
    const a = Math.PI * 0.75 + AF.clamp(mph / 80, 0, 1) * Math.PI * 1.5;
    g.strokeStyle = '#a8322b'; g.lineWidth = 5; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * (R - 22), Math.sin(a) * (R - 22)); g.stroke();
    g.fillStyle = '#3a2718'; g.beginPath(); g.arc(0, 0, 10, 0, 7); g.fill();
    g.font = 'bold 30px Georgia'; g.fillText(Math.round(mph), 0, 62); g.font = 'italic 14px Georgia'; g.fillText('m.p.h.', 0, 82);
    g.restore();
  };

  // ------------------------------------------------------------------ build + tick
  AF.onBuild('ui', 810, () => {
    try { drawBase(); } catch (e) { console.warn('[af] ui map base failed', e); }
    root.appendChild(title); // keep title above the rest
  });
  AF.on('mode', (name) => {
    const names = { aerial: 'Aerial view', walk: 'On foot', drive: 'Driving', ride: 'Riding the streetcar', film: 'Film mode', free: 'Free camera' };
    root.classList.toggle('filming', name === 'film');
    if (name === 'film') { if (S.photo) setPhoto(-1); if (S.map) toggleMap(false); if (S.help) toggleHelp(false); if (S.dlg) closeDlg(); }
    if (name === 'free') AF.emit('toast', 'Free camera: W A S D to fly · Q / E down and up · drag to look · Shift fast · Alt slow · wheel for the lens · C to leave.');
    clock.querySelector('.mode').textContent = names[name] || (name ? name : 'Camera');
    if (name && name !== 'aerial' && S.title) dismissTitle();
    if (name !== 'drive') show(speedo, false);
  });

  let frameN = 0;
  const fmt = (hrs) => { const hh = Math.floor(hrs) % 24, mm = Math.floor((hrs - Math.floor(hrs)) * 60); const h12 = ((hh + 11) % 12) + 1; return [h12 + ':' + String(mm).padStart(2, '0'), hh < 12 ? 'AM' : 'PM']; };
  AF.onTick('ui', 950, (dt) => {
    frameN++;
    const I = AF.input;
    // keys
    if (I.hit('Enter') && S.title) UI.go('walk');
    const PLx = AF.PL || {}, fr = AF.clock.frame;
    if (I.hit('KeyF') && AF.mode !== 'film' && AF.modes.film && !S.dlg && !(PLx.film && PLx.film.exitFrame === fr)) { if (S.title) dismissTitle(); AF.setMode('film', {}); }
    if (I.hit('KeyC') && AF.mode !== 'free' && AF.mode !== 'ride' && AF.mode !== 'film' && AF.modes.free && !S.dlg && !(PLx.free && PLx.free.exitFrame === fr)) { if (S.title) dismissTitle(); AF.setMode('free', {}); }
    const cineOn = !!(AF.PL && AF.PL.cine && AF.PL.cine.on && AF.mode !== 'film');
    if (cineOn !== root.classList.contains('cine')) root.classList.toggle('cine', cineOn);
    if (cineOn) { const b = AF.PL.cine.black.toFixed(3); if (fBlk._b !== b) { fBlk.style.opacity = b; fBlk._b = b; } }
    if (AF.mode === 'film' && AF.PL && AF.PL.film) {
      const F = AF.PL.film, sh = F.shots[F.i], b = F.black.toFixed(3);
      if (fBlk._b !== b) { fBlk.style.opacity = b; fBlk._b = b; }
      film.classList.toggle('bars', !!F.bars);
      fCap.classList.toggle('on', !!F.titles && sh && F.t > 0.9 && F.t < sh.dur - 1.6);
      fHk.classList.toggle('on', F.hintT > 0 || F.pauseT > 0 || F.paused && F.pauseT > 0);
    }
    const filming = AF.mode === 'film';
    if (I.hit('KeyM') && !filming) toggleMap();
    if ((I.hit('KeyH') || I.hit('Slash')) && !filming) toggleHelp();
    if (I.hit('KeyP') && !filming) setPhoto(S.photo ? (S.photoI + 1 < PRESETS.length ? S.photoI + 1 : -1) : 0);
    if (I.hit('Escape') && S.photo) setPhoto(-1);
    else if (I.hit('Escape')) { if (S.map || S.help) { toggleMap(false); toggleHelp(false); } else if (S.dlg && AF.clock.frame > S.dlg.frame) closeDlg(); }
    // dialogue: typewriter
    const D = S.dlg;
    if (D) {
      const line = D.lines[D.i] || '';
      dlg.classList.toggle('typing', D.shown < line.length);
      if (D.shown < line.length) { D.t += dt * 42; const n = Math.min(line.length, Math.floor(D.t)); if (n !== D.shown) { D.shown = n; dL.textContent = line.slice(0, n); } if (D.shown >= line.length) D.hold = 0; }
      else { D.hold += dt; D.t = line.length; if (D.hold > 3.2 + line.length * 0.04) { if (D.i < D.lines.length - 1) { D.i++; D.shown = 0; D.t = 0; D.hold = 0; dL.textContent = ''; } else closeDlg(); } }
      if (S.dlg && I.hit('KeyE') && AF.clock.frame > D.frame) advanceDlg();
    }
    try { overUpdate(dt); } catch (e) { over.style.display = 'none'; }
    // interaction prompt
    const it = AF.mode === 'walk' && !S.dlg && !S.map && !S.help ? AF.interactTarget : null;
    if (it) { const lab = '<b>E</b>' + esc(it.label || 'Use'); if (prompt._l !== lab) { prompt.innerHTML = lab; prompt._l = lab; } }
    show(prompt, !!it);
    // toasts expire
    const now = performance.now();
    for (let i = S.toasts.length - 1; i >= 0; i--) { const o = S.toasts[i]; if (now > o.until) { o.el.style.opacity = '0'; if (now > o.until + 600) { o.el.remove(); S.toasts.splice(i, 1); } } }
    // banner: entering a building
    if (frameN % 8 === 0) {
      let b = null;
      if (AF.mode === 'walk' && AF.player) b = AF.buildingAt(AF.player.x, AF.player.y + 1, AF.player.z);
      else if (AF.mode === 'aerial' && AF.PL && AF.PL.aerial && AF.PL.aerial.d < 70) { const f = AF.PL.aerial.f; b = AF.buildings.find((B) => f.x >= B.box[0] && f.x <= B.box[3] && f.z >= B.box[2] && f.z <= B.box[5]) || null; }
      if (b !== S.bannerB) { S.bannerB = b; if (b && b.name) UI.banner(b.name, b.kind); }
    }
    if (S.bannerT && now > S.bannerT) { banner.classList.remove('show'); S.bannerT = 0; }
    // clock
    if (frameN % 10 === 0) {
      const [t, ap] = fmt(AF.time.hours); clock.querySelector('.tm').textContent = t; clock.querySelector('.ap').textContent = ap;
      if (!S.sliding && document.activeElement !== slider) slider.value = AF.time.hours.toFixed(2);
      setSpeedBtns();
      const gb = clock.querySelector('[data-k=gfx]'), gt = AF.GFX ? (AF.GFX.name || AF.GFX.tier || 'ultra') : 'ultra', gl = gt[0].toUpperCase() + gt.slice(1);
      if (gb.textContent !== gl) gb.textContent = gl;
    }
    // minimap + map
    if (!S.photo && frameN % 2 === 0) drawMini();
    if (S.map && frameN % 6 === 0) drawMap();
    if (frameN % 30 === 0) { const b = S.bannerB; mLbl.textContent = b && b.name ? b.name : (AF.mode === 'walk' && AF.PLAN.nearestRoad ? (AF.PLAN.nearestRoad(AF.player.x, AF.player.z).d < 9 ? AF.PLAN.nearestRoad(AF.player.x, AF.player.z).road.name : 'Port Solace') : 'Port Solace'); }
    // speedo
    const drv = AF.mode === 'drive' && AF.clock.t - S.hudT < 1.0;
    show(speedo, drv); if (drv && frameN % 2 === 0) drawSpeedo(S.speed);
    // debug
    if (dbg && frameN % 15 === 0) {
      const R = AF.renderer.info.render, p = AF.player || {}, c = AF.camera.position;
      dbg.textContent = `fps ${AF.fps.toFixed(0)}  calls ${R.calls}  tris ${(R.triangles / 1000).toFixed(0)}k\nmode ${AF.mode}  quads ${AF.stats ? AF.stats.quads : '?'}\nplayer ${(+p.x).toFixed(1)}, ${(+p.y).toFixed(2)}, ${(+p.z).toFixed(1)}\ncamera ${c.x.toFixed(1)}, ${c.y.toFixed(1)}, ${c.z.toFixed(1)}\nhour ${AF.time.hours.toFixed(2)}  boot ${AF.bootMs} ms`;
    }
  });

  // ------------------------------------------------------------------ tests (real DOM events)
  let bootMode = null;
  AF.on('ready', () => { bootMode = AF.mode; title.classList.add('go'); });
  const key = (type, code) => window.dispatchEvent(new KeyboardEvent(type, { code, key: code, bubbles: true }));
  const tap = (code, n = 1) => { key('keydown', code); AF.step(n); key('keyup', code); AF.step(1); };
  AF.test('player: aerial mode at boot', () => ({ ok: bootMode === 'aerial', info: 'boot mode ' + bootMode }));
  AF.test('player: title "Explore on foot" enters walk at spawn', () => {
    UI.showTitle();
    const b = [...title.querySelectorAll('button')].find((x) => /explore on foot/i.test(x.textContent));
    if (!b) return { ok: false, info: 'no button' };
    b.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    AF.step(2);
    const s = AF.PLAN.spawn, p = AF.player, d = Math.hypot(p.x - s.x, p.z - s.z);
    return { ok: AF.mode === 'walk' && d < 1.5 && !S.title, info: `mode ${AF.mode} dist ${d.toFixed(2)} y ${p.y.toFixed(2)}` };
  });
  AF.test('player: holding KeyW for 60 steps walks > 4 m', () => {
    const s = AF.PLAN.spawn; if (AF.mode !== 'walk') AF.setMode('walk', { x: s.x, y: s.y, z: s.z, yaw: s.yaw });
    AF.emit('dialogue', null);
    // choose a heading from the spawn with 7 m of open ground (benches / flower beds are legitimately solid)
    let yaw = s.yaw;
    for (const a of [s.yaw, 0, Math.PI / 2, -Math.PI / 2, Math.PI / 4, -Math.PI / 4, Math.PI * 0.75, -Math.PI * 0.75]) {
      let clear = true; for (let d = 0.5; d <= 7; d += 0.5) if (AF.boxBlocked(s.x + Math.sin(a) * d, s.y + 0.55, s.z + Math.cos(a) * d, 0.3, 1.6)) { clear = false; break; }
      if (clear) { yaw = a; break; }
    }
    AF.player.teleport(s.x, s.y, s.z, yaw); AF.step(2);
    const x0 = AF.player.x, z0 = AF.player.z;
    key('keydown', 'KeyW'); AF.step(60); key('keyup', 'KeyW'); AF.step(1);
    const d = Math.hypot(AF.player.x - x0, AF.player.z - z0);
    return { ok: d > 4, info: `heading ${yaw.toFixed(2)} moved ${d.toFixed(2)} m to ${AF.player.x.toFixed(1)},${AF.player.z.toFixed(1)}` };
  });
  AF.test('player: KeyE next to an interact fires it', () => {
    const s = AF.PLAN.spawn; if (AF.mode !== 'walk') AF.setMode('walk', {});
    AF.emit('dialogue', null);
    AF.player.teleport(s.x, s.y, s.z, s.yaw); AF.step(2);
    let fired = 0; const got = []; const lst = (t) => got.push(t);
    AF.addInteract({ x: AF.player.x + 0.2, y: AF.player.y + 1, z: AF.player.z, r: 1.5, label: 'Test bell', act: () => { fired++; } });
    const it = AF.interacts[AF.interacts.length - 1];
    AF.on('interact', lst);
    AF.step(1);
    const target = AF.interactTarget === it;
    const promptShown = (AF.step(1), prompt.style.display !== 'none' && /Test bell/.test(prompt.textContent));
    tap('KeyE', 1);
    AF.removeInteract(it); AF._ev.interact.splice(AF._ev.interact.indexOf(lst), 1);
    return { ok: fired === 1 && target && got[0] === it, info: `fired ${fired} target ${target} prompt ${promptShown}` };
  });
  AF.test('player: walk camera never inside solid voxels in buildings', () => {
    const bs = AF.buildings.filter((b) => b.interior !== false && b.doors && b.doors.length);
    let checked = 0, bad = [], skipped = 0;
    if (AF.mode !== 'walk') AF.setMode('walk', {});
    for (const b of bs) {
      const d = b.doors[0], yaw = d.yaw || 0;
      const x = d.x + Math.sin(yaw) * 3.5, z = d.z + Math.cos(yaw) * 3.5;
      const y = AF.surfaceBelow(x, z, (d.y ?? b.box[1]) + 1.5, 3);
      if (AF.boxBlocked(x, y, z, 0.3, 1.7)) { skipped++; continue; }
      for (let k = 0; k < 4; k++) {
        AF.player.teleport(x, y, z, yaw + k * Math.PI / 2);
        AF.step(4);
        const c = AF.camera.position; checked++;
        if (AF.solidAt(c.x, c.y, c.z)) bad.push((b.id || b.name) + '@' + k);
      }
    }
    return { ok: checked > 20 && bad.length === 0, info: `${checked} poses in ${bs.length} buildings (${skipped} doors blocked), inside solid: ${bad.slice(0, 8).join(', ')}` };
  });
  AF.test('player: M opens the map', () => {
    toggleMap(false);
    tap('KeyM', 1);
    const open = S.map && mapEl.style.display === 'flex';
    tap('KeyM', 1);
    const closed = !S.map;
    return { ok: open && closed, info: `open ${open} closed ${closed}` };
  });
  AF.test('film: F starts the tour (UI hidden, cinema), arrows change shot, Esc restores', () => {
    const F = AF.PL && AF.PL.film; if (!F) return { ok: false, info: 'no film' };
    AF.setMode('aerial', { pos: AF.PLAN.views[0].pos, target: AF.PLAN.views[0].target }); AF.step(2);
    const h0 = AF.time.hours, g0 = AF.GFX.name || AF.GFX.tier;
    tap('KeyF', 2);
    const on = AF.mode === 'film' && root.classList.contains('filming') && getComputedStyle(clock).display === 'none';
    const cin = !!AF.GFX.cinema, i0 = F.i;
    tap('ArrowRight', 2); const i1 = F.i;
    const c0 = AF.camera.position.clone(); AF.step(30); const moved = AF.camera.position.distanceTo(c0);
    tap('Escape', 2);
    const off = AF.mode === 'aerial' && !root.classList.contains('filming') && Math.abs(AF.time.hours - h0) < 0.01 && (AF.GFX.name || AF.GFX.tier) === g0;
    return { ok: on && cin && i1 !== i0 && moved > 0.3 && off, info: `on ${on} cinema ${cin} shot ${i0}->${i1} moved ${moved.toFixed(2)} m, off ${off} (mode ${AF.mode}, gfx ${AF.GFX.name})` };
  });
  AF.test('film: no shot camera inside solid (static paths, 60 samples each)', () => {
    const F = AF.PL && AF.PL.film; if (!F) return { ok: false, info: 'no film' };
    const bad = []; let n = 0;
    F.shots.forEach((S, i) => { if (S.dyn) return; for (let k = 0; k <= 60; k++) { const r = AF.PL.filmEval(i, S.dur * k / 60); n++; if (AF.solidAt(r.pos.x, r.pos.y, r.pos.z)) { bad.push(S.name + '@' + k); break; } } });
    return { ok: bad.length === 0 && F.shots.length >= 12, info: `${F.shots.length} shots, ${n} samples, inside solid: ${bad.join(', ')}` };
  });
  AF.test('free camera: C enters, W flies forward, C leaves', () => {
    AF.setMode('aerial', { pos: [0, 40, 120], target: [0, 10, 0] }); AF.step(2);
    tap('KeyC', 2); const on = AF.mode === 'free';
    const c0 = AF.camera.position.clone();
    key('keydown', 'KeyW'); AF.step(40); key('keyup', 'KeyW'); AF.step(1);
    const d = AF.camera.position.distanceTo(c0), fwd = AF.camera.position.z < c0.z;
    tap('KeyC', 2); const off = AF.mode === 'aerial';
    return { ok: on && d > 3 && fwd && off, info: `on ${on} flew ${d.toFixed(1)} m forward ${fwd} off ${off}` };
  });
  AF.test('player: restore aerial', () => { AF.setMode('aerial', { pos: AF.PLAN.views[0].pos, target: AF.PLAN.views[0].target }); AF.step(2); return { ok: AF.mode === 'aerial', info: AF.mode }; });
}

} catch (e) { AF.partError('71-ui.js', e); }

