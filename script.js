/* ═══════════════════════════════════════════
   Ardian Candra Pratama — Site Interactions
   Vanilla JS · Zero dependencies
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
    if (nav) nav.classList.toggle('scrolled', window.scrollY > 30);
  }
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  /* ── Mobile menu ── */
  var toggle = document.getElementById('navToggle');
  var links = document.getElementById('navLinks');
  function closeMenu() {
    if (!links || !toggle) return;
    links.classList.remove('open');
    toggle.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
  }
  if (toggle && links) {
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
  }

  /* ── Nav dropdown (Simply Tech) ── */
  var dropBtn = document.getElementById('navDropBtn');
  var drop = dropBtn ? dropBtn.closest('.nav-dropdown') : null;
  if (dropBtn && drop) {
    dropBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = drop.classList.toggle('open');
      dropBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!drop.contains(e.target)) {
        drop.classList.remove('open');
        dropBtn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        drop.classList.remove('open');
        dropBtn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* ── Experience Timeline Category Filter ── */
  var filterBtns = document.querySelectorAll('.tl-filter');
  var timelineItems = document.querySelectorAll('.timeline .tl-item');
  if (filterBtns.length && timelineItems.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var filter = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) {
          var active = b === btn;
          b.classList.toggle('active', active);
          b.setAttribute('aria-selected', active ? 'true' : 'false');
        });
        timelineItems.forEach(function (item) {
          var cat = item.getAttribute('data-category');
          var show = filter === 'all' || cat === filter;
          item.classList.toggle('is-hidden', !show);
          if (show) item.classList.add('in');
        });
      });
    });
  }

  /* ── Copy Email Micro-interaction ── */
  var copyBtn = document.getElementById('copyEmailBtn');
  if (copyBtn) {
    var defaultLabel = copyBtn.textContent;
    var copyTimer = null;
    copyBtn.addEventListener('click', function () {
      var email = copyBtn.getAttribute('data-email') || 'ardian.candra.p@gmail.com';
      function showCopied() {
        copyBtn.textContent = 'Copied ✓';
        copyBtn.classList.add('copied');
        if (copyTimer) clearTimeout(copyTimer);
        copyTimer = setTimeout(function () {
          copyBtn.textContent = defaultLabel;
          copyBtn.classList.remove('copied');
        }, 2200);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(showCopied).catch(function () {
          window.location.href = 'mailto:' + email;
        });
      } else {
        var ta = document.createElement('textarea');
        ta.value = email;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy'); showCopied(); } catch (err) {}
        document.body.removeChild(ta);
      }
    });
  }

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
      var eased = 1 - Math.pow(1 - p, 3);
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
  var sections = ['top', 'about', 'experience', 'projects', 'skills', 'services', 'contact']
    .map(function (id) { return document.getElementById(id); })
    .filter(Boolean);
  var navAnchors = links ? Array.prototype.slice.call(links.querySelectorAll('a[href^="#"]')) : [];
  if ('IntersectionObserver' in window && sections.length && navAnchors.length) {
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id === 'top' ? '' : '#' + entry.target.id;
          navAnchors.forEach(function (a) {
            a.classList.toggle('active', id !== '' && a.getAttribute('href') === id);
          });
        }
      });
    }, { rootMargin: '-38% 0px -55% 0px' });
    sections.forEach(function (s) { sio.observe(s); });
  }

  /* ── Hero canvas: energy grid & daily solar power curve ── */
  var canvas = document.getElementById('heroCanvas');
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
          s: 0.4 + Math.random() * 1.4,
          r: 0.8 + Math.random() * 1.8,
          hue: Math.random() < 0.72 ? 'amber' : 'cyan',
          o: 0.25 + Math.random() * 0.55
        });
      }
    }

    function powerCurveY(x) {
      var day = (x / W) * Math.PI;
      var base = Math.sin(day);
      var ripple = 0.08 * Math.sin(x * 0.02 + T * 1.6) + 0.04 * Math.sin(x * 0.05 - T);
      return H * 0.62 - (base * H * 0.28) - ripple * H * 0.2;
    }

    function draw() {
      if (!running) return;
      T += 0.008;
      ctx.clearRect(0, 0, W, H);

      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 1;
      var gs = 56;
      ctx.beginPath();
      for (var gx = (T * 12) % gs; gx < W; gx += gs) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
      for (var gy = 0; gy < H; gy += gs) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
      ctx.stroke();

      var grad = ctx.createLinearGradient(0, 0, W, 0);
      grad.addColorStop(0, 'rgba(245,226,20,0)');
      grad.addColorStop(0.5, 'rgba(245,226,20,0.85)');
      grad.addColorStop(1, 'rgba(255,255,255,0.7)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 2;
      ctx.shadowColor = 'rgba(245,226,20,0.5)';
      ctx.shadowBlur = 14;
      ctx.beginPath();
      for (var x = 0; x <= W; x += 6) {
        var y = powerCurveY(x);
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      particles.forEach(function (p) {
        p.x += p.s;
        p.y += Math.sin(T * 2 + p.x * 0.01) * 0.25;
        if (p.x > W + 10) { p.x = -10; p.y = Math.random() * H; }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.hue === 'amber'
          ? 'rgba(245,226,20,' + p.o.toFixed(2) + ')'
          : 'rgba(255,255,255,' + p.o.toFixed(2) + ')';
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
