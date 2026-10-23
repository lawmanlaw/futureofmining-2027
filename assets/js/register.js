/* Future of Mining Summit 2027: registration by designing your badge */
(function () {
  'use strict';
  const C = window.FOM, B = window.FOMBadge, U = window.FOMUtil;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const emailOk = v => /^\S+@\S+\.\S+$/.test(v || '');
  const root = $('#reg'), main = $('#regMain'), bar = $('#regBar'), dots = $('#badgeDots');
  const PASS = id => C.passes.find(p => p.id === id), BOOTH = id => C.booths.find(b => b.id === id);
  const label = b => b.kind === 'exhibitor' ? C.exhibitorBadge.label : PASS(b.passId).badge.label;
  const color = b => b.kind === 'exhibitor' ? C.exhibitorBadge.color : PASS(b.passId).badge.color;
  let stage = null, S, uid = 0, lastFocus;

  function fresh() {
    S = { step: 1, cart: {}, badges: [], cur: 0, buyer: { same: true }, method: 'card', mobile: '', promo: null, terms: false, order: null, qr: [] };
  }
  fresh();
  const blank = (kind, key) => ({ uid: ++uid, kind, passId: kind === 'pass' ? key : null, boothId: kind === 'exhibitor' ? key : null, first: '', last: '', title: '', org: '', email: '', country: 'Botswana', photo: null, photoUrl: '', finish: 'night', interests: [], seed: Math.floor(Math.random() * 999) });

  /* keep one badge per pass and one lead badge per booth */
  function sync() {
    const next = [];
    const take = (kind, key, n) => {
      const have = S.badges.filter(b => (kind === 'pass' ? b.passId : b.boothId) === key);
      for (let i = 0; i < n; i++) next.push(have[i] || blank(kind, key));
    };
    C.passes.forEach(p => take('pass', p.id, S.cart[p.id] || 0));
    C.booths.forEach(b => take('exhibitor', b.id, S.cart[b.id] || 0));
    S.badges = next;
    S.cur = Math.min(S.cur, Math.max(0, next.length - 1));
  }

  /* ---------- totals ---------- */
  function totals() {
    const lines = [...C.passes, ...C.booths].filter(p => S.cart[p.id] > 0).map(p => ({ p, qty: S.cart[p.id], sum: S.cart[p.id] * p.price, booth: !!p.size }));
    const sub = lines.reduce((a, l) => a + l.sum, 0);
    const gl = lines.filter(l => l.p.group), gq = gl.reduce((a, l) => a + l.qty, 0);
    const group = gq >= C.groupMin ? gl.reduce((a, l) => a + l.sum, 0) * C.groupDiscount : 0;
    const passSum = lines.filter(l => !l.booth).reduce((a, l) => a + l.sum, 0);
    const promo = S.promo ? (passSum - group) * S.promo.rate : 0;
    const total = Math.max(0, sub - group - promo);
    return { lines, sub, group, gq, promo, total, vat: total * C.vatRate / (1 + C.vatRate), count: lines.reduce((a, l) => a + l.qty, 0) };
  }

  /* ---------- open / close ---------- */
  function open(o = {}) {
    if (S.step === 5) fresh();
    const id = o.passId;
    if (id && PASS(id) && U.passOn(PASS(id))) S.cart[id] = Math.max(1, S.cart[id] || 0);
    if (id && BOOTH(id)) S.cart[id] = Math.max(1, S.cart[id] || 0);
    sync();
    if (o.prefill && id) {
      const i = S.badges.findIndex(b => b.passId === id);
      if (i > -1) { const pf = o.prefill; Object.assign(S.badges[i], { first: pf.first || '', last: pf.last || '', org: pf.org || '', finish: pf.finish, interests: pf.interests || [] }); S.cur = i; }
    } else if (id) { const i = S.badges.findIndex(b => b.passId === id || b.boothId === id); if (i > -1) S.cur = i; }
    S.step = id ? 2 : 1;
    lastFocus = document.activeElement;
    root.hidden = false; document.documentElement.style.overflow = 'hidden';
    if (window.FOMSite) window.FOMSite.teaser.pause(true);
    if (!stage) { stage = new B.BadgeStage($('#regStage')); $('#regFlip').addEventListener('click', () => stage.flip()); }
    render(); preview();
    setTimeout(() => { const h = $('h2', main); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); } }, 60);
  }
  function close() {
    root.hidden = true; document.documentElement.style.overflow = '';
    if (window.FOMSite) window.FOMSite.teaser.pause(false);
    if (stage) stage.pause(true);
    if (S.step === 5) fresh();
    if (lastFocus) lastFocus.focus();
  }
  root.addEventListener('click', e => { if (e.target.closest('[data-close]')) close(); });
  document.addEventListener('keydown', e => { if (!root.hidden && e.key === 'Escape') close(); });
  $('#regSteps').addEventListener('click', e => {
    const li = e.target.closest('li.done'); if (!li || S.step === 5) return;
    go(+li.dataset.s);
  });

  function go(n) {
    S.step = n; render(); preview(); main.scrollTop = 0;
    const h = $('h2', main); if (h) { h.tabIndex = -1; h.focus({ preventScroll: true }); }
  }

  /* ---------- badge preview ---------- */
  let raf = 0;
  function preview() {
    if (!stage) return;
    stage.pause(false);
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      const b = S.badges[S.cur] || { ...blank('pass', (C.passes.find(U.passOn) || C.passes[0]).id) };
      stage.set(b, { qr: S.step === 5 ? S.qr[S.cur] || null : null, ref: S.order ? `${S.order.ref}-${String(S.cur + 1).padStart(2, '0')}` : null });
    });
    dots.innerHTML = S.badges.length > 1 ? S.badges.map((b, i) => `<button type="button" aria-pressed="${i === S.cur}" data-dot="${i}" aria-label="Show badge ${i + 1}">${i + 1}</button>`).join('') : '';
  }
  dots.addEventListener('click', e => {
    const d = e.target.closest('[data-dot]'); if (!d) return;
    S.cur = +d.dataset.dot; if (S.step === 2) render(); preview(); stage.swing(.4);
  });

  /* ---------- render ---------- */
  function render() {
    $$('#regSteps li').forEach(li => { const n = +li.dataset.s; li.className = n < S.step ? 'done' : n === S.step ? 'cur' : ''; li.setAttribute('aria-current', n === S.step ? 'step' : 'false'); });
    [null, step1, step2, step3, step4, step5][S.step]();
  }
  function barHTML(back, next, nextLabel, disabled) {
    const t = totals();
    bar.innerHTML = `<div class="reg-total"><small>${S.step === 5 ? (S.order.method === 'invoice' ? 'Invoice total' : S.order.total ? 'Paid' : 'Total') : 'Total'}</small><b>${U.fmt(S.step === 5 ? S.order.total : t.total)}</b>${t.group && S.step < 5 ? `<em>Group rate applied</em>` : ''}</div>
      <div class="reg-nav">${back ? `<button class="back-link" type="button" id="bBack">${back}</button>` : ''}<button class="btn btn-gold" type="button" id="bNext" ${disabled ? 'disabled' : ''}>${nextLabel}</button></div>`;
    if (back) $('#bBack').addEventListener('click', () => go(S.step - 1));
    $('#bNext').addEventListener('click', next);
  }

  /* step 1: passes */
  function row(p, booth) {
    const on = booth || U.passOn(p), q = S.cart[p.id] || 0, max = booth ? 3 : 20;
    const sub = booth ? `${p.size}. Includes ${p.passes} exhibitor passes` : on ? p.blurb : (p.early ? 'Early bird pricing has closed' : `Available from ${U.fmtDate(new Date(new Date(C.earlyBirdEnds).getTime() + 1000).toISOString())}`);
    return `<div class="item${q ? ' has' : ''}${on ? '' : ' off'}">
      <span class="dot" style="background:${booth ? C.exhibitorBadge.color : p.badge.color}"></span>
      <div><b>${p.name}</b><small>${sub}</small></div>
      <span class="p">${U.fmt(p.price)}</span>
      <span class="stepper" role="group" aria-label="${esc(p.name)} quantity">
        <button type="button" data-q="${p.id}" data-d="-1" aria-label="Remove one" ${!on || !q ? 'disabled' : ''}>&minus;</button>
        <output>${q}</output>
        <button type="button" data-q="${p.id}" data-d="1" aria-label="Add one" ${!on || q >= max ? 'disabled' : ''}>+</button></span></div>`;
  }
  function step1() {
    const t = totals();
    main.innerHTML = `<h2>Who's coming?</h2><p>Add a pass for each person. Every pass gets its own badge, which you'll design next.</p>
      ${C.passes.map(p => row(p)).join('')}
      <h3>Exhibiting?</h3>
      ${C.booths.map(b => row(b, true)).join('')}
      <p class="note">Each booth includes a lead exhibitor badge you design now. We'll email you for the rest of your team's names.</p>
      ${t.gq > 0 && t.gq < C.groupMin ? `<p class="note" style="color:var(--gold-2);margin-top:.8rem">Add ${C.groupMin - t.gq} more delegate ${C.groupMin - t.gq === 1 ? 'pass' : 'passes'} and ${Math.round(C.groupDiscount * 100)}% comes off.</p>` : ''}`;
    $$('[data-q]', main).forEach(b => b.addEventListener('click', () => {
      const id = b.dataset.q, d = +b.dataset.d;
      S.cart[id] = Math.max(0, (S.cart[id] || 0) + d); sync();
      if (d > 0) { const idx = S.badges.map((x, i) => [x, i]).filter(([x]) => x.passId === id || x.boothId === id).pop(); if (idx) S.cur = idx[1]; }
      render(); preview(); if (d > 0) stage.swing(.6);
      const nb = $(`[data-q="${id}"][data-d="${d}"]`, main); (nb && !nb.disabled ? nb : $('#bNext')).focus();
    }));
    const n = S.badges.length;
    barHTML(null, () => go(2), n ? `Design ${n === 1 ? 'your badge' : n + ' badges'}` : 'Add a pass to continue', !n);
  }

  /* step 2: design */
  function step2() {
    if (!S.badges.length) return go(1);
    const b = S.badges[S.cur];
    const tab = (x, i) => `<button type="button" role="tab" aria-selected="${i === S.cur}" data-tab="${i}" class="${x._bad ? 'bad' : ''}"><i style="background:${color(x)}"></i>${i + 1}. ${esc(x.first || 'Badge')} <small style="opacity:.7">${label(x).toLowerCase()}</small></button>`;
    main.innerHTML = `<h2>Design ${S.badges.length > 1 ? 'the badges' : 'your badge'}</h2>
      <p>Everything you type prints onto the badge as you go. Drag it to see it swing, or flip it to see the back.</p>
      ${S.badges.length > 1 ? `<div class="tabs" role="tablist">${S.badges.map(tab).join('')}</div>` : ''}
      ${b.kind === 'exhibitor' ? `<p class="demo" style="color:var(--fg);border-color:rgba(226,87,43,.6);background:rgba(226,87,43,.12)">Lead exhibitor badge for your ${esc(BOOTH(b.boothId).name.toLowerCase())}.</p>` : ''}
      <div class="form-grid" id="bf">
        <div class="row"><label class="field"><span>First name</span><input name="first" value="${esc(b.first)}" autocomplete="given-name" required></label>
        <label class="field"><span>Last name</span><input name="last" value="${esc(b.last)}" autocomplete="family-name" required></label></div>
        <div class="row"><label class="field"><span>Job title</span><input name="title" value="${esc(b.title)}" autocomplete="organization-title" placeholder="Optional"></label>
        <label class="field"><span>Organisation</span><input name="org" value="${esc(b.org)}" autocomplete="organization" required></label></div>
        <div class="row"><label class="field"><span>Email (not printed)</span><input name="email" type="email" value="${esc(b.email)}" autocomplete="email" required></label>
        <label class="field"><span>Country</span><select name="country">${C.countries.map(c => `<option${c === b.country ? ' selected' : ''}>${c}</option>`).join('')}</select></label></div>
        <div class="field"><span>Photo</span><div class="photo-row">
          <span class="photo-prev" style="${b.photoUrl ? `background-image:url(${b.photoUrl})` : ''}"></span>
          <label class="chip-btn file-btn">${b.photoUrl ? 'Change photo' : 'Add a photo'}<input type="file" accept="image/*" id="photoIn"></label>
          ${b.photoUrl ? '<button type="button" class="back-link" id="photoRm">Remove</button>' : '<span class="note">Optional. Without one, your initials appear.</span>'}</div></div>
        <div class="field"><span>Badge finish</span><div class="swatches" role="radiogroup" aria-label="Badge finish">${C.finishes.map(f => `<button type="button" class="swatch" role="radio" aria-checked="${f.id === b.finish}" data-f="${f.id}"><i style="background:linear-gradient(135deg,${f.bg[0]},${f.bg[1]})"></i>${f.name}</button>`).join('')}</div></div>
        <div class="field"><span>Ask me about <em style="font-style:normal;text-transform:none;letter-spacing:0;font-weight:500">(pick up to 3)</em></span><div class="chips">${C.interests.map(x => `<button type="button" aria-pressed="${b.interests.includes(x)}" data-i="${x}">${x}</button>`).join('')}</div></div>
        ${S.badges.length > 1 ? '<div><button type="button" class="chip-btn" id="copyAll">Use this organisation and finish on every badge</button></div>' : ''}
      </div>
      <p class="err" id="err" role="alert"></p>`;
    const upd = () => { preview(); const t = $(`[data-tab="${S.cur}"]`, main); if (t) t.innerHTML = tab(b, S.cur).replace(/^<button[^>]*>|<\/button>$/g, ''); };
    $('#bf').addEventListener('input', e => { const n = e.target.name; if (!n) return; b[n] = e.target.value; e.target.removeAttribute('aria-invalid'); b._bad = false; upd(); });
    $('#bf').addEventListener('change', e => { if (e.target.name === 'country') { b.country = e.target.value; upd(); } });
    $$('[data-f]', main).forEach(x => x.addEventListener('click', () => { b.finish = x.dataset.f; $$('[data-f]', main).forEach(y => y.setAttribute('aria-checked', y === x)); upd(); stage.swing(.5); }));
    $$('[data-i]', main).forEach(x => x.addEventListener('click', () => {
      const v = x.dataset.i, has = b.interests.includes(v);
      if (has) b.interests = b.interests.filter(y => y !== v); else if (b.interests.length < 3) b.interests.push(v); else { b.interests.shift(); b.interests.push(v); }
      $$('[data-i]', main).forEach(y => y.setAttribute('aria-pressed', b.interests.includes(y.dataset.i))); upd();
    }));
    $('#photoIn').addEventListener('change', e => {
      const f = e.target.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => { const im = new Image(); im.onload = () => {
        const s = Math.min(1, 640 / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        b.photo = c; b.photoUrl = c.toDataURL('image/jpeg', .85); render(); preview(); stage.swing(.4);
      }; im.src = r.result; };
      r.readAsDataURL(f);
    });
    const rm = $('#photoRm'); if (rm) rm.addEventListener('click', () => { b.photo = null; b.photoUrl = ''; render(); preview(); });
    $$('[data-tab]', main).forEach(t => t.addEventListener('click', () => { S.cur = +t.dataset.tab; render(); preview(); stage.swing(.4); }));
    const cp = $('#copyAll'); if (cp) cp.addEventListener('click', () => { S.badges.forEach(x => { if (!x.org) x.org = b.org; x.finish = b.finish; }); cp.textContent = 'Copied to every badge'; });
    barHTML('Back', () => {
      let first = -1;
      S.badges.forEach((x, i) => { x._bad = !x.first.trim() || !x.last.trim() || !x.org.trim() || !emailOk(x.email); if (x._bad && first < 0) first = i; });
      if (first > -1) {
        if (first !== S.cur) { S.cur = first; render(); preview(); }
        const x = S.badges[first];
        $$('#bf [required]').forEach(i => { const bad = !i.value.trim() || (i.type === 'email' && !emailOk(i.value)); i.setAttribute('aria-invalid', bad); });
        $('#err').textContent = `Badge ${first + 1} needs a first name, last name, organisation and a valid email.`;
        const f = $('#bf [aria-invalid="true"]'); if (f) f.focus();
        return;
      }
      go(3);
    }, 'Review badges');
  }

  /* step 3: review */
  function thumb(b, qr) {
    const big = document.createElement('canvas'); big.width = 1024; big.height = 1536;
    B.drawFront(big.getContext('2d'), b, { qr });
    const c = document.createElement('canvas'); c.width = 300; c.height = 450;
    const x = c.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(big, 0, 0, 300, 450);
    return c;
  }
  function step3() {
    const t = totals();
    main.innerHTML = `<h2>Review your badges</h2><p>Check every name and spelling. This is exactly how the badges will print. Tap one to see it on the lanyard.</p>
      <div class="review-grid" id="rg">${S.badges.map((b, i) => `<div class="rv" role="button" tabindex="0" aria-pressed="${i === S.cur}" data-rv="${i}"><span class="th"></span><b>${esc(b.first)} ${esc(b.last)}</b><small>${esc(label(b).toLowerCase())}${b.org ? ', ' + esc(b.org) : ''}</small><br><button type="button" class="edit" data-edit="${i}">Edit badge</button></div>`).join('')}</div>
      <h3>Order</h3>
      <ul class="lines">${t.lines.map(l => `<li><span>${l.qty} &times; ${esc(l.p.name)}</span><span>${U.fmt(l.sum)}</span></li>`).join('')}
        ${t.group ? `<li class="disc"><span>Group rate (${Math.round(C.groupDiscount * 100)}%)</span><span>&minus;${U.fmt(t.group)}</span></li>` : ''}
        ${t.promo ? `<li class="disc"><span>Code ${esc(S.promo.code)}</span><span>&minus;${U.fmt(t.promo)}</span></li>` : ''}
        <li class="tot"><span>Total</span><span>${U.fmt(t.total)}</span></li></ul>
      ${t.total ? `<p class="note">Includes VAT of ${U.fmt(t.vat)}.</p>` : '<p class="note">Young Leaders places are free for students. Bring a valid student card to registration.</p>'}
      <form class="promo" id="promo"><label class="sr-only" for="pc">Promo code</label><input id="pc" placeholder="Promo code" value="${esc(S.promo ? S.promo.code : '')}"><button class="chip-btn" type="submit">Apply</button></form>
      <p class="note" id="pm"></p>`;
    B.ready.then(() => $$('[data-rv]', main).forEach(el => { const i = +el.dataset.rv; el.querySelector('.th').replaceWith(Object.assign(thumb(S.badges[i]), { style: 'width:100%;height:auto;border-radius:10px;margin-bottom:.6rem' })); }));
    $('#rg').addEventListener('click', e => {
      const ed = e.target.closest('[data-edit]'); if (ed) { S.cur = +ed.dataset.edit; go(2); return; }
      const r = e.target.closest('[data-rv]'); if (!r) return;
      S.cur = +r.dataset.rv; $$('[data-rv]', main).forEach(x => x.setAttribute('aria-pressed', x === r)); preview(); stage.flip(false); stage.swing(.5);
    });
    $('#promo').addEventListener('submit', e => {
      e.preventDefault(); const code = $('#pc').value.trim().toUpperCase(), rate = C.promoCodes[code];
      if (!code) { S.promo = null; render(); return; }
      if (rate) { S.promo = { code, rate }; render(); $('#pm').textContent = `Code ${code} applied.`; }
      else { S.promo = null; $('#pm').textContent = `${code} isn't a valid code. Check the spelling and try again.`; $('#pm').style.color = '#ff9d8f'; }
    });
    barHTML('Back', () => go(4), t.total ? 'Continue to payment' : 'Continue');
  }

  /* step 4: pay */
  function step4() {
    if (!C.paymentMethods.some(x => x.id === S.method)) S.method = C.paymentMethods[0].id;
    const t = totals(), b0 = S.badges[0], free = !t.total, m = free ? 'free' : S.method, by = S.buyer, mob = m === 'orange' || m === 'myzaka';
    main.innerHTML = `<h2>${free ? 'Confirm your place' : 'Payment'}</h2><p>${free ? 'Last step. Nothing to pay: Young Leaders places are free for students.' : 'Last step. Your badges are saved and printed once payment is confirmed.'}</p>
      ${C.paymentMode === 'demo' && !free ? '<p class="demo"><b>Demo checkout.</b> No payment is taken and no card details are asked for. Connect a payment provider to go live.</p>' : ''}
      <h3>Booking contact</h3>
      <label class="check" style="margin:0 0 1rem"><input type="checkbox" id="same" ${by.same ? 'checked' : ''}> <span>Use ${esc(b0.first)} ${esc(b0.last)} (${esc(b0.email)})</span></label>
      <div class="form-grid" id="buyer">
        ${by.same ? '' : `<div class="row"><label class="field"><span>Full name</span><input name="name" value="${esc(by.name)}" autocomplete="name" required></label><label class="field"><span>Email</span><input name="email" type="email" value="${esc(by.email)}" autocomplete="email" required></label></div>`}
        <div class="row"><label class="field"><span>Mobile number</span><input name="phone" type="tel" value="${esc(by.phone)}" autocomplete="tel" placeholder="+267" required></label>
        <label class="field"><span>Company</span><input name="company" value="${esc(by.company || b0.org)}" autocomplete="organization"></label></div>
      </div>
      ${free ? '' : `<h3>${C.paymentMethods.length > 1 ? 'How would you like to pay?' : 'Pay by card'}</h3>`}
      ${free ? '' : C.paymentMethods.length > 1 ? `<div class="methods" role="radiogroup">${C.paymentMethods.map(x => `<label class="method"><input type="radio" name="method" value="${x.id}" ${x.id === m ? 'checked' : ''}><span><b>${x.name}</b><small>${x.note}</small></span></label>`).join('')}</div>` : '<div class="cards" aria-hidden="true"><span>VISA</span><span>Mastercard</span></div>'}
      ${mob ? `<label class="field"><span>${m === 'orange' ? 'Orange Money' : 'MyZaka'} number</span><input name="mobile" type="tel" value="${esc(S.mobile || by.phone)}" required></label><p class="note" style="margin-top:.5rem">You'll get a prompt on this phone to approve ${U.fmt(t.total)}.</p>` : ''}
      ${m === 'invoice' ? `<div class="form-grid"><div class="row"><label class="field"><span>Company name for invoice</span><input name="invCo" value="${esc(by.invCo || by.company || b0.org)}" required></label><label class="field"><span>Tax number (TIN)</span><input name="tin" value="${esc(by.tin)}" placeholder="Optional"></label></div>
        <label class="field"><span>Billing address</span><textarea name="address" rows="2" required>${esc(by.address)}</textarea></label></div><p class="note" style="margin-top:.5rem">We'll email a proforma invoice. Badges activate once payment reflects; invoices are payable within 7 days.</p>` : ''}
      ${m === 'card' ? '<p class="note">You’ll enter card details on the payment provider’s secure page, then come straight back here.</p>' : ''}
      <label class="check"><input type="checkbox" id="terms" ${S.terms ? 'checked' : ''}> <span>I agree to the booking terms. Badges are named and can be transferred to a colleague before the summit.</span></label>
      <p class="err" id="err" role="alert"></p>`;
    const keep = () => {
      $$('#reg-main input, #regMain input, #regMain textarea').forEach(i => { if (['name', 'email', 'phone', 'company', 'tin', 'address', 'invCo'].includes(i.name)) by[i.name] = i.value.trim(); if (i.name === 'mobile') S.mobile = i.value.trim(); });
      by.same = $('#same').checked; S.terms = $('#terms').checked;
    };
    $('#same').addEventListener('change', () => { keep(); render(); });
    $$('[name=method]', main).forEach(r => r.addEventListener('change', () => { keep(); S.method = r.value; render(); $(`[name=method][value=${r.value}]`, main).focus(); }));
    barHTML('Back', () => {
      keep();
      const bad = $$('[required]', main).filter(i => { const x = !i.value.trim() || (i.type === 'email' && !emailOk(i.value)); i.setAttribute('aria-invalid', x); return x; });
      if (bad.length) { $('#err').textContent = 'Fill in the highlighted fields to continue.'; bad[0].focus(); return; }
      if (!S.terms) { $('#err').textContent = 'Agree to the booking terms to continue.'; $('#terms').focus(); return; }
      pay();
    }, free ? 'Confirm free registration' : m === 'invoice' ? 'Request invoice' : `Pay ${U.fmt(t.total)}`);
  }

  function ref() {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', r = crypto.getRandomValues(new Uint8Array(6));
    return 'FOM27-' + Array.from(r, v => a[v % a.length]).join('');
  }
  async function pay() {
    const t = totals(), by = S.buyer, b0 = S.badges[0];
    const order = {
      ref: ref(), created: new Date().toISOString(), method: t.total ? S.method : 'free', mobile: S.mobile, currency: 'BWP',
      buyer: { name: by.same ? `${b0.first} ${b0.last}` : by.name, email: by.same ? b0.email : by.email, phone: by.phone, company: by.company, invoiceCompany: by.invCo, tin: by.tin, address: by.address },
      items: t.lines.map(l => ({ id: l.p.id, name: l.p.name, qty: l.qty, unit: l.p.price })),
      discounts: { group: Math.round(t.group), promo: Math.round(t.promo), code: S.promo && S.promo.code },
      total: Math.round(t.total), vat: Math.round(t.vat),
      badges: S.badges.map(b => ({ type: label(b), pass: b.passId, booth: b.boothId, first: b.first, last: b.last, title: b.title, org: b.org, email: b.email, country: b.country, finish: b.finish, interests: b.interests, hasPhoto: !!b.photo }))
    };
    const ov = document.createElement('div'); ov.className = 'processing'; ov.setAttribute('role', 'status');
    ov.innerHTML = `<div><div class="spinner"></div><p>${{ free: 'Confirming your place', card: 'Opening the secure payment page', orange: 'Waiting for you to approve on your phone', myzaka: 'Waiting for you to approve on your phone', invoice: 'Preparing your proforma invoice' }[order.method]}</p></div>`;
    $('.reg-panel').appendChild(ov);
    if (C.paymentMode === 'live') {
      try {
        const r = await fetch(C.paymentEndpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) });
        const j = await r.json(); if (!r.ok) throw 0;
        if (order.method !== 'invoice' && order.method !== 'free' && j.redirectUrl) { location.href = j.redirectUrl; return; }
      } catch (e) { ov.remove(); $('#err').textContent = "We couldn't start the payment. Try again, or choose company invoice."; return; }
    }
    setTimeout(async () => {
      S.order = order;
      S.qr = await Promise.all(S.badges.map((b, i) => new Promise(res => {
        if (typeof window.qrcode !== 'function') return res(null);
        const q = window.qrcode(0, 'M'); q.addData(`${order.ref}-${String(i + 1).padStart(2, '0')}|${b.first} ${b.last}|${label(b)}`); q.make();
        const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = q.createDataURL(6, 0);
      })));
      ov.remove(); S.cur = 0; go(5); stage.flip(false); stage.swing(1.2);
    }, C.paymentMode === 'demo' ? 1900 : 200);
  }

  /* step 5: done */
  function badgeCanvas(i) { const c = document.createElement('canvas'); c.width = 1024; c.height = 1536; B.drawFront(c.getContext('2d'), S.badges[i], { qr: S.qr[i] }); return c; }
  function download(i) {
    const b = S.badges[i], name = `FOM27-badge-${(b.first + '-' + b.last).replace(/[^a-z0-9-]+/gi, '').toLowerCase() || i + 1}.png`;
    try {
      badgeCanvas(i).toBlob(bl => { const a = document.createElement('a'); a.href = URL.createObjectURL(bl); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }, 'image/png');
    } catch (e) { $('#err').textContent = 'Your browser blocked the download here. Open the site from its web address to download badges.'; }
  }
  function step5() {
    const o = S.order, inv = o.method === 'invoice';
    main.innerHTML = `<div class="done-badge"><span class="tick"><svg width="28" height="28" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <div><h2 style="margin:0">${inv ? 'Invoice requested' : "You're registered"}</h2><span class="done-ref">${o.ref}</span></div></div>
      ${C.paymentMode === 'demo' && o.total ? '<p class="demo"><b>Demo booking.</b> No money moved. In live mode this appears after the payment provider confirms payment.</p>' : ''}
      ${inv ? `<p class="invoice">A proforma invoice for <b>${U.fmt(o.total)}</b> is on its way to ${esc(o.buyer.email)}. Use <b>${o.ref}</b> as the payment reference. Badges activate once payment reflects.</p>`
            : `<p style="color:var(--fg-2)">${o.total ? 'Receipt' : 'Confirmation'} sent to <b style="color:var(--fg)">${esc(o.buyer.email)}</b>. Each person also gets their badge and QR code by email. Show the QR at registration and your printed badge will be waiting.</p>`}
      <div class="done-actions">
        <button class="btn btn-gold btn-sm" type="button" id="dl1">Download this badge</button>
        ${S.badges.length > 1 ? '<button class="btn btn-ghost btn-sm" type="button" id="dlAll">Download all badges</button>' : ''}
        <button class="btn btn-ghost btn-sm" type="button" id="ics">Add to calendar</button>
      </div>
      <div class="review-grid" id="rg">${S.badges.map((b, i) => `<div class="rv" role="button" tabindex="0" aria-pressed="${i === S.cur}" data-rv="${i}"><span class="th"></span><b>${esc(b.first)} ${esc(b.last)}</b><small>${esc(label(b).toLowerCase())}</small></div>`).join('')}</div>
      <p class="err" id="err" role="alert"></p>`;
    $$('[data-rv]', main).forEach(el => { const i = +el.dataset.rv; el.querySelector('.th').replaceWith(Object.assign(thumb(S.badges[i], S.qr[i]), { style: 'width:100%;height:auto;border-radius:10px;margin-bottom:.6rem' })); });
    $('#rg').addEventListener('click', e => { const r = e.target.closest('[data-rv]'); if (!r) return; S.cur = +r.dataset.rv; $$('[data-rv]', main).forEach(x => x.setAttribute('aria-pressed', x === r)); preview(); stage.flip(false); stage.swing(.5); });
    $('#dl1').addEventListener('click', () => download(S.cur));
    const all = $('#dlAll'); if (all) all.addEventListener('click', () => S.badges.forEach((b, i) => setTimeout(() => download(i), i * 400)));
    $('#ics').addEventListener('click', () => {
      const d = iso => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
      const body = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//The Projects//FOM Summit//EN', 'BEGIN:VEVENT', `UID:${o.ref}@futureofminingbw.com`, `DTSTAMP:${d(new Date().toISOString())}`, `DTSTART:${d(C.eventStart)}`, `DTEND:${d(C.eventEnd)}`, 'SUMMARY:The Future of Mining Summit 2027', `LOCATION:${C.venueLabel}`, `DESCRIPTION:Booking ${o.ref}. Bring your badge QR code to registration.`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
      const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([body], { type: 'text/calendar' })); a.download = 'future-of-mining-summit-2027.ics'; document.body.appendChild(a); a.click(); a.remove();
    });
    barHTML(null, close, 'Back to the site');
  }

  window.FOMReg = { open, close, get stage() { return stage; } };
})();
