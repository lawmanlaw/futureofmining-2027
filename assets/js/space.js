/* Future of Mining Summit 2027: the journey from space to Gaborone.
   A dotted Earth in summit blue and gold. As you scroll, the camera turns to Africa,
   the logo's network connects city by city, then everything converges on Botswana. */
(function () {
  'use strict';
  const G = window.FOM_GEO;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D2R = Math.PI / 180;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ss = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  function vec(lat, lon, r = 1) {
    const la = lat * D2R, lo = lon * D2R;
    return new THREE.Vector3(Math.cos(la) * Math.sin(lo) * r, Math.sin(la) * r, Math.cos(la) * Math.cos(lo) * r);
  }
  function decode(b64) {
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return new Int16Array(u8.buffer);
  }
  function gcDist(a, b) { // degrees
    const p1 = a.la * D2R, p2 = b.la * D2R, dl = (b.lo - a.lo) * D2R;
    return Math.acos(clamp(Math.sin(p1) * Math.sin(p2) + Math.cos(p1) * Math.cos(p2) * Math.cos(dl), -1, 1)) / D2R;
  }

  /* camera keyframes: [progress, lat facing, lon facing, distance, vertical screen shift] */
  const KEYS = [
    [0.00, 6, 4, 4.3, -0.30],
    [0.16, 4, 14, 3.9, -0.22],
    [0.34, 2, 19, 3.35, -0.06],
    [0.58, -6, 22, 2.65, 0.00],
    [0.80, -22.4, 24.6, 1.42, 0.16],
    [1.00, -23.4, 25.4, 1.3, 0.22]
  ];
  function camAt(p, t) {
    let i = 0; while (i < KEYS.length - 2 && p > KEYS[i + 1][0]) i++;
    const a = KEYS[i], b = KEYS[i + 1], k = ss(a[0], b[0], p);
    let lon = lerp(a[2], b[2], k);
    if (p < .16 && !reduced) lon += (1 - p / .16) * Math.sin(t * .05) * 6; // slow drift while waiting
    return { lat: lerp(a[1], b[1], k), lon, dist: lerp(a[3], b[3], k), shift: lerp(a[4], b[4], k) };
  }

  const dotVS = `
    uniform float uSize; uniform float uScale;
    attribute float aAlpha; varying float vA;
    void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0); vA = aAlpha;
      gl_PointSize = max(1.0, uSize * uScale / -mv.z); gl_Position = projectionMatrix * mv; }`;
  const dotFS = `
    uniform vec3 uColor; uniform float uOpacity; varying float vA;
    void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); if(d > .5) discard;
      float a = smoothstep(.5, .32, d) * uOpacity * vA; gl_FragColor = vec4(uColor, a); }`;

  class Journey {
    constructor(section) {
      this.sec = section;
      this.sticky = section.querySelector('.journey-sticky');
      this.host = section.querySelector('.journey-gl');
      this.scenes = Array.from(section.querySelectorAll('.scene'));
      this.words = Array.from(section.querySelectorAll('[data-word]'));
      this.stops = Array.from(section.querySelectorAll('[data-stop]'));
      this.labelBox = section.querySelector('.geo-labels');
      this.p = 0; this.pS = 0; this.t = 0; this.mx = 0; this.my = 0;
      this.gl = !!(window.THREE && G);
      try { if (this.gl) this.init(); } catch (e) { console.warn(e); this.gl = false; }
      if (!this.gl) section.classList.add('no-gl');
      this.bind();
      this.update(true);
    }
    init() {
      const T = THREE;
      const r = this.r = new T.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
      r.outputColorSpace = T.SRGBColorSpace;
      this.host.appendChild(r.domElement);
      const s = this.s = new T.Scene();
      const bgc = document.createElement('canvas'); bgc.width = bgc.height = 512;
      const bx = bgc.getContext('2d'), gr = bx.createRadialGradient(256, 300, 10, 256, 256, 380);
      gr.addColorStop(0, '#000000'); gr.addColorStop(1, '#000000');
      bx.fillStyle = gr; bx.fillRect(0, 0, 512, 512);
      const bg = new T.CanvasTexture(bgc); bg.colorSpace = T.SRGBColorSpace; s.background = bg;
      this.cam = new T.PerspectiveCamera(36, 1, .01, 400);

      // stars and nebula
      this.sky = new T.Group(); s.add(this.sky);
      const star = (n, rMin, rMax, size, col, op) => {
        const pos = new Float32Array(n * 3), al = new Float32Array(n);
        for (let i = 0; i < n; i++) {
          const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, rr = rMin + Math.random() * (rMax - rMin), q = Math.sqrt(1 - u * u);
          pos.set([rr * q * Math.cos(th), rr * u, rr * q * Math.sin(th)], i * 3); al[i] = .35 + Math.random() * .65;
        }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aAlpha', new T.BufferAttribute(al, 1));
        const m = new T.ShaderMaterial({ vertexShader: dotVS, fragmentShader: dotFS, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
          uniforms: { uSize: { value: size }, uScale: { value: 1 }, uColor: { value: new T.Color(col) }, uOpacity: { value: op } } });
        const pts = new T.Points(g, m); this.sky.add(pts); return m;
      };
      this.starMats = [star(900, 60, 140, .4, 0xffffff, .5), star(120, 40, 90, .5, 0xffe7a3, .4), star(60, 30, 70, .5, 0xffffff, .4)];
      const neb = (col, x, y, z, sc, op) => {
        const c = document.createElement('canvas'); c.width = c.height = 256; const x2 = c.getContext('2d');
        const g = x2.createRadialGradient(128, 128, 0, 128, 128, 128); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)');
        x2.fillStyle = g; x2.fillRect(0, 0, 256, 256);
        const sp = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: op }));
        sp.position.set(x, y, z); sp.scale.setScalar(sc); this.sky.add(sp);
      };
      void neb; // no nebula: the page keeps to flat black

      // the Earth
      const E = this.earth = new T.Group(); s.add(E);
      E.add(new T.Mesh(new T.SphereGeometry(.995, 96, 96), new T.MeshBasicMaterial({ color: 0x050505 })));
      const atmo = new T.ShaderMaterial({
        transparent: true, depthWrite: false, side: T.BackSide, blending: T.AdditiveBlending,
        uniforms: { uGold: { value: 0 } },
        vertexShader: 'varying vec3 vN; void main(){ vN = normalize(normalMatrix*normal); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform float uGold; varying vec3 vN; void main(){ float i = pow(clamp(.72 - dot(vN, vec3(0.,0.,1.)), 0., 1.), 2.6); vec3 c = mix(vec3(.6,.6,.62), vec3(1.,.82,.25), uGold); gl_FragColor = vec4(c, 1.)*i*.35; }'
      });
      this.atmo = atmo; this.atmoMesh = new T.Mesh(new T.SphereGeometry(1.16, 64, 64), atmo); s.add(this.atmoMesh);

      const layer = (b64, r, size, col, op) => {
        const a = decode(b64), n = a.length / 2, pos = new Float32Array(n * 3), al = new Float32Array(n);
        for (let i = 0; i < n; i++) { const v = vec(a[i * 2] / 100, a[i * 2 + 1] / 100, r); pos.set([v.x, v.y, v.z], i * 3); al[i] = .7 + Math.random() * .3; }
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aAlpha', new T.BufferAttribute(al, 1));
        const m = new T.ShaderMaterial({ vertexShader: dotVS, fragmentShader: dotFS, transparent: true, depthWrite: false,
          uniforms: { uSize: { value: size }, uScale: { value: 1 }, uColor: { value: new T.Color(col) }, uOpacity: { value: op } } });
        E.add(new T.Points(g, m)); return m;
      };
      this.mWorld = layer(G.world, 1.002, .015, 0x5c5c62, .9);
      this.mAfrica = layer(G.africa, 1.003, .0046, 0xe3b820, .55);
      this.mBots = layer(G.botswana, 1.004, .00145, 0xffe27a, 0);
      this.dotMats = [this.mWorld, this.mAfrica, this.mBots, ...this.starMats];

      const lines = (arr, r, col, op) => {
        const pts = [];
        arr.forEach(l => { for (let i = 0; i < l.length - 1; i++) { const a = vec(l[i][1], l[i][0], r), b = vec(l[i + 1][1], l[i + 1][0], r); pts.push(a.x, a.y, a.z, b.x, b.y, b.z); } });
        const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3));
        const m = new T.LineBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false });
        E.add(new T.LineSegments(g, m)); return m;
      };
      this.mBorders = lines(G.borders, 1.0035, 0xe3b820, 0);
      this.mCoast = lines(G.coast, 1.0035, 0xf6d85a, 0);
      this.mBwLine = lines([G.bwOutline], 1.0045, 0xfff1b0, 0);

      // network in the style of the logo
      const N = G.nodes, gab = N.find(n => n.n === 'Gaborone');
      const key = new Set(), edges = [];
      const add = (a, b, kind) => { const k = [a.n, b.n].sort().join('|'); if (key.has(k) || a === b) return; key.add(k); edges.push({ a, b, kind }); };
      const core = N.filter(n => !['Maun', 'Francistown', 'Orapa', 'Selebi-Phikwe', 'Palapye', 'Jwaneng', 'Ghanzi', 'Gaborone'].includes(n.n));
      core.forEach(a => core.filter(b => b !== a).sort((x, y) => gcDist(a, x) - gcDist(a, y)).slice(0, 3).forEach(b => add(a, b, 'mesh')));
      ['Windhoek', 'Johannesburg', 'Lusaka', 'Harare', 'Luanda', 'Lubumbashi', 'Maputo', 'Kinshasa', 'Dar es Salaam', 'Nairobi', 'Lagos', 'Cape Town'].forEach(n => add(N.find(x => x.n === n), gab, 'funnel'));
      ['Maun', 'Francistown', 'Orapa', 'Selebi-Phikwe', 'Palapye', 'Jwaneng', 'Ghanzi'].forEach(n => add(N.find(x => x.n === n), gab, 'local'));
      const mesh = edges.filter(e => e.kind === 'mesh').sort((x, y) => (y.a.la + y.b.la) - (x.a.la + x.b.la));
      const fun = edges.filter(e => e.kind === 'funnel').sort((x, y) => gcDist(y.a, gab) - gcDist(x.a, gab));
      const loc = edges.filter(e => e.kind === 'local');
      mesh.forEach((e, i) => { e.t0 = lerp(.30, .58, i / mesh.length); e.t1 = e.t0 + .06; });
      fun.forEach((e, i) => { e.t0 = lerp(.56, .72, i / fun.length); e.t1 = e.t0 + .07; });
      loc.forEach((e, i) => { e.t0 = lerp(.80, .9, i / loc.length); e.t1 = e.t0 + .05; });
      this.edges = [...mesh, ...fun, ...loc];
      const gold = this.mMesh = new T.MeshBasicMaterial({ color: 0xe3b820, transparent: true, opacity: .95, depthWrite: false });
      const goldHi = this.mFun = new T.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 1, depthWrite: false });
      const goldLoc = new T.MeshBasicMaterial({ color: 0xfff1b0, transparent: true, opacity: 1, depthWrite: false });
      this.SEGS = 64; this.RAD = 4;
      this.edges.forEach(e => {
        const A = vec(e.a.la, e.a.lo), B = vec(e.b.la, e.b.lo), ang = A.angleTo(B);
        const h = e.kind === 'local' ? .002 + ang * .12 : e.kind === 'funnel' ? .004 + ang * .07 : .006 + ang * .12;
        const pts = [];
        for (let i = 0; i <= 24; i++) { const t = i / 24, v = new T.Vector3().copy(A).lerp(B, t).normalize(); pts.push(v.multiplyScalar(1.004 + Math.sin(Math.PI * t) * h)); }
        e.curve = new T.CatmullRomCurve3(pts);
        const rad = e.kind === 'local' ? .0006 : e.kind === 'funnel' ? .0016 : .0018;
        const g = new T.TubeGeometry(e.curve, this.SEGS, rad, this.RAD, false);
        g.setDrawRange(0, 0);
        e.mesh = new T.Mesh(g, e.kind === 'mesh' ? gold : e.kind === 'funnel' ? goldHi : goldLoc); E.add(e.mesh);
      });
      // nodes
      const npos = new Float32Array(N.length * 3), nal = new Float32Array(N.length);
      N.forEach((n, i) => { const v = vec(n.la, n.lo, 1.006); npos.set([v.x, v.y, v.z], i * 3); });
      const ng = new T.BufferGeometry(); ng.setAttribute('position', new T.BufferAttribute(npos, 3)); ng.setAttribute('aAlpha', new T.BufferAttribute(nal, 1));
      this.nodeMat = new T.ShaderMaterial({ vertexShader: dotVS, fragmentShader: dotFS, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { uSize: { value: .022 }, uScale: { value: 1 }, uColor: { value: new T.Color(0xfff1b0) }, uOpacity: { value: 1 } } });
      E.add(new T.Points(ng, this.nodeMat)); this.dotMats.push(this.nodeMat);
      this.nodeAlpha = nal; this.nodeGeo = ng;
      this.nodeT = N.map(n => Math.min(...this.edges.filter(e => e.a === n || e.b === n).map(e => e.t0), 2));
      // light packets travelling into Gaborone
      this.packets = [...fun, ...loc].map(e => ({ e, off: Math.random() }));
      const pp = new Float32Array(this.packets.length * 3), pa = new Float32Array(this.packets.length);
      const pg = new T.BufferGeometry(); pg.setAttribute('position', new T.BufferAttribute(pp, 3)); pg.setAttribute('aAlpha', new T.BufferAttribute(pa, 1));
      this.packMat = new T.ShaderMaterial({ vertexShader: dotVS, fragmentShader: dotFS, transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { uSize: { value: .018 }, uScale: { value: 1 }, uColor: { value: new T.Color(0xffffff) }, uOpacity: { value: 0 } } });
      this.packGeo = pg; E.add(new T.Points(pg, this.packMat)); this.dotMats.push(this.packMat);
      // rings at Gaborone, as in the logo
      const ringG = new T.Group(); const gp = vec(gab.la, gab.lo, 1.005); ringG.position.copy(gp); ringG.lookAt(gp.clone().multiplyScalar(2)); E.add(ringG);
      this.rings = [.006, .011, .017, .024].map(rr => { const m = new T.Mesh(new T.RingGeometry(rr, rr + .0012, 64), new T.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false })); ringG.add(m); return m; });
      this.ripples = [0, 1, 2].map(i => { const m = new T.Mesh(new T.RingGeometry(.02, .0215, 64), new T.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending })); m.userData.o = i / 3; ringG.add(m); return m; });
      // labels projected from the globe
      this.labelPts = ['Gaborone', 'Jwaneng', 'Orapa', 'Francistown', 'Maun', 'Palapye', 'Selebi-Phikwe'].map(n => {
        const nd = N.find(x => x.n === n), el = document.createElement('span');
        el.className = 'geo-label' + (n === 'Gaborone' ? ' main' : ''); el.textContent = n; this.labelBox.appendChild(el);
        return { v: vec(nd.la, nd.lo, 1.006), el, main: n === 'Gaborone' };
      });
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.sticky); this.resize();
      this.vis = true;
      new IntersectionObserver(e => { this.vis = e[0].isIntersecting; if (this.vis) this.go(); }).observe(this.sec);
      this.last = performance.now(); this.go();
    }
    bind() {
      const onScroll = () => {
        const r = this.sec.getBoundingClientRect(), span = Math.max(1, r.height - innerHeight);
        this.p = clamp(-r.top / span);
        if (!this.gl) this.update();
      };
      addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll();
      if (!reduced) addEventListener('pointermove', e => { this.mx = e.clientX / innerWidth - .5; this.my = e.clientY / innerHeight - .5; }, { passive: true });
      this.stops.forEach(b => b.addEventListener('click', () => {
        const r = this.sec.getBoundingClientRect(), span = r.height - innerHeight;
        scrollTo({ top: scrollY + r.top + span * +b.dataset.stop, behavior: reduced ? 'auto' : 'smooth' });
      }));
    }
    resize() {
      if (!this.r) return;
      const w = this.sticky.clientWidth, h = this.sticky.clientHeight;
      this.r.setSize(w, h, false); this.w = w; this.h = h;
      this.cam.aspect = w / h; this.cam.updateProjectionMatrix();
      const sc = h * this.r.getPixelRatio() / (2 * Math.tan(this.cam.fov * D2R / 2));
      this.dotMats.forEach(m => m.uniforms.uScale.value = sc);
      this.fit = w / h < .8 ? lerp(1.55, 1, clamp((w / h - .45) / .35)) : 1;
    }
    go() { if (this.gl && !this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.frame(t)); } }
    frame(now) {
      if (!this.vis || document.hidden) { this.running = false; return; }
      const dt = clamp((now - this.last) / 1000, 0, .05); this.last = Math.max(now, this.last);
      this.t += dt; this.update(); this.render();
      requestAnimationFrame(t => this.frame(t));
    }
    update(force) {
      // smooth the scroll so the flight feels like a camera move, not a jump
      this.pS = force ? this.p : this.pS + (this.p - this.pS) * (reduced ? 1 : .085);
      const p = this.pS;
      // scenes: centred wording fades and flies past as the camera moves
      const win = [[-1, -1, .3, .38], [.42, .48, .68, .74], [.8, .87, 2, 2]];
      this.scenes.forEach((el, i) => {
        const [a, b, c, d] = win[i];
        const o = p < a || p > d ? 0 : p < b ? ss(a, b, p) : p > c ? 1 - ss(c, d, p) : 1;
        const z = p < b ? (1 - o) * -40 : p > c ? (1 - o) * 60 : 0;
        el.style.opacity = o.toFixed(3);
        el.style.transform = `translate3d(0,${(-z * .4).toFixed(1)}px,0) scale(${(1 + (p > c ? (1 - o) * .08 : (1 - o) * -.04)).toFixed(3)})`;
        el.style.visibility = o < .01 ? 'hidden' : 'visible';
        el.classList.toggle('live', o > .6);
      });
      // words light up as the network connects
      this.words.forEach(w => { const on = p >= +w.dataset.word; w.classList.toggle('on', on); });
      const idx = p < .41 ? 0 : p < .77 ? 1 : 2;
      this.stops.forEach((b, i) => { b.classList.toggle('cur', i === idx); b.classList.toggle('done', i < idx); });
      this.sec.style.setProperty('--jp', p.toFixed(4));
      if (!this.gl) return;

      const c = camAt(p, this.t);
      const E = this.earth;
      E.rotation.set((c.lat + this.my * 4) * D2R, (-c.lon + this.mx * 6) * D2R, 0, 'XYZ');
      this.atmoMesh.rotation.copy(E.rotation);
      const dist = c.dist * this.fit;
      this.cam.position.set(0, 0, dist); this.cam.lookAt(0, 0, 0);
      this.cam.setViewOffset(this.w, this.h, 0, c.shift * this.h, this.w, this.h);
      this.sky.rotation.y = p * .9 + this.t * .004; this.sky.rotation.x = p * .25;

      this.mWorld.uniforms.uOpacity.value = lerp(.95, .25, ss(.15, .55, p));
      this.mAfrica.uniforms.uOpacity.value = lerp(.6, 1, ss(.1, .34, p)) * (1 - .6 * ss(.74, .9, p));
      this.mBots.uniforms.uOpacity.value = ss(.66, .84, p);
      this.mCoast.opacity = ss(.2, .4, p) * .55;
      this.mBorders.opacity = ss(.36, .56, p) * .32;
      this.mBwLine.opacity = ss(.7, .84, p);
      this.atmo.uniforms.uGold.value = ss(.3, .8, p);
      this.starMats.forEach((m, i) => m.uniforms.uOpacity.value = (i === 0 ? .5 : .4) * (1 - .6 * ss(.6, .9, p)));

      // as we drop into Botswana the continental web steps back so the local lines read
      this.mMesh.opacity = .95 * (1 - .85 * ss(.7, .84, p));
      this.mFun.opacity = 1 - .55 * ss(.76, .9, p);
      this.edges.forEach(e => { const k = ss(e.t0, e.t1, p); e.mesh.geometry.setDrawRange(0, Math.floor(k * this.SEGS) * this.RAD * 6); e.mesh.visible = k > 0; e.done = k >= 1; });
      this.nodeT.forEach((t0, i) => this.nodeAlpha[i] = ss(t0 - .01, t0 + .03, p) * (1 - .6 * ss(.82, .95, p) * (G.nodes[i].la > -17 ? 1 : 0)));
      this.nodeGeo.attributes.aAlpha.needsUpdate = true;
      this.nodeMat.uniforms.uSize.value = lerp(.03, .0055, ss(.6, .9, p));

      const pos = this.packGeo.attributes.position.array, al = this.packGeo.attributes.aAlpha.array;
      this.packets.forEach((pk, i) => {
        const k = (this.t * (pk.e.kind === 'local' ? .45 : .22) + pk.off) % 1;
        const v = pk.e.curve.getPoint(k); pos.set([v.x, v.y, v.z], i * 3); al[i] = pk.e.done ? Math.sin(Math.PI * k) : 0;
      });
      this.packGeo.attributes.position.needsUpdate = true; this.packGeo.attributes.aAlpha.needsUpdate = true;
      this.packMat.uniforms.uOpacity.value = ss(.6, .75, p);
      this.packMat.uniforms.uSize.value = lerp(.03, .006, ss(.6, .9, p));

      const ringOn = ss(.66, .82, p);
      this.rings.forEach((m, i) => m.material.opacity = ringOn * (.9 - i * .15));
      this.ripples.forEach(m => { const k = (this.t * .35 + m.userData.o) % 1; m.scale.setScalar(.3 + k * 2.6); m.material.opacity = ringOn * (1 - k) * .8; });

      // place HTML labels on the map
      const lab = ss(.8, .9, p);
      this.cam.updateMatrixWorld(); E.updateMatrixWorld();
      this.labelPts.forEach(L => {
        const w = L.v.clone().applyMatrix4(E.matrixWorld), facing = w.clone().normalize().dot(this.cam.position.clone().normalize());
        const sp = w.project(this.cam);
        const x = (sp.x * .5 + .5) * this.w, y = (-sp.y * .5 + .5) * this.h;
        const o = facing > .2 ? (L.main ? ss(.72, .82, p) : lab) : 0;
        L.el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`; L.el.style.opacity = o.toFixed(2);
      });
    }
    render() { this.r.render(this.s, this.cam); }
  }

  window.FOMJourney = Journey;
})();
