// Playwright harness: streaming boot of globalThis.__psUrl (default output.html; phone profile when __psMobile is set or the calling
// page's URL ends in #phone), wait for the preload,
// then a chase camera drives the Solace Ring through the range in REAL time at __psSpeed m/s (default 38) for 25 s.
// Reports fps, worst frame gaps, outland "late" (shown tiles coarser than wanted, summed over 0.5 s samples), city late regions,
// queue sizes and the stream engine stats.
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const mobile = [globalThis.__psMobile, page.url().endsWith('#phone')].some(Boolean);
  const ctx = await b.newContext(mobile
    ? { viewport: { width: 844, height: 390 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' }
    : { viewport: { width: 1280, height: 720 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36' });
  await ctx.addInitScript((t) => { try { localStorage.setItem('portSolace.gfx', t); localStorage.removeItem('portSolace.lod'); } catch (e) {} }, globalThis.__psTier || 'lite');
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  await p.goto('http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?' + (mobile ? 'mobile&' : '') + 'v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.preloaded, null, { timeout: 240000 });
  const r = await p.evaluate(async (speed) => {
    const AF = __af, ring = AF.PLAN.world.roads.find((road) => road.ring), pts = ring.points, hs = ring.heights;
    let start = pts.findIndex((q) => q[1] < -420 && q[0] > -300); if (start < 0) start = 0;
    const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const at = (s) => { s = Math.min(s, acc[acc.length - 1]); let i = 1; while (i < acc.length - 1 && acc[i] < s) i++; const f = (s - acc[i - 1]) / Math.max(1e-6, acc[i] - acc[i - 1]); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, hs[i - 1] + (hs[i] - hs[i - 1]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f]; };
    AF.modes.probe = { enter() {}, exit() {}, update() { const q = AF._probePose; AF.camera.position.set(q[0], q[1], q[2]); AF.camTarget.set(q[3], q[4], q[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(q[3], q[4], q[5]); } };
    const s0 = acc[start];
    const pose = (s) => { const a = at(s - 7), c = at(s + 12); return [a[0], a[1] + 3.2, a[2], c[0], c[1] + 1, c[2]]; };
    AF._probePose = pose(s0); AF.setMode('probe');
    await new Promise((res) => setTimeout(res, 2500));
    const R = AF.outland.renderer, S = AF.world.stream, T = 25000, t0 = performance.now();
    let last = t0, late = 0, samples = 0, nextS = t0 + 500, frames = 0, maxQ = 0; const gaps = [];
    await new Promise((res) => {
      const step = () => {
        const now = performance.now();
        AF._probePose = pose(s0 + (now - t0) / 1000 * speed);
        gaps.push(now - last); last = now; frames++;
        if (now >= nextS) { nextS += 500; samples++; late += R.late(); maxQ = Math.max(maxQ, R.stats().pending); }
        if (now - t0 > T) res(); else requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
    const ft = AF.frameStats || {};
    gaps.sort((a, c) => c - a);
    const sorted = gaps.slice().sort((a, c) => a - c), p50 = sorted[Math.floor(sorted.length / 2)];
    return { lod: AF.LOD, fps: +(AF.fps || 0).toFixed(1), rafs: frames, p50: +p50.toFixed(1), worst: gaps.slice(0, 6).map((v) => Math.round(v)), over50: gaps.filter((v) => v > 50).length, late, samples, maxQ, outland: R.stats(), dropped: R.dropped || 0, city: { done: S.done, pend: S.pending.size, aborted: S.aborted }, worker: AF.outland.worker ? AF.outland.worker.stats : null, mem: AF.memStats ? AF.memStats() : null };
  }, globalThis.__psSpeed || 38);
  await ctx.close();
  return { r, errs };
}
