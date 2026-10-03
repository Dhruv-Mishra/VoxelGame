// ================================================================ 99-boot.js
try {
// ===== 99-boot: run build stages, mesh the world, start  (OWNER: coordinator) =====
// Build order table (see CONTRACT.md):
//  100 terrain heightmap · 150 water/roads painting · 200 rail bed · 300 buildings · 400 street furniture + nature
//  500 MESH WORLD (core) · 600 dynamic actors (cars, trains, people) · 700 atmosphere/post · 800 player + UI · 900 final
AF.onBuild('mesh-world', 500, async () => { await AF.meshWorld(async (f) => { AF.loader(0.5 + f * 0.25, 'raising the rooftops… ' + Math.round(f * 100) + '%'); await AF.yield(); }); });
AF.loader = (f, msg) => {
  const fill = document.getElementById('ldfill'), m = document.getElementById('ldmsg');
  if (fill) fill.style.width = Math.round(f * 100) + '%';
  if (m && msg) m.textContent = msg;
};
(async () => {
  const t0 = performance.now();
  const stages = AF.hooks.build.slice().sort((a, b) => a.order - b.order);
  AF.stageTimes = {};
  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];
    if (s.order !== 500) AF.loader(s.order < 500 ? 0.05 + 0.45 * i / stages.length : 0.75 + 0.1 * i / stages.length, s.name.replace(/-/g, ' ') + '…');
    await AF.yield();
    const ts = performance.now();
    try { await s.fn(); }
    catch (e) { console.error('[af] build stage ' + s.name + ' threw:', e); AF.errors.push({ part: 'build:' + s.name, msg: String(e && e.stack || e) }); }
    AF.stageTimes[s.name] = Math.round(performance.now() - ts);
  }
  if (AF.PAL.dirty) AF.PAL.upload();
  AF.bootMs = Math.round(performance.now() - t0);
  console.log('[af] boot', AF.bootMs, 'ms', JSON.stringify(AF.stageTimes));
  if (!AF.mode) {
    if (AF.modes.aerial) AF.setMode('aerial');
    else { const v = AF.PLAN.views[0]; AF.camPose(...v.pos, ...v.target); }
  }
  AF.ready = true;
  AF.emit('ready');
  // every generator finishes and the opening view streams in + compiles behind the loader (01-stream): longer load, no pop-in
  if (!AF.TEST) { try { await AF.stream.preload((f, msg) => AF.loader(0.85 + 0.15 * f, msg)); } catch (e) { console.error('[af] preload threw:', e); AF.errors.push({ part: 'preload', msg: String(e && e.stack || e) }); } }
  AF.preloaded = true; AF.emit('preloaded');
  const ld = document.getElementById('loader'); if (ld) ld.classList.add('done');
  if (AF.TEST) {
    AF.step(3);
    const res = []; let pass = 0;
    for (const t of AF.hooks.tests) {
      let ok = false, info = '';
      try { const r = await t.fn(); ok = r === true || (r && r.ok); info = r && r.info ? r.info : (typeof r === 'string' ? r : ''); }
      catch (e) { info = 'threw ' + (e && e.message); }
      res.push({ name: t.name, ok, info }); if (ok) pass++;
      console.log('[test] ' + (ok ? 'PASS' : 'FAIL') + ' ' + t.name + (info ? ' — ' + info : ''));
    }
    AF.testResult = { pass, total: res.length, res };
    document.title = `${pass}/${res.length} ${AF.PLAN.name}`;
    console.log(`[test] ${pass}/${res.length}`);
  }
})();

} catch (e) { AF.partError('99-boot.js', e); }

