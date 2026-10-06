// Playwright harness (MCP run_code with filename): phone context (landscape 844x390, then portrait 390x844), boots output.html,
// closes the title and screenshots the HUD + touch controls in walk / melee / gun / drive / fly to tools/shots/m-*.png.
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts()) for (const pg of c.pages()) if (pg !== page) await pg.close().catch(() => {});
  const dir = 'c:/Users/dhruvmishra/Downloads/PortSolace/tools/shots/';
  const ctx = await b.newContext({ viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  await p.goto('http://127.0.0.1:8765/output.html?v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.preloaded, null, { timeout: 240000 });
  await p.evaluate(() => { const g = document.querySelector('#t-title .go'); if (g) g.click(); });
  await p.waitForTimeout(1500);
  const shot = async (name, fn) => { if (fn) await p.evaluate(fn); await p.waitForTimeout(900); await p.screenshot({ path: dir + 'm-' + name + '.png' }); };
  const nearCar = () => { const AF = __af; const car = AF.vehicles.cars.filter((c) => !c.ai && !c.static && c.type.kind === 'car' && !c.dead).sort((a, b2) => Math.hypot(a.x - AF.player.x, a.z - AF.player.z) - Math.hypot(b2.x - AF.player.x, b2.z - AF.player.z))[0]; AF.setMode('drive', { car }); };
  await shot('land-walk', () => { __af.setMode('walk', { x: 60, y: 0.3, z: -100, yaw: 0, snap: true }); });
  await shot('land-gun', () => { const AF = __af; AF.combat.give('revolver'); AF.combat.slot = 1; AF.combat.aimToggle = false; AF.emit('toast', 'Revolver drawn'); });
  await shot('land-drive', nearCar);
  await shot('land-fly', () => { const AF = __af; const pl = AF.planes && AF.planes.list && AF.planes.list[0]; if (pl && pl.interact) { AF.setMode('walk', { x: pl.x + 3, y: 0.5, z: pl.z, snap: true }); AF.jobs.ticket = true; pl.interact.act(); } });
  await shot('land-shop', () => { const AF = __af; AF.setMode('walk', { x: 60, y: 0.3, z: -100, yaw: 0, snap: true }); AF.shop.open({ title: 'Pawn & Loan', sub: 'Firearms & ammunition', tabs: ['Firearms', 'Ammunition'], items: () => Object.keys(AF.GUNS).map((id) => ({ name: AF.GUNS[id].name, desc: 'A long description of the gun to test wrapping on phones', price: AF.GUNS[id].price })) }); });
  await shot('land-job', () => { const AF = __af; AF.shop.close(); AF.combat.crime(80); AF.jobs.toggle(); });
  await p.setViewportSize({ width: 390, height: 844 });
  await shot('port-walk', () => { const AF = __af; AF.combat.slot = 0; const b = [...document.querySelectorAll('button')].find((x) => /portrait/i.test(x.textContent)); if (b) b.click(); AF.emit('toast', 'A toast to check the portrait layout.'); });
  await shot('port-drive', nearCar);
  await ctx.close();
  return { errs };
}
