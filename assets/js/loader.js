/* Future of Mining Summit 2027: the loading screen.
   Counts 000 to 100 as the fonts, the hero film and the page arrive (never longer than about five seconds),
   then waits for "Enter the summit". That click is what lets the hero film play with sound.
   Shown once per visit; returning visitors and anyone who prefers reduced motion go straight in. */
(function () {
  'use strict';
  const L = document.getElementById('loader'); if (!L) return;
  const root = document.documentElement;
  if (root.classList.contains('no-splash')) { L.remove(); return; }
  root.style.overflow = 'hidden';
  const strips = L.querySelectorAll('.ld-strip'), fill = document.getElementById('ldFill'), go = L.querySelector('.ld-go'), quiet = L.querySelector('.ld-quiet');
  let target = 10, shown = 0, auto = 0, gone = false;
  const t0 = performance.now(), bump = v => { target = Math.max(target, v); };
  const start = () => {
    bump(34);
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => bump(56));
    const v = document.querySelector('.film-video');
    if (!v || v.readyState >= 2) bump(84);
    else { v.addEventListener('loadeddata', () => bump(84), { once: true }); v.addEventListener('error', () => bump(84), { once: true }); }
  };
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', start, { once: true }) : start();
  addEventListener('load', () => bump(100), { once: true });
  setTimeout(() => bump(100), 5200);

  // the last digit of the year rolls 2024, 2025, 2026, 2027 as the page arrives
  const paint = n => {
    strips[0].style.transform = `translateY(${-Math.min(3, Math.floor(n / 100 * 3.999)) * 25}%)`;
    fill.style.setProperty('--p', (n / 100).toFixed(3));
  };
  function tick(now) {
    if (gone) return;
    const allowed = Math.min(target, 8 + 92 * Math.min(1, (now - t0) / 1900));   // at least about two seconds, so it reads as a count
    shown += (allowed - shown) * 0.1; if (allowed - shown < 0.3) shown = allowed;
    paint(shown);
    if (shown >= 99.7 && target >= 100) { paint(100); ready(); return; }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  function ready() {
    L.classList.add('ready'); L.setAttribute('aria-busy', 'false');
    auto = setTimeout(() => enter('auto', go), 9000);   // no choice made: go in quietly, the first tap turns sound on
  }
  function enter(sound, btn) {
    if (gone) return; gone = true; clearTimeout(auto);
    const r = btn.getBoundingClientRect();
    L.style.setProperty('--cx', `${r.left + r.width / 2}px`); L.style.setProperty('--cy', `${r.top + r.height / 2}px`);
    L.classList.add('out'); root.style.overflow = '';
    try { sessionStorage.setItem('fom27-loader', '1'); } catch (e) {}
    dispatchEvent(new CustomEvent('fom:enter', { detail: { sound } }));
    setTimeout(() => L.remove(), 1300);
  }
  go.addEventListener('click', () => enter(true, go));
  quiet.addEventListener('click', () => enter(false, quiet));
})();
