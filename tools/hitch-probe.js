// Playwright harness: hitch attribution. Boots globalThis.__psUrl (default output.html, streaming on, tier globalThis.__psTier ||
// 'lite'), waits for `preloaded`, wraps every tick / idle hook and AF.renderFrame with timers, then runs globalThis.__psScenario
// ('fly' default | 'walk' | 'drive' | 'all') in real time. Every rAF gap > 60 ms is reported with its top contributors, the
// shader programs linked during it and the time no hook accounts for (GC, compile, worker callbacks, timers). Each hitch carries
// veil (the loader / travel veil was up: not seen in play); with __psTrace every traced event (>= 6 ms, any process) overlapping the
// gap lands in hitch.ev. Also timed: each stream system's near() ('n:name'), renderer.compile, AF.stream.warm's synchronous part.
// Summary: node tools/hitch-sum.js result.txt [--ev]
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript((t) => { try { localStorage.setItem('portSolace.gfx', t); } catch (e) {} }, globalThis.__psTier || 'lite');
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 300)));
  p.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /\[af\]/.test(m.text()))) errs.push(m.text().slice(0, 300)); });
  const t0 = Date.now();
  await p.goto('http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.preloaded, null, { timeout: 300000 });
  const bootMs = Date.now() - t0;
  if (globalThis.__psExtraSrc) await p.evaluate('window.__psExtra = ' + globalThis.__psExtraSrc);
  if (globalThis.__psThrottle) { const pc = await ctx.newCDPSession(p); await pc.send('Emulation.setCPUThrottlingRate', { rate: globalThis.__psThrottle }); }
  // optional browser-wide trace (all processes): only events >= 25 ms are kept, plus console.timeStamp step marks
  const trace = [], marks = []; let tcdp = null, traceDone = null;
  if (globalThis.__psTrace) {
    tcdp = await b.newBrowserCDPSession();
    tcdp.on('Tracing.dataCollected', ({ value }) => { for (const e of value) {
      if (e.name === 'TimeStamp' && e.args && e.args.data) marks.push([e.ts, e.args.data.message]);
      else if (e.ph === 'X' && e.dur >= 6000) trace.push([e.ts, Math.round(e.dur / 1000), e.name, e.pid, e.tid, e.cat, e.args && e.args.data ? (e.args.data.url || e.args.data.functionName || e.args.data.type || '').toString().slice(-40) + (e.args.data.lineNumber ? ':' + e.args.data.lineNumber : '') : '']);
    } });
    traceDone = new Promise((res) => tcdp.on('Tracing.tracingComplete', res));
    await tcdp.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'v8', 'v8.execute', 'gpu', 'disabled-by-default-devtools.timeline', 'blink.user_timing', 'toplevel', 'cc', 'viz', 'gpu.angle', 'disabled-by-default-gpu.service', 'blink', 'renderer.scheduler'] } });
  }
  const r = await p.evaluate(async (scenario) => {
    const AF = __af, acc = new Map(), R = AF.renderer, worst = new Map();
    const wrap = (label, h) => { const f = h.fn; h.fn = function () { const s = performance.now(); try { return f.apply(this, arguments); } finally { const d = performance.now() - s; acc.set(label, (acc.get(label) || 0) + d); if (d > (worst.get(label) || 0)) worst.set(label, d); } }; };
    for (const h of AF.hooks.tick) wrap('t:' + h.name, h);
    for (const h of AF.hooks.idle) wrap('i:' + h.name, h);
    const rf = AF.renderFrame; AF.renderFrame = function () { const s = performance.now(); try { return rf.apply(this, arguments); } finally { const d = performance.now() - s; acc.set('render', (acc.get('render') || 0) + d); if (d > (worst.get('render') || 0)) worst.set('render', d); } };
    const tw = (obj, k, label) => { const f = obj[k]; if (typeof f !== 'function') return; obj[k] = function () { const s = performance.now(); try { return f.apply(this, arguments); } finally { const d = performance.now() - s; acc.set(label, (acc.get(label) || 0) + d); if (d > (worst.get(label) || 0)) worst.set(label, d); } }; };
    for (const sy of AF.stream.systems) tw(sy, 'near', 'n:' + sy.name);
    tw(R, 'compile', 'compile'); tw(AF.stream, 'warm', 'warm-sync');
    // WebGL calls that can stall: uploads (bytes), shader compile / link + their status queries (sync points), reads
    const gl = R.getContext(), links = [], GLW = ['bufferData', 'bufferSubData', 'texImage2D', 'texSubImage2D', 'texImage3D', 'texSubImage3D', 'texStorage2D', 'compileShader', 'linkProgram', 'getProgramParameter', 'getShaderParameter', 'getProgramInfoLog', 'getShaderInfoLog', 'readPixels', 'clientWaitSync', 'getUniformLocation', 'getActiveUniform', 'getActiveAttrib', 'generateMipmap', 'getError', 'renderbufferStorageMultisample', 'framebufferTexture2D', 'checkFramebufferStatus'];
    for (const k of GLW) { const f = gl[k]; if (!f) continue; gl[k] = function () { if (k === 'linkProgram' && links.length < 40) { const lim = Error.stackTraceLimit; Error.stackTraceLimit = 40; const st = String(new Error().stack); Error.stackTraceLimit = lim; links.push((window.__psStep || '') + ' ' + AF.clock.t.toFixed(1) + ' ' + st.split('\n').slice(2).map((s) => s.trim().replace(/\(?https?:\/\/[^)]*\/(output[^:]*|three[^:]*|tools[^:]*):/, '$1:').replace(/^at /, '')).filter((s) => !/three\.module/.test(s) || /render \(|fromScene|compile/.test(s)).slice(0, 10).join(' < ')); } const s = performance.now(); try { return f.apply(gl, arguments); } finally { const d = performance.now() - s; acc.set('gl.' + k, (acc.get('gl.' + k) || 0) + d); if (k === 'bufferData' && arguments[1] && arguments[1].byteLength) acc.set('#bufKB', (acc.get('#bufKB') || 0) + arguments[1].byteLength / 1024); } }; }
    const dbg = gl.getExtension('WEBGL_debug_renderer_info'), gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '?';
    const hitches = [], gaps = [], newProgs = []; let seenProgs = R.info.programs.length; let last = performance.now(), progs = R.info.programs.length, run = true, frames = 0;
    const tick = () => {
      if (!run) return; requestAnimationFrame(tick);
      const now = performance.now(), gap = now - last; last = now; frames++; gaps.push(gap);
      if (gap > 60) {
        let sum = 0; const top = [...acc.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([k, v]) => { return k + ' ' + v.toFixed(0); });
        for (const [k, v] of acc) if (k[0] !== 'g' && k[0] !== '#') sum += v;
        const np = R.info.programs.length;
        console.timeStamp('HITCH' + hitches.length + ' ' + Math.round(gap));
        hitches.push({ id: hitches.length, veil: (() => { const l = document.getElementById('loader'); return !!(l && !l.classList.contains('done')); })(), step: window.__psStep || '', at: +(AF.clock.t).toFixed(1), gap: Math.round(gap), un: Math.round(gap - sum), progs: np - progs, mode: AF.mode, pos: [Math.round(AF.camera.position.x), Math.round(AF.camera.position.y), Math.round(AF.camera.position.z)], top });
      }
      progs = R.info.programs.length; acc.clear();
      if (progs > seenProgs) {
        const fresh = new Set(R.info.programs.slice(seenProgs)), who = new Map();
        AF.scene.traverse((o) => { const ms = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []; for (const m of ms) { const pp = R.properties.get(m); for (const q of [pp.currentProgram]) if (q && fresh.has(q) && !who.has(q)) who.set(q, (o.name || o.type) + '/' + (m.name || m.type) + (o.parent && o.parent.name ? ' in ' + o.parent.name : '')); } });
        for (const q of fresh) newProgs.push((window.__psStep || '') + ' ' + q.name + ' <' + (who.get(q) || '?') + '> ' + q.cacheKey.length);
        seenProgs = progs;
      }
    };
    requestAnimationFrame(tick);
    const wait = (ms) => new Promise((res) => setTimeout(res, ms));
    const fly = async () => {
      const path = [[100, 60, -60], [-200, 50, -200], [-550, 45, -150], [-500, 40, 120], [-100, 50, 200], [250, 55, 100], [300, 50, -200], [900, 80, -600], [1400, 90, 300], [600, 70, 900], [-300, 60, 1200], [-1500, 90, 800], [-1800, 90, -400], [-700, 60, -900], [100, 60, -60]];
      AF.modes.probe = { enter() {}, exit() {}, update() { const q = AF._probePose; AF.camera.position.set(q[0], q[1], q[2]); AF.camTarget.set(q[3], q[4], q[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(q[3], 0, q[5]); } };
      AF._probePose = [100, 60, -60, -200, 0, -200]; AF.setMode('probe');
      const T = +(window.__flyT || 60000), s0 = performance.now();
      while (performance.now() - s0 < T) {
        const u = Math.min(1, (performance.now() - s0) / T) * (path.length - 1), i = Math.min(path.length - 2, Math.floor(u)), f = u - i, a = path[i], c = path[i + 1];
        const x = a[0] + (c[0] - a[0]) * f, y = a[1] + (c[1] - a[1]) * f, z = a[2] + (c[2] - a[2]) * f, L = Math.hypot(c[0] - a[0], c[2] - a[2]) || 1;
        AF._probePose = [x, y, z, x + (c[0] - a[0]) / L * 80, 0, z + (c[2] - a[2]) / L * 80];
        await new Promise((res) => requestAnimationFrame(res));
      }
      AF.setMode('walk');
    };
    await wait(1500);
    if (AF.world.stream) AF.world.stream.maxStep = 0;
    const mem0 = { geos: R.info.memory.geometries, tex: R.info.memory.textures, progs: R.info.programs.length, heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0, objs: (() => { let n = 0; AF.scene.traverse(() => n++); return n; })() };
    if (scenario === 'fly' || scenario === 'all') await fly();
    if (window.__psExtra) await window.__psExtra(AF, wait);
    run = false;
    gaps.sort((a, b) => b - a);
    const n = gaps.length, p = (q) => Math.round(gaps[Math.floor(n * q)]);
    return { gpu, newProgs, links, worstCalls: [...worst.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20).map(([k, v]) => k + ' ' + v.toFixed(1)), frames, p50: p(0.5), p99: p(0.01), p999: p(0.001), worst: gaps.slice(0, 8).map(Math.round), long: hitches.length, hitches: hitches.sort((a, b) => b.gap - a.gap).slice(0, 30), log: window.__psLog || [], progs: R.info.programs.length, geos: R.info.memory.geometries, tex: R.info.memory.textures, mem: AF.memStats ? AF.memStats() : null, mem0, mem1: { heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1048576) : 0, objs: (() => { let n = 0; AF.scene.traverse(() => n++); return n; })() }, strMax: AF.world.stream ? [AF.world.stream.maxStep, AF.world.stream.maxPhase] : null, fd: AF.stream.firstDraws ? { drawn: AF.stream.firstDraws.drawn, keys: AF.stream.firstDraws.keys.size, newProgs: AF.stream.firstDraws.newProgs } : null };
  }, globalThis.__psScenario || 'fly');
  let traced = null;
  if (tcdp) {
    await tcdp.send('Tracing.end'); await traceDone; await tcdp.detach();
    marks.sort((a, b) => a[0] - b[0]);
    const stepAt = (ts) => { let s = ''; for (const m of marks) if (m[0] <= ts) s = m[1]; else break; return s; };
    const keep = /GC|Compile|GPUTask|ProgramLink|Shader|Layout|Paint|DecodeImage|TimerFire|FireAnimationFrame|FunctionCall|EvaluateScript|RunMicrotasks|Recalc|UpdateLayoutTree|CommandBuffer|Decode|Raster|Commit|SwapBuffers|Present/;
    traced = trace.filter((e) => keep.test(e[2])).sort((a, b) => b[1] - a[1]).slice(0, 30).map((e) => stepAt(e[0]) + ' ' + e[1] + 'ms ' + e[2] + ' p' + e[3] + ' ' + e[6]);
    // per hitch: every traced event (>= 6 ms, any process) overlapping the gap window
    const hm = new Map(); for (const m of marks) { const q = /^HITCH(\d+) (\d+)/.exec(m[1]); if (q) hm.set(+q[1], [m[0] - +q[2] * 1000, m[0]]); }
    for (const h of r.hitches) {
      const w = hm.get(h.id); if (!w) continue;
      h.ev = trace.filter((e) => e[0] < w[1] && e[0] + e[1] * 1000 > w[0]).sort((a, b) => b[1] - a[1]).slice(0, 14).map((e) => e[1] + ' ' + e[2] + ' p' + e[3] + '/' + e[4] + ' ' + e[6]);
    }
  }
  if (!globalThis.__psKeep) await ctx.close();
  return { bootMs, r, traced, errs: errs.slice(0, 8) };
}
