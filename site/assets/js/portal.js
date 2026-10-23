/* THIB client portal — prototype interactions.
   Auth and uploads are simulated: nothing is sent, stored or read server-side. */

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var auth = $('auth'), app = $('app'), signup = $('signup');
  var stepMobile = $('step-mobile'), stepOtp = $('step-otp');
  var mobile = $('mobile'), mobileError = $('mobile-error'), otpError = $('otp-error');
  var otpInputs = [].slice.call(document.querySelectorAll('#otp input'));
  var resend = $('resend');
  var timer, newClient = false;

  var TODAY = new Date('2026-10-23');
  var SAMPLE = { plate: 'SXX 1234 A', model: 'Toyota Corolla Altis 1.6', prop: 'petrol', cc: 1598, kw: '', reg: '2019-03-14', coe: '2029-03-13', rt: '2027-01-31' };
  var client = { name: 'Alex Tan', mobile: '9123 4567', vehicle: SAMPLE, ins: { insurer: 'MSIG', expiry: '2026-12-12' }, rtChoice: 'thib', type: 'personal', lead: 90, idp: '' };
  var MYINFO_BIZ = { company: 'Lim & Sons Logistics Pte Ltd', uen: '201812345K', role: 'Director', name: 'Daniel Lim', email: 'daniel@limandsons.sg' };

  /* ---------- road tax: LTA's published 6-monthly formula, x0.782, plus the age surcharge ---------- */
  function sixMonthBase(v) {
    var cc = +v.cc || 0, kw = +v.kw || 0;
    var byCc = cc <= 600 ? 200 : cc <= 1000 ? 200 + 0.125 * (cc - 600) : cc <= 1600 ? 250 + 0.375 * (cc - 1000) : cc <= 3000 ? 475 + 0.75 * (cc - 1600) : 1525 + 1 * (cc - 3000);
    var byKw = kw <= 7.5 ? 200 : kw <= 30 ? 200 + 2 * (kw - 7.5) : kw <= 230 ? 250 + 3.75 * (kw - 30) : 1525 + 10 * (kw - 230);
    if (v.prop === 'diesel') return null;                                   /* separate schedule: staff confirm at LTA */
    if (v.prop === 'electric') return kw ? byKw * 0.782 + 350 : null;       /* + Additional Flat Component */
    if (v.prop === 'petrol-electric') return cc || kw ? Math.max(cc ? byCc : 0, kw ? byKw : 0) * 0.782 : null;
    return cc ? byCc * 0.782 : null;
  }
  function roadTax(v) {
    var base = sixMonthBase(v);
    if (base == null) return null;
    var years = v.reg ? Math.floor((TODAY - new Date(v.reg)) / (365.25 * 864e5)) : 0;
    var surcharge = years > 14 ? .5 : years > 13 ? .4 : years > 12 ? .3 : years > 11 ? .2 : years > 10 ? .1 : 0;
    var six = base * (1 + surcharge);
    return { six: six, twelve: six * 2, years: years, surcharge: surcharge };
  }
  function sgd(n) { return 'S$' + Math.round(n).toLocaleString('en-SG'); }
  function fmtDate(iso) { var d = new Date(iso); return isNaN(d) ? '' : d.toLocaleDateString('en-SG', { day: '2-digit', month: 'short', year: 'numeric' }); }
  function addMonths(iso, n) { var d = new Date(iso); d.setMonth(d.getMonth() + n); return d; }
  function addDays(iso, n) { var d = new Date(iso); d.setDate(d.getDate() + n); return d; }
  function propLabel(p) { return { petrol: 'petrol', 'petrol-electric': 'petrol-electric', electric: 'electric', diesel: 'diesel' }[p] || ''; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function renderRoadTax(el, v) {
    var r = roadTax(v);
    var basis = [];
    if (v.prop === 'electric') basis.push(esc(v.kw || '?') + ' kW electric');
    else {
      basis.push((+v.cc ? Number(v.cc).toLocaleString('en-SG') + 'cc ' : '') + propLabel(v.prop));
      if (v.prop === 'petrol-electric' && +v.kw) basis.push(esc(v.kw) + ' kW motor');
    }
    if (v.reg) basis.push('registered ' + fmtDate(v.reg));
    if (r && r.years) basis.push(r.years + ' years old');
    var html = '<div class="thp-rt__label">Based on your log card</div><p class="thp-rt__basis"><b>' + esc(v.plate || 'Your vehicle') + '</b> &middot; ' + basis.join(' &middot; ') + '</p>';
    if (r) {
      html += '<div class="thp-rt__amts">' +
        '<div class="thp-rt__amt"><small>12 months</small><b>' + sgd(r.twelve) + '</b><span>' + (v.rt ? 'cover to ' + fmtDate(addMonths(v.rt, 12)) : '') + '</span></div>' +
        '<div class="thp-rt__amt"><small>6 months</small><b>' + sgd(r.six) + '</b><span>' + (v.rt ? 'cover to ' + fmtDate(addMonths(v.rt, 6)) : '') + '</span></div></div>';
      html += '<p class="thp-rt__note">' + (r.surcharge ? 'Includes the ' + Math.round(r.surcharge * 100) + '% surcharge for vehicles over 10 years old. ' : '') +
        'Worked out with LTA\'s published formula' + (v.prop === 'electric' ? ', including the Additional Flat Component for electric cars' : '') + '. THIB confirms the exact amount at LTA before you pay.</p>';
    } else {
      html += '<p class="thp-rt__note">' + (v.prop === 'diesel' ? 'Diesel cars follow a separate schedule, so THIB will confirm this amount at LTA for you.' : 'Enter the engine capacity or power rating to see the amount.') + '</p>';
    }
    el.innerHTML = html;
  }

  /* ---------- login: mobile + OTP (shared by existing and new clients) ---------- */
  function setMode(isNew) {
    newClient = isNew;
    $('login-title').innerHTML = isNew ? 'Get started with <span class="th-serif">THIB</span>' : 'Client login';
    $('login-copy').textContent = isNew
      ? 'Enter your mobile number. We will text you a 6-digit code to verify it, then set up your account in about three minutes.'
      : 'Enter the mobile number registered with THIB. We will send you a 6-digit code.';
    $('mode-switch').innerHTML = isNew
      ? 'Already a client? <button type="button" id="start-existing">Sign in</button>'
      : 'New to THIB? <button type="button" id="start-new">Create your account</button>';
  }
  document.addEventListener('click', function (e) {
    if (e.target.id === 'start-new') { setMode(true); mobile.focus(); }
    if (e.target.id === 'start-existing') { setMode(false); mobile.focus(); }
  });
  if (location.hash === '#new') setMode(true);

  mobile.addEventListener('input', function () { this.value = this.value.replace(/[^\d ]/g, ''); mobileError.hidden = true; });
  $('send-code').addEventListener('click', function () {
    var digits = mobile.value.replace(/\D/g, '');
    if (digits.length !== 8 || !/^[89]/.test(digits)) { mobileError.hidden = false; mobile.focus(); return; }
    client.mobile = digits.slice(0, 4) + ' ' + digits.slice(4);
    $('otp-target').textContent = '+65 ' + client.mobile;
    stepMobile.hidden = true; stepOtp.hidden = false;
    otpInputs[0].focus();
    startResendTimer();
  });
  $('change-number').addEventListener('click', function () { stepOtp.hidden = true; stepMobile.hidden = false; clearInterval(timer); mobile.focus(); });

  otpInputs.forEach(function (input, i) {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/\D/g, '');
      this.classList.toggle('is-filled', this.value !== '');
      otpError.hidden = true;
      if (this.value && i < otpInputs.length - 1) otpInputs[i + 1].focus();
    });
    input.addEventListener('keydown', function (e) { if (e.key === 'Backspace' && !this.value && i > 0) otpInputs[i - 1].focus(); });
    input.addEventListener('paste', function (e) {
      e.preventDefault();
      var digits = (e.clipboardData.getData('text') || '').replace(/\D/g, '').slice(0, 6).split('');
      digits.forEach(function (d, n) { if (otpInputs[n]) { otpInputs[n].value = d; otpInputs[n].classList.add('is-filled'); } });
      otpInputs[Math.min(digits.length, 5)].focus();
    });
  });
  function startResendTimer() {
    var left = 30; resend.disabled = true; resend.textContent = 'Resend in 30s'; clearInterval(timer);
    timer = setInterval(function () { left -= 1; if (left <= 0) { clearInterval(timer); resend.disabled = false; resend.textContent = 'Resend code'; } else { resend.textContent = 'Resend in ' + left + 's'; } }, 1000);
  }
  resend.addEventListener('click', startResendTimer);

  $('verify').addEventListener('click', function () {
    if (!otpInputs.every(function (i) { return i.value !== ''; })) { otpError.hidden = false; return; }
    auth.style.display = 'none';
    if (newClient) { $('su-mobile').textContent = '+65 ' + client.mobile; signup.classList.add('is-on'); showStep(1); }
    else { enterApp(); }
    window.scrollTo(0, 0);
  });

  $('signout').addEventListener('click', function () {
    app.classList.remove('is-on'); signup.classList.remove('is-on'); auth.style.display = '';
    stepOtp.hidden = true; stepMobile.hidden = false; mobile.value = '';
    otpInputs.forEach(function (i) { i.value = ''; i.classList.remove('is-filled'); });
    clearInterval(timer); setMode(false); window.scrollTo(0, 0);
  });

  /* ---------- sign-up steps ---------- */
  function setType(type) {
    client.type = type;
    document.querySelectorAll('button[data-type]').forEach(function (b) { b.classList.toggle('is-on', b.dataset.type === type); });
    document.querySelectorAll('.thp-biz').forEach(function (el) { el.hidden = type !== 'business'; });
    $('su-name-label').textContent = type === 'business' ? 'Your name' : 'Full name, as on your NRIC';
    var labels = type === 'business' ? ['Company', 'Cover', 'Insurance', 'Reminders', 'Done'] : ['About you', 'Log card', 'Insurance', 'Road tax', 'Done'];
    document.querySelectorAll('#stepper li span').forEach(function (sp, i) { sp.textContent = labels[i]; });
    var want = type === 'business' ? 'email' : 'whatsapp';
    document.querySelectorAll('[data-contact]').forEach(function (o) { o.classList.toggle('is-on', o.dataset.contact === want); });
  }
  document.querySelectorAll('button[data-type]').forEach(function (b) { b.addEventListener('click', function () { setType(b.dataset.type); }); });
  function showStep(n) {
    document.querySelectorAll('.thp-sstep').forEach(function (s) { var typed = s.dataset.type; s.classList.toggle('is-on', +s.dataset.step === n && (!typed || typed === client.type)); });
    document.querySelectorAll('#stepper li').forEach(function (li) {
      var k = +li.dataset.step; li.classList.toggle('is-on', k === n); li.classList.toggle('is-done', k < n);
    });
    if (n === 4) renderRoadTax($('rt-signup'), readVehicle());
    window.scrollTo(0, 0);
  }
  function current() { return +document.querySelector('.thp-sstep.is-on').dataset.step; }
  function readVehicle() {
    return { plate: $('v-plate').value.trim().toUpperCase(), model: $('v-model').value.trim(), prop: $('v-prop').value, cc: $('v-cc').value, kw: $('v-kw').value, reg: $('v-reg').value, coe: $('v-coe').value, rt: $('v-rt').value };
  }
  function fillVehicle(v) {
    $('v-plate').value = v.plate; $('v-model').value = v.model; $('v-prop').value = v.prop; $('v-cc').value = v.cc; $('v-kw').value = v.kw;
    $('v-reg').value = v.reg; $('v-coe').value = v.coe; $('v-rt').value = v.rt;
  }
  function readLines() {
    return [].map.call(document.querySelectorAll('.thp-line'), function (l) { var cb = l.querySelector('input[type=checkbox]'), n = l.querySelector('.thp-line__n'); return cb.checked ? { line: cb.value, count: n && n.value ? +n.value : null } : null; }).filter(Boolean);
  }
  function valid(n) {
    var err = $('su-error-' + n); if (err) err.hidden = true;
    if (n === 1 && (!$('su-name').value.trim() || !$('su-consent').checked || (client.type === 'business' && !$('su-company').value.trim()))) { err.textContent = client.type === 'business' ? 'Please enter the company name, your name, and tick the reminders box.' : 'Please enter your name and tick the reminders box to continue.'; err.hidden = false; return false; }
    if (n === 2 && client.type === 'business') { var e2 = $('su-error-2b'); e2.hidden = true; if (!readLines().length) { e2.hidden = false; return false; } return true; }
    if (n === 2) { var v = readVehicle(); if (!v.plate || !(+v.cc || +v.kw)) { err.hidden = false; return false; } }
    if (n === 3 && (!$('ins-insurer').value || !$('ins-expiry').value)) { err.hidden = false; return false; }
    return true;
  }
  document.querySelectorAll('[data-next]').forEach(function (b) { b.addEventListener('click', function () { var n = current(); if (valid(n)) showStep(n + 1); }); });
  document.querySelectorAll('[data-prev]').forEach(function (b) { b.addEventListener('click', function () { showStep(current() - 1); }); });

  document.querySelectorAll('[data-contact]').forEach(function (b) {
    b.addEventListener('click', function () { document.querySelectorAll('[data-contact]').forEach(function (o) { o.classList.remove('is-on'); }); b.classList.add('is-on'); });
  });

  /* log card upload: simulated read, then editable extracted fields */
  var drop = $('drop'), fileInput = $('logcard-file');
  function readLogCard(label) {
    drop.hidden = true; $('extract').hidden = true;
    $('reading-file').textContent = label; $('reading').hidden = false;
    setTimeout(function () { $('reading').hidden = true; fillVehicle(SAMPLE); $('extract').hidden = false; $('v-plate').focus(); }, 1400);
  }
  $('choose-file').addEventListener('click', function () { fileInput.click(); });
  fileInput.addEventListener('change', function () { if (this.files[0]) readLogCard(this.files[0].name); });
  $('use-sample').addEventListener('click', function () { readLogCard('Sample log card, Toyota Corolla Altis 1.6'); });
  $('manual-entry').addEventListener('click', function () { drop.hidden = true; $('reading').hidden = true; fillVehicle({ plate: '', model: '', prop: 'petrol', cc: '', kw: '', reg: '', coe: '', rt: '' }); $('extract').hidden = false; $('v-plate').focus(); });
  ['dragenter', 'dragover'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.add('is-over'); }); });
  ['dragleave', 'drop'].forEach(function (ev) { drop.addEventListener(ev, function (e) { e.preventDefault(); drop.classList.remove('is-over'); }); });
  drop.addEventListener('drop', function (e) { var f = e.dataTransfer.files[0]; if (f) readLogCard(f.name); });

  $('choose-policy').addEventListener('click', function () { $('policy-file').click(); });
  $('policy-file').addEventListener('change', function () { if (this.files[0]) $('policy-name').textContent = this.files[0].name + ' attached. We will read the policy number and cover from it.'; });

  document.querySelectorAll('[data-rtchoice]').forEach(function (b) {
    b.addEventListener('click', function () { document.querySelectorAll('[data-rtchoice]').forEach(function (o) { o.classList.remove('is-on'); }); b.classList.add('is-on'); client.rtChoice = b.dataset.rtchoice; });
  });

  $('finish').addEventListener('click', function () {
    client.name = $('su-name').value.trim();
    client.vehicle = readVehicle();
    client.ins = { insurer: $('ins-insurer').value, expiry: $('ins-expiry').value };
    var v = client.vehicle, r = roadTax(v), first = client.name.split(' ')[0];
    $('done-name').textContent = first + '.';
    $('sum-vehicle').textContent = v.plate + (v.model ? ' · ' + v.model : '') + (v.cc ? ' · ' + Number(v.cc).toLocaleString('en-SG') + 'cc' : '') + (v.coe ? ' · COE to ' + fmtDate(v.coe) : '');
    $('sum-ins').textContent = client.ins.insurer + ' policy expires ' + fmtDate(client.ins.expiry) + '. We remind you on ' + fmtDate(addDays(client.ins.expiry, -60)) + ' with quotes from our panel, pre-filled from your log card.';
    $('sum-rt').textContent = (v.rt ? 'Expires ' + fmtDate(v.rt) + '. ' : '') + (r ? sgd(r.twelve) + ' for 12 months or ' + sgd(r.six) + ' for 6. ' : '') +
      (client.rtChoice === 'thib' ? 'THIB renews it for you' : 'You renew at LTA') + (v.rt ? ', reminder on ' + fmtDate(addDays(v.rt, -60)) + '.' : '.');
    showStep(5);
    /* demo bridge: the staff admin (same origin) reads new sign-ups from browser storage */
    try {
      var list = JSON.parse(localStorage.getItem('thib.signups') || '[]');
      list.unshift({
        id: 'su-' + Date.now(), createdAt: new Date().toISOString(), type: 'personal', idp: client.idp,
        name: client.name, mobile: client.mobile, email: $('su-email').value.trim(),
        channel: (document.querySelector('[data-contact].is-on') || {}).dataset ? document.querySelector('[data-contact].is-on').dataset.contact : 'whatsapp',
        consent: $('su-consent').checked, vehicle: v,
        ins: { insurer: client.ins.insurer, expiry: client.ins.expiry, ncd: $('ins-ncd').value, claims: $('ins-claims').value },
        rtChoice: client.rtChoice, roadTax: r ? { six: Math.round(r.six), twelve: Math.round(r.twelve), surcharge: r.surcharge } : null
      });
      localStorage.setItem('thib.signups', JSON.stringify(list.slice(0, 20)));
    } catch (e) {}
  });
  document.querySelectorAll('[data-lead]').forEach(function (b) { b.addEventListener('click', function () { document.querySelectorAll('[data-lead]').forEach(function (o) { o.classList.remove('is-on'); }); b.classList.add('is-on'); client.lead = +b.dataset.lead; }); });
  $('choose-fleet').addEventListener('click', function () { $('fleet-file').click(); });
  $('fleet-file').addEventListener('change', function () { if (this.files[0]) $('fleet-name').textContent = this.files[0].name + ' attached. We will read the vehicles or staff from it.'; });
  $('finish-biz').addEventListener('click', function () {
    client.name = $('su-name').value.trim();
    client.company = { name: $('su-company').value.trim(), uen: $('su-uen').value.trim().toUpperCase(), role: $('su-role').value, accounts: $('su-accounts').value.trim() };
    client.lines = readLines();
    client.ins = { insurer: $('ins-insurer').value, expiry: $('ins-expiry').value };
    var first = client.name.split(' ')[0], lead = client.lead || 90;
    $('done-name').textContent = first + '.';
    $('sum-vehicle').previousElementSibling.textContent = 'Your company';
    $('sum-vehicle').textContent = client.company.name + (client.company.uen ? ' \u00b7 UEN ' + client.company.uen : '') + ' \u00b7 ' + client.lines.map(function (l) { return l.line + (l.count ? ' (' + l.count + ')' : ''); }).join(', ');
    $('sum-ins').textContent = client.ins.insurer + ' policy expires ' + fmtDate(client.ins.expiry) + '. We email you on ' + fmtDate(addDays(client.ins.expiry, -lead)) + ' and again on ' + fmtDate(addDays(client.ins.expiry, -Math.max(30, lead - 30))) + ' with what is covered and a one-click confirm' + (client.company.accounts && $('su-cc-accounts').checked ? ', ' + client.company.accounts + ' in copy' : '') + '.';
    $('sum-rt').previousElementSibling.textContent = 'Vehicle log cards';
    $('sum-rt').textContent = client.lines.some(function (l) { return l.line === 'Fleet motor'; }) ? 'We will ask for each vehicle\u2019s log card, or a fleet list, before quoting. Road tax for each vehicle is worked out from it.' : 'Not needed for the lines you chose.';
    document.querySelector('.thp-summary .thp-row:last-child span').textContent = 'Someone from the business insurance team will email you within one business day, Monday to Friday 9.30am to 6.30pm.';
    $('to-dashboard').hidden = true; $('to-site').hidden = false;
    document.querySelector('.thp-done p').textContent = 'Business clients are handled by email. Here is what happens next.';
    showStep(5);
    try {
      var list = JSON.parse(localStorage.getItem('thib.signups') || '[]');
      list.unshift({ id: 'su-' + Date.now(), createdAt: new Date().toISOString(), type: 'business', idp: client.idp, name: client.name, mobile: client.mobile, email: $('su-email').value.trim(), channel: (document.querySelector('[data-contact].is-on') || { dataset: { contact: 'email' } }).dataset.contact, consent: $('su-consent').checked, company: client.company, lines: client.lines, ins: { insurer: client.ins.insurer, expiry: client.ins.expiry, ncd: $('ins-ncd').value, claims: $('ins-claims').value }, lead: lead, ccAccounts: $('su-cc-accounts').checked, callOk: $('su-call').checked });
      localStorage.setItem('thib.signups', JSON.stringify(list.slice(0, 20)));
    } catch (e) {}
  });
  $('to-dashboard').addEventListener('click', function () { signup.classList.remove('is-on'); enterApp(); });

  /* Singpass (Myinfo) and Corppass (Myinfo Business): identity plus pre-fill, so nothing is typed or uploaded */
  var CONSENT = {
    singpass: [['Name', 'Alex Tan'], ['NRIC', 'S****567A, shown only when a policy is issued'], ['Mobile number', '+65 9123 4567'], ['Email', 'alex.tan@example.com'], ['Vehicles', 'SXX 1234 A, Toyota Corolla Altis 1.6, 1,598cc petrol'], ['Vehicle registration date', '14 Mar 2019'], ['COE expiry', '13 Mar 2029'], ['Road tax expiry', '31 Jan 2027']],
    corppass: [['Entity name', MYINFO_BIZ.company], ['UEN', MYINFO_BIZ.uen], ['Entity status', 'Live'], ['Your name and role', MYINFO_BIZ.name + ', ' + MYINFO_BIZ.role], ['Registered address', '12 Toh Guan Road East, Singapore 608602'], ['Contact', MYINFO_BIZ.email]]
  };
  function openConsent(idp) {
    client.idp = idp;
    $('consent-idp').textContent = idp === 'corppass' ? 'Corppass' : 'Singpass';
    $('consent-list').innerHTML = CONSENT[idp].map(function (r) { return '<li><b>' + r[0] + '</b><span>' + r[1] + '</span></li>'; }).join('');
    stepMobile.hidden = true; $('step-consent').hidden = false;
  }
  $('idp-singpass').addEventListener('click', function () { openConsent('singpass'); });
  $('idp-corppass').addEventListener('click', function () { openConsent('corppass'); });
  $('consent-cancel').addEventListener('click', function () { $('step-consent').hidden = true; stepMobile.hidden = false; client.idp = ''; });
  $('consent-allow').addEventListener('click', function () {
    $('step-consent').hidden = true; auth.style.display = 'none'; newClient = true;
    signup.classList.add('is-on');
    if (client.idp === 'corppass') {
      setType('business');
      $('su-company').value = MYINFO_BIZ.company; $('su-uen').value = MYINFO_BIZ.uen; $('su-role').value = MYINFO_BIZ.role; $('su-name').value = MYINFO_BIZ.name; $('su-email').value = MYINFO_BIZ.email;
      client.mobile = '9123 4567';
    } else {
      setType('personal');
      $('su-name').value = 'Alex Tan'; $('su-email').value = 'alex.tan@example.com'; client.mobile = '9123 4567';
      fillVehicle(SAMPLE); drop.hidden = true; $('reading').hidden = true; $('extract').hidden = false;
      $('extract-title').textContent = 'Read from Myinfo via Singpass';
    }
    $('su-mobile').textContent = '+65 ' + client.mobile + ' (from ' + (client.idp === 'corppass' ? 'Corppass' : 'Singpass') + ')';
    showStep(1); window.scrollTo(0, 0);
  });

  /* ---------- dashboard ---------- */
  function enterApp() {
    var first = client.name.split(' ')[0];
    var initials = client.name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase();
    $('greet-name').textContent = first; $('user-name').textContent = client.name; $('user-av').textContent = initials;
    $('user-mobile').textContent = '+65 ' + client.mobile;
    var v = client.vehicle, r = roadTax(v);
    renderRoadTax($('rt-view'), v);
    $('ov-rt').textContent = (client.rtChoice === 'thib' ? 'THIB renews this for you. ' : 'You renew this at LTA. ') + (r ? 'From your log card: ' + sgd(r.twelve) + ' for 12 months, ' + sgd(r.six) + ' for 6.' : '');
    app.classList.add('is-on');
    showView('overview');
  }

  function showView(name) {
    document.querySelectorAll('.thp-view').forEach(function (v) { v.classList.toggle('is-on', v.dataset.view === name); });
    document.querySelectorAll('.thp-nav__link, .thp-tabbar__link').forEach(function (link) { link.classList.toggle('is-active', link.dataset.view === name); });
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', function (e) {
    var navLink = e.target.closest('a[data-view], button[data-view]');
    if (navLink) { e.preventDefault(); showView(navLink.dataset.view); return; }
    var jump = e.target.closest('[data-goto]');
    if (jump) { var target = $(jump.dataset.goto); if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  });

  document.querySelectorAll('[data-choice]').forEach(function (opt) {
    opt.addEventListener('click', function () { document.querySelectorAll('[data-choice]').forEach(function (o) { o.classList.remove('is-on'); }); opt.classList.add('is-on'); });
  });
  document.querySelectorAll('.thp-quote').forEach(function (q) {
    q.addEventListener('click', function () { document.querySelectorAll('.thp-quote').forEach(function (o) { o.classList.remove('is-pick'); }); q.classList.add('is-pick'); });
  });
})();
