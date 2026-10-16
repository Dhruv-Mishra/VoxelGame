// Gameplay scenario for tools/hitch-probe.js (set globalThis.__psExtraSrc to this file's text, __psScenario = 'play'):
// title cinematic, start, run, steal a kerb car + drive, exit, guns + shooting, wanted 4 stars (squads, cops, autogyro), map,
// night, travel to the liner, walk the casino, travel to the outland. window.__psStep labels every hitch.
async (AF, wait) => {
  const L = window.__psLog = [], VV = AF.vehicles, CB = AF.combat, I = AF.input;
  const step = (s) => { window.__psStep = s; console.timeStamp(s); L.push(s + ' @' + AF.clock.t.toFixed(1) + ' ' + AF.mode + ' fps ' + AF.fps.toFixed(0)); };
  const hold = async (keys, ms) => { for (const k of keys) { I.down.add(k); I.pressed.add(k); } await wait(ms); for (const k of keys) I.down.delete(k); };
  step('title'); await wait(+(window.__titleMs || 24000));
  step('start'); AF.ui.go(); await wait(5000);
  step('run'); await hold(['KeyW', 'ShiftLeft'], 6000);
  step('steal');
  const p = AF.player; let best = null, bd = 1e18;
  for (const s of VV.parkedStatic) { if (s.noDrive || s.outland) continue; const d = (s.x - p.x) ** 2 + (s.z - p.z) ** 2; if (d < bd) { bd = d; best = s; } }
  if (best) { AF.setMode('drive', { car: VV.unpark(best) }); }
  step('drive');
  VV.autoInput = { up: true, down: false, left: 0, right: 0, brake: false };
  for (let i = 0; i < 12; i++) { await wait(1500); const r = AF.whash(i, 7); VV.autoInput.left = r < 0.25 ? 1 : 0; VV.autoInput.right = r > 0.75 ? 1 : 0; }
  VV.autoInput = null; step('exit'); if (VV.exitCar) VV.exitCar(); await wait(2000);
  step('guns'); for (const g of ['revolver', 'shotgun', 'tommy', 'rifle']) CB.give(g); CB.select(1); await wait(800);
  await hold(['KeyQ'], 2500); CB.select(3); await hold(['KeyQ'], 3000);
  step('wanted'); CB.crime(450); await wait(22000);
  step('clear'); CB.clearWanted(); await wait(2000);
  step('map'); I.tap('KeyM'); await wait(2500); I.tap('KeyM'); await wait(1500);
  step('bag'); I.tap('KeyI'); await wait(1500); I.tap('KeyI'); await wait(1000);
  step('night'); AF.time.set({ hours: 21.5 }); await wait(6000);
  step('travel-liner'); const g = AF.liner.spots.gangway;
  await AF.stream.travel({ label: 'the liner', go: () => AF.setMode('walk', { x: g.x, y: g.y, z: g.z, yaw: 0, snap: true }) });
  step('liner'); await hold(['KeyW'], 8000);
  step('travel-out');
  await AF.stream.travel({ label: 'the hills', go: () => AF.setMode('walk', { x: 900, y: AF.outland.h(900, -600) + 1, z: -600, yaw: 0, snap: true }) });
  step('hills'); await hold(['KeyW', 'ShiftLeft'], 8000);
  step('day'); AF.time.set({ hours: 12 }); await wait(4000);
  step('end');
}
