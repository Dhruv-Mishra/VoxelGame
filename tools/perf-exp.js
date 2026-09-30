// Harness: window.afExp(pose, n) -> GPU-synced ms with individual features toggled off (post, shadows, far cascade, res, AO).
window.afExp = (pose, n = 15) => {
  const AF = window.__af, R = AF.renderer, gl = R.getContext(), px = new Uint8Array(4);
  if (!AF.modes.probe) AF.modes.probe = { enter() {}, exit() {}, update() { const p = AF._probePose; AF.camera.position.set(p[0], p[1], p[2]); AF.camTarget.set(p[3], p[4], p[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(p[3], 0, p[5]); } };
  AF._probePose = pose; AF.setMode('probe');
  const time = () => { AF.step(8); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const t = performance.now(); for (let i = 0; i < n; i++) { AF.step(1); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); } return +((performance.now() - t) / n).toFixed(1); };
  const res = { base: time() };
  const rf = AF.renderFrame; AF.renderFrame = () => R.render(AF.scene, AF.camera); res.noPost = time(); AF.renderFrame = rf;
  const every = () => {}; const sm = R.shadowMap.enabled; R.shadowMap.enabled = false; res.noShadow = time(); R.shadowMap.enabled = sm;
  const U = AF.mat.uniforms; const fo = AF.gfx.far.on; AF.gfx.far.on = false; U.uFarOn.value = 0; res.noFar = time(); AF.gfx.far.on = fo;
  const pr = R.getPixelRatio(); R.setPixelRatio(pr * 0.5); AF.resize(); res.halfRes = time(); R.setPixelRatio(pr); AF.resize();
  const W = AF.world.group; const wv = W.visible; W.visible = false; res.noWorld = time(); W.visible = wv;
  return res;
};
