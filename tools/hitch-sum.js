// node tools/hitch-sum.js file.txt [--ev] -> compact summary of a tools/hitch-probe.js result (pw-run stdout; UTF-8 or UTF-16)
const fs = require('fs');
const buf = fs.readFileSync(process.argv[2]); const raw = (buf[0] === 0xff && buf[1] === 0xfe ? buf.toString('utf16le') : buf.toString('utf8')).replace(/^\uFEFF/, ''); const j = JSON.parse(raw.slice(raw.indexOf('{')));
const r = j.r; if (!r) { console.log(raw.slice(0, 2000)); process.exit(); }
console.log(`boot ${j.bootMs} frames ${r.frames} p50 ${r.p50} p99 ${r.p99} p999 ${r.p999} worst ${r.worst.join(',')} long ${r.long} progs ${r.progs} geos ${r.geos} tex ${r.tex}`);
console.log('links', r.links.length, r.links.map((l) => l.slice(0, 160)).join('\n  '));
console.log('worst calls', r.worstCalls.slice(0, 10).join(' | '));
const vis = r.hitches.filter((h) => !h.veil); console.log('visible hitches (of top 30):', vis.length, 'worst', vis.slice(0, 8).map((h) => h.gap).join(','));
for (const h of r.hitches) {
  console.log(`== ${h.veil ? '[veiled] ' : ''}${h.step} @${h.at} gap ${h.gap} un ${h.un} progs ${h.progs} :: ${h.top.slice(0, 6).join(', ')}`);
  if (process.argv.includes('--ev') && h.ev) for (const e of h.ev.filter((e) => !/RunTask|BeginMainFrame|Animate|serviceScripted|ExecuteFrameCallbacks|FireAnimationFrame|AsyncTask|callFunction|^\d+ FunctionCall/.test(e)).slice(0, 6)) console.log('     ' + e);
}
console.log('log', (r.log || []).join(' | '));
console.log('mem0', JSON.stringify(r.mem0), 'mem1', JSON.stringify(r.mem1), 'strMax', JSON.stringify(r.strMax), 'fd', JSON.stringify(r.fd));
console.log('errs', j.errs);
