// ================================================================ 04-camfx.js
try {
// ===== AF.camfx: camera feel shared by every camera owner (jet skis, freefall, crashes, the heist)
// - shake(amp, seconds = 0.4, freq = 11): one-shot trauma shake (amp in radians: ~0.01 small, 0.05 big), smooth noise fading out
// - rumble(key, amp, freq = 9): continuous shake, call every frame while it should last; eases out when no longer called
// - fov(deg): extra field of view while called every frame (speed feel), eased in and out
// - wind(k): 0..1 speed-wind overlay (DOM only: radial streaks + vignette, no WebGL), call every frame
// The rotation (and fov) is applied after every camera owner has placed the camera ('camfx' tick, before culling) and taken off
// again at the start of the next frame, so modes always see their own camera. Idle = one early return. Nothing allocates per frame.
// localStorage['portSolace.shake'] = '0' turns shake + streaks off (default off with prefers-reduced-motion); menu row "Camera shake".
{
  const TAU = Math.PI * 2, cam = AF.camera;
  let on = true;
  try {
    const s = localStorage.getItem('portSolace.shake');
    on = s != null ? s !== '0' : !(typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) { /* storage blocked */ }
  const CF = AF.camfx = { get on() { return on; }, amp: 0, wk: 0, fovK: 0 };
  CF.setOn = (v) => { on = !!v; try { localStorage.setItem('portSolace.shake', on ? '1' : '0'); } catch (e) { /* storage blocked */ } syncMenu(); };

  // one-shot slots (fixed pool, no allocation)
  const SLOTS = [];
  for (let i = 0; i < 8; i++) SLOTS.push({ a: 0, d: 1, age: 1, f: 11, p: i * 1.7 });
  CF.shake = (amp, sec = 0.4, freq = 11) => {
    if (!(amp > 0) || !(sec > 0)) return;
    let s = SLOTS[0], best = 1e9;
    for (const q of SLOTS) {
      const left = q.age >= q.d ? 0 : q.a * (1 - q.age / q.d) ** 2;
      if (left < best) { best = left; s = q; }
    }
    s.a = Math.min(0.12, amp); s.d = sec; s.age = 0; s.f = freq;
  };
  // continuous sources by key (one object per key, made on first use)
  const RUM = new Map(), RUML = [];
  CF.rumble = (key, amp, freq) => {
    let r = RUM.get(key);
    if (!r) { r = { set: 0, cur: 0, f: 9, p: RUML.length * 2.3 }; RUM.set(key, r); RUML.push(r); }
    if (amp > r.set) r.set = Math.min(0.06, amp);
    if (freq) r.f = freq;
  };
  let fovSet = 0, fovCur = 0, windSet = 0, windCur = 0;
  CF.fov = (deg) => { if (deg > fovSet) fovSet = Math.min(25, deg); };
  CF.wind = (k) => { if (k > windSet) windSet = Math.min(1, k); };

  // ---------------------------------------------------------------- the wind overlay (DOM, compositor-animated, hidden at 0)
  const st = document.createElement('style');
  st.textContent = `#cfx-wind{position:fixed;inset:0;pointer-events:none;z-index:4;overflow:hidden;display:none;opacity:0}
#cfx-wind .v{position:absolute;inset:0;background:radial-gradient(ellipse at 50% 50%,rgba(0,0,0,0) 55%,rgba(10,20,30,.32) 100%)}
#cfx-wind i{position:absolute;left:50%;top:50%;width:150vmax;height:150vmax;margin:-75vmax 0 0 -75vmax;will-change:transform,opacity;
 background:repeating-conic-gradient(from 0deg,rgba(255,255,255,0) 0deg 3.1deg,rgba(235,245,255,.36) 3.35deg,rgba(255,255,255,0) 3.6deg 7.3deg),
  repeating-conic-gradient(from 1.9deg,rgba(255,255,255,0) 0deg 4.6deg,rgba(235,245,255,.22) 4.8deg,rgba(255,255,255,0) 5deg 11.3deg);
 -webkit-mask-image:radial-gradient(circle,rgba(0,0,0,0) 29%,#000 36%,rgba(0,0,0,0) 46%);mask-image:radial-gradient(circle,rgba(0,0,0,0) 29%,#000 36%,rgba(0,0,0,0) 46%);
 animation:cfxw .5s linear infinite}
#cfx-wind i:nth-child(3){animation-delay:-.17s;transform:rotate(23deg)}#cfx-wind i:nth-child(4){animation-delay:-.33s}
@keyframes cfxw{0%{transform:scale(.7) rotate(0deg);opacity:0}30%{opacity:1}100%{transform:scale(1.55) rotate(2deg);opacity:0}}`;
  document.head.appendChild(st);
  const wEl = document.createElement('div'); wEl.id = 'cfx-wind'; wEl.innerHTML = '<div class="v"></div><i></i><i></i><i></i>';
  const ui = document.getElementById('ui');
  if (ui && ui.parentNode) ui.parentNode.insertBefore(wEl, ui); else document.body.appendChild(wEl);
  const streaks = wEl.querySelectorAll('i');
  let wShown = 0, wStreaks = true;

  // ---------------------------------------------------------------- apply after the camera owners, restore at the next frame start
  const q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), saveQ = new THREE.Quaternion(), shakenQ = new THREE.Quaternion();
  let applied = false, fovApplied = false, saveFov = 50, shakenFov = 50;
  const nz = (p) => Math.sin(p) * 0.68 + Math.sin(p * 2.31 + 0.7) * 0.32;   // smooth band-limited "noise"
  AF.onTick('camfx-restore', -100, () => {
    if (applied) {
      applied = false;
      const c = cam.quaternion;
      if (c.x === shakenQ.x && c.y === shakenQ.y && c.z === shakenQ.z && c.w === shakenQ.w) { c.copy(saveQ); cam.updateMatrixWorld(); }
    }
    if (fovApplied) { fovApplied = false; if (cam.fov === shakenFov) { cam.fov = saveFov; cam.updateProjectionMatrix(); } }
  });
  AF.onTick('camfx', 883, () => {
    const rdt = Math.min(0.1, AF.clock.real || 0);
    const live = on && !AF.SHOT && AF.mode !== 'photo';
    let yaw = 0, pit = 0, rol = 0, amp = 0;
    for (const s of SLOTS) {
      if (s.age >= s.d) continue;
      s.age += rdt; s.p += s.f * rdt * TAU;
      const u = Math.min(1, s.age / s.d), k = s.a * (1 - u) * (1 - u);
      yaw += k * nz(s.p); pit += k * nz(s.p * 1.13 + 2.1); rol += k * 0.7 * nz(s.p * 0.87 + 4.4); amp += k;
    }
    for (const r of RUML) {
      r.cur += (r.set - r.cur) * Math.min(1, rdt * 8); r.set = 0;
      if (r.cur < 1e-5) { r.cur = 0; continue; }
      r.p += r.f * rdt * TAU;
      yaw += r.cur * nz(r.p + 1.1); pit += r.cur * nz(r.p * 1.19 + 3.3); rol += r.cur * 0.5 * nz(r.p * 0.81 + 5.2); amp += r.cur;
    }
    CF.amp = amp;
    fovCur += (fovSet - fovCur) * Math.min(1, rdt * 3); fovSet = 0; if (Math.abs(fovCur) < 0.01) fovCur = 0; CF.fovK = fovCur;
    windCur += (windSet - windCur) * Math.min(1, rdt * 4); windSet = 0; if (windCur < 0.004) windCur = 0; CF.wk = windCur;
    // overlay: DOM writes only on change
    const wk = live ? windCur : 0, ws = wk > 0.02 ? Math.round(wk * 40) / 40 : 0;
    if (ws !== wShown) {
      if (!ws) wEl.style.display = 'none';
      else { if (!wShown) wEl.style.display = 'block'; wEl.style.opacity = String(Math.min(1, ws)); }
      wShown = ws;
    }
    const wantStreaks = ws > 0.25;
    if (ws && wantStreaks !== wStreaks) { wStreaks = wantStreaks; for (const s of streaks) s.style.display = wantStreaks ? '' : 'none'; }
    // camera
    if (fovCur && !AF.SHOT && AF.mode !== 'photo') { saveFov = cam.fov; cam.fov = saveFov + fovCur; shakenFov = cam.fov; cam.updateProjectionMatrix(); fovApplied = true; }
    if (!live || amp < 1e-5) return;
    const sum = Math.abs(yaw) + Math.abs(pit) + Math.abs(rol), lim = sum > 0.08 ? 0.08 / sum : 1;
    saveQ.copy(cam.quaternion);
    e.set(pit * lim, yaw * lim, rol * lim, 'YXZ'); q.setFromEuler(e); cam.quaternion.multiply(q);
    shakenQ.copy(cam.quaternion); cam.updateMatrixWorld(); applied = true;
  });

  // ---------------------------------------------------------------- menu row (injected into the pause menu, no 71-ui edit)
  let seg = null;
  function syncMenu() { if (seg) for (const b of seg.querySelectorAll('button')) b.classList.toggle('on', (b.dataset.v === '1') === on); }
  AF.onBuild('camfx-menu', 840, () => {
    const bright = document.querySelector('#m-menu [data-k=bright]'), row = bright && bright.closest('.row');
    if (!row) return;
    row.insertAdjacentHTML('afterend', '<div class="row"><label>Camera shake</label><div class="seg" data-k="shake"><button data-v="1" title="Shake, speed wind and impacts">On</button><button data-v="0" title="Steady camera (reduced motion)">Off</button></div></div>');
    seg = row.nextElementSibling.querySelector('[data-k=shake]');
    seg.addEventListener('click', (ev) => { const b = ev.target.closest('button'); if (b) CF.setOn(b.dataset.v === '1'); });
    syncMenu();
  });

  if (AF.test) AF.test('camfx: shake rotates the camera after the modes and restores it next frame', () => {
    const was = on; on = true;
    try {
      const q0 = cam.quaternion.clone(), f0 = cam.fov, tick = AF.hooks.tick.find((h) => h.name === 'camfx'), back = AF.hooks.tick.find((h) => h.name === 'camfx-restore');
      CF.shake(0.05, 0.5); CF.fov(6); CF.wind(1);
      const real = AF.clock.real; AF.clock.real = 1 / 30; tick.fn(1 / 30); AF.clock.real = real;
      const moved = cam.quaternion.angleTo(q0), fovUp = cam.fov - f0, shown = wEl.style.display === 'block' || AF.SHOT;
      back.fn(0); const restored = cam.quaternion.angleTo(q0) < 1e-6 && Math.abs(cam.fov - f0) < 1e-6;
      for (const s of SLOTS) s.age = s.d; fovCur = 0; windCur = 0; tick.fn(0); back.fn(0);
      return { ok: (moved > 1e-4 || AF.mode === 'photo') && fovUp > 0 && restored && shown, info: `rot ${moved.toFixed(4)} rad, fov +${fovUp.toFixed(2)}, restored ${restored}, wind ${shown}` };
    } finally { on = was; }
  });
}
} catch (e) { AF.partError('04-camfx.js', e); }
