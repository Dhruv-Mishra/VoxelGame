// experiment: does the first draw of an already-linked program stall when the vertex formats are integer (ANGLE D3D11 input-layout variants)?
async (page) => {
  const p = page;
  await p.goto('http://127.0.0.1:8765/output.html?nostream&v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 120000 });
  return await p.evaluate(async () => {
    const AF = __af, R = AF.renderer, gl = R.getContext(); AF.pause();
    await new Promise((r) => setTimeout(r, 1500));
    const rt = new THREE.WebGLRenderTarget(4, 4), cam = new THREE.PerspectiveCamera(), px = new Uint8Array(4);
    const mkMat = (tag) => new THREE.ShaderMaterial({ vertexShader: 'attribute float aX; attribute vec2 aY; varying float v; void main(){ v = aX + aY.x; gl_Position = vec4(position * 0.001, 1.0); } // ' + tag, fragmentShader: 'varying float v; void main(){ gl_FragColor = vec4(v); }' });
    const geo = (kind) => {
      const g = new THREE.BufferGeometry();
      if (kind === 'f') { g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)); g.setAttribute('aX', new THREE.BufferAttribute(new Float32Array(3), 1)); g.setAttribute('aY', new THREE.BufferAttribute(new Float32Array(6), 2)); }
      else if (kind === 'i') { g.setAttribute('position', new THREE.BufferAttribute(new Int16Array(9), 3)); g.setAttribute('aX', new THREE.BufferAttribute(new Uint16Array(3), 1)); g.setAttribute('aY', new THREE.BufferAttribute(new Int16Array(6), 2)); }
      else if (kind === 'n') { g.setAttribute('position', new THREE.BufferAttribute(new Int16Array(12), 4, true)); g.setAttribute('aX', new THREE.BufferAttribute(new Uint16Array(3), 1, true)); g.setAttribute('aY', new THREE.BufferAttribute(new Int16Array(6), 2, true)); }
      return g;
    };
    const sync = () => { gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); };
    const trial = async (kind, i) => {
      const m = mkMat(kind + i + Math.random()), meshF = new THREE.Mesh(geo('f'), m); meshF.frustumCulled = false;
      R.setRenderTarget(rt); await R.compileAsync(meshF, cam); R.setRenderTarget(rt);
      const mesh = new THREE.Mesh(geo(kind), m); mesh.frustumCulled = false;
      sync();
      const t0 = performance.now(); R.render(mesh, cam); const t1 = performance.now(); sync(); const t2 = performance.now();
      // second draw, same layout
      R.render(mesh, cam); sync(); const t3 = performance.now();
      R.setRenderTarget(null);
      return [kind, +(t1 - t0).toFixed(1), +(t2 - t1).toFixed(1), +(t3 - t2).toFixed(1)];
    };
    const out = [];
    for (let i = 0; i < 4; i++) for (const k of ['f', 'i', 'n']) out.push((await trial(k, i)).join(' '));
    // the game's voxel material: fresh program (extra define), compiled, then first draw with the real (integer) layout vs all-float
    let src = null; AF.scene.traverse((o) => { if (!src && o.isMesh && !o.isInstancedMesh && o.geometry && o.geometry.attributes.aPal && o.geometry.attributes.aPal.array instanceof Uint16Array && o.geometry.attributes.position.array instanceof Float32Array) src = o; });
    const realGeo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)); g.setAttribute('aBU', new THREE.BufferAttribute(new Int16Array(6), 2)); g.setAttribute('aPal', new THREE.BufferAttribute(new Uint16Array(3), 1)); g.setAttribute('aAN', new THREE.BufferAttribute(new Uint8Array(3), 1)); return g; };
    const fltGeo = () => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)); g.setAttribute('aBU', new THREE.BufferAttribute(new Float32Array(6), 2)); g.setAttribute('aPal', new THREE.BufferAttribute(new Float32Array(3), 1)); g.setAttribute('aAN', new THREE.BufferAttribute(new Float32Array(3), 1)); return g; };
    const vtrial = async (compileWith, drawWith, i) => {
      const m = src.material.clone(); m.onBeforeCompile = src.material.onBeforeCompile; m.customProgramCacheKey = src.material.customProgramCacheKey;
      m.defines = Object.assign({}, src.material.defines, { AF_PROBE: i + 1 + Math.round(Math.random() * 1e6) });
      const sc = new THREE.Scene(), a = new THREE.Mesh(compileWith(), m), b = new THREE.Mesh(drawWith(), m); a.frustumCulled = b.frustumCulled = false;
      sc.add(a); R.setRenderTarget(rt); const c0 = performance.now(); await R.compileAsync(sc, cam); const c1 = performance.now(); sc.remove(a); sc.add(b);
      R.setRenderTarget(rt); sync();
      const t0 = performance.now(); R.render(sc, cam); const t1 = performance.now(); sync(); const t2 = performance.now();
      R.render(sc, cam); sync(); const t3 = performance.now(); R.setRenderTarget(null);
      return [(compileWith === realGeo ? 'R' : 'F') + '>' + (drawWith === realGeo ? 'R' : 'F'), 'compile', (c1 - c0).toFixed(0), 'draw', (t1 - t0).toFixed(1), 'sync', (t2 - t1).toFixed(1), 'again', (t3 - t2).toFixed(1)].join(' ');
    };
    const vox = [];
    if (src) for (let i = 0; i < 3; i++) { vox.push(await vtrial(fltGeo, fltGeo, i)); vox.push(await vtrial(realGeo, realGeo, i)); vox.push(await vtrial(fltGeo, realGeo, i)); }
    // the game's own attribute layouts: one per unique (material type, attribute signature)
    const sig = new Map();
    AF.scene.traverse((o) => { if (!o.geometry || !o.material) return; const g = o.geometry, a = g.attributes; const s = Object.keys(a).sort().map((k) => k + ':' + (a[k].array ? a[k].array.constructor.name : a[k].data ? 'IL' + a[k].data.array.constructor.name : '?') + a[k].itemSize + (a[k].normalized ? 'n' : '')).join(','); sig.set(s, (sig.get(s) || 0) + 1); });
    return { out, vox, srcName: src && src.name, sigs: [...sig.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => v + '  ' + k) };
  });
}
