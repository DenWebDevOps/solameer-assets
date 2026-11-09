/* The home's own scripts (2026-11-07, Drew's call 11-03; make-v3.js puts this file on / and /home-video/ only).
   The CSP allows no inline script, so this is a file of its own like hero-video.js. */

/* Markets we serve: four tabs (item H3; sections/work.html, css/home.css .v3-mk). Without JS the tabs are links to the
   four panels, which stand one under another. Here they become an ARIA tablist (click, arrow keys, Home and End),
   the panels share one place, and on a desktop (981 px and up, no reduced motion) the active tab's line runs for 8 s and
   the next tab opens when it is full. A pointer or focus on a panel or a tab, the section off screen or the browser
   tab hidden pause it; a click on a tab, an arrow key or the pause button stops it (the button plays it again). */
(function () {
  'use strict';
  var box = document.querySelector('[data-mk]');
  if (!box) return;
  var list = box.querySelector('.v3-mk__tabs'), bar = box.querySelector('.v3-mk__bar'), ps = box.querySelector('.v3-mk__ps');
  var tabs = [].slice.call(box.querySelectorAll('.v3-mk__tab'));
  var panels = tabs.map(function (t) { return document.getElementById((t.getAttribute('href') || '').slice(1)); });
  if (!list || !bar || !ps || tabs.length < 2 || panels.some(function (p) { return !p; })) return;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)'), wide = window.matchMedia('(min-width: 981px)');
  var cur = -1, stopped = false, holds = { view: true, page: document.hidden, hover: false, focus: false };
  list.setAttribute('role', 'tablist');
  list.setAttribute('aria-label', 'Markets we serve');
  tabs.forEach(function (t, i) {
    t.setAttribute('role', 'tab');
    t.setAttribute('aria-controls', panels[i].id);
    panels[i].setAttribute('role', 'tabpanel');
    panels[i].setAttribute('aria-labelledby', t.id);
  });
  var pp = document.createElement('button');
  pp.type = 'button';
  pp.className = 'v3-mk__pp';
  bar.appendChild(pp);
  var PAUSE = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1h3v10H2zM7 1h3v10H7z"/></svg>';
  var PLAY = '<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2.5 1l8 5-8 5z"/></svg>';
  function runs() { return !stopped && !still.matches && wide.matches; }
  function button() {
    pp.hidden = still.matches;
    pp.innerHTML = stopped ? PLAY : PAUSE;
    pp.setAttribute('aria-label', stopped ? 'Play the market tabs' : 'Pause the market tabs');
  }
  // (re)start the active tab's line: taking the class off and putting it back restarts the CSS animation
  function restart() {
    box.classList.remove('is-auto');
    if (!runs()) return;
    void box.offsetWidth;
    box.classList.add('is-auto');
  }
  function hold() {
    box.classList.toggle('is-hold', holds.view || holds.page || holds.hover || holds.focus);
  }
  function select(i, focus) {
    cur = i;
    tabs.forEach(function (t, j) {
      var on = j === i;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[j].classList.toggle('is-on', on);
    });
    if (focus) tabs[i].focus();
    restart();
  }
  function stop() {
    if (stopped) return;
    stopped = true;
    button();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function (e) {
      e.preventDefault();
      stop();
      if (i !== cur) select(i); else restart();
    });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, k = e.key, j = -1;
      if (k === 'ArrowRight' || k === 'ArrowDown') j = (cur + 1) % n;
      else if (k === 'ArrowLeft' || k === 'ArrowUp') j = (cur - 1 + n) % n;
      else if (k === 'Home') j = 0;
      else if (k === 'End') j = n - 1;
      else if (k === ' ' || k === 'Spacebar') { e.preventDefault(); t.click(); return; }
      if (j < 0) return;
      e.preventDefault();
      stop();
      select(j, true);
    });
    // the line is full: the next tab
    t.addEventListener('animationend', function (e) {
      if (e.animationName === 'v3-mk-run' && i === cur && runs()) select((cur + 1) % tabs.length);
    });
  });
  pp.addEventListener('click', function () {
    stopped = !stopped;
    button();
    restart();
  });
  // pauses: a mouse over the panels, focus on a tab or in a panel (not on the button), the section off screen, the tab hidden
  ps.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') { holds.hover = true; hold(); } });
  ps.addEventListener('pointerleave', function () { holds.hover = false; hold(); });
  box.addEventListener('focusin', function (e) { holds.focus = e.target !== pp; hold(); });
  box.addEventListener('focusout', function (e) { if (!box.contains(e.relatedTarget)) { holds.focus = false; hold(); } });
  document.addEventListener('visibilitychange', function () { holds.page = document.hidden; hold(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) { holds.view = !es[0].isIntersecting; hold(); }, { threshold: 0.35 }).observe(box);
  } else holds.view = false;
  function media() { button(); restart(); }
  [still, wide].forEach(function (m) { if (m.addEventListener) m.addEventListener('change', media); else if (m.addListener) m.addListener(media); });
  // a link to a panel (/#mk-commercial) opens its tab
  var at = 0;
  panels.forEach(function (p, i) { if (location.hash === '#' + p.id) { at = i; stopped = true; } });
  box.classList.add('is-js');
  hold();
  button();
  select(at);
})();

/* The statement band under the hero (item H4, Drew @2:56 and @12:30: "use that cut… to continue cutting down on the left
   side"): on a desktop the hero's photo ends on the slash (home.css: its right edge runs 176 px to the left over the
   photo's height). Here that line is carried on through the figures and the grey band under them, as a slightly darker
   grey on its left (home.css .v3-cut). The angle follows the hero's height, so it is measured; without JS, on a phone
   (where the photo is a band over the copy) or if anything is missing, the grey stays plain. */
(function () {
  'use strict';
  var ph = document.querySelector('.v3-hero .ph');
  var els = [document.querySelector('.v3-first .stats'), document.querySelector('.v3-band')].filter(Boolean);
  if (!ph || !els.length) return;
  var CUT = 176, wide = window.matchMedia('(min-width: 981px)'), raf = 0;
  function draw() {
    raf = 0;
    if (!wide.matches) { els.forEach(function (e) { e.classList.remove('v3-cut'); }); return; }
    var r = ph.getBoundingClientRect();
    if (r.height < 100) return;
    function x(y) { return r.right - CUT * (y - r.top) / r.height; }
    els.forEach(function (e) {
      var b = e.getBoundingClientRect();
      e.style.setProperty('--cut-t', Math.round(x(b.top) - b.left) + 'px');
      e.style.setProperty('--cut-b', Math.round(x(b.bottom) - b.left) + 'px');
      e.classList.add('v3-cut');
    });
  }
  function later() { if (!raf) raf = requestAnimationFrame(draw); }
  draw();
  window.addEventListener('resize', later);
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(later);
    ro.observe(ph);
    els.forEach(function (e) { ro.observe(e); });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(later);
})();
