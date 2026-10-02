// Playwright harness: streaming boot of globalThis.__psUrl (default output.html), then a probe camera flies a fixed route at plane speed
// in REAL time (rAF loop, fps cap active) for 24 s. Reports fps, worst frames, and "late" = pending clusters within 160 m of the camera
// (still showing their 1 m copy up close), summed over 0.5 s samples. Lower late = fewer late LOD loads.
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('portSolace.gfx', 'lite'); } catch (e) {} });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  await p.goto('http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 180000 });
  await p.addScriptTag({ url: 'http://127.0.0.1:8765/tools/lod-check.js?v=' + Date.now() });
  const r = await p.evaluate(async () => {
    const AF = __af;
    const path = [[100, 60, -60], [-200, 50, -200], [-550, 45, -150], [-500, 40, 120], [-100, 50, 200], [250, 55, 100], [300, 50, -200]];
    AF.modes.probe = { enter() {}, exit() {}, update() { const q = AF._probePose; AF.camera.position.set(q[0], q[1], q[2]); AF.camTarget.set(q[3], q[4], q[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(q[3], 0, q[5]); } };
    AF._probePose = [100, 60, -60, -200, 0, -200]; AF.setMode('probe');
    await new Promise((res) => setTimeout(res, 3000));
    const S = AF.world.stream, CL = AF.world.clusters, T = 24000, t0 = performance.now();
    let last = t0, n = 0, late = 0, samples = 0, nextS = t0; const fr = [];
    await new Promise((res) => {
      const s = () => {
        const now = performance.now(), u = Math.min(1, (now - t0) / T) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(u)), f = u - i, a = path[i], c = path[i + 1];
        const x = a[0] + (c[0] - a[0]) * f, y = a[1] + (c[1] - a[1]) * f, z = a[2] + (c[2] - a[2]) * f, L = Math.hypot(c[0] - a[0], c[2] - a[2]);
        AF._probePose = [x, y, z, x + (c[0] - a[0]) / L * 80, 0, z + (c[2] - a[2]) / L * 80];
        if (now - last > 0.5) { fr.push(Math.round(now - last)); n++; }
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
    let parts = 0; for (const cl of CL.values()) if (cl.part) parts++;
    await new Promise((res) => setTimeout(res, 1500));
    const chk = window.afLodCheck ? afLodCheck() : null;
    return { fps: +(AF.fps).toFixed(1), rafs: n, worst: fr.slice(0, 6), late, samples, done: S.done, unloaded: S.unloaded, pend: S.pending.size, idleMs: AF.frameStats ? +AF.frameStats.idleMs.toFixed(1) : null, cap: AF.fpsCap, swaps: AF.world.fade ? AF.world.fade.swaps : null, parts, chk };
  });
  await ctx.close();
  return { r, errs };
}
