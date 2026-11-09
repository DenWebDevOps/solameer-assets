/* v3 core, the only v3 script in the page at first. It loads the rest when it is needed:
   - Lenis (smooth wheel) at once, but only for a mouse or trackpad and without reduced motion;
     touch keeps native scrolling.
   - GSAP and the two signature sections when the first of them is about two screens away, so the
     first load of the page does not pay for them.
   It also holds what they share: in-page links that move focus, and the reduced-motion switch. (Until
   2026-11-02 it also pinned those sections, one step per wheel gesture; Drew's call of 2026-10-27 took that
   away: the page scrolls past them freely, see roof-ui.js and photo-story.js.)
   And the home's lighter layer: entrances, the hero's counters, the FAQ, the safety check.
   The script tag carries the URLs: data-lenis, data-gsap, data-story, data-roof. */
(function () {
  'use strict';
  var d = document, root = d.documentElement, W = window;
  var me = d.currentScript || d.querySelector('script[data-gsap]');
  var src = (me && me.dataset) || {};
  var reduce = W.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = W.matchMedia('(hover: hover) and (pointer: fine)').matches;
  root.classList.add('v3-js');
  if (!reduce) root.classList.add('v3-motion');

  function load(url) {
    return new Promise(function (resolve, reject) {
      var s = d.createElement('script');
      s.src = url;
      s.onload = resolve;
      s.onerror = reject;
      d.head.appendChild(s);
    });
  }

  function navH() {
    var v = parseInt(getComputedStyle(root).getPropertyValue('--navh'), 10);
    return isNaN(v) ? 84 : v;
  }
  function navOffset() { return navH() + 16; }

  // ---- the cinematic layer: the 3D cameras breathe while on screen, the story's step line keeps time
  root.classList.toggle('v3-cine', !reduce);

  // ---- smooth wheel -------------------------------------------------------------------------------
  var lenis = null;
  W.v3Lenis = null;
  if (!reduce && fine && src.lenis) {
    load(src.lenis).then(function () {
      // allowNestedScroll: a list that scrolls on its own (the office directory, the chat) takes the wheel
      // until it reaches its end, instead of the page
      lenis = new W.Lenis({ lerp: 0.1, wheelMultiplier: 1, smoothWheel: true, syncTouch: false, anchors: false, autoRaf: true, allowNestedScroll: true });
      W.v3Lenis = lenis;
    }).catch(function () { /* no smooth wheel: native scrolling */ });
  }

  // Scroll to an element or to a y position. Focus follows when an element is given.
  W.v3ScrollTo = function (target, opts) {
    opts = opts || {};
    var y = typeof target === 'number' ? target
      : target.getBoundingClientRect().top + W.scrollY - (opts.offset != null ? opts.offset : navOffset());
    if (lenis) lenis.scrollTo(y, { duration: opts.duration || 1.2, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else W.scrollTo(0, y);
    if (typeof target !== 'number' && opts.focus !== false) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  };

  d.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
    var id = a.getAttribute('href').slice(1);
    var el = id && d.getElementById(id);
    if (!el) return;
    e.preventDefault();
    W.v3ScrollTo(el, id === 'top' ? { offset: 0 } : null);
    if (history.replaceState) history.replaceState(null, '', '#' + id);
  });

  // ---- entrances ------------------------------------------------------------------------------------
  // Every block plays a short entrance as it comes into view. Content is visible by default. A block still
  // below the screen gets its hidden start state (.rv-wait) only while the page is visible and an observer
  // is running to take it away again; blocks already on screen are left as they are. Armed after load, in
  // an idle moment, so none of it stands in the way of the first paint.
  var rvEls = [].slice.call(d.querySelectorAll('main .rv, main [data-rv]'));
  var onReveal = [];                                      // [element, fn]: run when that block comes in
  function revealed(el) {
    el.classList.add('rv-seen');
    onReveal.forEach(function (r) { if (r[0] === el || el.contains(r[0])) r[1](); });
  }
  var rvIO = null;
  if (rvEls.length && W.IntersectionObserver && !reduce) {
    rvIO = new IntersectionObserver(function (en) {
      en.forEach(function (e) {
        var el = e.target;
        if (!el.classList.contains('rv-wait')) return;
        if (e.isIntersecting) { rvIO.unobserve(el); el.classList.remove('rv-wait'); el.classList.add('is-in'); revealed(el); }
        // passed over by a jump (a link, the scrollbar): shown as it is
        else if (e.boundingClientRect.top < 0) { rvIO.unobserve(el); el.classList.remove('rv-wait'); revealed(el); }
      });
    }, { rootMargin: '0px 0px -10% 0px' });
    var arm = function () {
      if (d.visibilityState !== 'visible') return;
      var h = W.innerHeight;
      rvEls.forEach(function (el) {
        if (el.classList.contains('rv-seen') || el.classList.contains('rv-wait')) return;
        if (el.getBoundingClientRect().top < h * 0.9) revealed(el);
        else { el.classList.add('rv-wait'); rvIO.observe(el); }
      });
    };
    var unarm = function () {
      rvEls.forEach(function (el) {
        if (!el.classList.contains('rv-wait')) return;
        el.classList.remove('rv-wait');
        rvIO.unobserve(el);
      });
    };
    d.addEventListener('visibilitychange', function () { if (d.visibilityState === 'visible') arm(); else unarm(); });
    W.addEventListener('beforeprint', unarm);
    var later = function () { (W.requestIdleCallback || function (f) { setTimeout(f, 200); })(arm, { timeout: 1200 }); };
    if (d.readyState === 'complete') later(); else W.addEventListener('load', later);
  }
  function whenIn(el, fn) {
    if (!el) return;
    if (!rvIO) { fn(); return; }
    onReveal.push([el, fn]);
  }

  // ---- counters: figures count up the first time they come in -------------------------------------
  // the figure stays as written until the first frame runs, so a page that never paints keeps it
  function countUp(el) {
    var m = /^(\d+)(\D*)$/.exec(el.textContent.trim());
    if (!m || reduce) return;
    var to = +m[1], t0 = 0, dur = 1500;
    if (to < 2) return;
    W.requestAnimationFrame(function step(now) {
      if (!t0) t0 = now;
      var k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 4);
      el.textContent = Math.round(to * e) + m[2];
      if (k < 1) W.requestAnimationFrame(step);
    });
  }
  // the about section's figures count when their row comes into view (2026-10-24, the user's call: the hero's
  // cards stay still now); a figure under 2 (the one business day) stays as it is
  [].forEach.call(d.querySelectorAll('.v3-ab__figs dd'), function (el) { whenIn(el, function () { countUp(el); }); });

  // (the FAQ's smooth answers moved to chrome.js on 2026-10-25, for every accordion on every page)

  // ---- photos drift inside their frames as the page scrolls (as on Apex) ---------------------------
  // The frame clips a slightly larger photo, which moves against the scroll.
  var pxImgs = [].slice.call(d.querySelectorAll('.v3-px img'));
  if (pxImgs.length && !reduce) {
    root.classList.add('v3-pxjs');
    var pxTick = false;
    var drift = function () {
      pxTick = false;
      var vh = W.innerHeight;
      for (var i = 0; i < pxImgs.length; i++) {
        var r = pxImgs[i].parentNode.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) continue;
        var c = (r.top + r.height / 2 - vh / 2) / vh;
        pxImgs[i].style.transform = 'translate3d(0,' + (c * -7).toFixed(2) + '%,0) scale(1.16)';
      }
    };
    W.addEventListener('scroll', function () { if (!pxTick) { pxTick = true; W.requestAnimationFrame(drift); } }, { passive: true });
    W.addEventListener('resize', drift);
    drift();
  }

  // ---- safety: the site check plays item by item when the photo comes in, and again on return -------
  var card = d.querySelector('.v3-sf__card');
  if (card && W.IntersectionObserver && !reduce) {
    var lis = [].slice.call(card.querySelectorAll('.v3-sf__list li')), bar = card.querySelector('.v3-sf__bar'), cnt = card.querySelector('.v3-sf__done em');
    var timers = [], fill = bar.querySelector('i'), run = null;
    var playCheck = function (delay) {
      timers.forEach(clearTimeout);
      timers = [];
      card.classList.add('is-playing');
      lis.forEach(function (li) { li.classList.remove('is-on', 'is-set'); });
      cnt.textContent = '0';
      // the line fills in one steady run and reaches each quarter as its check is ticked
      if (run) run.cancel();
      if (fill.animate) run = fill.animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: lis.length * 650, delay: delay - 650, easing: 'linear', fill: 'both' });
      lis.forEach(function (li, k) {
        timers.push(setTimeout(function () {
          li.classList.add('is-on');
          cnt.textContent = String(k + 1);
          timers.push(setTimeout(function () { li.classList.add('is-set'); }, 320));
        }, delay + k * 650));
      });
    };
    // the first time, the photo comes in, then the card (CSS, data-rv="seq"), and once it has landed the
    // line starts; on a return it all starts sooner
    var seen = false, wait = 2400;
    new IntersectionObserver(function (en) {
      var e = en[0];
      if (e.isIntersecting && d.visibilityState === 'visible') { if (!seen) { seen = true; playCheck(wait); wait = 900; } }
      else if (!e.isIntersecting) seen = false;
    }, { rootMargin: '0px 0px -15% 0px' }).observe(card.parentNode);
  }


  // ---- the signature sections, when the first of them comes near -----------------------------
  var started = false;
  function startSections() {
    if (started || !src.gsap) return;
    started = true;
    load(src.gsap)
      .then(function () { return src.story ? load(src.story) : null; })
      .then(function () { return src.roof ? load(src.roof) : null; })
      .catch(function () { /* the sections keep their plain layout: all text, the photo, the poster */ });
  }
  var first = d.querySelector('.v3-story, .v3-roof');
  if (!first) return;
  if (/[?&]v3capture=1/.test(location.search) || !W.IntersectionObserver) startSections();
  else {
    var io = new IntersectionObserver(function (en) {
      if (!en.some(function (x) { return x.isIntersecting; })) return;
      io.disconnect();
      startSections();
    }, { rootMargin: '200% 0px' });
    io.observe(first);
  }
})();
