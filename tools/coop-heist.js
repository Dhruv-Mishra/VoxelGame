// Co-op heist harness: two real clients (host + guest) over local WebRTC (tools/serve.mjs signaling), cutscenes on.
// node tools/coop-heist.js [port] [--four]   (playwright resolvable, e.g. NODE_PATH; CHROME=path/to/chrome.exe optional)
// The guest asks Vera, both clients walk every step in lockstep (host and guest alternate completing them; host-only steps by the host),
// the crew splits into hacker (guest) + inside man (host) at midnight, the guest fails the night (both restore to the same checkpoint),
// the guest retries, the hacker overrides the time lock and each client turns one vault key, then the job pays out on both sides.
const { chromium } = require('playwright');
const PORT = process.argv[2] || 8765, URL = `http://127.0.0.1:${PORT}/output.html?nostream&nofade`;
const COUNT = process.argv.includes('--four') ? 4 : 2;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const errs = [];
  const open = async (tag) => {
    const ctx = await b.newContext({ viewport: { width: 960, height: 540 } });
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(tag + ' PAGEERR ' + String(e).slice(0, 300)));
    p.on('console', (m) => { if (m.type() === 'error' && !/favicon|WebGL|GPU stall/i.test(m.text())) errs.push(tag + ' ' + m.text().slice(0, 300)); });
    await p.goto(URL);
    await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 180000 });
    await p.evaluate(() => { const UI = AF.ui || {}; if (UI.state) UI.state.title = false; document.querySelectorAll('#title,.title').forEach((e) => e.style.display = 'none'); AF.setMode('walk', { x: -100, y: 4, z: -60, yaw: 0, snap: true }); });
    return p;
  };
  const host = await open('host'), guest = await open('guest');
  const crew = [host, guest];
  for (let i = 2; i < COUNT; i++) crew.push(await open('guest' + i));
  // two different friends (the host refuses a guest playing the same one)
  await Promise.all(crew.map((p, i) => p.evaluate((slot) => AF.friends.play(AF.friends.cast[slot].id), i)));
  await Promise.all(crew.map((p) => p.evaluate(() => AF.setMode('walk', { x: -100, y: 4, z: -60, yaw: 0, snap: true }))));
  const st = (p) => p.evaluate(() => ({ on: AF.heist.on, i: AF.heist.i, cp: AF.heist.cp, failing: !!AF.heist.failing, money: AF.money.v, cut: AF.mission.cut.on, peers: AF.net.peers.size, line: AF.hud.job && AF.hud.job.line, id: AF.heist.dbg.ST[AF.heist.i] && AF.heist.dbg.ST[AF.heist.i].id, tr: AF.heist.tr.h + '/' + AF.heist.tr.n }));
  const until = async (fn, ms = 20000, what = '') => { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) throw new Error('timeout: ' + what); await host.waitForTimeout(150); } };
  const skipCuts = () => Promise.all(crew.map((p) => p.evaluate(() => { const C = AF.mission.cut; if (C.on) { C.skipT = 0; C.skip(); } })));
  const out = { crew: COUNT, steps: [] };
  try {
    const code = await host.evaluate(async () => { await AF.net.host(); return AF.net.code; });
    for (const p of crew.slice(1)) await p.evaluate((c) => AF.net.join(c), code);
    await until(async () => (await st(host)).peers === COUNT - 1 && (await st(guest)).peers === COUNT - 1, 30000, 'link');
    out.link = code;
    const m0 = await Promise.all(crew.map(async (p) => (await st(p)).money));
    // the guest asks Vera; the host starts the job for both
    await guest.evaluate(() => AF.heist.start());
    await until(async () => { const h = await st(host), g = await st(guest); return h.on && g.on && h.i === g.i; }, 10000, 'start');
    const N = await host.evaluate(() => AF.heist.dbg.ST.length), KEYS = await host.evaluate(() => AF.heist.dbg.IDX.night), SPLIT = await host.evaluate(() => AF.heist.dbg.IDX.split), HOSTONLY = await host.evaluate(() => AF.heist.dbg.ST.map((s) => !!s.hostOnly));
    let failed = false, retried = false;
    for (let n = 0; n < N + 6; n++) {
      let h, g;
      await until(async () => { h = await st(host); g = await st(guest); return h.i === g.i && h.on === g.on; }, 5000, 'agree');
      if (!h.on) break;
      out.steps.push(h.tr + ' ' + h.id + (h.line ? ' — ' + h.line.replace(/[{}]/g, '').slice(0, 60) : ''));
      const i = h.i;
      if (i === KEYS && !failed) {
        failed = true;
        await guest.evaluate(() => AF.heist.dbg.fail ? AF.heist.dbg.fail('harness') : AF.net.send('heist', { op: 'fail', why: 'harness' }, 0));
        await until(async () => (await st(host)).failing && (await st(guest)).failing, 6000, 'fail both');
        await until(async () => { const a = await st(host), c = await st(guest); return !a.failing && !c.failing && a.i === c.i && a.cp === c.cp; }, 15000, 'restore both');
        await skipCuts();
        out.failRestore = (await st(host)).id;
        await guest.evaluate(() => AF.heist.retry());
        await host.waitForTimeout(400);
        const a = await st(host), c = await st(guest); retried = a.i === c.i && a.cp === c.cp && a.on && c.on;
        continue;
      }
      if (i === SPLIT) { await host.evaluate((n) => AF.heist.dbg.setRoles(Array.from({ length: n }, (_, slot) => slot === 1 ? 'hack' : 'infil')), COUNT); await until(async () => (await guest.evaluate(() => AF.heist.myRole())) === 'hack', 5000, 'roles'); await until(async () => { const a = await st(host), c = await st(guest); return a.i === c.i && a.i !== i; }, 15000, 'roles advance'); continue; }
      if (i === KEYS) {
        // the hacker walks the zoo track and hacks; the inside man reaches the vault; the time lock is overridden; one key each
        for (let k = 0; k < 4; k++) await guest.evaluate((t) => AF.net.send('heist', { op: 'tdone', t: 'h', k: t }, 0), k);
        await guest.evaluate(() => AF.heist.dbg.setGot('hacked'));
        await host.evaluate(() => { const H = AF.heist; for (let k = 0; k < 3; k++) H.dbg.trDone('n', H.tr.n); });
        await until(async () => (await guest.evaluate(() => AF.heist.tr.n)) === 3, 5000, 'tracks');
        await guest.evaluate(() => AF.heist.dbg.lockOn());
        await until(async () => (await host.evaluate(() => AF.heist.lockT)) > 0, 5000, 'lock');
        await host.evaluate(() => AF.heist.dbg.grip(0));
        await host.waitForTimeout(200);
        const one = await host.evaluate(() => !AF.heist.got.gate);
        await guest.evaluate(() => AF.heist.dbg.grip(1));
        await until(async () => await host.evaluate(() => !!AF.heist.got.gate), 5000, 'gate');
        out.keys = one;
        await host.evaluate(() => { const H = AF.heist; for (let k = 0; k < 4; k++) H.dbg.bag(k); for (let k = 0; k < 4; k++) H.dbg.trDone('n', H.tr.n); });
      } else if (h.id === 'wheels') await host.evaluate(() => AF.heist.dbg.wheels());
      else if (h.id === 'escape') await host.evaluate(() => { AF.heist.dbg.openExit(); AF.heist.dbg.skip(); });
      else if (n % 2 && !HOSTONLY[i]) await guest.evaluate((k) => AF.net.send('heist', { op: 'done', i: k }, 0), i);
      else await host.evaluate(() => AF.heist.dbg.skip());
      await skipCuts();
      await until(async () => { const a = await st(host), c = await st(guest); return (!a.on && !c.on) || (a.i === c.i && a.i !== i); }, 15000, 'advance from ' + i);
      await skipCuts();
    }
    const states = await Promise.all(crew.map(st));
    out.ended = states.every((s) => !s.on);
    out.paid = states.map((s, i) => s.money - m0[i]);
    out.retried = retried;
    out.ok = out.ended && out.paid.every((v) => v > 0) && out.keys && retried && !!out.failRestore;
  } catch (e) { out.error = e.message; out.host = await st(host).catch(() => null); out.guest = await st(guest).catch(() => null); }
  out.errors = errs;
  out.ok = !!out.ok && errs.length === 0;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
  process.exit(out.ok ? 0 : 1);
})();
