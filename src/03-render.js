// ================================================================ 03-render.js
try {
// ===== 03-render: renderer, scene, camera, baseline lights, loop, debug handle  (OWNER: coordinator) =====
{
  const cv = document.getElementById('cv');
  const R = AF.renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, preserveDrawingBuffer: AF.SHOT || AF.TEST, powerPreference: 'high-performance' });
  // base pixel ratio: 1.5 cap normally, native up to 2 in cinema; ?shot renders at 1 (or ?dpr=N for supersampled captures)
  AF.basePR = () => AF.SHOT ? AF.clamp(+AF.Q.get('dpr') || 1, 0.5, 3) : Math.min(devicePixelRatio || 1, AF.GFX.cinema ? 2 : 1.5);   // 1.5 keeps the frame rate smooth on a MacBook; Film/cinema renders at native 2x
  R.setPixelRatio(AF.basePR());
  R.outputColorSpace = THREE.SRGBColorSpace;
  R.toneMapping = THREE.ACESFilmicToneMapping;
  R.toneMappingExposure = 1.0;
  R.shadowMap.enabled = true;
  R.shadowMap.type = THREE.PCFSoftShadowMap;
  AF.maxAniso = R.capabilities.getMaxAnisotropy();

  const S = AF.scene = new THREE.Scene();
  S.background = new THREE.Color(0x9cc4e4);
  S.fog = new THREE.Fog(0xbcd3e0, 120, 620);
  const cam = AF.camera = new THREE.PerspectiveCamera(50, 16 / 9, 0.08, 2500);
  cam.position.set(-160, 120, 220); cam.lookAt(0, 0, 0);
  S.add(cam);

  // Baseline lights — the atmosphere part (60-atmos.js) takes these over (AF.sun, AF.hemi, AF.amb) and drives them.
  const sun = AF.sun = new THREE.DirectionalLight(0xfff0d8, 2.6);
  sun.position.set(120, 180, 80); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  const sc = sun.shadow.camera; sc.left = -140; sc.right = 140; sc.top = 140; sc.bottom = -140; sc.near = 1; sc.far = 900;
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.06;
  S.add(sun); S.add(sun.target);
  AF.hemi = new THREE.HemisphereLight(0xcfe3ff, 0x6b5a3e, 1.1); S.add(AF.hemi);
  AF.amb = new THREE.AmbientLight(0xffffff, 0.35); S.add(AF.amb);
  // shadow focus: parts set AF.shadowFocus (Vector3) + AF.shadowRadius; default follows the camera target
  AF.shadowFocus = new THREE.Vector3(); AF.shadowRadius = 140; AF.camTarget = new THREE.Vector3();
  // R1: NEAR cascade = three's sun shadow. At street level it hugs the view (small radius = crisp + cheap); from the air it
  // follows AF.shadowFocus/AF.shadowRadius (camera owners). Everything beyond is covered by the FAR cascade (below).
  AF.shadowNear = { r: 140, cx: 0, cz: 0 };
  const _fw = new THREE.Vector3();
  AF.onTick('shadow-follow', 890, () => {
    const d = AF.time.sunDir, cp = cam.position;
    let gy = 0; try { gy = AF.W ? Math.max(0, AF.W.groundY(cp.x, cp.z) || 0) : 0; } catch (e) { gy = 0; }
    const alt = cp.y - gy;
    const far = AF.gfx && AF.gfx.far && AF.gfx.far.on;
    let r = AF.shadowRadius, fx = AF.shadowFocus.x, fz = AF.shadowFocus.z;
    if (far) {
      cam.getWorldDirection(_fw); _fw.y = 0; const l = _fw.length() || 1; _fw.multiplyScalar(1 / l);
      const rStreet = AF.GFX.cinema ? 48 : AF.GFX.tier === 'ultra' ? 42 : AF.GFX.tier === 'high' ? 36 : 30;
      const k = AF.smooth(12, 60, alt);                       // 0 street .. 1 aerial
      const rs = rStreet, cxs = cp.x + _fw.x * rs * 0.72, czs = cp.z + _fw.z * rs * 0.72;
      r = AF.lerp(rs, Math.min(AF.shadowRadius, 200), k);
      fx = AF.lerp(cxs, fx, k); fz = AF.lerp(czs, fz, k);
      r = Math.round(r / 4) * 4;
    }
    AF.shadowNear.r = r; AF.shadowNear.cx = fx; AF.shadowNear.cz = fz;
    const fy = AF.shadowFocus.y || 0;
    if (sc.right !== r || sc.far !== 400 + r + 60) { sc.left = -r; sc.right = r; sc.top = r; sc.bottom = -r; sc.far = 400 + r + 60; sc.updateProjectionMatrix(); sun.shadow.bias = -0.36 / (sc.far - sc.near); }
    // texel snapping in LIGHT space (no shimmer while the camera moves)
    const texel = (2 * r) / sun.shadow.mapSize.x;
    const lz = _lz.copy(d).normalize(), lx = _lx.set(0, 1, 0).cross(lz); if (lx.lengthSq() < 1e-6) lx.set(1, 0, 0); lx.normalize(); const ly = _ly.copy(lz).cross(lx);
    const px = Math.round((fx * lx.x + fy * lx.y + fz * lx.z) / texel) * texel, py = Math.round((fx * ly.x + fy * ly.y + fz * ly.z) / texel) * texel;
    const pz = fx * lz.x + fy * lz.y + fz * lz.z;
    sun.target.position.set(lx.x * px + ly.x * py + lz.x * pz, lx.y * px + ly.y * py + lz.y * pz, lx.z * px + ly.z * py + lz.z * pz);
    sun.position.copy(sun.target.position).addScaledVector(d, 400);
  });
  const _lx = new THREE.Vector3(), _ly = new THREE.Vector3(), _lz = new THREE.Vector3();

  // fallback time-of-day (the atmosphere part replaces AF.timeTick)
  AF.timeTick = (dt) => {
    const T = AF.time; if (!T.paused) T.hours = (T.hours + dt * T.speed) % 24;
    const a = (T.hours - 6) / 12 * Math.PI; // 6h sunrise, 18h sunset
    T.sunDir.set(Math.cos(a) * 0.8, Math.max(0.05, Math.sin(a)), 0.45).normalize();
    T.night = AF.smooth(0.15, -0.1, Math.sin(a));
  };
  AF.onTick('time', 5, (dt) => { AF.timeTick(dt); AF.mat.uniforms.uNight.value = AF.time.night; });

  // fallback camera when no mode is active (tests / shots): AF.camPose(pos, target)
  AF.camPose = (px, py, pz, tx, ty, tz) => { cam.position.set(px, py, pz); AF.camTarget.set(tx, ty, tz); cam.lookAt(AF.camTarget); AF.shadowFocus.set(tx, 0, tz); };

  // resize
  AF.resize = () => {
    const w = AF.SHOT ? (+AF.Q.get('w') || 1280) : (innerWidth || 1280), h = AF.SHOT ? (+AF.Q.get('h') || 720) : (innerHeight || 720);
    R.setSize(w, h, !AF.SHOT); cam.aspect = w / h; cam.updateProjectionMatrix();
    AF.emit('resize', w, h);
  };
  addEventListener('resize', AF.resize); AF.resize();

  // render: post part may replace AF.renderFrame
  AF.renderFrame = () => R.render(S, cam);

  // loop
  let last = performance.now(), fpsAcc = 0, fpsN = 0;
  AF.fps = 60;
  AF.paused = false;
  const frame = (dt) => {
    AF.clock.dt = dt; AF.clock.t += dt; AF.clock.frame++;
    for (const h of AF.hooks.tick) {
      try { h.fn(dt, AF.clock.t); }
      catch (e) { if (h.errs++ < 3) console.error('[af] tick ' + h.name + ' threw:', e); if (h.errs === 3) AF.errors.push({ part: 'tick:' + h.name, msg: String(e && e.stack || e) }); }
    }
    try { AF.renderFrame(); } catch (e) { AF.warnOnce('render threw', e); }
    AF.input.endFrame();
  };
  AF.frame = frame;
  let lastTick = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (!AF.ready || AF.paused) { last = now; return; }
    const dt = Math.min(0.1, (now - last) / 1000); last = now; lastTick = now;
    fpsAcc += dt; fpsN++; if (fpsAcc > 0.5) { AF.fps = fpsN / fpsAcc; fpsAcc = 0; fpsN = 0; }
    frame(dt);
  };
  requestAnimationFrame(loop);
  // hidden-tab pump (the Claude browser pane never fires rAF). Only runs while hidden.
  {
    const MC = new MessageChannel(); let pumping = false;
    MC.port1.onmessage = () => {
      if (!document.hidden || AF.SHOT) { pumping = false; return; }
      const n = performance.now();
      if (AF.ready && !AF.paused && n - lastTick > 17) { const dt = Math.min(0.1, (n - lastTick) / 1000); lastTick = n; last = n; frame(dt); }
      MC.port2.postMessage(0);
    };
    const kick = () => { if (document.hidden && !pumping && !AF.SHOT) { pumping = true; MC.port2.postMessage(0); } };
    document.addEventListener('visibilitychange', kick); kick();
  }
  // deterministic stepping for tests / headless shots
  AF.step = (n = 1, dt = 1 / 60) => { const was = AF.paused; AF.paused = true; for (let i = 0; i < n; i++) frame(dt); AF.paused = was; return AF.clock.frame; };
  AF.pause = () => { AF.paused = true; };
  AF.resume = () => { AF.paused = false; };
  AF.capture = () => { AF.renderFrame(); return cv.toDataURL('image/png'); };

  // yield between boot stages (setTimeout is clamped to 1 s in hidden tabs)
  AF.yield = () => new Promise((res) => { if (document.hidden) { const mc = new MessageChannel(); mc.port1.onmessage = () => res(); mc.port2.postMessage(0); } else setTimeout(res, 0); });

  window.__af = AF;
}

// ---------------------------------------------------------------- dynamic small-object distance cull (coordinator)
// Small moving meshes (people parts, animals, car bodies, props) beyond AF.CULL.dist are moved to layer 31 (not rendered by
// the camera or the shadow map); beyond AF.CULL.shadow they stop casting shadows. Owners' own .visible toggles still work.
{
  AF.CULL = { dist: 150, shadow: 55, radius: 3.5, list: [], frame: 0, stats: { managed: 0, culled: 0, noShadow: 0 } };
  const C = AF.CULL, v = new THREE.Vector3();
  const skipNames = new Set(['world', 'sky', 'clouds', 'land-horizon']);
  const collect = () => {
    C.list.length = 0;
    for (const top of AF.scene.children) {
      if (skipNames.has(top.name) || top.isLight || top.isCamera) continue;
      top.traverse((o) => {
        if (!(o.isMesh) || o.isInstancedMesh || o.frustumCulled === false || !o.geometry) return;
        const g = o.geometry; if (!g.boundingSphere) g.computeBoundingSphere();
        const s = o.matrixWorld.elements; const sc = Math.max(Math.hypot(s[0], s[1], s[2]), Math.hypot(s[8], s[9], s[10]));
        if (!g.boundingSphere || g.boundingSphere.radius * sc > C.radius) return;
        if (o.userData.afCast === undefined) o.userData.afCast = o.castShadow;
        C.list.push(o);
      });
    }
    C.stats.managed = C.list.length;
  };
  AF.onTick('dyn-cull', 885, () => {
    if (!AF.ready) return;
    if (C.frame++ % 90 === 0) collect();
    const cp = AF.camera.position; let culled = 0, ns = 0;
    const L = C.list, n = L.length, part = 3, k = C.frame % part;
    for (let i = k; i < n; i += part) {
      const o = L[i]; v.setFromMatrixPosition(o.matrixWorld);
      const d = v.distanceTo(cp);
      if (d > C.dist) { if (!o.userData.afCulled) { o.userData.afCulled = true; o.layers.set(31); } culled++; }
      else if (o.userData.afCulled) { o.userData.afCulled = false; o.layers.set(0); }
      const cast = o.userData.afCast && d < C.shadow;
      if (o.castShadow !== cast) o.castShadow = cast;
      if (!cast) ns++;
    }
    C.stats.culled = culled * part; C.stats.noShadow = ns * part;
  });
}

// ================================================================ R1: GFX tiers, far shadow cascade, environment reflections, surfaces
{
  const R = AF.renderer, S = AF.scene, cam = AF.camera, G = AF.GFX, U = AF.mat.uniforms;
  AF.gfx = AF.gfx || {};
  // ---------------------------------------------------------------- tier auto-pick (ultra on capable GPUs; low on software / integrated)
  {
    let gpu = '';
    try { const gl = R.getContext(); const ext = gl.getExtension('WEBGL_debug_renderer_info'); gpu = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)); } catch (e) {}
    AF.gfx.gpu = gpu;
    if (!G.forced) {
      let t = 'ultra';
      if (/swiftshader|llvmpipe|software|mali|adreno|powervr|intel.*(hd|uhd)/i.test(gpu) || !R.capabilities.isWebGL2 || R.capabilities.maxTextureSize < 8192) t = 'low';
      else if (/intel/i.test(gpu)) t = 'high';
      G.tier = t;
    }
  }
  // per-tier settings (read by R1 code every frame)
  const TIER = {
    ultra: { near: 4096, far: 2048, farR: 380, env: 1.0, pat: 1, win: 1, dynMin: 0.95 },
    high: { near: 2048, far: 2048, farR: 340, env: 0.85, pat: 1, win: 1, dynMin: 0.9 },
    low: { near: 2048, far: 1024, farR: 300, env: 0.0, pat: 0, win: 0, dynMin: 0.8 },
    // ROUND 2 capture quality (AF.GFX.set('cinema') / ?gfx=cinema): ultra + 4096 far cascade over 420 m, props at full detail to 200 m
    cinema: { near: 4096, far: 4096, farR: 420, env: 1.0, pat: 1, win: 1, dynMin: 1.0, lod: 200, ao: 16 },
  };
  AF.gfx.TIER = TIER;
  const cur = AF.gfx.tierCfg = () => G.cinema ? TIER.cinema : (TIER[G.tier] || TIER.ultra);
  const texSeen = new WeakSet();
  const sharpenTextures = () => {     // anisotropic filtering on every mip-mapped texture in the scene (signs, decals, sky cards)
    const a = G.cinema ? AF.maxAniso : Math.min(4, AF.maxAniso);
    AF.scene.traverse((o) => {
      const mats = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : null; if (!mats) return;
      for (const m of mats) for (const k of ['map', 'emissiveMap', 'alphaMap']) {
        const t = m[k]; if (!t || !t.isTexture || t.isDataTexture || t.minFilter === THREE.NearestFilter || texSeen.has(t) && t.anisotropy === a) continue;
        texSeen.add(t); if (t.anisotropy !== a) { t.anisotropy = a; t.needsUpdate = true; }
      }
    });
  };
  AF.gfx.sharpenTextures = sharpenTextures;
  const applyTier = () => {
    const T = cur(), sun = AF.sun;
    AF.LOD_DIST = T.lod || 110;
    if (G.cinema) G.scale = 1;
    const pr = AF.basePR() * G.scale; if (Math.abs(R.getPixelRatio() - pr) > 1e-3) { R.setPixelRatio(pr); if (AF.ready) AF.resize(); }
    if (AF.ready) { try { sharpenTextures(); } catch (e) { AF.warnOnce('aniso', e); } }
    if (sun && sun.shadow.mapSize.x !== T.near) { sun.shadow.mapSize.set(T.near, T.near); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
    U.uPatK.value = T.pat; U.uWinK.value = T.win;
    if (AF.gfx.far) AF.gfx.far.resize(T.far, T.farR);
  };
  G.onChange(applyTier);
  // ---------------------------------------------------------------- auto-downgrade + dynamic resolution (never in ?shot / ?test)
  {
    const base = AF.basePR;
    let ema = 16.7, slowT = 0, adjT = 0, fastT = 0;
    AF.onTick('gfx-adapt', 960, (dt) => {
      if (AF.SHOT || AF.TEST || !AF.ready || AF.paused || document.hidden || G.cinema) return;   // cinema: fixed full resolution, never downgrade
      const ms = dt * 1000; if (ms <= 0 || ms > 250) return;
      ema += (ms - ema) * 0.08; adjT += dt;
      // dynamic resolution: 0.7..1.0 of the base pixel ratio
      if (adjT > 1.0) {
        adjT = 0; const T = cur(); let s = G.scale;
        if (ema > 19) s = Math.max(T.dynMin, s - 0.05); else if (ema < 14.5) s = Math.min(1, s + 0.05);
        if (s !== G.scale && AF.Q.has('dynres')) { G.scale = s; R.setPixelRatio(base() * s); AF.resize(); }   // off by default: every change reallocates the render targets and stutters
      }
      // tier downgrade: > 22 ms for 3 s with resolution already at its floor
      if (G.auto && ema > 22) slowT += dt; else slowT = Math.max(0, slowT - dt);
      if (slowT > 6) { slowT = 0; if (G.tier === 'ultra') G.set('high', 'slow frames'); }   // never auto-drop to 'low' (no MSAA → FXAA blur); low is a manual choice
      fastT = 0;
    });
  }

  // ---------------------------------------------------------------- FAR shadow cascade (R1)
  // A second, wide sun depth map (±farR m) rendered by R1 from the static world only (region base + far-LOD meshes), refreshed when
  // the sun turns > 0.2° or the view centre moves > 32 m (never per frame). The voxel shader blends three's near map into it.
  {
    const F = AF.gfx.far = { on: !AF.Q.has('nofar'), size: 0, R: 380, rt: null, renders: 0, ms: 0, dir: new THREE.Vector3(), cx: 1e9, cz: 1e9, dirty: true, frameN: 0 };
    const depthMat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, side: THREE.BackSide });
    const fcam = F.cam = new THREE.OrthographicCamera(-380, 380, 380, -380, 1, 1600);
    const fscene = new THREE.Scene(); fscene.overrideMaterial = depthMat; fscene.matrixWorldAutoUpdate = false;
    const bias = new THREE.Matrix4().set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    F.resize = (size, rad) => {
      if (F.size !== size) {
        if (F.rt) F.rt.dispose();
        F.rt = new THREE.WebGLRenderTarget(size, size, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false, depthBuffer: true });
        F.rt.texture.name = 'af.farShadow'; F.size = size; F.dirty = true;
      }
      if (F.R !== rad) { F.R = rad; F.dirty = true; }
      U.uFarMap.value = F.rt.texture; U.uFarTexel.value.set(1 / size, (2 * rad) / size);
      U.uFarBias.value = 0.00025 + ((2 * rad) / size) * 0.0009;
    };
    const tmp = new THREE.Vector3(), fw = new THREE.Vector3(), cc = new THREE.Color();
    F.render = () => {
      const t0 = performance.now();
      const wg = AF.world && AF.world.group; if (!wg || !F.rt) return;
      const d = AF.time.sunDir;
      fcam.left = -F.R; fcam.right = F.R; fcam.top = F.R; fcam.bottom = -F.R; fcam.near = 1; fcam.far = 1600; fcam.updateProjectionMatrix();
      fcam.position.set(F.cx, 0, F.cz).addScaledVector(d, 800); fcam.up.set(0, 1, 0); if (Math.abs(d.y) > 0.99) fcam.up.set(0, 0, 1);
      fcam.lookAt(F.cx, 0, F.cz); fcam.updateMatrixWorld(true);
      // static casters only: hide glass/water/non-casters and swap near-LOD props for their far versions
      const hid = [], shown = [];
      for (const m of wg.children) if (m.visible && (!m.castShadow || m.name === 'water')) { m.visible = false; hid.push(m); }
      if (AF.world.lod) for (const r of AF.world.lod.values()) { if (r.near && r.near.visible) { r.near.visible = false; hid.push(r.near); if (r.far && !r.far.visible) { r.far.visible = true; shown.push(r.far); } } }
      fscene.children = [wg];
      const prevRT = R.getRenderTarget(), prevAuto = R.autoClear, prevSM = R.shadowMap.autoUpdate; R.getClearColor(cc); const prevA = R.getClearAlpha();
      R.shadowMap.autoUpdate = false;
      R.setRenderTarget(F.rt); R.setClearColor(0xffffff, 1); R.autoClear = true; R.clear(true, true, true);
      R.render(fscene, fcam);
      R.setRenderTarget(prevRT); R.setClearColor(cc, prevA); R.autoClear = prevAuto; R.shadowMap.autoUpdate = prevSM;
      fscene.children = [];
      for (const m of hid) m.visible = true; for (const m of shown) m.visible = false;
      U.uFarMat.value.multiplyMatrices(bias, fcam.projectionMatrix).multiply(fcam.matrixWorldInverse);
      U.uFarOn.value = 1; F.dir.copy(d); F.renders++; F.ms = Math.round((performance.now() - t0) * 10) / 10; F.dirty = false;
    };
    F.update = (force) => {
      if (!F.on || !AF.ready && !force) { U.uFarOn.value = 0; return; }
      const cp = cam.position; cam.getWorldDirection(fw); fw.y = 0; const l = fw.length() || 1; fw.multiplyScalar(1 / l);
      let cx = cp.x + fw.x * F.R * 0.5, cz = cp.z + fw.z * F.R * 0.5;
      cx = AF.clamp(cx, -260, 260); cz = AF.clamp(cz, -260, 260);
      cx = Math.round(cx / 32) * 32; cz = Math.round(cz / 32) * 32;
      const moved = cx !== F.cx || cz !== F.cz, turned = F.dir.angleTo(AF.time.sunDir) > 0.0035;
      F.frameN++;
      if (force || F.dirty || moved || turned || F.frameN > 900) { F.cx = cx; F.cz = cz; F.frameN = 0; F.render(); }
    };
    AF.onTick('far-shadow', 891, () => { try { F.update(false); } catch (e) { AF.warnOnce('far shadow failed', e); F.on = false; U.uFarOn.value = 0; } });
    AF.on('ready', () => { try { F.update(true); } catch (e) { AF.warnOnce('far shadow failed', e); } });
  }
  applyTier();
  AF.on('ready', () => { try { sharpenTextures(); } catch (e) { AF.warnOnce('aniso', e); } });

  // ---------------------------------------------------------------- environment reflections (PMREM of R2's AF.sky.envScene; analytic fallback)
  {
    const E = AF.gfx.env = { on: !AF.Q.has('noenv'), rt: null, ver: -1, t: 0, n: 0, ms: 0, src: '' };
    let pmrem = null;
    // fallback: a gradient sphere fed by the atmosphere's sky uniforms (or fixed golden-hour colours)
    const fbU = { uZen: { value: new THREE.Color(0x5a8ccc) }, uHor: { value: new THREE.Color(0xf0d0a0) }, uGnd: { value: new THREE.Color(0x3a3026) }, uSunDir: { value: new THREE.Vector3(0.5, 0.3, 0.3) }, uSunCol: { value: new THREE.Color(0xffd9a0) }, uSunK: { value: 1 } };
    const fbMat = new THREE.ShaderMaterial({
      uniforms: fbU, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: 'varying vec3 vD; void main(){ vD = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: `uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uGnd; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform float uSunK; varying vec3 vD;
        void main(){ vec3 d = normalize(vD); float y = d.y;
          vec3 c = y > 0.0 ? mix(uHor, uZen, pow(clamp(y, 0.0, 1.0), 0.55)) : mix(uHor * 0.8, uGnd, smoothstep(0.0, 0.25, -y));
          float sd = max(dot(d, normalize(uSunDir)), 0.0);
          c += uSunCol * uSunK * (pow(sd, 400.0) * 12.0 + pow(sd, 12.0) * 0.35);
          gl_FragColor = vec4(c, 1.0); }`,
    });
    const fbScene = new THREE.Scene(); fbScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), fbMat));
    const pull = () => {
      const su = AF.atmos && AF.atmos.skyU;
      if (su) { fbU.uZen.value.copy(su.uZen.value); fbU.uHor.value.copy(su.uHor.value); fbU.uGnd.value.copy(su.uGnd.value); fbU.uSunDir.value.copy(su.uSunDir.value); fbU.uSunCol.value.copy(su.uSunCol.value); fbU.uSunK.value = su.uSunK.value; }
      else { fbU.uSunDir.value.copy(AF.time.sunDir); fbU.uSunK.value = 1 - (AF.time.night || 0); }
    };
    E.update = () => {
      if (!E.on) return;
      const t0 = performance.now();
      if (!pmrem) { pmrem = new THREE.PMREMGenerator(R); }
      const sky = AF.sky && AF.sky.envScene;
      let src = fbScene; E.src = 'fallback';
      if (sky && sky.isScene) { src = sky; E.src = 'sky'; } else pull();
      const prevRT = R.getRenderTarget();
      const rt = pmrem.fromScene(src, 0, 0.1, 5000);
      R.setRenderTarget(prevRT);
      const old = E.rt; E.rt = rt;
      for (const m of [AF.mat.voxel, AF.mat.glass]) { const had = !!m.envMap; m.envMap = rt.texture; if (!had) m.needsUpdate = true; }
      if (old) old.dispose();
      E.n++; E.ms = Math.round((performance.now() - t0) * 10) / 10;
    };
    let lastH = -99, acc = 0;
    AF.onTick('env-refresh', 892, (dt) => {
      if (!E.on || !AF.ready) return;
      acc += dt;
      const sky = AF.sky && AF.sky.envScene, ver = AF.sky && AF.sky.version;
      const T = cur();
      const ind = (AF.atmos && AF.atmos.indoor) || 0;
      const k = T.env * (1 - 0.75 * ind);
      AF.mat.voxel.envMapIntensity = k; AF.mat.glass.envMapIntensity = k * 1.2;
      if (T.env <= 0) { if (AF.mat.voxel.envMap) { AF.mat.voxel.envMapIntensity = 0; AF.mat.glass.envMapIntensity = 0; } return; }
      if (AF.gfx.far && AF.gfx.far.frameN === 0) return;      // never on the same frame as a far-shadow refresh
      let need = !E.rt;
      if (sky && ver !== undefined) need = need || (ver !== E.ver && acc > 0.5);
      else need = need || (Math.abs(AF.time.hours - lastH) > 0.08 && acc > 1.0);
      if (AF.SHOT && Math.abs(AF.time.hours - lastH) > 0.01) need = true;
      if (need) { E.ver = ver; lastH = AF.time.hours; acc = 0; E.update(); }
    });
  }

  // ---------------------------------------------------------------- per-frame uniforms for the voxel shader
  // engine R2: drifting cloud shadows (AF.cloudShadow.k 0..1 = how much direct sun a cloud blocks; 0 disables; ?noclouds)
  const CS = AF.cloudShadow = { k: AF.Q.has('noclouds') ? 0 : 0.42, speed: 5.5, scale: 1 / 210 };
  AF.onTick('r1-uniforms', 6, (dt) => {
    U.uAfTime.value = AF.clock.t;
    U.uDayK.value = 1 - (AF.time.night || 0) * 0.85;
    const w = AF.wind, sp = CS.speed * CS.scale * dt * (w && w.base != null ? 0.6 + w.base : 1);
    U.uCloudOff.value.x -= (w ? w.x : 0.34) * sp; U.uCloudOff.value.y -= (w ? w.z : -0.94) * sp;
    U.uCloudK.value = CS.k * (1 - (AF.time.night || 0)) * (AF.GFX.tier === 'low' ? 0 : 1); U.uCloudScale.value = CS.scale;
    U.uSunW.value.copy(AF.time.sunDir);
  });
  // ---------------------------------------------------------------- auto surfaces for v1 content (patterns, metals, windows)
  AF.onBuild('r1-auto-surfaces', 499, () => {
    const n = AF.PAL.autoSurfaces ? AF.PAL.autoSurfaces() : 0;
    AF.PAL.dirty = true;
    console.log('[af] r1 auto surfaces: ' + n + ' palette entries, tier ' + G.tier + ', gpu ' + (AF.gfx.gpu || '?'));
  });
  // expose for tests / debugging
  AF.gfx.stats = () => ({ tier: G.tier, cinema: G.cinema, lod: AF.LOD_DIST, pr: R.getPixelRatio(), scale: G.scale, near: AF.sun.shadow.mapSize.x, nearR: AF.shadowNear.r, far: AF.gfx.far && { on: AF.gfx.far.on, size: AF.gfx.far.size, R: AF.gfx.far.R, renders: AF.gfx.far.renders, ms: AF.gfx.far.ms }, env: AF.gfx.env && { src: AF.gfx.env.src, n: AF.gfx.env.n, ms: AF.gfx.env.ms }, autoSurf: AF.PAL.autoCount });
}

// ================================================================ R1: screen-space ambient occlusion pass (half-res SAO + bilateral blur + depth-aware upsample)
// AF.gfx.makeAOPass(renderer, scene, camera) -> composer pass. Depth: AF.gfx.depthTexture (R2's scene RT) or readBuffer.depthTexture.
// Tunables live in AF.gfx.ao: { radius (m), intensity, maxDist (m), samples }. Off on the 'low' tier.
{
  const R = AF.renderer, G = AF.GFX;
  const AO = AF.gfx.ao = { radius: 1.5, intensity: 1.05, maxDist: 650, bias: 0.0025, strength: 0.85 };
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const DEPTH_FNS = `
    uniform sampler2D tDepth; uniform mat4 uInvProj; uniform mat4 uProj;
    vec3 afVP(vec2 uv) { float d = texture2D(tDepth, uv).x; vec4 c = vec4(uv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0); vec4 v = uInvProj * c; return v.xyz / v.w; }
  `;
  const AO_FS = `
    precision highp float;
    ${DEPTH_FNS}
    uniform vec2 uFull; uniform float uRadius; uniform float uIntensity; uniform float uBias; uniform float uMaxDist; uniform float uN; uniform float uDbgAO;
    varying vec2 vUv;
    void main() {
      float d = texture2D(tDepth, vUv).x;
      if (d >= 0.99999) { gl_FragColor = vec4(1.0, 1e4, 0.0, 1.0); return; }
      vec3 P = afVP(vUv);
      vec2 tx = 1.0 / uFull;
      vec3 pr = afVP(vUv + vec2(tx.x, 0.0)), pl = afVP(vUv - vec2(tx.x, 0.0)), pu = afVP(vUv + vec2(0.0, tx.y)), pd = afVP(vUv - vec2(0.0, tx.y));
      vec3 dx = abs(pr.z - P.z) < abs(P.z - pl.z) ? pr - P : P - pl;
      vec3 dy = abs(pu.z - P.z) < abs(P.z - pd.z) ? pu - P : P - pd;
      vec3 N = normalize(cross(dx, dy));
      float z = -P.z;
      float rW = uRadius * clamp(1.0 + z * 0.02, 1.0, 6.0);
      float rS = rW * uProj[1][1] * 0.5 / z;                 // radius in uv (y) units
      rS = min(rS, 0.12);
      float aspect = uFull.y / uFull.x;
      float ign = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
      float sum = 0.0;
      for (int i = 0; i < 16; i++) {
        if (float(i) >= uN) break;
        float a = (float(i) + 0.5) / uN;
        float ang = a * 6.2831853 * 3.0 + ign * 6.2831853;
        float h = rS * (0.15 + 0.85 * a * a);
        vec2 suv = vUv + vec2(cos(ang) * aspect, sin(ang)) * h;
        vec3 Q = afVP(suv);
        vec3 v = Q - P; float vv = dot(v, v);
        float vn = dot(v, N);
        float fall = max(0.0, 1.0 - vv / (rW * rW));
        sum += fall * max(0.0, vn - uBias * z - 0.01) / (sqrt(vv) + 0.01 * rW);
      }
      float ao = max(0.0, 1.0 - uIntensity * sum * 2.0 / uN);
      ao = mix(1.0, ao, 1.0 - smoothstep(uMaxDist * 0.6, uMaxDist, z));
      if (uDbgAO > 0.5) ao = uDbgAO < 1.5 ? N.y * 0.5 + 0.5 : uDbgAO < 2.5 ? N.z * 0.5 + 0.5 : uDbgAO < 3.5 ? rS * 8.0 : sum / uN;
      gl_FragColor = vec4(ao, z, 0.0, 1.0);
    }`;
  const BLUR_FS = `
    precision highp float;
    uniform sampler2D tAO; uniform vec2 uTx; varying vec2 vUv;
    void main() {
      vec4 c0 = texture2D(tAO, vUv); float z0 = c0.y;
      float s = 0.0, w = 0.0;
      for (int y = -2; y <= 2; y++) for (int x = -2; x <= 2; x++) {
        vec4 c = texture2D(tAO, vUv + vec2(float(x), float(y)) * uTx);
        float k = exp(-abs(c.y - z0) / (0.02 * z0 + 0.05) * 2.0) * (1.0 - 0.12 * float(abs(x) + abs(y)));
        s += c.x * k; w += k;
      }
      gl_FragColor = vec4(s / max(w, 1e-4), z0, 0.0, 1.0);
    }`;
  const COMP_FS = `
    precision highp float;
    ${DEPTH_FNS}
    uniform sampler2D tDiffuse; uniform sampler2D tAO; uniform vec2 uHalf; uniform float uStrength; uniform float uDebug;
    varying vec2 vUv;
    void main() {
      vec4 col = texture2D(tDiffuse, vUv);
      float d = texture2D(tDepth, vUv).x;
      if (d >= 0.99999) { gl_FragColor = col; return; }
      float z = -afVP(vUv).z;
      vec2 hp = vUv * uHalf - 0.5; vec2 b = floor(hp); vec2 f = hp - b;
      float s = 0.0, w = 0.0;
      for (int j = 0; j < 2; j++) for (int i = 0; i < 2; i++) {
        vec2 o = vec2(float(i), float(j));
        vec4 c = texture2D(tAO, (b + o + 0.5) / uHalf);
        float bw = (i == 0 ? 1.0 - f.x : f.x) * (j == 0 ? 1.0 - f.y : f.y);
        float k = bw / (0.001 + abs(c.y - z) / max(z, 1.0));
        s += c.x * k; w += k;
      }
      float ao = w > 0.0 ? s / w : 1.0;
      ao = mix(1.0, ao, uStrength);
      gl_FragColor = uDebug > 2.5 ? vec4(vec3(texture2D(tAO, vUv).x), 1.0) : uDebug > 1.5 ? vec4(vec3(fract(z / 10.0)), 1.0) : uDebug > 0.5 ? vec4(vec3(ao), 1.0) : vec4(col.rgb * ao, col.a);
    }`;
  AF.gfx.makeAOPass = (renderer, scene, camera) => {
    const quadGeo = new THREE.PlaneGeometry(2, 2); const qcam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const mkMat = (fs, uniforms) => new THREE.ShaderMaterial({ uniforms, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false });
    const uAO = { tDepth: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uProj: { value: new THREE.Matrix4() }, uFull: { value: new THREE.Vector2(1, 1) }, uRadius: { value: AO.radius }, uIntensity: { value: AO.intensity }, uBias: { value: AO.bias }, uMaxDist: { value: AO.maxDist }, uN: { value: 12 }, uDbgAO: { value: 0 } };
    const uBlur = { tAO: { value: null }, uTx: { value: new THREE.Vector2() } };
    const uComp = { tDepth: { value: null }, uInvProj: uAO.uInvProj, uProj: uAO.uProj, tDiffuse: { value: null }, tAO: { value: null }, uHalf: { value: new THREE.Vector2(1, 1) }, uStrength: { value: AO.strength }, uDebug: { value: 0 } };
    const mAO = mkMat(AO_FS, uAO), mBlur = mkMat(BLUR_FS, uBlur), mComp = mkMat(COMP_FS, uComp);
    const quad = new THREE.Mesh(quadGeo, mAO); quad.frustumCulled = false;
    const mkRT = () => new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
    const rtA = mkRT(), rtB = mkRT();
    const draw = (r, mat, target) => { quad.material = mat; r.setRenderTarget(target); r.render(quad, qcam); };
    const pass = {
      name: 'af-ao', enabled: true, needsSwap: true, clear: false, renderToScreen: false, ms: 0,
      setSize(w, h) { const hw = Math.max(4, Math.round(w / 2)), hh = Math.max(4, Math.round(h / 2)); rtA.setSize(hw, hh); rtB.setSize(hw, hh); uAO.uFull.value.set(w, h); uBlur.uTx.value.set(1 / hw, 1 / hh); uComp.uHalf.value.set(hw, hh); },
      render(r, writeBuffer, readBuffer) {
        const depth = (AF.gfx && AF.gfx.depthTexture) || readBuffer.depthTexture;
        const on = depth && G.tier !== 'low' && !AF.Q.has('noao');
        const cam = (AF.post && AF.post.renderPass && AF.post.renderPass.camera) || AF.camera;
        uComp.tDiffuse.value = readBuffer.texture;
        if (!on) { uComp.uStrength.value = 0; uComp.tDepth.value = depth || null; if (!depth) { mComp.defines = mComp.defines || {}; } }
        if (on) {
          uAO.tDepth.value = depth; uComp.tDepth.value = depth;
          uAO.uProj.value.copy(cam.projectionMatrix); uAO.uInvProj.value.copy(cam.projectionMatrixInverse);
          uAO.uRadius.value = AO.radius; uAO.uIntensity.value = AO.intensity; uAO.uBias.value = AO.bias; uAO.uMaxDist.value = AO.maxDist;
          uAO.uN.value = G.cinema ? 16 : G.tier === 'ultra' ? 12 : 8; uAO.uDbgAO.value = AF.gfx.aoDbg || 0;
          const ind = (AF.atmos && AF.atmos.indoor) || 0;
          uComp.uStrength.value = AO.strength * (1 - 0.25 * ind);
          draw(r, mAO, rtA);
          uBlur.tAO.value = rtA.texture; draw(r, mBlur, rtB);
          uComp.tAO.value = rtB.texture;
        }
        uComp.uDebug.value = +AF.gfx.aoDebug || 0;
        if (!on) { uComp.tAO.value = rtB.texture; }
        draw(r, mComp, this.renderToScreen ? null : writeBuffer);
      },
      dispose() { rtA.dispose(); rtB.dispose(); mAO.dispose(); mBlur.dispose(); mComp.dispose(); quadGeo.dispose(); },
    };
    AF.gfx.aoPass = pass;
    return pass;
  };
  // v1 post (no insertAO / no scene depth): R1 wires the pass in itself so the AO works stand-alone. R2's 61-post supersedes this.
  AF.on('ready', () => {
    const P = AF.post; if (!P || !P.composer || P.insertAO || AF.gfx.aoPass || AF.Q.has('noao')) return;
    try {
      const comp = P.composer, rp = P.renderPass; if (!rp) return;
      const s = R.getSize(new THREE.Vector2()), pr = R.getPixelRatio();
      for (const t of [comp.renderTarget1, comp.renderTarget2]) { if (!t.depthTexture) { t.depthTexture = new THREE.DepthTexture(Math.round(s.x * pr), Math.round(s.y * pr)); t.depthTexture.type = THREE.UnsignedIntType; t.dispose(); } }
      const pass = AF.gfx.makeAOPass(R, AF.scene, AF.camera);
      comp.insertPass(pass, comp.passes.indexOf(rp) + 1);
      pass.setSize(Math.round(s.x * pr), Math.round(s.y * pr));
      AF.gfx.aoSelfWired = true;
    } catch (e) { AF.warnOnce('r1 AO self-wire failed', e); }
  });
}

// ================================================================ R1: night light pools — feeds the 24 nearest outdoor lights to the voxel shader
{
  const U = AF.mat.uniforms, KINDS = new Set(['street', 'porch', 'sign', 'shop', 'lamp', 'neon']);
  const P = AF.gfx.pools = { k: 1, max: 24, range: 1.0, n: 0 };
  let cand = null, fr = 0; const tc = new THREE.Color();
  const pick = () => {
    if (!cand) cand = AF.lights.filter((l) => KINDS.has(l.kind));
    const cp = AF.camera.position, arr = [];
    for (const l of cand) { const d = (l.x - cp.x) ** 2 + (l.z - cp.z) ** 2 + (l.y - cp.y) ** 2; if (d < 160 * 160) arr.push([d, l]); }
    arr.sort((a, b) => a[0] - b[0]);
    const n = Math.min(P.max, arr.length);
    for (let i = 0; i < n; i++) {
      const l = arr[i][1]; tc.set(l.color ?? 0xffc67a);
      const r = Math.max(4, Math.min(18, (l.range || 10) * 0.9)) * P.range, k = (l.intensity ?? 1) * (l.kind === 'sign' ? 0.9 : 1.6);
      U.uLP.value[i].set(l.x, l.y, l.z, r); U.uLC.value[i].set(tc.r * k, tc.g * k, tc.b * k, 0);
    }
    U.uLN.value = n; P.n = n;
  };
  AF.onTick('r1-pools', 893, () => {
    if (!AF.ready) return;
    const on = (AF.time.night || 0) > 0.02 && AF.GFX.tier !== 'low';
    U.uPoolK.value = on ? P.k : 0;
    if (!on) return;
    if (fr++ % 15 === 0 || AF.SHOT) pick();
  });
  AF.on('ready', () => { cand = null; });
}

// ---------------------------------------------------------------- engine v2: indoor AO crease + contact shadows under props
// AF.contact = { k, margin, count, ms, mesh } — soft blob shadows (35-40 %, 0.28 m falloff) under every floor-standing
// placeStatic prop that has a ceiling/roof overhead (furniture, counters, shelves, pianos…). One merged decal mesh, built at 505.
// Opt a prop out with geo.userData.noContact = true; ?nocontact disables. Keeps scene alpha (god-ray sky mask) untouched.
{
  const aoOut = [0.42, 0.62, 0.82, 1.0], aoIn = [0.30, 0.50, 0.76, 1.0];
  AF.onTick('engine-ao-indoor', 893, () => {
    const u = AF.mat && AF.mat.uniforms && AF.mat.uniforms.uAO; if (!u) return;
    const k = Math.min(1, Math.max(0, (AF.atmos && AF.atmos.indoor) || 0));
    u.value.set(aoOut[0] + (aoIn[0] - aoOut[0]) * k, aoOut[1] + (aoIn[1] - aoOut[1]) * k, aoOut[2] + (aoIn[2] - aoOut[2]) * k, 1);
  });
  const C = AF.contact = { k: 0.4, margin: 0.28, count: 0, ms: 0, mesh: null };
  AF.onBuild('engine-contact-shadows', 505, () => {
    if (AF.Q.has('nocontact') || !AF.world || !AF.world.props || !AF.W) return;
    const t0 = performance.now(), W = AF.W, OP = AF.PAL.opaque;
    const roofAt = (x, y0, z) => { const bx = W.bx(x), bz = W.bz(z); for (let by = W.by(y0), e = Math.min(W.NY - 1, W.by(y0 + 9)); by <= e; by++) { const c = W.get(bx, by, bz); if (c && OP[c]) return true; } return false; };
    const P = [], L = [], I = []; let n = 0;
    for (const pr of AF.world.props) {
      const g = pr.geo; if (!g || !g.attributes || !g.attributes.position || (g.userData && g.userData.noContact)) continue;
      const bb = g.boundingBox || (g.computeBoundingBox(), g.boundingBox); if (!bb || !isFinite(bb.min.x)) continue;
      let x0 = bb.min.x, z0 = bb.min.z, x1 = bb.max.x, z1 = bb.max.z;
      const r = pr.rot | 0;
      if (r === 1) { const a = x0, b = x1; x0 = z0; x1 = z1; z0 = -b; z1 = -a; }
      else if (r === 2) { const a = x0, b = z0; x0 = -x1; x1 = -a; z0 = -z1; z1 = -b; }
      else if (r === 3) { const a = x0, b = x1; x0 = -z1; x1 = -z0; z0 = a; z1 = b; }
      const w = x1 - x0, d = z1 - z0, h = bb.max.y - bb.min.y;
      if (w < 0.2 || d < 0.2 || w * d > 24 || w > 9 || d > 9 || h < 0.3) continue;
      const cx = pr.x + (x0 + x1) / 2, cz = pr.z + (z0 + z1) / 2, baseY = pr.y + bb.min.y;
      if (!roofAt(cx, baseY + h + 0.3, cz)) continue;
      const fl = AF.surfaceBelow(cx, cz, baseY + 0.26, 1.0);
      if (!(fl > -50) || Math.abs(fl - baseY) > 0.26) continue;
      const hw = w / 2, hd = d / 2, m = C.margin, y = fl + 0.012;
      P.push(cx - hw - m, y, cz - hd - m, cx + hw + m, y, cz - hd - m, cx + hw + m, y, cz + hd + m, cx - hw - m, y, cz + hd + m);
      L.push(-hw - m, -hd - m, hw, hd, hw + m, -hd - m, hw, hd, hw + m, hd + m, hw, hd, -hw - m, hd + m, hw, hd);
      I.push(n, n + 2, n + 1, n, n + 3, n + 2); n += 4;
    }
    C.count = n / 4;
    if (n) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3));
      geo.setAttribute('aLoc', new THREE.Float32BufferAttribute(L, 4));
      geo.setIndex(n > 65535 ? new THREE.Uint32BufferAttribute(I, 1) : new THREE.Uint16BufferAttribute(I, 1));
      geo.computeBoundingSphere();
      const mat = new THREE.ShaderMaterial({
        uniforms: { uK: { value: C.k }, uM: { value: C.margin } },
        vertexShader: 'attribute vec4 aLoc; varying vec4 vLoc; void main() { vLoc = aLoc; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
        fragmentShader: 'uniform float uK; uniform float uM; varying vec4 vLoc; void main() { vec2 q = abs(vLoc.xy) - vLoc.zw; float o = length(max(q, 0.0)); float a = uK * (1.0 - smoothstep(0.0, uM, o)); if (a < 0.004) discard; gl_FragColor = vec4(0.0, 0.0, 0.0, a); }',
        transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide, fog: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
        blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
        blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.OneFactor,
      });
      const mesh = C.mesh = new THREE.Mesh(geo, mat);
      mesh.name = 'contact-shadows'; mesh.renderOrder = 1; mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false;
      mesh.matrixAutoUpdate = false; mesh.updateMatrix();
      AF.scene.add(mesh);
      AF.onTick('engine-contact-k', 894, () => { mat.uniforms.uK.value = C.k; mat.uniforms.uM.value = C.margin; mesh.visible = C.k > 0 && !(AF.GFX && AF.GFX.tier === 'low' && C.lowOff); });
    }
    C.ms = Math.round(performance.now() - t0);
    console.log('[af] contact shadows:', C.count, 'props in', C.ms, 'ms (of', AF.world.props.length, 'props)');
  });
}

} catch (e) { AF.partError('03-render.js', e); }

