// ================================================================ 62-water.js
try {
// ===== 62-water (R2): shader water for the harbour + open sea, Swan Lake, the skating pond and fountain basins =====
// Multi-octave scrolling normal maps (generated at boot), fresnel sky reflection (the same sky/haze function as the dome),
// a glittering voxel sun path, shoreline foam from a precomputed shore-distance + depth texture, turquoise shallows → navy deep,
// and at night long shimmering reflection streaks of the lamps near the water. Water LEVELS are untouched (boats read the plan).
{
  const WQ = AF.water2 = AF.water2 || {};
  // AF.water2.addBoat(meshOrGroup): give any floating mesh hull foam + a wake (e.g. the Swan Lake rowboats)
  WQ.addBoat = (m) => { (WQ.extra = WQ.extra || []).push(m); WQ.boats = null; };
  const tier = () => (AF.GFX && AF.GFX.tier) || 'ultra';
  const NL = 16;   // max light streaks

  // ------------------------------------------------------------ tileable wave normal map (sum of integer-frequency waves)
  function makeNormalTex() {
    const N = 256, data = new Uint8Array(N * N * 4), r = AF.rng(9151);
    const waves = [];
    for (let i = 0; i < 28; i++) {
      let kx = 0, kz = 0; while (kx === 0 && kz === 0) { kx = Math.round((r() - 0.5) * 2 * (2 + i * 0.5)); kz = Math.round((r() - 0.5) * 2 * (2 + i * 0.5)); }
      const k = Math.hypot(kx, kz); waves.push({ kx, kz, a: 1 / Math.pow(k, 1.35), ph: r() * Math.PI * 2 });
    }
    let mx = 0; const gx = new Float32Array(N * N), gz = new Float32Array(N * N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      let dx = 0, dz = 0; const u = x / N * Math.PI * 2, v = y / N * Math.PI * 2;
      for (const w of waves) { const c = Math.cos(w.kx * u + w.kz * v + w.ph) * w.a; dx += c * w.kx; dz += c * w.kz; }
      const i = y * N + x; gx[i] = dx; gz[i] = dz; mx = Math.max(mx, Math.abs(dx), Math.abs(dz));
    }
    for (let i = 0; i < N * N; i++) { data[i * 4] = Math.round(127.5 + gx[i] / mx * 127); data[i * 4 + 1] = Math.round(127.5 + gz[i] / mx * 127); data[i * 4 + 2] = 255; data[i * 4 + 3] = 255; }
    const t = new THREE.DataTexture(data, N, N, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
    t.anisotropy = Math.min(4, AF.maxAniso || 1); t.needsUpdate = true;
    return t;
  }

  // ------------------------------------------------------------ shore distance (R, 0..16 m) + depth (G, 0..4 m) over the map, 0.5 m cells
  const SB = { x0: AF.W.X0, z0: AF.W.Z0, x1: AF.W.x1, z1: AF.W.z1, res: 0.5 };
  function makeShoreTex() {
    const t0 = performance.now();
    const W = AF.W, P = AF.PLAN, L = AF.land || {};
    const nx = Math.round((SB.x1 - SB.x0) / SB.res), nz = Math.round((SB.z1 - SB.z0) / SB.res);
    const seaY = (P.harbour && P.harbour.waterY) ?? -1.25, lakeY = L.LAKE_Y ?? (P.lake && P.lake.waterY) ?? -0.75, pondY = L.POND_Y ?? -0.5;
    const LK = P.lake, PD = P.pond;
    const levelAt = (x, z) => {
      if (LK && Math.abs(x - LK.cx) < LK.rx + 8 && Math.abs(z - LK.cz) < LK.rz + 8) return lakeY;
      if (PD && Math.abs(x - PD.cx) < PD.r + 6 && Math.abs(z - PD.cz) < PD.r + 6) return pondY;
      for (const q of P.pools || []) if (x > q.x0 - 6 && x < q.x1 + 6 && z > q.z0 - 6 && z < q.z1 + 6) return q.y;
      if (z > (P.harbour ? P.harbour.coastZ : 210) - 40) return seaY;
      return null;
    };
    const INF = 1e9, dist = new Float32Array(nx * nz), depth = new Uint8Array(nx * nz);
    const solid = (x, y, z) => { const c = W.getM(x, y, z); return c && AF.PAL.solid[c]; };
    for (let i = 0; i < nx; i++) {
      const x = SB.x0 + (i + 0.5) * SB.res;
      for (let k = 0; k < nz; k++) {
        const z = SB.z0 + (k + 0.5) * SB.res, idx = k * nx + i;
        const lv = levelAt(x, z);
        if (lv === null) { dist[idx] = 0; continue; }
        const gy = W.groundY(x, z);
        if (gy >= lv - 0.05 || solid(x, lv + 0.1, z) || solid(x, lv - 0.15, z)) { dist[idx] = 0; continue; }
        dist[idx] = INF; depth[idx] = Math.min(255, Math.round((lv - gy) / 4 * 255));
      }
    }
    // two-pass chamfer distance (cells)
    const a = 1, b = 1.4142;
    for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
      const idx = k * nx + i; let d = dist[idx]; if (d === 0) continue;
      if (i > 0) d = Math.min(d, dist[idx - 1] + a);
      if (k > 0) { d = Math.min(d, dist[idx - nx] + a); if (i > 0) d = Math.min(d, dist[idx - nx - 1] + b); if (i < nx - 1) d = Math.min(d, dist[idx - nx + 1] + b); }
      dist[idx] = d;
    }
    for (let k = nz - 1; k >= 0; k--) for (let i = nx - 1; i >= 0; i--) {
      const idx = k * nx + i; let d = dist[idx]; if (d === 0) continue;
      if (i < nx - 1) d = Math.min(d, dist[idx + 1] + a);
      if (k < nz - 1) { d = Math.min(d, dist[idx + nx] + a); if (i < nx - 1) d = Math.min(d, dist[idx + nx + 1] + b); if (i > 0) d = Math.min(d, dist[idx + nx - 1] + b); }
      dist[idx] = d;
    }
    const data = new Uint8Array(nx * nz * 4);
    for (let j = 0; j < nx * nz; j++) {
      const dm = dist[j] >= INF ? 16 : dist[j] * SB.res;
      data[j * 4] = Math.min(255, Math.round(dm / 16 * 255)); data[j * 4 + 1] = depth[j]; data[j * 4 + 2] = 0; data[j * 4 + 3] = 255;
    }
    const t = new THREE.DataTexture(data, nx, nz, THREE.RGBAFormat, THREE.UnsignedByteType);
    t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; t.needsUpdate = true;
    WQ.shoreMs = Math.round(performance.now() - t0);
    WQ.shoreData = data; WQ.shoreN = [nx, nz];
    return t;
  }

  const VS = `
    #include <common>
    #include <fog_pars_vertex>
    varying vec3 vW;
    void main() {
      vec4 wp = modelMatrix * vec4(position, 1.0);
      vW = wp.xyz;
      vec4 mvPosition = viewMatrix * wp;
      gl_Position = projectionMatrix * mvPosition;
      #include <fog_vertex>
    }`;
  const FS = `
    #include <common>
    #include <fog_pars_fragment>
    uniform sampler2D tN; uniform sampler2D tShore; uniform vec4 uShoreBox; uniform float uHasShore;
    uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uMoonDir; uniform float uSunK; uniform float uMoonK; uniform float uNight; uniform float uT;
    uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uFoamCol; uniform float uLight; uniform vec2 uFlow; uniform float uChop; uniform float uSea; uniform float uOct;
    uniform float uAlpha; uniform float uDepthMax; uniform float uSmall; uniform float uDepthK;
    uniform vec4 uL[${NL}]; uniform vec3 uLC[${NL}]; uniform int uNL;
    uniform vec4 uBa[8]; uniform vec4 uBb[8]; uniform int uNB;
    varying vec3 vW;
    float h12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    vec2 nm(vec2 uv) { return texture2D(tN, uv).xy * 2.0 - 1.0; }
    vec3 skyC(vec3 d) {
      vec3 base = afHazeBase(d);
      float w = 1.0 - exp(-max(d.y, 0.0) * 4.2);
      return mix(base, afSkyZ.rgb, w) + afGlow(d) * 0.6;
    }
    void main() {
      vec2 p = vW.xz;
      float camD = length(cameraPosition - vW);
      vec3 V = (cameraPosition - vW) / max(camD, 1e-3);
      // --- normals: scrolling octaves, fading fine detail with distance (no sparkly aliasing far away)
      vec2 fl = uFlow * uT;
      vec2 g = nm(p * 0.021 + fl * 0.3 + vec2(uT * 0.006, uT * 0.004)) * 1.0;
      g += nm(p * 0.057 - fl * 0.6 + vec2(-uT * 0.011, uT * 0.016)) * 0.75;
      float fd = 1.0 - smoothstep(60.0, 260.0, camD);
      if (uOct > 2.5) g += nm(p * 0.16 + fl + vec2(uT * 0.03, -uT * 0.021)) * 0.5 * (0.3 + 0.7 * fd);
      if (uOct > 3.5) g += nm(p * 0.43 - fl * 1.3 + vec2(-uT * 0.05, -uT * 0.04)) * 0.3 * fd;
      // --- shore data
      float shoreD = 16.0, depthM = uDepthMax;
      if (uHasShore > 0.5) {
        vec2 suv = (p - uShoreBox.xy) / (uShoreBox.zw - uShoreBox.xy);
        if (suv.x > 0.0 && suv.x < 1.0 && suv.y > 0.0 && suv.y < 1.0) { vec4 s = texture2D(tShore, suv); shoreD = s.r * 16.0; depthM = s.g * 4.0 + (s.g > 0.99 ? uDepthMax : 0.0); }
      }
      float calm = mix(0.55, 1.0, smoothstep(0.0, 6.0, shoreD));   // flatter in sheltered water along walls
      float str = uChop * calm * mix(0.10, 0.16, uSea);
      vec3 N = normalize(vec3(-g.x * str, 1.0, -g.y * str));
      float ndv = max(dot(N, V), 0.0);
      float fres = 0.02 + 0.98 * pow(clamp(1.0 - ndv, 0.0, 1.0), 5.0);
      vec3 R = reflect(-V, N); R.y = abs(R.y) + 0.01;
      vec3 sky = skyC(normalize(R));
      // --- body colour: turquoise shallows -> deep navy, lit by the ambient level; a hint of subsurface on wave backs
      float dk = smoothstep(0.1, uDepthK, depthM);
      vec3 body = mix(uShallow, uDeep, dk);
      float sss = pow(max(dot(V, -uSunDir) * 0.5 + 0.5, 0.0), 3.0) * max(g.x * uSunDir.x + g.y * uSunDir.z, 0.0);
      body = body * uLight + uShallow * sss * 0.35 * uSunK * uLight;
      // --- sun: sharp highlight + broad golden-hour glitter path broken into voxel-size sparkles
      float sd = max(dot(R, uSunDir), 0.0);
      vec3 spec = uSunCol * (pow(sd, 1200.0) * 90.0 + pow(sd, 160.0) * 3.0) * uSunK;
      vec2 cell = floor(p * 4.0);
      float tw = h12(cell + floor(uT * 7.0 + h12(cell) * 7.0));
      float spark = step(0.9, tw) * smoothstep(0.35, 0.9, g.x * 0.5 + g.y * 0.5 + 0.5);
      float lobe = pow(sd, 14.0);
      float low = 1.0 - smoothstep(0.15, 0.6, uSunDir.y);
      spec += uSunCol * lobe * (0.25 + spark * 7.0 * (0.4 + 0.6 * low)) * uSunK * (0.35 + 0.65 * uSea) * fd;
      // moon path
      float md = max(dot(R, uMoonDir), 0.0);
      spec += vec3(0.62, 0.72, 1.0) * (pow(md, 900.0) * 10.0 + pow(md, 16.0) * (0.12 + spark * 1.8)) * uMoonK;
      // --- night: long shimmering reflection streaks of lamps near the water
      vec3 streaks = vec3(0.0);
      if (uNL > 0) {
        for (int i = 0; i < ${NL}; i++) {
          if (i >= uNL) break;
          vec4 L = uL[i];
          vec2 c2 = cameraPosition.xz, l2 = L.xz;
          vec2 ax = l2 - c2; float D = length(ax); if (D < 1.0) continue;
          vec2 dir = ax / D;
          vec2 rel = p - c2;
          float along = dot(rel, dir) / D;
          float lat = dot(rel, vec2(-dir.y, dir.x));
          float hc = max(cameraPosition.y - vW.y, 0.3), hl = max(L.y - vW.y, 0.3);
          float sp = hc / (hc + hl);
          float span = smoothstep(sp * 0.45, sp * 0.8, along) * (1.0 - smoothstep(0.96, 1.02, along));
          float wid = 0.18 + 0.006 * length(rel);
          float wob = lat + (g.x * dir.y - g.y * dir.x) * 0.9 * wid * 3.0;
          float s = exp(-wob * wob / (wid * wid)) * span;
          float brk = smoothstep(0.1, 0.7, dot(g, dir) * 0.5 + 0.55 + (h12(floor(vec2(along * D * 3.0, lat * 2.0) + floor(uT * 3.0))) - 0.5) * 0.5);
          streaks += uLC[i] * s * brk * L.w / (1.0 + D * D * 0.00025);
        }
      }
      // --- shoreline foam: a crisp lip along walls/piers/hulls + lines rolling in (voxel-quantised)
      vec2 qp = (floor(p * 4.0) + 0.5) / 4.0;
      float fn = h12(floor(p * 4.0)) ;
      float lip = 1.0 - smoothstep(0.35, 1.1 + 0.6 * fn, shoreD);
      float roll = smoothstep(0.78, 0.95, fract(shoreD * 0.45 - uT * 0.22 + fn * 0.08 + sin(qp.x * 0.3 + qp.y * 0.2) * 0.3)) * (1.0 - smoothstep(0.5, 5.0, shoreD));
      float foam = clamp(lip * (0.55 + 0.45 * fn) + roll * 0.7 * step(0.35, fn), 0.0, 1.0) * uHasShore * (1.0 - uSmall);
      foam *= smoothstep(0.08, 0.3, depthM + 0.2);
      // --- boats: foam hugging the hull + a Kelvin wake and churned trail behind moving boats
      if (uNB > 0) {
        float bf = 0.0;
        for (int i = 0; i < 8; i++) {
          if (i >= uNB) break;
          vec4 A = uBa[i], B = uBb[i];
          vec2 d = qp - A.xy;
          float c = cos(B.x), s = sin(B.x);
          vec2 l = vec2(d.x * c - d.y * s, d.x * s + d.y * c);
          vec2 e = l / max(A.zw, vec2(0.3));
          vec2 e2 = e * e; float rb = sqrt(sqrt(e2.x * e2.x + e2.y * e2.y));
          float hull = smoothstep(1.0 + 1.2 / max(A.z, 0.5), 1.0, rb) * step(0.96, rb);
          bf = max(bf, hull * (0.45 + 0.55 * min(B.y * 0.5, 1.0)));
          if (B.y > 0.25) {
            vec2 vd = B.zw;
            float qx = dot(d, vec2(vd.y, -vd.x)), qy = -dot(d, vd);
            float L = max(A.z, A.w), t = qy - L * 0.7;
            if (t > 0.0 && t < 70.0) {
              float arm = abs(abs(qx) - (0.34 * t + A.z * 0.7));
              float w = 0.5 + t * 0.035;
              float kel = (1.0 - smoothstep(0.0, w, arm)) * (1.0 - t / 70.0) * (0.55 + 0.45 * sin(t * 1.3 - uT * 3.0));
              float trail = (1.0 - smoothstep(0.0, A.z * 0.8 + t * 0.06, abs(qx))) * (1.0 - smoothstep(0.0, 34.0, t));
              bf = max(bf, (kel * 0.75 + trail * 0.85) * min(B.y * 0.35, 1.0));
            }
          }
        }
        foam = max(foam, bf * (0.55 + 0.45 * fn) * step(0.22, fn + bf * 0.3));
      }
      // --- compose
      vec3 col = mix(body, sky, clamp(fres, 0.0, 1.0)) + spec + streaks * (0.4 + 0.6 * uNight);
      vec3 fc = uFoamCol * (uLight * 1.1 + 0.05) + uSunCol * uSunK * 0.25;
      col = mix(col, fc, foam * 0.9);
      float a = clamp(mix(uAlpha, 1.0, max(fres, dk * 0.85)) + foam + length(spec) * 0.1, 0.0, 1.0);
      gl_FragColor = vec4(col, a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }`;

  AF.onBuild('water2', 702, () => {
    const t0 = performance.now();
    const A = AF.atmos || {}, SU = A.skyU;
    if (!SU || !AF.world || !AF.world.water) return;
    const tN = WQ.normalTex = makeNormalTex();
    let tS = null;
    try { tS = WQ.shoreTex = makeShoreTex(); } catch (e) { AF.warnOnce('water2: shore texture failed', e); }
    WQ.mats = [];
    const lin = (h) => new THREE.Color(h);
    WQ.light = { value: 1 };
    WQ.lights = { L: { value: Array.from({ length: NL }, () => new THREE.Vector4()) }, LC: { value: Array.from({ length: NL }, () => new THREE.Color()) }, n: { value: 0 } };
    WQ.boatsU = { a: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, b: { value: Array.from({ length: 8 }, () => new THREE.Vector4()) }, n: { value: 0 } };
    for (const w of AF.world.water) {
      if (!w.mesh) continue;
      const ud = w.geo.userData || {};
      const isSea = !!ud.sea, kind = isSea ? 'sea' : (ud.kind || 'basin');
      const small = kind === 'basin';
      const cfg = {
        sea: { deep: 0x0b2c45, shallow: 0x2f9a9a, flow: [0.05, 0.03], chop: 1.0, alpha: 0.82, dmax: 6 },
        lake: { deep: 0x16404e, shallow: 0x2f6c68, flow: [0.02, 0.01], chop: 0.7, alpha: 0.86, dmax: 3, dk: 1.3 },
        pond: { deep: 0x14302e, shallow: 0x345e52, flow: [0.01, 0.01], chop: 0.55, alpha: 0.86, dmax: 2, dk: 1.1 },
        basin: { deep: 0x1d6a78, shallow: 0x58c0c4, flow: [0.02, 0.02], chop: 0.9, alpha: 0.6, dmax: 0.8 },
      }[kind] || { deep: 0x1d4a5a, shallow: 0x4a9a98, flow: [0.02, 0.01], chop: 0.8, alpha: 0.75, dmax: 2 };
      const U = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), THREE.UniformsLib.fog, {
        tN: { value: tN }, tShore: { value: tS }, uShoreBox: { value: new THREE.Vector4(SB.x0, SB.z0, SB.x1, SB.z1) }, uHasShore: { value: tS && !small ? 1 : 0 },
        uSunDir: SU.uSunDir, uSunCol: SU.uSunCol, uMoonDir: SU.uMoonDir, uSunK: SU.uSunK, uMoonK: SU.uMoonK, uNight: SU.uNight, uT: SU.uT,
        uDeep: { value: lin(cfg.deep) }, uShallow: { value: lin(cfg.shallow) }, uFoamCol: { value: lin(0xf4f1ea) }, uLight: WQ.light,
        uFlow: { value: new THREE.Vector2(cfg.flow[0], cfg.flow[1]) }, uChop: { value: cfg.chop }, uSea: { value: isSea ? 1 : 0 }, uOct: { value: 4 },
        uAlpha: { value: cfg.alpha }, uDepthMax: { value: cfg.dmax }, uSmall: { value: small ? 1 : 0 }, uDepthK: { value: cfg.dk || 3.6 },
        uL: WQ.lights.L, uLC: WQ.lights.LC, uNL: WQ.lights.n,
        uBa: WQ.boatsU.a, uBb: WQ.boatsU.b, uNB: small ? { value: 0 } : WQ.boatsU.n,
      });
      // keep fog uniforms shared by reference (plain objects) — fogColor/near/far are refreshed by three per material
      Object.assign(U, { fogColor: { value: new THREE.Color() }, fogNear: { value: 1 }, fogFar: { value: 2000 } });
      const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: VS, fragmentShader: FS, transparent: true, depthWrite: false, fog: true });
      mat.userData.kind = kind; mat.userData.r2 = true;
      w.mesh.material = mat; w.mesh.renderOrder = 1;
      WQ.mats.push(mat);
    }
    if (A.waterMats) { A.waterMats.length = 0; A.waterMats.push(...WQ.mats); }
    if (AF.mat) AF.mat.waterAnimated = WQ.mats;
    // candidate lights for reflections: near any water (quay, piers, lake/pond shores, lighthouse)
    const P = AF.PLAN, coast = (P.harbour && P.harbour.coastZ) || 210;
    const nearWater = (l) => {
      if (l.kind === 'interior') return false;
      if (l.z > coast - 14 && l.z < 320) return true;
      if (P.lake && Math.hypot((l.x - P.lake.cx) / (P.lake.rx + 10), (l.z - P.lake.cz) / (P.lake.rz + 10)) < 1) return true;
      if (P.pond && Math.hypot(l.x - P.pond.cx, l.z - P.pond.cz) < P.pond.r + 10) return true;
      return false;
    };
    WQ.cands = AF.lights.filter((l) => Number.isFinite(l.x) && Number.isFinite(l.z) && nearWater(l));
    if (P.harbour && P.harbour.lighthouse) { const LH = P.harbour.lighthouse; WQ.cands.push({ x: LH.x, y: 24, z: LH.z, color: 0xfff0c0, intensity: 3.5, kind: 'lighthouse' }); }
    WQ.ms = Math.round(performance.now() - t0);
  });

  const tmpC = new THREE.Color();
  let acc = 0;
  // dynamic boats (ferry, tugs, ships, putt-putt boats, rowboats) -> hull foam + wakes
  const box = new THREE.Box3(), bsz = new THREE.Vector3();
  function collectBoats() {
    const HR = AF.harbour || {}, out = [], seen = new Set();
    const add = (o, maxSize = 140) => {
      const m = o && (o.isObject3D ? o : (o.mesh || o.m || o.bm)); if (!m || !m.isObject3D || seen.has(m)) return; seen.add(m);
      const ry = m.rotation.y; m.rotation.y = 0; m.updateMatrixWorld(true); box.setFromObject(m); m.rotation.y = ry; m.updateMatrixWorld(true);
      box.getSize(bsz); if (!isFinite(bsz.x) || !isFinite(bsz.z) || bsz.x <= 0 || Math.max(bsz.x, bsz.z) > maxSize) return;
      const e = m.matrixWorld.elements, wx = e[12], wz = e[14];
      const cx = (box.min.x + box.max.x) / 2 - wx, cz = (box.min.z + box.max.z) / 2 - wz;
      out.push({ m, hx: bsz.x / 2, hz: bsz.z / 2, cx, cz, px: wx, pz: wz, sp: 0, vx: 0, vz: 1, world: true });
    };
    for (const o of (HR.ships || [])) add(o);
    for (const o of (HR.tugs || [])) add(o);
    if (HR.ferry) add(HR.ferry);
    if (HR.tug) add(HR.tug);
    for (const o of (HR.boats || [])) add(o);
    for (const o of (WQ.extra || [])) add(o);
    // Swan Lake / skating pond: anything small floating at the water line (rowboats, swans, ducks) gets foam + little wakes
    try {
      const P = AF.PLAN, L = AF.land || {}, LK = P.lake, PD = P.pond;
      const lakeY = L.LAKE_Y ?? (LK && LK.waterY) ?? -0.75, pondY = L.POND_Y ?? -0.5;
      const onWater = (x, y, z) => (LK && Math.hypot((x - LK.cx) / (LK.rx + 2), (z - LK.cz) / (LK.rz + 2)) < 1 && Math.abs(y - lakeY) < 0.45) || (PD && Math.hypot(x - PD.cx, z - PD.cz) < PD.r + 1 && Math.abs(y - pondY) < 0.45);
      let nl = 0;
      const visit = (o, depth) => {
        if (nl >= 24 || depth > 2) return;
        for (const c of o.children) {
          if (nl >= 24) return;
          if (c.isLight || c.isCamera || c.isPoints || c.name === 'world' || c.name === 'sky' || c.name === 'clouds') continue;
          c.updateWorldMatrix(true, false); const e = c.matrixWorld.elements;
          if ((c.isMesh || c.isGroup) && !c.isInstancedMesh && onWater(e[12], e[13], e[14]) && !seen.has(c)) { const before = out.length; add(c, 8); if (out.length > before) nl++; continue; }
          if (c.isGroup || c.type === 'Object3D') visit(c, depth + 1);
        }
      };
      visit(AF.scene, 0);
      WQ.lakeFloaters = nl;
    } catch (e) { AF.warnOnce('water2: lake floaters', e); }
    WQ.boats = out;
  }
  function updateBoats(dt) {
    if (!WQ.boats) { try { collectBoats(); } catch (e) { WQ.boats = []; AF.warnOnce('water2: boats', e); } }
    const cp = AF.camera.position, list = [];
    for (const b of WQ.boats) {
      const m = b.m; let x = m.position.x, z = m.position.z;
      if (b.world) { const e = m.matrixWorld.elements; x = e[12]; z = e[14]; }
      if (dt > 0) { const vx = (x - b.px) / dt, vz = (z - b.pz) / dt, sp = Math.hypot(vx, vz); b.sp += (Math.min(sp, 20) - b.sp) * Math.min(1, dt * 2); if (sp > 0.05) { b.vx = vx / sp; b.vz = vz / sp; } }
      b.px = x; b.pz = z;
      if (!m.visible && m.parent) continue;
      const d = Math.hypot(x - cp.x, z - cp.z); if (d < 320) list.push([d, b]);
    }
    list.sort((a, b) => a[0] - b[0]);
    const U = WQ.boatsU; let n = 0;
    for (const [, b] of list) {
      if (n >= 8) break;
      const ry = b.m.rotation.y, c = Math.cos(ry), s = Math.sin(ry);
      const wx = b.px + b.cx * c + b.cz * s, wz = b.pz - b.cx * s + b.cz * c;
      U.a.value[n].set(wx, wz, b.hx, b.hz); U.b.value[n].set(ry, AF.SHOT ? Math.max(b.sp, b.m.userData.afWakeK || 0) : b.sp, b.vx, b.vz); n++;
    }
    U.n.value = n;
  }
  AF.onTick('water2', 702, (dt) => {
    if (!WQ.mats || !WQ.mats.length) return;
    const T = AF.time, A = AF.atmos || {}, sv = A.sunVec || T.sunDir;
    const s = sv.y;
    const k = 0.1 + 0.95 * AF.smooth(-0.06, 0.4, s);
    WQ.light.value = k * (1 - T.night * 0.55) + 0.06 * T.night;
    const oct = tier() === 'ultra' ? 4 : tier() === 'high' ? 3 : 2;
    if (WQ.boatsU) updateBoats(dt);
    for (const m of WQ.mats) m.uniforms.uOct.value = oct;
    // light streaks: nearest candidates to the camera, refreshed a few times a second
    acc -= dt;
    if (acc <= 0 || AF.SHOT) {
      acc = 0.3;
      const maxN = tier() === 'ultra' ? NL : tier() === 'high' ? 8 : 0;
      const on = AF.smooth(0.25, 0.7, T.night);
      const cp = AF.camera.position;
      let n = 0;
      if (on > 0.01 && maxN > 0) {
        const c = WQ.cands.map((l) => ({ l, d: Math.hypot(l.x - cp.x, l.z - cp.z) })).filter((o) => o.d < 320).sort((a, b) => a.d - b.d).slice(0, maxN);
        for (const { l } of c) {
          WQ.lights.L.value[n].set(l.x, l.y ?? 4, l.z, (l.intensity ?? 1) * on * (l.kind === 'lighthouse' ? 1.5 : 1));
          WQ.lights.LC.value[n].set(l.color ?? 0xffc67a);
          n++;
        }
      }
      WQ.lights.n.value = n; WQ.nStatic = n;
    }
    // ROUND 2: dynamic reflections (firework bursts: WQ.dyn = [{x,y,z,col:[r,g,b],t}]) take the next slots every frame
    if (WQ.dyn && WQ.dyn.length && tier() !== 'low') {
      let n = Math.min(WQ.nStatic || 0, NL - 3);
      for (const e of WQ.dyn) { const k = Math.max(0, 1 - e.t / 2.4); if (k <= 0.01 || n >= NL) continue; WQ.lights.L.value[n].set(e.x, e.y, e.z, 5.5 * k * k); WQ.lights.LC.value[n].setRGB(e.col[0] * 0.5, e.col[1] * 0.5, e.col[2] * 0.5); n++; }
      WQ.lights.n.value = n;
    }
  });

  AF.test('water2: shader water on sea/lake/pond with shore texture', () => {
    const kinds = (WQ.mats || []).map((m) => m.userData.kind);
    let foamy = 0; if (WQ.shoreData) { const d = WQ.shoreData; for (let i = 0; i < d.length; i += 4) if (d[i] > 0 && d[i] < 40) foamy++; }
    return { ok: kinds.includes('sea') && kinds.includes('lake') && !!WQ.shoreTex && foamy > 1000, info: `mats ${kinds.join(',')} shore cells near edge ${foamy}, shore ${WQ.shoreMs} ms, total ${WQ.ms} ms, lamp candidates ${(WQ.cands || []).length}` };
  });
}

} catch (e) { AF.partError('62-water.js', e); }

