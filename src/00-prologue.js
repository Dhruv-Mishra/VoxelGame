// ===== prologue: module scope shared by every part (only THREE + ADDONS live here) =====
window.AF = window.AF || {};
{
  const mobile = new URLSearchParams(location.search).has('mobile') || /iPad|iPhone|iPod|Android/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) || (typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  let firstError = false;
  window.AF.reportError = (error) => {
    if (!mobile || firstError) return;
    firstError = true;
    const message = String(error && (error.message || error.stack) || error || 'Unknown error').slice(0, 600);
    const display = () => {
      const panel = document.createElement('div'), text = document.createElement('div'), dismiss = document.createElement('button');
      panel.id = 'af-mobile-error'; panel.setAttribute('role', 'alert');
      panel.style.cssText = 'position:fixed;top:12px;left:12px;right:12px;z-index:2147483646;padding:14px;background:#20252a;color:#fff;border:1px solid #fff;border-radius:4px;font:14px sans-serif;overflow-wrap:anywhere';
      text.textContent = message; dismiss.textContent = 'Dismiss';
      dismiss.style.cssText = 'margin-top:10px;padding:6px 12px;font:inherit';
      dismiss.addEventListener('click', () => panel.remove());
      panel.append(text, dismiss); document.body.appendChild(panel);
    };
    if (document.body) display(); else addEventListener('DOMContentLoaded', display, { once: true });
  };
  addEventListener('error', (event) => window.AF.reportError(event.error || event.message));
  addEventListener('unhandledrejection', (event) => window.AF.reportError(event.reason));
}
const THREE = await import('three').catch((error) => { window.AF.reportError(error); throw error; });
const ADDONS = {};
{
  const [ec, rp, ub, sp, op, bgu] = await Promise.all([
    import('three/addons/postprocessing/EffectComposer.js'),
    import('three/addons/postprocessing/RenderPass.js'),
    import('three/addons/postprocessing/UnrealBloomPass.js'),
    import('three/addons/postprocessing/ShaderPass.js'),
    import('three/addons/postprocessing/OutputPass.js'),
    import('three/addons/utils/BufferGeometryUtils.js'),
  ]).catch((error) => { window.AF.reportError(error); throw error; });
  Object.assign(ADDONS, ec, rp, ub, sp, op, { BGU: bgu });
}
window.THREE = THREE;
window.AF = window.AF || {};
window.AF.addons = ADDONS;
window.AF.errors = [];
window.AF.partError = (part, e) => {
  console.error('[af] part ' + part + ' threw at top level:', e);
  window.AF.errors.push({ part, msg: String(e && (e.stack || e.message) || e) });
  window.AF.reportError(e);
};

