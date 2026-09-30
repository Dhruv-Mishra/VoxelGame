// ================================================================ 16-rides.js
try {
// ===== 16-rides: ride the Big Wheel and the Sea Serpent coaster ('funride' mode). A ticket kiosk beside each ride; one full turn of the
//       wheel / one lap of the coaster from your own seat (first-person, mouse or drag to look around), E gets you off early.
{
  const L = AF.land, PI = Math.PI, TAU = PI * 2;
  const RD = AF.rides = { cur: null, yaw: 0, pitch: 0 };
  const eye = new THREE.Vector3(), q = new THREE.Quaternion(), qe = new THREE.Quaternion(), e = new THREE.Euler();
  const col = (h, o) => AF.col(h, Object.assign({ jitter: 0.3, edge: 0.4 }, o || {}));

  // a striped-roof kiosk with a window facing -z (toward the boardwalk)
  const kiosk = (x, z, title) => {
    const W = AF.W, red = col(0xc0342e), cream = col(0xf2ead0), gold = col(0xd8b84a, { metal: 0.6, rough: 0.35 }), glass = col(0xa9c9d6, { glass: true });
    const bulb = AF.col(0xfff2c0, { emit: 0xffd070, emitK: 2.6, mode: 'night' });
    W.fill(x - 1.25, 0.25, z - 1, x + 1.25, 2.5, z + 1, cream);
    W.fill(x - 0.75, 1.1, z - 1.05, x + 0.75, 2.1, z - 1, glass);
    W.fill(x - 1.0, 1.0, z - 1.35, x + 1.0, 1.1, z - 1, col(0x8a5a36));
    for (let i = 0; i < 12; i++) W.fill(x - 1.5 + i * 0.25, 2.5, z - 1.4, x - 1.25 + i * 0.25, 2.75, z + 1.25, i % 2 ? red : cream);
    W.fill(x - 1.5, 2.75, z - 1.4, x + 1.5, 3.0, z + 1.25, gold);
    for (let i = 0; i < 6; i++) W.setM(x - 1.25 + i * 0.5, 2.4, z - 1.4, bulb);
    const w = AF.textModel(title, 1, { font: 'deco', depth: 1, pad: 0 }).w || 1;
    const g = AF.meshModel(AF.textModel(title, red, { font: 'deco', depth: 1, pad: 0 }), { vs: Math.min(1 / 16, 2.3 / w), anchor: [0.5, 0, 0.5] });
    AF.placeStatic(g, x, 2.08, z - 1.06, 2, { collide: false });
    AF.addLight({ x, y: 2.3, z: z - 1.6, color: 0xffd890, intensity: 0.8, range: 7, kind: 'sign' });
  };

  AF.onBuild('ride-kiosks', 310, () => {
    const FW = L.ferris, CO = L.coaster; if (!FW || !CO) return;
    const st = new THREE.Vector3(); CO.curve.getPointAt(0.015, st);
    RD.wheelK = { x: FW.WX - 6.5, z: FW.WZ - 8 };
    RD.coastK = { x: st.x + 6.5, z: 206.5 };
    kiosk(RD.wheelK.x, RD.wheelK.z, 'BIG WHEEL 10\u00a2');
    kiosk(RD.coastK.x, RD.coastK.z, 'SEA SERPENT 10\u00a2');
    RD.coastExit = { x: st.x + 3, z: 207.5 };
    AF.addInteract({ x: RD.wheelK.x, y: 1.3, z: RD.wheelK.z - 1.7, r: 2.6, label: 'Ride the Big Wheel \u00b7 10\u00a2', prio: 2, can: () => AF.mode === 'walk', act: () => AF.setMode('funride', { ride: 'wheel' }) });
    AF.addInteract({ x: RD.coastK.x, y: 1.3, z: RD.coastK.z - 1.7, r: 2.6, label: 'Ride the Sea Serpent \u00b7 10\u00a2', prio: 2, can: () => AF.mode === 'walk', act: () => AF.setMode('funride', { ride: 'coaster' }) });
  });

  const wheelSeat = (R, out) => {
    const FW = L.ferris, a = FW.wheel.rotation.x + R.gi / FW.gonds.length * TAU;
    return out.set(FW.WX - Math.cos(a) * (FW.WR - 0.4), FW.WY + Math.sin(a) * (FW.WR - 0.4) + 0.1 - 0.62, FW.WZ);
  };
  const getOff = (R, msg) => {
    const ex = R.kind === 'wheel' ? { x: RD.wheelK.x + 2.5, z: RD.wheelK.z - 2.2 } : { x: RD.coastExit.x, z: RD.coastExit.z };
    AF.setMode('walk', { x: ex.x, y: AF.surfaceBelow(ex.x, ex.z, 3, 6), z: ex.z, yaw: PI });
    if (msg) AF.emit('toast', msg);
  };

  AF.modes.funride = {
    enter(o = {}) {
      const FW = L.ferris, CO = L.coaster;
      if (!FW || !CO) { AF.setMode('walk'); return; }
      const R = RD.cur = { kind: o.ride === 'coaster' ? 'coaster' : 'wheel', t: 0, done: 0, last: 0 };
      RD.yaw = 0; RD.pitch = 0;
      if (R.kind === 'wheel') {
        // an empty gondola (odd patterns carry no riders) brought round to the bottom, then the wheel speeds up for one turn
        const n = FW.gonds.length; let best = 1, bd = 1e9;
        for (let i = 1; i < n; i += 2) { const a = FW.wheel.rotation.x + i / n * TAU, d = Math.abs(AF.angDiff(a, -PI / 2)); if (d < bd) { bd = d; best = i; } }
        R.gi = best; FW.wheel.rotation.x = -PI / 2 - best / n * TAU; R.last = FW.wheel.rotation.x;
        FW.k = 2.4; RD.yaw = PI;
        AF.emit('toast', 'All aboard the Big Wheel! ' + (AF.touch ? 'Drag to look around, EXIT to get off.' : 'Move the mouse to look around, E to get off.'));
      } else {
        CO.st.s = CO.LEN * 0.0151; CO.st.dwell = 2.5; R.last = CO.st.s;
        AF.emit('toast', 'Front seat on the Sea Serpent \u2014 hold on! ' + (AF.touch ? 'EXIT' : 'E') + ' to get off at the station.');
      }
      if (AF.player) AF.player.setVisible(false);
      AF.emit('hint', AF.touch ? '' : 'Mouse look \u00b7 E get off');
    },
    exit() {
      if (L.ferris) L.ferris.k = 1;
      RD.cur = null;
      if (AF.player) AF.player.setVisible(true);
      AF.emit('hud', { speed: null }); AF.emit('hint', '');
    },
    update(dt) {
      const R = RD.cur; if (!R) return;
      const I = AF.input, m = I.mouse;
      if ((document.pointerLockElement || (AF.touch && (m.buttons & 1))) && (m.dx || m.dy)) {
        RD.yaw -= m.dx * 0.004; RD.pitch = AF.clamp(RD.pitch - m.dy * 0.004, -1.1, 1.1);
      }
      if (R.kind === 'wheel') {
        const FW = L.ferris; R.done += Math.max(0, FW.wheel.rotation.x - R.last); R.last = FW.wheel.rotation.x;
        if (R.done >= TAU) { getOff(R, 'Round we go \u2014 thanks for riding the Big Wheel!'); return; }
      } else {
        const CO = L.coaster; let ds = CO.st.s - R.last; if (ds < -CO.LEN * 0.5) ds += CO.LEN; R.done += Math.max(0, ds); R.last = CO.st.s;
        if (R.done > CO.LEN * 0.9 && CO.st.dwell > 0) { getOff(R, 'What a ride! The Sea Serpent pulls back into the station.'); return; }
      }
      if (I.hit('KeyE') || I.hit('KeyF')) {
        if (R.kind === 'wheel') getOff(R, 'The operator stops the wheel and lets you off.');
        else if (L.coaster.st.dwell > 0 || R.done < 1) getOff(R, 'You climb out at the station.');
        else AF.emit('toast', 'Keep your arms inside the car until the station!');
      }
    },
  };
  // camera after harbour-life (330) has moved the wheel and the train this frame
  const fwd = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
  AF.onTick('ride-cam', 336, () => {
    const R = RD.cur; if (!R || AF.mode !== 'funride') return;
    const cam = AF.camera;
    if (R.kind === 'wheel') {
      wheelSeat(R, eye);
      cam.position.copy(eye); cam.up.copy(up);
      e.set(RD.pitch, RD.yaw + PI, 0, 'YXZ'); cam.quaternion.setFromEuler(e);
      const FW = L.ferris;
      AF.emit('hud', { mode: 'fly', speed: FW.WR * 0.07 * (FW.k || 1) * 2.237, alt: Math.max(0, eye.y), car: 'The Big Wheel \u00b7 ' + Math.round(Math.min(1, R.done / TAU) * 100) + '% \u00b7 ' + (AF.touch ? 'EXIT' : 'E') + ' get off' });
    } else {
      const car = L.coaster.cars[0]; car.updateMatrixWorld();
      eye.set(0, 1.75, -0.1).applyMatrix4(car.matrixWorld);
      cam.position.copy(eye); cam.up.copy(up);
      q.copy(car.quaternion); e.set(RD.pitch, RD.yaw + PI, 0, 'YXZ'); qe.setFromEuler(e); cam.quaternion.copy(q).multiply(qe);
      AF.emit('hud', { mode: 'fly', speed: L.coaster.st.v * 2.237, alt: Math.max(0, eye.y), car: 'Sea Serpent \u00b7 ' + (L.coaster.st.dwell > 0 ? 'in the station' : 'hold on!') });
    }
    cam.getWorldDirection(fwd);
    AF.camTarget.copy(eye).addScaledVector(fwd, 8); AF.shadowFocus.set(eye.x, 0, eye.z); AF.shadowRadius = 60;
  });
  AF.test('rides: Big Wheel + Sea Serpent are rideable from their kiosks', () => {
    if (!L.ferris || !L.coaster || !RD.wheelK) return { ok: false, info: 'missing rides' };
    const was = AF.mode, P = AF.player, save = P ? { x: P.x, y: P.y, z: P.z } : null;
    let wheel = false, coaster = false;
    try {
      AF.setMode('funride', { ride: 'wheel' }); const y0 = wheelSeat(RD.cur, new THREE.Vector3()).y;
      for (let i = 0; i < 60; i++) { L.hbUpdate(1 / 30, i / 30); AF.modes.funride.update(1 / 30); }
      wheel = AF.mode === 'funride' && RD.cur.done > 0 && wheelSeat(RD.cur, new THREE.Vector3()).y > y0;
      AF.setMode('walk');
      AF.setMode('funride', { ride: 'coaster' }); const s0 = L.coaster.st.s;
      for (let i = 0; i < 150; i++) { L.hbUpdate(1 / 30, i / 30); AF.modes.funride.update(1 / 30); }
      coaster = AF.mode === 'funride' && RD.cur.done > 0 && L.coaster.st.s !== s0;
    } finally { AF.setMode(was || 'walk'); if (save && P.teleport) P.teleport(save.x, save.y, save.z); }
    return { ok: wheel && coaster, info: `wheel ${wheel}, coaster ${coaster}` };
  });
}
} catch (e) { AF.partError('16-rides.js', e); }
