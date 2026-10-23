/* Future of Mining Summit 2027
   Badge drawing (2D canvas) + 3D lanyard badge stage (three.js) + hero diamond. */
(function () {
  'use strict';
  const C = window.FOM;
  const A = window.FOM_ASSETS;
  const FONT = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Inter, "Segoe UI", sans-serif';
  const FONT_D = '"Archivo Expanded", ' + FONT;
  const BW = 1024, BH = 1536;

  /* ---------------- assets ---------------- */
  const img = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = src; });
  const ready = Promise.all([
    img(A.fomGold), img(A.fomWhite), img(A.projects), img(A.coat), img(A.markWhite),
    document.fonts ? Promise.all([...['900', '800', '700', '600', '500'].map(w => document.fonts.load(`${w} 40px Inter`)), ...['900', '800', '700'].map(w => document.fonts.load(`${w} 40px "Archivo Expanded"`))]).catch(() => {}) : null
  ]).then(([fomGold, fomWhite, projects, coat, markWhite]) => ({ fomGold, fomWhite, projects, coat, markWhite }));
  let IM = null; ready.then(x => { IM = x; });

  const tintCache = new Map();
  function tint(image, color) {
    if (!image) return null;
    const k = image.src.length + image.src.slice(-40) + color;
    if (tintCache.has(k)) return tintCache.get(k);
    const c = document.createElement('canvas'); c.width = image.naturalWidth; c.height = image.naturalHeight;
    const x = c.getContext('2d'); x.drawImage(image, 0, 0);
    x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
    tintCache.set(k, c); return c;
  }

  /* ---------------- 2D badge ---------------- */
  function rr(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }
  function rand(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function fit(ctx, text, maxW, size, min, weight, fam = FONT) {
    let s = size; ctx.font = `${weight} ${s}px ${fam}`;
    while (s > min && ctx.measureText(text).width > maxW) { s -= 2; ctx.font = `${weight} ${s}px ${fam}`; }
    if (ctx.measureText(text).width > maxW) {
      while (text.length > 1 && ctx.measureText(text + '…').width > maxW) text = text.slice(0, -1);
      text += '…';
    }
    return text;
  }
  function spaced(ctx, text, x, y, sp, align) {
    let w = 0; for (const ch of text) w += ctx.measureText(ch).width + sp; w -= sp;
    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const a = ctx.textAlign; ctx.textAlign = 'left';
    for (const ch of text) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + sp; }
    ctx.textAlign = a;
  }
  function network(ctx, f, seed) {
    const r = rand(seed), pts = [];
    for (let i = 0; i < 34; i++) pts.push([r() * BW, r() * BH]);
    ctx.save(); ctx.strokeStyle = f.line; ctx.fillStyle = f.line; ctx.lineWidth = 2;
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const dx = pts[i][0] - pts[j][0], dy = pts[i][1] - pts[j][1];
      if (dx * dx + dy * dy < 300 * 300) { ctx.beginPath(); ctx.moveTo(pts[i][0], pts[i][1]); ctx.lineTo(pts[j][0], pts[j][1]); ctx.stroke(); }
    }
    pts.forEach(p => { ctx.beginPath(); ctx.arc(p[0], p[1], 6, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
  }
  function passStyle(d) {
    if (d.kind === 'exhibitor') return C.exhibitorBadge;
    const p = C.passes.find(x => x.id === d.passId) || C.passes[1];
    return p.badge;
  }
  function finishOf(d) { return C.finishes.find(f => f.id === d.finish) || C.finishes[0]; }

  function base(ctx, d) {
    const f = finishOf(d);
    ctx.clearRect(0, 0, BW, BH);
    ctx.save(); rr(ctx, 0, 0, BW, BH, 64); ctx.clip();
    const g = ctx.createLinearGradient(0, 0, BW, BH); g.addColorStop(0, f.bg[0]); g.addColorStop(1, f.bg[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, BW, BH);
    network(ctx, f, 7 + (d.seed || 0));
    if (IM && IM.markWhite) { ctx.globalAlpha = .07; const m = tint(IM.markWhite, f.ink); ctx.drawImage(m, BW - 640, 380, 760, 811); ctx.globalAlpha = 1; }
    // punched slot for the clip
    ctx.fillStyle = f.id === 'night' ? 'rgba(0,0,0,.45)' : 'rgba(10,28,128,.28)';
    rr(ctx, BW / 2 - 92, 46, 184, 36, 18); ctx.fill();
    return f;
  }
  function band(ctx, ps, h) {
    ctx.fillStyle = ps.color; ctx.fillRect(0, BH - h, BW, h);
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(0, BH - h, BW, 6);
  }

  function drawFront(ctx, d, opt = {}) {
    const f = base(ctx, d), ps = passStyle(d);
    ctx.textBaseline = 'alphabetic';
    // header
    if (IM) {
      const logo = f.id === 'night' ? IM.fomGold : tint(IM.fomWhite, f.accent);
      if (logo) ctx.drawImage(logo, 72, 116, 470, 470 * 669 / 1575);
    }
    ctx.textAlign = 'right'; ctx.fillStyle = f.sub; ctx.font = `700 30px ${FONT}`;
    spaced(ctx, C.edition.toUpperCase(), BW - 72, 168, 4, 'right');
    ctx.fillStyle = f.ink; ctx.font = `800 46px ${FONT}`; ctx.fillText(C.dateLabel, BW - 72, 226);
    ctx.fillStyle = f.sub; ctx.font = `500 30px ${FONT}`; ctx.fillText(C.venueShort || C.venueLabel, BW - 72, 270);
    ctx.fillStyle = f.line.replace(/[\d.]+\)$/, '.35)'); ctx.fillRect(72, 356, BW - 144, 3);

    // photo or initials
    const cx = BW / 2, cy = 548, R = 150;
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.closePath();
    if (d.photo) {
      ctx.clip(); const p = d.photo, s = Math.max(2 * R / p.width, 2 * R / p.height);
      ctx.drawImage(p, cx - p.width * s / 2, cy - p.height * s / 2, p.width * s, p.height * s);
    } else {
      ctx.fillStyle = f.accent; ctx.fill();
      ctx.fillStyle = f.id === 'gold' ? '#FFFFFF' : (f.id === 'night' ? '#0B0F2E' : '#FFFFFF');
      ctx.textAlign = 'center'; ctx.font = `800 104px ${FONT_D}`;
      const ini = ((d.first || '').trim()[0] || '') + ((d.last || '').trim()[0] || '');
      ctx.fillText((ini || 'FM').toUpperCase(), cx, cy + 43);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R + 9, 0, Math.PI * 2); ctx.lineWidth = 10; ctx.strokeStyle = f.accent; ctx.stroke();

    // name block
    ctx.textAlign = 'center';
    const empty = !(d.first || d.last);
    ctx.globalAlpha = empty ? .45 : 1;
    ctx.fillStyle = f.ink;
    const first = fit(ctx, (d.first || 'Your').trim(), BW - 140, 132, 64, 800, FONT_D);
    ctx.fillText(first, cx, 846);
    const last = fit(ctx, (d.last || 'Name').trim(), BW - 160, 68, 40, 600);
    ctx.fillText(last, cx, 930);
    ctx.globalAlpha = 1;
    let y = 1000;
    if (d.title) { ctx.fillStyle = f.sub; ctx.fillText(fit(ctx, d.title, BW - 160, 40, 28, 500), cx, y); y += 62; }
    ctx.fillStyle = f.accent; ctx.fillText(fit(ctx, d.org || (empty ? 'Organisation' : ''), BW - 160, 46, 30, 700), cx, y); y += 52;
    if (d.country) { ctx.fillStyle = f.sub; ctx.font = `500 30px ${FONT}`; ctx.fillText(d.country, cx, y); }

    // interests
    const ints = (d.interests || []).slice(0, 3);
    if (ints.length) {
      ctx.font = `600 26px ${FONT}`; ctx.fillStyle = f.sub; spaced(ctx, 'ASK ME ABOUT', cx, 1150, 3, 'center');
      ctx.font = `700 30px ${FONT}`;
      const ws = ints.map(t => ctx.measureText(t).width + 56), gap = 14;
      const tot = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1);
      let x = cx - tot / 2;
      ints.forEach((t, i) => {
        rr(ctx, x, 1172, ws[i], 60, 30); ctx.lineWidth = 3; ctx.strokeStyle = f.accent; ctx.stroke();
        ctx.fillStyle = f.ink; ctx.textAlign = 'center'; ctx.fillText(t, x + ws[i] / 2, 1213); x += ws[i] + gap;
      });
    }

    // pass band
    band(ctx, ps, 236);
    ctx.textAlign = 'left'; ctx.fillStyle = ps.ink;
    ctx.globalAlpha = .8; ctx.font = `600 24px ${FONT}`; spaced(ctx, 'THE FUTURE OF MINING SUMMIT 2027', 72, BH - 168, 2.5, 'left'); ctx.globalAlpha = 1;
    ctx.font = `900 ${ps.label.length > 8 ? 70 : 84}px ${FONT_D}`; spaced(ctx, ps.label, 68, BH - 74, 0, 'left');
    // QR
    const qx = BW - 72 - 176, qy = BH - 206;
    ctx.fillStyle = '#FFFFFF'; rr(ctx, qx, qy, 176, 176, 18); ctx.fill();
    if (opt.qr) ctx.drawImage(opt.qr, qx + 14, qy + 14, 148, 148);
    else {
      ctx.setLineDash([10, 8]); ctx.strokeStyle = '#9AA3C7'; ctx.lineWidth = 3; rr(ctx, qx + 14, qy + 14, 148, 148, 10); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = '#4B5583'; ctx.textAlign = 'center'; ctx.font = `700 22px ${FONT}`;
      ctx.fillText('QR code', qx + 88, qy + 82); ctx.font = `500 20px ${FONT}`; ctx.fillText('after payment', qx + 88, qy + 108);
    }
    ctx.restore();
  }

  function drawBack(ctx, d, opt = {}) {
    const f = base(ctx, d), ps = passStyle(d);
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if (IM) {
      const logo = f.id === 'night' ? IM.fomGold : tint(IM.fomWhite, f.accent);
      if (logo) ctx.drawImage(logo, (BW - 800) / 2, 150, 800, 800 * 669 / 1575);
    }
    ctx.fillStyle = f.sub; ctx.font = `500 34px ${FONT}`; ctx.fillText("Botswana's premier mining conference", BW / 2, 590);
    ctx.fillStyle = f.ink; ctx.font = `700 40px ${FONT}`; ctx.fillText(`${C.dateLabel}  |  ${C.venueShort || C.venueLabel}`, BW / 2, 650);
    ctx.fillStyle = f.line.replace(/[\d.]+\)$/, '.35)'); ctx.fillRect(160, 712, BW - 320, 3);
    ctx.fillStyle = f.sub; ctx.font = `600 26px ${FONT}`; spaced(ctx, 'ENDORSED BY', BW / 2, 786, 3, 'center');
    if (IM && IM.coat) ctx.drawImage(IM.coat, BW / 2 - 130, 812, 260, 260 * 2197 / 2844);
    ctx.fillStyle = f.ink; ctx.font = `700 38px ${FONT}`; ctx.fillText('Ministry of Minerals and Energy', BW / 2, 1066);
    ctx.fillStyle = f.sub; ctx.font = `600 26px ${FONT}`; spaced(ctx, 'ORGANISED BY', BW / 2, 1150, 3, 'center');
    if (IM && IM.projects) { const p = tint(IM.projects, f.ink); ctx.drawImage(p, BW / 2 - 230, 1176, 460, 460 * 115 / 729); }
    band(ctx, ps, 170);
    ctx.fillStyle = ps.ink; ctx.font = `700 34px ${FONT}`; ctx.fillText('Wear your badge at all times', BW / 2, BH - 92);
    ctx.globalAlpha = .75; ctx.font = `500 24px ${FONT}`; ctx.fillText(opt.ref || 'futureofminingbw.com', BW / 2, BH - 50); ctx.globalAlpha = 1;
    ctx.restore();
  }

  function strapCanvas() {
    const c = document.createElement('canvas'); c.width = 128; c.height = 2048;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 128, 0); g.addColorStop(0, '#071353'); g.addColorStop(.5, '#0E2AA8'); g.addColorStop(1, '#071353');
    x.fillStyle = g; x.fillRect(0, 0, 128, 2048);
    x.fillStyle = '#E3B820'; x.fillRect(6, 0, 6, 2048); x.fillRect(116, 0, 6, 2048);
    x.save(); x.translate(64, 0); x.rotate(Math.PI / 2);
    x.textBaseline = 'middle'; x.font = `800 46px ${FONT}`;
    const parts = ['THE FUTURE OF MINING', '◆', 'SUMMIT 2027', '◆'];
    let y = 30;
    for (let k = 0; k < 6 && y < 2048; k++) for (const p of parts) {
      x.fillStyle = p === '◆' ? '#E3B820' : (p === 'SUMMIT 2027' ? '#E3B820' : '#FFFFFF');
      x.fillText(p, y, 0); y += x.measureText(p).width + 26;
    }
    x.restore();
    return c;
  }

  /* ---------------- three.js shared ---------------- */
  const hasGL = (() => { try { const c = document.createElement('canvas'); return !!(window.THREE && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; } })();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function envMap(renderer) {
    const T = THREE, s = new T.Scene();
    const room = new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x3348ad, side: T.BackSide }));
    s.add(room);
    const panel = (w, h, col, x, y, z, ry, rx) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: col, side: T.DoubleSide }));
      m.position.set(x, y, z); m.rotation.y = ry || 0; m.rotation.x = rx || 0; s.add(m);
    };
    panel(8, 4, 0xffffff, 0, 9.5, 0, 0, Math.PI / 2);
    panel(2, 9, 0xffffff, -9.5, 2, 2, Math.PI / 2);
    panel(2, 6, 0xffffff, -9.5, -1, -5, Math.PI / 2);
    panel(3, 6, 0xffe08a, 9.5, 0, -2, -Math.PI / 2);
    panel(1.5, 6, 0xffffff, 9.5, 1, 4, -Math.PI / 2);
    panel(6, 2, 0x9fb4ff, 0, -2, -9.5);
    panel(2, 2, 0xffffff, -4, 4, -9.5);
    panel(5, 3, 0xffffff, 3, 3, 9.5, Math.PI);
    panel(2, 4, 0xffd34d, -3, -3, 9.5, Math.PI);
    const pm = new T.PMREMGenerator(renderer);
    const tex = pm.fromScene(s, 0.04).texture; pm.dispose();
    return tex;
  }

  /* ---------------- 3D lanyard badge ---------------- */
  class BadgeStage {
    constructor(el, opts = {}) {
      this.el = el; this.opts = opts;
      this.front = document.createElement('canvas'); this.front.width = BW; this.front.height = BH;
      this.back = document.createElement('canvas'); this.back.width = BW; this.back.height = BH;
      this.data = null; this.qr = null; this.ref = null;
      this.flipped = false;
      if (!hasGL) { this.fallback(); return; }
      try { this.init(); } catch (e) { console.warn(e); this.fallback(); }
    }
    fallback() {
      this.gl = false;
      const w = document.createElement('div'); w.className = 'badge-flat';
      w.appendChild(this.front); this.el.appendChild(w);
      this.front.style.width = '100%'; this.front.style.height = 'auto';
      w.addEventListener('click', () => this.flip());
    }
    init() {
      const T = THREE; this.gl = true;
      const r = this.renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.outputColorSpace = T.SRGBColorSpace; r.toneMapping = T.NoToneMapping;
      this.el.appendChild(r.domElement); r.domElement.className = 'badge-gl';
      const sc = this.scene = new T.Scene();
      sc.environment = envMap(r);
      this.cam = new T.PerspectiveCamera(28, 1, .1, 100);
      sc.add(new T.AmbientLight(0xffffff, .35));
      const key = new T.DirectionalLight(0xffffff, .9); key.position.set(3, 4, 7); sc.add(key);
      const rim = new T.DirectionalLight(0xe3b820, 1.1); rim.position.set(-5, 2, -4); sc.add(rim);

      // card
      this.fTex = new T.CanvasTexture(this.front); this.bTex = new T.CanvasTexture(this.back);
      [this.fTex, this.bTex].forEach(t => { t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; });
      const face = map => new T.MeshPhysicalMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: .62, roughness: .5, metalness: 0, clearcoat: .7, clearcoatRoughness: .12, alphaTest: .5, envMapIntensity: .25 });
      const edge = new T.MeshStandardMaterial({ color: 0xe9ecf7, roughness: .4, transparent: true, opacity: 0 });
      this.cw = 1.6; this.ch = 2.4;
      const card = this.cardMesh = new T.Mesh(new T.BoxGeometry(this.cw, this.ch, .022), [edge, edge, edge, edge, face(this.fTex), face(this.bTex)]);
      card.position.y = -this.ch / 2 + .02;
      const metal = new T.MeshStandardMaterial({ color: 0xd9dde8, metalness: 1, roughness: .25, envMapIntensity: 1.4 });
      const clip = new T.Mesh(new T.BoxGeometry(.3, .16, .07), metal); clip.position.y = .02;
      const ring = new T.Mesh(new T.TorusGeometry(.075, .018, 12, 32), metal); ring.position.y = .16;
      this.card = new T.Group(); this.card.add(card, clip, ring); this.card.rotation.order = 'ZXY';
      sc.add(this.card);

      // strap
      const st = new T.CanvasTexture(strapCanvas()); st.colorSpace = T.SRGBColorSpace; st.wrapT = T.RepeatWrapping; st.anisotropy = 8;
      this.SEG = 60;
      const g = this.strapGeo = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(new Float32Array((this.SEG + 1) * 2 * 3), 3));
      g.setAttribute('uv', new T.BufferAttribute(new Float32Array((this.SEG + 1) * 2 * 2), 2));
      const idx = []; for (let i = 0; i < this.SEG; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      g.setIndex(idx);
      this.strap = new T.Mesh(g, new T.MeshStandardMaterial({ map: st, side: T.DoubleSide, roughness: .55, metalness: .05 }));
      this.strap.frustumCulled = false; sc.add(this.strap);

      // rope sim
      this.N = 16; this.P = []; this.Q = [];
      this.anchor = new T.Vector3(0, 5, 0);
      this.rest = new T.Vector3(0, 1.15, 0);
      this.seg = (this.anchor.y - this.rest.y) / (this.N - 1);
      for (let i = 0; i < this.N; i++) { const p = new T.Vector3(0, this.anchor.y - this.seg * i, 0); this.P.push(p); this.Q.push(p.clone()); }
      this.Q[this.N - 1].x -= .03; // starts with a little swing
      this.yaw = 0; this.yawV = 0; this.yawT = 0; this.t = 0;
      this.ray = new T.Raycaster(); this.ptr = new T.Vector2(); this.plane = new T.Plane(new T.Vector3(0, 0, 1), 0);
      this.drag = null;

      this.bindPointer();
      this.ro = new ResizeObserver(() => this.resize()); this.ro.observe(this.el); this.resize();
      this.visible = true;
      this.io = new IntersectionObserver(e => { this.visible = e[0].isIntersecting; if (this.visible) this.kick(); }, { rootMargin: '100px' });
      this.io.observe(this.el);
      this.last = performance.now(); this.running = false; this.kick();
    }
    resize() {
      if (!this.gl) return;
      const w = this.el.clientWidth, h = this.el.clientHeight; if (!w || !h) return;
      this.renderer.setSize(w, h, false);
      this.cam.aspect = w / h;
      const viewH = 4.3, viewW = 3.0;
      const fov = this.cam.fov * Math.PI / 180;
      const dH = (viewH / 2) / Math.tan(fov / 2), dW = (viewW / 2) / (Math.tan(fov / 2) * this.cam.aspect);
      this.cam.position.set(0, -.15, Math.max(dH, dW)); this.cam.lookAt(0, -.15, 0);
      this.cam.updateProjectionMatrix();
      const top = Math.tan(fov / 2) * this.cam.position.z - .15;
      const ay = top + .6;
      if (Math.abs(ay - this.anchor.y) > 1e-3) {
        this.anchor.y = ay; this.seg = (ay - this.rest.y) / (this.N - 1);
        // re-hang the rope from the new anchor so it doesn't snap
        for (let i = 0; i < this.N; i++) { const t = i / (this.N - 1); this.P[i].set(this.P[i].x * t, ay - this.seg * i, 0); this.Q[i].copy(this.P[i]); }
      }
      this.kick();
    }
    bindPointer() {
      const c = this.renderer.domElement;
      const pos = e => { const r = c.getBoundingClientRect(); this.ptr.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
      const hit = () => { this.ray.setFromCamera(this.ptr, this.cam); return this.ray.intersectObject(this.cardMesh).length > 0; };
      const onPlane = () => { this.ray.setFromCamera(this.ptr, this.cam); const v = new THREE.Vector3(); this.ray.ray.intersectPlane(this.plane, v); return v; };
      c.addEventListener('pointerdown', e => {
        pos(e); if (!hit()) return;
        const v = onPlane(), L = this.P[this.N - 1];
        this.drag = { off: L.clone().sub(v), sx: e.clientX, sy: e.clientY, moved: false, lx: v.x };
        c.setPointerCapture(e.pointerId); c.style.cursor = 'grabbing'; this.kick();
      });
      c.addEventListener('pointermove', e => {
        pos(e);
        if (!this.drag) { c.style.cursor = hit() ? 'grab' : ''; return; }
        if (Math.abs(e.clientX - this.drag.sx) + Math.abs(e.clientY - this.drag.sy) > 5) this.drag.moved = true;
        const v = onPlane(); this.drag.target = v.add(this.drag.off);
        this.yawV += (v.x - this.drag.lx) * 4; this.drag.lx = v.x;
      });
      const up = e => {
        if (!this.drag) return;
        if (!this.drag.moved) this.flip();
        this.drag = null; c.style.cursor = 'grab';
        try { c.releasePointerCapture(e.pointerId); } catch (_) {}
      };
      c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    }
    kick() { if (this.gl && !this.running) { this.running = true; this.last = performance.now(); requestAnimationFrame(t => this.frame(t)); } }
    frame(now) {
      if (!this.visible || this.paused || document.hidden) { this.running = false; return; }
      let dt = Math.max(0, Math.min(.033, (now - this.last) / 1000)); this.last = Math.max(now, this.last); this.t += dt;
      if (dt === 0) { requestAnimationFrame(t => this.frame(t)); return; }
      const steps = 2; for (let s = 0; s < steps; s++) this.sim(dt / steps);
      this.updateCard(); this.updateStrap();
      this.renderer.render(this.scene, this.cam);
      requestAnimationFrame(t => this.frame(t));
    }
    sim(dt) {
      const P = this.P, Q = this.Q, N = this.N, g = -16, damp = .978;
      P[0].copy(this.anchor); Q[0].copy(this.anchor);
      const wind = reduced ? 0 : Math.sin(this.t * .9) * .45 + Math.sin(this.t * 2.3) * .12;
      for (let i = 1; i < N; i++) {
        const p = P[i], q = Q[i];
        let vx = (p.x - q.x) * damp, vy = (p.y - q.y) * damp, vz = (p.z - q.z) * damp;
        const vm = Math.hypot(vx, vy, vz), lim = .12; if (vm > lim) { vx *= lim / vm; vy *= lim / vm; vz *= lim / vm; }
        q.copy(p);
        const heavy = i === N - 1;
        p.x += vx + (heavy ? wind * dt * dt : 0);
        p.y += vy + g * dt * dt * (heavy ? 1.6 : 1);
        p.z += vz - p.z * .02;
      }
      if (this.drag && this.drag.target) {
        const L = P[N - 1]; L.lerp(this.drag.target, .5);
      }
      const W = i => (i === 0 ? 0 : (i === N - 1 ? (this.drag ? 0 : .35) : 1));
      for (let k = 0; k < 18; k++) {
        for (let i = 0; i < N - 1; i++) {
          const a = P[i], b = P[i + 1], wa = W(i), wb = W(i + 1), ws = wa + wb; if (!ws) continue;
          const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z, d = Math.hypot(dx, dy, dz) || 1e-6;
          if (d <= this.seg) continue; // rope only resists stretching
          const diff = (d - this.seg) / d;
          a.x += dx * diff * wa / ws; a.y += dy * diff * wa / ws; a.z += dz * diff * wa / ws;
          b.x -= dx * diff * wb / ws; b.y -= dy * diff * wb / ws; b.z -= dz * diff * wb / ws;
        }
      }
      // yaw spring (flip + gentle idle turn)
      const idle = (this.drag || reduced) ? 0 : Math.sin(this.t * .55) * .32;
      const target = this.yawT + idle;
      this.yawV += ((target - this.yaw) * 22 - this.yawV * 3.2) * dt;
      this.yaw += this.yawV * dt;
    }
    updateCard() {
      const P = this.P, N = this.N, L = P[N - 1], M = P[N - 3];
      const dx = L.x - M.x, dy = L.y - M.y, dz = L.z - M.z;
      this.card.position.copy(L);
      const roll = Math.atan2(dx, -dy);
      this.rollS = this.rollS == null ? roll : this.rollS + (roll - this.rollS) * .35;
      this.card.rotation.set(-Math.atan2(dz, -dy) * .6, this.yaw, this.rollS);
    }
    updateStrap() {
      const T = THREE, P = this.P;
      const end = new T.Vector3(0, .16 + .07, 0).applyEuler(this.card.rotation).add(this.card.position);
      const pts = P.slice(0, this.N - 1).concat([end]);
      const curve = new T.CatmullRomCurve3(pts);
      const sp = curve.getSpacedPoints(this.SEG);
      const pos = this.strapGeo.attributes.position.array, uv = this.strapGeo.attributes.uv.array;
      const w = .16, tmp = new T.Vector3(), side = new T.Vector3(), n = new T.Vector3();
      let len = 0;
      for (let i = 0; i <= this.SEG; i++) {
        const p = sp[i], q = sp[Math.min(i + 1, this.SEG)], o = sp[Math.max(i - 1, 0)];
        tmp.subVectors(q, o).normalize();
        const tw = this.yaw * Math.pow(i / this.SEG, 3);
        n.set(Math.sin(tw), 0, Math.cos(tw));
        side.crossVectors(tmp, n).normalize().multiplyScalar(w * (1 - .35 * Math.pow(i / this.SEG, 6)));
        if (i > 0) len += p.distanceTo(sp[i - 1]);
        pos.set([p.x - side.x, p.y - side.y, p.z - side.z, p.x + side.x, p.y + side.y, p.z + side.z], i * 6);
        const v = -len / (w * 2 * 16);
        uv.set([0, v, 1, v], i * 4);
      }
      this.strapGeo.attributes.position.needsUpdate = true; this.strapGeo.attributes.uv.needsUpdate = true;
      this.strapGeo.computeVertexNormals(); this.strapGeo.computeBoundingSphere();
    }
    set(data, opts = {}) {
      this.data = data; if ('qr' in opts) this.qr = opts.qr; if ('ref' in opts) this.ref = opts.ref;
      const draw = () => {
        drawFront(this.front.getContext('2d'), data, { qr: this.qr });
        drawBack(this.back.getContext('2d'), data, { ref: this.ref });
        if (this.gl) { this.fTex.needsUpdate = true; this.bTex.needsUpdate = true; this.kick(); }
      };
      if (IM) draw(); else ready.then(draw);
    }
    flip(to) {
      this.flipped = to == null ? !this.flipped : !!to;
      if (!this.gl) { const fl = this.el.querySelector('.badge-flat'); if (fl) { fl.classList.toggle('show-back', this.flipped); fl.replaceChildren(this.flipped ? this.back : this.front); (this.flipped ? this.back : this.front).style.width = '100%'; } return; }
      const k = Math.round((this.yawT - (this.flipped ? Math.PI : 0)) / (2 * Math.PI));
      this.yawT = (this.flipped ? Math.PI : 0) + k * 2 * Math.PI;
      this.yawV += this.flipped ? 2 : -2; this.kick();
    }
    pause(p) { this.paused = p; if (!p) this.kick(); }
    swing(x = 1) { if (this.gl) { this.Q[this.N - 1].x -= x * .02; this.kick(); } }
  }

  window.FOMBadge = { ready, drawFront, drawBack, BadgeStage, hasGL, size: [BW, BH], FONT };
})();
