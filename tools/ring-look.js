// Playwright harness: boot output.html, settle the outland, print network stats and take screenshots along the ring road.
async (page) => {
  const b = page.context().browser();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300))); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text().slice(0, 300)); });
  try {
    await p.goto('http://127.0.0.1:8765/output.html?nostream&v=' + Date.now());
    await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 240000 });
    await p.addScriptTag({ url: 'http://127.0.0.1:8765/tools/shot.js?v=' + Date.now() });
    const info = await p.evaluate(() => {
      const A = __af, O = A.outland, ring = A.PLAN.world.roads.find((r) => r.ring);
      const runs = (f) => Array.from(f).join('').replace(/(.)\1*/g, (m) => m[0] + 'x' + m.length + ' ');
      const tunnel = ring.flags.indexOf(2), bridge = ring.flags.indexOf(1);
      window.__poses = [
        { name: 'ring-viaduct', p: [-10, 62, -430, -40, 30, -505], h: 15 },
        { name: 'ring-drive', p: [ring.points[60][0], ring.heights[60] + 2.2, ring.points[60][1], ring.points[72][0], ring.heights[72] + 1.5, ring.points[72][1]], h: 11 },
        tunnel >= 0 && { name: 'ring-tunnel', p: [ring.points[tunnel - 6][0], ring.heights[tunnel - 6] + 3, ring.points[tunnel - 6][1], ring.points[tunnel + 2][0], ring.heights[tunnel + 2] + 2, ring.points[tunnel + 2][1]], h: 13 },
        { name: 'farmland', p: [-830, 70, -60, -930, 5, -170], h: 16 },
        { name: 'upper-solace', p: [420, 70, -380, 384, 35, -295], h: 14 },
        { name: 'ochre-river', p: [980, 50, 40, 930, 10, -40], h: 16 },
        { name: 'jungle', p: [700, 70, -300, 720, 40, -390], h: 12 },
        O.wayside[0] && { name: 'wayside', p: [O.wayside[0].x + O.wayside[0].face[0] * 45 + 10, O.wayside[0].y + 14, O.wayside[0].z + O.wayside[0].face[1] * 45 + 10, O.wayside[0].x, O.wayside[0].y + 3, O.wayside[0].z], h: 15 },
        { name: 'world', p: [-150, 900, 900, -100, 0, -250], h: 13 },
      ].filter(Boolean);
      return { ring: runs(ring.flags), len: ring.points.length, wayside: O.wayside.map((w) => w.kind + '@' + w.x + ',' + w.z), roads: A.outlandRoads.stats, tunnel, bridge };
    });
    const poses = await p.evaluate(() => window.__poses);
    const only = globalThis.__ringShots;
    for (const s of poses) {
      if (only && !only.includes(s.name)) continue;
      await p.evaluate((s) => { afShot(s.p, s.h); const A = __af; A.outland.renderer.settle(); A.outlandRoads.settle(); A.wayside && A.wayside.settle(); A.flora.settle(); A.outland.renderer.settle(); }, s);
      await new Promise((r) => setTimeout(r, 1200));
      await p.evaluate(() => __af.step(20, 1 / 30));
      await p.screenshot({ path: 'd:/Desktop/VoxelGame/tools/shots/ring-' + s.name + '.png' });
    }
    info.after = await p.evaluate(() => ({ roads: __af.outlandRoads.stats, outland: __af.outland.renderer.stats(), wayside: __af.wayside.stats }));
    return { info, errs };
  } finally { await ctx.close(); }
}
