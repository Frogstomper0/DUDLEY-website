const CONFIG = {
  fixturesDeepLink: "",
  gamesJsonUrl: "games.json",
  promoVideo: "img/smashcut.mp4",
  groundStatusUrl: "https://script.google.com/macros/s/AKfycby_kAXDcQKQ1tJQmRCii91iXPn-mxB0hRq6NTf09U1nUMt9nt0xjjy1oTo0hiLx8af-/exec",
  groundStatusDetailsUrl: "#about",
  featsJsonUrl: "feats.json",
  apifyResultsUrl: "https://api.apify.com/v2/datasets/yoBLwX2yoAmMG6N8e/items?clean=true&format=json&limit=1000"
};
const $ = s => document.querySelector(s);
$('#year').textContent = new Date().getFullYear();

window.__GROUND_CLOSED = false;
(async function groundStatus(){
  try{
    if(!CONFIG.groundStatusUrl) return;
    const res = await fetch(`${CONFIG.groundStatusUrl}?t=${Date.now()}`, {cache:'no-store'});
    if(!res.ok) throw new Error('status fetch failed');
    const data = await res.json();
    if(data && data.is_closed){
      window.__GROUND_CLOSED = true;
      const bar=document.getElementById('scoreTicker'), lane=document.getElementById('tickerLane');
      if(bar&&lane){
        bar.classList.add('closed');
        lane.innerHTML = `<span class="chunk"><strong>GROUND CLOSED</strong> — ${data.note || 'Field unavailable'}</span>
          <span class="chunk">Updated ${data.updatedAt || ''} · <a href="${CONFIG.groundStatusDetailsUrl}" style="text-decoration:underline">Details</a></span>`;
      }
    }
  }catch(e){ console.warn('Ground status fetch failed', e); }
})();

(function promoVideo(){
  const video = $('#promoVideo');
  if (CONFIG.promoVideo) video.src = CONFIG.promoVideo;
  if (!video) return;
  let half = null;
  video.addEventListener('loadedmetadata', () => {
    const d = video.duration || 0; half = d>0? d/2 : null; if (!video.seeking) video.currentTime = 0;
  });
  video.addEventListener('timeupdate', () => {
    if (half && video.currentTime >= (half - 0.05)) { video.currentTime = 0; if (video.paused) video.play().catch(()=>{}); }
  });
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if (e.isIntersecting && e.intersectionRatio>=0.4) video.play().catch(()=>{}); else video.pause(); });
  }, { threshold:[0,.4,1] });
  io.observe(video);
})();

(async function upcoming(){
  const list = $('#gameList'), badge = $('#gameday-badge'), fixturesLink = $('#fullFixturesLink');
  if (CONFIG.fixturesDeepLink){
    fixturesLink.innerHTML = ` · <a href="${CONFIG.fixturesDeepLink}" target="_blank" rel="noopener">Full fixtures</a>`;
  }
  const CACHE_KEY = 'dudley_games_cache_v1', MAX_AGE_MS = 21600000;
  function getInlineSample(){ try{ return JSON.parse(document.getElementById('sample-games').textContent.trim()); }catch{ return []; } }
  function loadCache(){ try{ const raw=localStorage.getItem(CACHE_KEY); if(!raw) return null; const {at,data}=JSON.parse(raw); if(Date.now()-at>MAX_AGE_MS) return null; return data; }catch{ return null; } }
  function saveCache(data){ try{ localStorage.setItem(CACHE_KEY, JSON.stringify({at:Date.now(), data})); }catch{} }
  async function fetchGames(){ if(!CONFIG.gamesJsonUrl) throw new Error('no games url'); const res=await fetch(CONFIG.gamesJsonUrl,{cache:'no-store'}); if(!res.ok) throw new Error('fetch failed'); return res.json(); }
  let games = loadCache();
  if(!games){ try{ games = await fetchGames(); saveCache(games); } catch{ games = getInlineSample(); } }
  const now = new Date();
  const upcomingGames = games.filter(g => new Date(g.date) >= now).sort((a,b)=> new Date(a.date) - new Date(b.date));
  function toAU(dstr){ const d=new Date(dstr); return `${d.toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'})}, ${d.toLocaleTimeString('en-AU',{hour:'2-digit',minute:'2-digit'})}`; }
  function isToday(dstr){ const d=new Date(dstr), n=new Date(); return d.getFullYear()===n.getFullYear() && d.getMonth()===n.getMonth() && d.getDate()===n.getDate(); }
  list.innerHTML = upcomingGames.length ? '' : '<li class="game"><div class="row"><span class="meta">No upcoming games loaded.</span></div></li>';
  let hasToday = false;
  upcomingGames.forEach(g=>{
    if (isToday(g.date)) hasToday = true;
    const li=document.createElement('li'); li.className='game';
    li.innerHTML = `<div class="row"><span class="when">${toAU(g.date)}</span><span class="meta">${g.homeAway} vs ${g.opponent} @ ${g.venue}</span></div>`;
    list.appendChild(li);
  });
  badge.hidden = !hasToday;
})();

/* ===== Ball arc interaction ===== */
(function heroBall(){
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const anchor= document.getElementById('ballAnchor'), ball= document.getElementById('ball');

  const start = { x: 410, y: 500 },
        uprightsCenterX = 780 + (132/2),
        crossbarY = 260 + 80,
        target = { x: uprightsCenterX, y: crossbarY - 30 };

  anchor.style.transform = `translate(${start.x}px,${start.y}px)`;
  if (prefersReduced) ball.classList.remove('bounce-once');

  let fired=false, animId=null;
  const cancelAnim=()=>{ if(animId){ cancelAnimationFrame(animId); animId=null; } };

  function animateArc(){
    if (prefersReduced) return;
    cancelAnim();
    const dur=920, t0=performance.now(),
          ctrl={ x:(start.x+target.x)/2+40, y: Math.min(start.y,target.y)-180 };
    function step(now){
      let t=(now-t0)/dur; if(t>1) t=1; const omt=1-t;
      const x=omt*omt*start.x + 2*omt*t*ctrl.x + t*t*target.x;
      const y=omt*omt*start.y + 2*omt*t*ctrl.y + t*t*target.y;
      anchor.style.transform = `translate(${x}px,${y}px)`;
      ball.style.transform = `rotate(${-140*t}deg)`;
      ball.style.opacity = String(1 - Math.max(0,(t-0.75)/0.25));
      if(t<1) animId=requestAnimationFrame(step); else animId=null;
    }
    animId=requestAnimationFrame(step);
  }

  function resetBall(){
    cancelAnim();
    anchor.style.transform = `translate(${start.x}px,${start.y}px)`;
    ball.style.transform='rotate(0deg)';
    ball.style.opacity='';
    if(!prefersReduced){
      ball.classList.remove('bounce-once','small-hop');
      void ball.offsetWidth;
      ball.classList.add('small-hop');
      setTimeout(()=>ball.classList.remove('small-hop'), 720);
    }
  }

  function onScroll(){
    const trigger = window.pageYOffset>0;
    if(trigger && !fired){ animateArc(); fired=true; }
    if(window.pageYOffset===0){
      if(fired) resetBall();
      fired=false;
    }
  }

  window.addEventListener('scroll', onScroll, { passive:true });
  window.addEventListener('resize', onScroll);
  onScroll();
})();

// ===== Feats hover-roller =====
(async function featsHoverRoller(){
  const row = document.getElementById('featsRow');
  if (!row) return;
  const fallbackImg = "img/dudley-logo.png";
  const url = CONFIG.featsJsonUrl || "feats.json";
  try{
    const res = await fetch(url, { cache:'no-store' });
    if(!res.ok) throw new Error('feats fetch failed');
    const items = await res.json();
    const take = items.slice(0,5);

    take.forEach((it, idx, arr)=>{
      const card=document.createElement('article');
      card.className='feat-card'; card.setAttribute('role','listitem'); card.setAttribute('tabindex','0');

      const sideClass = (idx >= arr.length - 3) ? 'fly-left' : 'fly-right';

      const primary = (it.image_url && it.image_url.trim()) ? it.image_url : fallbackImg;

      // >>> ADDED: trim and sanitize the alt URL before use
      const altRaw =
        it.alt_image_url || it.image_alt_url ||
        (Array.isArray(it.image_urls) && it.image_urls[1]) ||
        (Array.isArray(it.images) && it.images[1]) || "";
      const alt = (altRaw && String(altRaw).trim()) || "";
      // <<< END ADD

      card.innerHTML = `
        <div class="frame ${sideClass}">
          <div class="art">
            <div class="img primary" style="background-image:url('${primary}')"></div>
            ${alt ? `<div class="img alt" style="background-image:url('${alt}')"></div>` : ``}
            <a class="cover" href="${it.primary_link_url || '#'}" target="_blank" rel="noopener"
               aria-label="${(it.primary_link_text || 'Open').replace(/"/g,'&quot;')}"></a>
            <div class="meta">
              ${it.tag ? `<span class="tag">${it.tag}</span>` : ``}
              <h3>${it.title || ''}</h3>
              ${it.subtitle ? `<p>${it.subtitle}</p>` : ``}
            </div>
          </div>
          <aside class="flyout" aria-hidden="true">
            <div class="fly-body">${(it.extended || '').toString().replace(/</g,'&lt;')}</div>
          </aside>
        </div>
      `;
      row.appendChild(card);
    });

    const isTouch = window.matchMedia('(hover:none)').matches;
    if (isTouch) {
      // >>> CHANGED: make first tap show alt (prevent nav), second tap follow link
      row.addEventListener('click', (e)=>{
        const card = e.target.closest('.feat-card'); if(!card) return;

        const link = card.querySelector('.cover');
        const firstTap = !card.classList.contains('active');

        if (firstTap) {
          e.preventDefault();
          row.querySelectorAll('.feat-card').forEach(c=>{ if(c!==card) c.classList.remove('active'); });
          card.classList.add('active');
          return;
        }

        // Second tap → allow nav if there is a real href; otherwise keep user here.
        if (!link || !link.getAttribute('href') || link.getAttribute('href') === '#') {
          e.preventDefault();
        }
      });
      // <<< END CHANGE
    }
  }catch(err){
    console.warn('Feats load failed', err);
  }
})();

/* ===== Apify dataset → banner + results table ===== */
(async function apifyResults(){
  try{
    if (!CONFIG.apifyResultsUrl) return;

    const CACHE_KEY = 'dudley_apify_results_v1';
    const MAX_AGE_MS = 30 * 60 * 1000;

    const loadCache = () => {
      try{
        const raw = localStorage.getItem(CACHE_KEY);
        if(!raw) return null;
        const { at, data } = JSON.parse(raw);
        if (Date.now() - at > MAX_AGE_MS) return null;
        return data;
      }catch{ return null; }
    };
    const saveCache = (data) => {
      try{ localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data })); }catch{}
    };

    let items = loadCache();
    if (!items){
      const res = await fetch(CONFIG.apifyResultsUrl, { cache: 'no-store' });
      if (!res.ok) throw new Error('apify fetch failed');
      items = await res.json();
      saveCache(items);
    }

    const parseSafe = (s) => {
      if (!s) return null;
      const t = Date.parse(s);
      return Number.isFinite(t) ? new Date(s) : null;
    };
    const data = items
      .map(it => ({ ...it, _d: parseSafe(it.date_iso) || parseSafe(it.date) }))
      .filter(it => it._d)
      .sort((a,b)=> b._d - a._d);

    /* Ticker build (unchanged) */
    if (!window.__GROUND_CLOSED){
      const lane = document.getElementById('tickerLane');
      const bar  = document.getElementById('scoreTicker');
      if (lane && bar){
        const latestByTeam = new Map();
        const isDudley = (name='') => /dudley\s*redhead/i.test(name);
        const dudleySide = (it) => isDudley(it.home) ? 'home' : (isDudley(it.away) ? 'away' : null);

        function teamKeyAndLabel(raw=''){
          const s = String(raw || '').replace(/\s+/g,' ').trim();
          const ageMatch = s.match(/\bU(?:nder)?\s*(\d{1,2})\b/i);
          const divMatch = s.match(/\bDiv(?:ion|ision)?\s*-?\s*(\d)\b/i);
          const age = ageMatch ? ageMatch[1] : null;
          const div = divMatch ? divMatch[1] : null;
          if (!age) return { key: s.toLowerCase(), label: s };
          const label = `U${age}${div ? ` Div ${div}` : ''}`;
          const key = `u${age}${div?`-div${div}`:''}`;
          return { key, label };
        }

        for (const it of data){
          const side = dudleySide(it);
          if (!side) continue;
          const dudleyName = side === 'home' ? (it.home || '') : (it.away || '');
          const { key, label } = teamKeyAndLabel(dudleyName);
          if (latestByTeam.has(key)) continue;
          if (!((it.score && String(it.score).trim()) || (it.status && String(it.status).trim()))) continue;
          latestByTeam.set(key, { it, label });
        }

        const ordered = [...latestByTeam.values()].sort((a,b)=>{
          const getAge = x => { const m = x.label.match(/U(\d{1,2})/i); return m ? parseInt(m[1],10) : 999; };
          const getDiv = x => { const m = x.label.match(/Div\s*(\d)/i); return m ? parseInt(m[1],10) : 99; };
          const ageDiff = getAge(a) - getAge(b);
          if (ageDiff !== 0) return ageDiff;
          return getDiv(a) - getDiv(b);
        });

        const trackId = 'tickerTrack';
        let track = document.getElementById(trackId);
        if (!track){
          lane.innerHTML = `<div class="track" id="${trackId}"></div>`;
          track = document.getElementById(trackId);
        }

        if (!ordered.length){
          track.innerHTML = `<span class="copy"><span class="chunk">No results found for Dudley teams yet</span></span><span class="copy" aria-hidden="true"><span class="chunk">No results found for Dudley teams yet</span></span>`;
          track.style.setProperty('--marquee-duration','30s');
        } else {
          const chunks = ordered.map(({ it, label })=>{
            const ds = it._d.toLocaleDateString('en-AU',{ weekday:'short', day:'numeric', month:'short' });
            const tag = (it.status && String(it.status).trim()) ? String(it.status).trim() :
                        (it.score ? `<strong>${String(it.score).trim()}</strong>` : '-');
            const home = it.home || '', away = it.away || '';
            return `<span class="chunk"><strong>${label}</strong> · ${ds}: ${home} vs ${away} — ${tag}</span><span class="dot">•</span>`;
          }).join('');
          track.innerHTML = `<span class="copy">${chunks}</span><span class="copy" aria-hidden="true">${chunks}</span>`;
          const start = async () => {
            try{ if (document.fonts && document.fonts.ready) await document.fonts.ready; }catch{}
            requestAnimationFrame(()=>{
              const copy = track.querySelector('.copy');
              if (!copy) return;
              const w = copy.getBoundingClientRect().width;
              const pxPerSec = 120;
              const dur = Math.max(20, Math.round(w / pxPerSec));
              track.style.setProperty('--marquee-duration', `${dur}s`);
            });
          };
          start();
        }

        function onScroll(){
          if (window.pageYOffset > 10){
            bar.classList.add('hidden'); document.documentElement.style.setProperty('--ticker-offset','0px');
          } else {
            bar.classList.remove('hidden'); document.documentElement.style.setProperty('--ticker-offset','var(--ticker-h)');
          }
        }
        window.addEventListener('scroll', onScroll, { passive:true }); onScroll();
      }
    }

    /* Results table */
    const tbody = document.getElementById('resultsTbody');
    if (tbody){
      const rows = data.slice(0, 50).map(it => {
        const ds = it._d.toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'short', year:'numeric' });
        const label = (it.status && it.status.trim()) ? it.status.trim() : (it.score || '').trim();
        return `<tr>
          <td>${ds}</td>
          <td>${it.round || ''}</td>
          <td>${it.home || ''}</td>
          <td>${label || '-'}</td>
          <td>${it.away || ''}</td>
        </tr>`;
      }).join('');
      tbody.innerHTML = rows || '<tr><td colspan="5">No results available.</td></tr>';
    }
  }catch(err){
    console.warn('Apify results failed', err);
    const tbody = document.getElementById('resultsTbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5">Failed to load results.</td></tr>';
  }
  
})();

/* ===== Sponsors marquee (2 rows) ===== */
(async function sponsorsMarquee(){
  const wrap = document.getElementById('sponsorsMarquee');
  if (!wrap) return;
  const track1 = document.getElementById('sponsorsTrack1');
  const track2 = document.getElementById('sponsorsTrack2');
  if (!track1 || !track2) return;

  // make row 2 scroll the other way
  const lanes = wrap.querySelectorAll('.lane');
  if (lanes[1]) lanes[1].classList.add('reverse');

  // pick JSON URL (allow data-json-src, fall back to sponsors.json)
  const rawUrl = (wrap.dataset && wrap.dataset.jsonSrc && wrap.dataset.jsonSrc.trim()) || 'sponsors.json';
  // if someone pasted a Windows path, use just the filename so it still works on localhost
  const jsonUrl = /^[a-zA-Z]:\\/.test(rawUrl) ? rawUrl.split('\\').pop() : rawUrl;

  function normalizeSrc(s){
    return String(s || '').trim().replace(/^["']|["']$/g,'').replace(/\\/g,'/');
  }

  let items = [];
  try{
    const res = await fetch(jsonUrl, { cache:'no-store' });
    if (!res.ok) throw new Error(`sponsors fetch failed: ${res.status}`);
    items = await res.json();
  }catch(err){
    console.warn('Sponsors JSON load failed; showing placeholders.', err);
    items = [];
  }

  const fallback = 'img/dudley-logo.png';
  function getLogo(obj){
    return normalizeSrc(obj.logo || obj.image || obj.img || obj.logo_url || obj.image_url || obj.src || '');
  }

  function makeNode(entry){
    const a = document.createElement('a'); a.href = entry.url || '#'; a.setAttribute('role','listitem');
    const img = document.createElement('img');
    const src = getLogo(entry);
    img.src = src || fallback;
    img.alt = (entry.name || 'Sponsor') + (src ? '' : ' (placeholder)');
    img.addEventListener('error', () => {
      if (src && img.src.indexOf(fallback) === -1) console.warn('Broken sponsor image:', src, 'for', entry.name || '');
      img.src = fallback; img.style.opacity = '0.7';
    });
    a.appendChild(img);
    return a;
  }

  const nodes = items.length ? items.map(makeNode) : Array.from({length: 10}, (_,i)=>makeNode({name:`Sponsor ${i+1}`}));

  // distribute alternating into two rows
  nodes.forEach((n,i)=> (i % 2 === 0 ? track1 : track2).appendChild(n));

  // duplicate content so the lane is >200% width for seamless loop
  function fill(track){
    const lane = track.parentElement;
    if (!lane) return;
    const targetWidth = lane.clientWidth * 2.2;
    let guard = 0;
    while (track.scrollWidth < targetWidth && guard < 20){
      [...track.children].forEach(ch => track.appendChild(ch.cloneNode(true)));
      guard++;
    }
  }
  fill(track1); fill(track2);
})();
