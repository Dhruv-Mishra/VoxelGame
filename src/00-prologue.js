// ===== prologue: module scope shared by every part (only THREE + ADDONS live here) =====
const THREE = await import('three');
const ADDONS = {};
{
  const [ec, rp, ub, sp, op, bgu] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
    import('three/addons/utils/BufferGeometryUtils.js'),
  ]);
  Object.assign(ADDONS, ec, rp, ub, sp, op, { BGU: bgu });
}
window.THREE = THREE;
window.AF = window.AF || {};
window.AF.addons = ADDONS;
window.AF.errors = [];
window.AF.partError = (part, e) => {
  console.error('[af] part ' + part + ' threw at top level:', e);
  window.AF.errors.push({ part, msg: String(e && (e.stack || e.message) || e) });
};

