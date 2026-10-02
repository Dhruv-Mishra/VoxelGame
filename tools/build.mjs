// Assemble shell.html + src/*.js into output.html (one self-contained page). `node tools/build.mjs [--check] [--out=name.html]`
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const dir = path.join(root, 'src');
const parts = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).sort();
if (process.argv.includes('--check')) {
  let bad = 0;
  for (const f of parts) {
    if (f.startsWith('00-')) continue;          // prologue uses top-level await (module only)
    try { execFileSync(process.execPath, ['--check', path.join(dir, f)], { stdio: 'pipe' }); }
    catch (e) { bad++; console.error('SYNTAX ' + f + '\n' + String(e.stderr || e.message).split('\n').slice(0, 6).join('\n')); }
  }
  if (bad) process.exit(1);
}
const toc = '// Port Solace — generated from src/ by tools/build.mjs; edit the parts, not this file.\n// Parts: ' + parts.map((f) => f.replace(/\.js$/, '')).join(', ') + '\n';
const code = toc + parts.map((f) => fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n').trimEnd().replace(/<\/script/gi, '<\\/script')).join('\n\n');
const html = fs.readFileSync(path.join(root, 'shell.html'), 'utf8').replace(/\r\n/g, '\n').replace('/*@@PARTS@@*/', () => code);
const outArg = process.argv.find((a) => a.startsWith('--out='));
const out = path.join(root, outArg ? path.basename(outArg.slice(6)) : 'output.html');
fs.writeFileSync(out, html);
console.log('built', out, (html.length / 1024).toFixed(0) + ' KB from', parts.length, 'parts');
