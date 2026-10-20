// Run an MCP-style Playwright harness (`async (page) => {...}` file) from plain node, in its own browser:
//   node tools/pw-run.js tools/hitch-probe.js [--g:__psScenario=play] [--g:__psExtraFile=tools/play-scenario.js] [--headed]
// --g:name=value sets globalThis[name] (numbers / true / false parsed; __psExtraFile=path loads that file's source into __psExtraSrc).
// Playwright must be resolvable (NODE_PATH, e.g. %LOCALAPPDATA%\npm-cache\_npx\<hash>\node_modules). CHROME=path optional.
const fs = require('fs'), path = require('path');
const { chromium } = require('playwright');
(async () => {
  const args = process.argv.slice(2), file = args.find((a) => !a.startsWith('--'));
  if (!file) { console.error('usage: node tools/pw-run.js harness.js [--g:name=value] [--headed]'); process.exit(2); }
  for (const a of args) {
    const m = /^--g:([\w$]+)=(.*)$/.exec(a); if (!m) continue;
    let v = m[2];
    if (m[1] === '__psExtraFile') { globalThis.__psExtraSrc = fs.readFileSync(path.resolve(v), 'utf8'); continue; }
    v = v === 'true' ? true : v === 'false' ? false : v !== '' && !isNaN(+v) ? +v : v;
    globalThis[m[1]] = v;
  }
  const b = await chromium.launch({ headless: !args.includes('--headed'), executablePath: process.env.CHROME || undefined,
    args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();
  const src = fs.readFileSync(path.resolve(file), 'utf8').replace(/^\s*\/\/.*$/gm, '').trim();
  const fn = eval('(' + src.replace(/;\s*$/, '') + ')');
  let out;
  try { out = await fn(page); } catch (e) { out = { error: String(e && e.stack || e) }; }
  console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1));
  await b.close();
})();
