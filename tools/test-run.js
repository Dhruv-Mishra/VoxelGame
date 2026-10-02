// Playwright harness: run ?test on globalThis.__psUrl (default output.html) in its own context; returns failures + errors.
async (page) => {
  const b = page.context().browser();
  const mobile = !!globalThis.__psMobile;
  const ctx = await b.newContext(mobile
    ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
    : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  try {
    await p.goto('http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?test' + (mobile ? '&mobile' : '') + '&v=' + Date.now());
    await p.waitForFunction(() => /\d+\/\d+/.test(document.title), null, { timeout: 400000 });
    const fails = await p.evaluate(() => __af.testResult.res.filter((r) => !r.ok).map((r) => r.name + ': ' + r.info));
    const partErrs = await p.evaluate(() => (__af.errors || []).map((e) => e.part + ': ' + String(e.msg).slice(0, 200)));
    return { title: await p.title(), fails, partErrs, errs: errs.slice(0, 8) };
  } finally { await ctx.close(); }
}
