// ================================================================ 63-sky.js
try {
// ===== 63-sky: AF.wind (global wind + travelling gusts), AF.makeFlag / AF.makeBunting (GPU-rippled cloth, merged into one
//       draw call each), night ground light pools (instanced additive decals under every outdoor AF.addLight)  (OWNER: atmos) =====
// API (see notes/atmos.md):
//   AF.wind = { x, z (unit vector the wind blows TOWARD), angle, base (0..1), strength (at the camera, incl. gusts), gust (0..1 at the camera),
//               at(x, z) -> strength at a point, gustAt(x, z) -> 0..1 }
//   AF.makeFlag({ x, y, z, w, h, design, colors, draw, dir | yaw, vane, hang, parent }) -> handle { mesh (after merge), ... }
//   AF.makeBunting([x,y,z], [x,y,z], { shape, colors, spacing, size, sag, parent }) -> handle
//   AF.flagDesigns (names)  ·  AF.pools2 = { mesh, k, count }
{
  const V3 = THREE.Vector3;
  const clamp = AF.clamp, lerp = AF.lerp, smooth = AF.smooth;

  // ================================================================ AF.wind — one wind for the whole city
  // A sea breeze off the harbour (from the SSW, blowing NNE) that breathes slowly, plus a GUST FRONT that sweeps across the
  // city along the wind every ~38 s: flags, bunting, laundry and leaves lift in sequence as it passes.
  const WIND = AF.wind = AF.wind || {};
  {
    const a = Math.atan2(-0.94, 0.34);   // blowing toward NNE (x +0.34, z -0.94)
    Object.assign(WIND, { angle: a, x: Math.cos(a), z: Math.sin(a), base: 0.6, strength: 0.6, gust: 0, front: -9999, gustAmp: 0.7, period: 38, span: 900, width: 55, t: 0 });
  }
  WIND.gustAt = (x, z) => { const d = (x * WIND.x + z * WIND.z - WIND.front) / WIND.width; return Math.exp(-d * d) * WIND.gustAmp; };
  WIND.at = (x, z) => clamp(WIND.base + WIND.gustAt(x, z), 0.05, 1.6);

  // shared cloth uniforms (by reference in every flag / bunting material)
  const CU = {
    uFlagT: { value: 0 }, uWindDir: { value: new THREE.Vector2(WIND.x, WIND.z) }, uWindBase: { value: WIND.base },
    uGust: { value: new THREE.Vector2(-9999, 0.7) },
  };
  AF.onTick('wind', 6, (dt, t) => {
    const T = AF.clock ? AF.clock.t : t;
    WIND.t = T;
    WIND.base = 0.52 + 0.2 * Math.sin(T * 0.071) + 0.1 * Math.sin(T * 0.23 + 1.3);
    const ph = (T % WIND.period) / WIND.period;
    WIND.front = -WIND.span / 2 + ph * WIND.span;
    WIND.gustAmp = 0.55 + 0.25 * Math.sin(Math.floor(T / WIND.period) * 2.1);
    const c = AF.camera && AF.camera.position;
    WIND.gust = c ? WIND.gustAt(c.x, c.z) : 0;
    WIND.strength = clamp(WIND.base + WIND.gust, 0.05, 1.6);
    CU.uFlagT.value = T; CU.uWindBase.value = WIND.base; CU.uWindDir.value.set(WIND.x, WIND.z);
    CU.uGust.value.set(WIND.front, WIND.gustAmp);
    // parented vane flags: keep their fly pointing downwind whatever the parent's heading
    for (const f of FL.parented) {
      const e = f.parent.matrixWorld.elements;
      f.mat.userData.yawOff.value = Math.atan2(-e[2], e[0]);
    }
  });

  // ================================================================ flag atlas (pixel-art designs on one canvas)
  const FL = AF.flags = { list: [], pending: [], parented: [], merged: [], cells: new Map(), n: 0 };
  const AW = 512, AH = 256, CW = 64, CH = 43, DW = 60, DH = 39;   // cell 64x43 with a 2 px gutter; drawing area 60x39
  let atlas = null, actx = null, atex = null;
  const ensureAtlas = () => {
    if (atlas) return;
    atlas = document.createElement('canvas'); atlas.width = AW; atlas.height = AH;
    actx = atlas.getContext('2d'); actx.imageSmoothingEnabled = false;
    atex = new THREE.CanvasTexture(atlas);
    atex.colorSpace = THREE.SRGBColorSpace; atex.magFilter = THREE.NearestFilter; atex.minFilter = THREE.LinearMipmapLinearFilter; atex.anisotropy = 4;
  };
  const hex = (c) => typeof c === 'string' ? c : '#' + (c >>> 0).toString(16).padStart(6, '0');
  // designs draw in a 60 x 39 box (x right = toward the fly, y down)
  const DES = {
    solace(g, C) {   // the city flag: navy sky, jade sea, a gold half-sun on the horizon with rays, cream horizon line
      g(0, 0, 60, 39, C[0] || '#1f3563'); g(0, 26, 60, 13, C[1] || '#2e7d6a'); g(0, 25, 60, 2, '#f2ead8');
      const sun = C[2] || '#e8b84a';
      for (let y = 0; y < 11; y++) { const hw = Math.round(Math.sqrt(Math.max(0, 121 - (y - 11) * (y - 11) * 1.0))); g(22 - hw, 14 + y, hw * 2, 1, sun); }
      for (let k = 0; k < 7; k++) { const a = Math.PI * (0.12 + k * 0.127); for (let r = 14; r < 21; r++) g(Math.round(22 - Math.cos(a) * r), Math.round(25 - Math.sin(a) * r * 0.95), 2, 1, sun); }
      g(44, 8, 6, 1, '#f2ead8'); g(43, 9, 2, 1, '#f2ead8'); g(49, 9, 2, 1, '#f2ead8');   // a gull
    },
    stars(g) {       // 1936 48-star flag
      for (let i = 0; i < 13; i++) g(0, i * 3, 60, 3, i % 2 ? '#f4f1ea' : '#b22234');
      g(0, 0, 25, 21, '#2b3a78');
      for (let r = 0; r < 6; r++) for (let c = 0; c < 8; c++) g(2 + c * 3, 2 + r * 3, 1, 1, '#f4f1ea');
    },
    harbour(g, C) {  // HARBOUR DAYS festival flag: gold / red diagonal, navy anchor
      g(0, 0, 60, 39, C[0] || '#f0c040');
      for (let y = 0; y < 39; y++) { const x0 = Math.round(60 - y * 60 / 39); g(x0, y, 60 - x0, 1, C[1] || '#c0392b'); }
      const a = C[2] || '#1f3563';
      g(15, 8, 3, 22, a); g(10, 12, 13, 2, a); g(14, 5, 5, 4, a); g(15, 6, 3, 2, C[0] || '#f0c040');
      g(8, 24, 3, 4, a); g(22, 24, 3, 4, a); g(10, 27, 13, 3, a);
    },
    jade(g, C) {     // deco banner: jade with gold chevrons and a border
      g(0, 0, 60, 39, C[0] || '#2e7d6a'); const gold = C[1] || '#e8b84a';
      g(0, 0, 60, 2, gold); g(0, 37, 60, 2, gold);
      for (let k = 0; k < 3; k++) for (let x = 0; x < 60; x++) { const y = 10 + k * 8 + Math.round(Math.abs(((x % 12) - 6)) * 0.8); g(x, y, 1, 2, gold); }
    },
    stripes(g, C) {  // horizontal bands
      const c = C.length ? C : ['#c0392b', '#f4f1ea', '#1f3563'];
      const h = 39 / c.length; c.forEach((cc, i) => g(0, Math.round(i * h), 60, Math.round((i + 1) * h) - Math.round(i * h), cc));
    },
    tricolor(g, C) { // vertical bands
      const c = C.length ? C : ['#1f3563', '#f4f1ea', '#c0392b'];
      const w = 60 / c.length; c.forEach((cc, i) => g(Math.round(i * w), 0, Math.round((i + 1) * w) - Math.round(i * w), 39, cc));
    },
    plain(g, C) { g(0, 0, 60, 39, C[0] || '#c0392b'); if (C[1]) { g(0, 0, 60, 3, C[1]); g(0, 36, 60, 3, C[1]); } },
    pennant(g, C) {  // long triangle (transparent outside)
      for (let x = 0; x < 60; x++) { const hh = 19.5 * (1 - x / 60); g(x, Math.round(19.5 - hh), 1, Math.max(1, Math.round(hh * 2)), x < 8 ? (C[1] || '#f4f1ea') : (C[0] || '#c0392b')); }
    },
    burgee(g, C) {   // swallowtail
      g(0, 0, 60, 39, C[0] || '#1f3563'); g(0, 16, 60, 7, C[1] || '#f4f1ea');
      for (let x = 38; x < 60; x++) { const d = Math.round((x - 38) * 19.5 / 22); gClear(x, 19 - d, 1, d * 2 + 1); }
    },
    checker(g, C) { for (let y = 0; y < 3; y++) for (let x = 0; x < 4; x++) g(x * 15, y * 13, 15, 13, (x + y) % 2 ? (C[0] || '#1c1c1c') : (C[1] || '#f4f1ea')); },
  };
  // nautical signal flags (simplified ICS set) for dressing ships overall: design 'signal' with opts.letter 0..9
  const SIG = [
    (g) => { g(0, 0, 60, 39, '#f4f1ea'); g(30, 0, 30, 39, '#1f3a8a'); },                                   // A-ish (white | blue)
    (g) => { g(0, 0, 60, 39, '#c0392b'); },                                                                 // B red
    (g) => { ['#1f3a8a', '#f4f1ea', '#c0392b', '#f4f1ea', '#1f3a8a'].forEach((c, i) => g(0, Math.round(i * 7.8), 60, 8, c)); },   // C
    (g) => { g(0, 0, 60, 39, '#f2c230'); g(0, 12, 60, 15, '#1f3a8a'); },                                   // D
    (g) => { g(0, 0, 60, 20, '#1f3a8a'); g(0, 20, 60, 19, '#c0392b'); },                                   // E
    (g) => { g(0, 0, 60, 39, '#f4f1ea'); g(0, 0, 30, 39, '#c0392b'); },                                    // H
    (g) => { g(0, 0, 60, 39, '#f2c230'); g(30, 0, 30, 39, '#1f3a8a'); },                                   // K
    (g) => { for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) g(x * 15, Math.round(y * 9.75), 15, 10, (x + y) % 2 ? '#f4f1ea' : '#1f3a8a'); },   // N
    (g) => { g(0, 0, 60, 39, '#f2c230'); for (let y = 0; y < 39; y++) { const x0 = Math.round(y * 60 / 39); g(x0, y, 60 - x0, 1, '#c0392b'); } },       // O
    (g) => { g(0, 0, 60, 39, '#1f3a8a'); g(20, 13, 20, 13, '#f4f1ea'); },                                  // P
  ];
  let gClear = () => {};
  const cellFor = (key, drawFn) => {
    ensureAtlas();
    if (FL.cells.has(key)) return FL.cells.get(key);
    const idx = FL.cells.size, cols = Math.floor(AW / CW), rows = Math.floor(AH / CH);
    if (idx >= cols * rows) return FL.cells.values().next().value;   // atlas full: reuse the first design
    const cx = (idx % cols) * CW, cy = Math.floor(idx / cols) * CH;
    actx.save(); actx.clearRect(cx, cy, CW, CH); actx.beginPath(); actx.rect(cx, cy, CW, CH); actx.clip();
    const g = (x, y, w, h, c) => { actx.fillStyle = hex(c); actx.fillRect(cx + 2 + x, cy + 2 + y, w, h); };
    gClear = (x, y, w, h) => actx.clearRect(cx + 2 + x, cy + 2 + y, w, h);
    try { drawFn(g, actx, cx + 2, cy + 2); } catch (e) { g(0, 0, DW, DH, '#c0392b'); }
    // extend the edge pixels into the gutter so mipmaps don't bleed neighbouring designs
    try {
      actx.drawImage(atlas, cx + 2, cy + 2, 1, DH, cx, cy + 2, 2, DH); actx.drawImage(atlas, cx + 1 + DW, cy + 2, 1, DH, cx + 2 + DW, cy + 2, 2, DH);
      actx.drawImage(atlas, cx, cy + 2, CW, 1, cx, cy, CW, 2); actx.drawImage(atlas, cx, cy + 1 + DH, CW, 1, cx, cy + 2 + DH, CW, 2);
    } catch (e) { /* ignore */ }
    actx.restore();
    const cell = { u0: (cx + 2) / AW, v0: 1 - (cy + 2) / AH, du: DW / AW, dv: DH / AH };
    FL.cells.set(key, cell); if (atex) atex.needsUpdate = true;
    return cell;
  };
  AF.flagDesigns = Object.keys(DES).concat(['signal', 'custom']);

  // ================================================================ flag material: MeshStandard + a vertex ripple driven by AF.wind
  const FLAG_DECL = `
    attribute vec4 aLoc;    // local x (0 hoist .. w fly), local y (0 top .. -h), w, h
    attribute vec3 aHoist;  // hoist-top point (world, or parent-local for parented flags)
    attribute vec3 aFlg;    // fixed yaw, vane (1 = turn downwind), mode (0 pole flag, 1 hanging banner)
    uniform float uFlagT; uniform vec2 uWindDir; uniform float uWindBase; uniform vec2 uGust; uniform float uYawOff;
    vec3 afFlagPos(out vec3 nrm) {
      float ph = fract(sin(dot(aHoist.xz, vec2(12.9898, 78.233))) * 43758.5453) * 6.2831;
      float gd = (dot(aHoist.xz, uWindDir) - uGust.x) / 55.0;
      float s = clamp(uWindBase + exp(-gd * gd) * uGust.y + 0.1 * sin(uFlagT * 0.37 + ph), 0.05, 1.6);
      float x = aLoc.x, y = aLoc.y, w = max(aLoc.z, 0.05), h = max(aLoc.w, 0.05);
      vec3 p; vec3 n0;
      if (aFlg.z < 0.5) {
        float u = clamp(x / w, 0.0, 1.0);
        float k = 6.2831 * 1.2 / max(w, 0.3);
        float sp = 3.0 + 3.8 * s;
        float amp = h * (0.045 + 0.085 * s);
        float a1 = uFlagT * sp - x * k + ph;
        float a2 = uFlagT * sp * 1.63 - x * k * 2.1 + y * 2.3 / h + ph * 1.3;
        float env = pow(u, 0.8);
        float z = (sin(a1) + 0.35 * sin(a2)) * amp * env;
        float dzdx = (-cos(a1) * k - 0.35 * 2.1 * k * cos(a2)) * amp * env;
        float droop = (1.0 - smoothstep(0.12, 0.95, s)) * 0.85;
        float cx = x * (1.0 - 0.05 * s * abs(sin(a1)));
        p = vec3(cx * cos(droop), y - cx * sin(droop), z);
        n0 = normalize(vec3(-dzdx, 0.0, 1.0));
      } else {
        float v = clamp(-y / h, 0.0, 1.0);
        float k = 6.2831 * 0.9 / max(h, 0.3);
        float a1 = uFlagT * (2.2 + 2.6 * s) + y * k + x * 1.7 + ph;
        float amp = min(w, h) * (0.03 + 0.06 * s) * v;
        float z = sin(a1) * amp + sin(uFlagT * 0.9 + ph) * 0.1 * h * v * s;
        p = vec3(x, y, z);
        n0 = normalize(vec3(0.0, -cos(a1) * k * amp, 1.0));
      }
      float yaw = aFlg.y > 0.5 ? atan(-uWindDir.y, uWindDir.x) - uYawOff + 0.16 * sin(uFlagT * 0.55 + ph) * (1.25 - min(s, 1.0)) : aFlg.x;
      float c = cos(yaw), sn = sin(yaw);
      nrm = vec3(n0.x * c + n0.z * sn, n0.y, -n0.x * sn + n0.z * c);
      return aHoist + vec3(p.x * c + p.z * sn, p.y, -p.x * sn + p.z * c);
    }
  `;
  const makeFlagMat = () => {
    ensureAtlas();
    const m = new THREE.MeshStandardMaterial({ map: atex, side: THREE.DoubleSide, roughness: 0.82, metalness: 0, alphaTest: 0.5 });
    m.userData.yawOff = { value: 0 };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, CU); sh.uniforms.uYawOff = m.userData.yawOff;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\n' + FLAG_DECL)
        .replace('#include <beginnormal_vertex>', 'vec3 afFN; vec3 afFP = afFlagPos(afFN); vec3 objectNormal = afFN;')
        .replace('#include <begin_vertex>', 'vec3 transformed = afFP;');
    };
    m.customProgramCacheKey = () => 'af-flag-1';
    return m;
  };
  let sharedFlagMat = null;

  // one flag -> a grid geometry with the attributes above (hoist in world space unless parented)
  const flagGeo = (o, cell) => {
    const w = o.w, h = o.h;
    const sx = clamp(Math.round(w / 0.12), 6, 26), sy = clamp(Math.round(h / 0.3), 2, 6);
    const nv = (sx + 1) * (sy + 1);
    const pos = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), loc = new Float32Array(nv * 4), hoi = new Float32Array(nv * 3), flg = new Float32Array(nv * 3), nor = new Float32Array(nv * 3);
    const yaw = o.yaw, c = Math.cos(yaw), s = Math.sin(yaw);
    let k = 0;
    for (let j = 0; j <= sy; j++) for (let i = 0; i <= sx; i++, k++) {
      const x = w * i / sx, y = -h * j / sy;
      pos[k * 3] = o.hx + x * c; pos[k * 3 + 1] = o.hy + y; pos[k * 3 + 2] = o.hz - x * s;   // rest pose (bounding sphere)
      uv[k * 2] = cell.u0 + cell.du * (i / sx); uv[k * 2 + 1] = cell.v0 - cell.dv * (j / sy);
      loc[k * 4] = x; loc[k * 4 + 1] = y; loc[k * 4 + 2] = w; loc[k * 4 + 3] = h;
      hoi[k * 3] = o.hx; hoi[k * 3 + 1] = o.hy; hoi[k * 3 + 2] = o.hz;
      flg[k * 3] = yaw; flg[k * 3 + 1] = o.vane ? 1 : 0; flg[k * 3 + 2] = o.hang ? 1 : 0;
      nor[k * 3 + 2] = 1;
    }
    const idx = [];
    for (let j = 0; j < sy; j++) for (let i = 0; i < sx; i++) { const a = j * (sx + 1) + i, b = a + 1, d = a + sx + 1, e = d + 1; idx.push(a, d, b, b, d, e); }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aLoc', new THREE.BufferAttribute(loc, 4));
    g.setAttribute('aHoist', new THREE.BufferAttribute(hoi, 3)); g.setAttribute('aFlg', new THREE.BufferAttribute(flg, 3));
    g.setIndex(idx);
    return g;
  };
  const padSphere = (g, pad) => { g.computeBoundingSphere(); if (g.boundingSphere) g.boundingSphere.radius += pad; g.computeBoundingBox(); };

  // AF.makeFlag(opts): x,y,z = the TOP of the hoist (where the flag meets the pole). w = length along the fly (m), h = height (m).
  //   design: 'solace' | 'stars' | 'harbour' | 'jade' | 'stripes' | 'tricolor' | 'plain' | 'pennant' | 'burgee' | 'checker' | 'signal'
  //           (+ letter: 0..9) | 'custom' (+ draw(g) where g(x,y,w,h,'#rrggbb') paints a 60x39 pixel canvas)
  //   colors: ['#hex' | 0xhex, …] for the designs that take colours.
  //   vane: true (default for pole flags) = the fly turns to point downwind; false = fixed direction given by dir:[dx,dz] or yaw.
  //   hang: true = a banner hanging from a horizontal top bar (x along the bar, hangs down), ripples + sways, never turns.
  //   parent: an Object3D (ship, vehicle) — then x,y,z are in the parent's local space and the flag follows it.
  AF.makeFlag = (opts = {}) => {
    try {
      const o = Object.assign({ x: 0, y: 10, z: 0, w: 1.8, h: 1.2, design: 'solace', colors: [] }, opts);
      o.w = clamp(+o.w || 1.8, 0.1, 30); o.h = clamp(+o.h || 1.2, 0.1, 20);
      o.hang = !!o.hang; o.vane = o.hang ? false : (o.vane !== undefined ? !!o.vane : !(o.dir || Number.isFinite(o.yaw)));
      o.yaw = o.dir ? Math.atan2(-o.dir[1], o.dir[0]) : (Number.isFinite(o.yaw) ? o.yaw : 0);
      o.hx = +o.x; o.hy = +o.y; o.hz = +o.z;
      if (!Number.isFinite(o.hx + o.hy + o.hz)) return null;
      const C = (o.colors || []).map(hex);
      let key, fn;
      if (o.design === 'custom' && typeof o.draw === 'function') { key = 'custom:' + (o.key || (FL.n + ':' + Math.random())); fn = (g) => o.draw(g); }
      else if (o.design === 'signal') { const li = ((o.letter | 0) % SIG.length + SIG.length) % SIG.length; key = 'signal:' + li; fn = SIG[li]; }
      else { const d = DES[o.design] ? o.design : 'solace'; key = d + ':' + C.join(','); fn = (g) => DES[d](g, C); }
      const cell = cellFor(key, fn);
      const geo = flagGeo(o, cell);
      const handle = { id: FL.n++, opts: o, geo, mesh: null };
      FL.list.push(handle);
      if (o.parent && o.parent.isObject3D) {
        const mat = makeFlagMat();
        const mesh = new THREE.Mesh(geo, mat); padSphere(geo, Math.max(o.w, o.h) * 0.6);
        mesh.castShadow = false; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.name = 'flag';
        o.parent.add(mesh); handle.mesh = mesh;
        if (o.vane) FL.parented.push({ parent: o.parent, mat });
      } else if (!FL.mergedDone) {
        FL.pending.push(handle);
      } else {
        if (!sharedFlagMat) sharedFlagMat = makeFlagMat();
        const mesh = new THREE.Mesh(geo, sharedFlagMat); padSphere(geo, Math.max(o.w, o.h) * 0.6);
        mesh.castShadow = false; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.name = 'flag';
        AF.scene.add(mesh); handle.mesh = mesh;
      }
      return handle;
    } catch (e) { if (AF.warnOnce) AF.warnOnce('makeFlag failed', e); return null; }
  };

  // ================================================================ bunting / signal-flag lines / laundry
  const BUNT_DECL = `
    attribute vec4 aSw;   // perpendicular (xz), depth below the cord (m), line sag at this point (m)
    attribute float aPh;
    uniform float uFlagT; uniform vec2 uWindDir; uniform float uWindBase; uniform vec2 uGust;
  `;
  const BUNT_VERT = `
    vec3 transformed = vec3(position);
    {
      float gd = (dot(position.xz, uWindDir) - uGust.x) / 55.0;
      float s = clamp(uWindBase + exp(-gd * gd) * uGust.y, 0.05, 1.6);
      float swing = sin(uFlagT * 0.85 + aPh) * aSw.w * (0.1 + 0.2 * s);
      float flut = sin(uFlagT * (3.2 + 3.4 * s) + aPh * 3.0 + (position.x + position.z) * 1.3) * aSw.z * (0.22 + 0.5 * s);
      transformed += vec3(aSw.x, 0.0, aSw.y) * (swing + flut);
      transformed.y += -abs(swing) * 0.12 + aSw.z * 0.12 * s * s * -0.5;
    }
  `;
  let buntMat = null;
  const makeBuntMat = () => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.85, metalness: 0 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, CU);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + BUNT_DECL).replace('#include <begin_vertex>', BUNT_VERT);
    };
    m.customProgramCacheKey = () => 'af-bunting-1';
    return m;
  };
  const BUNT_COLS = {
    pennant: ['#c0392b', '#f4f1ea', '#1f3563', '#e8b84a', '#2e7d6a'],
    harbour: ['#c0392b', '#f4f1ea', '#1f3563', '#f0c040'],
    signal: ['#c0392b', '#f2c230', '#1f3a8a', '#f4f1ea', '#1c1c1c'],
    laundry: ['#f4f1ea', '#e8e0cc', '#a9c4dc', '#e8b8b0', '#f4f1ea', '#c8d8b0', '#f2e2a0', '#ffffff', '#9aa8c0'],
  };
  // AF.makeBunting(a, b, opts): a string of pennants (or signal flags / laundry) between two points [x,y,z] with a sagging cord.
  //   opts.shape: 'pennant' (default) | 'square' | 'signal' | 'laundry';  colors: [...] cycled;  spacing (m, 0.5);  size (m, 0.34)
  //   sag (m, default 0.05 × span + 0.15);  cord ('#2a2622');  parent (Object3D: a,b in its local space)
  AF.makeBunting = (a, b, opts = {}) => {
    try {
      if (!a || !b) return null;
      const ax = +a[0], ay = +a[1], az = +a[2], bx = +b[0], by = +b[1], bz = +b[2];
      if (!Number.isFinite(ax + ay + az + bx + by + bz)) return null;
      const shape = opts.shape || 'pennant';
      const span = Math.hypot(bx - ax, bz - az, by - ay); if (span < 0.3) return null;
      const sag = Number.isFinite(opts.sag) ? opts.sag : 0.05 * span + 0.15;
      const size = opts.size || (shape === 'laundry' ? 0.6 : shape === 'signal' ? 0.42 : 0.34);
      const spacing = opts.spacing || (shape === 'laundry' ? 0.85 : shape === 'signal' ? 0.5 : 0.42);
      const cols = (opts.colors && opts.colors.length ? opts.colors : BUNT_COLS[shape === 'square' ? 'pennant' : shape] || BUNT_COLS.pennant).map((c) => new THREE.Color(hex(c)));
      const cord = new THREE.Color(hex(opts.cord || (shape === 'laundry' ? '#d8d0c0' : '#2a2622')));
      let px = -(bz - az), pz = (bx - ax); const pl = Math.hypot(px, pz) || 1; px /= pl; pz /= pl;
      const P = [], N = [], Cc = [], SW = [], PH = [];
      const ph = ((ax * 12.9898 + az * 78.233) % 6.283 + 6.283) % 6.283;
      const at = (t) => [ax + (bx - ax) * t, ay + (by - ay) * t - sag * 4 * t * (1 - t), az + (bz - az) * t];
      const tri = (p1, p2, p3, c, d1, d2, d3, s1, s2, s3) => {
        for (const [p, d, s] of [[p1, d1, s1], [p2, d2, s2], [p3, d3, s3]]) { P.push(p[0], p[1], p[2]); N.push(px, 0, pz); Cc.push(c.r, c.g, c.b); SW.push(px, pz, d, s); PH.push(ph); }
      };
      // cord: a thin vertical ribbon (2.5 cm) so it reads from the side
      const segs = clamp(Math.round(span / 0.5), 4, 80);
      for (let i = 0; i < segs; i++) {
        const t0 = i / segs, t1 = (i + 1) / segs, p0 = at(t0), p1 = at(t1), s0 = sag * 4 * t0 * (1 - t0), s1 = sag * 4 * t1 * (1 - t1);
        const q0 = [p0[0], p0[1] - 0.025, p0[2]], q1 = [p1[0], p1[1] - 0.025, p1[2]];
        tri(p0, q0, p1, cord, 0, 0, 0, s0, s0, s1); tri(p1, q0, q1, cord, 0, 0, 0, s1, s0, s1);
      }
      const n = Math.max(1, Math.floor(span / spacing));
      const rnd = AF.rng ? AF.rng((Math.abs(ax * 131 + az * 71 + bx * 13) | 0) + 7) : Math.random;
      for (let i = 0; i < n; i++) {
        const tc = (i + 0.5) / n;
        let wv = shape === 'laundry' ? size * (0.55 + rnd() * 0.7) : size * 0.8;
        const hv = shape === 'laundry' ? size * (0.7 + rnd() * 0.6) : size;
        const dt = wv / 2 / span;
        const t0 = clamp(tc - dt, 0, 1), t1 = clamp(tc + dt, 0, 1), p0 = at(t0), p1 = at(t1), pm = at(tc);
        const s0 = sag * 4 * t0 * (1 - t0), s1 = sag * 4 * t1 * (1 - t1), sm = sag * 4 * tc * (1 - tc);
        const c = cols[i % cols.length];
        if (shape === 'pennant') {
          const tip = [pm[0], pm[1] - hv, pm[2]];
          tri(p0, tip, p1, c, 0, hv, 0, s0, sm, s1);
        } else {
          const q0 = [p0[0], p0[1] - hv, p0[2]], q1 = [p1[0], p1[1] - hv, p1[2]];
          if (shape === 'signal') {
            const c2 = cols[(i * 3 + 1) % cols.length];
            tri(p0, q0, p1, c, 0, hv, 0, s0, s0, s1); tri(p1, q0, q1, (i % 3 === 0) ? c : c2, 0, hv, hv, s1, s0, s1);
          } else {
            tri(p0, q0, p1, c, 0, hv, 0, s0, s0, s1); tri(p1, q0, q1, c, 0, hv, hv, s1, s0, s1);
            if (shape === 'laundry' && rnd() < 0.35) {   // a shirt: sleeves as small side flaps
              const sl = hv * 0.35, e0 = [p0[0] - (p1[0] - p0[0]) * 0.25, p0[1] - sl, p0[2] - (p1[2] - p0[2]) * 0.25], e1 = [p1[0] + (p1[0] - p0[0]) * 0.25, p1[1] - sl, p1[2] + (p1[2] - p0[2]) * 0.25];
              tri(p0, e0, [p0[0], p0[1] - sl * 1.4, p0[2]], c, 0, sl, sl * 1.4, s0, s0, s0); tri(p1, [p1[0], p1[1] - sl * 1.4, p1[2]], e1, c, 0, sl * 1.4, sl, s1, s1, s1);
            }
          }
        }
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(P), 3)); g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(N), 3));
      g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(Cc), 3)); g.setAttribute('aSw', new THREE.BufferAttribute(new Float32Array(SW), 4));
      g.setAttribute('aPh', new THREE.BufferAttribute(new Float32Array(PH), 1));
      const handle = { id: FL.n++, geo: g, mesh: null, bunting: true };
      if (opts.parent && opts.parent.isObject3D) {
        if (!buntMat) buntMat = makeBuntMat();
        const mesh = new THREE.Mesh(g, buntMat); padSphere(g, 1.5); mesh.castShadow = false; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.name = 'bunting';
        opts.parent.add(mesh); handle.mesh = mesh;
      } else if (!FL.mergedDone) FL.pending.push(handle);
      else {
        if (!buntMat) buntMat = makeBuntMat();
        const mesh = new THREE.Mesh(g, buntMat); padSphere(g, 1.5); mesh.castShadow = false; mesh.receiveShadow = true; mesh.frustumCulled = false; mesh.name = 'bunting';
        AF.scene.add(mesh); handle.mesh = mesh;
      }
      FL.list.push(handle);
      return handle;
    } catch (e) { if (AF.warnOnce) AF.warnOnce('makeBunting failed', e); return null; }
  };

  // merge everything registered during the build into one flag mesh + one bunting mesh (2 draw calls for the whole city)
  AF.onBuild('atmos-cloth', 699, () => {
    const t0 = performance.now();
    FL.mergedDone = true;
    const BGU = AF.addons && AF.addons.BGU;
    const flags = FL.pending.filter((h) => !h.bunting), bunts = FL.pending.filter((h) => h.bunting);
    FL.pending.length = 0;
    const mergeInto = (list, mat, name) => {
      if (!list.length) return null;
      let geo = null;
      try { geo = list.length === 1 ? list[0].geo : (BGU ? BGU.mergeGeometries(list.map((h) => h.geo), false) : null); } catch (e) { geo = null; }
      const meshes = [];
      if (geo) { const m = new THREE.Mesh(geo, mat); padSphere(geo, 3); meshes.push(m); }
      else for (const h of list) { const m = new THREE.Mesh(h.geo, mat); padSphere(h.geo, 2); meshes.push(m); }
      for (const m of meshes) { m.castShadow = false; m.receiveShadow = true; m.frustumCulled = false; m.name = name; AF.scene.add(m); FL.merged.push(m); }
      for (const h of list) h.mesh = meshes[0];
      return meshes[0];
    };
    if (flags.length) { if (!sharedFlagMat) sharedFlagMat = makeFlagMat(); mergeInto(flags, sharedFlagMat, 'flags'); }
    if (bunts.length) { if (!buntMat) buntMat = makeBuntMat(); mergeInto(bunts, buntMat, 'bunting'); }
    FL.ms = Math.round(performance.now() - t0);
    FL.stats = { flags: flags.length, bunting: bunts.length };
  });

  // ================================================================ night ground light pools (instanced additive decals)
  // Every outdoor AF.addLight (street / sign / shop / porch / lamp / neon) gets a soft warm (or neon-coloured) disc on the ground
  // under it — ONE instanced draw call for the whole city, so from the 200 m aerial the street grid reads as golden lines and
  // neon smears colour on the asphalt. Near the camera it fades to 35% (R1's shader pools light the 24 nearest properly).
  const PL = AF.pools2 = { mesh: null, k: 1, count: 0, mat: null };
  AF.onBuild('atmos-pools', 705, () => {
    const t0 = performance.now();
    const KINDS = { street: [0.62, 0.5, 3.6, 6.5], sign: [0.8, 0.62, 3.0, 8.0], neon: [0.8, 0.62, 3.0, 8.0], shop: [0.5, 0.5, 2.6, 5.5], porch: [0.42, 0.4, 2.0, 3.6], lamp: [0.5, 0.45, 2.4, 5.0] };
    const src = [];
    for (const l of AF.lights) { const K = KINDS[l.kind]; if (!K || !Number.isFinite(l.x) || !Number.isFinite(l.z)) continue; src.push([l, K]); if (src.length >= 6000) break; }
    if (!src.length) return;
    const geo = new THREE.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
    const mat = new THREE.ShaderMaterial({
      uniforms: { uK: { value: 0 } },
      vertexShader: `
        varying vec2 vUv; varying vec3 vCol; varying float vDist;
        void main() {
          vUv = uv * 2.0 - 1.0;
          #ifdef USE_INSTANCING_COLOR
            vCol = instanceColor;
          #else
            vCol = vec3(1.0, 0.75, 0.45);
          #endif
          vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
          vDist = distance(wp.xyz, cameraPosition);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform float uK; varying vec2 vUv; varying vec3 vCol; varying float vDist;
        void main() {
          float r = length(vUv); if (r > 1.0) discard;
          float q = 1.0 - r * r; float f = 0.7 * exp(-5.5 * r * r) + 0.42 * q * q * q;   // R2b: hot core + long soft tail (no 'coins'); pools overlap into golden street lines
          float nearK = mix(0.35, 1.0, smoothstep(24.0, 75.0, vDist));
          float farK = 1.0 - smoothstep(750.0, 1250.0, vDist);
          gl_FragColor = vec4(vCol * f * uK * nearK * farK, 0.0);
        }`,
      transparent: true, depthWrite: false, depthTest: true,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -6, fog: false,
    });
    const im = new THREE.InstancedMesh(geo, mat, src.length);
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new V3(), p = new V3(), c = new THREE.Color();
    let n = 0;
    for (const [l, K] of src) {
      const gy = AF.W.groundY(l.x, l.z);   // heightmap top (sidewalk / road / quay), never the lamp post or an awning
      if (!Number.isFinite(gy) || (l.y ?? gy + 4) - gy > 30) continue;   // a lamp high on a tower: no ground pool
      const r = clamp((l.range || 10) * K[1], K[2], K[3]) * 1.22;
      p.set(l.x, gy + 0.03, l.z); sc.set(r * 2, 1, r * 2); m4.compose(p, q, sc);
      im.setMatrixAt(n, m4);
      c.set(l.color ?? 0xffc67a); const k = K[0] * clamp(l.intensity ?? 1, 0.3, 2.2);
      im.setColorAt(n, c.multiplyScalar(k));
      n++;
    }
    im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
    im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.renderOrder = 3; im.name = 'ground-pools'; im.visible = false;
    AF.scene.add(im);
    PL.mesh = im; PL.mat = mat; PL.count = n; PL.ms = Math.round(performance.now() - t0);
  });
  AF.onTick('atmos-pools', 706, () => {
    if (!PL.mesh) return;
    const U = AF.mat && AF.mat.uniforms, n = U ? U.uNight.value : (AF.time.night || 0);
    const low = AF.GFX && AF.GFX.tier === 'low';
    const k = smooth(0.12, 0.7, n) * PL.k * (low ? 0.8 : 1) * (1 - 0.85 * ((AF.atmos && AF.atmos.indoor) || 0));
    PL.mat.uniforms.uK.value = k;
    PL.mesh.visible = k > 0.004;
  });

  // ================================================================ tests
  AF.test('atmos: AF.wind + AF.makeFlag/makeBunting exported, cloth merged', () => {
    const ok = !!(AF.wind && typeof AF.wind.at === 'function' && typeof AF.makeFlag === 'function' && typeof AF.makeBunting === 'function' && FL.mergedDone);
    const s = AF.wind.at(0, 0);
    return { ok: ok && s > 0 && s <= 1.6, info: `flags ${FL.list.filter((h) => !h.bunting).length}, bunting ${FL.list.filter((h) => h.bunting).length}, merge ${FL.ms ?? '-'} ms, wind ${s.toFixed(2)}` };
  });
  AF.test('atmos: night ground pools (instanced)', () => ({ ok: !PL.mesh || (PL.mesh.isInstancedMesh && PL.count > 0), info: `${PL.count} pools, ${PL.ms ?? '-'} ms` }));
}

} catch (e) { AF.partError('63-sky.js', e); }

