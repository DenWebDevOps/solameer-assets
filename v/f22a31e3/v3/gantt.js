/* v3: the job schedule over the phasing board on /services/roof-replacement/ (make-v3.js rrGantt, chrome.css ".gt";
   Drew's call of 2026-11-03, R2: "a simple Gantt chart… your six buildings… some diamonds… a vertical line… rolling
   over… and then those images are just kind of cycling through below it").
   The copy's site.js runs the board: its Week 1…6 buttons set the buildings' photos and the log line. This script only
   follows those buttons (their aria-pressed): the line moves to the end of the chosen week and the bars behind it turn
   yellow (one clip, so the colour changes exactly where the line passes). While the board is on screen it steps through
   the weeks by itself, a week every 3 s and 5 s on week 6, until someone picks a week or presses Pause; keyboard focus
   on the board holds it. Nothing pins or scrolls the page. Reduced motion: no stepping, no transitions.
   Without JS the chart shows the whole plan, filled, with no line. */
(function () {
  'use strict';
  var ph = document.querySelector('.phase'), gt = ph && ph.querySelector('.gt');
  if (!gt) return;
  var top = ph.querySelector('.phase-top'), bs = [].slice.call(ph.querySelectorAll('.phase-top button')), W = bs.length;
  if (!W) return;
  var wk = [].slice.call(gt.querySelectorAll('.gt-wk span')), play = gt.querySelector('.gt-play'), log = ph.querySelector('.phase-log');
  var RM = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : { matches: false };
  var texts = [];
  try { texts = JSON.parse(ph.getAttribute('data-weeks') || '[]').map(function (w) { return w.t; }); } catch (e) { texts = []; }
  var cur = -2, timer = 0, seen = false, held = false, paused = false;

  function pressed() { for (var i = 0; i < W; i++) if (bs[i].getAttribute('aria-pressed') === 'true') return i; return -1; }
  function show() {
    var i = pressed(); if (i === cur) return; cur = i;
    gt.style.setProperty('--x', (i < 0 ? 100 : (i + 1) / W * 100) + '%');
    wk.forEach(function (s, j) { s.className = i < 0 ? '' : j < i ? 'is-past' : j === i ? 'is-now' : ''; });
  }

  // the log line under the board changes length with the week: hold it at its tallest, so stepping never moves the page
  function fit() {
    if (!log || !texts.length) return;
    var t = log.textContent, h = 0;
    log.style.minHeight = '';
    texts.forEach(function (x) { log.textContent = x; h = Math.max(h, log.offsetHeight); });
    log.textContent = t;
    log.style.minHeight = h + 'px';
  }

  function clear() { if (timer) clearTimeout(timer); timer = 0; }
  function arm(d) {
    clear();
    if (RM.matches || paused || held || !seen || document.hidden) return;
    timer = setTimeout(function () {
      timer = 0;
      var n = (cur + 1) % W;
      bs[n].click();                                   // site.js swaps the photos and the log; show() follows
      arm(n === W - 1 ? 5000 : 3000);
    }, d);
  }
  function label() {
    if (!play) return;
    play.hidden = RM.matches;
    play.textContent = paused ? 'Play' : 'Pause';
    play.setAttribute('aria-label', (paused ? 'Play' : 'Pause') + ' the schedule');
  }

  // first frame without transitions (the static chart is filled to the end; the live one starts at the pressed week)
  gt.classList.add('is-live', 'gt-still');
  show();
  requestAnimationFrame(function () { requestAnimationFrame(function () { gt.classList.remove('gt-still'); }); });
  new MutationObserver(show).observe(top, { attributes: true, subtree: true, attributeFilter: ['aria-pressed'] });
  fit();
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(fit, 200); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);

  // someone picked a week: the stepping stops (Play brings it back from that week)
  top.addEventListener('click', function (e) {
    if (!e.isTrusted || !e.target.closest('button')) return;
    paused = true; clear(); label();
  });
  if (play) play.addEventListener('click', function () { paused = !paused; label(); paused ? clear() : arm(1200); });
  ph.addEventListener('focusin', function (e) {
    if (e.target === play) return;
    try { if (!e.target.matches(':focus-visible')) return; } catch (x) { /* older engines: hold on any focus */ }
    held = true; clear();
  });
  ph.addEventListener('focusout', function (e) { if (!ph.contains(e.relatedTarget)) { held = false; arm(3000); } });
  document.addEventListener('visibilitychange', function () { document.hidden ? clear() : arm(3000); });
  if (RM.addEventListener) RM.addEventListener('change', function () { label(); RM.matches ? clear() : arm(3000); });
  label();

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      var was = seen; seen = es[0].isIntersecting;
      if (seen && !was) arm(1800); else if (!seen) clear();
    }, { rootMargin: '-15% 0px -15% 0px' }).observe(ph);
  }
})();
