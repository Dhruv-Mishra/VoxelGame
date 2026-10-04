// Playwright harness: a normal boot (desktop, tier globalThis.__psTier || 'lite', page globalThis.__psUrl || output.html) timed to
// `ready` and `preloaded`; returns the slowest build stages, AF.stream.stats, outland worker stats and page errors. Keeps the page open.
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('portSolace.gfx', t); } catch (e) {} }, globalThis.__psTier || 'lite');
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error' || /warn/.test(m.type()) && /\[af\]/.test(m.text())) errs.push(m.text().slice(0, 300)); });
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 240000 });
  const ready = Date.now() - t0;
  await p.waitForFunction(() => window.__af.preloaded, null, { timeout: 240000 });
  const preloaded = Date.now() - t0;
  const info = await p.evaluate(() => {
    const AF = __af, W = AF.outland && AF.outland.worker;
    return { stages: Object.entries(AF.stageTimes).sort((a, b) => b[1] - a[1]).slice(0, 8).map((s) => s.join(' ')).join(', '), stream: AF.stream.stats, workers: W && W.stats, programs: AF.renderer.info.programs.length, render: AF.renderer.domElement.width + 'x' + AF.renderer.domElement.height };
  });
  return { ready, preloaded, errs: errs.slice(0, 6), ...info };
}
