// ================================================================ 79-net.js
try {
// ===== 79-net: co-op transport  (OWNER: net) =====
// A lobby code goes through the signaling Worker (signal/ on Cloudflare; tools/serve.mjs on localhost) only while players join
// (the Worker hands each joiner a random signaling id; the host gives them a player slot once they say hello).
// The game itself runs peer to peer over WebRTC DataChannels in a star around the host: 'rel' (reliable, ordered JSON events) and
// 'fast' (unordered, no retransmits: binary snapshots where the newest wins). The host relays guest traffic and stamps the true
// origin on everything it forwards, so a guest can never speak for someone else.
// AF.net: host() / join(code) / leave(why); send(type, msg, to?) reliable; on(type, fn(msg, from)); fast(u8, len, seq) / onFast(fn(u8, from))
//         me (host 0, guests 1..3), role 'off' | 'host' | 'guest', peers: slot -> { slot, name, friend, look, rtt, x, z }, live()
// Rate tiers: snapshots between players more than 250 m apart go at 1/2 rate, beyond 500 m at 1/4 (only the map dot needs them).
{
  const N = AF.net = { role: 'off', me: 0, code: '', status: '', peers: new Map(), build: '%%BUILD_HASH%%', rate: AF.MOBILE ? 15 : 20, ice: null,
    stats: { up: 0, down: 0, upK: 0, downK: 0 }, hello: null, welcomeExtra: null, mine: { x: 0, z: 0 } };
  const ALPH = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
  // the deployed signaling Worker; ?signal=wss://... or localStorage 'portSolace.signal' override it, localhost uses tools/serve.mjs
  const SIGNAL = 'wss://port-solace-signal.whoisdhruv.workers.dev';
  const STUN = [{ urls: ['stun:stun.cloudflare.com:3478', 'stun:stun.l.google.com:19302'] }];
  N.signalBase = () => {
    const q = AF.Q.get('signal'); if (q && /^wss?:\/\//.test(q)) return q.replace(/\/$/, '');
    try { const s = localStorage.getItem('portSolace.signal'); if (s && /^wss?:\/\//.test(s)) return s.replace(/\/$/, ''); } catch (e) { /* storage blocked */ }
    if (/^(127\.0\.0\.1|localhost)$/.test(location.hostname)) return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/signal';
    return SIGNAL;
  };
  N.newCode = () => { const r = new Uint32Array(6); crypto.getRandomValues(r); let s = ''; for (const v of r) s += ALPH[v % ALPH.length]; return s; };
  N.cleanCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
  N.validCode = (s) => s.length === 6 && [...s].every((c) => ALPH.includes(c));
  N.live = () => { for (const l of links.values()) if (l.ok) return true; return false; };
  N.inviteUrl = () => location.origin + location.pathname + '?join=' + N.code;

  // ---------------------------------------------------------------- events (reliable message types must be registered to be accepted)
  const L = new Map();
  N.on = (t, fn) => { if (!L.has(t)) L.set(t, []); L.get(t).push(fn); };
  const fire = (t, m, from) => { const a = L.get(t); if (a) for (const f of a) { try { f(m, from); } catch (e) { console.error('[net] ' + t, e); } } };
  const status = (s) => { N.status = s; fire('status', s); };
  let fastFn = null;
  N.onFast = (fn) => { fastFn = fn; };

  // ---------------------------------------------------------------- binary packets (little endian, clamped writes, bounds-checked reads)
  class Wr {
    constructor(n) { this.u8 = new Uint8Array(n); this.d = new DataView(this.u8.buffer); this.o = 0; }
    reset() { this.o = 0; return this; }
    room(k) { return this.o + k <= this.u8.length; }
    u8v(v) { this.d.setUint8(this.o, v < 0 ? 0 : v > 255 ? 255 : v | 0); this.o += 1; }
    i8(v) { v = Math.round(v); this.d.setInt8(this.o, v < -128 ? -128 : v > 127 ? 127 : v || 0); this.o += 1; }
    u16(v) { this.d.setUint16(this.o, v < 0 ? 0 : v > 65535 ? 65535 : v | 0, true); this.o += 2; }
    i16(v) { v = Math.round(v); this.d.setInt16(this.o, v < -32768 ? -32768 : v > 32767 ? 32767 : v || 0, true); this.o += 2; }
    u32(v) { this.d.setUint32(this.o, v >>> 0, true); this.o += 4; }
    f32(v) { this.d.setFloat32(this.o, Number.isFinite(v) ? v : 0, true); this.o += 4; }
  }
  class Rd {
    set(u8) { this.d = new DataView(u8.buffer, u8.byteOffset, u8.byteLength); this.o = 0; this.n = u8.byteLength; return this; }
    need(k) { if (this.o + k > this.n) throw new RangeError('short packet'); }
    u8v() { this.need(1); return this.d.getUint8(this.o++); }
    i8() { this.need(1); return this.d.getInt8(this.o++); }
    u16() { this.need(2); const v = this.d.getUint16(this.o, true); this.o += 2; return v; }
    i16() { this.need(2); const v = this.d.getInt16(this.o, true); this.o += 2; return v; }
    u32() { this.need(4); const v = this.d.getUint32(this.o, true); this.o += 4; return v; }
    f32() { this.need(4); const v = this.d.getFloat32(this.o, true); this.o += 4; if (!Number.isFinite(v)) throw new RangeError('bad float'); return v; }
  }
  N.Wr = Wr; N.Rd = Rd;

  // ---------------------------------------------------------------- avatar looks from the network: known keys and types only
  const STYLES = { hairStyle: ['short', 'fade', 'spiky', 'messy', 'long', 'wavy', 'bun', 'pony'], hat: ['cap', 'straw'], extra: ['headphones', 'chain', 'bow', 'guitar'] };
  const hex = (v) => Number.isInteger(v) && v >= 0 && v <= 0xffffff;
  N.cleanLook = (L, fallback) => {
    if (!L || typeof L !== 'object') return fallback;
    try { if (JSON.stringify(L).length > 1500) return fallback; } catch (e) { return fallback; }
    const o = {};
    for (const k of ['skin', 'hair', 'shoe', 'hatCol', 'lips']) if (hex(L[k])) o[k] = L[k];
    for (const k of ['glasses', 'beard']) o[k] = hex(L[k]) ? L[k] : null;
    for (const k in STYLES) if (STYLES[k].includes(L[k])) o[k] = L[k];
    if (L.female === true) o.female = true;
    if (L.bangs === true) o.bangs = true;
    if (typeof L.height === 'number' && L.height >= 0.85 && L.height <= 1.15) o.height = L.height;
    const piece = (p, styles) => { if (!p || typeof p !== 'object') return null; const q = {}; for (const k of ['col', 'col2', 'print']) if (hex(p[k])) q[k] = p[k]; if (styles.includes(p.style)) q.style = p.style; if (p.sleeves === true) q.sleeves = true; return hex(q.col) ? q : null; };
    o.top = piece(L.top, ['tee', 'hoodie', 'cardigan', 'shirt', 'dress', 'vest']) || (fallback && fallback.top);
    o.bottom = piece(L.bottom, ['jeans', 'joggers', 'shorts', 'skirt']) || (fallback && fallback.bottom);
    if (!hex(o.skin) || !hex(o.hair) || !o.top || !o.bottom) return fallback;
    return o;
  };

  // ---------------------------------------------------------------- signaling (WebSocket, only while someone is joining)
  // gen: bumped by every host / join / leave so a stale await or timer can never touch a newer session
  let ws = null, wsPing = 0, wsFail = null, joinWait = null, gen = 0;
  const sig = (m) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(m)); };
  const closeSignal = () => {
    const f = wsFail; wsFail = null;
    if (ws) { ws.onclose = ws.onmessage = null; try { ws.close(); } catch (e) { /* closed */ } ws = null; }
    clearInterval(wsPing); if (f) f(new Error('closed'));
  };
  const openSignal = (code, role) => new Promise((res, rej) => {
    closeSignal();
    let done = false, s = null;
    const end = (fn, v) => { if (done) return; done = true; clearTimeout(to); if (wsFail === fail) wsFail = null; fn(v); };
    const fail = (e) => end(rej, e);
    const to = setTimeout(() => { fail(new Error('timeout')); if (ws === s) closeSignal(); }, 9000);
    wsFail = fail;
    try { s = ws = new WebSocket(N.signalBase() + '/lobby/' + code + '?role=' + role); } catch (e) { ws = null; fail(e); return; }
    s.onmessage = (e) => {
      if (ws !== s || typeof e.data !== 'string' || e.data === 'pong' || e.data.length > 20000) return;
      let m; try { m = JSON.parse(e.data); } catch (er) { return; }
      if (!m) return;
      if (m.t === 'hello' && Number.isInteger(m.id)) { end(res, m.id); return; }
      if (m.t === 'error') { fail(new Error(String(m.why || 'error'))); return; }
      onSignal(m);
    };
    s.onclose = () => {
      fail(new Error('closed')); if (ws !== s) return;
      ws = null; clearInterval(wsPing); if (N.role === 'host') status('Lobby offline \u2014 players already in stay connected');
    };
    s.onerror = () => { /* onclose follows */ };
    clearInterval(wsPing); wsPing = setInterval(() => { if (ws && ws.readyState === 1) ws.send('ping'); }, 25000);
  });
  const okIceServer = (s) => s && (typeof s.urls === 'string' || Array.isArray(s.urls)) && [].concat(s.urls).every((u) => typeof u === 'string' && /^(stun|turns?):/.test(u));
  const fetchIce = async () => {
    if (N.ice) return N.ice;
    try {
      const c = new AbortController(), t = setTimeout(() => c.abort(), 2500);
      const r = await fetch(N.signalBase().replace(/^ws/, 'http') + '/ice', { signal: c.signal }); clearTimeout(t);
      const j = await r.json(); if (Array.isArray(j.iceServers) && j.iceServers.every(okIceServer)) N.ice = j.iceServers;
    } catch (e) { /* public STUN below */ }
    return N.ice || (N.ice = STUN);
  };
  const okSig = (d, want) => d && ((d.sdp && d.sdp.type === want && typeof d.sdp.sdp === 'string' && d.sdp.sdp.length < 12000) || (d.ice && typeof d.ice.candidate === 'string' && d.ice.candidate.length < 800));
  const onSignal = (m) => {
    if (N.role === 'host') {
      if (m.t === 'peer' && Number.isInteger(m.id) && m.id >= 1 && !sids.has(m.id) && sids.size < 8) sids.set(m.id, new Link(m.id, -1, true));
      else if (m.t === 'leave') { const l = sids.get(m.id); if (l && !l.ok) drop(l, 'left'); }
      else if (m.t === 'signal') { const l = sids.get(m.from); if (l && okSig(m.data, 'answer')) l.signal(m.data); }
    } else if (N.role === 'guest') {
      if (m.t === 'signal' && m.from === 0 && okSig(m.data, 'offer')) { let l = links.get(0); if (!l) links.set(0, l = new Link(0, 0, false)); l.signal(m.data); }
      else if (m.t === 'host-left' && joinWait) failJoin('host left');
    }
  };

  // ---------------------------------------------------------------- links: one RTCPeerConnection per guest (host) / to the host (guest)
  // links: player slot -> link that said hello (the guest's link to the host is slot 0); sids (host): signaling id -> every guest link
  const links = new Map(), sids = new Map();
  class Link {
    constructor(sid, slot, initiator) {
      this.sid = sid; this.slot = slot; this.ok = false; this.open = false; this.rel = null; this.fast = null; this.pend = []; this.last = performance.now(); this.born = this.last; this.rtt = 0;
      this.pc = new RTCPeerConnection({ iceServers: N.ice || STUN });
      this.pc.onicecandidate = (e) => { if (e.candidate) sig({ t: 'signal', to: sid, data: { ice: e.candidate.toJSON() } }); };
      this.pc.onconnectionstatechange = () => { const s = this.pc.connectionState; if (s === 'failed' || s === 'closed') drop(this, 'connection ' + s); };
      if (initiator) {
        this.bind(this.pc.createDataChannel('rel', { ordered: true }));
        this.bind(this.pc.createDataChannel('fast', { ordered: false, maxRetransmits: 0 }));
        this.pc.createOffer().then((o) => this.pc.setLocalDescription(o)).then(() => sig({ t: 'signal', to: sid, data: { sdp: this.pc.localDescription.toJSON() } })).catch((e) => drop(this, 'offer ' + e));
      } else this.pc.ondatachannel = (e) => this.bind(e.channel);
    }
    bind(ch) {
      if (ch.label === 'rel' && !this.rel) this.rel = ch; else if (ch.label === 'fast' && !this.fast) this.fast = ch; else { ch.close(); return; }
      ch.binaryType = 'arraybuffer';
      ch.onopen = () => this.check();
      ch.onclose = () => drop(this, 'closed');
      ch.onmessage = (e) => { this.last = performance.now(); N.stats.down += e.data.byteLength || e.data.length || 0; if (ch === this.rel) onRel(this, e.data); else onFastData(this, e.data); };
    }
    check() { if (!this.open && this.rel && this.fast && this.rel.readyState === 'open' && this.fast.readyState === 'open') { this.open = true; onOpen(this); } }
    async signal(d) {
      try {
        if (d.sdp) {
          await this.pc.setRemoteDescription(d.sdp);
          if (d.sdp.type === 'offer') { await this.pc.setLocalDescription(await this.pc.createAnswer()); sig({ t: 'signal', to: this.sid, data: { sdp: this.pc.localDescription.toJSON() } }); }
          for (const c of this.pend) await this.pc.addIceCandidate(c).catch(() => {});
          this.pend.length = 0;
        } else if (d.ice) { if (this.pc.remoteDescription) await this.pc.addIceCandidate(d.ice).catch(() => {}); else if (this.pend.length < 64) this.pend.push(d.ice); }
      } catch (e) { drop(this, 'signal ' + e); }
    }
    sendRel(text) { if (this.rel && this.rel.readyState === 'open') { this.rel.send(text); N.stats.up += text.length; } }
    // newest wins: a congested link skips snapshots instead of queueing them (latency over completeness)
    sendFast(u8) { if (this.fast && this.fast.readyState === 'open' && this.fast.bufferedAmount < 32768) { this.fast.send(u8); N.stats.up += u8.byteLength; } }
    close() { this.ok = false; try { this.pc.close(); } catch (e) { /* closed */ } }
  }
  const onOpen = (l) => {
    if (N.role === 'guest') { const h = N.hello ? N.hello() : {}; l.sendRel(JSON.stringify(Object.assign({ t: 'hello', build: N.build }, h))); }
    else setTimeout(() => { if (sids.get(l.sid) === l && !l.ok) drop(l, 'no hello'); }, 10000);
  };
  const drop = (l, why) => {
    const live = links.get(l.slot) === l;
    if (!live && sids.get(l.sid) !== l) return;
    if (live) links.delete(l.slot);
    if (sids.get(l.sid) === l) sids.delete(l.sid);
    l.close();
    if (!live) return;
    if (N.role === 'host') {
      const p = N.peers.get(l.slot);
      if (p) { N.peers.delete(l.slot); relay({ t: 'left', slot: l.slot }, l.slot, null); fire('left', p); status(peerCount()); }
    } else if (N.role === 'guest' && l.slot === 0) {
      if (joinWait) failJoin('could not connect (' + why + ')'); else N.leave('The host left the session.');
    }
  };
  const peerCount = () => 'Hosting ' + N.code + ' \u00b7 ' + (N.peers.size + 1) + ' player' + (N.peers.size ? 's' : '');
  const guestStatus = () => status('Connected \u00b7 ' + (N.peers.size + 1) + ' players');

  // ---------------------------------------------------------------- reliable messages
  const relay = (m, from, to) => { const text = JSON.stringify(m); for (const [s, l] of links) if (l.ok && s !== from && (to == null || s === to)) l.sendRel(text); };
  N.send = (t, m = {}, to) => {
    m.t = t;
    if (N.role === 'host') { m.from = 0; relay(m, -1, to == null ? null : to); }
    else if (N.role === 'guest') { const l = links.get(0); if (to != null) m.to = to; if (l && l.ok) l.sendRel(JSON.stringify(m)); }
  };
  const deliver = (m, from) => { if (L.has(m.t) && !INTERNAL.has(m.t)) fire(m.t, m, from); };
  const INTERNAL = new Set(['hello', 'welcome', 'reject', 'join', 'left', 'ping', 'pong', 'status', 'hosting', 'end']);
  const rateOk = (l) => { const now = performance.now(); if (now - (l.rt || 0) > 1000) { l.rt = now; l.rn = 0; } return ++l.rn <= 120; };
  const onRel = (l, text) => {
    if (typeof text !== 'string' || text.length > 8192 || !rateOk(l)) return;
    let m; try { m = JSON.parse(text); } catch (e) { return; }
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'ping') { l.sendRel(JSON.stringify({ t: 'pong', s: m.s })); return; }
    if (m.t === 'pong') { if (typeof m.s === 'number') { l.rtt = Math.max(0, performance.now() - m.s); const p = N.peers.get(l.slot); if (p) p.rtt = l.rtt; } return; }
    if (N.role === 'host') {
      if (m.t === 'hello') { onHello(l, m); return; }
      if (!l.ok || INTERNAL.has(m.t)) return;
      const to = m.to; m.from = l.slot; delete m.to;
      if (to == null) { deliver(m, l.slot); relay(m, l.slot, null); }
      else if (to === 0) deliver(m, l.slot);
      else if (Number.isInteger(to) && links.has(to)) relay(m, l.slot, to);
      return;
    }
    if (m.t === 'welcome') { onWelcome(m); return; }
    if (m.t === 'reject') { failJoin(String(m.why || 'rejected')); return; }
    if (m.t === 'join' && m.peer && Number.isInteger(m.peer.slot) && m.peer.slot !== N.me) { const p = peerOf(m.peer); if (p) { N.peers.set(p.slot, p); guestStatus(); fire('join', p); } return; }
    if (m.t === 'left') { const p = N.peers.get(m.slot); if (p && m.slot !== 0) { N.peers.delete(m.slot); guestStatus(); fire('left', p); } return; }
    deliver(m, Number.isInteger(m.from) ? m.from : 0);
  };
  const peerOf = (q) => {
    if (!q || typeof q !== 'object' || !Number.isInteger(q.slot) || q.slot < 0 || q.slot > 3) return null;
    const B = AF.friends && AF.friends.byId, F = B && typeof q.friend === 'string' && Object.hasOwn(B, q.friend) ? B[q.friend] : null; if (!F) return null;
    return { slot: q.slot, name: String(q.name || F.name).slice(0, 24), friend: q.friend, look: N.cleanLook(q.look, F.look), rtt: 0, x: +q.x || 0, z: +q.z || 0 };
  };
  const onHello = (l, m) => {
    if (l.ok) return;
    const reject = (why) => { l.sendRel(JSON.stringify({ t: 'reject', why })); setTimeout(() => drop(l, 'rejected'), 500); };
    if (m.build !== N.build) return reject('version');
    let slot = 0; for (let s = 1; s <= 3 && !slot; s++) if (!links.has(s)) slot = s;
    if (!slot) return reject('full');
    const me = N.hello ? N.hello() : {}, p = peerOf(Object.assign({}, m, { slot }));
    if (!p) return reject('friend');
    if (me.friend === p.friend || [...N.peers.values()].some((q) => q.friend === p.friend)) return reject('taken');
    l.slot = slot; l.ok = true; links.set(slot, l); N.peers.set(slot, p);
    const roster = [Object.assign({ slot: 0 }, me)].concat([...N.peers.values()].filter((q) => q.slot !== l.slot));
    l.sendRel(JSON.stringify({ t: 'welcome', slot: l.slot, roster, extra: N.welcomeExtra ? N.welcomeExtra(l.slot) : null }));
    relay({ t: 'join', peer: p }, l.slot, null);
    fire('join', p); status(peerCount());
  };
  const onWelcome = (m) => {
    if (!joinWait || !Number.isInteger(m.slot)) return;
    N.me = m.slot;
    for (const q of Array.isArray(m.roster) ? m.roster : []) { const p = peerOf(q); if (p && p.slot !== N.me) N.peers.set(p.slot, p); }
    links.get(0).ok = true; closeSignal();
    const w = joinWait; joinWait = null; clearTimeout(w.t);
    guestStatus();
    fire('welcome', m); w.res(m);
  };
  const failJoin = (why) => { const w = joinWait; joinWait = null; if (w) clearTimeout(w.t); N.leave(); if (w) w.rej(new Error(why)); };

  // ---------------------------------------------------------------- fast snapshots (byte 0 type, byte 1 origin, bytes 2-3 seq)
  const tier = (a, b) => {
    const pa = a === N.me ? N.mine : N.peers.get(a), pb = b === N.me ? N.mine : N.peers.get(b);
    if (!pa || !pb) return 1;
    const d = Math.hypot(pa.x - pb.x, pa.z - pb.z);
    return d > 500 ? 4 : d > 250 ? 2 : 1;
  };
  N.tier = tier;
  N.fast = (u8, len, seq) => {
    u8[1] = N.me;
    const view = u8.subarray(0, len);
    if (N.role === 'host') { for (const [s, l] of links) if (l.ok && seq % tier(0, s) === 0) l.sendFast(view); }
    else { const l = links.get(0); if (l && l.ok) l.sendFast(view); }
  };
  // per origin packet budget (senders run 15-20 Hz): a flood is dropped before it is parsed or relayed
  const FB = new Float64Array(4).fill(20), FT = new Float64Array(4);
  const fastOk = (o) => { const now = performance.now(); FB[o] = Math.min(20, FB[o] + (now - FT[o]) * 0.04); FT[o] = now; if (FB[o] < 1) return false; FB[o] -= 1; return true; };
  const onFastData = (l, buf) => {
    if (!(buf instanceof ArrayBuffer) || buf.byteLength < 8 || buf.byteLength > 4096 || !l.ok) return;
    const u8 = new Uint8Array(buf);
    let origin;
    if (N.role === 'host') {
      origin = l.slot; if (!fastOk(origin)) return;
      u8[1] = origin;
      const seq = u8[2] | (u8[3] << 8);
      for (const [s, k] of links) if (k.ok && s !== origin && seq % tier(origin, s) === 0) k.sendFast(u8);
    } else { origin = u8[1]; if (origin === N.me || !N.peers.has(origin) || !fastOk(origin)) return; }
    if (fastFn) { try { fastFn(u8, origin); } catch (e) { AF.warnOnce('net fast', e); } }
  };

  // ---------------------------------------------------------------- sessions
  N.host = async () => {
    if (N.role !== 'off') return N.code;
    const g = ++gen;
    N.role = 'host'; N.me = 0; status('Opening a lobby\u2026');
    await fetchIce();
    for (let i = 0; i < 3; i++) {
      if (g !== gen) throw new Error('left');
      N.code = N.newCode();
      try { await openSignal(N.code, 'host'); status(peerCount()); fire('hosting', N.code); return N.code; }
      catch (e) { if (g !== gen) throw new Error('left'); closeSignal(); if (e.message !== 'taken') { N.role = 'off'; N.code = ''; status('Could not open a lobby (' + e.message + ').'); throw e; } }
    }
    N.role = 'off'; N.code = ''; throw new Error('taken');
  };
  N.join = async (code) => {
    if (N.role !== 'off') N.leave();
    code = N.cleanCode(code);
    if (!N.validCode(code)) throw new Error('code');
    const g = ++gen;
    N.role = 'guest'; N.code = code; N.me = -1; status('Connecting\u2026');
    await fetchIce();
    if (g !== gen) throw new Error('left');
    const wait = new Promise((res, rej) => { const w = joinWait = { res, rej, t: setTimeout(() => { if (joinWait === w) failJoin('timed out'); }, 30000) }; });
    wait.catch(() => { /* the caller gets the rejection; this only marks it handled when the join is abandoned early */ });
    try { await openSignal(code, 'guest'); }
    catch (e) {
      if (g !== gen) throw new Error('left');
      const w = joinWait; joinWait = null; if (w) clearTimeout(w.t); N.leave();
      throw new Error(e.message === 'nolobby' ? 'no such lobby' : e.message === 'full' ? 'lobby full' : e.message);
    }
    return wait;
  };
  N.leave = (why) => {
    if (N.role === 'off') return;
    gen++;
    const w = joinWait; joinWait = null; if (w) { clearTimeout(w.t); w.rej(new Error(why || 'left')); }
    closeSignal();
    for (const l of links.values()) l.close();
    for (const l of sids.values()) l.close();
    links.clear(); sids.clear(); N.peers.clear();
    N.role = 'off'; N.code = ''; N.me = 0;
    status(why || ''); fire('end', why || '');
  };
  N.kick = (slot) => { const l = links.get(slot); if (N.role === 'host' && l) drop(l, 'kicked'); };
  N.debug = () => [...links.values()].map((l) => ({ slot: l.slot, ok: l.ok, open: l.open, pc: l.pc.connectionState, ice: l.pc.iceConnectionState, sig: l.pc.signalingState, rel: l.rel && l.rel.readyState, fast: l.fast && l.fast.readyState, rtt: Math.round(l.rtt) }));
  addEventListener('pagehide', () => N.leave());

  // ---------------------------------------------------------------- heartbeat (independent of the frame loop: the travel veil and menus pause that)
  let lastStat = performance.now(), upLast = 0, downLast = 0;
  setInterval(() => {
    const now = performance.now();
    for (const l of new Set([...links.values(), ...sids.values()])) {
      if (l.ok || l.open) l.sendRel(JSON.stringify({ t: 'ping', s: now }));
      if (now - l.last > (l.ok ? 10000 : 25000)) drop(l, 'timed out');
    }
    const S = N.stats, dt = (now - lastStat) / 1000; lastStat = now;
    S.upK = (S.up - upLast) / 1024 / dt; S.downK = (S.down - downLast) / 1024 / dt; upLast = S.up; downLast = S.down;
  }, 2000);
}
} catch (e) { AF.partError('79-net.js', e); }
