// Harness: window.afLodCheck() -> LOD invariants (exactly one of cluster far / region full / region coarse on screen per region,
// no mesh left on a fade material once ramps settle). window.afFly(path, seconds) moves a probe camera along waypoints at 30 fps.
window.afLodCheck = () => {
  const AF = window.__af, RL = AF.world.regLod, F = AF.world.fade || { mats: null, act: [], pend: [] }, M = F.mats, bad = [];
  const on = (m) => m.visible && (m.layers.mask & 1) && m.material !== AF.mat.glass && !!m.parent;
  for (const cl of AF.world.clusters.values()) {
    if (!cl.built || cl.fadeE) continue;
    const farOn = cl.far.some(on);
    for (const k of cl.regs) {
      const r = RL.get(k); if (!r || r.fadeE) continue;
      const farR = farOn && !(cl.part && RL.has(k));
      const fullOn = r.full.some(on), coarseOn = r.coarse.some(on), n = (farR ? 1 : 0) + (fullOn ? 1 : 0) + (coarseOn ? 1 : 0);
      if (n === 1 || (n === 0 && cl.lvl === 1 && !cl.far.length)) continue;
      bad.push(k + ':' + (farR ? 'F' : '') + (fullOn ? 'R' : '') + (coarseOn ? 'C' : '') + ' cl' + cl.lvl + ' r' + r.lvl + (cl.part ? ' part' : ''));
    }
  }
  let fadeMat = 0;
  AF.world.group.traverse((o) => { if (M && (o.material === M.in || o.material === M.out)) fadeMat++; });
  return { bad: bad.length, sample: bad.slice(0, 6), fadeMat, act: F.act.length, pend: F.pend.length, swaps: F.swaps };
};
window.afFly = (path, seconds, onFrame) => {
  const AF = window.__af;
  if (!AF.modes.probe) AF.modes.probe = { enter() {}, exit() {}, update() { const p = AF._probePose; AF.camera.position.set(p[0], p[1], p[2]); AF.camTarget.set(p[3], p[4], p[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(p[3], 0, p[5]); } };
  AF.setMode('probe');
  const frames = Math.round(seconds * 30), out = [];
  for (let f = 0; f <= frames; f++) {
    const u = f / frames * (path.length - 1), i = Math.min(path.length - 2, Math.floor(u)), t = u - i, a = path[i], b = path[i + 1];
    AF._probePose = a.map((v, j) => v + (b[j] - v) * t);
    AF.step(1, 1 / 30);
    if (onFrame) { const r = onFrame(f); if (r) out.push(r); }
  }
  return out;
};
