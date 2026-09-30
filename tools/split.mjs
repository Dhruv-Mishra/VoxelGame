// One-time: split the saved Port Solace.html into shell + prologue + per-part source files.
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const src = fs.readFileSync(path.join(root, '..', 'Port Solace.html'), 'utf8').split(/\r?\n/);
const start = src.findIndex((l) => l.startsWith('<script id="app-src"'));
const end = src.indexOf('</script>', start);
const body = src.slice(start + 1, end);
const out = path.join(root, 'src');
fs.mkdirSync(out, { recursive: true });
let name = '00-prologue.js', buf = [];
const flush = () => { if (buf.length) fs.writeFileSync(path.join(out, name), buf.join('\n') + '\n'); buf = []; };
for (const l of body) {
  const m = /^\/\/ =+ (\d\d-[\w-]+\.js)$/.exec(l);
  if (m) { flush(); name = m[1]; }
  buf.push(l);
}
flush();
fs.writeFileSync(path.join(root, 'tools', 'orig-head.html'), src.slice(0, start).join('\n'));
console.log('parts:', fs.readdirSync(out).join(' '));
