// Playwright harness: normal boot of output.html (globalThis-free), takes shots at a few poses/hours with the CURRENT defaults
// (brightness, fps cap, tier). Edit SHOTS below. Mobile when the file name passed contains -mobile (see the copy in .playwright-mcp).
async (page) => {
  const b = page.context().browser();
  const MOBILE = false, URL = 'output.html';
  const SHOTS = [
    { name: 'look-day-street', p: [-28, 2, -10, -28, 4, -80], h: 15 },
    { name: 'look-night-street', p: [-28, 2, -10, -28, 4, -80], h: 21 },
    { name: 'look-day-aerial', p: [-250, 160, 260, -60, 0, 40], h: 11 },
  ];
  const ctx = await b.newContext(MOBILE
    ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
    : { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  try {
    await p.goto('http://127.0.0.1:8765/' + URL + '?v=' + Date.now() + (MOBILE ? '&mobile' : ''));
    await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 240000 });
    await p.addScriptTag({ url: 'http://127.0.0.1:8765/tools/shot.js?v=' + Date.now() });
    const info = await p.evaluate(() => ({ bright: __af.brightness, cap: __af.fpsCap, tier: __af.GFX.name, pr: __af.renderer.getPixelRatio(), aa: __af.renderer.getContext().getContextAttributes().antialias }));
    for (const s of SHOTS) {
      await p.evaluate((s) => { __af.world.stream && (__af.world.stream.on = __af.world.stream.on); afShot(s.p, s.h); }, s);
      await new Promise((r) => setTimeout(r, 2500));
      await p.evaluate(() => __af.step(10, 1 / 30));
      await p.screenshot({ path: 'd:/Desktop/VoxelGame/tools/shots/' + s.name + (MOBILE ? '-m' : '') + '.png' });
    }
    return { info, errs, tierAfter: await p.evaluate(() => __af.GFX.name + ' fps ' + __af.fps.toFixed(1)) };
  } finally { await ctx.close(); }
}
