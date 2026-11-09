/* Solameer desk: a guided intake chat. Collects a request step by step and posts it to the
   "chat-intake" Netlify form, answers common questions from the FAQ, and finds offices. */
(function(){
  if(window.__solChat)return;window.__solChat=1;
  var OFFICES=[{"c": "Denver, CO", "city": "Denver", "st": "CO", "sn": "Colorado", "a": "100 Fillmore St, 5th Floor<br>Denver, CO 80206", "u": "/locations/colorado/denver/"}, {"c": "Salt Lake City, UT", "city": "Salt Lake City", "st": "UT", "sn": "Utah", "a": "10421 S Jordan Pkwy, Suite 600<br>South Jordan, UT 84095", "u": "/locations/utah/salt-lake-city/"}, {"c": "Burbank, CA", "city": "Burbank", "st": "CA", "sn": "California", "a": "303 N Glenoaks Blvd, Suite 200<br>Burbank, CA 91502", "u": "/locations/california/burbank/"}, {"c": "Dallas, TX", "city": "Dallas", "st": "TX", "sn": "Texas", "a": "1341 W Mockingbird Ln, Suite 600<br>Dallas, TX 75247", "u": "/locations/texas/dallas/"}, {"c": "Tampa, FL", "city": "Tampa", "st": "FL", "sn": "Florida", "a": "2202 N West Shore Blvd, Suite 200<br>Tampa, FL 33607", "u": "/locations/florida/tampa/"}, {"c": "Boise, ID", "city": "Boise", "st": "ID", "sn": "Idaho", "a": "950 W Bannock St, Suite 1100<br>Boise, ID 83702", "u": "/locations/idaho/boise/"}, {"c": "Las Vegas, NV", "city": "Las Vegas", "st": "NV", "sn": "Nevada", "a": "2300 W Sahara Ave, Suite 800<br>Las Vegas, NV 89102", "u": "/locations/nevada/las-vegas/"}, {"c": "Phoenix, AZ", "city": "Phoenix", "st": "AZ", "sn": "Arizona", "a": "20 E Thomas Rd, Suite 2200<br>Phoenix, AZ 85012", "u": "/locations/arizona/phoenix/"}, {"c": "Albuquerque, NM", "city": "Albuquerque", "st": "NM", "sn": "New Mexico", "a": "100 Sun Ave NE, Suite 650<br>Albuquerque, NM 87109", "u": "/locations/new-mexico/albuquerque/"}, {"c": "Seattle, WA", "city": "Seattle", "st": "WA", "sn": "Washington", "a": "1455 Leary Way NW, Suite 400<br>Seattle, WA 98107", "u": "/locations/washington/seattle/"}, {"c": "Pleasanton, CA", "city": "Pleasanton", "st": "CA", "sn": "California", "a": "6200 Stoneridge Mall Rd, 3rd Floor<br>Pleasanton, CA 94588", "u": "/locations/california/pleasanton/"}, {"c": "Houston, TX", "city": "Houston", "st": "TX", "sn": "Texas", "a": "3730 Kirby Dr, Suite 1200<br>Houston, TX 77098", "u": "/locations/texas/houston/"}, {"c": "Atlanta, GA", "city": "Atlanta", "st": "GA", "sn": "Georgia", "a": "100 Hartsfield Centre Pkwy, Suite 500<br>Atlanta, GA 30354", "u": "/locations/georgia/atlanta/"}, {"c": "Orlando, FL", "city": "Orlando", "st": "FL", "sn": "Florida", "a": "618 E South St, Suite 500<br>Orlando, FL 32801", "u": "/locations/florida/orlando/"}, {"c": "Fort Lauderdale, FL", "city": "Fort Lauderdale", "st": "FL", "sn": "Florida", "a": "2598 E Sunrise Blvd, Suite 2104<br>Fort Lauderdale, FL 33304", "u": "/locations/florida/fort-lauderdale/"}, {"c": "Charlotte, NC", "city": "Charlotte", "st": "NC", "sn": "North Carolina", "a": "301 McCullough Dr, Suite 400<br>Charlotte, NC 28262", "u": "/locations/north-carolina/charlotte/"}, {"c": "Charleston, SC", "city": "Charleston", "st": "SC", "sn": "South Carolina", "a": "170 Meeting St<br>Charleston, SC 29401", "u": "/locations/south-carolina/charleston/"}, {"c": "Nashville, TN", "city": "Nashville", "st": "TN", "sn": "Tennessee", "a": "500 Church St, 3rd Floor<br>Nashville, TN 37219", "u": "/locations/tennessee/nashville/"}], PHONE='(866)\u00a0699-3360', TEL='tel:+18666993360';
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
  var data={},step=null,log=[],started=false,HOME=document.querySelector('[data-chat-inline]');
  function say(t,who){var m=document.createElement('div');m.className='sd-m '+(who||'bot');m.innerHTML=t;B.appendChild(m);B.scrollTop=B.scrollHeight;log.push((who==='me'?'Visitor: ':'Desk: ')+m.textContent);}
  function chips(list){Q.innerHTML='';list.forEach(function(c){var b=document.createElement('button');b.type='button';b.textContent=c[0];b.addEventListener('click',function(){say(c[0],'me');Q.innerHTML='';c[1]();});Q.appendChild(b);});}
  function track(n){ST.forEach(function(li,i){li.classList.toggle('on',i===n);li.classList.toggle('done',n!==null&&i<n);});}
  function ask(key,prompt,opts,next,type){step={key:key,next:next,type:type};say(prompt);IN.type=type||'text';IN.focus();if(opts)chips(opts.map(function(o){return [o,function(){data[key]=o;next();}];}));else Q.innerHTML='';}
  function menu(){track(null);step=null;IN.type='text';say('What can we help with?');chips([
    ['Request a bid',function(){intake('Bid request');}],['Active leak',leak],['Book an inspection',function(){intake('Inspection');}],
    ['Service plan',function(){intake('Service plan');}],['Find an office',office],['Ask a question',function(){step={key:'q'};say('Go ahead. Ask me anything about roofing, warranties or how we work.');Q.innerHTML='';IN.focus();}],
    ['Careers',function(){say('We hire field, project, estimating and office roles across 17 states. <a href="'+url('/careers/')+'">See roles by region</a>.');setTimeout(menu,500);}]]);}
  function leak(){say('Water coming in right now? Calling is fastest.<br><a class="sd-call" href="'+TEL+'">Call '+PHONE+'</a>');chips([['Take my details instead',function(){intake('Leak / repair');}],['Back to menu',menu]]);}
  function office(){step={key:'state'};say('Which state is the property in?');Q.innerHTML='';IN.focus();}
  function findOffice(t){var s=t.trim().toLowerCase();var hit=OFFICES.filter(function(o){return o.st.toLowerCase()===s||o.sn.toLowerCase()===s||o.city.toLowerCase().indexOf(s)>-1;});
    if(hit.length){say(hit.map(function(o){return '<b>'+o.c+'</b><br>'+o.a+'<br><a href="'+url(o.u)+'">Office page</a>';}).join('<hr>'));}
    else say('We may not have an office there, but we work in 17 states. <a href="'+url('/locations/')+'">See the office map</a> or call '+PHONE+'.');
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
    if(/netlify\.app$|solameer\.com$/.test(location.hostname)){fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:body.toString()}).then(function(r){if(!r.ok)throw new Error(r.status);done();}).catch(function(){say('That did not go through. Please call '+PHONE+' or use the <a href="'+url('/contact/')+'">contact form</a>.');});}else done();}
  function reset(){B.innerHTML='';Q.innerHTML='';log=[];data={};say('Hi, this is the Solameer desk, an automated assistant. I can start a bid, take a leak report, book an inspection or find your nearest office. A person follows up on every request.');menu();}
  function answer(t){for(var i=0;i<FAQ.length;i++){if(FAQ[i][0].test(t)){say(FAQ[i][1]);if(/office|location|where|state|near/i.test(t)){office();return;}chips([['Request a bid',function(){intake('Bid request');}],['Back to menu',menu]]);return;}}
    say('Good question for a person. I can pass it to the nearest office, or you can call '+PHONE+'.');chips([['Pass it along',function(){data={kind:'Question: '+t};track(2);ask('name','Your name?',null,function(){ask('email','Best email to reach you?',null,function(){data.property='(question)';summary();},'email');});}],['Back to menu',menu]]);}
  F.addEventListener('submit',function(e){e.preventDefault();var t=IN.value.trim();if(!t)return;IN.value='';say(esc(t),'me');
    if(step&&step.key==='state')return findOffice(t);
    if(step&&step.key==='q'){step=null;return answer(t);}
    if(step){if(step.type==='email'&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(t)){say('That email doesn’t look right. Try again?');return;}
      data[step.key]=t;var n=step.next;step=null;Q.innerHTML='';return n();}
    answer(t);});
  function open(o){if(HOME)return home(o);Pn.hidden=!o;L.setAttribute('aria-expanded',o);el.classList.toggle('open',o);if(o){if(!started){started=true;reset();}setTimeout(function(){IN.focus();},50);}}
  L.addEventListener('click',function(){open(HOME||Pn.hidden);});
  el.querySelector('.sd-x').addEventListener('click',function(){open(false);L.focus();});
  el.querySelector('.sd-r').addEventListener('click',reset);
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!HOME&&!Pn.hidden){open(false);L.focus();}});
  document.querySelectorAll('[data-chat]').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();open(true);});});
  /* v3 (make-v3.js): on a page with [data-chat-inline] the panel sits there, open, a region of the page rather than a
     dialog, with no close button (chrome.css). The launcher shows only once the panel's section has gone up under the
     sticky nav (on a phone it covered the requests), and then brings you back to the panel (no smooth scroll). */
  var NAV=document.querySelector('.nav');
  function home(o){if(!o)return;var r=Pn.getBoundingClientRect(),top=(NAV?NAV.offsetHeight:0)+16;
    if(r.top<top||r.bottom>innerHeight)window.scrollTo({top:scrollY+r.top-top,behavior:'instant'});
    IN.focus({preventScroll:true});}
  if(HOME){HOME.textContent='';HOME.appendChild(Pn);Pn.hidden=false;Pn.setAttribute('role','region');L.removeAttribute('aria-expanded');L.removeAttribute('aria-controls');
    el.classList.add('sd-home','sd-near');started=true;reset();
    if(window.IntersectionObserver)new IntersectionObserver(function(en){el.classList.toggle('sd-near',en[0].isIntersecting);},{rootMargin:-(NAV?NAV.offsetHeight:0)+'px 0px 0px 0px'}).observe(HOME.closest('section')||HOME);}
})();
