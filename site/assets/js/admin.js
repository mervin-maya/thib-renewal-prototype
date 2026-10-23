/* THIB staff admin — prototype interactions. Auth is simulated. */

(function () {
  var login = document.getElementById('login');
  var admin = document.getElementById('admin');
  var step1 = document.getElementById('login-step-1');
  var step2 = document.getElementById('login-step-2');
  var otpInputs = Array.prototype.slice.call(document.querySelectorAll('#staff-otp input'));

  /* ---- sign in ---- */
  document.getElementById('login-next').addEventListener('click', function () {
    step1.hidden = true;
    step2.hidden = false;
    otpInputs[0].focus();
  });

  document.getElementById('login-back').addEventListener('click', function () {
    step2.hidden = true;
    step1.hidden = false;
  });

  otpInputs.forEach(function (input, i) {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '');
      this.classList.toggle('is-filled', this.value !== '');
      if (this.value && i < otpInputs.length - 1) otpInputs[i + 1].focus();
    });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Backspace' && !this.value && i > 0) otpInputs[i - 1].focus();
    });
  });

  document.getElementById('login-verify').addEventListener('click', function () {
    login.style.display = 'none';
    admin.classList.add('is-on');
    window.scrollTo(0, 0);
  });

  document.getElementById('staff-signout').addEventListener('click', function () {
    admin.classList.remove('is-on');
    login.style.display = '';
    step2.hidden = true;
    step1.hidden = false;
    otpInputs.forEach(function (i) { i.value = ''; i.classList.remove('is-filled'); });
    window.scrollTo(0, 0);
  });

  /* ---- view switching ---- */
  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[data-av]');
    if (!link) return;
    e.preventDefault();
    var name = link.dataset.av;
    document.querySelectorAll('.tha-view').forEach(function (v) {
      v.classList.toggle('is-on', v.dataset.av === name);
    });
    document.querySelectorAll('.tha-side__link').forEach(function (l) {
      l.classList.toggle('is-active', l.dataset.av === name);
    });
    document.getElementById('side').classList.remove('is-open');
    window.scrollTo(0, 0);
  });

  /* ---- detail drawer ---- */
  var drawer = document.getElementById('drawer');
  var scrim = document.getElementById('scrim');

  function closeDrawer() {
    drawer.classList.remove('is-open');
    scrim.classList.remove('is-open');
    document.querySelectorAll('.tha-table tbody tr').forEach(function (r) { r.classList.remove('is-sel'); });
  }

  document.addEventListener('click', function (e) {
    var row = e.target.closest('.tha-table tbody tr');
    if (row && row.dataset.open) {
      var name = row.querySelector('.tha-table__client b');
      var sub = row.querySelector('.tha-table__client span');
      if (name) document.getElementById('d-name').textContent = name.textContent.replace('Business', '').trim();
      if (sub) {
        var expiry = row.children[1] ? row.children[1].textContent.trim() : '';
        document.getElementById('d-sub').textContent =
          sub.textContent + (expiry && expiry !== 'Renewed' ? ' · expires ' + expiry : ' · renewed');
      }
      document.querySelectorAll('.tha-table tbody tr').forEach(function (r) { r.classList.remove('is-sel'); });
      row.classList.add('is-sel');
      drawer.classList.add('is-open');
      scrim.classList.add('is-open');
      drawer.scrollTop = 0;
    }
  });

  document.getElementById('d-close').addEventListener('click', closeDrawer);
  scrim.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeDrawer();
  });

  /* ---- new client sign-ups, read from the demo bridge the portal writes ---- */
  var TODAY = new Date('2026-10-23');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fmtDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function addDays(iso, n) { var d = new Date(iso); d.setDate(d.getDate() + n); return d; }
  function daysLeft(iso) { return Math.round((new Date(iso) - TODAY) / 864e5); }
  function initials(name) { return name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase(); }
  function readSignups() { try { return JSON.parse(localStorage.getItem('thib.signups') || '[]'); } catch (e) { return []; } }
  function writeSignups(list) { try { localStorage.setItem('thib.signups', JSON.stringify(list)); } catch (e) {} }

  var drawerBody = document.querySelector('.tha-drawer__body');
  var staticDrawer = drawerBody.innerHTML;

  function signupCard(s) {
    var v = s.vehicle || {}, rt = s.roadTax, when = new Date(s.createdAt);
    var idp = s.idp ? ' &middot; verified by ' + (s.idp === 'corppass' ? 'Corppass' : 'Singpass') : '';
    if (s.type === 'business') {
      var lead = s.lead || 90, lines = (s.lines || []).map(function (l) { return l.line + (l.count ? ' (' + l.count + ')' : ''); }).join(', ');
      return '<div class="tha-signup" data-signup="' + esc(s.id) + '">' +
        '<div class="tha-av tha-av--4">' + esc(initials(s.company.name)) + '</div>' +
        '<div class="tha-signup__main">' +
          '<b>' + esc(s.company.name) + ' <span class="tha-tag">Business</span> <span class="th-chip th-chip--warn"><span class="th-chip__dot"></span>New client</span></b>' +
          '<span>' + esc(s.name) + ', ' + esc(s.company.role) + ' &middot; ' + esc(s.email || 'no email') + ' &middot; +65 ' + esc(s.mobile) + (s.company.uen ? ' &middot; UEN ' + esc(s.company.uen) : '') + idp + ' &middot; signed up ' + esc(when.toLocaleDateString('en-SG', { day: '2-digit', month: 'short' })) + ' &middot; reminders by ' + esc(s.channel) + (s.consent ? ', consent recorded' : ', <b>no consent</b>') + '</span>' +
          '<div class="tha-signup__facts">' +
            '<div><small>Cover wanted</small>' + esc(lines || 'to confirm') + '</div>' +
            '<div><small>Insurance</small>' + esc(s.ins.insurer) + ' expires ' + esc(fmtDate(s.ins.expiry)) + ' &middot; email ' + esc(fmtDate(addDays(s.ins.expiry, -lead))) + ' and ' + esc(fmtDate(addDays(s.ins.expiry, -Math.max(30, lead - 30)))) + '</div>' +
            '<div><small>Copied</small>' + esc(s.ccAccounts && s.company.accounts ? s.company.accounts : 'nobody yet') + (s.callOk ? ' &middot; call OK after 14 days' : '') + '</div>' +
          '</div></div>' +
        '<div class="tha-signup__actions">' +
          '<button class="th-btn th-btn--primary" data-verify="' + esc(s.id) + '" data-then="compose" style="padding:9px 16px;font-size:14px;">Email the contact</button>' +
          '<button class="th-btn th-btn--ghost" data-verify="' + esc(s.id) + '" style="padding:9px 16px;font-size:14px;">View details</button>' +
          '<button class="th-btn th-btn--ghost" data-onboard="' + esc(s.id) + '" style="padding:9px 16px;font-size:14px;">Mark as onboarded</button>' +
        '</div></div>';
    }
    var wa = 'https://wa.me/65' + String(s.mobile).replace(/\D/g, '') + '?text=' + encodeURIComponent('Hi ' + s.name.split(' ')[0] + ', this is Eileen from TH Insurance Brokers. Thanks for signing up. I have your ' + (v.model || 'vehicle') + ' on file and will be in touch before your ' + (s.ins && s.ins.insurer ? s.ins.insurer + ' ' : '') + 'policy renews.');
    return '<div class="tha-signup" data-signup="' + esc(s.id) + '">' +
      '<div class="tha-av">' + esc(initials(s.name)) + '</div>' +
      '<div class="tha-signup__main">' +
        '<b>' + esc(s.name) + ' <span class="th-chip th-chip--warn"><span class="th-chip__dot"></span>New client</span></b>' +
        '<span>+65 ' + esc(s.mobile) + (s.email ? ' &middot; ' + esc(s.email) : '') + ' &middot; signed up ' + esc(when.toLocaleDateString('en-SG', { day: '2-digit', month: 'short' })) + ', ' + esc(when.toLocaleTimeString('en-SG', { hour: 'numeric', minute: '2-digit' }).toLowerCase()) + idp + ' &middot; reminders by ' + esc(s.channel) + (s.consent ? ', consent recorded' : ', <b>no consent</b>') + '</span>' +
        '<div class="tha-signup__facts">' +
          '<div><small>Vehicle</small>' + esc(v.plate || '') + (v.model ? ' &middot; ' + esc(v.model) : '') + (v.cc ? ' &middot; ' + esc(Number(v.cc).toLocaleString('en-SG')) + 'cc' : '') + '</div>' +
          '<div><small>Insurance</small>' + esc(s.ins.insurer) + ' expires ' + esc(fmtDate(s.ins.expiry)) + ' &middot; reminder ' + esc(fmtDate(addDays(s.ins.expiry, -60))) + '</div>' +
          '<div><small>Road tax</small>' + (v.rt ? 'expires ' + esc(fmtDate(v.rt)) + ' &middot; ' : '') + (rt ? 'S$' + rt.twelve + ' / S$' + rt.six : 'amount to confirm') + ' &middot; ' + (s.rtChoice === 'thib' ? 'THIB renews' : 'client renews') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="tha-signup__actions">' +
        '<button class="th-btn th-btn--primary" data-verify="' + esc(s.id) + '" style="padding:9px 16px;font-size:14px;">Verify log card</button>' +
        '<a class="th-btn th-btn--ghost" href="' + wa + '" target="_blank" rel="noopener" style="padding:9px 16px;font-size:14px;">Say hello on WhatsApp</a>' +
        '<button class="th-btn th-btn--ghost" data-onboard="' + esc(s.id) + '" style="padding:9px 16px;font-size:14px;">Mark as onboarded</button>' +
      '</div></div>';
  }

  function isNew(s) { return (s.status || 'new') === 'new'; }
  function renderSignups() {
    var all = readSignups(), list = all.filter(isNew);
    document.querySelectorAll('[data-signups]').forEach(function (host) {
      host.innerHTML = list.length ? '<div class="tha-panel tha-panel--signups"><div class="tha-panel__head"><div><h2>New sign-ups</h2><p>From the client portal. Verify the log card, then say hello within one business day.</p></div><span class="th-chip th-chip--bad"><span class="th-chip__dot"></span>' + list.length + '</span></div><div class="tha-panel__body">' + list.map(signupCard).join('') + '</div></div>' : '';
    });
    /* renewals table rows */
    var tbody = document.querySelector('section[data-av="renewals"] .tha-table tbody');
    tbody.querySelectorAll('tr[data-signup-row]').forEach(function (r) { r.remove(); });
    all.slice().reverse().forEach(function (s) {
      var v = s.vehicle || {}, dl = daysLeft(s.ins.expiry), pct = Math.max(4, Math.min(96, Math.round((1 - dl / 120) * 100)));
      var tag = isNew(s) ? '<span class="tha-tag">New</span>' : '';
      var tr = document.createElement('tr');
      tr.setAttribute('data-open', 'signup'); tr.setAttribute('data-signup-row', s.id); tr.dataset.status = 'reminder';
      var biz = s.type === 'business', dispName = biz ? s.company.name : s.name, dispSub = biz ? ((s.lines && s.lines[0]) ? s.lines[0].line + (s.lines[0].count ? ', ' + s.lines[0].count : '') : 'business') : (v.plate || '');
      tr.innerHTML = '<td><div class="tha-table__client"><div class="tha-av' + (biz ? ' tha-av--4' : '') + '">' + esc(initials(dispName)) + '</div><div><b>' + esc(dispName) + (biz ? '<span class="tha-tag">Business</span>' : '') + tag + '</b><span>' + esc(dispSub) + (isNew(s) ? '' : ' &middot; joined ' + esc(fmtDate(s.createdAt))) + '</span></div></div></td>' +
        '<td>' + esc(fmtDate(s.ins.expiry)) + '</td><td><div class="tha-due">' + dl + ' days<div class="tha-due__bar"><i style="width:' + pct + '%"></i></div></div></td>' +
        '<td><span class="th-chip"><span class="th-chip__dot"></span>Reminder scheduled</span></td><td>&mdash;</td>' +
        '<td><svg class="tha-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></td>';
      tbody.insertBefore(tr, tbody.firstChild);
    });
    /* road tax group rows */
    var rtTables = document.querySelectorAll('section[data-av="roadtax"] .tha-table tbody');
    rtTables.forEach(function (tb) { tb.querySelectorAll('tr[data-signup-row]').forEach(function (r) { r.remove(); }); });
    all.slice().reverse().forEach(function (s) {
      var v = s.vehicle || {}; if (s.type === 'business' || !v.rt) return;
      var tb = rtTables[s.rtChoice === 'thib' ? 0 : 1]; if (!tb) return;
      var tr = document.createElement('tr'); tr.setAttribute('data-signup-row', s.id);
      tr.innerHTML = '<td><div class="tha-table__client"><div class="tha-av">' + esc(initials(s.name)) + '</div><div><b>' + esc(s.name) + (isNew(s) ? '<span class="tha-tag">New</span>' : '') + '</b><span>' + (s.roadTax ? 'S$' + s.roadTax.twelve + ' / S$' + s.roadTax.six + ' from log card' : 'amount to confirm') + '</span></div></div></td>' +
        '<td><b>' + esc(v.plate || '') + '</b></td><td>' + esc(fmtDate(v.rt)) + '</td><td><span class="th-chip"><span class="th-chip__dot"></span>Scheduled</span></td>' +
        '<td><svg class="tha-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></td>';
      tb.insertBefore(tr, tb.firstChild);
    });
    /* sidebar + pipeline counts */
    var base = 3, count = document.querySelector('.tha-side__link[data-av="renewals"] .tha-side__count');
    if (count) count.textContent = base + list.length;
    var allTab = document.querySelector('.tha-pipe__tab[data-status="all"] b'); if (allTab) allTab.textContent = 11 + all.length;
    var remTab = document.querySelector('.tha-pipe__tab[data-status="reminder"] b'); if (remTab) remTab.textContent = 4 + all.length;
    /* Clients view: everyone who signed up, newest first, with where they are in onboarding */
    var ct = document.getElementById('clients-total'); if (ct) ct.textContent = (412 + all.length).toLocaleString('en-SG');
    var cs = document.getElementById('clients-split'); if (cs) cs.textContent = (368 + all.length) + ' individual, 44 business';
    if (typeof renderDirectory === 'function' && typeof BOOK !== 'undefined' && BOOK) { renderDirectory(); if (typeof TEMPLATES !== 'undefined' && TEMPLATES) renderInbox(); }  /* BOOK and TEMPLATES are built later in this file; skip on first paint */
    var host = document.querySelector('[data-clients]');
    var empty = '<div class="tha-panel"><div class="tha-panel__head"><div><h2>Recent clients</h2><p>Signed up through the client portal</p></div></div><div class="tha-panel__body" style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;"><div style="flex:1;min-width:260px;"><b style="font-family:var(--th-display);font-size:16px;letter-spacing:-0.02em;display:block;">No sign-ups in this browser yet</b><p style="font-size:14px;color:var(--th-mute);margin-top:4px;line-height:1.55;">Open the client portal, choose <b>Create your account</b>, and the client appears here the moment they finish, with their log card, insurer and road tax.</p></div><a class="th-btn th-btn--primary" href="portal.html#new" target="_blank" rel="noopener" style="padding:10px 18px;font-size:14px;">Open the client sign-up</a></div></div>';
    if (host) host.innerHTML = all.length ? '<div class="tha-panel"><div class="tha-panel__head"><div><h2>Recent clients</h2><p>Signed up through the client portal</p></div></div><table class="tha-table"><thead><tr><th>Client</th><th>Vehicle</th><th>Insurance</th><th>Status</th><th>Joined</th><th></th></tr></thead><tbody>' +
      all.map(function (s) { var v = s.vehicle || {}; return '<tr data-signup-row="' + esc(s.id) + '"><td><div class="tha-table__client"><div class="tha-av">' + esc(initials(s.name)) + '</div><div><b>' + esc(s.name) + '</b><span>+65 ' + esc(s.mobile) + '</span></div></div></td><td><b>' + esc(v.plate || '') + '</b><br><span style="font-size:12.5px;color:var(--th-mute);">' + esc(v.model || '') + '</span></td><td>' + esc(s.ins.insurer) + '<br><span style="font-size:12.5px;color:var(--th-mute);">expires ' + esc(fmtDate(s.ins.expiry)) + '</span></td><td>' + (isNew(s) ? '<span class="th-chip th-chip--warn"><span class="th-chip__dot"></span>New, to verify</span>' : '<span class="th-chip th-chip--ok"><span class="th-chip__dot"></span>Onboarded</span>') + '</td><td>' + esc(fmtDate(s.createdAt)) + '</td><td><svg class="tha-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></td></tr>'; }).join('') +
      '</tbody></table></div>' : empty;
  }

  function openSignupDrawer(s) {
    var v = s.vehicle || {}, rt = s.roadTax, biz = s.type === 'business';
    document.getElementById('d-name').textContent = biz ? s.company.name : s.name;
    document.getElementById('d-sub').textContent = (biz ? (s.name + ', ' + s.company.role) : (v.plate || '')) + ' · new client · ' + s.ins.insurer + ' expires ' + fmtDate(s.ins.expiry);
    drawerBody.innerHTML =
      '<div class="tha-drawer__sec"><h3>What the client sent</h3><dl class="tha-kv">' +
        '<dt>Mobile</dt><dd>+65 ' + esc(s.mobile) + ' (verified by code)</dd>' + (s.email ? '<dt>Email</dt><dd>' + esc(s.email) + '</dd>' : '') +
        '<dt>Reminders</dt><dd>' + esc(s.channel) + (s.consent ? ', consent recorded ' + esc(fmtDate(s.createdAt)) : ', no consent') + '</dd>' +
        '<dt>Current insurer</dt><dd>' + esc(s.ins.insurer) + ', NCD ' + esc(s.ins.ncd) + ', claims: ' + esc(s.ins.claims) + '</dd>' +
        '<dt>Policy expiry</dt><dd>' + esc(fmtDate(s.ins.expiry)) + ' &middot; reminder scheduled ' + esc(fmtDate(addDays(s.ins.expiry, -60))) + '</dd>' +
        (biz ? '' : '<dt>Road tax</dt><dd>' + (s.rtChoice === 'thib' ? 'THIB renews' : 'Client renews at LTA') + (v.rt ? ' &middot; expires ' + esc(fmtDate(v.rt)) : '') + '</dd>') + '</dl></div>' +
      (biz ? '<div class="tha-drawer__sec"><h3>Company</h3><dl class="tha-kv"><dt>Company</dt><dd>' + esc(s.company.name) + (s.company.uen ? ' \u00b7 UEN ' + esc(s.company.uen) : '') + '</dd><dt>Cover wanted</dt><dd>' + esc((s.lines || []).map(function (l) { return l.line + (l.count ? ' (' + l.count + ')' : ''); }).join(', ') || 'to confirm') + '</dd><dt>Accounts copy</dt><dd>' + esc(s.ccAccounts && s.company.accounts ? s.company.accounts : 'none') + '</dd><dt>Log cards</dt><dd>To request: one per vehicle, or a fleet list</dd></dl></div>' : '') +
      (biz ? '' : '<div class="tha-drawer__sec"><h3>Vehicle log card</h3><div class="tha-ai"><div class="tha-ai__head"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/></svg><b>Read from the client\'s upload</b><span>confirmed by client at sign-up</span></div><div class="tha-ai__body"><dl class="tha-kv">' +
        '<dt>Vehicle number</dt><dd>' + esc(v.plate) + '</dd><dt>Make and model</dt><dd>' + esc(v.model) + '</dd><dt>Propellant</dt><dd>' + esc(v.prop) + '</dd>' +
        (v.cc ? '<dt>Engine capacity</dt><dd>' + esc(Number(v.cc).toLocaleString('en-SG')) + 'cc</dd>' : '') + (v.kw ? '<dt>Power rating</dt><dd>' + esc(v.kw) + ' kW</dd>' : '') +
        '<dt>Original registration</dt><dd>' + esc(fmtDate(v.reg)) + '</dd><dt>COE expiry</dt><dd>' + esc(fmtDate(v.coe)) + '</dd><dt>Road tax expiry</dt><dd>' + esc(fmtDate(v.rt)) + '</dd></dl>' +
        (rt ? '<div class="tha-ai__row" style="margin-top:10px;border-top:1px solid var(--th-line-2);padding-top:12px;"><div><b>Road tax S$' + rt.six + ' / 6 months &middot; S$' + rt.twelve + ' / 12 months</b><small>Computed from the log card with LTA\'s formula' + (rt.surcharge ? ', including the ' + Math.round(rt.surcharge * 100) + '% age surcharge' : '') + '</small></div><span class="tha-conf">Computed</span></div>' : '') +
        '<div class="tha-ai__flag" style="border-left-color:var(--th-navy-2);"><b>Verify at LTA before collecting.</b> Copy plate: <b>' + esc(v.plate) + '</b></div>' +
        '<div style="display:flex;gap:9px;margin-top:14px;flex-wrap:wrap;"><button class="th-btn th-btn--primary" style="font-size:14px;padding:9px 16px;">Confirm log card</button><button class="th-btn th-btn--ghost" style="font-size:14px;padding:9px 16px;">Ask client to re-upload</button></div></div></div></div>') +
      '<div class="tha-drawer__sec"><h3>Activity</h3><div class="tha-log">' +
        (isNew(s) ? '' : '<div class="tha-log__item"><div class="tha-log__dot is-done"></div><div><b>Onboarded</b><span>' + esc(fmtDate(s.onboardedAt)) + ' \u00b7 log card verified, moved to Clients</span></div></div>') +
        '<div class="tha-log__item"><div class="tha-log__dot is-done"></div><div><b>Reminder scheduled</b><span>' + esc(fmtDate(addDays(s.ins.expiry, -60))) + ' · WhatsApp, Motor insurance</span></div></div>' +
        '<div class="tha-log__item"><div class="tha-log__dot is-done"></div><div><b>Signed up in the client portal</b><span>' + esc(fmtDate(s.createdAt)) + ' · log card uploaded, consent recorded</span></div></div></div></div>';
    attachEmail(ctxFromSignup(s));
    drawer.classList.add('is-open'); scrim.classList.add('is-open'); drawer.scrollTop = 0;
  }

  document.addEventListener('click', function (e) {
    var verify = e.target.closest('[data-verify]');
    if (verify) { var s = readSignups().find(function (x) { return x.id === verify.dataset.verify; }); if (s) { openSignupDrawer(s); if (verify.dataset.then === 'compose') { var cb = document.querySelector('[data-compose]'); if (cb) { cb.click(); document.getElementById('email-sec').scrollIntoView({ block: 'start' }); } } } return; }
    var onboard = e.target.closest('[data-onboard]');
    if (onboard) { writeSignups(readSignups().map(function (x) { if (x.id === onboard.dataset.onboard) { x.status = 'onboarded'; x.onboardedAt = new Date().toISOString(); } return x; })); renderSignups(); return; }
    var row = e.target.closest('tr[data-signup-row]');
    if (row) { var s2 = readSignups().find(function (x) { return x.id === row.getAttribute('data-signup-row'); }); if (s2) { e.stopImmediatePropagation(); document.querySelectorAll('.tha-table tbody tr').forEach(function (r) { r.classList.remove('is-sel'); }); row.classList.add('is-sel'); openSignupDrawer(s2); } }
  }, true);
  /* static rows restore the static drawer body */
  document.addEventListener('click', function (e) {
    var row = e.target.closest('.tha-table tbody tr');
    if (!row || row.hasAttribute('data-signup-row') || row.hasAttribute('data-client') || row.hasAttribute('data-inbox-open') || !row.dataset.open) return;
    drawerBody.innerHTML = staticDrawer;
    /* the static demo rows get an email thread too, built from what the row shows */
    var nm = (row.querySelector('.tha-table__client b') || {}).textContent || 'Client', sub = (row.querySelector('.tha-table__client span:not(.tha-tag)') || {}).textContent || '';
    nm = nm.replace(/Business|New/g, '').trim();
    var tagEl = row.querySelector('.tha-tag'), biz = /Pte Ltd/.test(nm) || !!(tagEl && /business/i.test(tagEl.textContent)), exp = row.children[1] ? row.children[1].textContent.trim() : '';
    if (typeof attachEmail === 'function') attachEmail({ id: 'static-' + row.dataset.open, kind: biz ? 'business' : 'personal', name: nm, company: biz ? nm : '', contact: biz ? 'the policy contact' : nm, email: (biz ? 'contact@' : nm.toLowerCase().replace(/[^a-z]+/g, '.') + '@') + (biz ? nm.toLowerCase().replace(/ pte ltd$/, '').replace(/[^a-z]+/g, '') + '.sg' : 'example.com'), cc: '', line: biz ? sub.split(',')[0] : 'Motor', insurer: 'MSIG', expiry: /\d{4}/.test(exp) ? new Date(exp) : addDays(TODAY, 60) });
  }, true);

  renderSignups();
  window.addEventListener('storage', function (e) { if (e.key === 'thib.signups') renderSignups(); });

  /* ---- top search: filters the rows of whichever view is open ---- */
  var search = document.querySelector('.tha-search input');
  search.addEventListener('input', function () {
    var q = search.value.trim().toLowerCase();
    if (document.querySelector('.tha-view.is-on').dataset.av === 'clients') { dir.q = q; dir.page = 1; renderDirectory(); }
    document.querySelectorAll('.tha-view.is-on .tha-table tbody tr').forEach(function (r) { if (!r.closest('[data-directory]')) r.hidden = q !== '' && r.innerText.toLowerCase().indexOf(q) === -1; });
  });

  /* ---- users & access (AD-01): staff accounts, roles, invitations ---- */
  var ROLES = { admin: 'Admin', manager: 'Manager', staff: 'Staff', accounts: 'Accounts' };
  var SEED_STAFF = [
    { id: 'u1', name: 'Eileen Goh', email: 'eileen@thib.com.sg', role: 'admin', dept: 'Management', status: 'active', owner: true, you: true, twofa: true, last: 'Signed in now' },
    { id: 'u2', name: 'Joyce Chua', email: 'joyce@thib.com.sg', role: 'admin', dept: 'Management', status: 'active', twofa: true, last: '21 Oct 2026' },
    { id: 'u3', name: 'Esabel Goh', email: 'esabel@thib.com.sg', role: 'manager', dept: 'Client relationships', status: 'active', twofa: true, last: '22 Oct 2026' },
    { id: 'u4', name: 'Mei Ling', email: 'meiling@thib.com.sg', role: 'staff', dept: 'Renewals team', status: 'active', twofa: true, last: '23 Oct 2026, 8.55am' },
    { id: 'u5', name: 'Xin Yee', email: 'xinyee@thib.com.sg', role: 'staff', dept: 'Motor insurance', status: 'active', twofa: true, last: '23 Oct 2026, 8.40am' },
    { id: 'u6', name: 'Elaine', email: 'elaine@thib.com.sg', role: 'staff', dept: 'Motor insurance', status: 'active', twofa: true, last: '22 Oct 2026' },
    { id: 'u7', name: 'Eunice', email: 'eunice@thib.com.sg', role: 'staff', dept: 'Motor insurance', status: 'active', twofa: true, last: '23 Oct 2026, 9.02am' },
    { id: 'u8', name: 'Weng Kuan', email: 'wengkuan@thib.com.sg', role: 'staff', dept: 'Business insurance', status: 'active', twofa: true, last: '20 Oct 2026' },
    { id: 'u9', name: 'Accounts (shared mailbox)', email: 'accounts@thib.com.sg', role: 'accounts', dept: 'Accounts and payments', status: 'invited', twofa: false, last: '—', invitedAt: '2026-10-21T02:00:00Z' }
  ];
  function readStaff() { try { var s = JSON.parse(localStorage.getItem('thib.staff.v2') || 'null'); return Array.isArray(s) && s.length ? s : SEED_STAFF.slice(); } catch (e) { return SEED_STAFF.slice(); } }
  function writeStaff(list) { try { localStorage.setItem('thib.staff.v2', JSON.stringify(list)); } catch (e) {} }

  function statusChip(u) {
    if (u.status === 'invited') return '<span class="th-chip th-chip--warn"><span class="th-chip__dot"></span>Invited, link sent</span>';
    if (u.status === 'deactivated') return '<span class="th-chip"><span class="th-chip__dot"></span>Deactivated</span>';
    return '<span class="th-chip th-chip--ok"><span class="th-chip__dot"></span>Active</span>';
  }
  function renderUsers() {
    var host = document.querySelector('[data-users]'); if (!host) return;
    var list = readStaff();
    var active = list.filter(function (u) { return u.status === 'active'; }).length, invited = list.filter(function (u) { return u.status === 'invited'; }).length;
    host.innerHTML = '<div class="tha-panel"><div class="tha-panel__head"><div><h2>Staff accounts</h2><p>' + active + ' active' + (invited ? ', ' + invited + ' invited' : '') + '. Only admins can change roles or deactivate.</p></div></div>' +
      '<table class="tha-table"><thead><tr><th>Person</th><th>Role</th><th>Department</th><th>Status</th><th>2FA</th><th>Last sign-in</th><th></th></tr></thead><tbody>' +
      list.map(function (u) {
        var locked = u.owner || u.you;
        var roleSel = '<select class="tha-users__role" data-role="' + esc(u.id) + '"' + (locked ? ' disabled' : '') + '>' + Object.keys(ROLES).map(function (k) { return '<option value="' + k + '"' + (u.role === k ? ' selected' : '') + '>' + ROLES[k] + (k === 'admin' && u.owner ? ' (owner)' : '') + '</option>'; }).join('') + '</select>';
        var actions = '';
        if (u.status === 'invited') actions = '<button data-user-act="resend" data-id="' + esc(u.id) + '">Resend</button><button class="is-danger" data-user-act="cancel" data-id="' + esc(u.id) + '">Cancel</button>';
        else if (u.status === 'deactivated') actions = '<button data-user-act="reactivate" data-id="' + esc(u.id) + '">Reactivate</button>';
        else if (!locked) actions = '<button data-user-act="reset2fa" data-id="' + esc(u.id) + '">Reset 2FA</button><button class="is-danger" data-user-act="deactivate" data-id="' + esc(u.id) + '">Deactivate</button>';
        else actions = '<span style="font-size:12.5px;color:var(--th-mute);">' + (u.owner && u.you ? 'Owner, your account' : u.owner ? 'Owner' : 'Your account') + '</span>';
        return '<tr><td><div class="tha-table__client"><div class="tha-av' + (u.status !== 'active' ? ' tha-av--5' : '') + '">' + esc(initials(u.name)) + '</div><div><b>' + esc(u.name) + (u.you ? '<span class="tha-users__you">You</span>' : '') + '</b><span>' + esc(u.email) + '</span></div></div></td>' +
          '<td>' + roleSel + '</td><td>' + esc(u.dept) + '</td><td>' + statusChip(u) + '</td>' +
          '<td>' + (u.twofa ? '<span class="th-chip th-chip--ok"><span class="th-chip__dot"></span>Enrolled</span>' : '<span class="th-chip"><span class="th-chip__dot"></span>Pending</span>') + '</td>' +
          '<td style="font-size:13.5px;color:var(--th-mute);white-space:nowrap;">' + esc(u.last) + '</td><td><div class="tha-users__actions">' + actions + '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  document.addEventListener('change', function (e) {
    var sel = e.target.closest('[data-role]'); if (!sel) return;
    writeStaff(readStaff().map(function (u) { if (u.id === sel.dataset.role) u.role = sel.value; return u; })); renderUsers();
  });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-user-act]'); if (!b) return;
    var act = b.dataset.userAct, id = b.dataset.id, list = readStaff();
    if (act === 'cancel') list = list.filter(function (u) { return u.id !== id; });
    else list = list.map(function (u) {
      if (u.id !== id) return u;
      if (act === 'deactivate') { u.status = 'deactivated'; }
      if (act === 'reactivate') { u.status = 'active'; }
      if (act === 'reset2fa') { u.twofa = false; }
      if (act === 'resend') { u.invitedAt = new Date().toISOString(); }
      return u;
    });
    writeStaff(list); renderUsers();
  });
  var inviteForm = document.getElementById('invite-form');
  document.getElementById('invite-btn').addEventListener('click', function () { inviteForm.hidden = false; document.getElementById('inv-name').focus(); });
  document.getElementById('inv-cancel').addEventListener('click', function () { inviteForm.hidden = true; });
  document.getElementById('inv-send').addEventListener('click', function () {
    var name = document.getElementById('inv-name').value.trim(), email = document.getElementById('inv-email').value.trim(), err = document.getElementById('inv-error');
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { err.hidden = false; return; }
    err.hidden = true;
    var list = readStaff();
    list.push({ id: 'u' + Date.now(), name: name, email: email, role: document.getElementById('inv-role').value, dept: document.getElementById('inv-dept').value, status: 'invited', twofa: false, last: '—', invitedAt: new Date().toISOString() });
    writeStaff(list); renderUsers();
    document.getElementById('inv-name').value = ''; document.getElementById('inv-email').value = ''; inviteForm.hidden = true;
  });
  renderUsers();

  /* ---- client directory: the whole book, personal and business, 50 a page ---- */
  var PAGE = 50;
  function rng(seed) { return function () { seed |= 0; seed = seed + 0x6D2B79F5 | 0; var t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  var SURNAMES = ['Tan', 'Lim', 'Lee', 'Ng', 'Ong', 'Wong', 'Goh', 'Chua', 'Chan', 'Koh', 'Teo', 'Ang', 'Yeo', 'Tay', 'Toh', 'Sim', 'Chong', 'Low', 'Foo', 'Heng', 'Seah', 'Phua', 'Quek', 'Loh', 'Kumar', 'Nair', 'Pillai', 'Rajan', 'Menon', 'Rahman', 'Ismail', 'Hassan', 'Abdullah', 'Zulkifli', 'Ramli', 'Fernandez', 'Pereira', 'D’Souza'];
  var GIVEN = ['Wei Ming', 'Hui Ling', 'Jun Hao', 'Jia Hui', 'Kai Xin', 'Zhi Hao', 'Li Ting', 'Yi Xuan', 'Xin Yi', 'Cheng Wei', 'Shu Fen', 'Boon Kiat', 'Siew Lian', 'Priya', 'Arun', 'Deepa', 'Vikram', 'Anita', 'Farhan', 'Nur Aisyah', 'Siti Nurul', 'Hafiz', 'Amirah', 'Daniel', 'Rachel', 'Grace', 'Kelvin', 'Joanne', 'Ravi', 'Henry', 'Melissa', 'Jason', 'Vincent', 'Serene', 'Alvin', 'Benjamin', 'Cheryl', 'Darren', 'Fiona', 'Gavin', 'Hazel', 'Ivan', 'Jasmine', 'Nicholas', 'Olivia', 'Terence', 'Wendy', 'Zachary'];
  var MODELS = ['Toyota Corolla Altis 1.6', 'Honda Vezel 1.5', 'Honda Civic 1.5', 'Mazda 3 1.5', 'Hyundai Avante 1.6', 'Toyota Sienta 1.5', 'Kia Cerato 1.6', 'Mercedes-Benz A200', 'BMW 318i', 'Toyota Harrier 2.0', 'Nissan Qashqai 1.2', 'Mitsubishi Attrage 1.2', 'BYD Atto 3', 'Tesla Model 3', 'Honda Fit 1.3', 'Toyota Vios 1.5', 'Subaru Forester 2.0', 'Volkswagen Golf 1.4', 'Audi A3 1.0', 'Hyundai Ioniq 5', 'Honda Odyssey 2.4', 'Toyota Alphard 2.5'];
  var INSURERS = ['MSIG', 'Income', 'AIG', 'Allianz', 'Direct Asia', 'EQ Insurance', 'ERGO', 'Great Eastern', 'QBE', 'Tokio Marine', 'Chubb', 'India International'];
  var CO_A = ['Lim & Sons', 'Orchid', 'Golden Harvest', 'Sunrise', 'Harbour', 'Jurong', 'Tampines', 'Bedok', 'Changi', 'Woodlands', 'Merlion', 'Pinnacle', 'Evergreen', 'Red Dot', 'Lion City', 'Straits', 'Kallang', 'Raffles', 'Marina', 'Sentosa', 'Ubi', 'Tuas', 'Kaki Bukit', 'Paya Lebar'];
  var CO_B = ['Logistics', 'Engineering', 'Trading', 'Catering', 'Builders', 'Marine Services', 'Clinic', 'Dental', 'Technologies', 'Holdings', 'Interiors', 'Renovation', 'Transport', 'Food Industries', 'Consultancy', 'Design Studio', 'Security', 'Cleaning Services', 'Education Centre', 'Motors', 'Freight', 'Landscape'];
  var LINES = [['Fleet motor', 'vehicles'], ['Employee benefits', 'staff'], ['Work injury compensation', 'staff'], ['Business package', ''], ['Marine cargo', ''], ['Professional indemnity', ''], ['Cyber liability', ''], ['Vehicles & equipment', 'units']];
  var ROLES_CO = ['Director', 'Finance manager', 'HR manager', 'Fleet manager', 'Office manager'];
  function pick(r, arr) { return arr[Math.floor(r() * arr.length)]; }
  function plate(r) { var L = 'ABCDEFGHJKLMNPRSTUVWXYZ'; return 'S' + L[Math.floor(r() * 23)] + L[Math.floor(r() * 23)] + ' ' + (1000 + Math.floor(r() * 9000)) + ' ' + L[Math.floor(r() * 23)]; }
  function dateFrom(r, minDays, maxDays) { var d = new Date(TODAY); d.setDate(d.getDate() + minDays + Math.floor(r() * (maxDays - minDays))); return d; }
  function buildBook() {
    var r = rng(20261023), personal = [], business = [], i;
    for (i = 0; i < 368; i++) {
      var exp = dateFrom(r, -40, 365), dl = Math.round((exp - TODAY) / 864e5);
      var status = dl < 0 ? 'lapsed' : dl <= 60 ? 'renewing' : 'active';
      personal.push({ kind: 'personal', id: 'p' + i, name: pick(r, GIVEN) + ' ' + pick(r, SURNAMES), mobile: (8 + Math.floor(r() * 2)) + '' + (100 + Math.floor(r() * 900)) + ' ' + (1000 + Math.floor(r() * 9000)), plate: plate(r), model: pick(r, MODELS), insurer: pick(r, INSURERS), expiry: exp, status: status, consent: r() < 0.93, vehicles: r() < 0.12 ? 2 : 1 });
    }
    for (i = 0; i < 44; i++) {
      var line = pick(r, LINES), n = line[1] ? (line[0] === 'Fleet motor' ? 2 + Math.floor(r() * 18) : 5 + Math.floor(r() * 80)) : 0;
      var exp2 = dateFrom(r, -20, 365), dl2 = Math.round((exp2 - TODAY) / 864e5);
      business.push({ kind: 'business', id: 'b' + i, name: pick(r, CO_A) + ' ' + pick(r, CO_B) + ' Pte Ltd', uen: (2010 + Math.floor(r() * 15)) + '' + (10000 + Math.floor(r() * 90000)) + 'KNRWZ'[Math.floor(r() * 5)], contact: pick(r, GIVEN) + ' ' + pick(r, SURNAMES), role: pick(r, ROLES_CO), line: line[0] + (n ? ', ' + n + ' ' + line[1] : ''), insurer: pick(r, INSURERS), expiry: exp2, status: dl2 < 0 ? 'lapsed' : dl2 <= 90 ? 'renewing' : 'active', consent: r() < 0.9 });
    }
    personal.sort(function (a, b) { return a.expiry - b.expiry; }); business.sort(function (a, b) { return a.expiry - b.expiry; });
    return { personal: personal, business: business };
  }
  var BOOK = buildBook();
  var dir = { tab: 'personal', page: 1, q: '' };
  function statusChipClient(s) { return s === 'renewing' ? '<span class="th-chip th-chip--warn"><span class="th-chip__dot"></span>Renewal due</span>' : s === 'lapsed' ? '<span class="th-chip th-chip--bad"><span class="th-chip__dot"></span>Lapsed</span>' : '<span class="th-chip th-chip--ok"><span class="th-chip__dot"></span>Active</span>'; }
  function dirRows() {
    var signups = readSignups().filter(function (s) { return (s.type === 'business') === (dir.tab === 'business'); }).map(function (s) { var v = s.vehicle || {}; return s.type === 'business' ? { kind: 'business', id: s.id, name: s.company.name, uen: s.company.uen || '', contact: s.name, role: s.company.role, line: (s.lines || []).map(function (l) { return l.line + (l.count ? ', ' + l.count : ''); }).join(' / ') || 'to confirm', insurer: s.ins.insurer, expiry: new Date(s.ins.expiry), status: isNew(s) ? 'new' : 'active', consent: s.consent, signup: s } : { kind: 'personal', id: s.id, name: s.name, mobile: s.mobile, plate: v.plate || '', model: v.model || '', insurer: s.ins.insurer, expiry: new Date(s.ins.expiry), status: isNew(s) ? 'new' : 'active', consent: s.consent, vehicles: 1, signup: s }; });
    var rows = signups.concat(dir.tab === 'personal' ? BOOK.personal : BOOK.business);
    var q = dir.q.toLowerCase();
    if (q) rows = rows.filter(function (c) { return [c.name, c.mobile, c.plate, c.model, c.insurer, c.uen, c.contact, c.line].join(' ').toLowerCase().indexOf(q) !== -1; });
    return rows;
  }
  function renderDirectory() {
    var host = document.querySelector('[data-directory]'); if (!host) return;
    var rows = dirRows(), pages = Math.max(1, Math.ceil(rows.length / PAGE)); dir.page = Math.min(Math.max(1, dir.page), pages);
    var slice = rows.slice((dir.page - 1) * PAGE, dir.page * PAGE), from = rows.length ? (dir.page - 1) * PAGE + 1 : 0, to = Math.min(rows.length, dir.page * PAGE);
    var nP = readSignups().filter(function (s) { return s.type !== 'business'; }).length + BOOK.personal.length, nB = readSignups().filter(function (s) { return s.type === 'business'; }).length + BOOK.business.length;
    var head = '<div class="tha-panel__head"><div><h2>All clients</h2><p>' + (dir.q ? rows.length + ' match' + (rows.length === 1 ? '' : 'es') + ' for “' + esc(dir.q) + '”' : 'Showing ' + from + '–' + to + ' of ' + rows.length) + '</p></div>' +
      '<div class="tha-dir__tabs"><button data-dir-tab="personal"' + (dir.tab === 'personal' ? ' class="is-on"' : '') + '>Personal<b>' + nP + '</b></button><button data-dir-tab="business"' + (dir.tab === 'business' ? ' class="is-on"' : '') + '>Business<b>' + nB + '</b></button></div>' +
      '<div class="tha-pager"><button data-dir-page="-1" aria-label="Previous page"' + (dir.page <= 1 ? ' disabled' : '') + '><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></button><span>Page ' + dir.page + ' of ' + pages + '</span><button data-dir-page="1" aria-label="Next page"' + (dir.page >= pages ? ' disabled' : '') + '><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></button></div></div>';
    var table;
    if (dir.tab === 'personal') {
      table = '<table class="tha-table"><thead><tr><th>Client</th><th>Vehicle</th><th>Insurer</th><th>Policy expiry</th><th>Status</th><th>Consent</th><th></th></tr></thead><tbody>' + slice.map(function (c) {
        return '<tr data-client="' + esc(c.id) + '"><td><div class="tha-table__client"><div class="tha-av' + (c.status === 'lapsed' ? ' tha-av--5' : '') + '">' + esc(initials(c.name)) + '</div><div><b>' + esc(c.name) + (c.status === 'new' ? '<span class="tha-tag">New</span>' : '') + '</b><span>+65 ' + esc(c.mobile) + '</span></div></div></td>' +
          '<td><b>' + esc(c.plate) + '</b>' + (c.vehicles > 1 ? ' <span class="tha-tag">+' + (c.vehicles - 1) + '</span>' : '') + '<br><span style="font-size:12.5px;color:var(--th-mute);">' + esc(c.model) + '</span></td><td>' + esc(c.insurer) + '</td><td>' + esc(fmtDate(c.expiry)) + '</td><td>' + (c.status === 'new' ? '<span class="th-chip th-chip--warn"><span class="th-chip__dot"></span>New, to verify</span>' : statusChipClient(c.status)) + '</td><td>' + (c.consent ? '<span class="th-chip th-chip--ok"><span class="th-chip__dot"></span>Yes</span>' : '<span class="th-chip th-chip--bad"><span class="th-chip__dot"></span>No</span>') + '</td><td><svg class="tha-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></td></tr>';
      }).join('') + '</tbody></table>';
    } else {
      table = '<table class="tha-table"><thead><tr><th>Company</th><th>Contact</th><th>Policy</th><th>Insurer</th><th>Expiry</th><th>Status</th><th></th></tr></thead><tbody>' + slice.map(function (c) {
        return '<tr data-client="' + esc(c.id) + '"><td><div class="tha-table__client"><div class="tha-av tha-av--4">' + esc(initials(c.name)) + '</div><div><b>' + esc(c.name) + '</b><span>UEN ' + esc(c.uen) + '</span></div></div></td>' +
          '<td>' + esc(c.contact) + '<br><span style="font-size:12.5px;color:var(--th-mute);">' + esc(c.role) + '</span></td><td>' + esc(c.line) + '</td><td>' + esc(c.insurer) + '</td><td>' + esc(fmtDate(c.expiry)) + '</td><td>' + (c.status === 'new' ? '<span class="th-chip th-chip--warn"><span class="th-chip__dot"></span>New, to verify</span>' : statusChipClient(c.status)) + '</td><td><svg class="tha-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></td></tr>';
      }).join('') + '</tbody></table>';
    }
    if (!slice.length) table = '<div class="tha-panel__body" style="color:var(--th-mute);font-size:14px;">No clients match.</div>';
    host.innerHTML = '<div class="tha-panel">' + head + table + '</div>';
  }
  function openClientDrawer(c) {
    if (c.signup) { openSignupDrawer(c.signup); return; }
    document.getElementById('d-name').textContent = c.name;
    document.getElementById('d-sub').textContent = (c.kind === 'business' ? 'UEN ' + c.uen + ' · ' + c.line : c.plate + ' · ' + c.model) + ' · ' + c.insurer + ' expires ' + fmtDate(c.expiry);
    var kv = c.kind === 'business'
      ? '<dt>Contact</dt><dd>' + esc(c.contact) + ', ' + esc(c.role) + '</dd><dt>Policy</dt><dd>' + esc(c.line) + '</dd><dt>Insurer</dt><dd>' + esc(c.insurer) + '</dd><dt>Expiry</dt><dd>' + esc(fmtDate(c.expiry)) + ' · email reminders 90 and 60 days before</dd><dt>Consent</dt><dd>' + (c.consent ? 'Recorded' : 'Not recorded') + '</dd>'
      : '<dt>Mobile</dt><dd>+65 ' + esc(c.mobile) + '</dd><dt>Vehicle</dt><dd>' + esc(c.plate) + ' · ' + esc(c.model) + (c.vehicles > 1 ? ' (+' + (c.vehicles - 1) + ' more)' : '') + '</dd><dt>Insurer</dt><dd>' + esc(c.insurer) + '</dd><dt>Policy expiry</dt><dd>' + esc(fmtDate(c.expiry)) + ' · reminder ' + esc(fmtDate(addDays(c.expiry, -60))) + '</dd><dt>Consent</dt><dd>' + (c.consent ? 'WhatsApp and email' : 'Not recorded, reminders paused') + '</dd>';
    drawerBody.innerHTML = '<div class="tha-drawer__sec"><h3>Client record</h3><dl class="tha-kv">' + kv + '</dl></div>' +
      '<div class="tha-drawer__sec"><h3>Activity</h3><div class="tha-log"><div class="tha-log__item"><div class="tha-log__dot is-done"></div><div><b>Imported from THIB records</b><span>02 Oct 2026 · import assistant, confirmed by staff</span></div></div></div></div>';
    attachEmail(ctxFromClient(c));
    drawer.classList.add('is-open'); scrim.classList.add('is-open'); drawer.scrollTop = 0;
  }
  document.addEventListener('click', function (e) {
    var tab = e.target.closest('[data-dir-tab]'); if (tab) { dir.tab = tab.dataset.dirTab; dir.page = 1; renderDirectory(); return; }
    var pg = e.target.closest('[data-dir-page]'); if (pg && !pg.disabled) { dir.page += +pg.dataset.dirPage; renderDirectory(); return; }
    var row = e.target.closest('tr[data-client]');
    if (row) { e.stopImmediatePropagation(); var all = dir.tab === 'personal' ? dirRows() : dirRows(); var c = all.find(function (x) { return x.id === row.getAttribute('data-client'); }); if (c) { document.querySelectorAll('.tha-table tbody tr').forEach(function (r) { r.classList.remove('is-sel'); }); row.classList.add('is-sel'); openClientDrawer(c); } }
  }, true);
  renderDirectory();

  /* ---- email: threads on the client record, compose from THIB's domain, replies into the Inbox ---- */
  var FROM = { business: 'business@thib.com.sg', renewals: 'renewals@thib.com.sg', accounts: 'accounts@thib.com.sg' };
  var TEMPLATES = {
    'reminder90': { name: 'Renewal reminder, 90 days', subject: 'Your {line} policy with {insurer} renews on {expiry}', body: 'Dear {first},\n\nYour {line} policy with {insurer} expires on {expiry}. We will compare the renewal across our panel and send you options by {minus30}.\n\nAttached is the list currently covered. Please reply to confirm it, or tell us what has changed (vehicles or staff added or removed).\n\nKind regards,\n{broker}\nTH Insurance Brokers' },
    'reminder60': { name: 'Renewal reminder, 60 days', subject: 'Reminder: {line} renewal on {expiry}', body: 'Dear {first},\n\nA reminder that your {line} policy with {insurer} expires on {expiry}. If you have not yet confirmed the covered list, a reply to this email is enough.\n\nKind regards,\n{broker}\nTH Insurance Brokers' },
    'quotes': { name: 'Quotes ready', subject: 'Renewal options for {company}', body: 'Dear {first},\n\nWe have compared your {line} renewal across our panel. Three options are attached with premium, excess and what each covers. Reply with your choice and we will issue the policy.\n\nKind regards,\n{broker}\nTH Insurance Brokers' },
    'policy': { name: 'Policy issued', subject: 'Your {line} policy and receipt', body: 'Dear {first},\n\nThank you. Your {line} policy with {insurer} is attached, together with the receipt. The next renewal is on {nextYear}; we will write to you 90 days before.\n\nKind regards,\n{broker}\nTH Insurance Brokers' },
    'custom': { name: 'Blank', subject: '', body: 'Dear {first},\n\n\n\nKind regards,\n{broker}\nTH Insurance Brokers' }
  };
  function readEmails() { try { return JSON.parse(localStorage.getItem('thib.emails') || '{}'); } catch (e) { return {}; } }
  function writeEmails(o) { try { localStorage.setItem('thib.emails', JSON.stringify(o)); } catch (e) {} }
  function fill(s, ctx) {
    var exp = new Date(ctx.expiry);
    return s.replace(/\{first\}/g, (ctx.contact || ctx.name || '').split(' ')[0]).replace(/\{company\}/g, ctx.company || ctx.name).replace(/\{line\}/g, ctx.line || 'insurance').replace(/\{insurer\}/g, ctx.insurer || 'your insurer')
      .replace(/\{expiry\}/g, fmtDate(exp)).replace(/\{minus30\}/g, fmtDate(addDays(exp, -30))).replace(/\{nextYear\}/g, fmtDate(addDays(exp, 365))).replace(/\{broker\}/g, 'Eileen Goh');
  }
  function seedThread(ctx) {
    if (ctx.kind !== 'business' || ctx.signup) return [];
    var exp = new Date(ctx.expiry), r90 = addDays(exp, -90);
    if (r90 > TODAY) return [];
    return [
      { dir: 'out', from: FROM.business, to: ctx.email, subject: fill(TEMPLATES.reminder90.subject, ctx), body: fill(TEMPLATES.reminder90.body, ctx), at: r90.toISOString(), status: 'Opened' },
      { dir: 'in', from: ctx.email, to: FROM.business, subject: 'Re: ' + fill(TEMPLATES.reminder90.subject, ctx), body: 'Hi, thanks for the reminder. Please note we added two vehicles in June. I will send the plates by tomorrow.\n\n' + ctx.contact, at: addDays(r90, 1).toISOString(), status: 'Received' }
    ];
  }
  function threadFor(ctx) { var all = readEmails(); if (!all[ctx.id] || !all[ctx.id].length) { var seeded = seedThread(ctx); if (seeded.length || !all[ctx.id]) { all[ctx.id] = seeded; writeEmails(all); } } return all[ctx.id]; }
  function slug(s) { return s.toLowerCase().replace(/ pte\.? ltd\.?$/, '').replace(/[^a-z]+/g, ''); }
  function ctxFromSignup(s) {
    var biz = s.type === 'business';
    return { id: s.id, kind: biz ? 'business' : 'personal', signup: true, name: biz ? s.company.name : s.name, company: biz ? s.company.name : '', contact: s.name, email: s.email || '', cc: biz && s.ccAccounts ? (s.company.accounts || '') : '', line: biz ? (s.lines && s.lines[0] ? s.lines[0].line : 'insurance') : 'Motor', insurer: s.ins.insurer, expiry: s.ins.expiry };
  }
  function ctxFromClient(c) {
    if (c.signup) return ctxFromSignup(c.signup);
    return c.kind === 'business'
      ? { id: c.id, kind: 'business', name: c.name, company: c.name, contact: c.contact, email: c.contact.toLowerCase().replace(/[^a-z]+/g, '.') + '@' + slug(c.name) + '.sg', cc: 'accounts@' + slug(c.name) + '.sg', line: c.line.split(',')[0], insurer: c.insurer, expiry: c.expiry }
      : { id: c.id, kind: 'personal', name: c.name, contact: c.name, email: c.name.toLowerCase().replace(/[^a-z]+/g, '.') + '@example.com', cc: '', line: 'Motor', insurer: c.insurer, expiry: c.expiry };
  }
  function emailSection(ctx) {
    var thread = threadFor(ctx);
    var msgs = thread.length ? thread.map(function (m) {
      return '<div class="tha-msg tha-msg--' + m.dir + '"><div class="tha-msg__meta"><b>' + (m.dir === 'out' ? 'THIB' : esc((ctx.contact || ctx.name).split(' ')[0])) + '</b><span>' + esc(m.dir === 'out' ? 'to ' + m.to + (m.cc ? ', cc ' + m.cc : '') : 'from ' + m.from) + '</span><span>' + esc(fmtDate(m.at)) + '</span><span class="th-chip ' + (m.dir === 'out' ? 'th-chip--ok' : '') + '"><span class="th-chip__dot"></span>' + esc(m.status) + '</span></div><div class="tha-msg__subj">' + esc(m.subject) + '</div><div class="tha-msg__body">' + esc(m.body) + '</div></div>';
    }).join('') : '<p style="font-size:13.5px;color:var(--th-mute);">No email yet. ' + (ctx.kind === 'business' ? 'Business clients are handled by email; the first reminder goes 90 days before expiry.' : 'This client prefers WhatsApp; email is used for receipts and policy copies.') + '</p>';
    var opts = Object.keys(TEMPLATES).map(function (k) { return '<option value="' + k + '">' + TEMPLATES[k].name + '</option>'; }).join('');
    return '<div class="tha-drawer__sec" id="email-sec"><h3>Email</h3><div class="tha-thread">' + msgs + '</div>' +
      '<div style="margin-top:12px;"><button class="th-btn th-btn--primary" data-compose="1" style="font-size:14px;padding:9px 16px;">Compose email</button></div>' +
      '<div class="tha-compose" id="compose" hidden>' +
        '<div class="tha-compose__head"><b>New email</b><span>Sent from THIB\'s domain, logged on this record</span></div>' +
        '<div class="tha-compose__row"><label>From</label><select id="em-from"><option value="' + FROM.business + '">' + FROM.business + ' (Business insurance)</option><option value="' + FROM.renewals + '">' + FROM.renewals + ' (Renewals)</option><option value="' + FROM.accounts + '">' + FROM.accounts + ' (Accounts)</option></select></div>' +
        '<div class="tha-compose__row"><label>To</label><input id="em-to" value="' + esc(ctx.email) + '" placeholder="client@company.sg"></div>' +
        '<div class="tha-compose__row"><label>Cc</label><input id="em-cc" value="' + esc(ctx.cc || '') + '" placeholder="accounts@company.sg"></div>' +
        '<div class="tha-compose__row"><label>Template</label><select id="em-template"><option value="">Choose a template</option>' + opts + '</select></div>' +
        '<div class="tha-compose__row"><label>Subject</label><input id="em-subject" placeholder="Subject"></div>' +
        '<textarea id="em-body" placeholder="Write, or pick a template. The client\'s name, insurer and dates are filled in for you."></textarea>' +
        '<div class="tha-compose__foot"><button class="th-btn th-btn--primary" id="em-send">Send</button><button class="th-btn th-btn--ghost" id="em-cancel">Cancel</button><span>The covered list and policy PDF are attached automatically when relevant.</span></div>' +
      '</div></div>';
  }
  var composeCtx = null;
  function attachEmail(ctx) { composeCtx = ctx; drawerBody.insertAdjacentHTML('beforeend', emailSection(ctx)); }
  function refreshEmail() { var s = document.getElementById('email-sec'); if (s && composeCtx) s.outerHTML = emailSection(composeCtx); }
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-compose]')) { document.getElementById('compose').hidden = false; document.getElementById('em-template').focus(); return; }
    if (e.target.id === 'em-cancel') { document.getElementById('compose').hidden = true; return; }
    if (e.target.id === 'em-send') {
      var to = document.getElementById('em-to').value.trim(), subj = document.getElementById('em-subject').value.trim(), body = document.getElementById('em-body').value.trim();
      if (!to || !subj || !body) { document.getElementById(!to ? 'em-to' : !subj ? 'em-subject' : 'em-body').focus(); return; }
      var all = readEmails(), th = all[composeCtx.id] || [];
      th.push({ dir: 'out', from: document.getElementById('em-from').value, to: to, cc: document.getElementById('em-cc').value.trim(), subject: subj, body: body, at: new Date().toISOString(), status: 'Sent' });
      all[composeCtx.id] = th; writeEmails(all); refreshEmail();
      setTimeout(function () { var a2 = readEmails(), t2 = a2[composeCtx.id]; if (t2 && t2.length) { t2[t2.length - 1].status = 'Delivered'; writeEmails(a2); refreshEmail(); renderInbox(); } }, 1200);
    }
  });
  document.addEventListener('change', function (e) {
    if (e.target.id !== 'em-template') return;
    var t = TEMPLATES[e.target.value]; if (!t) return;
    document.getElementById('em-subject').value = fill(t.subject, composeCtx);
    document.getElementById('em-body').value = fill(t.body, composeCtx);
  });

  /* Inbox: replies that arrived in the platform, by department */
  function renderInbox() {
    var host = document.querySelector('[data-inbox]'); if (!host) return;
    var items = [], all = readEmails();
    BOOK.business.filter(function (c) { return c.status === 'renewing'; }).slice(0, 4).forEach(function (c) { var ctx = ctxFromClient(c), th = threadFor(ctx); var last = th.filter(function (m) { return m.dir === 'in'; }).pop(); if (last) items.push({ id: c.id, name: c.name, who: ctx.contact, channel: 'Email', dept: 'Business insurance', subject: last.subject, preview: last.body.split('\n')[0], at: last.at, unread: true }); });
    readSignups().forEach(function (s) { var th = all[s.id] || [], last = th[th.length - 1]; if (last) items.push({ id: s.id, name: s.type === 'business' ? s.company.name : s.name, who: s.name, channel: 'Email', dept: s.type === 'business' ? 'Business insurance' : 'Motor insurance', subject: last.subject, preview: (last.dir === 'out' ? 'You: ' : '') + last.body.split('\n')[0], at: last.at, unread: last.dir === 'in' }); });
    items.push({ id: 'rachel', name: 'Rachel Lim', who: 'Rachel Lim', channel: 'WhatsApp', dept: 'Motor insurance', subject: 'Re: Your car insurance renewal', preview: 'Paid via PayNow just now, please confirm.', at: '2026-10-21T02:42:00Z', unread: false });
    items.sort(function (x, y) { return new Date(y.at) - new Date(x.at); });
    var unread = items.filter(function (i) { return i.unread; }).length, cnt = document.getElementById('inbox-count');
    if (cnt) { cnt.textContent = unread; cnt.style.display = unread ? '' : 'none'; }
    host.innerHTML = '<div class="tha-panel"><div class="tha-panel__head"><div><h2>Conversations</h2><p>' + unread + ' unread</p></div><div class="tha-filters"><button class="tha-filter is-on">All</button><button class="tha-filter">Email</button><button class="tha-filter">WhatsApp</button><button class="tha-filter">Business insurance</button><button class="tha-filter">Motor insurance</button></div></div>' +
      '<table class="tha-table tha-inbox"><thead><tr><th>Client</th><th>Last message</th><th>Channel</th><th>Department</th><th>When</th><th></th></tr></thead><tbody>' + items.map(function (i) {
        return '<tr data-inbox-open="' + esc(i.id) + '" class="' + (i.unread ? 'is-unread' : '') + '"><td><div class="tha-table__client"><div class="tha-av' + (i.channel === 'WhatsApp' ? ' tha-av--3' : ' tha-av--4') + '">' + esc(initials(i.name)) + '</div><div><b>' + (i.unread ? '<span class="tha-inbox__dot"></span>' : '') + esc(i.name) + '</b><span>' + esc(i.who) + '</span></div></div></td>' +
          '<td><b>' + esc(i.subject) + '</b><br><span style="font-size:12.5px;color:var(--th-mute);">' + esc(i.preview.slice(0, 90)) + '</span></td><td>' + esc(i.channel) + '</td><td>' + esc(i.dept) + '</td><td style="white-space:nowrap;color:var(--th-mute);">' + esc(fmtDate(i.at)) + '</td><td><svg class="tha-chevron" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg></td></tr>';
      }).join('') + '</tbody></table></div>';
  }
  document.addEventListener('click', function (e) {
    var row = e.target.closest('tr[data-inbox-open]'); if (!row) return;
    e.stopImmediatePropagation();
    var id = row.getAttribute('data-inbox-open'), s = readSignups().find(function (x) { return x.id === id; });
    if (s) { openSignupDrawer(s); return; }
    var c = BOOK.business.find(function (x) { return x.id === id; }) || BOOK.personal.find(function (x) { return x.id === id; });
    if (c) { openClientDrawer(c); return; }
    if (id === 'rachel') document.querySelector('tr[data-open="rachel"]').click();
  }, true);

  renderInbox();  /* after TEMPLATES and FROM exist */

  /* ---- pipeline segments double as the renewals filter ---- */
  var pipeLabels = { all: 'All', reminder: 'Reminder sent', details: 'Details received', quotes: 'Quotes sent', payment: 'Awaiting payment', renewed: 'Renewed' };
  document.querySelectorAll('.tha-pipe__tab').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var status = tab.dataset.status;
      document.querySelectorAll('.tha-pipe__tab').forEach(function (t) { t.classList.toggle('is-on', t === tab); });
      var rows = document.querySelectorAll('section[data-av="renewals"] .tha-table tbody tr');
      var shown = 0;
      rows.forEach(function (r) {
        var on = status === 'all' || r.dataset.status === status;
        r.hidden = !on;
        if (on) shown += 1;
      });
      document.getElementById('pipe-count').textContent = 'Showing ' + shown + ' of ' + rows.length;
      document.getElementById('pipe-caption').textContent =
        (status === 'all' ? 'All ' + rows.length : pipeLabels[status] + ', ' + shown) + ', soonest expiry first';
    });
  });

  /* ---- filters, toggles, mobile sidebar ---- */
  document.addEventListener('click', function (e) {
    var filter = e.target.closest('.tha-filter');
    if (filter) {
      filter.parentElement.querySelectorAll('.tha-filter').forEach(function (f) { f.classList.remove('is-on'); });
      filter.classList.add('is-on');
      return;
    }
    var toggle = e.target.closest('.tha-toggle');
    if (toggle) toggle.classList.toggle('is-on');
  });

  document.getElementById('side-toggle').addEventListener('click', function () {
    document.getElementById('side').classList.toggle('is-open');
  });

  function syncSideToggle() {
    document.getElementById('side-toggle').style.display = window.innerWidth <= 900 ? 'grid' : 'none';
  }
  syncSideToggle();
  window.addEventListener('resize', syncSideToggle);
})();
