/* ═══════════════════════════════════════════
   Ardian Candra — site interactions
   Vanilla JS · no dependencies
   ═══════════════════════════════════════════ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Footer year ── */
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ── Sticky nav state ── */
  var nav = document.getElementById('nav');
  function onScrollNav() {
    nav.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ── Mobile menu ── */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  function closeMenu() {
    links.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }
  toggle.addEventListener('click', function () {
    var open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  });
  links.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
  });

  /* ── Scroll reveal ── */
  var revealEls = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ── Animated counters ── */
  function formatNum(value, decimals, grouping) {
    var s = value.toFixed(decimals);
    if (grouping) {
      var parts = s.split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      s = parts.join('.');
    }
    return s;
  }
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-target'));
    var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
    var grouping = el.getAttribute('data-grouping') === '1';
    var prefix = el.getAttribute('data-prefix') || '';
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduceMotion) {
      el.textContent = prefix + formatNum(target, decimals, grouping) + suffix;
      return;
    }
    var duration = 1600;
    var start = null;
    function tick(now) {
      if (!start) start = now;
      var p = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      el.textContent = prefix + formatNum(target * eased, decimals, grouping) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  var counters = document.querySelectorAll('.count');
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(animateCount);
  }

  /* ── Active nav link highlighting ── */
  var sections = ['about', 'experience', 'projects', 'skills', 'services', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navAnchors = Array.prototype.slice.call(links.querySelectorAll('a[href^="#"]'));
  if ('IntersectionObserver' in window && sections.length) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = '#' + entry.target.id;
          navAnchors.forEach(function (a) {
            a.classList.toggle('active', a.getAttribute('href') === id);
          });
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { sio.observe(s); });
  }

  /* ── Hero canvas: energy grid ──
     Lightweight particle flow along a faint grid,
     with a glowing "power curve" sweeping through. */
  var canvas = document.getElementById('heroCanvas');
  /* Pause SMIL animations (harbor waves) when reduced motion is preferred */
  if (reduceMotion) {
    document.querySelectorAll('svg.thesis-svg').forEach(function (s) {
      if (s.pauseAnimations) s.pauseAnimations();
    });
  }

  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1;
    var particles = [];
    var T = 0;
    var running = true;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth; H = canvas.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedParticles();
    }

    function seedParticles() {
      particles = [];
      var n = Math.min(90, Math.floor(W * H / 16000));
      for (var i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          s: 0.4 + Math.random() * 1.4,          // speed
          r: 0.8 + Math.random() * 1.8,          // radius
          hue: Math.random() < 0.72 ? 'amber' : 'cyan',
          o: 0.25 + Math.random() * 0.55         // opacity
        });
      }
    }

    function powerCurveY(x) {
      // daily solar-like curve drifting slowly with time
      var day = (x / W) * Math.PI;
      var base = Math.sin(day);
      var ripple = 0.08 * Math.sin(x * 0.02 + T * 1.6) + 0.04 * Math.sin(x * 0.05 - T);
      return H * 0.62 - (base * H * 0.28) - ripple * H * 0.2;
    }

    function draw() {
      if (!running) return;
      T += 0.008;
      ctx.clearRect(0, 0, W, H);

      // faint grid
      ctx.strokeStyle = 'rgba(255,255,255,0.045)';
      ctx.lineWidth = 1;
      var gs = 56;
      ctx.beginPath();
      for (var gx = (T * 12) % gs; gx < W; gx += gs) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
      for (var gy = 0; gy < H; gy += gs) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
      ctx.stroke();

      // power curve
      var grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, 'rgba(255,178,36,0)');
      grad.addColorStop(0.5, 'rgba(255,178,36,0.55)');
      grad.addColorStop(1, 'rgba(77,227,255,0.45)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(255,178,36,0.5)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      for (var x = 0; x <= W; x += 6) {
        var y = powerCurveY(x);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // particles drifting right, bobbing gently
      particles.forEach(function (p) {
        p.x += p.s;
        p.y += Math.sin(T * 2 + p.x * 0.01) * 0.25;
        if (p.x > W + 10) { p.x = -10; p.y = Math.random() * H; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 'amber'
          ? 'rgba(255,178,36,' + p.o.toFixed(2) + ')'
          : 'rgba(77,227,255,' + p.o.toFixed(2) + ')';
        ctx.fill();
      });

      requestAnimationFrame(draw);
    }

    document.addEventListener('visibilitychange', function () {
      if (document.hidden) { running = false; }
      else if (!reduceMotion) { running = true; requestAnimationFrame(draw); }
    });
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(draw);
  }
})();
