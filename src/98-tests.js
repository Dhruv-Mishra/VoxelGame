// ================================================================ 98-tests.js
try {
// ===== 98-tests: core self-tests (?test)  (OWNER: coordinator; agents add AF.test() calls in their own parts) =====
AF.test('no part or build stage threw', () => ({ ok: AF.errors.length === 0, info: AF.errors.map((e) => e.part + ': ' + e.msg.split('\n')[0]).join(' | ') }));
AF.test('world meshed with geometry', () => ({ ok: (AF.stats && AF.stats.quads > 200), info: 'quads ' + (AF.stats && AF.stats.quads) }));
AF.test('palette under capacity', () => ({ ok: AF.PAL.n < 4000, info: 'colours ' + AF.PAL.n }));
AF.test('a mode is active', () => ({ ok: !!AF.mode, info: String(AF.mode) }));
AF.test('boot under 25 s', () => ({ ok: AF.bootMs < 25000, info: AF.bootMs + ' ms ' + JSON.stringify(AF.stageTimes) }));
AF.test('ground at spawn is walkable', () => { const s = AF.PLAN.spawn; const y = AF.surfaceBelow(s.x, s.z, 40); return { ok: y > -1 && y < 3, info: 'y=' + y }; });
// engine v2
AF.test('engine: world top y 160 (tall column solid, collision, shadow range)', () => {
  const W = AF.W, top = W.NY * W.VS + W.Y0, x = 290.1, z = 290.1;
  const before = W.getM ? W.getM(x, 155, z) : 0;
  W.setM(x, 155, z, AF.col('stone')); const solid = AF.solidAt(x, 155.1, z); W.setM(x, 155, z, before || 0);
  const far = AF.camera.far >= 1500, fz = AF.gfx && AF.gfx.far ? AF.gfx.far.cam.far >= 1400 : true;
  return { ok: top >= 159.9 && solid && far && fz, info: 'top y ' + top + ' solid@155 ' + solid + ' camFar ' + AF.camera.far };
});
AF.test('engine: display fonts (deco 3x9 + script neon)', () => {
  const d = AF.textModel('PORT SOLACE 1936', 1, { font: 'deco' }), s = AF.textModel('Cocktails', 1, { font: 'script' });
  let n = 0; for (let i = 0; i < s.v.length; i++) if (s.v[i]) n++;
  const sz = AF.textSize('Diner', { font: 'script' });
  return { ok: d.h === 11 && d.w > 40 && n > 60 && sz.w > 20, info: `deco ${d.w}x${d.h}, script ${s.w}x${s.h} (${n} vox), Diner ${sz.w}x${sz.h}` };
});
AF.test('engine: smooth colours have no block grid', () => {
  const i = AF.col(0xe9dcc4, { smooth: true }), P = AF.PAL;
  return { ok: P.emit[i * 4 + 3] === 0 && P.albedo[i * 4 + 3] <= 0.04 && P.mat[i * 4 + 2] === 0, info: 'edge ' + P.emit[i * 4 + 3] + ' jitter ' + P.albedo[i * 4 + 3] };
});
AF.test('engine: contact shadows under indoor props', () => ({ ok: AF.Q.has('nocontact') || (AF.contact && AF.contact.count > 50), info: AF.contact && (AF.contact.count + ' blobs, ' + AF.contact.ms + ' ms') }));
// engine round 2
AF.test('engine: graphics tier switches to low and back', () => {
  const G = AF.GFX, was = G.name, wasAuto = G.auto, T = AF.gfx.TIER;
  G.set('low'); const low = AF.LOD_DIST === T.low.lod && AF.REGION_LOD === T.low.regLod;
  G.set(was); G.auto = wasAuto;
  const back = G.name === was && AF.LOD_DIST === AF.gfx.tierCfg().lod;
  return { ok: low && back, info: 'low ' + low + ' back ' + back + ' (' + was + ')' };
});
AF.test('engine: neon mode + lit-window fraction uniforms', () => {
  const i = AF.col(0xff6a9a, { emit: 0xff4f8a, emitK: 3, mode: 'neon', edge: 0, jitter: 0 }), U = AF.mat.uniforms;
  return { ok: Math.floor(AF.PAL.emit[i * 4 + 3]) === 3 && !!U.uLitFrac && !!U.uNeon, info: 'mode ' + AF.PAL.emit[i * 4 + 3] + ' litFrac ' + (U.uLitFrac && U.uLitFrac.value) + ' neon ' + (U.uNeon && U.uNeon.value) };
});

} catch (e) { AF.partError('98-tests.js', e); }

