// Harness: window.afList(pose) -> exactly what the main pass drew (three's render list after a frame), grouped by owner.
window.afList = (pose, depth = 2) => {
  const AF = window.__af, R = AF.renderer;
  if (!AF.modes.probe) AF.modes.probe = { enter() {}, exit() {}, update() { const p = AF._probePose; AF.camera.position.set(p[0], p[1], p[2]); AF.camTarget.set(p[3], p[4], p[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(p[3], 0, p[5]); } };
  AF._probePose = pose; AF.setMode('probe'); AF.step(20);
  const rows = new Map();
  const keyOf = (o) => {
    const chain = []; for (let p = o; p && p !== AF.scene; p = p.parent) chain.unshift(p.name || p.type);
    let k = chain.slice(0, depth).join('/');
    if (chain[0] === 'world') k = 'world:' + (o.userData.far ? 'far' : o.userData.coarse ? 'coarse' : o.name === 'water' ? 'water' : o.material === AF.mat.glass ? 'glass' : 'other');
    return k;
  };
  const lists = R.renderLists.get(AF.scene, 0);
  let calls = 0, tris = 0;
  for (const arr of [lists.opaque, lists.transmissive, lists.transparent]) for (const it of arr) {
    const o = it.object, g = it.geometry; if (!g) continue;
    const cnt = g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0;
    let t = (it.group ? it.group.count : Math.min(cnt, g.drawRange.count)) / 3; if (o.isInstancedMesh) t *= o.count;
    const k = keyOf(o) + (o.isInstancedMesh ? ':inst' : '') + (arr === lists.transparent ? ':T' : '');
    let r = rows.get(k); if (!r) rows.set(k, r = { d: 0, t: 0 }); r.d++; r.t += t; calls++; tris += t;
  }
  return { calls, tris: Math.round(tris / 1000) + 'k', rows: [...rows.entries()].sort((a, b) => b[1].d - a[1].d).slice(0, 30).map(([k, r]) => k + ' ' + r.d + 'dc ' + Math.round(r.t / 1000) + 'k') };
};
