// Playwright harness (MCP run_code with filename): boots globalThis.__psUrl (default output.html) on tier globalThis.__psTier
// (default 'lite' = the desktop default) and returns per-pose CPU+GPU-synced ms, draw calls, triangles, top ticks, GPU ms.
// globalThis.__psMobile = true emulates a phone (?mobile). Compare against tools/output-pre.html (pre-optimisation build).
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const POSES = [
    { name: 'street-downtown', p: [40, 2, -80, 80, 3, -160] },
    { name: 'aerial-city', p: [-300, 180, 250, 20, 0, -60] },
    { name: 'plane-high', p: [-500, 350, 300, 0, 0, -100] },
    { name: 'park-lake', p: [-50, 2.2, -205, -92, 1, -240] },
    { name: 'park-carousel', p: [0, 2.2, -185, 20, 2, -215] },
    { name: 'park-view', p: [-40, 50, -140, -40, 0, -235] },
    { name: 'zoo-gate', p: [-548, 2.2, -6, -548, 2, -110] },
    { name: 'zoo-aerial', p: [-440, 70, 30, -550, 2, -150] },
    { name: 'zoo-lions', p: [-505, 3, -95, -526, 1, -115] },
    { name: 'airfield', p: [-360, 45, 230, -480, 2, 130] },
  ];
  const tier = globalThis.__psTier || 'lite', mobile = !!globalThis.__psMobile;
  const url = 'http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?nostream&v=' + Date.now() + (mobile ? '&mobile' : '');
  const ctx = await b.newContext(mobile
    ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
    : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('portSolace.gfx', t); } catch (e) {} }, tier);
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  const t0 = Date.now();
  await p.goto(url);
  await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 240000 });
  const boot = Date.now() - t0;
  await p.evaluate(async () => { if (!window.THREE) window.THREE = await import('three'); });
  for (const s of ['perf-probe', 'gpu-prof']) await p.addScriptTag({ url: 'http://127.0.0.1:8765/tools/' + s + '.js?v=' + Date.now() });
  const r = await p.evaluate(async (poses) => {
    const AF = __af;
    AF.world.buildFarAll && AF.world.buildFarAll();
    let objs = 0, auto = 0, meshes = 0; AF.scene.traverse((o) => { objs++; if (o.matrixAutoUpdate) auto++; if (o.isMesh) meshes++; });
    const sceneInfo = 'objs ' + objs + ' autoMatrix ' + auto + ' meshes ' + meshes;
    const perf = afPerf(poses, 16);
    const gpu = await afGpu(poses, 16) || [];
    return { tier: AF.GFX.name, sceneInfo, mem: AF.memStats ? JSON.stringify(AF.memStats()).slice(0, 300) : '', rows: perf.map((x, i) => x.name + ' ' + x.ms + 'ms gpu ' + (gpu[i] ? gpu[i].gpu : '?') + ' ' + x.calls + 'dc ' + x.tris + ' | ' + x.top) };
  }, POSES);
  await ctx.close();
  return { boot, errs: errs.slice(0, 6), ...r };
}
