/* Future of Mining Summit 2027, v6: motion.
   Lenis smooth scrolling + GSAP (ScrollTrigger, SplitText). The hero comes in after "Enter"; the road to 2027
   rolls its year counter, flips its photo deck and fills its track as you scroll; big type rises by lines;
   photos drift; edition rows show their poster under the pointer. Nothing moves with reduced motion. */
(function () {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hover = matchMedia('(hover:hover)').matches;
  const root = document.documentElement;
  const entered = new Promise(res => { if (!$('#loader') || root.classList.contains('no-splash')) res(); else addEventListener('fom:enter', () => res(), { once: true }); });

  /* menu pictures follow the link you point at */
  const imgs = $$('.menu-imgs img');
  $$('#navLinks a').forEach(a => a.addEventListener('pointerenter', () => imgs.forEach((im, i) => im.classList.toggle('on', i === +a.dataset.i))));

  /* edition rows: the poster follows the pointer */
  const peek = $('#edPeek');
  if (peek && hover) {
    let x = 0, y = 0, px = 0, py = 0, raf = 0;
    const loop = () => { px += (x - px) * .18; py += (y - py) * .18; peek.style.left = px + 'px'; peek.style.top = py + 'px'; raf = Math.abs(x - px) + Math.abs(y - py) > .5 ? requestAnimationFrame(loop) : 0; };
    $$('#edTable [data-img]').forEach(r => {
      r.addEventListener('pointerenter', e => { peek.src = r.dataset.img; peek.classList.add('on'); x = px = e.clientX + 140; y = py = e.clientY; loop(); });
      r.addEventListener('pointermove', e => { x = e.clientX + 140; y = e.clientY; if (!raf) raf = requestAnimationFrame(loop); });
      r.addEventListener('pointerleave', () => peek.classList.remove('on'));
    });
  }

  /* partner marquee: repeat the logos so the loop has no gap */
  const track = $('#logoRow');
  if (track) track.innerHTML += track.innerHTML.replace(/<li>/g, '<li aria-hidden="true">');

  const road = $('#journey');
  if (reduced || !window.gsap || !window.ScrollTrigger) { if (road) road.classList.add('road-static'); return; }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger, ...(window.SplitText ? [window.SplitText] : []));

  /* ---------- Lenis ---------- */
  if (window.Lenis) {
    const lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000)); gsap.ticker.lagSmoothing(0);
    window.FOMLenis = lenis;
    lenis.stop(); entered.then(() => lenis.start());
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'), t = id.length > 1 && document.querySelector(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -70, duration: 1.4 });
    });
    const reg = $('#reg'), vm = $('#videoModal');
    const sync = () => { (!reg.hidden || vm.open || document.body.classList.contains('menu-open')) ? lenis.stop() : lenis.start(); };
    new MutationObserver(sync).observe(reg, { attributes: true, attributeFilter: ['hidden'] });
    new MutationObserver(sync).observe(vm, { attributes: true, attributeFilter: ['open'] });
  }

  /* ---------- the road to 2027 ---------- */
  if (road) {
    const cards = $$('.rd', road), texts = $$('.rt', road), nodes = $$('.rn', road), idx = $('#roadIdx');
    cards.forEach((c, i) => { c.style.zIndex = 10 - i; if (i) gsap.set(c, { scale: .9, rotate: i % 2 ? 3 : -3, y: 18 * i }); });
    gsap.set(texts.slice(1), { autoAlpha: 0, y: 40 }); gsap.set(texts[0], { autoAlpha: 1 });
    const tl = gsap.timeline({ defaults: { ease: 'power3.inOut' }, scrollTrigger: {
      trigger: road, start: 'top top', end: 'bottom bottom', scrub: .6,
      onUpdate: self => {
        const k = Math.min(3, Math.round(self.progress * 3.2 - .1));
        nodes.forEach((n, i) => { n.classList.toggle('on', i === k); n.classList.toggle('done', i < k); });
        idx.textContent = String(k + 1).padStart(2, '0');
      } } });
    tl.to({}, { duration: .6 });                       // a moment on 2024 first
    for (let i = 0; i < 3; i++) {
      const at = 'y' + i, rest = cards.slice(i + 2);
      tl.addLabel(at)
        .to('.odo-strip', { yPercent: -25 * (i + 1), duration: 1 }, at)
        .to(cards[i], { xPercent: -120, yPercent: -12, rotate: -14, autoAlpha: 0, duration: 1, ease: 'power2.in' }, at)
        .to(cards[i + 1], { scale: 1, rotate: 0, y: 0, duration: 1 }, at)
        .to(texts[i], { autoAlpha: 0, y: -40, duration: .45, ease: 'power2.in' }, at)
        .to(texts[i + 1], { autoAlpha: 1, y: 0, duration: .6, ease: 'power3.out' }, at + '+=.45')
        .to('.road-fill', { scaleX: (i + 1) / 3, duration: 1 }, at);
      if (rest.length) tl.to(rest, { y: '-=18', duration: 1 }, at);
      tl.to({}, { duration: .55 });                    // hold on each year
    }
  }

  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  Promise.all([ready, entered]).then(() => {
    const ST = window.SplitText;
    if (ST) {
      const hs = new ST('.hero-title .ln', { type: 'chars', mask: 'chars' });
      (hs.masks || []).forEach(m => { m.style.paddingRight = '.16em'; m.style.marginRight = '-.16em'; });   // room for the italic 7's lean
      gsap.from(hs.chars, { yPercent: 110, duration: 1.2, ease: 'expo.out', stagger: .025, delay: .25, onComplete: () => hs.revert() });
      gsap.from('.hero-eb, .hero-foot', { y: 24, opacity: 0, duration: 1, ease: 'expo.out', stagger: .12, delay: .6 });
      $$('main .title, .sub-title').forEach(h => {
        const s = new ST(h, { type: 'lines', mask: 'lines' });
        (s.masks || []).forEach(m => { m.style.paddingRight = '.16em'; m.style.marginRight = '-.16em'; });
        gsap.from(s.lines, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: h, start: 'top 88%', once: true }, onComplete: () => s.revert() });
      });
      const m = $('.msg-text');
      if (m) { const s = new ST(m, { type: 'words' }); gsap.fromTo(s.words, { opacity: .15 }, { opacity: 1, ease: 'none', stagger: .05, scrollTrigger: { trigger: m, start: 'top 80%', end: 'bottom 40%', scrub: true } }); }
      const fi = new ST('.foot-impact', { type: 'chars' });
      gsap.from(fi.chars, { yPercent: 70, opacity: 0, ease: 'power3.out', stagger: .015, scrollTrigger: { trigger: '.foot-impact', start: 'top 95%', end: 'top 55%', scrub: true } });
    }
    $$('[data-speed]').forEach(el => {
      const sp = parseFloat(el.dataset.speed) || 1;
      gsap.fromTo(el, { y: (1 - sp) * 220 }, { y: (sp - 1) * 220, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    gsap.from('.ed-row:not(.head), .ed-year', { y: 30, opacity: 0, duration: .9, ease: 'expo.out', stagger: .06, scrollTrigger: { trigger: '#edTable', start: 'top 80%', once: true } });
    gsap.from('.cd-digits b', { yPercent: 60, opacity: 0, duration: 1.1, ease: 'expo.out', stagger: .08, scrollTrigger: { trigger: '.cd-digits', start: 'top 85%', once: true } });
    gsap.from('.stats b', { yPercent: 40, opacity: 0, duration: 1, ease: 'expo.out', stagger: .07, scrollTrigger: { trigger: '.stats', start: 'top 85%', once: true } });
    if (hover) $$('.btn-gold, .btn-dark').forEach(el => {
      const xTo = gsap.quickTo(el, 'x', { duration: .5, ease: 'power3.out' }), yTo = gsap.quickTo(el, 'y', { duration: .5, ease: 'power3.out' });
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .18); yTo((e.clientY - r.top - r.height / 2) * .3); });
      el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
    ScrollTrigger.refresh();
  });
})();
