// Port Solace co-op signaling (Cloudflare Worker + one Durable Object per lobby code).
// Same protocol as the dev server in tools/serve.mjs:
//   WS /lobby/CODE?role=host|guest   server -> {t:'hello',id} {t:'peer',id} {t:'leave',id} {t:'signal',from,data} {t:'host-left'} {t:'error',why}
//                                      client -> {t:'signal',to,data}  ('ping' -> 'pong' without waking the object)
//   GET /ice                          {iceServers} (short-lived Cloudflare TURN credentials when TURN_KEY_ID / TURN_KEY_API_TOKEN are set)
// Only offers / answers / ICE candidates pass through here; the game itself runs peer to peer over WebRTC DataChannels.
import { DurableObject } from 'cloudflare:workers';

const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
const MAX_JOINING = 6, MAX_MSG = 16384, RATE = 120;   // guests still signaling; messages per socket per 10 s

const allowed = (req, env) => {
  const o = req.headers.get('Origin');
  if (!o) return false;
  try { return new RegExp(env.ALLOWED_ORIGINS).test(o); } catch (e) { return false; }
};
const cors = (res, req, env) => {
  const o = req.headers.get('Origin');
  if (o && allowed(req, env)) { res.headers.set('Access-Control-Allow-Origin', o); res.headers.set('Vary', 'Origin'); }
  return res;
};

async function ice(env) {
  if (!env.TURN_KEY_ID || !env.TURN_KEY_API_TOKEN) return { iceServers: STUN };
  try {
    const r = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`, {
      method: 'POST', headers: { Authorization: 'Bearer ' + env.TURN_KEY_API_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ ttl: 14400 }),
    });
    if (!r.ok) return { iceServers: STUN };
    const j = await r.json();
    // port 53 is blocked by browsers and only delays gathering
    for (const s of j.iceServers || []) if (Array.isArray(s.urls)) s.urls = s.urls.filter((u) => !/:53\b/.test(u));
    return { iceServers: j.iceServers || STUN };
  } catch (e) { return { iceServers: STUN }; }
}

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return cors(new Response(null, { status: 204, headers: { 'Access-Control-Allow-Methods': 'GET', 'Access-Control-Max-Age': '86400' } }), req, env);
    if (url.pathname === '/health') return new Response('ok');
    if (url.pathname === '/ice') {
      if (!allowed(req, env)) return new Response('forbidden', { status: 403 });
      return cors(new Response(JSON.stringify(await ice(env)), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }), req, env);
    }
    const m = url.pathname.match(/^\/lobby\/([A-Z2-9]{6})$/);
    if (!m) return new Response('not found', { status: 404 });
    if ((req.headers.get('Upgrade') || '').toLowerCase() !== 'websocket') return new Response('expected a websocket', { status: 426 });
    if (!allowed(req, env)) return new Response('forbidden', { status: 403 });
    return env.LOBBY.get(env.LOBBY.idFromName(m[1])).fetch(req);
  },
};

export class Lobby extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
    this.rate = new Map();
  }
  // sockets survive hibernation; their {id} attachment is the only state
  sockets() { const out = new Map(); for (const ws of this.ctx.getWebSockets()) { const a = ws.deserializeAttachment(); if (a && a.id >= 0) out.set(a.id, ws); } return out; }
  say(ws, m) { try { ws.send(JSON.stringify(m)); } catch (e) { /* closed */ } }
  async fetch(req) {
    const role = new URL(req.url).searchParams.get('role') === 'host' ? 'host' : 'guest';
    const pair = new WebSocketPair(), [client, server] = Object.values(pair), live = this.sockets();
    this.ctx.acceptWebSocket(server);
    const fail = (why) => { this.say(server, { t: 'error', why }); server.close(4000, why); return new Response(null, { status: 101, webSocket: client }); };
    let id;
    if (role === 'host') { if (live.has(0)) return fail('taken'); id = 0; }
    else {
      if (!live.has(0)) return fail('nolobby');
      if (live.size > MAX_JOINING) return fail('full');
      // a random signaling id: guests close this socket once connected, so ids must never repeat within a session
      // (the host gives out player slots itself)
      do id = 1 + (crypto.getRandomValues(new Uint32Array(1))[0] & 0x3fffffff); while (live.has(id));
    }
    server.serializeAttachment({ id });
    this.say(server, { t: 'hello', id });
    if (id) this.say(live.get(0), { t: 'peer', id });
    return new Response(null, { status: 101, webSocket: client });
  }
  webSocketMessage(ws, msg) {
    if (typeof msg !== 'string' || msg.length > MAX_MSG) return;
    const me = ws.deserializeAttachment(); if (!me || me.id < 0) return;
    const now = Date.now(), r = this.rate.get(ws) || { t: now, n: 0 };
    if (now - r.t > 10000) { r.t = now; r.n = 0; }
    if (++r.n > RATE) return;
    this.rate.set(ws, r);
    let m; try { m = JSON.parse(msg); } catch (e) { return; }
    if (!m || m.t !== 'signal' || !Number.isInteger(m.to)) return;
    // guests only ever talk to the host; the host to any guest
    if (me.id !== 0 && m.to !== 0) return;
    const to = this.sockets().get(m.to);
    if (to && to !== ws) this.say(to, { t: 'signal', from: me.id, data: m.data });
  }
  webSocketClose(ws) { this.gone(ws); }
  webSocketError(ws) { this.gone(ws); }
  gone(ws) {
    const me = ws.deserializeAttachment(); if (!me || me.id < 0) return;
    ws.serializeAttachment({ id: -1 }); this.rate.delete(ws);
    const live = this.sockets();
    if (me.id === 0) for (const g of live.values()) { this.say(g, { t: 'host-left' }); try { g.close(1000, 'host left'); } catch (e) { /* closed */ } }
    else if (live.has(0)) this.say(live.get(0), { t: 'leave', id: me.id });
  }
}
