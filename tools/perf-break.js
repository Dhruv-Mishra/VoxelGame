// Scene breakdown (harness only): window.afBreak(pose) -> triangles/draws per top-level group for the camera frustum and the shadow pass.
window.afBreak = (pose) => {
  const AF = window.__af, cam = AF.camera;
  AF._probePose = pose; AF.setMode('probe'); AF.step(20);
  const fr = new THREE.Frustum(), m = new THREE.Matrix4(), sph = new THREE.Sphere();
  fr.setFromProjectionMatrix(m.multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse));
  const sc = AF.sun.shadow.camera, sfr = new THREE.Frustum(); sc.updateMatrixWorld(); sfr.setFromProjectionMatrix(m.multiplyMatrices(sc.projectionMatrix, sc.matrixWorldInverse));
  const rows = new Map();
  const add = (k, tri, shadow) => { let r = rows.get(k); if (!r) rows.set(k, r = { draws: 0, tris: 0, sDraws: 0, sTris: 0 }); if (shadow) { r.sDraws++; r.sTris += tri; } else { r.draws++; r.tris += tri; } };
  const visible = (o) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true; };
  for (const top of AF.scene.children) {
    top.traverse((o) => {
      if (!(o.isMesh || o.isPoints || o.isLine) || !o.geometry || !visible(o) || !o.layers.test(cam.layers)) return;
      const g = o.geometry; const cnt = g.index ? g.index.count : g.attributes.position ? g.attributes.position.count : 0;
      let tri = Math.min(cnt, g.drawRange.count) / 3; if (o.isInstancedMesh) tri *= o.count;
      let key = top.name || top.type; if (top.name === 'world') key = 'world:' + (o.userData.far ? 'far' : o.userData.coarse ? 'coarse' : o.material === AF.mat.glass ? 'glass' : o.name === 'water' ? 'water' : AF.world.lod && [...AF.world.lod.values()].some((r) => r.near === o || r.nearGlass === o) ? 'propsNear' : [...AF.world.lod.values()].some((r) => r.far === o) ? 'propsFar' : 'full');
      else if (o.isInstancedMesh) key += ':inst';
      let inF = true, inS = true;
      if (o.frustumCulled && !o.isInstancedMesh) { if (!g.boundingSphere) g.computeBoundingSphere(); sph.copy(g.boundingSphere).applyMatrix4(o.matrixWorld); inF = fr.intersectsSphere(sph); inS = sfr.intersectsSphere(sph); }
      if (inF) add(key, tri, false);
      if (o.castShadow && inS) add(key, tri, true);
    });
  }
  return [...rows.entries()].map(([k, r]) => ({ k, d: r.draws, t: Math.round(r.tris / 1000), sd: r.sDraws, st: Math.round(r.sTris / 1000) })).sort((a, b) => b.t + b.st - a.t - a.st).slice(0, 25);
};
