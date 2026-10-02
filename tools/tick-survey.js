// Harness: window.afTicks(poses, frames) -> per pose, tick hooks costing >= 0.02 ms/frame (sorted), plus the total.
// Use poses far from an area to find simulations that run when nobody can see them.
window.afTicks = (poses, frames = 60) => {
  const AF = window.__af, H = AF.hooks.tick, out = {};
  if (!AF.modes.probe) AF.modes.probe = { enter() {}, exit() {}, update() { const p = AF._probePose; AF.camera.position.set(p[0], p[1], p[2]); AF.camTarget.set(p[3], p[4], p[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(p[3], 0, p[5]); } };
  const acc = new Map(), wrapped = H.map((h) => [h, h.fn]);
  for (const [h, fn] of wrapped) h.fn = (...a) => { const t = performance.now(); fn(...a); acc.set(h.name, (acc.get(h.name) || 0) + performance.now() - t); };
  try {
    for (const pose of poses) {
      AF._probePose = pose.p; AF.setMode('probe'); AF.step(20, 1 / 30); acc.clear();
      AF.step(frames, 1 / 30);
      const rows = [...acc.entries()].map(([k, v]) => [k, v / frames]).sort((a, b) => b[1] - a[1]);
      out[pose.name] = { total: +rows.reduce((s, r) => s + r[1], 0).toFixed(2), top: rows.filter((r) => r[1] >= 0.02).map((r) => r[0] + ':' + r[1].toFixed(2)).join(' ') };
    }
  } finally { for (const [h, fn] of wrapped) h.fn = fn; }
  return out;
};
