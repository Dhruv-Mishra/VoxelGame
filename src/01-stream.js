// ================================================================ 01-stream.js
try {
// ===== 01-stream: the one streaming engine every content system plugs into  (OWNER: coordinator) =====
// AF.stream.register(name, { work(ms) -> true while busy, near() -> true while something the current view needs is still
//   missing, gen: true = one-time content generation (finished by AF.stream.preload before play), order })
// AF.LOD: every LOD range of every system (03 applyTier fills it from the one TIER table); AF.LOD.prefetch = how much farther
//   than its display range each system loads (so a swap is always a dithered fade of something already resident)
// AF.stream.ahead {x, z}: the look-ahead every streamer ranks against (camera + 2.5 s of velocity, or AF.stream.focus)
// AF.stream.loading > 0: a veiled load (boot preload, travel): LOD swaps are instant and the streamers get most of every frame
// AF.stream.travel({ label, go }): veil, go() (moves the camera / sets the mode), stream + compile until the view is complete, reveal
{
  const ST = AF.stream = {
    systems: [], loading: 0, focus: null, traveling: false, LOOK: 2.5, PREFETCH: 1.3,
    ahead: { x: 0, z: 0, vx: 0, vz: 0, px: 0, pz: 0, init: false },
    stats: { preloadMs: 0, genMs: 0, settleMs: 0, warmMs: 0, travels: 0, travelMs: 0, waitingOn: '', timeouts: 0 },
  };
  AF.LOD = { view: AF.lodScale || 1, props: 110, region: 130, far: 1e9, cull: 900, outland: 0.7, floraMid: 65, floraNear: 160, floraFar: 880, prefetch: ST.PREFETCH };
  ST.register = (name, o) => {
    const s = Object.assign({ name, order: 50, gen: false, near: () => false }, o);
    ST.systems.push(s); ST.systems.sort((a, b) => a.order - b.order);
    AF.onIdle(name, s.work);
    return s;
  };
  // name of the first system still missing something the view needs ('' = the view is complete)
  ST.near = () => { for (const s of ST.systems) if (s.near()) return s.name; return ''; };

  // frames: resolved by the last tick of every simulated frame (also in hidden tabs); 250 ms fallback when the loop is paused
  const waiters = [];
  ST.nextFrame = () => new Promise((resolve) => { waiters.push(resolve); setTimeout(resolve, 250); });
  AF.onTick('stream-frame', 999, () => { if (waiters.length) for (const resolve of waiters.splice(0)) resolve(); });

  // shared look-ahead + the loading pump (runs before the city 877/878 and outland 876 streamers)
  AF.onTick('stream-ahead', 874, (dt) => {
    const c = AF.camera.position, A = ST.ahead;
    if (!A.init || dt <= 0) { A.px = c.x; A.pz = c.z; A.vx = A.vz = 0; A.init = true; }
    const vx = (c.x - A.px) / Math.max(dt, 1e-3), vz = (c.z - A.pz) / Math.max(dt, 1e-3), k = Math.min(1, dt * 3);
    if (Math.hypot(vx, vz) < 400) { A.vx += (vx - A.vx) * k; A.vz += (vz - A.vz) * k; } else A.vx = A.vz = 0;   // teleports
    A.px = c.x; A.pz = c.z;
    if (ST.focus) { A.x = ST.focus.x; A.z = ST.focus.z; }
    else { const s = Math.min(1, 400 / (Math.hypot(A.vx, A.vz) * ST.LOOK + 1e-3)); A.x = c.x + A.vx * ST.LOOK * s; A.z = c.z + A.vz * ST.LOOK * s; }
    if (!ST.loading || !AF.ready) return;
    if (ST.traveling) AF.input.down.clear();
    const end = performance.now() + (AF.MOBILE ? 45 : 70);
    for (let pass = 0, busy = true; busy && pass < 400 && performance.now() < end; pass++) {
      busy = false;
      for (const s of ST.systems) { const left = end - performance.now(); if (left <= 0) break; if (s.work(Math.min(8, left))) busy = true; }
    }
  });

  // every program the scene can use, compiled while nothing is on screen (r160 compile() walks invisible objects too), for both
  // light variants (the night light pool shown / hidden changes every program) and against the post chain's scene target (a
  // linear, untoned target is a different program from the canvas); the shadow pass has its own depth programs: one throw-away
  // caster per custom depth material is drawn into the next shadow map
  const warmed = new WeakSet();
  ST.warm = async () => {
    const R = AF.renderer, t0 = performance.now(), pool = (AF.atmos && AF.atmos.pool) || [], P = AF.post;
    // compileAsync: the driver links in parallel (KHR_parallel_shader_compile) while the loader keeps animating
    const compile = () => {
      const prev = R.getRenderTarget();
      try { R.setRenderTarget(P && P.enabled && P.sceneRT ? P.sceneRT : null); if (R.compileAsync) return R.compileAsync(AF.scene, AF.camera).catch((e) => AF.warnOnce('stream compile', e)); R.compile(AF.scene, AF.camera); }
      catch (e) { AF.warnOnce('stream compile', e); }
      finally { R.setRenderTarget(prev); }
      return Promise.resolve();
    };
    const jobs = [compile()];
    if (pool.length) { const v = pool[0].visible; for (const l of pool) l.visible = !v; jobs.push(compile()); for (const l of pool) l.visible = v; }
    await Promise.all(jobs); await ST.nextFrame();
    const proxies = [], tri = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)), seen = new Set();
    AF.scene.traverse((o) => {
      const d = o.customDepthMaterial; if (!d || warmed.has(d)) return;
      const key = d.uuid + (o.isInstancedMesh ? 'i' : ''); if (seen.has(key)) return; seen.add(key); warmed.add(d);
      const mat = Array.isArray(o.material) ? o.material[0] : o.material, m = o.isInstancedMesh ? new THREE.InstancedMesh(tri, mat, 1) : new THREE.Mesh(tri, mat);
      m.customDepthMaterial = d; m.castShadow = true; m.frustumCulled = false; m.position.copy(AF.shadowFocus); m.position.y += 2; AF.scene.add(m); proxies.push(m);
    });
    if (proxies.length) { AF.shadowDirty = true; await ST.nextFrame(); await ST.nextFrame(); for (const m of proxies) { AF.scene.remove(m); if (m.dispose) m.dispose(); } }
    ST.stats.warmMs = Math.round(performance.now() - t0);
  };

  // one object (and its children) compiled ahead of its first draw without stalling a frame: compileAsync uses
  // KHR_parallel_shader_compile, against the scene's lights and the post chain's scene target (the programs the frame will use).
  // three prepares one object per material per call, so callers pass each object that needs its own variant separately.
  ST.compileAhead = (root) => {
    const R = AF.renderer, P = AF.post, prev = R.getRenderTarget();
    try {
      R.setRenderTarget(P && P.enabled && P.sceneRT ? P.sceneRT : null);
      if (R.compileAsync) return R.compileAsync(root, AF.camera, AF.scene).catch((e) => AF.warnOnce('compile ahead', e));
      R.compile(root, AF.camera, AF.scene);
    } catch (e) { AF.warnOnce('compile ahead', e); }
    finally { R.setRenderTarget(prev); }
    return Promise.resolve();
  };

  // wait until no system misses anything near the view (3 calm frames), at most maxMs
  const settle = async (maxMs, onProgress) => {
    const t0 = performance.now(); let calm = 0, frames = 0;
    ST.settling = true;
    try {
      while (performance.now() - t0 < maxMs) {
        await ST.nextFrame(); frames++;
        const n = ST.near(); ST.stats.waitingOn = n;
        if (onProgress) onProgress(1 - Math.exp(-(performance.now() - t0) / 1500), n);
        if (n || frames < 3) calm = 0; else if (++calm >= 3) return true;
      }
    } finally { ST.settling = false; }
    ST.stats.timeouts++; return false;
  };
  const LABEL = { 'region-stream': 'raising the streets', 'outland-build': 'shaping the hills', 'flora-build': 'growing the forests', farms: 'sowing the fields', 'outland-sites': 'building the villages', 'outland-roads': 'paving the country roads', 'outland-wayside': 'stocking the roadside stops', 'water-shore': 'charting the shoreline' };
  const label = (n) => (LABEL[n] || 'finishing touches') + '…';

  // boot: finish every generator (props, crops, trees, roads) before play, so nothing is added to a tile on screen later; then the
  // opening view streams in full and every program is compiled. Longer load, no pop-in afterwards.
  ST.preload = async (progress) => {
    const t0 = performance.now(), gens = ST.systems.filter((s) => s.gen), wasPaused = AF.paused;
    ST.loading++;
    try {
      AF.paused = true;
      for (let i = 0; i < gens.length; i++) {
        const s = gens[i]; let t = performance.now();
        progress(i / gens.length * 0.7, label(s.name));
        while (s.work(50)) if (performance.now() - t > 40) { progress((i + 0.5) / gens.length * 0.7, label(s.name)); await AF.yield(); t = performance.now(); }
      }
      ST.stats.genMs = Math.round(performance.now() - t0);
      AF.paused = wasPaused;
      const t1 = performance.now();
      await settle(15000, (f, n) => progress(0.7 + 0.25 * f, label(n)));
      ST.stats.settleMs = Math.round(performance.now() - t1);
      progress(0.97, 'warming up the shaders…');
      await ST.warm();
    } finally { AF.paused = wasPaused; ST.loading--; }
    ST.stats.preloadMs = Math.round(performance.now() - t0);
    console.log('[af] preload', JSON.stringify(ST.stats));
  };

  // the veil is the boot loader (#loader), reused: travel = veil, go(), stream + compile, reveal
  const veil = (on, text) => {
    const el = document.getElementById('loader'); if (!el) return Promise.resolve();
    const sub = el.querySelector('.sub'); if (on && sub && text) sub.textContent = text;
    el.classList.toggle('done', !on); el.style.pointerEvents = on ? 'auto' : 'none';
    return new Promise((resolve) => setTimeout(resolve, on ? 220 : 0));
  };
  ST.travel = async ({ label: where = '', go, maxMs = 15000 } = {}) => {
    if (ST.traveling || !AF.ready || AF.TEST) { if (go) go(); return; }
    ST.traveling = true; ST.stats.travels++;
    const t0 = performance.now();
    try {
      await veil(true, where ? 'Travelling to ' + where : 'Travelling…');
      AF.loader(0, 'setting off…');
      if (go) go();
      ST.loading++;
      try { await settle(maxMs, (f, n) => AF.loader(0.05 + 0.85 * f, label(n))); }
      finally { ST.loading--; }
      AF.loader(0.95, 'warming up the shaders…');
      await ST.warm();
      await ST.nextFrame(); await ST.nextFrame();
      AF.loader(1, '');
    } finally {
      AF.input.down.clear(); veil(false); ST.traveling = false; ST.stats.travelMs = Math.round(performance.now() - t0);
    }
  };
}
} catch (e) { AF.partError('01-stream.js', e); }
