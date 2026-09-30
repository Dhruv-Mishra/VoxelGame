// Perf probe (harness only): window.afPerf(poses, frames) -> per pose draw calls, triangles, frame ms (GPU-synced), top tick hooks.
window.afPerf = (poses, frames = 20) => {
  const AF = window.__af, R = AF.renderer, gl = R.getContext(), px = new Uint8Array(4);
  if (!AF.modes.probe) AF.modes.probe = { enter() {}, exit() {}, update() { const p = AF._probePose; AF.camera.position.set(p[0], p[1], p[2]); AF.camTarget.set(p[3], p[4], p[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(p[3], 0, p[5]); } };
  if (AF.ui) AF.ui.modalOpen = false;
  const hooks = AF.hooks.tick; const acc = new Map();
  const wrapped = hooks.map((h) => { const fn = h.fn; return [h, fn]; });
  for (const [h, fn] of wrapped) h.fn = (...a) => { const t = performance.now(); fn(...a); acc.set(h.name, (acc.get(h.name) || 0) + performance.now() - t); };
  const out = [];
  try {
    for (const pose of poses) {
      AF._probePose = pose.p; AF.setMode('probe');
      if (AF.player && pose.player !== false) { AF.player.pos && AF.player.pos.set && AF.player.pos.set(pose.p[3], pose.p[4], pose.p[5]); }
      AF.step(30);
      acc.clear(); R.info.autoReset = false; R.info.reset();
      const t0 = performance.now();
      for (let i = 0; i < frames; i++) { AF.step(1); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); }
      const ms = (performance.now() - t0) / frames;
      const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => k + ':' + (v / frames).toFixed(2));
      out.push({ name: pose.name, ms: +ms.toFixed(1), calls: Math.round(R.info.render.calls / frames), tris: Math.round(R.info.render.triangles / frames / 1000) + 'k', top: top.join(' ') });
      R.info.autoReset = true;
    }
  } finally { for (const [h, fn] of wrapped) h.fn = fn; }
  return out;
};
