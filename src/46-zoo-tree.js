// ================================================================ 46-zoo-tree.js
try {
// ===== 46-zoo-tree: THE TREETOP TRAIL — the zoo's north-east annex: the Great Banyan (a 25 m voxel tree), a treehouse deck round its
//       trunk reached by a switchback boardwalk, a spiral stair to the lookout under the canopy, a rope bridge to the Fig's deck and a
//       fireman's pole back down. All static voxels (meshed with the city, no draws of its own); the leaves don't block you.  (OWNER: west) =====
{
  const P = AF.PLAN, W = AF.W, ZOO = P.west.zoo, PI = Math.PI;
  const A = ZOO.annex;                                     // [x0, z0, x1, z1]
  const T = { x: -421, z: -268 }, F = { x: -400, z: -268 }; // the Great Banyan, the Fig
  const D1 = 6, D2 = 11.5;                                 // deck tops (m)
  const TT = ZOO.treetop = { T, F, D1, D2, poleAt: { x: F.x + 4.75, z: F.z } };
  const ang = (x, z, c) => Math.atan2(z - c.z, x - c.x);
  AF.onBuild('west-zoo-tree', 314, () => {
    const K = AF.westKit, col = K.col, glow = K.glow, t0 = performance.now();
    const bark = [col(0x6b4a30, { jitter: 0.5 }), col(0x5a3d26, { jitter: 0.5 }), col(0x7a5638, { jitter: 0.5 })];
    const leaf = [col(0x4f8a34, { jitter: 0.5, solid: false }), col(0x3f7a2c, { jitter: 0.5, solid: false }), col(0x62983c, { jitter: 0.5, solid: false })];
    const plank = [col(0xa8784a, { pat: 'plank', jitter: 0.35 }), col(0x9a6c40, { pat: 'plank', jitter: 0.35 })], rope = col(0xd8c08a, { jitter: 0.2 }), post = col(0x5a3d26, { jitter: 0.3 });
    const stone = col(0xb8ad98, { pat: 'stone', jitter: 0.4 }), cap = col(0x8a8272, { jitter: 0.3 }), mulch = [col(0x7a5a3a, { jitter: 0.8 }), col(0x6a4a2e, { jitter: 0.8 })], lawn = [col(0x6f9a3e, { jitter: 0.9 }), col(0x7da646, { jitter: 0.9 })];
    const flag = [col(0x9c9a84, { pat: 'none', jitter: 0.35 }), col(0xa8a48e, { pat: 'none', jitter: 0.35 }), col(0x90947c, { pat: 'none', jitter: 0.35 })];
    const [ax0, az0, ax1, az1] = A, H = W.H, C = W.C;
    // ---- ground: lawn, a mulch trail from the gate to the ramp and round both trees; the walk inside the zoo up the bears' east side
    W.eachCol(ax0, az0, ax1, az1, (bx, bz, i, x, z) => {
      H[i] = 1; W.S[i] = 0;
      const trail = (z > -251 && z < -246 && x < -443) || Math.hypot(x - T.x, z - T.z) < 9.5 || Math.hypot(x - F.x, z - F.z) < 6.5 || (Math.abs(z + 268) < 1.6 && x > T.x && x < F.x) || (x > -449 && x < -443 && z > -262 && z < -246);
      C[i] = trail ? mulch[(bx ^ bz) & 1] : lawn[AF.noise2(x * 0.08, z * 0.08) < 0.5 ? 0 : 1];
    });
    W.eachCol(-454.5, -262, -449, -158.5, (bx, bz, i, x, z) => { H[i] = 1; C[i] = flag[Math.floor(AF.hash2(Math.floor(x / 1.1), Math.floor(z / 1.1)) * 3)]; });
    W.tDirty = true;
    // ---- walls: the annex closes on the zoo's east wall; a gap opens into it from the bears' walk
    const wall = (a, b, c, d) => { W.fill(a, 0.25, b, c, 2.75, d, stone); W.fill(a, 2.75, b, c, 3.0, d, cap); };
    wall(ax0, az0, ax1, az0 + 0.5); wall(ax1 - 0.5, az0, ax1, az1); wall(ax0, az1 - 0.5, ax1, az1); wall(ax0 - 0.5, az0, ax0, ZOO.z0 + 0.5);
    W.clear(ax0 - 0.75, 0.25, -262, ax0 + 0.25, 3.25, -256);
    for (const z of [-262.5, -256]) { W.fill(ax0 - 0.75, 0.25, z, ax0 + 0.25, 4, z + 0.5, post); }
    W.fill(ax0 - 0.75, 4, -262.5, ax0 + 0.25, 4.5, -255.5, post);
    AF.placeStatic(K.text('TREETOP TRAIL', 0xf2e6c4, { font: 'deco', vs: 1 / 12, k: 1.8 }), ax0 - 0.85, 3.35, -259.25, 3, { collide: false });
    // ---- a trunk: a hollow bark cylinder flaring into roots; limbs; a canopy of leaf shells
    const trunk = (c, r0, top) => {
      for (let y = 0.25; y < top; y += 0.25) {
        const r = r0 + Math.max(0, 2.5 - y) * 0.55 + Math.sin(y * 0.7) * 0.12, ri = Math.max(0, r - 0.75);
        W.eachCol(c.x - r - 0.5, c.z - r - 0.5, c.x + r + 0.5, c.z + r + 0.5, (bx, bz, i, x, z) => {
          const d = Math.hypot(x - c.x, z - c.z) + (AF.hash2(bx >> 2, bz >> 2) - 0.5) * 0.25;
          if (d <= r && d >= ri) W.fill(x - 0.125, y, z - 0.125, x + 0.125, y + 0.25, z + 0.125, bark[(Math.floor(y * 1.3) + (bx >> 1)) % 3]);
        });
      }
    };
    const limb = (x0, y0, z0, x1, y1, z1, r) => { const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0, z1 - z0) / 0.25); for (let k = 0; k <= n; k++) { const u = k / n, x = AF.lerp(x0, x1, u), y = AF.lerp(y0, y1, u), z = AF.lerp(z0, z1, u), rr = r * (1 - u * 0.4); W.fill(x - rr, y - rr, z - rr, x + rr, y + rr, z + rr, bark[k % 3]); } };
    const blob = (cx, cy, cz, rx, ry, rz) => {
      for (let y = cy - ry; y <= cy + ry; y += 0.25) W.eachCol(cx - rx, cz - rz, cx + rx, cz + rz, (bx, bz, i, x, z) => {
        const e = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 + ((z - cz) / rz) ** 2 + (AF.noise2(x * 0.35 + y * 0.2, z * 0.35) - 0.5) * 0.35;
        if (e <= 1 && e > 0.62) W.setM(x, y + 0.125, z, leaf[AF.noise2(x * 0.12 + 7, (z + y) * 0.12) < 0.42 ? 1 : AF.noise2(x * 0.2, z * 0.2 + y * 0.1) < 0.62 ? 0 : 2]);
      });
    };
    trunk(T, 2.6, 22); trunk(F, 1.3, 14);
    // the limbs leave the trunk above the lookout's headroom (they used to cross the ring at head height and wall it off)
    for (const [a, l, h] of [[0.4, 7, 15.5], [2.1, 6.5, 16.5], [3.6, 7.5, 15.5], [5.1, 6, 17]]) limb(T.x + Math.cos(a) * 2, 14.25, T.z + Math.sin(a) * 2, T.x + Math.cos(a) * l, h, T.z + Math.sin(a) * l, 0.5);
    for (const [dx, y, dz, r] of [[0, 21, 0, 8.5], [5.5, 17.5, 3, 6.5], [-5.5, 18, -2, 6.5], [2, 18.5, -6, 6], [-3, 17, 6, 6]]) blob(T.x + dx, y, T.z + dz, r, r * 0.62, r);
    for (const [dx, y, dz, r] of [[0, 15, 0, 5], [2.5, 13.5, 1.5, 3.5]]) blob(F.x + dx, y, F.z + dz, r, r * 0.6, r);
    // parrots on the limb tips (a few bright blocks)
    for (const [a, l, h, c1, c2] of [[0.4, 7, 15, 0xd8322a, 0xf2c24a], [2.1, 6.5, 16.5, 0x2f8a4a, 0xf2c24a], [3.6, 7.5, 14.5, 0x2f6ad8, 0xf2e6c4], [5.1, 6, 17, 0xd8322a, 0x2f6ad8]]) {
      const x = T.x + Math.cos(a) * (l - 0.5), z = T.z + Math.sin(a) * (l - 0.5);
      W.fill(x - 0.125, h + 0.25, z - 0.125, x + 0.125, h + 0.75, z + 0.125, col(c1, { jitter: 0.1 })); W.setM(x, h + 0.875, z, col(c2, { jitter: 0.1 }));
    }
    // ---- a deck: a plank disc (rings of two tones), a rope rail at 1 m on posts, gaps where paths join it
    const deck = (c, r, top, gaps) => {
      const open = (a) => gaps.some((g) => Math.abs(AF.angDiff(a, g[0])) < g[1]);
      W.eachCol(c.x - r, c.z - r, c.x + r, c.z + r, (bx, bz, i, x, z) => {
        const d = Math.hypot(x - c.x, z - c.z); if (d > r) return;
        W.fill(x - 0.125, top - 0.25, z - 0.125, x + 0.125, top, z + 0.125, plank[Math.floor(d / 0.75) & 1]);
        if (d > r - 0.3 && !open(ang(x, z, c))) W.setM(x, top + 0.875, z, rope);
      });
      const n = Math.round(r * PI * 2 / 1.8);
      for (let k = 0; k < n; k++) { const a = k / n * PI * 2; if (open(a)) continue; const x = c.x + Math.cos(a) * (r - 0.15), z = c.z + Math.sin(a) * (r - 0.15); W.fill(x - 0.125, top, z - 0.125, x + 0.125, top + 1, z + 0.125, post); }
      for (const [dx, dz] of [[r * 0.6, r * 0.6], [-r * 0.6, r * 0.6], [r * 0.6, -r * 0.6], [-r * 0.6, -r * 0.6]]) W.fill(c.x + dx - 0.125, 0.25, c.z + dz - 0.125, c.x + dx + 0.125, top - 0.25, c.z + dz + 0.125, post);
    };
    const rampA = ang(-426.5, -264.5, T), bridgeA = 0, stairEnd = PI * 0.5;
    deck(T, 7, D1, [[rampA, 0.32], [bridgeA, 0.18]]);
    deck(F, 4, D1, [[PI, 0.3], [0, 0.3]]);
    // the treehouse on the north-west of the big deck (clear of the stair, the ramp and the bridge): a cabin, a pitched roof, a
    // doorway onto the deck on its east side, a window west
    { const cx = T.x - 2.8, cz = T.z - 3.9, wd = col(0xc89a62, { pat: 'plank', jitter: 0.3 }), roof = col(0x8a3a2a, { jitter: 0.3 });
      W.walls(cx - 1.5, D1, cz - 1.5, cx + 1.5, D1 + 2.5, cz + 1.5, wd); W.clear(cx + 1.25, D1, cz - 0.5, cx + 1.5, D1 + 2, cz + 0.5);
      W.fill(cx - 1.5, D1 + 1, cz - 0.5, cx - 1.25, D1 + 1.75, cz + 0.5, col(0xa9c9d6, { glass: true, jitter: 0.03, edge: 0 }));
      for (let k = 0; k < 7; k++) W.fill(cx - 1.75 + k * 0.25, D1 + 2.5 + k * 0.25, cz - 1.75, cx + 1.75 - k * 0.25, D1 + 2.75 + k * 0.25, cz + 1.75, roof);
      W.fill(cx - 1.25, D1, cz - 1.25, cx + 0.75, D1 + 0.5, cz - 0.75, wd);
      W.setM(cx, D1 + 2.25, cz, glow(0xffd890, 2, 'night')); }
    // ---- the switchback boardwalk: leg A east along z -249 (0.25 m up per metre), a landing, leg B north onto the deck
    const ramp = (x0, z0, x1, z1, top, rails) => { W.fill(x0, top - 0.25, z0, x1, top, z1, plank[(Math.round(x0 + z0) & 1)]); for (const [px, pz] of rails) { W.fill(px - 0.125, 0.25, pz - 0.125, px + 0.125, top + 1, pz + 0.125, post); W.setM(px, top + 0.875, pz, rope); } };
    for (let k = 0; k < 18; k++) { const x = -446 + k, top = 0.25 + 0.25 * (k + 1); ramp(x, -250, x + 1, -248, top, k % 2 ? [] : [[x + 0.125, -250.125], [x + 0.125, -247.875]]); for (const z of [-250.125, -247.875]) W.setM(x + 0.5, top + 0.875, z, rope); }
    ramp(-428, -251.5, -425, -247.5, 4.75, [[-427.875, -247.625], [-425.125, -247.625], [-425.125, -251.375]]);
    for (let k = 0; k < 5; k++) { const z1 = -251.5 - k * 2.9, top = 4.75 + 0.25 * (k + 1); ramp(-427.5, z1 - 2.9, -425.5, z1, top, [[-427.625, z1 - 0.125], [-425.375, z1 - 0.125]]); for (let z = z1 - 2.9; z < z1; z += 0.25) { W.setM(-427.625, top + 0.875, z, rope); W.setM(-425.375, top + 0.875, z, rope); } }
    // ---- the spiral stair outside the trunk, from the big deck up to the lookout ring under the canopy
    const steps = (D2 - D1) / 0.25, a0 = stairEnd - steps * 0.11;
    for (let s = 0; s < steps; s++) {
      const top = D1 + 0.25 * (s + 1), a = a0 + s * 0.11;
      for (let r = 4.75; r <= 6.25; r += 0.2) for (let da = 0; da <= 0.11; da += 0.02) { const x = T.x + Math.cos(a + da) * r, z = T.z + Math.sin(a + da) * r; W.fill(x - 0.125, top - 0.25, z - 0.125, x + 0.125, top, z + 0.125, plank[s & 1]); }
      if (s % 3 === 0) { const x = T.x + Math.cos(a) * 6.4, z = T.z + Math.sin(a) * 6.4; W.fill(x - 0.125, top, z - 0.125, x + 0.125, top + 1, z + 0.125, post); }
    }
    // the lookout ring: 2 m wide round the trunk, 3 m where no stair runs underneath it (the sniper's perch on the west side)
    const ringR = (a) => { const u = AF.angDiff(stairEnd, a); return u > -1.3 && u < 0.3 ? 4.5 : 5.5; };
    W.eachCol(T.x - 5.5, T.z - 5.5, T.x + 5.5, T.z + 5.5, (bx, bz, i, x, z) => {
      const d = Math.hypot(x - T.x, z - T.z), a = ang(x, z, T), R = ringR(a); if (d > R || d < 2.5) return;
      W.fill(x - 0.125, D2 - 0.25, z - 0.125, x + 0.125, D2, z + 0.125, plank[Math.floor(d / 0.75) & 1]);
      if (d > R - 0.3 && Math.abs(AF.angDiff(a, stairEnd)) > 0.3) W.setM(x, D2 + 0.875, z, rope);
    });
    for (let k = 0; k < 18; k++) { const a = k / 18 * PI * 2; if (Math.abs(AF.angDiff(a, stairEnd)) < 0.3) continue; const r = ringR(a) - 0.15, x = T.x + Math.cos(a) * r, z = T.z + Math.sin(a) * r; W.fill(x - 0.125, D2, z - 0.125, x + 0.125, D2 + 1, z + 0.125, post); }
    // ---- the rope bridge (every fourth board missing: you can't fall through a quarter-metre gap) + the Fig's fireman's pole
    for (let x = -414.5; x < F.x - 3.5; x += 0.25) { const n = Math.round(x * 4) & 3; if (n !== 3) W.fill(x, D1 - 0.25, -269, x + 0.25, D1, -267, plank[n & 1]); }
    for (let x = -414.5; x < F.x - 3.5; x += 0.25) for (const z of [-269.25, -266.75]) { W.setM(x, D1 + 0.875, z, rope); if ((Math.round(x * 4) & 7) === 0) W.fill(x, D1 - 0.25, z - 0.125, x + 0.25, D1 + 1, z + 0.125, post); }
    W.fill(TT.poleAt.x - 0.125, 0.25, TT.poleAt.z - 0.125, TT.poleAt.x + 0.125, D1 + 1.5, TT.poleAt.z + 0.125, col(0xc8c8c0, { metal: 0.85, rough: 0.3 }));
    // lanterns
    for (const [x, z, y] of [[T.x - 6, T.z + 2, D1 + 1.25], [T.x + 2, T.z + 6.5, D1 + 1.25], [F.x + 3.5, F.z - 1, D1 + 1.25], [T.x - 5.35, T.z + 0.6, D2 + 1.25], [-440, -251, 2.25], [-428, -248, 5.75]]) W.setM(x, y, z, glow(0xffc870, 2.2, 'night'));
    AF.addLight({ x: T.x, y: D1 + 2, z: T.z + 5, color: 0xffd090, intensity: 1, range: 12, kind: 'street' });
    AF.addLight({ x: F.x, y: D1 + 2, z: F.z, color: 0xffd090, intensity: 0.8, range: 9, kind: 'street' });
    AF.addBuilding({ id: 'zoo-treetop', name: 'Treetop Trail', kind: 'zoo', box: [ax0, 0, az0, ax1, 26, az1], doors: [], interior: false, owner: 'west', label: true });
    AF.addLabel('The Great Banyan', T.x, T.z, 'place');
    TT.ms = Math.round(performance.now() - t0);
  });
  AF.onBuild('west-zoo-tree-life', 899, () => {
    const p = TT.poleAt;
    AF.addInteract({ x: p.x, y: D1 + 1, z: p.z, r: 1.8, prio: 1.2, label: 'Slide down the fireman\u2019s pole', can: () => AF.mode === 'walk' && AF.player.y > D1 - 0.5,
      act: () => { AF.player.teleport(p.x, 0.25, p.z + 0.9, PI); if (AF.audio) AF.audio.play('swing'); AF.emit('toast', { text: 'Wheee! Back on the ground.', kind: 'ok' }); } });
    AF.addInteract({ x: T.x, y: D2 + 1, z: T.z + 3.5, r: 2.4, prio: 0.3, label: 'Look out over the zoo', can: () => AF.mode === 'walk' && AF.player.y > D2 - 0.5,
      act: () => AF.emit('dialogue', { name: 'The Great Banyan', role: 'Treetop Trail \u00b7 Solace Zoo', lines: ['Twenty-five metres of fig, planted the year the zoo opened.', 'From up here you can see the bears\u2019 den, the deer woods \u2014 and on a clear day, Serena Isle.'] }) });
    if (AF.npc) AF.npc.spawn({ id: 'zoo-ranger-tree', name: 'Rowan', role: 'Treetop ranger', x: -444, y: 0.25, z: -253, yaw: PI / 2, visual: false, lines: [['Up the boardwalk, round the trunk, over the rope bridge and down the pole. Mind your head under the leaves!']] });
  });
  AF.test('zoo: the Treetop Trail climbs from the gate to the lookout and the bridge holds', () => {
    const fail = [];
    // walk the boardwalk: every metre of both legs has a plank under you and head room above
    for (let k = 0; k < 18; k++) { const x = -445.5 + k, y = AF.surfaceBelow(x, -249, 8, 9); if (Math.abs(y - (0.5 + 0.25 * k)) > 0.3) fail.push('legA ' + k + ' y ' + y); }
    for (let z = -252; z > -265; z -= 1) { const y = AF.surfaceBelow(-426.5, z, 8, 9); if (y < 4.6 || y > 6.1) fail.push('legB ' + z + ' y ' + y); }
    const deck = AF.surfaceBelow(T.x - 5, T.z, D1 + 1, 3), look = AF.surfaceBelow(T.x - 3.5, T.z, D2 + 1, 3), bridge = AF.surfaceBelow(-409, -268, D1 + 1, 3), fig = AF.surfaceBelow(F.x + 2, F.z, D1 + 1, 3);
    if (Math.abs(deck - D1) > 0.01) fail.push('deck ' + deck); if (Math.abs(look - D2) > 0.01) fail.push('lookout ' + look); if (Math.abs(bridge - D1) > 0.01) fail.push('bridge ' + bridge); if (Math.abs(fig - D1) > 0.01) fail.push('fig ' + fig);
    if (AF.boxBlocked(-449, 0.25, -259, 0.3, 1.7)) fail.push('gate blocked');
    // a body walks up the spiral from the big deck to the lookout
    const a0 = PI * 0.5 - ((D2 - D1) / 0.25) * 0.11, b = { x: T.x + Math.cos(a0 - 0.15) * 5.5, y: D1, z: T.z + Math.sin(a0 - 0.15) * 5.5, vy: 0, r: 0.3, h: 1.7, onGround: true };
    for (let i = 0; i < 400 && b.y < D2 - 0.01; i++) { const a = Math.atan2(b.z - T.z, b.x - T.x) + 0.25, tx = T.x + Math.cos(a) * 5.5, tz = T.z + Math.sin(a) * 5.5; AF.moveBody(b, (tx - b.x) * 0.15, (tz - b.z) * 0.15, 1 / 30, { step: 0.55 }); }
    if (b.y < D2 - 0.01) fail.push('spiral stops at ' + b.y.toFixed(2));
    return { ok: !fail.length, info: fail.slice(0, 6).join(', ') || 'boardwalk, decks, lookout, bridge ok; build ' + TT.ms + ' ms' };
  });
}
} catch (e) { AF.partError('46-zoo-tree.js', e); }
