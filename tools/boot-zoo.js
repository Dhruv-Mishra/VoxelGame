// Playwright harness: boot output.html (desktop, tier from globalThis.__psTier || 'high') and keep the page open for experiments.
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('portSolace.gfx', t); } catch (e) {} }, globalThis.__psTier || 'high');
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.clearBrowserCache'); await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error' || /warn/.test(m.type()) && /\[af\]/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  globalThis.__psErrs = errs;
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?near=-545,-110,150&v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 180000 });
  await p.evaluate(async () => { if (!window.THREE) window.THREE = await import('three'); });
  await p.addScriptTag({ url: 'http://127.0.0.1:8765/tools/perf-probe.js?v=' + Date.now() });
  await p.addScriptTag({ url: 'http://127.0.0.1:8765/tools/perf-break.js?v=' + Date.now() });
  await p.evaluate(() => __af.world.buildFarAll());
  return { boot: Date.now() - t0, errs: errs.slice(0, 6), tier: await p.evaluate(() => __af.GFX.name) };
}

