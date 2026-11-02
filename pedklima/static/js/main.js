(function () {
  /* Medená trasa: spája fotku v úvode s kontaktom a plní sa pri skrolovaní. */
  var svg = document.querySelector('.pipe');
  var start = document.querySelector('[data-pipe-start]');
  var end = document.querySelector('[data-pipe-end]');
  var bed = svg.querySelector('.pipe__bed');
  var flow = svg.querySelector('.pipe__flow');
  var cap = svg.querySelector('.pipe__end');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var samples = [];
  var total = 0;

  function top(el) { return el.getBoundingClientRect().top + window.scrollY; }
  function left(el) { return el.getBoundingClientRect().left + window.scrollX; }

  // Lomená čiara s oblúkmi v kolenách.
  function route(pts, r) {
    var d = 'M' + pts[0][0] + ' ' + pts[0][1];
    for (var i = 1; i < pts.length - 1; i++) {
      var p = pts[i - 1], q = pts[i], n = pts[i + 1];
      var a = Math.hypot(q[0] - p[0], q[1] - p[1]);
      var b = Math.hypot(n[0] - q[0], n[1] - q[1]);
      var k = Math.min(r, a / 2, b / 2);
      var x1 = q[0] - (q[0] - p[0]) / (a || 1) * k, y1 = q[1] - (q[1] - p[1]) / (a || 1) * k;
      var x2 = q[0] + (n[0] - q[0]) / (b || 1) * k, y2 = q[1] + (n[1] - q[1]) / (b || 1) * k;
      d += 'L' + x1 + ' ' + y1 + 'Q' + q[0] + ' ' + q[1] + ' ' + x2 + ' ' + y2;
    }
    var l = pts[pts.length - 1];
    return d + 'L' + l[0] + ' ' + l[1];
  }

  function build() {
    var w = document.documentElement.clientWidth;
    // Výška z päty stránky: scrollHeight by zarátal aj samotnú čiaru a po zmene okna by ostalo prázdne miesto.
    var h = Math.floor(document.querySelector('.foot').getBoundingClientRect().bottom + window.scrollY);
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.style.height = h + 'px';
    var wrap = document.querySelector('.wrap');
    var wrapLeft = left(wrap);
    var wide = w >= 1000;
    var gutter = wide ? Math.max(20, wrapLeft - 34) : 9;
    var right = wide ? w - gutter : gutter;
    var targetX = left(end) - 16;
    var targetY = top(end) + end.offsetHeight / 2;
    var pts = [];
    var imgBottom = top(start) + start.offsetHeight;
    if (wide) {
      var sx = left(start) + 56;
      pts.push([sx, imgBottom]);
    } else {
      pts.push([gutter, imgBottom]);
    }
    var x = pts[0][0];
    document.querySelectorAll('[data-pipe]').forEach(function (s) {
      var side = s.getAttribute('data-pipe') === 'right' ? right : gutter;
      var y = top(s) + (wide ? 44 : 0);
      if (s.id === 'kontakt') return;
      if (side !== x) { pts.push([x, y]); pts.push([side, y]); x = side; }
    });
    var kontakt = document.getElementById('kontakt');
    if (wide) {
      pts.push([x, targetY]);
      pts.push([targetX, targetY]);
    } else {
      pts.push([gutter, top(kontakt) + kontakt.offsetHeight - 10]);
    }
    var d = route(pts, wide ? 56 : 0);
    bed.setAttribute('d', d);
    flow.setAttribute('d', d);
    var last = pts[pts.length - 1];
    cap.setAttribute('cx', last[0]);
    cap.setAttribute('cy', last[1]);
    total = flow.getTotalLength();
    samples = [];
    for (var i = 0; i <= 500; i++) {
      var at = total * i / 500;
      samples.push([at, flow.getPointAtLength(at).y]);
    }
    if (calm) { flow.style.strokeDasharray = 'none'; cap.classList.add('is-on'); return; }
    flow.style.strokeDasharray = total + ' ' + total;
    paint();
  }

  function paint() {
    var line = window.scrollY + window.innerHeight * 0.72;
    var atEnd = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    var len = 0;
    for (var i = 0; i < samples.length; i++) {
      if (samples[i][1] <= line) len = samples[i][0]; else break;
    }
    if (atEnd) len = total;
    flow.style.strokeDashoffset = total - len;
    cap.classList.toggle('is-on', len >= total - 1);
  }

  var waiting = false;
  window.addEventListener('scroll', function () {
    if (calm || waiting) return;
    waiting = true;
    requestAnimationFrame(function () { waiting = false; paint(); });
  }, { passive: true });
  var timer;
  window.addEventListener('resize', function () { clearTimeout(timer); timer = setTimeout(build, 150); });
  window.addEventListener('load', build);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  document.querySelectorAll('img').forEach(function (im) { if (!im.complete) im.addEventListener('load', function () { clearTimeout(timer); timer = setTimeout(build, 150); }); });
  build();

  /* Zastavenie pásu recenzií */
  var toggle = document.querySelector('.reviews__toggle');
  if (toggle) toggle.addEventListener('click', function () {
    var paused = toggle.closest('.reviews').classList.toggle('is-paused');
    toggle.setAttribute('aria-pressed', paused);
    toggle.textContent = toggle.getAttribute(paused ? 'data-play' : 'data-stop');
  });

  /* Prehliadanie realizácií */
  var viewer = document.querySelector('.viewer');
  var items = Array.prototype.slice.call(document.querySelectorAll('.work__open'));
  var photo = viewer.querySelector('img');
  var caption = viewer.querySelector('.viewer__caption');
  var current = 0;
  function show(i) {
    current = (i + items.length) % items.length;
    var src = items[current].querySelector('img');
    photo.src = src.currentSrc || src.src;
    photo.alt = src.alt;
    caption.textContent = src.alt;
  }
  items.forEach(function (b, i) { b.addEventListener('click', function () { show(i); viewer.showModal(); }); });
  viewer.querySelector('.viewer__close').addEventListener('click', function () { viewer.close(); });
  viewer.querySelector('.viewer__prev').addEventListener('click', function () { show(current - 1); });
  viewer.querySelector('.viewer__next').addEventListener('click', function () { show(current + 1); });
  viewer.addEventListener('click', function (e) { if (e.target === viewer) viewer.close(); });
  viewer.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') show(current - 1);
    if (e.key === 'ArrowRight') show(current + 1);
  });
})();
