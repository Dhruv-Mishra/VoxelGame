// Bake the world map images used by src/74-map.js: `node tools/map-bake.mjs [port]` (needs tools/serve.mjs running and a fresh
// output.html). Boots the game headless, rasterises terrain + roads + buildings, writes assets/map-world.webp + assets/map-city.webp.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
let pw; try { pw = require('playwright'); } catch { pw = require('./tmp-outland/node_modules/playwright'); }
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const port = +process.argv[2] || 8765, WORLD_PX = 0.6, CITY_PX = 1.5;
const launch = (opts) => pw.chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'], ...opts });
const browser = await launch({}).catch(() => launch({ channel: 'chrome' }));
try {
  const page = await browser.newPage({ viewport: { width: 640, height: 360 } });
  await page.goto(`http://127.0.0.1:${port}/output.html?nostream&v=${Date.now()}`);
  await page.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 600000 });
  const images = await page.evaluate(({ WORLD_PX, CITY_PX }) => {
    const AF = window.__af, P = AF.PLAN, W = AF.W, O = AF.outland, island = P.world.island, play = P.world.play, TAU = Math.PI * 2, sea = '#779ca7';
    AF.outlandSites?.settle?.(); AF.wayside?.settle?.();
    const B = { x0: play.x0 - 100, x1: play.x1 + 100, z0: play.z0 - 80, z1: Math.max(play.z1, island.cz + island.rz) + 100 };
    const bake = (bounds, px, isCity) => {
      const canvas = document.createElement('canvas'); canvas.width = Math.ceil((bounds.x1 - bounds.x0) * px); canvas.height = Math.ceil((bounds.z1 - bounds.z0) * px);
      const ctx = canvas.getContext('2d'), image = ctx.createImageData(canvas.width, canvas.height), data = image.data;
      for (let row = 0; row < canvas.height; row++) for (let col = 0; col < canvas.width; col++) {
        const x = bounds.x0 + (col + 0.5) / px, z = bounds.z0 + (row + 0.5) / px, index = W.col(x, z), offset = (row * canvas.width + col) * 4;
        let height, west, north, color, water;
        if (index >= 0) {
          const bx = W.bx(x), bz = W.bz(z);
          height = W.H[index] * 0.25; west = W.H[Math.max(0, bx - 4) * W.NZ + bz] * 0.25; north = W.H[bx * W.NZ + Math.max(0, bz - 4)] * 0.25;
          color = AF.PAL.hex[W.C[index]] || 0x83916b; water = height < -1.1;
        } else {
          height = O.h(x, z); west = O.h(x - 3, z); north = O.h(x, z - 3);
          color = AF.PAL.hex[O.colTop(x, z, height, (Math.abs(height - west) + Math.abs(height - north)) / 6, 2)];
          water = O.waterY(x, z) !== null && height <= (O.waterY(x, z) ?? -1.25) + 0.05;
        }
        if (water) { data[offset] = 119; data[offset + 1] = 156; data[offset + 2] = 167; }
        else {
          const step = index >= 0 ? 1 : 3, shade = Math.min(1.14, Math.max(0.72, 1 + (height - west) / step * 0.12 + (height - north) / step * 0.09)), mix = 0.6;
          data[offset] = (182 * (1 - mix) + (color >> 16 & 255) * mix) * shade;
          data[offset + 1] = (193 * (1 - mix) + (color >> 8 & 255) * mix) * shade;
          data[offset + 2] = (170 * (1 - mix) + (color & 255) * mix) * shade;
        }
        data[offset + 3] = 255;
      }
      ctx.putImageData(image, 0, 0);
      const wx = (x) => (x - bounds.x0) * px, wz = (z) => (z - bounds.z0) * px;
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      for (const road of isCity ? P.roads : P.world.roads) {
        ctx.beginPath();
        if (road.points) road.points.forEach((point, index) => index ? ctx.lineTo(wx(point[0]), wz(point[1])) : ctx.moveTo(wx(point[0]), wz(point[1])));
        else { ctx.moveTo(wx(road.a[0]), wz(road.a[1])); ctx.lineTo(wx(road.b[0]), wz(road.b[1])); }
        ctx.strokeStyle = '#a5ae9d'; ctx.lineWidth = (road.w || 9) * px + 2; ctx.stroke(); ctx.strokeStyle = '#edf0df'; ctx.lineWidth = (road.w || 7) * px; ctx.stroke();
      }
      ctx.fillStyle = '#919f96';
      for (const building of AF.buildings) {
        const box = building.box; if (!box || building.kind === 'zoo' || !isCity && W.col((box[0] + box[3]) / 2, (box[2] + box[5]) / 2) >= 0) continue;
        ctx.fillRect(wx(Math.min(box[0], box[3])), wz(Math.min(box[2], box[5])), Math.abs(box[3] - box[0]) * px, Math.abs(box[5] - box[2]) * px);
      }
      if (isCity) {
        ctx.fillStyle = sea; ctx.beginPath(); ctx.ellipse(wx(P.lake.cx), wz(P.lake.cz), P.lake.rx * px, P.lake.rz * px, 0, 0, TAU); ctx.fill();
        ctx.beginPath(); for (let distance = 0; distance <= P.rail.length; distance += 4) { const point = P.railPoint(distance); if (distance) ctx.lineTo(wx(point.x), wz(point.z)); else ctx.moveTo(wx(point.x), wz(point.z)); }
        ctx.closePath(); ctx.strokeStyle = '#687e77'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
      } else {
        for (const poi of O.wayside) { ctx.fillRect(wx(poi.x - poi.rx * 0.7), wz(poi.z - poi.rz * 0.7), poi.rx * 1.4 * px, poi.rz * 1.4 * px); }
        const strip = island.airstrip; if (strip) { ctx.fillStyle = '#7d8d88'; ctx.fillRect(wx(strip.x0), wz(strip.z - strip.w / 2), (strip.x1 - strip.x0) * px, strip.w * px); }
        if (island.landing) {
          const pier = island.landing.pier, landing = island.landing;
          if (pier) { ctx.fillStyle = '#edf0df'; ctx.fillRect(wx(pier.x0), wz(pier.z0), (pier.x1 - pier.x0) * px, (pier.z1 - pier.z0) * px); }
          ctx.beginPath(); ctx.moveTo(wx(0), wz(P.harbour.coastZ)); ctx.lineTo(wx(landing.x), wz(pier ? pier.z0 : landing.z));
          ctx.strokeStyle = '#e0e9e5'; ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      return canvas.toDataURL('image/webp', 0.86);
    };
    return { world: bake(B, WORLD_PX, false), city: bake(P.bounds, CITY_PX, true) };
  }, { WORLD_PX, CITY_PX });
  fs.mkdirSync(path.join(root, 'assets'), { recursive: true });
  for (const [name, url] of Object.entries(images)) {
    const file = path.join(root, 'assets', 'map-' + name + '.webp'), bytes = Buffer.from(url.split(',')[1], 'base64');
    fs.writeFileSync(file, bytes); console.log('wrote', file, (bytes.length / 1024).toFixed(0) + ' KB');
  }
} finally { await browser.close(); }
