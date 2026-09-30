// Playwright harness (run via the MCP run_code tool with filename): boots tools/output-base.html and output.html on a fixed
// 'high' tier in a desktop context and returns per-pose perf for both.
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const POSES = [
    { name: 'street-downtown', p: [40, 2, -80, 80, 3, -160] },
    { name: 'street-oldtown', p: [-160, 2, -40, -160, 3, -120] },
    { name: 'aerial-city', p: [-300, 180, 250, 20, 0, -60] },
    { name: 'plane-high', p: [-500, 350, 300, 0, 0, -100] },
    { name: 'zoo', p: [-540, 12, -40, -550, 2, -150] },
  ];
  const run = async (url, tier) => {
    const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' });
    await ctx.addInitScript((t) => { try { localStorage.setItem('portSolace.gfx', t); } catch (e) {} }, tier);
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.clearBrowserCache'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
    const t0 = Date.now();
    await p.goto(url + (url.includes('?') ? '&' : '?') + 'v=' + Date.now());
    await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 180000 });
    const boot = Date.now() - t0;
    await p.evaluate(async () => { if (!window.THREE) window.THREE = await import('three'); });
    await p.addScriptTag({ url: 'http://127.0.0.1:8765/tools/perf-probe.js?v=' + Date.now() });
    const r = await p.evaluate((poses) => { __af.world.buildFarAll(); return { tier: __af.GFX.name, perf: afPerf(poses, 20).map((x) => x.name + ' ' + x.ms + 'ms ' + x.calls + 'dc ' + x.tris) }; }, POSES);
    await ctx.close();
    return { boot, errs: errs.slice(0, 4), ...r };
  };
  const tier = globalThis.__psTier || 'high';
  const out = {};
  if (!globalThis.__psSkipBase) out.base = await run('http://127.0.0.1:8765/tools/output-base.html', tier);
  out.now = await run('http://127.0.0.1:8765/output.html', tier);
  return out;
}
