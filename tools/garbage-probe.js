// per-frame garbage: sampling heap profile (incl. objects already collected) while walking / driving in the city; top allocation sites
async (page) => {
  await page.addInitScript(() => { try { localStorage.setItem('portSolace.gfx', 'high'); } catch (e) {} });
  await page.goto('http://127.0.0.1:8765/output.html?v=' + Date.now());
  await page.waitForFunction(() => window.__af && window.__af.preloaded, null, { timeout: 300000 });
  await new Promise((r) => setTimeout(r, 6000));
  await page.evaluate(() => __af.ui.go());
  await new Promise((r) => setTimeout(r, 8000));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('HeapProfiler.enable');
  await cdp.send('HeapProfiler.startSampling', { samplingInterval: 4096, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true });
  const secs = await page.evaluate(async (mode) => {
    const AF = __af, I = AF.input, wait = (ms) => new Promise((r) => setTimeout(r, ms)), t0 = performance.now(), f0 = AF.clock.frame;
    if (mode === 'drive') {
      const VV = AF.vehicles, p = AF.player; let best = null, bd = 1e18;
      for (const s of VV.parkedStatic) { if (s.noDrive || s.outland) continue; const d = (s.x - p.x) ** 2 + (s.z - p.z) ** 2; if (d < bd) { bd = d; best = s; } }
      if (best) AF.setMode('drive', { car: VV.unpark(best) });
      VV.autoInput = { up: true, down: false, left: 0, right: 0, brake: false };
      for (let i = 0; i < 10; i++) { await wait(1500); const r = AF.whash(i, 7); VV.autoInput.left = r < 0.25 ? 1 : 0; VV.autoInput.right = r > 0.75 ? 1 : 0; }
      VV.autoInput = null;
    } else { I.down.add('KeyW'); await wait(15000); I.down.delete('KeyW'); }
    return { s: (performance.now() - t0) / 1000, frames: AF.clock.frame - f0 };
  }, globalThis.__gMode || 'walk');
  const { profile } = await cdp.send('HeapProfiler.stopSampling');
  const agg = new Map();
  const walk = (n, parent) => { const f = n.callFrame, key = (f.functionName || '(anon)') + ' ' + (f.url || '').split('/').pop().split('?')[0] + ':' + (f.lineNumber + 1) + (parent ? ' <' + parent : ''); agg.set(key, (agg.get(key) || 0) + n.selfSize); for (const c of n.children) walk(c, (f.functionName || '(anon)') + ':' + (f.lineNumber + 1)); };
  walk(profile.head, '');
  let total = 0; for (const v of agg.values()) total += v;
  const top = [...agg.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => (v / 1024 / secs.s).toFixed(0) + ' KB/s ' + k);
  return { secs, totalKBs: Math.round(total / 1024 / secs.s), top };
}
