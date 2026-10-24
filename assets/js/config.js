/* =====================================================================
   FUTURE OF MINING SUMMIT 2027 — SITE SETTINGS
   Everything the organisers are likely to change lives in this file.
   Items marked CONFIRM are placeholders to check before launch.
   ===================================================================== */
window.FOM = {
  eventName: 'The Future of Mining Summit 2027',
  edition: '4th edition',
  dateLabel: 'June 2027',                       // CONFIRM e.g. '28–29 June 2027'
  venueLabel: 'Boipuso Hall and Ditshupo Hall, Fairgrounds, Gaborone', // CONFIRM (2024–2026 summits were at Boipuso Hall)
  venueShort: 'Gaborone, Botswana',
  eventStart: '2027-06-28T08:00:00+02:00',       // CONFIRM drives countdown and calendar file
  eventEnd:   '2027-06-29T17:00:00+02:00',       // CONFIRM

  email: 'ramaphane@theprojectsbw.com',          // participation and partnerships (from the 2026 poster)
  phone: '+267 77 831 555',
  socials: {                                     // CONFIRM add links; empty ones are hidden
    facebook: '', linkedin: '', instagram: '', x: ''
  },

  earlyBirdEnds: '2027-03-31T23:59:59+02:00',    // CONFIRM
  groupMin: 5,
  groupDiscount: 0.10,
  vatRate: 0.14,

  /* Pass types. `badge` sets the colour band and label printed on the badge. CONFIRM prices */
  passes: [
    { id: 'early', name: 'Early bird delegate', price: 3950, early: true, group: true,
      badge: { label: 'DELEGATE', color: '#1A3BD6', ink: '#FFFFFF' },
      blurb: 'Full two-day access at the lowest rate of the year.',
      includes: ['Both summit days', 'Lunch and refreshments', 'Exhibition access', 'Summit report and white papers'] },
    { id: 'delegate', name: 'Delegate', price: 4950, standard: true, group: true,
      badge: { label: 'DELEGATE', color: '#1A3BD6', ink: '#FFFFFF' },
      blurb: 'Full two-day access to every plenary, panel and fireside chat.',
      includes: ['Both summit days', 'Lunch and refreshments', 'Exhibition access', 'Summit report and white papers'] },
    { id: 'executive', name: 'Executive', price: 8950, featured: true,
      badge: { label: 'EXECUTIVE', color: '#E3B820', ink: '#0B0F2E' },
      blurb: 'For leaders who want the room behind the room.',
      includes: ['Everything in Delegate', 'Reserved front-section seating', 'Executive lounge', 'Networking dinner invitation'] },
    { id: 'student', name: 'Young Leaders', price: 0, cta: 'Join Young Leaders',
      priceNote: 'Free for students, under the Young Leaders programme',
      badge: { label: 'STUDENT', color: '#0E9F7A', ink: '#FFFFFF' },
      blurb: 'Free for full-time students: the next generation of mining leaders in the room.',
      includes: ['Both summit days', 'Exhibition access', 'Careers and skills sessions', 'Valid student card at registration'] }
  ],

  /* Exhibition stands. Each comes with one lead exhibitor badge designed at booking. CONFIRM prices and inclusions */
  booths: [
    { id: 'stand-3', name: 'Shell stand', size: '3 m × 3 m', dims: [3, 3], price: 24500, passes: 2, zone: 'Ditshupo Hall',
      blurb: 'Your own space on the exhibition floor, ready to move in.',
      includes: ['Shell walls with your name on the fascia board', 'Carpet, one table and two chairs', 'Two spotlights and one 15 A power socket', 'Two exhibitor passes and a listing in the summit guide'] },
    { id: 'stand-6', name: 'Premium stand', size: '6 m × 6 m', dims: [6, 6], price: 72000, passes: 4, zone: 'Ditshupo Hall',
      blurb: 'A corner stand with two open sides on a main aisle.',
      includes: ['Two open sides and fascia boards on both fronts', 'Reception counter, meeting table and four chairs', 'Lockable storage room and a 55-inch screen', 'Four spotlights, two power sockets, four exhibitor passes'] },
    { id: 'stand-12', name: 'Outdoor plot', size: '12 m × 12 m', dims: [12, 12], price: 58000, passes: 6, zone: 'Outdoor exhibition ground',
      blurb: 'Open ground for vehicles, heavy machinery and a branded marquee.',
      includes: ['144 m² of level ground with heavy-vehicle access', '6 m × 6 m marquee, counter and lounge furniture', 'Two flag poles, signage totem and a 32 A power point', 'Six exhibitor passes and a guided move-in slot'] }
  ],
  exhibitorBadge: { label: 'EXHIBITOR', color: '#E2572B', ink: '#FFFFFF' },

  sponsorTiers: [
    { name: 'Headline partner', note: 'Naming on all summit media, keynote slot, 10 executive passes' },
    { name: 'Platinum', note: 'Theme ownership, panel seat, premium booth, 6 executive passes' },
    { name: 'Gold', note: 'Session sponsorship, standard booth, 4 delegate passes' },
    { name: 'Networking dinner', note: 'Host the evening delegates remember' },
    { name: 'Lanyards and badges', note: 'Your brand around every delegate’s neck, both days' },
    { name: 'Student and skills hub', note: 'Back the next generation of mining talent' }
  ],

  /* Badge designer options */
  finishes: [
    { id: 'night',   name: 'Projects blue', bg: ['#2B4CA3', '#1D3784'], ink: '#FFFFFF', sub: '#CAD6F6', accent: '#E3B820', line: 'rgba(255,255,255,.12)' },
    { id: 'gold',    name: 'Gold seam',   bg: ['#F6D85A', '#C99A0E'], ink: '#0B0F2E', sub: '#4A3A06', accent: '#0A1C80', line: 'rgba(10,28,128,.12)' },
    { id: 'diamond', name: 'Diamond',     bg: ['#FFFFFF', '#DCE4FA'], ink: '#0A1C80', sub: '#4B5583', accent: '#C99A0E', line: 'rgba(10,28,128,.09)' }
  ],
  interests: ['Technology', 'Renewable energy', 'Future skills', 'Finance', 'ESG', 'Parallel industries', 'Partnerships', 'Beneficiation', 'Investment', 'Careers'],
  countries: ['Botswana', 'South Africa', 'Namibia', 'Zimbabwe', 'Zambia', 'DR Congo', 'Angola', 'Mozambique', 'Lesotho', 'Eswatini', 'Tanzania', 'Kenya', 'Ghana', 'Nigeria', 'United Kingdom', 'Australia', 'Canada', 'China', 'India', 'United States', 'Other'],

  promoCodes: {},                                // e.g. { 'MEDIA27': 0.15 }

  /* Payments: 'demo' simulates payment (no money moves, no card details asked).
     'live' POSTs the order to paymentEndpoint, which must return { redirectUrl }. */
  paymentMode: 'demo',
  paymentEndpoint: '/api/create-payment',
  paymentMethods: [
    { id: 'card', name: 'Card', note: 'Visa or Mastercard on a secure payment page' }
  ],

  formEndpoint: ''                               // blank = open email app; or a Formspree-style URL
};
