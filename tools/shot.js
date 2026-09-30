// Harness: window.afShot(pose, hours) -> positions the camera (probe mode), hides DOM overlays, renders a few frames.
window.afShot = (pose, hours) => {
  const AF = window.__af;
  if (!AF.modes.probe) AF.modes.probe = { enter() {}, exit() {}, update() { const p = AF._probePose; AF.camera.position.set(p[0], p[1], p[2]); AF.camTarget.set(p[3], p[4], p[5]); AF.camera.lookAt(AF.camTarget); AF.shadowFocus.set(p[3], 0, p[5]); } };
  if (hours != null) { AF.time.hours = hours; AF.time.speed = 0; }
  for (const el of document.body.children) if (el.id !== 'cv' && el.tagName !== 'SCRIPT') { el.dataset.afShotHid = el.style.display || '-'; el.style.display = 'none'; }
  AF._probePose = pose; AF.setMode('probe');
  AF.world.buildFarAll && AF.world.buildFarAll();
  AF.step(40);
  return true;
};
window.afUnshot = () => { for (const el of document.body.children) if (el.dataset.afShotHid) { el.style.display = el.dataset.afShotHid === '-' ? '' : el.dataset.afShotHid; delete el.dataset.afShotHid; } };
