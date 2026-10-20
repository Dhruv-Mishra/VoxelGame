// Playwright harness (MCP run_code with filename, or any runner that passes `page`): boots globalThis.__psUrl (default output.html)
// the way a player does (streaming + boot preload on, fps cap Max), starts the game and, at each spot, travels there, settles 4 s and
// samples ~150 real frames: frame interval (median / p95 / worst), CPU ms in tick hooks, CPU ms in render, CPU ms in the world-matrix pass
// (AF.perfStats.upd), draw calls + triangles per frame, plus JS heap and renderer memory counts at the end (leak check: the run then
// returns to the first spot and compares). Tier = globalThis.__psTier (default 'high' = Balanced).
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const tier = globalThis.__psTier || 'high';
  const url = 'http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?v=' + Date.now();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  await ctx.addInitScript((t) => { try { localStorage.setItem('portSolace.gfx', t); localStorage.setItem('portSolace.fps', '0'); } catch (e) {} }, tier);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  const t0 = Date.now();
  await p.goto(url);
  await p.waitForFunction(() => window.__af && window.__af.preloaded, null, { timeout: 300000 });
  const boot = Date.now() - t0;
  // globalThis.__psThrottle = 4: a laptop-class CPU for the measured part (boot runs unthrottled)
  if (globalThis.__psThrottle) { const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: +globalThis.__psThrottle }); }
  const r = await p.evaluate(async () => {
    const AF = window.__af, R = AF.renderer, wait = (ms) => new Promise((res) => setTimeout(res, ms));
    if (AF.ui && AF.ui.go) AF.ui.go();
    await wait(3000);
    const SPOTS = [
      { name: 'downtown-walk', x: 40, z: -80, yaw: 2.6 },
      { name: 'park-lake', x: -50, z: -205, yaw: 3.6 },
      { name: 'zoo-gate', x: -548, z: -6, yaw: 3.14 },
      { name: 'harbour', x: -120, z: 120, yaw: 0 },
      { name: 'airfield', x: -420, z: 180, yaw: 3.9 },
      { name: 'hills', x: 900, z: -600, yaw: 0 },
      { name: 'downtown-again', x: 40, z: -80, yaw: 2.6 },
    ];
    const hooks = AF.hooks.tick, orig = hooks.map((h) => h.fn);
    let tickMs = 0, renderMs = 0;
    hooks.forEach((h, i) => { const fn = orig[i]; h.fn = (a, b2) => { const t = performance.now(); fn(a, b2); tickMs += performance.now() - t; }; });
    const rf = AF.renderFrame; AF.renderFrame = function () { const t = performance.now(); const o = rf.apply(this, arguments); renderMs += performance.now() - t; return o; };
    const out = [];
    const sample = async () => {
      const iv = []; let calls = 0, tris = 0, n = 0; tickMs = 0; renderMs = 0; const ps = AF.perfStats; if (ps) { ps.upd = 0; ps.composed = 0; }
      R.info.autoReset = false; R.info.reset();
      await new Promise((res) => {
        let last = performance.now();
        const f = () => {
          const now = performance.now(); iv.push(now - last); last = now; n++;
          calls += R.info.render.calls; tris += R.info.render.triangles; R.info.reset();
          if (n < 150) requestAnimationFrame(f); else res();
        };
        requestAnimationFrame(f);
      });
      R.info.autoReset = true;
      iv.shift(); iv.sort((a, b2) => a - b2);
      const q = (k) => +iv[Math.min(iv.length - 1, Math.floor(iv.length * k))].toFixed(2);
      return { med: q(0.5), p95: q(0.95), worst: q(1), tick: +(tickMs / n).toFixed(2), render: +(renderMs / n).toFixed(2), upd: ps ? +(ps.upd / n).toFixed(3) : null, composed: ps ? Math.round(ps.composed / n) : null, dc: Math.round(calls / n), ktris: Math.round(tris / n / 1000) };
    };
    for (const s of SPOTS) {
      const gy = AF.W.groundY(s.x, s.z);
      await AF.stream.travel({ label: s.name, go: () => AF.setMode('walk', { x: s.x, y: gy + 1, z: s.z, yaw: s.yaw, snap: true }) });
      await wait(4000);
      const row = Object.assign({ spot: s.name }, await sample());
      // the same spot with the world-matrix dirty check off (03-render AF.perfStats.skip): what the check saves, measured in place
      if (AF.perfStats && 'skip' in AF.perfStats) { AF.perfStats.skip = false; const off = await sample(); AF.perfStats.skip = true; row.updNoSkip = off.upd; row.composedNoSkip = off.composed; row.medNoSkip = off.med; }
      row.geos = R.info.memory.geometries; row.heapMB = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
      out.push(row);
    }
    hooks.forEach((h, i) => { h.fn = orig[i]; }); AF.renderFrame = rf;
    let objs = 0, auto = 0; AF.scene.traverse((o) => { objs++; if (o.matrixAutoUpdate) auto++; });
    const mem = performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : null;
    return { tier: AF.GFX.name, rows: out, objs, autoMatrix: auto, heapMB: mem, geos: R.info.memory.geometries, texs: R.info.memory.textures, programs: R.info.programs.length };
  });
  await ctx.close();
  return { boot, errs: errs.slice(0, 6), ...r };
}
