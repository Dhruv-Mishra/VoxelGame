// ================================================================ 76-inventory.js
try {
// ===== 76-inventory: the bag (I, or BAG on touch) — snacks that heal, pet treats, and whatever a mission hands the crew  (OWNER: game) =====
// AF.inv.add({ id, name, heal?, kind? }, n) -> bool · take(id, n) · count(id) · use(id) · open() / close() / toggle()
// AF.inv.extra.push(() => [{ name, desc, icon, tag }]) — read-only rows a system lends the bag (the heist's crew items, the zoo ticket).
// Persisted in AF.save.inv ({ id: { n, name, heal, kind } }); at most 9 of a kind.
{
  const UI = AF.ui, S = AF.save, root = document.getElementById('ui');
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const BAG = S.inv && typeof S.inv === 'object' ? S.inv : (S.inv = {});
  const MAX = 9;
  const IC = {
    food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M16 3c-2 1-3 4-3 7h3v11"/>', drink: '<path d="M6 8h11v4a5 5 0 0 1-5 5H11a5 5 0 0 1-5-5zM17 9h1.5a2.5 2.5 0 0 1 0 5H17M9 3v3M12 3v3"/>',
    aid: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="M12 10v6M9 13h6M9 6V4h6v2"/>', treat: '<path d="M7 8a2 2 0 1 1-1-3.5A2 2 0 1 1 9 6l6 6a2 2 0 1 1 3 2.5 2 2 0 1 1-2.5 3L9.5 11.5A2 2 0 1 1 7 8z"/>',
    key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>', charge: '<rect x="4" y="9" width="12" height="9" rx="1"/><path d="M8 9V6M12 9V6M16 13h3l2-3"/>',
    cash: '<path d="M7 7h10l3 13H4zM9 7l1-3h4l1 3M12 11v6M10 13h3a1 1 0 0 1 0 2h-2a1 1 0 0 0 0 2h3"/>', wear: '<path d="M12 5a2 2 0 1 0-2-2M12 5v2L3 14h18l-9-7"/>',
    ticket: '<path d="M3 8a2 2 0 0 0 0 4v4h18v-4a2 2 0 0 1 0-4V4H3zM14 4v12"/>', chute: '<path d="M3 11a9 7 0 0 1 18 0zM4 11l8 8 8-8M12 11v8"/>', card: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18M7 15h4"/>',
  };
  const iconOf = (it) => it.icon || (it.kind === 'treat' ? 'treat' : it.heal >= 100 ? 'aid' : /coffee|lemon|soda|tea|milk|drink/i.test(it.name) ? 'drink' : 'food');
  const svg = (k) => '<svg viewBox="0 0 24 24">' + (IC[k] || IC.food) + '</svg>';
  const INV = AF.inv = { extra: [] };
  INV.slug = (name) => String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'item';
  INV.count = (id) => (BAG[id] ? BAG[id].n : 0);
  INV.add = (it, n = 1) => {
    const id = it.id || INV.slug(it.name), e = BAG[id] || (BAG[id] = { n: 0, name: it.name, heal: it.heal || 0, kind: it.kind || (it.heal ? 'food' : 'misc') });
    if (e.n + n > MAX) { if (!e.n) delete BAG[id]; return false; }
    e.n += n; AF.saveSoon(); refresh(); return true;
  };
  INV.take = (id, n = 1) => { const e = BAG[id]; if (!e || e.n < n) return false; e.n -= n; if (!e.n) delete BAG[id]; AF.saveSoon(); refresh(); return true; };
  INV.use = (id) => {
    const e = BAG[id]; if (!e) return false;
    if (e.kind === 'treat') {
      const P = AF.pets; if (!P || !P.active()) { AF.emit('toast', { text: 'No pet with you to give it to.', kind: 'warn' }); return false; }
      INV.take(id); P.treat(); return true;
    }
    if (e.heal) {
      const H = AF.health; if (H.v >= H.max) { AF.emit('toast', { text: 'You\u2019re not hungry right now.', kind: 'warn' }); return false; }
      INV.take(id); H.heal(e.heal); if (AF.audio) AF.audio.play('ui_check', { vol: 0.4 });
      AF.emit('toast', { text: 'Mm \u2014 ' + e.name.toLowerCase() + '. +' + e.heal + ' health.', kind: 'ok', icon: 'inv' }); return true;
    }
    return false;
  };
  INV.list = () => Object.keys(BAG).map((id) => Object.assign({ id }, BAG[id]));

  // ---------------------------------------------------------------- the panel (top-left, GTA's interaction menu): click / arrows + Enter
  const st = document.createElement('style');
  st.textContent = `
  #ui #m-inv{justify-content:flex-start;align-items:flex-start;background:linear-gradient(90deg,rgba(2,4,8,.6),rgba(2,4,8,0) 55%);padding:max(16px,env(safe-area-inset-top)) 16px 16px max(18px,env(safe-area-inset-left))}
  #ui #m-inv>.panel{width:min(360px,100%);padding:0;border-radius:4px;overflow:hidden}
  #ui #m-inv .hd2{display:flex;align-items:baseline;justify-content:space-between;padding:14px 18px 10px;background:linear-gradient(90deg,#1a1408,#2a2010);border-bottom:2px solid var(--gold)}
  #ui #m-inv .hd2 b{font:400 22px Limelight,Georgia,serif;color:#fff;letter-spacing:1px} #ui #m-inv .hd2 span{color:#7ddc8a;font-weight:700}
  #ui #m-inv h4{margin:0;padding:10px 18px 4px} #ui #m-inv .rows{max-height:min(62vh,520px);overflow:auto;padding-bottom:8px}
  #ui #m-inv .ir{display:grid;grid-template-columns:30px 1fr auto;gap:10px;align-items:center;width:100%;padding:8px 18px;text-align:left;border-left:3px solid transparent}
  #ui #m-inv .ir:hover:not([disabled]),#ui #m-inv .ir.sel{background:rgba(255,255,255,.09);border-left-color:var(--gold)} #ui #m-inv .ir[disabled]{opacity:.5;cursor:default}
  #ui #m-inv .ir .ic{width:30px;height:30px;border-radius:4px;display:grid;place-items:center;background:rgba(255,255,255,.07);color:var(--gold)}
  #ui #m-inv .ir .ic svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
  #ui #m-inv .ir small{display:block;color:var(--dim);font-size:11px} #ui #m-inv .ir em{font-style:normal;font-size:11px;font-weight:700;letter-spacing:.8px;color:var(--gold);text-transform:uppercase}
  #ui #m-inv .ir i{font-style:normal;color:var(--dim);font-size:12px;margin-left:5px} #ui #m-inv .none{padding:6px 18px 10px;color:var(--dim);font-size:12px}
  #ui #m-inv .ft{padding:9px 18px;font-size:11px;color:var(--dim);border-top:1px solid rgba(255,255,255,.06)}`;
  document.head.appendChild(st);
  const el = document.createElement('div'); el.id = 'm-inv'; el.className = 'sheet pe';
  el.innerHTML = '<div class="panel"><div class="hd2"><b>Bag</b><span></span></div><div class="rows"></div><div class="ft"></div></div>';
  root.appendChild(el);
  const rowsEl = el.querySelector('.rows'), cashEl = el.querySelector('.hd2 span'), ftEl = el.querySelector('.ft');
  ftEl.textContent = AF.touch ? 'Tap a snack to eat it \u00b7 tap outside to close' : 'Click or Enter to use \u00b7 \u2191\u2193 choose \u00b7 I / Esc close';
  let rows = [], sel = 0;
  const render = () => {
    const own = INV.list(), lent = []; for (const f of INV.extra) { try { const r = f(); if (r) lent.push(...r); } catch (e) { /* a provider failed */ } }
    rows = [];
    let html = '<h4 class="sh">Snacks &amp; treats</h4>';
    if (!own.length) html += '<div class="none">Nothing yet \u2014 grocers, diners and kiosks sell snacks; the pet store sells treats.</div>';
    for (const it of own) {
      const full = it.heal && AF.health.v >= AF.health.max, noPet = it.kind === 'treat' && !(AF.pets && AF.pets.active());
      rows.push({ use: it.id, off: full || noPet });
      html += '<button class="ir" data-r="' + (rows.length - 1) + '"' + (full || noPet ? ' disabled' : '') + '><div class="ic">' + svg(iconOf(it)) + '</div><span>' + esc(it.name) + '<i>\u00d7' + it.n + '</i><small>'
        + (it.kind === 'treat' ? (noPet ? 'Walk your pet first' : 'Give one to your pet') : '+' + it.heal + ' health' + (full ? ' \u00b7 you\u2019re full' : '')) + '</small></span><em>' + (it.kind === 'treat' ? 'Give' : 'Eat') + '</em></button>';
    }
    if (lent.length) {
      html += '<h4 class="sh">Job</h4>';
      for (const it of lent) { rows.push({ off: true }); html += '<button class="ir" disabled data-r="' + (rows.length - 1) + '"><div class="ic">' + svg(it.icon) + '</div><span>' + esc(it.name) + (it.n > 1 ? '<i>\u00d7' + it.n + '</i>' : '') + '<small>' + esc(it.desc || '') + '</small></span><em>' + esc(it.tag || '') + '</em></button>'; }
    }
    rowsEl.innerHTML = html; cashEl.textContent = AF.cash(S.money);
    sel = Math.min(Math.max(0, rows.findIndex((r) => !r.off)), Math.max(0, rows.length - 1)); mark();
  };
  const mark = () => { for (const b of rowsEl.querySelectorAll('.ir')) b.classList.toggle('sel', +b.dataset.r === sel && !rows[sel].off); };
  function refresh() { if (UI.state && UI.state.inv) render(); }
  INV.open = () => { if (UI.modalOpen() || AF.mode !== 'walk') return; UI.state.inv = true; render(); el.classList.add('open'); AF.input.releaseLock(); if (AF.audio) AF.audio.play('ui_open', { vol: 0.35 }); };
  INV.close = () => { if (!UI.state.inv) return; UI.state.inv = false; el.classList.remove('open'); AF.input.requestLock(); };
  INV.toggle = () => (UI.state.inv ? INV.close() : INV.open());
  el.addEventListener('click', (e) => {
    if (e.target === el) { INV.close(); return; }
    const b = e.target.closest('.ir'); if (!b || b.disabled) return;
    const r = rows[+b.dataset.r]; if (r && r.use) INV.use(r.use);
  });
  AF.onTick('inventory', 421, () => {
    const I = AF.input, open = UI.state && UI.state.inv;
    if (!open) { if (I.hit('KeyI') && AF.mode === 'walk' && AF.ready && !UI.modalOpen() && !(UI.dialogueOpen && UI.dialogueOpen())) INV.open(); return; }
    if (I.hit('KeyI') || AF.mode !== 'walk') { INV.close(); return; }
    if (!rows.length) return;
    const step = (d) => { for (let k = 0; k < rows.length; k++) { sel = (sel + d + rows.length) % rows.length; if (!rows[sel].off) break; } mark(); };
    if (I.hit('ArrowDown') || I.hit('KeyS')) step(1); if (I.hit('ArrowUp') || I.hit('KeyW')) step(-1);
    if (I.hit('Enter') && rows[sel] && rows[sel].use && !rows[sel].off) INV.use(rows[sel].use);
  });
  // a hint when you're hurt and carrying food (once in a while)
  let hungryT = 0;
  AF.on('hurt', () => {
    if (AF.clock.t - hungryT < 60 || AF.health.v > AF.health.max * 0.4) return;
    if (INV.list().some((it) => it.heal)) { hungryT = AF.clock.t; if (UI.help) UI.help(AF.touch ? 'Hurt? Tap BAG and eat something.' : 'Hurt? Press [I] and eat something from your bag.', 5000); }
  });
  // the zoo ticket shows up while it's valid
  INV.extra.push(() => (AF.zooGate && AF.zooGate.ticket ? [{ name: 'Solace Zoo ticket', desc: 'Admit one \u00b7 good until closing', icon: 'ticket', tag: 'Today' }] : null));

  AF.test('inventory: snacks go in the bag, heal when eaten, and survive a save', () => {
    const was = JSON.stringify(BAG), hp = AF.health.v;
    try {
      for (const k of Object.keys(BAG)) delete BAG[k];
      const ok1 = INV.add({ name: 'Test bun', heal: 20 }, 2) && INV.count('test-bun') === 2, cap = !INV.add({ name: 'Test bun', heal: 20 }, 9);
      AF.health.v = 50; const ate = INV.use('test-bun') && AF.health.v === 70 && INV.count('test-bun') === 1;
      AF.saveNow(); const saved = JSON.parse(localStorage.getItem('portSolace.save') || '{}').inv['test-bun'].n === 1;
      return { ok: ok1 && cap && ate && saved, info: `add ${ok1}, cap ${cap}, eat ${ate}, saved ${saved}` };
    } finally { for (const k of Object.keys(BAG)) delete BAG[k]; Object.assign(BAG, JSON.parse(was)); AF.health.v = hp; AF.saveNow(); }
  });
}
} catch (e) { AF.partError('76-inventory.js', e); }
