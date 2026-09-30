// ================================================================ 61-post.js
try {
// ===== 61-post: composer (R2) — scene (MSAA + depth) → god rays → AO (R1) → bloom → grade + tone map → tilt/DOF → FXAA → screen =====
// r160: the scene renders into a linear HalfFloat MSAA target with a DepthTexture (AF.gfx.depthTexture). Tone mapping + sRGB
// happen ONCE in the FINAL pass (AgX-punchy or ACES, per-hour grade), so every pass after it works in display space.
{
  const P = AF.post = AF.post || {};
  P.enabled = !AF.Q.has('nopost');
  P.quality = AF.Q.get('post') || 'high';     // legacy: 'high' | 'low' (low = no MSAA). The GFX tier decides now.
  P.tiltEnabled = AF.Q.has('tilt');   // ROUND 2: clarity is sacred — no miniature blur by default (?tilt to enable)
  P.dofEnabled = AF.Q.has('dof');   // owner 09-23: 'a bit fuzzy/foggy — needs to be clearer and sharper' → depth of field off by default (?dof to enable)
  P.raysEnabled = true;
  P.tone = AF.Q.get('tone') || 'aces';           // 'agx' (punchy look) | 'aces'
  const X = AF.addons || {};
  const tier = () => (AF.GFX && AF.GFX.tier) || 'ultra';
  AF.gfx = AF.gfx || {};

  const VS = `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
  const noDepth = (pass) => { if (pass && pass.material) { pass.material.depthTest = false; pass.material.depthWrite = false; } return pass; };

  // ------------------------------------------------------------ FINAL: rays + glare + exposure + grade + tone map + sRGB + vignette + grain + sharpen
  const FINAL = {
    uniforms: {
      tDiffuse: { value: null }, tRays: { value: null }, uRaysK: { value: 0 }, uSunCol: { value: new THREE.Color(1, 0.8, 0.5) }, uSunUV: { value: new THREE.Vector2(0.5, 0.5) },
      uGlare: { value: 0 }, uAspect: { value: 16 / 9 }, uExposure: { value: 1 }, uTM: { value: 1 },
      uLo: { value: new THREE.Vector3(1, 1, 1) }, uHi: { value: new THREE.Vector3(1, 1, 1) }, uSat: { value: 1.05 }, uContrast: { value: 0.12 },
      uT: { value: 0 }, uVig: { value: 0.26 }, uGrain: { value: 0.0 }, uLift: { value: 0.002 }, uSharp: { value: 0.5 }, uMini: { value: 0 }, uRes: { value: new THREE.Vector2(1280, 720) },
      uNight: { value: 0 }, uDbg: { value: 0 }, tDepth: { value: null }, uNF: { value: new THREE.Vector2(0.08, 2500) },
    },
    vertexShader: VS,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform sampler2D tRays; uniform float uRaysK; uniform vec3 uSunCol; uniform vec2 uSunUV; uniform float uGlare; uniform float uAspect;
      uniform float uExposure; uniform int uTM; uniform vec3 uLo; uniform vec3 uHi; uniform float uSat; uniform float uContrast;
      uniform float uT; uniform float uVig; uniform float uGrain; uniform float uLift; uniform float uSharp; uniform float uMini; uniform vec2 uRes; uniform float uNight; uniform float uDbg; uniform sampler2D tDepth; uniform vec2 uNF;
      varying vec2 vUv;
      float lum(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
      float gh(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
      vec3 aces(vec3 color) {
        const mat3 AI = mat3(vec3(0.59719, 0.07600, 0.02840), vec3(0.35458, 0.90834, 0.13383), vec3(0.04823, 0.01566, 0.83777));
        const mat3 AO = mat3(vec3(1.60475, -0.10208, -0.00327), vec3(-0.53108, 1.10813, -0.07276), vec3(-0.07367, -0.00605, 1.07602));
        color = AI * (color / 0.6);
        vec3 a = color * (color + 0.0245786) - 0.000090537; vec3 b = color * (0.983729 * color + 0.4329510) + 0.238081;
        return clamp(AO * (a / b), 0.0, 1.0);
      }
      vec3 agx(vec3 color) {
        const mat3 S2R = mat3(vec3(0.6274, 0.0691, 0.0164), vec3(0.3293, 0.9195, 0.0880), vec3(0.0433, 0.0113, 0.8956));
        const mat3 R2S = mat3(vec3(1.6605, -0.1246, -0.0182), vec3(-0.5876, 1.1329, -0.1006), vec3(-0.0728, -0.0083, 1.1187));
        const mat3 AI = mat3(vec3(0.856627153315983, 0.137318972929847, 0.11189821299995), vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903), vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859));
        const mat3 AOM = mat3(vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826), vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294), vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
        color = AI * (S2R * color);
        color = clamp((log2(max(color, 1e-10)) + 12.47393) / 16.5, 0.0, 1.0);
        vec3 x2 = color * color, x4 = x2 * x2;
        color = 15.5 * x4 * x2 - 40.14 * x4 * color + 31.96 * x4 - 6.868 * x2 * color + 0.4298 * x2 + 0.1191 * color - 0.00232;
        // punchy look
        float l = lum(color);
        color = pow(max(color, 0.0), vec3(1.3));
        color = l + 1.35 * (color - l);
        color = AOM * color;
        color = pow(max(color, 0.0), vec3(2.2));
        return clamp(R2S * color, 0.0, 1.0);
      }
      vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
      void main() {
        vec4 src = texture2D(tDiffuse, vUv);
        vec3 c = max(src.rgb, 0.0);
        // luminance-ratio sharpen (no colour shift, no halos on bright neon)
        if (uSharp > 0.001) {
          vec2 px = 1.0 / uRes;
          float ln = lum(texture2D(tDiffuse, vUv + vec2(px.x, 0.0)).rgb) + lum(texture2D(tDiffuse, vUv - vec2(px.x, 0.0)).rgb)
                   + lum(texture2D(tDiffuse, vUv + vec2(0.0, px.y)).rgb) + lum(texture2D(tDiffuse, vUv - vec2(0.0, px.y)).rgb);
          float l0 = lum(c), la = ln * 0.25;
          c *= clamp(1.0 + uSharp * (l0 - la) / max(l0 + 0.02, 1e-4), 0.75, 1.25);
        }
        // god rays + restrained sun glare (linear light)
        // shafts matter most in FRONT of geometry (the sky around the sun already glows)
        // scattering grows with the air between the camera and the surface: no glow smeared over things close by
        float dz = texture2D(tDepth, vUv).r;
        float onSky = step(0.99999, dz);
        float zz = 2.0 * uNF.x * uNF.y / (uNF.y + uNF.x - (dz * 2.0 - 1.0) * (uNF.y - uNF.x));
        float air = onSky > 0.5 ? 0.6 : 1.0 - exp(-zz / 140.0);
        c += texture2D(tRays, vUv).rgb * uSunCol * uRaysK * air;
        vec2 dv = (vUv - uSunUV) * vec2(uAspect, 1.0); float r2 = dot(dv, dv);
        c += uSunCol * (exp(-r2 * 14.0) * 0.35 + exp(-r2 * 140.0) * 0.65) * uGlare;
        c *= uExposure;
        // per-hour grade in linear light: saturation + tone-dependent tint (cool/teal lows, warm highs; blue night)
        float l = lum(c);
        c = max(mix(vec3(l), c, uSat + uMini * 0.16), 0.0);
        c *= mix(uLo, uHi, smoothstep(0.0, 0.75, l / (1.0 + l)));
        c += uLift * vec3(1.0, 0.9, 0.78) * (1.0 - smoothstep(0.0, 0.05, l));
        c = uTM == 1 ? agx(c) : aces(c);
        c = toSRGB(c);
        // gentle S-curve in display space
        c = mix(c, c * c * (3.0 - 2.0 * c), uContrast);
        // vignette
        vec2 q = vUv - 0.5; q.x *= uAspect * 0.75;
        c *= clamp(1.0 - dot(q, q) * uVig * 1.6, 0.0, 1.0);
        // grain (display space, luminance weighted)
        float g = gh(gl_FragCoord.xy + fract(uT * 7.13) * 917.0) - 0.5;
        c += g * uGrain * (0.25 + 0.75 * sqrt(max(lum(c), 0.0))) * 0.35;
        if (uDbg > 0.5) c = texture2D(tRays, vUv).rgb * 2.0;
        gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
      }`,
  };
  // ------------------------------------------------------------ BLUR: tilt-shift band (aerial) + depth of field (walk / interiors), separable
  const BLUR = {
    uniforms: { tDiffuse: { value: null }, tDepth: { value: null }, uHasDepth: { value: 0 }, uDir: { value: new THREE.Vector2(1, 0) }, uAmt: { value: 0 }, uFocus: { value: 0.5 }, uBand: { value: 0.08 },
      uRes: { value: new THREE.Vector2(1280, 720) }, uDof: { value: 0 }, uFocusZ: { value: 10 }, uNF: { value: new THREE.Vector2(0.08, 2500) } },
    vertexShader: VS,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform sampler2D tDepth; uniform float uHasDepth; uniform vec2 uDir; uniform float uAmt; uniform float uFocus; uniform float uBand; uniform vec2 uRes;
      uniform float uDof; uniform float uFocusZ; uniform vec2 uNF;
      varying vec2 vUv;
      float linZ(float d) { float z = d * 2.0 - 1.0; return 2.0 * uNF.x * uNF.y / (uNF.y + uNF.x - z * (uNF.y - uNF.x)); }
      void main() {
        float dy = abs(vUv.y - uFocus);
        float k = smoothstep(uBand, uBand + 0.42, dy) * uAmt;
        if (uDof > 0.001 && uHasDepth > 0.5) {
          float z = linZ(texture2D(tDepth, vUv).r);
          float coc = smoothstep(0.15, 1.0, abs(z - uFocusZ) / max(z, 0.1));
          k = max(k, coc * uDof);
        }
        vec4 c0 = texture2D(tDiffuse, vUv);
        if (k < 0.01) { gl_FragColor = c0; return; }
        vec2 off = uDir / uRes * k * (uRes.y / 720.0) * 3.2;
        vec4 s = c0 * 0.2270;
        s += (texture2D(tDiffuse, vUv + off * 1.3846) + texture2D(tDiffuse, vUv - off * 1.3846)) * 0.3162;
        s += (texture2D(tDiffuse, vUv + off * 3.2308) + texture2D(tDiffuse, vUv - off * 3.2308)) * 0.0703;
        gl_FragColor = s;
      }`,
  };
  // ------------------------------------------------------------ FXAA (low tier; display space)
  const FXAA = {
    uniforms: { tDiffuse: { value: null }, uRes: { value: new THREE.Vector2(1280, 720) } },
    vertexShader: VS,
    fragmentShader: `
      uniform sampler2D tDiffuse; uniform vec2 uRes; varying vec2 vUv;
      float L(vec3 c) { return dot(c, vec3(0.299, 0.587, 0.114)); }
      void main() {
        vec2 px = 1.0 / uRes;
        vec3 rgbM = texture2D(tDiffuse, vUv).rgb;
        float lNW = L(texture2D(tDiffuse, vUv + vec2(-1.0, -1.0) * px).rgb), lNE = L(texture2D(tDiffuse, vUv + vec2(1.0, -1.0) * px).rgb);
        float lSW = L(texture2D(tDiffuse, vUv + vec2(-1.0, 1.0) * px).rgb), lSE = L(texture2D(tDiffuse, vUv + vec2(1.0, 1.0) * px).rgb), lM = L(rgbM);
        float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE))), lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
        if (lMax - lMin < max(0.0312, lMax * 0.125)) { gl_FragColor = vec4(rgbM, 1.0); return; }
        vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
        float red = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
        float rcp = 1.0 / (min(abs(dir.x), abs(dir.y)) + red);
        dir = clamp(dir * rcp, -8.0, 8.0) * px;
        vec3 A = 0.5 * (texture2D(tDiffuse, vUv + dir * (1.0 / 3.0 - 0.5)).rgb + texture2D(tDiffuse, vUv + dir * (2.0 / 3.0 - 0.5)).rgb);
        vec3 B = A * 0.5 + 0.25 * (texture2D(tDiffuse, vUv - dir * 0.5).rgb + texture2D(tDiffuse, vUv + dir * 0.5).rgb);
        float lB = L(B);
        gl_FragColor = vec4((lB < lMin || lB > lMax) ? A : B, 1.0);
      }`,
  };
  // ------------------------------------------------------------ god rays: sky mask (depth = far AND sky alpha) → radial blur toward the sun
  const RMASK = {
    uniforms: { tScene: { value: null }, tDepth: { value: null }, uHasDepth: { value: 0 }, uSunUV: { value: new THREE.Vector2() }, uAspect: { value: 16 / 9 } },
    vertexShader: VS,
    fragmentShader: `
      uniform sampler2D tScene; uniform sampler2D tDepth; uniform float uHasDepth; uniform vec2 uSunUV; uniform float uAspect; varying vec2 vUv;
      void main() {
        vec4 s = texture2D(tScene, vUv);
        float d = uHasDepth > 0.5 ? texture2D(tDepth, vUv).r : 1.0;
        float sky = (1.0 - clamp(s.a, 0.0, 1.0)) * step(0.99999, d);
        vec2 dv = (vUv - uSunUV) * vec2(uAspect, 1.0);
        float fall = exp(-dot(dv, dv) * 9.0);
        float l = dot(s.rgb, vec3(0.2126, 0.7152, 0.0722));
        gl_FragColor = vec4(vec3(sky * fall * clamp(l - 0.45, 0.0, 3.0)), 1.0);
      }`,
  };
  const RBLUR = {
    uniforms: { tMask: { value: null }, uSunUV: { value: new THREE.Vector2() }, uDensity: { value: 0.9 }, uDecay: { value: 0.96 }, uWeight: { value: 0.05 } },
    vertexShader: VS,
    fragmentShader: `
      uniform sampler2D tMask; uniform vec2 uSunUV; uniform float uDensity; uniform float uDecay; uniform float uWeight; varying vec2 vUv;
      void main() {
        vec2 uv = vUv; vec2 delta = (uv - uSunUV) * uDensity / 32.0;
        float illum = 1.0, sum = 0.0;
        for (int i = 0; i < 32; i++) { uv -= delta; sum += texture2D(tMask, clamp(uv, 0.0, 1.0)).r * illum; illum *= uDecay; }
        gl_FragColor = vec4(vec3(sum * uWeight), 1.0);
      }`,
  };

  AF.onBuild('post', 700, () => {
    const R = AF.renderer, S = AF.scene, C = AF.camera;
    if (!X.EffectComposer || !X.RenderPass || !X.UnrealBloomPass || !X.ShaderPass || !X.OutputPass) { P.enabled = false; AF.warnOnce('post: addons missing'); return; }
    const size = R.getSize(new THREE.Vector2());
    const pr = R.getPixelRatio();
    const isGL2 = R.capabilities.isWebGL2;
    const W0 = Math.max(1, Math.round(size.x * pr)), H0 = Math.max(1, Math.round(size.y * pr));
    const msaa = () => (isGL2 && tier() !== 'low' && P.quality !== 'low') ? 4 : 0;
    // scene target: MSAA + depth texture (the depth is never touched by post passes)
    const mkScene = (w, h) => {
      const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: msaa() });
      rt.depthTexture = new THREE.DepthTexture(w, h); rt.depthTexture.type = THREE.UnsignedIntType;
      rt.texture.name = 'af.post.scene';
      return rt;
    };
    P.sceneRT = mkScene(W0, H0);
    AF.gfx.depthTexture = P.sceneRT.depthTexture;
    const rt = new THREE.WebGLRenderTarget(W0, H0, { type: THREE.HalfFloatType, depthBuffer: false });
    rt.texture.name = 'af.post.rt';
    const comp = P.composer = new X.EffectComposer(R, rt);
    comp.setPixelRatio(pr);
    comp.setSize(size.x, size.y);
    // copy quad (scene RT -> chain)
    const copy = new X.ShaderPass({ uniforms: { tDiffuse: { value: null } }, vertexShader: VS, fragmentShader: 'uniform sampler2D tDiffuse; varying vec2 vUv; void main(){ gl_FragColor = clamp(texture2D(tDiffuse, vUv), 0.0, 60000.0); }' });   // clamp also scrubs NaN/Inf (never let one pixel poison the bloom chain)
    noDepth(copy);
    // P.renderPass keeps the RenderPass API (scene/camera) for anyone who pokes at it
    P.renderPass = new X.RenderPass(S, C);
    P.scenePass = {
      enabled: true, needsSwap: false, clear: false, renderToScreen: false, name: 'af-scene',
      setSize(w, h) { P.sceneRT.setSize(w, h); },
      render(r, writeBuffer, readBuffer) {
        const cam = P.renderPass.camera || AF.camera;
        r.setRenderTarget(P.sceneRT); r.clear(); r.render(P.renderPass.scene || S, cam);
        copy.uniforms.tDiffuse.value = P.sceneRT.texture;
        r.setRenderTarget(readBuffer); copy.fsQuad.render(r);
      },
      dispose() {},
    };
    comp.addPass(P.scenePass);
    // god rays (reads the scene RT; output lives in its own small targets, composited by FINAL)
    {
      const mk = () => new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, depthBuffer: false });
      const G = P.rays = { a: mk(), b: mk(), mask: noDepth(new X.ShaderPass(RMASK)), blur: noDepth(new X.ShaderPass(RBLUR)), k: 0, scale: 0.5, w: 4, h: 4 };
      G.mask.uniforms.tDepth.value = P.sceneRT.depthTexture; G.mask.uniforms.uHasDepth.value = 1;
      G.resize = (w, h) => { G.scale = tier() === 'ultra' ? 0.5 : 0.25; G.w = Math.max(4, Math.round(w * G.scale)); G.h = Math.max(4, Math.round(h * G.scale)); G.a.setSize(G.w, G.h); G.b.setSize(G.w, G.h); };
      G.resize(W0, H0);
      P.raysPass = {
        enabled: true, needsSwap: false, clear: false, renderToScreen: false, name: 'af-godrays',
        setSize(w, h) { G.resize(w, h); },
        render(r) {
          if (G.k < 0.004) return;
          G.mask.uniforms.tScene.value = P.sceneRT.texture;
          r.setRenderTarget(G.a); G.mask.fsQuad.render(r);
          const B = G.blur.uniforms;
          B.tMask.value = G.a.texture; B.uDensity.value = 0.95; B.uDecay.value = 0.968; B.uWeight.value = 0.04;
          r.setRenderTarget(G.b); G.blur.fsQuad.render(r);
          if (tier() === 'ultra') { B.tMask.value = G.b.texture; B.uDensity.value = 0.45; B.uDecay.value = 0.975; B.uWeight.value = 0.036; r.setRenderTarget(G.a); G.blur.fsQuad.render(r); G.out = G.a; }
          else G.out = G.b;
        },
        dispose() {},
      };
      comp.addPass(P.raysPass);
    }
    // R1's AO pass (optional) right after the scene + rays
    P.insertAO = (pass) => {
      if (!pass || P.aoPass === pass) return;
      if (P.aoPass) { const i = comp.passes.indexOf(P.aoPass); if (i >= 0) comp.passes.splice(i, 1); }
      P.aoPass = pass;
      const at = comp.passes.indexOf(P.raysPass) + 1;
      comp.insertPass(pass, at);
      try { const s = R.getSize(new THREE.Vector2()); pass.setSize && pass.setSize(s.x * R.getPixelRatio(), s.y * R.getPixelRatio()); } catch (e) {}
    };
    try {
      const ao = (AF.gfx && AF.gfx.aoPass) || (typeof (AF.gfx && AF.gfx.makeAOPass) === 'function' ? AF.gfx.makeAOPass(R, S, C) : null);
      if (ao) P.insertAO(ao);
    } catch (e) { AF.warnOnce('post: AO pass failed', e); }
    P.bloom = new X.UnrealBloomPass(new THREE.Vector2(size.x, size.y), 0.3, 0.55, 1.6);
    comp.addPass(P.bloom);
    P.final = noDepth(new X.ShaderPass(FINAL));
    P.final.uniforms.tDepth.value = P.sceneRT.depthTexture;
    P.grade = P.final;   // legacy name
    comp.addPass(P.final);
    P.tiltH = noDepth(new X.ShaderPass(BLUR)); P.tiltH.uniforms.uDir.value.set(1, 0);
    P.tiltV = noDepth(new X.ShaderPass(BLUR)); P.tiltV.uniforms.uDir.value.set(0, 1);
    for (const p of [P.tiltH, P.tiltV]) { p.uniforms.tDepth.value = P.sceneRT.depthTexture; p.uniforms.uHasDepth.value = 1; }
    comp.addPass(P.tiltH); comp.addPass(P.tiltV);
    P.fxaa = noDepth(new X.ShaderPass(FXAA));
    comp.addPass(P.fxaa);
    P.output = null;   // tone mapping + sRGB are done in P.final
    const setRes = (w, h) => {
      const W = w * R.getPixelRatio(), H = h * R.getPixelRatio();
      for (const p of [P.final, P.tiltH, P.tiltV, P.fxaa]) p.uniforms.uRes.value.set(W, H);
      P.final.uniforms.uAspect.value = W / H; P.rays.mask.uniforms.uAspect.value = W / H;
    };
    setRes(size.x, size.y);
    AF.on('resize', (w, h) => { try { comp.setPixelRatio(R.getPixelRatio()); comp.setSize(w, h); setRes(w, h); } catch (e) { AF.warnOnce('post resize', e); } });
    // live tier changes: MSAA on/off, ray resolution
    const applyTier = () => {
      const want = msaa();
      if (P.sceneRT.samples !== want) { P.sceneRT.samples = want; P.sceneRT.dispose(); }
      const s = R.getSize(new THREE.Vector2()); P.rays.resize(s.x * R.getPixelRatio(), s.y * R.getPixelRatio());
    };
    if (AF.GFX && AF.GFX.onChange) AF.GFX.onChange(() => { try { applyTier(); } catch (e) { AF.warnOnce('post tier', e); } });

    P.tilt = 0; P.dof = 0; P.focusZ = 12;
    const plain = () => R.render(S, C);
    const v = new THREE.Vector3(), camDir = new THREE.Vector3(), sunW = new THREE.Vector3();
    const tc = new THREE.Color();
    // per-hour grade keys by sun height s: [s, lo rgb, hi rgb, sat, contrast]
    const GK = [
      [-0.4, [0.94, 0.98, 1.10], [1.12, 1.01, 0.86], 1.12, 0.0],    // deep night: blue shadows, warm lamp pools
      [-0.12, [0.94, 0.96, 1.10], [1.10, 1.00, 0.88], 1.10, 0.0],
      [-0.04, [0.96, 0.94, 1.09], [1.07, 0.97, 0.97], 1.07, 0.03],   // blue hour: purple-blue
      [0.02, [0.97, 0.92, 1.05], [1.14, 0.97, 0.82], 1.12, 0.1],     // sunset
      [0.12, [0.96, 0.99, 1.04], [1.12, 1.01, 0.86], 1.16, 0.12],    // golden hour: teal lows, amber highs
      [0.3, [0.98, 1.00, 1.03], [1.08, 1.00, 0.91], 1.15, 0.12],
      [0.6, [0.98, 1.00, 1.03], [1.04, 1.00, 0.96], 1.08, 0.08],
    ];
    const gradeAt = (s, U) => {
      let i = 1; while (i < GK.length - 1 && s > GK[i][0]) i++;
      const a = GK[i - 1], b = GK[i], t = AF.clamp((s - a[0]) / (b[0] - a[0]), 0, 1);
      U.uLo.value.set(AF.lerp(a[1][0], b[1][0], t), AF.lerp(a[1][1], b[1][1], t), AF.lerp(a[1][2], b[1][2], t));
      U.uHi.value.set(AF.lerp(a[2][0], b[2][0], t), AF.lerp(a[2][1], b[2][1], t), AF.lerp(a[2][2], b[2][2], t));
      U.uSat.value = AF.lerp(a[3], b[3], t); U.uContrast.value = AF.lerp(a[4], b[4], t) + 0.05 * (P.tilt || 0);
    };
    const depthProbe = { buf: new Uint8Array(4), t: 0 };
    P.update = () => {
      const n = AF.time.night || 0, ind = (AF.atmos && AF.atmos.indoor) || 0, T = tier();
      const cam = AF.camera, cp = cam.position;
      let gy = 0; try { gy = AF.W ? Math.max(0, AF.W.groundY(cp.x, cp.z) || 0) : 0; } catch (e) { gy = 0; }
      const alt = cp.y - gy, low = 1 - AF.smooth(6, 45, alt);
      // bloom: neon/marquees/windows glow from the air; softer at street level; never fogs the frame by day
      P.bloom.strength = AF.lerp(AF.lerp(0.14, AF.lerp(0.55, 0.26, low), n), 0.16, ind);
      P.bloom.threshold = AF.lerp(AF.lerp(1.4, AF.lerp(AF.lerp(0.95, 0.8, P.tilt), 1.2, low), n), 1.3, ind);
      P.bloom.radius = AF.lerp(0.3, AF.lerp(0.48, 0.38, low), n);
      const U = P.final.uniforms;
      U.uNF.value.set(cam.near, cam.far); U.uT.value = AF.clock.t; U.uNight.value = n; U.uDbg.value = AF.Q.has('raysdebug') ? 1 : 0;
      U.uTM.value = P.tone === 'aces' ? 0 : 1;
      const expo = R.toneMappingExposure || 1;
      U.uExposure.value = expo * (P.tone === 'aces' ? 1.0 : 1.55) * (1.06 + 0.06 * n * (1 - ind));
      const s = (AF.atmos && AF.atmos.sunVec) ? AF.atmos.sunVec.y : 0.3;
      gradeAt(s, U);
      if (ind > 0) { U.uLo.value.lerp(v.set(0.97, 0.97, 1.02), ind * 0.7); U.uHi.value.lerp(v.set(1.06, 1.0, 0.92), ind * 0.7); }
      U.uVig.value = AF.lerp(0.26, 0.32, n); U.uLift.value = AF.lerp(0.0015, 0.006, n); U.uGrain.value = 0;
      U.uSharp.value = T === 'low' ? 0.2 : (AF.GFX && AF.GFX.cinema) ? 0.3 : 0.22;   // lower: the sharpen was amplifying sub-pixel noise into grain   // R2b: capture quality gets a crisper sharpen
      // sun on screen: god rays + glare
      const sd = (AF.atmos && AF.atmos.sunVec) || AF.time.sunDir;
      cam.getWorldDirection(camDir);
      sunW.copy(sd).multiplyScalar(1000).add(cp);
      v.copy(sunW).project(cam);
      const facing = camDir.dot(sd);
      const sx = v.x * 0.5 + 0.5, sy = v.y * 0.5 + 0.5;
      U.uSunUV.value.set(sx, sy); P.rays.mask.uniforms.uSunUV.value.set(sx, sy); P.rays.blur.uniforms.uSunUV.value.set(sx, sy);
      const off = Math.max(Math.abs(sx - 0.5), Math.abs(sy - 0.5)) - 0.5;
      const onScreen = AF.smooth(0.5, 0.0, off) * AF.smooth(0.05, 0.45, facing);
      const golden = AF.smooth(0.55, 0.06, s) * AF.smooth(-0.04, 0.02, s);
      const skyU = AF.atmos && AF.atmos.skyU;
      if (skyU) tc.copy(skyU.uSunCol.value); else tc.setRGB(1, 0.8, 0.55);
      U.uSunCol.value.copy(tc);
      const raysOn = P.raysEnabled && T !== 'low';
      P.rays.k = raysOn ? onScreen * (0.35 + 0.65 * golden) * (1 - n) : 0;
      U.uRaysK.value = P.rays.k * AF.lerp(0.9, 1.4, ind) * 1.05;
      U.tRays.value = P.rays.k > 0.004 && P.rays.out ? P.rays.out.texture : null;
      if (!U.tRays.value) U.uRaysK.value = 0;
      U.uGlare.value = onScreen * AF.smooth(-0.03, 0.03, s) * (1 - ind) * 0.07 * (0.5 + 0.5 * golden);
      // tilt-shift miniature: aerial (or no mode) and high above the ground
      let amt = 0;
      if (P.tiltEnabled && (AF.mode === 'aerial' || !AF.mode)) {
        amt = AF.smooth(30, 140, alt) * 0.2;   // was 0.75: the miniature blur made the aerial read fuzzy
        amt *= AF.smooth(-0.05, -0.35, camDir.y);
      }
      P.tilt += (amt - P.tilt) * (AF.clock.dt > 0 ? Math.min(1, AF.clock.dt * 3) : 1);
      if (AF.SHOT) P.tilt = amt;
      U.uMini.value = P.tilt;
      // depth of field: walk mode / interiors (ultra + high), focus = depth under the crosshair (probed a few times a second)
      let dofT = 0;
      if (P.dofEnabled && T !== 'low' && (AF.mode === 'walk' || ind > 0.5 || (!AF.mode && alt < 8))) dofT = AF.lerp(0.16, 0.24, ind);
      P.dof += (dofT - P.dof) * (AF.clock.dt > 0 ? Math.min(1, AF.clock.dt * 3) : 1);
      if (AF.SHOT) P.dof = dofT;
      if (P.dof > 0.01) {
        depthProbe.t -= AF.clock.dt || 0;
        if (depthProbe.t <= 0 || AF.SHOT) {
          depthProbe.t = 0.25;
          // raycast-free focus: walk the view ray through the voxel grid (cheap, 0.5 m steps up to 60 m)
          let fz = 60;
          if (typeof AF.solidAt === 'function') { for (let d = 0.6; d < 60; d += 0.5) { if (AF.solidAt(cp.x + camDir.x * d, cp.y + camDir.y * d, cp.z + camDir.z * d)) { fz = d; break; } } }
          P.focusTarget = fz;
        }
        P.focusZ += ((P.focusTarget || 12) - P.focusZ) * (AF.SHOT ? 1 : Math.min(1, (AF.clock.dt || 0) * 4));
      }
      const on = P.tilt > 0.02 || P.dof > 0.01;
      P.tiltH.enabled = P.tiltV.enabled = on;
      if (on) for (const p of [P.tiltH, P.tiltV]) {
        const u = p.uniforms; u.uAmt.value = P.tilt; u.uFocus.value = 0.5; u.uBand.value = AF.lerp(0.34, 0.28, P.tilt);
        u.uDof.value = P.dof; u.uFocusZ.value = Math.max(0.5, P.focusZ); u.uNF.value.set(cam.near, cam.far);
      }
      P.fxaa.enabled = msaa() === 0;
    };
    P.adapt = () => {};   // the GFX tier (R1) handles adaptive quality now
    AF.renderFrame = () => {
      if (!P.enabled) return plain();
      try { P.update(); P.renderPass.camera = AF.camera; comp.render(AF.clock.dt || 1 / 60); }
      catch (e) { AF.warnOnce('post render failed — falling back', e); P.enabled = false; plain(); }
    };
  });

  AF.test('post: renderFrame renders without throwing', () => {
    let err = '';
    try { AF.renderFrame(); } catch (e) { err = String(e && e.message); }
    return { ok: !err && !!P.composer && P.enabled, info: err || ('passes ' + (P.composer ? P.composer.passes.length : 0) + ', tier ' + tier() + ', msaa ' + (P.sceneRT ? P.sceneRT.samples : '?') + ', AO ' + !!P.aoPass + ', tone ' + P.tone) };
  });
}

} catch (e) { AF.partError('61-post.js', e); }

