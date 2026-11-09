/* The hero's video slot (option C · video, 2026-11-03; v3/hero-options/cv.html, and the home when make-v3.js has
   HERO_MEDIA = 'video'). The markup is a poster (a <picture>, the video's own first frame) with an empty <video> over
   it, so without JS, on a phone (under 981 px), with reduced motion or with Save-Data the poster is all there is and
   no video is asked for. Otherwise this puts the sources in (data-webm, data-mp4), gives the video the poster the
   <picture> already loaded, and plays it muted in a loop while it is on screen. The button in the caption bar pauses
   and plays it (WCAG 2.2.2). As on the old home hero (PLAN, 2026-10-24): if the browser pauses it (hidden tab or
   pane), it starts again when the page is shown, unless the person paused it. Shared by the options page and the site. */
(function () {
  'use strict';
  var v = document.querySelector('video[data-hero-video]');
  if (!v || !window.matchMedia) return;
  var slot = v.parentNode, btn = slot.querySelector('.hv-t'), img = slot.querySelector('img');
  var wide = matchMedia('(min-width: 981px)'), still = matchMedia('(prefers-reduced-motion: reduce)');
  var save = !!(navigator.connection && navigator.connection.saveData);
  var attached = false, held = false, seen = true;          // held: the person paused it; seen: the slot is on screen
  var ICON = { pause: 'M2 1h3v10H2zM7 1h3v10H7z', play: 'M2.5 1l8.5 5-8.5 5z' };

  function allowed() { return wide.matches && !still.matches && !save; }
  function sync() {
    if (!btn) return;
    var p = v.paused;
    btn.setAttribute('aria-label', p ? 'Play the video' : 'Pause the video');
    btn.querySelector('span').textContent = p ? 'Play' : 'Pause';
    btn.querySelector('path').setAttribute('d', p ? ICON.play : ICON.pause);
  }
  function play() { var p = v.play(); if (p && p.catch) p.catch(sync); }
  function attach() {
    if (attached) return;
    attached = true;
    if (img && img.currentSrc) v.poster = img.currentSrc;   // the file the <picture> chose, already in the cache
    [['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(function (t) {
      var src = v.getAttribute('data-' + t[0]);
      if (!src) return;
      var s = document.createElement('source');
      s.src = src; s.type = t[1];
      v.appendChild(s);
    });
    v.muted = true;
    v.preload = 'auto';
    v.load();
    if (btn) btn.hidden = false;
  }
  function update() {
    if (allowed()) {
      attach();
      slot.classList.add('hv-on');
      if (seen && !held && !document.hidden) { if (v.paused) play(); } else if (!v.paused) v.pause();
    } else if (attached) { v.pause(); slot.classList.remove('hv-on'); }
  }

  if (btn) btn.addEventListener('click', function () {
    if (v.paused) { held = false; play(); } else { held = true; v.pause(); }
  });
  v.addEventListener('play', sync);
  v.addEventListener('pause', sync);
  // paused by the browser while it should play (a hidden pane, a power saver): try again shortly
  v.addEventListener('pause', function () {
    setTimeout(function () { if (attached && seen && !held && !document.hidden && allowed() && v.paused) play(); }, 300);
  });
  document.addEventListener('visibilitychange', update);
  if (window.IntersectionObserver) new IntersectionObserver(function (en) { seen = en[0].isIntersecting; update(); }).observe(slot);
  var watch = function (mq) { if (mq.addEventListener) mq.addEventListener('change', update); else if (mq.addListener) mq.addListener(update); };
  watch(wide); watch(still);
  sync();
  update();
})();
