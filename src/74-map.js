// ================================================================ 74-map.js
try {
{
  const UI = AF.ui, S = UI.state, P = AF.PLAN, W = AF.W, O = AF.outland, island = P.world.island, play = P.world.play;
  const B = { x0: play.x0 - 100, x1: play.x1 + 100, z0: play.z0 - 80, z1: Math.max(play.z1, island.cz + island.rz) + 100 };
  const root = document.getElementById('ui'), mini = document.querySelector('#h-mini canvas'), mg = mini.getContext('2d');
  const el = document.createElement('div'); el.id = 'm-map'; el.className = 'pe'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', 'World map'); el.setAttribute('aria-modal', 'true');
  el.innerHTML = `<header><div><b>Port Solace</b><span>World map</span></div><div class="map-tools"><button data-a="fit" title="Fit world" aria-label="Fit world">&#9633;</button><button data-a="me" title="Centre on me" aria-label="Centre on me">&#8857;</button><button data-a="out" title="Zoom out" aria-label="Zoom out">&#8722;</button><button data-a="in" title="Zoom in" aria-label="Zoom in">+</button><button data-a="close" title="Close map" aria-label="Close map">&#215;</button></div></header><div class="map-stage"><canvas tabindex="0" aria-label="Interactive world map"></canvas><div class="map-pick panel hide"><b></b><button class="btn primary" data-a="walk">Go there</button><button class="btn" data-a="fly">Fly over</button></div><div class="map-scale"></div></div>`;
  root.appendChild(el);
  for (const button of el.querySelectorAll('.map-tools button')) button.innerHTML = UI.icon(button.dataset.a);
  const style = document.createElement('style'); style.textContent = `
    #ui #m-map{position:absolute;inset:max(12px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(12px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));display:none;background:var(--bg2);border:1px solid var(--line);border-radius:12px;overflow:hidden}
    #ui #m-map.open{display:flex;flex-direction:column} #ui #m-map header{display:flex;align-items:center;justify-content:space-between;padding:12px 18px;gap:12px;flex-shrink:0}
    #ui #m-map header b{font-size:16px;font-weight:600} #ui #m-map header span{color:var(--dim);font-size:12px;margin-left:12px}
    #ui .map-tools{display:flex;gap:6px} #ui .map-tools button{width:36px;height:36px;border-radius:8px;font-size:22px;line-height:1;transition:background .16s}
    #ui .map-tools button:hover{background:rgba(255,255,255,.1)} #ui .map-stage{position:relative;flex:1;min-height:0;overflow:hidden}
    #ui .map-tools svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
    #ui .map-stage canvas{display:block;width:100%;height:100%;touch-action:none;cursor:grab;outline:none} #ui .map-stage canvas:active{cursor:grabbing}
    #ui .map-pick{position:absolute;width:160px;display:grid;gap:6px;padding:12px;z-index:2} #ui .map-pick b{font-size:13px;overflow-wrap:anywhere;margin-bottom:3px}
    #ui .map-scale{position:absolute;left:18px;bottom:14px;border-bottom:2px solid #394b4d;padding:0 0 4px;color:#394b4d;font-size:11px;pointer-events:none;text-shadow:0 1px #e5eae0} #ui .map-north{position:absolute;left:18px;top:12px;font-size:11px;color:#394b4d;pointer-events:none}
    #ui #m-map:focus-within{border-color:rgba(255,255,255,.25)}
    @media(max-height:480px){#ui #m-map header{padding:6px 12px} #ui .map-tools button{height:32px;width:36px}}
    @media(max-width:520px){#ui #m-map header{padding:8px} #ui #m-map header span{display:none} #ui .map-tools{gap:2px}}
  `; document.head.appendChild(style);
  const cv = el.querySelector('canvas'), g = cv.getContext('2d'), stage = el.querySelector('.map-stage'), pick = el.querySelector('.map-pick'), scaleEl = el.querySelector('.map-scale');
  const north = document.createElement('div'); north.className = 'map-north'; north.innerHTML = 'N &uarr;'; stage.appendChild(north);
  const sea = '#779ca7', TAU = Math.PI * 2, DIR = new THREE.Vector3();
  const map = UI.map = { bounds: B, ready: false, revision: 0, x: (B.x0 + B.x1) / 2, z: (B.z0 + B.z1) / 2, scale: 1, tx: 0, tz: 0, ts: 1, width: 1, height: 1, fitScale: 1 };
  const focus = () => AF.mode === 'aerial' ? AF.camTarget : AF.mode === 'drive' && AF.vehicles.player ? AF.vehicles.player : AF.mode === 'fly' && AF.planes.cur ? AF.planes.cur : AF.player || AF.camTarget;
  // the world and city layers are static images baked offline (`node tools/map-bake.mjs`, rerun after world changes); decoded
  // after `ready` so they never compete with boot
  const layer = (bounds, src) => ({ bounds, src, img: null, px: 1 });
  const land = layer(B, 'assets/map-world.webp'), city = layer(P.bounds, 'assets/map-city.webp'), layers = [land, city];
  let loading = null;
  const load = () => loading || (loading = Promise.all(layers.map(async (L) => {
    const img = new Image(); img.src = L.src;
    try { await img.decode(); L.img = img; L.px = img.width / (L.bounds.x1 - L.bounds.x0); } catch (e) { AF.warnOnce('map image ' + L.src, e); }
  })).then(() => { map.ready = true; map.revision++; }));
  AF.on('ready', () => setTimeout(load, 4000));
  map.finish = load;
  map.memory = () => layers.reduce((sum, L) => sum + (L.img ? L.img.width * L.img.height * 4 : 0), 0) + (mini.width * mini.height + cv.width * cv.height) * 4;
  map.stats = () => ({ bytes: map.memory(), ready: map.ready, world: land.img && [land.img.width, land.img.height], city: city.img && [city.img.width, city.img.height] });
  map.worldToScreen = (x, z) => ({ x: (x - map.x) * map.scale + map.width / 2, y: (z - map.z) * map.scale + map.height / 2 });
  map.screenToWorld = (x, y) => ({ x: (x - map.width / 2) / map.scale + map.x, z: (y - map.height / 2) / map.scale + map.z });
  let dirty = true, boundsRect = null, selection = null, mapTimer = 0, miniTimer = 0, miniX = NaN, miniZ = NaN, miniYaw = NaN, miniSpan = 0, miniRevision = -1, labelCount = -1;
  const fit = () => { map.tx = map.x = (B.x0 + B.x1) / 2; map.tz = map.z = (B.z0 + B.z1) / 2; map.ts = map.scale = map.fitScale; dirty = true; };
  map.fit = fit;
  const resize = () => {
    if (!S.map) return;
    boundsRect = stage.getBoundingClientRect(); map.width = Math.max(1, Math.round(boundsRect.width)); map.height = Math.max(1, Math.round(boundsRect.height));
    const res = Math.min(1, 1600 / map.width, 1000 / map.height); cv.width = Math.round(map.width * res); cv.height = Math.round(map.height * res);
    map.fitScale = Math.min((map.width - 40) / (B.x1 - B.x0), (map.height - 40) / (B.z1 - B.z0)); fit(); pick.classList.add('hide');
  };
  addEventListener('resize', resize);
  UI.toggleMap = (on, resume = true) => {
    S.map = on ?? !S.map; el.classList.toggle('open', S.map); root.classList.toggle('mapping', S.map);
    if (S.map) { load(); UI.toggleMenu(false, false); if (S.help) UI.toggleHelp(false); AF.input.releaseLock(); resize(); drawMap(); cv.focus({ preventScroll: true }); }
    else { pointers.clear(); selection = null; pick.classList.add('hide'); if (resume) AF.input.requestLock(); }
  };
  const constrain = () => { map.ts = AF.clamp(map.ts, map.fitScale, map.fitScale * 24); map.tx = AF.clamp(map.tx, B.x0, B.x1); map.tz = AF.clamp(map.tz, B.z0, B.z1); dirty = true; };
  const zoom = (factor, x = map.width / 2, y = map.height / 2) => {
    const next = AF.clamp(map.ts * factor, map.fitScale, map.fitScale * 24);
    map.tx += (x - map.width / 2) * (1 / map.ts - 1 / next); map.tz += (y - map.height / 2) * (1 / map.ts - 1 / next); map.ts = next; constrain();
  };
  map.zoom = zoom; map.pan = (x, z) => { map.tx += x; map.tz += z; constrain(); };
  const drawLayers = (ctx, cx, cz, scale, width, height) => {
    ctx.fillStyle = sea; ctx.fillRect(0, 0, width, height);
    for (const L of layers) {
      if (!L.img) continue;
      const bounds = L.bounds;
      ctx.drawImage(L.img, (bounds.x0 - cx) * scale + width / 2, (bounds.z0 - cz) * scale + height / 2, (bounds.x1 - bounds.x0) * scale, L.img.height / L.px * scale);
    }
  };
  const playerMarker = (ctx, x, y, yaw) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI - yaw);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 26, -Math.PI * 0.68, -Math.PI * 0.32); ctx.closePath(); ctx.fillStyle = 'rgba(36,107,107,.18)'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(6, 7); ctx.lineTo(0, 4); ctx.lineTo(-6, 7); ctx.closePath(); ctx.fillStyle = '#246b6b'; ctx.strokeStyle = '#f5f8ef'; ctx.lineWidth = 2; ctx.stroke(); ctx.fill(); ctx.restore();
  };
  const heading = src => { if (AF.mode === 'aerial') { AF.camera.getWorldDirection(DIR); return Math.atan2(DIR.x, DIR.z); } return src.yaw || 0; };
  const categories = { area: '#53655b', view: '#246b6b', nature: '#526d48', transport: '#597b8b', place: '#796d61' };
  const entries = [], hits = [], boxes = [], areas = [
    { name: 'Solace Range', x: -400, z: -790, category: 'area', min: 0 }, { name: 'Westmoor', x: -1020, z: -180, category: 'area', min: 0 },
    { name: 'Eastwood', x: 820, z: -360, category: 'area', min: 0 }, { name: island.name, x: island.cx, z: island.cz, category: 'area', min: 0 },
    { name: 'Port Solace', x: -90, z: -30, category: 'area', min: 0 }, { name: 'Lake Tamsin', x: P.world.lake.cx, z: P.world.lake.cz, category: 'nature', min: 0 }
  ];
  const syncLabels = () => {
    entries.length = 0; for (const area of areas) entries.push(area);
    for (const view of P.views) entries.push({ name: view.name, x: view.target[0], z: view.target[2], category: 'view', min: 1.5, view });
    for (const label of AF.labels) {
      if (label.kind === 'street') continue;
      const building = label.kind === 'building' ? AF.buildings.find(item => item.name === label.name) : null;
      const category = /station|airport|airfield|terminal|ferry|pier|stop/i.test(label.name) ? 'transport' : /lake|park|wood|farm|garden|mount|falls|zoo|trail|beach/i.test(label.name) ? 'nature' : 'place';
      entries.push({ name: label.name, x: label.x, z: label.z, category, min: building ? 5 : 2.6, building });
    }
    labelCount = AF.labels.length;
    while (boxes.length < entries.length) { boxes.push([0, 0, 0, 0]); hits.push({ entry: null, x: 0, y: 0, width: 0 }); }
  };
  let hitCount = 0;
  const drawLabels = () => {
    const level = map.scale / map.fitScale; let count = 0; hitCount = 0;
    g.font = '500 12px system-ui'; g.textBaseline = 'middle'; g.textAlign = 'center';
    for (const entry of entries) {
      if (level < entry.min || entry.category === 'area' && level > 7) continue;
      const x = (entry.x - map.x) * map.scale + map.width / 2, y = (entry.z - map.z) * map.scale + map.height / 2;
      const width = g.measureText(entry.name).width + (entry.category === 'area' ? 16 : 30), half = width / 2;
      if (x - half < 12 || x + half > map.width - 12 || y < 18 || y > map.height - 28) continue;
      let blocked = false;
      for (let index = 0; index < count; index++) { const box = boxes[index]; if (x - half < box[2] && x + half > box[0] && y - 13 < box[3] && y + 13 > box[1]) { blocked = true; break; } }
      if (blocked) continue;
      const box = boxes[count++]; box[0] = x - half; box[1] = y - 13; box[2] = x + half; box[3] = y + 13;
      g.fillStyle = entry.category === 'area' ? 'rgba(227,235,217,.82)' : 'rgba(241,244,231,.92)'; g.beginPath(); g.roundRect(x - half, y - 10, width, 20, 4); g.fill();
      g.fillStyle = categories[entry.category]; if (entry.category !== 'area') { g.beginPath(); g.arc(x - half + 9, y, 2.5, 0, TAU); g.fill(); }
      g.fillText(entry.name, x + (entry.category === 'area' ? 0 : 4), y);
      const hit = hits[hitCount++]; hit.entry = entry; hit.x = x; hit.y = y; hit.width = width;
    }
  };
  const drawMap = () => {
    if (labelCount !== AF.labels.length) syncLabels();
    const ratio = cv.width / map.width; g.setTransform(ratio, 0, 0, ratio, 0, 0);
    drawLayers(g, map.x, map.z, map.scale, map.width, map.height); drawLabels();
    if (map.overlays) for (const draw of map.overlays) draw(g, map);
    const src = focus(); playerMarker(g, (src.x - map.x) * map.scale + map.width / 2, (src.z - map.z) * map.scale + map.height / 2, heading(src));
    const car = AF.vehicles.player, plane = AF.planes.cur;
    g.fillStyle = '#597b8b';
    if (car && car !== src) g.fillRect((car.x - map.x) * map.scale + map.width / 2 - 3, (car.z - map.z) * map.scale + map.height / 2 - 3, 6, 6);
    if (plane && plane !== src) { g.beginPath(); g.arc((plane.x - map.x) * map.scale + map.width / 2, (plane.z - map.z) * map.scale + map.height / 2, 4, 0, TAU); g.fill(); }
    const metres = map.scale > 1 ? 50 : map.scale > 0.4 ? 100 : 500, text = map.ready ? metres + ' m' : 'Surveying', width = Math.round(metres * map.scale) + 'px';
    if (scaleEl.textContent !== text) scaleEl.textContent = text; if (scaleEl.style.width !== width) scaleEl.style.width = width;
    dirty = false;
  };
  const selectPoint = (x, y) => {
    selection = null;
    for (let index = hitCount - 1; index >= 0; index--) { const hit = hits[index]; if (Math.abs(hit.x - x) < hit.width / 2 && Math.abs(hit.y - y) < 13) { selection = hit.entry; break; } }
    if (!selection) { const point = map.screenToWorld(x, y); if (point.x < B.x0 || point.x > B.x1 || point.z < B.z0 || point.z > B.z1) return; selection = { name: 'Selected location', x: point.x, z: point.z }; }
    pick.querySelector('b').textContent = selection.name; pick.style.left = AF.clamp(x - 80, 8, map.width - 192) + 'px'; pick.style.top = AF.clamp(y + 16, 8, map.height - 146) + 'px'; pick.classList.remove('hide');
  };
  const travel = walk => {
    if (!selection) return;
    const point = selection; let x = point.x, z = point.z, yaw = 0;
    const door = point.building && point.building.doors && point.building.doors[0];
    if (door) { yaw = door.yaw || 0; x = door.x - Math.sin(yaw) * 1.4; z = door.z - Math.cos(yaw) * 1.4; }
    const y = W.groundY(x, z); UI.toggleMap(false);
    if (walk) AF.stream.travel({ label: point.name, go: () => AF.setMode('walk', { x, y, z, yaw, snap: true }) });
    else if (point.view) AF.flyTo(point.view.pos, point.view.target);
    else AF.flyTo([x + 70, y + 65, z + 90], [x, y + 2, z]);
  };
  el.addEventListener('click', event => {
    const button = event.target.closest('[data-a]'); if (!button) return;
    const action = button.dataset.a;
    if (action === 'close') UI.toggleMap(false); else if (action === 'fit') fit(); else if (action === 'in') zoom(1.6); else if (action === 'out') zoom(1 / 1.6);
    else if (action === 'me') { const src = focus(); map.tx = src.x; map.tz = src.z; map.ts = Math.max(map.ts, map.fitScale * 5); constrain(); }
    else if (action === 'walk' || action === 'fly') travel(action === 'walk');
  });
  cv.addEventListener('wheel', event => { event.preventDefault(); zoom(Math.exp(-event.deltaY * 0.0015), event.clientX - boundsRect.left, event.clientY - boundsRect.top); pick.classList.add('hide'); }, { passive: false });
  cv.addEventListener('dblclick', event => { zoom(2, event.clientX - boundsRect.left, event.clientY - boundsRect.top); pick.classList.add('hide'); });
  const pointers = new Map(); let moved = false, lastTap = 0, lastTapX = 0, lastTapY = 0;
  cv.addEventListener('pointerdown', event => { pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, startX: event.clientX, startY: event.clientY }); moved = pointers.size > 1; cv.setPointerCapture(event.pointerId); });
  cv.addEventListener('pointermove', event => {
    const point = pointers.get(event.pointerId); if (!point) return;
    if (Math.hypot(event.clientX - point.startX, event.clientY - point.startY) > 4) moved = true;
    if (pointers.size === 2) {
      const iterator = pointers.values(), first = iterator.next().value, second = iterator.next().value, before = Math.hypot(first.x - second.x, first.y - second.y);
      const cx = (first.x + second.x) / 2, cy = (first.y + second.y) / 2;
      point.x = event.clientX; point.y = event.clientY;
      const nx = (first.x + second.x) / 2, ny = (first.y + second.y) / 2;
      if (before > 2) zoom(Math.hypot(first.x - second.x, first.y - second.y) / before, cx - boundsRect.left, cy - boundsRect.top);
      map.tx -= (nx - cx) / map.ts; map.tz -= (ny - cy) / map.ts;
    } else { map.tx -= (event.clientX - point.x) / map.ts; map.tz -= (event.clientY - point.y) / map.ts; point.x = event.clientX; point.y = event.clientY; }
    constrain(); if (moved) pick.classList.add('hide');
  });
  const pointerUp = event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.delete(event.pointerId);
    if (event.type === 'pointerup' && !moved && !pointers.size) {
      const x = event.clientX - boundsRect.left, y = event.clientY - boundsRect.top, now = performance.now();
      if (event.pointerType === 'touch' && now - lastTap < 320 && Math.hypot(x - lastTapX, y - lastTapY) < 24) { zoom(2, x, y); pick.classList.add('hide'); lastTap = 0; }
      else { selectPoint(x, y); lastTap = now; lastTapX = x; lastTapY = y; }
    }
  };
  cv.addEventListener('pointerup', pointerUp); cv.addEventListener('pointercancel', pointerUp);
  cv.addEventListener('keydown', event => { if (event.code === 'Equal' || event.code === 'NumpadAdd') zoom(1.6); else if (event.code === 'Minus' || event.code === 'NumpadSubtract') zoom(1 / 1.6); else if (event.code === 'ArrowLeft') map.pan(-60 / map.scale, 0); else if (event.code === 'ArrowRight') map.pan(60 / map.scale, 0); else if (event.code === 'ArrowUp') map.pan(0, -60 / map.scale); else if (event.code === 'ArrowDown') map.pan(0, 60 / map.scale); else return; event.preventDefault(); });
  let lastRevision = -1, lastX = NaN, lastZ = NaN, lastYaw = NaN;
  AF.onTick('map', 951, dt => {
    if (S.title) return;
    miniTimer += dt; mapTimer += dt;
    const src = focus(), yaw = heading(src);
    if (S.map) {
      const ease = 1 - Math.exp(-dt * 18), dx = map.tx - map.x, dz = map.tz - map.z, ds = map.ts - map.scale;
      if (Math.abs(dx) + Math.abs(dz) > 0.02 || Math.abs(ds) > 0.00001) { map.x += dx * ease; map.z += dz * ease; map.scale += ds * ease; dirty = true; }
      // pan / zoom easing redraws every frame; following the player alone stays at 10 Hz
      if (dirty || mapTimer >= 0.1 && (src.x !== lastX || src.z !== lastZ || yaw !== lastYaw || map.revision !== lastRevision || labelCount !== AF.labels.length)) {
        mapTimer = 0; lastX = src.x; lastZ = src.z; lastYaw = yaw; lastRevision = map.revision; drawMap();
      }
      return;
    }
    if (miniTimer < 0.1 || S.menu || S.help) return;
    miniTimer = 0;
    const span = AF.mode === 'aerial' ? AF.clamp(AF.PL.aerial.d * 1.4, 160, 700) : AF.mode === 'fly' ? 480 : AF.mode === 'drive' ? 220 : 140;
    if (src.x === miniX && src.z === miniZ && yaw === miniYaw && span === miniSpan && map.revision === miniRevision) return;
    miniX = src.x; miniZ = src.z; miniYaw = yaw; miniSpan = span; miniRevision = map.revision;
    drawLayers(mg, src.x, src.z, mini.width / span, mini.width, mini.height); playerMarker(mg, mini.width / 2, mini.height / 2, yaw);
  });
  AF.test('map: baked world and city images load', async () => {
    await map.finish();
    return { ok: !!(land.img && city.img) && map.memory() < 40 * 1024 * 1024, info: JSON.stringify(map.stats()) };
  });
  AF.test('map: M toggles map', () => {
    const title = S.title, open = S.map, hook = AF.hooks.tick.find(item => item.name === 'ui'); S.title = false;
    AF.input.tap('KeyM'); hook.fn(0); const changed = S.map !== open; AF.input.pressed.delete('KeyM');
    AF.input.tap('KeyM'); hook.fn(0); const restored = S.map === open; AF.input.pressed.delete('KeyM'); S.title = title;
    return changed && restored;
  });
  AF.test('map: zoom pan player projection round trip', () => {
    const saved = [map.x, map.z, map.scale], src = focus(); let error = 0;
    for (const scale of [0.2, 1, 3]) { map.x = -200; map.z = 100; map.scale = scale; const screen = map.worldToScreen(src.x, src.z), world = map.screenToWorld(screen.x, screen.y); error = Math.max(error, Math.hypot(world.x - src.x, world.z - src.z)); }
    [map.x, map.z, map.scale] = saved; return { ok: error < 1e-8, info: 'error ' + error };
  });
}
} catch (e) { AF.partError('74-map.js', e); }