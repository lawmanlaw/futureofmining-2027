/* Future of Mining Summit 2027: exhibitors and venue.
   1. The three stand sizes in 3D. Scrolling through the section takes the 3 × 3 stand apart and builds
      the 6 × 6 in its place, then the 12 × 12 outdoor plot, where a haul truck drives in. Real soft
      shadows, a studio light for reflections, and the scene only renders when something changes.
   2. A floor plan of Ditshupo Hall and the outdoor ground where exhibitors pick their exact spot.
   3. A drawn map of the Fairgrounds that tilts into 3D, with the halls, parking, gates and truck route. */
(function () {
  'use strict';
  const C = window.FOM, T = window.THREE, U = window.FOMUtil;
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  const BOOTHS = C.booths, byId = id => BOOTHS.find(b => b.id === id);
  let brand = '', picked = null;

  /* ================= 1. the stands, changing as you scroll ================= */
  const pinEl = $('#stallPin'), host = $('#stallGl'), panelsEl = $('#stallPanels'), stepsEl = $('#stallSteps');
  panelsEl.innerHTML = BOOTHS.map((b, i) => `<article class="stall-panel${i ? '' : ' on'}" data-i="${i}"${i ? ' inert' : ''}>
      <p class="eyebrow">${String(i + 1).padStart(2, '0')} / 03 · ${esc(b.zone)}</p>
      <h3 class="stall-size">${b.dims[0]} × ${b.dims[1]}<small>m</small></h3>
      <p class="stall-name">${esc(b.name)}. <span>${esc(b.blurb)}</span></p>
      <p class="stall-price">${U.fmt(b.price)}<small>VAT included, ${b.passes} exhibitor passes</small></p>
      <ul class="stall-inc">${b.includes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <button class="btn btn-gold" type="button" data-book="${b.id}"></button>
    </article>`).join('');
  stepsEl.innerHTML = BOOTHS.map((b, i) => `<li class="${i ? '' : 'on'}"><b>${b.dims[0]} × ${b.dims[1]}</b><span>${b.dims[0] === 12 ? 'Outdoor ground' : 'Ditshupo Hall'}</span></li>`).join('');
  let activeI = -1;
  function setActive(i) {
    if (i === activeI) return; activeI = i;
    $$('.stall-panel', panelsEl).forEach((el, k) => { el.classList.toggle('on', k === i); el.inert = k !== i; });
    $$('li', stepsEl).forEach((el, k) => { el.classList.toggle('on', k === i); el.classList.toggle('done', k < i); });
  }
  function syncBook() {
    $$('[data-book]', panelsEl).forEach(btn => { const b = byId(btn.dataset.book); btn.textContent = picked && picked.type === b.id ? `Book stand ${picked.no}` : `Book a ${b.dims[0]} × ${b.dims[1]} stand`; });
  }
  panelsEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-book]'); if (!btn) return;
    const id = btn.dataset.book; window.FOMReg.open({ passId: id, stand: picked && picked.type === id ? picked.no : null });
  });
  syncBook(); setActive(0);

  // scroll position through the pinned section, 0 to 1
  let prog = 0, stage = null;
  const readProg = () => { const r = pinEl.getBoundingClientRect(); return clamp(-r.top / Math.max(1, r.height - innerHeight)); };
  let pq = 0;
  const onScroll = () => { if (pq) return; pq = requestAnimationFrame(() => { pq = 0; prog = readProg(); setActive(prog < 0.37 ? 0 : prog < 0.7 ? 1 : 2); if (stage) stage.set(prog); }); };
  addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();

  /* text textures for the fascia boards and the brand graphics */
  function textTexture(text, opt) {
    const c = document.createElement('canvas'); c.width = opt.w; c.height = opt.h;
    const x = c.getContext('2d');
    x.fillStyle = opt.bg; x.fillRect(0, 0, c.width, c.height);
    if (opt.bar) { x.fillStyle = '#E3B820'; x.fillRect(0, c.height - opt.bar, c.width, opt.bar); }
    x.fillStyle = opt.ink; x.textAlign = 'center'; x.textBaseline = 'middle';
    let size = opt.size; const t = (text || 'Your company').toUpperCase();
    do { x.font = `800 ${size}px "Archivo Expanded", "Mona Sans", sans-serif`; size -= 4; } while (x.measureText(t).width > c.width * 0.86 && size > 18);
    x.fillText(t, c.width / 2, c.height / 2 - (opt.bar || 0) / 2 - (opt.sub ? c.height * 0.06 : 0));
    if (opt.sub) { x.font = `600 ${Math.round(opt.size * 0.3)}px "Mona Sans", sans-serif`; x.globalAlpha = 0.75; x.fillText(opt.sub, c.width / 2, c.height * 0.74); }
    const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 8; return tex;
  }

  let MAT = null;
  const shirts = new Map();
  function materials() {
    const std = (color, r = 0.8, m = 0, extra = {}) => new T.MeshStandardMaterial(Object.assign({ color, roughness: r, metalness: m }, extra));
    MAT = {
      wall: std(0xf7f4ed, 0.92), alu: std(0xd9dde2, 0.26, 0.9), carpet: std(0x3a3e48, 1), carpetBlue: std(0x25408a, 0.95), gold: std(0xe3b820, 0.3, 0.8),
      gloss: std(0x151517, 0.2, 0.1), black: std(0x252528, 0.55), white: std(0xfcfbf7, 0.5), pot: std(0xe9e3d5, 0.55), door: std(0xe6e0d2, 0.8),
      leaf: std(0x3d7a4a, 0.85, 0, { flatShading: true }), leaf2: std(0x5d9c5f, 0.85, 0, { flatShading: true }),
      gravel: std(0xdccb9f, 1), road: std(0xb7a275, 1), tent: std(0xfdfcf7, 0.85), tyre: std(0x1c1c1d, 0.92), hub: std(0xe3b820, 0.35, 0.7),
      truck: std(0xf2b705, 0.4, 0.15), glass: std(0x22324f, 0.08, 0.7), trouser: std(0x2b2d33, 0.85), blue: std(0x2b4ca3, 0.75), lamp: std(0xffffff, 0.3, 0, { emissive: 0xfff3c4, emissiveIntensity: 2 }),
      fascia: std(0xffffff, 0.6), graphic: std(0xffffff, 0.6), screen: std(0x000000, 0.25, 0, { emissive: 0xffffff, emissiveIntensity: 1 })
    };
    paintBrand();
  }
  function paintBrand() {
    const f = textTexture(brand, { w: 1024, h: 128, bg: '#ffffff', ink: '#141414', size: 76, bar: 10 });
    const g = textTexture(brand, { w: 1024, h: 600, bg: '#1d3784', ink: '#ffffff', size: 112, bar: 26, sub: 'Future of Mining Summit 2027' });
    if (MAT.fascia.map) MAT.fascia.map.dispose(); if (MAT.graphic.map) MAT.graphic.map.dispose();
    MAT.fascia.map = f; MAT.graphic.map = g; MAT.screen.emissiveMap = g;
    [MAT.fascia, MAT.graphic, MAT.screen].forEach(m => { m.needsUpdate = true; });
  }

  /* ---------- the models (metres) ---------- */
  function build(b) {
    const G = new T.Group(), W = b.dims[0];
    const add = (o, parent = G) => { o.traverse(c => { if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; } }); parent.add(o); return o; };
    const box = (w, h, d, m, x, y, z, ry = 0, parent) => { const o = new T.Mesh(new T.BoxGeometry(w, h, d), m); o.position.set(x, y + h / 2, z); o.rotation.y = ry; return add(o, parent); };
    const cyl = (rt, rb, h, m, x, y, z, seg = 24, parent) => { const o = new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y + h / 2, z); return add(o, parent); };
    const rbox = (w, h, d, rad, m, x, y, z, ry = 0, parent) => {
      const sh = new T.Shape(), hw = w / 2 - rad, hd = d / 2 - rad;
      sh.moveTo(-hw, -d / 2); sh.lineTo(hw, -d / 2); sh.quadraticCurveTo(w / 2, -d / 2, w / 2, -hd); sh.lineTo(w / 2, hd); sh.quadraticCurveTo(w / 2, d / 2, hw, d / 2);
      sh.lineTo(-hw, d / 2); sh.quadraticCurveTo(-w / 2, d / 2, -w / 2, hd); sh.lineTo(-w / 2, -hd); sh.quadraticCurveTo(-w / 2, -d / 2, -hw, -d / 2);
      const bv = Math.min(0.025, h / 4);
      const g = new T.ExtrudeGeometry(sh, { depth: Math.max(0.001, h - bv * 2), bevelEnabled: true, bevelThickness: bv, bevelSize: bv * 0.8, bevelSegments: 2, curveSegments: 6 });
      g.rotateX(-Math.PI / 2); g.translate(0, bv, 0);
      const o = new T.Mesh(g, m); o.position.set(x, y, z); o.rotation.y = ry; return add(o, parent);
    };
    const group = (x, z, ry = 0) => { const g = new T.Group(); g.position.set(x, 0, z); g.rotation.y = ry; return g; };
    const shirt = c => { if (!shirts.has(c)) shirts.set(c, new T.MeshStandardMaterial({ color: c, roughness: 0.8 })); return shirts.get(c); };
    const SKIN = [0x5a3a26, 0x7a4e33, 0x3f2a1c, 0x8d5f41].map(c => new T.MeshStandardMaterial({ color: c, roughness: 0.6 }));
    const person = (x, z, ry, c, i = 0) => {
      const g = group(x, z, ry);
      const legs = new T.Mesh(new T.CapsuleGeometry(0.13, 0.62, 4, 10), MAT.trouser); legs.position.y = 0.44; legs.scale.x = 1.3;
      const torso = new T.Mesh(new T.CapsuleGeometry(0.2, 0.36, 4, 12), shirt(c)); torso.position.y = 1.12; torso.scale.z = 0.72;
      const head = new T.Mesh(new T.SphereGeometry(0.115, 18, 14), SKIN[i % 4]); head.position.y = 1.6;
      g.add(legs, torso, head); return add(g);
    };
    const chair = (x, z, ry, m = MAT.black) => {
      const g = group(x, z, ry);
      rbox(0.46, 0.06, 0.46, 0.06, m, 0, 0.44, 0, 0, g); rbox(0.46, 0.42, 0.05, 0.02, m, 0, 0.5, -0.21, 0, g);
      [[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].forEach(([a, c]) => cyl(0.014, 0.014, 0.44, MAT.alu, a, 0, c, 8, g));
      return add(g);
    };
    const roundTable = (x, z, rr = 0.42, ht = 0.74) => { const g = group(x, z); cyl(rr, rr, 0.04, MAT.white, 0, ht - 0.04, 0, 36, g); cyl(0.03, 0.03, ht - 0.04, MAT.alu, 0, 0, 0, 10, g); cyl(0.22, 0.25, 0.03, MAT.alu, 0, 0, 0, 24, g); return add(g); };
    const desk = (x, z, w = 1.1, d = 0.6) => { const g = group(x, z); rbox(w, 0.04, d, 0.03, MAT.white, 0, 0.72, 0, 0, g); [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, c]) => box(0.035, 0.72, 0.035, MAT.alu, a * (w / 2 - 0.05), 0, c * (d / 2 - 0.05), 0, g)); return add(g); };
    const plant = (x, z, s = 1) => {
      const g = group(x, z); cyl(0.2, 0.15, 0.42, MAT.pot, 0, 0, 0, 20, g);
      [[0, 0.8, 0, 0.34, MAT.leaf], [0.16, 0.64, 0.1, 0.24, MAT.leaf2], [-0.14, 0.68, -0.09, 0.26, MAT.leaf2], [0.04, 1.04, -0.05, 0.22, MAT.leaf]].forEach(([a, y, c, rr, m]) => { const l = new T.Mesh(new T.IcosahedronGeometry(rr, 0), m); l.position.set(a, y, c); l.rotation.set(a * 3, c * 5, y); g.add(l); });
      g.scale.setScalar(s); return add(g);
    };
    const spot = (x, z, y, ry) => { const g = group(x, z, ry); g.position.y = y; box(0.02, 0.02, 0.36, MAT.black, 0, 0, 0.18, 0, g); const h = cyl(0.045, 0.07, 0.15, MAT.black, 0, -0.12, 0.36, 12, g); h.rotation.x = 0.6; return add(g); };
    // a run of shell-scheme panels with aluminium posts and a top rail
    const wallRun = (len, alongX, x0, z0, h = 2.5) => {
      const g = group(x0, z0), n = Math.round(len), seg = len / n;
      for (let i = 0; i < n; i++) { const c = -len / 2 + (i + 0.5) * seg; alongX ? box(seg - 0.05, h - 0.1, 0.035, MAT.wall, c, 0.05, 0, 0, g) : box(0.035, h - 0.1, seg - 0.05, MAT.wall, 0, 0.05, c, 0, g); }
      for (let i = 0; i <= n; i++) { const c = -len / 2 + i * seg; alongX ? cyl(0.025, 0.025, h, MAT.alu, c, 0, 0, 8, g) : cyl(0.025, 0.025, h, MAT.alu, 0, 0, c, 8, g); }
      alongX ? box(len, 0.05, 0.05, MAT.alu, 0, h - 0.05, 0, 0, g) : box(0.05, 0.05, len, MAT.alu, 0, h - 0.05, 0, 0, g);
      return add(g);
    };
    const fascia = (len, x, z, ry, top = 2.5, hh = 0.32) => { const g = group(x, z, ry); box(len, hh, 0.04, [MAT.wall, MAT.wall, MAT.wall, MAT.wall, MAT.fascia, MAT.wall], 0, top - hh, 0, 0, g); return add(g); };
    const counter = (x, z, ry = 0, w = 1.9) => { const g = group(x, z, ry); rbox(w, 1.0, 0.62, 0.08, MAT.gloss, 0, 0, 0, 0, g); rbox(w + 0.08, 0.05, 0.7, 0.03, MAT.gold, 0, 1.0, 0, 0, g); return add(g); };
    let truck = null, wheels = [];

    if (W === 3) {
      box(3, 0.04, 3, MAT.carpet, 0, 0, 0);
      wallRun(3, true, 0, -1.5); wallRun(3, false, -1.5, 0); wallRun(3, false, 1.5, 0);
      fascia(3, 0, 1.5, 0);
      box(2.1, 1.05, 0.02, MAT.graphic, 0, 0.95, -1.47);
      desk(0.35, 0.05); chair(0.05, 0.58, Math.PI); chair(0.68, 0.58, Math.PI);
      const rack = group(-1.12, -1.08); box(0.34, 1.35, 0.04, MAT.alu, 0, 0, 0, 0, rack); [0.35, 0.7, 1.05].forEach(y => { const sh = box(0.32, 0.02, 0.14, MAT.alu, 0, y, 0.07, 0, rack); sh.rotation.x = -0.25; }); add(rack);
      plant(1.12, -1.1, 0.9);
      spot(-0.8, 1.5, 2.42, Math.PI); spot(0.8, 1.5, 2.42, Math.PI);
      person(0.4, -0.45, 0.2, 0xe3b820, 1); person(-0.55, 2.25, Math.PI * 0.95, 0x2b4ca3, 0);
    } else if (W === 6) {
      box(6, 0.05, 6, MAT.carpetBlue, 0, 0, 0);
      box(6, 0.02, 0.1, MAT.gold, 0, 0.05, 2.95); box(0.1, 0.02, 6, MAT.gold, 2.95, 0.05, 0);
      wallRun(6, true, 0, -3); wallRun(6, false, -3, 0);
      fascia(6, 0, 3, 0, 2.6, 0.4); fascia(6, 3, 0, Math.PI / 2, 2.6, 0.4);
      const posts = group(0, 0); [[3, 3], [3, -3], [-3, 3]].forEach(([a, c]) => cyl(0.04, 0.04, 2.6, MAT.alu, a, 0, c, 10, posts)); add(posts);
      const room = group(-2.25, -2.25); box(1.5, 2.4, 0.04, MAT.wall, 0, 0.05, 0.75, 0, room); box(0.04, 2.4, 1.5, MAT.wall, 0.75, 0.05, 0, 0, room);
      box(0.8, 2.0, 0.05, MAT.door, 0.15, 0.05, 0.77, 0, room); box(0.04, 0.16, 0.04, MAT.gold, 0.45, 1.0, 0.81, 0, room); add(room);
      box(3.4, 1.7, 0.02, MAT.graphic, 0.9, 0.8, -2.96);
      const tv = group(-2.95, 0.7, Math.PI / 2); tv.position.y = 1.1; rbox(1.4, 0.8, 0.06, 0.02, MAT.gloss, 0, 0, 0, 0, tv); const scr = new T.Mesh(new T.PlaneGeometry(1.32, 0.72), MAT.screen); scr.position.set(0, 0.4, 0.036); tv.add(scr); add(tv);
      counter(1.45, 1.95);
      roundTable(-1.2, 1.2); chair(-1.2, 0.6, 0); chair(-0.6, 1.45, -Math.PI / 2); chair(-1.8, 1.45, Math.PI / 2);
      const ht = group(1.2, -0.9); cyl(0.32, 0.32, 0.04, MAT.white, 0, 1.06, 0, 28, ht); cyl(0.03, 0.03, 1.06, MAT.alu, 0, 0, 0, 10, ht); cyl(0.2, 0.22, 0.03, MAT.alu, 0, 0, 0, 24, ht); add(ht);
      plant(2.55, -2.5, 1.1); plant(-2.5, 2.5, 0.95);
      [-2.1, -0.7, 0.7, 2.1].forEach(v => spot(v, 3, 2.52, Math.PI)); [-2.1, -0.7, 0.7, 2.1].forEach(v => spot(3, v, 2.52, -Math.PI / 2));
      person(1.45, 1.3, Math.PI, 0x1f1e1a, 0); person(0.95, 3.7, Math.PI * 0.9, 0x2b4ca3, 1); person(-0.55, 3.85, Math.PI * 1.1, 0xe3b820, 2); person(0.85, -0.35, 0.5, 0xfbfaf6, 3);
    } else {
      box(12, 0.06, 12, MAT.gravel, 0, 0, 0);
      box(30, 0.03, 4, MAT.road, -21, 0, 3.0);                               // the truck road, from beyond the plot
      box(6, 0.07, 4, MAT.road, -3, 0, 3.0);
      const fence = group(0, 0);
      for (let v = -6; v <= 6; v += 3) { box(0.1, 0.9, 0.1, MAT.gold, v, 0, -6, 0, fence); box(0.1, 0.9, 0.1, MAT.gold, v, 0, 6, 0, fence); box(0.1, 0.9, 0.1, MAT.gold, 6, 0, v, 0, fence); if (v < 0.5 || v > 5.5) box(0.1, 0.9, 0.1, MAT.gold, -6, 0, v, 0, fence); }
      box(12, 0.03, 0.03, MAT.gold, 0, 0.82, -6, 0, fence); box(12, 0.03, 0.03, MAT.gold, 0, 0.82, 6, 0, fence); box(0.03, 0.03, 12, MAT.gold, 6, 0.82, 0, 0, fence); box(0.03, 0.03, 6.5, MAT.gold, -6, 0.82, -2.75, 0, fence);
      add(fence);
      const mq = group(-2.6, -2.6);
      [[-3, -3], [3, -3], [-3, 3], [3, 3]].forEach(([a, c]) => cyl(0.05, 0.05, 2.6, MAT.alu, a, 0, c, 10, mq));
      const tri = new T.Shape(); tri.moveTo(-3.2, 0); tri.lineTo(3.2, 0); tri.lineTo(0, 1.5); tri.lineTo(-3.2, 0);
      const rg = new T.ExtrudeGeometry(tri, { depth: 6.4, bevelEnabled: false }); rg.translate(0, 0, -3.2);
      const roof = new T.Mesh(rg, MAT.tent); roof.position.y = 2.6; mq.add(roof);
      box(6, 2.6, 0.04, MAT.tent, 0, 0, -3, 0, mq);
      box(6.4, 0.42, 0.04, [MAT.tent, MAT.tent, MAT.tent, MAT.tent, MAT.fascia, MAT.tent], 0, 2.2, 3.03, 0, mq);
      add(mq);
      counter(-1.4, -0.4, 0, 1.7);
      const sofa = group(-4.0, -3.6); rbox(1.7, 0.42, 0.8, 0.1, MAT.blue, 0, 0, 0, 0, sofa); rbox(1.7, 0.42, 0.2, 0.08, MAT.blue, 0, 0.42, -0.3, 0, sofa); add(sofa);
      roundTable(-4.0, -2.4, 0.38, 0.45); plant(-0.4, -5.1, 1.2);
      const flags = group(-5.2, 5.2);
      [[0, 0, MAT.gold], [1.2, 0, MAT.blue], [2.4, 0, MAT.gold]].forEach(([a, c, m]) => {
        cyl(0.025, 0.025, 4.2, MAT.alu, a, 0, c, 8, flags);
        const fs = new T.Shape(); fs.moveTo(0, 0); fs.lineTo(0, 3.1); fs.quadraticCurveTo(0.95, 3.25, 0.8, 2.1); fs.lineTo(0.55, 0); fs.lineTo(0, 0);
        const fl = new T.Mesh(new T.ExtrudeGeometry(fs, { depth: 0.02, bevelEnabled: false }), m); fl.position.set(a + 0.03, 1.0, c); fl.rotation.y = -0.5; flags.add(fl);
      });
      add(flags);
      const sign = group(4.4, -4.6, -0.3); box(0.08, 1.2, 0.08, MAT.alu, -1.0, 0, 0, 0, sign); box(0.08, 1.2, 0.08, MAT.alu, 1.0, 0, 0, 0, sign);
      box(2.4, 1.4, 0.08, [MAT.white, MAT.white, MAT.white, MAT.white, MAT.graphic, MAT.white], 0, 1.2, 0, 0, sign); add(sign);
      box(0.3, 0.5, 0.3, MAT.black, 5.4, 0, -5.4);
      person(-1.4, 0.35, Math.PI, 0x1f1e1a, 0); person(0.4, 0.9, -0.6, 0x2b4ca3, 1); person(1.0, 0.6, 0.4, 0xe3b820, 2); person(-3.4, -1.6, 2.6, 0xfbfaf6, 3);
      // the haul truck, which drives in along the road
      truck = new T.Group();
      const tb = (w, h, d, m, x, y, z) => box(w, h, d, m, x, y, z, 0, truck);
      tb(5.6, 0.45, 2.0, MAT.black, 0, 0.8, 0);
      const prof = new T.Shape(); prof.moveTo(-2.9, 0); prof.lineTo(1.05, 0); prof.lineTo(1.4, 1.6); prof.lineTo(-3.05, 1.6); prof.lineTo(-3.25, 0.55); prof.lineTo(-2.9, 0);
      const bg = new T.ExtrudeGeometry(prof, { depth: 2.7, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 1 }); bg.translate(0, 0, -1.35);
      const bed = new T.Mesh(bg, MAT.truck); bed.position.set(0, 1.25, 0); bed.castShadow = bed.receiveShadow = true; truck.add(bed);
      rbox(1.5, 1.35, 2.3, 0.12, MAT.truck, 2.15, 1.25, 0, 0, truck);
      tb(0.04, 0.55, 1.9, MAT.glass, 2.92, 1.85, 0); tb(1.15, 0.5, 0.04, MAT.glass, 2.15, 1.88, 1.17); tb(1.15, 0.5, 0.04, MAT.glass, 2.15, 1.88, -1.17);
      tb(0.16, 0.32, 2.4, MAT.black, 3.0, 0.72, 0);
      tb(0.05, 0.14, 0.32, MAT.lamp, 3.09, 0.98, 0.8); tb(0.05, 0.14, 0.32, MAT.lamp, 3.09, 0.98, -0.8);
      [[2.15, 1.27], [2.15, -1.27], [-1.35, 1.27], [-1.35, -1.27], [-2.5, 1.27], [-2.5, -1.27]].forEach(([x, z]) => {
        const rr = 0.78, p = new T.Group();
        const tyre = new T.Mesh(new T.CylinderGeometry(rr, rr, 0.56, 32), MAT.tyre); tyre.rotation.x = Math.PI / 2;
        const hub = new T.Mesh(new T.CylinderGeometry(rr * 0.45, rr * 0.45, 0.6, 18), MAT.hub); hub.rotation.x = Math.PI / 2;
        p.add(tyre, hub); p.position.set(x, rr, z); p.traverse(c => { if (c.isMesh) c.castShadow = true; }); truck.add(p); wheels.push(p);
      });
      truck.position.set(1.7, 0.03, 3.0); truck.userData.x = 1.7; G.add(truck);
    }
    G.userData.kids = G.children.filter(c => c !== truck);
    G.userData.kids.forEach(o => { o.userData.y = o.position.y; o.userData.s = o.scale.x; });
    G.userData.truck = truck; G.userData.wheels = wheels;
    return G;
  }

  /* ---------- the stage ---------- */
  function Stage(host) {
    const mobile = matchMedia('(max-width: 700px)').matches;
    const r = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(devicePixelRatio || 1, mobile ? 1.5 : 1.75));
    r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.02;
    r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
    host.appendChild(r.domElement);
    const s = new T.Scene();
    // a soft studio for reflections: warm floor, bright sky and one large softbox
    const pm = new T.PMREMGenerator(r), env = new T.Scene();
    env.add(new T.Mesh(new T.SphereGeometry(20, 32, 16), new T.ShaderMaterial({ side: T.BackSide,
      vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'varying vec3 vP; void main(){ float h = vP.y * .5 + .5; gl_FragColor = vec4(mix(vec3(.4,.38,.34), vec3(1.,.98,.94), smoothstep(.15,.85,h)), 1.); }' })));
    const soft = new T.Mesh(new T.PlaneGeometry(14, 6), new T.MeshBasicMaterial({ color: new T.Color(3.5, 3.4, 3.2), side: T.DoubleSide })); soft.position.set(8, 12, 6); soft.lookAt(0, 0, 0); env.add(soft);
    s.environment = pm.fromScene(env, 0.03).texture; pm.dispose();
    s.add(new T.HemisphereLight(0xffffff, 0xb8ae9a, 0.75));
    const sun = new T.DirectionalLight(0xfff4e2, 2.4); sun.position.set(9, 18, 7); sun.castShadow = true;
    sun.shadow.mapSize.set(mobile ? 1024 : 2048, mobile ? 1024 : 2048);
    Object.assign(sun.shadow.camera, { left: -15, right: 15, top: 15, bottom: -15, near: 1, far: 60 });
    sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025;
    s.add(sun);
    const ground = new T.Mesh(new T.PlaneGeometry(140, 140), new T.ShadowMaterial({ opacity: 0.17 })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.001; ground.receiveShadow = true; s.add(ground);
    const cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 300);
    const groups = BOOTHS.map(build); groups.forEach(g => s.add(g));
    let w = 1, h = 1, drag = null, dragYaw = 0, dirty = true, vis = false, running = false;
    this.intro = reduced ? 1 : 0;

    const view = () => {
      const f = lerp(lerp(7.4, 12.6, ss(0.3, 0.44, prog)), 23.5, ss(0.63, 0.77, prog));
      const a = w / h, fh = a < 1.05 ? f * (1.05 / a) * 0.92 : f;
      Object.assign(cam, { left: -fh * a / 2, right: fh * a / 2, top: fh / 2, bottom: -fh / 2 }); cam.updateProjectionMatrix();
      const ang = -0.8 + dragYaw + prog * 0.32, R = 60;
      cam.position.set(Math.sin(ang) * R, R * 0.74, Math.cos(ang) * R);
      cam.lookAt(0, lerp(lerp(1.05, 1.3, ss(0.3, 0.44, prog)), 1.4, ss(0.63, 0.77, prog)), 0);
    };
    // each part drops into place in order; going back up takes the stand apart in reverse
    const apply = (g, k) => {
      g.visible = k > 0.001; if (!g.visible) return;
      const kids = g.userData.kids, n = kids.length;
      kids.forEach((o, j) => {
        const t = clamp((k - (j / n) * 0.55) / 0.45), e = 1 - Math.pow(1 - t, 3);
        o.visible = t > 0.001;
        o.position.y = o.userData.y + (1 - e) * 3.4;
        o.scale.setScalar(o.userData.s * (0.55 + 0.45 * e));
      });
    };
    this.set = p => {
      const k0 = this.intro * (1 - ss(0.3, 0.42, p)), k1 = ss(0.31, 0.44, p) * (1 - ss(0.63, 0.75, p)), k2 = ss(0.64, 0.77, p);
      apply(groups[0], k0); apply(groups[1], k1); apply(groups[2], k2);
      const tr = groups[2].userData.truck;
      if (tr) {
        const drive = ss(0.76, 0.93, p), dx = -(1 - drive) * 27;
        tr.visible = k2 > 0.6 && drive > 0.001;
        tr.position.x = tr.userData.x + dx;
        groups[2].userData.wheels.forEach(wh => { wh.rotation.z = -dx / 0.78; });
      }
      view(); dirty = true; go();
    };
    const resize = () => { w = host.clientWidth; h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); view(); dirty = true; go(); };
    new ResizeObserver(resize).observe(host); resize();
    new IntersectionObserver(e => {
      vis = e[0].isIntersecting; if (!vis) return; go();
      if (this.intro < 1 && window.gsap) window.gsap.to(this, { intro: 1, duration: 1.8, ease: 'power2.out', onUpdate: () => this.set(prog) });
      else if (this.intro < 1) { this.intro = 1; this.set(prog); }
    }, { threshold: 0.2 }).observe(host);
    host.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: dragYaw }; host.setPointerCapture(e.pointerId); });
    host.addEventListener('pointermove', e => { if (!drag) return; dragYaw = clamp(drag.y + (e.clientX - drag.x) * 0.006, -1.1, 1.1); view(); dirty = true; go(); });
    const up = () => { drag = null; };
    host.addEventListener('pointerup', up); host.addEventListener('pointercancel', up);
    function go() { if (!running && vis) { running = true; requestAnimationFrame(frame); } }
    function frame() {
      if (!vis || document.hidden) { running = false; return; }
      if (dirty) { r.render(s, cam); dirty = false; }
      running = false;                                           // render on demand: nothing runs while nothing changes
    }
    this.touch = () => { dirty = true; go(); };
    this.set(prog);
  }

  let bt = 0;
  $('#stallBrand').addEventListener('input', e => {
    brand = e.target.value.trim(); clearTimeout(bt);
    bt = setTimeout(() => { if (!MAT) return; paintBrand(); if (stage) stage.touch(); }, 220);
  });

  // build the scene only when the section comes near
  if (T && host) {
    const io = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return; io.disconnect();
      const start = () => {
        try { materials(); stage = new Stage(host); stage.set(prog); }
        catch (err) { console.warn(err); pinEl.classList.add('stall-static'); }
      };
      document.fonts && document.fonts.load ? document.fonts.load('800 40px "Archivo Expanded"').then(start, start) : start();
    }, { rootMargin: '600px 0px' });
    io.observe(host);
  } else if (pinEl) pinEl.classList.add('stall-static');

  /* ================= 2. hand-pick your spot ================= */
  const rnd = s => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return ((h >>> 0) % 1000) / 1000; };
  const stands = [];
  let n = 0, p = 0, o = 0;
  const add3 = (x, y, where) => { const no = 'D-' + String(++n).padStart(2, '0'); stands.push({ no, type: 'stand-3', area: 'hall', x, y, w: 3, h: 3, where }); };
  // Ditshupo Hall, 60 m by 36 m (sample layout)
  for (let x = 4; x <= 53; x += 3) if (!(x >= 19 && x < 25) && !(x >= 37 && x < 43)) add3(x, 1, 'on the north wall');
  [8, 20].forEach(y => {
    for (let r = 0; r < 2; r++) for (let c = 0; c < 6; c++) add3(5 + c * 3, y + r * 3, 'in the west island');
    for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) add3(44 + c * 3, y + r * 3, 'in the east island');
    [26, 35].forEach(x => stands.push({ no: 'P-' + String(++p).padStart(2, '0'), type: 'stand-6', area: 'hall', x, y, w: 6, h: 6, where: 'on the main aisle' }));
  });
  for (let x = 4; x <= 53; x += 3) if (!(x >= 25 && x < 34)) add3(x, 32, 'beside the main entrance');
  // outdoor ground, 8 plots of 12 m by 12 m along the truck road
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) stands.push({ no: 'O-' + String(++o).padStart(2, '0'), type: 'stand-12', area: 'out', x: 3 + c * 14, y: 3 + r * 16, w: 12, h: 12, where: r ? 'on the truck road' : 'facing Ditshupo Hall' });
  stands.forEach(s => { s.taken = rnd(s.no + '27') < (s.type === 'stand-6' ? 0.5 : 0.38); });

  const S = 10, mapEl = $('#floorMap');
  const svgHall = () => `<svg viewBox="-12 -26 624 412" class="fp" aria-label="Ditshupo Hall floor plan">
      <rect x="0" y="0" width="600" height="360" rx="6" class="fp-hall"/>
      <text x="0" y="-10" class="fp-t">Ditshupo Hall</text>
      <rect x="190" y="-6" width="60" height="12" class="fp-door"/><rect x="370" y="-6" width="60" height="12" class="fp-door"/>
      <text x="220" y="-12" class="fp-s" text-anchor="middle">Loading door</text><text x="400" y="-12" class="fp-s" text-anchor="middle">Loading door</text>
      <rect x="255" y="354" width="90" height="12" class="fp-gate"/><text x="300" y="384" class="fp-s" text-anchor="middle">Main entrance, from Parking lot 2</text>
      ${stands.filter(s => s.area === 'hall').map(st).join('')}</svg>`;
  const svgOut = () => `<svg viewBox="-12 -26 624 412" class="fp" aria-label="Outdoor exhibition ground plan">
      <rect x="0" y="0" width="600" height="320" rx="6" class="fp-ground"/>
      <text x="0" y="-10" class="fp-t">Outdoor exhibition ground</text>
      <path d="M-12 172 H612" class="fp-road"/><text x="300" y="350" class="fp-s" text-anchor="middle">Heavy vehicles enter from the south service gate</text>
      <path d="M560 172 h40 m-14 -10 l14 10 -14 10" class="fp-arrow"/>
      ${stands.filter(s => s.area === 'out').map(st).join('')}</svg>`;
  function st(s) {
    return `<g class="st ${s.taken ? 'taken' : ''} ${s.type}" data-no="${s.no}" ${s.taken ? '' : 'tabindex="0" role="button"'} aria-label="Stand ${s.no}, ${byId(s.type).size}, ${s.taken ? 'taken' : 'available'}">
      <rect x="${s.x * S + 1}" y="${s.y * S + 1}" width="${s.w * S - 2}" height="${s.h * S - 2}" rx="2"/>
      ${s.w >= 6 ? `<text x="${(s.x + s.w / 2) * S}" y="${(s.y + s.h / 2) * S + 4}" text-anchor="middle">${s.no}</text>` : ''}<title>${s.no}${s.taken ? ' (taken)' : ''}</title></g>`;
  }
  let area = 'hall';
  const filter = $('#floorFilter');
  filter.innerHTML = `<button type="button" data-a="hall" aria-pressed="true">Ditshupo Hall</button><button type="button" data-a="out" aria-pressed="false">Outdoor ground</button>
    <span class="legend"><i class="lg-free"></i>Available <i class="lg-taken"></i>Taken <i class="lg-pick"></i>Your pick</span>`;
  function floorArea(a) {
    area = a; mapEl.innerHTML = a === 'hall' ? svgHall() : svgOut();
    $$('[data-a]', filter).forEach(b => b.setAttribute('aria-pressed', b.dataset.a === a));
    if (picked) { const g = $(`[data-no="${picked.no}"]`, mapEl); if (g) g.classList.add('pick'); }
    pickPanel();
  }
  filter.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b) floorArea(b.dataset.a); });
  function choose(g) {
    const s = stands.find(x => x.no === g.dataset.no); if (!s || s.taken) return;
    $$('.st.pick', mapEl).forEach(x => x.classList.remove('pick')); g.classList.add('pick');
    picked = s; syncBook(); pickPanel();
  }
  mapEl.addEventListener('click', e => { const g = e.target.closest('.st'); if (g) choose(g); });
  mapEl.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && e.target.closest('.st')) { e.preventDefault(); choose(e.target.closest('.st')); } });
  function pickPanel() {
    const box = $('#floorPick'), free = stands.filter(s => s.area === area && !s.taken).length;
    if (!picked) { box.innerHTML = `<p class="fp-big">${free}</p><p>stands still free ${area === 'hall' ? 'in Ditshupo Hall' : 'on the outdoor ground'}. Tap a blue stand to hold it while you book.</p>`; return; }
    const b = byId(picked.type);
    box.innerHTML = `<p class="fp-label">Your pick</p><p class="fp-big">${picked.no}</p>
      <p>${b.name}, ${b.size}, ${picked.where}${picked.area === 'hall' ? ' of Ditshupo Hall' : ''}.</p>
      <p class="fp-price">${U.fmt(b.price)}</p>
      <button class="btn btn-gold" type="button" id="pickBook">Reserve ${picked.no}</button>`;
    $('#pickBook').addEventListener('click', () => window.FOMReg.open({ passId: b.id, stand: picked.no }));
  }
  floorArea('hall');

  /* ================= 3. the Fairgrounds map ================= */
  const oct = (cx, cy, r) => Array.from({ length: 8 }, (_, i) => { const a = Math.PI / 8 + i * Math.PI / 4; return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`; }).join(' ');
  const PLACES = [
    { id: 'boipuso', name: 'Boipuso Hall', role: 'Main event: plenary, panels, registration and badge collection in the foyer.', shape: 'poly', pts: '352,207 505,140 562,262 412,345', pin: [458, 243], kind: 'hall' },
    { id: 'ditshupo', name: 'Ditshupo Hall', role: 'Indoor exhibition: 3 × 3 m and 6 × 6 m stands.', shape: 'poly', pts: '598,470 765,378 842,500 690,592', pin: [720, 486], kind: 'hall' },
    { id: 'outdoor', name: 'Outdoor exhibition ground', role: 'Heavy machinery and 12 × 12 m plots, east of Ditshupo Hall.', shape: 'poly', pts: '772,262 937,236 937,430 862,470 800,372', pin: [868, 340], kind: 'ground' },
    { id: 'annex', name: 'Annex Hall', role: 'Side sessions and the media room (to be confirmed).', shape: 'oct', c: [512, 336, 33], pin: [512, 336], kind: 'hall' },
    { id: 'lot2', name: 'Parking lot 2', role: 'Free parking for delegates and exhibitors, two minutes from registration.', shape: 'poly', pts: '566,186 702,142 760,250 722,330 646,394 568,300', pin: [650, 262], kind: 'park' },
    { id: 'north', name: 'North car park', role: 'Speakers and guests of honour, off the main road.', shape: 'poly', pts: '396,28 520,10 562,94 432,120', pin: [478, 62], kind: 'park' },
    { id: 'gate', name: 'Main gate', role: 'Delegates arrive here from the main road.', shape: 'pin', pin: [664, 112], kind: 'gate' },
    { id: 'service', name: 'Service gate', role: 'Trucks and heavy vehicles only, from the south road.', shape: 'pin', pin: [452, 574], kind: 'truck' }
  ];
  const zone = pl => pl.shape === 'poly' ? `<polygon points="${pl.pts}"/>` : pl.shape === 'oct' ? `<polygon points="${oct(...pl.c)}"/>` : '';
  const lift = pl => pl.kind === 'hall' ? `<g class="mz-side" transform="translate(0 10)">${zone(pl)}</g>` : '';
  const Q = { boipuso: 'Boipuso Hall', ditshupo: 'Ditshupo Hall', outdoor: 'Ditshupo Hall', annex: 'Annex Hall', lot2: 'Boipuso Hall', north: 'Boipuso Hall', gate: 'Fairground Holdings', service: 'Fairground Holdings' };
  const gmap = $('#gmap'), gopen = $('#gmapOpen');
  $('#places').innerHTML = `<ol>${PLACES.map((pl, i) => `<li><button type="button" data-z="${pl.id}" aria-pressed="${i ? 'false' : 'true'}"><span class="pn vm-${pl.kind}">${i + 1}</span><span><b>${pl.name}</b>${pl.role}</span></button></li>`).join('')}</ol>`;
  $('#places').addEventListener('click', e => {
    const b = e.target.closest('[data-z]'); if (!b || !gmap) return;
    $$('#places [data-z]').forEach(x => x.setAttribute('aria-pressed', x === b));
    const q = encodeURIComponent(Q[b.dataset.z] + ', Fairground, Gaborone, Botswana');
    gmap.src = `https://www.google.com/maps?q=${q}&z=17&output=embed`;
    if (gopen) gopen.href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  });
})();
