// ================================================================ 04-vehicle.js
try {
// ===== AF.Vehicle: what every player-rideable vehicle shares (cars / bikes 50, planes 52, jet skis 44-island)
// - pose fields x, y, z, yaw, pitch, roll, v (m/s along the heading) and a name
// - ONE boarding prompt that follows the vehicle wherever it was left (attach / sync), so it can always be ridden again
// - Vehicle.input(): keyboard + touch stick read once into a shared object (no per-frame allocation): thr -1..1, steer -1..1 (right +),
//   brake, boost, exit (E/F pressed), modal (a menu is open: everything zero)
// - Vehicle.Chase: the chase camera (rigid position, smoothed heading / height / boom, mouse orbit, wheel zoom, pulled in front of walls)
// - Vehicle.landing(x, z, ...): nearest dry, unblocked spot to hop off onto
// - Vehicle.all: every vehicle, for central queries
{
  class Vehicle {
    constructor(o = {}) {
      this.name = o.name || 'vehicle'; this.x = o.x ?? 0; this.y = o.y ?? 0; this.z = o.z ?? 0; this.yaw = o.yaw ?? 0;
      this.pitch = 0; this.roll = 0; this.v = 0; this.interact = null; this.lift = 0.6;
      Vehicle.all.push(this);
    }
    // the boarding prompt; dist(px, pz) may measure to the body instead of the centre; reach(vehicle) may widen r (e.g. left off its berth)
    attach(o) {
      this.lift = o.lift ?? this.lift; this.reach = o.reach || null;
      this.interact = AF.addInteract({ x: this.x, y: this.y + this.lift, z: this.z, r: o.r ?? 2.2, label: o.label, prio: o.prio ?? 0.1, dist: o.dist, can: o.can, act: o.act });
      this.r0 = this.interact.r;
      return this.interact;
    }
    sync() {
      const it = this.interact; if (!it) return;
      it.x = this.x; it.z = this.z; it.y = this.y + this.lift;
      if (this.reach) { const r = this.reach(this); it.r = r || this.r0; if (r) it.y = undefined; }   // a wide reach ignores height (a beach above a ski)
    }
  }
  Vehicle.all = [];

  const IN = Vehicle.IN = { thr: 0, steer: 0, brake: false, boost: false, exit: false, modal: false };
  Vehicle.input = () => {
    const I = AF.input, S = I.stick, modal = !!(AF.ui && AF.ui.modalOpen && AF.ui.modalOpen());
    IN.modal = modal;
    if (modal) { IN.thr = IN.steer = 0; IN.brake = IN.boost = IN.exit = false; return IN; }
    IN.thr = (I.key('KeyW') || I.key('ArrowUp') ? 1 : 0) - (I.key('KeyS') || I.key('ArrowDown') ? 1 : 0);
    IN.steer = (I.key('KeyD') || I.key('ArrowRight') ? 1 : 0) - (I.key('KeyA') || I.key('ArrowLeft') ? 1 : 0);
    // touch stick: analog throttle past a dead zone, and a soft (squared) steering curve so a wobbling thumb doesn't twitch
    if (S && (S.x || S.y)) {
      IN.thr = S.y > 0.18 ? Math.min(1, 0.35 + (S.y - 0.18) / 0.55) : S.y < -0.4 ? -1 : 0;
      const ax = Math.max(0, Math.abs(S.x) - 0.14) / 0.72, st = Math.min(1, ax * ax * 0.6 + ax * 0.4);
      IN.steer = S.x < 0 ? -st : st;
    }
    IN.brake = I.key('Space'); IN.boost = I.key('ShiftLeft') || I.key('ShiftRight');
    IN.exit = I.hit('KeyE') || I.hit('KeyF');
    return IN;
  };

  // chase camera: follows the vehicle's position rigidly; only heading, height and boom length are smoothed (a world-space lerp lagged
  // metres behind at speed and stuttered whenever the frame time varied). floor(x, z) = lowest camera height there.
  class Chase {
    constructor(o = {}) { this.want = new THREE.Vector3(); this.look = new THREE.Vector3(); this.set(o); }
    set(o = {}) {
      this.dist = o.dist ?? 8.5; this.height = o.height ?? 1.3; this.ahead = o.ahead ?? 1.5; this.floor = o.floor || null; this.radius = o.shadow ?? 60;
      this.orbit = 0; this.orbitP = 0; this.dragT = 0; this.init = false;
      return this;
    }
    update(dt, x, y, z, yaw) {
      const m = AF.input.mouse;
      if ((document.pointerLockElement || (m.buttons & 1)) && (m.dx || m.dy)) { this.orbit = (this.orbit - m.dx * 0.006) % (Math.PI * 2); this.orbitP = AF.clamp(this.orbitP + m.dy * 0.004, -0.25, 0.9); this.dragT = 1.5; }
      else if ((this.dragT -= dt) < 0) { this.orbit *= Math.exp(-dt * 1.8); this.orbitP *= Math.exp(-dt * 1.8); }
      if (m.wheel) this.dist = AF.clamp(this.dist * Math.exp(m.wheel * 0.001), 4, 28);
      const first = !this.init;
      if (first) { this.cyaw = yaw; this.cy = y; this.cd = this.dist; }
      this.cyaw += AF.angDiff(this.cyaw, yaw) * (1 - Math.exp(-dt * 4.5));
      this.cy += (y - this.cy) * (1 - Math.exp(-dt * 6));
      const a = this.cyaw + this.orbit, pitch = 0.2 + this.orbitP + this.dist * 0.004, cp = Math.cos(pitch), sp = Math.sin(pitch);
      const tx = x + Math.sin(yaw) * this.ahead, ty = this.cy + this.height, tz = z + Math.cos(yaw) * this.ahead;
      let d = this.dist;
      // keep the camera out of walls: pull in fast, ease back out
      for (let t = 0.25; t <= 1.0001; t += 0.125) {
        const dd = d * t;
        if (AF.solidAt(tx - Math.sin(a) * cp * dd, ty + sp * dd, tz - Math.cos(a) * cp * dd)) { d = Math.max(1.2, d * Math.max(0.12, t - 0.15)); break; }
      }
      this.cd = first ? d : this.cd + (d - this.cd) * (1 - Math.exp(-dt * (d < this.cd ? 14 : 2.5)));
      this.init = true;
      const cam = AF.camera;
      cam.position.set(tx - Math.sin(a) * cp * this.cd, ty + sp * this.cd, tz - Math.cos(a) * cp * this.cd);
      const low = this.floor ? this.floor(cam.position.x, cam.position.z) : AF.W.groundY(cam.position.x, cam.position.z) + 0.4;
      if (cam.position.y < low) cam.position.y = low;
      this.look.set(tx, ty, tz); cam.up.set(0, 1, 0); cam.lookAt(this.look);
      if (AF.camTarget) AF.camTarget.copy(this.look);
      AF.shadowFocus.set(x, y, z); AF.shadowRadius = this.radius;
    }
  }
  Vehicle.Chase = Chase;

  // nearest spot within maxR of (x, z) whose surface is above minY and leaves room to stand (rings of 16 directions)
  const RINGS = [2, 3.5, 5, 6.5, 8, 10], SPOT = { x: 0, y: 0, z: 0, r: 0 };
  Vehicle.landing = (x, z, minY, top = 8, maxR = 10) => {
    let found = false;
    for (const r of RINGS) {
      if (r > maxR) break;
      for (let a = 0; a < 16; a++) {
        const px = x + Math.sin(a / 16 * Math.PI * 2) * r, pz = z + Math.cos(a / 16 * Math.PI * 2) * r, gy = AF.surfaceBelow(px, pz, top, 12);
        if (Number.isFinite(gy) && gy > minY && !AF.boxBlocked(px, gy + 0.3, pz, 0.3, 1.5)) { SPOT.x = px; SPOT.y = gy; SPOT.z = pz; SPOT.r = r; found = true; break; }
      }
      if (found) return SPOT;
    }
    return null;
  };
  Vehicle.hud = (v, name, extra = '') => { const kmh = Math.abs(v) * 3.6; AF.emit('hud', { mode: 'drive', speed: Math.round(kmh / 1.609), unit: 'mph', kmh: Math.round(kmh), car: name + extra, gear: v < -0.3 ? 'R' : 'D' }); };
  AF.Vehicle = Vehicle;
}
} catch (e) { AF.partError('04-vehicle.js', e); }
