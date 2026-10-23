/* Future of Mining Summit 2027: motion layer.
   Lenis smooth scroll + GSAP (ScrollTrigger, SplitText). Effects ported from React Bits patterns:
   SplitText (hero letters), masked line reveals (headings), ScrollReveal (word-by-word statement).
   Everything is skipped when the visitor prefers reduced motion or the libraries fail to load. */
(function () {
  'use strict';
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !window.gsap || !window.ScrollTrigger) return;
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger, ...(window.SplitText ? [window.SplitText] : []));
  const root = document.documentElement;
  root.classList.add('gsap');
  const intro = root.classList.contains('no-splash') ? 0 : (parseFloat(getComputedStyle(root).getPropertyValue('--intro')) || 2.6);

  /* ---------- Lenis smooth scroll ---------- */
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    window.FOMLenis = lenis;
    if (intro) { lenis.stop(); setTimeout(() => lenis.start(), intro * 1000); }
    // in-page links glide instead of jumping
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]'); if (!a) return;
      const id = a.getAttribute('href'); const t = id.length > 1 && document.querySelector(id); if (!t) return;
      e.preventDefault(); lenis.scrollTo(t, { offset: -60, duration: 1.4 });
    });
    // journey stop buttons scroll smoothly through Lenis too
    document.querySelectorAll('[data-stop]').forEach(b => b.addEventListener('click', e => {
      e.stopImmediatePropagation();
      const sec = document.getElementById('journey'), r = sec.getBoundingClientRect();
      lenis.scrollTo(scrollY + r.top + (r.height - innerHeight) * +b.dataset.stop, { duration: 2 });
    }, true));
    // freeze the page behind registration and the video
    const reg = document.getElementById('reg'), vm = document.getElementById('videoModal');
    const sync = () => { (!reg.hidden || vm.open) ? lenis.stop() : lenis.start(); };
    new MutationObserver(sync).observe(reg, { attributes: true, attributeFilter: ['hidden'] });
    new MutationObserver(sync).observe(vm, { attributes: true, attributeFilter: ['open'] });
  }

  const ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  ready.then(() => {
    const SplitText = window.SplitText;

    /* ---------- hero: letters rise (React Bits SplitText) ---------- */
    if (SplitText) {
      const hs = new SplitText('.hero-title .ln > span', { type: 'chars' });
      const chars = hs.chars;
      gsap.set(chars, { display: 'inline-block', transformOrigin: '50% 100%' });
      // 1. entrance: letters rise out of the line, tilted and blurred, and settle
      const tl = gsap.timeline({ delay: intro + 0.05 });
      tl.from(chars, { yPercent: 115, rotate: 8, filter: 'blur(8px)', opacity: 0, duration: 1.2, ease: 'expo.out', stagger: { each: 0.03, from: 'start' } })
        .set(chars, { clearProps: 'filter' });
      // 2. a gold wave runs through the name now and then
      const wave = () => gsap.timeline()
        .to(chars, { yPercent: -10, color: '#E3B820', duration: 0.35, ease: 'power2.out', stagger: { each: 0.04 } })
        .to(chars, { yPercent: 0, color: '#f5f5f7', duration: 0.55, ease: 'power2.inOut', stagger: { each: 0.04 } }, 0.3);
      tl.add(wave(), '+=0.2');
      let waveT = setInterval(() => { if (scrollY < innerHeight * 0.5 && !document.hidden) wave(); }, 7000);
      // 3. React Bits VariableProximity: letters near the pointer grow heavier (the face is variable, 400 to 900)
      const title = document.querySelector('.hero-title');
      if (matchMedia('(hover:hover)').matches) {
        const heroEl = document.getElementById('top');
        let raf = 0, px = -1e4, py = -1e4;
        const apply = () => {
          raf = 0;
          chars.forEach(c => {
            const r = c.getBoundingClientRect(), d = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
            const k = Math.max(0, 1 - d / 260);
            gsap.to(c, { fontWeight: Math.round(800 + 100 * k), scaleY: 1 + 0.08 * k, duration: 0.4, ease: 'power3.out', overwrite: 'auto' });
          });
        };
        heroEl.addEventListener('pointermove', e => { px = e.clientX; py = e.clientY; if (!raf) raf = requestAnimationFrame(apply); });
        heroEl.addEventListener('pointerleave', () => { px = py = -1e4; apply(); });
      }
      // 4. as the hero scrolls away the name opens up and lifts
      gsap.to(title, { letterSpacing: '0.02em', yPercent: -18, opacity: 0.35, ease: 'none',
        scrollTrigger: { trigger: '#top', start: 'top top', end: 'bottom top', scrub: true } });
      window.addEventListener('pagehide', () => clearInterval(waveT));
    }

    /* ---------- headings: masked line reveal ---------- */
    if (SplitText) {
      document.querySelectorAll('main .h2, .org-title, .film-title').forEach(h => {
        h.removeAttribute('data-reveal'); h.classList.remove('pending');
        const s = new SplitText(h, { type: 'lines', mask: 'lines' });
        gsap.from(s.lines, { yPercent: 105, duration: 1.1, ease: 'expo.out', stagger: 0.08,
          scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
      });
    }

    /* ---------- statement: words brighten as you read (React Bits ScrollReveal) ---------- */
    if (SplitText) {
      document.querySelectorAll('.statement, .contact-lead').forEach(p => {
        p.removeAttribute('data-reveal'); p.classList.remove('pending');
        const s = new SplitText(p, { type: 'words' });
        gsap.fromTo(s.words, { opacity: 0.18 }, { opacity: 1, ease: 'none', stagger: 0.05,
          scrollTrigger: { trigger: p, start: 'top 82%', end: 'bottom 45%', scrub: true } });
      });
    }

    /* ---------- the ledger figures drift in from the right ---------- */
    gsap.utils.toArray('.ledger dd').forEach(dd => {
      gsap.from(dd, { xPercent: 12, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: dd, start: 'top 90%', once: true } });
    });

    /* ---------- theme rows: names slide in, one after another ---------- */
    gsap.utils.toArray('.theme h3').forEach(h => {
      gsap.from(h, { x: -40, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: h, start: 'top 92%', once: true } });
    });

    /* ---------- gallery: the strip slides as the section passes ---------- */
    const strip = document.getElementById('strip');
    if (strip) gsap.fromTo(strip, { x: 120 }, { x: -40, ease: 'none', scrollTrigger: { trigger: strip, start: 'top bottom', end: 'bottom top', scrub: true } });

    /* ---------- footer line: letters settle as the page ends ---------- */
    if (SplitText) {
      const fm = new SplitText('.foot-mark', { type: 'chars' });
      gsap.from(fm.chars, { yPercent: 60, opacity: 0, ease: 'power3.out', stagger: 0.012,
        scrollTrigger: { trigger: '.foot-mark', start: 'top 95%', end: 'top 60%', scrub: true } });
    }

    /* ---------- Magnet (React Bits): gold actions lean toward the pointer ---------- */
    if (matchMedia('(hover:hover)').matches) {
      document.querySelectorAll('.btn-gold, .play svg, .g-btn').forEach(el => {
        const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' }), yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });
        el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * 0.25); yTo((e.clientY - r.top - r.height / 2) * 0.35); });
        el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    }
    /* ---------- liquid glass: the highlight follows the pointer ---------- */
    if (matchMedia('(hover:hover)').matches) {
      document.addEventListener('pointermove', e => {
        const el = e.target.closest && e.target.closest('.site-header .nav, .g-btn, .chip-btn, .reg-close, .vm-close, .btn-gold, .float-cta, .hero .count, .sound'); if (!el) return;
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        el.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      }, { passive: true });
    }
    ScrollTrigger.refresh();
  });
})();
