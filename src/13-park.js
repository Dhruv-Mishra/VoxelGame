// ================================================================ 13-park.js
try {
// ===== 13-park: CENTRAL PARK — wall + railings + 6 gates, curving paths, lawns, big autumn trees, Swan Lake (stone shore,
//       boathouse + jetty, rowboats, footbridge, gazebo), the bandshell + chairs, carousel, skating pond pavilion + roller rink,
//       fountain, playground, chess tables, hot-dog cart, balloon seller, kite, statues, benches  (OWNER: streets-park) =====
{
  const W = AF.W, P = AF.PLAN, PK = P.park, LK = P.lake, PD = P.pond, F = P.parkFeatures;
  const hash = AF.hash2;
  const PKS = AF.park = AF.park || {};
  const lakeE = (x, z) => Math.hypot((x - LK.cx) / LK.rx, (z - LK.cz) / LK.rz);
  const pondD = (x, z) => Math.hypot(x - PD.cx, z - PD.cz);
  let K = null;
  const pal = () => {
    if (K) return K;
    const c = AF.col;
    K = {
      lawn: [c(0x5f8f3c, { jitter: 0.7, pat: 'grass' }), c(0x6a9a42, { jitter: 0.7, pat: 'grass' }), c(0x57863a, { jitter: 0.7, pat: 'grass' }), c(0x78a04a, { jitter: 0.7, pat: 'grass' }), c(0x86a24e, { jitter: 0.7, pat: 'grass' })],
      path: [c(0xd8cdb4, { jitter: 0.35, edge: 0.08, pat: 'slab' }), c(0xcfc3a8, { jitter: 0.35, edge: 0.08, pat: 'slab' }), c(0xe0d6bf, { jitter: 0.35, edge: 0.08, pat: 'slab' })], pathEdge: c(0x9a8e78, { jitter: 0.3, edge: 0.1, pat: 'setts' }),
      leafR: c(0xb8452a, { jitter: 0.5 }), leafO: c(0xd57a2c, { jitter: 0.5 }), leafY: c(0xd9a93a, { jitter: 0.5 }), leafB: c(0x8a5a2c, { jitter: 0.5 }),
      stone: c(0xa9a294, { jitter: 0.3, edge: 0.35 }), stoneD: c(0x8a8376, { jitter: 0.3, edge: 0.35 }), coping: c(0xcac2b0, { jitter: 0.2, edge: 0.35 }),
      iron: c(0x1f2a24, { jitter: 0.15, edge: 0.4 }), gold: c(0xd4a83e, { jitter: 0.15, edge: 0.3 }), brass: c(0xc09a45, { jitter: 0.2, edge: 0.3 }),
      glow: c(0xffe6b8, { emit: 0xffa850, emitK: 1.05, mode: 'night', jitter: 0, edge: 0 }), glowA: c(0xfff2d8, { emit: 0xffd9a0, emitK: 1.4, mode: 'always', jitter: 0, edge: 0 }),
      cream: c(0xefe3c2, { jitter: 0.12, edge: 0.25 }), cream2: c(0xe2d3ad, { jitter: 0.12, edge: 0.25 }), jade: c(0x2e8a7a, { jitter: 0.12, edge: 0.35 }), jadeD: c(0x1f6155, { jitter: 0.12, edge: 0.35 }),
      copper: c(0x5f9e86, { jitter: 0.25, edge: 0.3 }), copperD: c(0x4a8270, { jitter: 0.25, edge: 0.3 }),
      wood: c(0x9a6a3e, { jitter: 0.4, edge: 0.4 }), woodD: c(0x6f4a2a, { jitter: 0.4, edge: 0.4 }), woodL: c(0xb98a58, { jitter: 0.4, edge: 0.4 }), plank: c(0xa77b4d, { jitter: 0.45, edge: 0.45 }),
      red: c(0xc03a2c, { jitter: 0.2, edge: 0.3 }), redD: c(0x8e2a21, { jitter: 0.2, edge: 0.3 }), white: c(0xf1ede2, { jitter: 0.12, edge: 0.3 }), navy: c(0x1d2d52, { jitter: 0.15, edge: 0.3 }),
      black: c(0x1c1b1a, { jitter: 0.1, edge: 0.2 }), blue: c(0x2d4f8a, { jitter: 0.15, edge: 0.3 }), yellow: c(0xe2b43a, { jitter: 0.2, edge: 0.3 }),
      skin: c(0xe0b08a, { jitter: 0.1, edge: 0.1 }), skin2: c(0xa8744f, { jitter: 0.1, edge: 0.1 }), hair: c(0x3a2a1e, { jitter: 0.1, edge: 0.1 }),
      shrub: [c(0x3f6a30, { jitter: 0.6 }), c(0x4b7a36, { jitter: 0.6 }), c(0x6b7a30, { jitter: 0.6 }), c(0x8a5a2a, { jitter: 0.6 })],
      flower: [c(0xd23b3b, { jitter: 0.5, solid: false }), c(0xf0c040, { jitter: 0.5, solid: false }), c(0xe070a0, { jitter: 0.5, solid: false }), c(0xf2ece0, { jitter: 0.5, solid: false }), c(0x9a5ad0, { jitter: 0.5, solid: false }), c(0xe8782a, { jitter: 0.5, solid: false })],
      stem: c(0x3d6a2a, { jitter: 0.4, solid: false }), soil: c(0x5a4030, { jitter: 0.6 }), sand: c(0xe2cf9c, { jitter: 0.6 }),
      rink: c(0xb9c4c8, { jitter: 0.15, edge: 0.1 }), rinkL: c(0xd05050, { jitter: 0.1, edge: 0.05 }),
      water: c(0x4e8fb0, { jitter: 0.1, edge: 0, glass: true }), bronze: c(0x5d7a5a, { jitter: 0.25, edge: 0.35 }), bronzeD: c(0x445c44, { jitter: 0.25, edge: 0.35 }),
      signBg: c(0x1f4f45, { jitter: 0.05, edge: 0.2 }), signFg: c(0xf6ecd0, { emit: 0xfff0c8, emitK: 0.9, mode: 'night', jitter: 0, edge: 0 }),
      canvasR: c(0xc8372b, { jitter: 0.1, edge: 0.2 }), canvasW: c(0xf2ead6, { jitter: 0.1, edge: 0.2 }), chrome: c(0xe4e2dc, { jitter: 0.1, edge: 0.3 }),
      board: c(0xe8e0cc, { jitter: 0.1, edge: 0.2 }), boardD: c(0x3a2a1e, { jitter: 0.1, edge: 0.2 }),
    };
    return K;
  };
  const hasKit = () => !!(AF.peopleKit && typeof AF.peopleKit.buildPerson === 'function' && typeof AF.peopleKit.makeLook === 'function');
  const inPark = (x, z, m = 0) => x > PK.x0 + m && x < PK.x1 - m && z > PK.z0 + m && z < PK.z1 - m;
  const parkDirection = new THREE.Vector3();
  const movers = [];
  const moving = (object, kind) => {
    movers.push({ geometry: object.geometry, material: object.material, matrix: object.matrixWorld, object, kind, visible: true, shadow: false });
    object.visible = false; object.castShadow = false; object.frustumCulled = false; return object;
  };
  const parkTick = (name, order, fn) => {
    let frame = 0, elapsed = 0, hidden = true;
    AF.onTick(name, order, (dt, time) => {
      const distance = parkDistance();
      if (!Number.isFinite(distance)) { hidden = true; elapsed = 0; return; }
      elapsed += dt;
      if (!hidden && distance > 60 && ++frame % 3 !== 0) return;
      hidden = false; fn(elapsed, time); elapsed = 0;
    });
  };
  const parkDistance = () => {
    const camera = AF.camera; if (!camera) return Infinity;
    const pos = camera.position, dx = Math.max(PK.x0 - pos.x, 0, pos.x - PK.x1), dz = Math.max(PK.z0 - pos.z, 0, pos.z - PK.z1);
    const distance = Math.hypot(dx, dz, Math.max(0, pos.y - 30));
    if (distance > 150) return Infinity;
    camera.getWorldDirection(parkDirection);
    const cx = (PK.x0 + PK.x1) * 0.5 - pos.x, cz = (PK.z0 + PK.z1) * 0.5 - pos.z;
    const extent = Math.abs(parkDirection.x) * (PK.x1 - PK.x0) * 0.5 + Math.abs(parkDirection.z) * (PK.z1 - PK.z0) * 0.5 + Math.abs(parkDirection.y) * 15;
    return cx * parkDirection.x + (15 - pos.y) * parkDirection.y + cz * parkDirection.z + extent < -10 ? Infinity : distance;
  };
  const parkBatches = (entries, parent, name, shadows = false) => {
    if (!entries.length) return null;
    const groups = new Map(), data = new Float32Array(entries.length * 20);
    const texture = new THREE.DataTexture(data, 5, entries.length, THREE.RGBAFormat, THREE.FloatType);
    texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.generateMipmaps = false;
    const head = `uniform sampler2D uParkPose; attribute float aParkSlot; varying float vParkFade;
      mat4 parkMatrix() { float row = (aParkSlot + 0.5) / ${entries.length.toFixed(1)};
        return mat4(texture2D(uParkPose, vec2(0.1,row)), texture2D(uParkPose, vec2(0.3,row)),
          texture2D(uParkPose, vec2(0.5,row)), texture2D(uParkPose, vec2(0.7,row))); }\n`;
    const patch = (shader, depth) => {
      shader.uniforms.uParkPose = { value: texture };
      shader.vertexShader = head + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace('void main() {', `void main() { mat4 parkPose = parkMatrix();
        vParkFade = texture2D(uParkPose, vec2(0.9,(aParkSlot+0.5)/${entries.length.toFixed(1)})).y;`);
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', `vec3 transformed = (parkPose * vec4(position,1.0)).xyz;
        ${depth ? `if (texture2D(uParkPose, vec2(0.9,(aParkSlot+0.5)/${entries.length.toFixed(1)})).x < 0.5) transformed = vec3(0.0);` : ''}`);
      shader.vertexShader = shader.vertexShader.replace('#include <defaultnormal_vertex>', `mat3 parkNormal = mat3(parkPose);
        objectNormal /= max(vec3(dot(parkNormal[0],parkNormal[0]),dot(parkNormal[1],parkNormal[1]),dot(parkNormal[2],parkNormal[2])),vec3(0.000001));
        objectNormal = parkNormal * objectNormal;
        #include <defaultnormal_vertex>`);
      shader.fragmentShader = 'varying float vParkFade;\n' + shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace('void main() {', `void main() {
        float parkDither = fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233))) * 43758.5453);
        if (${name === 'park-life-far' ? 'parkDither < 1.0 - vParkFade' : 'parkDither >= vParkFade'}) discard;`);
    };
    for (let index = 0; index < entries.length; index++) {
      const entry = entries[index], geometry = entry.geometry.clone();
      geometry.setAttribute('aParkSlot', new THREE.BufferAttribute(new Float32Array(geometry.attributes.position.count).fill(index), 1));
      const key = (name === 'park-moving-parts' ? 'rigid' : entry.kind) + ':' + entry.material.uuid;
      if (!groups.has(key)) groups.set(key, { material: entry.material, geometries: [], entries: [] });
      groups.get(key).geometries.push(geometry);
      groups.get(key).entries.push(entry);
    }
    const meshes = [];
    for (const group of groups.values()) {
      const geometry = AF.addons.BGU.mergeGeometries(group.geometries, false), material = group.material.clone();
      group.index = geometry.index.array.slice(); group.ranges = [];
      let indexStart = 0;
      for (let index = 0; index < group.entries.length; index++) {
        const count = group.geometries[index].index.count;
        group.ranges.push({ entry: group.entries[index], start: indexStart, count, active: null }); indexStart += count;
      }
      geometry.index.setUsage(THREE.DynamicDrawUsage);
      const baseCompile = group.material.onBeforeCompile;
      material.onBeforeCompile = (shader, renderer) => { baseCompile.call(material, shader, renderer); patch(shader, false); };
      material.customProgramCacheKey = () => name + ':' + entries.length + ':' + group.material.uuid;
      const mesh = new THREE.InstancedMesh(geometry, material, 1);
      mesh.setMatrixAt(0, new THREE.Matrix4()); mesh.frustumCulled = false; mesh.receiveShadow = true; mesh.castShadow = shadows;
      mesh.name = name; parent.add(mesh); meshes.push(mesh);
      group.mesh = mesh;
      if (shadows) {
        const depth = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
        depth.onBeforeCompile = (shader) => patch(shader, true); depth.customProgramCacheKey = () => name + ':depth:' + entries.length;
        mesh.customDepthMaterial = depth;
      }
      for (const source of group.geometries) source.dispose();
    }
    const update = () => {
      for (let index = 0; index < entries.length; index++) {
        const entry = entries[index], offset = index * 20;
        if (entry.visible === false) { data.fill(0, offset, offset + 16); data[offset + 15] = 1; }
        else for (let component = 0; component < 16; component++) data[offset + component] = entry.matrix.elements[component];
        data[offset + 16] = entry.shadow ? 1 : 0;
        data[offset + 17] = entry.visible === false ? 0 : entry.fade ?? 1;
      }
      for (const group of groups.values()) {
        let visible = false, shadow = false, changed = false;
        for (const range of group.ranges) {
          const entry = range.entry, active = entry.visible !== false && (entry.fade ?? 1) > 0;
          if (active) visible = true; if (entry.shadow) shadow = true;
          if (active !== range.active) { range.active = active; changed = true; }
        }
        if (changed) {
          let count = 0; const indexArray = group.mesh.geometry.index.array;
          for (const range of group.ranges) if (range.active) {
            for (let index = range.start; index < range.start + range.count; index++) indexArray[count++] = group.index[index];
          }
          group.mesh.geometry.setDrawRange(0, count); group.mesh.geometry.index.needsUpdate = true;
        }
        group.mesh.count = visible ? 1 : 0; group.mesh.castShadow = shadows && shadow;
        const material = group.mesh.material, source = group.material;
        if (material.envMap !== source.envMap) { material.envMap = source.envMap; material.needsUpdate = true; }
        material.envMapIntensity = source.envMapIntensity;
      }
      texture.needsUpdate = true;
    };
    return { entries, meshes, update };
  };

  // ------------------------------------------------------------ PATH network (polylines, painted with a round brush)
  const PATHS = [
    { w: 3.4, pts: [[-40, -172], [-40, -189]] },                                                                                  // Park Row gate (City Hall stop) -> fountain plaza
    { w: 3.4, pts: [[-28, -191], [-27, -205], [-22, -218], [-15, -232], [-11, -244], [-10, -258]] },                                 // fountain -> bandshell
    { w: 3.4, pts: [[0, -172], [4, -186], [12, -198]] },                                                                             // Grand Ave gate -> carousel
    { w: 3.0, pts: [[28, -214], [38, -224], [44, -236], [40, -244]] },                                                               // carousel -> rink + pavilion
    { w: 3.0, pts: [[71, -215], [58, -212], [45, -210], [30, -208]] },                                                               // east gate -> carousel
    { w: 3.0, pts: [[-80, -172], [-78, -186], [-70, -198], [-58, -205]] },                                                           // Library St gate -> lake loop
    { w: 3.0, pts: [[-146, -225], [-136, -226]] },                                                                                   // west gate -> lake loop
    { w: 3.0, pts: [[-40, -291], [-42, -280], [-50, -270], [-58, -266]] },                                                           // north gate -> lake loop
    { w: 3.0, pts: [[-44, -198], [-52, -204], [-58, -205]] },                                                                         // fountain -> lake loop
    { w: 3.0, pts: [[-10, -272], [-20, -276], [-36, -276], [-52, -270]] },                                                           // behind bandshell -> north path
    { w: 3.0, pts: [[-64, -260], [-64, -216]] },                                                                                     // the footbridge line (east tip of the lake)
    { w: 2.6, pts: [[-120, -198], [-122, -206]] },                                                                                    // playground
    { w: 3.0, pts: [[10, -224], [0, -238], [-6, -246]] },                                                                             // carousel -> bandshell lawn
    { w: 2.6, pts: [[-28, -192], [-18, -190], [-4, -186]] },                                                                          // fountain -> hot dogs / balloon lawn
    { w: 5.0, mall: 1, pts: [[-40, -205], [-40, -251]] },                                                                                     // THE MALL (elm allee) -> Pioneers column
  ];
  // lake loop ellipse
  { const pts = []; for (let i = 0; i <= 64; i++) { const a = i / 64 * Math.PI * 2; pts.push([LK.cx + Math.cos(a) * LK.rx * 1.3, LK.cz + Math.sin(a) * LK.rz * 1.38]); } PATHS.push({ w: 3.2, pts }); }
  PKS.paths = PATHS;
  let pathMask = null;
  const onPath = (x, z) => { const i = W.col(x, z); return i >= 0 && pathMask && pathMask[i] === 1; };

  // ------------------------------------------------------------ GROUND (order 160): lawns, stone lake edge, paths, plazas
  AF.onBuild('park-ground', 160, () => {
    const k = pal(), H = W.H, C = W.C, S = W.S;
    pathMask = new Uint8Array(W.NX * W.NZ);
    W.eachCol(PK.x0, PK.z0, PK.x1, PK.z1, (bx, bz, i, x, z) => {
      const le = lakeE(x, z), pd = pondD(x, z);
      if (le < 1.02 || pd < PD.r + 0.3) return;                // water + beds (land-harbour)
      if (le < 1.13 || (pd < PD.r + 1.3)) { H[i] = 1; C[i] = hash(bx >> 1, bz >> 1) < 0.5 ? k.coping : k.stone; S[i] = k.stoneD; return; }   // stone shore edge
      H[i] = 1; S[i] = k.stoneD;
      const n = AF.noise2(x * 0.045, z * 0.045), n2 = AF.noise2(x * 0.3 + 11, z * 0.3);
      C[i] = k.lawn[Math.min(4, Math.floor(n * 3.2 + n2 * 1.8))];
    });
    const brush = (x, z, r, fn) => W.eachCol(x - r, z - r, x + r, z + r, (bx, bz, i, px, pz) => { const d = Math.hypot(px - x, pz - z); if (d < r && W.H[i] >= 1 && inPark(px, pz, -0.1)) fn(i, d, bx, bz); });
    const paint = (i, d, r, bx, bz) => { pathMask[i] = 1; C[i] = d > r - 0.3 ? k.pathEdge : k.path[Math.floor(hash(bx >> 2, bz >> 2) * 3)]; };
    for (const p of PATHS) {
      const r = p.w / 2;
      for (let j = 0; j < p.pts.length - 1; j++) {
        const [ax, az] = p.pts[j], [bx, bz] = p.pts[j + 1], L = Math.hypot(bx - ax, bz - az);
        for (let s = 0; s <= L; s += 0.5) { const x = ax + (bx - ax) * s / L, z = az + (bz - az) * s / L; brush(x, z, r, (i, d, bx2, bz2) => { if (pathMask[i] === 1 && C[i] !== k.pathEdge) return; paint(i, d, r, bx2, bz2); }); }
      }
    }
    // plazas: fountain, carousel, bandshell forecourt, rink surround
    const plaza = (x, z, r) => brush(x, z, r, (i, d, bx, bz) => { pathMask[i] = 1; C[i] = d > r - 0.35 ? k.pathEdge : ((bx >> 2) + (bz >> 2)) & 1 ? k.path[0] : k.path[2]; });
    plaza(F.fountain[0], F.fountain[1], 9); plaza(F.carousel[0], F.carousel[1], 9.5); plaza(-40, -255, 4.6);
    W.eachCol(-21, -258, 1, -246, (bx, bz, i) => { pathMask[i] = 1; C[i] = k.path[(bx + bz) & 1 ? 0 : 1]; });   // chair area
    W.tDirty = true;
  });

  // ------------------------------------------------------------ models
  const gc = {};
  const G = (n, f) => gc[n] || (gc[n] = f());
  const chairGeo = () => G('chair', () => { const k = pal(), m = new AF.Model(4, 7, 4); m.box(0, 0, 0, 1, 3, 1, k.woodD); m.box(3, 0, 0, 4, 3, 1, k.woodD); m.box(0, 0, 3, 1, 7, 4, k.woodD); m.box(3, 0, 3, 4, 7, 4, k.woodD); m.box(0, 3, 0, 4, 4, 4, k.jade); m.box(0, 5, 3, 4, 7, 4, k.jade); return AF.meshModel(m, { vs: 1 / 8 }); });
  const boatGeo = () => G('boat', () => {
    const k = pal(), m = new AF.Model(26, 6, 11);
    for (let x = 0; x < 26; x++) { const t = Math.sin(Math.PI * (x + 0.5) / 26), hw = Math.max(1, Math.round(5.2 * Math.pow(t, 0.55))); for (let z = 5 - hw; z <= 5 + hw; z++) for (let y = 0; y < 5; y++) { const edge = z === 5 - hw || z === 5 + hw || y === 0 || x === 0 || x === 25; const lo = y < 3 && Math.abs(z - 5) > hw - 1 - (2 - y); if (edge || lo) m.set(x, y, z, y === 4 ? k.woodD : y === 3 ? k.red : k.white); } }
    for (let x = 1; x < 25; x++) for (let z = 1; z < 10; z++) if (m.get(x, 1, z) === 0 && m.get(x, 2, z - 1) && m.get(x, 2, z + 1) !== undefined) m.set(x, 1, z, k.plank);
    for (const x of [7, 13, 19]) m.box(x, 3, 2, x + 2, 4, 9, k.woodL);
    return AF.meshModel(m, { vs: 1 / 8 });
  });
  const figureGeo = (v) => G('fig' + v, () => {
    const k = pal(), m = new AF.Model(4, 14, 3), shirt = [k.red, k.navy, k.jade, k.yellow][v % 4], sk = v % 3 === 2 ? k.skin2 : k.skin;
    m.box(0, 0, 0, 2, 6, 3, k.navy); m.box(2, 0, 0, 4, 6, 3, k.navy); m.box(0, 0, 0, 4, 1, 3, k.black);
    m.box(0, 6, 0, 4, 11, 3, shirt); m.box(1, 11, 0, 3, 14, 3, sk); m.box(1, 13, 0, 3, 14, 3, v % 2 ? k.hair : k.yellow);
    return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] });
  });
  const rowerGeo = () => G('rower', () => {
    const k = pal(), m = new AF.Model(5, 9, 28);
    m.box(1, 0, 12, 4, 4, 16, k.navy); m.box(1, 4, 12, 4, 7, 16, k.white); m.box(2, 7, 13, 3, 9, 15, k.skin); m.box(1, 8, 13, 4, 9, 15, k.canvasW);
    m.line(2, 5, 0, 2, 5, 27, k.woodL); m.box(2, 4, 0, 3, 6, 3, k.woodD); m.box(2, 4, 25, 3, 6, 28, k.woodD);
    return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] });
  });
  const horseGeo = (v) => G('horse' + v, () => {
    const k = pal(), body = [k.white, k.cream2, k.woodL][v % 3], sad = [k.red, k.jade, k.navy][v % 3], m = new AF.Model(18, 16, 6);
    m.box(3, 6, 1, 14, 10, 5, body); m.box(13, 9, 1, 16, 14, 5, body); m.box(15, 12, 1, 18, 14, 5, body); m.box(12, 12, 2, 14, 15, 4, k.gold);
    for (const [x, dy] of [[3, 2], [5, 0], [12, 1], [14, 3]]) { m.box(x, dy, 1, x + 1, 6, 2, body); m.box(x, dy, 4, x + 1, 6, 5, body); }
    m.box(1, 7, 2, 3, 9, 4, k.gold); m.box(6, 10, 1, 10, 11, 5, sad); m.box(6, 9, 0, 10, 10, 6, k.gold);
    return AF.meshModel(m, { vs: 1 / 12, anchor: [0.5, 0, 0.5] });
  });
  const tableGeo = () => G('chess', () => { const k = pal(), m = new AF.Model(8, 6, 8); m.box(3, 0, 3, 5, 5, 5, k.stoneD); m.box(0, 5, 0, 8, 6, 8, k.coping); for (let x = 0; x < 8; x++) for (let z = 0; z < 8; z++) if (x > 0 && x < 7 && z > 0 && z < 7 && ((x + z) & 1)) m.set(x, 5, z, k.black); return AF.meshModel(m, { vs: 1 / 8 }); });
  const stoolGeo = () => G('stool', () => { const k = pal(), m = new AF.Model(3, 4, 3); m.box(1, 0, 1, 2, 3, 2, k.stoneD); m.box(0, 3, 0, 3, 4, 3, k.coping); return AF.meshModel(m, { vs: 1 / 8 }); });
  const cartGeo = () => G('cart', () => {
    const k = pal(), m = new AF.Model(16, 30, 9);
    m.box(1, 3, 1, 15, 9, 8, k.chrome); m.box(1, 5, 0, 15, 7, 1, k.red); m.box(0, 9, 0, 16, 10, 9, k.chrome);
    for (const x of [2, 13]) { m.box(x, 0, 0, x + 1, 3, 2, k.black); m.box(x, 0, 7, x + 1, 3, 9, k.black); }
    m.box(3, 10, 2, 6, 12, 5, k.chrome); m.box(8, 10, 3, 10, 11, 5, k.yellow); m.box(11, 10, 3, 13, 11, 5, k.red);
    m.box(7, 10, 4, 8, 26, 5, k.chrome);
    for (let x = 0; x < 16; x++) for (let z = -3; z < 12; z++) { const d = Math.hypot(x - 7.5, z - 4.5); if (d < 8) m.set(x, 26 - Math.floor(d / 4), Math.max(0, Math.min(8, z)), (Math.floor(Math.atan2(z - 4.5, x - 7.5) * 2.5) & 1) ? k.canvasR : k.canvasW); }
    return AF.meshModel(m, { vs: 1 / 8 });
  });
  const statueGeo = (v) => G('statue' + v, () => {
    const k = pal(), m = new AF.Model(12, 34, 12);
    m.box(0, 0, 0, 12, 2, 12, k.stoneD); m.box(1, 2, 1, 11, 12, 11, k.coping); m.box(0, 12, 0, 12, 13, 12, k.stoneD);
    m.box(3, 13, 3, 9, 15, 9, k.bronzeD);
    m.box(4, 15, 5, 6, 22, 7, k.bronze); m.box(6, 15, 5, 8, 22, 7, k.bronze); m.box(3, 22, 4, 9, 29, 8, k.bronze); m.box(5, 29, 5, 7, 32, 7, k.bronzeD);
    if (v) { m.box(9, 26, 5, 11, 33, 7, k.bronze); m.box(9, 32, 4, 11, 34, 8, k.bronzeD); } else { m.box(1, 23, 5, 3, 28, 7, k.bronze); m.box(9, 23, 5, 11, 28, 7, k.bronze); m.box(4, 32, 4, 8, 33, 8, k.bronzeD); }
    for (let x = 2; x < 10; x += 2) m.set(x, 7, 11, k.gold);
    return AF.meshModel(m, { vs: 1 / 8 });
  });
  // slim park-green lamp standard (3.6 m) with a pear globe: fluted base, collar, scroll arms, finial (1/16 m)
  const parkLampGeo = () => G('plamp', () => {
    const k = pal(), c = AF.col, green = c(0x2f4a3a, { jitter: 0.1, edge: 0.3, metal: 0.4, rough: 0.45 }), greenD = c(0x22372b, { jitter: 0.1, edge: 0.3, metal: 0.4, rough: 0.5 });
    const globe = c(0xfff1d0, { emit: 0xffc878, emitK: 2.4, mode: 'night', jitter: 0, edge: 0 }), m = new AF.Model(11, 64, 11);
    m.box(2, 0, 2, 9, 2, 9, greenD); m.box(3, 2, 3, 8, 9, 8, green); for (let y = 2; y < 9; y++) for (const [x, z] of [[3, 5], [7, 5], [5, 3], [5, 7]]) m.set(x, y, z, greenD);
    m.box(3, 9, 3, 8, 10, 8, k.brass); m.box(4, 10, 4, 7, 50, 7, green); for (let y = 12; y < 48; y += 6) m.box(4, y, 4, 7, y + 1, 7, greenD);
    m.box(3, 50, 3, 8, 52, 8, green); m.box(3, 52, 3, 8, 53, 8, k.brass);
    for (const [dx, dz] of [[-1, 0], [1, 0]]) { m.set(5 + dx * 2, 49, 5, greenD); m.set(5 + dx * 3, 50, 5 + dz, greenD); }
    for (let y = 53; y < 62; y++) { const t = (y - 53) / 9, r = 1.2 + Math.sin(Math.min(1, t * 1.25) * Math.PI) * 2.3 - t * 0.9; for (let x = 0; x < 11; x++) for (let z = 0; z < 11; z++) if (Math.hypot(x - 5, z - 5) < r) m.set(x, y, z, globe); }
    m.box(4, 61, 4, 7, 62, 7, green); m.box(5, 62, 5, 6, 64, 6, k.brass);
    return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
  });
  // the Harbour Pioneers column (1/8 m): stepped plinth, bronze plaque, fluted shaft, gilded capital
  const columnGeo = () => G('pcol', () => {
    const k = pal(), m = new AF.Model(24, 92, 24), cx = 12, cz = 12;
    m.box(0, 0, 0, 24, 2, 24, k.stoneD); m.box(2, 2, 2, 22, 4, 22, k.stone); m.box(5, 4, 5, 19, 20, 19, k.coping); m.box(4, 20, 4, 20, 22, 20, k.stoneD);
    m.box(7, 8, 19, 17, 16, 20, k.bronze); m.box(8, 9, 19, 16, 15, 20, k.bronzeD); for (let x = 8; x < 16; x += 2) m.set(x, 12, 19, k.gold);
    for (let y = 22; y < 80; y++) for (let x = 6; x < 18; x++) for (let z = 6; z < 18; z++) { const dx = x + 0.5 - cx, dz = z + 0.5 - cz, d = Math.hypot(dx, dz), r = 4.6 - (y - 22) * 0.012; if (d < r) { const fl = Math.cos(Math.atan2(dz, dx) * 8) > 0.55 && d > r - 1; if (!fl) m.set(x, y, z, k.coping); } }
    m.box(6, 80, 6, 18, 82, 18, k.gold); m.box(5, 82, 5, 19, 84, 19, k.stoneD); m.box(8, 84, 8, 16, 86, 16, k.coping);
    return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] });
  });
  const standGeo = () => G('mstand', () => { const k = pal(), m = new AF.Model(4, 10, 3); m.box(2, 0, 1, 3, 7, 2, k.black); m.box(0, 7, 0, 4, 10, 1, k.black); m.box(0, 8, 1, 4, 10, 2, k.white); return AF.meshModel(m, { vs: 1 / 8 }); });
  const pianoGeo = () => G('piano', () => { const k = pal(), m = new AF.Model(12, 10, 5); m.box(0, 0, 0, 12, 10, 3, k.black); m.box(0, 5, 3, 12, 6, 5, k.black); m.box(1, 6, 3, 11, 7, 4, k.white); m.box(0, 0, 3, 1, 5, 5, k.black); m.box(11, 0, 3, 12, 5, 5, k.black); return AF.meshModel(m, { vs: 1 / 8 }); });
  const drumGeo = () => G('drum', () => { const k = pal(), m = new AF.Model(10, 8, 8); m.sphere(5, 3, 4, 3.2, k.red, (x, y, z) => (Math.hypot(x + 0.5 - 5, y + 0.5 - 3) < 3.2 && z > 1 && z < 6 ? (z === 2 || z === 5 ? k.white : k.red) : 0)); m.box(1, 5, 6, 3, 6, 8, k.gold); m.box(7, 6, 6, 9, 7, 8, k.gold); return AF.meshModel(m, { vs: 1 / 8 }); });
  const oarRackGeo = () => G('oars', () => { const k = pal(), m = new AF.Model(16, 22, 3); m.box(0, 4, 0, 16, 5, 3, k.woodD); m.box(0, 18, 0, 16, 19, 3, k.woodD); for (let x = 1; x < 16; x += 2) { m.box(x, 2, 1, x + 1, 21, 2, k.woodL); m.box(x, 2, 1, x + 1, 6, 2, k.plank); } return AF.meshModel(m, { vs: 1 / 8 }); });
  const counterGeo = () => G('counter', () => { const k = pal(), m = new AF.Model(20, 9, 5); m.box(0, 0, 0, 20, 8, 5, k.woodD); m.box(0, 8, 0, 20, 9, 5, k.woodL); m.box(1, 2, 5 - 1, 19, 6, 5, k.jade); return AF.meshModel(m, { vs: 1 / 8 }); });
  const skatesGeo = () => G('skates', () => { const k = pal(), m = new AF.Model(20, 20, 3); for (let y = 0; y < 20; y += 5) { m.box(0, y, 0, 20, y + 1, 3, k.woodD); for (let x = 1; x < 19; x += 3) { m.box(x, y + 1, 0, x + 2, y + 3, 2, (x + y) & 1 ? k.white : k.blackD || k.black); m.set(x, y + 1, 2, k.chrome); } } return AF.meshModel(m, { vs: 1 / 8 }); });
  const swingFrameM = () => { const k = pal(), m = new AF.Model(48, 22, 12); for (const x of [0, 47]) { m.line(x, 0, 0, x, 21, 6, k.red, 0); m.line(x, 0, 11, x, 21, 6, k.red, 0); } m.box(0, 21, 5, 48, 22, 7, k.red); return m; };

  // lamp posts, benches (shared from 11-streets)
  const ST = () => AF.streets || {};
  const put = (geo, x, y, z, rot, col) => AF.placeStatic(geo, x, y, z, rot, { collide: !!col });
  const occ = [];
  const block = (x0, z0, x1, z1) => occ.push([x0, z0, x1, z1]);
  const isFree = (x, z, m = 0) => { for (const o of occ) if (x > o[0] - m && x < o[2] + m && z > o[1] - m && z < o[3] + m) return false; return true; };

  // ------------------------------------------------------------ FEATURES (order 400)
  AF.onBuild('park-features', 400, () => {
    const k = pal(), lakeY = (AF.land && AF.land.LAKE_Y) ?? LK.waterY ?? -0.75, pondY = (AF.land && AF.land.POND_Y) ?? -0.5;
    const cnt = PKS.counts = { trees: 0, benches: 0, chairs: 0, boats: 0, lamps: 0, gates: 0, flowerBeds: 0, shrubs: 0 };
    const t0 = performance.now();
    // ---- feature footprints (keep trees out)
    block(-22, -275, 2, -244);                   // bandshell + chairs
    block(F.carousel[0] - 10, F.carousel[1] - 10, F.carousel[0] + 10, F.carousel[1] + 10);
    block(F.fountain[0] - 10, F.fountain[1] - 10, F.fountain[0] + 10, F.fountain[1] + 10);
    block(24, -248, 44, -238); block(44, -244, 66, -228);   // pavilion, roller rink
    block(-143, -202, -122, -182);                 // playground
    block(-114, -224, -98, -210);                  // boathouse
    block(-99, -281, -85, -267);                   // gazebo
    block(-54, -196, -40, -184);                   // chess
    block(-24, -194, 12, -182);                    // hot dogs + balloons + statue lawn
    block(-67, -262, -61, -214);                   // footbridge

    // ---- WALL + RAILINGS round the park, 6 gates
    const gates = [[-40, PK.z1, 'z'], [0, PK.z1, 'z'], [-80, PK.z1, 'z'], [PK.x0, -225, 'x'], [PK.x1, -215, 'x'], [-40, PK.z0, 'z']];
    const inGate = (x, z) => gates.some(([gx, gz, ax]) => ax === 'z' ? (Math.abs(z - gz) < 1 && Math.abs(x - gx) < 2.75) : (Math.abs(x - gx) < 1 && Math.abs(z - gz) < 2.75));
    const wallRun = (x0, z0, x1, z1) => {
      const L = Math.hypot(x1 - x0, z1 - z0), dx = (x1 - x0) / L, dz = (z1 - z0) / L;
      for (let s = 0; s < L; s += 0.25) {
        const x = x0 + dx * s, z = z0 + dz * s;
        if (inGate(x, z)) continue;
        const px = Math.abs(dx) > 0.5 ? 0 : 0.25, pz = Math.abs(dx) > 0.5 ? 0.25 : 0;
        W.fill(x, 0.25, z, x + 0.25 + px, 0.75, z + 0.25 + pz, k.stone);
        W.fill(x, 0.75, z, x + 0.25 + px, 1.0, z + 0.25 + pz, k.coping);
        const si = Math.round(s * 4);
        if (si % 2 === 0) { W.fill(x, 1.0, z, x + 0.25, 2.0, z + 0.25, k.iron); if (si % 4 === 0) W.setM(x + 0.1, 2.1, z + 0.1, k.gold); }
        W.fill(x, 1.75, z, x + 0.25, 2.0, z + 0.25, k.iron);
        if (si % 32 === 0) W.fill(x - 0.25, 0.25, z - 0.25, x + 0.5, 1.25, z + 0.5, k.coping);
      }
    };
    const x0 = PK.x0, x1 = PK.x1 - 0.5, z0 = PK.z0, z1 = PK.z1 - 0.5;
    wallRun(x0, z1, x1, z1); wallRun(x0, z0, x1, z0); wallRun(x0, z0, x0, z1); wallRun(x1, z0, x1 + 0.01, z1);
    // south wall & gates: colliders are the voxels; gate piers with deco lamps
    for (const [gx, gz, ax] of gates) {
      for (const e of [-1, 1]) {
        const px = ax === 'z' ? gx + e * 3.25 : (gx === PK.x0 ? PK.x0 + 0.25 : PK.x1 - 0.25), pz = ax === 'z' ? (gz === PK.z1 ? PK.z1 - 0.25 : PK.z0 + 0.25) : gz + e * 3.25;
        W.fill(px - 0.5, 0.25, pz - 0.5, px + 0.5, 2.5, pz + 0.5, k.stone);
        W.fill(px - 0.625, 0.25, pz - 0.625, px + 0.625, 0.5, pz + 0.625, k.stoneD);
        W.fill(px - 0.625, 2.5, pz - 0.625, px + 0.625, 2.75, pz + 0.625, k.coping);
        for (const yy of [1.25, 1.75]) W.fill(px - 0.5, yy, pz - 0.5, px + 0.5, yy + 0.25, pz + 0.5, k.cream);
        W.fill(px - 0.25, 2.75, pz - 0.25, px + 0.25, 3.0, pz + 0.25, k.gold);
        W.fill(px - 0.25, 3.0, pz - 0.25, px + 0.25, 3.5, pz + 0.25, k.glow);
        W.setM(px, 3.6, pz, k.gold);
        AF.addLight({ x: px, y: 3.3, z: pz, color: 0xffd9a0, intensity: 0.8, range: 8, kind: 'porch' });
      }
      // arched iron overthrow with a gold sunburst
      const ov = (ax === 'z');
      for (let t = -2.75; t < 2.75; t += 0.25) { const yy = 3.0 + Math.cos(t / 2.75 * Math.PI / 2) * 0.75; if (ov) W.fill(gx + t, yy, (gz === PK.z1 ? PK.z1 - 0.375 : PK.z0 + 0.125), gx + t + 0.25, yy + 0.25, (gz === PK.z1 ? PK.z1 - 0.125 : PK.z0 + 0.375), k.iron); else W.fill(gx === PK.x0 ? PK.x0 + 0.125 : PK.x1 - 0.375, yy, gz + t, gx === PK.x0 ? PK.x0 + 0.375 : PK.x1 - 0.125, yy + 0.25, gz + t + 0.25, k.iron); }
      cnt.gates++;
    }

    // ---- SWAN LAKE: boathouse + jetty, footbridge, gazebo
    {
      // boathouse x -112..-102, z -222..-214 (half over the water on piles), door south onto the loop path, boat door north
      const bx0 = -112, bx1 = -102, bz0 = -222, bz1 = -214, fy = 0.5;
      for (let x = bx0; x < bx1; x += 2) for (let z = bz0; z < bz1; z += 2) W.fill(x, -2.5, z, x + 0.25, fy, z + 0.25, k.woodD);
      W.fill(bx0, 0.25, bz0, bx1, fy, bz1, k.plank);
      W.walls(bx0, fy, bz0, bx1, fy + 3.5, bz1, k.cream);
      for (let y = fy; y < fy + 3.5; y += 0.5) { W.fill(bx0, y, bz0, bx1, y + 0.25, bz0 + 0.25, k.cream2); W.fill(bx0, y, bz1 - 0.25, bx1, y + 0.25, bz1, k.cream2); }
      W.fill(bx0, fy, bz0, bx1, fy + 0.5, bz1, k.jadeD); W.clear(bx0 + 0.25, fy, bz0 + 0.25, bx1 - 0.25, fy + 0.5, bz1 - 0.25); W.fill(bx0 + 0.25, fy - 0.25, bz0 + 0.25, bx1 - 0.25, fy, bz1 - 0.25, k.plank);
      // doors: south 2 m x 2.75 m, north boat door 4 m
      W.clear(-108, fy, bz1 - 0.25, -106, fy + 2.75, bz1); W.clear(-109, fy, bz0, -105, fy + 2.75, bz0 + 0.25);
      // windows (glass) with jade frames
      for (const x of [-111, -104]) { W.fill(x, fy + 1.25, bz1 - 0.25, x + 1.25, fy + 2.5, bz1, AF.col('glass')); W.fill(x - 0.25, fy + 1.0, bz1 - 0.25, x + 1.5, fy + 1.25, bz1, k.jade); }
      for (const z of [-220, -217]) { W.fill(bx0, fy + 1.25, z, bx0 + 0.25, fy + 2.5, z + 1.25, AF.col('glass')); W.fill(bx1 - 0.25, fy + 1.25, z, bx1, fy + 2.5, z + 1.25, AF.col('glass')); }
      // roof: stepped deco hip in copper green with a cream band + a sign
      for (let i = 0; i < 5; i++) W.fill(bx0 - 0.5 + i * 0.75, fy + 3.5 + i * 0.25, bz0 - 0.5 + i * 0.5, bx1 + 0.5 - i * 0.75, fy + 3.75 + i * 0.25, bz1 + 0.5 - i * 0.5, i === 0 ? k.cream : (i & 1) ? k.copper : k.copperD);
      W.fill(-107.25, fy + 4.75, -218.25, -106.75, fy + 6.25, -217.75, k.jade); W.setM(-107, fy + 6.4, -218, k.gold);
      const sign = AF.textModel('BOATHOUSE', k.signFg, { bg: k.signBg, pad: 1 });
      put(AF.meshModel(sign, { vs: 1 / 16 }), -107, fy + 2.85, bz1 + 0.02, 0, false);
      // interior: oar racks, a boat up on trestles, counter, lamps
      put(oarRackGeo(), -111.5, fy, -219, 1, false); put(oarRackGeo(), -102.6, fy, -219, 3, false);
      put(boatGeo(), -107, fy + 0.6, -219.5, 0, false);
      put(counterGeo(), -109.5, fy, -215.2, 0, true);
      W.fill(-107.25, fy + 3.0, -218.25, -106.75, fy + 3.25, -217.75, k.glowA); W.fill(-110.25, fy + 3.0, -216.25, -109.75, fy + 3.25, -215.75, k.glowA);
      AF.addLight({ x: -107, y: 3.2, z: -218, color: 0xffd9a0, intensity: 1, range: 9, kind: 'interior' });
      // runner rug, lifebuoys on the walls, a price board, rope coils, a lantern on the jetty door
      W.fill(-108, fy - 0.25, -221.5, -106, fy, -214.25, k.jadeD); W.fill(-107.75, fy - 0.25, -221.25, -106.25, fy, -214.5, k.redD);
      for (const [x, z, sx] of [[bx0 + 0.25, -216, 1], [bx1 - 0.5, -216, -1]]) for (let a = 0; a < 16; a++) { const ang = a / 16 * Math.PI * 2, yy = fy + 2.0 + Math.sin(ang) * 0.5, zz = z + Math.cos(ang) * 0.5; W.fill(x, yy, zz, x + 0.25, yy + 0.25, zz + 0.25, (a >> 2) & 1 ? k.white : k.red); }
      put(AF.meshModel(AF.textModel('BOATS 25C AN HOUR', k.boardD, { bg: k.board, pad: 1 }), { vs: 1 / 24 }), -107, fy + 2.3, bz1 - 0.3, 2, false);
      for (const [x, z] of [[-111.2, -214.8], [-102.8, -221.2]]) { W.fill(x - 0.25, fy, z - 0.25, x + 0.25, fy + 0.25, z + 0.25, k.woodL); W.fill(x - 0.125, fy + 0.25, z - 0.125, x + 0.125, fy + 0.5, z + 0.125, k.woodL); }
      W.fill(-107.125, fy + 2.9, bz0 - 0.5, -106.875, fy + 3.2, bz0 - 0.25, k.glow);
      AF.addBuilding({ id: 'park-boathouse', name: 'Swan Lake Boathouse', kind: 'park', box: [bx0, 0.25, bz0, bx1, fy + 4.5, bz1], doors: [{ x: -107, y: 0.25, z: bz1 + 0.8, yaw: Math.PI }], floors: [fy], interior: true });
      AF.addSpot({ building: 'park-boathouse', x: -109.5, y: fy, z: -216.2, yaw: 0, kind: 'counter', path: [[-107, -213.2], [-107, -215.5], [-109.5, -216.2]] });
      // round 2 interior: potbelly stove (smoke from the roof), a cat asleep on a coil of rope, paint shelf, a net + mounted pike,
      // the regatta chalkboard, a burgee on the roof finial
      {
        const c = AF.col, iron2 = c(0x2a2826, { jitter: 0.1, edge: 0.3, metal: 0.3, rough: 0.5 }), ember = c(0xff7a30, { emit: 0xff5a1a, emitK: 2.2, mode: 'always', jitter: 0.2, edge: 0 });
        const stove = G('stove', () => { const m = new AF.Model(6, 40, 6); m.box(0, 0, 0, 6, 1, 6, iron2); m.box(1, 1, 1, 5, 7, 5, iron2); m.box(0, 3, 0, 6, 5, 6, iron2); m.box(2, 3, 5, 4, 5, 6, ember); m.box(1, 7, 1, 5, 8, 5, k.brass); m.box(2, 8, 2, 4, 40, 4, iron2); return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); });
        put(stove, -103.1, fy, -215.1, 2, true); if (typeof AF.addChimney === 'function') AF.addChimney(-103.1, fy + 5.3, -215.1); W.fill(-103.25, fy + 3.5, -215.25, -103.0, fy + 5.25, -215.0, iron2);
        const coil = G('coilcat', () => { const m = new AF.Model(10, 4, 10), rope = c(0xc8a870, { jitter: 0.25 }), cat = c(0xd88a3a, { jitter: 0.15 }), catD = c(0xa8622a, { jitter: 0.15 });
          for (let x = 0; x < 10; x++) for (let z = 0; z < 10; z++) { const d = Math.hypot(x - 4.5, z - 4.5); if (d < 5 && d > 1.2) m.set(x, 0, z, rope); if (d < 4.6 && d > 2) m.set(x, 1, z, rope); }
          m.box(2, 2, 3, 7, 4, 7, cat); m.box(6, 2, 2, 8, 4, 4, cat); m.set(7, 4, 2, catD); m.set(6, 4, 3, catD); m.box(1, 2, 6, 3, 3, 8, catD); m.box(3, 3, 4, 6, 4, 5, catD); return AF.meshModel(m, { vs: 1 / 12, anchor: [0.5, 0, 0.5] }); });
        put(coil, -104.3, fy, -221.0, 0, false);
        const shelf = G('paints', () => { const m = new AF.Model(14, 14, 4), cols = [k.red, k.white, k.jade, k.navy, k.yellow]; m.box(0, 0, 0, 1, 14, 4, k.woodD); m.box(13, 0, 0, 14, 14, 4, k.woodD); for (const y of [0, 5, 10]) { m.box(0, y, 0, 14, y + 1, 4, k.woodL); for (let x = 1; x < 13; x += 3) m.box(x, y + 1, 1, x + 2, y + 4, 3, cols[(x + y) % 5]); } return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); });
        put(shelf, -110.6, fy, -221.45, 0, false);
        const net = G('netwall', () => { const m = new AF.Model(24, 16, 1), nc = c(0x8a7a5a, { jitter: 0.2 }), fish = c(0x6a7a5a, { jitter: 0.2 }); for (let x = 0; x < 24; x++) for (let y = 0; y < 12; y++) if ((x + y) % 3 === 0 || (x - y + 30) % 3 === 0) if (y > 2 + Math.abs(x - 12) * 0.2) m.set(x, y, 0, nc);
          m.box(4, 13, 0, 20, 16, 1, k.woodD); m.box(6, 14, 0, 18, 15, 1, fish); m.set(17, 14, 0, k.black); m.box(2, 2, 0, 4, 4, 1, k.red); m.box(19, 5, 0, 21, 7, 1, k.white); return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); });
        put(net, -103.7, fy + 1.0, -221.7, 0, false);
        put(AF.meshModel(AF.textModel('REGATTA SAT 2 PM', k.white, { bg: c(0x2a3a30, { jitter: 0.05 }), pad: 2 }), { vs: 1 / 40, anchor: [0.5, 0, 0] }), -110.4, fy + 2.05, -221.72, 0, false);
        W.fill(-107.125, fy + 6.25, -218.125, -106.875, fy + 8.5, -217.875, k.woodL);
        if (typeof AF.makeFlag === 'function') AF.makeFlag({ x: -107, y: fy + 8.5, z: -218, w: 1.4, h: 0.8, design: 'burgee', colors: ['#2e8a7a', '#f4f1ea'] });
        // exposed rafters, a varnished canoe slung from them, a workbench with tools, life jackets on hooks, a wall clock
        for (const z of [-221.0, -219.5, -217.0, -215.0]) W.fill(bx0 + 0.25, fy + 3.0, z, bx1 - 0.25, fy + 3.25, z + 0.25, k.woodD);
        const canoe = G('canoe', () => { const m = new AF.Model(30, 4, 6), v = c(0xb8743a, { jitter: 0.2, rough: 0.35 }); for (let x = 0; x < 30; x++) { const w = Math.max(1, Math.round(Math.sin((x + 0.5) / 30 * Math.PI) * 3)); m.box(x, 0, 3 - w, x + 1, x > 2 && x < 27 ? 3 : 2, 3 + w, v); if (x > 3 && x < 26) m.box(x, 0, 3 - w + 1, x + 1, 2, 3 + w - 1, 0); } for (const x of [8, 21]) m.box(x, 3, 2, x + 1, 4, 4, k.woodD); return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); });
        put(canoe, -107, fy + 2.5, -216.0, 0, false);
        const bench = G('wbench', () => { const m = new AF.Model(20, 14, 5); m.box(0, 6, 0, 20, 7, 5, k.woodL); for (const x of [0, 18]) m.box(x, 0, 0, x + 2, 6, 5, k.woodD); m.box(0, 7, 4, 20, 14, 5, k.woodD); m.box(2, 9, 3, 3, 13, 4, k.iron); m.box(5, 10, 3, 9, 11, 4, k.iron); m.box(11, 8, 3, 12, 13, 4, k.woodL); m.box(14, 9, 3, 17, 12, 4, k.red); m.box(3, 7, 1, 7, 9, 3, k.jade); m.box(12, 7, 1, 14, 8, 4, k.chrome); return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); });
        put(bench, -104.0, fy, -214.62, 0, true);
        const jackets = G('ljack', () => { const m = new AF.Model(16, 8, 2), o = c(0xe86a2a, { jitter: 0.1 }); m.box(0, 7, 0, 16, 8, 1, k.woodD); for (let x = 1; x < 16; x += 5) { m.box(x, 1, 1, x + 4, 7, 2, o); m.box(x + 1, 2, 1, x + 3, 3, 2, k.white); } return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); });
        put(jackets, -110.6, fy + 0.4, -214.45, 2, false);
        const clock = G('wclock', () => { const m = new AF.Model(7, 7, 1), f = c(0xf4efe0, { jitter: 0.02 }); for (let x = 0; x < 7; x++) for (let y = 0; y < 7; y++) { const d = Math.hypot(x - 3, y - 3); if (d < 3.6) m.set(x, y, 0, d > 2.7 ? k.brass : f); } m.box(3, 3, 0, 4, 6, 1, k.black); m.box(3, 3, 0, 6, 4, 1, k.black); return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] }); });
        put(clock, -107, fy + 3.05, -214.45, 2, false);
        PKS.parts = PKS.parts || {}; PKS.parts.clock = clock;
      }
      // jetty north into the lake
      for (let z = -234; z < bz0; z += 0.5) W.fill(-108, fy - 0.25, z, -106, fy, z + 0.375, k.plank);
      for (let z = -234; z < bz0; z += 2) for (const x of [-108, -106.25]) W.fill(x, -2.5, z, x + 0.25, fy + 0.75, z + 0.25, k.woodD);
      W.fill(-110, fy - 0.25, -236, -104, fy, -234, k.plank);
      for (const x of [-110, -104.25]) W.fill(x, -2.5, -236, x + 0.25, fy + 0.75, -235.75, k.woodD);
      AF.addSpot({ building: 'park-lake', x: -107, y: fy, z: -235, yaw: Math.PI, kind: 'fish' });
      // ---- footbridge across the east tip (x -64, z -256..-220), arched, stepped by 0.25 m
      const zA = -259, zB = -217, mid = (zA + zB) / 2, half = (zB - zA) / 2;
      for (let z = zA; z < zB; z += 0.25) {
        const u = 1 - Math.abs(z + 0.125 - mid) / half, top = 0.25 + Math.round(Math.min(1, u * 1.6) * 6) * 0.25;
        if (top <= 0.25) continue;
        W.fill(-65.5, top - 0.5, z, -62.5, top, z + 0.25, k.plank);
        W.fill(-65.75, top - 0.75, z, -65.5, top + 0.75, z + 0.25, k.coping); W.fill(-62.5, top - 0.75, z, -62.25, top + 0.75, z + 0.25, k.coping);
        if (Math.round(z * 4) % 12 === 0) { W.fill(-65.75, top + 0.75, z, -65.5, top + 1.0, z + 0.25, k.gold); W.fill(-62.5, top + 0.75, z, -62.25, top + 1.0, z + 0.25, k.gold); }
        const i = W.col(-64, z + 0.1); if (i >= 0 && W.H[i] < 1) { W.fill(-65.75, -2, z, -65.5, top - 0.5, z + 0.25, k.stoneD); W.fill(-62.5, -2, z, -62.25, top - 0.5, z + 0.25, k.stoneD); }
      }
      AF.addLabel('Swan Lake', LK.cx, LK.cz, 'place');
      // ---- gazebo on the north shore (-92, -274): 8 posts, raised floor, copper dome, benches
      const gx = -92, gz = -274, gr = 4;
      W.eachCol(gx - gr - 0.5, gz - gr - 0.5, gx + gr + 0.5, gz + gr + 0.5, (bx, bz, i, x, z) => { if (Math.hypot(x - gx, z - gz) < gr + 0.3) W.fill(x - 0.125, 0.25, z - 0.125, x + 0.125, 0.5, z + 0.125, Math.hypot(x - gx, z - gz) > gr - 0.3 ? k.coping : k.plank); });
      for (let a = 0; a < 8; a++) { const ang = a / 8 * Math.PI * 2 + Math.PI / 8, px = gx + Math.cos(ang) * (gr - 0.4), pz = gz + Math.sin(ang) * (gr - 0.4); W.fill(px - 0.125, 0.5, pz - 0.125, px + 0.125, 3.5, pz + 0.125, k.white); if (a !== 1) W.fill(px - 0.125, 0.5, pz - 0.125, px + 0.125, 1.25, pz + 0.125, k.white); }
      for (let y = 0; y < 12; y++) { const rr = (gr + 0.4) * Math.cos(y / 12 * Math.PI / 2); W.eachCol(gx - rr, gz - rr, gx + rr, gz + rr, (bx, bz, i, x, z) => { const d = Math.hypot(x - gx, z - gz); if (d < rr && d > rr - 0.6) W.fill(x - 0.125, 3.5 + y * 0.25, z - 0.125, x + 0.125, 3.75 + y * 0.25, z + 0.125, y === 0 ? k.cream : (y & 1) ? k.copper : k.copperD); }); }
      W.fill(gx - 0.125, 6.5, gz - 0.125, gx + 0.125, 7.25, gz + 0.125, k.gold);
      W.fill(gx - 0.25, 3.25, gz - 0.25, gx + 0.25, 3.5, gz + 0.25, k.glowA);
      AF.addLight({ x: gx, y: 3.3, z: gz, color: 0xffd9a0, intensity: 0.8, range: 8, kind: 'porch' });
      for (const [dx, dz, yaw] of [[-2.5, 0, Math.PI / 2], [2.5, 0, -Math.PI / 2]]) { const g = ST().benchGeo ? ST().benchGeo() : null; if (g) put(g, gx + dx, 0.5, gz + dz, dx < 0 ? 3 : 1, true); AF.addSpot({ x: gx + dx, y: 0.5 + 0.5, z: gz + dz, yaw, kind: 'bench' }); }
    }

    // ---- THE BANDSHELL (-10,-262): stage + concentric telescoping deco shell + 6-piece band + 60 chairs
    {
      const cx = F.bandshell[0], sy = 1.25;
      W.fill(cx - 9, 0.25, -272, cx + 9, sy, -262, k.stone); W.fill(cx - 9, sy - 0.25, -272, cx + 9, sy, -262, k.plank);
      W.fill(cx - 9, sy - 0.25, -262.25, cx + 9, sy, -262, k.gold);
      for (let i = 0; i < 3; i++) W.fill(cx - 3, 0.25, -262 + i * 0.5, cx + 3, sy - 0.25 - i * 0.25, -261.5 + i * 0.5, k.coping);
      const RS = [10, 8.6, 7.2, 5.8, 4.4];
      for (let r = 0; r < 5; r++) {
        const R0 = RS[r], R1 = r < 4 ? RS[r + 1] - 0.25 : 0, zf = -264 - r * 1.6;
        for (let x = cx - R0; x < cx + R0; x += 0.25) for (let y = sy; y < sy + R0; y += 0.25) {
          const d = Math.hypot(x + 0.125 - cx, y + 0.125 - sy);
          if (d > R0 || d < R1) continue;
          const c = d > R0 - 0.3 ? k.gold : (r === 4 ? k.cream2 : (Math.floor(d * 2) & 1 ? k.cream : k.cream2));
          W.fill(x, y, zf - 1.6, x + 0.25, y + 0.25, zf, c);
          if (d < R1 + 0.3 && r < 4) W.fill(x, y, zf - 0.25, x + 0.25, y + 0.25, zf, k.glowA);
        }
      }
      for (let x = cx - 10; x < cx + 10; x += 0.25) for (let y = 0.25; y < sy + 10; y += 0.25) { const d = Math.hypot(x + 0.125 - cx, Math.max(0, y + 0.125 - sy)); if (d < 10) W.fill(x, y, -272.25, x + 0.25, y + 0.25, -271.5, k.cream2); }
      // crown: a sunburst fan of short gold rays round the front arch
      for (let a = 0; a < 11; a++) { const ang = Math.PI * (0.1 + a * 0.08); for (let t = 10; t < 11 + (a & 1) * 0.75; t += 0.25) W.fill(cx + Math.cos(ang) * t, sy + Math.sin(ang) * t, -264, cx + Math.cos(ang) * t + 0.25, sy + Math.sin(ang) * t + 0.25, -263.5, k.gold); }
      AF.addLight({ x: cx, y: 5, z: -265, color: 0xffe2b0, intensity: 1.5, range: 18, kind: 'sign' });
      // night dress: festoon bulbs round the front arch, footlights along the stage lip, two lamp-post uplights, a concert easel
      {
        const bulb = AF.col(0xfff2c8, { emit: 0xffd48a, emitK: 3.2, mode: 'night', jitter: 0, edge: 0 }), bulbR = AF.col(0xffc0a0, { emit: 0xff7a4a, emitK: 3.0, mode: 'night', jitter: 0, edge: 0 });
        const bm = new AF.Model(1, 1, 1); bm.set(0, 0, 0, bulb); const bg1 = AF.meshModel(bm, { vs: 1 / 8, anchor: [0.5, 0.5, 0.5] });
        const bm2 = new AF.Model(1, 1, 1); bm2.set(0, 0, 0, bulbR); const bg2 = AF.meshModel(bm2, { vs: 1 / 8, anchor: [0.5, 0.5, 0.5] });
        for (let a = 0; a <= 40; a++) { const ang = Math.PI * a / 40, R = 10.45; put(a % 3 === 1 ? bg2 : bg1, cx + Math.cos(ang) * R, sy + Math.sin(ang) * R, -263.8, 0, false); }
        for (let x = cx - 8.5; x <= cx + 8.5; x += 0.85) put(bg1, x, sy + 0.08, -261.95, 0, false);
        cnt.bulbs = 41 + 21;
        const lg = parkLampGeo();
        for (const e of [-1, 1]) { const x = cx + e * 11.5; put(lg, x, 0.25, -261, 0, false); AF.addCollider(x - 0.2, 0.25, -261.2, x + 0.2, 3.9, -260.8); }
        AF.addLight({ x: cx, y: 3, z: -259, color: 0xffd9a0, intensity: 1.2, range: 14, kind: 'porch' });
        const easel = G('easel', () => { const m = new AF.Model(16, 26, 4), c = AF.col, cr = c(0xf2e6c4, { jitter: 0.05, edge: 0.15 }), rd = c(0xb8322a, { jitter: 0.05 }), nv = c(0x1d2d52, { jitter: 0.05 });
          m.line(2, 0, 3, 5, 25, 1, k.woodD); m.line(13, 0, 3, 10, 25, 1, k.woodD); m.box(1, 9, 0, 15, 25, 1, cr); m.box(1, 23, 0, 15, 25, 1, rd); m.box(1, 9, 0, 15, 10, 1, rd); m.box(1, 10, 0, 2, 23, 1, nv); m.box(14, 10, 0, 15, 23, 1, nv);
          for (let y = 12; y < 22; y += 3) for (let x = 3; x < 13; x++) if (hash(x * 3, y) < (y > 18 ? 0.95 : 0.7)) m.set(x, y, 0, y > 18 ? rd : nv); return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }); });
        put(easel, cx + 3.2, 0.25, -259.3, 0, false);
        const tx = AF.meshModel(AF.textModel('TONIGHT 8 PM', AF.col(0xb8322a), { pad: 0 }), { vs: 1 / 64, anchor: [0.5, 0, 0] }); put(tx, cx + 3.2, 0.25 + 1.2, -259.3 + 0.1, 0, false);
      }
      // band: piano, drums, stands; 6 players
      put(pianoGeo(), cx - 6, sy, -268, 0, true); put(drumGeo(), cx, sy, -269.5, 0, true);
      const band = [[-6, -266.5], [-3.5, -265], [-1, -265], [2, -265], [4.5, -266], [0, -268]];
      band.forEach(([dx, z], i) => { if (i < 5 && i > 0) put(standGeo(), cx + dx, sy, z + 0.8, 0, false); if (!hasKit()) AF.addSpot({ building: 'park-bandshell', x: cx + dx, y: sy, z, yaw: 0, kind: 'stand' }); });
      AF.addBuilding({ id: 'park-bandshell', name: 'The Bandshell', kind: 'park', box: [cx - 10, 0.25, -272.5, cx + 10, 12, -262], doors: [{ x: cx, y: 0.25, z: -260, yaw: Math.PI }], floors: [sy], interior: false });
      // chairs: 6 rows x 10 with a centre aisle, facing the stage (north)
      const cg = chairGeo();
      for (let row = 0; row < 6; row++) for (let j = 0; j < 10; j++) {
        const side = j < 5 ? -1 : 1, jj = j % 5, x = cx + side * (1.75 + jj * 1.55), z = -256.5 + row * 1.7;
        put(cg, x, 0.25, z, 2, false); cnt.chairs++;
        AF.addSpot({ building: 'park-chairs', x, y: 0.25 + 4 / 8, z, yaw: Math.PI, kind: 'sit' });
      }
      AF.addLabel('The Bandshell', cx, -266, 'place');
    }

    // ---- THE CAROUSEL (20,-208): voxel platform + rotating canopy + bobbing horses (dynamic)
    {
      const [cx, cz] = F.carousel, R = 6;
      W.eachCol(cx - R - 1, cz - R - 1, cx + R + 1, cz + R + 1, (bx, bz, i, x, z) => { const d = Math.hypot(x - cx, z - cz); if (d < R + 0.5) W.fill(x - 0.125, 0.25, z - 0.125, x + 0.125, d > R ? 0.5 : 0.75, z + 0.125, d > R - 0.3 ? k.gold : ((Math.floor(Math.atan2(z - cz, x - cx) * 4) & 1) ? k.woodL : k.plank)); });
      const grp = new THREE.Group(); grp.position.set(cx, 0.75, cz); AF.scene.add(grp);
      // canopy mesh
      const cm = new AF.Model(104, 40, 104), bulbC = AF.col(0xfff2c8, { emit: 0xffd48a, emitK: 3.0, mode: 'night', jitter: 0, edge: 0 }), mirror = AF.col(0xdfe6ea, { metal: 1, rough: 0.12, jitter: 0.05, edge: 0.1 });
      for (let x = 0; x < 104; x++) for (let z = 0; z < 104; z++) {
        const d = Math.hypot(x + 0.5 - 52, z + 0.5 - 52) / 8;   // metres
        const ang = Math.atan2(z - 52, x - 52), seg = Math.floor((ang + Math.PI) / (Math.PI * 2) * 16);
        if (d < 6.4) { const y = 29 + Math.floor((6.4 - d) * 1.4); cm.set(x, y, z, seg & 1 ? k.canvasR : k.canvasW); if (d > 6.1) for (let yy = 26; yy < 29; yy++) cm.set(x, yy, z, (seg & 1) ? k.gold : k.canvasR); }
        if (d < 0.45) for (let y = 0; y < 38; y++) cm.set(x, y, z, y > 34 ? k.gold : k.brass);
        if (d > 5.9 && d < 6.1 && (seg % 2 === 0) && Math.abs(ang * 8 % 1) < 0.2) cm.set(x, 25, z, k.glowA);
        // round 2: rounding-board bulbs, bulbs up every rib, a mirrored centre drum with gilt bands
        if (d >= 6.1 && d < 6.4 && ((Math.floor((ang + Math.PI) * 6.4 * 8 / 3)) & 1)) cm.set(x, 27, z, bulbC);
        const ribA = ((ang + Math.PI) / (Math.PI * 2) * 16) % 1;
        if (d > 0.8 && d < 6.2 && (ribA < 0.035 || ribA > 0.965) && (Math.floor(d * 2.5) & 1)) cm.set(x, 30 + Math.floor((6.4 - d) * 1.4), z, bulbC);
        if (d >= 0.45 && d < 1.45) for (let y = 4; y < 26; y++) { const panel = Math.floor((ang + Math.PI) / (Math.PI * 2) * 12) & 1; cm.set(x, y, z, y < 6 || y > 23 || y === 14 ? k.gold : d < 1.3 ? k.redD : panel ? mirror : k.canvasW); }
      }
      const canopy = AF.modelMesh(AF.meshModel(cm, { vs: 1 / 8, anchor: [0.5, 0, 0.5] })); grp.add(canopy); moving(canopy, 'canopy');
      const horses = [];
      const poleGeometry = new THREE.CylinderGeometry(0.04, 0.04, 3.4, 5);
      const poleMaterial = new THREE.MeshStandardMaterial({ color: 0xd4a83e, metalness: 0.6, roughness: 0.35 });
      for (let i = 0; i < 12; i++) {
        const a = i / 12 * Math.PI * 2, r = i & 1 ? 4.4 : 3.3;
        const h = AF.modelMesh(horseGeo(i % 3)); h.position.set(Math.cos(a) * r, 0.6, Math.sin(a) * r); h.rotation.y = -a; h.castShadow = false;
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(Math.cos(a) * r, 1.9, Math.sin(a) * r);
        grp.add(h, pole); moving(h, 'horse'); moving(pole, 'pole'); horses.push({ h, ph: i * 1.3 });
      }
      PKS.carouselHorses = horses.map((o) => o.h);
      parkTick('park-carousel', 330, (dt, t) => {
        grp.rotation.y = -t * 0.45;
        for (const o of horses) o.h.position.y = 0.6 + Math.sin(t * 2.2 + o.ph) * 0.28;
      });
      AF.addCollider(cx - 0.3, 0.25, cz - 0.3, cx + 0.3, 5, cz + 0.3);
      AF.addLabel('The Carousel', cx, cz, 'place');
      // band organ (brass pipes, drum, painted wings) + RIDES 5c ticket booth with a striped roof
      {
        const c = AF.col, bulbN = c(0xfff2c8, { emit: 0xffd48a, emitK: 3.0, mode: 'night', jitter: 0, edge: 0 }), teal = c(0x2e8a7a, { jitter: 0.1, edge: 0.3 });
        const org = G('organ', () => { const m = new AF.Model(28, 30, 10); m.box(0, 0, 0, 28, 6, 10, k.redD); m.box(0, 6, 0, 28, 22, 8, k.red); m.box(0, 22, 0, 28, 24, 9, k.gold);
          for (let x = 3; x < 25; x += 2) { const h = 12 + Math.round(Math.abs(Math.sin((x - 14) * 0.18)) * 7); m.box(x, 8, 8, x + 1, 8 + h, 9, k.brass); m.set(x, 8 + h, 8, k.gold); }
          m.box(0, 24, 0, 28, 26, 8, teal); for (let x = 1; x < 28; x += 3) m.set(x, 25, 8, bulbN); for (let x = 2; x < 27; x += 3) m.set(x, 6, 9, bulbN); m.box(11, 26, 2, 17, 30, 6, k.gold);
          m.box(2, 8, 8, 5, 14, 10, k.white); m.box(23, 8, 8, 26, 14, 10, k.white); m.set(3, 12, 9, k.navy); m.set(24, 12, 9, k.navy); m.box(12, 2, 9, 16, 5, 10, k.gold);
          for (let x = 1; x < 27; x += 9) { m.box(x, 8, 0, x + 8, 20, 1, k.gold); m.box(x + 1, 9, 0, x + 7, 19, 1, teal); m.box(x + 3, 12, 0, x + 5, 16, 1, k.cream); } m.box(0, 22, 0, 28, 23, 1, k.cream);
          return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); });
        put(org, cx + 8.4, 0.25, cz + 4.2, 3, true); block(cx + 7, cz + 2, cx + 10, cz + 6.5);
        const booth = G('tbooth', () => { const m = new AF.Model(14, 26, 14); m.box(1, 0, 1, 13, 16, 13, k.cream); m.box(1, 0, 1, 13, 3, 13, k.redD); m.box(3, 7, 12, 11, 13, 13, c(0x2e3a46, { glass: true })); m.box(2, 6, 13, 12, 7, 14, k.woodL);
          for (let y = 16; y < 22; y++) { const r = (22 - y) * 1.2; for (let x = 0; x < 14; x++) for (let z = 0; z < 14; z++) if (Math.abs(x + 0.5 - 7) < r && Math.abs(z + 0.5 - 7) < r) m.set(x, y, z, ((x + z) >> 1) & 1 ? k.canvasR : k.canvasW); }
          m.box(6, 22, 6, 8, 26, 8, k.gold); m.set(7, 25, 7, bulbN); return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); });
        put(booth, cx + 8.2, 0.25, cz - 4.2, 3, true); block(cx + 7, cz - 5.5, cx + 9.5, cz - 3);
        const rt = AF.meshModel(AF.textModel('RIDES 5c', k.red, { pad: 1, bg: k.cream }), { vs: 1 / 40, anchor: [0.5, 0, 0.5] }); put(rt, cx + 8.2 - 0.9, 0.25 + 1.55, cz - 4.2, 3, false);
        AF.addLight({ x: cx, y: 4.2, z: cz, color: 0xffd9a0, intensity: 1.4, range: 16, kind: 'sign' });
      }
      for (let i = 0; i < 3; i++) AF.addSpot({ building: 'park-carousel', x: cx + 7.5, y: 0.25, z: cz - 2 + i * 1.5, yaw: -Math.PI / 2, kind: 'stand' });
    }

    // ---- SKATING POND pavilion (skate rental) + ROLLER RINK with 8 skaters
    {
      const px0 = 26, px1 = 42, pz0 = -247, pz1 = -240, fy = 0.5;
      W.fill(px0, 0.25, pz0, px1, fy, pz1, k.plank);
      W.walls(px0, fy, pz0, px1, fy + 3.5, pz1, k.cream);
      W.fill(px0, fy, pz0, px1, fy + 0.5, pz1, k.jadeD); W.clear(px0 + 0.25, fy, pz0 + 0.25, px1 - 0.25, fy + 3.5, pz1 - 0.25);
      W.clear(32, fy, pz1 - 0.25, 36, fy + 2.75, pz1);                 // south door (4 m)
      W.clear(28, fy, pz0, 40, fy + 2.75, pz0 + 0.25);                   // open front onto the pond (north)
      for (let x = 28; x < 40; x += 3) W.fill(x, fy, pz0, x + 0.25, fy + 3.5, pz0 + 0.25, k.jade);
      for (let i = 0; i < 4; i++) W.fill(px0 - 0.5 + i * 0.5, fy + 3.5 + i * 0.25, pz0 - 0.75 + i * 0.4, px1 + 0.5 - i * 0.5, fy + 3.75 + i * 0.25, pz1 + 0.5 - i * 0.4, i === 0 ? k.cream : (i & 1) ? k.canvasR : k.canvasW);
      put(AF.meshModel(AF.textModel('SKATES', k.signFg, { bg: k.signBg, pad: 1 }), { vs: 1 / 14 }), 34, fy + 2.85, pz1 + 0.02, 0, false);
      put(skatesGeo(), 29.5, fy, pz1 - 0.6, 2, false); put(counterGeo(), 36.5, fy, -243.5, 0, true);
      W.fill(27, fy - 0.25, -246.5, 41, fy, -245.75, k.redD);   // rubber matting strip
      for (let x = 28; x < 34; x += 2) W.fill(x, fy, -246, x + 1.5, fy + 0.5, -245.25, k.woodL);   // lacing benches
      W.fill(40.25, fy, -244, 40.75, fy + 1.5, -241, k.woodD); W.fill(40.25, fy + 0.5, -243.5, 40.5, fy + 1.25, -241.5, k.red);   // cocoa urn shelf
      W.fill(33.75, fy + 3.0, -243.75, 34.25, fy + 3.25, -243.25, k.glowA);
      AF.addLight({ x: 34, y: 3.2, z: -243.5, color: 0xffd9a0, intensity: 1, range: 9, kind: 'interior' });
      AF.addBuilding({ id: 'park-pavilion', name: 'Skating Pavilion', kind: 'park', box: [px0, 0.25, pz0, px1, fy + 4.5, pz1], doors: [{ x: 34, y: 0.25, z: pz1 + 0.8, yaw: Math.PI }], floors: [fy], interior: true });
      AF.addSpot({ building: 'park-pavilion', x: 36.5, y: fy, z: -242.6, yaw: Math.PI, kind: 'counter', path: [[34, -239.2], [34, -241.5], [36.5, -242.4]] });
      for (let i = 0; i < 3; i++) AF.addSpot({ building: 'park-pavilion', x: 30 + i * 1.2, y: fy + 0.5, z: -245.5, yaw: Math.PI, kind: 'sit' });
      // round 2: the ICE SKATING FROM DECEMBER fascia over the open front, pennant bunting, skates on wall pegs, a potbelly stove,
      // steaming cocoa urn, a hand-lettered price card, pavilion flag
      {
        const c = AF.col, iron2 = c(0x2a2826, { jitter: 0.1, edge: 0.3, metal: 0.3, rough: 0.5 });
        put(AF.meshModel(AF.textModel('ICE SKATING FROM DECEMBER', k.signFg, { bg: k.signBg, pad: 1 }), { vs: 1 / 16, anchor: [0.5, 0, 0.5] }), 34, fy + 2.8, pz0 - 0.1, 2, false);
        if (typeof AF.makeBunting === 'function') { AF.makeBunting([px0 + 0.3, fy + 3.3, pz0 - 0.3], [px1 - 0.3, fy + 3.3, pz0 - 0.3], { shape: 'pennant' }); AF.makeBunting([px0 + 0.5, fy + 3.1, pz0 + 1], [px1 - 0.5, fy + 3.1, pz1 - 1], { shape: 'pennant', colors: ['#c0392b', '#f4f1ea', '#2e8a7a'] }); }
        const pegs = G('skpegs', () => { const m = new AF.Model(3, 12, 36); m.box(0, 9, 0, 1, 10, 36, k.woodD); for (let z = 1; z < 35; z += 4) { m.set(1, 9, z + 1, k.woodL); m.box(1, 4, z, 3, 9, z + 3, (z >> 2) & 1 ? k.white : k.boardD); m.box(1, 3, z, 3, 4, z + 3, k.chrome); } return AF.meshModel(m, { vs: 1 / 8, anchor: [0, 0, 0.5] }); });
        put(pegs, px0 + 0.25, fy + 0.9, -243.6, 0, false);
        const stove = G('stove', () => null) || null; if (stove) { put(stove, 40.6, fy, -246.2, 0, true); if (typeof AF.addChimney === 'function') AF.addChimney(40.6, fy + 5.3, -246.2); }
        W.fill(40.35, fy + 1.5, -243.25, 40.75, fy + 2.1, -242.85, k.chrome); W.fill(40.45, fy + 2.1, -243.15, 40.65, fy + 2.2, -242.95, k.black);
        put(AF.meshModel(AF.textModel('COCOA 3c', k.boardD, { bg: k.board, pad: 1 }), { vs: 1 / 40, anchor: [0.5, 0, 0.5] }), 36.5, fy + 1.3, -243.2, 0, false);
        W.fill(33.9, fy + 4.5, -243.6, 34.1, fy + 6.5, -243.4, k.woodL);
        if (typeof AF.makeFlag === 'function') AF.makeFlag({ x: 34, y: fy + 6.5, z: -243.5, w: 1.6, h: 1.0, design: 'solace' });
        // rafters, cafe tables by the open front, winter-carnival posters + a clock on the back wall
        for (let x = 27.5; x < 41; x += 2.25) W.fill(x, fy + 3.0, pz0 + 0.25, x + 0.25, fy + 3.25, pz1 - 0.25, k.woodD);
        const ctab = G('ctable', () => { const m = new AF.Model(6, 7, 6); m.box(2, 0, 2, 4, 1, 4, k.iron); m.box(2.5 | 0, 1, 2, 3, 6, 3, k.iron); for (let x = 0; x < 6; x++) for (let z = 0; z < 6; z++) if (Math.hypot(x - 2.5, z - 2.5) < 3) m.set(x, 6, z, k.white); m.box(1, 7 - 1, 1, 2, 7, 2, k.red); return AF.meshModel(m, { vs: 1 / 8, anchor: [0.5, 0, 0.5] }); });
        const poster = (txt, bgc, fg) => AF.meshModel(AF.textModel(txt, fg, { bg: bgc, pad: 3 }), { vs: 1 / 36, anchor: [0.5, 0, 0] });
        put(poster('WINTER CARNIVAL', c(0x1d2d52, { jitter: 0.03 }), k.white), 38.6, fy + 1.4, pz1 - 0.27, 2, false);
        put(poster('FIGURE SKATING', c(0xb8322a, { jitter: 0.03 }), k.cream), 38.6, fy + 1.9, pz1 - 0.27, 2, false);
        if (PKS.parts && PKS.parts.clock) put(PKS.parts.clock, 37.0, fy + 2.7, pz1 - 0.27, 2, false);
        PKS.cafe = [[30.2, -242.6], [39.0, -245.4]];
        for (const [x, z] of PKS.cafe) { put(ctab, x, fy, z, 0, true); for (const dx of [-0.75, 0.75]) put(chairGeo(), x + dx, fy, z, dx < 0 ? 3 : 1, false); }
      }
      // roller rink oval x 45..65, z -243..-229
      const rcx = 55, rcz = -236, rrx = 10, rrz = 6.5;
      W.eachCol(rcx - rrx - 1, rcz - rrz - 1, rcx + rrx + 1, rcz + rrz + 1, (bx, bz, i, x, z) => {
        const e = Math.hypot((x - rcx) / rrx, (z - rcz) / rrz);
        if (e < 1) { W.C[i] = Math.abs(e - 0.55) < 0.02 ? k.rinkL : k.rink; if (pathMask) pathMask[i] = 1; }
        else if (e < 1.07) { W.fill(x - 0.125, 0.25, z - 0.125, x + 0.125, 1.0, z + 0.125, (bx + bz) % 6 === 0 ? k.white : k.red); }
      });
      W.clear(rcx - 1.5, 0.25, rcz + rrz - 0.8, rcx + 1.5, 1.25, rcz + rrz + 1.5);
      const figs = [];
      for (let i = 0; i < (hasKit() ? 0 : 8); i++) { const m = AF.modelMesh(figureGeo(i)); m.castShadow = true; AF.scene.add(m); figs.push({ m, ph: i / 8 * Math.PI * 2, sp: 0.35 + (i % 3) * 0.04, r: 0.72 + (i % 3) * 0.1 }); }
      parkTick('park-skaters', 331, (dt, t) => {
        for (const f of figs) { const a = f.ph + t * f.sp; f.m.position.set(rcx + Math.cos(a) * rrx * f.r, 0.25 + Math.abs(Math.sin(t * 3 + f.ph)) * 0.05, rcz + Math.sin(a) * rrz * f.r); f.m.rotation.set(0, Math.atan2(-Math.sin(a) * rrx, Math.cos(a) * rrz), 0.12 * Math.sin(t * 3 + f.ph)); }
      });
      AF.addLabel('Roller Rink', rcx, rcz, 'place'); AF.addLabel('Skating Pond', PD.cx, PD.cz, 'place');
    }

    // ---- FOUNTAIN (-36,-198): stone basin, tiered pedestal, live jets (instanced droplets)
    {
      const [fx, fz] = F.fountain, R = 4.2;
      W.eachCol(fx - R - 0.5, fz - R - 0.5, fx + R + 0.5, fz + R + 0.5, (bx, bz, i, x, z) => {
        const d = Math.hypot(x - fx, z - fz);
        if (d < R && d > R - 0.6) W.fill(x - 0.125, 0.25, z - 0.125, x + 0.125, 1.0, z + 0.125, d > R - 0.3 ? k.coping : k.stone);
        else if (d <= R - 0.6) { W.C[i] = k.stoneD; W.fill(x - 0.125, 0.25, z - 0.125, x + 0.125, 0.75, z + 0.125, k.water); }
      });
      for (const [r0, y0, y1, c] of [[0.6, 0.25, 2.5, k.stone], [1.8, 1.25, 1.5, k.coping], [1.1, 2.5, 2.75, k.coping], [0.35, 2.75, 3.5, k.stone]]) W.eachCol(fx - r0, fz - r0, fx + r0, fz + r0, (bx, bz, i, x, z) => { if (Math.hypot(x - fx, z - fz) < r0) W.fill(x - 0.125, y0, z - 0.125, x + 0.125, y1, z + 0.125, c); });
      AF.addCollider(fx - R + 0.3, 0.25, fz - R + 0.3, fx + R - 0.3, 1.0, fz + R - 0.3);
      const N = 9 * 14, dg = new THREE.SphereGeometry(0.09, 5, 4), dmat = new THREE.MeshBasicMaterial({ color: 0xcfe8f4, transparent: true, opacity: 0.75 });
      const im = new THREE.InstancedMesh(dg, dmat, N), dm = new THREE.Object3D();
      im.frustumCulled = false; AF.scene.add(im);
      AF.onTick('park-fountain', 332, (dt, t) => {
        const c = AF.camera, distance = c ? Math.hypot(c.position.x - fx, c.position.y - 2, c.position.z - fz) : Infinity;
        im.visible = Number.isFinite(parkDistance()) && distance < 140; if (!im.visible) return;
        if (distance > 60 && Math.floor(t * 10) === fountainFrame) return; fountainFrame = Math.floor(t * 10);
        let n = 0;
        for (let s = 0; s < 9; s++) for (let j = 0; j < 14; j++) {
          const u = ((t * 0.8 + j / 14) % 1);
          if (s === 0) dm.position.set(fx + Math.sin(j * 2.3) * 0.08, 3.5 + u * 2.2 - u * u * 2.2 * 1.0, fz + Math.cos(j * 2.3) * 0.08);
          else { const a = (s - 1) / 8 * Math.PI * 2; const rr = 1.1 + u * 2.2; dm.position.set(fx + Math.cos(a) * rr, 2.7 + u * 1.6 - u * u * 2.6, fz + Math.sin(a) * rr); }
          dm.updateMatrix(); im.setMatrixAt(n++, dm.matrix);
        }
        im.instanceMatrix.needsUpdate = true;
      });
      let fountainFrame = -1;
      // flower beds round the fountain plaza
      for (let q = 0; q < 4; q++) {
        const a = q * Math.PI / 2 + Math.PI / 4, bx = fx + Math.cos(a) * 11.5, bz = fz + Math.sin(a) * 11.5;
        W.eachCol(bx - 2, bz - 2, bx + 2, bz + 2, (xb, zb, i, x, z) => { if (Math.hypot(x - bx, z - bz) < 1.9 && W.H[i] === 1 && !onPath(x, z)) { W.C[i] = k.soil; const h = hash(xb, zb); if (h < 0.8) W.setM(x, 0.4, z, h < 0.2 ? k.stem : k.flower[(q + Math.floor(h * 3)) % 6]); } });
        cnt.flowerBeds++;
      }
    }

    // ---- PLAYGROUND (-133,-192): swings (dynamic), slide, sandbox, see-saw
    {
      const x0 = -141, z0 = -200;
      W.eachCol(x0, z0, x0 + 18, z0 + 16, (bx, bz, i) => { W.C[i] = k.sand; });
      W.stamp(swingFrameM(), x0 + 1, 0.25, z0 + 2, 0);
      const seatM = new AF.Model(6, 42, 3); seatM.box(0, 0, 0, 6, 1, 3, k.woodD); seatM.box(0, 1, 1, 1, 42, 2, k.iron); seatM.box(5, 1, 1, 6, 42, 2, k.iron);
      const sg = AF.meshModel(seatM, { vs: 1 / 8, anchor: [0.5, 1, 0.5] });
      const swings = [];
      for (let i = 0; i < 3; i++) { const m = AF.modelMesh(sg); m.position.set(x0 + 1 + 2.5 + i * 3.5, 0.25 + 21.5 * 0.25, z0 + 2 + 1.5); AF.scene.add(m); moving(m, 'swing'); swings.push({ m, ph: i * 1.7, amp: 0.3 + i * 0.12 }); }
      parkTick('park-swings', 333, (dt, t) => { for (const s of swings) s.m.rotation.x = Math.sin(t * 2.1 + s.ph) * s.amp; });
      for (let i = 0; i < 3; i++) AF.addSpot({ building: 'park-playground', x: x0 + 3.5 + i * 3.5, y: 0.25, z: z0 + 6, yaw: Math.PI, kind: 'play' });
      // slide: ladder + ramp
      const sx = x0 + 14, sz = z0 + 4;
      W.fill(sx, 0.25, sz, sx + 1.5, 2.5, sz + 0.25, k.red); W.fill(sx, 0.25, sz + 1.25, sx + 1.5, 2.5, sz + 1.5, k.red);
      W.fill(sx, 2.25, sz, sx + 1.5, 2.5, sz + 1.5, k.yellow);
      for (let s = 0; s < 18; s++) W.fill(sx + 0.25, 2.25 - s * 0.125, sz + 1.5 + s * 0.25, sx + 1.25, 2.5 - s * 0.125, sz + 1.75 + s * 0.25, k.chrome);
      // sandbox + see-saw
      W.walls(x0 + 2, 0.25, z0 + 10, x0 + 7, 0.75, z0 + 14, k.woodL);
      W.fill(x0 + 10, 0.25, z0 + 11.75, x0 + 10.5, 0.75, z0 + 12.25, k.iron); W.fill(x0 + 8, 0.75, z0 + 11.75, x0 + 12.5, 1.0, z0 + 12.25, k.blue);
      AF.addLabel('Playground', x0 + 9, z0 + 8, 'place');
    }

    // ---- chess tables, hot-dog cart, balloon seller, statues
    {
      const tg = tableGeo(), sg = stoolGeo();
      for (let i = 0; i < 4; i++) {
        const x = -52 + (i % 2) * 5, z = -194 + Math.floor(i / 2) * 5;
        put(tg, x, 0.25, z, 0, true);
        for (const [dx, dz, yaw] of [[-1.1, 0, Math.PI / 2], [1.1, 0, -Math.PI / 2]]) { put(sg, x + dx, 0.25, z + dz, 0, false); if (!hasKit() || i > 1) AF.addSpot({ building: 'park-chess', x: x + dx, y: 0.25 + 0.5, z: z + dz, yaw, kind: 'sit' }); }
      }
      put(cartGeo(), -18, 0.25, -188, 0, true); if (!hasKit()) AF.addSpot({ building: 'park-hotdogs', x: -18, y: 0.25, z: -189.6, yaw: 0, kind: 'work' });
      AF.addSpot({ building: 'park-hotdogs', x: -18, y: 0.25, z: -185.8, yaw: Math.PI, kind: 'stand' });
      // balloon seller (8,-188): instanced balloons that bob, on strings
      const bx = 6, bz = -189;
      if (!hasKit()) AF.addSpot({ building: 'park-balloons', x: bx, y: 0.25, z: bz + 0.6, yaw: Math.PI, kind: 'work' });
      const NB = 9, bgeo = new THREE.SphereGeometry(0.28, 8, 6); bgeo.scale(1, 1.2, 1);
      const bim = new THREE.InstancedMesh(bgeo, new THREE.MeshLambertMaterial({ color: 0xffffff }), NB), dm = new THREE.Object3D();
      const bc = [0xe23b3b, 0xf0c040, 0x3b7de2, 0x40c070, 0xe070a0, 0xf28a2a, 0x9a5ad0, 0xf2ece0, 0x2e8a7a].map((h) => new THREE.Color(h));
      for (let i = 0; i < NB; i++) bim.setColorAt(i, bc[i]);
      const sp = new Float32Array(NB * 6), sgeo = new THREE.BufferGeometry(); sgeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
      const strings = new THREE.LineSegments(sgeo, new THREE.LineBasicMaterial({ color: 0xdddddd }));
      bim.frustumCulled = false; strings.frustumCulled = false; AF.scene.add(bim, strings);
      const hx = bx + 0.35, hy = 1.2, hz = bz + 0.3;
      const upd = (t) => {
        for (let i = 0; i < NB; i++) {
          const a = i / NB * Math.PI * 2, x = hx + Math.cos(a) * 0.45 + Math.sin(t * 1.3 + i) * 0.08, y = 2.9 + (i % 3) * 0.3 + Math.sin(t * 1.7 + i * 0.9) * 0.1, z = hz + Math.sin(a) * 0.45 + Math.cos(t * 1.1 + i) * 0.08;
          dm.position.set(x, y, z); dm.updateMatrix(); bim.setMatrixAt(i, dm.matrix);
          const offset = i * 6; sp[offset] = hx; sp[offset + 1] = hy; sp[offset + 2] = hz; sp[offset + 3] = x; sp[offset + 4] = y - 0.3; sp[offset + 5] = z;
        }
        bim.instanceMatrix.needsUpdate = true; sgeo.attributes.position.needsUpdate = true;
      };
      upd(0);
      parkTick('park-balloons', 334, (dt, t) => upd(t));
      AF.onTick('park-balloons-visible', 334, () => { bim.visible = strings.visible = Number.isFinite(parkDistance()); });
      // statues: the Grand Ave gate lawn + the lake loop
      put(statueGeo(0), -4, 0.25, -184, 0, true); put(statueGeo(1), -60, 0.25, -212, 1, true);
      // KITE flying high over the bandshell lawn (dynamic), string to a kid
      const kx = -24, kz = -228;
      if (!hasKit()) AF.addSpot({ building: 'park-kite', x: kx, y: 0.25, z: kz, yaw: Math.PI, kind: 'play' });
      const kg = new THREE.BufferGeometry(); kg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0.9, 0, -0.55, 0, 0, 0, -0.9, 0, 0, 0.9, 0, 0, -0.9, 0, 0.55, 0, 0], 3)); kg.computeVertexNormals();
      const kite = new THREE.Mesh(kg, new THREE.MeshLambertMaterial({ color: 0xd23b3b, side: THREE.DoubleSide }));
      const kite2 = new THREE.Mesh(kg, new THREE.MeshLambertMaterial({ color: 0xf0c040, side: THREE.DoubleSide })); kite2.scale.set(0.5, 0.5, 1); kite2.position.z = 0.01; kite.add(kite2);
      const kp = new Float32Array(3 * 2 * 9), kl = new THREE.BufferGeometry(); kl.setAttribute('position', new THREE.BufferAttribute(kp, 3));
      const kline = new THREE.LineSegments(kl, new THREE.LineBasicMaterial({ color: 0xeeeeee }));
      kite.frustumCulled = false; kline.frustumCulled = false; AF.scene.add(kite, kline);
      const kupd = (t) => {
        const X = kx - 14 + Math.sin(t * 0.37) * 4, Y = 26 + Math.sin(t * 0.53) * 2.5, Z = kz - 22 + Math.cos(t * 0.29) * 3;
        kite.position.set(X, Y, Z); kite.rotation.set(0.3, 0.6 + Math.sin(t * 0.7) * 0.2, Math.sin(t * 1.1) * 0.35);
        for (let i = 0; i < 9; i++) { const u0 = i / 9, u1 = (i + 1) / 9, offset = i * 6; kp[offset] = kx + (X - kx) * u0; kp[offset + 1] = 1.3 + (Y - 1.3) * u0 - Math.sin(u0 * Math.PI) * 2.2; kp[offset + 2] = kz + (Z - kz) * u0; kp[offset + 3] = kx + (X - kx) * u1; kp[offset + 4] = 1.3 + (Y - 1.3) * u1 - Math.sin(u1 * Math.PI) * 2.2; kp[offset + 5] = kz + (Z - kz) * u1; }
        kl.attributes.position.needsUpdate = true;
      };
      kupd(0);
      parkTick('park-kite', 335, (dt, t) => kupd(t));
      AF.onTick('park-kite-visible', 335, () => { kite.visible = kline.visible = Number.isFinite(parkDistance()); });
    }

    // ---- ROWBOATS on Swan Lake: 5 moored at the jetty bobbing, 3 rowed slowly round the lake
    {
      const bg = boatGeo(), boats = [];
      // nested 3 deep so 62-water's lake-floater scan (depth <= 2) skips them: its square hull-foam ring is far too big for 3 m rowboats
      const hold = new THREE.Group(), hold1 = new THREE.Group(), hold2 = new THREE.Group(); hold.add(hold1); hold1.add(hold2); AF.scene.add(hold);
      const moor = [[-110.5, -229, 0], [-103.5, -229, 0], [-110.5, -232.5, 0], [-103.5, -232.5, 0], [-111.8, -237.6, 1]];
      for (const [x, z, r] of moor) { const m = AF.modelMesh(bg); m.position.set(x, lakeY - 0.12, z); m.rotation.y = r ? 0 : Math.PI / 2; hold2.add(m); moving(m, 'hull'); boats.push({ m, ph: x * 0.7 + z, moving: false, y0: lakeY - 0.12, yaw: m.rotation.y }); }
      const rg = rowerGeo();
      for (let i = 0; i < 0; i++) {
        const g = new THREE.Group(), m = AF.modelMesh(bg), r = AF.modelMesh(rg); r.rotation.y = Math.PI / 2; r.position.y = 0.3; m.add(r);
        g.add(m); AF.scene.add(g); boats.push({ m: g, ph: i * 2.1, moving: true, rr: 0.45 + i * 0.12, sp: 0.018 + i * 0.004, dir: i === 1 ? -1 : 1 });
      }
      cnt.boats = boats.length;
      parkTick('park-boats', 336, (dt, t) => {
        for (const b of boats) {
          if (!b.moving) { b.m.position.y = b.y0 + Math.sin(t * 1.3 + b.ph) * 0.05; b.m.rotation.z = Math.sin(t * 0.9 + b.ph) * 0.03; continue; }
          const a = b.ph + t * b.sp * b.dir, x = LK.cx + Math.cos(a) * LK.rx * b.rr, z = LK.cz + Math.sin(a) * LK.rz * b.rr;
          const tx = -Math.sin(a) * LK.rx * b.dir, tz = Math.cos(a) * LK.rz * b.dir;
          b.m.position.set(x, lakeY - 0.12 + Math.sin(t * 1.4 + b.ph) * 0.04, z); b.m.rotation.set(0, Math.atan2(tz, -tx) + Math.PI, Math.sin(t * 2.4 + b.ph) * 0.03);
        }
      });
    }

    // ---- LAMPS along the paths, BENCHES beside them
    {
      const lg = parkLampGeo(), bgeo = ST().benchGeo ? ST().benchGeo() : null;
      let acc = 0, accB = 9;
      const lamps = [];
      for (const p of PATHS) if (!p.mall) for (let j = 0; j < p.pts.length - 1; j++) {
        const [ax, az] = p.pts[j], [bx, bz] = p.pts[j + 1], L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L;
        for (let s = 0; s < L; s += 1) {
          acc += 1; accB += 1;
          const x = ax + dx * s, z = az + dz * s, off = p.w / 2 + 0.6;
          if (acc >= 22 && lg) {
            const lx = x - dz * off, lz = z + dx * off;
            if (inPark(lx, lz, 1.5) && !onPath(lx, lz) && W.groundY(lx, lz) === 0.25 && !W.getM(lx, 0.4, lz) && !lamps.some((q) => Math.hypot(q[0] - lx, q[1] - lz) < 12)) {
              put(lg, lx, 0.25, lz, 0, false); AF.addCollider(lx - 0.2, 0.25, lz - 0.2, lx + 0.2, 3.9, lz + 0.2);
              AF.addLight({ x: lx, y: 3.6, z: lz, color: 0xffcf8a, intensity: 1.1, range: 13, kind: 'street' }); lamps.push([lx, lz]); cnt.lamps++; acc = 0; block(lx - 0.6, lz - 0.6, lx + 0.6, lz + 0.6);
            }
          }
          if (accB >= 17 && bgeo) {
            const bx2 = x + dz * (p.w / 2 + 0.9), bz2 = z - dx * (p.w / 2 + 0.9);
            if (inPark(bx2, bz2, 1.5) && !onPath(bx2, bz2) && W.groundY(bx2, bz2) === 0.25 && !W.getM(bx2, 0.4, bz2) && isFree(bx2, bz2, 1)) {
              // bench faces the path: local -z is its seat front? benchGeo backrest at +z, so face = -z; rotate so -z points at the path (-dz, dx)
              const fx = -dz, fz = dx;   // from bench toward the path
              const rot = Math.abs(fx) > Math.abs(fz) ? (fx > 0 ? 3 : 1) : (fz > 0 ? 2 : 0);
              put(bgeo, bx2, 0.25, bz2, rot, true); block(bx2 - 1, bz2 - 1, bx2 + 1, bz2 + 1);
              AF.addSpot({ x: bx2, y: 0.25 + 3 / 8 + 0.12, z: bz2, yaw: Math.atan2(fx, fz), kind: 'bench' }); cnt.benches++; accB = 0;
            }
          }
        }
      }
    }

    // ---- THE MALL: symmetric lamp pairs + long runs of slatted benches between the elms, the Harbour Pioneers column at the
    //      north end, gate name boards (MERCHANTS' / MARINERS' / SCHOLARS'...), the park rules board, mum beds
    {
      const lg = parkLampGeo(), bgeo = ST().benchGeo ? ST().benchGeo() : null, c = AF.col;
      for (let z = -209; z >= -251; z -= 8.5) for (const x of [-43.1, -36.9]) {
        put(lg, x, 0.25, z, 0, false); AF.addCollider(x - 0.2, 0.25, z - 0.2, x + 0.2, 3.9, z + 0.2);
        if (z % 17 === -209 % 17 || x < -40) AF.addLight({ x, y: 3.6, z, color: 0xffcf8a, intensity: 1.0, range: 12, kind: 'street' });
        block(x - 0.5, z - 0.5, x + 0.5, z + 0.5); cnt.lamps++;
      }
      if (bgeo) for (let z = -217.25; z >= -243; z -= 8.5) for (const dz of [-1.35, 1.35]) for (const [x, rot, fx] of [[-43.2, 3, 1], [-36.8, 1, -1]]) {
        put(bgeo, x, 0.25, z + dz, rot, true); block(x - 0.9, z + dz - 0.9, x + 0.9, z + dz + 0.9);
        AF.addSpot({ building: 'park-mall', x, y: 0.25 + 3 / 8 + 0.12, z: z + dz, yaw: Math.atan2(fx, 0), kind: 'bench' }); cnt.benches++; cnt.mallBenches = (cnt.mallBenches || 0) + 1;
      }
      put(columnGeo(), -40, 0.25, -255, 0, true); put(statueGeo(1), -40, 0.25 + 86 / 8, -255, 0, false); block(-44, -259, -36, -251);
      const plq = AF.meshModel(AF.textModel('HARBOUR PIONEERS', k.gold, { pad: 0 }), { vs: 1 / 48, anchor: [0.5, 0, 0] });
      put(plq, -40, 0.25 + 17 / 8, -255 + 1.25 + 0.02, 0, false);
      AF.addLabel('The Mall', -40, -230, 'place');
      // gate name boards on the iron overthrows (gilded letters on park green)
      const boardC = c(0x1f3b2e, { jitter: 0.05, edge: 0.2 }), goldL = c(0xe8c25a, { metal: 1, rough: 0.25, emit: 0xffd890, emitK: 0.7, mode: 'night' });
      const gateNames = [[-40, PK.z1 - 0.25, 0, "MERCHANTS' GATE"], [0, PK.z1 - 0.25, 0, "MARINERS' GATE"], [-80, PK.z1 - 0.25, 0, "SCHOLARS' GATE"], [PK.x0 + 0.25, -225, 3, "HILLSIDE GATE"], [PK.x1 - 0.25, -215, 1, "CAROUSEL GATE"], [-40, PK.z0 + 0.25, 2, "HEIGHTS GATE"]];
      for (const [gx, gz, rot, name] of gateNames) {
        const g = AF.meshModel(AF.textModel(name, goldL, { pad: 2, bg: boardC }), { vs: 1 / 28, anchor: [0.5, 0, 0.5] });
        put(g, gx, 3.95, gz, rot, false); cnt.gateBoards = (cnt.gateBoards || 0) + 1;
      }
      // rules board beside Merchants' Gate
      const rb = G('rules', () => { const m = new AF.Model(22, 34, 3); m.box(2, 0, 1, 4, 20, 2, k.woodD); m.box(18, 0, 1, 20, 20, 2, k.woodD); m.box(0, 14, 0, 22, 34, 1, boardC); m.box(0, 33, 0, 22, 34, 3, k.woodD);
        for (let y = 17; y < 30; y += 3) for (let x = 3; x < 19; x++) if (hash(x, y) < 0.75) m.set(x, y, 1, k.board); m.box(6, 30, 1, 16, 32, 2, k.gold); return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }); });
      put(rb, -44.8, 0.25, -176.2, 0, true);
      // mum + ornamental kale beds: a ring round the fountain plaza, two crescents before the bandshell
      const mum = [c(0xc8452a, { jitter: 0.35, solid: false }), c(0xe8a030, { jitter: 0.35, solid: false }), c(0x8a2a4a, { jitter: 0.35, solid: false }), c(0xf0d060, { jitter: 0.35, solid: false }), c(0xb85aa0, { jitter: 0.3, solid: false })], kale = c(0x6a8a7a, { jitter: 0.4, solid: false }), kaleP = c(0x9a5a8a, { jitter: 0.4, solid: false });
      const bed = (x, z, r0, r1, a0, a1) => W.eachCol(x - r1, z - r1, x + r1, z + r1, (bx, bz, i, px, pz) => {
        const d = Math.hypot(px - x, pz - z), a = Math.atan2(pz - z, px - x); if (d < r0 || d > r1 || W.H[i] !== 1 || onPath(px, pz) || W.getM(px, 0.4, pz)) return; if (a1 != null && (a < a0 || a > a1)) return;
        W.C[i] = k.soil; const band = Math.floor((d - r0) / (r1 - r0) * 3), h = hash(bx * 5, bz * 3);
        W.setM(px, 0.4, pz, band === 1 ? (h < 0.5 ? kale : kaleP) : mum[Math.floor((a * 3 + 10) + h * 1.5) % 5]); cnt.mums = (cnt.mums || 0) + 1;
      });
      bed(F.fountain[0], F.fountain[1], 9.1, 10.6);
      bed(-10, -251, 11.5, 13, 0.35, 1.3); bed(-10, -251, 11.5, 13, 1.85, 2.8);
    }

    // ---- PARK-GOERS: picnic blankets + baskets, prams, ice-cream cart, pony ride, lake lamp standards, duck/swan spots
    {
      const c = AF.col, pink = c(0xf2a0b8, { jitter: 0.1, edge: 0.2 }), mint = c(0x9ad8c0, { jitter: 0.1, edge: 0.2 });
      const blanketC = [[k.red, k.white], [k.blue, k.white], [c(0x2e8a4a, { jitter: 0.2 }), c(0xf0e6c8, { jitter: 0.2 })], [c(0xe2b43a, { jitter: 0.2 }), k.white]];
      const basketG = G('basket', () => { const m = new AF.Model(5, 5, 4); m.box(0, 0, 0, 5, 3, 4, k.woodL); m.box(1, 2, 1, 4, 3, 3, k.canvasR); m.box(0, 3, 1, 1, 5, 3, k.woodD); m.box(4, 3, 1, 5, 5, 3, k.woodD); m.box(0, 4, 1, 5, 5, 3, k.woodD); m.set(2, 3, 2, k.yellow); return AF.meshModel(m, { vs: 1 / 8 }); });
      const pramG = G('pram', () => { const m = new AF.Model(10, 10, 6); m.box(1, 3, 0, 8, 7, 6, k.navy); m.box(1, 7, 0, 4, 10, 6, k.navy); m.box(2, 6, 1, 7, 7, 5, k.white); for (const x of [1, 7]) for (const z of [0, 5]) m.box(x, 0, z, x + 2, 3, z + 1, k.black); m.box(8, 7, 2, 10, 8, 4, k.chrome); m.line(8, 6, 3, 10, 9, 3, k.chrome); return AF.meshModel(m, { vs: 1 / 8 }); });
      const iceG = G('icecream', () => { const m = new AF.Model(14, 26, 9); m.box(1, 3, 1, 13, 10, 8, k.white); m.box(1, 6, 8, 13, 8, 9, pink); m.box(0, 10, 0, 14, 11, 9, mint); for (const x of [2, 11]) m.box(x, 0, 0, x + 1, 3, 2, k.black), m.box(x, 0, 7, x + 1, 3, 9, k.black); for (let x = 2; x < 12; x += 3) m.box(x, 11, 3, x + 2, 12, 5, [pink, k.yellow, mint, k.woodL][x % 4]); m.box(6, 11, 4, 7, 23, 5, k.chrome);
        for (let x = 0; x < 14; x++) for (let z = -3; z < 12; z++) { const d = Math.hypot(x + 0.5 - 6.5, z + 0.5 - 4.5); if (d < 7.5) m.set(x, 24 - Math.floor(d / 3.2), Math.max(0, Math.min(8, z)), (Math.floor((Math.atan2(z - 4.5, x - 6.5) + Math.PI) / 6.283 * 12) & 1) ? pink : k.white); } return AF.meshModel(m, { vs: 1 / 8 }); });
      const pic = [[-18, -212], [-46, -252], [-118, -262], [52, -196], [-100, -192], [30, -272]];
      pic.forEach(([x, z], n) => {
        if (!isFree(x, z, 1.5) || onPath(x, z) || lakeE(x, z) < 1.4) return;
        const [a, b] = blanketC[n % 4];
        W.eachCol(x - 1.25, z - 1, x + 1.25, z + 1, (bx, bz, i) => { W.C[i] = ((bx >> 1) + (bz >> 1)) & 1 ? a : b; });
        put(basketG, x + 0.6, 0.25, z - 0.4, n & 3, false);
        PKS.picnics = PKS.picnics || []; PKS.picnics.push([x, z, n]); if (!hasKit()) for (const [dx, yaw] of [[-0.6, Math.PI / 2], [0.1, -Math.PI / 2]]) AF.addSpot({ building: 'park-picnic', x: x + dx, y: 0.3, z: z + 0.3, yaw, kind: 'sit' });
        block(x - 2, z - 2, x + 2, z + 2); cnt.picnics = (cnt.picnics || 0) + 1;
      });
      for (const [x, z, r] of [[-38.5, -212, 0], [-71, -194, 1], [22, -194, 2]]) if (!onPath(x, z)) { put(pramG, x, 0.25, z, r, true); block(x - 1, z - 1, x + 1, z + 1); cnt.prams = (cnt.prams || 0) + 1; }
      put(iceG, 46, 0.25, -206, 0, true); block(44, -208, 48, -204); if (!hasKit()) AF.addSpot({ building: 'park-icecream', x: 46, y: 0.25, z: -207.4, yaw: 0, kind: 'work' }); AF.addSpot({ building: 'park-icecream', x: 46, y: 0.25, z: -204.2, yaw: Math.PI, kind: 'stand' });
      // pony ride: fenced ring with two ponies walking round, a keeper
      const px = 58, pz = -268, pr = 4.2;
      W.eachCol(px - pr - 0.5, pz - pr - 0.5, px + pr + 0.5, pz + pr + 0.5, (bx, bz, i, x, z) => { const d = Math.hypot(x - px, z - pz); if (d < pr) W.C[i] = k.sand; else if (d < pr + 0.25 && !(Math.abs(z - pz) < 0.8 && x < px)) W.fill(x - 0.125, 0.25, z - 0.125, x + 0.125, (bx + bz) % 5 === 0 ? 1.25 : 1.0, z + 0.125, (bx + bz) % 5 === 0 ? k.white : k.woodL); });
      block(px - pr - 1, pz - pr - 1, px + pr + 1, pz + pr + 1);
      const ponies = [];
      for (let i = 0; i < 2; i++) { const m = AF.modelMesh(horseGeo(i + 2)); m.scale.set(1.1, 1.1, 1.1); AF.scene.add(m); moving(m, 'horse'); ponies.push({ m, ph: i * Math.PI }); } PKS.ponies = ponies.map((o) => o.m);
      parkTick('park-ponies', 337, (dt, t) => { for (const o of ponies) { const a = o.ph + t * 0.25; o.m.position.set(px + Math.cos(a) * 2.6, 0.25 + Math.abs(Math.sin(t * 4 + o.ph)) * 0.04, pz + Math.sin(a) * 2.6); o.m.rotation.y = -a - Math.PI / 2; } });
      AF.addSpot({ building: 'park-ponies', x: px, y: 0.25, z: pz, yaw: 0, kind: 'work' }); AF.addLabel('Pony Rides', px, pz, 'place');
      for (let i = 0; i < 3; i++) AF.addSpot({ building: 'park-ponies', x: px - pr - 1.2, y: 0.25, z: pz - 1 + i, yaw: Math.PI / 2, kind: 'stand' });
      // lamp standards round the lake shore
      const lg = parkLampGeo(); let ll = 0;
      if (lg) for (let a = 0; a < Math.PI * 2; a += Math.PI * 2 / 12) {
        const x = LK.cx + Math.cos(a) * LK.rx * 1.2, z = LK.cz + Math.sin(a) * LK.rz * 1.24;
        if (!isFree(x, z, 0.8) || onPath(x, z) || W.groundY(x, z) !== 0.25 || W.getM(x, 0.4, z)) continue;
        put(lg, x, 0.25, z, 0, false); AF.addCollider(x - 0.2, 0.25, z - 0.2, x + 0.2, 3.9, z + 0.2); AF.addLight({ x, y: 3.6, z, color: 0xffcf8a, intensity: 1.0, range: 13, kind: 'street' }); block(x - 0.5, z - 0.5, x + 0.5, z + 0.5); ll++;
      }
      cnt.lakeLamps = ll;
      // lamps round the skating pond rim (their reflections streak across the pond at night)
      for (let a = 0.35; a < Math.PI * 2; a += Math.PI * 2 / 7) {
        const x = PD.cx + Math.cos(a) * (PD.r + 2.4), z = PD.cz + Math.sin(a) * (PD.r + 2.4);
        if (!inPark(x, z, 1.5) || !isFree(x, z, 0.6) || W.groundY(x, z) !== 0.25 || W.getM(x, 0.4, z)) continue;
        put(lg || parkLampGeo(), x, 0.25, z, 0, false); AF.addCollider(x - 0.2, 0.25, z - 0.2, x + 0.2, 3.9, z + 0.2); AF.addLight({ x, y: 3.6, z, color: 0xffcf8a, intensity: 1.0, range: 12, kind: 'street' }); block(x - 0.5, z - 0.5, x + 0.5, z + 0.5); cnt.pondLamps = (cnt.pondLamps || 0) + 1;
      }
      // duck + swan spots along the shore (on the water)
      for (let i = 0; i < 12; i++) { const sw = i < 4, a = sw ? 0.72 + i * 0.12 : (i - 4) / 8 * Math.PI * 2 + 1.6, rr = sw ? 0.78 + (i & 1) * 0.1 : 0.9, x = LK.cx + Math.cos(a) * LK.rx * rr, z = LK.cz + Math.sin(a) * LK.rz * rr; AF.addSpot({ building: 'park-lake', x, y: lakeY, z, yaw: a + Math.PI / 2, kind: 'duck', swan: sw }); }
      for (let i = 0; i < 4; i++) { const a = i / 4 * Math.PI * 2 + 0.5; AF.addSpot({ building: 'park-pond', x: PD.cx + Math.cos(a) * PD.r * 0.8, y: pondY, z: PD.cz + Math.sin(a) * PD.r * 0.8, yaw: a, kind: 'duck' }); }
      cnt.duckSpots = 16;
    }

    // ---- BIG AUTUMN TREES: AF.TREEKIT (land, 1/8 m branch-structured crowns) in a species mix, the elm MALL, muted leaf drifts
    {
      const rnd = AF.rng(4242), trees = [];
      const hasNature = AF.nature && typeof AF.nature.tree === 'function';
      const KIT = AF.TREEKIT && typeof AF.TREEKIT.place === 'function' ? AF.TREEKIT : null;
      // 12 distinct geometries only (each ~100 ms to build), variety from rotation (seed%4) + the variant (seed%3)
      const MIX = [['elm', 2, 0], ['maple-scarlet', 1, 0], ['red-oak', 1, 0], ['maple-gold', 1, 1], ['oak', 2, 0], ['maple-orange', 1, 0], ['elm', 1, 1], ['sweetgum', 1, 0], ['maple-scarlet', 1, 1], ['pin-oak', 1, 0], ['maple-gold', 2, 0], ['red-oak', 2, 1], ['pine', 1, 0]];
      const lit = [AF.col(0xa4622c, { jitter: 0.35, pat: 'none' }), AF.col(0xb08a36, { jitter: 0.35, pat: 'none' }), AF.col(0x8e4a2a, { jitter: 0.35, pat: 'none' }), AF.col(0x7e6a32, { jitter: 0.35, pat: 'none' }), AF.col(0xc07a34, { jitter: 0.3, pat: 'none' })];
      const litter = (x, z, cr) => W.eachCol(x - cr * 1.25, z - cr * 1.25, x + cr * 1.25, z + cr * 1.25, (bx, bz, i, px, pz) => {
        const d = Math.hypot(px - x - cr * 0.18, pz - z) / (cr * 1.2); if (d >= 1 || W.H[i] !== 1 || onPath(px, pz)) return;
        const n = AF.noise2(px * 0.55 + 7, pz * 0.55 - 3), h = hash(bx * 7 + 3, bz * 11 + 5);
        if (h < (1 - d) * (1 - d) * 0.9 * (0.25 + n * 1.1)) W.C[i] = lit[Math.floor(hash(bx >> 1, bz >> 1) * 4.99)];
      });
      const plant = (x, z, n, forceMix) => {
        let cr = 4, kind = 'kit', trunkR = 0.5;
        if (KIT) {
          const mx = forceMix || MIX[n % MIX.length], seed = mx[2] + 3 * Math.floor(rnd() * 4);
          try { const r = KIT.place(x, z, mx[0], mx[1], seed); cr = (r && r.crownR) || 5; kind = mx[0]; try { trunkR = KIT.info(mx[0], mx[1], seed).trunkR || 0.5; } catch (e) { } } catch (e) { kind = 'fail'; }
        }
        if (!KIT || kind === 'fail') {
          kind = n % 7 === 3 ? 'conifer' : n % 3 === 0 ? 'elm' : 'oak';
          if (ST().plantTree) { ST().plantTree(kind, x, z, Math.floor(rnd() * 8)); cr = kind === 'conifer' ? 3 : 6.5; }
          else if (hasNature) { const r = AF.nature.tree('autumn', x, z, 1.2, { y: 0.25 }); cr = (r && r.crownR) || 4; }
        }
        trees.push([x, z]); (PKS.trees = PKS.trees || []).push({ x, z, h: 13, kind, r: cr, trunkR });
        litter(x, z, Math.min(7, cr));
      };
      // the MALL: two rows of big elms either side of the promenade from the fountain north to the Pioneers column
      for (let z = -213; z >= -247; z -= 8.5) for (const x of [-46, -34]) { if (W.getM(x, 0.5, z)) continue; plant(x, z, 0, ['elm', 2, (z & 1)]); block(x - 1.5, z - 1.5, x + 1.5, z + 1.5); cnt.mallElms = (cnt.mallElms || 0) + 1; }
      // keep the eye-level hero cameras clear of trunks (CP2 lake, CP3 bandshell, CP4 gate)
      block(-64, -209, -56, -201); block(-14, -248, -6, -240); block(-44, -180, -36, -172);
      let tries = 0;
      while (trees.length < 84 && tries++ < 5000) {
        const x = PK.x0 + 4 + rnd() * (PK.x1 - PK.x0 - 8), z = PK.z0 + 4 + rnd() * (PK.z1 - PK.z0 - 8);
        if (lakeE(x, z) < 1.55 || pondD(x, z) < PD.r + 6) continue;
        if (!isFree(x, z, 3.5)) continue;
        let near = false; for (let dx = -3; dx <= 3 && !near; dx += 1.5) for (let dz = -3; dz <= 3; dz += 1.5) if (onPath(x + dx, z + dz)) { near = true; break; }
        if (near) continue;
        if (trees.some((t) => Math.hypot(t[0] - x, t[1] - z) < 10)) continue;
        if (W.getM(x, 0.5, z) || W.getM(x, 3, z)) continue;
        plant(x, z, trees.length);
      }
      cnt.trees = trees.length;
      // raked LEAF PILES (voxel domes) beside trees; the life hook stages keepers, a jumping kid and a smouldering pile
      PKS.piles = [];
      const pileC = [k.leafR, k.leafO, k.leafY, k.leafB, k.leafO];
      const prefer = [[-30, -214], [-56, -226], [14, -236], [-126, -214], [30, -222], [-70, -186], [-20, -282], [50, -254]];
      for (const [px0, pz0] of prefer) {
        let best = null;
        for (let a = 0; a < 16 && !best; a++) { const x = px0 + Math.cos(a * 2.4) * (a * 0.6), z = pz0 + Math.sin(a * 2.4) * (a * 0.6); let ok = inPark(x, z, 4) && lakeE(x, z) > 1.5 && pondD(x, z) > PD.r + 4 && isFree(x, z, 1.8) && !W.getM(x, 0.4, z) && W.groundY(x, z) === 0.25; for (let dx = -2.5; dx <= 2.5 && ok; dx += 1.25) for (let dz = -2.5; dz <= 2.5; dz += 1.25) if (onPath(x + dx, z + dz)) { ok = false; break; } if (ok) best = [x, z]; }
        if (!best) continue;
        const [x, z] = best, pr = 1.1 + (PKS.piles.length % 3) * 0.2;
        W.eachCol(x - pr - 0.5, z - pr - 0.5, x + pr + 0.5, z + pr + 0.5, (bx, bz, i, px, pz) => { const d = Math.hypot(px - x, pz - z); if (d < pr) { const h = Math.max(1, Math.round(Math.sqrt(1 - (d / pr) ** 2) * pr * 2.4)); for (let y = 0; y < h; y++) W.fill(px - 0.125, 0.25 + y * 0.25, pz - 0.125, px + 0.125, 0.5 + y * 0.25, pz + 0.125, pileC[Math.floor(hash(bx * 3 + y, bz * 5 - y) * 5)]); } else if (d < pr + 1.4 && W.H[i] === 1 && !onPath(px, pz) && hash(bx * 13, bz * 7) < 0.55 * (1 - (d - pr) / 1.4)) W.C[i] = pileC[Math.floor(hash(bz, bx) * 5)]; });
        block(x - pr - 1, z - pr - 1, x + pr + 1, z + pr + 1);
        PKS.piles.push({ x, z, r: pr, h: pr * 0.6 });
      }
      cnt.piles = PKS.piles.length;
      // shrub border inside the wall (every ~3 m, skip gates/paths)
      const shrub = (x, z) => { const r = 0.7 + hash(Math.round(x * 3), Math.round(z * 3)) * 0.5, c = k.shrub[Math.floor(hash(Math.round(z), Math.round(x)) * 4)]; W.eachCol(x - r, z - r, x + r, z + r, (bx, bz, i, px, pz) => { const d = Math.hypot(px - x, pz - z); if (d < r) W.fill(px - 0.125, 0.25, pz - 0.125, px + 0.125, 0.25 + Math.max(0.25, Math.round((r - d) * 4 * 0.9) * 0.25 + 0.25), pz + 0.125, c); }); cnt.shrubs++; };
      const edgeRun = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az); for (let s = 2; s < L - 2; s += 2.6) { const x = ax + (bx - ax) * s / L, z = az + (bz - az) * s / L; if (onPath(x, z) || !isFree(x, z, 0.5) || lakeE(x, z) < 1.3 || W.getM(x, 0.4, z)) continue; let np = false; for (const [dx, dz] of [[1.5, 0], [-1.5, 0], [0, 1.5], [0, -1.5]]) if (onPath(x + dx, z + dz)) np = true; if (!np) shrub(x, z); } };
      edgeRun(PK.x0 + 1.6, PK.z1 - 1.6, PK.x1 - 1.6, PK.z1 - 1.6); edgeRun(PK.x0 + 1.6, PK.z0 + 1.6, PK.x1 - 1.6, PK.z0 + 1.6);
      edgeRun(PK.x0 + 1.6, PK.z0 + 1.6, PK.x0 + 1.6, PK.z1 - 1.6); edgeRun(PK.x1 - 1.6, PK.z0 + 1.6, PK.x1 - 1.6, PK.z1 - 1.6);
      // flower beds by the Park Row gates
      for (const gx of [-40, 0, -80]) for (const e of [-1, 1]) {
        const cx = gx + e * 6, cz = PK.z1 - 3.2;
        W.eachCol(cx - 2, cz - 1, cx + 2, cz + 1, (xb, zb, i, x, z) => { if (W.H[i] === 1 && !onPath(x, z) && !W.getM(x, 0.4, z)) { W.C[i] = k.soil; const h = hash(xb * 3, zb * 7); if (h < 0.85) W.setM(x, 0.4, z, k.flower[Math.floor(h * 7) % 6]); } });
        cnt.flowerBeds++;
      }
    }
    AF.addViewpoint('Central Park', [-40, 45, -150], [-40, 0, -235]);
    AF.addLabel('Central Park', -40, -230, 'place');
    PKS.ms = Math.round(performance.now() - t0);
  });

  // ------------------------------------------------------------ PARK LIFE (before region meshing): a band that plays, rowers pulling oars,
  // skaters, nannies with prams, keepers raking, a kid leaping into a leaf pile, the swan feeder, couples strolling, kite kids,
  // carousel + pony riders (animated, AF.peopleKit), and a seated/standing crowd baked into the static world (free to draw).
  AF.onBuild('park-life', 490, () => {
    const k = pal(), K2 = AF.peopleKit, lakeY = (AF.land && AF.land.LAKE_Y) ?? LK.waterY ?? -0.75;
    const life = PKS.life = { actors: 0, baked: 0, boats: 0 };
    const root = new THREE.Group(); root.name = 'park-life'; AF.scene.add(root);
    const rnd = AF.rng(1936);
    const BGU = AF.addons && AF.addons.BGU;
    const look = (role, g, age, fix) => { try { const L = K2.makeLook(role, g, age, rnd); if (fix) fix(L); return L; } catch (e) { return null; } };
    const actors = [];
    const actor = (L, x, y, z, yaw, par) => { if (!hasKit() || !L) return null; try { const p = K2.buildPerson(L); p.root.position.set(x, y, z); p.root.rotation.y = yaw; (par || root).add(p.root); actors.push(p); life.actors++; return p; } catch (e) { return null; } };
    const seat = (p) => { if (p && p.legBG) { p.legL.geometry = p.legBG; p.legR.geometry = p.legBG; } return p; };
    // Bake static spectators before region meshing, collecting nearby figures into shared props.
    const bakeList = [];
    const bake = (L, x, y, z, yaw, pose) => {
      if (!hasKit() || !L || !BGU) return;
      try {
        const p = K2.buildPerson(L); if (pose === 'sit') seat(p);
        if (pose && pose.arms) { p.armR.rotation.x = pose.arms[0]; p.armL.rotation.x = pose.arms[1]; }
        p.root.position.set(x, pose === 'sit' || (pose && pose.sit) ? y - p.hipY + 0.02 : y, z); p.root.rotation.y = yaw;
        if (pose && pose.sit) seat(p);
        p.root.updateMatrixWorld(true);
        p.root.traverse((o) => { if (o.isMesh && o.geometry && o.geometry.attributes.aPal) { const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); const an = g.attributes.aAN.array, mp = remapN(o.matrixWorld); for (let i = 0; i < an.length; i++) { const n = an[i] % 8; an[i] = an[i] - n + mp[n]; } bakeList.push(g); } });
        life.baked++;
      } catch (e) { }
    };
    const AX = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]], _v = new THREE.Vector3(), _m3 = new THREE.Matrix3();
    const remapN = (mw) => { _m3.setFromMatrix4(mw); return AX.map((a) => { _v.set(a[0], a[1], a[2]).applyMatrix3(_m3); const ax = Math.abs(_v.x), ay = Math.abs(_v.y), az = Math.abs(_v.z); return ax >= ay && ax >= az ? (_v.x > 0 ? 0 : 1) : ay >= az ? (_v.y > 0 ? 2 : 3) : (_v.z > 0 ? 4 : 5); }); };
    const SEATY = (p, seatY) => seatY - p.hipY + 0.02;
    const W8 = 0xf3f0e6, GOLDC = 0xd4a83e;
    const bandLook = (fix) => look('conductor', 'm', 'adult', (L) => { L.top = { style: 'conductor', col: W8, col2: 0xe4ddc8, col3: GOLDC }; L.bottom = { style: 'pants', col: W8 }; L.hat = 'conductor'; L.hatCol = W8; L.shoes = 0x1a1a1a; L.propR = null; L.propL = null; if (fix) fix(L); });
    // ---- instruments (tiny voxel models, 1/16 m)
    const inst = {};
    const brassC = AF.MAT && AF.MAT.brass ? AF.MAT.brass : k.brass;
    { let m = new AF.Model(3, 3, 9); m.box(1, 1, 0, 2, 2, 7, brassC); m.box(0, 0, 6, 3, 3, 9, brassC); m.box(1, 2, 2, 2, 3, 4, brassC); inst.trumpet = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] });
      m = new AF.Model(3, 3, 14); m.box(1, 1, 0, 2, 2, 14, brassC); m.box(0, 0, 11, 3, 3, 14, brassC); inst.bone = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] });
      m = new AF.Model(3, 5, 2); m.box(1, 0, 0, 2, 5, 2, brassC); m.box(0, 4, 0, 3, 5, 2, brassC); inst.slide = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] });
      m = new AF.Model(2, 2, 8); m.box(0, 0, 0, 2, 2, 8, k.black); m.box(0, 0, 7, 2, 2, 8, k.chrome); inst.clar = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] });
      m = new AF.Model(7, 12, 6); m.box(1, 0, 1, 6, 6, 5, brassC); m.box(2, 6, 2, 5, 9, 4, brassC); m.box(0, 9, 0, 7, 12, 6, brassC); m.box(1, 10, 1, 6, 12, 5, k.black); inst.tuba = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
      m = new AF.Model(1, 1, 7); m.box(0, 0, 0, 1, 1, 7, k.white); inst.baton = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] });
      m = new AF.Model(1, 1, 5); m.box(0, 0, 0, 1, 1, 5, k.woodL); inst.stick = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] });
      m = new AF.Model(9, 2, 30); m.box(4, 0, 0, 5, 1, 30, k.woodL); m.box(0, 0, 27, 9, 2, 29, k.woodD); for (let x = 0; x < 9; x += 2) m.box(x, -0, 29, x + 1, 1, 30, k.woodD); inst.rake = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] });
      m = new AF.Model(2, 2, 36); m.box(0, 0, 0, 2, 2, 28, k.woodL); m.box(0, 0, 26, 2, 2, 36, k.woodD); m.box(-0, 0, 29, 2, 2, 36, k.white); inst.oar = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0.5, 0] });
      m = new AF.Model(15, 6, 15); for (let x = 0; x < 15; x++) for (let z = 0; z < 15; z++) { const d = Math.hypot(x - 7, z - 7); if (d < 7.4) m.set(x, 5 - Math.floor(d / 2.2), z, (Math.floor(Math.atan2(z - 7, x - 7) * 1.9) & 1) ? k.white : AF.col(0xf2a0b8, { jitter: 0.1 })); } for (let y = 0; y < 5; y++) m.set(7, y, 7, k.woodD); inst.parasol = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] });
      m = new AF.Model(2, 3, 2); m.box(0, 0, 0, 2, 2, 2, k.white); m.set(0, 2, 0, k.white); inst.piece = AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }); }
    const im = (g, par, x, y, z) => { const me = AF.modelMesh(g); me.castShadow = false; me.position.set(x, y, z); par.add(me); return me; };
    const A = [];   // animated: {p, fn(t, dt, a)}
    const chestY = (p) => p.B.th * 1 / 16 * 0.78;

    // ---- THE BAND (white uniforms, gold braid) + conductor; the bandshell glows at night
    const bx = F.bandshell[0], sy = 1.25;
    const band = [
      { x: -3.5, z: -265.4, ins: 'trumpet' }, { x: -1.2, z: -265.2, ins: 'trumpet' }, { x: 1.3, z: -265.2, ins: 'bone' },
      { x: 3.6, z: -265.5, ins: 'clar' }, { x: 5.8, z: -266.8, ins: 'tuba' }, { x: 0, z: -270.4, ins: 'drum' }, { x: -6, z: -267.1, ins: 'piano' },
    ];
    band.forEach((b, i) => {
      const L = bandLook((L) => { if (i === 3) L.glasses = 'gold'; if (i === 4) L.moustache = true; });
      const sitting = b.ins === 'drum' || b.ins === 'piano';
      const p = actor(L, bx + b.x, sy, b.z, b.ins === 'piano' ? Math.PI : 0); if (!p) return;
      if (sitting) { seat(p); p.root.position.y = SEATY(p, sy + 0.55); }
      const cy = chestY(p), hy = p.B.th / 16;
      let slide = null;
      if (b.ins === 'trumpet' || b.ins === 'bone') { const m = im(inst[b.ins], p.hips, 0, hy + 0.1, 0.14); m.rotation.x = -0.15; if (b.ins === 'bone') slide = im(inst.slide, m, 0, -0.06, 0.35); }
      if (b.ins === 'clar') { const m = im(inst.clar, p.hips, 0, hy + 0.08, 0.12); m.rotation.x = 0.9; }
      if (b.ins === 'tuba') im(inst.tuba, p.hips, 0.05, 0.02, 0.2);
      if (b.ins === 'drum') { im(inst.stick, p.armL, 0, -p.B.ah / 16, 0.02); im(inst.stick, p.armR, 0, -p.B.ah / 16, 0.02); }
      A.push({ p, fn: (t) => {
        const beat = t * 2 * Math.PI * 1.1 + i * 0.4, s = Math.sin(beat);
        p.hips.rotation.z = Math.sin(beat * 0.5) * 0.05; p.body.position.y = 0;
        if (b.ins === 'trumpet' || b.ins === 'bone' || b.ins === 'clar') {
          const up = b.ins === 'clar' ? -0.9 : -1.35; p.armR.rotation.x = up + s * 0.06; p.armL.rotation.x = up + 0.05 + (b.ins === 'bone' ? 0.25 : 0) + s * 0.05; p.armR.rotation.z = 0.35; p.armL.rotation.z = -0.35;
          p.hips.rotation.x = -0.06 + Math.max(0, s) * 0.06; if (slide) slide.position.z = 0.35 + (Math.sin(beat * 0.5) * 0.5 + 0.5) * 0.4;
          p.legL.rotation.x = Math.max(0, Math.sin(beat)) * -0.15;
        } else if (b.ins === 'tuba') { p.armR.rotation.x = -0.8; p.armL.rotation.x = -0.6; p.body.position.y = Math.abs(s) * 0.03; }
        else if (b.ins === 'drum') { p.armR.rotation.x = -0.7 - Math.max(0, Math.sin(beat * 2)) * 0.5; p.armL.rotation.x = -0.7 - Math.max(0, -Math.sin(beat * 2)) * 0.5; }
        else { p.armR.rotation.x = -0.9 + Math.sin(t * 9) * 0.08; p.armL.rotation.x = -0.9 + Math.cos(t * 7.3) * 0.08; p.hips.rotation.z = Math.sin(t * 1.6) * 0.08; }
      } });
    });
    { const p = actor(bandLook((L) => { L.moustache = true; L.hair = 0x9a968f; L.hat = null; L.hairStyle = 'bald'; }), bx, sy, -263.3, Math.PI);
      if (p) { im(inst.baton, p.armR, 0, -p.B.ah / 16, 0.03).rotation.x = 1.2;
        A.push({ p, fn: (t) => { const ph = t * 2 * Math.PI * 1.1 / 3; p.armR.rotation.x = -1.5 + Math.sin(ph * 3) * 0.4; p.armR.rotation.z = 0.25 + Math.cos(ph * 3) * 0.3; p.armL.rotation.x = -1.2 + Math.sin(ph * 1.5) * 0.25; p.armL.rotation.z = -0.3; p.hips.rotation.x = 0.06 + Math.sin(ph * 3) * 0.04; } }); } }
    // audience: half the green chairs taken (baked static), facing the stage
    { let n = 0;
      for (let row = 0; row < 6; row++) for (let j = 0; j < 10; j++) {
        const side = j < 5 ? -1 : 1, jj = j % 5, x = bx + side * (1.75 + jj * 1.55), z = -256.5 + row * 1.7, h = hash(row * 7 + 3, j * 5 + 1);
        if (h > 0.55 - (row < 2 ? 0.2 : 0)) continue;
        const age = h < 0.08 ? 'kid' : h < 0.22 ? 'elder' : 'adult', g = hash(j, row) < 0.5 ? 'f' : 'm';
        bake(look(age === 'elder' ? (g === 'f' ? 'grandma' : 'grandpa') : age === 'kid' ? 'kid' : 'citizen', g, age), x, 0.75, z, Math.PI, { sit: true, arms: [-0.5, -0.45] }); n++;
      }
      life.audience = n; }

    // ---- ROWBOATS: 7 boats rowed round Swan Lake (oars dip and sweep), 3 with a lady under a parasol
    const bg = boatGeo();
    const boatHold = new THREE.Group(), bh1 = new THREE.Group(); bh1.add(boatHold); root.add(bh1);   // depth 3+: see the moored boats note
    const orbits = [[-92, -240, 14, 9, 0.05, 1], [-79, -240, 9, 7, 0.07, -1], [-104, -249, 9, 4.5, 0.06, 1], [-90, -236, 18, 12, 0.035, -1], [-90, -232, 7, 4.5, 0.08, 1], [-76, -231, 6.5, 3.8, 0.075, -1], [-112, -245, 5.5, 5.5, 0.07, 1]];
    const boats = [];
    orbits.forEach(([ocx, ocz, orx, orz, sp, dir], i) => {
      const g = new THREE.Group(), hull = AF.modelMesh(bg); g.add(hull); boatHold.add(g); moving(hull, 'hull');
      const oars = [];
      for (const s of [-1, 1]) { const piv = new THREE.Group(); piv.position.set(0.15, 0.58, s * 0.62); g.add(piv); const o = im(inst.oar, piv, 0, 0, 0); o.rotation.y = s > 0 ? 0 : Math.PI; o.position.z = -s * 0.45; moving(o, 'oar'); oars.push({ piv, s }); }
      const rower = actor(look(i % 3 === 1 ? 'boatman' : 'citizen', i === 4 ? 'f' : 'm', i === 2 ? 'teen' : 'adult'), 0.35, 0, 0, -Math.PI / 2, g);
      if (rower) { seat(rower); rower.root.position.y = SEATY(rower, 0.52); }
      let pass = null;
      if (i % 2 === 0) { pass = actor(look('citizen', 'f', 'adult', (L) => { L.propR = null; L.propL = null; }), -0.95, 0, 0, Math.PI / 2, g); if (pass) { seat(pass); pass.root.position.y = SEATY(pass, 0.45); const ps = im(inst.parasol, pass.armR, 0, -pass.B.ah / 16, 0.05); ps.rotation.x = 1.9; pass.armR.rotation.x = -2.2; } }
      boats.push({ g, oars, rower, pass, ocx, ocz, orx, orz, sp, dir, ph: i * 1.9 });
    });
    life.boats = boats.length; if (PKS.counts) PKS.counts.boats = (PKS.counts.boats || 0) + boats.length;

    // ---- SKATERS on the roller rink (arm swing, push-offs, one couple hand in hand, a wobbly kid)
    const rcx = 55, rcz = -236, rrx = 10, rrz = 6.5, skaters = [];
    for (let i = 0; i < 9; i++) {
      const age = i === 3 || i === 7 ? 'kid' : i % 3 === 0 ? 'teen' : 'adult', g = i % 2 ? 'f' : 'm';
      const p = actor(look(age === 'kid' ? 'kid' : age === 'teen' ? 'teen' : 'citizen', g, age), rcx, 0.25, rcz, 0); if (!p) continue;
      skaters.push({ p, ph: i / 9 * Math.PI * 2 + (i === 5 ? -0.12 : 0), sp: 0.28 + (i % 4) * 0.03 * (age === 'kid' ? 0.6 : 1), r: 0.62 + (i % 3) * 0.12 + (i === 5 ? 0.02 : 0), kid: age === 'kid' });
    }

    // ---- walkers on the lake loop: nannies pushing prams, two couples arm in arm
    const pramG = G('pram', () => null);
    const loopRX = LK.rx * 1.3, loopRZ = LK.rz * 1.38, walkers = [];
    const walker = (L, ph, dir, off, pram) => { const p = actor(L, 0, 0.25, 0, 0); if (!p) return; let pm = null; if (pram && pramG) { pm = AF.modelMesh(pramG); root.add(pm); moving(pm, 'pram'); } walkers.push({ p, ph, dir, off, pm, sp: pram ? 0.018 : 0.015 }); };
    walker(look('nurse', 'f', 'adult'), 0.4, 1, 0, true); walker(look('nurse', 'f', 'adult'), 3.3, -1, 0, true); walker(look('grandma', 'f', 'elder'), 4.9, 1, 0, true);
    walker(look('citizen', 'm', 'adult'), 1.8, -1, -0.28, false); walker(look('citizen', 'f', 'adult'), 1.8, -1, 0.28, false);
    walker(look('citizen', 'm', 'elder'), 5.6, 1, -0.28, false); walker(look('grandma', 'f', 'elder'), 5.6, 1, 0.28, false);
    // Mall promenaders: two couples arm in arm + a nanny with a pram, walking the elm allee (they keep strolling at night)
    { const n0 = walkers.length; walker(look('citizen', 'm', 'adult'), 5, 1, -0.28, false); walker(look('citizen', 'f', 'adult'), 5, 1, 0.28, false);
      walker(look('citizen', 'm', 'elder'), 47, 1, -0.28, false); walker(look('grandma', 'f', 'elder'), 47, 1, 0.28, false); walker(look('nurse', 'f', 'adult'), 70, 1, 0, true);
      for (let i = n0; i < walkers.length; i++) walkers[i].mall = true; }

    // ---- KEEPERS raking the leaf piles; one pile smoulders; a kid runs and leaps into another
    const piles = PKS.piles || [], rakers = [];
    const keeperL = () => look('boatman', 'm', 'adult', (L) => { L.top = { style: 'coverall', col: 0x4f6a4a, col2: 0x3a5238 }; L.bottom = { style: 'pants', col: 0x4f6a4a }; L.overalls = null; L.hat = 'flatcap'; L.hatCol = 0x3a4a38; L.propR = null; });
    [0, 2, 4].forEach((pi) => { const q = piles[pi]; if (!q) return; const x = q.x + q.r + 1.3, z = q.z + 0.6; const p = actor(keeperL(), x, 0.25, z, -Math.PI / 2); if (!p) return; const r = im(inst.rake, p.hips, 0, p.B.th / 16 * 0.6, 0.15); r.rotation.x = 0.95; rakers.push({ p, r, ph: pi }); });
    if (piles[0]) AF.addChimney(piles[0].x, 0.25 + piles[0].h, piles[0].z);
    let jumper = null;
    if (piles[1]) { const q = piles[1], p = actor(look('kid', 'm', 'kid'), q.x - 6, 0.25, q.z, Math.PI / 2); if (p) jumper = { p, q }; }
    if (piles[3]) { const q = piles[3]; bake(look('kid', 'f', 'kid'), q.x - q.r - 0.9, 0.25, q.z + 0.3, Math.PI / 2, { arms: [-2.6, -2.4] }); }
    // leaf burst particles for the jumper
    const NL = 36, leafIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.14, 0.1), new THREE.MeshLambertMaterial({ side: THREE.DoubleSide }), NL);
    { const lc = [0xb8452a, 0xd57a2c, 0xd9a93a, 0x8a5a2c].map((h) => new THREE.Color(h)); for (let i = 0; i < NL; i++) leafIM.setColorAt(i, lc[i % 4]); }
    leafIM.frustumCulled = false; root.add(leafIM);
    const leafV = new Float32Array(NL * 6); let burstT = -1;
    const dm = new THREE.Object3D();

    // ---- the SWAN FEEDER on the SE shore (the swan spots cluster in front of him), kite kids, carousel + pony riders
    let feeder = null;
    { const a = 0.9, x = LK.cx + Math.cos(a) * LK.rx * 1.1, z = LK.cz + Math.sin(a) * LK.rz * 1.1; const p = actor(look('grandpa', 'm', 'elder', (L) => { L.propR = null; }), x, 0.25, z, Math.atan2(LK.cx - x, LK.cz - z)); if (p) feeder = p; }
    let kiteKid = null;
    { const kx = -24, kz = -228, p = actor(look('kid', 'm', 'kid'), kx, 0.25, kz, Math.atan2(-14, -22)); if (p) kiteKid = p; bake(look('citizen', 'm', 'adult'), kx + 1.1, 0.25, kz + 0.6, 2, { arms: [-0.3, 0] }); }
    const riders = [];
    if (PKS.carouselHorses) PKS.carouselHorses.forEach((h, i) => { if (i % 3 !== 0) return; const p = actor(look('kid', i % 2 ? 'f' : 'm', 'kid'), 0.1, 0, 0, Math.PI / 2, h); if (p) { seat(p); p.root.position.y = 0.95 - p.hipY; p.legL.rotation.z = 0.35; p.legR.rotation.z = -0.35; riders.push(p); } });
    if (PKS.ponies) PKS.ponies.forEach((h, i) => { const p = actor(look('kid', i ? 'f' : 'm', 'kid'), 0.1, 0, 0, Math.PI / 2, h); if (p) { seat(p); p.root.position.y = 0.8 / 1.1 - p.hipY; p.armR.rotation.x = -0.6; p.armL.rotation.x = -0.6; } });

    // ---- static crowd: chess players + kibitzers, picnickers, vendors at their carts, bench readers
    const chess = [[-52, -194], [-47, -194]];
    chess.forEach(([x, z], i) => { bake(look('grandpa', 'm', 'elder'), x - 1.1, 0.75, z, Math.PI / 2, { sit: true, arms: [-1.0, -0.5] }); bake(look(i ? 'grandpa' : 'citizen', 'm', 'elder'), x + 1.1, 0.75, z, -Math.PI / 2, { sit: true, arms: [-0.45, -0.9] }); });
    bake(look('citizen', 'm', 'adult'), -49.5, 0.25, -195.2, 0.3, { arms: [0, 0] });
    const pieces = chess.map(([x, z]) => { const m = AF.modelMesh(inst.piece); m.castShadow = false; m.position.set(x, 1.0, z); root.add(m); return { m, x, z }; });
    (PKS.picnics || []).forEach(([x, z, n]) => { bake(look(n % 2 ? 'citizen' : 'teen', 'f', n % 2 ? 'adult' : 'teen'), x - 0.6, 0.27, z + 0.3, Math.PI / 2, { sit: true, arms: [-0.6, -0.3] }); bake(look('citizen', 'm', 'adult'), x + 0.3, 0.27, z + 0.3, -Math.PI / 2, { sit: true, arms: [-0.2, -0.7] }); if (n % 3 === 0) bake(look('kid', n % 2 ? 'm' : 'f', 'kid'), x + 1.6, 0.25, z - 0.9, 0.8, { arms: [-2.2, -0.2] }); });
    bake(look('cook', 'm', 'adult', (L) => { L.hat = 'paper'; }), -18, 0.25, -189.3, 0, { arms: [-0.9, -0.7] });
    bake(look('citizen', 'm', 'adult', (L) => { L.top = { style: 'striped', col: 0xf3f0e6, col2: 0xb3342c }; L.hat = 'straw'; L.hatCol = 0xd8b86a; }), 6.1, 0.25, -188.4, 0, { arms: [-1.3, 0] });
    bake(look('icecream', 'f', 'adult'), 46, 0.25, -207.2, 0, { arms: [-0.8, -0.8] });
    bake(look('kid', 'f', 'kid'), 7.2, 0.25, -187.4, Math.PI + 0.6, { arms: [-0.4, 0] }); bake(look('citizen', 'f', 'adult'), 8.0, 0.25, -187.9, -2.2, { arms: [0, 0] });
    bake(look('kid', 'm', 'kid'), -17.2, 0.25, -186.0, Math.PI, { arms: [-0.7, 0] });

    // ---- EXTRAS (round 2): model sailboats on the pond with kids at the rim, squirrels up the trunks, hot-chestnut cart with steam,
    //      sitters along the Mall benches, a grandpa feeding pigeons
    const extras = { yachts: [], squirrels: [], kids: [] };
    {
      const c = AF.col, pondY = (AF.land && AF.land.POND_Y) ?? -0.5;
      const sailC = [0xf4f0e4, 0xc8372b, 0x2d4f8a, 0xe2b43a, 0xf4f0e4, 0x2e8a7a];
      sailC.forEach((sc, i) => {
        const g = G('yacht' + i, () => { const m = new AF.Model(13, 16, 3), hull = i % 2 ? k.navy : k.white, sail = c(sc, { jitter: 0.04, edge: 0.15 }), stripe = i % 2 ? k.gold : k.red;
          m.box(2, 0, 0, 11, 2, 3, hull); m.box(1, 1, 0, 2, 2, 3, hull); m.box(11, 1, 1, 12, 2, 2, hull); m.box(2, 2, 0, 11, 3, 3, k.woodL); m.box(2, 1, 0, 11, 2, 1, stripe); m.box(2, 1, 2, 11, 2, 3, stripe);
          m.box(6, 3, 1, 7, 16, 2, k.woodD); for (let y = 4; y < 15; y++) { const w = Math.ceil((15 - y) * 0.45); m.box(7, y, 1, 7 + w, y + 1, 2, sail); } for (let y = 4; y < 12; y++) { const w = Math.ceil((12 - y) * 0.45); m.box(6 - w, y, 1, 6, y + 1, 2, sail); }
          m.set(6, 15, 1, k.red); return AF.meshModel(m, { vs: 1 / 16, anchor: [0.5, 0, 0.5] }); });
        const me = AF.modelMesh(g); me.castShadow = false; me.scale.setScalar(1.5); root.add(me); moving(me, 'yacht'); extras.yachts.push({ m: me, ph: i * 1.7, w: 0.05 + i * 0.008, rx: PD.r * (0.35 + (i % 3) * 0.17), rz: PD.r * (0.3 + ((i + 1) % 3) * 0.16), y: pondY - 0.04 });
      });
      // kids with sticks at the rim, one crouched launching a boat; a mother on the rim bench
      [[2.25, 'm'], [2.7, 'f'], [0.55, 'm']].forEach(([a, gg], i) => { const x = PD.cx + Math.cos(a) * (PD.r + 0.95), z = PD.cz + Math.sin(a) * (PD.r + 0.95); const p = actor(look('kid', gg, 'kid'), x, 0.25, z, Math.atan2(PD.cx - x, PD.cz - z)); if (p) { const st = im(inst.stick, p.armR, 0, -p.B.ah / 16, 0.1); st.scale.set(1, 1, 3.2); st.rotation.x = 0.6; extras.kids.push({ p, ph: i * 2.1, crouch: i === 1 }); } });
      bake(look('citizen', 'f', 'adult'), PD.cx + Math.cos(2.45) * (PD.r + 2.3), 0.25, PD.cz + Math.sin(2.45) * (PD.r + 2.3), Math.atan2(Math.cos(2.45), Math.sin(2.45)) + Math.PI, { arms: [-0.2, -0.5] });
      // squirrels: bushy-tailed, hop round the base of a tree, dash up the trunk, sit on a limb, come down
      const sqG = [0, 1].map((f) => G('sq' + f, () => { const m = new AF.Model(10, 9, 3), b = c(0x8a5a3a, { jitter: 0.15 }), bl = c(0xb07a4e, { jitter: 0.15 }), tl = c(0x9a6a44, { jitter: 0.2 });
        m.box(3, 1, 0, 7, 4, 3, b); m.box(6, 3, 0, 9, 6, 3, b); m.set(9, 4, 1, k.black); m.set(7, 5, 0, k.black); m.set(7, 5, 2, k.black); m.set(7, 6, 0, b); m.set(7, 6, 2, b); m.box(4, 1, 1, 6, 2, 2, bl);
        m.box(3, 0, 0, 4, 1, 1, b); m.box(3, 0, 2, 4, 1, 3, b); m.box(6, 0, 0, 7, 1 + f, 1, b); m.box(6, 0, 2, 7, 1 + f, 3, b);
        m.box(0, 2, 0, 3, 8, 3, tl); m.box(1, 8, 0, 4, 9, 3, tl); m.box(0, 3 + f, 1, 1, 7, 2, bl); return AF.meshModel(m, { vs: 1 / 20, anchor: [0.5, 0, 0.5] }); }));
      const tr = (PKS.trees || []).filter((q) => q.kind !== 'fail' && q.kind !== 'pine');
      const pick = [0, 3, 6, 9, 13, 18, 24, 31, 40, 52].map((i) => tr[i]).filter(Boolean);
      pick.forEach((q, i) => { const me = new THREE.Mesh(sqG[0], AF.mat.voxel); me.castShadow = false; root.add(me); moving(me, 'squirrel'); extras.squirrels.push({ m: me, q, ph: i * 3.7, ang: i * 1.3, r: Math.max(0.35, Math.min(0.9, (q.trunkR || 0.5))) + 0.08 }); });
      life.squirrels = extras.squirrels.length; extras.sqG = sqG;
      // hot-chestnut cart just inside Merchants' Gate: glowing brazier + steam
      const chG = G('chestnut', () => { const m = new AF.Model(16, 24, 9), rd = c(0x8e2a21, { jitter: 0.15, edge: 0.3 }), coal = c(0xff7a30, { emit: 0xff5a1a, emitK: 2.6, mode: 'always', jitter: 0.2, edge: 0 });
        m.box(2, 4, 1, 14, 12, 8, rd); m.box(2, 12, 1, 14, 13, 8, k.gold); for (const x of [3, 12]) m.box(x, 0, 0, x + 2, 5, 1, k.black), m.box(x, 0, 8, x + 2, 5, 9, k.black); m.box(14, 9, 3, 16, 10, 6, k.woodD);
        m.box(5, 13, 2, 11, 15, 7, k.black); m.box(6, 15, 3, 10, 16, 6, coal); m.box(7, 16, 3, 9, 17, 6, k.iron); m.box(12, 13, 2, 14, 24, 3, k.iron); m.box(3, 13, 6, 5, 16, 8, k.woodL);
        for (let x = 2; x < 14; x += 3) m.set(x, 8, 8, k.white); return AF.meshModel(m, { vs: 1 / 12, anchor: [0.5, 0, 0.5] }); });
      put(chG, -35.2, 0.25, -181.5, 0, true);
      const chT = AF.meshModel(AF.textModel('CHESTNUTS', k.white, { pad: 1, bg: c(0x8e2a21, { jitter: 0.05 }) }), { vs: 1 / 50, anchor: [0.5, 0, 0.5] }); put(chT, -35.2, 0.25 + 0.5, -181.5 + 0.42, 0, false);
      AF.addChimney(-35.2, 1.6, -181.5); AF.addLight({ x: -35.2, y: 1.6, z: -181.5, color: 0xff9a50, intensity: 0.7, range: 5, kind: 'porch' });
      bake(look('citizen', 'm', 'elder', (L) => { L.hat = 'flatcap'; L.hatCol = 0x4a3a2a; }), -35.2, 0.25, -182.4, 0, { arms: [-0.9, -0.4] });
      bake(look('kid', 'f', 'kid'), -35.4, 0.25, -180.1, Math.PI, { arms: [-0.8, 0] }); bake(look('citizen', 'f', 'adult'), -33.9, 0.25, -180.5, Math.PI + 0.5, { arms: [-0.3, 0] });
      // Mall bench sitters (baked): readers, a couple, a nanny with a pram, a man feeding pigeons
      const mb = [[-43.2, -218.6, 1], [-36.8, -224.4, -1], [-43.2, -233, 1], [-36.8, -241.4, -1], [-36.8, -215.9, -1], [-43.2, -244.1, 1]];
      mb.forEach(([x, z, f], i) => { const yaw = f > 0 ? Math.PI / 2 : -Math.PI / 2; bake(look(i % 3 === 0 ? 'grandpa' : 'citizen', i % 2 ? 'f' : 'm', i % 3 === 0 ? 'elder' : 'adult'), x + f * 0.1, 0.25 + 3 / 8 + 0.12, z, yaw, { sit: true, arms: [i === 5 ? -1.1 : -0.7, -0.5] }); });
      AF.addSpot({ building: 'park-mall', x: -41.6, y: 0.25, z: -244.3, yaw: 0, kind: 'pigeon' });
      (PKS.cafe || []).forEach(([x, z], i) => { bake(look('citizen', i ? 'm' : 'f', 'adult'), x - 0.75, 0.5 + 4 / 8, z, Math.PI / 2, { sit: true, arms: [-1.2, -0.4] }); bake(look(i ? 'kid' : 'grandma', 'f', i ? 'kid' : 'elder'), x + 0.75, 0.5 + 4 / 8, z, -Math.PI / 2, { sit: true, arms: [-0.9, -0.5] }); });
      bake(look('kid', 'm', 'kid'), 30.75, 0.5 + 0.5, -245.6, 0, { sit: true, arms: [-1.3, -1.3] });
    }
    // ---- bake: static props merged into the world regions
    if (bakeList.length && BGU) {
      const cells = new Map();
      for (const g of bakeList) { g.computeBoundingBox(); const c = g.boundingBox.getCenter(new THREE.Vector3()), key = Math.floor(c.x / 48) + ',' + Math.floor(c.z / 48); if (!cells.has(key)) cells.set(key, []); cells.get(key).push(g); }
      for (const list of cells.values()) {
        try { const mg = BGU.mergeGeometries(list, false); if (!mg) continue; mg.computeBoundingBox(); const center = mg.boundingBox.getCenter(new THREE.Vector3()); mg.translate(-center.x, 0, -center.z); put(mg, center.x, 0, center.z, 0, false); for (const source of list) source.dispose(); } catch (e) { }
      }
    }
    life.dyn = A.length + boats.length + skaters.length + walkers.length + rakers.length;

    for (const animated of A) animated.fn(0);
    root.updateMatrixWorld(true);
    const partEntries = [], farEntries = [], inverse = new THREE.Matrix4(), relative = new THREE.Matrix4();
    const partNames = ['torso', 'head', 'armL', 'armR', 'legL', 'legR'];
    for (const person of actors) {
      person.root.updateWorldMatrix(true, true); inverse.copy(person.root.matrixWorld).invert();
      const farGeometry = [], nearParts = [];
      person.root.traverse((object) => {
        if (!object.isMesh) return;
        const kind = partNames.find((part) => person[part] === object) || 'accessory';
        const entry = { geometry: object.geometry, material: object.material, kind, matrix: object.matrixWorld, visible: true, shadow: false, object };
        partEntries.push(entry); nearParts.push(entry);
        if (object.geometry.attributes.aPal) {
          relative.multiplyMatrices(inverse, object.matrixWorld);
          const geometry = object.geometry.clone(); geometry.applyMatrix4(relative);
          const normals = geometry.attributes.aAN.array, map = remapN(relative);
          for (let index = 0; index < normals.length; index++) { const normal = normals[index] % 8; normals[index] = normals[index] - normal + map[normal]; }
          farGeometry.push(geometry);
        }
        object.visible = false; object.castShadow = false; object.frustumCulled = false;
      });
      const geometry = BGU.mergeGeometries(farGeometry, false);
      const far = { geometry, material: AF.mat.voxel, kind: 'pose', matrix: person.root.matrixWorld, visible: false };
      farEntries.push(far); person.parkParts = nearParts; person.parkFar = far; person.parkFade = 1;
      for (const source of farGeometry) source.dispose();
    }
    const nearBatch = parkBatches(partEntries, root, 'park-life-parts', true);
    const farBatch = parkBatches(farEntries, root, 'park-life-far');
    life.partBatches = nearBatch ? nearBatch.meshes.length : 0; life.farBatches = farBatch ? farBatch.meshes.length : 0;
    const actorPosition = new THREE.Vector3();
    let lifeFrame = 0, lifeElapsed = 0, lifeHidden = true;

    // ---- one tick for all park life
    const nightGlow = [];
    AF.onTick('park-life', 338, (dt, t) => {
      const c = AF.camera; if (!c) return;
      const distance = parkDistance(), on = Number.isFinite(distance);
      root.visible = on; if (!on) { lifeHidden = true; lifeElapsed = 0; return; }
      lifeElapsed += dt;
      lifeFrame++;
      if (!lifeHidden && distance > 60 && lifeFrame % 3 !== 0) return;
      dt = lifeElapsed; lifeElapsed = 0; lifeHidden = false;
      for (const person of actors) {
        person.root.updateWorldMatrix(true, false); actorPosition.setFromMatrixPosition(person.root.matrixWorld);
        person.parkAnimate = !person.parkInitialized || actorPosition.distanceTo(c.position) < 60 || lifeFrame % 3 === 0;
        person.parkInitialized = true;
      }
      for (const a of A) if (a.p.parkAnimate) a.fn(t, dt, a);
      for (const b of boats) {
        if (b.rower && !b.rower.parkAnimate) continue;
        const a = b.ph + t * b.sp * b.dir, x = b.ocx + Math.cos(a) * b.orx, z = b.ocz + Math.sin(a) * b.orz;
        const dx = -Math.sin(a) * b.orx * b.dir, dz = Math.cos(a) * b.orz * b.dir;
        const st = t * 2.6 + b.ph * 3, s = Math.sin(st), cc = Math.cos(st);
        b.g.position.set(x, lakeY - 0.12 + Math.sin(t * 1.4 + b.ph) * 0.03, z); b.g.rotation.set(0, Math.atan2(-dz, dx), Math.sin(t * 2.4 + b.ph) * 0.025);
        for (const o of b.oars) { o.piv.rotation.y = -o.s * s * 0.45; o.piv.rotation.x = o.s * (cc > 0 ? 0.34 : 0.1); }
        if (b.rower) { const r = b.rower; r.hips.rotation.x = -0.1 - s * 0.28; r.armR.rotation.x = r.armL.rotation.x = -1.2 + s * 0.45; r.armR.rotation.z = 0.25; r.armL.rotation.z = -0.25; }
      }
      for (const k2 of skaters) {
        if (!k2.p.parkAnimate) continue;
        const a = k2.ph + t * k2.sp, x = rcx + Math.cos(a) * rrx * k2.r, z = rcz + Math.sin(a) * rrz * k2.r, p = k2.p;
        const dx = -Math.sin(a) * rrx, dz = Math.cos(a) * rrz, st = t * (k2.kid ? 4.2 : 3.2) + k2.ph * 5, s = Math.sin(st);
        p.root.position.set(x, 0.25, z); p.root.rotation.y = Math.atan2(dx, dz);
        p.legL.rotation.x = Math.max(0, s) * -0.5; p.legR.rotation.x = Math.max(0, -s) * -0.5; p.legL.rotation.z = 0.12 + Math.max(0, s) * 0.25; p.legR.rotation.z = -0.12 - Math.max(0, -s) * 0.25;
        p.armL.rotation.x = s * 0.7; p.armR.rotation.x = -s * 0.7; p.hips.rotation.x = 0.22; p.hips.rotation.z = 0.12 + (k2.kid ? Math.sin(t * 7) * 0.1 : 0); p.body.position.y = Math.abs(s) * 0.02;
      }
      for (const w of walkers) {
        if (!w.p.parkAnimate) continue;
        if (w.mall) {   // promenade up and down the Mall (lane by direction), turn at each end
          const Lm = 42, sm = (t * 1.05 + w.ph) % (2 * Lm), fwd = sm < Lm, zz = fwd ? -208 - sm : -208 - (2 * Lm - sm), xx = -40 + (fwd ? -1.1 : 1.1) + w.off;
          const p = w.p, st = t * 5.2 + w.ph * 3, sn = Math.sin(st);
          p.root.position.set(xx, 0.25, zz); p.root.rotation.y = fwd ? Math.PI : 0;
          p.legL.rotation.x = sn * 0.45; p.legR.rotation.x = -sn * 0.45; p.body.position.y = Math.abs(Math.cos(st)) * 0.03;
          if (w.pm) { p.armL.rotation.x = p.armR.rotation.x = -0.95; w.pm.position.set(xx, 0.25, zz + (fwd ? -1.05 : 1.05)); w.pm.rotation.y = fwd ? -Math.PI / 2 : Math.PI / 2; } else { p.armL.rotation.x = -sn * 0.3; p.armR.rotation.x = w.off < 0 ? -0.35 : sn * 0.3; }
          continue;
        }
        const a = w.ph + t * w.sp * w.dir, rX = loopRX + w.off, rZ = loopRZ + w.off, x = LK.cx + Math.cos(a) * rX, z = LK.cz + Math.sin(a) * rZ;
        let dx = -Math.sin(a) * rX * w.dir, dz = Math.cos(a) * rZ * w.dir; const L = Math.hypot(dx, dz) || 1; dx /= L; dz /= L;
        const p = w.p, st = t * 5.2 + w.ph * 7, s = Math.sin(st);
        p.root.position.set(x, 0.25, z); p.root.rotation.y = Math.atan2(dx, dz);
        p.legL.rotation.x = s * 0.45; p.legR.rotation.x = -s * 0.45; p.body.position.y = Math.abs(Math.cos(st)) * 0.03;
        if (w.pm) { p.armL.rotation.x = p.armR.rotation.x = -0.95; w.pm.position.set(x + dx * 1.05, 0.25, z + dz * 1.05); w.pm.rotation.y = Math.atan2(dz, -dx); }
        else { p.armL.rotation.x = -s * 0.35; p.armR.rotation.x = s * 0.35; if (w.off < 0) p.armL.rotation.x = -0.35; else p.armR.rotation.x = -0.35; }
      }
      for (const r of rakers) { if (!r.p.parkAnimate) continue; const s = Math.sin(t * 2.2 + r.ph); r.p.hips.rotation.y = s * 0.4; r.p.hips.rotation.x = 0.3; r.p.armR.rotation.x = -1.0 + s * 0.15; r.p.armL.rotation.x = -0.8 - s * 0.15; r.p.armR.rotation.z = 0.2; }
      if (jumper) {
        const p = jumper.p, q = jumper.q, cyc = (t % 9) / 9, x0 = q.x - 7;
        let x = x0, y = 0.25, lie = 0;
        if (cyc < 0.42) { const u = cyc / 0.42; x = x0 + u * 5; const s = Math.sin(t * 12); p.legL.rotation.x = s * 0.8; p.legR.rotation.x = -s * 0.8; p.armL.rotation.x = -s * 0.7; p.armR.rotation.x = s * 0.7; }
        else if (cyc < 0.55) { const u = (cyc - 0.42) / 0.13; x = x0 + 5 + u * 2; y = 0.25 + Math.sin(u * Math.PI) * 1.1 + u * (q.h * 0.6); p.armL.rotation.x = p.armR.rotation.x = -2.8; p.legL.rotation.x = -0.6; p.legR.rotation.x = 0.3; if (u > 0.85 && burstT < 0) burstT = 0; }
        else if (cyc < 0.8) { x = q.x; y = 0.25 + q.h * 0.3; lie = 1; }
        else { const u = (cyc - 0.8) / 0.2; x = q.x - u * 7; lie = 0; const s = Math.sin(t * 7); p.legL.rotation.x = s * 0.4; p.legR.rotation.x = -s * 0.4; p.armL.rotation.x = -s * 0.2; p.armR.rotation.x = s * 0.2; }
        p.root.position.set(x, y, q.z); p.root.rotation.set(lie ? -1.3 : 0, cyc < 0.8 ? Math.PI / 2 : -Math.PI / 2, 0, 'YXZ');
        if (lie) { p.armL.rotation.x = p.armR.rotation.x = -2.9 + Math.sin(t * 6) * 0.3; p.legL.rotation.x = Math.sin(t * 8) * 0.3; p.legR.rotation.x = -Math.sin(t * 8) * 0.3; }
        if (burstT === 0) for (let i = 0; i < NL; i++) { const a = i * 2.4, sp = 1.2 + (i % 5) * 0.4, offset = i * 6; leafV[offset] = q.x + Math.cos(a) * 0.3; leafV[offset + 1] = 0.25 + q.h; leafV[offset + 2] = q.z + Math.sin(a) * 0.3; leafV[offset + 3] = Math.cos(a) * sp; leafV[offset + 4] = 2.2 + (i % 7) * 0.35; leafV[offset + 5] = Math.sin(a) * sp; }
        if (burstT >= 0) {
          burstT += dt;
          for (let i = 0; i < NL; i++) { const o = i * 6; if (burstT > 0 && leafV[o + 1] > 0.27) { leafV[o + 4] -= 3.2 * dt; if (leafV[o + 4] < -0.6) leafV[o + 4] = -0.6; leafV[o] += (leafV[o + 3] + Math.sin(t * 3 + i) * 0.4) * dt; leafV[o + 1] += leafV[o + 4] * dt; leafV[o + 2] += (leafV[o + 5] + Math.cos(t * 2.6 + i) * 0.4) * dt; leafV[o + 3] *= Math.exp(-0.907 * dt); leafV[o + 5] *= Math.exp(-0.907 * dt); } dm.position.set(leafV[o], Math.max(0.27, leafV[o + 1]), leafV[o + 2]); dm.rotation.set(t * 3 + i, t * 2 + i * 0.7, 0); dm.updateMatrix(); leafIM.setMatrixAt(i, dm.matrix); }
          leafIM.instanceMatrix.needsUpdate = true; leafIM.visible = true; if (burstT > 4.5) { burstT = -1; leafIM.visible = false; }
        } else leafIM.visible = false;
      }
      if (feeder && feeder.parkAnimate) { const u = (t % 3.2) / 3.2, s = u < 0.25 ? Math.sin(u / 0.25 * Math.PI) : 0; feeder.armR.rotation.x = -0.5 - s * 1.2; feeder.hips.rotation.x = 0.15 + s * 0.08; feeder.armL.rotation.x = -0.6; }
      if (kiteKid && kiteKid.parkAnimate) { kiteKid.armR.rotation.x = -2.3 + Math.sin(t * 0.9) * 0.15; kiteKid.armL.rotation.x = -1.9 + Math.sin(t * 0.9 + 0.4) * 0.15; }
      for (const p of riders) if (p.parkAnimate) p.armR.rotation.x = -0.5 + Math.sin(t * 2) * 0.3;
      for (let i = 0; i < extras.yachts.length; i++) { const y = extras.yachts[i], a = t * y.w * 6.283 + y.ph, x = PD.cx + Math.cos(a) * y.rx, z = PD.cz + Math.sin(a * 1.3) * y.rz, vx = -Math.sin(a) * y.rx, vz = Math.cos(a * 1.3) * 1.3 * y.rz; y.m.position.set(x, y.y + Math.sin(t * 2.2 + i) * 0.015, z); y.m.rotation.set(0, Math.atan2(-vz, vx), 0.12 + Math.sin(t * 1.1 + i) * 0.06, 'YXZ'); }
      for (const q of extras.kids) { if (!q.p.parkAnimate) continue; const s = Math.sin(t * 1.3 + q.ph); q.p.armR.rotation.x = -1.2 + s * 0.35; q.p.armL.rotation.x = -0.3 + s * 0.1; if (q.crouch) { q.p.hips.rotation.x = 0.5; q.p.legL.rotation.x = -1.0; q.p.legR.rotation.x = -1.0; q.p.root.position.y = 0.05; } }
      for (const s of extras.squirrels) {
        const u = t + s.ph, cyc = (u % 16) / 16, q = s.q; let h = 0, r = s.r, pitch = 0, ya;
        if (cyc < 0.4 || cyc >= 0.92) { const hop = Math.sin(u * 8) > 0; s.ang += hop ? dt * 0.8 : 0; const e = cyc < 0.4 ? Math.min(1, (0.4 - cyc) / 0.05) : Math.min(1, (cyc - 0.92) / 0.05); r = s.r + (0.6 + Math.sin(u * 0.7) * 0.35) * e; h = hop ? Math.abs(Math.sin(u * 8)) * 0.1 : 0; ya = s.ang + Math.PI / 2; }
        else if (cyc < 0.52) { h = (cyc - 0.4) / 0.12 * 3.2; pitch = 1.5; ya = s.ang + Math.PI; }
        else if (cyc < 0.8) { h = 3.2; pitch = 1.5; ya = s.ang + Math.PI; }
        else { h = (1 - (cyc - 0.8) / 0.12) * 3.2; pitch = -1.5; ya = s.ang + Math.PI; }
        s.m.position.set(q.x + Math.cos(s.ang) * r, 0.25 + h, q.z + Math.sin(s.ang) * r); s.m.rotation.set(0, -ya, pitch, 'YXZ'); s.m.geometry = extras.sqG[Math.floor(u * 4) % 2];
      }
      for (let i = 0; i < pieces.length; i++) { const pc = pieces[i], cyc = ((t + i * 7) % 14) / 14, sq = Math.floor((t + i * 7) / 14); const hx = ((sq * 5 + i * 3) % 6) - 2.5, hz = ((sq * 3 + i) % 6) - 2.5, px = ((sq * 5 + i * 3 + 5) % 6) - 2.5, pz = ((sq * 3 + i + 2) % 6) - 2.5; const u = Math.min(1, Math.max(0, (cyc - 0.9) / 0.1)); pc.m.position.set(pc.x + (px + (hx - px) * u) / 8, 1.0 + Math.sin(u * Math.PI) * 0.12, pc.z + (pz + (hz - pz) * u) / 8); }
      for (const person of actors) {
        person.root.updateWorldMatrix(true, false); actorPosition.setFromMatrixPosition(person.root.matrixWorld);
        const distance = actorPosition.distanceTo(c.position);
        const forward = (actorPosition.x - c.position.x) * parkDirection.x + (actorPosition.y + 1 - c.position.y) * parkDirection.y + (actorPosition.z - c.position.z) * parkDirection.z;
        const visible = distance < 150 && forward > -3;
        const near = distance < 45;
        person.parkFade = AF.clamp(person.parkFade + (near ? 1 : -1) * dt / 0.3, 0, 1);
        person.parkFar.visible = visible && person.parkFade < 1; person.parkFar.fade = 1 - person.parkFade;
        if (person.parkFade > 0) person.root.updateWorldMatrix(false, true);
        for (const part of person.parkParts) { part.visible = visible && person.parkFade > 0; part.fade = person.parkFade; part.shadow = part.kind !== 'accessory' && part.visible && distance < 40 && person.B.lh / 16 + person.B.th / 16 > 1; }
      }
      if (nearBatch) nearBatch.update(); if (farBatch) farBatch.update();
    });
    const moverRoot = new THREE.Group(); moverRoot.name = 'park-movers'; AF.scene.add(moverRoot);
    const moverBatch = parkBatches(movers, moverRoot, 'park-moving-parts');
    life.moverBatches = moverBatch ? moverBatch.meshes.length : 0;
    let moverFrame = 0, moversHidden = true;
    AF.onTick('park-movers', 339, () => {
      const on = Number.isFinite(parkDistance()); moverRoot.visible = on; if (!on || !moverBatch) { moversHidden = true; return; }
      moverFrame++;
      for (const entry of movers) {
        actorPosition.setFromMatrixPosition(entry.matrix);
        const distance = actorPosition.distanceTo(AF.camera.position);
        if (!moversHidden && distance > 60 && moverFrame % 3 !== 0) continue;
        entry.object.updateWorldMatrix(true, false);
        entry.visible = distance < 150;
      }
      moversHidden = false;
      moverBatch.update();
    });
  });

  // ------------------------------------------------------------ tests
  AF.test('park: path walkable from the Park Row gate to the bandshell', () => {
    const wp = [[-40, -175], [-40, -189], [-28, -191], [-27, -205], [-22, -218], [-15, -232], [-11, -244], [-10, -258]];
    let bad = null, n = 0;
    for (let j = 0; j < wp.length - 1 && !bad; j++) {
      const [ax, az] = wp[j], [bx, bz] = wp[j + 1], L = Math.hypot(bx - ax, bz - az);
      for (let s = 0; s <= L; s += 0.5) { const x = ax + (bx - ax) * s / L, z = az + (bz - az) * s / L; n++; const gy = W.groundY(x, z); if (gy > 0.5 || gy < 0.25 || AF.boxBlocked(x, gy, z, 0.3, 1.7)) { bad = [x.toFixed(1), z.toFixed(1), gy]; break; } }
    }
    return { ok: !bad, info: bad ? 'blocked at ' + bad : n + ' samples clear' };
  });
  AF.test('park: >= 70 trees, 8 boats, 60 chairs, 6 gates', () => {
    const c = PKS.counts || {};
    return { ok: c.trees >= 70 && c.boats >= 8 && c.chairs >= 60 && c.gates >= 6, info: JSON.stringify(c) + ' ms ' + PKS.ms };
  });
}

} catch (e) { AF.partError('13-park.js', e); }

