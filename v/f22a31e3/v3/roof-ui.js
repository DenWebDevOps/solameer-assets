/* v3 roof section UI: system tabs, the roof opening on arrival, and the lazy 3D module.
   The stage runs across the screen, one screen high, in the page; the system card takes the left side and the
   model keeps to the free part beside it with a lens shift (on phones the card follows the stage).
   Since 2026-11-02 (Drew's call of 2026-10-27, @35:45: "It shouldn't like stop here. It should go right into that,
   and then if the user scrolls, keep scrolling, they should just be able to scroll easily off that section")
   nothing pins and nothing holds the wheel: as the stage comes into view the roof opens from the aerial view into
   the switcher's layers, with the same eased motion the step had (expo.out), and the page scrolls in and out as
   any page does, by wheel, trackpad, keys or touch. Picking a system still animates the stack. Back above the
   section (the stage leaves through the bottom of the screen) the roof closes again, so the next arrival plays it
   again. Works without the 3D scene: with reduced motion or no WebGL the poster image takes the same free area
   and shows the system. Until the scene is ready the poster is its first frame (the roof from above,
   render-frames.js), in the same place, so the live view takes over without a jump. All copy, including every
   system panel, stays in the HTML. */
(function () {
  'use strict';
  var sec = document.querySelector('.v3-roof');
  if (!sec) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var phone = window.matchMedia('(max-width: 980px)');
  var view = sec.querySelector('.v3-roof__view');
  var stage = sec.querySelector('.v3-roof__stage');
  var poster = sec.querySelector('.v3-roof__poster');
  // the roof from above, for phones and for the rest (a <picture>): kept to come back to when the roof closes
  var posterM = poster && poster.parentNode.tagName === 'PICTURE' ? poster.parentNode.querySelector('source') : null;
  var aerial = poster && { src: poster.getAttribute('src'), srcM: posterM && posterM.getAttribute('srcset'), alt: poster.alt };
  var sys = sec.querySelector('.v3-sys');
  var tabs = [].slice.call(sec.querySelectorAll('.v3-sys__tabs [role="tab"]'));
  var panels = [].slice.call(sec.querySelectorAll('.v3-sys__panel'));
  var cine = function () { return document.documentElement.classList.contains('v3-cine'); };
  var api = null, state = { p: 0, stage: 0, sys: 'tpo' };
  var comp = { x: 0.5, y: 0.5, w: 1, h: 1 };         // the part of the stage the model keeps to
  var capture = /[?&]v3capture=1/.test(location.search);

  function layersOf(id) {
    var panel = sec.querySelector('.v3-sys__panel[data-sys="' + id + '"]');
    return [].slice.call(panel.querySelectorAll('.v3-sys__layers li')).reverse().map(function (li) {
      return { type: li.getAttribute('data-layer'), label: li.textContent.trim() };
    });
  }

  // the same words for the poster and for the live view: "TPO roof assembly in layers, top to bottom: ..."
  function describe(id) {
    var name = sec.querySelector('#v3-tab-' + id).textContent.trim();
    return name + ' roof assembly in layers, top to bottom: ' + layersOf(id).slice().reverse().map(function (l) {
      return /^[A-Z]{2,}\b/.test(l.label) ? l.label : l.label.charAt(0).toLowerCase() + l.label.slice(1);
    }).join(', ');
  }

  // what the view shows, in words: the roof from above, or the active system's layers
  function label() { return state.stage === 3 || !aerial ? describe(state.sys) : aerial.alt; }

  // without the live view the poster shows what it would
  function showPoster() {
    if (!poster || api) return;
    var sys3 = state.stage === 3, url = sys3 ? '/assets/v3/frames/roof-' + state.sys + '.webp' : aerial.src, urlM = sys3 ? url : aerial.srcM;
    if (posterM && posterM.getAttribute('srcset') !== urlM) posterM.setAttribute('srcset', urlM);
    if (poster.getAttribute('src') !== url) poster.src = url;
    poster.alt = label();
  }

  // ---- tabs ----------------------------------------------------------------------
  function select(id, focus) {
    tabs.forEach(function (t) {
      var on = t.getAttribute('data-sys') === id;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      if (on && focus) t.focus();
    });
    panels.forEach(function (p) {
      var on = p.getAttribute('data-sys') === id;
      // a system picked from the tabs fades in at once
      if (on && p.hidden && state.sys) p.classList.add('is-swap');
      p.hidden = !on;
    });
    state.sys = id;
    if (api) {
      api.setSystem(id, layersOf(id));
      stage.setAttribute('aria-label', label());
    } else showPoster();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { select(t.getAttribute('data-sys')); });
    t.addEventListener('keydown', function (e) {
      var k = e.key, j = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = (i + 1) % tabs.length;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (i - 1 + tabs.length) % tabs.length;
      else if (k === 'Home') j = 0;
      else if (k === 'End') j = tabs.length - 1;
      if (j < 0) return;
      e.preventDefault();
      select(tabs[j].getAttribute('data-sys'), true);
    });
  });
  select('tpo');

  // ---- the stage: the roof from above (3D stage 0), then the switcher's layers (stage 3) ----------
  // (stages 1 and 2, layer by layer and the seams, left the page on 2026-10-25)
  var P = { 0: 0, 3: 1 };                             // 3D progress: whole, exploded
  var OPEN = 4.2, CLOSE = 1.7;                        // seconds: the layers open as the old step did; closing is quick

  // the free part of the stage: beside the card on desktop; on phones the card follows the stage, so all of it
  function frameFor() {
    if (phone.matches || !sys) return { x: 0.5, y: 0.5, w: 1, h: 0.94 };
    var w = view.clientWidth || 1;
    var g = Math.min(44, Math.max(16, window.innerWidth * 0.04)), pad = Math.max(24, (w - 1280) / 2 + g);
    var x0 = pad + sys.offsetWidth + 40, x1 = w - pad * 0.5;
    return { x: (x0 + x1) / 2 / w, y: 0.5, w: (x1 - x0) / w, h: 0.94 };
  }
  // the live view's scale for a free area of this shape (roof3d.js, frameCamera: fit), without its height
  function fit(a) { return Math.pow(Math.min(1.75, Math.max(1, 1.3 / a)), 0.7); }
  // without the live view, the poster takes the same free part of the stage. The roof from above carries room
  // around the model: its free area was data-k of its width across and 1 / data-ky of its height down
  // (render-frames.js), so it is scaled as the live view would draw the model here and centred on the free
  // area, and it lines up with the first frame on any screen; its ground fades out before its edges.
  function placePoster(f, instant) {
    // the drag hint sits under the model, clear of the card and the site's chat button
    stage.style.setProperty('--fx', (f.x * 100).toFixed(2) + '%');
    if (!poster) return;
    var el = posterM && phone.matches ? posterM : poster, k = +el.getAttribute('data-k');
    var x = f.x - f.w / 2, y = f.y - f.h / 2, w = f.w, h = f.h;
    if (state.stage !== 3 && k) {
      var W = view.clientWidth || 1, H = view.clientHeight || 1, iw = +el.getAttribute('width'), ih = +el.getAttribute('height');
      var w0 = iw / k, h0 = ih / +el.getAttribute('data-ky'), wf = f.w * W, hf = f.h * H;
      var s = (hf / fit(wf / hf)) / (h0 / fit(w0 / h0));
      w = iw * s / W; h = ih * s / H; x = f.x - w / 2; y = f.y - h / 2;
    }
    if (instant) poster.style.transition = 'none';
    poster.style.left = (x * 100).toFixed(2) + '%';
    poster.style.width = (w * 100).toFixed(2) + '%';
    poster.style.top = (y * 100).toFixed(2) + '%';
    poster.style.height = (h * 100).toFixed(2) + '%';
    if (instant) { void poster.offsetWidth; poster.style.transition = ''; }
  }
  function push() { if (api) { api.setProgress(state.p); if (!capture) api.setFrame(comp); } }

  var tween = null, booting = true, inView = false;
  function ambient() { if (api && api.setAmbient) api.setAmbient(inView && state.stage === 3 && cine() && !reduce); }
  // open (3) or close (0) the roof; instant when it happens out of sight
  function setStage(st, instant) {
    state.stage = st;
    sec.classList.toggle('is-open', st === 3);
    if (api) { api.setStage(st); stage.setAttribute('aria-label', label()); }
    var f = frameFor(), p = P[st] || 0;
    showPoster();
    placePoster(f, true);
    if (tween) tween.kill();
    ambient();
    if (reduce || booting || instant || !window.gsap) { state.p = p; comp.x = f.x; comp.y = f.y; comp.w = f.w; comp.h = f.h; push(); return; }
    // the progress eases out both ways (the user's pick, 2026-10-25): fast at first, slowing to a stop
    var d = st === 3 ? OPEN : CLOSE;
    tween = window.gsap.timeline()
      .to(state, { p: p, duration: d, ease: 'expo.out', onUpdate: push }, 0)
      .to(comp, { x: f.x, y: f.y, w: f.w, h: f.h, duration: Math.min(d, 2.4), ease: 'power2.inOut', onUpdate: push }, 0);
  }

  sec.classList.add('v3-full');
  // with reduced motion there is nothing to watch open: the switcher's state from the start
  setStage(reduce ? 3 : 0);
  booting = false;

  // ---- the 3D module ---------------------------------------------------------------
  function webgl() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { return false; }
  }
  var src = sec.getAttribute('data-module');
  var want3d = !!src && (!reduce || capture) && webgl();
  // an arrival before the scene is ready waits for it (a few seconds at most), so the roof is seen opening
  var waiting = 0;
  function open() {
    clearTimeout(waiting); waiting = 0;
    if (state.stage !== 3) setStage(3);
  }
  function load() {
    import(src).then(function (m) {
      // resolves once the scene has compiled; the tab may have changed meanwhile
      return m.init(stage, { capture: capture, sys: state.sys, list: layersOf(state.sys), frame: capture ? null : comp });
    }).then(function (a) {
      api = a;
      api.setSystem(state.sys, layersOf(state.sys));
      api.setStage(state.stage);
      push();
      // the live view fades in over the poster (its first frame), then carries its description
      stage.setAttribute('role', 'img');
      stage.setAttribute('aria-label', label());
      sec.classList.add('is-3d');
      ambient();
      if (waiting) setTimeout(open, 450);           // once the canvas is in over the poster
      // for the review panel and the tools: render-frames.js (where the first frame sits), check-roof-poster.js
      // (back to the roof from above, at once)
      window.v3Roof = { api: api, layersOf: layersOf, select: select, cine: ambient, frame: frameFor,
        rewind: function () { setStage(0, true); } };
    }).catch(function (err) {
      sec.classList.add('no-3d');
      want3d = false;
      if (waiting) open();
      if (window.console) console.warn('3D view unavailable:', err);
    });
  }
  if (want3d) {
    if (capture) load();
    else {
      var io = new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { io.disconnect(); load(); }
      }, { rootMargin: '120% 0px' });
      io.observe(sec);
    }
  }

  // ---- arrival -------------------------------------------------------------------
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (en) {
      var e = en[en.length - 1];
      inView = e.isIntersecting;
      // arrival: half the stage is on screen, coming from either side
      if (e.isIntersecting && e.intersectionRatio >= 0.5) {
        if (state.stage !== 3 && !waiting) { if (want3d && !api) waiting = setTimeout(open, 3500); else open(); }
      // back above the section: the roof closes out of sight, ready to open again
      } else if (!e.isIntersecting && e.boundingClientRect.top > 0 && !reduce) {
        clearTimeout(waiting); waiting = 0;
        if (state.stage === 3) setStage(0, true);
      }
      ambient();
    }, { threshold: [0, 0.5] }).observe(view);
  } else setStage(3);

  function refit() {
    var f = frameFor();
    comp.x = f.x; comp.y = f.y; comp.w = f.w; comp.h = f.h;
    placePoster(f, true);
    push();
  }
  window.addEventListener('resize', refit);
  if (phone.addEventListener) phone.addEventListener('change', refit);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
})();
