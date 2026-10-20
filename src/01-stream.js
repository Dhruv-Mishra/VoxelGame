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
    systems: [], loading: 0, hold: 0, focus: null, traveling: false, LOOK: 2.5, PREFETCH: 1.3,
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
  // caster per depth-program variant is drawn into the next shadow map
  const warmed = new Set();
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
    if (P && P.enabled && P.warmJobs) { const prev = R.getRenderTarget(); try { jobs.push(...P.warmJobs(AF.camera)); } catch (e) { AF.warnOnce('post warm', e); } finally { R.setRenderTarget(prev); } }
    if (pool.length) { const v = pool[0].visible; for (const l of pool) l.visible = !v; jobs.push(compile()); for (const l of pool) l.visible = v; }
    const fd = (() => { try { return collect(AF.scene, []); } catch (e) { AF.warnOnce('first draws', e); return []; } })();
    // nothing renders while the driver links (behind the veil): a frame drawn now would block on every unfinished program,
    // turning the parallel compile back into one long synchronous stall. Capped in case a driver never reports completion.
    ST.hold++;
    try { await Promise.race([Promise.all(jobs), new Promise((resolve) => setTimeout(resolve, AF.MOBILE ? 15000 : 10000))]); }
    finally { ST.hold--; }
    try { firstUse(); if (fd.length) drawProxies(fd); } catch (e) { AF.warnOnce('first draws', e); }
    if (fd.length) await ST.nextFrame();
    await ST.nextFrame();
    const proxies = [], tri = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3));
    // one caster per depth-program variant: custom depth material or three's own (per instancing / instance colour, alpha-tested
    // map, side), including small casters the distance cull (03 dyn-cull) has switched off for now (userData.afCast)
    AF.scene.traverse((o) => {
      if (!o.isMesh || o.isSkinnedMesh || !(o.castShadow || o.userData.afCast)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material], d = o.customDepthMaterial;
      for (const mat of mats) {
        if (!mat) continue;
        const alpha = !d && mat.alphaTest > 0 && (mat.map || mat.alphaMap) ? mat.uuid : '';
        const key = (d ? d.uuid : 'def') + (o.isInstancedMesh ? (o.instanceColor ? 'c' : 'i') : 'm') + alpha + mat.side + '/' + mat.shadowSide + (mat.displacementMap ? 'd' + mat.uuid : '');
        if (warmed.has(key)) continue; warmed.add(key);
        const m = o.isInstancedMesh ? new THREE.InstancedMesh(tri, mat, 1) : new THREE.Mesh(tri, mat);
        if (o.isInstancedMesh && o.instanceColor) m.setColorAt(0, WHITE);
        if (d) m.customDepthMaterial = d;
        m.castShadow = true; m.frustumCulled = false; m.position.copy(AF.shadowFocus); m.position.y += 2; AF.scene.add(m); proxies.push(m);
        if (d) break;
      }
    });
    ST.stats.depthWarm = (ST.stats.depthWarm || 0) + proxies.length;
    if (proxies.length) { AF.shadowDirty = true; await ST.nextFrame(); await ST.nextFrame(); for (const m of proxies) { AF.scene.remove(m); if (m.dispose) m.dispose(); } }
    tri.dispose();
    if (fd.length) await ST.gpuIdle(3000);
    ST.stats.warmMs = Math.round(performance.now() - t0);
  };

  // one object (and its children) compiled ahead of its first draw without stalling a frame: compileAsync uses
  // KHR_parallel_shader_compile, against the scene's lights and the post chain's scene target (the programs the frame will use).
  // three prepares one object per material per call, so callers pass each object that needs its own variant separately.
  // Both light variants (the night pool shown / hidden changes every program) are compiled: a fade or a park mesh first drawn
  // after dusk otherwise linked its program synchronously (100-200 ms on ANGLE / D3D11).
  ST.compileAhead = (root) => {
    const R = AF.renderer, P = AF.post, prev = R.getRenderTarget(), pool = (AF.atmos && AF.atmos.pool) || [], jobs = [];
    const once = () => {
      if (R.compileAsync) { jobs.push(R.compileAsync(root, AF.camera, AF.scene).catch((e) => AF.warnOnce('compile ahead', e))); return; }
      R.compile(root, AF.camera, AF.scene);
    };
    try {
      R.setRenderTarget(P && P.enabled && P.sceneRT ? P.sceneRT : null);
      once();
      if (pool.length) { const v = pool[0].visible; for (const l of pool) l.visible = !v; try { once(); } finally { for (const l of pool) l.visible = v; } }
    } catch (e) { AF.warnOnce('compile ahead', e); }
    finally { R.setRenderTarget(prev); }
    let fd = []; try { fd = collect(root, fd); } catch (e) { AF.warnOnce('first draws', e); }
    const all = Promise.all(jobs);
    if (!R.compileAsync) return all;
    FD.pending++;
    return all.then(() => new Promise((resolve) => {
      const job = { fd, i: 0, alt: false, resolve, done: false }; FD.queue.push(job);
      // the tick only runs while the loop does (paused boot stages, hidden tabs): never leave a caller waiting
      setTimeout(() => { if (job.done) return; const i = FD.queue.indexOf(job); if (i >= 0) FD.queue.splice(i, 1); runJob(job, true); }, 4000);
    })).finally(() => { FD.pending--; });
  };

  // ---- first draws (PERF.md §3b, locked). On ANGLE / D3D11 (Chrome / Edge on Windows) a linked program is not finished: its first
  // draw with unnormalized integer vertex formats (the voxel aPal / aAN / aBU) compiles a vertex-input variant in the GPU process
  // (15-25 ms each, measured), and a first point-sprite draw a geometry-shader variant. The next synchronous GL call - three's
  // first-use program-log query - waits for all of them: the 100-450 ms "getProgramInfoLog" frames at the first title cut, at start,
  // after travels and at the first shot. compileAsync only links, so every (program, vertex layout) compiled is also drawn once,
  // ahead: a degenerate 3-vertex proxy with the same attribute formats on a layer of its own, rendered alone (the lights join that
  // layer meanwhile, so the light state and the program are the frame's), with the night pool shown and hidden. Every ready program
  // first passes its first use (the synchronous queries) before the proxies queue any GPU work. Warm: all at once behind the veil;
  // compileAhead: one batch a frame from a tick, its promise resolving once drawn.
  const FD = ST.firstDraws = { queue: [], keys: new Set(), drawn: 0, newProgs: 0, pending: 0, burst: false, layer: 31 };
  const layouts = new WeakMap(), INTS = /^(Int|Uint)/;
  const layoutOf = (g) => {
    let L = layouts.get(g); if (L && L.n === g.attributes) return L;
    let s = '', int = false; const d = [];
    for (const k in g.attributes) {
      const a = g.attributes[k], arr = a && (a.isInterleavedBufferAttribute ? a.data.array : a.array); if (!arr) return null;
      const t = arr.constructor.name; if (INTS.test(t)) int = true;
      s += k + ':' + t + a.itemSize + (a.normalized ? 'n' : '') + ','; d.push([k, arr.constructor, a.itemSize, a.normalized]);
    }
    L = { n: g.attributes, s, int, d }; layouts.set(g, L); return L;
  };
  // (program, layout) pairs under root not drawn yet; called right after a compile so every material's currentProgram is set
  const collect = (root, out) => {
    const props = AF.renderer.properties;
    root.traverse((o) => {
      if (!(o.isMesh || o.isPoints) || o.isSkinnedMesh || o.isBatchedMesh) return;
      const g = o.geometry; if (!g || !g.attributes || !g.attributes.position) return;
      const ma = g.morphAttributes; if (ma && (ma.position || ma.normal || ma.color)) return;
      const L = layoutOf(g); if (!L || !(L.int || o.isPoints)) return;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      for (const m of mats) {
        if (!m || !m.visible) continue;
        const pr = props.get(m).currentProgram; if (!pr) continue;
        const kind = o.isPoints ? 'p' : o.isInstancedMesh ? (o.instanceColor ? 'c' : 'i') : 'm';
        const key = pr.id + kind + (o.receiveShadow ? 'r' : '') + L.s;
        if (FD.keys.has(key)) continue;
        FD.keys.add(key); out.push({ L, m, kind, recv: o.receiveShadow });
      }
    });
    return out;
  };
  const WHITE = new THREE.Color(1, 1, 1);
  const firstUse = () => { for (const pr of AF.renderer.info.programs) if (pr.isReady()) pr.getUniforms(); };
  const drawProxies = (fd, which = 0) => {
    const R = AF.renderer, S = AF.scene, cam = AF.camera, P = AF.post, pool = (AF.atmos && AF.atmos.pool) || [], np = R.info.programs.length;
    firstUse();
    if (which === 2 && !pool.length) return;
    const geos = new Map(), made = [], lights = [], mask = cam.layers.mask, prevRT = R.getRenderTarget(), SM = R.shadowMap, su = SM.needsUpdate, sa = SM.autoUpdate, ac = R.autoClear;
    try {
      for (const e of fd) {
        let pg = geos.get(e.L.s);
        if (!pg) { pg = new THREE.BufferGeometry(); for (const [k, C, n, nm] of e.L.d) pg.setAttribute(k, new THREE.BufferAttribute(new C(3 * n), n, nm)); geos.set(e.L.s, pg); }
        const p = e.kind === 'p' ? new THREE.Points(pg, e.m) : e.kind === 'm' ? new THREE.Mesh(pg, e.m) : new THREE.InstancedMesh(pg, e.m, 1);
        if (e.kind === 'c') p.setColorAt(0, WHITE);
        p.frustumCulled = false; p.receiveShadow = e.recv; p.castShadow = false; p.layers.set(FD.layer); p.name = 'af-first-draw';
        S.add(p); made.push(p);
      }
      S.traverse((o) => { if (o.isLight && o.layers.test(cam.layers) && !o.layers.isEnabled(FD.layer)) { o.layers.enable(FD.layer); lights.push(o); } });
      cam.layers.set(FD.layer); R.autoClear = false; SM.needsUpdate = false; SM.autoUpdate = false;
      R.setRenderTarget(P && P.enabled && P.sceneRT ? P.sceneRT : null);
      if (which !== 2) R.render(S, cam);
      if (which !== 1 && pool.length) { const v = pool[0].visible; for (const l of pool) l.visible = !v; try { R.render(S, cam); } finally { for (const l of pool) l.visible = v; } }
    } finally {
      cam.layers.mask = mask; R.autoClear = ac; SM.needsUpdate = su; SM.autoUpdate = sa; R.setRenderTarget(prevRT);
      for (const l of lights) l.layers.disable(FD.layer);
      for (const p of made) { S.remove(p); if (p.isInstancedMesh) p.dispose(); }
      for (const g of geos.values()) g.dispose();
    }
    FD.drawn += which === 2 ? 0 : fd.length; FD.newProgs += R.info.programs.length - np;
  };
  // in play one (entry, light variant) a frame, and only once the GPU finished the last one (a fence: never a synchronous wait), so
  // a variant compile costs its GPU-process time in one frame instead of piling up behind the next first-use query
  let fence = null;
  const gpuDone = () => {
    if (!fence) return true;
    const gl = AF.renderer.getContext();
    if (gl.getSyncParameter(fence, gl.SYNC_STATUS) !== gl.SIGNALED) return false;
    gl.deleteSync(fence); fence = null; return true;
  };
  const runJob = (job, all) => {
    job.done = true;
    try { if (job.fd.length) drawProxies(job.i ? job.fd.slice(job.i) : job.fd, 0); else firstUse(); } catch (e) { AF.warnOnce('first draws', e); }
    job.resolve();
  };
  AF.onTick('first-draws', 990, () => {
    if (!FD.queue.length || ST.hold) return;
    // behind the veil (boot drain, travels): everything at once (one first-use pass, then every proxy)
    if (ST.loading > 0 || ST.traveling || FD.burst) {
      const jobs = FD.queue.splice(0), all = [];
      for (const j of jobs) for (let i = j.i; i < j.fd.length; i++) all.push(j.fd[i]);
      try { if (all.length) drawProxies(all, 0); else firstUse(); } catch (e) { AF.warnOnce('first draws', e); }
      for (const j of jobs) { j.done = true; j.resolve(); }
      return;
    }
    if (!gpuDone()) return;
    const job = FD.queue[0];
    if (!job.fd.length) { FD.queue.shift(); runJob(job, true); return; }
    const pool = (AF.atmos && AF.atmos.pool) || [];
    try {
      drawProxies([job.fd[job.i]], job.alt ? 2 : 1);
      const gl = AF.renderer.getContext(); if (gl.fenceSync) fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    } catch (e) { AF.warnOnce('first draws', e); }
    if (!job.alt && pool.length) job.alt = true; else { job.alt = false; job.i++; }
    if (job.i >= job.fd.length) { FD.queue.shift(); job.done = true; job.resolve(); }
  });
  // boot: the 'preloaded' listeners compile late objects (FX, tracers, jets, fades, markers); their first draws finish behind the loader
  ST.drainFirstDraws = async (maxMs = 5000) => {
    const t0 = performance.now(); FD.burst = true;
    try { while ((FD.pending > 0 || FD.queue.length) && performance.now() - t0 < maxMs) await ST.nextFrame(); }
    finally { FD.burst = false; }
    await ST.gpuIdle(3000);
  };
  // resolves once the GPU process finished everything queued so far (a fence polled once a frame, never a blocking wait): a veil
  // lifted while it still compiled proxy variants showed a 100-140 ms first frame
  ST.gpuIdle = async (maxMs = 3000) => {
    const gl = AF.renderer.getContext(); if (!gl.fenceSync) return;
    const f = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush();
    const t0 = performance.now();
    try { while (gl.getSyncParameter(f, gl.SYNC_STATUS) !== gl.SIGNALED && performance.now() - t0 < maxMs) await ST.nextFrame(); }
    finally { gl.deleteSync(f); }
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
  ST.travel = async ({ label: where = '', text = '', go, maxMs = 15000, warmFirst = false } = {}) => {
    if (ST.traveling || !AF.ready || AF.TEST) { if (go) go(); return; }
    ST.traveling = true; ST.stats.travels++;
    const t0 = performance.now();
    try {
      await veil(true, text || (where ? 'Travelling to ' + where : 'Travelling…'));
      AF.loader(0, warmFirst ? 'warming up the shaders…' : 'setting off…');
      if (go) go();
      // a graphics change swaps programs: compile them in parallel before anything draws with them
      if (warmFirst) await ST.warm();
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
  // graphics changes that swap shader programs (tier, shadows): applied behind the veil and compiled in parallel. Applied in place
  // they recompiled every program synchronously on the next frame (seconds on a laptop: the auto-tier step-down hit exactly the
  // machines least able to afford it). The world holds still meanwhile (a step-down can come mid-drive or mid-chase, and nobody
  // should crash or be shot behind the loader); fixed-step sims catch up the paused seconds afterwards.
  ST.regfx = (apply) => {
    if (!AF.ready || AF.TEST || AF.SHOT || ST.traveling) { apply(); return Promise.resolve(); }
    const ts = AF.timeScale; AF.timeScale = 0; AF.input.down.clear();
    return ST.travel({ text: 'Tuning the graphics…', go: apply, warmFirst: true, maxMs: 4000 })
      .finally(() => { if (AF.timeScale === 0) AF.timeScale = ts; });
  };
}
} catch (e) { AF.partError('01-stream.js', e); }
