# Port Solace — Changes Overview & Performance Guide

This document details the architectural refactoring, performance optimizations, LOD stabilization, and visual noise/z-fighting fixes applied to Port Solace.

---

## 1. Performance Impact: Did Performance Improve or Decrease?

### Initial Pass vs. Optimization Pass
* **Initial Pass**: Focused on eliminating the visual pop-in and pop-out when turning the camera. By expanding peripheral view padding to 0.55 rad (~32°) and widening out-of-view thresholds, regions around and behind the player were held at full detail ($161.5\text{ m}$) longer. While this reduced visual popping, **it temporarily increased the active triangle and draw count**, causing frame pacing issues and micro-stuttering on systems near their GPU/CPU budget.
* **Optimization Pass (Current)**: Directly targets performance, freezing, and stuttering:
  1. **Squared Distance Pre-Rejection ([`02-voxel.js`](file:///d:/Desktop/VoxelGame/src/02-voxel.js#L1916-L1926))**: `regWant` now computes $d^2 = \Delta x^2 + \Delta z^2 + vy^2$ and uses squared thresholds. 90% of regions that are clearly far are rejected immediately without calculating expensive `Math.sqrt` and `Math.hypot` every frame.
  2. **Motion Vector Optimization ([`02-voxel.js`](file:///d:/Desktop/VoxelGame/src/02-voxel.js#L1896-L1914))**: `vLen` is precalculated once in `viewAim()` rather than recomputing `Math.hypot(A.vx, A.vz)` inside every loop iteration of `leadAt()`.
  3. **Zero-Allocation LOD Buffers ([`02-voxel.js`](file:///d:/Desktop/VoxelGame/src/02-voxel.js#L1927-L2035))**: Reusable typed buffers (`OUTS_BUF`, `INS_BUF`) replace transient per-swap array allocations, eliminating garbage collection spikes.
  4. **Right-Sized Out-of-View Boundaries**: Out-of-view regions now drop cleanly at $RD + 12$ ($142\text{ m}$), freeing GPU vertex memory behind the player, while in-view regions retain $RD \times 1.25 + 12$ ($174.5\text{ m}$) to prevent camera rotation popping.

---

## 2. Glass Renders, Street Lights & Z-Fighting Fixes

### A. Crystal-Clean Glass Without Grain or Speckle Noise
* **Zero Jitter & Edge Bevels in Palette ([`01-core.js`](file:///d:/Desktop/VoxelGame/src/01-core.js#L177-L197))**:
  * *Previously*: Glass palette definitions inherited default block jitter (0.1–0.5). In the fragment shader, `j * vJit * 0.09` added pseudorandom per-block noise across transparent surfaces, creating a grainy static or dirt-like speckle.
  * *Now*: In `AF.col`, any entry with `glass: true` automatically forces `jitter: 0`, `edge: 0`, `pat: 'none'`, and `smooth: true`.
* **Glass Shader Sanitization ([`02-voxel.js`](file:///d:/Desktop/VoxelGame/src/02-voxel.js#L937-L943))**:
  * In the voxel fragment shader patch for `key === 'glass'`, the block jitter calculation `shade = 1.0 + j * vJit * ...` and edge highlight lines are stripped out, rendering completely smooth, transparent glass.

### B. Glass & Surface Z-Fighting Elimination
* **Rasterizer Polygon Offset ([`02-voxel.js`](file:///d:/Desktop/VoxelGame/src/02-voxel.js#L950-L955))**:
  * *Previously*: `AF.mat.glass` had `depthWrite: false` and `depthTest: true`, but no polygon offset. Coplanar geometry (windows against wall frames, vehicle windshields against roofs, glass railings, display cases) produced depth buffer collisions and flickering stripes.
  * *Now*: `AF.mat.glass` uses `polygonOffset: true, polygonOffsetFactor: -1.0, polygonOffsetUnits: -4.0`. The GPU rasterizer pulls glass fragments forward in depth space, preventing any z-fighting with the geometry behind it.

### C. Traffic Lights & Street Lights
* **Traffic Light Lens Geometry & Offset ([`11-streets.js`](file:///d:/Desktop/VoxelGame/src/11-streets.js#L418-L432))**:
  * *Previously*: The colored lens boxes (`0.2 x 0.2 x 0.05` m) were centered at `0.315` m, directly cutting through the traffic light head housing (`0.3125` m half-width), causing black visor boxes and colored lenses to fight.
  * *Now*: Lens depth is adjusted to `0.04` m, centered cleanly at `0.325` m with `polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4`. Lenses render crisply with zero flickering.
* **Subpixel Night Light Stabilization ([`02-voxel.js`](file:///d:/Desktop/VoxelGame/src/02-voxel.js#L446))**:
  * Reduced `uFarEmit` from 1.1 to 0.5. Distant night lamps no longer over-brighten into single-pixel sparkling noise.

---

## 3. Freeze & Stutter Elimination

### Root Causes & Solutions
1. **Concurrent Dual-Mesh Cross-Fade Spikes**:
   * *Problem*: Looking around rapidly previously caused dozens of regions to simultaneously enter `FADE.swap`. During a 0.3s fade, both the high-poly and coarse meshes rendered together, doubling active draw calls and tripping framerate dips.
   * *Solution*: Stable distance hysteresis ensures camera rotation alone never triggers cross-fades. The engine no longer floods the fade queue during head turns.
2. **Heavy Inner-Loop Math**:
   * *Problem*: In `prop-lod` (Tick 880), iterating over hundreds of regions and clusters evaluated multiple `Math.hypot` calls every frame.
   * *Solution*: Fast squared distance pre-checks (`d2 > dropLimit * dropLimit`) early-out before calculating square roots. Reused static buffers (`OUTS_BUF`, `INS_BUF`) eliminate transient garbage.

---

## 4. Object-Oriented Architecture & Inheritance

- **Vehicle Hierarchy ([`04-vehicle.js`](file:///d:/Desktop/VoxelGame/src/04-vehicle.js), [`50-vehicles.js`](file:///d:/Desktop/VoxelGame/src/50-vehicles.js), [`52-planes.js`](file:///d:/Desktop/VoxelGame/src/52-planes.js))**:
  - Enhanced [`AF.Vehicle`](file:///d:/Desktop/VoxelGame/src/04-vehicle.js#L24) base class providing shared physics, oriented bounding box (OBB) math, Separating Axis Theorem (SAT) 2D collision detection (`overlap`), voxel ground interaction (`worldHits`), and mesh transforms (`placeMesh`).
  - Subclassed by `class Car extends AF.Vehicle` in [`50-vehicles.js`](file:///d:/Desktop/VoxelGame/src/50-vehicles.js#L564), `class Plane extends AF.Vehicle` in [`52-planes.js`](file:///d:/Desktop/VoxelGame/src/52-planes.js#L63), and `class JetSki extends AF.Vehicle` in [`44-island.js`](file:///d:/Desktop/VoxelGame/src/44-island.js#L507).
  - Standalone helper functions (`VV.bodyDist`, `VV.placeMesh`, `VV.seatLocal`, `overlap`, `carPts`) remain fully preserved as delegation wrappers for 100% backward compatibility.
- **Walker / Pedestrian Actor Class ([`54-walkers.js`](file:///d:/Desktop/VoxelGame/src/54-walkers.js#L63-L79))**:
  - `class Actor` (`AF.Actor`, `WK.Actor`) encapsulates crowd entity state and reaction methods (`knock`, `sleep`, `kill`, `revive`, `stagger`, `scare`, `hold`, `isDown`).
- **Minigame Framework ([`76-minigame.js`](file:///d:/Desktop/VoxelGame/src/76-minigame.js#L32-L53))**:
  - `class Minigame` standardizes lifecycle hooks across all 8 minigames (`lockpick`, `circuit`, `flow`, `signal`, `drill`, `deal`, `stamp`, `keypad`).

---

## 5. What All Should You Test?

| Test Area | What to Do | What to Look For |
|---|---|---|
| **Glass Surfaces & Windows** | Walk up to building shopfronts, bus shelters, phone booths, or car windows. | Glass should be crystal clear without speckle/grain noise, and zero z-fighting against window sills or frames. |
| **Traffic Lights** | Stand at Grand Ave & Broadway or Meridian St intersections. | Red, amber, and green lenses sit cleanly on the housing without flickering or intersecting black visors. |
| **Street Lights & Night Lamps** | Switch time to dusk/night (`AF.time.set(21)`). Look down long avenues. | Street lamps glow smoothly without subpixel crawling noise or flickering. |
| **Frame Pacing & Stutters** | Sprint or drive down Grand Ave while panning the camera 360°. | Frame rate remains high and stable without micro-stutters or pauses during head turns. |
| **Vehicle Driving & Traffic** | Enter and drive cars, trucks, and motorbikes; collide with traffic. | Driving physics, collision handling, and boarding prompts operate smoothly. |
| **Flight Mechanics** | Fly from Corsair Key or Westgate Airfield. | Aerodynamic controls, instruments, and landings behave properly. |
| **Minigames** | Launch minigames via query params (e.g. `?mg=circuit`, `?mg=lockpick`). | Canvas responds to input cleanly and closes on `Esc`. |
| **Engine Self-Tests** | Open `http://127.0.0.1:8765/output.html?test`. | All self-tests pass green. |
