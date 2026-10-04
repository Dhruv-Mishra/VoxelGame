// Playwright harness: like stream-fly.js (24 s real-time probe flight over the city at plane speed) but waits for the boot preload and
// reads the build from the calling page's URL fragment (about:blank#url=tools/output-base.html; default output.html).
// Reports every frame gap (worst 8, count over 50 ms), "late" pending city regions within 160 m and the region streamer's phase times.
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const url = page.url().split('#url=')[1] ?? 'output.html';
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('portSolace.gfx', 'lite'); localStorage.removeItem('portSolace.lod'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  await p.goto('http://127.0.0.1:8765/' + url + '?v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.preloaded, null, { timeout: 240000 });
  const r = await p.evaluate(async () => {
    const AF = __af;
    const path = [[100, 60, -60], [-200, 50, -200], [-550, 45, -150], [-500, 40, 120], [-100, 50, 200], [250, 55, 100], [300, 50, -200]];
    AF.modes.probe = { enter() {}, exit() {}, update() { const q = AF._probePose; AF.camera.position.set(q[0], q[1], q[2]); AF.camTarget.set(q[3], q[4], q[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(q[3], 0, q[5]); } };
    AF._probePose = [100, 60, -60, -200, 0, -200]; AF.setMode('probe');
    await new Promise((res) => setTimeout(res, 3000));
    const S = AF.world.stream, CL = AF.world.clusters, T = 24000, t0 = performance.now();
    // hitch attribution: time every tick / idle hook and the renderer; a gap > 120 ms records the frame's top costs
    const cost = new Map(), hitches = [], R = AF.renderer, render0 = R.render, seenP = new Set(R.info.programs);
    const wrap = (h, tag) => { const fn = h.fn; h.fn0 = fn; h.fn = (...a) => { const t = performance.now(); try { return fn(...a); } finally { cost.set(tag + h.name, (cost.get(tag + h.name) || 0) + performance.now() - t); } }; };
    for (const h of AF.hooks.tick) wrap(h, ''); for (const h of AF.hooks.idle) wrap(h, 'idle:');
    R.render = function (...a) { const t = performance.now(); try { return render0.apply(this, a); } finally { cost.set('render', (cost.get('render') || 0) + performance.now() - t); } };
    let last = t0, n = 0, late = 0, samples = 0, nextS = t0; const fr = [];
    await new Promise((res) => {
      const s = () => {
        const now = performance.now(), u = Math.min(1, (now - t0) / T) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(u)), f = u - i, a = path[i], c = path[i + 1];
        const x = a[0] + (c[0] - a[0]) * f, y = a[1] + (c[1] - a[1]) * f, z = a[2] + (c[2] - a[2]) * f, L = Math.hypot(c[0] - a[0], c[2] - a[2]);
        AF._probePose = [x, y, z, x + (c[0] - a[0]) / L * 80, 0, z + (c[2] - a[2]) / L * 80];
        fr.push(now - last); n++;
        if (now - last > 120) hitches.push(Math.round(now - last) + ' prog:' + R.info.programs.length + ' new:' + R.info.programs.filter((q) => !seenP.has(q)).map((q) => { seenP.add(q); return q.name + '|' + q.cacheKey.split(',').slice(0, 8).join(','); }).join(';') + ' ' + [...cost.entries()].sort((q, w) => w[1] - q[1]).slice(0, 4).map(([k, v]) => k + ':' + Math.round(v)).join(' '));
        cost.clear();
        last = now;
        if (now >= nextS) {
          nextS += 500; samples++;
          const RL = AF.world.regLod;
          for (const cl of CL.values()) {
            if (Math.hypot(Math.max(cl.x0 - x, 0, x - cl.x1), Math.max(cl.z0 - z, 0, z - cl.z1)) > 160 || cl.lvl !== 1) continue;
            for (const k of cl.regs) {
              const r = RL.get(k), cx = cl.x0 + (((k >> 6) & 3) + 0.5) * 32, cz = cl.z0 + (((k & 63) & 3) + 0.5) * 32;
              if (Math.hypot(cx - x, cz - z) > 160) continue;
              if (!(cl.part && r)) late++;
            }
          }
        }
        if (now - t0 > T) res(); else requestAnimationFrame(s);
      };
      requestAnimationFrame(s);
    });
    fr.sort((q, w) => w - q);
    for (const h of AF.hooks.tick.concat(AF.hooks.idle)) if (h.fn0) { h.fn = h.fn0; delete h.fn0; }
    R.render = render0;
    return { url: location.pathname, region: AF.LOD.region, fps: +(AF.fps).toFixed(1), rafs: n, worst: fr.slice(0, 8).map(Math.round), over50: fr.filter((v) => v > 50).length, late, samples, done: S.done, pend: S.pending.size, maxStep: S.maxStep, maxPhase: S.maxPhase, ms: S.ms, hitches };
  });
  await ctx.close();
  return { r, errs };
}
