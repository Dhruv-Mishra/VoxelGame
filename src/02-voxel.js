// ================================================================ 02-voxel.js
try {
// ===== 02-voxel: world grid, heightmap, models, meshers, material, collision  (OWNER: coordinator) =====
// Units: metres. Block (voxel) = 0.25 m. World x in [-660, 460), z in [-300, 300), y in [-16, 160). The strip west of x -300 is the
// new west side (New Friends Colony, the zoo, the airfield); east of x 300 is Eastport (the Solace River). Ground is a HEIGHTMAP of block columns (W.H, W.C); everything standing on it is VOXELS.
const VS = 0.25, INV = 4;
const NX = 4480, NY = 704, NZ = 2400, CS = 16;
const X0 = -660, Y0 = -16, Z0 = -300;
const CX = NX / CS, CY = NY / CS, CZ = NZ / CS;
const W = AF.W = { VS, NX, NY, NZ, X0, Y0, Z0, CS, x1: X0 + NX * VS, z1: Z0 + NZ * VS };
W.chunks = new Array(CX * CY * CZ).fill(null);
const uniformChunks = new Map(), sharedChunks = new WeakSet(), compactPending = new Set();
let compactEnabled = false;
const chunkValue = (chunk, index) => !chunk ? 0 : !chunk.pal ? chunk[index] : chunk.pal[chunk.bits === 4 ? (chunk.idx[index >> 1] >> ((index & 1) * 4)) & 15 : chunk.idx[index]];
const expandChunk = (chunk) => {
  const dense = new Uint16Array(4096);
  for (let index = 0; index < 4096; index++) dense[index] = chunkValue(chunk, index);
  return dense;
};
const compactChunk = (key) => {
  const chunk = W.chunks[key];
  compactPending.delete(key);
  if (!chunk || chunk.pal || sharedChunks.has(chunk)) return;
  const palette = [], lookup = new Map();
  for (let index = 0; index < 4096; index++) {
    const value = chunk[index];
    if (!lookup.has(value)) { lookup.set(value, palette.length); palette.push(value); if (palette.length > 256) return; }
  }
  if (palette.length === 1) {
    const value = palette[0];
    if (!value) { W.chunks[key] = null; return; }
    let shared = uniformChunks.get(value);
    if (!shared) { shared = new Uint16Array(4096).fill(value); uniformChunks.set(value, shared); sharedChunks.add(shared); }
    W.chunks[key] = shared;
    return;
  }
  const bits = palette.length <= 16 ? 4 : 8, indices = new Uint8Array(bits === 4 ? 2048 : 4096);
  for (let index = 0; index < 4096; index++) {
    const value = lookup.get(chunk[index]);
    if (bits === 4) indices[index >> 1] |= value << ((index & 1) * 4); else indices[index] = value;
  }
  W.chunks[key] = { pal: new Uint16Array(palette), idx: indices, bits };
};
W.compactChunks = () => {
  let samples = 0, mismatches = 0;
  for (let key = 0; key < W.chunks.length; key++) {
    const chunk = W.chunks[key];
    if (chunk && samples < 8192 && key % 7 === 0) {
      const index = (key * 53) & 4095, before = chunkValue(chunk, index);
      compactChunk(key);
      const column = Math.floor(key / CZ), bx = (Math.floor(column / CY) << 4) + (index >> 8), by = ((column % CY) << 4) + ((index >> 4) & 15), bz = ((key % CZ) << 4) + (index & 15);
      if (W.get(bx, by, bz) !== before) mismatches++;
      samples++;
    } else compactChunk(key);
  }
  AF.chunkCompactionCheck = { samples, mismatches };
  compactEnabled = true;
};
W.H = new Int16Array(NX * NZ);        // ground top in blocks above y=0 (top surface y = H*0.25)
W.C = new Uint16Array(NX * NZ);       // top colour index
W.S = new Uint16Array(NX * NZ);       // side colour index (0 = use top colour for the top block, dirt below)
W.C.fill(AF.col('grass'));
const GOFF = -Y0 * INV;               // block index (by) of the cell sitting just above y=0

W.bx = (x) => Math.floor((x - X0) * INV);
W.by = (y) => Math.floor((y - Y0) * INV);
W.bz = (z) => Math.floor((z - Z0) * INV);
W.xOf = (bx) => X0 + bx * VS; W.yOf = (by) => Y0 + by * VS; W.zOf = (bz) => Z0 + bz * VS;

W.get = (bx, by, bz) => {
  if (bx < 0 || by < 0 || bz < 0 || bx >= NX || by >= NY || bz >= NZ) return 0;
  const ch = W.chunks[((bx >> 4) * CY + (by >> 4)) * CZ + (bz >> 4)];
  return chunkValue(ch, ((bx & 15) * 16 + (by & 15)) * 16 + (bz & 15));
};
W.set = (bx, by, bz, c) => {
  if (bx < 0 || by < 0 || bz < 0 || bx >= NX || by >= NY || bz >= NZ) return;
  const ci = ((bx >> 4) * CY + (by >> 4)) * CZ + (bz >> 4);
  let ch = W.chunks[ci];
  const index = ((bx & 15) * 16 + (by & 15)) * 16 + (bz & 15);
  if (chunkValue(ch, index) === c) return;
  if (!ch) { if (!c) return; ch = W.chunks[ci] = new Uint16Array(4096); }
  else if (ch.pal || sharedChunks.has(ch)) ch = W.chunks[ci] = expandChunk(ch);
  ch[index] = c;
  if (compactEnabled) compactPending.add(ci);
  W.dirty.add(((bx >> 7) * 64 + (bz >> 7)));
};
W.dirty = new Set();
// metre helpers. fill() is [x0,x1) etc, snapped to the block grid with Math.round.
W.setM = (x, y, z, c) => W.set(W.bx(x), W.by(y), W.bz(z), c);
W.getM = (x, y, z) => W.get(W.bx(x), W.by(y), W.bz(z));
W.fillB = (bx0, by0, bz0, bx1, by1, bz1, c) => {
  if (bx0 > bx1) [bx0, bx1] = [bx1, bx0]; if (by0 > by1) [by0, by1] = [by1, by0]; if (bz0 > bz1) [bz0, bz1] = [bz1, bz0];
  for (let x = bx0; x < bx1; x++) for (let y = by0; y < by1; y++) for (let z = bz0; z < bz1; z++) W.set(x, y, z, c);
};
const rb = (v, o) => Math.round((v - o) * INV);
W.fill = (x0, y0, z0, x1, y1, z1, c) => W.fillB(rb(x0, X0), rb(y0, Y0), rb(z0, Z0), rb(x1, X0), rb(y1, Y0), rb(z1, Z0), c);
W.clear = (x0, y0, z0, x1, y1, z1) => W.fill(x0, y0, z0, x1, y1, z1, 0);
// hollow box shell (walls only, no floor/ceiling) with thickness t metres
W.walls = (x0, y0, z0, x1, y1, z1, c, t = 0.25) => {
  W.fill(x0, y0, z0, x1, y1, z0 + t, c); W.fill(x0, y0, z1 - t, x1, y1, z1, c);
  W.fill(x0, y0, z0, x0 + t, y1, z1, c); W.fill(x1 - t, y0, z0, x1, y1, z1, c);
};

// ---- heightmap
W.col = (x, z) => { const bx = W.bx(x), bz = W.bz(z); return (bx < 0 || bz < 0 || bx >= NX || bz >= NZ) ? -1 : bx * NZ + bz; };
W.hB = (bx, bz) => (bx < 0 || bz < 0 || bx >= NX || bz >= NZ) ? 0 : W.H[bx * NZ + bz];
W.groundY = (x, z) => { const i = W.col(x, z); return i < 0 ? 0 : W.H[i] * VS; };
// set ground rect [x0,x1) x [z0,z1) to height hBlocks with top colour c (and optional side colour s)
W.ground = (x0, z0, x1, z1, hBlocks, c, s) => {
  const a = rb(Math.min(x0, x1), X0), b = rb(Math.max(x0, x1), X0), d = rb(Math.min(z0, z1), Z0), e = rb(Math.max(z0, z1), Z0);
  for (let bx = Math.max(0, a); bx < Math.min(NX, b); bx++) for (let bz = Math.max(0, d); bz < Math.min(NZ, e); bz++) {
    const i = bx * NZ + bz; if (hBlocks != null) W.H[i] = hBlocks; if (c) W.C[i] = c; if (s != null) W.S[i] = s;
  }
  W.tDirty = true;
};
// paint only the colour
W.paint = (x0, z0, x1, z1, c) => W.ground(x0, z0, x1, z1, null, c);
// per-column callback over a rect: fn(bx, bz, i, x, z)
W.eachCol = (x0, z0, x1, z1, fn) => {
  const a = Math.max(0, rb(x0, X0)), b = Math.min(NX, rb(x1, X0)), d = Math.max(0, rb(z0, Z0)), e = Math.min(NZ, rb(z1, Z0));
  for (let bx = a; bx < b; bx++) for (let bz = d; bz < e; bz++) fn(bx, bz, bx * NZ + bz, X0 + (bx + 0.5) * VS, Z0 + (bz + 0.5) * VS);
};

// ---------------------------------------------------------------- models (dense small voxel grids)
// const m = new AF.Model(w,h,d); m.set(x,y,z,c); m.box(x0,y0,z0,x1,y1,z1,c) [exclusive max]
// geometry = AF.meshModel(m, { vs: 1/16, anchor:[0.5,0,0.5] })   (anchor = fraction of size at the local origin)
class Model {
  constructor(w, h, d) { this.w = w; this.h = h; this.d = d; this.v = new Uint16Array(w * h * d); }
  idx(x, y, z) { return (x * this.h + y) * this.d + z; }
  in(x, y, z) { return x >= 0 && y >= 0 && z >= 0 && x < this.w && y < this.h && z < this.d; }
  get(x, y, z) { return this.in(x, y, z) ? this.v[(x * this.h + y) * this.d + z] : 0; }
  set(x, y, z, c) { x |= 0; y |= 0; z |= 0; if (this.in(x, y, z)) this.v[(x * this.h + y) * this.d + z] = c; return this; }
  box(x0, y0, z0, x1, y1, z1, c) {
    for (let x = Math.max(0, Math.min(x0, x1) | 0); x < Math.min(this.w, Math.max(x0, x1)); x++)
      for (let y = Math.max(0, Math.min(y0, y1) | 0); y < Math.min(this.h, Math.max(y0, y1)); y++)
        for (let z = Math.max(0, Math.min(z0, z1) | 0); z < Math.min(this.d, Math.max(z0, z1)); z++) this.v[(x * this.h + y) * this.d + z] = c;
    return this;
  }
  sphere(cx, cy, cz, r, c, fn) { // fn(x,y,z) optional filter/colour picker returning colour or 0
    for (let x = Math.floor(cx - r); x <= cx + r; x++) for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let z = Math.floor(cz - r); z <= cz + r; z++) {
      const dx = x + 0.5 - cx, dy = y + 0.5 - cy, dz = z + 0.5 - cz;
      if (dx * dx + dy * dy + dz * dz <= r * r) { const k = fn ? fn(x, y, z) : c; if (k) this.set(x, y, z, k); }
    }
    return this;
  }
  line(x0, y0, z0, x1, y1, z1, c, r = 0) {
    const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0))) + 1;
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, z = z0 + (z1 - z0) * t; if (r > 0) this.sphere(x, y, z, r, c); else this.set(Math.floor(x), Math.floor(y), Math.floor(z), c); }
    return this;
  }
  // mirror x: copy left half onto right half
  mirrorX() { for (let x = 0; x < this.w >> 1; x++) for (let y = 0; y < this.h; y++) for (let z = 0; z < this.d; z++) this.set(this.w - 1 - x, y, z, this.get(x, y, z)); return this; }
}
AF.Model = Model;

// stamp a Model into the WORLD grid: model voxel = world block. rot = 0..3 quarter turns about Y (around model origin corner).
// (x,y,z) metres = where model voxel (0,0,0)'s min corner lands (before rotation). skipAir default true.
W.stamp = (m, x, y, z, rot = 0, opts = {}) => {
  const bx = rb(x, X0), by = rb(y, Y0), bz = rb(z, Z0);
  for (let i = 0; i < m.w; i++) for (let j = 0; j < m.h; j++) for (let k = 0; k < m.d; k++) {
    const c = m.v[(i * m.h + j) * m.d + k]; if (!c && opts.skipAir !== false) continue;
    let u = i, w = k;
    if (rot === 1) { u = k; w = m.w - 1 - i; } else if (rot === 2) { u = m.w - 1 - i; w = m.d - 1 - k; } else if (rot === 3) { u = m.d - 1 - k; w = i; }
    W.set(bx + u, by + j, bz + w, c);
  }
};

// ---------------------------------------------------------------- geometry emission (shared by all meshers)
// Vertex layout: position(3) uv(2: block units, in-plane) aPal(1: palette index) aAN(1: riser*32 + ao*8 + normalIndex)
// riser = low same-colour terrain step: its normal bends to +y with distance so hillside terraces don't alias into moire
// normal index: 0 +x, 1 -x, 2 +y, 3 -y, 4 +z, 5 -z
class GeoBuf {
  constructor() { this.p = []; this.uv = []; this.pal = []; this.an = []; this.idx = []; this.n = 0; }
  quad(v0, v1, v2, v3, uv0, uv1, uv2, uv3, pal, nIdx, ao, fl = 0) { // v* = [x,y,z], ao = [a0..a3] 0..3 ; CCW when seen from outside
    const b = this.n;
    this.p.push(v0[0], v0[1], v0[2], v1[0], v1[1], v1[2], v2[0], v2[1], v2[2], v3[0], v3[1], v3[2]);
    this.uv.push(uv0[0], uv0[1], uv1[0], uv1[1], uv2[0], uv2[1], uv3[0], uv3[1]);
    this.pal.push(pal, pal, pal, pal);
    nIdx += fl;
    this.an.push(ao[0] * 8 + nIdx, ao[1] * 8 + nIdx, ao[2] * 8 + nIdx, ao[3] * 8 + nIdx);
    if (ao[0] + ao[2] < ao[1] + ao[3]) this.idx.push(b + 1, b + 2, b + 3, b + 1, b + 3, b);
    else this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    this.n += 4;
  }
  // allocation-free quad from scratch arrays: P (12 floats, corners 0..3), T (8 floats), order o0..o3 = corner indices, ao a0..a3 (coordinator perf)
  quadS(P, T, o0, o1, o2, o3, pal, nIdx, a0, a1, a2, a3) {
    const b = this.n, p = this.p, uv = this.uv, an = this.an;
    p.push(P[o0 * 3], P[o0 * 3 + 1], P[o0 * 3 + 2], P[o1 * 3], P[o1 * 3 + 1], P[o1 * 3 + 2], P[o2 * 3], P[o2 * 3 + 1], P[o2 * 3 + 2], P[o3 * 3], P[o3 * 3 + 1], P[o3 * 3 + 2]);
    uv.push(T[o0 * 2], T[o0 * 2 + 1], T[o1 * 2], T[o1 * 2 + 1], T[o2 * 2], T[o2 * 2 + 1], T[o3 * 2], T[o3 * 2 + 1]);
    this.pal.push(pal, pal, pal, pal);
    an.push(a0 * 8 + nIdx, a1 * 8 + nIdx, a2 * 8 + nIdx, a3 * 8 + nIdx);
    if (a0 + a2 < a1 + a3) this.idx.push(b + 1, b + 2, b + 3, b + 1, b + 3, b);
    else this.idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
    this.n += 4;
  }
  geometry() {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    // compact types (shader reads them as floats): 12 + 4 + 2 + 1 = 19 bytes per vertex
    g.setAttribute('aBU', new THREE.BufferAttribute(new Int16Array(this.uv), 2));
    g.setAttribute('aPal', new THREE.BufferAttribute(new Uint16Array(this.pal), 1));
    g.setAttribute('aAN', new THREE.BufferAttribute(new Uint8Array(this.an), 1));
    g.setIndex(this.n > 65535 ? new THREE.Uint32BufferAttribute(this.idx, 1) : new THREE.Uint16BufferAttribute(this.idx, 1));
    g.computeBoundingSphere(); g.computeBoundingBox();
    return g;
  }
}
AF.GeoBuf = GeoBuf;

// Greedy mesher over a padded dense grid accessor.
// dims [sx,sy,sz]; get(x,y,z) valid for -1..s (padding); scale (m per voxel); origin [ox,oy,oz] (metres of voxel 0 corner);
// uvOff [ux,uy,uz] added to voxel coords for uv continuity; out: {opaque:GeoBuf, glass:GeoBuf}
const AOK = [0, 1, 2, 3];
const QP = new Float64Array(12), QT = new Float64Array(8);
// pad: Uint16Array of (sx+2)*(sy+2)*(sz+2) with a 1-voxel border, index ((x+1)*(sy+2)+(y+1))*(sz+2)+(z+1).
// 65535 in the pad = "solid, never drawn" (underground). sliceCnt (optional): [[per-x count],[per-y],[per-z]] of drawable voxels.
function greedyPad(sx, sy, sz, pad, scale, origin, uvOff, out, flat, sliceCnt, uvScale = 1) {
  const P = AF.PAL, OP = P.opaque, GL = P.glass, dims = [sx, sy, sz];
  const SZ = sz + 2, SX = (sy + 2) * SZ, stride = [SX, SZ, 1];
  const I0 = SX + SZ + 1;
  for (let d = 0; d < 3; d++) {
    const u = (d + 1) % 3, v = (d + 2) % 3;
    const du = dims[u], dv = dims[v], su = stride[u], sv = stride[v], sd = stride[d];
    const mask = new Int32Array(du * dv);
    const cnt = sliceCnt ? sliceCnt[d] : null;
    for (let side = 0; side < 2; side++) {
      const dir = side === 0 ? 1 : -1, off = sd * dir;
      const nIdx = d * 2 + side;
      for (let k = 0; k < dims[d]; k++) {
        if (cnt && !cnt[k]) continue;
        let any = false;
        const base = I0 + k * sd;
        for (let j = 0; j < dv; j++) {
          const rowBase = base + j * sv, mrow = j * du;
          for (let i = 0; i < du; i++) {
            const idx = rowBase + i * su;
            const c = pad[idx];
            let key = 0;
            if (c !== 0 && c !== 65535) {
              const f = idx + off, nb = pad[f];
              const glass = GL[c] === 1;
              const visible = glass ? (nb === 0) : !(nb === 65535 || (nb !== 0 && OP[nb] === 1));
              if (visible) {
                let ao = 255;
                if (!glass && !flat) {
                  let t;
                  t = pad[f - su]; const s10 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f + su]; const s12 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f - sv]; const s01 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f + sv]; const s21 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f - su - sv]; const c00 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f + su - sv]; const c20 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f + su + sv]; const c22 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  t = pad[f - su + sv]; const c02 = (t === 65535 || (t !== 0 && OP[t] === 1)) ? 1 : 0;
                  const a0 = (s10 && s01) ? 0 : 3 - (s10 + s01 + c00), a1 = (s12 && s01) ? 0 : 3 - (s12 + s01 + c20);
                  const a2 = (s12 && s21) ? 0 : 3 - (s12 + s21 + c22), a3 = (s10 && s21) ? 0 : 3 - (s10 + s21 + c02);
                  ao = a0 | (a1 << 2) | (a2 << 4) | (a3 << 6);
                }
                key = (c << 8 | ao) + 1; any = true;
              }
            }
            mask[mrow + i] = key;
          }
        }
        if (!any) continue;
        const plane = k + (side === 0 ? 1 : 0);
        for (let j = 0; j < dv; j++) for (let i = 0; i < du;) {
          const key = mask[i + j * du];
          if (!key) { i++; continue; }
          const ab = (key - 1) & 255;
          const canU = ((ab & 3) === ((ab >> 2) & 3)) && (((ab >> 6) & 3) === ((ab >> 4) & 3));
          const canV = ((ab & 3) === ((ab >> 6) & 3)) && (((ab >> 2) & 3) === ((ab >> 4) & 3));
          let w = 1; if (canU) while (i + w < du && mask[i + w + j * du] === key) w++;
          let h = 1, done = false;
          while (canV && j + h < dv) { for (let q = 0; q < w; q++) if (mask[i + q + (j + h) * du] !== key) { done = true; break; } if (done) break; h++; }
          const c = (key - 1) >> 8;
          const q0 = ab & 3, q1 = (ab >> 2) & 3, q2 = (ab >> 4) & 3, q3 = (ab >> 6) & 3;
          // corners (i,j) (i+w,j) (i+w,j+h) (i,j+h) written into the scratch arrays without allocation
          const pd = origin[d] + plane * scale, ou = origin[u], ov = origin[v];
          const ua = ou + i * scale, ub = ou + (i + w) * scale, va = ov + j * scale, vb = ov + (j + h) * scale;
          QP[d] = QP[3 + d] = QP[6 + d] = QP[9 + d] = pd;
          QP[u] = ua; QP[v] = va; QP[3 + u] = ub; QP[3 + v] = va; QP[6 + u] = ub; QP[6 + v] = vb; QP[9 + u] = ua; QP[9 + v] = vb;
          const tu0 = (i + uvOff[u]) * uvScale, tu1 = (i + w + uvOff[u]) * uvScale, tv0 = (j + uvOff[v]) * uvScale, tv1 = (j + h + uvOff[v]) * uvScale;
          QT[0] = tu0; QT[1] = tv0; QT[2] = tu1; QT[3] = tv0; QT[4] = tu1; QT[5] = tv1; QT[6] = tu0; QT[7] = tv1;
          const buf = GL[c] ? out.glass : out.opaque;
          if (side === 0) buf.quadS(QP, QT, 0, 1, 2, 3, c, nIdx, q0, q1, q2, q3);
          else buf.quadS(QP, QT, 0, 3, 2, 1, c, nIdx, q0, q3, q2, q1);
          for (let b = 0; b < h; b++) for (let a = 0; a < w; a++) mask[i + a + (j + b) * du] = 0;
          i += w;
        }
      }
    }
  }
}
const padModel = (m) => {
  const H2 = m.h + 2, D2 = m.d + 2, pad = new Uint16Array((m.w + 2) * H2 * D2);
  for (let x = 0; x < m.w; x++) for (let y = 0; y < m.h; y++) {
    const src = (x * m.h + y) * m.d, dst = ((x + 1) * H2 + (y + 1)) * D2 + 1;
    for (let z = 0; z < m.d; z++) pad[dst + z] = m.v[src + z];
  }
  return pad;
};
// compat: greedy with a get(x,y,z) accessor valid on -1..s
function greedy(sx, sy, sz, get, scale, origin, uvOff, out, flat) {
  const H2 = sy + 2, D2 = sz + 2, pad = new Uint16Array((sx + 2) * H2 * D2);
  for (let x = -1; x <= sx; x++) for (let y = -1; y <= sy; y++) for (let z = -1; z <= sz; z++) pad[((x + 1) * H2 + (y + 1)) * D2 + (z + 1)] = get(x, y, z) || 0;
  greedyPad(sx, sy, sz, pad, scale, origin, uvOff, out, flat);
}
AF.greedy = greedy;

// 2x downsampled, AO-free version of a model geometry (used for distant regions). Cached on the geometry.
AF.lodOf = (g) => {
  if (g.userData.lod !== undefined) return g.userData.lod;
  const src = g.userData.src;
  if (!src || src.vs >= 0.45 || src.m.w * src.m.h * src.m.d > 4e6) { g.userData.lod = null; delete g.userData.src; return null; }   // already coarse: keep as is
  const m = src.m, F = src.vs >= 0.2 ? 2 : Math.max(2, Math.round(0.33 / src.vs)), w = Math.ceil(m.w / F), h = Math.ceil(m.h / F), d = Math.ceil(m.d / F);
  const L = new Model(w, h, d);
  const cnt = new Map();
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) for (let z = 0; z < d; z++) {
    cnt.clear(); let best = 0, bn = 0;
    for (let a = 0; a < F; a++) for (let b = 0; b < F; b++) for (let c = 0; c < F; c++) {
      const v = m.get(F * x + a, F * y + b, F * z + c); if (!v || AF.PAL.glass[v]) continue;
      const k = (cnt.get(v) || 0) + 1; cnt.set(v, k); if (k > bn) { bn = k; best = v; }
    }
    if (best) L.v[(x * h + y) * d + z] = best;
  }
  const out = { opaque: new GeoBuf(), glass: new GeoBuf() };
  const vs2 = src.vs * F, an = src.anchor;
  greedyPad(w, h, d, padModel(L), vs2, [-m.w * src.vs * an[0], -m.h * src.vs * an[1], -m.d * src.vs * an[2]], [0, 0, 0], out, true);
  g.userData.lod = out.opaque.n ? out.opaque.geometry() : null;
  delete g.userData.src;
  return g.userData.lod;
};
AF.meshModel = (m, o = {}) => {
  const vs = o.vs ?? 1 / 16, an = o.anchor ?? [0.5, 0, 0.5];
  const out = { opaque: new GeoBuf(), glass: new GeoBuf() };
  const origin = [-m.w * vs * an[0], -m.h * vs * an[1], -m.d * vs * an[2]];
  greedyPad(m.w, m.h, m.d, padModel(m), vs, origin, [0, 0, 0], out, o.flat);
  const g = out.opaque.geometry();
  g.userData.vs = vs; g.userData.src = { m, vs, anchor: an };
  if (out.glass.n) g.userData.glass = out.glass.geometry();
  return g;   // g.userData.glass holds the transparent part (if any)
};
// Build a THREE.Mesh (with glass child) from a model; castShadow on by default
AF.modelMesh = (m, o = {}) => {
  const g = m.isBufferGeometry ? m : AF.meshModel(m, o);
  const mesh = new THREE.Mesh(g, AF.mat.voxel); mesh.castShadow = o.cast ?? true; mesh.receiveShadow = true;
  if (g.userData.glass) { const gm = new THREE.Mesh(g.userData.glass, AF.mat.glass); gm.renderOrder = 2; mesh.add(gm); }
  return mesh;
};

// ---------------------------------------------------------------- the voxel material
// MeshStandardMaterial with palette lookup, baked AO, per-block edge + jitter, and night/always emissive.
AF.mat = {};
{
  const P = AF.PAL;
  const texA = new THREE.DataTexture(P.albedo, 128, 64, THREE.RGBAFormat, THREE.FloatType);
  const texE = new THREE.DataTexture(P.emit, 128, 64, THREE.RGBAFormat, THREE.FloatType);
  const texM = new THREE.DataTexture(P.mat, 128, 64, THREE.RGBAFormat, THREE.FloatType);   // R1: rough, metal, pattern, window
  for (const t of [texA, texE, texM]) { t.minFilter = t.magFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true; }
  AF.PAL.upload = () => { texA.needsUpdate = true; texE.needsUpdate = true; texM.needsUpdate = true; P.dirty = false; };
  AF.onTick('palette', 1, () => { if (P.dirty) AF.PAL.upload(); });
  // R1 uniforms (patterns, windows, far shadow cascade). 03-render drives them.
  const U = AF.mat.uniforms = {
    uPalA: { value: texA }, uPalE: { value: texE }, uPalM: { value: texM }, uNight: { value: 0 }, uEmitBoost: { value: 1 }, uEdge: { value: 1 },
    uAO: { value: new THREE.Vector4(0.42, 0.62, 0.82, 1.0) },
    uPatK: { value: 1 }, uWinK: { value: 1 }, uAfTime: { value: 0 }, uDayK: { value: 1 }, uEnvDiffuse: { value: 0 }, uSpecOcc: { value: 1 },
    uFarMap: { value: null }, uFarMat: { value: new THREE.Matrix4() }, uFarOn: { value: 0 }, uFarTexel: { value: new THREE.Vector2(1 / 2048, 0.34) }, uFarBias: { value: 0.0006 },
    uNearFade: { value: 0.06 },
    // engine R2: fraction of fake-room windows lit at night (atmos drives it: 0.15 at dusk -> 0.62 -> 0.3 late) and the neon gate
    // (mode 'neon' colours light up as uNeon rises 0 -> 1, each 2.5 m cell at its own threshold, with a short flicker band).
    uLitFrac: { value: 0.62 }, uNeon: { value: 1 },
    // engine R2: night emitters (windows, lamps, neon) brighten with distance (70 -> 260 m) so sub-pixel lights keep their energy
    // and the city twinkles from the air instead of averaging into mud. 0 = off.
    uFarEmit: { value: 1.1 },
    // engine R2: drifting cloud shadows on the sun light (AF.cloudShadow in 03-render drives them; uCloudK 0 = off)
    uCloudK: { value: 0.0 }, uCloudOff: { value: new THREE.Vector2() }, uCloudScale: { value: 1 / 210 }, uSunW: { value: new THREE.Vector3(0.5, 0.5, 0.3) },
    // R1 night light pools: up to 24 nearest street/porch/sign/shop lights (xyz, range) + colour*intensity
    uLP: { value: Array.from({ length: 24 }, () => new THREE.Vector4(0, -999, 0, 1)) }, uLC: { value: Array.from({ length: 24 }, () => new THREE.Vector4()) }, uLN: { value: 0 }, uPoolK: { value: 1 },
    // LOD cross-fade progress 0..1 (AF.world.fade); only the fadeIn / fadeOut variants read it
    uFadeK: { value: 0 },
    // 1 = 4-fetch bilinear near shadows (Standard / Low / phones), 0 = three's PCF-soft (Balanced / High); 03-render sets it per tier
    uShadowFast: { value: 1 },
  };
  const vsHead = `
    attribute float aPal; attribute float aAN; attribute vec2 aBU;
    uniform sampler2D uPalA; uniform sampler2D uPalE; uniform sampler2D uPalM;
    uniform mat4 uFarMat;
    varying vec3 vAlb; varying vec4 vEmi; varying vec2 vBU; varying float vAO; varying float vJit; varying float vNI;
    varying vec4 vMat; varying vec3 vAfOP; varying vec3 vAfWP; varying vec4 vFarSC;
  `;
  const nrmCode = `
    float nIdx = mod(aAN, 8.0);
    vec3 objectNormal = nIdx < 0.5 ? vec3(1.,0.,0.) : nIdx < 1.5 ? vec3(-1.,0.,0.) : nIdx < 2.5 ? vec3(0.,1.,0.) : nIdx < 3.5 ? vec3(0.,-1.,0.) : nIdx < 4.5 ? vec3(0.,0.,1.) : vec3(0.,0.,-1.);
    if (afRk > 0.0) objectNormal = normalize(mix(objectNormal, vec3(0., 1., 0.), afRk));
    #ifdef USE_TANGENT
      vec3 objectTangent = vec3( tangent.xyz );
    #endif
  `;
  const palCode = `
    float afRk = aAN > 31.5 ? smoothstep(25.0, 80.0, distance((modelMatrix * vec4(position, 1.0)).xyz, cameraPosition)) : 0.0;
    vec2 pUV = vec2((mod(aPal, 128.0) + 0.5) / 128.0, (floor(aPal / 128.0) + 0.5) / 64.0);
    vec4 pa = texture2D(uPalA, pUV); vec4 pe = texture2D(uPalE, pUV);
    vAlb = pa.rgb; vJit = pa.a; vEmi = pe; vBU = aBU; vNI = mod(aAN, 8.0);
    vAO = mix(floor(mod(aAN, 32.0) / 8.0 + 0.001), 3.0, afRk);
    vMat = texture2D(uPalM, pUV); vAfOP = position;
  `;
  // world position + far-cascade shadow coordinate (after three's worldpos chunk)
  const wpCode = `
    {
      vec4 afWP = vec4(transformed, 1.0);
      #ifdef USE_INSTANCING
        afWP = instanceMatrix * afWP;
      #endif
      afWP = modelMatrix * afWP;
      vAfWP = afWP.xyz;
      vec3 afN = normalize(mat3(modelMatrix) * objectNormal);
      vFarSC = uFarMat * vec4(afWP.xyz + afN * 0.14, 1.0);
    }
  `;
  const fsHead = `
    uniform float uNight; uniform float uEmitBoost; uniform float uEdge; uniform vec4 uAO;
    uniform float uPatK; uniform float uWinK; uniform float uAfTime; uniform float uDayK; uniform float uEnvDiffuse; uniform float uSpecOcc;
    uniform sampler2D uFarMap; uniform float uFarOn; uniform vec2 uFarTexel; uniform float uFarBias; uniform float uNearFade; uniform float uShadowFast;
    uniform vec4 uLP[24]; uniform vec4 uLC[24]; uniform float uLN; uniform float uPoolK; uniform float uLitFrac; uniform float uNeon; uniform float uFarEmit; uniform float uCloudK; uniform vec2 uCloudOff; uniform float uCloudScale; uniform vec3 uSunW;
    varying vec3 vAlb; varying vec4 vEmi; varying vec2 vBU; varying float vAO; varying float vJit; varying float vNI;
    varying vec4 vMat; varying vec3 vAfOP; varying vec3 vAfWP; varying vec4 vFarSC;
    float afHash(vec3 p){ p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
    float afH2(vec2 p){ return afHash(vec3(p, 17.0)); }
    float afVN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(afH2(i), afH2(i + vec2(1.0, 0.0)), f.x), mix(afH2(i + vec2(0.0, 1.0)), afH2(i + vec2(1.0, 1.0)), f.x), f.y); }
    // joint line: 1 on the joint, antialiased by fw (metres per pixel)
    float afJoint(float d, float w, float fw){ return 1.0 - smoothstep(w - fw * 0.75 - 1e-5, w + fw * 0.75 + 1e-5, d); }
    // running-bond cell: returns (dist to joint, cell id x, cell id y, frac along v)
    vec4 afBond(vec2 uv, float L, float H, float stagger){
      float row = floor(uv.y / H);
      float u = uv.x + fract(row * stagger) * L;
      float col = floor(u / L);
      float fu = u - col * L, fv = uv.y - row * H;
      return vec4(min(min(fu, L - fu), min(fv, H - fv)), col, row, fv / H);
    }
    // PATTERNS: id 1..18, uv metres in the face plane (x along, y up/ z), fw = metres per pixel.
    // returns rgb multiplier on albedo (1 = unchanged) ; afRough = additive roughness tweak
    float afRough = 0.0;
    vec3 afPattern(float id, vec2 uv, float fw, vec3 alb){
      afRough = 0.0;
      float kFine = 1.0 - smoothstep(0.006, 0.032, fw);    // mortar lines, grain
      float kMid = 1.0 - smoothstep(0.03, 0.09, fw);       // per-brick tint
      float lum = dot(alb, vec3(0.2126, 0.7152, 0.0722)) + 1e-4;
      // far: every pattern without large-scale variation resolves to exactly 1 once fine + mid detail have faded \u2014 skip the maths
      if (kMid < 0.001 && (id < 3.5 || (id > 4.5 && id < 7.5) || (id > 10.5 && id < 12.5) || (id > 13.5 && id < 14.5) || id > 16.5)) { afRough = id > 2.5 && id < 3.5 ? -0.1 : id > 10.5 && id < 11.5 ? -0.25 : id > 16.5 && id < 17.5 ? -0.3 : 0.0; return vec3(1.0); }
      if (id < 1.5) {           // brick: running bond 0.25 x 0.083 (3 courses per block), light mortar, per-brick tint
        vec4 b = afBond(uv, 0.25, 0.08333, 0.5);
        float h = afH2(b.yz);
        float tint = 0.84 + 0.3 * h; vec3 c = vec3(tint) * mix(vec3(1.0), vec3(0.82, 0.86, 0.95), step(0.86, h));
        c *= 1.0 - 0.08 * smoothstep(0.55, 1.0, b.w);   // slight shading toward the top of each brick
        c = mix(vec3(1.0), c, kMid);
        float m = afJoint(b.x, 0.0075, fw) * kFine;
        vec3 mortar = vec3(0.30, 0.28, 0.25) / max(alb, vec3(0.02));
        return mix(c, min(mortar, vec3(6.0)), m * 0.8);
      } else if (id < 2.5) {    // stone ashlar: 0.5 m courses, stones 0.7-1.3 m, fine joints + speckle
        float row = floor(uv.y / 0.5);
        float L = 0.7 + 0.6 * afH2(vec2(row, 3.1));
        vec4 b = afBond(uv, L, 0.5, 0.37);
        float h = afH2(b.yz + 11.0);
        vec3 c = vec3(0.94 + 0.12 * h);
        float sp = afH2(floor(uv * 36.0)) - 0.5;
        c *= 1.0 + sp * 0.07 * kFine + (afVN(uv * 3.0) - 0.5) * 0.06;
        c = mix(vec3(1.0), c, kMid);
        float j = afJoint(b.x, 0.004, fw) * kFine;
        return c * (1.0 - 0.28 * j);
      } else if (id < 3.5) {    // tile 0.125 m, grout
        vec2 cell = floor(uv / 0.125); vec2 f = uv - cell * 0.125;
        float d = min(min(f.x, 0.125 - f.x), min(f.y, 0.125 - f.y));
        float h = afH2(cell);
        vec3 c = mix(vec3(1.0), vec3(0.96 + 0.08 * h), kMid);
        float g = afJoint(d, 0.0035, fw) * kFine;
        afRough = -0.1 * (1.0 - g);
        return mix(c, vec3(lum > 0.2 ? 0.7 : 1.9), g * 0.75);
      } else if (id < 4.5) {    // checker 0.25 m
        vec2 cell = floor(uv / 0.25);
        float k = mod(cell.x + cell.y, 2.0);
        vec3 c = mix(vec3(1.0), vec3(0.14), k);
        return mix(vec3(1.0 - 0.43), c, kMid);
      } else if (id < 5.5) {    // plank: boards 0.125 wide along x, 1.2-2.4 m long, dark seams, grain
        float row = floor(uv.y / 0.125);
        float L = 1.2 + 1.2 * afH2(vec2(row, 5.0));
        vec4 b = afBond(uv, L, 0.125, 0.618);
        float h = afH2(b.yz + 3.0);
        float grain = afVN(vec2(uv.x * 2.0, uv.y * 60.0 + h * 30.0));
        vec3 c = vec3(0.82 + 0.34 * h) * (1.0 + (grain - 0.5) * 0.16 * kFine);
        c = mix(vec3(1.0), c, kMid);
        float s = afJoint(b.x, 0.0035, fw) * kFine;
        return c * (1.0 - 0.5 * s);
      } else if (id < 6.5) {    // shingle: 0.0625 rows, staggered 0.1 m, shaded bottom edges
        vec4 b = afBond(uv, 0.1, 0.0625, 0.5);
        float h = afH2(b.yz + 7.0);
        vec3 c = vec3(0.86 + 0.26 * h) * (0.78 + 0.22 * smoothstep(0.0, 0.7, b.w));
        c = mix(vec3(1.0), c, kMid);
        float s = afJoint(b.x, 0.004, fw) * kFine;
        return c * (1.0 - 0.35 * s);
      } else if (id < 7.5) {    // setts / cobbles: 0.14 x 0.1 stones, dark gaps, domed
        vec4 b = afBond(uv, 0.14, 0.1, 0.5);
        float h = afH2(b.yz + 9.0);
        float dome = smoothstep(0.0, 0.035, b.x);
        vec3 c = vec3(0.8 + 0.4 * h) * (0.8 + 0.2 * dome);
        c = mix(vec3(1.0), c, kMid);
        float g = afJoint(b.x, 0.009, fw) * kFine;
        afRough = 0.05 * g;
        return c * (1.0 - 0.55 * g);
      } else if (id < 8.5) {    // terracotta panels 0.5 x 0.375 with a pressed chevron
        vec4 b = afBond(uv, 0.5, 0.375, 0.0);
        vec2 cellF = vec2(fract((uv.x) / 0.5), b.w);
        float chev = abs(fract(cellF.y * 3.0 + abs(cellF.x - 0.5) * 2.0) - 0.5);
        float h = afH2(b.yz + 13.0);
        vec3 c = vec3(0.95 + 0.1 * h) * (1.0 + (chev - 0.25) * 0.14 * kMid);
        float j = afJoint(b.x, 0.004, fw) * kFine;
        afRough = -0.2;
        return c * (1.0 - 0.3 * j);
      } else if (id < 9.5) {    // asphalt: fine aggregate + wear patches + large repairs (large scale stays at distance)
        float sp = afH2(floor(uv * 60.0)) - 0.5;
        float mid = afVN(uv * 1.6) - 0.5;
        float big = afVN(uv * 0.12 + 7.0) - 0.5;
        float rep = smoothstep(0.62, 0.66, afVN(uv * 0.25 + 3.0));
        vec3 c = vec3(1.0 + sp * 0.2 * kFine + mid * 0.1 + big * 0.16) * (1.0 - 0.14 * rep);
        afRough = 0.05 - 0.4 * uNight * (1.0 - smoothstep(0.35, 0.6, afVN(uv * 0.35)));   // damp patches at night
        return c;
      } else if (id < 10.5) {   // grass: blades + clumps + dry patches
        float bl = afH2(floor(vec2(uv.x * 55.0, uv.y * 55.0)));
        float cl = afVN(uv * 2.2);
        float dry = smoothstep(0.35, 0.8, afVN(uv * 0.15 + 5.0));
        vec3 c = vec3(0.8 + 0.4 * bl * kFine + (cl - 0.5) * 0.25);
        c *= mix(vec3(1.0), vec3(1.22, 1.08, 0.6), dry * 0.5);
        return c;
      } else if (id < 11.5) {   // wood panelling: 0.5 x 0.75 panels with darker frames, vertical grain
        vec2 cell = floor(uv / vec2(0.5, 0.75)); vec2 f = uv - cell * vec2(0.5, 0.75);
        float d = min(min(f.x, 0.5 - f.x), min(f.y, 0.75 - f.y));
        float frame = 1.0 - smoothstep(0.04, 0.045 + fw, d);
        float grain = afVN(vec2(uv.x * 50.0, uv.y * 2.0));
        vec3 c = vec3(1.0 + (grain - 0.5) * 0.14 * kFine) * mix(1.0, 0.82, frame * kMid);
        float ln = afJoint(abs(d - 0.042), 0.004, fw) * kFine;
        afRough = -0.25;
        return c * (1.0 - 0.3 * ln);
      } else if (id < 12.5) {   // slab: 1 m concrete / stone flags, joints, speckle
        vec4 b = afBond(uv, 1.0, 1.0, 0.0);
        float h = afH2(b.yz + 21.0);
        float sp = afH2(floor(uv * 45.0)) - 0.5;
        vec3 c = vec3(0.95 + 0.1 * h + sp * 0.08 * kFine) * (1.0 + (afVN(uv * 0.5) - 0.5) * 0.08);
        c = mix(vec3(1.0), c, kMid);
        float j = afJoint(b.x, 0.006, fw) * kFine;
        return c * (1.0 - 0.35 * j);
      } else if (id < 13.5) {   // marble: veins + 0.5 m slabs
        float n = afVN(uv * 2.3) + 0.5 * afVN(uv * 5.1);
        float v = abs(sin((uv.x * 0.8 + uv.y * 1.3) * 3.0 + n * 5.0));
        float vein = 1.0 - smoothstep(0.0, 0.08, v);
        vec4 b = afBond(uv, 0.5, 0.5, 0.0);
        float j = afJoint(b.x, 0.002, fw) * kFine;
        vec3 c = vec3(1.0 - 0.22 * vein * kMid + (n - 0.75) * 0.08);
        return c * (1.0 - 0.25 * j);
      } else if (id < 14.5) {   // brushed metal
        float s = afH2(vec2(floor(uv.y * 300.0), 2.0)) - 0.5;
        afRough = s * 0.1;
        return vec3(1.0 + s * 0.06 * kFine);
      } else if (id < 15.5) {   // tar roof / gravel
        float sp = afH2(floor(uv * 50.0)) - 0.5;
        float big = afVN(uv * 0.4) - 0.5;
        return vec3(1.0 + sp * 0.18 * kFine + big * 0.12);
      } else if (id < 16.5) {   // stucco
        return vec3(1.0 + (afVN(uv * 18.0) - 0.5) * 0.08 * kMid + (afVN(uv * 1.3) - 0.5) * 0.06);
      } else if (id < 17.5) {   // parquet basket weave (0.25 cells of 4 strips)
        vec2 cell = floor(uv / 0.25); float par = mod(cell.x + cell.y, 2.0);
        vec2 f = (uv - cell * 0.25); float a = par > 0.5 ? f.x : f.y;
        float strip = floor(a / 0.0625); float d = min(fract(a / 0.0625), 1.0 - fract(a / 0.0625)) * 0.0625;
        float h = afH2(vec2(strip, cell.x * 7.0 + cell.y));
        vec3 c = mix(vec3(1.0), vec3(0.86 + 0.26 * h), kMid);
        float cd = min(min(f.x, 0.25 - f.x), min(f.y, 0.25 - f.y));
        float s = max(afJoint(d, 0.002, fw), afJoint(cd, 0.003, fw)) * kFine;
        afRough = -0.3;
        return c * (1.0 - 0.45 * s);
      } else {                  // carpet: fine nap + faint border band every 2 m
        float sp = afH2(floor(uv * 80.0)) - 0.5;
        vec2 fb = abs(fract(uv / 2.0) - 0.5);
        float band = smoothstep(0.40, 0.41, max(fb.x, fb.y)) * (1.0 - smoothstep(0.45, 0.46, max(fb.x, fb.y)));
        return vec3(1.0 + sp * 0.1 * kFine) * mix(1.0, 1.35, band * kMid);
      }
    }
  `;
  const colCode = `
    float afSpecAO = 1.0; float afRoughAdd = 0.0; float afWinMask = 0.0; vec3 afWinEmit = vec3(0.0); float afPatOn = 0.0;
    {
      // engine v2: piecewise-linear baked AO (soft creases at wall/floor joins instead of hard bands)
      float aoT = clamp(vAO, 0.0, 3.0);
      float ao = aoT < 1.0 ? mix(uAO.x, uAO.y, aoT) : aoT < 2.0 ? mix(uAO.y, uAO.z, aoT - 1.0) : mix(uAO.z, uAO.w, aoT - 2.0);
      vec2 cell = floor(vBU + 0.0005);
      vec2 f = vBU - cell;
      vec2 fw = fwidth(vBU);
      float fwm = max(fw.x, fw.y);
      float near = 1.0 - smoothstep(0.08, 0.45, fwm);
      float edgeK = fract(vEmi.a) * 2.0 * uEdge;
      // R1: sub-block surface patterns (world-scale blocks only: props meshed finer than ~0.18 m never pattern)
      vec3 patMul = vec3(1.0);
      float pv = floor(vMat.z + 0.5);
      bool side = vNI < 1.5 || vNI > 3.5;
      float pid = side ? mod(pv, 32.0) : floor(pv / 32.0);
      if (pid > 0.5 && uPatK > 0.0) {
        vec3 fp = fwidth(vAfOP);
        float bsz = length(fp) / max(length(fw), 1e-5);
        if (bsz > 0.18) {
          vec2 puv = vNI < 1.5 ? vec2(vAfOP.z, vAfOP.y) : vNI < 3.5 ? vec2(vAfOP.x, vAfOP.z) : vec2(vAfOP.x, vAfOP.y);
          float pfw = max(max(fp.x, fp.y), fp.z);
          patMul = mix(vec3(1.0), afPattern(pid, puv, pfw, vAlb), uPatK);
          afRoughAdd = afRough * uPatK;
          afPatOn = uPatK;
          edgeK *= 1.0 - 0.6 * uPatK;
        }
      }
      vec2 e2 = min(f, 1.0 - f) / max(fw, vec2(1e-4));
      float edge = 1.0 - smoothstep(0.6, 1.8, min(e2.x, e2.y));
      float hl = (1.0 - smoothstep(0.5, 1.6, f.x / max(fw.x,1e-4))) * 0.5 + (1.0 - smoothstep(0.5, 1.6, (1.0 - f.y) / max(fw.y,1e-4))) * 0.5;
      float j = (afHash(vec3(cell, vNI * 7.0 + 3.0)) - 0.5) * 2.0;
      float shade = 1.0 + j * vJit * 0.09 * near * near * (1.0 - 0.5 * afPatOn);   // owner 09-28 'grainy': per-block jitter off once blocks are ~2 px (it read as speckle)
      shade *= 1.0 - edge * 0.22 * edgeK * near;
      shade *= 1.0 + hl * 0.05 * edgeK * near;
      diffuseColor.rgb *= vAlb * ao * shade * patMul;
      afSpecAO = mix(1.0, ao * ao, uSpecOcc);
      // R1: facade-only windows -> fake rooms behind the glass (interior mapping in world space)
      if (vMat.w > 0.5 && uWinK > 0.0 && side) {
        vec3 N = vNI < 0.5 ? vec3(1.,0.,0.) : vNI < 1.5 ? vec3(-1.,0.,0.) : vNI < 4.5 ? vec3(0.,0.,1.) : vec3(0.,0.,-1.);
        vec3 T = abs(N.x) > 0.5 ? vec3(0.0, 0.0, N.x) : vec3(-N.z, 0.0, 0.0);
        vec3 V = normalize(vAfWP - cameraPosition);
        float kind = floor(vMat.w + 0.5);
        vec3 RS = kind > 2.5 && kind < 3.5 ? vec3(6.0, 4.2, 6.0) : kind > 1.5 && kind < 2.5 ? vec3(3.6, 3.2, 4.0) : vec3(4.2, 3.6, 5.0);
        vec3 q = vec3(dot(vAfWP, T), vAfWP.y - 0.25, 0.0) / RS;
        vec3 rd = vec3(dot(V, T), V.y, -dot(V, N)) / RS;
        vec3 rc = floor(q); vec3 s0 = vec3(fract(q.xy), 0.0);
        // faces sit on the voxel grid: sample 3 cm behind the face so floor() never lands on the plane (per-pixel noise on D3D)
        float plane = floor((dot(vAfWP, N) - 0.03) * 2.0);
        float rh = afHash(vec3(rc.xy, plane + kind * 13.0));
        float rh2 = afHash(vec3(rc.yx + 3.7, plane * 1.3));
        // night: slowly changing lit / dark / TV rooms
        float slot = floor(uAfTime / 90.0 + rh * 7.0);
        float litR = afHash(vec3(rc.xy + slot * 0.37, plane));
        float lit = step(1.0 - uLitFrac, litR);
        float tv = step(0.93, litR) * (0.6 + 0.4 * sin(uAfTime * 7.0 + rh * 40.0) * sin(uAfTime * 2.3));
        float wsel = floor(rh * 4.0);
        vec3 wall = wsel < 0.5 ? vec3(0.66, 0.58, 0.46) : wsel < 1.5 ? vec3(0.45, 0.52, 0.47) : wsel < 2.5 ? vec3(0.62, 0.47, 0.42) : vec3(0.5, 0.57, 0.6);
        if (kind < 1.5) wall = mix(vec3(0.6, 0.58, 0.52), vec3(0.42, 0.46, 0.44), step(0.5, rh));
        wall *= 0.8 + 0.3 * rh2;
        vec3 rc0 = wall * 0.9; float lk = 1.05, depthShade = 0.62;
        // beyond 140 m a room is a few pixels: same lit / dark / TV state and wall colour, no ray march through the furniture
        if (dot(vAfWP - cameraPosition, vAfWP - cameraPosition) < 19600.0) {
        vec3 rdd = rd; rdd.z = max(rdd.z, 1e-3);
        float tx = ((rdd.x > 0.0 ? 1.0 : 0.0) - s0.x) / (abs(rdd.x) > 1e-5 ? rdd.x : 1e-5);
        float ty = ((rdd.y > 0.0 ? 1.0 : 0.0) - s0.y) / (abs(rdd.y) > 1e-5 ? rdd.y : 1e-5);
        float tz = 1.0 / rdd.z;
        float t = min(min(tx, ty), tz);
        vec3 hp = s0 + rdd * t;
        // engine R2: richer fake rooms — wall colours, wallpaper stripes, dado panelling, pictures, bookcases, doors, rugs,
        // a ceiling fixture, a wardrobe, and midground cards (a resident who moves every ~90 s, a sofa or a desk) + lamp falloff
        vec3 hm = hp * RS;
        float rh3 = afHash(vec3(rc.xy + 11.3, plane + 2.0));
        float rh4 = afHash(vec3(rc.yx + 5.1, plane + 9.0));
        vec3 woodC = vec3(0.26, 0.16, 0.1) * (0.8 + 0.4 * rh3);
        vec3 hitM = hm;
        if (t == tz) {           // back wall
          rc0 = wall * (1.0 - 0.1 * step(rh3, 0.45) * step(1.5, kind) * step(0.5, fract(hm.x * 2.2)));
          if (rh4 > 0.45 && kind > 1.5) rc0 = hm.y < 0.95 ? woodC * (0.9 + 0.1 * step(0.5, fract(hm.x * 1.6))) : hm.y < 1.02 ? woodC * 1.3 : rc0;
          float pcx = RS.x * (0.3 + 0.4 * rh2), pw = 0.3 + 0.25 * rh3;
          vec2 pq = abs(hm.xy - vec2(pcx, 1.65)) - vec2(pw, pw * 0.7);
          float pm = max(pq.x, pq.y);
          if (pm < 0.0 && rh2 > 0.3) rc0 = pm > -0.05 ? vec3(0.55, 0.4, 0.15) : mix(vec3(0.25, 0.32, 0.22), vec3(0.5, 0.3, 0.2), rh) * (0.75 + 0.5 * afVN(hm.xy * 7.0));
          float bx0 = RS.x * (0.05 + 0.55 * rh4);
          if ((kind < 1.5 || rh3 > 0.6) && hm.x > bx0 && hm.x < bx0 + 1.1 && hm.y < 2.0) {
            float shelf = fract(hm.y / 0.4);
            vec2 bk = vec2(floor(hm.x / 0.07), floor(hm.y / 0.4));
            vec3 book = mix(vec3(0.45, 0.12, 0.08), vec3(0.12, 0.2, 0.35), afH2(bk)) * (0.6 + 0.7 * afH2(bk + 3.0));
            rc0 = (shelf < 0.12 || hm.x < bx0 + 0.05 || hm.x > bx0 + 1.05) ? woodC : shelf > 0.82 ? woodC * 0.5 : book;
          }
          float ddx = abs(hm.x - RS.x * 0.86);
          if (rh > 0.7 && ddx < 0.45 && hm.y < 2.1) rc0 = woodC * ((ddx > 0.38 || hm.y > 2.03) ? 1.4 : 1.0);
        } else if (t == ty) {
          if (rdd.y < 0.0) {     // floor: boards or lino + a rug
            rc0 = mix(vec3(0.34, 0.24, 0.16), vec3(0.4, 0.38, 0.36), step(0.5, rh2)) * (0.8 + 0.2 * fract(hm.z * 1.3 + floor(hm.x * 5.0) * 0.37));
            vec2 rq = abs(hm.xz - RS.xz * 0.5) - RS.xz * vec2(0.28, 0.25);
            float rm = max(rq.x, rq.y);
            if (rm < 0.0 && rh3 > 0.3) rc0 = rm > -0.16 ? vec3(0.55, 0.42, 0.2) : mix(vec3(0.45, 0.12, 0.1), vec3(0.14, 0.2, 0.4), step(0.6, rh4));
          } else {               // ceiling + fixture
            rc0 = vec3(0.85, 0.83, 0.78);
            float dl = length(hm.xz - RS.xz * 0.5);
            rc0 = mix(rc0, vec3(0.95, 0.88, 0.7) * mix(0.35, 3.5, uNight * lit), 1.0 - smoothstep(0.2, 0.26, dl));
          }
        } else {                 // side walls: a wardrobe / cabinet toward the back
          rc0 = wall * 0.85;
          if (hp.z > 0.55 && hm.y < 1.9 && rh2 > 0.4) rc0 = woodC * (0.9 + 0.2 * step(0.5, fract(hp.z * RS.z * 1.2)));
        }
        // midground cards (nearest wins): a resident, then a sofa / desk
        float tcP = (0.28 + 0.3 * rh4) / rdd.z;
        if (step(0.7, afHash(vec3(rc.xy + slot * 0.61, plane + 21.0))) > 0.5 && tcP < t) {
          vec3 hcm = (s0 + rdd * tcP) * RS;
          float px = RS.x * (0.2 + 0.6 * afHash(vec3(rc.xy + slot, plane + 4.0)));
          float dx = abs(hcm.x - px);
          float body = step(dx, mix(0.17, 0.23, smoothstep(0.85, 1.3, hcm.y))) * step(hcm.y, 1.45);
          float head = step(length(vec2(dx, hcm.y - 1.6)), 0.12);
          if (body + head > 0.5) { rc0 = head > 0.5 ? vec3(0.55, 0.4, 0.3) : mix(vec3(0.12, 0.12, 0.16), vec3(0.42, 0.16, 0.12), step(0.5, rh3)); hitM = hcm; t = tcP; }
        }
        float tcF = (0.5 + 0.15 * rh) / rdd.z;
        if (rh2 > 0.25 && tcF < t) {
          vec3 hcm = (s0 + rdd * tcF) * RS;
          float fx0 = RS.x * (0.1 + 0.4 * rh3), fwid = kind < 1.5 ? 1.4 : 1.9, fh = kind < 1.5 ? 0.78 : 0.85;
          if (hcm.x > fx0 && hcm.x < fx0 + fwid && hcm.y < fh) {
            bool under = kind < 1.5 && hcm.y < 0.72 && hcm.x > fx0 + 0.08 && hcm.x < fx0 + fwid - 0.08;
            if (!under) { rc0 = kind < 1.5 ? woodC * (hcm.y > 0.72 ? 1.5 : 1.0) : mix(vec3(0.35, 0.12, 0.1), vec3(0.2, 0.3, 0.25), step(0.5, rh4)) * (hcm.y < 0.45 ? 0.8 : 1.0); hitM = hcm; t = tcF; }
          }
        }
        // lamp falloff: a ceiling pendant, or a table lamp low at the back (30 %)
        vec3 lp = rh4 < 0.3 ? vec3(RS.x * (0.15 + 0.7 * rh3), 1.0, RS.z * 0.8) : vec3(RS.x * 0.5, RS.y - 0.35, RS.z * 0.5);
        vec3 dL = hitM - lp;
        lk = 0.3 + 1.6 / (1.0 + 0.35 * dot(dL, dL));
        depthShade = 1.0 / (1.0 + t * rd.z * 0.9);
        }
        // blinds / curtains at the glass
        float blind = step(1.0 - (0.08 + 0.45 * afHash(vec3(rc.xy, plane + 5.0))) * step(0.45, rh2), s0.y);
        vec3 blindC = mix(vec3(0.82, 0.76, 0.62), vec3(0.6, 0.25, 0.2), step(0.8, rh)) * (0.9 + 0.1 * step(0.5, fract(s0.y * RS.y * 12.0)));
        vec3 lampC = mix(vec3(1.0, 0.72, 0.42), vec3(1.0, 0.86, 0.66), rh2);
        vec3 nightRoom = rc0 * lampC * 1.6 * lk * lit * depthShade + vec3(0.25, 0.45, 1.0) * tv * 0.9 * (1.0 - lit * 0.6);
        vec3 dayRoom = rc0 * 0.22 * depthShade;
        vec3 room = mix(dayRoom * uDayK, nightRoom, uNight);
        vec3 blindLit = blindC * mix(0.16 * uDayK, 1.4 * lit + 0.05, uNight);
        room = mix(room, blindLit, blind);
        afWinMask = uWinK;
        afWinEmit = room * (vEmi.a >= 1.0 ? 1.0 : 0.75);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * 0.25, uWinK);
        afRoughAdd -= 0.3 * uWinK;
      }
    }
  `;
  const emiCode = `
    {
      float mode = floor(vEmi.a);
      float on = mode > 1.5 ? 1.0 : mode > 0.5 ? uNight : 0.0;
      if (mode > 2.5 && uNeon < 1.0) {                 // neon: per-cell switch-on sequence with a brief flicker
        vec3 Nn = vNI < 0.5 ? vec3(1.,0.,0.) : vNI < 1.5 ? vec3(-1.,0.,0.) : vNI < 2.5 ? vec3(0.,1.,0.) : vNI < 3.5 ? vec3(0.,-1.,0.) : vNI < 4.5 ? vec3(0.,0.,1.) : vec3(0.,0.,-1.);
        float th = afHash(floor((vAfWP - Nn * 0.03) / 2.5) + 0.5) * 0.85; float nd = uNeon - th;
        on = nd < 0.0 ? 0.0 : nd > 0.06 ? 1.0 : step(0.45, fract(sin(uAfTime * 37.0 + th * 91.0) * 43758.5));
      }
      vec3 em = vEmi.rgb * on * uEmitBoost;
      if (afWinMask > 0.0) em = mix(em, afWinEmit * uEmitBoost * mix(0.85, 1.25, clamp(length(vEmi.rgb) * 0.5, 0.0, 1.0)), afWinMask);
      em *= 1.0 + uFarEmit * uNight * smoothstep(70.0, 260.0, length(vAfWP - cameraPosition));
      totalEmissiveRadiance += em;
      // night light pools (cheap, unshadowed): warm light on the ground/walls around street lamps and lit signs
      if (uLN > 0.5 && uNight * uPoolK > 0.01) {
        vec3 Nw = vNI < 0.5 ? vec3(1.,0.,0.) : vNI < 1.5 ? vec3(-1.,0.,0.) : vNI < 2.5 ? vec3(0.,1.,0.) : vNI < 3.5 ? vec3(0.,-1.,0.) : vNI < 4.5 ? vec3(0.,0.,1.) : vec3(0.,0.,-1.);
        vec3 pool = vec3(0.0);
        for (int i = 0; i < 24; i++) {
          if (float(i) >= uLN) break;
          vec3 L = uLP[i].xyz - vAfWP; float d2 = dot(L, L), rr = uLP[i].w;
          if (d2 >= rr * rr) continue;
          float dl = sqrt(d2);
          float a = 1.0 - dl / rr;
          float ndl = max(dot(Nw, L / max(dl, 1e-3)), 0.0);
          pool += uLC[i].rgb * a * a * (0.15 + 0.85 * ndl);
        }
        totalEmissiveRadiance += diffuseColor.rgb * pool * uNight * uPoolK;
      }
    }
  `;
  const roughCode = `
    if (vMat.x >= 0.0) roughnessFactor = vMat.x;
    roughnessFactor = clamp(roughnessFactor + afRoughAdd, 0.04, 1.0);
  `;
  const metalCode = `
    metalnessFactor = max(metalnessFactor, vMat.y);
  `;
  // sun shadow: near (three's map) blended into R1's far cascade map
  const shadowFns = `
    #if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
    float afFarShadow() {
      if (uFarOn < 0.5) return 1.0;
      vec3 c = vFarSC.xyz / vFarSC.w;
      float e = min(min(c.x, 1.0 - c.x), min(c.y, 1.0 - c.y));
      if (e <= 0.0 || c.z > 1.0) return 1.0;
      c.z -= uFarBias;
      vec2 ts = uFarTexel.xx;
      vec2 uv = c.xy; vec2 f = fract(uv / ts + 0.5); uv -= f * ts;
      float s00 = step(c.z, unpackRGBAToDepth(texture2D(uFarMap, uv)));
      float s10 = step(c.z, unpackRGBAToDepth(texture2D(uFarMap, uv + vec2(ts.x, 0.0))));
      float s01 = step(c.z, unpackRGBAToDepth(texture2D(uFarMap, uv + vec2(0.0, ts.y))));
      float s11 = step(c.z, unpackRGBAToDepth(texture2D(uFarMap, uv + ts)));
      float s = mix(mix(s00, s10, f.x), mix(s01, s11, f.x), f.y);
      return mix(1.0, s, smoothstep(0.0, 0.04, e));
    }
    float afSunShadow( sampler2D map, vec2 size, float bias, float radius, vec4 sc ) {
      vec3 c = sc.xyz / sc.w;
      float e = min(min(c.x, 1.0 - c.x), min(c.y, 1.0 - c.y));
      float wN = (c.z + bias <= 1.0) ? smoothstep(0.0, uNearFade, e) : 0.0;
      float sN = 1.0, sF = 1.0;
      if (wN > 0.001) {
        if (uShadowFast > 0.5) {
          // one bilinear 2x2 compare (4 fetches) instead of PCF-soft's 36: the near map is ~3 cm per texel at street level
          float z = c.z + bias; vec2 ts = 1.0 / size, uv = c.xy, f = fract(uv / ts + 0.5); uv -= f * ts;
          float s00 = step(z, unpackRGBAToDepth(texture2D(map, uv))), s10 = step(z, unpackRGBAToDepth(texture2D(map, uv + vec2(ts.x, 0.0))));
          float s01 = step(z, unpackRGBAToDepth(texture2D(map, uv + vec2(0.0, ts.y)))), s11 = step(z, unpackRGBAToDepth(texture2D(map, uv + ts)));
          sN = mix(mix(s00, s10, f.x), mix(s01, s11, f.x), f.y);
        } else sN = getShadow(map, size, bias, radius, sc);
      }
      if (wN < 0.999) sF = afFarShadow();
      float sh = mix(sF, sN, wN);
      if (uCloudK > 0.001) {     // cloud layer at y 420, projected along the sun
        vec3 sd = normalize(uSunW);
        vec2 cp = (vAfWP.xz + sd.xz * ((420.0 - vAfWP.y) / max(sd.y, 0.08))) * uCloudScale + uCloudOff;
        float cn = afVN(cp) * 0.65 + afVN(cp * 2.3 + 7.1) * 0.35;
        sh *= 1.0 - uCloudK * smoothstep(0.5, 0.72, cn);
      }
      return sh;
    }
    #endif
  `;
  AF.voxelShader = { vsHead, nrmCode, palCode, fsHead, colCode, emiCode, wpCode, shadowFns };
  const patch = (mat, key) => {
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, U);
      sh.vertexShader = vsHead + sh.vertexShader
        .replace('#include <beginnormal_vertex>', nrmCode)
        .replace('#include <color_vertex>', '#include <color_vertex>\n' + palCode)
        .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\n' + wpCode);
      sh.fragmentShader = fsHead + sh.fragmentShader
        .replace('#include <color_fragment>', '#include <color_fragment>\n' + colCode)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + roughCode)
        .replace('#include <metalnessmap_fragment>', '#include <metalnessmap_fragment>\n' + metalCode)
        .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n' + emiCode)
        .replace('#include <shadowmap_pars_fragment>', '#include <shadowmap_pars_fragment>\n' + shadowFns)
        .replace('#include <lights_fragment_begin>', THREE.ShaderChunk.lights_fragment_begin.split('getShadow( directionalShadowMap[ i ]').join('afSunShadow( directionalShadowMap[ i ]'))
        .replace('#include <lights_fragment_maps>', THREE.ShaderChunk.lights_fragment_maps
          .replace('iblIrradiance += getIBLIrradiance( geometryNormal );', 'iblIrradiance += getIBLIrradiance( geometryNormal ) * uEnvDiffuse;')
          + '\n radiance *= afSpecAO * mix(1.0, 0.3, smoothstep(0.45, 0.9, material.roughness));\n');
      if (key === 'fadeIn' || key === 'fadeOut') {
        // screen-door cross-fade: the two variants discard complementary pixels, so in + out always cover the surface once
        sh.fragmentShader = 'uniform float uFadeK;\n' + sh.fragmentShader.replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\n{ float afD = fract(52.9829189 * fract(dot(floor(gl_FragCoord.xy), vec2(0.06711056, 0.00583715)))); if (afD ' + (key === 'fadeIn' ? '>=' : '<') + ' uFadeK) discard; }');
      }
      if (AF.mat.extraPatch) AF.mat.extraPatch(sh, key);
    };
    mat.customProgramCacheKey = () => 'afvox2-' + key;
    return mat;
  };
  AF.mat.patchVoxel = patch;
  AF.mat.voxel = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 }), 'solid');
  AF.mat.glass = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.12, metalness: 0.0, transparent: true, opacity: 0.38, depthWrite: false }), 'glass');
  AF.mat.water = new THREE.MeshStandardMaterial({ color: 0x3b6f8f, roughness: 0.08, metalness: 0.0, transparent: true, opacity: 0.82 });
  // PERF.md §2b: three re-derives the program (getParameters) every time one material alternates between instanced and plain
  // meshes in a pass. Instanced voxel users get their own material object (same program cache key = no extra compiles) and a
  // shared depth material, so each pass switches programs once per kind instead of ~75 times.
  AF.mat.voxelInst = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 }), 'solid');
  AF.mat.voxelInstC = patch(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 }), 'solid');
  AF.mat.depthInst = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking });
  AF.mat.splitInstanced = (o) => {
    if (!o.isInstancedMesh) return;
    if (o.material === AF.mat.voxel) o.material = o.instanceColor ? AF.mat.voxelInstC : AF.mat.voxelInst;
    if (o.customDepthMaterial === undefined && (o.material === AF.mat.voxelInst || o.material === AF.mat.voxelInstC)) o.customDepthMaterial = AF.mat.depthInst;
  };
}

// ---------------------------------------------------------------- world meshing (runs as build stage 500)
// Regions of 128x128 columns (32 m). Each region -> 1 opaque mesh (terrain + voxels + static props) + 1 glass mesh.
AF.world = { group: null, regions: new Map(), props: [], water: [] };
const REG = 128;
// static props: geometry from AF.meshModel placed in the world (merged into region meshes). rot = quarter turns.
AF.placeStatic = (geo, x, y, z, rot = 0, o = {}) => {
  const pr = { geo, x, y, z, rot: ((rot % 4) + 4) % 4 }; AF.world.props.push(pr); AF.world.indexProp(pr);
  if (o.collide !== false) {
    const bb = geo.boundingBox || (geo.computeBoundingBox(), geo.boundingBox);
    let a = [bb.min.x, bb.min.z], b = [bb.max.x, bb.max.z];
    const r = ((rot % 4) + 4) % 4;
    const R = (p) => r === 0 ? p : r === 1 ? [p[1], -p[0]] : r === 2 ? [-p[0], -p[1]] : [-p[1], p[0]];
    const pa = R(a), pb = R(b);
    pr.col = AF.addCollider(x + Math.min(pa[0], pb[0]), y + bb.min.y, z + Math.min(pa[1], pb[1]), x + Math.max(pa[0], pb[0]), y + bb.max.y, z + Math.max(pa[1], pb[1]));
  }
  return pr;
};
// take a static prop out of the world again (e.g. a parked car the player drives off in): rebuilds that region's prop meshes
AF.removeStatic = (pr) => {
  const i = AF.world.props.indexOf(pr); if (i < 0) return;
  AF.world.props.splice(i, 1);
  if (pr.col) AF.removeCollider(pr.col);
  const k = regionKeyOf(pr.x, pr.z), list = AF.world.propsByRegion.get(k);
  if (list) { const j = list.indexOf(pr); if (j >= 0) list.splice(j, 1); }
  const reg = AF.world.lod.get(k); if (!reg) return;
  const wasNear = reg.nearBuilt; FADE.cancel(reg); freeNear(reg); dropMesh(reg.far); reg.far = null;
  const fg = mergeProps(reg.props, farPick); if (fg) { reg.far = regMesh(fg, AF.mat.voxel, true); reg.far.visible = !!reg.farSeen; }
  if (wasNear) { buildNear(reg); if (reg.showNear) { if (reg.near) reg.near.visible = true; if (reg.nearGlass) reg.nearGlass.visible = true; } }
};
AF.addWater = (geo, mat) => { AF.world.water.push({ geo, mat }); };

function meshTerrainRegion(rx, rz, buf) {
  const H = W.H, C = W.C, S = W.S, dirtI = AF.col('dirt');
  const bx0 = rx * REG, bz0 = rz * REG, bx1 = Math.min(NX, bx0 + REG), bz1 = Math.min(NZ, bz0 + REG);
  const w = bx1 - bx0, d = bz1 - bz0;
  const vox = (bx, by, bz) => { const c = W.get(bx, by, bz); return c && AF.PAL.opaque[c]; };
  const occCol = (bx, bz, h) => (W.hB(bx, bz) > h) || vox(bx, h + GOFF, bz);
  // top faces, greedy over (h, colour, ao)
  const key = new Float64Array(w * d);
  for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) {
    const bx = bx0 + i, bz = bz0 + k, ci = bx * NZ + bz, h = H[ci];
    if (vox(bx, h + GOFF, bz)) { key[i * d + k] = 0; continue; }   // covered by a voxel floor: hidden
    const s10 = occCol(bx - 1, bz, h) ? 1 : 0, s12 = occCol(bx + 1, bz, h) ? 1 : 0, s01 = occCol(bx, bz - 1, h) ? 1 : 0, s21 = occCol(bx, bz + 1, h) ? 1 : 0;
    let ao = 255;
    if (s10 | s12 | s01 | s21 | (occCol(bx - 1, bz - 1, h) ? 1 : 0) | (occCol(bx + 1, bz - 1, h) ? 1 : 0) | (occCol(bx + 1, bz + 1, h) ? 1 : 0) | (occCol(bx - 1, bz + 1, h) ? 1 : 0)) {
      const c00 = occCol(bx - 1, bz - 1, h) ? 1 : 0, c20 = occCol(bx + 1, bz - 1, h) ? 1 : 0, c22 = occCol(bx + 1, bz + 1, h) ? 1 : 0, c02 = occCol(bx - 1, bz + 1, h) ? 1 : 0;
      const A = (a, b, c) => (a && b) ? 0 : 3 - (a + b + c);
      // corners in (u=z? ) we use u = x, v = z for the top plane
      ao = A(s10, s01, c00) | (A(s12, s01, c20) << 2) | (A(s12, s21, c22) << 4) | (A(s10, s21, c02) << 6);
    }
    key[i * d + k] = ((h + 32768) * 8192 + C[ci]) * 256 + ao + 1;
  }
  for (let i = 0; i < w; i++) for (let k = 0; k < d;) {
    const kk = key[i * d + k]; if (!kk) { k++; continue; }
    const lit = ((kk - 1) % 256) === 255;
    let len = 1; if (lit) while (k + len < d && key[i * d + k + len] === kk) len++;
    let wid = 1, stop = false;
    while (lit && i + wid < w) { for (let t = 0; t < len; t++) if (key[(i + wid) * d + k + t] !== kk) { stop = true; break; } if (stop) break; wid++; }
    const v = kk - 1, aob = v % 256, rest = Math.floor(v / 256), c = rest % 8192, h = Math.floor(rest / 8192) - 32768;
    const y = h * VS, xa = X0 + (bx0 + i) * VS, xb = xa + wid * VS, za = Z0 + (bz0 + k) * VS, zb = za + len * VS;
    const ao = aob === 255 ? [3, 3, 3, 3] : [aob & 3, (aob >> 2) & 3, (aob >> 4) & 3, (aob >> 6) & 3];
    const u0 = bx0 + i, v0 = bz0 + k;
    // +y face, CCW from above: (xa,za) -> (xa,zb) -> (xb,zb) -> (xb,za)
    buf.quad([xa, y, za], [xa, y, zb], [xb, y, zb], [xb, y, za], [u0, v0], [u0, v0 + len], [u0 + wid, v0 + len], [u0 + wid, v0], c, 2, [ao[0], ao[3], ao[2], ao[1]]);
    for (let a = 0; a < wid; a++) for (let t = 0; t < len; t++) key[(i + a) * d + k + t] = 0;
    k += len;
  }
  // side faces: for each column edge where the neighbour is lower
  const side = (dx, dz, nIdx) => {
    // run along the axis perpendicular to (dx,dz)
    const alongX = dz !== 0;
    const nA = alongX ? w : d, nB = alongX ? d : w;
    for (let b = 0; b < nB; b++) {
      let a = 0;
      while (a < nA) {
        const bx = bx0 + (alongX ? a : b), bz = bz0 + (alongX ? b : a), ci = bx * NZ + bz, h = H[ci], nh = W.hB(bx + dx, bz + dz);
        if (nh >= h || bx + dx < 0 || bz + dz < 0 || bx + dx >= NX || bz + dz >= NZ) { a++; continue; }
        const topC = C[ci], sideC = S[ci] || (h - nh > 1 ? dirtI : topC);
        let run = 1;
        while (a + run < nA) {
          const bx2 = bx0 + (alongX ? a + run : b), bz2 = bz0 + (alongX ? b : a + run), c2 = bx2 * NZ + bz2;
          if (H[c2] !== h || W.hB(bx2 + dx, bz2 + dz) !== nh || C[c2] !== topC || (S[c2] || (h - nh > 1 ? dirtI : C[c2])) !== sideC) break;
          run++;
        }
        const emit = (ylo, yhi, col, fl = 0) => {
          if (yhi <= ylo) return;
          const Y0b = ylo * VS, Y1b = yhi * VS;
          if (alongX) {
            const zf = Z0 + (bz0 + b + (dz > 0 ? 1 : 0)) * VS, xa = X0 + (bx0 + a) * VS, xb = xa + run * VS, u0 = bx0 + a;
            if (dz > 0) buf.quad([xa, Y0b, zf], [xb, Y0b, zf], [xb, Y1b, zf], [xa, Y1b, zf], [u0, ylo], [u0 + run, ylo], [u0 + run, yhi], [u0, yhi], col, nIdx, [1, 1, 3, 3], fl);
            else buf.quad([xb, Y0b, zf], [xa, Y0b, zf], [xa, Y1b, zf], [xb, Y1b, zf], [u0 + run, ylo], [u0, ylo], [u0, yhi], [u0 + run, yhi], col, nIdx, [1, 1, 3, 3], fl);
          } else {
            const xf = X0 + (bx0 + b + (dx > 0 ? 1 : 0)) * VS, za = Z0 + (bz0 + a) * VS, zb = za + run * VS, u0 = bz0 + a;
            if (dx > 0) buf.quad([xf, Y0b, zb], [xf, Y0b, za], [xf, Y1b, za], [xf, Y1b, zb], [u0 + run, ylo], [u0, ylo], [u0, yhi], [u0 + run, yhi], col, nIdx, [1, 1, 3, 3], fl);
            else buf.quad([xf, Y0b, za], [xf, Y0b, zb], [xf, Y1b, zb], [xf, Y1b, za], [u0, ylo], [u0 + run, ylo], [u0 + run, yhi], [u0, yhi], col, nIdx, [1, 1, 3, 3], fl);
          }
        };
        if (W.sideFn && h - nh > 1) {
          // optional per-block side colouring (layered cliffs): W.sideFn(bx, bz, blockY, topColour) -> colour index or 0 for default
          let y0 = nh, cur = W.sideFn(bx, bz, nh, topC) || sideC;
          for (let y = nh + 1; y <= h - 1; y++) { const c2 = y === h - 1 ? -1 : (W.sideFn(bx, bz, y, topC) || sideC); if (c2 !== cur) { emit(y0, y, cur); y0 = y; cur = c2; } }
          emit(h - 1, h, topC);
        } else if (sideC === topC) emit(nh, h, topC, h - nh <= 2 ? 32 : 0); else { emit(nh, h - 1, sideC); emit(h - 1, h, topC); }
        a += run;
      }
    }
  };
  side(1, 0, 0); side(-1, 0, 1); side(0, 1, 4); side(0, -1, 5);
}

// region meshers are generators (yield after every chunk) so regions can be streamed in a few ms per frame; runSync drives one to the end
const runSync = (g) => { let r = g.next(); while (!r.done) r = g.next(); return r.value; };
function meshVoxelRegion(rx, rz, out) { runSync(meshVoxelRegionG(rx, rz, out)); }
function* meshVoxelRegionG(rx, rz, out) {
  const bx0 = rx * REG, bz0 = rz * REG;
  const fullC = new Map(), OPq = AF.PAL.opaque;
  const isFull = (cx, cy, cz) => {
    if (cx < 0 || cz < 0 || cx >= CX || cz >= CZ || cy < 0 || cy >= CY) return false;
    const key = (cx * CY + cy) * CZ + cz; let f = fullC.get(key);
    if (f === undefined) { const ch = W.chunks[key]; f = !!ch; if (ch) for (let i = 0; i < 4096; i++) { const c = chunkValue(ch, i); if (c === 0 || OPq[c] !== 1) { f = false; break; } } fullC.set(key, f); }
    return f;
  };
  const pad = new Uint16Array(18 * 18 * 18);
  const cnt = [new Int32Array(16), new Int32Array(16), new Int32Array(16)];
  const hcol = new Int32Array(18 * 18);
  const NB = new Array(27).fill(null);
  for (let cx = bx0 >> 4; cx < Math.min(CX, (bx0 + REG) >> 4); cx++) for (let cz = bz0 >> 4; cz < Math.min(CZ, (bz0 + REG) >> 4); cz++) {
    const ox = cx * 16, oz = cz * 16;
    let colsReady = false;
    for (let cy = 0; cy < CY; cy++) {
      const ch = W.chunks[(cx * CY + cy) * CZ + cz]; if (!ch) continue;
      cnt[0].fill(0); cnt[1].fill(0); cnt[2].fill(0);
      let any = false;
      for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) { const b = (x * 16 + y) * 16; for (let z = 0; z < 16; z++) if (chunkValue(ch, b + z)) { any = true; cnt[0][x]++; cnt[1][y]++; cnt[2][z]++; } }
      if (!any) continue;
      // skip chunks buried inside solid mass (all 6 neighbours fully opaque): no face can be visible (coordinator perf, Port Solace)
      if (isFull(cx, cy, cz) && isFull(cx - 1, cy, cz) && isFull(cx + 1, cy, cz) && isFull(cx, cy, cz - 1) && isFull(cx, cy, cz + 1) && isFull(cx, cy + 1, cz) && (cy === 0 || isFull(cx, cy - 1, cz))) { AF.stats.skipFull = (AF.stats.skipFull || 0) + 1; continue; }
      if (!colsReady) { for (let x = -1; x <= 16; x++) for (let z = -1; z <= 16; z++) hcol[(x + 1) * 18 + (z + 1)] = W.hB(ox + x, oz + z) + GOFF; colsReady = true; }
      const oy = cy * 16;
      pad.fill(0);
      // interior
      for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
        const src = (x * 16 + y) * 16, dst = ((x + 1) * 18 + (y + 1)) * 18 + 1;
        for (let z = 0; z < 16; z++) pad[dst + z] = chunkValue(ch, src + z);
      }
      // border shell from the 26 neighbour chunks, read directly (engine R2 boot: no per-voxel W.get; same values —
      // an out-of-world or empty neighbour chunk reads 0 exactly like W.get)
      for (let a = -1; a <= 1; a++) for (let b2 = -1; b2 <= 1; b2++) for (let c = -1; c <= 1; c++) {
        const nx = cx + a, ny = cy + b2, nz = cz + c;
        NB[(a + 1) * 9 + (b2 + 1) * 3 + (c + 1)] = (nx < 0 || ny < 0 || nz < 0 || nx >= CX || ny >= CY || nz >= CZ) ? null : W.chunks[(nx * CY + ny) * CZ + nz];
      }
      for (let x = -1; x <= 16; x++) {
        const ax = x < 0 ? 0 : x > 15 ? 2 : 1, lx = (x & 15) * 256;
        for (let y = -1; y <= 16; y++) {
          const ay = y < 0 ? 0 : y > 15 ? 2 : 1, ly = (y & 15) * 16, row = ((x + 1) * 18 + (y + 1)) * 18 + 1;
          const inner = ax === 1 && ay === 1;
          for (let z = -1; z <= 16; z++) {
            if (inner && z === 0) { z = 15; continue; }
            const nch = NB[ax * 9 + ay * 3 + (z < 0 ? 0 : z > 15 ? 2 : 1)];
            pad[row + z] = chunkValue(nch, lx + ly + (z & 15));
          }
        }
      }
      // underground = solid
      for (let x = -1; x <= 16; x++) for (let z = -1; z <= 16; z++) {
        const top = hcol[(x + 1) * 18 + (z + 1)] - oy;   // cells with local y < top are underground
        if (top <= -1) continue;
        const yMax = Math.min(16, top - 1);
        for (let y = -1; y <= yMax; y++) { const i = ((x + 1) * 18 + (y + 1)) * 18 + (z + 1); if (pad[i] === 0) pad[i] = 65535; }
      }
      const tg = performance.now();
      greedyPad(16, 16, 16, pad, VS, [X0 + ox * VS, Y0 + oy * VS, Z0 + oz * VS], [ox, oy, oz], out, false, cnt);
      AF.stats.greedyMs = (AF.stats.greedyMs || 0) + performance.now() - tg; AF.stats.chunksMeshed = (AF.stats.chunksMeshed || 0) + 1;
      yield;
    }
  }
}

// ---- COARSE region LOD: every chunk downsampled 2x (0.5 m cells, no AO) for regions far from the camera. A coarse cell is solid when
// >= 2 of its 8 blocks are (thin walls + lines survive, lone specks drop); it takes the most common opaque colour, else glass.
const coarseCache = new Map();
const coarseChunk = (key) => {
  let c = coarseCache.get(key); if (c !== undefined) return c;
  const ch = W.chunks[key]; if (!ch) { coarseCache.set(key, null); return null; }
  c = new Uint16Array(512); let any = false;
  const OP = AF.PAL.opaque, cols = new Uint16Array(8), cnts = new Uint8Array(8);
  for (let X = 0; X < 8; X++) for (let Y = 0; Y < 8; Y++) for (let Z = 0; Z < 8; Z++) {
    let n = 0, nOp = 0, gl = 0, nc = 0;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let d = 0; d < 2; d++) {
      const v = chunkValue(ch, (((X * 2 + a) * 16) + Y * 2 + b) * 16 + Z * 2 + d); if (!v) continue;
      n++;
      if (OP[v] !== 1) { gl = v; continue; }
      nOp++;
      let j = 0; while (j < nc && cols[j] !== v) j++;
      if (j === nc) { cols[nc] = v; cnts[nc++] = 1; } else cnts[j]++;
    }
    if (n < 2) continue;
    let best = gl;
    if (nOp >= 2 || !gl) { let bn = 0; for (let j = 0; j < nc; j++) if (cnts[j] > bn) { bn = cnts[j]; best = cols[j]; } }
    if (best) { c[(X * 8 + Y) * 8 + Z] = best; any = true; }
  }
  if (!any) c = null;
  coarseCache.set(key, c);
  return c;
};
// FAR level: coarse cells downsampled 2x again (1 m cells, same >= 2 of 8 rule)
const farCache = new Map();
const farChunk = (key) => {
  let c = farCache.get(key); if (c !== undefined) return c;
  const s = coarseChunk(key); if (!s) { farCache.set(key, null); return null; }
  c = new Uint16Array(64); let any = false;
  const OP = AF.PAL.opaque, cols = new Uint16Array(8), cnts = new Uint8Array(8);
  for (let X = 0; X < 4; X++) for (let Y = 0; Y < 4; Y++) for (let Z = 0; Z < 4; Z++) {
    let n = 0, nOp = 0, gl = 0, nc = 0;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let d = 0; d < 2; d++) {
      const v = s[((X * 2 + a) * 8 + Y * 2 + b) * 8 + Z * 2 + d]; if (!v) continue;
      n++;
      if (OP[v] !== 1) { gl = v; continue; }
      nOp++;
      let j = 0; while (j < nc && cols[j] !== v) j++;
      if (j === nc) { cols[nc] = v; cnts[nc++] = 1; } else cnts[j]++;
    }
    if (n < 2) continue;
    let best = gl;
    if (nOp >= 2 || !gl) { let bn = 0; for (let j = 0; j < nc; j++) if (cnts[j] > bn) { bn = cnts[j]; best = cols[j]; } }
    if (best) { c[(X * 4 + Y) * 4 + Z] = best; any = true; }
  }
  if (!any) c = null;
  farCache.set(key, c);
  return c;
};
// F = 2 (coarse, 0.5 m cells) or 4 (far, 1 m cells)
function meshVoxelRegionCoarse(rx, rz, out, F = 2) { runSync(meshVoxelRegionCoarseG(rx, rz, out, F)); }
function* meshVoxelRegionCoarseG(rx, rz, out, F = 2) {
  const S = 16 / F, P = S + 2, get = F === 2 ? coarseChunk : farChunk;
  const bx0 = rx * REG, bz0 = rz * REG;
  const pad = new Uint16Array(P * P * P), hcol = new Int32Array(P * P);
  for (let cx = bx0 >> 4; cx < Math.min(CX, (bx0 + REG) >> 4); cx++) for (let cz = bz0 >> 4; cz < Math.min(CZ, (bz0 + REG) >> 4); cz++) {
    const ox = cx * 16, oz = cz * 16;
    let colsReady = false;
    for (let cy = 0; cy < CY; cy++) {
      const me = get((cx * CY + cy) * CZ + cz); if (!me) continue;
      if (!colsReady) {   // lowest ground (fine blocks) under each coarse column, incl. the 1-cell border
        for (let X = -1; X <= S; X++) for (let Z = -1; Z <= S; Z++) { let h = 1e9; for (let a = 0; a < F; a++) for (let d = 0; d < F; d++) h = Math.min(h, W.hB(ox + X * F + a, oz + Z * F + d)); hcol[(X + 1) * P + Z + 1] = h + GOFF; }
        colsReady = true;
      }
      const oy = cy * 16;
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let d = -1; d <= 1; d++) {
        const nx = cx + a, ny = cy + b, nz = cz + d;
        const nch = (nx < 0 || ny < 0 || nz < 0 || nx >= CX || ny >= CY || nz >= CZ) ? null : (a | b | d ? get((nx * CY + ny) * CZ + nz) : me);
        const xs = a < 0 ? S - 1 : 0, xe = a < 0 ? S : a > 0 ? 1 : S, ys = b < 0 ? S - 1 : 0, ye = b < 0 ? S : b > 0 ? 1 : S, zs = d < 0 ? S - 1 : 0, ze = d < 0 ? S : d > 0 ? 1 : S;
        for (let x = xs; x < xe; x++) for (let y = ys; y < ye; y++) for (let z = zs; z < ze; z++) {
          const px = a < 0 ? 0 : a > 0 ? S + 1 : x + 1, py = b < 0 ? 0 : b > 0 ? S + 1 : y + 1, pz = d < 0 ? 0 : d > 0 ? S + 1 : z + 1;
          pad[(px * P + py) * P + pz] = nch ? nch[(x * S + y) * S + z] : 0;
        }
      }
      for (let X = -1; X <= S; X++) for (let Z = -1; Z <= S; Z++) {
        const top = hcol[(X + 1) * P + Z + 1] - oy;   // fine y below which everything is underground
        for (let Y = -1; Y <= S; Y++) { if (Y * F + F - 1 >= top) break; const i = ((X + 1) * P + Y + 1) * P + Z + 1; if (pad[i] === 0) pad[i] = 65535; }
      }
      greedyPad(S, S, S, pad, VS * F, [X0 + ox * VS, Y0 + oy * VS, Z0 + oz * VS], [ox / F, oy / F, oz / F], out, true, null, F);
      yield;
    }
  }
}
// FAR level terrain: F x F columns -> one cell at their most common height; low same-colour steps are soft risers
function meshTerrainRegionFar(rx, rz, buf, F) {
  const H = W.H, C = W.C, SC = W.S, dirtI = AF.col('dirt');
  const bx0 = rx * REG, bz0 = rz * REG, w = ((Math.min(NX, bx0 + REG) - bx0) / F) | 0, d = ((Math.min(NZ, bz0 + REG) - bz0) / F) | 0;
  const P = d + 2, hs = new Int32Array((w + 2) * P), cs = new Uint16Array((w + 2) * P), ss = new Uint16Array((w + 2) * P);
  const vals = new Int32Array(F * F);
  for (let i = -1; i <= w; i++) for (let k = -1; k <= d; k++) {
    const bx = bx0 + i * F, bz = bz0 + k * F, o = (i + 1) * P + k + 1;
    if (bx < 0 || bz < 0 || bx + F > NX || bz + F > NZ) { hs[o] = -99999; continue; }
    let n = 0; for (let a = 0; a < F; a++) for (let b = 0; b < F; b++) vals[n++] = H[(bx + a) * NZ + bz + b];
    let best = vals[0], bn = 0;
    if (vals.some((v) => v !== best)) for (let p = 0; p < n; p++) { let m = 0; for (let q = 0; q < n; q++) if (vals[q] === vals[p]) m++; if (m > bn) { bn = m; best = vals[p]; } }
    let ci = bx * NZ + bz;
    for (let a = 0; a < F; a++) for (let b = 0; b < F; b++) if (H[(bx + a) * NZ + bz + b] === best) { ci = (bx + a) * NZ + bz + b; a = b = F; }
    hs[o] = best; cs[o] = C[ci]; ss[o] = SC[ci];
  }
  const done = new Uint8Array(w * d);
  for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) {
    if (done[i * d + k]) continue;
    const o = (i + 1) * P + k + 1, h = hs[o], c = cs[o];
    let len = 1; while (k + len < d && !done[i * d + k + len] && hs[o + len] === h && cs[o + len] === c) len++;
    let wid = 1;
    for (; i + wid < w; wid++) { let ok = true; for (let t = 0; t < len; t++) { const q = (i + wid + 1) * P + k + t + 1; if (done[(i + wid) * d + k + t] || hs[q] !== h || cs[q] !== c) { ok = false; break; } } if (!ok) break; }
    for (let a = 0; a < wid; a++) for (let t = 0; t < len; t++) done[(i + a) * d + k + t] = 1;
    const y = h * VS, xa = X0 + (bx0 + i * F) * VS, xb = xa + wid * F * VS, za = Z0 + (bz0 + k * F) * VS, zb = za + len * F * VS, u0 = bx0 + i * F, v0 = bz0 + k * F;
    buf.quad([xa, y, za], [xa, y, zb], [xb, y, zb], [xb, y, za], [u0, v0], [u0, v0 + len * F], [u0 + wid * F, v0 + len * F], [u0 + wid * F, v0], c, 2, [3, 3, 3, 3]);
  }
  const L = [1, 1, 3, 3];
  for (const [dx, dz, nIdx] of [[1, 0, 0], [-1, 0, 1], [0, 1, 4], [0, -1, 5]]) {
    for (let i = 0; i < w; i++) for (let k = 0; k < d; k++) {
      const o = (i + 1) * P + k + 1, h = hs[o], nh = hs[o + dx * P + dz];
      if (nh === -99999 || nh >= h) continue;
      const topC = cs[o], soft = h - nh <= F, sideC = soft ? topC : (ss[o] || (W.sideFn && W.sideFn(bx0 + i * F, bz0 + k * F, (h + nh) >> 1, topC)) || dirtI);
      const bx = bx0 + i * F, bz = bz0 + k * F;
      const face = (ylo, yhi, col, fl) => {
        if (yhi <= ylo) return;
        const Y0b = ylo * VS, Y1b = yhi * VS;
        if (dz !== 0) {
          const zf = Z0 + (bz + (dz > 0 ? F : 0)) * VS, xa = X0 + bx * VS, xb = xa + F * VS;
          if (dz > 0) buf.quad([xa, Y0b, zf], [xb, Y0b, zf], [xb, Y1b, zf], [xa, Y1b, zf], [bx, ylo], [bx + F, ylo], [bx + F, yhi], [bx, yhi], col, nIdx, L, fl);
          else buf.quad([xb, Y0b, zf], [xa, Y0b, zf], [xa, Y1b, zf], [xb, Y1b, zf], [bx + F, ylo], [bx, ylo], [bx, yhi], [bx + F, yhi], col, nIdx, L, fl);
        } else {
          const xf = X0 + (bx + (dx > 0 ? F : 0)) * VS, za = Z0 + bz * VS, zb = za + F * VS;
          if (dx > 0) buf.quad([xf, Y0b, zb], [xf, Y0b, za], [xf, Y1b, za], [xf, Y1b, zb], [bz + F, ylo], [bz, ylo], [bz, yhi], [bz + F, yhi], col, nIdx, L, fl);
          else buf.quad([xf, Y0b, za], [xf, Y0b, zb], [xf, Y1b, zb], [xf, Y1b, za], [bz, ylo], [bz + F, ylo], [bz + F, yhi], [bz, yhi], col, nIdx, L, fl);
        }
      };
      if (soft) face(nh, h, topC, 32); else { face(nh, h - 1, sideC, 0); face(h - 1, h, topC, 0); }
    }
  }
}

// ---- static props: merged per region with typed arrays. FAR version (downsampled, flat) always exists;
// the NEAR full-detail version is streamed in for regions within AF.LOD_DIST of the camera and freed beyond it.
const ROTN = [[0, 1, 2, 3, 4, 5], [5, 4, 2, 3, 0, 1], [1, 0, 2, 3, 5, 4], [4, 5, 2, 3, 1, 0]];
AF.world.propsByRegion = new Map();
const regionKeyOf = (x, z) => { const bx = W.bx(x), bz = W.bz(z); if (bx < 0 || bz < 0 || bx >= NX || bz >= NZ) return -1; return (bx >> 7) * 64 + (bz >> 7); };
AF.world.indexProp = (pr) => { const k = regionKeyOf(pr.x, pr.z); if (k < 0) return; let a = AF.world.propsByRegion.get(k); if (!a) AF.world.propsByRegion.set(k, a = []); a.push(pr); };
function mergeProps(list, pick) {
  let nv = 0, ni = 0;
  const parts = [];
  for (const pr of list) { const g = pick(pr); if (!g) continue; parts.push([pr, g]); nv += g.attributes.position.count; ni += g.index.count; }
  if (!nv) return null;
  const P = new Float32Array(nv * 3), U = new Int16Array(nv * 2), L = new Uint16Array(nv), N = new Uint8Array(nv), I = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let vo = 0, io = 0;
  for (const [pr, g] of parts) {
    const p = g.attributes.position.array, uv = g.attributes.aBU.array, pal = g.attributes.aPal.array, an = g.attributes.aAN.array, ix = g.index.array, r = pr.rot, rn = ROTN[r];
    const positionScale = g.userData.positionScale || 1;
    const n = g.attributes.position.count;
    for (let i = 0; i < n; i++) {
      let x = p[i * 3] * positionScale, z = p[i * 3 + 2] * positionScale;
      if (r === 1) { const t = x; x = z; z = -t; } else if (r === 2) { x = -x; z = -z; } else if (r === 3) { const t = x; x = -z; z = t; }
      const j = vo + i;
      P[j * 3] = pr.x + x; P[j * 3 + 1] = pr.y + p[i * 3 + 1] * positionScale; P[j * 3 + 2] = pr.z + z;
      U[j * 2] = uv[i * 2]; U[j * 2 + 1] = uv[i * 2 + 1]; L[j] = pal[i];
      const a = an[i], nidx = a % 8; N[j] = a - nidx + rn[nidx];
    }
    for (let i = 0; i < ix.length; i++) I[io + i] = vo + ix[i];
    vo += n; io += ix.length;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(P, 3));
  geo.setAttribute('aBU', new THREE.BufferAttribute(U, 2));
  geo.setAttribute('aPal', new THREE.BufferAttribute(L, 1));
  geo.setAttribute('aAN', new THREE.BufferAttribute(N, 1));
  geo.setIndex(new THREE.BufferAttribute(I, 1));
  geo.computeBoundingSphere();
  return geo;
}
function afDisposeArray() { this.array = null; }
function afDisposeRegionArray() { if (this.array) AF.regionArrayBytesFreed = (AF.regionArrayBytesFreed || 0) + this.array.byteLength; this.array = null; }
AF.staticUploadQueue = [];
AF.releaseStaticGeometry = (geo) => {
  if (geo.userData.releaseStatic) return;
  if (!geo.boundingBox) geo.computeBoundingBox();
  if (!geo.boundingSphere) geo.computeBoundingSphere();
  geo.userData.releaseStatic = true;
  for (const attribute of Object.values(geo.attributes)) attribute.onUpload(afDisposeRegionArray);
  if (geo.index) geo.index.onUpload(afDisposeRegionArray);
  AF.staticUploadQueue.push(geo);
};
const regMesh = (geo, mat, cast) => {
  geo.computeBoundingBox();
  AF.releaseStaticGeometry(geo);
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = true; m.matrixAutoUpdate = false; m.updateMatrix(); if (mat === AF.mat.glass) m.renderOrder = 2; AF.world.group.add(m); return m; };
AF.test('voxel: uploaded region arrays are released', () => {
  let bad = 0;
  for (const mesh of AF.world.group.children) {
    const geo = mesh.geometry, position = geo && geo.attributes.position;
    if (!position || position.onUploadCallback !== afDisposeRegionArray || position.array !== null) continue;
    if (!geo.boundingSphere || !geo.boundingBox || (geo.index && geo.index.array !== null)) bad++;
  }
  return { ok: !bad && AF.regionArrayBytesFreed > 0, info: ((AF.regionArrayBytesFreed || 0) / 1048576).toFixed(1) + ' MiB position/index arrays released; invalid bounds/index ' + bad };
});
const dropMesh = (m) => { if (!m) return; AF.world.group.remove(m); m.geometry.userData.memDisposed = true; m.geometry.dispose(); };
AF.world.lod = new Map();   // key -> {cx, cz, far, near, nearGlass, props}
AF.world.coarse = new Map(); // key -> [coarse region meshes] (shown instead of the full region beyond AF.REGION_LOD)
AF.LOD_DIST = 110;
AF.REGION_LOD = 130;
AF.FAR_LOD = 1e9;
// LOD CROSS-FADE (PERF.md §4, locked): every swap between voxel-material LOD copies (region full <-> 0.5 m coarse, cluster
// regions <-> 1 m far copy, props near <-> far, far-prop cull) dithers over FADE.dur instead of popping. All swaps requested
// while a ramp runs start together with the next ramp (shared uFadeK; at most FADE.dur late). Owners must not write .visible
// on their LOD meshes while owner.fadeE is set. Non-voxel meshes (glass) switch when the ramp starts. ?nofade disables.
const FADE = AF.world.fade = { on: !AF.Q.has('nofade') && !AF.SHOT && !AF.TEST, dur: 0.3, k: 1, act: [], pend: [], mats: null, swaps: 0, warmKey: '' };
const fadeMats = () => FADE.mats || (FADE.mats = {
  in: AF.mat.patchVoxel(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 }), 'fadeIn'),
  out: AF.mat.patchVoxel(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.88, metalness: 0.0 }), 'fadeOut'),
});
const seenByCam = (m) => m.visible && (m.layers.mask & 1) !== 0 && !!m.parent;
FADE.swap = (owner, outs, ins, done) => {
  const live = AF.ready && FADE.on;
  const e = { owner, outs: [], ins: [], done };
  for (const m of outs) if (m && seenByCam(m)) e.outs.push(m);
  for (const m of ins) {
    if (!m) continue;
    if (!live) { m.layers.set(0); m.visible = true; continue; }
    if (seenByCam(m) && m.material === AF.mat.voxel) continue;     // already on screen: nothing to fade in
    m.visible = false; e.ins.push(m);                                // shown when the ramp starts
  }
  if (!live) { for (const m of e.outs) m.visible = false; if (done) done(); return; }
  owner.fadeE = e; FADE.pend.push(e); FADE.swaps++;
};
const fadeStart = () => {
  const M = fadeMats(), V = AF.mat.voxel;
  for (const m of [M.in, M.out]) { if (!!m.envMap !== !!V.envMap) m.needsUpdate = true; m.envMap = V.envMap; m.envMapIntensity = V.envMapIntensity; }
  const t = FADE.act; FADE.act = FADE.pend; FADE.pend = t; FADE.pend.length = 0; FADE.k = 0;
  for (const e of FADE.act) {
    for (const m of e.outs) if (m.material === V) m.material = M.out;
    for (const m of e.ins) { m.layers.set(0); m.visible = true; if (m.material === V) m.material = M.in; }
  }
};
const fadeFinish = (e) => {
  const M = fadeMats(), V = AF.mat.voxel;
  for (const m of e.outs) { m.visible = false; if (m.material === M.out) m.material = V; }
  for (const m of e.ins) if (m.material === M.in) m.material = V;
  if (e.owner.fadeE === e) e.owner.fadeE = null;
  if (e.done) e.done();
};
const fadeEnd = () => { for (const e of FADE.act) fadeFinish(e); FADE.act.length = 0; FADE.k = 1; };
// drop an owner's swap before it decides again: a pending one leaves the old state (ins hidden, outs shown), a running one completes
FADE.cancel = (owner) => {
  const e = owner.fadeE; if (!e) return; owner.fadeE = null;
  let i = FADE.pend.indexOf(e); if (i >= 0) { FADE.pend.splice(i, 1); return; }
  i = FADE.act.indexOf(e); if (i >= 0) { FADE.act.splice(i, 1); fadeFinish(e); }
};
AF.onTick('lod-fade', 881, (dt) => {
  const U = AF.mat.uniforms;
  if (FADE.act.length) { FADE.k += dt / FADE.dur; if (FADE.k >= 1) fadeEnd(); }
  if (!FADE.act.length && FADE.pend.length) fadeStart();
  U.uFadeK.value = Math.min(1, FADE.k);
  // first use of a fade variant would compile a big program mid-game: compile both whenever the voxel program inputs change
  // (tier = light / shadow state, env map) by drawing a degenerate triangle with each for one frame
  if (!AF.ready || !FADE.on) return;
  const key = AF.GFX.name + (AF.mat.voxel.envMap ? 'e' : '');
  if (FADE.warm) { for (const w of FADE.warm) AF.scene.remove(w); FADE.warm = null; }
  if (key !== FADE.warmKey) {
    FADE.warmKey = key; const M = fadeMats(), V = AF.mat.voxel;
    for (const m of [M.in, M.out]) { if (!!m.envMap !== !!V.envMap) m.needsUpdate = true; m.envMap = V.envMap; }
    const g = FADE.warmGeo || (FADE.warmGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(9), 3)));
    FADE.warm = [M.in, M.out].map((mat) => { const w = new THREE.Mesh(g, mat); w.frustumCulled = false; w.receiveShadow = true; AF.scene.add(w); return w; });
  }
});
// FAR clusters: 4 x 4 regions (128 m) merged into ONE 1 m mesh (voxels + terrain) — ~16x fewer far draw calls,
// shadow casters and state changes than per-region copies. Built lazily after the first frame, one member region per frame
// (farthest clusters first), shown when the whole cluster box is beyond AF.FAR_LOD. AF.world.farStats = { built, kept, pending, ms }.
const CL = 4;
const farQueue = []; let farQ0 = false;
const FS = AF.world.farStats = { built: 0, kept: 0, pending: 0, ms: 0, clusters: 0 };
const CLS = AF.world.clusters = new Map();
const clusterOf = (rx, rz) => {
  const ck = (rx >> 2) * 64 + (rz >> 2); let c = CLS.get(ck);
  if (!c) {
    const m = CL * REG * VS, x0 = X0 + (rx >> 2) * m, z0 = Z0 + (rz >> 2) * m;
    c = { ck, x0, z0, x1: x0 + m, z1: z0 + m, regs: [], far: [], lvl: 0, built: false, i: 0, out: null };
    CLS.set(ck, c); FS.clusters = CLS.size;
  }
  return c;
};
function farStep(c) {
  if (c.built || !c.regs.length) return true;
  const t = performance.now();
  if (!c.out) c.out = { opaque: new GeoBuf(), glass: new GeoBuf() };
  const k = c.regs[c.i++];
  // per-region index ranges of the merged copy: a half-streamed cluster hides the parts whose full regions are ready (partial reveal)
  const o0 = c.out.opaque.n, g0 = c.out.glass.n;
  meshTerrainRegionFar(k >> 6, k & 63, c.out.opaque, 4);
  meshVoxelRegionCoarse(k >> 6, k & 63, c.out, 4);
  (c.ranges || (c.ranges = [])).push({ k, os: o0 * 1.5, oc: (c.out.opaque.n - o0) * 1.5, gs: g0 * 1.5, gc: (c.out.glass.n - g0) * 1.5 });
  coarseCache.clear(); farCache.clear();
  if (c.i >= c.regs.length) {
    const o = c.out; c.out = null; c.built = true; FS.built++;
    if (o.opaque.n) { const m = regMesh(o.opaque.geometry(), AF.mat.voxel, true); m.userData.far = true; m.userData.cluster = c.ck; m.visible = false; c.far.push(m); c.farO = m; FS.kept++; }
    if (o.glass.n) { const g = regMesh(o.glass.geometry(), AF.mat.glass, false); g.userData.far = true; g.visible = false; c.far.push(g); c.farG = g; }
  }
  FS.ms += performance.now() - t;
  return c.built;
}
const buildFar = (c) => { while (!farStep(c)); };
AF.world.buildFarAll = () => { while (farQueue.length) buildFar(farQueue.pop()); FS.pending = 0; };
AF.test('voxel: far clusters (1 m, 4x4 regions) replace their regions', () => {
  let c = null;
  for (const x of CLS.values()) if (x.far.length) { c = x; break; }
  if (!c) for (const x of CLS.values()) if (!x.built) { buildFar(x); if (x.far.length) { c = x; break; } }
  const f = c && c.far[0];
  const fullQ = c ? c.regs.reduce((s, k) => { const r = AF.world.regLod.get(k); return s + (r ? r.q / 4 : 0); }, 0) : 0;
  const ok = !!f && f.material === AF.mat.voxel && f.userData.far && AF.FAR_LOD > AF.REGION_LOD && f.geometry.index.count / 6 < fullQ;
  return { ok, info: 'cluster ' + (f ? f.geometry.index.count / 6 + ' quads vs ' + Math.round(fullQ) + ' for ' + c.regs.length + ' regions' : 'none') + ', FAR_LOD ' + AF.FAR_LOD + ', clusters ' + CLS.size + ' built ' + FS.built };
});
AF.onTick('far-lod-build', 879, () => {
  if (!AF.ready || !AF.world.regLod) return;
  if (!farQ0) {
    farQ0 = true; const c = AF.camera.position, dist = (x) => Math.hypot((x.x0 + x.x1) / 2 - c.x, (x.z0 + x.z1) / 2 - c.z);
    farQueue.push(...[...CLS.values()].sort((a, b) => dist(a) - dist(b)));
  }
  if (!farQueue.length) return;
  if (AF.SHOT) { AF.world.buildFarAll(); return; }
  const t0 = performance.now();
  while (farQueue.length && performance.now() - t0 < 3) { if (farStep(farQueue[farQueue.length - 1])) farQueue.pop(); }
  FS.pending = farQueue.length;
});
// far prop meshes skip what can't be seen from a distance: furniture under a roof and tiny clutter
const roofOver = (x, y, z) => { const bx = W.bx(x), bz = W.bz(z), OP = AF.PAL.opaque; for (let by = W.by(y), e = Math.min(NY - 1, W.by(y + 14)); by <= e; by++) { const c = W.get(bx, by, bz); if (c && OP[c]) return true; } return false; };
function farPick(pr) {
  if (pr.farSkip === undefined) {
    const g = pr.geo, bb = g.boundingBox || (g.computeBoundingBox(), g.boundingBox);
    const big = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z);
    pr.farSkip = big < 0.7 || (big < 9 && roofOver(pr.x, pr.y + bb.max.y + 0.3, pr.z));
  }
  return pr.farSkip ? null : (AF.lodOf(pr.geo) || pr.geo);
}
function buildNear(reg) {
  const t = performance.now();
  const g = mergeProps(reg.props, (pr) => pr.geo);
  const gg = mergeProps(reg.props, (pr) => pr.geo.userData.glass || null);
  reg.near = g ? regMesh(g, AF.mat.voxel, true) : null;
  reg.nearGlass = gg ? regMesh(gg, AF.mat.glass, false) : null;
  // hidden until prop-lod shows (or fades) them in
  if (reg.near) reg.near.visible = false;
  if (reg.nearGlass) reg.nearGlass.visible = false;
  reg.nearBuilt = true;
  AF.stats.nearMs = Math.round(performance.now() - t);
}
function freeNear(reg) { dropMesh(reg.near); dropMesh(reg.nearGlass); reg.near = reg.nearGlass = null; reg.nearBuilt = false; }

const dropRegion = (k) => {
  const old = AF.world.regions.get(k); if (old) for (const m of old) dropMesh(m); AF.world.regions.delete(k);
  const oldC = AF.world.coarse.get(k); if (oldC) for (const m of oldC) dropMesh(m); AF.world.coarse.delete(k);
  const oldL = AF.world.lod.get(k); if (oldL) { freeNear(oldL); dropMesh(oldL.far); } AF.world.lod.delete(k);
  if (AF.world.regLod) AF.world.regLod.delete(k);
};
AF.meshRegion = (rx, rz) => runSync(meshRegionG(rx, rz));
const COARSE_ON = !AF.Q.has('nocoarse');
function* meshRegionG(rx, rz) {
  const k = rx * 64 + rz;
  dropRegion(k);
  const out = { opaque: new GeoBuf(), glass: new GeoBuf() };
  const T = AF.stats.meshT || (AF.stats.meshT = { terrain: 0, voxel: 0, coarse: 0, far: 0, gpu: 0 });
  let tt = performance.now();
  meshTerrainRegion(rx, rz, out.opaque);
  const terrainQ = out.opaque.n;
  T.terrain += performance.now() - tt;
  yield;
  tt = performance.now();
  // coarse copy first (terrain quads are shared: copy them before the fine voxels are appended)
  const cout = { opaque: new GeoBuf(), glass: new GeoBuf() };
  if (COARSE_ON && terrainQ) { const o = out.opaque, c = cout.opaque; c.p = o.p.slice(); c.uv = o.uv.slice(); c.pal = o.pal.slice(); c.an = o.an.slice(); c.idx = o.idx.slice(); c.n = o.n; }
  yield* meshVoxelRegionG(rx, rz, out);
  T.voxel += performance.now() - tt; tt = performance.now();
  for (let cx = (rx * REG) >> 4, e = Math.min(CX, (rx * REG + REG) >> 4); cx < e; cx++) for (let cz = (rz * REG) >> 4, f = Math.min(CZ, (rz * REG + REG) >> 4); cz < f; cz++) for (let cy = 0; cy < CY; cy++) coarseCache.delete((cx * CY + cy) * CZ + cz);
  if (COARSE_ON) yield* meshVoxelRegionCoarseG(rx, rz, cout);
  T.coarse += performance.now() - tt;
  yield;
  const meshes = [], cmeshes = [];
  const keepC = COARSE_ON && out.opaque.n - terrainQ > 400 && cout.opaque.n < out.opaque.n * 0.8;
  // typed-array conversion happens here: one geometry per step so a dense block never costs a streamed frame much
  const nO = out.opaque.n, nC = cout.opaque.n;
  const gO = nO ? out.opaque.geometry() : null; out.opaque = null; yield;
  const gG = out.glass.n ? out.glass.geometry() : null; yield;
  const gCO = keepC && cout.opaque.n ? cout.opaque.geometry() : null; yield;
  const gCG = keepC && cout.glass.n ? cout.glass.geometry() : null;
  if (gO) { const m = regMesh(gO, AF.mat.voxel, true); m.userData.region = k; meshes.push(m); }
  if (gG) meshes.push(regMesh(gG, AF.mat.glass, false));
  // only keep a coarse copy when it actually saves something
  if (gCO) { const m = regMesh(gCO, AF.mat.voxel, true); m.userData.region = k; m.userData.coarse = true; m.visible = false; cmeshes.push(m); }
  if (gCG) { const m = regMesh(gCG, AF.mat.glass, false); m.userData.coarse = true; m.visible = false; cmeshes.push(m); }
  AF.world.regions.set(k, meshes);
  if (cmeshes.length) AF.world.coarse.set(k, cmeshes); else AF.world.coarse.delete(k);
  const RL = AF.world.regLod || (AF.world.regLod = new Map());
  const cl = clusterOf(rx, rz); if (!cl.regs.includes(k)) cl.regs.push(k);
  RL.set(k, { cx: X0 + (rx + 0.5) * REG * VS, cz: Z0 + (rz + 0.5) * REG * VS, full: meshes, coarse: cmeshes, lvl: -1, hid: cl.lvl === 1 && !cl.part, q: cmeshes.length ? nC : nO });
  const props = AF.world.propsByRegion.get(k) || [];
  let farQ = 0;
  if (props.length) {
    // warm the per-model far LODs a few ms at a time (AF.lodOf builds them lazily) so the merge below is just copying
    let tw = performance.now();
    for (const pr of props) { farPick(pr); if (performance.now() - tw > 3) { yield; tw = performance.now(); } }
    const reg = { cx: X0 + (rx + 0.5) * REG * VS, cz: Z0 + (rz + 0.5) * REG * VS, props, far: null, near: null, nearGlass: null, nearBuilt: false };
    const tf = performance.now();
    const fg = mergeProps(props, farPick);
    T.far += performance.now() - tf;
    if (fg) { reg.far = regMesh(fg, AF.mat.voxel, true); farQ = fg.attributes.position.count / 4; }
    AF.world.lod.set(k, reg);
  } else AF.world.lod.delete(k);
  return nO / 4 + farQ;
}
// REGION STREAMING (not in ?test / ?shot / ?near / ?nostream): boot meshes only the regions around AF.PLAN.bootFocus plus the 1 m
// clusters for the whole island; full regions stream in nearest-cluster-first a few ms per frame (a cluster swaps from its 1 m copy
// only once all 16 of its regions are ready, so nothing overlaps or flickers) and whole clusters far behind the camera are unloaded.
const STR = AF.world.stream = { on: false, pending: new Set(), gen: null, key: -1, done: 0, unloaded: 0, t: 0, maxStep: 0 };
const regionCluster = (k) => CLS.get(((k >> 6) >> 2) * 64 + ((k & 63) >> 2));
const clDist = (cl, c, vy) => Math.hypot(Math.max(cl.x0 - c.x, 0, c.x - cl.x1), Math.max(cl.z0 - c.z, 0, c.z - cl.z1), vy);
// Priority (PERF.md §5): the nearer of the camera and a 1.5 s velocity-predicted point (fast planes load ahead of the nose).
// Work runs a little every frame plus in the idle slots of the fps cap (AF.onIdle), where it costs the rendered frames nothing.
const LA = { x: 0, z: 0, px: 0, pz: 0, vx: 0, vz: 0, init: false };
AF.onTick('stream-look', 877, (dt) => {
  const c = AF.camera.position;
  if (!LA.init || dt <= 0) { LA.px = c.x; LA.pz = c.z; LA.init = true; }
  const k = Math.min(1, dt * 3), vx = (c.x - LA.px) / Math.max(dt, 1e-3), vz = (c.z - LA.pz) / Math.max(dt, 1e-3);
  if (Math.hypot(vx, vz) < 400) { LA.vx += (vx - LA.vx) * k; LA.vz += (vz - LA.vz) * k; }     // ignore teleports
  LA.px = c.x; LA.pz = c.z;
  const s = Math.min(1, 250 / (Math.hypot(LA.vx, LA.vz) * 1.5 + 1e-3));
  LA.x = c.x + LA.vx * 1.5 * s; LA.z = c.z + LA.vz * 1.5 * s;
});
const streamWork = (budget) => {
  if (!STR.on || !AF.ready) return false;
  const c = AF.camera.position, vy = Math.max(0, c.y - 12) * 0.7, FD = AF.FAR_LOD || 1e9;
  const t0 = performance.now();
  while (performance.now() - t0 < budget) {
    if (!STR.gen) {
      let best = null, bd = FD + 48;
      for (const cl of CLS.values()) if (cl.pending > 0) { const d = Math.min(clDist(cl, c, vy), clDist(cl, LA, vy) + 24); if (d < bd) { bd = d; best = cl; } }
      if (!best) return false;
      let bk = -1, bkd = 1e18;
      for (const k of best.regs) if (STR.pending.has(k)) { const x = X0 + ((k >> 6) + 0.5) * REG * VS, z = Z0 + ((k & 63) + 0.5) * REG * VS, d = (x - c.x) ** 2 + (z - c.z) ** 2; if (d < bkd) { bkd = d; bk = k; } }
      if (bk < 0) { best.pending = 0; continue; }
      STR.key = bk; STR.gen = meshRegionG(bk >> 6, bk & 63);
    }
    const ts = performance.now(), fin = STR.gen.next().done, st = performance.now() - ts;
    if (st > STR.maxStep) STR.maxStep = st;
    if (fin) { STR.gen = null; STR.pending.delete(STR.key); const cl = regionCluster(STR.key); if (cl) cl.pending = Math.max(0, cl.pending - 1); STR.done++; coarseCache.clear(); }
  }
  return true;
};
AF.onIdle('region-stream', (ms) => streamWork(ms));
AF.onTick('region-stream', 878, (dt) => {
  if (!STR.on || !AF.ready) return;
  const c = AF.camera.position, vy = Math.max(0, c.y - 12) * 0.7, FD = AF.FAR_LOD || 1e9;
  // idle slots ran recently (fps cap on): a token slice here; otherwise the old per-frame budget
  const idle = AF.frameStats && AF.frameStats.idleT > AF.clock.t - 0.25;
  streamWork(idle ? 1.5 : AF.MOBILE ? 3 : AF.mode === 'cine' ? 9 : 5);
  if ((STR.t += dt) > 2) {
    STR.t = 0;
    const cur = STR.gen ? regionCluster(STR.key) : null;
    for (const cl of CLS.values()) {
      if (cl.pending > 0 || !cl.built || cl === cur || clDist(cl, c, vy) < FD + (AF.MOBILE ? 140 : 420)) continue;
      for (const k of cl.regs) { dropRegion(k); STR.pending.add(k); }
      cl.pending = cl.regs.length; STR.unloaded++;
    }
  }
});
const HIDDEN_MAT = new THREE.MeshBasicMaterial({ visible: false });
function setPartial(cl, on, RL, keepRegions) {
  cl.part = on; cl.partN = -1;
  const O = cl.farO, G = cl.farG;
  O.geometry.clearGroups(); if (G) G.geometry.clearGroups();
  if (on) {
    for (const r of cl.ranges) { if (r.oc) O.geometry.addGroup(r.os, r.oc, 0); if (G && r.gc) G.geometry.addGroup(r.gs, r.gc, 0); }
    O.material = [AF.mat.voxel, HIDDEN_MAT]; if (G) G.material = [AF.mat.glass, HIDDEN_MAT];
    return;
  }
  O.material = AF.mat.voxel; if (G) G.material = AF.mat.glass;
  if (keepRegions) return;
  for (const k of cl.regs) {
    const r = RL.get(k); if (!r || r.hid) continue;
    FADE.cancel(r); r.hid = true; r.lvl = 3;
    for (const m of r.full) m.visible = false;
    for (const m of r.coarse) m.visible = false;
  }
}
function updatePartial(cl, RL) {
  cl.partN = cl.pending;
  const O = cl.farO, G = cl.farG; let oi = 0, gi = 0;
  for (const rg of cl.ranges) {
    const r = RL.get(rg.k), ready = !!r;
    if (rg.oc) O.geometry.groups[oi++].materialIndex = ready ? 1 : 0;
    if (G && rg.gc) G.geometry.groups[gi++].materialIndex = ready ? 1 : 0;
    if (ready && r.hid) { r.hid = false; r.lvl = -1; }
  }
}
AF.onTick('prop-lod', 880, () => {
  if (!AF.world.group) return;
  const c = AF.camera.position, D = AF.LOD_DIST;
  // region LOD: full voxels near the camera, the 0.5 m coarse copy beyond AF.REGION_LOD; whole 128 m clusters swap to their merged
  // 1 m copy once the nearest point of the cluster is beyond AF.FAR_LOD (hysteresis so nothing flickers on a boundary)
  const RL = AF.world.regLod;
  if (RL) {
    const RD = AF.REGION_LOD, FD = AF.FAR_LOD || 1e9, vy = Math.max(0, c.y - 12) * 0.7;
    const regWant = (r) => r.coarse.length && Math.hypot(r.cx - c.x, r.cz - c.z, vy) > RD + (r.lvl === 1 ? -12 : 12) ? 1 : 0;
    for (const cl of CLS.values()) {
      if (!cl.built) continue;
      const dx = Math.max(cl.x0 - c.x, 0, c.x - cl.x1), dz = Math.max(cl.z0 - c.z, 0, c.z - cl.z1);
      const near = Math.hypot(dx, dz, vy) <= FD + (cl.lvl ? -16 : 16);
      const want = cl.pending > 0 || !near ? 1 : 0;
      // PARTIAL REVEAL (PERF.md §5): a streaming cluster in view range shows each region as soon as it is meshed and hides that
      // region's slice of the 1 m copy (geometry groups, one extra draw per slice only while half-loaded)
      const part = cl.pending > 0 && near && !!cl.ranges && cl.farO && !!STR.on;
      if (part !== !!cl.part) setPartial(cl, part, RL);
      if (part && cl.partN !== cl.pending) updatePartial(cl, RL);
      if (want === cl.lvl) continue;
      cl.lvl = want; FADE.cancel(cl);
      for (const k of cl.regs) { const r = RL.get(k); if (r) FADE.cancel(r); }
      if (!want && cl.part) {
        // the last slices just finished: everything else is already on screen
        setPartial(cl, false, RL, true);
        for (const m of cl.far) m.visible = false;
        for (const k of cl.regs) { const r = RL.get(k); if (r && r.hid) { r.hid = false; r.lvl = -1; } }
        continue;
      }
      if (want && cl.part) {
        // went back to streaming while revealing (boot, unload): keep the revealed regions, show the rest of the 1 m copy
        for (const m of cl.far) { m.visible = true; m.layers.set(0); }
        cl.partN = -1; updatePartial(cl, RL);
        continue;
      }
      if (want) {
        // regions -> the cluster's 1 m copy: what is on screen now fades out; shadow-only stand-ins go at once
        const outs = [];
        for (const k of cl.regs) {
          const r = RL.get(k); if (!r) continue;
          r.hid = true; r.lvl = 3;
          for (const m of r.full) if (seenByCam(m)) outs.push(m); else m.visible = false;
          for (const m of r.coarse) if (seenByCam(m)) outs.push(m); else m.visible = false;
        }
        FADE.swap(cl, outs, cl.far);
      } else {
        // 1 m copy -> regions, each straight at its own level (full or 0.5 m)
        const ins = [];
        for (const k of cl.regs) {
          const r = RL.get(k); if (!r) continue;
          r.hid = false; r.lvl = -1; r.lvl = regWant(r); r.sh = false;
          for (const m of r.full) { if (m.material === AF.mat.voxel) m.castShadow = true; if (r.lvl === 0) ins.push(m); else m.visible = false; }
          for (const m of r.coarse) { if (r.lvl === 1) ins.push(m); else { m.visible = false; m.layers.set(0); } }
        }
        FADE.swap(cl, cl.far, ins);
      }
    }
    for (const r of RL.values()) {
      if (r.fadeE) continue;
      const want = r.hid ? 3 : regWant(r);
      if (want !== r.lvl) {
        const prev = r.lvl; r.lvl = want; r.sh = false;
        if ((prev === 0 || prev === 1) && want < 2) {
          // full <-> 0.5 m: fade the copy on screen out, the other in (the coarse copy may be a shadow stand-in on layer 1)
          for (const m of r.full) if (m.material === AF.mat.voxel) m.castShadow = true;
          FADE.swap(r, prev === 0 ? r.full : r.coarse, want === 0 ? r.full : r.coarse, () => { for (const m of r.coarse) if (!m.visible) m.layers.set(0); });
        } else {
          for (const m of r.full) { m.visible = want === 0; if (m.material === AF.mat.voxel) m.castShadow = true; }
          for (const m of r.coarse) { m.visible = want === 1; m.layers.set(0); }
        }
      }
      if (r.fadeE) continue;
      // full-detail regions away from the near shadow cascade cast through their 0.5 m copy (layer 1 = shadow pass only):
      // a tower 60 m up the sun line still shadows the street, at a fraction of the depth-pass triangles
      // (phones keep no 0.5 m copy: their far regions simply stop casting)
      if (want === 0 && (r.coarse.length || AF.MOBILE)) {
        const SN = AF.shadowNear, dx = Math.max(Math.abs(r.cx - SN.cx) - 16, 0), dz = Math.max(Math.abs(r.cz - SN.cz) - 16, 0);
        const sh = dx * dx + dz * dz > (SN.r + 6) * (SN.r + 6);
        if (sh !== r.sh) {
          r.sh = sh;
          for (const m of r.full) if (m.material === AF.mat.voxel) m.castShadow = !sh;
          for (const m of r.coarse) { m.visible = sh && m.castShadow; m.layers.set(sh ? 1 : 0); }
        }
      }
    }
  }
  let budget = AF.SHOT || AF.TEST ? 1e9 : 10, best = null, bestD = 1e9;
  const t0 = performance.now(), SN = AF.shadowNear, PC = AF.PROP_CULL || 900;
  for (const [k, r] of AF.world.lod) {
    const rl = RL && RL.get(k), hid = !!(rl && rl.hid);
    const d = Math.hypot(r.cx - c.x, r.cz - c.z, Math.max(0, c.y - 12) * 0.7);
    if (hid) { if (r.nearBuilt) { FADE.cancel(r); freeNear(r); } }
    else if (!r.nearBuilt && d < D) {
      if (budget > 1e8) buildNear(r);
      else if (d < bestD) { bestD = d; best = r; }
    } else if (r.nearBuilt && d > D + 70) { FADE.cancel(r); freeNear(r); }
    const showNear = !hid && r.nearBuilt && d < D + 25, farSeen = !!r.far && !showNear && d < PC;
    // near <-> far props and the far-prop cull cross-fade (PERF.md §4); the first decision for a region just sets the state
    if (!r.fadeE && r.showNear !== undefined && (r.showNear !== showNear || r.farSeen !== farSeen)) {
      const outs = [], ins = [];
      if (r.showNear && !showNear) outs.push(r.near, r.nearGlass); else if (!r.showNear && showNear) ins.push(r.near, r.nearGlass);
      if (r.farSeen && !farSeen) outs.push(r.far); else if (!r.farSeen && farSeen) ins.push(r.far);
      FADE.swap(r, outs, ins);
    }
    r.showNear = showNear; r.farSeen = farSeen;
    if (r.fadeE) continue;
    if (r.near) r.near.visible = showNear;
    if (r.nearGlass) r.nearGlass.visible = showNear;
    // full-detail props cast only right around the shadow focus; further out their LOD copy casts instead (shadow pass only, layer 1)
    const proxy = showNear && !!r.far && Math.hypot(r.cx - SN.cx, r.cz - SN.cz) > 26;
    if (r.near && r.near.castShadow === proxy) r.near.castShadow = !proxy;
    if (r.far) { r.far.visible = showNear ? proxy : farSeen; r.far.layers.set(showNear ? 1 : 0); }
    if (AF.MOBILE && r.far) r.far.castShadow = Math.hypot(r.cx - SN.cx, r.cz - SN.cz) < SN.r + 24;
  }
  if (best && performance.now() - t0 < budget) buildNear(best);
});
// PERF.md §4/§5 guard: whatever the camera does, each region shows exactly one copy (full, 0.5 m or its cluster's 1 m slice)
AF.test('voxel: one LOD copy per region on screen', () => {
  const RL = AF.world.regLod; if (!RL) return { ok: false, info: 'no region LOD table' };
  const prev = AF.mode, P = { x: 0, y: 0, z: 0 };
  AF.modes._lodtest = { enter() {}, exit() {}, update() { AF.camera.position.set(P.x, P.y, P.z); AF.camTarget.set(P.x + 40, 0, P.z - 40); AF.camera.lookAt(AF.camTarget); } };
  const on = (m) => m.visible && (m.layers.mask & 1) && m.material !== AF.mat.glass && !!m.parent;
  let bad = 0, checked = 0;
  try {
    AF.setMode('_lodtest');
    for (const [x, y, z] of [[0, 2, -40], [-300, 180, 250], [-550, 40, -150], [0, 2, -40]]) {
      P.x = x; P.y = y; P.z = z; AF.step(3);
      for (const cl of CLS.values()) {
        if (!cl.built) continue;
        const farOn = cl.far.some(on);
        for (const k of cl.regs) {
          const r = RL.get(k); if (!r) continue; checked++;
          const n = (farOn && !(cl.part && !r.hid) ? 1 : 0) + (r.full.some(on) ? 1 : 0) + (r.coarse.some(on) ? 1 : 0);
          if (n !== 1 && !(n === 0 && cl.lvl === 1 && !cl.far.length)) bad++;
        }
      }
    }
  } finally { delete AF.modes._lodtest; if (prev && AF.modes[prev]) AF.setMode(prev); }
  return { ok: bad === 0 && checked > 0, info: checked + ' region checks, ' + bad + ' with zero or two copies' };
});
AF.meshWorld = async (progress) => {
  AF.stats = AF.stats || {}; AF.stats.meshT = null;
  if (!AF.world.group) { AF.world.group = new THREE.Group(); AF.world.group.name = 'world'; AF.scene.add(AF.world.group); }
  const NRX = Math.ceil(NX / REG), NRZ = Math.ceil(NZ / REG);
  let quads = 0, done = 0;
  const t0 = performance.now();
  // ?near=x,z,r (harness only): mesh just the regions within r m of (x,z) so a local look boots in seconds.
  const nearQ = AF.Q && AF.Q.get('near'), NEAR = nearQ ? nearQ.split(',').map(Number) : null;
  if (NEAR && NEAR.length === 3 && NEAR.every(isFinite)) { AF.NEAR = { x: NEAR[0], z: NEAR[1], r: NEAR[2] }; console.log('[af] near mode', nearQ); }
  const rm = REG * VS;
  STR.on = !AF.TEST && !AF.SHOT && !AF.NEAR && !(AF.Q && AF.Q.has('nostream'));
  const BF = AF.PLAN.bootFocus || { x: 100, z: -60, r: 110 };
  for (let rx = 0; rx < NRX; rx++) {
    for (let rz = 0; rz < NRZ; rz++) {
      if (AF.NEAR && Math.hypot(X0 + (rx + 0.5) * rm - AF.NEAR.x, Z0 + (rz + 0.5) * rm - AF.NEAR.z) > AF.NEAR.r + rm * 0.71) { done++; continue; }
      const k = rx * 64 + rz, cl = clusterOf(rx, rz); if (!cl.regs.includes(k)) cl.regs.push(k);
      if (STR.on && Math.hypot(X0 + (rx + 0.5) * rm - BF.x, Z0 + (rz + 0.5) * rm - BF.z) > BF.r) { STR.pending.add(k); cl.pending = (cl.pending || 0) + 1; done++; continue; }
      quads += AF.meshRegion(rx, rz); done++;
    }
    if (progress) await progress(done / (NRX * NRZ));
  }
  // streaming: every cluster's 1 m copy now (the whole island is visible from the first frame), full detail follows the camera
  if (STR.on) { farQ0 = true; for (const cl of CLS.values()) buildFar(cl); coarseCache.clear(); farCache.clear(); }
  coarseCache.clear();
  W.compactChunks();
  for (const w of AF.world.water) { AF.releaseStaticGeometry(w.geo); const m = new THREE.Mesh(w.geo, w.mat || AF.mat.water); m.receiveShadow = true; m.renderOrder = 1; m.name = 'water'; AF.world.group.add(m); w.mesh = m; }
  W.dirty.clear(); W.tDirty = false;
  AF.stats = Object.assign(AF.stats || {}, { quads, meshMs: Math.round(performance.now() - t0) });
  for (const k in AF.stats.meshT) AF.stats.meshT[k] = Math.round(AF.stats.meshT[k]);
  console.log('[af] world meshed:', quads, 'quads in', AF.stats.meshMs, 'ms', JSON.stringify(AF.stats.meshT));
};
// re-mesh regions touched by W.set since the last mesh (for runtime edits: doors, etc.)
AF.remeshDirty = () => { for (const k of W.dirty) AF.meshRegion(k >> 6, k & 63); W.dirty.clear(); coarseCache.clear(); for (const key of compactPending) compactChunk(key); };
AF.onTick('chunk-compaction', 870, () => {
  if (!compactEnabled || !compactPending.size) return;
  let budget = 8;
  for (const key of compactPending) { compactChunk(key); if (--budget === 0) break; }
});
AF.onBuild('prop-source-memory', 905, () => {
  const seen = new Set();
  AF.scene.traverse((object) => { if (object.geometry) seen.add(object.geometry); });
  for (const prop of AF.world.props) {
    const geo = prop.geo.userData.lod;
    if (!geo || seen.has(geo)) continue;
    seen.add(geo);
    const attribute = geo.attributes.position, positions = attribute.array;
    if (!(positions instanceof Float32Array)) continue;
    let exact = true;
    for (let index = 0; index < positions.length; index++) {
      const value = positions[index] * 32;
      if (value !== Math.round(value) || value < -32768 || value > 32767) { exact = false; break; }
    }
    if (!exact) continue;
    const packed = new Int16Array(positions.length);
    for (let index = 0; index < positions.length; index++) packed[index] = positions[index] * 32;
    geo.setAttribute('position', new THREE.BufferAttribute(packed, 3));
    geo.userData.positionScale = 1 / 32;
  }
});
AF.memStats = () => {
  const chunkBuffers = new Set(), staticBuffers = new Set(), sceneBuffers = new Set(), propBuffers = new Set(), modelBuffers = new Set(), sourceGeometries = new Set();
  const addArray = (buffers, array) => { if (array && array.buffer) buffers.add(array.buffer); };
  const addGeometry = (buffers, geo) => {
    if (!geo) return;
    for (const attribute of Object.values(geo.attributes)) addArray(buffers, attribute.array);
    if (geo.index) addArray(buffers, geo.index.array);
  };
  for (const chunk of W.chunks) {
    if (!chunk) continue;
    if (chunk.pal) { addArray(chunkBuffers, chunk.pal); addArray(chunkBuffers, chunk.idx); }
    else addArray(chunkBuffers, chunk);
  }
  for (const chunk of uniformChunks.values()) addArray(chunkBuffers, chunk);
  for (const props of AF.world.propsByRegion.values()) for (const prop of props) {
    sourceGeometries.add(prop.geo);
    if (prop.geo.userData.glass) sourceGeometries.add(prop.geo.userData.glass);
    if (prop.geo.userData.lod) sourceGeometries.add(prop.geo.userData.lod);
  }
  for (const geo of sourceGeometries) {
    addGeometry(propBuffers, geo);
    if (geo.userData.src) addArray(modelBuffers, geo.userData.src.m.v);
  }
  AF.scene.traverse((object) => {
    const geo = object.geometry;
    if (!geo || sourceGeometries.has(geo)) return;
    addGeometry(sceneBuffers, geo);
    if (geo.userData.releaseStatic) addGeometry(staticBuffers, geo);
  });
  for (const geo of AF.staticUploadQueue) if (geo && !sourceGeometries.has(geo)) { addGeometry(staticBuffers, geo); addGeometry(sceneBuffers, geo); }
  const mib = (buffers) => { let bytes = 0; for (const buffer of buffers) bytes += buffer.byteLength; return bytes / 1048576; };
  return { chunks: mib(chunkBuffers), staticGeometry: mib(staticBuffers), sceneGeometry: mib(sceneBuffers), propSources: mib(propBuffers), propModels: mib(modelBuffers), releasedStatic: (AF.regionArrayBytesFreed || 0) / 1048576 };
};
AF.test('voxel: compact chunks stay below 180 MiB and preserve sampled cells', () => {
  const stats = AF.memStats(), check = AF.chunkCompactionCheck;
  return { ok: stats.chunks < 180 && !!check && check.samples >= 3000 && check.mismatches === 0, info: stats.chunks.toFixed(1) + ' MiB; ' + (check ? check.samples + ' samples, ' + check.mismatches + ' mismatches' : 'not compacted') };
});
AF.test('voxel: compact chunk formats and copy-on-write preserve every cell', () => {
  const saved = W.chunks[0], savedOther = W.chunks[1], dirty = W.dirty.has(0), pending = compactPending.has(0);
  let ok = true;
  try {
    for (const count of [1, 16, 32, 257]) {
      const dense = new Uint16Array(4096);
      for (let index = 0; index < 4096; index++) dense[index] = index % count + 1;
      W.chunks[0] = dense; compactChunk(0);
      for (let index = 0; index < 4096; index++) if (W.get(index >> 8, (index >> 4) & 15, index & 15) !== dense[index]) ok = false;
      if (count === 1) W.chunks[1] = W.chunks[0];
      W.set(0, 0, 0, 0);
      if (W.get(0, 0, 0) !== 0 || W.get(0, 0, 1) !== dense[1] || (count === 1 && W.get(0, 0, 16) !== 1)) ok = false;
    }
    W.chunks[0] = new Uint16Array(4096); compactChunk(0);
    if (W.chunks[0] !== null) ok = false;
  } finally {
    W.chunks[0] = saved; W.chunks[1] = savedOther;
    if (!dirty) W.dirty.delete(0);
    if (!pending) compactPending.delete(0);
  }
  return { ok, info: '16384 cells; uniform/nibble/byte/dense/air and isolated writes' };
});

// ---------------------------------------------------------------- collision
AF.colliders = new Map();  // 8 m hash -> [box]
AF.addCollider = (x0, y0, z0, x1, y1, z1, tag) => {
  const b = { x0: Math.min(x0, x1), y0: Math.min(y0, y1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), y1: Math.max(y0, y1), z1: Math.max(z0, z1), tag };
  for (let i = Math.floor(b.x0 / 8); i <= Math.floor(b.x1 / 8); i++) for (let k = Math.floor(b.z0 / 8); k <= Math.floor(b.z1 / 8); k++) {
    const key = i * 100000 + k; let a = AF.colliders.get(key); if (!a) AF.colliders.set(key, a = []); a.push(b);
  }
  return b;
};
AF.removeCollider = (b) => { for (const a of AF.colliders.values()) { const i = a.indexOf(b); if (i >= 0) a.splice(i, 1); } };
// is the point inside something solid?  (voxels with solid flag, the ground, collider boxes)
AF.solidAt = (x, y, z) => {
  const bx = W.bx(x), bz = W.bz(z);
  if (y < W.hB(bx, bz) * VS) return true;
  const c = W.get(bx, W.by(y), bz); if (c && AF.PAL.solid[c]) return true;
  const a = AF.colliders.get(Math.floor(x / 8) * 100000 + Math.floor(z / 8));
  if (a) for (const b of a) if (x >= b.x0 && x < b.x1 && y >= b.y0 && y < b.y1 && z >= b.z0 && z < b.z1) return true;
  return false;
};
// AABB (centre x,z; feet y; half-width r; height h) overlaps anything solid?
AF.boxBlocked = (x, y, z, r, h) => {
  const bx0 = W.bx(x - r), bx1 = W.bx(x + r - 1e-4), bz0 = W.bz(z - r), bz1 = W.bz(z + r - 1e-4), by0 = W.by(y + 1e-3), by1 = W.by(y + h);
  for (let bx = bx0; bx <= bx1; bx++) for (let bz = bz0; bz <= bz1; bz++) {
    if (W.hB(bx, bz) * VS > y + 1e-3) return true;
    for (let by = by0; by <= by1; by++) { const c = W.get(bx, by, bz); if (c && AF.PAL.solid[c]) return true; }
  }
  for (let i = Math.floor((x - r) / 8); i <= Math.floor((x + r) / 8); i++) for (let k = Math.floor((z - r) / 8); k <= Math.floor((z + r) / 8); k++) {
    const a = AF.colliders.get(i * 100000 + k); if (!a) continue;
    for (const b of a) if (x + r > b.x0 && x - r < b.x1 && y + h > b.y0 && y + 1e-3 < b.y1 && z + r > b.z0 && z - r < b.z1) return true;
  }
  return false;
};
// highest standing surface at (x,z) at or below y (searching down maxDrop metres). Returns y of the surface.
AF.surfaceBelow = (x, z, y, maxDrop = 60) => {
  const bx = W.bx(x), bz = W.bz(z), g = W.hB(bx, bz) * VS;
  let by = W.by(y - 1e-3);
  const byMin = Math.max(W.by(g), W.by(y - maxDrop));
  for (; by >= byMin; by--) { const c = W.get(bx, by, bz); if (c && AF.PAL.solid[c]) return Math.max(g, W.yOf(by + 1)); }
  let best = g;
  const a = AF.colliders.get(Math.floor(x / 8) * 100000 + Math.floor(z / 8));
  if (a) for (const b of a) if (x >= b.x0 && x < b.x1 && z >= b.z0 && z < b.z1 && b.y1 <= y + 1e-3 && b.y1 > best) best = b.y1;
  return best;
};
// Kinematic body mover with step-up. body = {x,y,z, vy, r, h, onGround}; wish = desired horizontal displacement (dx,dz).
AF.moveBody = (b, dx, dz, dt, o = {}) => {
  const r = b.r ?? 0.3, h = b.h ?? 1.7, step = o.step ?? 0.55, grav = o.gravity ?? 22;
  const tryAxis = (ax, dist) => {
    if (!dist) return;
    const n = Math.ceil(Math.abs(dist) / 0.2), s = dist / n;
    for (let i = 0; i < n; i++) {
      const nx = ax === 0 ? b.x + s : b.x, nz = ax === 2 ? b.z + s : b.z;
      if (!AF.boxBlocked(nx, b.y, nz, r, h)) { b.x = nx; b.z = nz; continue; }
      if (b.onGround || o.fly) {
        let up = 0.25, ok = false;
        for (; up <= step + 1e-6; up += 0.25) if (!AF.boxBlocked(nx, b.y + up, nz, r, h)) { ok = true; break; }
        if (ok) { b.x = nx; b.z = nz; b.y += up; b.stepped = up; b.vy = 0; b.onGround = true; continue; }
      }
      b.hitWall = true; return;
    }
  };
  b.hitWall = false; b.stepped = 0;
  tryAxis(0, dx); tryAxis(2, dz);
  if (o.fly) return b;
  b.vy = (b.vy || 0) - grav * dt;
  let dy = b.vy * dt;
  if (dy > 0) { if (AF.boxBlocked(b.x, b.y + dy, b.z, r, h)) { b.vy = 0; dy = 0; } b.y += dy; b.onGround = false; }
  else {
    const sb = AF.surfaceBelow(b.x, b.z, b.y + 0.05, 4);
    // check the footprint corners too so you don't fall through a gap narrower than you
    let s = sb; const rr = r * 0.97; for (const [ox, oz] of [[-rr, -rr], [rr, -rr], [-rr, rr], [rr, rr], [0, rr], [0, -rr], [rr, 0], [-rr, 0]]) s = Math.max(s, AF.surfaceBelow(b.x + ox, b.z + oz, b.y + 0.05, 4));
    if (b.stepped || b.y + dy <= s + 1e-3) { b.y = Math.max(b.y, s); b.vy = 0; b.onGround = true; }
    else { b.y += dy; b.onGround = false; }
  }
  return b;
};

// ---------------------------------------------------------------- pixel font (5x7) for voxel signs
// AF.textModel('BAKERY', fg, {bg, pad:1, depth:1, bold:false}) -> Model (x = text direction, y up, z depth)
{
  const G = {
    A: '0E11111F111111', B: '1E11111E11111E', C: '0E11101010110E', D: '1C12111111121C', E: '1F10101E10101F', F: '1F10101E101010', G: '0E1110171111 0F', H: '1111111F111111', I: '0E04040404040E', J: '0702020202120C', K: '11121418141211', L: '1010101010101F', M: '111B1515111111', N: '11111915131111', O: '0E11111111110E', P: '1E11111E101010', Q: '0E111111151209 ', R: '1E11111E141211', S: '0F10100E01011E', T: '1F040404040404', U: '1111111111110E', V: '11111111110A04', W: '11111115151B11', X: '11110A040A1111', Y: '11110A04040404', Z: '1F01020408101F',
    '0': '0E11131519110E', '1': '040C040404040E', '2': '0E110102040 81F', '3': '1F020402011 10E', '4': '02060A121F0202', '5': '1F101E0101110E', '6': '0608101E11110E', '7': '1F010204080808', '8': '0E11110E11110E', '9': '0E11110F01020C',
    ' ': '00000000000000', '.': '0000000000 0C0C', ',': '00000000000C04', "'": '0C0408000000 00', '&': '0C12140815120D', '-': '000000 1F000000', '!': '04040404040004', '?': '0E110102040004', ':': '000C0C000C0C00', '/': '01010204081010', '$': '040F140E051E04', '#': '0A0A1F0A1F0A0A', '*': '00150E1F0E1500',
  };
  const rows = (s) => { s = s.replace(/ /g, ''); const r = []; for (let i = 0; i < 7; i++) r.push(parseInt(s.substr(i * 2, 2), 16) || 0); return r; };
  const glyphs = {}; for (const k in G) glyphs[k] = rows(G[k]);
  AF.font5x7 = glyphs;
  AF.textModel = (str, fg, o = {}) => {
    str = String(str).toUpperCase();
    const pad = o.pad ?? 1, depth = o.depth ?? 1, bgD = o.bg ? (o.bgDepth ?? 1) : 0, sp = o.spacing ?? 1;
    const w = str.length * (5 + sp) - sp + pad * 2, h = 7 + pad * 2;
    const m = new Model(w, h, depth + bgD);
    if (o.bg) m.box(0, 0, 0, w, h, bgD, o.bg);
    for (let i = 0; i < str.length; i++) {
      const g = glyphs[str[i]] || glyphs['?'];
      for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (g[r] & (1 << (4 - c))) {
        for (let dz = 0; dz < depth; dz++) m.set(pad + i * (5 + sp) + c, pad + 6 - r, bgD + dz, fg);
        if (o.bold) m.set(pad + i * (5 + sp) + c + 1, pad + 6 - r, bgD, fg);
      }
    }
    return m;
  };
}

// ---------------------------------------------------------------- display fonts (engine, v2)
// AF.textModel(str, fg, { font: 'deco' })   condensed 1930s deco display caps, 9 rows tall, 1-voxel strokes, high waist
//                                            (most letters 3 wide; M V W 5, N 4, I 1). Same options: bg, pad, depth, bold, spacing.
//                                            o.shadow: colour of a 1-voxel drop line behind/below each stroke (gilded-letter look).
// AF.textModel(str, fg, { font: 'script' }) 1-voxel neon-tube script: joined lowercase, italic caps/digits. x-height 8, caps 12,
//                                            ascenders 14, descenders 6 voxels (o.unit = 2 voxels per design unit; o.slant 0.3).
//                                            Mesh at vs 1/16 for a ~1.4 m tall neon word; emit with mode:'always', emitK 2-4.
// AF.textSize(str, o) -> {w, h} of the model the same call would return (for centring).
{
  const base = AF.textModel;
  const D = {
    A: '.#./#.#/#.#/###/#.#/#.#/#.#/#.#/#.#', B: '##./#.#/#.#/##./#.#/#.#/#.#/#.#/##.', C: '.##/#../#../#../#../#../#../#../.##',
    D: '##./#.#/#.#/#.#/#.#/#.#/#.#/#.#/##.', E: '###/#../#../##./#../#../#../#../###', F: '###/#../#../##./#../#../#../#../#..',
    G: '.##/#../#../#../#.#/#.#/#.#/#.#/.##', H: '#.#/#.#/#.#/###/#.#/#.#/#.#/#.#/#.#', I: '#/#/#/#/#/#/#/#/#',
    J: '..#/..#/..#/..#/..#/..#/..#/#.#/.#.', K: '#.#/#.#/#.#/##./#.#/#.#/#.#/#.#/#.#', L: '#../#../#../#../#../#../#../#../###',
    M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#/#...#/#...#', N: '#..#/##.#/##.#/#.##/#.##/#..#/#..#/#..#/#..#',
    O: '.#./#.#/#.#/#.#/#.#/#.#/#.#/#.#/.#.', P: '##./#.#/#.#/##./#../#../#../#../#..', Q: '.#./#.#/#.#/#.#/#.#/#.#/#.#/#.#/.##',
    R: '##./#.#/#.#/##./#.#/#.#/#.#/#.#/#.#', S: '.##/#../#../.#./..#/..#/..#/..#/##.', T: '###/.#./.#./.#./.#./.#./.#./.#./.#.',
    U: '#.#/#.#/#.#/#.#/#.#/#.#/#.#/#.#/.#.', V: '#...#/#...#/#...#/#...#/#...#/.#.#./.#.#./..#../..#..',
    W: '#...#/#...#/#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#', X: '#.#/#.#/#.#/.#./#.#/#.#/#.#/#.#/#.#',
    Y: '#.#/#.#/#.#/.#./.#./.#./.#./.#./.#.', Z: '###/..#/..#/.#./#../#../#../#../###',
    '0': '###/#.#/#.#/#.#/#.#/#.#/#.#/#.#/###', '1': '.#/##/.#/.#/.#/.#/.#/.#/.#', '2': '##./..#/..#/..#/.#./#../#../#../###',
    '3': '##./..#/..#/##./..#/..#/..#/..#/##.', '4': '#.#/#.#/#.#/###/..#/..#/..#/..#/..#', '5': '###/#../#../##./..#/..#/..#/..#/##.',
    '6': '.##/#../#../##./#.#/#.#/#.#/#.#/.#.', '7': '###/..#/..#/.#./.#./.#./.#./.#./.#.', '8': '.#./#.#/#.#/.#./#.#/#.#/#.#/#.#/.#.',
    '9': '.#./#.#/#.#/.##/..#/..#/..#/..#/##.',
    ' ': '../../../../../../../../..', '.': './././././././././#'.slice(2), ',': './././././././#/#', "'": '#/#/./././././././.'.slice(0, 17),
    '-': '.../.../.../.../###/.../.../.../...', '!': '#/#/#/#/#/#/././#', ':': '././#/./././#/./.', '&': '.#./#.#/#.#/.#./##./#.#/#.#/#.#/.##',
    '/': '..#/..#/..#/.#./.#./.#./#../#../#..', '?': '##./..#/..#/..#/.#./.#./.#./.../.#.', '$': '.#./.##/#../#../.#./..#/..#/##./.#.',
    '·': '././././#/././././.'.slice(0, 17), '¢': '.#./.##/#../#../#../#../.##/.#./...', '*': '.../#.#/.#./#.#/.../.../.../.../...',
    '"': '#.#/#.#/.../.../.../.../.../.../...', '(': '.#/#./#./#./#./#./#./#./.#', ')': '#./.#/.#/.#/.#/.#/.#/.#/#.',
    '+': '.../.../.../.#./###/.#./.../.../...', '#': '.#.#/.#.#/####/.#.#/.#.#/####/.#.#/.#.#/....'.split('/').slice(0, 9).join('/'),
  };
  const DG = {};
  for (const k in D) { let rows = D[k].split('/'); while (rows.length < 9) rows.push(rows[0].replace(/#/g, '.')); rows = rows.slice(0, 9); DG[k] = { w: rows[0].length, rows }; }
  AF.fontDeco = DG;
  const decoSize = (s, o) => { const sp = o.spacing ?? 1, pad = o.pad ?? 1; let w = 0; for (let i = 0; i < s.length; i++) w += (DG[s[i]] || DG['?']).w + (i ? sp : 0) + (o.bold ? 1 : 0); return { w: w + pad * 2, h: 9 + pad * 2 + (o.shadow ? 1 : 0) }; };
  const decoModel = (str, fg, o) => {
    const s = String(str).toUpperCase(), sp = o.spacing ?? 1, pad = o.pad ?? 1, depth = o.depth ?? 1, bgD = o.bg ? (o.bgDepth ?? 1) : 0;
    const sz = decoSize(s, o), sh = o.shadow ? 1 : 0;
    const m = new Model(sz.w + sh, sz.h, depth + bgD);
    if (o.bg) m.box(0, 0, 0, m.w, m.h, bgD, o.bg);
    let x = pad;
    for (let i = 0; i < s.length; i++) {
      const g = DG[s[i]] || DG['?'];
      for (let r = 0; r < 9; r++) for (let c = 0; c < g.w; c++) if (g.rows[r][c] === '#') {
        const X = x + c, Y = pad + sh + 8 - r;
        if (sh) m.set(X + 1, Y - 1, bgD, o.shadow);
        for (let dz = 0; dz < depth; dz++) { m.set(X, Y, bgD + dz, fg); if (o.bold) m.set(X + 1, Y, bgD + dz, fg); }
      }
      x += g.w + sp + (o.bold ? 1 : 0);
    }
    return m;
  };
  // ---- script: lowercase as strokes on a design grid (baseline 0, x-height 4, ascender 7, descender -3); caps, digits and
  // punctuation are the 5x7 bitmap font turned into 1-voxel strokes between neighbouring pixel centres.
  const S = {
    a: [4, [[3, 3], [2, 4], [1, 4], [0, 3], [0, 1], [1, 0], [2, 0], [3, 2]], [[3, 4], [3, 1], [4, 0]]],
    b: [4, [[0, 7], [0, 1], [1, 0], [2, 0], [3, 1], [3, 3], [2, 4], [1, 4], [0, 3]]],
    c: [4, [[3, 3], [2, 4], [1, 4], [0, 3], [0, 1], [1, 0], [3, 0], [4, 1]]],
    d: [4, [[3, 3], [2, 4], [1, 4], [0, 3], [0, 1], [1, 0], [2, 0], [3, 2]], [[3, 7], [3, 1], [4, 0]]],
    e: [4, [[0, 2], [3, 2], [3, 3], [2, 4], [1, 4], [0, 3], [0, 1], [1, 0], [3, 0], [4, 1]]],
    f: [3, [[0, 4], [2, 4]], [[3, 6], [2, 7], [1, 6], [1, -3]]],
    g: [4, [[3, 3], [2, 4], [1, 4], [0, 3], [0, 1], [1, 0], [2, 0], [3, 1]], [[3, 4], [3, -2], [2, -3], [1, -3], [0, -2]]],
    h: [4, [[0, 7], [0, 0]], [[0, 3], [1, 4], [2, 4], [3, 3], [3, 1], [4, 0]]],
    i: [2, [[1, 6], [1, 6]], [[0, 3], [1, 4], [1, 1], [2, 0]]],
    j: [3, [[2, 6], [2, 6]], [[1, 3], [2, 4], [2, -2], [1, -3], [0, -2]]],
    k: [4, [[0, 7], [0, 0]], [[3, 4], [1, 2], [3, 0], [4, 0]]],
    l: [2, [[0, 1], [0, 7]], [[0, 1], [1, 0], [2, 0]]],
    m: [6, [[0, 4], [0, 0]], [[0, 3], [1, 4], [2, 3], [2, 0]], [[2, 3], [3, 4], [4, 3], [4, 1], [5, 0], [6, 0]]],
    n: [4, [[0, 4], [0, 0]], [[0, 3], [1, 4], [2, 4], [3, 3], [3, 1], [4, 0]]],
    o: [4, [[1, 4], [0, 3], [0, 1], [1, 0], [2, 0], [3, 1], [3, 3], [2, 4], [1, 4]], [[2, 4], [4, 4]]],
    p: [4, [[0, 4], [0, -3]], [[0, 3], [1, 4], [2, 4], [3, 3], [3, 1], [2, 0], [0, 0]]],
    q: [4, [[3, 3], [2, 4], [1, 4], [0, 3], [0, 1], [1, 0], [2, 0], [3, 1]], [[3, 4], [3, -3], [4, -2]]],
    r: [4, [[0, 4], [0, 0]], [[0, 2], [1, 3], [2, 4], [3, 4], [4, 3]]],
    s: [4, [[3, 3], [2, 4], [1, 4], [0, 3], [1, 2], [2, 2], [3, 1], [2, 0], [1, 0], [0, 1]]],
    t: [3, [[0, 4], [2, 4]], [[1, 6], [1, 1], [2, 0], [3, 0]]],
    u: [4, [[0, 4], [0, 1], [1, 0], [2, 0], [3, 1]], [[3, 4], [3, 1], [4, 0]]],
    v: [4, [[0, 4], [0, 2], [2, 0], [3, 2], [3, 4]]],
    w: [5, [[0, 4], [0, 1], [1, 0], [2, 1], [2, 3]], [[2, 1], [3, 0], [4, 1], [4, 4]]],
    x: [4, [[0, 4], [3, 0], [4, 0]], [[0, 0], [3, 4]]],
    y: [4, [[0, 4], [0, 1], [1, 0], [2, 0], [3, 1]], [[3, 4], [3, -2], [2, -3], [1, -3], [0, -2]]],
    z: [4, [[0, 4], [3, 4], [0, 0], [3, 0], [4, 1]]],
  };
  const capStrokes = (ch) => {   // 5x7 bitmap -> strokes between pixel centres (y 0..6), width 4
    const g = AF.font5x7[ch] || AF.font5x7['?'], on = (c, r) => c >= 0 && c < 5 && r >= 0 && r < 7 && !!(g[r] & (1 << (4 - c)));
    const out = [];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 5; c++) if (on(c, r)) {
      let lone = true;
      if (on(c + 1, r)) { out.push([[c, 6 - r], [c + 1, 6 - r]]); lone = false; }
      if (on(c, r + 1)) { out.push([[c, 6 - r], [c, 5 - r]]); lone = false; }
      if (on(c + 1, r + 1) && !on(c + 1, r) && !on(c, r + 1)) { out.push([[c, 6 - r], [c + 1, 5 - r]]); lone = false; }
      if (on(c - 1, r + 1) && !on(c - 1, r) && !on(c, r + 1)) { out.push([[c, 6 - r], [c - 1, 5 - r]]); lone = false; }
      if (lone && !on(c - 1, r) && !on(c, r - 1) && !on(c - 1, r - 1) && !on(c + 1, r - 1)) out.push([[c, 6 - r], [c, 6 - r]]);
    }
    return [4, ...out];
  };
  const scriptLayout = (str, o) => {
    const U = o.unit ?? 2, sl = o.slant ?? 0.3, pts = [];   // pts: segments [x0,y0,x1,y1] in voxel units (before slant)
    let x = 0, prevEnd = null;
    for (const ch of String(str)) {
      if (ch === ' ') { x += 3 * U; prevEnd = null; continue; }
      const low = S[ch], gl = low || capStrokes(ch.toUpperCase()), w = gl[0];
      const strokes = gl.slice(1);
      if (low && prevEnd && strokes.length) {   // join from the previous letter's exit to this letter's entry (x-height zone)
        const f = strokes[low === S.i || low === S.j || low === S.f || low === S.t ? 1 : 0] || strokes[0], p = f[0];
        if (p[1] <= 4 && prevEnd[1] <= 4) pts.push([prevEnd[0], prevEnd[1], x + p[0] * U, p[1] * U]);
      }
      for (const st of strokes) for (let i = 0; i < st.length; i++) {
        const a = st[Math.max(0, i - 1)], b = st[i];
        if (i === 0 && st.length > 1) continue;
        pts.push([x + a[0] * U, a[1] * U, x + b[0] * U, b[1] * U]);
      }
      const last = strokes[strokes.length - 1], lp = last && last[last.length - 1];
      prevEnd = low && lp && lp[0] >= w - 1 ? [x + lp[0] * U, lp[1] * U] : null;
      x += (w + (low ? 0.5 : 1.5)) * U;
    }
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    const T = (px, py) => [Math.round(px + py * sl), Math.round(py)];
    const segs = pts.map(([a, b, c, d]) => [...T(a, b), ...T(c, d)]);
    for (const s of segs) { minX = Math.min(minX, s[0], s[2]); maxX = Math.max(maxX, s[0], s[2]); minY = Math.min(minY, s[1], s[3]); maxY = Math.max(maxY, s[1], s[3]); }
    if (!segs.length) { minX = minY = 0; maxX = maxY = 0; }
    const lo = o.fullHeight ? Math.min(minY, -3 * U) : minY, hi = o.fullHeight ? Math.max(maxY, 7 * U) : maxY;   // tight box (m.baseline tells where the baseline is)
    return { segs, minX, maxX, lo, hi };
  };
  const scriptModel = (str, fg, o) => {
    const L = scriptLayout(str, o), pad = o.pad ?? 1, depth = o.depth ?? 1, bgD = o.bg ? (o.bgDepth ?? 1) : 0;
    const w = L.maxX - L.minX + 1 + pad * 2, h = L.hi - L.lo + 1 + pad * 2;
    const m = new Model(w, h, depth + bgD);
    if (o.bg) m.box(0, 0, 0, w, h, bgD, o.bg);
    const put = (x, y) => { for (let dz = 0; dz < depth; dz++) m.set(x - L.minX + pad, y - L.lo + pad, bgD + dz, fg); };
    for (const [x0, y0, x1, y1] of L.segs) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      if (!n) { put(x0, y0); continue; }
      for (let i = 0; i <= n; i++) put(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n));
    }
    m.baseline = pad - L.lo;   // model row of the baseline
    return m;
  };
  AF.fontScript = S;
  AF.textSize = (str, o = {}) => {
    if (o.font === 'deco') { const s = decoSize(String(str).toUpperCase(), o); return { w: s.w + (o.shadow ? 1 : 0), h: s.h }; }
    if (o.font === 'script') { const L = scriptLayout(str, o), pad = o.pad ?? 1; return { w: L.maxX - L.minX + 1 + pad * 2, h: L.hi - L.lo + 1 + pad * 2 }; }
    const s = String(str), pad = o.pad ?? 1, sp = o.spacing ?? 1; return { w: s.length * (5 + sp) - sp + pad * 2, h: 7 + pad * 2 };
  };
  AF.textModel = (str, fg, o = {}) => o.font === 'deco' ? decoModel(str, fg, o) : o.font === 'script' ? scriptModel(str, fg, o) : base(str, fg, o);
}

} catch (e) { AF.partError('02-voxel.js', e); }

