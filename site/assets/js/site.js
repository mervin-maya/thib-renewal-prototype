/* Shared behaviour for the generated pages: header shadow, reveal, drawer, partner marquee. */
(function () {
  var partners = [['aia','AIA'],['aig','AIG'],['allianz','Allianz'],['berkshire-hathaway','Berkshire Hathaway Specialty Insurance'],['chubb','Chubb'],['direct-asia','Direct Asia'],['eq-insurance','EQ Insurance'],['ergo','ERGO'],['great-eastern','Great Eastern'],['india-international','India International Insurance'],['income','Income'],['msig','MSIG'],['qbe','QBE'],['tokio-marine','Tokio Marine']];
  document.querySelectorAll('[data-logos]').forEach(function (track) {
    var html = partners.map(function (p) { return '<img src="assets/img/partners/' + p[0] + '.png" alt="' + p[1] + '" loading="lazy">'; }).join('');
    track.innerHTML = html + html;
  });
  var header = document.getElementById('header');
  var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  document.querySelectorAll('.th-reveal').forEach(function (el) { io.observe(el); });
  var burger = document.getElementById('burger'), drawer = document.getElementById('drawer');
  burger.addEventListener('click', function () {
    var open = drawer.classList.toggle('is-open');
    burger.setAttribute('aria-expanded', String(open));
    document.body.style.overflow = open ? 'hidden' : '';
  });
  drawer.addEventListener('click', function (ev) {
    if (ev.target.tagName === 'A') { drawer.classList.remove('is-open'); burger.setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; }
  });
})();
