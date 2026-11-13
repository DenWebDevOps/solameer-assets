(function(){
  var nav=document.getElementById('nav'),prog=document.getElementById('prog'),burger=document.getElementById('burger');
  /* sticky shadow + progress.
     LH-16: the document height is read once per resize, and the first run happens in a frame, not during script execution.
     MOB-02: the phone call bar stays out of the first screen, hides while scrolling down and returns on the way up.
     DS-24: the chat launcher is icon-only over the first screen so it never covers hero copy. */
  var tick=false,docH=0,lastY=0,bd=document.body;function measure(){docH=document.documentElement.scrollHeight-window.innerHeight;}
  function onScroll(){var y=window.scrollY||document.documentElement.scrollTop,top=y<window.innerHeight*.6;nav.classList.toggle('is-stuck',y>40);if(prog)prog.style.width=(docH>0?Math.min(100,y/docH*100):0)+'%';
    if(top)bd.classList.add('cb-off');else if(y-lastY>6)bd.classList.add('cb-off');else if(lastY-y>6)bd.classList.remove('cb-off');bd.classList.toggle('sd-compact',top);lastY=y;tick=false;}
  window.addEventListener('scroll',function(){if(!tick){requestAnimationFrame(onScroll);tick=true;}},{passive:true});
  window.addEventListener('resize',measure,{passive:true});
  /* the height comes from a ResizeObserver, which reports after the browser's own layout, so nothing forces one;
     the page opens at the top, so the first-screen state is set without measuring anything */
  if('ResizeObserver' in window)new ResizeObserver(measure).observe(bd);else window.addEventListener('load',measure);
  bd.classList.add('cb-off','sd-compact');
  burger.addEventListener('click',function(){var o=nav.classList.toggle('is-open');burger.setAttribute('aria-expanded',o);document.body.classList.toggle('menu-open',o);});
  /* mega panels: hover on desktop, click/keyboard everywhere */
  var tops=[].slice.call(nav.querySelectorAll('.nv-top[data-mega]')),panels=[].slice.call(nav.querySelectorAll('.mega')),closeT;
  function openM(k){clearTimeout(closeT);panels.forEach(function(p){p.hidden=p.dataset.panel!==k;});tops.forEach(function(t){t.setAttribute('aria-expanded',t.dataset.mega===k);});}
  function closeAll(){panels.forEach(function(p){p.hidden=true;});tops.forEach(function(t){t.setAttribute('aria-expanded','false');});}
  function later(){clearTimeout(closeT);closeT=setTimeout(closeAll,180);}
  tops.forEach(function(t){
    t.addEventListener('mouseenter',function(){openM(t.dataset.mega);});
    t.addEventListener('mouseleave',later);
    /* pointer devices: a click always goes to the section page. Touch: first tap opens the panel, second tap follows the link. */
    t.addEventListener('click',function(e){if(window.matchMedia('(hover:hover)').matches)return;if(t.getAttribute('aria-expanded')!=='true'){e.preventDefault();openM(t.dataset.mega);}});
    t.addEventListener('keydown',function(e){if(e.key==='ArrowDown'||e.key===' '||e.key==='Spacebar'){e.preventDefault();openM(t.dataset.mega);var p=panelOf(t),f=p&&p.querySelector('a,button');if(f)f.focus();}});
    t.addEventListener('focus',function(){var o=openTop();if(o&&o!==t)closeAll();});
  });
  panels.forEach(function(p){p.addEventListener('mouseenter',function(){clearTimeout(closeT);});p.addEventListener('mouseleave',later);});
  nav.querySelectorAll('.nv-top:not([data-mega])').forEach(function(a){a.addEventListener('mouseenter',closeAll);});
  function panelOf(t){return nav.querySelector('.mega[data-panel="'+t.dataset.mega+'"]');}
  function openTop(){return tops.filter(function(x){return x.getAttribute('aria-expanded')==='true';})[0];}
  /* Tab out of the last link of a panel goes on to the next menu item; Shift+Tab from the first link goes back to its trigger */
  panels.forEach(function(p){p.addEventListener('keydown',function(e){if(e.key!=='Tab')return;var fs=[].slice.call(p.querySelectorAll('a,button')),t=tops.filter(function(x){return x.dataset.mega===p.dataset.panel;})[0],i=tops.indexOf(t);
    if(!e.shiftKey&&document.activeElement===fs[fs.length-1]){e.preventDefault();closeAll();(tops[i+1]||nav.querySelector('.nv-top:not([data-mega])')||t).focus();}
    else if(e.shiftKey&&document.activeElement===fs[0]){e.preventDefault();closeAll();t.focus();}});});
  nav.addEventListener('focusout',function(e){if(e.relatedTarget&&!nav.contains(e.relatedTarget))closeAll();});
  document.addEventListener('keydown',function(e){if(e.key!=='Escape')return;var o=openTop();closeAll();if(o&&nav.contains(document.activeElement))o.focus();
    if(nav.classList.contains('is-open')){nav.classList.remove('is-open');burger.setAttribute('aria-expanded','false');document.body.classList.remove('menu-open');burger.focus();}});
  document.addEventListener('click',function(e){if(!nav.contains(e.target))closeAll();});
  /* hero video */
  var v=document.getElementById('heroVideo'),vb=document.getElementById('vidBtn');
  if(v&&vb){
  var still=window.matchMedia('(prefers-reduced-motion: reduce)').matches||!window.matchMedia('(min-width: 768px)').matches||(navigator.connection&&navigator.connection.saveData);
  function attach(){if(!v.dataset.src)return;var s=document.createElement('source');s.src=v.dataset.src;s.type='video/mp4';v.appendChild(s);v.removeAttribute('data-src');v.load();}
  if(!still)attach();
  function sync(){var p=v.paused;vb.setAttribute('aria-pressed',p);vb.querySelector('span').textContent=p?'Play':'Pause';vb.querySelector('svg').innerHTML=p?'<path d="M3 1l10 6-10 6z"/>':'<rect x="2" y="1" width="3.5" height="12"/><rect x="8.5" y="1" width="3.5" height="12"/>';}
  vb.addEventListener('click',function(){attach();v.paused?v.play():v.pause();});v.addEventListener('play',sync);v.addEventListener('pause',sync);sync();
  if(!still){var pp=v.play&&v.play();if(pp&&pp.catch)pp.catch(sync);}
  }
  /* process flow bar */
  if(document.getElementById('flowbar')){
  var fbs=[].slice.call(document.querySelectorAll('.fb')),steps=[].slice.call(document.querySelectorAll('.step')),fill=document.getElementById('fbFill'),auto;
  function setStep(i){fbs.forEach(function(b,j){b.classList.toggle('on',j<=i);});steps.forEach(function(s,j){s.classList.toggle('on',j===i);});fill.style.width='calc((100% - 48px) * '+(i/(fbs.length-1))+')';}
  var cur=0,live=false,RM=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function tick(){cur=(cur+1)%fbs.length;setStep(cur);}
  function play(delay){clearInterval(auto);clearTimeout(play.t);if(RM||!live)return;play.t=setTimeout(function(){auto=setInterval(tick,2600);},delay||0);}
  function jump(k){cur=k;setStep(k);play(4200);}
  fbs.forEach(function(b){b.addEventListener('click',function(){jump(+b.dataset.step);});});
  steps.forEach(function(st,k){st.setAttribute('tabindex','0');st.addEventListener('click',function(){jump(k);});st.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();jump(k);}});});
  setStep(0);
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){live=e.isIntersecting;if(live)play(1200);else{clearInterval(auto);clearTimeout(play.t);}});},{threshold:.35});io.observe(document.getElementById('flowbar').closest('section'));}
  window.addEventListener('resize',function(){var on=fbs.filter(function(b){return b.classList.contains('on')}).length-1;setStep(Math.max(0,on));});
  }
  /* office map + directory */
  var OFF=window.SOL_OFFICES||[],svg=document.querySelector('.usmap'),card=document.getElementById('lmCard');
  if(svg){
    var pins=[].slice.call(svg.querySelectorAll('.pn')),rows=[].slice.call(document.querySelectorAll('.lm-list button')),sts=[].slice.call(svg.querySelectorAll('.st.on')),tabs=[].slice.call(document.querySelectorAll('.lm-tabs button'));
    function q(o){return encodeURIComponent(o.c+' '+o.a.replace(/<br>/g,' '));}
    function show(i){var o=OFF[i];pins.forEach(function(p){p.classList.toggle('on',+p.dataset.i===i);});rows.forEach(function(r){r.classList.toggle('on',+r.dataset.i===i);});
      card.innerHTML='<span class="k">'+o.role+'</span><b>'+o.c+'</b><p>'+o.a+' · (866) 699-3360</p><div class="acts"><a href="https://www.google.com/maps/search/?api=1&query='+q(o)+'" target="_blank" rel="noopener">Directions</a><a href="'+o.u+'">Office page</a></div>';}
    function filt(f){tabs.forEach(function(t){t.setAttribute('aria-pressed',t.dataset.f===f);});svg.classList.toggle('focus',f!=='all');
      sts.forEach(function(s){s.classList.toggle('hi',s.dataset.r===f);});pins.forEach(function(p){p.classList.toggle('dim',f!=='all'&&p.dataset.r!==f);});
      rows.forEach(function(r){r.parentNode.hidden=f!=='all'&&r.dataset.r!==f;});
      if(f!=='all'){var first=rows.filter(function(r){return r.dataset.r===f;})[0];if(first)show(+first.dataset.i);}else show(0);}
    pins.forEach(function(p){p.addEventListener('click',function(){show(+p.dataset.i);});p.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();show(+p.dataset.i);}});});
    rows.forEach(function(r){r.addEventListener('click',function(){show(+r.dataset.i);});r.addEventListener('mouseenter',function(){pins.forEach(function(p){p.classList.toggle('on',p.dataset.i===r.dataset.i||p.classList.contains('on')&&false);});});r.addEventListener('mouseleave',function(){var cur=rows.filter(function(x){return x.classList.contains('on');})[0];pins.forEach(function(p){p.classList.toggle('on',cur&&p.dataset.i===cur.dataset.i);});});});
    tabs.forEach(function(t){t.addEventListener('click',function(){filt(t.dataset.f);});});
    show(0);
  }
  /* reveal on scroll (content stays visible if this never runs) */
  if('IntersectionObserver' in window&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    var ro=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('rv-play');ro.unobserve(e.target);}});},{rootMargin:'0px 0px 120px 0px'});
    var io0=new IntersectionObserver(function(es){es.forEach(function(e){io0.unobserve(e.target);if(!e.isIntersecting)ro.observe(e.target);});});
    document.querySelectorAll('.rv').forEach(function(el){io0.observe(el);});
  }
})();
/* utility-bar ticker */
(function(){var r=document.querySelector('.tk-rot');if(!r)return;var a=[].slice.call(r.querySelectorAll('a')),i=0,t,held=false;
function mark(){a.forEach(function(x,j){x.classList.toggle('on',j===i);if(j===i){x.removeAttribute('aria-hidden');x.removeAttribute('tabindex');}else{x.setAttribute('aria-hidden','true');x.setAttribute('tabindex','-1');}});}
function go(){i=(i+1)%a.length;mark();}
function stop(){clearInterval(t);}function start(){stop();if(!held)t=setInterval(go,5200);}
r.addEventListener('mouseenter',stop);r.addEventListener('mouseleave',start);r.addEventListener('focusin',stop);r.addEventListener('focusout',start);
mark();if(window.matchMedia('(prefers-reduced-motion: reduce), (max-width: 600px)').matches)return; /* phones: one static line, no rotation */
var b=document.createElement('button');b.type='button';b.className='tk-pause';b.setAttribute('aria-label','Pause announcements');b.setAttribute('aria-pressed','false');
b.innerHTML='<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1" width="3" height="10" fill="currentColor"/><rect x="7" y="1" width="3" height="10" fill="currentColor"/></svg>';
b.addEventListener('click',function(){held=!held;b.setAttribute('aria-pressed',held);b.setAttribute('aria-label',held?'Resume announcements':'Pause announcements');b.innerHTML=held?'<svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 1l9 5-9 5z" fill="currentColor"/></svg>':'<svg viewBox="0 0 12 12" aria-hidden="true"><rect x="2" y="1" width="3" height="10" fill="currentColor"/><rect x="7" y="1" width="3" height="10" fill="currentColor"/></svg>';held?stop():start();});
r.parentNode.insertBefore(b,r.nextSibling);start();})();

/* Page modules. Each one only runs when its markup is on the page. */
(function(){
  var $=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return [].slice.call((r||document).querySelectorAll(s))};

  /* segmented filters: <div class="seg" data-filter="items-selector" data-key="attr">. Filters on the same items combine. */
  var FS={};
  $$('.seg[data-filter]').forEach(function(seg){
    var sel=seg.dataset.filter,key=seg.dataset.key,btns=$$('button,[data-v]',seg);FS[sel]=FS[sel]||{state:{},count:null};FS[sel].state[key]='all';
    if(seg.dataset.count)FS[sel].count=$(seg.dataset.count);
    btns.forEach(function(b){b.addEventListener('click',function(){btns.forEach(function(x){x.setAttribute('aria-pressed',x===b);});FS[sel].state[key]=b.dataset.v;apply(sel);});});
  });
  function apply(sel){var st=FS[sel].state,n=0;$$(sel).forEach(function(it){var ok=Object.keys(st).every(function(k){return st[k]==='all'||(it.getAttribute('data-'+k)||'').split(' ').indexOf(st[k])>-1;});it.hidden=!ok;if(ok)n++;});
    if(FS[sel].count)FS[sel].count.textContent=n+(n===1?' result':' results');}
  var qm=/[?&]m=([^&#]+)/.exec(location.search);if(qm){var mv=decodeURIComponent(qm[1]);$$('.seg[data-key="m"] button').forEach(function(b){if(b.dataset.v===mv)b.click();});}

  /* layered roof diagram: hover a layer or label to read about it */
  var xs=$('.xsec');
  if(xs){var L=$$('.xl',xs),C=$$('.xc',xs),cap=$('.xs-cap'),cb=cap&&$('b',cap),cs=cap&&$('span',cap);
    function hl(i){L.forEach(function(g,j){g.classList.toggle('hi',j===i);g.classList.toggle('lo',i>-1&&j!==i);});C.forEach(function(g,j){g.classList.toggle('hi',j===i);});
      var g=L[i<0?0:i];if(cap){cb.textContent=(i<0?1:i+1)+' · '+g.dataset.n;cs.textContent=g.dataset.d;}}
    L.concat(C).forEach(function(g){g.addEventListener('mouseenter',function(){hl(+g.dataset.i);});g.addEventListener('mouseleave',function(){hl(-1);});});
    /* lock the caption box to the tallest caption so hovering never resizes the card */
    function lock(){if(!cap)return;cap.style.height='';var mh=0;L.forEach(function(g,i){hl(i);mh=Math.max(mh,cap.getBoundingClientRect().height);});hl(-1);cap.style.height=Math.ceil(mh)+'px';cap.style.overflow='hidden';}
    lock();window.addEventListener('resize',lock);if(document.fonts&&document.fonts.ready)document.fonts.ready.then(lock);
    hl(-1);requestAnimationFrame(function(){setTimeout(function(){xs.classList.add('go');},120);});}

  /* generic tabs */
  $$('[data-tabs]').forEach(function(tb){var bs=$$('[data-tab]',tb),ps=$$('[data-panel]',tb);
    function sel(b,f){bs.forEach(function(x){var on=x===b;x.setAttribute('aria-selected',on);x.tabIndex=on?0:-1;});ps.forEach(function(p){p.hidden=p.dataset.panel!==b.dataset.tab;});if(f)b.focus();}
    bs.forEach(function(b,i){var p=ps.filter(function(x){return x.dataset.panel===b.dataset.tab;})[0];if(p){b.id=b.id||'tab-'+b.dataset.tab;p.id=p.id||'panel-'+b.dataset.tab;p.setAttribute('role','tabpanel');p.setAttribute('aria-labelledby',b.id);b.setAttribute('aria-controls',p.id);}
      b.addEventListener('click',function(){sel(b);});
      b.addEventListener('keydown',function(e){var j={ArrowRight:(i+1)%bs.length,ArrowLeft:(i-1+bs.length)%bs.length,Home:0,End:bs.length-1}[e.key];if(j===undefined)return;e.preventDefault();sel(bs[j],true);});});
    var cur=bs.filter(function(b){return b.getAttribute('aria-selected')==='true';})[0]||bs[0];bs.forEach(function(x){x.tabIndex=x===cur?0:-1;});});

  /* phasing board (roof replacement) */
  var ph=$('.phase');
  if(ph){var weeks=JSON.parse(ph.dataset.weeks),bl=$$('.bldg',ph),log=$('.phase-log',ph),wb=$$('.phase-top button',ph);
    var lab=JSON.parse(ph.dataset.labels||'{}'),stp=$$('.ph-step',ph);
    function wk(i){wb.forEach(function(b,j){b.setAttribute('aria-pressed',j===i);});weeks[i].s.forEach(function(s,j){bl[j].dataset.s=s;bl[j].querySelector('span').textContent=lab[s];});log.textContent=weeks[i].t;stp.forEach(function(x){x.classList.toggle('on',weeks[i].s.indexOf(x.dataset.k)>-1);});}
    wb.forEach(function(b,i){b.addEventListener('click',function(){wk(i);});});wk(0);}

  /* restore / repair / replace checker */
  var ck=$('.chk');
  if(ck){var out=$('.chk-r b',ck),why=$('.chk-r p',ck);ck.addEventListener('submit',function(e){e.preventDefault();});
    function score(){var v={};$$('input:checked',ck).forEach(function(i){v[i.name]=i.value;});
      if(Object.keys(v).length<3){out.textContent='Answer 3 questions';why.textContent='Your answers point to a likely path. We confirm it on the roof with a moisture survey before anyone prices anything.';return;}
      var wet=v.wet==='lots',age=v.age==='old',leaks=v.leaks;
      var r,t;
      if(wet||(age&&leaks==='many')){r='Likely replace';t='Widespread wet insulation or an end-of-life membrane usually means a coating would be trapping water. Replacement resets the roof and the warranty.';}
      else if(leaks==='one'&&!age){r='Likely repair';t='A single leak on a roof with life left is usually a flashing, seam or penetration. Fix the source, document it and put the roof on a plan.';}
      else{r='Likely restore';t='A mostly dry roof with some age is the classic restoration candidate: repair the details, then coat the field for added service life.';}
      out.textContent=r;why.textContent=t;}
    $$('input',ck).forEach(function(i){i.addEventListener('change',score);});score();}

  /* leak hotspots */
  var hot=$('.hot');
  if(hot){var data=JSON.parse(hot.dataset.spots),spots=$$('.spot',hot),tabs=$$('.hot-tabs button',hot),d=$('.hot-d',hot);
    function sh(i){var s=data[i];spots.forEach(function(x,j){x.classList.toggle('on',j===i);});tabs.forEach(function(x,j){x.setAttribute('aria-pressed',j===i);});
      $('.k',d).textContent='Leak source '+(i+1)+' of '+data.length;$('h3',d).textContent=s.t;$('p',d).textContent=s.d;$('ul',d).innerHTML=s.f.map(function(f){return '<li>'+f+'</li>';}).join('');}
    spots.forEach(function(x,i){x.addEventListener('click',function(){sh(i);});x.addEventListener('keydown',function(e){if(e.key==='Enter'){sh(i);}});});
    tabs.forEach(function(x,i){x.addEventListener('click',function(){sh(i);});});sh(0);}

  /* service plan calendar */
  var cal=$('.cal');
  if(cal){var cm=JSON.parse(cal.dataset.months),mb=$$('.cal-m button',cal),cd=$('.cal-d',cal);
    function mo(i){mb.forEach(function(b,j){b.setAttribute('aria-pressed',j===i);});$('b',cd).textContent=cm[i].n;$('p',cd).textContent=cm[i].t;}
    mb.forEach(function(b,i){b.addEventListener('click',function(){mo(i);});});var first=mb.findIndex(function(b){return b.classList.contains('v');});mo(first<0?0:first);}

  /* gallery lightbox */
  var lb=$('.lb');
  if(lb){var img=$('img',lb),from=null;$$('.gal a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();from=a;img.src=a.getAttribute('href');img.alt=a.getAttribute('aria-label')||'';lb.hidden=false;$('button',lb).focus();});});
    lb.addEventListener('keydown',function(e){if(e.key==='Tab'){e.preventDefault();$('button',lb).focus();}});
    function cl(){lb.hidden=true;img.removeAttribute('src');if(from)from.focus();}$('button',lb).addEventListener('click',cl);lb.addEventListener('click',function(e){if(e.target===lb)cl();});document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!lb.hidden)cl();});}

  /* stepped form (request a bid) */
  var sf=$('form[data-steps]');
  if(sf){var st=$$('.fstep',sf),nav=$$('.steps-nav span'),i=0;
    function show(n){i=n;st.forEach(function(s,j){s.hidden=j!==n;});nav.forEach(function(s,j){s.classList.toggle('on',j===n);s.classList.toggle('done',j<n);});var y=sf.getBoundingClientRect().top+window.scrollY-120;if(window.scrollY>y)window.scrollTo({top:y,behavior:'smooth'});if(n>0){var ff=st[n].querySelector('input:not([type=hidden]),select,textarea');if(ff)ff.focus({preventScroll:true});}}
    function valid(n){var ok=true;$$('input,select,textarea',st[n]).forEach(function(f){if(!f.checkValidity()){ok=false;f.reportValidity&&ok===false&&f.reportValidity();}});
      if(ok)$$('.fld',st[n]).forEach(function(fd){var lab=fd.querySelector('label'),bx=$$('input[type=checkbox]',fd),er=fd.querySelector('.fld-err');if(!bx.length||!lab||!lab.querySelector('em'))return;
        if(bx.some(function(b){return b.checked;})){if(er)er.remove();return;}
        if(ok){ok=false;if(!er){er=document.createElement('p');er.className='fld-err';er.setAttribute('role','alert');fd.appendChild(er);}er.textContent='Choose at least one option.';bx[0].focus();}});
      return ok;}
    $$('[data-next]',sf).forEach(function(b){b.addEventListener('click',function(){if(valid(i))show(i+1);});});
    $$('[data-prev]',sf).forEach(function(b){b.addEventListener('click',function(){show(i-1);});});
    show(0);}

  /* forms: when opened as a local preview (not on Netlify), confirm inline instead of posting */
  $$('form[data-netlify]').forEach(function(f){
    if(/netlify\.app$|solameer\.com$/.test(location.hostname))return;
    f.addEventListener('submit',function(e){e.preventDefault();var m=$('.ok-msg',f.parentNode)||$('.ok-msg');if(m){m.style.display='block';m.scrollIntoView({block:'center'});}});
  });
})();
/* contact: leak hint + preselect from ?type= */
(function(){var f=document.querySelector('form[name="contact"]');if(!f)return;var hint=f.querySelector('.cf-leak');
function upd(){var c=f.querySelector('input[name="topic"]:checked');if(hint)hint.hidden=!(c&&c.value==='Active leak');}
f.addEventListener('change',upd);
var m=/[?&]type=([^&]+)/.exec(location.search);if(m){var map={'project-sheet':'Project sheet','portal':'Something else','leak':'Active leak','repair':'Active leak','inspection':'Inspection','bid':'Bid or proposal','service-plan':'Service plan','new-construction':'New construction','safety':'Something else','vendor':'Vendor or trade partner'};var v=map[decodeURIComponent(m[1])];if(v){var i=f.querySelector('input[name="topic"][value="'+v+'"]');if(i){i.checked=true;upd();}}}})();
/* client sign in (portal auth is by invitation; no public accounts) */
(function(){var f=document.getElementById('loginForm');if(!f)return;var m=f.querySelector('.lg-msg'),eye=f.querySelector('.lg-eye'),pw=f.querySelector('#lpass');
eye.addEventListener('click',function(){var s=pw.type==='password';pw.type=s?'text':'password';eye.textContent=s?'Hide':'Show';});
f.addEventListener('submit',function(e){e.preventDefault();var em=f.querySelector('#lemail');if(!em.checkValidity()){em.reportValidity();return;}if(!pw.value){pw.reportValidity();return;}
m.hidden=false;m.innerHTML='Portal sign-in is by invitation, and we could not match this email to an active invite. Use the link in your invite email, or <a href="/portal">request access</a> and your project manager will set you up.';});})();

/* option grids: select all / clear */
(function(){[].slice.call(document.querySelectorAll('.opts-all')).forEach(function(b){b.addEventListener('click',function(){var f=b.closest('form')||document,bx=[].slice.call(f.querySelectorAll('input[name="'+b.dataset.all+'"]'));var on=bx.some(function(i){return !i.checked;});bx.forEach(function(i){i.checked=on;});b.textContent=on?'Clear all':'Select all';});});})();

/* Solameer desk: a guided intake chat. Collects a request step by step and posts it to the
   "chat-intake" Netlify form, answers common questions from the FAQ, and finds offices. */
(function(){
  if(window.__solChat)return;window.__solChat=1;
  var OFFICES=[{"c": "Denver, CO", "city": "Denver", "st": "CO", "sn": "Colorado", "a": "100 Fillmore St, 5th Floor<br>Denver, CO 80206", "u": "/locations/denver-co"}, {"c": "Salt Lake City, UT", "city": "Salt Lake City", "st": "UT", "sn": "Utah", "a": "10421 S Jordan Pkwy, Suite 600<br>South Jordan, UT 84095", "u": "/locations/salt-lake-city-ut"}, {"c": "Burbank, CA", "city": "Burbank", "st": "CA", "sn": "California", "a": "303 N Glenoaks Blvd, Suite 200<br>Burbank, CA 91502", "u": "/locations/burbank-ca"}, {"c": "Dallas, TX", "city": "Dallas", "st": "TX", "sn": "Texas", "a": "1341 W Mockingbird Ln, Suite 600<br>Dallas, TX 75247", "u": "/locations/dallas-tx"}, {"c": "Tampa, FL", "city": "Tampa", "st": "FL", "sn": "Florida", "a": "2202 N West Shore Blvd, Suite 200<br>Tampa, FL 33607", "u": "/locations/tampa-fl"}, {"c": "Boise, ID", "city": "Boise", "st": "ID", "sn": "Idaho", "a": "950 W Bannock St, Suite 1100<br>Boise, ID 83702", "u": "/locations/boise-id"}, {"c": "Las Vegas, NV", "city": "Las Vegas", "st": "NV", "sn": "Nevada", "a": "2300 W Sahara Ave, Suite 800<br>Las Vegas, NV 89102", "u": "/locations/las-vegas-nv"}, {"c": "Phoenix, AZ", "city": "Phoenix", "st": "AZ", "sn": "Arizona", "a": "20 E Thomas Rd, Suite 2200<br>Phoenix, AZ 85012", "u": "/locations/phoenix-az"}, {"c": "Albuquerque, NM", "city": "Albuquerque", "st": "NM", "sn": "New Mexico", "a": "100 Sun Ave NE, Suite 650<br>Albuquerque, NM 87109", "u": "/locations/albuquerque-nm"}, {"c": "Seattle, WA", "city": "Seattle", "st": "WA", "sn": "Washington", "a": "1455 Leary Way NW, Suite 400<br>Seattle, WA 98107", "u": "/locations/seattle-wa"}, {"c": "Pleasanton, CA", "city": "Pleasanton", "st": "CA", "sn": "California", "a": "6200 Stoneridge Mall Rd, 3rd Floor<br>Pleasanton, CA 94588", "u": "/locations/pleasanton-ca"}, {"c": "Houston, TX", "city": "Houston", "st": "TX", "sn": "Texas", "a": "3730 Kirby Dr, Suite 1200<br>Houston, TX 77098", "u": "/locations/houston-tx"}, {"c": "Atlanta, GA", "city": "Atlanta", "st": "GA", "sn": "Georgia", "a": "100 Hartsfield Centre Pkwy, Suite 500<br>Atlanta, GA 30354", "u": "/locations/atlanta-ga"}, {"c": "Orlando, FL", "city": "Orlando", "st": "FL", "sn": "Florida", "a": "618 E South St, Suite 500<br>Orlando, FL 32801", "u": "/locations/orlando-fl"}, {"c": "Fort Lauderdale, FL", "city": "Fort Lauderdale", "st": "FL", "sn": "Florida", "a": "2598 E Sunrise Blvd, Suite 2104<br>Fort Lauderdale, FL 33304", "u": "/locations/fort-lauderdale-fl"}, {"c": "Charlotte, NC", "city": "Charlotte", "st": "NC", "sn": "North Carolina", "a": "301 McCullough Dr, Suite 400<br>Charlotte, NC 28262", "u": "/locations/charlotte-nc"}, {"c": "Charleston, SC", "city": "Charleston", "st": "SC", "sn": "South Carolina", "a": "170 Meeting St<br>Charleston, SC 29401", "u": "/locations/charleston-sc"}, {"c": "Nashville, TN", "city": "Nashville", "st": "TN", "sn": "Tennessee", "a": "500 Church St, 3rd Floor<br>Nashville, TN 37219", "u": "/locations/nashville-tn"}], PHONE='(866)\u00a0699-3360', TEL='tel:+18666993360';
  var ROOT=(document.querySelector('link[href*="assets/site.css"]')||{}).getAttribute?document.querySelector('link[href*="assets/site.css"]').getAttribute('href').replace(/assets\/site\.css.*$/,''):'/';
  function url(p){return ROOT.charAt(0)==='/'?p:ROOT+p.replace(/^\//,'')+(p.slice(-1)==='/'?'index.html':'');}
  var FAQ=[
    [/leak|water|drip|ceiling/i,'For an active leak, calling is fastest: '+PHONE+'. The nearest office schedules a technician. I can also take the details and pass them along.'],
    [/warrant/i,'We install to each manufacturer’s specification so the system qualifies for its warranty, and add our own workmanship warranty. Terms depend on the system and are listed in your proposal.'],
    [/cost|price|how much|budget|quote|estimate/i,'Every roof is priced after a walk. You get a line-item proposal with the assumptions listed and unit prices for deck and insulation. Want me to start a bid request?'],
    [/restor|coat|silicone|acrylic/i,'Restoration works when the roof is mostly dry. We confirm with a moisture survey, repair the details, then coat the field. It adds life without a tear-off.'],
    [/tpo|pvc|epdm|mod.?bit|bur|foam|spf|shingle|metal|system/i,'We install ten systems: TPO, PVC, EPDM, modified bitumen, built-up, spray foam, coatings, green roofs, shingle and metal. The roof systems page compares them side by side.'],
    [/where|office|location|state|near/i,'We work in 17 states from 18 offices, headquartered in Denver. Tell me your state and I’ll find the nearest office.'],
    [/occupied|resident|tenant|guest/i,'Yes. Most of our roofs go on occupied buildings. We phase building by building, post schedules and dry-in every section the same day.'],
    [/career|job|hiring|work for/i,'We hire crews, foremen, estimators, project managers and office roles across 17 states. The careers page lists roles by region.'],
    [/inspect|report|assessment|survey/i,'Inspections come with a photo condition report, moisture findings and a repair, restore or replace recommendation. Want to book one?'],
    [/time|long|schedule|how fast/i,'We reply within one business day. Schedules depend on the roof; your proposal includes one, and we report weekly once work starts.']
  ];
  var el=document.createElement('div');el.className='sd';el.innerHTML=
    '<button class="sd-l" type="button" aria-expanded="false" aria-controls="sdPanel" aria-label="Talk to a roofer"><span class="sd-li"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"><path d="M4 5h16v11H9l-5 4z"/><path d="M8 9.5h8M8 12.5h5"/></svg></span><span class="sd-lt"><b>Talk to a roofer</b><em>Automated intake</em></span></button>'+
    '<section class="sd-p" id="sdPanel" role="dialog" aria-label="Solameer desk" hidden>'+
      '<header class="sd-h"><div><b>Solameer desk</b><span>Automated intake · a person replies within one business day</span></div><div class="sd-ha"><button type="button" class="sd-r" aria-label="Start over"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4h4"/></svg></button><button type="button" class="sd-x" aria-label="Close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg></button></div></header>'+
      '<ol class="sd-s"><li data-s="0"><i>1</i>Property</li><li data-s="1"><i>2</i>Scope</li><li data-s="2"><i>3</i>Contact</li></ol>'+
      '<div class="sd-b" aria-live="polite"></div><div class="sd-q"></div>'+
      '<form class="sd-f"><input type="text" id="sdMsg" name="message" autocomplete="off" placeholder="Type a message" aria-label="Message"><button type="submit" aria-label="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 12h15M13 6l6 6-6 6"/></svg></button></form>'+
      '<p class="sd-n">Leak right now? Call <a href="'+TEL+'">'+PHONE+'</a></p>'+
    '</section>';
  document.body.appendChild(el);
  var L=el.querySelector('.sd-l'),Pn=el.querySelector('.sd-p'),B=el.querySelector('.sd-b'),Q=el.querySelector('.sd-q'),F=el.querySelector('.sd-f'),IN=F.querySelector('input'),ST=[].slice.call(el.querySelectorAll('.sd-s li'));
  var data={},step=null,log=[],started=false;
  function say(t,who){var m=document.createElement('div');m.className='sd-m '+(who||'bot');m.innerHTML=t;B.appendChild(m);B.scrollTop=B.scrollHeight;log.push((who==='me'?'Visitor: ':'Desk: ')+m.textContent);}
  function chips(list){Q.innerHTML='';list.forEach(function(c){var b=document.createElement('button');b.type='button';b.textContent=c[0];b.addEventListener('click',function(){say(c[0],'me');Q.innerHTML='';c[1]();});Q.appendChild(b);});}
  function track(n){ST.forEach(function(li,i){li.classList.toggle('on',i===n);li.classList.toggle('done',n!==null&&i<n);});}
  function ask(key,prompt,opts,next,type){step={key:key,next:next,type:type};say(prompt);IN.type=type||'text';IN.focus();if(opts)chips(opts.map(function(o){return [o,function(){data[key]=o;next();}];}));else Q.innerHTML='';}
  function menu(){track(null);step=null;IN.type='text';say('What can we help with?');chips([
    ['Request a bid',function(){intake('Bid request');}],['Active leak',leak],['Book an inspection',function(){intake('Inspection');}],
    ['Service plan',function(){intake('Service plan');}],['Find an office',office],['Ask a question',function(){step={key:'q'};say('Go ahead. Ask me anything about roofing, warranties or how we work.');Q.innerHTML='';IN.focus();}],
    ['Careers',function(){say('We hire field, project, estimating and office roles across 17 states. <a href="'+url('/careers')+'">See roles by region</a>.');setTimeout(menu,500);}]]);}
  function leak(){say('Water coming in right now? Calling is fastest.<br><a class="sd-call" href="'+TEL+'">Call '+PHONE+'</a>');chips([['Take my details instead',function(){intake('Leak / repair');}],['Back to menu',menu]]);}
  function office(){step={key:'state'};say('Which state is the property in?');Q.innerHTML='';IN.focus();}
  function findOffice(t){var s=t.trim().toLowerCase();var hit=OFFICES.filter(function(o){return o.st.toLowerCase()===s||o.sn.toLowerCase()===s||o.city.toLowerCase().indexOf(s)>-1;});
    if(hit.length){say(hit.map(function(o){return '<b>'+o.c+'</b><br>'+o.a+'<br><a href="'+url(o.u)+'">Office page</a>';}).join('<hr>'));}
    else say('We may not have an office there, but we work in 17 states. <a href="'+url('/locations')+'">See the office map</a> or call '+PHONE+'.');
    step=null;setTimeout(menu,600);}
  function intake(kind){data={kind:kind};track(0);say('Good. Three quick steps and a person will follow up within one business day.');
    ask('property','What is the property name and address?',null,function(){track(1);
      ask('type','What kind of property is it?',['Multi-Family','HOA / condo','Commercial / retail','Industrial','Hospitality','High-rise'],function(){
        ask('roof','Do you know the current roof type?',['TPO / PVC','EPDM','Mod-bit / BUR','Shingle','Metal','Not sure'],function(){
          ask('timeline','What is your timeline?',['As soon as possible','Within 3 months','3 to 12 months','Budgeting for next year'],function(){track(2);
            ask('name','Your name?',null,function(){
              ask('email','Best email to reach you?',null,function(){
                ask('phone','And a phone number? (Type "skip" if you prefer email.)',null,summary,'tel');},'email');});});});});});}
  function summary(){step=null;Q.innerHTML='';track(3);IN.type='text';
    say('Here is what I have:<br><b>'+esc(data.kind)+'</b> · '+esc(data.property)+'<br>'+esc(data.type||'')+' · '+esc(data.roof||'')+' · '+esc(data.timeline||'')+'<br>'+esc(data.name)+' · '+esc(data.email)+(data.phone&&!/skip/i.test(data.phone)?' · '+esc(data.phone):''));
    chips([['Send it',send],['Start over',reset]]);}
  function esc(s){return String(s||'').replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
  function send(){var body=new URLSearchParams({'form-name':'chat-intake',kind:data.kind||'',property:data.property||'',type:data.type||'',roof:data.roof||'',timeline:data.timeline||'',name:data.name||'',email:data.email||'',phone:data.phone||'',page:location.pathname,transcript:log.join('\n')});
    var done=function(){ST.forEach(function(li){li.classList.add('done');li.classList.remove('on');});say('Sent. The nearest office will reply within one business day. For anything urgent, call <a href="'+TEL+'">'+PHONE+'</a>.');chips([['Back to menu',menu]]);};
    if(/netlify\.app$|solameer\.com$/.test(location.hostname)){fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()}).then(function(r){if(!r.ok)throw new Error(r.status);done();}).catch(function(){say('That did not go through. Please call '+PHONE+' or use the <a href="'+url('/contact')+'">contact form</a>.');});}else done();}
  function reset(){B.innerHTML='';Q.innerHTML='';log=[];data={};say('Hi, this is the Solameer desk, an automated assistant. I can start a bid, take a leak report, book an inspection or find your nearest office. A person follows up on every request.');menu();}
  function answer(t){for(var i=0;i<FAQ.length;i++){if(FAQ[i][0].test(t)){say(FAQ[i][1]);if(/office|location|where|state|near/i.test(t)){office();return;}chips([['Request a bid',function(){intake('Bid request');}],['Back to menu',menu]]);return;}}
    say('Good question for a person. I can pass it to the nearest office, or you can call '+PHONE+'.');chips([['Pass it along',function(){data={kind:'Question: '+t};track(2);ask('name','Your name?',null,function(){ask('email','Best email to reach you?',null,function(){data.property='(question)';summary();},'email');});}],['Back to menu',menu]]);}
  F.addEventListener('submit',function(e){e.preventDefault();var t=IN.value.trim();if(!t)return;IN.value='';say(esc(t),'me');
    if(step&&step.key==='state')return findOffice(t);
    if(step&&step.key==='q'){step=null;return answer(t);}
    if(step){if(step.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)){say('That email doesn’t look right. Try again?');return;}
      data[step.key]=t;var n=step.next;step=null;Q.innerHTML='';return n();}
    answer(t);});
  function open(o){Pn.hidden=!o;L.setAttribute('aria-expanded',o);el.classList.toggle('open',o);if(o){if(!started){started=true;reset();}setTimeout(function(){IN.focus();},50);}}
  L.addEventListener('click',function(){open(Pn.hidden);});
  el.querySelector('.sd-x').addEventListener('click',function(){open(false);L.focus();});
  el.querySelector('.sd-r').addEventListener('click',reset);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!Pn.hidden){open(false);L.focus();}});
  document.querySelectorAll('[data-chat]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();open(true);});});
})();

/* A11Y-15: moving logo and office strips get a pause button (hover alone is not enough) */
(function(){if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
[].slice.call(document.querySelectorAll('.v3-marquee,.hst')).forEach(function(m){var b=document.createElement('button');b.type='button';b.className='mq-pause';b.textContent='Pause';b.setAttribute('aria-pressed','false');
b.addEventListener('click',function(){var p=m.classList.toggle('is-paused');b.setAttribute('aria-pressed',p);b.textContent=p?'Play':'Pause';});m.appendChild(b);});})();
