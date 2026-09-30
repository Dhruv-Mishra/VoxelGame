// Playwright harness: normal (streaming) boot, then a probe camera at globalThis.__psPose for 15 s; reports stream progress + frame spikes.
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('portSolace.gfx', 'high'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:8765/output.html?v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 180000 });
  const boot = Date.now() - t0;
  const r = await p.evaluate(async (pose) => {
    const AF = __af;
    AF.modes.probe = { enter() {}, exit() {}, update() { const q = AF._probePose; AF.camera.position.set(q[0], q[1], q[2]); AF.camTarget.set(q[3], q[4], q[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(q[3], 0, q[5]); } };
    AF._probePose = pose; AF.setMode('probe');
    await new Promise((res) => setTimeout(res, 1000));
    const S = AF.world.stream; S.maxStep = 0;
    const t = performance.now(); let last = t, n = 0; const fr = [];
    await new Promise((res) => { const s = () => { const now = performance.now(); fr.push(Math.round(now - last)); last = now; n++; if (now - t > 15000) res(); else requestAnimationFrame(s); }; requestAnimationFrame(s); });
    fr.sort((a, b) => b - a);
    return { fps: +(n / 15).toFixed(1), worst: fr.slice(0, 8), maxStep: +S.maxStep.toFixed(1), done: S.done, unloaded: S.unloaded, pend: S.pending.size, regions: AF.world.regions.size };
  }, globalThis.__psPose || [-560, 8, -60, -545, 2, -110]);
  return { boot, r, errs };
}
