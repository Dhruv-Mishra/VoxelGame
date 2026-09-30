// Playwright harness: per-effect GPU cost (timer queries) at a few poses on tier globalThis.__psTier || 'lite'; toggles one effect at a time.
async (page) => {
  const b = page.context().browser();
  for (const c of b.contexts().slice(1)) await c.close();
  const ctx = await b.newContext({ viewport: { width: 1280, height: 720 } });
  await ctx.addInitScript((t) => { try { localStorage.setItem('portSolace.gfx', t); } catch (e) {} }, globalThis.__psTier || 'lite');
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(String(e).slice(0, 200)));
  await p.goto('http://127.0.0.1:8765/' + (globalThis.__psUrl || 'output.html') + '?nostream&v=' + Date.now());
  await p.waitForFunction(() => window.__af && window.__af.ready, null, { timeout: 180000 });
  await p.addScriptTag({ url: 'http://127.0.0.1:8765/tools/gpu-prof.js?v=' + Date.now() });
  const r = await p.evaluate(async ([hours, onlyBase]) => {
    const AF = __af, P = AF.post, R = AF.renderer; AF.world.buildFarAll();
    if (hours != null) { AF.time.hours = hours; AF.time.speed = 0; }
    const poses = [{ name: 'park', p: [-40, 1.8, -180, -40, 1.2, -230] }, { name: 'street', p: [40, 2, -80, 80, 3, -160] }, { name: 'colony', p: [-372, 1.8, -60, -372, 1.2, -120] }];
    const ms = async () => (await afGpu(poses, 30)).map((x) => x.gpu);
    const out = { gfx: AF.GFX.name, base: await ms() };
    if (onlyBase) { out.base2 = await ms(); return out; }
    const tog = async (name, on, off) => { try { on(); out[name] = await ms(); } catch (e) { out[name] = String(e).slice(0, 80); } finally { off(); } };
    if (P && P.aoPass && P.aoPass.enabled) await tog('noAO', () => { P.aoPass.enabled = false; }, () => { P.aoPass.enabled = true; });
    if (P && P.sceneRT && P.sceneRT.samples) { const s0 = P.sceneRT.samples; await tog('noMSAA', () => { P.sceneRT.samples = 0; P.sceneRT.dispose(); }, () => { P.sceneRT.samples = s0; P.sceneRT.dispose(); }); }
    if (P && P.enabled && P.bloom) await tog('noBloom', () => { P.bloom.enabled = false; }, () => { P.bloom.enabled = true; });
    if (P && P.enabled && P.raysPass) await tog('noRays', () => { P.raysEnabled = false; }, () => { P.raysEnabled = true; });
    if (P && P.enabled && P.fxaa) await tog('noFxaa', () => { P.fxaa.enabled = false; }, () => { P.fxaa.enabled = true; });
    if (P && P.enabled) await tog('noPost', () => { P.enabled = false; }, () => { P.enabled = true; });
    await tog('noSunShadow', () => { AF.sun.castShadow = false; }, () => { AF.sun.castShadow = true; });
    const lights = AF.scene.children.filter((o) => o.isPointLight || o.isSpotLight);
    await tog('noPointLights', () => lights.forEach((l) => { l.userData.i0 = l.intensity; l.intensity = 0; }), () => lights.forEach((l) => { l.intensity = l.userData.i0; }));
    const cover = AF.scene.children.filter((o) => /^cover-/.test(o.name));
    await tog('noCover', () => cover.forEach((o) => o.layers.disable(0)), () => cover.forEach((o) => o.layers.enable(0)));
    const pn = () => { const s = []; for (const r of AF.world.lod.values()) { if (r.near) s.push(r.near); if (r.nearGlass) s.push(r.nearGlass); } return s; };
    await tog('noPropsNear', () => pn().forEach((o) => o.layers.disable(0)), () => pn().forEach((o) => o.layers.enable(0)));
    await tog('halfRes', () => { R.setPixelRatio(R.getPixelRatio() * 0.5); AF.resize && AF.resize(); }, () => { R.setPixelRatio(R.getPixelRatio() * 2); AF.resize && AF.resize(); });
    out.base2 = await ms();
    out.info = { pr: R.getPixelRatio(), shadowType: R.shadowMap.type, map: AF.sun.shadow.mapSize.x, lights: lights.length, post: P && P.enabled, samples: P && P.sceneRT && P.sceneRT.samples, ao: !!(P && P.aoPass && P.aoPass.enabled) };
    return out;
  }, [globalThis.__psHours ?? null, !!globalThis.__psOnlyBase]);
  await ctx.close();
  return { r, errs };
}
