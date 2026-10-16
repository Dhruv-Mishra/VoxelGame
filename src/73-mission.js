// ================================================================ 73-mission.js
try {
// ===== 73-mission: the objective kit every mission shares (jobs, the gallery, the heist)  (OWNER: player) =====
// AF.mission.blip(id, { x, y, z | at() -> {x,y,z}, kind, label, primary, marker, r, on() }) -> blip; unblip(id). Blips are drawn on the
//   world map and the minimap (clamped to its rim, the primary one with a route line); a blip with `marker` gets the world marker: a
//   ground ring, a dithered light column and a bobbing chevron (one InstancedMesh, one draw for all of them, hidden while unused).
//   The primary blip also gets a distance tag on screen, or an arrow on the screen edge while it's out of view.
// AF.mission.objective(text, title) — the objective line, bottom centre ({words} in gold).  bar(id, { label, value, pct, hot } | null)
//   — timer / counter bars, bottom right.  shard(title, sub, kind, ms) — the big centred title (start | pass | fail | info).
// AF.mission.cut.play({ shots, pose, end, onEnd }) — a letterboxed cutscene: shots [{ cam, cam2, look, look2, d, say: [who, text] }],
//   Space / E / click / tap skips. Plays on each client by itself (co-op: every player sees their own copy); never in ?test.
{
  const UI = AF.ui, root = document.getElementById('ui'), PI = Math.PI;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const M = AF.mission = { blips: new Map(), primary: null, rev: 0 };
  const css = document.createElement('style');
  css.textContent = `
  #ui #h-obj{position:absolute;left:50%;bottom:calc(max(16px,env(safe-area-inset-bottom)) + 14px);transform:translateX(-50%);max-width:min(760px,calc(100% - 600px));min-width:280px;text-align:center;pointer-events:none;transition:opacity .5s;opacity:0;text-shadow:0 1px 3px #000,0 0 14px rgba(0,0,0,.65)}
  #ui #h-obj.on{opacity:1} #ui #h-obj .ot{font-size:10.5px;letter-spacing:2.4px;text-transform:uppercase;color:var(--gold);font-weight:700}
  #ui #h-obj .ol{font-size:17px;font-weight:500;color:#fff;line-height:1.35} #ui #h-obj em{font-style:normal;color:var(--gold);font-weight:700}
  #ui #h-bars{display:flex;flex-direction:column;align-items:flex-end;gap:3px}
  #ui .tb{display:flex;align-items:center;justify-content:space-between;gap:14px;width:250px;height:30px;padding:0 12px 0 14px;box-sizing:border-box;background:linear-gradient(90deg,rgba(6,8,12,0),rgba(6,8,12,.78) 22%);color:#fff;text-shadow:0 1px 2px #000}
  #ui .tb small{font-size:10.5px;letter-spacing:1.6px;text-transform:uppercase;opacity:.85;white-space:nowrap} #ui .tb b{font-size:17px;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
  #ui .tb .pb{flex:0 0 112px;height:7px;background:rgba(255,255,255,.14);border-radius:2px;overflow:hidden} #ui .tb .pb i{display:block;height:100%;width:0;background:var(--gold);transition:width .15s}
  #ui .tb.hot b{color:#ff7a6a} #ui .tb.hot .pb i{background:#ff5a4a} #ui .tb.ok b{color:#7ddc8a} #ui .tb.ok .pb i{background:#7ddc8a}
  #ui #h-shard{position:absolute;left:0;right:0;top:30%;z-index:5;padding:14px 0 16px;text-align:center;pointer-events:none;opacity:0;transition:opacity .6s;background:linear-gradient(90deg,rgba(0,0,0,0),rgba(0,0,0,.66) 22%,rgba(0,0,0,.66) 78%,rgba(0,0,0,0))}
  #ui #h-shard.on{opacity:1} #ui #h-shard h1{margin:0;font:400 46px/1.1 Limelight,Georgia,serif;letter-spacing:3px;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.8)}
  #ui #h-shard p{margin:6px 0 0;font-size:13px;letter-spacing:3px;text-transform:uppercase;color:#e9ecee} #ui #h-shard.pass h1{color:var(--gold)} #ui #h-shard.fail h1{color:#ff6a5a} #ui #h-shard.start p{color:var(--gold)}
  #ui #h-edge{position:absolute;left:0;top:0;width:34px;height:34px;margin:-17px 0 0 -17px;pointer-events:none;display:none;will-change:transform}
  #ui #h-edge svg{width:100%;height:100%;filter:drop-shadow(0 1px 3px rgba(0,0,0,.8))} #ui #h-edge span{position:absolute;left:50%;top:100%;transform:translateX(-50%);font:700 11px var(--font);color:#fff;white-space:nowrap;text-shadow:0 1px 2px #000}
  #ui #h-mdist{position:absolute;left:0;top:0;transform:translate(-50%,0);font:700 12px var(--font);color:#fff;text-shadow:0 1px 2px #000,0 0 6px rgba(0,0,0,.6);pointer-events:none;display:none;white-space:nowrap;will-change:transform}
  #ui #h-mdist b{color:var(--gold);font-weight:700;margin-right:5px}
  #ui #h-cut{position:absolute;inset:0;pointer-events:none;display:none;z-index:6}
  #ui #h-cut.on{display:block} #ui #h-cut .lb{position:absolute;left:0;right:0;height:0;background:#000;transition:height .5s ease} #ui #h-cut .t{top:0} #ui #h-cut .b{bottom:0}
  #ui #h-cut.on .lb{height:11.5vh}
  #ui #h-cut .sub{position:absolute;left:50%;bottom:calc(11.5vh + 18px);transform:translateX(-50%);width:min(760px,86vw);text-align:center;font-size:18px;line-height:1.4;color:#fff;text-shadow:0 1px 3px #000,0 0 12px rgba(0,0,0,.7);opacity:0;transition:opacity .3s}
  #ui #h-cut .sub.on{opacity:1} #ui #h-cut .sub b{color:var(--gold);font-weight:700;margin-right:6px;letter-spacing:.5px}
  #ui #h-cut .sk{position:absolute;right:max(22px,env(safe-area-inset-right));bottom:calc(11.5vh - 30px);font-size:11px;letter-spacing:1px;color:rgba(255,255,255,.7);pointer-events:auto;cursor:pointer;padding:6px 10px}
  #ui #h-cut .ti{position:absolute;left:max(28px,env(safe-area-inset-left));top:calc(11.5vh + 18px);font:400 26px Limelight,Georgia,serif;color:#fff;letter-spacing:2px;text-shadow:0 2px 10px #000;opacity:0;transition:opacity .8s}
  #ui #h-cut .ti.on{opacity:1} #ui #h-cut .ti small{display:block;font:700 11px var(--font);letter-spacing:3px;color:var(--gold);text-transform:uppercase;margin-top:2px}
  #ui.cine #h-obj,#ui.cine #h-edge,#ui.cine #h-mdist,#ui.cine #h-dlg,#ui.cine .bubble,#ui.photo #h-obj,#ui.photo #h-edge,#ui.photo #h-mdist,#ui.photo #h-shard,#ui.mapping #h-edge,#ui.mapping #h-mdist,#ui.titling #h-obj,#ui.titling #h-edge,#ui.titling #h-mdist{display:none!important}
  #ui.touch #h-obj{max-width:calc(100% - 400px);min-width:0;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 4px)} #ui.touch #h-obj .ol{font-size:14px}
  #ui.touch .tb{width:200px;height:26px} #ui.touch .tb b{font-size:14px} #ui.touch .tb .pb{flex-basis:84px}
  @media (max-width:520px){#ui #h-shard h1{font-size:28px}}
  @media (orientation:portrait) and (max-width:620px){#ui.touch #h-obj{max-width:calc(100% - 24px);bottom:170px}}`;
  document.head.appendChild(css);
  const h = (tag, id, html) => { const e = document.createElement(tag); e.id = id; if (html) e.innerHTML = html; root.appendChild(e); return e; };
  const objEl = h('div', 'h-obj', '<div class="ot"></div><div class="ol"></div>'), shardEl = h('div', 'h-shard', '<h1></h1><p></p>');
  const edgeEl = h('div', 'h-edge', '<svg viewBox="0 0 34 34"><path d="M17 3 31 29 17 22 3 29z" fill="#f5c542" stroke="#1b1b1b" stroke-width="2" stroke-linejoin="round"/></svg><span></span>');
  const distEl = h('div', 'h-mdist', ''), cutEl = h('div', 'h-cut', '<div class="lb t"></div><div class="lb b"></div><div class="ti"></div><div class="sub"></div><div class="sk"></div>');
  objEl.className = 'hud'; shardEl.className = ''; edgeEl.className = 'hud'; distEl.className = 'hud';
  const objT = objEl.firstChild, objL = objEl.lastChild, edgeArrow = edgeEl.firstChild, edgeTxt = edgeEl.lastChild;
  const mark = (s) => esc(s).replace(/\{([^}]+)\}/g, '<em>$1</em>');

  // ---------------------------------------------------------------- objective line + bars + shard
  const OBJ = { text: null, title: null };
  M.objective = (t, title) => {
    t = t || null; title = title || null;
    if (t === OBJ.text && title === OBJ.title) return;
    OBJ.text = t; OBJ.title = title;
    if (t) { objT.textContent = title || ''; objL.innerHTML = mark(t); }
    objEl.classList.toggle('on', !!t);
  };
  const BARS = new Map(), barsEl = () => document.getElementById('h-bars');
  M.bar = (id, o) => {
    let b = BARS.get(id);
    if (!o) { if (b) { b.el.remove(); BARS.delete(id); } return; }
    if (!b) {
      const el = document.createElement('div'); el.className = 'tb'; el.innerHTML = '<small></small><b></b><div class="pb"><i></i></div>';
      const host = barsEl(); if (host) host.appendChild(el);
      b = { el, l: el.firstChild, v: el.children[1], pb: el.lastChild, k: '' }; BARS.set(id, b);
    }
    const key = (o.label || '') + '|' + (o.value ?? '') + '|' + (o.pct ?? '') + '|' + (o.hot ? 1 : o.ok ? 2 : 0);
    if (key === b.k) return; b.k = key;
    b.l.textContent = o.label || ''; b.v.textContent = o.value ?? '';
    const hasPct = o.pct != null; b.pb.style.display = hasPct ? '' : 'none'; b.v.style.display = hasPct && o.value == null ? 'none' : '';
    if (hasPct) b.pb.firstChild.style.width = Math.round(AF.clamp(o.pct, 0, 1) * 100) + '%';
    b.el.classList.toggle('hot', !!o.hot); b.el.classList.toggle('ok', !!o.ok);
  };
  M.clearBars = (prefix) => { for (const id of [...BARS.keys()]) if (!prefix || id.startsWith(prefix)) M.bar(id, null); };
  let shardT = 0;
  M.shard = (title, sub, kind = 'start', ms = 4200) => {
    shardEl.firstChild.textContent = title || ''; shardEl.lastChild.textContent = sub || '';
    shardEl.className = 'on ' + kind; shardT = ms / 1000;
  };
  M.time = (s) => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  // ---------------------------------------------------------------- blips
  const COL = { objective: [1, 0.74, 0.12], heist: [1, 0.62, 0.1], pet: [1, 0.45, 0.78], crew: [0.35, 0.82, 1], danger: [1, 0.3, 0.22], shop: [0.55, 0.9, 0.7] };
  const HEX = { objective: '#f5c542', heist: '#f0a020', pet: '#ff79c6', crew: '#5ad1ff', danger: '#ff5a4a', shop: '#7cd6a8' };
  M.blip = (id, o) => {
    let b = M.blips.get(id);
    if (!b) { b = { id, x: 0, y: null, z: 0, kind: 'objective', label: '', primary: false, marker: false, r: 1.6, at: null, on: null, mx: NaN, mz: NaN }; M.blips.set(id, b); }
    Object.assign(b, o);
    if (b.primary) { for (const q of M.blips.values()) if (q !== b) q.primary = false; M.primary = b; } else if (M.primary === b) M.primary = null;
    M.rev++; if (UI.map) UI.map.revision++;
    return b;
  };
  M.unblip = (id) => { const b = M.blips.get(id); if (!b) return; M.blips.delete(id); if (M.primary === b) M.primary = null; M.rev++; if (UI.map) UI.map.revision++; };
  const pos = (b) => { if (b.at) { const p = b.at(); if (p) { b.x = p.x; b.z = p.z; b.y = p.y ?? b.y; } } return b; };
  const live = (b) => !b.on || b.on();
  // map icons: objective = gold dot, heist = gold "H" disc, pet = pink paw disc, shop = mint dot
  const icon = (g, kind, x, y, r) => {
    g.fillStyle = HEX[kind] || HEX.objective; g.strokeStyle = '#111'; g.lineWidth = 2;
    g.beginPath(); g.arc(x, y, r, 0, PI * 2); g.fill(); g.stroke();
    if (kind === 'heist' || kind === 'pet') { g.fillStyle = '#111'; g.font = '800 ' + Math.round(r * 1.25) + 'px system-ui'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(kind === 'heist' ? 'H' : 'P', x, y + 0.5); }
  };
  AF.on('ready', () => {
    const map = UI.map; if (!map) return;
    (map.overlays || (map.overlays = [])).push((g) => {
      g.save();
      for (const b of M.blips.values()) {
        if (!live(b)) continue; pos(b); const p = map.worldToScreen(b.x, b.z);
        icon(g, b.kind, p.x, p.y, b.primary ? 8 : 7);
        if (b.label) { g.font = '600 12px system-ui'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(b.label, p.x + 12, p.y); g.fillStyle = '#fff'; g.fillText(b.label, p.x + 12, p.y); }
      }
      g.restore();
    });
    (map.miniOverlays || (map.miniOverlays = [])).push((g, to) => {
      const W = g.canvas.width, H = g.canvas.height, cx = W / 2, cy = H / 2, pad = 9;
      g.save();
      for (const b of M.blips.values()) {
        if (!live(b)) continue; pos(b);
        const p = to(b.x, b.z); let x = p.x, y = p.y; const out = x < pad || x > W - pad || y < pad || y > H - pad;
        if (out) { const dx = x - cx, dy = y - cy, k = Math.min((cx - pad) / Math.max(1e-3, Math.abs(dx)), (cy - pad) / Math.max(1e-3, Math.abs(dy))); x = cx + dx * k; y = cy + dy * k; }
        if (b.primary) {
          g.strokeStyle = HEX[b.kind] || HEX.objective; g.lineWidth = 3; g.setLineDash([7, 6]); g.globalAlpha = 0.85;
          g.beginPath(); g.moveTo(cx, cy); g.lineTo(x, y); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
        }
        if (out && (b.primary || b.kind === 'heist')) {
          const a = Math.atan2(y - cy, x - cx); g.save(); g.translate(x, y); g.rotate(a); g.fillStyle = HEX[b.kind] || HEX.objective; g.strokeStyle = '#111'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(8, 0); g.lineTo(-6, -7); g.lineTo(-3, 0); g.lineTo(-6, 7); g.closePath(); g.fill(); g.stroke(); g.restore();
        } else if (!out) icon(g, b.kind, x, y, b.primary ? 7 : 6);
      }
      g.restore();
    });
  });

  // ---------------------------------------------------------------- the world marker: ring + light column + chevron, instanced
  const MK = { mesh: null, n: 0, max: 8, mat: null, list: [] };
  const markerGeo = () => {
    const P = [], part = [], v = [], idx = []; const S = 24;
    const quad = (a, b, c, d) => idx.push(a, b, c, a, c, d);
    // ring (part 0): an annulus 0.82..1 on the ground
    for (let i = 0; i < S; i++) { const a = i / S * PI * 2; P.push(Math.cos(a) * 0.82, 0, Math.sin(a) * 0.82, Math.cos(a), 0, Math.sin(a)); part.push(0, 0); v.push(0, 0); }
    for (let i = 0; i < S; i++) { const j = (i + 1) % S; quad(i * 2, j * 2, j * 2 + 1, i * 2 + 1); }
    // column (part 1): an open cylinder, v 0 at the ground .. 1 at the top
    const c0 = P.length / 3;
    for (let i = 0; i < S; i++) { const a = i / S * PI * 2; P.push(Math.cos(a), 0, Math.sin(a), Math.cos(a), 1, Math.sin(a)); part.push(1, 1); v.push(0, 1); }
    for (let i = 0; i < S; i++) { const j = (i + 1) % S; quad(c0 + i * 2, c0 + i * 2 + 1, c0 + j * 2 + 1, c0 + j * 2); }
    // chevron (part 2): a thick downward arrow, 1 m tall
    const c1 = P.length / 3, A = [[0, 0], [0.55, 0.62], [0.24, 0.62], [0.24, 1], [-0.24, 1], [-0.24, 0.62], [-0.55, 0.62]];
    for (const z of [-0.12, 0.12]) for (const [x, y] of A) { P.push(x, y, z); part.push(2); v.push(0); }
    const n = A.length, tri = [[0, 1, 6], [2, 3, 4], [2, 4, 5]];
    for (const [a, b, c] of tri) { idx.push(c1 + a, c1 + b, c1 + c, c1 + n + a, c1 + n + c, c1 + n + b); }
    for (let i = 0; i < n; i++) { const j = (i + 1) % n; quad(c1 + i, c1 + n + i, c1 + n + j, c1 + j); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('aPart', new THREE.Float32BufferAttribute(part, 1)); g.setAttribute('aV', new THREE.Float32BufferAttribute(v, 1));
    g.setIndex(idx); g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
    return g;
  };
  AF.onBuild('mission-marker', 881, () => {
    const geo = markerGeo(), iCol = new THREE.InstancedBufferAttribute(new Float32Array(MK.max * 3), 3), iP = new THREE.InstancedBufferAttribute(new Float32Array(MK.max * 4), 4);
    iCol.setUsage(THREE.DynamicDrawUsage); iP.setUsage(THREE.DynamicDrawUsage); geo.setAttribute('iCol', iCol); geo.setAttribute('iP', iP);
    MK.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 } }, fog: false, side: THREE.DoubleSide,
      vertexShader: 'attribute float aPart; attribute float aV; attribute vec3 iCol; attribute vec4 iP; uniform float uTime; varying vec3 vC; varying float vA; varying float vP;\n'
        + 'void main(){ vec3 p = position; float r = iP.x;\n'
        + ' if (aPart < 0.5) { p.xz *= r; p.y = 0.05; }\n'
        + ' else if (aPart < 1.5) { p.xz *= r * 0.92; p.y *= iP.y; }\n'
        + ' else { float a = uTime * 1.6 + iP.w, c = cos(a), s = sin(a); p.xz = mat2(c, -s, s, c) * p.xz; p *= 0.5 + iP.z * 0.06; p.y += iP.z + sin(uTime * 2.4 + iP.w) * 0.16; }\n'
        + ' vC = iCol; vA = aV; vP = aPart; gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(p, 1.0); }',
      fragmentShader: 'varying vec3 vC; varying float vA; varying float vP;\n'
        + 'void main(){ if (vP > 0.5 && vP < 1.5) { float a = (1.0 - vA) * (1.0 - vA) * 0.38; float th = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715)))); if (a < th) discard; }\n'
        + ' gl_FragColor = vec4(vC * (vP > 1.5 ? 1.5 : vP > 0.5 ? 1.0 : 1.4), 1.0); }',
    });
    const mesh = MK.mesh = new THREE.InstancedMesh(geo, MK.mat, MK.max);
    mesh.name = 'mission-markers'; mesh.count = 0; mesh.visible = false; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage); mesh.renderOrder = 1; AF.scene.add(mesh);
    MK.iCol = iCol; MK.iP = iP;
  });
  AF.on('preloaded', () => { const m = MK.mesh; if (!m || !AF.stream.compileAhead) return; m.count = 1; m.visible = true; AF.stream.compileAhead(m).then(() => { m.visible = m.count > 0 && MK.n > 0; }); });
  const M4 = new THREE.Matrix4(), V = new THREE.Vector3();
  const markers = (t) => {
    const mesh = MK.mesh; if (!mesh) return;
    const cam = AF.camera.position; let n = 0;
    for (const b of M.blips.values()) {
      if (!b.marker || !live(b) || n >= MK.max) continue; pos(b);
      const d = Math.hypot(b.x - cam.x, b.z - cam.z); if (d > 1400) continue;
      const y = b.y ?? AF.W.groundY(b.x, b.z), r = Math.max(b.r, d * 0.0055), c = COL[b.kind] || COL.objective;
      M4.makeTranslation(b.x, y, b.z); mesh.setMatrixAt(n, M4);
      MK.iCol.array.set(c, n * 3);
      const ia = MK.iP.array, o = n * 4; ia[o] = r; ia[o + 1] = d > 160 ? 70 : d > 40 ? 26 : 9; ia[o + 2] = b.chev ?? 2.6; ia[o + 3] = n * 1.7;
      n++;
    }
    MK.n = n; mesh.count = n; mesh.visible = n > 0;
    if (n) { mesh.instanceMatrix.needsUpdate = true; MK.iCol.needsUpdate = true; MK.iP.needsUpdate = true; MK.mat.uniforms.uTime.value = t; }
  };
  // the primary blip on screen: a distance tag under it, or an arrow on the screen rim while it's out of view
  const indicator = () => {
    const b = M.primary, title = UI.state && (UI.state.title || UI.state.map), cut = AF.mode === 'cutscene';
    if (!b || !live(b) || title || cut) { if (edgeEl.style.display !== 'none') edgeEl.style.display = 'none'; if (distEl.style.display !== 'none') distEl.style.display = 'none'; return; }
    pos(b);
    const f = AF.mode === 'drive' && AF.vehicles.player ? AF.vehicles.player : AF.mode === 'fly' && AF.planes.cur ? AF.planes.cur : AF.player;
    const d = f ? Math.hypot(b.x - f.x, b.z - f.z) : 0, dt = d < 1000 ? Math.round(d) + ' m' : (d / 1000).toFixed(1) + ' km';
    V.set(b.x, (b.y ?? AF.W.groundY(b.x, b.z)) + (b.chev ?? 2.6) + 1.2, b.z).project(AF.camera);
    const W2 = innerWidth, H2 = innerHeight, behind = V.z > 1, on = !behind && Math.abs(V.x) < 0.94 && Math.abs(V.y) < 0.9;
    if (on) {
      if (edgeEl.style.display !== 'none') edgeEl.style.display = 'none';
      const x = Math.round((V.x + 1) / 2 * W2), y = Math.round((1 - V.y) / 2 * H2) - 34, html = (b.label ? '<b>' + esc(b.label) + '</b>' : '') + dt;
      if (distEl._h !== html) { distEl._h = html; distEl.innerHTML = html; }
      const tf = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-100%)'; if (distEl._t !== tf) { distEl._t = tf; distEl.style.transform = tf; }
      if (distEl.style.display !== 'block') distEl.style.display = 'block';
      return;
    }
    if (distEl.style.display !== 'none') distEl.style.display = 'none';
    let vx = V.x, vy = V.y; if (behind) { vx = -vx; vy = -vy; if (Math.abs(vy) < 0.2) vy = -0.6; }
    const a = Math.atan2(-vy * H2, vx * W2), rx = W2 / 2 - 46, ry = H2 / 2 - 56, k = 1 / Math.max(Math.abs(Math.cos(a)) / rx, Math.abs(Math.sin(a)) / ry);
    const x = Math.round(W2 / 2 + Math.cos(a) * k), y = Math.round(H2 / 2 + Math.sin(a) * k), tf = 'translate(' + x + 'px,' + y + 'px)', rot = 'rotate(' + Math.round((a + PI / 2) * 180 / PI) + 'deg)';
    if (edgeEl._t !== tf) { edgeEl._t = tf; edgeEl.style.transform = tf; }
    if (edgeArrow._r !== rot) { edgeArrow._r = rot; edgeArrow.style.transform = rot; }
    if (edgeTxt.textContent !== dt) edgeTxt.textContent = dt;
    if (edgeEl.style.display !== 'block') edgeEl.style.display = 'block';
  };

  // ---------------------------------------------------------------- cutscenes ('cutscene' mode)
  const CUT = M.cut = { on: false, shots: null, i: 0, t: 0, o: null, st: { phase: 0, speed: 0, air: 0, t: 0, land: 0 }, a: new THREE.Vector3(), b: new THREE.Vector3(), skipT: 0 };
  const cutSub = cutEl.querySelector('.sub'), cutSkip = cutEl.querySelector('.sk'), cutTitle = cutEl.querySelector('.ti');
  cutSkip.textContent = AF.touch ? 'TAP TO SKIP \u203a' : 'SPACE  SKIP \u203a';
  cutSkip.addEventListener('pointerdown', (e) => { e.preventDefault(); CUT.skip(); });
  const lerp3 = (out, a, b, k) => out.set(a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k);
  const ease = (k) => k * k * (3 - 2 * k);
  const subtitle = (s) => {
    if (!s) { cutSub.classList.remove('on'); return; }
    const [who, line] = Array.isArray(s) ? s : ['', s];
    cutSub.innerHTML = (who ? '<b>' + esc(who) + '</b>' : '') + esc(line); cutSub.classList.add('on');
  };
  CUT.play = (o) => {
    if (AF.TEST || !o || !o.shots || !o.shots.length || !AF.player) { if (o && o.onEnd && !AF.TEST) o.onEnd(false); return false; }
    if (CUT.on) CUT.finish(true);
    CUT.o = o; CUT.shots = o.shots; CUT.i = 0; CUT.t = 0; CUT.skipT = 0.6;
    AF.setMode('cutscene', o);
    return true;
  };
  CUT.skip = () => { if (CUT.on && CUT.skipT <= 0) CUT.finish(false); };
  CUT.finish = (silent) => {
    if (!CUT.on) return;
    const o = CUT.o; CUT.on = false;
    if (AF.audio && AF.audio.stopVoice) AF.audio.stopVoice();
    const P = AF.player, end = (o && o.end) || { x: P.x, y: P.y, z: P.z, yaw: P.yaw };
    if (AF.mode === 'cutscene') AF.setMode('walk', { x: end.x, y: end.y, z: end.z, yaw: end.yaw ?? P.yaw, snap: true });
    if (o && o.onEnd && !silent) o.onEnd(true);
  };
  AF.modes.cutscene = {
    enter(o = {}) {
      CUT.on = true; root.classList.add('cine'); cutEl.classList.add('on'); subtitle(null);
      const P = AF.player;
      if (o.pose) P.teleport(o.pose.x, o.pose.y, o.pose.z, o.pose.yaw ?? P.yaw);
      P.setVisible(true); if (P.mesh) { P.mesh.position.set(P.body.x, P.body.y, P.body.z); P.mesh.rotation.set(0, P.yaw, 0); }
      AF.interactTarget = null; AF.emit('hud', { speed: null }); AF.emit('hint', '');
      cutTitle.innerHTML = o.title ? esc(o.title) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') : ''; cutTitle.classList.toggle('on', !!o.title);
      if (AF.input.releaseLock) AF.input.releaseLock();
    },
    exit() {
      CUT.on = false; root.classList.remove('cine'); cutEl.classList.remove('on'); subtitle(null); cutTitle.classList.remove('on');
      if (AF.input.requestLock) setTimeout(() => AF.input.requestLock(), 0);
    },
    update(dt) {
      const sh = CUT.shots && CUT.shots[CUT.i]; if (!sh) { CUT.finish(false); return; }
      CUT.t += dt; CUT.skipT -= dt;
      const I = AF.input;
      if (CUT.skipT <= 0 && (I.hit('Space') || I.hit('Enter') || I.hit('KeyE') || I.mouse.clicked)) { CUT.skip(); return; }
      if (CUT.t > sh.d) { CUT.i++; CUT.t = 0; if (!CUT.shots[CUT.i]) { CUT.finish(false); return; } if (CUT.i === 1 || CUT.shots[CUT.i].say) cutTitle.classList.remove('on'); return; }
      const k = ease(Math.min(1, CUT.t / sh.d));
      lerp3(CUT.a, sh.cam, sh.cam2 || sh.cam, k); lerp3(CUT.b, sh.look, sh.look2 || sh.look, k);
      const cam = AF.camera; cam.position.copy(CUT.a); cam.up.set(0, 1, 0); cam.lookAt(CUT.b); AF.camTarget.copy(CUT.b);
      const fov = sh.fov || 42; if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
      AF.shadowFocus.set(CUT.b.x, 0, CUT.b.z); AF.shadowRadius = 40;
      if (CUT.t < dt * 1.5) {
        // shot.vo: a voiced line (81-heist-lines) — subtitle from the table, the shot lasts at least as long as the line
        if (sh.vo && !sh.voDid) { sh.voDid = true; const L = AF.voLine && AF.voLine(sh.vo); if (L && !sh.say) sh.say = [L[1], L[2]]; const len = AF.audio && AF.audio.voice ? AF.audio.voice(sh.vo) : 0; if (len > 0 && sh.d < len + 0.45) sh.d = len + 0.45; }
        subtitle(sh.say);
      }
      const P = AF.player; if (P.parts) AF.avatar.animate(P.parts, CUT.st, dt, 0, true);
      if (sh.act && !sh.did) { sh.did = true; try { sh.act(); } catch (e) { console.warn('[af] cutscene act', e); } }
    },
  };
  AF.on('mode', (name) => { if (name !== 'cutscene' && CUT.on) { CUT.on = false; } if (name !== 'cutscene') { const c = AF.camera; if (c.fov !== 50 && AF.mode !== 'walk') { c.fov = 50; c.updateProjectionMatrix(); } } });

  // ---------------------------------------------------------------- tick
  let mapT = 0;
  AF.onTick('mission', 948, (dt, t) => {
    if (shardT > 0 && (shardT -= dt) <= 0) shardEl.classList.remove('on');
    if (!M.blips.size) { if (MK.mesh && MK.mesh.visible) { MK.mesh.visible = false; MK.mesh.count = 0; MK.n = 0; } if (edgeEl.style.display !== 'none') indicator(); return; }
    markers(t); indicator();
    // moving blips (a crewmate's plane, a pet store guide) redraw the minimap at 4 Hz once they've moved a metre
    if ((mapT += dt) > 0.25) { mapT = 0; for (const b of M.blips.values()) { if (!b.at) continue; pos(b); if (Math.abs(b.x - b.mx) + Math.abs(b.z - b.mz) > 1) { b.mx = b.x; b.mz = b.z; if (UI.map) UI.map.revision++; } } }
  });

  AF.test('mission: blips mark the map, the marker instances follow them, bars and objective render', () => {
    const was = new Map(M.blips), prim = M.primary;
    try {
      M.blip('t1', { x: 10, y: 0.5, z: 20, primary: true, marker: true, label: 'Test' }); M.blip('t2', { x: -40, z: 5, kind: 'heist', marker: true });
      markers(0); const n = MK.n;
      M.bar('t-bar', { label: 'Time', value: '0:30' }); M.objective('Go to {the pier}.', 'Test');
      const html = objL.innerHTML, bar = !!document.querySelector('#h-bars .tb');
      M.unblip('t1'); M.unblip('t2'); M.bar('t-bar', null); M.objective(null); markers(0);
      return { ok: n === 2 && MK.n === 0 && /<em>the pier<\/em>/.test(html) && bar && !document.querySelector('#h-bars .tb'), info: 'markers ' + n + ', objective ' + html + ', bar ' + bar };
    } finally { M.blips.clear(); for (const [k, v] of was) M.blips.set(k, v); M.primary = prim; }
  });
}
} catch (e) { AF.partError('73-mission.js', e); }
