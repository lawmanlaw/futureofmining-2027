# Future of Mining Summit 2027

Website for the Future of Mining Summit 2027 in Gaborone, Botswana, organised by The Projects Magazine.

It is a static site with no build step. Open `index.html` locally, or host the folder on GitHub Pages, Netlify or any web server.

## What's on the page

- **Loader**: the year rolls from 2024 to 2027 while the page loads. Clicking *Enter* starts the hero film with sound. The loader is shown once per visit and is skipped for anyone who prefers reduced motion.
- **Hero**: the 2026 highlights film with a mute toggle, plus a live countdown to the summit.
- **Road to 2027**: a pinned story that tells each edition, 2024 → 2025 → 2026 → 2027, as you scroll.
- **Summit at a glance**: venue facts, a live Google Map with clickable places (Boipuso Hall, Ditshupo Hall, Annex Hall, Fairground Holdings), Directions links and the provisional programme.
- **Editions, themes, moments, badge builder, passes**: student passes are free under Young Leaders.
- **Exhibit**: 3D stands that rebuild as you scroll, going 3×3 → 6×6 → 12×12 outdoor (a truck drives in). The fascia carries your brand. After that comes a stand picker on the floor plan.
- **Sponsor tiers, FAQ** (passes, parking, heavy-vehicle entry), **organiser** and **footer sign-up**.

## Editing content

Prices, stands, passes, venue labels and dates are all in `assets/js/config.js`.

## Stack

- GSAP 3 with ScrollTrigger and SplitText
- Lenis smooth scroll
- three.js
- qrcode.js

Every library is vendored in `assets/js/vendor`.

The fonts are Mona Sans and Instrument Serif (both SIL OFL), plus Archivo Expanded for the badge. They are self-hosted in `assets/fonts`.

## Notes

- Payments in the registration flow are a demo. Connect a real gateway before launch.
- The Google Map embed only shows when the site is served from a real host.
