// ================================================================ 05-plan.js
try {
// ===== 05-plan: THE PORT SOLACE PLAN — every agent builds inside the rects given here  (OWNER: coordinator) =====
// Coordinates in metres. North = -z, East = +x. Ground (road top) is y = 0. Sidewalks/lots/lawns are 1 block (y = 0.25).
// The harbour is the SOUTH edge (open water z > 210). Central Park is the north centre. Downtown towers are centre-east.
// Same schema as the Acorn Falls plan so the copied systems (people, vehicles, animals, atmos, player, UI) keep working.
// "rail" = THE STREETCAR LOOP: one-way single track in the CENTRE of the four tram boulevards (w 20), rounded corners R 20.
AF.PLAN = (() => {
  const P = {};
  P.name = 'Port Solace';
  P.season = 'early autumn';
  P.tagline = 'a harbour city where the lights never quite go out';

  // ---- ROADS: centreline segments, width w (default 10). Lots begin (w/2 + 3) m off the centreline (sidewalk 3 m).
  //   w 20 = tram boulevard: track on the centreline (±1.5 m), car lanes centred ±6.5 m, stop islands 2.0..4.2 m OUTSIDE the loop.
  //   w 14 = grand avenue (car lanes ±3.2 m, painted centre line).   w 10 = street (lanes ±2.4 m).
  P.roads = [
    // E–W (z const)
    { name: 'Park Row', a: [-240, -160], b: [240, -160], w: 20, tram: true },            // tram, north side (Central Park / City Hall / downtown)
    { name: 'Charter Street', a: [-240, -80], b: [240, -80] },
    { name: 'Meridian Avenue', a: [-240, 0], b: [240, 0], w: 14 },                        // the main E–W avenue
    { name: 'Bay Street', a: [-240, 80], b: [240, 80] },
    { name: 'Harbour Boulevard', a: [-240, 160], b: [240, 160], w: 20, tram: true },     // tram, south side (waterfront)
    { name: 'North Street', a: [-240, -240], b: [-160, -240] },                           // (Central Park interrupts it)
    { name: 'North Street', a: [80, -240], b: [240, -240] },
    // N–S (x const)
    { name: 'Wren Street', a: [-240, -240], b: [-240, 160] },
    { name: 'Lantern Avenue', a: [-160, -240], b: [-160, 160], w: 20, tram: true },      // tram, west side (Old Town)
    { name: 'Library Street', a: [-80, -160], b: [-80, 160] },
    { name: 'Grand Avenue', a: [0, -160], b: [0, 160], w: 14 },                           // the main N–S avenue: Great White Way (theatres) south of Meridian
    { name: 'Broad Street', a: [80, -240], b: [80, 160] },
    { name: 'Terminal Avenue', a: [160, -240], b: [160, 160], w: 20, tram: true },       // tram, east side (Union Terminal)
    { name: 'Anchor Street', a: [240, -240], b: [240, 0] },                               // stops at Meridian: Union Terminal + rail yard fill x 173..300, z 10..72
    { name: 'Anchor Street', a: [240, 80], b: [240, 160] },
    // THE WEST SIDE (new land x < -300): Westgate Road links Wren St to New Friends Colony, the zoo and the airfield
    { name: 'Westgate Road', a: [-660, 0], b: [-240, 0], w: 14 },
    { name: 'Friends Lane', a: [-372, -226], b: [-372, 0] },
    { name: 'Airfield Road', a: [-470, 0], b: [-470, 36] },
    // EASTPORT (43-east.js, x 300..460): the avenues carry on east over the Solace River; two new N-S streets (the rail corridor
    // z 0..80 is left clear for the Coastline Limited, so they stop at Meridian and start again at Bay)
    { name: 'North Street', a: [240, -240], b: [452, -240] },
    { name: 'Park Row', a: [240, -160], b: [452, -160], w: 14 },
    { name: 'Charter Street', a: [240, -80], b: [452, -80] },
    { name: 'Meridian Avenue', a: [240, 0], b: [460, 0], w: 14 },
    { name: 'Bay Street', a: [240, 80], b: [452, 80] },
    { name: 'Harbour Boulevard', a: [240, 160], b: [452, 160], w: 14 },
    { name: 'Riverside Drive', a: [320, -240], b: [320, 0] },
    { name: 'Riverside Drive', a: [320, 80], b: [320, 160] },
    { name: 'Eastbank Avenue', a: [444, -240], b: [444, 0] },
    { name: 'Eastbank Avenue', a: [444, 80], b: [444, 160] },
  ];
  for (const r of P.roads) r.w = r.w || 10;
  P.depotPlaza = [-1, -1, 0, 0];   // (Acorn Falls key, unused)

  // ---- THE STREETCAR LOOP ("rail" key). Rounded rectangle x,z in [-160,160], corner radius 20, track top y = 0.05 (flush
  // rails set in the asphalt; the rails are 1 block proud at most). s = 0 at (0,160) heading EAST; then north up Terminal Ave,
  // west along Park Row, south down Lantern Ave, east along Harbour Blvd (counter-clockwise on screen with north up).
  // The right-hand side of travel is always the OUTSIDE of the loop: stop islands + tram doors are on the outside.
  const H = 160, R = 20, C = H - R;
  P.rail = {
    kind: 'streetcar', half: H, cornerR: R, ballastTop: 0.05, gauge: 1.5, width: 3, inStreet: true,
    wireY: 6.2,                                                                // overhead contact wire height (streets-park builds poles + wire)
    tunnel: { z: -990, x0: -1, x1: 0, bore: [-995, -985], topY: 0 },          // DUMMY (off-map) so copied code is harmless
    bridges: [], crossings: [], stations: [],
  };
  {
    const segs = [];
    segs.push({ t: 'line', a: [0, H], b: [C, H] });
    segs.push({ t: 'arc', cx: C, cz: C, r: R, a0: Math.PI / 2, a1: 0 });
    segs.push({ t: 'line', a: [H, C], b: [H, -C] });
    segs.push({ t: 'arc', cx: C, cz: -C, r: R, a0: 0, a1: -Math.PI / 2 });
    segs.push({ t: 'line', a: [C, -H], b: [-C, -H] });
    segs.push({ t: 'arc', cx: -C, cz: -C, r: R, a0: -Math.PI / 2, a1: -Math.PI });
    segs.push({ t: 'line', a: [-H, -C], b: [-H, C] });
    segs.push({ t: 'arc', cx: -C, cz: C, r: R, a0: Math.PI, a1: Math.PI / 2 });
    segs.push({ t: 'line', a: [-C, H], b: [0, H] });
    for (const s of segs) s.len = s.t === 'line' ? Math.hypot(s.b[0] - s.a[0], s.b[1] - s.a[1]) : Math.abs(s.a1 - s.a0) * s.r;
    const L = segs.reduce((a, s) => a + s.len, 0);
    P.rail.length = L;
    P.rail.segs = segs;
    P.railPoint = (s) => {
      s = ((s % L) + L) % L;
      for (const g of segs) {
        if (s > g.len) { s -= g.len; continue; }
        if (g.t === 'line') { const t = s / g.len, dx = (g.b[0] - g.a[0]) / g.len, dz = (g.b[1] - g.a[1]) / g.len; return { x: g.a[0] + (g.b[0] - g.a[0]) * t, z: g.a[1] + (g.b[1] - g.a[1]) * t, dx, dz, yaw: Math.atan2(dx, dz) }; }
        const a = g.a0 + (g.a1 - g.a0) * (s / g.len), sgn = Math.sign(g.a1 - g.a0);
        const x = g.cx + Math.cos(a) * g.r, z = g.cz + Math.sin(a) * g.r, dx = -Math.sin(a) * sgn, dz = Math.cos(a) * sgn;
        return { x, z, dx, dz, yaw: Math.atan2(dx, dz) };
      }
      return { x: 0, z: H, dx: 1, dz: 0, yaw: Math.PI / 2 };
    };
    // tabulated inverse: arc length of the loop point nearest (x,z), and the distance to the track centreline
    const N = 4096, tab = [];
    for (let i = 0; i < N; i++) { const p = P.railPoint(i / N * L); tab.push(p.x, p.z); }
    P.railS = (x, z) => { let best = 1e18, bi = 0; for (let i = 0; i < N; i++) { const d = (tab[i * 2] - x) ** 2 + (tab[i * 2 + 1] - z) ** 2; if (d < best) { best = d; bi = i; } } return bi / N * L; };
    P.railDist = (x, z) => { const p = P.railPoint(P.railS(x, z)); return Math.hypot(p.x - x, p.z - z); };
    // point offset sideways from the track: off > 0 = OUTSIDE of the loop (the right-hand side of travel = the stop-island side)
    P.railSide = (s, off) => { const p = P.railPoint(s); return { x: p.x - p.dz * off, z: p.z + p.dx * off, yaw: p.yaw }; };
    // the six stops. Each: the car stands centred on sC; island 24 m long, 2.0..4.2 m outside the track, a shelter + sign on it.
    const stops = [
      ['paramount', 'Paramount · Theatre Row', 34, 160],
      ['terminal', 'Union Terminal', 160, 40],
      ['tower', 'Solace Tower · Downtown', 112, -160],
      ['cityhall', 'City Hall · Central Park', -40, -160],
      ['oldtown', 'Old Town', -160, -40],
      ['harbour', 'Harbour Square · Fish Market', -110, 160],
    ];
    for (const [id, name, x, z] of stops) {
      const sC = P.railS(x, z), p = P.railPoint(sC), a = P.railSide(sC - 12, 2.0), b = P.railSide(sC + 12, 4.2);
      P.rail.stations.push({ id, name, sC, x: p.x, z: p.z, yaw: p.yaw, side: 'outside',
        track: [Math.min(P.railPoint(sC - 12).x, P.railPoint(sC + 12).x), Math.min(P.railPoint(sC - 12).z, P.railPoint(sC + 12).z), Math.max(P.railPoint(sC - 12).x, P.railPoint(sC + 12).x), Math.max(P.railPoint(sC - 12).z, P.railPoint(sC + 12).z)],
        platform: [Math.min(a.x, b.x), Math.min(a.z, b.z), Math.max(a.x, b.x), Math.max(a.z, b.z)] });
    }
    P.rail.stations.sort((p, q) => p.sC - q.sC);
  }

  // ---- WATER. The harbour: open sea south of the quay wall at z = 210 (all x). Quay top y = 0.25, water y = -1.25, bed y = -4.
  P.harbour = { coastZ: 210, waterY: -1.25, bedY: -4, name: 'Solace Harbour',
    lighthouse: { x: 262, z: 276, name: 'Solace Point Light' },                // on the end of the east breakwater (from the quay at x 280 out to it)
    piers: [
      { id: 'pleasure', name: 'Pleasure Pier', x0: -238, x1: -222, z1: 268 },  // boardwalk amusements (Ferris wheel on it)
      { id: 'fish', name: 'Fish Pier', x0: -96, x1: -86, z1: 250 },
      { id: 'ferry', name: 'Ferry Pier', x0: -6, x1: 6, z1: 262 },
      { id: 'cargo', name: 'Pier 9 (cargo)', x0: 110, x1: 150, z1: 270 },
    ] };
  P.river = { width: 13, bedY: -3.5, waterY: -1.25, name: 'Solace River', x: (z) => 384 + 5 * Math.sin((z + 240) * 0.011) + 2 * Math.sin((z + 240) * 0.037), z0: -252, z1: 214 };   // Eastport's river: the Heights to the harbour
  P.falls = { x: -990, z: -990, top: 0, pool: [-990, -990] };                             // PARKED off-map
  P.ridge = { z0: -999, crest: -999, height: 0, name: '', spur: { x0: 0, x1: 0, z0: -999 } }; // PARKED
  P.heights = { z1: -250, height: 40, name: 'Solace Heights' };   // v2: 12 -> 40 m so the Heights read from the air (land reshapes the slope + backdrop)   // wooded hills along the north edge OUTSIDE Central Park (z < -250, rising to the map edge)

  // ---- CENTRAL PARK (streets-park agent): x -147..72, z -292..-173
  P.park = { x0: -147, z0: -292, x1: 72, z1: -173, name: 'Central Park' };
  P.lake = { cx: -92, cz: -238, rx: 34, rz: 22, waterY: -0.75, name: 'Swan Lake' };        // boating lake with rowboats (inside the park)
  P.pond = { cx: 34, cz: -262, r: 12, name: 'the skating pond' };                            // the skating-rink pond (inside the park)
  P.parkFeatures = { bandshell: [-10, -262], carousel: [20, -208], fountain: [-36, -198], zoo: null };
  P.plaza = { x0: -72, z0: -72, x1: -10, z1: -10, name: 'Civic Plaza' };                      // in front of City Hall (civic agent)
  P.square = P.plaza;

  // ---- LOTS: rect [x0,z0,x1,z1] -> owner agent + wants.  Columns (x): A -292..-248 · B -232..-173 · C -147..-88 · D -72..-10 ·
  //   E 10..72 · F 88..147 · G 173..232 · H 248..292.   Rows (z): r1 -232..-173 · r2 -147..-88 · r3 -72..-10 · r4 10..72 · r5 88..147 ·
  //   quay 173..210.   Edge blocks are "fill" (exterior-only city fabric) so the city reads as whole from the air.
  P.lots = [
    // DOWNTOWN (20-downtown.js, 21-downtown-2.js)
    { id: 'dt-bank', owner: 'downtown', rect: [10, -147, 72, -88], faces: 'west (Grand Ave), north (Park Row), south (Charter St)', wants: 'HARBOUR TRUST bank: a 38 m deco tower with a granite base, bronze doors, and a HUGE enterable banking hall (coffered ceiling, teller cages, marble counters, clocks, a round VAULT door standing open to a vault of safe-deposit boxes and gold bars) + the Chrysalis Building (exterior, 30 m)' },
    { id: 'dt-tower', owner: 'downtown', rect: [88, -147, 147, -88], faces: 'north (Park Row), all', wants: 'SOLACE TOWER, the tallest (55 m + spire to ~63): stepped setbacks, a sunburst crown lit at night, mooring mast for the blimp; an enterable lobby with a mural and elevator doors; + the Aurora Building (exterior, 34 m, rooftop water tank)' },
    { id: 'dt-hotel', owner: 'downtown', rect: [10, -72, 72, -10], faces: 'west (Grand Ave), south (Meridian Ave)', wants: 'THE GRAND SOLACE HOTEL (40 m, rooftop neon sign): canopy + revolving door + doorman, a vast LOBBY (chandeliers, reception desk with key rack and bell, palms, grand stair, lounge chairs) and a BALLROOM (sprung dance floor, band stage, tables with lamps, balcony), a few guest rooms upstairs' },
    { id: 'dt-store', owner: 'downtown', rect: [88, -72, 147, -10], faces: 'west (Broad St), south (Meridian Ave)', wants: 'MERIDIAN DEPARTMENT STORE (4 floors enterable via stairs, 26 m): display windows with mannequins, perfume + hats on the ground floor, ladies wear, menswear, toys + radios, a tea room on top; + one slim exterior tower (the Pinnacle, 44 m)' },
    { id: 'dt-radio', owner: 'downtown', rect: [88, 10, 147, 72], faces: 'north (Meridian Ave), west (Broad St)', wants: 'WSOL RADIO BUILDING (30 m, a lattice radio mast on top with a blinking red light): enterable lobby + a LIVE STUDIO (ON AIR sign, microphones, a band on a riser, a glass control booth with dials, a studio audience in seats) + the Beacon Building (exterior, 32 m)' },
    // THEATRE DISTRICT + SHOPS (22-theatre.js, 23-shops.js)
    { id: 'th-paramount', owner: 'theatre-shops', rect: [10, 88, 72, 147], faces: 'west (Grand Ave), south (Harbour Blvd)', wants: 'THE PARAMOUNT movie palace on the Grand Ave × Harbour Blvd corner: vertical PARAMOUNT blade sign, a MARQUEE with chasing bulbs + film titles, ticket booth, gilded lobby with candy counter, an AUDITORIUM with a raked floor, 200+ seats, a BALCONY, organ, curtains and a glowing screen; + shops on Bay Street' },
    { id: 'th-jazz', owner: 'theatre-shops', rect: [-72, 88, -10, 147], faces: 'east (Grand Ave), south (Harbour Blvd)', wants: 'THE BLUE HERON jazz club (neon heron, stage with a band, bar, small round tables with lamps, a dance floor), the Rialto (a second smaller theatre facade with a vertical sign), a hat shop, a florist' },
    { id: 'th-diner', owner: 'theatre-shops', rect: [10, 10, 72, 72], faces: 'west (Grand Ave), north (Meridian Ave), south (Bay St)', wants: 'the STARLITE DINER (stainless steel, counter + stools, booths, pie case, neon), the HORN & HARDART-style AUTOMAT (a wall of little glass food doors, marble tables), a drugstore soda fountain, a newsstand + tobacconist, a barber with a spinning pole' },
    { id: 'th-shops', owner: 'theatre-shops', rect: [-72, 10, -10, 72], faces: 'east (Grand Ave), north (Meridian Ave), south (Bay St)', wants: 'a row of shopfronts with striped awnings + neon: a bakery, a record & radio shop, a bookshop, a camera shop, a shoeshine stand, a dance hall upstairs (Roseland) — every shop enterable and stocked' },
    { id: 'sh-bay', owner: 'theatre-shops', rect: [88, 88, 147, 147], faces: 'south (Harbour Blvd), west (Broad St)', wants: 'waterfront shops: a ship chandlery, a seafood restaurant (Neptune Oyster Bar), a pawn shop, a hardware store, a laundromat, a pool hall — enterable' },
    // CIVIC (30-civic.js, 31-civic-2.js)
    { id: 'cv-cityhall', owner: 'civic', rect: [-72, -147, -10, -88], faces: 'south (onto Civic Plaza across Charter St)', wants: 'CITY HALL with a big DOME (~40 m to the lantern) on a drum with columns, grand steps, a rotunda under the dome, council chamber, mayor\'s office, a clock, flags' },
    { id: 'cv-plaza', owner: 'civic', rect: [-72, -72, -10, -10], faces: 'all', wants: 'CIVIC PLAZA: a big fountain (live water), a statue of the city founder, flagpoles with flags, benches, planters, a pigeon-lady bench, a war memorial. KEEP x -32..-24, z -40..-12 CLEAR (the spawn walks north from (-28, -16))' },
    { id: 'cv-library', owner: 'civic', rect: [-147, -147, -88, -88], faces: 'east (Library St), south (Charter St)', wants: 'the PUBLIC LIBRARY: stone lions, columns, a great READING ROOM (long tables, green lamps, tall shelves, a mezzanine, arched windows), card catalogue, children\'s corner' },
    { id: 'cv-museum', owner: 'civic', rect: [-147, -72, -88, -10], faces: 'east (Library St), south (Meridian Ave)', wants: 'the CITY MUSEUM: a great hall with a DINOSAUR SKELETON (a big voxel T-rex/brontosaurus), a whale hanging from the ceiling, display cases, ship models, a totem, a planetarium dome' },
    { id: 'cv-terminal', owner: 'civic', rect: [173, 10, 300, 72], faces: 'west (Terminal Ave), north (Meridian Ave)', wants: 'UNION TERMINAL: a grand station hall (huge arched windows, a vaulted ceiling, a clock, a split-flap DEPARTURES BOARD, ticket windows, benches, a newsstand, a shoeshine) facing Terminal Avenue; behind it (x 232..300) the train shed with 4 platforms and 2 streamlined intercity trains standing in it; tracks run off the east edge of the map' },
    // RESIDENTIAL — detailed blocks (40-homes.js, 41-homes-2.js): 40+ furnished enterable homes in total
    { id: 'rs-c4', owner: 'residential', rect: [-147, 10, -88, 72], faces: 'all', wants: 'brownstones with stoops (people sitting on them), a corner grocery, fire escapes, laundry lines across the back yard' },
    { id: 'rs-c5', owner: 'residential', rect: [-147, 88, -88, 147], faces: 'all', wants: 'brick rowhouses, a corner candy store, an apartment block (Mariner Court) with a courtyard' },
    { id: 'rs-b2', owner: 'residential', rect: [-232, -147, -173, -88], faces: 'all', wants: 'Old Town rowhouses in mixed brick colours, a tailor, a church-hall/school' },
    { id: 'rs-b3', owner: 'residential', rect: [-232, -72, -173, -10], faces: 'all', wants: 'brownstones + a deli + a fire station (Engine Co. 7, red doors, a fire truck parking bay 4 x 9 m clear on Wren St — note its centre in notes/residential.md)' },
    { id: 'rs-b4', owner: 'residential', rect: [-232, 10, -173, 72], faces: 'all', wants: 'tenements with fire escapes + laundry lines between buildings, a laundry, a pocket park with a hopscotch court' },
    { id: 'rs-b5', owner: 'residential', rect: [-232, 88, -173, 147], faces: 'all', wants: 'an apartment block with a roof garden + pigeon coop, rowhouses, a corner bar (the Anchor & Rope)' },
    { id: 'rs-g2', owner: 'residential', rect: [173, -147, 232, -88], faces: 'all', wants: 'Eastside brownstones, a doctor\'s office, a hardware store' },
    { id: 'rs-g3', owner: 'residential', rect: [173, -72, 232, -10], faces: 'all', wants: 'apartment houses with rooftop water tanks, a bakery, a small church' },
    // FILL — exterior-only city fabric (residential agent, 42-fill.js): procedurally varied, closed doors, lit windows at night
    { id: 'fill-a', owner: 'residential', rect: [-292, -232, -253, -10], faces: 'east (Wren St)', fill: true, wants: 'a continuous street wall of 4–8 storey apartment buildings and warehouses (exterior only), varied colours, water tanks, lit windows' },
    { id: 'fill-a2', owner: 'residential', rect: [-292, 10, -253, 147], faces: 'east (Wren St)', fill: true, wants: 'the same street wall south of Westgate Road' },
    { id: 'fill-b1', owner: 'residential', rect: [-232, -232, -173, -173], faces: 'all', fill: true, wants: 'apartment houses (exterior only), a small parking garage' },
    { id: 'fill-f1', owner: 'residential', rect: [88, -232, 147, -173], faces: 'all', fill: true, wants: 'luxury Park East apartments (exterior only, 20–28 m), awnings, doormen' },
    { id: 'fill-g1', owner: 'residential', rect: [173, -232, 232, -173], faces: 'all', fill: true, wants: 'apartment houses (exterior only)' },
    { id: 'fill-h', owner: 'residential', rect: [253, -232, 292, -10], faces: 'west (Anchor St)', fill: true, wants: 'mid-rise offices and apartments (exterior only)' },
    // HARBOUR (14-harbour.js, 15-harbour-2.js — land-harbour agent)
    { id: 'hb-boardwalk', owner: 'land-harbour', rect: [-292, 173, -150, 210], faces: 'north (Harbour Blvd), south (water)', wants: 'the BOARDWALK: planked promenade, a CAROUSEL pavilion (turning, horses bobbing), saltwater taffy + hot dog stands, a penny arcade, benches; the Pleasure Pier out to z 268 with a turning FERRIS WHEEL' },
    { id: 'hb-fish', owner: 'land-harbour', rect: [-150, 173, -40, 210], faces: 'north (Harbour Blvd), south (water)', wants: 'the FISH MARKET hall (enterable: ice tables of fish, crates, scales, hanging lamps, fishmongers), fishing boats at the Fish Pier, nets drying, lobster pots' },
    { id: 'hb-square', owner: 'land-harbour', rect: [-40, 173, 40, 210], faces: 'north (Harbour Blvd), south (water)', wants: 'HARBOUR SQUARE: harbourmaster\'s office with a clock tower, the ferry ticket kiosk, an anchor monument, the Ferry Pier with a ferry boat' },
    { id: 'hb-docks', owner: 'land-harbour', rect: [40, 173, 292, 210], faces: 'north (Harbour Blvd), south (water)', wants: 'the CARGO DOCKS: 3 big gantry/jib cranes, brick warehouses along the back of the quay, stacks of crates and barrels, bollards, 2 CARGO SHIPS + 2 TUGBOATS in the water, the east breakwater out to the LIGHTHOUSE' },
    { id: 'hb-warehouses', owner: 'land-harbour', rect: [173, 88, 232, 147], faces: 'all', wants: 'brick warehouses with painted signs, a cannery with a chimney (smoke), loading docks' },
    { id: 'hb-yard', owner: 'land-harbour', rect: [248, 88, 292, 147], faces: 'west (Anchor St)', wants: 'a freight yard / coal + ice depot: brick warehouse, a gantry, stacked crates, a delivery-truck loading bay' },
    // THE WEST SIDE (45-west.js)
    { id: 'w-colony-w', owner: 'west', rect: [-432, -226, -380, -8] },
    { id: 'w-colony-e', owner: 'west', rect: [-364, -226, -306, -8] },
    { id: 'w-zoo', owner: 'west', rect: [-652, -292, -446, -12] },
    { id: 'w-airfield', owner: 'west', rect: [-652, 10, -306, 206] },
    // EASTPORT (42-fill builds these strips: one street face, stepped back ranges toward the river / the alley)
    { id: 'fill-e1', owner: 'residential', fill: true, strip: 'e', rect: [294, -232, 312, -170] },
    { id: 'fill-e2', owner: 'residential', fill: true, strip: 'e', rect: [294, -150, 312, -88] },
    { id: 'fill-e3', owner: 'residential', fill: true, strip: 'e', rect: [294, -72, 312, -10] },
    { id: 'fill-e4', owner: 'residential', fill: true, strip: 'e', rect: [294, 88, 312, 147] },
    { id: 'fill-e5', owner: 'residential', fill: true, strip: 'w', rect: [328, -232, 360, -170] },
    { id: 'fill-e6', owner: 'residential', fill: true, strip: 'w', rect: [328, -150, 360, -88] },
    { id: 'fill-e7', owner: 'residential', fill: true, strip: 'w', rect: [328, -72, 360, -10] },
    { id: 'fill-e8', owner: 'residential', fill: true, strip: 'w', rect: [328, 88, 360, 147] },
    { id: 'fill-e9', owner: 'residential', fill: true, strip: 'e', rect: [408, -232, 436, -170] },
    { id: 'fill-e10', owner: 'residential', fill: true, strip: 'e', rect: [408, -150, 436, -88] },
    { id: 'fill-e11', owner: 'residential', fill: true, strip: 'e', rect: [408, -72, 436, -10] },
    { id: 'fill-e12', owner: 'residential', fill: true, strip: 'e', rect: [408, 88, 436, 147] },
    { id: 'fill-e13', owner: 'residential', fill: true, strip: 'n', rect: [300, 170, 362, 202] },
  ];

  // ---- THE WEST SIDE layout (x -660..-300). Plots face Friends Lane (x -372); the zoo fills the north-west corner; the airfield
  // runs east-west along the coast so planes climb out over the sea.
  P.bounds = { x0: -660, z0: -300, x1: 460, z1: 300 };
  P.world = {
    play: { x0: -1220, x1: 1020, z0: -900, z1: 300 }, margin: 12,
    bounds: { x0: -1476, x1: 1276, z0: -1708, z1: 940 },
    lake: { name: 'Lake Tamsin', cx: -40, cz: -650, rx: 90, rz: 55, waterY: 22 },
    island: { name: 'Serena Isle', cx: -60, cz: 600, rx: 220, rz: 130,
      cone: { x: -10, z: 625, r: 85, y: 55, craterR: 13 },
      airstrip: { x0: -230, x1: 90, z: 540, w: 22, y: 2 },
      resort: { x: -170, z: 640, r: 45, y: 3 },
      ferry: { cityPier: [0,260], islandPier: [-20,424], path: [[0,277],[-20,405]], dwell: 25, crossing: 40 },
      landing: { x: -20, z: 478, r: 20, y: 2, pier: { x0: -24, x1: -16, z0: 420, z1: 478 } } },
    roads: [
      { name: 'Coast Road', w: 10, surface: 'asphalt', points: [[-660, 0], [-820, -10], [-1000, -40]], heights: [0, 5, 10] },
      { name: 'Eastwood Road', w: 10, surface: 'asphalt', points: [[460, 0], [700, -40], [980, -120]], heights: [0, 10, 19] },
      { name: 'Lake Road', w: 10, surface: 'gravel', points: [[258, -284], [258, -300], [230, -360], [160, -420], [50, -480], [-40, -560], [-40, -590]], heights: [30, 40, 44, 38, 23, 22, 23] },
      { name: 'West Coast Drive', w: 10, surface: 'asphalt', points: [[-1000, -40], [-1210, -40], [-1220, -220], [-1180, -280]], heights: [10, 9, 7, 9] },
      { name: 'Beach Lane', w: 10, surface: 'gravel', points: [[-1210, -40], [-1210, 60], [-1200, 120], [-1150, 164]], heights: [9, 9, 8, 7] },
      { name: 'Alder Lane', w: 10, surface: 'gravel', points: [[-820, -10], [-855, -85], [-915, -108], [-974, -110], [-1020, -120], [-1100, -155], [-1170, -150]], heights: [5, 7, 9, 10, 10, 11, 10] },
      { name: 'Foxglove Lane', w: 10, surface: 'gravel', points: [[-1100, -155], [-1140, -205], [-1145, -260], [-1180, -280]], heights: [11, 10, 10, 9] },
      { name: 'Mill Lane', w: 10, surface: 'gravel', points: [[-820, -10], [-865, 0], [-880, 50], [-980, 50], [-1040, 70], [-1138, 70], [-1200, 120]], heights: [5, 6, 8, 10, 11, 10, 8] },
      { name: 'Eastwood Loop', w: 10, surface: 'asphalt', points: [[700, -40], [720, 10], [820, 20], [970, 0], [1020, -60], [980, -120]], heights: [10, 15, 17, 14, 17, 19] },
      { name: 'Mirror Lane', w: 10, surface: 'gravel', points: [[700, -40], [730, -90], [750, -130], [800, -120], [920, -115]], heights: [10, 14, 15, 14, 16] },
      { name: 'Ochre Trail', w: 10, surface: 'gravel', points: [[820, 20], [840, 80], [920, 110], [990, 150]], heights: [17, 16, 15, 13] },
      { name: 'Birch Lane', w: 10, surface: 'gravel', points: [[920, -115], [940, -180], [960, -250]], heights: [16, 19, 18] },
    ],
  };
  P.west = {
    lane: -372,
    // 12 plots, 6 each side of Friends Lane, 35 m frontage. side -1 = west side (door faces east), +1 = east side (door faces west)
    plots: [],
    zoo: { x0: -650, z0: -290, x1: -448, z1: -16, gate: [-548, -14] },
    air: { x0: -650, z0: 12, x1: -308, z1: 204, runway: { x0: -640, x1: -326, z: 152, w: 24 }, taxiZ: 124, apron: [-600, 72, -330, 112], terminal: [-548, 44, -434, 70], tower: [-424, 50], hangars: [[-632, 40, -598, 96], [-590, 40, -556, 96]] },
  };
  for (let i = 0; i < 6; i++) for (const side of [-1, 1]) {
    const z1 = -10 - i * 36, z0 = z1 - 34;
    P.west.plots.push({ side, x0: side < 0 ? -430 : -364, x1: side < 0 ? -380 : -310, z0, z1, i: i * 2 + (side > 0 ? 1 : 0) });
  }
  P.pools = [];

  // ---- helpers
  P.lot = (id) => P.lots.find((l) => l.id === id);
  P.nearestRoad = (x, z) => {
    let best = 1e9, bestE = 1e9, road = null, t = 0;
    for (const r of P.roads) {
      const ax = r.a[0], az = r.a[1], bx = r.b[0], bz = r.b[1], dx = bx - ax, dz = bz - az, L2 = dx * dx + dz * dz;
      const u = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L2));
      const d = Math.hypot(x - (ax + dx * u), z - (az + dz * u));
      if (d - r.w / 2 < bestE) { bestE = d - r.w / 2; best = d; road = r; t = u; }
    }
    return { d: best, road, t, edge: bestE };   // d = distance to that road's centreline, edge = distance past its asphalt edge (<0 = on it)
  };
  P.onRoad = (x, z) => P.nearestRoad(x, z).edge < 0;
  P.lotAt = (x, z) => P.lots.find((l) => x >= l.rect[0] && x < l.rect[2] && z >= l.rect[1] && z < l.rect[3]) || null;
  // spawn: Civic Plaza, south edge, looking north across the plaza to City Hall's dome (open ground ahead)
  P.spawn = { x: -28, y: 0.25, z: -16, yaw: Math.PI };
  P.views = [
    { name: 'Port Solace', pos: [-230, 150, 330], target: [20, 12, -30] },
    { name: 'Downtown', pos: [200, 70, 30], target: [70, 28, -80] },
    { name: 'Civic Plaza', pos: [-41, 20, 1], target: [-41, 12, -110] },
    { name: 'Theatre Row', pos: [12, 9, 190], target: [2, 7, 90] },
    { name: 'The Harbour', pos: [60, 35, 298], target: [0, 3, 195] },
    { name: 'Central Park', pos: [-40, 50, -140], target: [-40, 0, -235] },
    { name: 'Union Terminal', pos: [155, 26, 95], target: [215, 10, 40] },
    { name: 'Old Town', pos: [-160, 34, 95], target: [-205, 4, 40] },
    { name: 'New Friends Colony', pos: [-330, 40, 20], target: [-372, 2, -110] },
    { name: 'Solace Zoo', pos: [-440, 70, 30], target: [-550, 2, -150] },
    { name: 'Westgate Airfield', pos: [-360, 45, 230], target: [-480, 2, 130] },
    { name: 'Eastport \u00b7 Solace River', pos: [430, 45, 236], target: [385, 0, 60] },
  ];
  return P;
})();

} catch (e) { AF.partError('05-plan.js', e); }

