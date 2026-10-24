/* Future of Mining Summit 2027: page behaviour and animation */
(function () {
  'use strict';
  const C = window.FOM, B = window.FOMBadge;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fmt = n => Math.round(n) === 0 ? 'Free' : 'P' + Math.round(n).toLocaleString('en-US');
  const fmtDate = iso => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Africa/Gaborone' });
  const earlyActive = () => Date.now() < new Date(C.earlyBirdEnds).getTime();
  const passOn = p => !((p.early && !earlyActive()) || (p.standard && earlyActive()));
  window.FOMUtil = { fmt, fmtDate, earlyActive, passOn };

  /* ---------- config text ---------- */
  $$('[data-config]').forEach(el => { const v = C[el.dataset.config]; if (v) el.textContent = v; });
  $$('[data-config-href="email"]').forEach(a => { a.href = 'mailto:' + C.email; a.textContent = C.email; });
  const cm = $('.contact-mail'); if (cm && C.email) { const [u, d] = C.email.split('@'); cm.innerHTML = `${u}<wbr>@${d}`; }
  const ph = $('[data-config-phone]');
  if (C.phone) { ph.href = 'tel:' + C.phone.replace(/\s/g, ''); ph.textContent = C.phone; } else $('[data-phone-row]').remove();
  $('#yr').textContent = new Date().getFullYear();
  const ICONS = {
    facebook: '<path d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.9.3-1.5 1.5-1.5h1.6V4.4c-.3 0-1.2-.1-2.3-.1-2.3 0-3.9 1.4-3.9 4v2.2H7.8v3h2.6V21h3.1z"/>',
    linkedin: '<path d="M6.5 8.5H3.6V20h2.9V8.5zM5 4a1.7 1.7 0 100 3.4A1.7 1.7 0 005 4zm15 9.3c0-3-1.6-4.9-4.1-4.9-1.4 0-2.4.8-2.8 1.5V8.5H10.2V20h2.9v-6c0-1.4.5-2.6 2-2.6s1.9 1.2 1.9 2.7V20H20v-6.7z"/>',
    instagram: '<path d="M12 7.4A4.6 4.6 0 1012 16.6 4.6 4.6 0 0012 7.4zm0 7.6a3 3 0 110-6 3 3 0 010 6zm4.8-8.9a1.1 1.1 0 100 2.2 1.1 1.1 0 000-2.2zM21 7.8c-.1-1.4-.4-2.7-1.4-3.7S17.6 2.8 16.2 2.7C14.8 2.6 9.2 2.6 7.8 2.7 6.4 2.8 5.1 3.1 4.1 4.1S2.8 6.4 2.7 7.8c-.1 1.4-.1 7 0 8.4.1 1.4.4 2.7 1.4 3.7s2.3 1.3 3.7 1.4c1.4.1 7 .1 8.4 0 1.4-.1 2.7-.4 3.7-1.4s1.3-2.3 1.4-3.7c.1-1.4.1-7 0-8.4z"/>',
    x: '<path d="M17.5 3h3.1l-6.8 7.8 8 10.2h-6.3l-4.9-6.4L5 21H1.9l7.3-8.3L1.5 3h6.4l4.4 5.8L17.5 3zm-1.1 16.2h1.7L7.1 4.7H5.3l11.1 14.5z"/>'
  };
  const soc = Object.entries(C.socials || {}).filter(([, u]) => u);
  $$('[data-socials]').forEach(box => { box.innerHTML = soc.map(([k, u]) => `<a href="${u}" target="_blank" rel="noopener" aria-label="The Future of Mining Summit on ${k}"><svg viewBox="0 0 24 24" fill="currentColor">${ICONS[k] || ''}</svg></a>`).join(''); });

  /* ---------- The Projects logo slices ---------- */
  const SLICES = [[0, 44], [44, 127], [127, 216], [216, 317], [317, 390], [390, 473], [473, 564], [564, 646], [646, 729]];
  function buildTP(el) {
    el.innerHTML = SLICES.map(([a, b], i) => `<span class="${i ? '' : 'the'}" style="--n:${i};width:calc(var(--h) * ${(b - a) / 115});background-image:url('${window.FOM_ASSETS.projects}');background-size:auto 100%;background-position:calc(var(--h) * ${-a / 115}) 0"><i></i></span>`).join('');
  }
  $$('.tp').forEach(buildTP);

  // organiser logo replays whenever it scrolls into view
  const tpOrg = $('#tp-org');
  new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) tpOrg.classList.add('play'); else if (e.boundingClientRect.top > 0) tpOrg.classList.remove('play');
  }), { threshold: .5 }).observe(tpOrg);

  /* ---------- header, progress, menu ---------- */
  const header = $('#header'), menu = $('#menuBtn'), float = $('#floatCta'), filmEl = $('#film');
  function onScroll() {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    const jb = filmEl.getBoundingClientRect().bottom;
    header.classList.toggle('solid', y > innerHeight * .82 || document.body.classList.contains('menu-open'));
    float.classList.toggle('show', jb < innerHeight * .5 && y < h - 300);
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  menu.addEventListener('click', () => {
    const open = !document.body.classList.contains('menu-open');
    document.body.classList.toggle('menu-open', open); menu.setAttribute('aria-expanded', open); if (window.FOMLenis) open ? window.FOMLenis.stop() : window.FOMLenis.start();
    menu.setAttribute('aria-label', open ? 'Close menu' : 'Open menu'); onScroll();
  });
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => { document.body.classList.remove('menu-open'); menu.setAttribute('aria-expanded', 'false'); if (window.FOMLenis) window.FOMLenis.start(); }));
  const navMap = new Map($$('#navLinks a').map(a => [a.getAttribute('href').slice(1), a]));
  const navObs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting && navMap.get(e.target.id)) { navMap.forEach(a => a.classList.remove('active')); navMap.get(e.target.id).classList.add('active'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  navMap.forEach((a, id) => { const s = document.getElementById(id); if (s) navObs.observe(s); });

  /* ---------- reveal on scroll ---------- */
  const rev = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.remove('pending'); rev.unobserve(e.target); } }), { threshold: .12, rootMargin: '0px 0px -6% 0px' });
  function watch(root = document) { $$('[data-reveal]', root).forEach(el => { if (!reduced) { el.classList.add('pending'); rev.observe(el); } }); }

  /* ---------- countdown ---------- */
  const cd = k => ({ set textContent(v) { $$(`[data-cd="${k}"]`).forEach(e => { e.textContent = v; }); } }), T0 = new Date(C.eventStart).getTime();
  function tick() {
    let t = Math.max(0, T0 - Date.now()) / 1000;
    const d = Math.floor(t / 86400); t -= d * 86400; const h = Math.floor(t / 3600); t -= h * 3600; const m = Math.floor(t / 60), s = Math.floor(t - m * 60);
    cd('d').textContent = String(d).padStart(3, '0'); cd('h').textContent = String(h).padStart(2, '0');
    cd('m').textContent = String(m).padStart(2, '0'); cd('s').textContent = String(s).padStart(2, '0');
  }
  tick(); setInterval(tick, 1000);

  /* ---------- ticker ---------- */
  const TT = ['Technology', 'Renewable energy', 'Future skills', 'Access to finance', 'ESG', 'Parallel industries', 'Public–private partnerships', 'Beneficiation', 'June 2027 · Gaborone'];
  const tk = $('#ticker'); if (tk) tk.innerHTML = [...TT, ...TT].map(t => `<span>${t}</span>`).join('');

  /* ---------- count-up ---------- */
  const cu = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return; cu.unobserve(e.target);
    const el = e.target, to = +el.dataset.count, t0 = performance.now(), dur = reduced ? 1 : 1600;
    const step = now => { const k = Math.min(1, (now - t0) / dur); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString('en-US'); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }), { threshold: .6 });
  $$('[data-count]').forEach(el => cu.observe(el));

  /* ---------- themes ---------- */
  const THEMES = [
    ['Technology', 'Robotics, autonomous fleets and the digital mine are arriving fast. Adapting to them will decide which operations stay competitive.'],
    ['Renewable energy', 'Mines are turning to solar, wind and other cleaner sources to power operations, cut fossil-fuel reliance and reduce emissions.'],
    ['Future skills', 'The mine of the future needs engineers, data specialists and technicians the industry is only beginning to train for.'],
    ['Access to finance', 'Moving projects into construction takes capital that internal cash often can’t cover. New financing models are essential.'],
    ['ESG', 'Environmental, social and governance performance now shapes investor confidence and how responsible mining is rewarded.'],
    ['Parallel industries', 'Building non-mining industries in mining communities makes local economies resilient long before a mine closes.'],
    ['Partnerships', 'Transformative projects depend on government and the private sector investing together to create jobs and change lives.'],
    ['Beneficiation', 'Which policies will make sure Botswana’s minerals are processed at home, for more jobs and wider economic benefit?']
  ];
  $('#themeGrid').innerHTML = THEMES.map(([t, d], i) => `<article class="theme" data-reveal style="--d:${(i % 4) * .06}s"><span class="n">${String(i + 1).padStart(2, '0')}</span><h3>${t}</h3><p>${d}</p></article>`).join('');

  /* ---------- passes, booths, tiers ---------- */
  const eb = earlyActive(), early = C.passes.find(p => p.early), std = C.passes.find(p => p.standard);
  if (eb && early && std) {
    const days = Math.ceil((new Date(C.earlyBirdEnds) - Date.now()) / 864e5);
    $('#earlybird').innerHTML = `<b>Early bird ends ${fmtDate(C.earlyBirdEnds)}</b><span>${days} days left to save ${fmt(std.price - early.price)} on every delegate pass</span>`;
  }
  $('#passGrid').innerHTML = C.passes.map((p, i) => {
    const on = passOn(p);
    return `<article class="pass${p.featured ? ' featured' : ''}${on ? '' : ' off'}" data-reveal style="--d:${i * .08}s">
      <h3><i class="pass-dot" style="background:${p.badge.color}"></i>${p.name}</h3>
      <p class="blurb">${on ? (p.featured ? '<b>Most complete.</b> ' : '') + p.blurb : (p.early ? 'Early bird pricing has closed.' : `Standard rate from ${fmtDate(new Date(new Date(C.earlyBirdEnds).getTime() + 1000).toISOString())}.`)}</p>
      <div class="price">${fmt(p.price)}<small>${p.priceNote || 'per person, VAT included'}</small></div>
      <ul>${p.includes.map(x => `<li>${x}</li>`).join('')}</ul>
      <button class="btn ${p.featured ? 'btn-gold' : 'btn-ghost'}" type="button" data-register="${p.id}" ${on ? '' : 'disabled'}>${on ? (p.cta || 'Choose ' + p.name.split(' ')[0].toLowerCase()) : 'Not available yet'}</button>
    </article>`;
  }).join('');
  if ($('#booths')) $('#booths').innerHTML = C.booths.map(b => `<div class="booth"><h4>${b.name}<small>${b.size}</small></h4><p>${b.blurb} Includes ${b.passes} exhibitor passes.</p><span class="bp">${fmt(b.price)}</span><button class="btn btn-dark btn-sm" type="button" data-register="${b.id}">Book</button></div>`).join('');
  $('#tiers').innerHTML = C.sponsorTiers.map(t => `<li><b>${t.name}</b><span>${t.note}</span></li>`).join('');
  $('#interest').innerHTML = ['Not sure yet, show me the options', ...C.sponsorTiers.map(t => t.name + ' sponsorship'), 'Exhibition stand'].map(x => `<option>${x}</option>`).join('');

  /* ---------- forms ---------- */
  async function send(form, subject, lines, okMsg) {
    const st = $('.status', form); st.className = 'status';
    let ok = true;
    $$('[required]', form).forEach(i => { const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value)); i.setAttribute('aria-invalid', bad); if (bad && ok) { i.focus(); ok = false; } });
    if (!ok) { st.textContent = 'Fill in the highlighted fields to continue.'; st.classList.add('err'); return; }
    const d = Object.fromEntries(new FormData(form));
    if (C.formEndpoint) {
      try { const r = await fetch(C.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ _subject: subject, ...d }) }); if (!r.ok) throw 0; form.reset(); st.textContent = okMsg; st.classList.add('ok'); }
      catch (e) { st.textContent = `That didn't send. Email ${C.email} instead.`; st.classList.add('err'); }
      return;
    }
    location.href = `mailto:${C.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines(d).join('\n'))}`;
    st.textContent = `Your email app should open with the message ready to send. If it doesn't, email ${C.email}.`; st.classList.add('ok');
  }
  $('#enquiry').addEventListener('submit', e => { e.preventDefault(); send(e.target, 'Sponsorship prospectus request: FOM Summit 2027', d => [`Name: ${d.name}`, `Company: ${d.company}`, `Email: ${d.email}`, `Phone: ${d.phone || '-'}`, `Interested in: ${d.interest}`, '', d.message || ''], 'Thank you. The partnerships team will send the prospectus within two working days.'); });
  $('#signup').addEventListener('submit', e => { e.preventDefault(); send(e.target, 'Programme updates: FOM Summit 2027', d => [`Please add ${d.email} to the 2027 programme updates.`], "You're on the list."); });

  /* ---------- video ---------- */
  const vm = $('#videoModal'), rv = $('#reelVideo');
  $$('[data-video]').forEach(b => b.addEventListener('click', () => { const hv = $('.film-video'); if (hv) hv.pause(); vm.showModal ? vm.showModal() : vm.setAttribute('open', ''); rv.play().catch(() => {}); }));
  const closeV = () => { rv.pause(); vm.close ? vm.close() : vm.removeAttribute('open'); };
  $('.vm-close', vm).addEventListener('click', closeV);
  vm.addEventListener('click', e => { if (e.target === vm) closeV(); });
  vm.addEventListener('close', () => { rv.pause(); const hv = $('.film-video'); if (hv && !reduced) hv.play().catch(() => {}); });
  /* ---------- hero film: opens to the full screen as you scroll ---------- */
  const fv = $('.film-video');
  if (reduced) { fv.removeAttribute('autoplay'); fv.pause(); }
  // the reel keeps playing (and keeps its sound) while you scroll the page; it only pauses for the full film
  if (!reduced) fv.play().catch(() => {});
  /* sound: try to start with sound; browsers that block it start muted and unmute on the first tap or click */
  const sb = $('#soundBtn');
  let userMuted = false;
  const setIcon = () => { sb.classList.toggle('on', !fv.muted); sb.setAttribute('aria-pressed', String(!fv.muted)); sb.setAttribute('aria-label', fv.muted ? 'Turn sound on' : 'Mute'); };
  const unmute = () => { fv.muted = false; fv.volume = 0.8; const pr = fv.play(); if (pr) pr.catch(() => { fv.muted = true; fv.play().catch(() => {}); setIcon(); }); setIcon(); };
  if (!reduced) {
    // with the loading screen up, sound waits for its "Enter" button; otherwise try straight away
    if (!document.getElementById('loader')) unmute();
    addEventListener('fom:enter', e => { const snd = e.detail && e.detail.sound; if (snd === true) { userMuted = false; unmute(); } else if (snd === false) { userMuted = true; fv.muted = true; setIcon(); } });
    const firstGesture = e => {
      if (e.target.closest && e.target.closest('#soundBtn, #loader')) return;
      if (!userMuted && fv.muted && !vm.open) unmute();
      ['pointerdown', 'keydown', 'touchend'].forEach(t => removeEventListener(t, firstGesture, true));
    };
    ['pointerdown', 'keydown', 'touchend'].forEach(t => addEventListener(t, firstGesture, true));
  }
  sb.addEventListener('click', () => { if (fv.muted) { userMuted = false; unmute(); } else { fv.muted = true; userMuted = true; setIcon(); } });
  setIcon();
  const filmTick = () => {
    const r = filmEl.getBoundingClientRect();
    // gentle parallax: the footage drifts down as the hero scrolls away
    filmEl.style.setProperty('--fp', reduced ? 0 : Math.max(0, Math.min(1, -r.top / Math.max(1, r.height))).toFixed(4));
  };
  addEventListener('scroll', filmTick, { passive: true }); addEventListener('resize', filmTick); filmTick();

  /* ---------- partners: logos light up in turn ---------- */
  const logos = $$('#logoRow .logo');
  let li = 0, lt = null;
  const lightNext = () => { logos.forEach(l => l.classList.remove('lit')); logos[li % logos.length].classList.add('lit'); li++; };
  new IntersectionObserver(es => { if (es[0].isIntersecting && !reduced) { lightNext(); lt = setInterval(lightNext, 1600); } else { clearInterval(lt); logos.forEach(l => l.classList.remove('lit')); } }).observe($('#logoRow'));

  /* ---------- gallery drag ---------- */
  const strip = $('#strip') || document.createElement('div');
  let sx = 0, sl = 0, down = false;
  strip.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; sx = e.clientX; sl = strip.scrollLeft; strip.classList.add('drag'); });
  addEventListener('pointerup', () => { down = false; strip.classList.remove('drag'); });
  addEventListener('pointermove', e => { if (down) strip.scrollLeft = sl - (e.clientX - sx); });
  $$('[data-g]').forEach(b => b.addEventListener('click', () => strip.scrollBy({ left: +b.dataset.g * strip.clientWidth * .8, behavior: 'smooth' })));


  // the globe only starts when its section comes near, so the first screen loads light


  /* ---------- Africa connects as you scroll (2026 numbers) ---------- */
  (function africaNet() {
    const G = window.FOM_GEO, svg = $('#africaNet'); if (!G || !svg) return;
    const NS = 'http://www.w3.org/2000/svg', S = G.svg, N = G.nodes, gab = N.find(n => n.n === 'Gaborone');
    svg.setAttribute('viewBox', `0 0 ${S.w} ${S.h}`);
    const el = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); return e; };
    svg.appendChild(el('path', { d: S.land, class: 'an-land' }));
    svg.appendChild(el('path', { d: S.borders, class: 'an-borders' }));
    svg.appendChild(el('path', { d: S.bw, class: 'an-bw' }));
    const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y), edges = [], seen = new Set();
    const add = (a, b, k) => { const id = [a.n, b.n].sort().join('|'); if (a === b || seen.has(id)) return; seen.add(id); edges.push({ a, b, k }); };
    const local = ['Maun', 'Francistown', 'Orapa', 'Selebi-Phikwe', 'Palapye', 'Jwaneng', 'Ghanzi', 'Gaborone'];
    const core = N.filter(n => !local.includes(n.n));
    core.forEach(a => core.filter(b => b !== a).sort((x, y) => dist(a, x) - dist(a, y)).slice(0, 3).forEach(b => add(a, b, 'm')));
    ['Windhoek', 'Johannesburg', 'Lusaka', 'Harare', 'Luanda', 'Lubumbashi', 'Kinshasa', 'Dar es Salaam', 'Nairobi', 'Lagos', 'Cape Town', 'Maputo'].forEach(n => add(N.find(x => x.n === n), gab, 'f'));
    local.slice(0, -1).forEach(n => add(N.find(x => x.n === n), gab, 'l'));
    const ms = edges.filter(e => e.k === 'm').sort((x, y) => (x.a.y + x.b.y) - (y.a.y + y.b.y));
    const fs = edges.filter(e => e.k !== 'm').sort((x, y) => dist(y.a, gab) - dist(x.a, gab));
    ms.forEach((e, i) => e.t = .05 + .55 * i / ms.length); fs.forEach((e, i) => e.t = .55 + .35 * i / fs.length);
    const g = el('g', {}); svg.appendChild(g);
    [...ms, ...fs].forEach(e => { e.el = el('line', { x1: e.a.x, y1: e.a.y, x2: e.b.x, y2: e.b.y, pathLength: 1, class: 'an-line ' + e.k }); g.appendChild(e.el); });
    const rings = el('g', { class: 'an-rings', transform: `translate(${gab.x} ${gab.y})` });
    [5, 9, 13].forEach(r => rings.appendChild(el('circle', { r, class: 'an-ring' })));
    rings.appendChild(el('circle', { r: 6, class: 'an-ripple' }));
    svg.appendChild(rings);
    const nodes = N.map(n => { const c = el('circle', { cx: n.x, cy: n.y, r: n === gab ? 4 : 2.6, class: 'an-node' }); svg.appendChild(c); return { n, c, t: Math.min(...edges.filter(e => e.a === n || e.b === n).map(e => e.t)) }; });
    const sec = $('#numbers');
    const tick = () => {
      const r = sec.getBoundingClientRect();
      const p = reduced ? 1 : Math.max(0, Math.min(1, (innerHeight * .9 - r.top) / (r.height * .9)));
      edges.forEach(e => { const k = Math.max(0, Math.min(1, (p - e.t) / .08)); e.el.style.strokeDashoffset = 1 - k; e.el.style.opacity = k > 0 ? 1 : 0; });
      nodes.forEach(o => o.c.classList.toggle('on', p >= o.t));
      rings.classList.toggle('on', p > .88);
    };
    addEventListener('scroll', tick, { passive: true }); addEventListener('resize', tick); tick();
  })();

  /* ---------- badge teaser ---------- */
  const quick = $('#quick');
  const qd = { first: '', last: '', org: '', title: '', country: 'Botswana', finish: 'night', interests: ['Beneficiation', 'Finance'], passId: (C.passes.find(p => passOn(p) && p.group) || C.passes[0]).id, kind: 'pass', seed: 3 };
  const teaser = new B.BadgeStage($('#teaserStage'));
  const swEl = $('#quickFinish'), ppEl = $('#quickPass');
  swEl.innerHTML = C.finishes.map(f => `<button type="button" class="swatch" role="radio" aria-checked="${f.id === qd.finish}" data-f="${f.id}"><i style="background:${f.bg[0]}"></i>${f.name}</button>`).join('');
  ppEl.innerHTML = C.passes.filter(passOn).map(p => `<button type="button" class="pill" role="radio" aria-checked="${p.id === qd.passId}" data-p="${p.id}"><i style="background:${p.badge.color}"></i>${p.name}</button>`).join('');
  const redraw = () => teaser.set({ ...qd });
  quick.addEventListener('input', e => { if (e.target.name) { qd[e.target.name] = e.target.value; redraw(); } });
  swEl.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; qd.finish = b.dataset.f; $$('[data-f]', swEl).forEach(x => x.setAttribute('aria-checked', x === b)); redraw(); teaser.swing(.5); });
  ppEl.addEventListener('click', e => { const b = e.target.closest('[data-p]'); if (!b) return; qd.passId = b.dataset.p; $$('[data-p]', ppEl).forEach(x => x.setAttribute('aria-checked', x === b)); redraw(); teaser.swing(-.5); });
  $('#teaserFlip').addEventListener('click', () => teaser.flip());
  quick.addEventListener('submit', e => { e.preventDefault(); window.FOMReg.open({ passId: qd.passId, prefill: { ...qd } }); });
  redraw();
  window.FOMSite = { teaser, watch };

  /* ---------- registration entry points ---------- */
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-register]'); if (!b || b.disabled) return;
    e.preventDefault(); window.FOMReg.open({ passId: b.dataset.register || null });
  });

  watch();
})();
