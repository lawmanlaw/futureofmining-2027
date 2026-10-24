/* Future of Mining Summit 2027: the loading screen.
   The year rolls 2024, 2025, 2026 while the page loads, lands on 2027 once it is ready
   (never later than about five seconds), then the site opens by itself.
   Shown once per visit; returning visitors and anyone who prefers reduced motion go straight in. */
(function () {
  'use strict';
  const L = document.getElementById('loader'); if (!L) return;
  const root = document.documentElement;
  if (root.classList.contains('no-splash')) { L.remove(); return; }
  root.style.overflow = 'hidden';
  const strip = L.querySelector('.ld-strip'), fill = document.getElementById('ldFill'), label = document.getElementById('ldTitle'), count = L.querySelector('.ld-count');
  const names = ['The first edition', 'The second edition', 'The third edition', 'The fourth edition'];
  const STEP = 700;                       // time each year stays on screen
  let year = 0, loaded = false, gone = false;

  const show = i => {
    year = i;
    strip.style.transform = `translateY(${-i * 25}%)`;
    fill.style.setProperty('--p', ((i + 1) / 4).toFixed(3));
    label.textContent = names[i];
  };
  addEventListener('load', () => { loaded = true; }, { once: true });
  setTimeout(() => { loaded = true; }, 5200);

  show(0);
  const step = () => {
    if (gone) return;
    if (year < 2) { show(year + 1); return setTimeout(step, STEP); }
    if (!loaded) return setTimeout(step, 120);          // hold on 2026 until the page is ready
    show(3); L.classList.add('ready'); L.setAttribute('aria-busy', 'false');
    setTimeout(open, 1000);                               // let 2027 land, then open the site
  };
  setTimeout(step, STEP);

  function open() {
    if (gone) return; gone = true;
    const r = count.getBoundingClientRect();
    L.style.setProperty('--cx', `${r.right - r.height * .3}px`); L.style.setProperty('--cy', `${r.top + r.height / 2}px`);
    L.classList.add('out'); root.style.overflow = '';
    try { sessionStorage.setItem('fom27-loader', '1'); } catch (e) {}
    dispatchEvent(new CustomEvent('fom:enter', { detail: { sound: 'auto' } }));   // the visitor's first tap turns the film's sound on
    setTimeout(() => L.remove(), 1300);
  }
})();
