// ================================================================ 97-fallback.js
try {
// ===== 97-fallback: safety-net orbit/walk camera + toasts, ONLY used if the player/ui parts did not register them (OWNER: coordinator) =====
AF.onBuild('fallback-controls', 850, () => {
  const I = AF.input, cam = AF.camera, V3 = THREE.Vector3;
  if (!AF.modes.aerial) {
    const o = { tgt: new V3(0, 0, 20), yaw: -0.6, pitch: 0.62, dist: 330, gy: -0.6, gp: 0.62, gd: 330, gt: new V3(0, 0, 20) };
    AF.modes.aerial = {
      enter() {},
      update(dt) {
        const m = I.mouse;
        if (m.buttons & 1 && !I.key('ShiftLeft')) { o.gy -= m.dx * 0.005; o.gp = AF.clamp(o.gp + m.dy * 0.004, 0.18, 1.45); }
        const pan = (dx, dz) => { const s = o.gd * 0.0016; o.gt.x += (Math.cos(o.yaw) * dx + Math.sin(o.yaw) * dz) * s; o.gt.z += (-Math.sin(o.yaw) * dx + Math.cos(o.yaw) * dz) * s; };
        if (m.buttons & 2 || (m.buttons & 1 && I.key('ShiftLeft'))) pan(-m.dx, -m.dy);
        if (m.wheel) o.gd = AF.clamp(o.gd * Math.exp(m.wheel * 0.0012), 12, 560);
        const k = 520 * dt;
        if (I.key('KeyW') || I.key('ArrowUp')) pan(0, -k); if (I.key('KeyS') || I.key('ArrowDown')) pan(0, k);
        if (I.key('KeyA') || I.key('ArrowLeft')) pan(-k, 0); if (I.key('KeyD') || I.key('ArrowRight')) pan(k, 0);
        const a = 1 - Math.exp(-dt * 8);
        o.yaw += (o.gy - o.yaw) * a; o.pitch += (o.gp - o.pitch) * a; o.dist += (o.gd - o.dist) * a; o.tgt.lerp(o.gt, a);
        cam.position.set(o.tgt.x + Math.sin(o.yaw) * Math.cos(o.pitch) * o.dist, o.tgt.y + Math.sin(o.pitch) * o.dist, o.tgt.z + Math.cos(o.yaw) * Math.cos(o.pitch) * o.dist);
        cam.position.y = Math.max(cam.position.y, AF.W.groundY(cam.position.x, cam.position.z) + 2);
        cam.lookAt(o.tgt); AF.camTarget.copy(o.tgt); AF.shadowFocus.copy(o.tgt); AF.shadowRadius = AF.clamp(o.dist * 0.6, 70, 220);
        if (m.clicked && m.clickButton === 0 && I.key('KeyF')) { /* reserved */ }
      },
    };
    AF.fallbackAerial = o;
    console.log('[af] fallback aerial camera installed');
  }
  if (!AF.modes.walk) {
    const body = { x: 0, y: 0.5, z: 28, vy: 0, r: 0.3, h: 1.7, onGround: false }; let yaw = Math.PI, pitch = 0.1;
    AF.player = AF.player || { body, get x() { return body.x; }, get y() { return body.y; }, get z() { return body.z; }, setVisible() {}, teleport(x, y, z, yw) { body.x = x; body.y = y; body.z = z; if (yw != null) yaw = yw; } };
    AF.modes.walk = {
      enter(opts = {}) { if (opts.x != null) { body.x = opts.x; body.y = opts.y ?? AF.surfaceBelow(opts.x, opts.z, 50); body.z = opts.z; } if (opts.yaw != null) yaw = opts.yaw; },
      update(dt) {
        const m = I.mouse; if (m.buttons & 1) { yaw -= m.dx * 0.004; pitch = AF.clamp(pitch + m.dy * 0.003, -0.6, 1.2); }
        const sp = (I.key('ShiftLeft') ? 6.5 : 3) * dt; let f = 0, s = 0;
        if (I.key('KeyW')) f += 1; if (I.key('KeyS')) f -= 1; if (I.key('KeyA')) s -= 1; if (I.key('KeyD')) s += 1;
        const dx = (-Math.sin(yaw) * f + Math.cos(yaw) * s) * sp, dz = (-Math.cos(yaw) * f - Math.sin(yaw) * s) * sp;
        if (I.hit('Space') && body.onGround) body.vy = 6.5;
        AF.moveBody(body, dx, dz, dt);
        const eye = new V3(body.x, body.y + 1.6, body.z);
        let d = 4; for (; d > 0.3; d -= 0.25) { const p = eye.clone().add(new V3(Math.sin(yaw) * Math.cos(pitch) * d, Math.sin(pitch) * d, Math.cos(yaw) * Math.cos(pitch) * d)); if (!AF.solidAt(p.x, p.y, p.z)) break; }
        cam.position.set(eye.x + Math.sin(yaw) * Math.cos(pitch) * d, eye.y + Math.sin(pitch) * d, eye.z + Math.cos(yaw) * Math.cos(pitch) * d);
        cam.lookAt(eye); AF.shadowFocus.set(body.x, body.y, body.z); AF.shadowRadius = 70;
        let best = null, bd = 1e9; for (const it of AF.interacts) { const dd = Math.hypot(it.x - body.x, (it.y ?? body.y) - body.y, it.z - body.z); if (dd < (it.r || 2.2) && dd < bd && (!it.can || it.can())) { bd = dd; best = it; } }
        AF.interactTarget = best;
        if (best && I.hit('KeyE')) { try { best.act(); } catch (e) { console.error(e); } }
        if (I.hit('Escape') || I.hit('Tab')) AF.setMode('aerial');
      },
    };
    // double-click in aerial -> walk at the spawn
    addEventListener('dblclick', () => { if (AF.mode === 'aerial') AF.setMode('walk', { x: AF.PLAN.spawn.x, z: AF.PLAN.spawn.z, yaw: AF.PLAN.spawn.yaw }); });
    AF.fallbackWalk = true; console.log('[af] fallback walk mode installed');
  }
  if (!(AF._ev.toast && AF._ev.toast.length)) {
    const box = document.createElement('div');
    box.style.cssText = 'position:fixed;left:50%;bottom:48px;transform:translateX(-50%);padding:10px 18px;background:rgba(40,28,18,.82);color:#f6e7c6;border-radius:12px;font:16px Georgia,serif;opacity:0;transition:opacity .4s;pointer-events:none;z-index:9';
    document.body.appendChild(box); let tm = 0;
    const show = (t) => { box.textContent = t; box.style.opacity = 1; clearTimeout(tm); tm = setTimeout(() => { box.style.opacity = 0; }, 3500); };
    AF.on('toast', show); AF.on('hint', show); AF.on('dialogue', (d) => show((d.name ? d.name + ': ' : '') + d.line));
    AF.onTick('fallback-prompt', 951, () => { if (AF.fallbackWalk && AF.interactTarget && AF.mode === 'walk') { box.textContent = 'E — ' + AF.interactTarget.label; box.style.opacity = 1; } });
  }
});

} catch (e) { AF.partError('97-fallback.js', e); }

