// Harness: CPU-profile AF.step(frames) at a pose in the open session page (contexts()[1]); returns top self-time functions.
async (page) => {
  const p = page.context().browser().contexts()[1].pages()[0];
  const cdp = await p.context().newCDPSession(p);
  const pose = globalThis.__psPose || [40, 2, -80, 80, 3, -160];
  await p.evaluate((pose) => { __af._probePose = pose; __af.setMode('probe'); __af.step(20, 1 / 30); }, pose);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 100 }); await cdp.send('Profiler.start');
  await p.evaluate(() => __af.step(90, 1 / 30));
  const { profile } = await cdp.send('Profiler.stop');
  const byId = new Map(profile.nodes.map((n) => [n.id, n])), self = new Map();
  const dt = profile.timeDeltas; let total = 0;
  for (let i = 0; i < profile.samples.length; i++) {
    const n = byId.get(profile.samples[i]), f = n.callFrame, k = (f.functionName || '(anon)') + ' ' + (f.url.split('/').pop().split('?')[0]) + ':' + f.lineNumber;
    self.set(k, (self.get(k) || 0) + dt[i]); total += dt[i];
  }
  await cdp.detach();
  return { totalMsPerFrame: +(total / 1000 / 90).toFixed(2), top: [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30).map(([k, v]) => (v / 1000 / 90).toFixed(2) + ' ' + k) };
}
