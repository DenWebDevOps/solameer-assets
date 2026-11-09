/* v3 photo story: one real roof (topdown.jpg, 1200 x 1250 px) in four phases, one per step.
   01 Evaluate  a moisture scan crosses the roof and Drew's six report flags (L-01..L-06) appear
   02 Plan      crane, dumpster, staging and crew parking are drawn around the building
   03 Install   the roof is renewed zone by zone ("Day 1, Day 2..."), flags turn into checks,
                a weekly photo report comes in
   04 Warranty  the final walk is drawn and the warranty documents close the job
   Overlays live in the photo's pixel space (SVG viewBox), so they stay on the roof at any size.
   Tags are HTML placed in percent, so their text keeps its size. All copy stays in the HTML.
   The section is one screen in the page: the photo on the right, the steps folded in a list on the left. Since
   2026-11-02 (Drew's call of 2026-10-27, @48:57: "let that user scroll right past it if they choose to") nothing
   pins and nothing holds the wheel: the walkthrough starts as the section comes into view and plays step by step
   on its own clock while it is on screen, and the page scrolls past it freely. The steps and the rail still pick a
   step; back above the section it starts over for the next arrival.
   With WebGL (and without reduced motion) the photo stands up in 3D instead (site3d.js, loaded when the
   section is near): the same timeline drives it, and the HUD moves over to the 3D stage. Until the scene
   is ready the stage shows the photo; if it fails, the flat version comes back. */
(function () {
  'use strict';
  var sec = document.querySelector('.v3-story');
  if (!sec || !window.gsap) return;
  var gsap = window.gsap;
  var W = 1200, H = 1250, NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var frame = sec.querySelector('.v3-stage__frame');
  var track = sec.querySelector('.v3-story__track');
  var list = sec.querySelector('.v3-steps');
  var steps = [].slice.call(sec.querySelectorAll('.v3-step'));
  if (!frame || !list || !track || steps.length !== 4) return;

  // ---- the 3D stage (site3d.js) ------------------------------------------------------
  function webgl() {
    try { var cv = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (cv.getContext('webgl2') || cv.getContext('webgl'))); }
    catch (e) { return false; }
  }
  var siteSrc = sec.getAttribute('data-module'), site = null, siteStage = null;
  var capture3d = /[?&]v3capture=1/.test(location.search);
  if (siteSrc && (!reduce || capture3d) && webgl()) {
    siteStage = document.createElement('div');
    siteStage.className = 'v3-site';
    siteStage.innerHTML = '<img class="v3-site__poster" src="https://cdn.jsdelivr.net/gh/DenWebDevOps/solameer-assets@1.0.0/v/f22a31e3/v3/topdown-roof-800.webp" alt="" width="800" height="833" decoding="async">' +
      '<div class="v3-site__canvas" aria-hidden="true"></div><div class="v3-site__labels" aria-hidden="true"></div>';
    siteStage.setAttribute('role', 'img');
    siteStage.setAttribute('aria-label', 'The L-shaped roof from the drone photo, shown in 3D: the survey flags, the site logistics, the roof renewed zone by zone and the final walk');
    sec.querySelector('.v3-story__view').appendChild(siteStage);
    sec.classList.add('is-3d');
  }
  var hudHost = siteStage || frame;

  // ---- data, in photo pixels -------------------------------------------------
  var D = {
    roof: 'M789 24H918V67H942V24H1083V647H1176V1188H880V920L853 889H767L737 920V1188H460V920L433 889H330L303 920V1188H20V613H765L789 590Z',
    // Drew's own report labels (report-leaks.jpg), moved onto this photo with an affine fit (error under 7 px),
    // then nudged inside the roof's edge by the pulse ring's reach (39 px) where they sat on it (L-01, L-04, L-05)
    marks: [
      { id: 'L-02', x: 1003, y: 160, t: 'Wet insulation', d: 'IR scan + core cut confirmed', zone: 0, side: 'is-left', wet: [1005, 178, 55, 85] },
      { id: 'L-01', x: 275, y: 655, t: 'Base flashing split', d: 'North parapet · wet insulation 340 sf', zone: 5, side: '', wet: [287, 672, 96, 42] },
      { id: 'L-03', x: 1036, y: 707, t: 'Curb flashing open', d: 'RTU-4 · active drip below', zone: 2, side: 'is-left' },
      { id: 'L-05', x: 696, y: 934, t: 'Open seam', d: 'Lap seam · courtyard corner', zone: 3, side: 'is-left', wet: [694, 956, 32, 50] },
      { id: 'L-04', x: 922, y: 950, t: 'Ponding at drain', d: 'Clogged strainer · 48 hr standing', zone: 3, side: 'is-down', wet: [926, 976, 32, 44] },
      { id: 'L-06', x: 257, y: 1093, t: 'Pitch pan failed', d: 'Filler shrunk · water at penetration', zone: 5, side: '' }
    ],
    // install zones in order: x, y, w, h, and where the "Day n" tag sits
    zones: [
      [780, 15, 310, 318, 935, 250], [780, 333, 310, 312, 935, 500], [880, 645, 305, 555, 1030, 1000],
      [592, 590, 290, 610, 735, 770], [300, 590, 292, 610, 445, 770], [10, 590, 290, 610, 150, 860]
    ],
    walk: 'M985 110V600L1040 760L900 905L720 830L470 760L230 690L250 1080'
  };
  var PACE = [4, 3.8, 5.2, 4.2];                    // seconds per phase: about four seconds a step

  // ---- builders ----------------------------------------------------------------
  function svgEl(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function htmlEl(tag, cls, html, parent) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    if (parent) parent.appendChild(n);
    return n;
  }
  function at(n, x, y) { n.style.left = (x / W * 100) + '%'; n.style.top = (y / H * 100) + '%'; return n; }

  // ---- built when the section comes near: the HUD, the overlays and the timeline ------------------
  // The layout and the pinned steps are set up at once, so nothing below moves later; the drawing
  // waits until the reader is about a screen and a half away, so the first load stays light.
  // In 3D the scene draws the flags, the logistics, the zones and the walk itself (site3d.js), so only
  // the HUD is built; the overlays on the photo are built when there is no scene, or it fails to start.
  var tl = null, railBtns = [], hudEls = [], hud = null;
  var zStart = 2.06, zLen = 0.13;
  var popAt = D.marks.map(function (m) { return 0.04 + (m.y / H) * 0.78; });   // the scan reaches each flag

  // HUD: the phase chip, the step rail, the schedule and the two cards
  function makeHud() {
    var h = { chip: htmlEl('div', 'v3-chip', 'Condition survey', hudHost) };
    h.chip.setAttribute('aria-hidden', 'true');
    var rail = htmlEl('nav', 'v3-rail', null, hudHost);
    rail.setAttribute('aria-label', 'Walkthrough steps');
    railBtns = steps.map(function (s, i) {
      var b = htmlEl('button', '', '<span>0' + (i + 1) + '</span>', rail);
      b.type = 'button';
      // the name starts with the number on the button (WCAG 2.5.3, label in name)
      b.setAttribute('aria-label', '0' + (i + 1) + ' ' + s.querySelector('.v3-step__t').textContent);
      b.addEventListener('click', function () { show(i); });
      return b;
    });
    h.sched = htmlEl('div', 'v3-sched', '<div>Mobilize<i></i></div><div>Install zone by zone<i></i></div><div>Closeout<i></i></div>', hudHost);
    h.sched.setAttribute('aria-hidden', 'true');
    h.schedFill = [].slice.call(h.sched.querySelectorAll('i'));
    h.report = htmlEl('div', 'v3-card', '<img src="https://cdn.jsdelivr.net/gh/DenWebDevOps/solameer-assets@1.0.0/v/f22a31e3/img/vid-29-800.webp" alt="" width="800" height="451" loading="lazy" decoding="async"><b>Weekly photo report</b><span>Shared with everyone involved</span>', hudHost);
    h.warranty = htmlEl('div', 'v3-card', '<b>Warranty documents</b><ul><li>Punch walk with your team</li><li>Manufacturer inspection</li><li>Single-source warranty</li></ul>', hudHost);
    h.report.setAttribute('aria-hidden', 'true');
    h.warranty.setAttribute('aria-hidden', 'true');
    hudEls = [h.chip, rail, h.sched, h.report, h.warranty];
    return h;
  }

  // the flat version: overlays on the photo (SVG in its pixel space) and HTML tags, with their part of
  // the timeline. Returns what follows the playhead on every frame: the flags turning into checks.
  function flatOverlays(tl) {
    var svg = svgEl('svg', { 'class': 'v3-stage__svg', viewBox: '0 0 ' + W + ' ' + H, preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false' }, frame);
    var defs = svgEl('defs', {}, svg);
    svgEl('path', { d: D.roof }, svgEl('clipPath', { id: 'v3-roof-clip' }, defs));
    var mask = svgEl('mask', { id: 'v3-todo', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
    svgEl('rect', { x: 0, y: 0, width: W, height: H, fill: '#fff' }, mask);
    var doneRects = D.zones.map(function (z) { return svgEl('rect', { x: z[0], y: z[1], width: 0, height: z[3], fill: '#000' }, mask); });
    var grad = svgEl('linearGradient', { id: 'v3-scan-g', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    svgEl('stop', { offset: '0', 'stop-color': '#FECD34', 'stop-opacity': '0' }, grad);
    svgEl('stop', { offset: '.8', 'stop-color': '#FECD34', 'stop-opacity': '.22' }, grad);
    svgEl('stop', { offset: '1', 'stop-color': '#FECD34', 'stop-opacity': '.55' }, grad);
    var hatch = svgEl('pattern', { id: 'v3-hatch', width: 14, height: 14, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    svgEl('rect', { width: 14, height: 14, fill: 'rgba(254,205,52,.16)' }, hatch);
    svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 14, stroke: '#FECD34', 'stroke-width': 3, 'stroke-opacity': '.75' }, hatch);

    // the roof "as found": a dulled copy of the photo, masked away zone by zone as the roof is renewed,
    // at the size the photo is shown at
    var asFound = svgEl('image', { x: 0, y: 0, width: W, height: H, preserveAspectRatio: 'none', mask: 'url(#v3-todo)' }, svg);
    var small = frame.clientWidth * (window.devicePixelRatio || 1) < 900;
    asFound.setAttribute('href', small ? 'https://cdn.jsdelivr.net/gh/DenWebDevOps/solameer-assets@1.0.0/v/f22a31e3/v3/topdown-asfound-800.webp' : 'https://cdn.jsdelivr.net/gh/DenWebDevOps/solameer-assets@1.0.0/v/f22a31e3/v3/topdown-asfound.webp');

    var wetG = svgEl('g', {}, svg);
    var scanG = svgEl('g', { 'clip-path': 'url(#v3-roof-clip)' }, svg);
    var scan = svgEl('g', {}, scanG);
    svgEl('rect', { x: 0, y: -200, width: W, height: 200, fill: 'url(#v3-scan-g)' }, scan);
    svgEl('line', { x1: 0, y1: 0, x2: W, y2: 0, 'class': 'v3-scan-edge' }, scan);

    var logi = svgEl('g', {}, svg);
    var swing = svgEl('circle', { cx: 1150, cy: 400, r: 300, 'class': 'v3-logi-line' }, logi);
    var hoist = svgEl('path', { d: 'M1150 400Q1070 350 955 470', 'class': 'v3-logi-line' }, logi);
    var staging = svgEl('rect', { x: 850, y: 420, width: 200, height: 130, 'class': 'v3-logi-fill' }, logi);
    var parking = svgEl('rect', { x: 1104, y: 70, width: 84, height: 170, 'class': 'v3-logi-fill' }, logi);
    var dumpster = svgEl('rect', { x: 1127, y: 520, width: 46, height: 90, 'class': 'v3-logi-solid' }, logi);
    var crane = svgEl('g', { transform: 'translate(1150 400)' }, logi);
    svgEl('rect', { x: -30, y: -30, width: 60, height: 60, 'class': 'v3-logi-solid' }, crane);
    svgEl('path', { d: 'M-30 -30L30 30M30 -30L-30 30', stroke: '#FECD34', 'stroke-width': 4 }, crane);

    var zoneG = svgEl('g', { 'clip-path': 'url(#v3-roof-clip)' }, svg);
    var zoneOutlines = D.zones.map(function (z) { return svgEl('rect', { x: z[0], y: z[1], width: z[2], height: z[3], 'class': 'v3-zone' }, zoneG); });
    var front = svgEl('line', { x1: 0, y1: 0, x2: 0, y2: 0, 'class': 'v3-front' }, zoneG);
    var walkMask = svgEl('mask', { id: 'v3-walk-mask', maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: W, height: H }, defs);
    var walkReveal = svgEl('path', { d: D.walk, fill: 'none', stroke: '#fff', 'stroke-width': 30, 'stroke-linecap': 'round' }, walkMask);
    svgEl('path', { d: D.walk, 'class': 'v3-walk', mask: 'url(#v3-walk-mask)' }, svg);
    var markG = svgEl('g', {}, svg);

    var tags = htmlEl('div', 'v3-stage__tags', null, frame);
    tags.setAttribute('aria-hidden', 'true');

    D.marks.forEach(function (m) {
      if (m.wet) m.wetEl = svgEl('ellipse', { cx: m.wet[0], cy: m.wet[1], rx: m.wet[2], ry: m.wet[3], 'class': 'v3-wet-area' }, wetG);
      m.g = svgEl('g', { 'class': 'v3-mark', transform: 'translate(' + m.x + ' ' + m.y + ')' }, markG);
      m.inner = svgEl('g', {}, m.g);
      svgEl('circle', { r: 22, 'class': 'v3-ring' }, m.inner);
      m.dot = svgEl('circle', { r: 8, 'class': 'v3-dot' }, m.inner);
      m.tick = svgEl('path', { d: 'M-10 0L-3 7L10 -7', 'class': 'v3-tick', opacity: 0 }, m.inner);
      m.tag = at(htmlEl('div', 'v3-tag v3-tag--mark ' + m.side, '<b>' + m.id + '</b><span>' + m.t + '</span><small>' + m.d + '</small>', tags), m.x, m.y);
    });
    var logiTags = [
      at(htmlEl('div', 'v3-tag is-left', '<b>Crane</b>', tags), 1120, 400),
      at(htmlEl('div', 'v3-tag is-left', '<b>Dumpster</b>', tags), 1120, 565),
      at(htmlEl('div', 'v3-tag is-center is-light', '<b>Staging</b>', tags), 950, 485),
      at(htmlEl('div', 'v3-tag is-left', '<b>Crew parking</b>', tags), 1098, 155)
    ];
    var dayTags = D.zones.map(function (z, i) { return at(htmlEl('div', 'v3-tag is-center is-light', '<b>Day ' + (i + 1) + '</b><span>Dried in</span>', tags), z[4], z[5]); });
    var inspTag = at(htmlEl('div', 'v3-tag is-up', '<b>Final walk</b><span>Manufacturer inspection</span>', tags), 250, 1080);

    // their part of the timeline
    function len(p) { try { return Math.ceil(p.getTotalLength()); } catch (e) { return 2000; } }
    var walkLen = len(walkReveal);
    var wets = D.marks.filter(function (m) { return m.wetEl; }).map(function (m) { return m.wetEl; });
    gsap.set([].concat(D.marks.map(function (m) { return m.tag; }), logiTags, dayTags, inspTag), { autoAlpha: 0 });
    gsap.set(D.marks.map(function (m) { return m.inner; }), { scale: 0, transformOrigin: '50% 50%' });
    gsap.set(wets, { opacity: 0 });
    gsap.set([logi, zoneG, staging, parking, dumpster, crane, swing, hoist, front], { opacity: 0 });
    gsap.set(walkReveal, { attr: { 'stroke-dasharray': walkLen + ' ' + walkLen, 'stroke-dashoffset': walkLen } });

    // 01 Evaluate
    tl.fromTo(scan, { y: -10 }, { y: H + 210, duration: 0.82, ease: 'none' }, 0);
    D.marks.forEach(function (m, i) {
      var t = popAt[i];
      tl.to(m.inner, { scale: 1, duration: 0.09, ease: 'back.out(2.4)' }, t);
      tl.to(m.tag, { autoAlpha: 1, duration: 0.08 }, t + 0.02);
      if (m.wetEl) tl.to(m.wetEl, { opacity: 1, duration: 0.12 }, t + 0.03);
    });
    tl.to(scan, { opacity: 0, duration: 0.08 }, 0.84);

    // 02 Plan
    tl.to(D.marks.map(function (m) { return m.tag; }), { autoAlpha: 0, duration: 0.08 }, 1.02);
    tl.to(wets, { opacity: 0.35, duration: 0.1 }, 1.02);
    tl.to(logi, { opacity: 1, duration: 0.05 }, 1.04);
    tl.to(crane, { opacity: 1, duration: 0.1 }, 1.06);
    tl.fromTo(swing, { opacity: 0, scale: 0.6, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.18 }, 1.08);
    tl.to(logiTags[0], { autoAlpha: 1, duration: 0.08 }, 1.1);
    tl.to(dumpster, { opacity: 1, duration: 0.08 }, 1.22);
    tl.to(logiTags[1], { autoAlpha: 1, duration: 0.08 }, 1.24);
    tl.to(staging, { opacity: 1, duration: 0.1 }, 1.34);
    tl.fromTo(hoist, { opacity: 0 }, { opacity: 1, duration: 0.1 }, 1.4);
    tl.to(logiTags[2], { autoAlpha: 1, duration: 0.08 }, 1.42);
    tl.to(parking, { opacity: 1, duration: 0.08 }, 1.5);
    tl.to(logiTags[3], { autoAlpha: 1, duration: 0.08 }, 1.52);

    // 03 Install
    tl.to(logi, { opacity: 0, duration: 0.08 }, 2.0);
    tl.to(logiTags, { autoAlpha: 0, duration: 0.08 }, 2.0);
    tl.to(zoneG, { opacity: 1, duration: 0.06 }, 2.02);
    tl.to(front, { opacity: 1, duration: 0.03 }, 2.04);
    D.zones.forEach(function (z, i) {
      var t0 = zStart + i * zLen, f = { x: z[0] };
      tl.to(doneRects[i], { attr: { width: z[2] }, duration: zLen * 0.9, ease: 'none' }, t0);
      tl.fromTo(f, { x: z[0] }, {
        x: z[0] + z[2], duration: zLen * 0.9, ease: 'none',
        onUpdate: function () { front.setAttribute('x1', f.x); front.setAttribute('x2', f.x); front.setAttribute('y1', z[1]); front.setAttribute('y2', z[1] + z[3]); }
      }, t0);
      tl.to(zoneOutlines[i], { opacity: 0, duration: 0.03 }, t0 + zLen * 0.9);
      tl.to(dayTags[i], { autoAlpha: 1, duration: 0.05 }, t0 + zLen * 0.85);
      D.marks.forEach(function (m) {
        if (m.zone !== i) return;
        tl.to(m.dot, { opacity: 0, duration: 0.04 }, t0 + zLen * 0.6);
        tl.to(m.tick, { opacity: 1, duration: 0.04 }, t0 + zLen * 0.62);
        if (m.wetEl) tl.to(m.wetEl, { opacity: 0, duration: 0.04 }, t0 + zLen * 0.6);
      });
    });
    tl.to(front, { opacity: 0, duration: 0.03 }, zStart + 6 * zLen);

    // 04 Warranty
    tl.to(dayTags, { autoAlpha: 0, duration: 0.06 }, 3.0);
    tl.to(walkReveal, { attr: { 'stroke-dashoffset': 0 }, duration: 0.45, ease: 'none' }, 3.06);
    tl.to(inspTag, { autoAlpha: 1, duration: 0.08 }, 3.5);

    return function (t) {
      D.marks.forEach(function (m) {
        var done = t >= zStart + m.zone * zLen + zLen * 0.6;
        if (m.g.classList.contains('is-done') !== done) m.g.classList.toggle('is-done', done);
      });
    };
  }

  // the chip names the phase and counts along with it
  function chipText(t) {
    if (t < 1) {
      var n = 0; for (var i = 0; i < popAt.length; i++) if (t >= popAt[i]) n++;
      return n ? 'Condition survey · ' + n + ' flagged' : 'Condition survey';
    }
    if (t < 2) return 'Site logistics';
    if (t < 3) {
      var k = Math.floor((t - zStart) / zLen + 0.15);
      return k > 0 ? 'Day ' + Math.min(6, k) + ' · dried in' : 'Install · zone by zone';
    }
    return 'Closeout';
  }

  // ---- timeline: 1 unit per phase ----------------------------------------------
  function build() {
    tl = gsap.timeline({ paused: true, defaults: { ease: 'power2.out' } });
    var flagsDone = siteStage ? null : flatOverlays(tl);
    if (!hud) hud = makeHud();                      // after the overlays, so it sits over them
    gsap.set([hud.report, hud.warranty, hud.sched], { autoAlpha: 0 });
    gsap.set([hud.report, hud.warranty], { y: 12 });
    gsap.set(hud.schedFill, { scaleX: 0 });
    // the HUD's part: the schedule (02 Plan), the photo report (03 Install), the warranty (04)
    tl.to(hud.sched, { autoAlpha: 1, duration: 0.1 }, 1.6);
    tl.to(hud.schedFill[0], { scaleX: 1, duration: 0.3, ease: 'none' }, 1.62);
    tl.to(hud.schedFill[1], { scaleX: 1, duration: 6 * zLen, ease: 'none' }, zStart);
    tl.to(hud.report, { autoAlpha: 1, y: 0, duration: 0.08 }, 2.42);
    tl.to(hud.report, { autoAlpha: 0, duration: 0.06 }, 3.0);
    tl.to(hud.schedFill[2], { scaleX: 1, duration: 0.5, ease: 'none' }, 3.06);
    tl.to(hud.warranty, { autoAlpha: 1, y: 0, duration: 0.1 }, 3.58);
    tl.to({}, { duration: 0.32 }, 3.68);

    // the 3D scene, the chip and the flat flags follow the playhead
    var lastChip = '';
    tl.eventCallback('onUpdate', function () {
      var t = tl.time();
      if (site) site.setTime(t);
      var s = chipText(t);
      if (s !== lastChip) { hud.chip.textContent = s; lastChip = s; }
      if (flagsDone) flagsDone(t);
    });
    tl.progress(0).pause();
  }

  // ---- steps -------------------------------------------------------------------------
  // a step rests just before the next phase begins (each phase is done by .96 of its unit)
  function timeFor(i) { return i < 0 ? 0 : i + 0.96; }
  // the target phase plays in full; whatever is left of earlier phases runs fast, so a new gesture
  // never waits on the last step; going back is a quick rewind
  function secondsBetween(t0, t1) {
    var sum = 0, k;
    if (t1 >= t0) {
      var from = Math.max(t0, Math.floor(t1));
      for (k = 0; k < PACE.length; k++) {
        sum += Math.max(0, Math.min(from, k + 1) - Math.max(t0, k)) * PACE[k] * 0.22;
        sum += Math.max(0, Math.min(t1, k + 1) - Math.max(from, k)) * PACE[k];
      }
    } else {
      for (k = 0; k < PACE.length; k++) sum += Math.max(0, Math.min(t0, k + 1) - Math.max(t1, k)) * PACE[k] * 0.35;
    }
    return Math.max(0.6, Math.min(8, sum));
  }
  var play = null, booting = true, cur = -1;
  function mark(i) {
    railBtns.concat(goBtns).forEach(function (b, j) {
      if (j % 4 === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
  }
  // the line under the open step keeps time with its animation (immersion layer)
  var times = steps.map(function (s) {
    var t = document.createElement('i');
    t.className = 'v3-step__time';
    t.setAttribute('aria-hidden', 'true');
    s.querySelector('.v3-step__h').insertAdjacentElement('afterend', t);
    return t;
  });
  // Autoplay: the line under the open step counts down while the section is on screen; when it is full the
  // next step comes on its own (the reader can still click ahead, or back). The step plays, then there is
  // a beat to read it. The last step has no line and stays. Off with reduced motion.
  var autoTimer = 0, lastSecs = 0;
  function dwell(secs) { return Math.max(6.5, secs + 3); }
  function keepTime(i, secs) {
    clearTimeout(autoTimer);
    times.forEach(function (t) { t.classList.remove('is-timing'); });
    if (secs != null) lastSecs = secs;
    if (i < 0 || i >= steps.length - 1 || reduce || !inView || document.visibilityState !== 'visible') return;
    var d = dwell(lastSecs);
    void times[i].offsetWidth;
    times[i].style.setProperty('--dur', d.toFixed(2) + 's');
    times[i].classList.add('is-timing');
    autoTimer = setTimeout(function () {
      if (inView && cur === i && document.visibilityState === 'visible') show(i + 1);
    }, d * 1000);
  }
  document.addEventListener('visibilitychange', function () { keepTime(cur, null); });
  function show(i, instant) {
    cur = i;
    steps.forEach(function (s, j) { s.classList.toggle('is-on', j === i); });
    mark(i);
    keepTime(i, tl && !reduce && !booting ? secondsBetween(tl.time(), timeFor(i)) : 0);
    if (!tl) return;                                // not drawn yet: build() lands on this step
    var t = timeFor(i);
    if (play) play.kill();
    // reduced motion, or a reset out of sight: the state, without the replay
    if (reduce || booting || instant) { tl.seek(t, false); return; }
    play = gsap.to(tl, { time: t, duration: secondsBetween(tl.time(), t), ease: 'power1.inOut' });
  }

  // each step heading becomes a button that goes to its step
  var goBtns = steps.map(function (s, i) {
    var h = s.querySelector('.v3-step__h'), b = document.createElement('button');
    b.type = 'button';
    b.className = 'v3-step__go';
    while (h.firstChild) b.appendChild(h.firstChild);
    h.appendChild(b);
    b.addEventListener('click', function () { show(i); });
    return b;
  });

  // phones: the heading stays above the section, in the page, instead of inside the one-screen view
  var head = sec.querySelector('.v3-story__head'), side = sec.querySelector('.v3-story__side');
  var phoneMq = window.matchMedia('(max-width: 980px)'), dock = null;
  function placeHead() {
    if (!head || !side) return;
    if (phoneMq.matches && !dock) {
      dock = document.createElement('div');
      dock.className = 'v3-dock';
      track.parentNode.insertBefore(dock, track);
      dock.appendChild(head);
    } else if (!phoneMq.matches && dock) {
      side.insertBefore(head, side.firstChild);
      dock.parentNode.removeChild(dock);
      dock = null;
    }
  }
  placeHead();
  if (phoneMq.addEventListener) phoneMq.addEventListener('change', placeHead);

  // the HUD floats a little over the photo as the pointer moves (mouse only)
  if (!reduce && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    frame.addEventListener('pointermove', function (e) {
      var r = frame.getBoundingClientRect();
      frame.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
      frame.style.setProperty('--my', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
    });
    frame.addEventListener('pointerleave', function () { frame.style.setProperty('--mx', 0); frame.style.setProperty('--my', 0); });
  }

  // ---- free scroll: the walkthrough plays while the section is on screen ------------------------------
  sec.classList.add('v3-full');
  var inView = false;
  function ambient() { if (site) site.setAmbient(inView && document.documentElement.classList.contains('v3-cine')); }
  if (window.IntersectionObserver && !reduce) {
    new IntersectionObserver(function (en) {
      var e = en[en.length - 1], was = inView;
      inView = e.isIntersecting && e.intersectionRatio >= 0.5;
      // arrival (half the section on screen, from either side): the first step plays
      if (inView && cur < 0) show(0);
      // back above the section: it starts over, out of sight
      else if (!e.isIntersecting && e.boundingClientRect.top > 0 && cur >= 0) show(-1, true);
      // the countdown runs only while the section is on screen (it starts over when it comes back)
      else if (inView !== was) keepTime(cur, null);
      ambient();
    }, { threshold: [0, 0.5] }).observe(track);
  } else show(0);
  booting = false;
  // draw when the reader is about a screen and a half away, in an idle moment
  function load3d() {
    import(siteSrc).then(function (m) {
      return m.init(siteStage, { data: D, zStart: zStart, zLen: zLen, t: tl ? tl.time() : 0, capture: capture3d });
    }).then(function (api) {
      site = api;
      site.setTime(tl.time());
      ambient();
      sec.classList.add('is-live3d');
      window.v3Site = site;
    }).catch(function (err) {
      // the flat version comes back: the overlays on the photo, then the HUD over them
      siteStage.parentNode.removeChild(siteStage);
      siteStage = null;
      sec.classList.remove('is-3d');
      if (play) play.kill();
      tl.kill();
      build();
      hudEls.forEach(function (el) { frame.appendChild(el); });
      tl.seek(timeFor(cur), false);
      if (window.console) console.warn('3D story unavailable:', err);
    });
  }
  var near = new IntersectionObserver(function (en) {
    if (!en[0].isIntersecting) return;
    near.disconnect();
    var run = function () {
      build();
      tl.seek(timeFor(cur), false);                 // land on the reader's step without replaying it
      mark(cur);
      sec.classList.add('is-live');
      if (siteStage) load3d();
    };
    if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 600 }); else setTimeout(run, 1);
  }, { rootMargin: '150% 0px' });
  near.observe(sec);
})();
