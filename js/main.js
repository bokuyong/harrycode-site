/* 해리코드 홈페이지 공통 스크립트: 내비, 히어로 점자 시연, 등장 애니메이션, 고정 문의 바, 폼 */
(function () {
  'use strict';
  var d = document, w = window, b = d.body;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = function () { return w.innerWidth < 768; };
  if (reduce) b.classList.add('no-motion');

  /* 모바일 메뉴 */
  var menuBtn = d.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function () {
      var open = b.classList.toggle('menu-open');
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      menuBtn.setAttribute('aria-label', open ? '메뉴 닫기' : '메뉴 열기');
      if (open) { var first = d.querySelector('.nav a'); if (first) first.focus(); }
    });
    d.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && b.classList.contains('menu-open')) { b.classList.remove('menu-open'); menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
    });
    d.querySelectorAll('.nav a').forEach(function (a) {
      a.addEventListener('click', function () { b.classList.remove('menu-open'); });
    });
  }

  /* 히어로 시연: 말 → 기기 안 해석 → 점자 출력. 실측 6.6초를 같은 속도로 재현 */
  var demo = d.querySelector('.demo');
  if (demo && reduce) { var rpx = demo.querySelector('.replay'); if (rpx) rpx.hidden = true; }
  if (demo && !reduce && w.requestAnimationFrame) {
    var TOTAL = 6600, T_THINK = 1800, T_PRINT = 3000, T_LAST = 6300;
    var state = demo.querySelector('.demo-state'), clock = demo.querySelector('.demo-clock');
    var typed = demo.querySelector('.typed'), full = typed ? typed.textContent : '';
    var bars = demo.querySelectorAll('.wave i');
    var dots = demo.querySelectorAll('.cell b.on');
    var LABEL = { listen: '듣는 중', think: '기기 안에서 해석 중', print: '점자 출력 중', done: '출력 완료' };
    var raf = 0, t0 = 0;
    function phase(p) { if (demo.getAttribute('data-phase') !== p) { demo.setAttribute('data-phase', p); state.textContent = LABEL[p]; } }
    function frame(now) {
      var t = now - t0;
      clock.textContent = (Math.min(t, TOTAL) / 1000).toFixed(1) + '초';
      if (t < T_THINK) {
        phase('listen');
        var n = Math.min(full.length, Math.floor(Math.max(0, t - 200) / 1400 * full.length));
        typed.textContent = full.slice(0, n);
        bars.forEach(function (b, i) { b.style.height = (6 + Math.abs(Math.sin(t / 90 + i * 1.7)) * 34 * Math.random()) + 'px'; });
      } else if (t < T_PRINT) {
        phase('think'); typed.textContent = full;
        bars.forEach(function (b) { b.style.height = '6px'; });
      } else if (t < TOTAL) {
        phase('print');
        var k = Math.floor((t - T_PRINT) / (T_LAST - T_PRINT) * dots.length);
        dots.forEach(function (dt, i) { dt.classList.toggle('up', i <= k); });
      } else {
        phase('done'); clock.textContent = '6.6초';
        dots.forEach(function (dt) { dt.classList.add('up'); });
        raf = 0; return;
      }
      raf = w.requestAnimationFrame(frame);
    }
    function play() {
      if (raf) w.cancelAnimationFrame(raf);
      demo.classList.add('armed');
      dots.forEach(function (dt) { dt.classList.remove('up'); });
      typed.textContent = '';
      raf = w.requestAnimationFrame(function (now) { t0 = now; frame(now); });
    }
    var rp = demo.querySelector('.replay');
    if (rp) rp.addEventListener('click', play);
    if ('IntersectionObserver' in w) {
      var dio = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { dio.disconnect(); play(); } }, { threshold: 0.4 });
      dio.observe(demo);
    } else play();
  }

  /* 등장 애니메이션: 첫 화면 안 요소는 즉시 표시 */
  var rv = Array.prototype.slice.call(d.querySelectorAll('.rv'));
  if ('IntersectionObserver' in w && !reduce) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rv.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < w.innerHeight) el.classList.add('in'); else io.observe(el);
    });
  } else { rv.forEach(function (el) { el.classList.add('in'); }); }

  /* 패럴랙스: 배경 레이어만, 모바일·reduced-motion 제외 */
  var layers = Array.prototype.slice.call(d.querySelectorAll('[data-parallax]'));
  var ticking = false;
  function parallax() {
    ticking = false;
    if (reduce || mobile()) { layers.forEach(function (l) { l.style.transform = ''; }); return; }
    var vh = w.innerHeight;
    layers.forEach(function (l) {
      var p = l.parentElement.getBoundingClientRect();
      if (p.bottom < 0 || p.top > vh) return;
      var speed = parseFloat(l.getAttribute('data-parallax')) || 0.4;
      var center = p.top + p.height / 2 - vh / 2;
      l.style.transform = 'translate3d(0,' + (center * (1 - speed) * -0.35).toFixed(1) + 'px,0)';
    });
  }
  function onScroll() { if (!ticking) { ticking = true; w.requestAnimationFrame(parallax); } }
  if (layers.length) { w.addEventListener('scroll', onScroll, { passive: true }); w.addEventListener('resize', onScroll); parallax(); }

  /* 하단 고정 문의 바 */
  var bar = d.querySelector('.bar');
  var hero = d.querySelector('.hero, .page-head');
  var contact = d.querySelector('#contact');
  var closed = false;
  try { closed = sessionStorage.getItem('hc-bar-closed') === '1'; } catch (e) {}
  function barState() {
    if (!bar || closed) return;
    var vh = w.innerHeight, show = true;
    if (hero && hero.getBoundingClientRect().bottom > vh * 0.4) show = false;
    if (contact && contact.getBoundingClientRect().top < vh * 0.8) show = false;
    bar.classList.toggle('show', show);
    b.classList.toggle('bar-on', show);
    if (show) bar.removeAttribute('inert'); else bar.setAttribute('inert', '');
  }
  if (bar) {
    w.addEventListener('scroll', barState, { passive: true }); barState();
    var x = bar.querySelector('.x');
    if (x) x.addEventListener('click', function () {
      closed = true; bar.classList.remove('show'); b.classList.remove('bar-on');
      try { sessionStorage.setItem('hc-bar-closed', '1'); } catch (e) {}
    });
    var bf = bar.querySelector('form');
    if (bf) bf.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var v = bf.querySelector('input').value.trim();
      if (!v) { bf.querySelector('input').focus(); return; }
      send({ contact: v, source: '하단 문의 바' });
      bar.classList.add('sent');
    });
  }

  /* 문의 폼: 백엔드 연결 전까지 메일 클라이언트로 전달 + 화면 안내 */
  var MAIL = 'harry@harry-code.com';
  function send(data) {
    var lines = Object.keys(data).map(function (k) { return k + ': ' + data[k]; });
    var href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('[해리코드 홈페이지 문의] ' + (data.company || data.contact || '')) +
      '&body=' + encodeURIComponent(lines.join('\n'));
    try { w.location.href = href; } catch (e) {}
  }
  var form = d.querySelector('.form');
  if (form) form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var data = {};
    form.querySelectorAll('input,select,textarea').forEach(function (f) { if (f.name) data[f.name] = f.value.trim(); });
    if (!data.name || !data.contact || !data.message) {
      form.classList.add('invalid');
      var first = form.querySelector('[required]:invalid') || form.querySelector('[name=name]');
      if (first) first.focus(); return;
    }
    form.classList.remove('invalid');
    send(data);
    form.classList.add('sent');
  });

  /* 프로세스 페이지: 탭 + 스크롤 고정형 */
  var tabs = d.querySelectorAll('.tabs button');
  if (tabs.length) {
    var panels = d.querySelectorAll('.panel');
    function selectTab(i, push) {
      tabs.forEach(function (t, j) { t.setAttribute('aria-selected', i === j ? 'true' : 'false'); t.setAttribute('tabindex', i === j ? '0' : '-1'); });
      panels.forEach(function (p, j) { p.classList.toggle('on', i === j); });
      if (push) { try { history.replaceState(null, '', '#' + panels[i].id); } catch (e) {} }
      setupSteps(panels[i]);
      w.scrollTo({ top: d.querySelector('.tabs').getBoundingClientRect().top + w.pageYOffset - 60, behavior: reduce ? 'auto' : 'smooth' });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { selectTab(i, true); });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowRight') n = (i + 1) % tabs.length;
        if (e.key === 'ArrowLeft') n = (i - 1 + tabs.length) % tabs.length;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = tabs.length - 1;
        if (n !== null) { e.preventDefault(); selectTab(n, true); tabs[n].focus(); }
      });
    });
    var initial = 0;
    if (location.hash) panels.forEach(function (p, i) { if ('#' + p.id === location.hash) initial = i; });
    tabs.forEach(function (t, j) { t.setAttribute('aria-selected', initial === j ? 'true' : 'false'); });
    panels.forEach(function (p, j) { p.classList.toggle('on', initial === j); });
    setupSteps(panels[initial]);
  }
  var stepIO = null;
  function setupSteps(panel) {
    if (!panel) return;
    if (stepIO) { stepIO.disconnect(); stepIO = null; }
    var steps = panel.querySelectorAll('.step');
    var imgs = panel.querySelectorAll('.proc-photo > :not(.cap)');
    var cap = panel.querySelector('.proc-photo .cap');
    var prog = panel.querySelector('.steps .prog');
    function activate(i) {
      steps.forEach(function (s, j) { s.classList.toggle('on', i === j); });
      imgs.forEach(function (im, j) { im.classList.toggle('on', i === j); });
      if (cap && imgs[i]) cap.textContent = imgs[i].getAttribute('data-cap') || '';
      if (prog && steps[i]) {
        var first = steps[0].getBoundingClientRect(), cur = steps[i].getBoundingClientRect();
        prog.style.height = (cur.top - first.top + 24) + 'px';
      }
    }
    activate(0);
    if (!('IntersectionObserver' in w)) return;
    stepIO = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) activate(Array.prototype.indexOf.call(steps, e.target));
      });
    }, { rootMargin: '-40% 0px -45% 0px', threshold: 0 });
    steps.forEach(function (s) { stepIO.observe(s); });
  }

  /* 탭 없이 패널 하나만 있는 페이지(개발 의뢰)도 스크롤 고정형 동작 */
  if (!tabs.length) { var onlyPanel = d.querySelector('.panel'); if (onlyPanel) { onlyPanel.classList.add('on'); setupSteps(onlyPanel); } }

  /* 포트폴리오: 필터 + 라이트박스 */
  var filters = d.querySelectorAll('.filters button');
  if (filters.length) {
    var cards = d.querySelectorAll('.pf[data-tags]');
    filters.forEach(function (f) {
      f.addEventListener('click', function () {
        filters.forEach(function (o) { o.setAttribute('aria-pressed', o === f ? 'true' : 'false'); });
        var key = f.getAttribute('data-filter');
        cards.forEach(function (c) {
          c.classList.toggle('hide', !(key === 'all' || (' ' + c.getAttribute('data-tags') + ' ').indexOf(' ' + key + ' ') >= 0));
        });
      });
    });
  }
  var lb = d.querySelector('.lb');
  if (lb) {
    var lbImg = lb.querySelector('.lb-img img'), lbTitle = lb.querySelector('.lb-title'), lbDesc = lb.querySelector('.lb-desc'),
        lbScope = lb.querySelector('.lb-scope'), lbYear = lb.querySelector('.lb-year'), lbThumbs = lb.querySelector('.lb-thumbs');
    var gallery = [], idx = 0, lastFocus = null;
    function showIdx(i) {
      idx = (i + gallery.length) % gallery.length;
      lbImg.src = gallery[idx].src; lbImg.alt = gallery[idx].alt || '';
      lbThumbs.querySelectorAll('button').forEach(function (t, j) { if (idx === j) t.setAttribute('aria-current', 'true'); else t.removeAttribute('aria-current'); });
    }
    function openLb(card) {
      var data = JSON.parse(card.getAttribute('data-gallery') || '[]');
      gallery = data; if (!gallery.length) return;
      lbTitle.textContent = card.getAttribute('data-title') || '';
      lbDesc.textContent = card.getAttribute('data-desc') || '';
      lbScope.textContent = card.getAttribute('data-scope') || '';
      lbYear.textContent = card.getAttribute('data-year') || '';
      lbThumbs.innerHTML = '';
      gallery.forEach(function (g, i) {
        var t = d.createElement('button'); t.type = 'button'; t.setAttribute('aria-label', (i + 1) + '번 사진');
        var im = d.createElement('img'); im.src = g.src; im.alt = ''; im.loading = 'lazy'; t.appendChild(im);
        t.addEventListener('click', function () { showIdx(i); });
        lbThumbs.appendChild(t);
      });
      showIdx(0);
      var single = gallery.length < 2;
      lb.querySelector('.prev').hidden = single; lb.querySelector('.next').hidden = single;
      lastFocus = d.activeElement;
      lb.classList.add('on'); b.style.overflow = 'hidden';
      d.querySelectorAll('header, main, footer, .bar, .fab').forEach(function (el) { el.setAttribute('inert', ''); });
      lb.querySelector('.lb-close').focus();
    }
    function closeLb() {
      lb.classList.remove('on'); b.style.overflow = '';
      d.querySelectorAll('header, main, footer, .fab').forEach(function (el) { el.removeAttribute('inert'); });
      if (bar && bar.classList.contains('show')) bar.removeAttribute('inert');
      if (lastFocus) lastFocus.focus();
    }
    d.querySelectorAll('.pf button.open').forEach(function (btn) {
      btn.addEventListener('click', function () { openLb(btn.closest('.pf')); });
    });
    lb.querySelector('.lb-close').addEventListener('click', closeLb);
    lb.querySelector('.prev').addEventListener('click', function () { showIdx(idx - 1); });
    lb.querySelector('.next').addEventListener('click', function () { showIdx(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) closeLb(); });
    d.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('on')) return;
      if (e.key === 'Escape') closeLb();
      if (e.key === 'ArrowLeft') showIdx(idx - 1);
      if (e.key === 'ArrowRight') showIdx(idx + 1);
    });
  }
})();
