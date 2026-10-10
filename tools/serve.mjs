// Tiny static server for local testing: node tools/serve.mjs [port]
// Also the co-op dev signaling (same protocol as signal/ on Cloudflare): ws://host/signal/lobby/CODE?role=host|guest, GET /signal/ice
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const port = +process.argv[2] || 8765;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.webp': 'image/webp' };
const server = http.createServer((req, res) => {
  if (new URL(req.url, 'http://x').pathname === '/signal/ice') { res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end('{"iceServers":[]}'); return; }
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root)) { res.writeHead(403); res.end(); return; }
  fs.readFile(p, (err, data) => {
    if (err) { res.writeHead(404); res.end('not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});

// ---------------------------------------------------------------- dev signaling: a minimal WebSocket server (text frames, ping, close)
const lobbies = new Map();
const frame = (op, payload) => {
  const n = payload.length, head = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.from([0x80 | op, 126, n >> 8, n & 255]) : Buffer.concat([Buffer.from([0x80 | op, 127]), Buffer.alloc(8)]);
  if (n >= 65536) head.writeBigUInt64BE(BigInt(n), 2);
  return Buffer.concat([head, payload]);
};
const wrap = (sock) => {
  const ws = { id: -1, open: true, onmessage: null, onclose: null,
    send(text) { if (ws.open) sock.write(frame(1, Buffer.from(text))); },
    close() { if (!ws.open) return; ws.open = false; try { sock.write(frame(8, Buffer.alloc(0))); } catch (e) { /* gone */ } sock.end(); } };
  let buf = Buffer.alloc(0);
  sock.on('data', (d) => {
    buf = Buffer.concat([buf, d]);
    for (;;) {
      if (buf.length < 2) return;
      const op = buf[0] & 15, masked = buf[1] & 128; let len = buf[1] & 127, o = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); o = 4; }
      else if (len === 127) { if (buf.length < 10) return; len = Number(buf.readBigUInt64BE(2)); o = 10; }
      if (len > 65536) { sock.destroy(); return; }
      const mo = o; if (masked) o += 4; if (buf.length < o + len) return;
      const p = Buffer.from(buf.subarray(o, o + len)); if (masked) for (let i = 0; i < p.length; i++) p[i] ^= buf[mo + (i & 3)];
      buf = buf.subarray(o + len);
      if (op === 8) { ws.close(); return; }
      if (op === 9) { sock.write(frame(10, p)); continue; }
      if (op === 1 && ws.onmessage) ws.onmessage(p.toString());
    }
  });
  const gone = () => { if (ws.gone) return; ws.gone = true; ws.open = false; if (ws.onclose) ws.onclose(); };
  sock.on('close', gone); sock.on('error', gone);
  return ws;
};
const say = (ws, m) => ws.send(JSON.stringify(m));
const join = (code, role, ws) => {
  let L = lobbies.get(code);
  const fail = (why) => { say(ws, { t: 'error', why }); ws.close(); };
  if (role === 'host') {
    if (L && L.host) return fail('taken');
    if (!L) lobbies.set(code, L = { host: null, guests: new Map() });
    L.host = ws; ws.id = 0;
  } else {
    if (!L || !L.host) return fail('nolobby');
    if (L.guests.size >= 6) return fail('full');
    let id; do id = 1 + crypto.randomInt(0x3fffffff); while (L.guests.has(id));
    L.guests.set(id, ws); ws.id = id; say(L.host, { t: 'peer', id });
  }
  say(ws, { t: 'hello', id: ws.id });
  let rt = Date.now(), rn = 0;
  ws.onmessage = (text) => {
    if (text === 'ping') { ws.send('pong'); return; }
    const now = Date.now(); if (now - rt > 10000) { rt = now; rn = 0; }
    if (++rn > 120 || text.length > 16384) return;
    let m; try { m = JSON.parse(text); } catch (e) { return; }
    if (!m || m.t !== 'signal' || !Number.isInteger(m.to)) return;
    // guests only ever talk to the host; the host to any guest
    if (ws.id !== 0 && m.to !== 0) return;
    const to = m.to === 0 ? L.host : L.guests.get(m.to);
    if (to && to !== ws) say(to, { t: 'signal', from: ws.id, data: m.data });
  };
  ws.onclose = () => {
    if (ws.id === 0) { for (const g of L.guests.values()) { say(g, { t: 'host-left' }); g.close(); } lobbies.delete(code); }
    else if (L.guests.get(ws.id) === ws) { L.guests.delete(ws.id); if (L.host) say(L.host, { t: 'leave', id: ws.id }); }
  };
};
server.on('upgrade', (req, sock) => {
  const u = new URL(req.url, 'http://x'), m = u.pathname.match(/^\/signal\/lobby\/([A-Z2-9]{6})$/), key = req.headers['sec-websocket-key'];
  // pages served from here (or a CLI client without an Origin) only: other sites can't reach the dev lobby
  const origin = req.headers.origin, host = String(req.headers.host || '');
  const okOrigin = /^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host) && (!origin || origin === 'http://' + host);
  if (!m || !key || !okOrigin || String(req.headers.upgrade).toLowerCase() !== 'websocket') { sock.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  sock.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  join(m[1], u.searchParams.get('role') === 'host' ? 'host' : 'guest', wrap(sock));
});
server.listen(port, '127.0.0.1', () => console.log('serving', root, 'on http://127.0.0.1:' + port));
