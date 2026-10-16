// Co-op heist harness: two real clients (host + guest) over local WebRTC (tools/serve.mjs signaling), cutscenes on.
// node tools/coop-heist.js [port]   (playwright resolvable, e.g. NODE_PATH; CHROME=path/to/chrome.exe optional)
// The guest asks Vera, both clients walk every step in lockstep (host and guest alternate completing them), both hold a vault key,
// the guest fails a step (both restore to the same checkpoint), the guest retries, then the job pays out on both sides.
const { chromium } = require('playwright');
const PORT = process.argv[2] || 8765, URL = `http://127.0.0.1:${PORT}/output.html?nostream&nofade`;
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
  // two different friends (the host refuses a guest playing the same one)
  await host.evaluate(() => AF.friends.play(AF.friends.cast[0].id));
  await guest.evaluate(() => AF.friends.play(AF.friends.cast[1].id));
  await Promise.all([host, guest].map((p) => p.evaluate(() => AF.setMode('walk', { x: -100, y: 4, z: -60, yaw: 0, snap: true }))));
  const st = (p) => p.evaluate(() => ({ on: AF.heist.on, i: AF.heist.i, cp: AF.heist.cp, failing: !!AF.heist.failing, money: AF.money.v, cut: AF.mission.cut.on, peers: AF.net.peers.size, line: AF.hud.job && AF.hud.job.line, id: AF.heist.dbg.ST[AF.heist.i] && AF.heist.dbg.ST[AF.heist.i].id }));
  const until = async (fn, ms = 20000, what = '') => { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) throw new Error('timeout: ' + what); await host.waitForTimeout(150); } };
  const skipCuts = () => Promise.all([host, guest].map((p) => p.evaluate(() => { const C = AF.mission.cut; if (C.on) { C.skipT = 0; C.skip(); } })));
  const out = { steps: [] };
  try {
    const code = await host.evaluate(async () => { await AF.net.host(); return AF.net.code; });
    await guest.evaluate((c) => AF.net.join(c), code);
    await until(async () => (await st(host)).peers === 1 && (await st(guest)).peers === 1, 30000, 'link');
    out.link = code;
    const m0 = [(await st(host)).money, (await st(guest)).money];
    // the guest asks Vera; the host starts the job for both
    await guest.evaluate(() => AF.heist.start());
    await until(async () => { const h = await st(host), g = await st(guest); return h.on && g.on && h.i === 0 && g.i === 0; }, 10000, 'start');
    const N = await host.evaluate(() => AF.heist.dbg.ST.length), KEYS = await host.evaluate(() => AF.heist.dbg.IDX.keys);
    let failed = false, retried = false;
    for (let n = 0; n < N + 6; n++) {
      let h, g;
      await until(async () => { h = await st(host); g = await st(guest); return h.i === g.i && h.on === g.on; }, 5000, 'agree');
      if (!h.on) break;
      out.steps.push(h.id + (h.line ? ' â€” ' + h.line.replace(/[{}]/g, '').slice(0, 60) : ''));
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
      if (i === KEYS) {
        await host.evaluate(() => AF.heist.dbg.grip(0));
        await host.waitForTimeout(200);
        const one = await host.evaluate(() => AF.heist.i);
        await guest.evaluate(() => AF.heist.dbg.grip(1));
        out.keys = one === KEYS;
      } else if (n % 2) await guest.evaluate((k) => AF.net.send('heist', { op: 'done', i: k }, 0), i);
      else await host.evaluate(() => AF.heist.dbg.skip());
      await skipCuts();
      await until(async () => { const a = await st(host), c = await st(guest); return (!a.on && !c.on) || (a.i === c.i && a.i !== i); }, 15000, 'advance from ' + i);
      await skipCuts();
    }
    const h = await st(host), g = await st(guest);
    out.ended = !h.on && !g.on;
    out.paid = [h.money - m0[0], g.money - m0[1]];
    out.retried = retried;
    out.ok = out.ended && out.paid[0] > 0 && out.paid[1] > 0 && out.keys && retried && !!out.failRestore;
  } catch (e) { out.error = e.message; out.host = await st(host).catch(() => null); out.guest = await st(guest).catch(() => null); }
  out.errors = errs;
  console.log(JSON.stringify(out, null, 1));
  await b.close();
  process.exit(out.ok ? 0 : 1);
})();
