// GPU timer (harness only): window.afGpu(poses, frames) -> per pose mean GPU ms of AF.renderFrame (EXT_disjoint_timer_query_webgl2).
window.afGpu = async (poses, frames = 24) => {
  const AF = window.__af, gl = AF.renderer.getContext(), ext = gl.getExtension('EXT_disjoint_timer_query_webgl2');
  if (!ext) return null;
  if (!AF.modes.probe) AF.modes.probe = { enter() {}, exit() {}, update() { const p = AF._probePose; AF.camera.position.set(p[0], p[1], p[2]); AF.camTarget.set(p[3], p[4], p[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(p[3], 0, p[5]); } };
  const rf = AF.renderFrame, qs = [], whole = !!window.afGpuWhole;
  if (!whole) AF.renderFrame = () => { const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); try { rf(); } finally { gl.endQuery(ext.TIME_ELAPSED_EXT); qs.push(q); } };
  const out = [];
  try {
    for (const pose of poses) {
      AF._probePose = pose.p; AF.setMode('probe'); AF.step(20);
      qs.length = 0;
      for (let i = 0; i < frames; i++) {
        if (!whole) { AF.step(1); continue; }
        const q = gl.createQuery(); gl.beginQuery(ext.TIME_ELAPSED_EXT, q); AF.step(1); gl.endQuery(ext.TIME_ELAPSED_EXT); qs.push(q);
      }
      const mine = qs.slice();
      let vals = [];
      for (let tries = 0; tries < 200; tries++) {
        await new Promise((r) => setTimeout(r, 10));
        if (gl.getParameter(ext.GPU_DISJOINT_EXT)) { vals = null; break; }
        if (mine.every((q) => gl.getQueryParameter(q, gl.QUERY_RESULT_AVAILABLE))) { vals = mine.map((q) => gl.getQueryParameter(q, gl.QUERY_RESULT) / 1e6); break; }
      }
      for (const q of mine) gl.deleteQuery(q);
      if (!vals || !vals.length) { out.push({ name: pose.name, gpu: null }); continue; }
      vals.sort((a, b) => a - b); vals = vals.slice(0, Math.max(1, vals.length - 2));   // drop the 2 slowest (tier switches, uploads)
      out.push({ name: pose.name, gpu: +(vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(2) });
    }
  } finally { AF.renderFrame = rf; }
  return out;
};
