// ================================================================ 60-atmos.js
try {
// ===== 60-atmos: time of day + sun path, sky dome, voxel clouds, point-light pool, interior lighting,
//       water shader, particles (leaves, chimney smoke, falls mist, fireflies, dust motes)  (OWNER: atmos) =====
{
  const A = AF.atmos = AF.atmos || {};
  const T = AF.time, W = AF.W;
  const V3 = THREE.Vector3;
  const clamp = AF.clamp, lerp = AF.lerp, smooth = AF.smooth;
  // player brightness (exposure multiplier, saved per browser). Default = the slider's maximum (owner request, Oct 2026); the key
  // was bumped to '.bright2' so earlier saved values don't hide the new default. ?shot / ?test keep 1.0 for comparable captures.
  AF.brightness = (() => { try { const v = parseFloat(localStorage.getItem('portSolace.bright2')); if (v >= 0.6 && v <= 2) return v; } catch (e) { /* storage blocked */ } return AF.SHOT || AF.TEST ? 1.0 : 2.0; })();
  AF.setBrightness = (v) => { AF.brightness = clamp(+v || 1, 0.6, 2); try { localStorage.setItem('portSolace.bright2', String(AF.brightness)); } catch (e) { /* storage blocked */ } };
  if (AF.Q.has('hour')) T.hours = ((+AF.Q.get('hour') % 24) + 24) % 24;
  else T.hours = 20.6;   // boot at night: the lit city, neon and light pools are the best first look
  if (AF.Q.has('speed')) T.speed = +AF.Q.get('speed');
  // v2 dusk pacing: minute one runs a little fast (17.7 -> ~18.05: the sunset band deepens, lamps and the first windows come on),
  // then the clock eases to a SLOWED 1 h / 5 min so the sunset and blue hour linger. Any user speed change (UI buttons) wins.
  A.pace = { on: !AF.Q.has('hour') && !AF.Q.has('speed') && !AF.TEST, t: 0, set: null };
  // city lights: lamps, lit windows and ground pools start at dusk (sun < ~12 deg), well before full night
  A.cityLights = 0;
  A.litFrac = 0.62;

  // ============================================================ R2: ATMOSPHERIC PERSPECTIVE (replaces three's fog chunks)
  // Every material with fog:true that uses three's standard fog includes gets distance + height fog whose colour is the
  // sky's own horizon haze in that view direction (+ sun in-scatter), so the far city melts into the sky seamlessly.
  // Uniforms are plain-object vec4s: three's cloneUniforms keeps them BY REFERENCE, so one write reaches every material.
  const SK = AF.sky = AF.sky || {};
  const v4 = (x, y, z, w) => ({ value: { x, y, z, w } });
  const FU = SK.U = {
    afFogA: v4(0.0016, 0.02, 0, 1),        // x density at baseY, y height falloff (1/m), z base y, w enable (0 = three's classic fog)
    afFogB: v4(0, 1, 0, 0.6),              // xyz sun direction, w in-scatter strength
    afFogC: v4(4, 1, 0.35, 950),           // x start distance, y max amount, z vertical flattening of the colour lookup, w horizon-melt start (m)
    afSkyZ: v4(0.2, 0.35, 0.7, 1),         // zenith colour
    afSkyH: v4(0.7, 0.75, 0.8, 1),         // horizon haze away from the sun
    afSkyS: v4(0.9, 0.8, 0.6, 2),          // horizon haze toward the sun; w = azimuth sharpness
    afSunC: v4(1, 0.8, 0.5, 1),            // sun glow colour; w = glow strength
    afCity: v4(0, 0, 0, 40),               // night city-light glow in the low haze (rgb), w = glow height (m)
  };
  SK.fog = { density: 0.0003, heightFalloff: 0.019, baseY: 0, start: 95, sunK: 0.38, indoor: 0, horizon: 1000, auto: true };
  SK.fogColor = new THREE.Color(0xbcd3e0);
  SK.version = 0;
  const AF_SKY_GLSL = `
    uniform vec4 afFogA; uniform vec4 afFogB; uniform vec4 afFogC; uniform vec4 afSkyZ; uniform vec4 afSkyH; uniform vec4 afSkyS; uniform vec4 afSunC; uniform vec4 afCity;
    vec3 afHazeBase(vec3 d) {
      vec2 dh = normalize(d.xz + vec2(1e-5, 0.0)); vec2 sh = normalize(afFogB.xz + vec2(1e-5, 0.0));
      float az = clamp(dot(dh, sh) * 0.5 + 0.5, 0.0, 1.0);
      return mix(afSkyH.rgb, afSkyS.rgb, pow(az, max(afSkyS.w, 0.5)));
    }
    vec3 afGlow(vec3 d) {
      float mu = max(dot(d, afFogB.xyz), 0.0);
      return afSunC.rgb * (pow(mu, 5.0) * 0.28 + pow(mu, 40.0) * 0.55 + pow(mu, 400.0) * 1.2) * afSunC.w;
    }
    vec3 afHaze(vec3 d) { return afHazeBase(d) + afGlow(d); }
  `;
  SK.GLSL = AF_SKY_GLSL;
  {
    const C = THREE.ShaderChunk;
    C.fog_pars_vertex = `#ifdef USE_FOG
      varying float vFogDepth; varying vec3 vAfFogOff;
    #endif`;
    C.fog_vertex = `#ifdef USE_FOG
      vFogDepth = - mvPosition.z;
      vAfFogOff = mvPosition.xyz * mat3( viewMatrix );
    #endif`;
    C.fog_pars_fragment = `#ifdef USE_FOG
      uniform vec3 fogColor; varying float vFogDepth; varying vec3 vAfFogOff;
      #ifdef FOG_EXP2
        uniform float fogDensity;
      #else
        uniform float fogNear; uniform float fogFar;
      #endif
      ${AF_SKY_GLSL}
    #endif`;
    C.fog_fragment = `#ifdef USE_FOG
      if ( afFogA.w > 0.5 ) {
        float afD = length( vAfFogOff );
        vec3 afDir = vAfFogOff / max( afD, 1e-3 );
        float afK = afFogA.y;
        float afY0 = max( cameraPosition.y - afFogA.z, -10.0 ), afY1 = max( cameraPosition.y + vAfFogOff.y - afFogA.z, -10.0 );
        float afKdy = afK * ( afY1 - afY0 ), afE0 = exp( - afK * afY0 );
        // mean density along the ray, in a form that cannot overflow however high the camera is
        float afInt = abs( afKdy ) > 1e-4 ? ( afE0 - exp( - afK * afY1 ) ) / afKdy : afE0;
        float afOd = afFogA.x * max( afD - afFogC.x, 0.0 ) * afInt;
        float afF = ( 1.0 - exp( - afOd ) );
        afF = max( afF, smoothstep( afFogC.w, afFogC.w * 1.55, afD ) );
        afF = min( afF, afFogC.y );
        vec3 afC = afHaze( normalize( vec3( afDir.x, afDir.y * afFogC.z, afDir.z ) ) );
        afC += afSunC.rgb * pow( max( dot( afDir, afFogB.xyz ), 0.0 ), 3.0 ) * afFogB.w * 0.35 * afF;
        afC += afCity.rgb * exp( - max( cameraPosition.y + vAfFogOff.y, 0.0 ) / max( afCity.w, 1.0 ) ) * ( 1.0 - 0.8 * smoothstep( 260.0, 700.0, cameraPosition.z + vAfFogOff.z ) );
        gl_FragColor.rgb = mix( gl_FragColor.rgb, afC, afF );
      } else {
        #ifdef FOG_EXP2
          float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
        #else
          float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
        #endif
        gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
      }
    #endif`;
    // share the uniforms with every built-in material and with custom ShaderMaterials that clone UniformsLib.fog
    Object.assign(THREE.UniformsLib.fog, FU);
    for (const k in THREE.ShaderLib) { const u = THREE.ShaderLib[k].uniforms; if (u && u.fogColor) Object.assign(u, FU); }
  }
  // CPU mirror of afHaze / the sky gradient (for env, fog colour, particles)
  SK.skyAt = (d, out = new THREE.Color()) => {
    const U = FU; const H = U.afSkyH.value, S = U.afSkyS.value, Z = U.afSkyZ.value, B = U.afFogB.value, G = U.afSunC.value;
    let dx = d.x, dz = d.z; const dl = Math.hypot(dx, dz) || 1; dx /= dl; dz /= dl;
    let sx = B.x, sz = B.z; const sl = Math.hypot(sx, sz) || 1; sx /= sl; sz /= sl;
    const az = Math.pow((dx * sx + dz * sz) * 0.5 + 0.5, Math.max(S.w, 0.5));
    out.setRGB(H.x + (S.x - H.x) * az, H.y + (S.y - H.y) * az, H.z + (S.z - H.z) * az);
    const y = Math.max(0, d.y), w = 1 - Math.exp(-y * 4.2);
    out.r += (Z.x - out.r) * w; out.g += (Z.y - out.g) * w; out.b += (Z.z - out.b) * w;
    const mu = Math.max(0, d.x * B.x + d.y * B.y + d.z * B.z), gl = (Math.pow(mu, 5) * 0.28 + Math.pow(mu, 40) * 0.55) * G.w;
    out.r += G.x * gl; out.g += G.y * gl; out.b += G.z * gl;
    return out;
  };

  // ------------------------------------------------------------ colour ramps (sRGB hex keys -> linear THREE.Color)
  const lin = (hex) => new THREE.Color(hex);   // THREE.Color stores linear (ColorManagement on)
  const ramp = (keys) => keys.map(([s, hex, k]) => ({ s, c: lin(hex), k: k ?? 1 }));
  const sampleRamp = (R, s, out) => {
    if (s <= R[0].s) { out.copy(R[0].c); return R[0].k; }
    for (let i = 1; i < R.length; i++) if (s <= R[i].s) { const a = R[i - 1], b = R[i], t = (s - a.s) / (b.s - a.s); out.copy(a.c).lerp(b.c, t); return lerp(a.k, b.k, t); }
    const L = R[R.length - 1]; out.copy(L.c); return L.k;
  };
  // s = sin(sun elevation)
  const ZEN = ramp([[-0.4, 0x03060f], [-0.18, 0x070c20], [-0.08, 0x151d45], [-0.02, 0x2a3570], [0.04, 0x40609e], [0.14, 0x4f7fc0], [0.35, 0x4a86d2], [0.8, 0x3f7fd0]]);
  const HOR = ramp([[-0.4, 0x0e1530], [-0.18, 0x1c2544], [-0.08, 0x4a3f66], [-0.02, 0x8a6480], [0.03, 0xf0946a], [0.12, 0xf2c498], [0.3, 0xe6e0d0], [0.5, 0xd4e0e6], [0.8, 0xc6dcec]]);
  const GLOW = ramp([[-0.12, 0x3a2a55], [-0.03, 0xd0607a], [0.02, 0xff7a3a], [0.1, 0xffa860], [0.25, 0xffd7a0], [0.6, 0xfff0d8]]);
  const SUNC = ramp([[-0.03, 0xff5a28, 0], [0.02, 0xff7a3c, 0.7], [0.08, 0xff9a52, 1.8], [0.2, 0xffb266, 2.5], [0.4, 0xffc88a, 2.8], [0.55, 0xffe2bc, 2.9], [0.75, 0xffeed8, 2.95]]);
  const HEMI_SKY = ramp([[-0.3, 0x4a60a0, 0.62], [-0.05, 0x6a6a9a, 0.62], [0.05, 0xd8a890, 0.78], [0.2, 0xc8d8f0, 0.92], [0.6, 0xd2e4ff, 0.98]]);
  const HEMI_GND = ramp([[-0.3, 0x1c1a24], [0.0, 0x4a3a34], [0.2, 0x6b5a3e], [0.6, 0x74613f]]);
  const tmpC = new THREE.Color(), tmpC2 = new THREE.Color();
  const GOLD_SUN = lin(0xffb468), GOLD_HOR = lin(0xf0d2a4), GOLD_HEMI = lin(0xf2d8b4);
  // R2 painterly-physical sky ramps (s = sin(sun elevation)); k = azimuth sharpness / glow strength
  const Z2 = ramp([[-0.4, 0x02040c], [-0.2, 0x050a1e], [-0.1, 0x0f1a44], [-0.03, 0x22336e], [0.02, 0x34508f], [0.08, 0x3a64aa], [0.2, 0x3a70c0], [0.45, 0x3572c8], [0.8, 0x2c66c0]]);
  const HA = ramp([[-0.4, 0x0c1428], [-0.2, 0x151e3c], [-0.1, 0x2c2e58], [-0.04, 0x55497a], [0.0, 0x9a7690], [0.04, 0xc8988a], [0.1, 0xe0b890], [0.2, 0xe2c6a2], [0.4, 0xdccbb2], [0.6, 0xc8d2d6], [0.8, 0xb4cae0]]);
  const HS = ramp([[-0.4, 0x0e1630, 1.5], [-0.2, 0x1e2244, 1.5], [-0.1, 0x5a3e66, 1.6], [-0.04, 0xa8586a, 2.0], [0.0, 0xf07a4a, 2.6], [0.04, 0xffa050, 2.8], [0.1, 0xffbe78, 2.6], [0.2, 0xf8d6a8, 2.2], [0.4, 0xeadcc6, 1.8], [0.8, 0xd6e0e6, 1.4]]);
  const GL2 = ramp([[-0.1, 0x401830, 0], [-0.03, 0xc04a30, 0.5], [0.0, 0xff6a28, 1.1], [0.05, 0xff8c3a, 1.25], [0.12, 0xffa850, 1.05], [0.25, 0xffc890, 0.75], [0.5, 0xffe6c8, 0.5], [0.8, 0xfff2e0, 0.4]]);
  const FOGD = [[-0.4, 0.00038], [-0.1, 0.00038], [0.0, 0.00045], [0.08, 0.00039], [0.2, 0.0003], [0.5, 0.00024], [0.8, 0.00023]];   // a touch more distance haze so far LOD melts into the air
  const sampleNum = (R, s) => { if (s <= R[0][0]) return R[0][1]; for (let i = 1; i < R.length; i++) if (s <= R[i][0]) { const a = R[i - 1], b = R[i]; return lerp(a[1], b[1], (s - a[0]) / (b[0] - a[0])); } return R[R.length - 1][1]; };
  const setV = (u, c, w) => { const v = u.value; v.x = c.r; v.y = c.g; v.z = c.b; if (w !== undefined) v.w = w; };

  // ------------------------------------------------------------ sun path
  // sunrise 6:00, sunset 18:30; sun rises in the east-south-east, culminates in the south (+z) at 12:15 at ~44°,
  // sets west-south-west. At night the directional light follows the moon (roughly opposite the sun, high in the south).
  const MAX_EL = 44 * Math.PI / 180, RISE = 6.0, SET = 18.75;
  const sunVec = new V3(), moonVec = new V3();
  A.sunVec = sunVec; A.moonVec = moonVec;
  A.sunAt = (h, out = new V3()) => {
    h = ((h % 24) + 24) % 24;
    let el, az;
    if (h >= RISE && h <= SET) { const p = (h - RISE) / (SET - RISE); el = Math.sin(Math.PI * p) * MAX_EL; az = Math.PI * p; }
    else { const hh = h < RISE ? h + 24 : h; const p = (hh - SET) / (24 + RISE - SET); el = -Math.sin(Math.PI * p) * MAX_EL * 1.1; az = Math.PI + Math.PI * p; }
    // az 0 = east (+x), pi/2 = south (+z), pi = west (-x); bias toward the south
    let hx = Math.cos(az), hz = Math.sin(az) * 0.8 + 0.42;
    const hl = Math.hypot(hx, hz) || 1; hx /= hl; hz /= hl;
    const ce = Math.cos(el);
    return out.set(hx * ce, Math.sin(el), hz * ce).normalize();
  };
  A.lightK = { sun: 1, moon: 0 };
  AF.timeTick = (dt) => {
    const PC = A.pace;
    if (PC.on && !T.paused && dt > 0) {
      if (PC.set !== null && Math.abs(T.speed - PC.set) > 1e-9) PC.on = false;   // the user picked a speed
      else { PC.t += dt; const sp = PC.t < 70 ? 1 / 200 : PC.t < 100 ? lerp(1 / 200, 1 / 300, (PC.t - 70) / 30) : 1 / 300; T.speed = sp; PC.set = sp; }
    }
    if (!T.paused) { T.hours = (T.hours + dt * T.speed) % 24; if (T.hours < 0) T.hours += 24; }
    A.sunAt(T.hours, sunVec);
    // moon: opposite side of the sky, kept high enough to light the town
    moonVec.set(-sunVec.x * 0.6 - 0.15, Math.max(0.42, -sunVec.y + 0.25), -sunVec.z * 0.5 + 0.55).normalize();
    const s = sunVec.y;
    A.sunY = s;
    A.lightK.sun = smooth(-0.025, 0.06, s);
    A.lightK.moon = smooth(-0.04, -0.16, s);
    if (s > -0.035) T.sunDir.copy(sunVec); else T.sunDir.copy(moonVec);
    if (T.sunDir.y < 0.06) { T.sunDir.y = 0.06; T.sunDir.normalize(); }   // keep shadows from stretching to infinity
    T.night = smooth(0.16, -0.08, s);
    T.day = 1 - T.night;
    A.cityLights = Math.max(T.night, smooth(0.215, 0.1, s) * 0.45);
    { // fraction of fake-room windows lit (needs the engine's uLitFrac; see notes/atmos.md REQUESTS)
      const h = T.hours;
      A.litFrac = h >= 12 ? (h < 22.5 ? lerp(0.15, 0.62, smooth(17.8, 19.5, h)) : lerp(0.62, 0.3, smooth(22.5, 24.5, h)))
                          : (h < 5 ? lerp(0.3, 0.15, smooth(0, 3, h)) : lerp(0.15, 0.4, smooth(5.2, 6.5, h)) * (1 - smooth(7.5, 9, h)) + 0.15 * smooth(7.5, 9, h));
    }
    { // neon (colours made with mode:'neon') flickers ON cell by cell at dusk (17.85 -> 18.3, inside minute one) and off at 2 am
      const h = T.hours; A.neon = h >= 12 ? smooth(17.85, 18.3, h) : 1 - smooth(2.0, 2.4, h);
    }
    if (AF.mat && AF.mat.uniforms) { const U = AF.mat.uniforms; U.uNight.value = A.cityLights; if (U.uLitFrac) U.uLitFrac.value = A.litFrac; if (U.uNeon) U.uNeon.value = A.neon; }
  };
  A.applyTime = () => { AF.timeTick(0); A.updateLighting(0, true); };

  // ------------------------------------------------------------ shared sky uniforms
  const SU = A.skyU = {
    uZen: { value: new THREE.Color() }, uHor: { value: new THREE.Color() }, uGnd: { value: new THREE.Color() }, uGlow: { value: new THREE.Color() },
    uSunDir: { value: new V3(0, 1, 0) }, uMoonDir: { value: new V3(0, 1, 0) }, uSunCol: { value: new THREE.Color() },
    uSunK: { value: 1 }, uMoonK: { value: 0 }, uNight: { value: 0 }, uT: { value: 0 }, uSunset: { value: 0 },
    uCloudK: { value: 1 }, uStars: { value: 1 },
  };

  // ------------------------------------------------------------ lighting driver
  A.indoor = 0; A.indoorTarget = 0;
  const INDOOR_AMB = lin(0xffd6a6), INDOOR_HEMI = lin(0xffe8c8), INDOOR_GND = lin(0x9a7a5a), NIGHT_AMB = lin(0x7088c0);
  A.updateLighting = (dt, snap) => {
    const s = sunVec.y, n = T.night;
    // sky colours
    sampleRamp(ZEN, s, SU.uZen.value); sampleRamp(HOR, s, SU.uHor.value); sampleRamp(GLOW, s, SU.uGlow.value);
    SU.uGnd.value.copy(SU.uHor.value).multiplyScalar(0.55).lerp(tmpC.setRGB(0.02, 0.018, 0.016), 0.35);
    SU.uSunDir.value.copy(sunVec); SU.uMoonDir.value.copy(moonVec);
    SU.uSunK.value = smooth(-0.06, 0.02, s); SU.uMoonK.value = smooth(-0.02, -0.14, s); SU.uNight.value = smooth(-0.02, -0.2, s);
    SU.uSunset.value = Math.max(0, 1 - Math.abs(s - 0.02) / 0.2);
    // sun / moon light
    const sun = AF.sun, hemi = AF.hemi, amb = AF.amb;
    const sunI = sampleRamp(SUNC, s, tmpC);
    // golden afternoons: from ~13:30 the light warms toward honey gold until the sunset ramp takes over
    const pm = smooth(13.0, 17.0, T.hours) * (1 - smooth(18.3, 19.2, T.hours)) * smooth(0.04, 0.22, s);
    A.pm = pm;
    if (pm > 0) { tmpC.lerp(GOLD_SUN, 0.5 * pm); SU.uHor.value.lerp(GOLD_HOR, 0.4 * pm); }
    SU.uSunCol.value.copy(tmpC);
    const ind = A.indoor;
    if (sun) {
      if (s > -0.035) { sun.color.copy(tmpC); sun.intensity = sunI * A.lightK.sun; }
      else { sun.color.setHex(0x9db4ea); sun.intensity = 0.75 * A.lightK.moon; }
    }
    if (hemi) {
      const hk = sampleRamp(HEMI_SKY, s, hemi.color); sampleRamp(HEMI_GND, s, hemi.groundColor);
      hemi.intensity = lerp(hk, hk * lerp(0.5, 0.32, n), ind);
      if (pm > 0) hemi.color.lerp(GOLD_HEMI, 0.35 * pm);
      if (ind > 0) { hemi.color.lerp(INDOOR_HEMI, ind * 0.6); hemi.groundColor.lerp(INDOOR_GND, ind * 0.7); }
    }
    if (amb) {
      amb.color.setHex(0xfff4e6).lerp(NIGHT_AMB, n);
      const ak = lerp(0.3, 0.32, n);
      amb.intensity = lerp(ak, ak * lerp(0.62, 0.38, n) + 0.03, ind);
      if (ind > 0) amb.color.lerp(INDOOR_AMB, ind);
    }
    // ---- R2 sky + atmospheric fog uniforms
    {
      const pmk = pm;
      sampleRamp(Z2, s, tmpC2); setV(FU.afSkyZ, tmpC2); SU.uZen.value.copy(tmpC2);
      sampleRamp(HA, s, tmpC2); if (pmk > 0) tmpC2.lerp(GOLD_HOR, 0.18 * pmk); setV(FU.afSkyH, tmpC2);
      const azk = sampleRamp(HS, s, tmpC2); if (pmk > 0) tmpC2.lerp(GOLD_HOR, 0.3 * pmk); setV(FU.afSkyS, tmpC2, azk);
      const glk = sampleRamp(GL2, s, tmpC2); setV(FU.afSunC, tmpC2, glk * (1 - 0.85 * A.indoor));
      const B = FU.afFogB.value; B.x = sunVec.x; B.y = sunVec.y; B.z = sunVec.z; B.w = SK.fog.sunK * smooth(-0.08, 0.05, s);
      const F = SK.fog;
      if (F.auto) { F.density = sampleNum(FOGD, s); }
      const ind = A.indoor;
      const Fa = FU.afFogA.value; Fa.x = F.density * (1 - 0.92 * ind); Fa.y = F.heightFalloff; Fa.z = F.baseY; Fa.w = AF.Q.has('classicfog') ? 0 : 1;
      const Fc = FU.afFogC.value; Fc.x = lerp(F.start ?? 45, 30, ind); Fc.y = lerp(1, 0.15, ind); Fc.w = F.horizon;
      { const cv = FU.afCity.value, ck = smooth(0.1, 0.8, T.night) * (1 - ind); cv.x = 0.12 * ck; cv.y = 0.07 * ck; cv.z = 0.036 * ck; }
      SK.fogColor.setRGB((FU.afSkyH.value.x + FU.afSkyS.value.x) / 2, (FU.afSkyH.value.y + FU.afSkyS.value.y) / 2, (FU.afSkyH.value.z + FU.afSkyS.value.z) / 2);
      const ver = Math.floor(T.hours * 12);
      if (ver !== SK._lastVer) { SK._lastVer = ver; SK.version++; }
    }
    // fog matched to the horizon
    const S = AF.scene;
    if (S && S.fog) {
      S.fog.color.copy(SU.uHor.value).lerp(SU.uZen.value, 0.42);
      { const l = S.fog.color.r * 0.2126 + S.fog.color.g * 0.7152 + S.fog.color.b * 0.0722; S.fog.color.lerp(tmpC2.setRGB(l, l, l), 0.25 * SU.uSunset.value); }
      // altitude pushes the haze back so the establishing aerial reads crisp (ridge, falls, lake); horizon hills still melt away
      let alt = 0;
      { const cp = AF.camera && AF.camera.position; if (cp) { let gy = 0; try { gy = W ? Math.max(0, W.groundY(cp.x, cp.z) || 0) : 0; } catch (e) { gy = 0; } alt = cp.y - gy; } }
      const hi = smooth(25, 120, alt) * (1 - ind);
      S.fog.near = lerp(lerp(220, 160, n), lerp(520, 300, n), hi); S.fog.far = lerp(lerp(1750, 1000, n), lerp(2250, 1500, n), hi);
      // high aerial / flight views: the horizon melt moves out with altitude so the whole island stays in view; the far plane follows it
      const hz = SK.fog.horizon + Math.min(1800, Math.max(0, alt - 80) * 1.2) * (1 - ind);
      FU.afFogC.value.w = hz;
      const cam = AF.camera, cf = Math.max(2500, Math.ceil((hz * 1.55 + 150) / 100) * 100);
      if (cam && cam.far !== cf) { cam.far = cf; cam.updateProjectionMatrix(); }
    }
    if (S && S.background && S.background.isColor) S.background.copy(SU.uHor.value);
    if (AF.mat && AF.mat.uniforms) {
      AF.mat.uniforms.uNight.value = A.cityLights;
      AF.mat.uniforms.uEmitBoost.value = lerp(1.0, 0.85, ind);
    }
    if (AF.renderer) AF.renderer.toneMappingExposure = lerp(lerp(1.0, 1.45, n), 1.0, ind) * AF.brightness;
  };

  // ------------------------------------------------------------ sky dome
  const SKY_VS = `
    varying vec3 vDir;
    void main() {
      vDir = position;
      vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      gl_Position = p;
    }`;
  const SKY_FS = `
    uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uGnd; uniform vec3 uGlow; uniform vec3 uSunDir; uniform vec3 uMoonDir; uniform vec3 uSunCol;
    uniform float uSunK; uniform float uMoonK; uniform float uNight; uniform float uT; uniform float uSunset; uniform float uCloudK; uniform float uStars;
    varying vec3 vDir;
    ${AF_SKY_GLSL}
    float h13(vec3 p) { p = fract(p * vec3(0.1031, 0.1030, 0.0973)); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
    float h12(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
    float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(h12(i), h12(i + vec2(1.0, 0.0)), f.x), mix(h12(i + vec2(0.0, 1.0)), h12(i + vec2(1.0, 1.0)), f.x), f.y); }
    float fbm(vec2 p) { float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += a * vn(p); p = mat2(1.6, 1.2, -1.2, 1.6) * p + 7.3; a *= 0.5; } return s; }
    void main() {
      vec3 d = normalize(vDir);
      float y = d.y;
      vec3 sd = afFogB.xyz;
      float mu = dot(d, sd);
      // gradient: the horizon haze (exactly what the fog uses) rising into the zenith colour
      vec3 base = afHazeBase(d);
      float yp = max(y, 0.0);
      float w = 1.0 - exp(-yp * 4.2);
      vec3 col = mix(base, afSkyZ.rgb, w);
      // Rayleigh-ish: the sky deepens away from the sun, brightens around it
      col *= mix(1.0, 0.86 + 0.14 * (mu * 0.5 + 0.5), w);
      // belt of Venus: a pink band just above the anti-solar horizon at dusk
      float anti = pow(max(-dot(normalize(d.xz + 1e-5), normalize(sd.xz + 1e-5)), 0.0), 1.5);
      float bvy = (yp - 0.07) / 0.07;
      col += vec3(0.42, 0.18, 0.26) * uSunset * anti * exp(-bvy * bvy) * 0.55;
      col += afGlow(d);
      col += afCity.rgb * exp(-yp * 14.0) * 0.8 * mix(1.0, 0.22, smoothstep(0.05, 0.75, d.z));   // the city's lights glowing in the night haze (R2b: not over the open sea to the south)
      float alpha = 0.0;
      // sun disc: big, warm, limb-darkened, HDR so bloom catches it
      float sunR = 0.99965;
      float disc = smoothstep(sunR, sunR + 0.00012, mu);
      float limb = sqrt(clamp((mu - sunR) / (1.0 - sunR), 0.0, 1.0));
      col += uSunCol * disc * (0.55 + 0.45 * limb) * 26.0 * uSunK * smoothstep(-0.02, 0.01, y);
      // cloud deck: painterly altocumulus on a curved plane, lit warm on the sun side, blue-grey beneath
      if (uCloudK > 0.01 && y > 0.0) {
        vec2 cp = d.xz / (y + 0.06) * 1.35 + vec2(uT * 0.004, uT * 0.0015);
        float n = fbm(cp * 1.1);
        float n2 = fbm(cp * 3.7 + 11.0);
        float cov = 0.66;
        float dens = smoothstep(cov, cov + 0.16, n * 0.8 + n2 * 0.28);
        float streak = smoothstep(0.62, 0.85, fbm(vec2(cp.x * 0.35, cp.y * 2.4) + 3.0)) * 0.35;
        dens = max(dens, streak * smoothstep(0.1, 0.4, y));
        dens *= smoothstep(0.012, 0.085, y) * uCloudK;
        float thick = smoothstep(0.0, 1.0, dens);
        float fwd = pow(max(mu, 0.0), 6.0);
        vec3 lit = uSunCol * (0.32 + 0.7 * fwd) * uSunK + afSkyS.rgb * 0.3 + afSkyZ.rgb * 0.15;
        vec3 under = mix(afSkyH.rgb, afSkyZ.rgb, 0.5) * 0.55 + afSkyS.rgb * 0.25 * uSunset;
        float shade = clamp(0.35 + 0.65 * (1.0 - thick) + (n2 - 0.5) * 0.6, 0.0, 1.0);
        vec3 cc = mix(under, lit, shade);
        cc += uSunCol * pow(max(mu, 0.0), 24.0) * (1.0 - thick) * 2.5 * uSunK;   // silver lining near the sun
        cc = mix(cc, vec3(0.05, 0.07, 0.12) + uZen * 0.6, uNight * 0.85);          // night: dark blue-grey
        cc += vec3(0.5, 0.55, 0.7) * pow(max(dot(d, uMoonDir), 0.0), 12.0) * uMoonK * 0.25 * (1.0 - thick);
        col = mix(col, cc, dens * 0.92);
        alpha = dens * 0.9;
      }
      // moon: shaded disc with maria + halo
      float cm = dot(d, uMoonDir);
      float mdisc = smoothstep(0.99905, 0.99925, cm);
      if (mdisc > 0.0) {
        vec3 mx = normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0))); vec3 my = cross(mx, uMoonDir);
        vec2 mq = vec2(dot(d, mx), dot(d, my)) * 400.0;
        float maria = smoothstep(0.35, 0.7, vn(mq * 0.9 + 3.0)) * 0.35 + smoothstep(0.5, 0.8, vn(mq * 2.3)) * 0.15;
        col += vec3(0.95, 0.96, 1.0) * mdisc * uMoonK * 3.4 * (1.0 - maria);
      }
      col += vec3(0.25, 0.32, 0.52) * (pow(max(cm, 0.0), 220.0) * 0.9 + pow(max(cm, 0.0), 18.0) * 0.08) * uMoonK;
      // stars + milky way
      if (uNight > 0.01 && y > 0.0 && uStars > 0.5) {
        float clear = 1.0 - alpha;
        vec3 mwAx = normalize(vec3(0.35, 0.25, 0.9));
        float band = dot(d, mwAx);
        float mw = exp(-band * band * 18.0);
        vec3 e1 = normalize(cross(mwAx, vec3(0.0, 1.0, 0.0))), e2 = cross(mwAx, e1); vec2 mp = vec2(atan(dot(d, e2), dot(d, e1)) * 6.0, band * 10.0);   // R2b: coordinate ALONG the band (azimuth made zenith streaks)
        float dust = smoothstep(0.35, 0.75, vn(mp * 2.2 + 5.0)) * smoothstep(0.02, 0.0, abs(band + 0.03 * sin(mp.x * 0.7)));
        float mwn = (0.55 + 0.45 * vn(mp * 4.0)) * (0.7 + 0.3 * vn(mp * 11.0));
        col += vec3(0.06, 0.068, 0.115) * mw * mwn * (1.0 - dust * 0.8) * uNight * smoothstep(0.0, 0.3, y) * clear;
        for (int L = 0; L < 2; L++) {
          float sc = L == 0 ? 260.0 : 520.0;
          vec3 p = d * sc; vec3 c = floor(p); float h = h13(c + float(L) * 17.0);
          float thr = L == 0 ? 0.975 : 0.955 - mw * 0.05;
          if (h > thr) {
            vec3 j = vec3(h13(c + 1.3), h13(c + 2.7), h13(c + 4.1)) - 0.5;
            vec3 f = fract(p) - 0.5 - j * 0.5;
            float r = length(f);
            float tw = 0.6 + 0.4 * sin(uT * (1.5 + h * 30.0) + h * 400.0);
            float b = (h - thr) / (1.0 - thr);
            vec3 stc = mix(vec3(0.72, 0.84, 1.0), vec3(1.0, 0.88, 0.7), h13(c + 9.0));
            col += stc * smoothstep(0.34, 0.0, r) * uNight * tw * (L == 0 ? (0.6 + 2.6 * b * b) : 0.35) * smoothstep(0.0, 0.2, y) * (1.0 - mdisc) * clear;
          }
        }
      }
      gl_FragColor = vec4(max(col, 0.0), alpha);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`;

  // ------------------------------------------------------------ water shader
  const WATER_VS = `
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
  const WATER_FS = `
    #include <common>
    #include <fog_pars_fragment>
    uniform vec3 uZen; uniform vec3 uHor; uniform vec3 uSunDir; uniform vec3 uSunCol; uniform vec3 uMoonDir;
    uniform float uSunK; uniform float uMoonK; uniform float uNight; uniform float uT;
    uniform vec3 uDeep; uniform vec3 uShallow; uniform vec3 uLight; uniform vec2 uFlow; uniform float uChop; uniform float uAlpha; uniform float uSea; uniform float uCoast;
    varying vec3 vW;
    float wh(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float wn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(wh(i), wh(i + vec2(1.0, 0.0)), f.x), mix(wh(i + vec2(0.0, 1.0)), wh(i + vec2(1.0, 1.0)), f.x), f.y); }
    float hgt(vec2 p) {
      vec2 q = p - uFlow * uT;
      float h = 0.0;
      h += sin(dot(q, vec2(0.62, 0.35)) * 1.9 + uT * 1.3) * 0.5;
      h += sin(dot(q, vec2(-0.41, 0.77)) * 2.7 + uT * 1.7) * 0.32;
      h += sin(dot(q, vec2(0.93, -0.18)) * 4.3 + uT * 2.3) * 0.18;
      h += (wn(q * 1.3 + uT * 0.35) - 0.5) * 1.2 + (wn(q * 3.1 - uT * 0.5) - 0.5) * 0.55;
      return h;
    }
    float swell(vec2 p) {   // open sea: long slow swells + wind chop
      float t = uT;
      return sin(dot(p, vec2(0.10, 0.16)) - t * 0.55) * 1.0 + sin(dot(p, vec2(-0.07, 0.12)) - t * 0.42) * 0.7
        + sin(dot(p, vec2(0.21, 0.05)) - t * 0.9) * 0.35 + hgt(p * 0.45) * 0.55;
    }
    void main() {
      vec2 p = vW.xz;
      float e = 0.12;
      vec3 N;
      if (uSea > 0.5) {
        float e2 = 0.35; float h0 = swell(p), hx = swell(p + vec2(e2, 0.0)), hz = swell(p + vec2(0.0, e2));
        N = normalize(vec3(-(hx - h0) / e2 * 0.16, 1.0, -(hz - h0) / e2 * 0.16));
      } else {
        float h0 = hgt(p), hx = hgt(p + vec2(e, 0.0)), hz = hgt(p + vec2(0.0, e));
        N = normalize(vec3(-(hx - h0) / e * 0.09 * uChop, 1.0, -(hz - h0) / e * 0.09 * uChop));
      }
      vec3 V = normalize(cameraPosition - vW);
      float ndv = max(dot(N, V), 0.0);
      float fres = 0.03 + 0.97 * pow(clamp(1.0 - ndv, 0.0, 1.0), 5.0);
      vec3 R = reflect(-V, N); R.y = abs(R.y);
      vec3 sky = mix(uHor, uZen, pow(clamp(R.y, 0.0, 1.0), 0.55));
      float sd = max(dot(R, uSunDir), 0.0);
      vec3 spec = uSunCol * (pow(sd, 900.0) * 60.0 + pow(sd, 90.0) * 1.2) * uSunK;
      float md = max(dot(R, uMoonDir), 0.0);
      spec += vec3(0.7, 0.8, 1.0) * (pow(md, 700.0) * 8.0 + pow(md, 60.0) * 0.25) * uMoonK;
      // body colour: deep tint lit by the ambient/sun level, lighter where you look straight down
      vec3 body = mix(uDeep, uShallow, ndv * 0.6 + (wn(p * 0.08) - 0.5) * 0.3) * uLight;
      if (uSea > 0.5) {
        // golden glitter path: broad sun lobe broken into sparkles by fine noise
        float gl = pow(sd, 18.0) * uSunK;
        float sp = step(0.82, wn(p * 2.2 + vec2(uT * 1.7, -uT * 1.1))) * step(0.5, wn(p * 0.7 - uT * 0.3));
        spec += uSunCol * gl * (0.35 + sp * 5.0);
        // moonlit sheen
        spec += vec3(0.55, 0.65, 0.9) * pow(md, 14.0) * 0.4 * uMoonK * (0.5 + sp * 1.2);
        // harbour lights: warm broken streaks near the quay at night
        float nearQ = 1.0 - smoothstep(0.0, 70.0, vW.z - uCoast);
        float lane = step(0.86, wn(vec2(p.x * 1.1, 3.0)));                       // a few narrow columns under quay lamps
        float brk = step(0.62, wn(vec2(p.x * 2.0, p.y * 0.9 - uT * 0.8))) * wn(p * 3.0 + uT * 1.5);   // broken by the chop
        spec += vec3(1.0, 0.68, 0.32) * lane * brk * nearQ * uNight * 0.22;
      }
      vec3 col = mix(body, sky, clamp(fres * 0.9, 0.0, 1.0)) + spec;
      float a = clamp(mix(uAlpha, 0.97, fres) + length(spec) * 0.2, 0.0, 1.0);
      gl_FragColor = vec4(col, a);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      #include <fog_fragment>
    }`;
  A.waterMats = [];
  const WLIGHT = new THREE.Color();

  // ------------------------------------------------------------ voxel clouds
  function makeCloudModel(seed) {
    const r = AF.rng(seed * 131 + 7);
    const w = 40, h = 11, d = 26;
    const m = new AF.Model(w, h, d);
    const top = AF.col(0xfdfcf8, { jitter: 0.12, edge: 0.3 }), mid = AF.col(0xeef0f3, { jitter: 0.15, edge: 0.3 });
    const low = AF.col(0xcfd5de, { jitter: 0.2, edge: 0.3 }), base = AF.col(0xb4bcc8, { jitter: 0.2, edge: 0.3 });
    const blobs = [];
    const nb = 7 + Math.floor(r() * 6);
    for (let i = 0; i < nb; i++) {
      const cx = 8 + r() * (w - 16), cz = 7 + r() * (d - 14);
      const dc = 1 - Math.min(1, Math.hypot((cx - w / 2) / (w / 2), (cz - d / 2) / (d / 2)));
      blobs.push({ cx, cz, cy: 0.5 + r() * 1.5 + dc * 2.0, rad: 3.8 + r() * 3 + dc * 4 });
    }
    for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) {
      let inside = false;
      for (const b of blobs) { const dx = x + 0.5 - b.cx, dy = (y + 0.5 - b.cy) * 1.7, dz = z + 0.5 - b.cz; if (dx * dx + dy * dy + dz * dz < b.rad * b.rad) { inside = true; break; } }
      if (!inside) continue;
      m.set(x, y, z, y === 0 ? base : y === 1 ? low : y < 4 ? mid : top);
    }
    return m;
  }

  // ------------------------------------------------------------ soft sprite texture (mist / smoke / fireflies / dust)
  function softTex() {
    const c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.65)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }

  function puffTex() {
    const c = document.createElement('canvas'); c.width = c.height = 96;
    const g = c.getContext('2d'); const r = AF.rng(77);
    for (let i = 0; i < 9; i++) {
      const x = 48 + (r() - 0.5) * 36, y = 48 + (r() - 0.5) * 30, rad = 16 + r() * 18;
      const gr = g.createRadialGradient(x, y, 0, x, y, rad);
      const v = 200 + Math.floor(r() * 55);
      gr.addColorStop(0, `rgba(${v},${v},${v},0.55)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 96, 96);
    }
    const t = new THREE.CanvasTexture(c); return t;
  }

  // ------------------------------------------------------------ R2 cloud shading
  const CLOUDU = { uCSun: { value: new THREE.Color(1, 0.9, 0.8) }, uCTop: { value: new THREE.Color(0.6, 0.7, 0.9) }, uCBot: { value: new THREE.Color(0.4, 0.45, 0.55) }, uCSunDir: { value: new V3(0, 1, 0) } };
  A.cloudU = CLOUDU;
  const CLOUD_CODE = `
    {
      vec3 cwn = normalize(normal * mat3(viewMatrix));
      vec3 cwv = normalize(vViewPosition * mat3(viewMatrix));
      float ctone = clamp(dot(diffuseColor.rgb, vec3(0.3333)), 0.0, 1.0);
      float cndl = dot(cwn, uCSunDir);
      float cwrap = clamp(cndl * 0.55 + 0.45, 0.0, 1.0);
      vec3 camb = mix(uCBot, uCTop, cwn.y * 0.5 + 0.5);
      float crim = pow(1.0 - clamp(dot(cwn, cwv), 0.0, 1.0), 2.0) * pow(max(dot(-cwv, uCSunDir), 0.0), 4.0);
      outgoingLight = camb * (0.6 + 0.4 * ctone) + uCSun * cwrap * (0.55 + 0.45 * ctone) + uCSun * crim * 1.4;
    }`;

  // ============================================================ BUILD (700)
  AF.onBuild('atmos', 700, () => {
    const t0 = performance.now();
    const S = AF.scene;
    AF.timeTick(0);

    // ---- sky dome
    {
      const geo = new THREE.SphereGeometry(1800, 48, 24);
      const mat = new THREE.ShaderMaterial({ uniforms: Object.assign({}, SU, FU), vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false });
      const sky = A.sky = new THREE.Mesh(geo, mat);
      sky.name = 'sky'; sky.frustumCulled = false; sky.renderOrder = -1000; sky.castShadow = false; sky.receiveShadow = false;
      S.add(sky);
      if (S.background && S.background.isColor) S.background = null;
      // env scene for R1's PMREM: the same sky (no stars) on a small sphere
      const envU = Object.assign({}, SU, FU, { uStars: { value: 0 } });
      const envSky = new THREE.Mesh(new THREE.SphereGeometry(100, 32, 16), new THREE.ShaderMaterial({ uniforms: envU, vertexShader: SKY_VS, fragmentShader: SKY_FS, side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false }));
      envSky.frustumCulled = false;
      SK.envScene = new THREE.Scene(); SK.envScene.add(envSky); SK.envMesh = envSky;
      SK.version++;
    }

    // ---- clouds
    {
      const geos = [];
      for (let i = 0; i < 6; i++) geos.push(AF.meshModel(makeCloudModel(i + 1), { vs: 2.1, anchor: [0.5, 0, 0.5] }));
      A.cloudMat = AF.mat.patchVoxel ? AF.mat.patchVoxel(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1, metalness: 0 }), 'cloud') : AF.mat.voxel;
      // R2: painterly cloud lighting — warm sunlit tops/rims, blue-grey undersides, pink at sunset, moonlit at night
      if (A.cloudMat !== AF.mat.voxel) {
        const ob = A.cloudMat.onBeforeCompile;
        A.cloudMat.onBeforeCompile = (sh, r) => {
          if (ob) ob(sh, r);
          Object.assign(sh.uniforms, CLOUDU);
          sh.fragmentShader = 'uniform vec3 uCSun; uniform vec3 uCTop; uniform vec3 uCBot; uniform vec3 uCSunDir;\n' + sh.fragmentShader.replace('#include <opaque_fragment>', CLOUD_CODE + '\n#include <opaque_fragment>');
        };
        const ok = A.cloudMat.customProgramCacheKey;
        A.cloudMat.customProgramCacheKey = () => (ok ? ok() : 'afvox-cloud') + '-r2';
      }
      const r = AF.rng(4242);
      A.clouds = [];
      const g = A.cloudGroup = new THREE.Group(); g.name = 'clouds'; S.add(g);
      for (let i = 0; i < 28; i++) {
        const mesh = new THREE.Mesh(geos[i % geos.length], A.cloudMat);
        mesh.castShadow = false; mesh.receiveShadow = false;
        const ang = r() * Math.PI * 2, rad = 60 + Math.sqrt(r()) * 900;
        mesh.position.set(Math.cos(ang) * rad, 185 + r() * 80, Math.sin(ang) * rad);
        const sc = 0.75 + r() * 0.7; mesh.scale.set(sc * (0.9 + r() * 0.3), sc * (0.8 + r() * 0.35), sc * (0.9 + r() * 0.3));
        mesh.rotation.y = Math.floor(r() * 4) * Math.PI / 2;
        mesh.userData.v = 1.2 + r() * 1.4;
        g.add(mesh); A.clouds.push(mesh);
      }
    }

    // ---- point-light pool: the count only changes with the graphics tier (Low 4 · Balanced 6 · High 12), so shaders rarely recompile
    {
      A.pool = [];
      A.setLights = (n) => {
        n = Math.max(0, Math.min(12, n | 0));
        while (A.pool.length < n) { const pl = new THREE.PointLight(0xffc67a, 0, 12, 2); pl.castShadow = false; pl.position.set(0, -500, 0); pl.userData.src = null; S.add(pl); A.pool.push(pl); }
        while (A.pool.length > n) { const pl = A.pool.pop(); S.remove(pl); pl.dispose && pl.dispose(); }
      };
      A.setLights(AF.gfx && AF.gfx.tierCfg ? AF.gfx.tierCfg().lights : 12);
      // compile the other light variant (pool shown / hidden) while the loading screen is still up
      AF.on('ready', () => { try { if (!A.pool.length) return; const v = A.pool[0].visible; for (const p of A.pool) p.visible = !v; AF.renderer.compile(S, AF.camera); for (const p of A.pool) p.visible = v; } catch (e) { AF.warnOnce('light variant compile', e); } });
    }

    // ---- water
    {
      for (const w of AF.world.water) {
        if (!w.mesh) continue;
        const kind = (w.geo.userData && w.geo.userData.kind) || 'basin', isSea = !!(w.geo.userData && w.geo.userData.sea);
        const flow = (w.geo.userData && w.geo.userData.flow) || (kind === 'creek' ? [0, 0.55] : kind === 'creek-upper' ? [0, 0.9] : kind === 'lake' ? [0.05, 0.03] : [0.02, 0.01]);
        const deep = kind === 'lake' ? 0x173e52 : kind === 'pond' ? 0x2c4a3a : kind === 'basin' ? 0x2d6a7a : 0x24505a;
        const shallow = kind === 'lake' ? 0x3f7f8c : kind === 'pond' ? 0x5a7a52 : kind === 'basin' ? 0x6ab0b8 : 0x4a8a88;
        const U = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), {
          uZen: SU.uZen, uHor: SU.uHor, uSunDir: SU.uSunDir, uSunCol: SU.uSunCol, uMoonDir: SU.uMoonDir,
          uSunK: SU.uSunK, uMoonK: SU.uMoonK, uNight: SU.uNight, uT: SU.uT,
          uDeep: { value: lin(deep) }, uShallow: { value: lin(shallow) }, uLight: { value: WLIGHT },
          uFlow: { value: new THREE.Vector2(flow[0], flow[1]) }, uChop: { value: kind === 'lake' ? 1.0 : kind === 'basin' ? 0.6 : 1.25 },
          uAlpha: { value: isSea ? 0.9 : kind === 'basin' ? 0.62 : kind === 'pond' ? 0.8 : 0.72 },
          uSea: { value: isSea ? 1 : 0 }, uCoast: { value: (AF.PLAN.harbour && AF.PLAN.harbour.coastZ) || 210 },
        });
        if (isSea) { U.uDeep.value = lin(0x0e3346); U.uShallow.value = lin(0x1f5f6a); U.uFlow.value.set(0.08, 0.05); }
        const mat = new THREE.ShaderMaterial({ uniforms: U, vertexShader: WATER_VS, fragmentShader: WATER_FS, transparent: true, depthWrite: false, fog: true });
        mat.userData.kind = kind;
        w.mesh.material = mat; w.mesh.renderOrder = 1;
        A.waterMats.push(mat);
      }
      AF.mat.waterAnimated = A.waterMats;
    }

    // ---- particles
    const tex = A.softTex = softTex();
    // leaves: tiny voxel leaves (instanced boxes)
    {
      const N = 140;
      const geo = new THREE.BoxGeometry(0.15, 0.022, 0.11);
      const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const im = A.leaves = new THREE.InstancedMesh(geo, mat, N);
      im.frustumCulled = false; im.castShadow = false; im.receiveShadow = false; im.name = 'leaves';
      const pal = [0xb8322a, 0xcf4a2c, 0xd66a28, 0xe4882e, 0xdca22c, 0xe9b93c, 0x8e2a24, 0xa8843a, 0xf0b82e, 0x9a5a2a];
      const c = new THREE.Color();
      A.leafData = [];
      for (let i = 0; i < N; i++) {
        c.setHex(pal[i % pal.length]); im.setColorAt(i, c);
        A.leafData.push({ x: 0, y: -999, z: 0, vy: 0, ph: Math.random() * 6.28, rs: 0.5 + Math.random() * 2, land: 0, rest: 0, ax: Math.random() * 6.28, az: Math.random() * 6.28 });
      }
      im.instanceColor.needsUpdate = true;
      S.add(im);
    }
    // chimney smoke: soft sprite puffs (per-puff size + alpha), lit by the sky level
    {
      const N = 456;
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('aSize', new THREE.BufferAttribute(new Float32Array(N), 1).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(N), 1).setUsage(THREE.DynamicDrawUsage));
      geo.setDrawRange(0, 0);
      const U = Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog), { uTex: { value: puffTex() }, uCol: { value: new THREE.Color(0xd8d4ce) }, uScale: { value: 700 } });
      const mat = new THREE.ShaderMaterial({
        uniforms: U, fog: true, transparent: true, depthWrite: false,
        vertexShader: `
          #include <common>
          #include <fog_pars_vertex>
          attribute float aSize; attribute float aAlpha; uniform float uScale; varying float vA; varying float vR;
          void main() {
            vA = aAlpha; vR = fract(position.x * 7.13 + position.z * 3.7);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = clamp(aSize * uScale / max(0.1, -mvPosition.z), 0.0, 512.0);
            gl_Position = projectionMatrix * mvPosition;
            #include <fog_vertex>
          }`,
        fragmentShader: `
          #include <common>
          #include <fog_pars_fragment>
          uniform sampler2D uTex; uniform vec3 uCol; varying float vA; varying float vR;
          void main() {
            vec2 uv = gl_PointCoord - 0.5; float c = cos(vR * 6.28), s = sin(vR * 6.28); uv = mat2(c, -s, s, c) * uv + 0.5;
            vec4 t = texture2D(uTex, uv);
            float a = t.a * vA;
            if (a < 0.003) discard;
            gl_FragColor = vec4(uCol * (0.82 + 0.18 * t.r), a);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
            #include <fog_fragment>
          }`,
      });
      const pts = A.smoke = new THREE.Points(geo, mat);
      pts.frustumCulled = false; pts.renderOrder = 3; pts.name = 'smoke';
      S.add(pts);
    }
    // mist at the falls
    {
      const F = AF.PLAN.falls, N = 160;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
      const mat = new THREE.PointsMaterial({ color: 0xf2f6f8, size: 6, map: tex, transparent: true, depthWrite: false, opacity: 0.3, sizeAttenuation: true, fog: true });
      const pts = A.mist = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 4; pts.name = 'mist';
      A.mistData = [];
      const lowY = (AF.land && AF.land.WATER_LOW) ?? AF.PLAN.river.waterY;
      for (let i = 0; i < N; i++) A.mistData.push({ age: Math.random(), life: 3 + Math.random() * 4, x: 0, y: 0, z: 0, vx: 0, vy: 0, vz: 0, seeded: false });
      A.mistBase = { x: F.x, y: lowY, z: F.z + 3 };
      S.add(pts);
    }
    // fireflies in the park (night)
    {
      const N = 150, Pk = AF.PLAN.park;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
      const mat = new THREE.PointsMaterial({ size: 0.55, map: tex, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: true });
      const pts = A.fireflies = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.visible = false; pts.renderOrder = 5; pts.name = 'fireflies';
      A.ffData = [];
      const r = AF.rng(99);
      // gather a few extra meadow spots: the park, the pond green, the lake shore
      const zones = [[Pk.x0 + 2, Pk.z0 + 2, Pk.x1 - 2, Pk.z1 - 2, 0.6], [AF.PLAN.pond.cx - 14, AF.PLAN.pond.cz - 14, AF.PLAN.pond.cx + 14, AF.PLAN.pond.cz + 14, 0.2], [185, 200, 215, 215, 0.2]];
      for (let i = 0; i < N; i++) {
        const u = r(); const zn = u < 0.6 ? zones[0] : u < 0.8 ? zones[1] : zones[2];
        const x = lerp(zn[0], zn[2], r()), z = lerp(zn[1], zn[3], r());
        A.ffData.push({ hx: x, hz: z, hy: 0.6 + r() * 2.2, ph: r() * 100, sp: 0.3 + r() * 0.6, bl: 0.4 + r() * 0.9, gy: W.groundY(x, z) });
      }
      S.add(pts);
    }
    // dust motes indoors
    {
      const N = 180;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(N * 3).fill(0.3), 3).setUsage(THREE.DynamicDrawUsage));
      const mat = new THREE.PointsMaterial({ color: 0xffe8c0, size: 0.05, map: tex, vertexColors: true, transparent: true, depthWrite: false, opacity: 0, blending: THREE.AdditiveBlending, sizeAttenuation: true });
      const pts = A.dust = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.visible = false; pts.name = 'dust';
      A.dustData = [];
      for (let i = 0; i < N; i++) A.dustData.push({ ox: (Math.random() - 0.5) * 10, oy: (Math.random() - 0.5) * 5, oz: (Math.random() - 0.5) * 10, ph: Math.random() * 100, sp: 0.05 + Math.random() * 0.12, lit: 0.2, tl: 0.2 });
      S.add(pts);
    }

    A.updateLighting(0, true);
    A.buildMs = Math.round(performance.now() - t0);
  });

  // ============================================================ TICK (700)
  const camP = new V3();
  let frameN = 0;
  // interior detection: inside a registered building box with a roof overhead, or boxed in by solid voxels
  const solidVox = (x, y, z) => { const c = W.getM(x, y, z); return c && AF.PAL.solid[c] && AF.PAL.opaque[c]; };
  A.probeIndoor = (x, y, z) => {
    let roof = false;
    for (let yy = y + 0.6; yy < y + 14; yy += 0.5) if (solidVox(x, yy, z)) { roof = true; break; }
    if (!roof) return 0;
    const b = AF.buildingAt && AF.buildingAt(x, y, z);
    let walls = 0;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      for (let d = 0.5; d < 18; d += 0.5) if (solidVox(x + dx * d, y, z + dz * d) || solidVox(x + dx * d, y + 1.2, z + dz * d)) { walls++; break; }
    }
    return (b && walls >= 2) || walls >= 3 ? 1 : 0;
  };

  // nearest-K selection without allocation: keep the best (K+1) in small sorted arrays
  const KP = 13, selL = new Array(KP).fill(null), selD = new Float64Array(KP), selK = new Float32Array(KP);
  // lights whose reach can't touch the view frustum light nothing you can see: skip them so the pool goes to lights on screen
  const lFr = new THREE.Frustum(), lPM = new THREE.Matrix4(), lSph = new THREE.Sphere();
  function updatePool() {
    const n = T.night, ind = A.indoor;
    const nightK = smooth(0.25, 0.75, n);
    let cnt = 0;
    const L = AF.lights;
    const cx = camP.x, cy = camP.y, cz = camP.z, cam = AF.camera;
    lPM.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse); lFr.setFromProjectionMatrix(lPM);
    for (let i = 0; i < L.length; i++) {
      const l = L[i];
      const interior = l.kind === 'interior';
      let k = interior ? Math.max(nightK, ind) : nightK;
      if (l.night === false && !interior) k = 1;
      if (k <= 0.01) continue;
      const dx = l.x - cx, dy = (l.y - cy) * 1.5, dz = l.z - cz;
      if (dx > 160 || dx < -160 || dz > 160 || dz < -160) continue;
      lSph.center.set(l.x, l.y, l.z); lSph.radius = (l.range ?? 10) * 1.6 + 3;
      if (!AF.SHOT && !lFr.intersectsSphere(lSph)) continue;
      let d2 = dx * dx + dy * dy + dz * dz;
      if (interior && ind > 0.5) d2 *= 0.35;      // prefer interior fixtures while indoors
      if (cnt === KP && d2 >= selD[KP - 1]) continue;
      let j = cnt < KP ? cnt++ : KP - 1;
      while (j > 0 && selD[j - 1] > d2) { selD[j] = selD[j - 1]; selL[j] = selL[j - 1]; selK[j] = selK[j - 1]; j--; }
      selD[j] = d2; selL[j] = l; selK[j] = k;
    }
    const NP = A.pool.length;
    const far = cnt > NP ? Math.sqrt(selD[NP]) : 200;
    // no lit fixture nearby (daylight outdoors): hide the whole pool so the world shader skips every point light. All-or-nothing
    // keeps it to two shader variants (both compiled at boot).
    const anyOn = cnt > 0;
    for (let i = 0; i < NP; i++) if (A.pool[i].visible !== anyOn) A.pool[i].visible = anyOn;
    for (let i = 0; i < NP; i++) {
      const pl = A.pool[i];
      if (i >= cnt) { pl.intensity = 0; pl.userData.src = null; continue; }
      const l = selL[i], d = Math.sqrt(selD[i]);
      if (pl.userData.src !== l) { pl.position.set(l.x, l.y, l.z); pl.color.set(l.color); pl.distance = (l.range ?? 10) * 1.6; pl.decay = 1.7; pl.userData.src = l; }
      const boost = l.kind === 'interior' ? lerp(0.6, 0.62 + 0.18 * n, ind) : 1;   // indoor fill is cut, so fixtures carry the room
      // fade lights near the edge of the pool so re-assignment never pops
      const edge = clamp((far - d) / 6, 0, 1);
      pl.intensity = (l.intensity ?? 1) * 17 * selK[i] * boost * (0.35 + 0.65 * edge);
    }
    for (let i = 0; i < KP; i++) selL[i] = null;
  }

  const dummy = new THREE.Object3D();
  function updateLeaves(dt, t) {
    const im = A.leaves; if (!im) return;
    const gy = W.groundY(camP.x, camP.z);
    const active = camP.y - gy < 70 && A.indoor < 0.5;
    im.visible = active;
    if (!active) return;
    // nearby trees (refresh every ~30 frames)
    if (frameN % 30 === 0 || !A.nearTrees) {
      const tr = ((AF.land && AF.land.trees) || []).concat(Array.isArray(AF.streetTrees) ? AF.streetTrees : [], (AF.park && Array.isArray(AF.park.trees)) ? AF.park.trees : [], (AF.streets && Array.isArray(AF.streets.trees)) ? AF.streets.trees : []).filter((q) => q && Number.isFinite(q.x) && Number.isFinite(q.z));
      A.nearTrees = tr.filter((q) => Math.abs(q.x - camP.x) < 45 && Math.abs(q.z - camP.z) < 45);
    }
    const NT = A.nearTrees;
    const Wd = AF.wind, wind = Wd ? 0.35 + 0.75 * Math.min(1.6, Wd.strength) : 0.6 + 0.4 * Math.sin(t * 0.13), wx = Wd ? Wd.x : 0.94, wz = Wd ? Wd.z : 0.34, gust = Wd ? Wd.gust || 0 : 0;
    for (let i = 0; i < A.leafData.length; i++) {
      const p = A.leafData[i];
      const far = Math.abs(p.x - camP.x) > 45 || Math.abs(p.z - camP.z) > 45;
      if (p.y < -900 || far || (p.rest > 0 && (p.rest -= dt) <= 0)) {
        // respawn
        if (NT.length && Math.random() < 0.75) {
          const tq = NT[(Math.random() * NT.length) | 0], a = Math.random() * 6.28, rr = Math.random() * (tq.r || 4);
          p.x = tq.x + Math.cos(a) * rr; p.z = tq.z + Math.sin(a) * rr; p.y = W.groundY(p.x, p.z) + 3 + Math.random() * 6;
        } else {
          p.x = camP.x + (Math.random() - 0.5) * 50; p.z = camP.z + (Math.random() - 0.5) * 50; p.y = W.groundY(p.x, p.z) + 3 + Math.random() * 6;
        }
        p.land = AF.surfaceBelow ? AF.surfaceBelow(p.x, p.z, p.y, 30) : W.groundY(p.x, p.z);
        p.vy = 0.55 + Math.random() * 0.6; p.rest = 0; p.lifeGrace = 0;
        if (Math.random() < 0.3) p.y = p.land + 0.5 + Math.random() * (p.y - p.land);   // stagger so the air is never empty
      }
      if (p.rest <= 0) {
        p.y -= p.vy * dt;
        p.x += (Math.sin(t * p.rs + p.ph) * 0.9 + wind * wx * 1.1) * dt;
        p.z += (Math.cos(t * p.rs * 0.8 + p.ph) * 0.6 + wind * wz * 1.1) * dt;
        if (gust > 0.25) p.y += gust * 0.9 * dt * (0.5 + 0.5 * Math.sin(t * 3 + p.ph));   // a gust lifts them again
        p.ax += dt * p.rs * 2.2; p.az += dt * p.rs * 1.6;
        if (p.y <= p.land + 0.03) { p.y = p.land + 0.03; p.rest = 2 + Math.random() * 4; p.ax = 0; p.az = Math.random() * 0.3; }
      } else if (gust > 0.3) { p.x += wx * gust * 1.8 * dt; p.z += wz * gust * 1.8 * dt; p.ax += dt * 6 * gust; }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(Math.sin(p.ax) * 1.2, p.ph + p.ax * 0.3, Math.cos(p.az) * 1.1);
      dummy.updateMatrix();
      im.setMatrixAt(i, dummy.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  }

  const drawSize = new THREE.Vector2();
  function updateSmoke(dt, t) {
    const pts = A.smoke; if (!pts) return;
    if (frameN % 10 === 1 || !A.smokeSel || AF.SHOT) {
      const ch = AF.chimneys || [];
      A.smokeSel = ch.map((c) => ({ c, d: Math.hypot(c.x - camP.x, c.z - camP.z, (c.y - camP.y) * 0.5) })).filter((o) => o.d < 300).sort((a, b) => a.d - b.d).slice(0, 14).map((o) => o.c);
    }
    const sel = A.smokeSel, PER = 8, LIFE = 9, NMAX = 456;
    const G = pts.geometry, pa = G.attributes.position.array, sa = G.attributes.aSize.array, aa = G.attributes.aAlpha.array;
    let n = 0;
    const Wd = AF.wind, ws = Wd ? 0.45 + 0.55 * Math.min(1.4, Wd.strength) : 0.6, windX = Wd ? Wd.x * ws : 0.5 + 0.25 * Math.sin(t * 0.07), windZ = Wd ? Wd.z * ws : 0.22;   // R2b: smoke leans with AF.wind (gusts flatten it)
    for (let ci = 0; ci < sel.length && n < NMAX; ci++) {
      const c = sel[ci];
      const seed = Math.abs(c.x * 13.1 + c.z * 7.7) % 10;
      for (let k = 0; k < PER && n < NMAX; k++) {
        const age = ((t / LIFE + k / PER + seed) % 1 + 1) % 1;
        const rise = Math.sqrt(age) * 9, drift = age * age * 7;
        pa[n * 3] = c.x + windX * drift + Math.sin(t * 0.6 + k * 1.7 + seed) * 0.35 * age;
        pa[n * 3 + 1] = c.y + 0.2 + rise;
        pa[n * 3 + 2] = c.z + windZ * drift + Math.cos(k * 2.3 + seed) * 0.4 * age;
        sa[n] = 0.7 + age * 3.6;
        aa[n] = smooth(0, 0.06, age) * (1 - smooth(0.35, 1, age)) * 0.62;
        n++;
      }
    }
    G.setDrawRange(0, n);
    G.attributes.position.needsUpdate = true; G.attributes.aSize.needsUpdate = true; G.attributes.aAlpha.needsUpdate = true;
    const U = pts.material.uniforms;
    AF.renderer.getDrawingBufferSize(drawSize);
    U.uScale.value = drawSize.y * 0.5 / Math.tan(AF.camera.fov * Math.PI / 360);
    const lk = 0.1 + 0.85 * smooth(-0.08, 0.35, sunVec.y);
    U.uCol.value.setRGB(0.72, 0.7, 0.67).multiplyScalar(lk).lerp(SU.uGlow.value, 0.25 * SU.uSunset.value * lk);
    if (A.pm > 0 || SU.uSunset.value > 0) U.uCol.value.lerp(tmpC2.copy(SU.uSunCol.value).multiplyScalar(0.8 * lk), 0.3 * Math.max(A.pm || 0, SU.uSunset.value));
    if (A.indoor > 0.5) U.uCol.value.multiplyScalar(0.6);
  }

  function updateMist(dt, t) {
    const pts = A.mist; if (!pts) return;
    const B = A.mistBase;
    const d = Math.hypot(camP.x - B.x, camP.z - B.z);
    pts.visible = d < 320;
    if (!pts.visible) return;
    const arr = pts.geometry.attributes.position.array;
    for (let i = 0; i < A.mistData.length; i++) {
      const p = A.mistData[i];
      p.age += dt / p.life;
      if (!p.seeded || p.age >= 1) {
        if (p.age >= 1) p.age -= 1;
        p.seeded = true;
        const a = Math.random() * Math.PI - Math.PI;   // spray outward (south side of the plunge)
        p.x = B.x + (Math.random() - 0.5) * 9; p.z = B.z + (Math.random() - 0.3) * 4; p.y = B.y + Math.random() * 1.5;
        p.vx = Math.cos(a) * 0.6 * (Math.random() - 0.5); p.vz = 0.6 + Math.random() * 1.4; p.vy = 0.9 + Math.random() * 1.2;
        const tt = p.age * p.life; p.x += p.vx * tt; p.y += p.vy * tt * 0.7; p.z += p.vz * tt;
      }
      p.x += p.vx * dt; p.y += p.vy * dt * (1 - p.age * 0.6); p.z += p.vz * dt;
      arr[i * 3] = p.x; arr[i * 3 + 1] = p.y; arr[i * 3 + 2] = p.z;
    }
    pts.geometry.attributes.position.needsUpdate = true;
    pts.material.opacity = 0.32 * (1 - T.night * 0.6);
  }

  function updateFireflies(dt, t) {
    const pts = A.fireflies; if (!pts) return;
    const k = smooth(0.55, 0.9, T.night);
    pts.visible = k > 0.01 && A.indoor < 0.5;
    if (!pts.visible) return;
    const pa = pts.geometry.attributes.position.array, ca = pts.geometry.attributes.color.array;
    for (let i = 0; i < A.ffData.length; i++) {
      const f = A.ffData[i], tt = t * f.sp + f.ph;
      pa[i * 3] = f.hx + Math.sin(tt * 0.7) * 2.2 + Math.sin(tt * 1.9) * 0.6;
      pa[i * 3 + 1] = f.gy + f.hy + Math.sin(tt * 1.3) * 0.5;
      pa[i * 3 + 2] = f.hz + Math.cos(tt * 0.6) * 2.2 + Math.cos(tt * 2.1) * 0.5;
      const bl = Math.max(0, Math.sin(t * f.bl * 2.0 + f.ph * 3.0));
      const b = (Math.pow(bl, 3) * 4.0 + 0.08) * k;
      ca[i * 3] = 0.85 * b; ca[i * 3 + 1] = 1.0 * b; ca[i * 3 + 2] = 0.3 * b;
    }
    pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true;
  }

  function updateDust(dt, t) {
    const pts = A.dust; if (!pts) return;
    const k = smooth(0.3, 1, A.indoor);
    pts.visible = k > 0.01;
    if (!pts.visible) return;
    const pa = pts.geometry.attributes.position.array, ca = pts.geometry.attributes.color.array;
    const bx = Math.floor(camP.x / 10) * 10, by = Math.floor(camP.y / 5) * 5, bz = Math.floor(camP.z / 10) * 10;
    for (let i = 0; i < A.dustData.length; i++) {
      const d = A.dustData[i], tt = t * d.sp + d.ph;
      // wrap each mote into a 10 m box around the camera
      let x = bx + d.ox + Math.sin(tt) * 0.8, y = by + d.oy + Math.sin(tt * 0.7) * 0.4 + ((t * 0.02 + d.ph) % 1) * 0.3, z = bz + d.oz + Math.cos(tt * 0.9) * 0.8;
      x = camP.x + ((((x - camP.x) + 5) % 10) + 10) % 10 - 5; y = camP.y + ((((y - camP.y) + 2.5) % 5) + 5) % 5 - 2.5; z = camP.z + ((((z - camP.z) + 5) % 10) + 10) % 10 - 5;
      pa[i * 3] = x; pa[i * 3 + 1] = y; pa[i * 3 + 2] = z;
      // R2: motes glow when they float through a sunbeam (unoccluded ray toward the sun through windows/doors)
      if ((i + frameN) % 8 === 0 || AF.SHOT) {
        let lit = 0;
        if (sunVec.y > 0.02) { lit = 1; for (let st = 0.5; st < 26; st += 0.5) { if (solidVox(x + sunVec.x * st, y + sunVec.y * st, z + sunVec.z * st)) { lit = 0; break; } } }
        d.tl = lit ? 1 : 0.14;
      }
      d.lit += (d.tl - d.lit) * (AF.SHOT ? 1 : Math.min(1, dt * 3));
      const tw = 0.75 + 0.25 * Math.sin(t * 2.3 + d.ph * 5);
      ca[i * 3] = d.lit * tw * 1.6; ca[i * 3 + 1] = d.lit * tw * 1.35; ca[i * 3 + 2] = d.lit * tw * 1.0;
    }
    pts.geometry.attributes.position.needsUpdate = true; pts.geometry.attributes.color.needsUpdate = true;
    pts.material.opacity = 0.6 * k;
    pts.material.color.copy(SU.uSunCol.value).lerp(tmpC2.setRGB(1, 0.92, 0.8), 0.5);
  }

  AF.onTick('atmos', 700, (dt, t) => {
    if (!A.sky) return;
    frameN++;
    const cam = AF.camera; camP.copy(cam.position);
    // interior probe
    if (frameN % 6 === 1) A.indoorTarget = A.probeIndoor(camP.x, camP.y, camP.z);
    const rate = dt > 0 ? 1 - Math.exp(-dt * 3.0) : 0;
    A.indoor += (A.indoorTarget - A.indoor) * (AF.SHOT && dt > 0 ? Math.max(rate, 0.5) : rate);
    if (Math.abs(A.indoor - A.indoorTarget) < 0.002) A.indoor = A.indoorTarget;
    SU.uT.value = t;
    SU.uCloudK.value = (AF.GFX && AF.GFX.tier === 'low') ? 0 : 1;
    A.updateLighting(dt);
    A.sky.position.copy(camP);
    // water body light level: hemi + sun contributions (linear)
    {
      const s = sunVec.y;
      const k = 0.12 + 0.9 * smooth(-0.05, 0.4, s);
      WLIGHT.setRGB(k, k, k).lerp(tmpC2.setRGB(0.08, 0.1, 0.16), T.night * 0.8);
    }
    // clouds: sky-light fill + warm sunset glow on the cloud material
    {
      const s = sunVec.y, dayK = smooth(-0.06, 0.12, s), sset = SU.uSunset.value;
      const H = FU.afSkyH.value, Sx = FU.afSkyS.value, Z = FU.afSkyZ.value;
      CLOUDU.uCSunDir.value.copy(s > -0.04 ? sunVec : moonVec);
      CLOUDU.uCSun.value.copy(SU.uSunCol.value).multiplyScalar(0.95 * dayK).add(tmpC2.setRGB(0.10, 0.12, 0.18).multiplyScalar(A.lightK.moon));
      CLOUDU.uCTop.value.setRGB(Z.x * 0.55 + H.x * 0.45, Z.y * 0.55 + H.y * 0.45, Z.z * 0.55 + H.z * 0.45).multiplyScalar(0.85);
      CLOUDU.uCBot.value.setRGB(H.x * 0.5 + Z.x * 0.3, H.y * 0.5 + Z.y * 0.3, H.z * 0.5 + Z.z * 0.3).multiplyScalar(0.62).lerp(tmpC2.setRGB(Sx.x, Sx.y * 0.7, Sx.z * 0.8), 0.45 * sset);
    }
    if (A.cloudMat && A.cloudMat !== AF.mat.voxel) {
      const e = A.cloudMat.emissive, dayL = smooth(-0.1, 0.3, sunVec.y);
      e.setRGB(0.1, 0.1, 0.11).multiplyScalar(dayL).add(tmpC2.copy(SU.uGlow.value).multiplyScalar(0.32 * SU.uSunset.value)).add(tmpC2.copy(SU.uZen.value).multiplyScalar(0.25 * T.night));
    }
    // clouds drift east, wrap around the town
    if (A.clouds) for (const c of A.clouds) { c.position.x += c.userData.v * dt; if (c.position.x > 1000) c.position.x -= 2000; }
    if (frameN % 3 === 1 || AF.SHOT) updatePool();
    updateLeaves(dt, t); updateSmoke(dt, t); if (AF.PLAN.falls.x > -900) updateMist(dt, t); if (A.mist) A.mist.visible = AF.PLAN.falls.x > -900; updateDust(dt, t); if (A.fireflies) A.fireflies.visible = false;
  });

  // ============================================================ tests
  AF.test('atmos: sky dome exists', () => ({ ok: !!(A.sky && A.sky.parent), info: 'clouds ' + (A.clouds ? A.clouds.length : 0) + ', water mats ' + A.waterMats.length + ', build ' + A.buildMs + ' ms' }));
  AF.test('atmos: night at 23h, day at 13h', () => {
    const h0 = T.hours, U = AF.mat.uniforms;
    T.hours = 23; A.applyTime(); const n23 = U.uNight.value;
    T.hours = 13; A.applyTime(); const n13 = U.uNight.value;
    T.hours = h0; A.applyTime();
    return { ok: n23 > 0.8 && n13 < 0.05, info: `uNight 23h=${n23.toFixed(2)} 13h=${n13.toFixed(2)}` };
  });
  AF.test('atmos: point light pool <= 12', () => {
    let n = 0; AF.scene.traverse((o) => { if (o.isPointLight) n++; });
    return { ok: n <= 12 && A.pool && A.pool.length === n, info: 'point lights in scene ' + n + ', registered lights ' + AF.lights.length };
  });
  AF.test('atmos: sun rises east, sets west, south at noon', () => {
    const m = A.sunAt(9), e = A.sunAt(12.25), w = A.sunAt(16.5), nn = A.sunAt(0);
    const ok = m.x > 0.3 && e.z > 0.5 && w.x < -0.3 && nn.y < -0.3 && e.y > 0.6 && w.y > 0.2 && w.y < 0.5;
    return { ok, info: `9h ${m.toArray().map((v) => v.toFixed(2))} 12h ${e.toArray().map((v) => v.toFixed(2))} 16.5h ${w.toArray().map((v) => v.toFixed(2))}` };
  });

  // ============================================================ PORT SOLACE extras: manhole steam, night searchlights, the SOLACE blimp
  const PX = AF.portSolaceFX = { steam: null, beams: [], blimp: null };
  AF.onBuild('atmos-extras', 710, () => {
    const t0 = performance.now(), S = AF.scene;
    // ---- manhole steam: additive soft puffs rising from ~15 manholes spread over the city
    {
      const all = (AF.manholes || []).filter((m) => Number.isFinite(m.x) && Number.isFinite(m.z));
      let src = [];
      if (all.length) { const step = Math.max(1, Math.floor(all.length / 8)); for (let i = 3; i < all.length && src.length < 8; i += step) src.push(all[i]); }
      else for (const [x, z] of [[20, 0], [-60, 0], [120, 0], [0, 40], [0, -60], [-80, 80], [80, -80], [-120, -80]]) src.push({ x, z });
      const PER = 8, N = src.length * PER;
      const pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
      const mat = new THREE.PointsMaterial({ size: 2.2, map: A.softTex || null, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: true });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5; pts.name = 'manhole-steam'; S.add(pts);
      const parts = [];
      for (let i = 0; i < N; i++) parts.push({ e: src[Math.floor(i / PER)], age: Math.random() * 4, life: 3 + Math.random() * 2.5, x: 0, y: -99, z: 0, vx: 0, vz: 0 });
      // R2: each vent remembers its nearest street light so the steam glows warm under it at night
      for (const e of src) {
        let best = null, bd = 14;
        for (const l of AF.lights) { if (l.kind === 'interior') continue; const d = Math.hypot(l.x - e.x, l.z - e.z); if (d < bd) { bd = d; best = l; } }
        const c = new THREE.Color(best ? (best.color ?? 0xffc67a) : 0x8090a8); e.lampK = best ? 1 - bd / 14 : 0; e.lampC = c;
      }
      PX.steam = { pts, pos, col, parts, src };
    }
    // ---- searchlights: long additive beams sweeping the night sky
    {
      const dflt = [{ x: 44, y: 22, z: 120 }, { x: 150, y: 3, z: 206 }, { x: 117, y: 60, z: -117 }, { x: 40, y: 42, z: -40 }];
      const spots = ((AF.searchlightSpots || []).filter((q) => q && Number.isFinite(q.x)).concat(dflt.filter((d) => !(AF.searchlightSpots || []).some((q) => Math.hypot(q.x - d.x, q.z - d.z) < 40)))).slice(0, 4);
      const cg = new THREE.CylinderGeometry(3.6, 0.35, 320, 16, 1, true); cg.translate(0, 160, 0);
      spots.forEach((sp, i) => {
        // fades with the camera's distance to each fragment (a nearby beam never reads as a pale blob) and toward the far end
        const mat = new THREE.ShaderMaterial({ uniforms: { opacity: { value: 0 }, uCol: { value: new THREE.Color(0xd8e6ff) } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
          vertexShader: 'varying vec3 vW; varying float vH; varying vec3 vN; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; vH = position.y / 320.0; vN = normalize(mat3(modelMatrix) * normal); gl_Position = projectionMatrix * viewMatrix * w; }',
          fragmentShader: 'uniform float opacity; uniform vec3 uCol; uniform float uT; varying vec3 vW; varying float vH; varying vec3 vN; float hh(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); } void main(){ vec3 V = normalize(cameraPosition - vW); float edge = abs(dot(normalize(vN), V)); float soft = pow(edge, 1.6); float d = distance(cameraPosition, vW); float core = 1.0 + 2.5 * exp(-vH * 18.0); float n = 0.85 + 0.15 * sin(vH * 40.0 - uT * 0.7 + hh(floor(vW.xz * 0.2)) * 6.0); float a = opacity * soft * core * n * smoothstep(12.0, 70.0, d) * (1.0 - smoothstep(0.45, 1.0, vH)) * (0.55 + 0.45 * (1.0 - vH)); gl_FragColor = vec4(uCol * a, a); }' });
        mat.uniforms.uT = { value: 0 };
        const m = new THREE.Mesh(cg, mat); m.frustumCulled = false; m.renderOrder = 6; m.castShadow = false; m.name = 'searchlight';
        const g = new THREE.Group(); g.position.set(sp.x, sp.y ?? 2, sp.z); g.add(m); S.add(g);
        PX.beams.push({ g, m, mat, ph: i * 1.7, sp: 0.18 + i * 0.05 });
      });
    }
    // ---- a plain silver blimp: one smooth lathe envelope, four fins, a small gondola; no branding
    {
      const HL = 29.4, RMAX = 7.7, AXY = 13.3;   // half length, max radius, envelope axis height above the mesh origin (mooring frame of v1)
      const rAt = (z) => { const u = Math.max(-1, Math.min(1, z / HL)); return RMAX * (u > 0 ? Math.sqrt(Math.max(0, 1 - Math.pow(u, 2.2))) : Math.sqrt(Math.max(0, 1 - u * u)) * (1 - 0.18 * u * u)); };
      const g = new THREE.Group(); g.name = 'blimp';
      const prof = []; for (let i = 0; i <= 28; i++) { const z = -HL + (i / 28) * 2 * HL; prof.push(new THREE.Vector2(Math.max(0.001, rAt(z)), z)); }
      const eg = new THREE.LatheGeometry(prof, 28); eg.rotateX(Math.PI / 2); eg.translate(0, AXY, 0);
      const envMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, emissive: new THREE.Color(0xffffff), emissiveIntensity: 0, roughness: 0.5, metalness: 0.25 });
      const env = new THREE.Mesh(eg, envMat); env.castShadow = true; g.add(env);
      const finMat = new THREE.MeshStandardMaterial({ color: 0xa8acb2, roughness: 0.55, metalness: 0.2 });
      const finShape = new THREE.Shape([new THREE.Vector2(-28.6, 1), new THREE.Vector2(-28.6, 8.4), new THREE.Vector2(-24, 8.6), new THREE.Vector2(-15, 5.6), new THREE.Vector2(-15, 1)]);
      const finG = new THREE.ExtrudeGeometry(finShape, { depth: 0.36, bevelEnabled: false }); finG.translate(0, 0, -0.18);
      const mb = new THREE.Matrix4();
      for (let k = 0; k < 4; k++) {
        const a = k * Math.PI / 2, d = new THREE.Vector3(Math.sin(a), Math.cos(a), 0), t = new THREE.Vector3(Math.cos(a), -Math.sin(a), 0);
        mb.makeBasis(new THREE.Vector3(0, 0, 1), d, t).setPosition(0, AXY, 0);
        const m = new THREE.Mesh(finG, finMat); m.applyMatrix4(mb); m.castShadow = true; g.add(m);
      }
      const gy = AXY - RMAX + 0.55;
      const gond = new THREE.Mesh(new THREE.CapsuleGeometry(1.2, 7, 3, 8), new THREE.MeshStandardMaterial({ color: 0x3a3f48, roughness: 0.5 })); gond.rotation.x = Math.PI / 2; gond.position.set(0, gy - 0.9, 2.5); g.add(gond);
      const nav = new THREE.Mesh(new THREE.SphereGeometry(0.45, 6, 4), new THREE.MeshBasicMaterial({ color: 0xff2a18, fog: false }));
      nav.position.set(0, gy - 2.2, 2.5); g.add(nav);
      S.add(g);
      PX.blimp = { mode: 'loop', cool: 90, mesh: g, nav: [nav], envMat, s: 0.15, cx: 10, cz: -30, rx: 230, rz: 170, y: 168, speed: 4.2, x: 0, z: 0, k: 1.4 };
      AF.blimp = { mesh: g, pos: () => g.position };
    }
    // ---- R2: sea spray where the chop slaps the quay wall (soft additive puffs near the camera)
    {
      const N = 110, pos = new Float32Array(N * 3), col = new Float32Array(N * 3);
      const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
      const mat = new THREE.PointsMaterial({ size: 0.55, map: A.softTex || null, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: true });
      const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 5; pts.name = 'sea-spray'; S.add(pts);
      const parts = []; for (let i = 0; i < N; i++) parts.push({ age: 9, life: 1, x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0 });
      const P = AF.PLAN, coast = (P.harbour && P.harbour.coastZ) || 210, seaY = (P.harbour && P.harbour.waterY) ?? -1.25;
      // spray spots: quay wall cells whose sea neighbour is open water (sampled every 1 m)
      const spots = [];
      for (let x = -298; x < 298; x += 1) { const gy = AF.W.groundY(x, coast + 1.5); if (gy < seaY - 0.2 && AF.W.groundY(x, coast - 1) > seaY) spots.push({ x, z: coast + 0.2 }); }
      PX.spray = { pts, pos, col, parts, spots, seaY, acc: 0 };
    }
    PX.ms = Math.round(performance.now() - t0);
  });
  const stepBlimp = (B, dt) => {
    const M = AF.solaceMast;
    if (M && Number.isFinite(M.x) && B.mode && B.mode !== 'loop') {   // mooring: glide in nose-first, hold a minute, glide back out
      B.mt += dt;
      const D = B.moor, fin = D.fin;
      if (B.mode === 'in' || B.mode === 'out') {
        const u = Math.min(1, B.mt / 25), e = u * u * (3 - 2 * u), a = B.mode === 'in' ? D.start : fin, b = B.mode === 'in' ? fin : B.ret();
        B.mesh.position.set(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e, a.z + (b.z - a.z) * e);
        B.mesh.rotation.set(0, a.yaw + AF.angDiff(a.yaw, b.yaw) * e, 0, 'YXZ');
        if (u >= 1) { if (B.mode === 'in') { B.mode = 'hold'; B.mt = 0; } else { B.mode = 'loop'; B.cool = 240; } }
      } else if (B.mode === 'hold') { B.mesh.position.set(fin.x, fin.y + Math.sin(B.mt * 0.5) * 0.2, fin.z); B.mesh.rotation.set(0, fin.yaw + Math.sin(B.mt * 0.15) * 0.04, 0, 'YXZ'); if (B.mt > 60) { B.mode = 'out'; B.mt = 0; } }
      B.x = B.mesh.position.x; B.z = B.mesh.position.z; return;
    }
    B.cool = (B.cool ?? 90) - dt;
    if (M && Number.isFinite(M.x) && Number.isFinite(M.y) && B.cool <= 0 && Math.hypot(B.x - M.x, B.z - M.z) < 110) {
      const yaw = Math.atan2(M.x - B.x, M.z - B.z), fx = Math.sin(yaw), fz = Math.cos(yaw);
      B.moor = { start: { x: B.mesh.position.x, y: B.mesh.position.y, z: B.mesh.position.z, yaw: B.mesh.rotation.y }, fin: { x: M.x - fx * 21.2 * (B.k || 1), y: M.y - 9.5 * (B.k || 1), z: M.z - fz * 21.2 * (B.k || 1), yaw } };
      B.ret = () => { const x = B.cx + Math.cos(B.s) * B.rx, z = B.cz + Math.sin(B.s) * B.rz; return { x, y: B.y, z, yaw: Math.atan2(-Math.sin(B.s) * B.rx, Math.cos(B.s) * B.rz) }; };
      B.mode = 'in'; B.mt = 0; return;
    }
    B.s += dt * B.speed / ((B.rx + B.rz) / 2);
    const x = B.cx + Math.cos(B.s) * B.rx, z = B.cz + Math.sin(B.s) * B.rz;
    const tx = -Math.sin(B.s) * B.rx, tz = Math.cos(B.s) * B.rz;
    B.x = x; B.z = z;
    B.mesh.position.set(x, B.y + Math.sin(B.s * 7) * 0.8, z); B.mesh.rotation.set(0, Math.atan2(tx, tz), Math.sin(B.s * 5) * 0.02, 'YXZ');
  };
  AF.onTick('atmos-extras', 705, (dt, t) => {
    const night = (AF.time && AF.time.night) || 0, cam = AF.camera.position;
    // steam
    const St = PX.steam;
    let steamNear = false;
    if (St) { for (const e of St.src) if (Math.abs(e.x - cam.x) < 140 && Math.abs(e.z - cam.z) < 140 && cam.y < 80) { steamNear = true; break; } St.pts.visible = steamNear; }
    if (St && steamNear) {
      const wind = 0.5 + 0.3 * Math.sin(t * 0.2), cold = 0.55 + 0.45 * night;
      for (let i = 0; i < St.parts.length; i++) {
        const p = St.parts[i], near = Math.abs(p.e.x - cam.x) < 140 && Math.abs(p.e.z - cam.z) < 140;
        p.age += dt;
        if (p.age >= p.life) { p.age = 0; p.life = 3 + Math.random() * 2.5; p.x = p.e.x + (Math.random() - 0.5) * 0.6; p.z = p.e.z + (Math.random() - 0.5) * 0.6; p.y = 0.1; p.vx = wind * (0.4 + Math.random() * 0.4); p.vz = (Math.random() - 0.5) * 0.3; }
        p.y += dt * (0.9 - p.age * 0.12); p.x += p.vx * dt * p.age * 0.5; p.z += p.vz * dt;
        const f = near ? Math.sin(Math.min(1, p.age / p.life) * Math.PI) * 0.22 * cold : 0;
        St.pos[i * 3] = p.x; St.pos[i * 3 + 1] = p.y; St.pos[i * 3 + 2] = p.z;
        const lk = (p.e.lampK || 0) * night, lc = p.e.lampC;
        St.col[i * 3] = f * (0.95 + (lc ? lc.r * 1.6 - 0.95 : 0) * lk); St.col[i * 3 + 1] = f * (0.95 + (lc ? lc.g * 1.6 - 0.95 : 0) * lk); St.col[i * 3 + 2] = f * (1 + (lc ? lc.b * 1.6 - 1 : 0) * lk);
      }
      St.pts.geometry.attributes.position.needsUpdate = true; St.pts.geometry.attributes.color.needsUpdate = true;
      St.pts.material.size = 2.2 + night * 0.6;
    }
    // R2: sea spray
    const Sp = PX.spray;
    if (Sp && Sp.spots.length) {
      const near = Math.abs(cam.z - 210) < 110 && cam.y < 70 && (A.indoor || 0) < 0.5;
      Sp.pts.visible = near;
      if (near) {
        const lk = 0.25 + 0.75 * smooth(-0.05, 0.3, sunVec.y);
        Sp.acc += dt * 12;
        for (let i = 0; i < Sp.parts.length; i++) {
          const p = Sp.parts[i];
          p.age += dt;
          if (p.age >= p.life && Sp.acc >= 1) {
            Sp.acc -= 1;
            // pick a spot near the camera; bursts cluster in wave sets
            const cand = Sp.spots[(Math.random() * Sp.spots.length) | 0];
            const sx = Math.abs(cand.x - cam.x) < 70 ? cand.x : cam.x + (Math.random() - 0.5) * 100;
            const set = 0.5 + 0.5 * Math.sin(t * 0.9 + sx * 0.13);
            if (Math.random() > set) { p.age = p.life; continue; }
            p.x = sx + (Math.random() - 0.5) * 0.8; p.z = 210.3 + Math.random() * 0.4; p.y = Sp.seaY + 0.1;
            p.vx = (Math.random() - 0.5) * 0.6; p.vy = 1.6 + Math.random() * 2.2; p.vz = 0.3 + Math.random() * 0.9; p.age = 0; p.life = 0.7 + Math.random() * 0.8;
          }
          if (p.age < p.life) { p.vy -= 9.8 * dt * 0.8; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; }
          const u = Math.min(1, p.age / p.life), f = p.age < p.life ? Math.sin(u * Math.PI) * 0.5 * lk : 0;
          Sp.pos[i * 3] = p.x; Sp.pos[i * 3 + 1] = p.age < p.life ? p.y : -99; Sp.pos[i * 3 + 2] = p.z;
          Sp.col[i * 3] = f; Sp.col[i * 3 + 1] = f; Sp.col[i * 3 + 2] = f * 1.02;
        }
        Sp.acc = Math.min(Sp.acc, 4);
        Sp.pts.geometry.attributes.position.needsUpdate = true; Sp.pts.geometry.attributes.color.needsUpdate = true;
      }
    }
    // searchlights
    const on = Math.max(0, Math.min(1, (night - 0.35) / 0.3));
    for (const b of PX.beams) {
      b.m.visible = on > 0.01; if (!b.m.visible) continue;
      const a = t * b.sp + b.ph;
      b.g.rotation.set(0, 0, 0); b.g.rotation.order = 'YXZ';
      b.g.rotation.y = a * 1.3 + Math.sin(a * 0.7) * 0.8; b.g.rotation.x = 0.42 + Math.sin(a * 1.1) * 0.22;
      b.mat.uniforms.opacity.value = 0.13 * on * (1 - 0.65 * smooth(50, 140, cam.y)); b.mat.uniforms.uT.value = t;   // R2b: from the air a beam reads as a white rod
    }
    // blimp + nav lights
    const B = PX.blimp;
    if (B) {
      stepBlimp(B, dt); const blink = (t % 1.6) < 0.25; for (const n of B.nav) n.visible = blink || night < 0.3 ? blink : true;
      if (B.envMat) B.envMat.emissiveIntensity = 0.08 * night;
    }
  });
  AF.test('blimp is plain (no branding panels)', () => {
    const B = PX.blimp; if (!B) return { ok: false, info: 'no blimp' };
    const eg = B.mesh.children[0].geometry; eg.computeBoundingBox(); const L2 = eg.boundingBox.max.z - eg.boundingBox.min.z;
    return { ok: !B.panels && B.mesh.children.length <= 8 && L2 > 54 && L2 < 62, info: `children ${B.mesh.children.length}, length ${L2.toFixed(1)} m` };
  });
  AF.test('atmos: blimp drifts, steam + searchlights exist', () => {
    const B = PX.blimp; if (!B) return { ok: false, info: 'no blimp' };
    const sv = { cool: B.cool }; B.cool = 1e9; B.mode = 'loop';
    const x0 = B.mesh.position.x, z0 = B.mesh.position.z;
    for (let i = 0; i < 120; i++) stepBlimp(B, 0.25);
    B.cool = sv.cool;
    const moved = Math.hypot(B.mesh.position.x - x0, B.mesh.position.z - z0);
    return { ok: moved > 20 && isFinite(moved) && PX.beams.length >= 3 && PX.steam && PX.steam.src.length >= 6, info: `blimp moved ${moved.toFixed(1)} m in 30 s at y ${B.y}, beams ${PX.beams.length}, steam vents ${PX.steam ? PX.steam.src.length : 0}, ${PX.ms} ms` };
  });

  // ============================================================ ROUND 2: HARBOUR DAYS FIREWORKS over the harbour at night (20.6 h -> 0.5 h)
  // Shells rise from three barges off the quay, burst at 80-150 m (peony / willow / ring / crackle / brand-orange CWM stars),
  // sparks = additive glowing heads (Points) + motion streaks (LineSegments), one draw call each, no per-frame allocation.
  // Each burst lends the harbour water a coloured reflection streak (AF.water2.dyn). A 120 s show: 70 s salvos, a 12 s finale, 38 s pause.
  // ?fireworks forces the show on at any hour; AF.fireworks.launch(n) fires n shells now.
  const FW = AF.fireworks = { max: 4200, n: 0, shells: [], sites: [], on: 0, next: 0, launch: null, bursts: 0 };
  AF.onBuild('atmos-fireworks', 712, () => {
    const P = AF.PLAN, seaY = (P.harbour && P.harbour.waterY) ?? -1.25, coast = (P.harbour && P.harbour.coastZ) || 210;
    for (const [x, dz] of [[-90, 165], [10, 180], [105, 165], [-30, 215], [65, 215]]) { const z = coast + dz, off = AF.W.col ? AF.W.col(x, z) < 0 : false; if (off || AF.W.groundY(x, z) < seaY - 0.5) FW.sites.push({ x, y: seaY + 1.2, z }); }   // beyond the voxel map = open sea
    if (!FW.sites.length) FW.sites.push({ x: 0, y: 0, z: coast + 120 });
    const M = FW.max;
    FW.p = new Float32Array(M * 3); FW.v = new Float32Array(M * 3); FW.age = new Float32Array(M).fill(99); FW.life = new Float32Array(M).fill(1);
    FW.c = new Float32Array(M * 3); FW.k = new Float32Array(M * 3);   // k: drag, gravity scale, twinkle
    const hp = new Float32Array(M * 3), hc = new Float32Array(M * 3), hs = new Float32Array(M);
    const lp = new Float32Array(M * 6), lc = new Float32Array(M * 6);
    const hg = new THREE.BufferGeometry();
    hg.setAttribute('position', new THREE.BufferAttribute(hp, 3).setUsage(THREE.DynamicDrawUsage));
    hg.setAttribute('aCol', new THREE.BufferAttribute(hc, 3).setUsage(THREE.DynamicDrawUsage));
    hg.setAttribute('aSize', new THREE.BufferAttribute(hs, 1).setUsage(THREE.DynamicDrawUsage));
    const hm = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 500 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: 'attribute vec3 aCol; attribute float aSize; uniform float uScale; varying vec3 vC; void main(){ vC = aCol; vec4 mv = modelViewMatrix * vec4(position, 1.0); gl_PointSize = aSize > 0.0 ? clamp(aSize * uScale / max(1.0, -mv.z), 1.6, 22.0) : 0.0; vC *= smoothstep(8.0, 45.0, -mv.z); gl_Position = aSize > 0.0 ? projectionMatrix * mv : vec4(0.0, 0.0, 2.0, 1.0); }',
      fragmentShader: 'varying vec3 vC; void main(){ vec2 q = gl_PointCoord - 0.5; float r2 = dot(q, q) * 4.0; if (r2 > 1.0) discard; float a = exp(-r2 * 4.5) + 0.5 * exp(-r2 * 30.0); gl_FragColor = vec4(vC * a, 1.0); }',
    });
    const heads = new THREE.Points(hg, hm); heads.frustumCulled = false; heads.renderOrder = 7; heads.name = 'fireworks-heads';
    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(lp, 3).setUsage(THREE.DynamicDrawUsage));
    lg.setAttribute('color', new THREE.BufferAttribute(lc, 3).setUsage(THREE.DynamicDrawUsage));
    const lm = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });
    const lines = new THREE.LineSegments(lg, lm); lines.frustumCulled = false; lines.renderOrder = 7; lines.name = 'fireworks-trails';
    AF.scene.add(heads); AF.scene.add(lines);
    Object.assign(FW, { heads, lines, hp, hc, hs, lp, lc, hg, lg, hm });
    heads.visible = lines.visible = false;
  });
  {
    const PAL = [[2.6, 1.55, 0.45], [2.8, 0.32, 0.18], [0.35, 2.3, 0.6], [0.45, 0.85, 3.0], [2.5, 2.4, 2.2], [1.9, 0.45, 2.6], [3.0, 0.85, 0.36]];
    let ring = 0; const TRAIL = [1.1, 0.62, 0.2];   // rising-shell sparkle: dimmer than the stars so the lift reads as a thin comet, not a column
    const spark = (x, y, z, vx, vy, vz, life, c, drag, grav, tw) => {
      const i = ring; ring = (ring + 1) % FW.max;
      FW.p[i * 3] = x; FW.p[i * 3 + 1] = y; FW.p[i * 3 + 2] = z; FW.v[i * 3] = vx; FW.v[i * 3 + 1] = vy; FW.v[i * 3 + 2] = vz;
      FW.age[i] = 0; FW.life[i] = life; FW.c[i * 3] = c[0]; FW.c[i * 3 + 1] = c[1]; FW.c[i * 3 + 2] = c[2];
      FW.k[i * 3] = drag; FW.k[i * 3 + 1] = grav; FW.k[i * 3 + 2] = tw;
    };
    const burst = (s) => {
      const c = PAL[s.col], c2 = PAL[s.col2], type = s.type, sp = s.speed;
      const N = type === 'willow' ? 110 : type === 'ring' ? 80 : type === 'crackle' ? 90 : 130;
      // ring: a random tilted plane
      const ax = Math.random() - 0.5, ay = 0.6 + Math.random(), az = Math.random() - 0.5, al = Math.hypot(ax, ay, az);
      const nx = ax / al, ny = ay / al, nz = az / al;
      let ux = -nz, uy = 0, uz = nx; const ul = Math.hypot(ux, uz) || 1; ux /= ul; uz /= ul;
      const wx = ny * uz - nz * uy, wy = nz * ux - nx * uz, wz = nx * uy - ny * ux;
      for (let k = 0; k < N; k++) {
        let dx, dy, dz;
        if (type === 'ring') { const a = k / N * Math.PI * 2; dx = Math.cos(a) * ux + Math.sin(a) * wx; dy = Math.cos(a) * uy + Math.sin(a) * wy; dz = Math.cos(a) * uz + Math.sin(a) * wz; }
        else { const u = Math.random() * 2 - 1, a = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); dx = r * Math.cos(a); dy = u; dz = r * Math.sin(a); }
        const v = sp * (type === 'ring' ? 1 : 0.82 + Math.random() * 0.18), cc = (k & 3) === 0 && type !== 'willow' ? c2 : c;
        if (type === 'willow') spark(s.x, s.y, s.z, dx * v * 0.8, dy * v * 0.8, dz * v * 0.8, 3.6 + Math.random() * 1.2, PAL[0], 1.9, 0.55, 0.3);
        else if (type === 'crackle') spark(s.x, s.y, s.z, dx * v, dy * v, dz * v, 1.7 + Math.random() * 0.6, cc, 1.5, 0.4, 1);
        else spark(s.x, s.y, s.z, dx * v, dy * v, dz * v, 1.9 + Math.random() * 0.7, cc, 1.35, 0.35, type === 'peony' ? 0 : 0.5);
      }
      // bright core flash
      for (let k = 0; k < 6; k++) spark(s.x, s.y, s.z, 0, 0, 0, 0.18 + k * 0.03, PAL[4], 0, 0, 0);
      FW.bursts++;
      const W2 = AF.water2; if (W2) { W2.dyn = W2.dyn || []; const d = W2.dyn; const e = d.length < 3 ? {} : d.shift(); e.x = s.x; e.y = s.y; e.z = s.z; e.col = c; e.t = 0; d.push(e); }
    };
    FW.launch = (count = 1, finale = false) => {
      for (let n = 0; n < count; n++) {
        const site = FW.sites[(Math.random() * FW.sites.length) | 0];
        const H = 95 + Math.random() * 70, g = 22, vy = Math.sqrt(2 * g * H);
        const types = ['peony', 'peony', 'willow', 'ring', 'crackle', 'peony'];
        const col = (Math.random() * PAL.length) | 0;
        let s = FW.shells.find((q) => !q.live);
        if (!s) { if (FW.shells.length >= 24) return; s = {}; FW.shells.push(s); }
        Object.assign(s, { live: true, x: site.x + (Math.random() - 0.5) * 6, y: site.y, z: site.z + (Math.random() - 0.5) * 6, vx: (Math.random() - 0.5) * 5, vy, vz: (Math.random() - 0.5) * 4 - 2, g,
          fuse: vy / g * (0.86 + Math.random() * 0.1), t: 0, type: finale && Math.random() < 0.4 ? 'crackle' : types[(Math.random() * types.length) | 0], col, col2: (col + 1 + ((Math.random() * 5) | 0)) % PAL.length, speed: 40 + Math.random() * 16 });
      }
    };
    const tmpS = new THREE.Vector2();
    AF.onTick('atmos-fireworks', 707, (dt, t) => {
      if (!FW.heads) return;
      const h = AF.time.hours, night = AF.time.night || 0;
      const want = AF.Q.has('fireworks') ? 1 : (h >= 20.6 || h < 0.5) && night > 0.6 && (A.indoor || 0) < 0.6 ? 1 : 0;
      FW.on = want;
      // the show: 120 s cycle, 70 s of salvos, 12 s finale, 38 s pause
      if (want && dt > 0) {
        const ph = (t % 120);
        FW.next -= dt;
        if (FW.next <= 0) {
          if (ph < 70) { FW.launch(Math.random() < 0.3 ? 2 : 1); FW.next = 0.9 + Math.random() * 2.2; }
          else if (ph < 82) { FW.launch(2, true); FW.next = 0.28 + Math.random() * 0.25; }
          else FW.next = 0.5;
        }
      }
      // shells: rise with a sparkling trail, then burst
      let live = 0;
      for (const s of FW.shells) {
        if (!s.live) continue; live++;
        s.t += dt; s.vy -= s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.z += s.vz * dt;
        if (Math.random() < 0.6) spark(s.x, s.y, s.z, (Math.random() - 0.5) * 1.5, -2 - Math.random() * 2, (Math.random() - 0.5) * 1.5, 0.4 + Math.random() * 0.25, TRAIL, 1.2, 0.3, 0.8);
        if (s.t >= s.fuse) { s.live = false; burst(s); }
      }
      // sparks
      const M = FW.max, p = FW.p, v = FW.v, age = FW.age, life = FW.life, c = FW.c, K = FW.k, hp = FW.hp, hc = FW.hc, hs = FW.hs, lp = FW.lp, lc = FW.lc;
      let alive = 0;
      for (let i = 0; i < M; i++) {
        const i3 = i * 3, i6 = i * 6;
        if (age[i] >= life[i]) { if (hs[i] !== 0) { hs[i] = 0; lc[i6] = lc[i6 + 1] = lc[i6 + 2] = lc[i6 + 3] = lc[i6 + 4] = lc[i6 + 5] = 0; lp[i6 + 1] = lp[i6 + 4] = -999; } continue; }
        alive++;
        age[i] += dt;
        const dr = Math.exp(-K[i3] * dt);
        v[i3] *= dr; v[i3 + 1] = v[i3 + 1] * dr - 9.8 * K[i3 + 1] * dt; v[i3 + 2] *= dr;
        p[i3] += v[i3] * dt; p[i3 + 1] += v[i3 + 1] * dt; p[i3 + 2] += v[i3 + 2] * dt;
        const u = age[i] / life[i];
        let b = (1 - u) * (1 - u) * (u < 0.04 ? 1.6 : 1);
        if (K[i3 + 2] > 0 && u > 0.35) b *= (Math.sin(age[i] * 43 + i * 1.7) > 0.2 ? 1.6 : 0.15 * (1 - K[i3 + 2]) + 0.05);
        const warm = 1 - u * 0.5;   // sparks cool toward orange as they die
        const r = c[i3] * b, gg = c[i3 + 1] * b * warm, bb = c[i3 + 2] * b * warm * warm;
        hp[i3] = p[i3]; hp[i3 + 1] = p[i3 + 1]; hp[i3 + 2] = p[i3 + 2]; hc[i3] = r; hc[i3 + 1] = gg; hc[i3 + 2] = bb; hs[i] = 1.15 + 1.1 * (1 - u);
        const tl = 0.09 + 0.05 * K[i3 + 1];   // streak = where the spark was ~0.1 s ago
        lp[i6] = p[i3]; lp[i6 + 1] = p[i3 + 1]; lp[i6 + 2] = p[i3 + 2];
        lp[i6 + 3] = p[i3] - v[i3] * tl; lp[i6 + 4] = p[i3 + 1] - v[i3 + 1] * tl - 0.4 * K[i3 + 1]; lp[i6 + 5] = p[i3 + 2] - v[i3 + 2] * tl;
        lc[i6] = r * 0.7; lc[i6 + 1] = gg * 0.7; lc[i6 + 2] = bb * 0.7; lc[i6 + 3] = lc[i6 + 4] = lc[i6 + 5] = 0;
      }
      FW.n = alive;
      const vis = alive > 0 || live > 0;
      FW.heads.visible = FW.lines.visible = vis;
      if (vis) {
        FW.hg.attributes.position.needsUpdate = true; FW.hg.attributes.aCol.needsUpdate = true; FW.hg.attributes.aSize.needsUpdate = true;
        FW.lg.attributes.position.needsUpdate = true; FW.lg.attributes.color.needsUpdate = true;
        AF.renderer.getDrawingBufferSize(tmpS);
        FW.hm.uniforms.uScale.value = tmpS.y * 0.5 / Math.tan(AF.camera.fov * Math.PI / 360);
      }
      const W2 = AF.water2; if (W2 && W2.dyn) for (const e of W2.dyn) e.t += dt;
    });
    AF.test('atmos: harbour fireworks burst and fall', () => {
      if (!FW.heads) return { ok: false, info: 'no fireworks' };
      const b0 = FW.bursts; FW.launch(2);
      for (let i = 0; i < 80; i++) for (const s of FW.shells) if (s.live) { s.t += 0.05; s.vy -= s.g * 0.05; s.y += s.vy * 0.05; if (s.t >= s.fuse) { s.live = false; burst(s); } }
      let sparks = 0; for (let i = 0; i < FW.max; i++) if (FW.age[i] < FW.life[i]) sparks++;
      const maxN = FW.bursts - b0;
      return { ok: maxN >= 2 && sparks > 150 && FW.sites.length >= 3, info: `sites ${FW.sites.length}, bursts ${maxN}, live sparks ${sparks}` };
    });
  }
}

} catch (e) { AF.partError('60-atmos.js', e); }

