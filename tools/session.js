// Playwright harness: boot (?nostream, desktop, tier globalThis.__psTier || 'lite') in a second context and keep it open.
// Later calls reach it with: const p = page.context().browser().contexts()[1].pages()[0];
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const mobile = !!globalThis.__psMobile;
  const ctx = await b.newContext(mobile
    ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
    : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('portSolace.gfx', t); } catch (e) {} }, globalThis.__psTier || 'lite');
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error' || /warn/.test(m.type()) && /\[af\]/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  globalThis.__psErrs = errs;
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?nostream' + (mobile ? '&mobile' : '') + '&v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 240000 });
  await p.evaluate(async () => { if (!window.THREE) window.THREE = await import('three'); });
  for (const s of ['perf-probe', 'perf-break', 'gpu-prof', 'shot', 'perf-exp']) await p.addScriptTag({ url: 'http://127.0.0.1:8765/tools/' + s + '.js?v=' + Date.now() });
  await p.evaluate(() => __af.world.buildFarAll());
  return { boot: Date.now() - t0, errs: errs.slice(0, 6), tier: await p.evaluate(() => __af.GFX.name) };
}
