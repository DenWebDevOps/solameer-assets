/* v3 site chrome, on every page of the v3 build.
   Buttons: the hover sweep (chrome.css) carries a copy of each button's label in the hover colour, in a window
   that moves with the sweeping panel, so the label turns exactly where the slash passes. The button keeps its
   own colours (--fg, --bg, read here). The copy is hidden from screen readers. Buttons added later (the 3D
   cards' Next) call window.v3BtnFx.
   (The promise line over the footer, which dropped in letter by letter, gave way to the call to action in
   sections/help.html on 2026-10-22.) */
(function () {
  'use strict';
  var d = document;
  d.documentElement.classList.add('v3-hvjs');    // (review R2a-2: the hubs' descriptions wait for the hover only with JS, hubs.css)
  function fx(b) {
    if (b.classList.contains('is-fx')) return;
    var cs = getComputedStyle(b), win = d.createElement('span'), copy = d.createElement('span');
    b.style.setProperty('--fg', cs.color);
    b.style.setProperty('--bg', cs.backgroundColor);
    win.className = 'btn-fx';
    win.setAttribute('aria-hidden', 'true');
    copy.className = 'btn-fx__in';
    [].forEach.call(b.childNodes, function (n) { copy.appendChild(n.cloneNode(true)); });
    win.appendChild(copy);
    b.appendChild(win);
    b.classList.add('is-fx');
    // Text in the copy's skewed, moving layer is drawn soft until the browser redraws it a moment later. So once
    // the sweep is over, the button's own label takes the hover colour and the copy steps aside (.fx-done); on the
    // way out the copy comes back for the return sweep (.fx-back) and leaves again when it is over.
    var on = function () { try { return b.matches(':hover, :focus-visible'); } catch (x) { return b.matches(':hover'); } };
    win.addEventListener('transitionend', function (e) {
      if (e.target !== win || e.propertyName !== 'transform') return;
      if (on()) { b.classList.remove('fx-back'); b.classList.add('fx-done'); } else b.classList.remove('fx-back');
    });
    var leave = function () { if (b.classList.contains('fx-done')) { b.classList.remove('fx-done'); b.classList.add('fx-back'); } };
    b.addEventListener('mouseleave', leave);
    b.addEventListener('blur', leave);
  }
  window.v3BtnFx = fx;
  [].forEach.call(d.querySelectorAll('.btn, .nav-bid'), fx);
})();

/* The mega menu (the copy's, site.js) opened a panel the moment the pointer touched its item: a pass along the menu
   flashed every panel, and a diagonal from an item down into its panel switched to the neighbour on the way. Here the
   real mouseenter and mouseleave of the items are held and passed on to site.js once the pointer means it:
   - with no panel open, an item opens when the pointer slows down on it (under 6 px in 90 ms);
   - from an open panel, a sideways move to the next item switches at once;
   - while the pointer heads down into the open panel, that panel stays (its item's leave is held back) and an item
     on the way takes over only if the pointer comes to rest on it. If the pointer reaches neither, the held leave
     goes on to site.js after 450 ms, and site.js closes the panel as before.
   Keyboard, click and touch reach site.js untouched. The panels' photos are fetched when the page has gone quiet,
   or at the first hover on the menu, so a panel opens with its photos in place. */
(function () {
  'use strict';
  var nav = document.getElementById('nav');
  if (!nav || !nav.querySelector('.nv-top[data-mega]')) return;
  var mouse = window.matchMedia('(hover: hover)');
  var now = [0, 0, 0], then = [0, 0, 0], held = null, timer = 0, kept = null, keepTimer = 0, warmed = false;
  // where the pointer is, and where it was 40 ms or more before: [x, y, time]
  document.addEventListener('mousemove', function (e) {
    if (e.timeStamp - then[2] > 40) then = now;
    now = [e.clientX, e.clientY, e.timeStamp];
  }, { passive: true });
  function item(e) { var t = e.target; return e.isTrusted && mouse.matches && t.classList && t.classList.contains('nv-top') ? t : null; }
  function openItem() { return nav.querySelector('.nv-top[aria-expanded="true"]'); }
  // heading down, into the panels (not flat along the menu, not up and out). An enter or leave comes before the
  // mousemove that carries it, so the event's own position is compared with where the pointer was 40+ ms earlier.
  function aiming(e) {
    var p = e.timeStamp - now[2] > 40 ? now : then, dx = e.clientX - p[0], dy = e.clientY - p[1];
    return dy > 0 && Math.abs(dx) < dy * 6;
  }
  function settle(t, x, y) {
    timer = setTimeout(function () {
      if (held !== t) return;
      if (Math.abs(now[0] - x) + Math.abs(now[1] - y) < 6) pass(t); else settle(t, now[0], now[1]);
    }, 90);
  }
  function pass(t) {
    held = kept = null;
    clearTimeout(timer); clearTimeout(keepTimer);
    t.dispatchEvent(new MouseEvent('mouseenter'));
  }
  function release() {
    var k = kept, p = nav.querySelector('.mega:not([hidden])');
    if (!k || (p && p.matches(':hover')) || k.matches(':hover')) return;
    kept = null;
    k.dispatchEvent(new MouseEvent('mouseleave'));
  }
  nav.addEventListener('mouseenter', function (e) {
    if (e.isTrusted && e.target.classList && e.target.classList.contains('mega')) { // reached the panel
      held = kept = null; clearTimeout(timer); clearTimeout(keepTimer);
      return;
    }
    var t = item(e);
    if (!t) return;
    warm();
    clearTimeout(timer);
    held = null;
    var open = openItem();
    if (open === t) { kept = null; clearTimeout(keepTimer); return; } // back on the open item: site.js keeps it
    e.stopPropagation();
    if (open && !aiming(e)) return pass(t);
    held = t;
    settle(t, e.clientX, e.clientY);
  }, true);
  nav.addEventListener('mouseleave', function (e) {
    var t = item(e);
    if (!t) return;
    if (t === held) { clearTimeout(timer); held = null; return; }
    if (t === openItem() && aiming(e)) {
      e.stopPropagation();
      kept = t;
      clearTimeout(keepTimer);
      keepTimer = setTimeout(release, 450);
    }
  }, true);

  // the same file the browser takes from each image-set: webp, at 1x or 2x
  function warm() {
    if (warmed) return;
    warmed = true;
    var x = window.devicePixelRatio > 1.4 ? '2' : '1';
    [].forEach.call(nav.querySelectorAll('.mega [style*="background-image"]'), function (el) {
      var set = el.style.backgroundImage, re = /url\("?([^")]+)"?\)([^,]*)/g, m, webp = [];
      while ((m = re.exec(set))) if (/webp/.test(m[0])) webp.push({ src: m[1], x: (m[2].match(/(\d)x/) || [0, '1'])[1] });
      var pick = webp.filter(function (c) { return c.x === x; })[0] || webp[0] || { src: (set.match(/url\("?([^")]+)"?\)/) || [])[1] };
      if (pick.src) new Image().src = pick.src;
    });
  }
  if (window.matchMedia('(hover: hover) and (min-width: 1121px)').matches && !(navigator.connection && navigator.connection.saveData)) {
    var quiet = function () { if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 4000 }); else setTimeout(warm, 1500); };
    if (document.readyState === 'complete') quiet(); else window.addEventListener('load', quiet);
  }

  // while a panel is open the page under it dims (html.mx-on, chrome.css); a panel that opens from closed fades in
  // (.mx-fade), a switch from one panel to the next does not, so the menu never blinks
  var shown = null;
  new MutationObserver(function () {
    var p = nav.querySelector('.mega:not([hidden])');
    if (p && p !== shown) p.classList.toggle('mx-fade', !shown);
    shown = p;
    document.documentElement.classList.toggle('mx-on', !!p);
  }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
})();

/* The chat launcher (the copy's, site.js) shows only its icon over the first screen; it does the same over the
   footer, so it never covers the footer's links (.sd-end, chrome.css). */
(function () {
  'use strict';
  var foot = document.querySelector('footer.ft3') || document.querySelector('footer');
  if (!foot || !window.IntersectionObserver) return;
  new IntersectionObserver(function (en) { document.body.classList.toggle('sd-end', en[0].isIntersecting); }).observe(foot);
})();

/* Accordions open and close smoothly on every page (the user's ask, 2026-10-25; the home's FAQ had it since
   10-17 in v3-core.js, now it is here for all): the answer's height, padding and opacity move together. One item
   is open at a time in each accordion, as on the home (the user's call, the same day): the items of one block, or
   of one name, form a group, and the open one closes with the same motion as the next one opens. .is-open
   follows the reader's choice at once, so a closing item's icon turns back straight away (chrome.css,
   home.css). Without JS, or with reduced motion, the <details> work as they are. */
(function () {
  'use strict';
  var items = [].slice.call(document.querySelectorAll('details'));
  if (!items.length) return;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.documentElement.classList.add('v3-acc');
  function body(dt) { var s = dt.querySelector('summary'); return s && s.nextElementSibling; }
  // the answer's box is border-box, so its height and padding move together
  function animate(dt, opening) {
    var ans = body(dt);
    dt._want = opening;
    dt.classList.toggle('is-open', opening);
    var now = dt.open && ans ? ans.getBoundingClientRect().height : 0;
    if (dt._anim) { dt._anim.cancel(); dt._anim = null; }
    if (reduce.matches || !ans || !ans.animate) { dt.open = opening; return; }
    dt.open = true;
    var cs = getComputedStyle(ans), full = ans.offsetHeight, pt = cs.paddingTop, pb = cs.paddingBottom;
    var a = { height: now + 'px', paddingTop: now ? pt : '0px', paddingBottom: now ? pb : '0px', opacity: full ? now / full : 0 };
    var b = opening ? { height: full + 'px', paddingTop: pt, paddingBottom: pb, opacity: 1 } : { height: '0px', paddingTop: '0px', paddingBottom: '0px', opacity: 0 };
    ans.style.overflow = 'hidden';
    dt._anim = ans.animate([a, b], { duration: opening ? 560 : 400, easing: 'cubic-bezier(.65, 0, .35, 1)' });
    dt._anim.onfinish = function () { dt._anim = null; ans.style.overflow = ''; if (!opening) dt.open = false; };
  }
  items.forEach(function (dt) {
    var s = dt.querySelector('summary');
    if (!s) return;
    dt._want = dt.open;
    dt.classList.toggle('is-open', dt.open);
    // the group: the items with the same name, else those in the same block. A name's own one-open rule is done
    // here instead, so the other item can close smoothly rather than snap shut
    dt._group = dt.getAttribute('name') || dt.parentElement;
    dt.removeAttribute('name');
    s.addEventListener('click', function (e) {
      if (e.target.closest('a')) return;
      e.preventDefault();
      var opening = !dt._want;
      if (opening) items.forEach(function (o) { if (o !== dt && o._group === dt._group && o._want) animate(o, false); });
      animate(dt, opening);
    });
    // opened or closed by the browser itself (find in page, a link to an answer): follow it
    dt.addEventListener('toggle', function () { if (!dt._anim) { dt._want = dt.open; dt.classList.toggle('is-open', dt.open); } });
  });
})();

/* The bid form in steps (/request-a-bid/; site.js moves between them): the copy hid steps 2 and 3 in the HTML, so
   without JS the form could not be sent. make-v3.js takes those hidden attributes out; here, with JS, the steps
   fold back to one at a time, and .is-stepped brings on the step bar and the Next and Back buttons (chrome.css). */
(function () {
  'use strict';
  var f = document.querySelector('form[data-steps]');
  if (!f) return;
  [].forEach.call(f.querySelectorAll('.fstep'), function (s, j) { if (j) s.hidden = true; });
  f.classList.add('is-stepped');
})();

/* /contact/ (make-v3.js contactPage, 2026-11-02, Drew: "whatever they click… would change the form below"): a request
   in the first screen picks the form's topic and takes you to the form, without a reload; ?type= on arrival does
   the same (the links from other pages: ?type=inspection, ?type=bid, ?type=leak…), and #form is the browser's own
   jump. site.js shows the leak hint on the change. Without JS the requests are plain links to #form. */
(function () {
  'use strict';
  var d = document, f = d.querySelector('form[name="contact"]'), sec = d.getElementById('form');
  if (!f || !sec || !d.querySelector('.ct-hub')) return;
  var TOPIC = { bid: 'Bid or proposal', quote: 'Bid or proposal', inspection: 'Inspection', leak: 'Active leak', repair: 'Active leak',
    'service-plan': 'Service plan', 'new-construction': 'New construction', 'project-sheet': 'Project sheet', vendor: 'Vendor or trade partner',
    portal: 'Something else', safety: 'Something else', other: 'Something else' };
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var typeOf = function (s) { var m = /[?&]type=([\w-]+)/.exec(s || ''); return m ? m[1] : ''; };
  // t: a type from the link (?type=…); none ("Something else") clears the topic, so the whole list is open to pick from
  function pick(t, clear) {
    var r = TOPIC[t] && f.querySelector('input[name="topic"][value="' + TOPIC[t] + '"]'), on = f.querySelector('input[name="topic"]:checked');
    if (r && !r.checked) { r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true })); }
    else if (!r && clear && on) { on.checked = false; on.dispatchEvent(new Event('change', { bubbles: true })); }
    return r || null;
  }
  [].forEach.call(d.querySelectorAll('.ct-reqs a'), function (a) {
    a.addEventListener('click', function (e) {
      if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;   // a new tab or window keeps the link
      e.preventDefault();
      var t = typeOf(a.getAttribute('href')), r = pick(t, true);
      if (window.history.replaceState) history.replaceState(null, '', (t ? '?type=' + t : location.pathname) + '#form');
      sec.scrollIntoView({ block: 'start', behavior: still ? 'auto' : 'smooth' });
      // the picked topic takes the focus (a keyboard or screen reader lands on it); with none, the first topic
      (r || f.querySelector('input[name="topic"]')).focus({ preventScroll: true });
    });
  });
  if (pick(typeOf(location.search)) && location.hash !== '#form') sec.scrollIntoView({ block: 'start' });
})();

/* The filter panels of the projects hub, the blog and careers (.pfbar, make-v3.js): site.js filters the cards; here
   each chip gets the number of projects (or posts, roles: data-unit) it would show with the other row as it is, and
   a chip that would show none is turned off, so no pair of choices ends on an empty page. Runs after site.js's own
   click handlers (both deferred, in order), and after its ?m= choice from the menu's market links. */
(function () {
  'use strict';
  var bar = document.querySelector('.pfbar');
  var segs = bar ? [].slice.call(bar.querySelectorAll('.seg[data-filter]')) : [];
  if (!segs.length) return;
  var unit = bar.getAttribute('data-unit') || 'project';
  var items = [].slice.call(document.querySelectorAll(segs[0].getAttribute('data-filter')));
  function picked(seg) { var b = seg.querySelector('button[aria-pressed="true"]'); return b ? b.getAttribute('data-v') : 'all'; }
  function has(it, key, v) { return v === 'all' || (it.getAttribute('data-' + key) || '').split(' ').indexOf(v) > -1; }
  function update() {
    segs.forEach(function (seg) {
      var key = seg.getAttribute('data-key');
      var rest = items.filter(function (it) {
        return segs.every(function (o) { return o === seg || has(it, o.getAttribute('data-key'), picked(o)); });
      });
      [].forEach.call(seg.querySelectorAll('button'), function (b) {
        var v = b.getAttribute('data-v'), n = rest.filter(function (it) { return has(it, key, v); }).length;
        var tag = b.querySelector('.seg-n');
        // (a space before it, so the button reads "TPO 7 projects", as the menu's market chips do)
        if (!tag) { tag = document.createElement('span'); tag.className = 'seg-n'; b.appendChild(document.createTextNode(' ')); b.appendChild(tag); }
        tag.innerHTML = n + '<i class="vh"> ' + unit + (n === 1 ? '' : 's') + '</i>';
        b.disabled = !n && b.getAttribute('aria-pressed') !== 'true';
        // the projects hub's dropdowns (.pf-dd, 2026-11-07): each option mirrors its chip, "TPO (7)", off where the chip is
        var sel = bar.querySelector('select[data-seg="' + key + '"]'), o = sel && sel.querySelector('option[value="' + v + '"]');
        if (o) {
          if (!o.hasAttribute('data-t')) o.setAttribute('data-t', o.textContent);
          o.textContent = o.getAttribute('data-t') + ' (' + n + ')';
          o.disabled = b.disabled;
          if (b.getAttribute('aria-pressed') === 'true') sel.value = v;
        }
      });
    });
    // the count keeps the page's own word: site.js writes "3 results" over the copy's "10 roles" on /careers/
    if (cnt && word !== 'result') cnt.textContent = cnt.textContent.replace(/results?$/, function (r) { return r === 'result' ? word : word + 's'; });
  }
  var cnt = document.querySelector(segs[0].getAttribute('data-count') || 'x-none');
  var word = cnt ? (cnt.textContent.trim().match(/^\d+\s+(\w+?)s?$/) || [])[1] : '';
  segs.forEach(function (seg) { seg.addEventListener('click', function (e) { if (e.target.closest('button')) update(); }); });
  // a choice in a dropdown is a click on its (hidden) chip: site.js filters, the listener above counts
  [].forEach.call(bar.querySelectorAll('select[data-seg]'), function (sel) {
    sel.addEventListener('change', function () {
      var seg = bar.querySelector('.seg[data-key="' + sel.getAttribute('data-seg') + '"]');
      var b = seg && seg.querySelector('button[data-v="' + sel.value + '"]');
      if (b) b.click();
    });
  });
  update();
})();

/* /locations/ (make-v3.js locationsPage; R3, 2026-11-03, map-first): without JS the map's states and pins are links
   to the state and office pages, and the state list beside the map holds the same 17 links. Here a state on the map
   and its name in the list light each other up, and the search over the list finds any office, and any state or
   city page from the JSON list make-v3.js puts beside it (#lc-index). */
(function () {
  'use strict';
  var pick = document.querySelector('.lc-pick');
  if (!pick) return;
  var names = [].slice.call(pick.querySelectorAll('.lc-states a'));
  var sts = [].slice.call(pick.querySelectorAll('.locmap .st-a'));
  function lite(code) {
    names.forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-st') === code); });
    sts.forEach(function (a) { a.firstElementChild.classList.toggle('hi', a.firstElementChild.getAttribute('data-st') === code); });
  }
  sts.forEach(function (a) {
    a.addEventListener('mouseenter', function () { lite(a.firstElementChild.getAttribute('data-st')); });
    a.addEventListener('mouseleave', function () { lite(null); });
  });
  names.forEach(function (a) {
    a.addEventListener('mouseenter', function () { lite(a.getAttribute('data-st')); });
    a.addEventListener('focus', function () { lite(a.getAttribute('data-st')); });
    a.addEventListener('mouseleave', function () { lite(null); });
    a.addEventListener('blur', function () { lite(null); });
  });

  // the search: offices first, then states, then cities; a word that starts with the query beats one inside
  var rows = [].slice.call(document.querySelectorAll('.lc-o'));
  var box = document.querySelector('.lc-find__box'), q = document.getElementById('lc-q');
  var res = document.getElementById('lc-res'), say = document.getElementById('lc-say');
  if (!box || !q || !res) return;
  var idx = [], seen = {};
  function add(t, k, u) { if (!u || seen[u]) return; seen[u] = 1; idx.push({ t: t, k: k, u: u, n: norm(t) }); }
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  rows.forEach(function (r) { add(r.querySelector('.lc-o__nm').textContent, 'Office', r.querySelector('.lc-o__acts a').getAttribute('href')); });
  var data = document.getElementById('lc-index');
  try {
    var list = JSON.parse(data.textContent);
    list.s.forEach(function (x) { add(x[0], 'State', x[1]); });
    list.c.forEach(function (x) { add(x[0], 'City', x[1]); });
  } catch (e) { /* the offices alone, then */ }
  var RANK = { Office: 0, State: 1, City: 2 };
  function find(v) {
    v = norm(v.trim());
    var hits = [];
    idx.forEach(function (it) {
      var p = it.n.indexOf(v);
      if (p < 0) return;
      hits.push([p === 0 ? 0 : /[\s,.'-]/.test(it.n.charAt(p - 1)) ? 1 : 2, RANK[it.k], it]);
    });
    hits.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1] || (a[2].t < b[2].t ? -1 : 1); });
    return hits.slice(0, 8).map(function (h) { return h[2]; });
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function close() { res.hidden = true; q.setAttribute('aria-expanded', 'false'); }
  function render() {
    if (!q.value.trim()) { res.innerHTML = ''; close(); say.textContent = ''; return; }
    var list = find(q.value);
    res.innerHTML = list.length ? list.map(function (it) { return '<li><a href="' + it.u + '"><b>' + esc(it.t) + '</b><span>' + it.k + '</span></a></li>'; }).join('')
      : '<li class="lc-none">No match here. <a href="/contact/">Tell us where you are</a></li>';
    res.hidden = false;
    q.setAttribute('aria-expanded', 'true');
    say.textContent = list.length ? list.length + (list.length === 1 ? ' result' : ' results') : 'No match';
  }
  q.addEventListener('input', render);
  q.addEventListener('focus', function () { if (q.value.trim()) render(); });
  q.addEventListener('keydown', function (e) {
    var first = res.hidden ? null : res.querySelector('li:not(.lc-none) a');
    if (e.key === 'ArrowDown' && first) { e.preventDefault(); first.focus(); }
    else if (e.key === 'Enter' && first) { e.preventDefault(); location.href = first.href; }
    else if (e.key === 'Escape') { q.value = ''; render(); }
  });
  res.addEventListener('keydown', function (e) {
    var links = [].slice.call(res.querySelectorAll('a')), k = links.indexOf(document.activeElement);
    if (e.key === 'ArrowDown' && k < links.length - 1) { e.preventDefault(); links[k + 1].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); (k > 0 ? links[k - 1] : q).focus(); }
    else if (e.key === 'Escape') { e.preventDefault(); close(); q.focus(); }
  });
  document.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
  box.hidden = false;
})();

/* A project's first screen (make-v3.js projectPage, batch 5, 2026-11-02): a thumbnail shows its photo in the big frame
   and the counter follows ("03 / 07"). Without JS each thumbnail is a link to that photo further down the page;
   a click with a modifier key still opens the link. */
(function () {
  'use strict';
  var shot = document.querySelector('.pj-shot'), list = document.querySelector('.pj-thumbs');
  if (!shot || !list) return;
  var img = shot.querySelector('img'), src = shot.querySelector('source'), num = shot.querySelector('.pj-count b');
  var links = [].slice.call(list.querySelectorAll('a'));
  function show(i) {
    var a = links[i], n = '/assets/img/' + a.getAttribute('data-n'), w = a.getAttribute('data-w');
    if (a.getAttribute('aria-current')) return;
    shot.classList.add('is-swap');
    img.onload = function () { shot.classList.remove('is-swap'); };
    if (src) src.srcset = n + '-800.webp 800w, ' + n + '.webp ' + w + 'w';
    img.srcset = n + '-800.jpg 800w, ' + n + '.jpg ' + w + 'w';
    img.src = n + '.jpg';
    img.alt = a.getAttribute('data-alt') || '';
    if (num) num.textContent = (i < 9 ? '0' : '') + (i + 1);
    links.forEach(function (l) { l.removeAttribute('aria-current'); });
    a.setAttribute('aria-current', 'true');
  }
  links.forEach(function (a, i) {
    a.addEventListener('click', function (e) {
      if (e.button || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      show(i);
    });
  });
})();

/* A blog post's contents (make-v3.js blogPost, batch 6, 2026-11-02): the yellow line beside the list is drawn down as
   you read, to the place in the list of the section you are in (how far through that section you are moves it along
   that item), and that section's item is marked (aria-current, chrome.css draws its tick). A section counts as begun
   once its heading passes a third of the way down the window. If the list scrolls inside the rail, the current item
   is kept in view. Without JS the list is plain links and the line stays grey; on phones the rail is hidden. */
(function () {
  'use strict';
  var toc = document.querySelector('.bp-toc');
  if (!toc) return;
  var box = toc.querySelector('.bp-toc__in'), list = toc.querySelector('.bp-toc__list'), fill = toc.querySelector('.bp-toc__line i');
  var art = document.querySelector('.bp-art'), faq = document.querySelector('.bp-faq');
  var links = [].slice.call(toc.querySelectorAll('ol a'));
  var heads = links.map(function (a) { return document.getElementById(a.getAttribute('href').slice(1)); });
  if (!box || !list || !fill || !art || heads.some(function (h) { return !h; })) return;
  var cur = -1, queued = false;
  function top(el) { return el.getBoundingClientRect().top + window.pageYOffset; }
  function more() { box.classList.toggle('is-more', box.scrollTop + box.clientHeight < box.scrollHeight - 2); }
  box.addEventListener('scroll', more, { passive: true });
  function update() {
    queued = false;
    if (!toc.offsetParent) return;
    more();
    var y = window.pageYOffset + window.innerHeight / 3;
    var t = heads.map(top), last = heads[heads.length - 1];
    var end = faq && faq.contains(last) ? top(faq) + faq.offsetHeight : top(art) + art.offsetHeight;
    var i = -1;
    for (var k = 0; k < t.length; k++) if (t[k] <= y) i = k;
    var px = 0;
    if (i >= 0) {
      var a = t[i], b = i + 1 < t.length ? t[i + 1] : end, li = links[i].parentNode;
      var f = Math.max(0, Math.min(1, (y - a) / Math.max(1, b - a)));
      px = li.offsetTop + f * li.offsetHeight;
    }
    fill.style.transform = 'scaleY(' + Math.min(1, px / Math.max(1, list.offsetHeight)) + ')';
    if (i === cur) return;
    if (cur >= 0) links[cur].removeAttribute('aria-current');
    cur = i;
    if (i < 0) return;
    links[i].setAttribute('aria-current', 'true');
    var it = links[i].parentNode;
    if (it.offsetTop < box.scrollTop || it.offsetTop + it.offsetHeight > box.scrollTop + box.clientHeight - 36) box.scrollTop = Math.max(0, it.offsetTop - box.clientHeight / 3);
  }
  function queue() { if (!queued) { queued = true; window.requestAnimationFrame(update); } }
  window.addEventListener('scroll', queue, { passive: true });
  window.addEventListener('resize', queue);
  window.addEventListener('load', queue);
  update();
})();

/* the system pages' cutaway (batch 7, make-v3.js systemPage): a layer in the numbered list and in the drawing light up
   together (site.js lights the drawing from its own layers and labels), and the layers drop in when the drawing comes
   on screen, since it is no longer in the first screen (site.js dropped them in at load). Without JS they just show. */
(function () {
  var x = document.querySelector('.sy-x .xsec'), list = document.querySelector('.sy-layers');
  if (!x || !list) return;
  var L = [].slice.call(x.querySelectorAll('.xl')), C = [].slice.call(x.querySelectorAll('.xc')), items = [].slice.call(list.children);
  function mark(i) { items.forEach(function (li, j) { li.classList.toggle('hi', j === i); }); }
  function hl(i) {
    L.forEach(function (g, j) { g.classList.toggle('hi', j === i); g.classList.toggle('lo', i > -1 && j !== i); });
    C.forEach(function (g, j) { g.classList.toggle('hi', j === i); });
    mark(i);
  }
  items.forEach(function (li) {
    li.addEventListener('mouseenter', function () { hl(+li.getAttribute('data-i')); });
    li.addEventListener('mouseleave', function () { hl(-1); });
  });
  L.concat(C).forEach(function (g) {
    g.addEventListener('mouseenter', function () { mark(+g.getAttribute('data-i')); });
    g.addEventListener('mouseleave', function () { mark(-1); });
  });
  if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (x.getBoundingClientRect().top < window.innerHeight * 0.85) return;
  x.classList.add('xs-wait');
  var io = new IntersectionObserver(function (es) {
    if (!es[0].isIntersecting) return;
    x.classList.remove('xs-wait');
    io.disconnect();
  }, { threshold: 0.35 });
  io.observe(x);
})();

/* the offices on the state and office pages' map (batch 8, make-v3.js locPage): a pin and its name in the list light up
   together. The pins are links themselves, and the list works without JS. */
(function () {
  [].forEach.call(document.querySelectorAll('[data-stm]'), function (box) {
    var els = [].slice.call(box.querySelectorAll('[data-o]'));
    function on(i) { els.forEach(function (e) { e.classList.toggle('on', e.getAttribute('data-o') === i); }); }
    els.forEach(function (e) {
      var i = e.getAttribute('data-o');
      e.addEventListener('mouseenter', function () { on(i); });
      e.addEventListener('mouseleave', function () { on(null); });
      e.addEventListener('focus', function () { on(i); });
      e.addEventListener('blur', function () { on(null); });
    });
  });
})();

/* the home's office map (batch 10, Drew's call 2026-10-27 @25:19–28:14; make-v3.js "the home's office map"). Without JS
   each state is a link to its state page, each pin to its office page, and the card lists all 18 offices. Here a state
   (click, or Enter on its link) becomes a filter: the card shows its offices, the hub or the first one picked (or the
   pin that was clicked), the other states go light and their pins fade; "All" (and Escape) puts everything back. On a
   desktop the map tours the states with offices on its own, from All, while it is on screen; it stops for good at the
   first touch, click, key, focus or pointer over the map, and never runs with reduced motion or under 1180 px, where
   the card sits under the map and its changing height would move the page. The card is aria-live only once the
   visitor has used the map, so the tour is never read out. */
(function () {
  'use strict';
  var box = document.querySelector('[data-lm]');
  if (!box) return;
  var svg = box.querySelector('.lm-usmap'), card = box.querySelector('.lm-card'), json = document.getElementById('lm-data');
  if (!svg || !card || !json) return;
  var D;
  try { D = JSON.parse(json.textContent); } catch (e) { return; }
  var O = D.o, S = D.s;
  var head = card.querySelector('.lm-card__h'), kick = head.querySelector('.k'), body = card.querySelector('.lm-card__b');
  var allBody = body.innerHTML, allKick = kick.textContent;
  var sts = [].slice.call(svg.querySelectorAll('.st-a')), pins = [].slice.call(svg.querySelectorAll('.pn-a'));
  var still = window.matchMedia('(prefers-reduced-motion: reduce)'), wide = window.matchMedia('(min-width: 1180px)');
  var cur = null, sel = null;
  var allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'lm-all';
  allBtn.textContent = 'All';
  allBtn.setAttribute('aria-label', 'Show all offices');
  allBtn.setAttribute('aria-pressed', 'true');
  head.appendChild(allBtn);
  var ARROW = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 8h11M9 4l4 4-4 4"/></svg>';
  function list(c) { return S[c].o.length ? S[c].o : S[c].f; }
  function where(o) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(o.c + ' ' + o.a.replace(/<br>/g, ' ').replace(/&amp;/g, '&')); }
  function fresh() {
    if (still.matches) return;
    body.classList.remove('is-new');
    void body.offsetWidth;
    body.classList.add('is-new');
  }
  function paint() {
    svg.classList.toggle('focus', !!cur);
    var lit = cur ? list(cur) : [];
    sts.forEach(function (a) {
      var on = a.getAttribute('data-st') === cur;
      a.firstElementChild.classList.toggle('hi', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    pins.forEach(function (a) {
      var i = +a.getAttribute('data-i'), g = a.firstElementChild, mine = lit.indexOf(i) >= 0;
      g.classList.toggle('dim', !!cur && !mine);
      g.classList.toggle('lit', mine);
      g.classList.toggle('on', i === sel);
    });
    allBtn.setAttribute('aria-pressed', cur ? 'false' : 'true');
  }
  function showAll() {
    cur = sel = null;
    kick.textContent = allKick;
    body.innerHTML = allBody;
    hookAll();
    paint();
    fresh();
  }
  function show(c, i) {
    var L = list(c), st = S[c];
    if (i == null || L.indexOf(i) < 0) i = L[0];
    cur = c;
    sel = i;
    var o = O[i];
    kick.textContent = st.o.length > 1 ? 'Offices in ' + st.n : st.o.length ? 'Our office in ' + st.n : st.n + ' is served from';
    var h = '';
    if (L.length > 1) {
      h += '<ul class="lm-card__offs">' + L.map(function (j) {
        return '<li><button type="button" data-i="' + j + '" aria-pressed="' + (j === i) + '">' + O[j].c.split(',')[0] + '</button></li>';
      }).join('') + '</ul>';
    }
    h += '<div class="lm-card__o"><span class="r">' + o.r + '</span><b>' + o.c + '</b><p>' + o.a + ' · (866)&nbsp;699-3360</p>' +
      '<div class="acts"><a href="' + where(o) + '" target="_blank" rel="noopener">Directions</a><a href="' + o.u + '">Office page</a></div></div>' +
      '<a class="v3-go" href="' + st.u + '">Roofing in ' + st.n + ' ' + ARROW + '</a>';
    body.innerHTML = h;
    [].forEach.call(body.querySelectorAll('.lm-card__offs button'), function (b) {
      b.addEventListener('click', function () {
        var j = +b.getAttribute('data-i');
        if (j === sel) return;
        use();
        show(cur, j);
        var nb = body.querySelector('.lm-card__offs button[data-i="' + j + '"]');
        if (nb) nb.focus();
      });
    });
    paint();
    fresh();
  }
  // in the list of all offices, a name lights its pin
  function hookAll() {
    [].forEach.call(body.querySelectorAll('.lm-card__all a'), function (a) {
      var i = +a.getAttribute('data-i');
      function on(v) { pins.forEach(function (p) { if (+p.getAttribute('data-i') === i) p.firstElementChild.classList.toggle('on', v); }); }
      a.addEventListener('mouseenter', function () { on(true); });
      a.addEventListener('mouseleave', function () { on(false); });
      a.addEventListener('focus', function () { on(true); });
      a.addEventListener('blur', function () { on(false); });
    });
  }
  hookAll();
  // the visitor's own use: the tour stops for good, and from now on the card is read out when it changes
  var used = false, timer = 0;
  function use() {
    if (used) return;
    used = true;
    clearTimeout(timer);
    card.setAttribute('aria-live', 'polite');
  }
  sts.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      use();
      show(a.getAttribute('data-st'));
    });
  });
  pins.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      use();
      show(a.getAttribute('data-st'), +a.getAttribute('data-i'));
    });
  });
  allBtn.addEventListener('click', function () {
    use();
    if (cur) showAll();
  });
  box.addEventListener('keydown', function (e) {
    use();
    if (e.key === 'Escape' && cur) {
      var inCard = card.contains(document.activeElement);
      showAll();
      if (inCard) allBtn.focus();
    }
  });
  ['pointerdown', 'focusin', 'touchstart'].forEach(function (t) { box.addEventListener(t, use, { passive: true }); });
  box.addEventListener('pointerover', function (e) { if (e.pointerType === 'mouse') use(); });
  // the tour: All, then each state with an office, west to east, then All again
  var TOUR = ['WA', 'CA', 'NV', 'ID', 'UT', 'AZ', 'CO', 'NM', 'TX', 'TN', 'GA', 'NC', 'SC', 'FL'].filter(function (c) { return S[c] && S[c].o.length; });
  var step = -1, seen = false;
  function next() {
    if (used || !seen) return;
    if (still.matches || !wide.matches) { if (cur) showAll(); return; }
    step = (step + 1) % (TOUR.length + 1);
    if (step === TOUR.length) showAll(); else show(TOUR[step]);
    timer = setTimeout(next, step === TOUR.length ? 4000 : 2600);
  }
  // 2026-11-07 (Drew's call 11-03 @7:47, item H5: "start with one selected, like Dallas… that's your default view"): the
  // map opens on Texas with Dallas picked (the card shows the Dallas office), not on All, and the tour is off (TOUR_ON),
  // since it would move off Dallas. Without JS the card still lists all 18 offices. All and Escape work as before.
  var TOUR_ON = false;
  (function () {
    for (var i = 0; i < O.length; i++) if (/^Dallas\b/.test(O[i].c) && S.TX) { show('TX', i); body.classList.remove('is-new'); return; }
  })();
  if (TOUR_ON && !still.matches && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      seen = es[0].isIntersecting;
      clearTimeout(timer);
      if (seen && !used) timer = setTimeout(next, cur ? 2600 : 2400);
    }, { threshold: 0.5 }).observe(svg);
  }
})();
