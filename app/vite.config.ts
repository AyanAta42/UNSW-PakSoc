import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const COLS = 'id,name,time,end_time,location,price,public,image_url,buttons,timeline'

function eventsBootScript(url: string, anonKey: string): string {
  const safeUrl = JSON.stringify(url.replace(/\/$/, ''))
  const safeKey = JSON.stringify(anonKey)
  return `<script>
(function(){
  var base=${safeUrl}, key=${safeKey};
  if(!base||!key) return;
  var a=document.createElement('link');
  a.rel='preconnect'; a.href=base; a.crossOrigin='anonymous';
  document.head.appendChild(a);
  var q=base+'/rest/v1/events?select=${encodeURIComponent(COLS)}&public=eq.true&order=time.asc';
  window.__PAKSOC_EVENTS_P__=fetch(q,{
    headers:{apikey:key,Authorization:'Bearer '+key,Accept:'application/json'},
    priority:'high'
  }).then(function(r){ if(!r.ok) throw new Error('events '+r.status); return r.json(); })
    .then(function(rows){
      try{ localStorage.setItem('paksoc:public-events:v1', JSON.stringify({at:Date.now(),events:rows})); }catch(e){}
      return rows;
    });
  try{
    var raw=localStorage.getItem('paksoc:public-events:v1');
    if(raw){
      var parsed=JSON.parse(raw);
      var evs=parsed&&parsed.events?parsed.events:[];
      var now=Date.now();
      var up=evs.filter(function(e){return new Date(e.time).getTime()>now;})
        .sort(function(a,b){return new Date(a.time)-new Date(b.time);});
      var list=(up.length?up:evs).slice(0,3);
      for(var i=0;i<list.length;i++){
        var src=list[i]&&list[i].image_url;
        if(!src) continue;
        var l=document.createElement('link');
        l.rel='preload'; l.as='image'; l.href=src;
        try{ l.fetchPriority=i===0?'high':'auto'; }catch(e){}
        document.head.appendChild(l);
      }
    }
  }catch(e){}
})();
</script>`
}

/**
 * The HTML shell IS the working homepage until React is ready.
 * Timer + CTA buttons + event popups work with zero React.
 * React downloads only after the shell is interactive, and mounts into a hidden #root.
 */
function bootUiScript(): string {
  return `<script>
(function(){
  var timer=null, target=null, stopped=false, byId={}, interactive=false, warmed={};
  var FALLBACK={raunaq:'/raunaq.webp',khel:'/khel.webp',iftar:'/iftar.webp',cricket:'/cricket.webp'};
  function pad(n){ n=n|0; return (n<10?'0':'')+n; }
  function esc(t){
    return String(t==null?'':t).replace(/[&<>"']/g,function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
    });
  }
  function calc(iso){
    var diff=new Date(iso).getTime()-Date.now();
    if(!(diff>0)) return {d:0,h:0,m:0,s:0};
    return {
      d:Math.floor(diff/86400000),
      h:Math.floor((diff%86400000)/3600000),
      m:Math.floor((diff%3600000)/60000),
      s:Math.floor((diff%60000)/1000)
    };
  }
  function setCell(id, val){
    var el=document.getElementById(id);
    if(!el) return;
    el.classList.remove('sk');
    el.textContent=pad(val);
  }
  function paintCd(){
    if(!target||stopped) return;
    var c=calc(target);
    setCell('boot-d', c.d);
    setCell('boot-h', c.h);
    setCell('boot-m', c.m);
    setCell('boot-s', c.s);
  }
  function startTimer(iso){
    target=iso;
    var wrap=document.getElementById('boot-cd');
    if(wrap) wrap.setAttribute('data-ready','1');
    paintCd();
    if(timer) clearInterval(timer);
    timer=setInterval(paintCd,1000);
  }
  function imgSrc(ev){
    if(ev&&ev.image_url) return String(ev.image_url);
    var name=(ev&&ev.name?String(ev.name):'').toLowerCase();
    for(var k in FALLBACK){ if(name.indexOf(k)!==-1) return FALLBACK[k]; }
    return '';
  }
  function warmImage(src, high){
    if(!src||warmed[src]) return;
    warmed[src]=1;
    var l=document.createElement('link');
    l.rel='preload'; l.as='image'; l.href=src;
    if(high) try{ l.fetchPriority='high'; }catch(e){}
    document.head.appendChild(l);
    var im=new Image();
    try{ im.fetchPriority=high?'high':'auto'; }catch(e){}
    im.decoding='async';
    im.src=src;
  }
  function buttonsOf(ev){
    var raw=ev&&ev.buttons;
    if(!raw) return [];
    if(typeof raw==='string'){
      try{ raw=JSON.parse(raw); }catch(e){ return []; }
    }
    if(!Array.isArray(raw)) return [];
    return raw.filter(function(b){ return b&&b.label&&String(b.label).trim(); });
  }
  function ctaHtml(ev, btns){
    if(!btns.length){
      return '<button type="button" class="bs-btn pri" data-open-event="'+esc(ev.id)+'">View details</button>';
    }
    return btns.map(function(b,i){
      var href=b.url&&String(b.url).trim();
      var cls=(i===1||btns.length===1)?'pri':'sec';
      if(href){
        return '<a class="bs-btn '+cls+'" href="'+esc(href)+'" target="_blank" rel="noopener noreferrer">'+esc(b.label)+'</a>';
      }
      // Empty URL → still a WORKING button (opens event sheet)
      return '<button type="button" class="bs-btn '+cls+'" data-open-event="'+esc(ev.id)+'">'+esc(b.label)+'</button>';
    }).join('');
  }
  function fmtWhen(iso){
    try{
      return new Date(iso).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    }catch(e){ return ''; }
  }
  function closeSheet(){
    var sheet=document.getElementById('boot-sheet');
    if(sheet) sheet.hidden=true;
    document.documentElement.classList.remove('boot-sheet-open');
  }
  function openSheet(id){
    var ev=byId[id];
    if(!ev) return;
    var body=document.getElementById('boot-sheet-body');
    var sheet=document.getElementById('boot-sheet');
    if(!body||!sheet) return;
    var ended=new Date(ev.time).getTime()<=Date.now();
    var btns=buttonsOf(ev);
    var src=imgSrc(ev);
    var html=(src?'<img class="bs-img" src="'+esc(src)+'" alt="" decoding="async">':'')
      +'<div class="bs-title">'+esc(ev.name)+'</div>'
      +'<div class="bs-meta">◷ '+esc(fmtWhen(ev.time))+'</div>'
      +'<div class="bs-meta">◎ '+esc(ev.location||'')+'</div>'
      +'<div class="bs-badge '+(ended?'ended':'up')+'">'+(ended?'Ended':'Upcoming')+'</div>'
      +'<div class="bs-ctas">'+ctaHtml(ev, ended?[]:btns)+'</div>';
    body.innerHTML=html;
    sheet.hidden=false;
    document.documentElement.classList.add('boot-sheet-open');
  }
  function goApp(){
    if(window.__PAKSOC_LOAD_APP__) window.__PAKSOC_LOAD_APP__();
  }
  function markInteractive(){
    if(interactive) return;
    interactive=true;
    window.__PAKSOC_SHELL_READY__=true;
    // Preload React in the background for /login etc — but NEVER replace this shell on "/"
    setTimeout(goApp, 2000);
  }
  function apply(rows){
    if(!rows||!rows.length||stopped) return;
    byId={};
    for(var i=0;i<rows.length;i++) byId[rows[i].id]=rows[i];
    window.__PAKSOC_BOOT_EVENTS__=rows;
    var now=Date.now();
    var upcoming=rows.filter(function(e){return new Date(e.time).getTime()>now;})
      .sort(function(a,b){return new Date(a.time)-new Date(b.time);});
    var past=rows.filter(function(e){return new Date(e.time).getTime()<=now;})
      .sort(function(a,b){return new Date(b.time)-new Date(a.time);});
    var banner=upcoming[0]||null;
    var nameEl=document.getElementById('boot-name');
    var ctas=document.getElementById('boot-ctas');
    if(banner){
      if(nameEl){ nameEl.textContent=banner.name||'Upcoming event'; nameEl.classList.remove('pending'); }
      startTimer(banner.time);
      if(ctas) ctas.innerHTML=ctaHtml(banner, buttonsOf(banner));
    } else {
      if(nameEl){ nameEl.textContent='No upcoming events'; nameEl.classList.remove('pending'); }
      setCell('boot-d',0); setCell('boot-h',0); setCell('boot-m',0); setCell('boot-s',0);
      if(ctas) ctas.innerHTML='';
    }
    var list=(upcoming.length?upcoming:past).slice(0,3);
    for(var j=0;j<list.length;j++) warmImage(imgSrc(list[j]), j<2);
    var grid=document.getElementById('boot-events');
    if(grid&&list.length){
      grid.innerHTML=list.map(function(ev, idx){
        var src=imgSrc(ev);
        var poster=src
          ? '<img class="poster-img" src="'+esc(src)+'" alt="" width="400" height="120" decoding="async"'+(idx===0?' fetchpriority="high"':'')+'>'
          : '<div class="poster"></div>';
        return '<button type="button" class="card" data-open-event="'+esc(ev.id)+'">'
          +poster+'<div class="body"><p class="t">'
          +esc(ev.name)+'</p><p class="m">'+esc(ev.location||'')+'</p>'
          +'<p class="tap">Tap for details →</p></div></button>';
      }).join('');
    }
    var more=document.getElementById('boot-more');
    if(more) more.hidden=false;
    markInteractive();
  }
  function fromCache(){
    try{
      var raw=localStorage.getItem('paksoc:public-events:v1');
      if(!raw) return null;
      var parsed=JSON.parse(raw);
      return parsed&&parsed.events?parsed.events:null;
    }catch(e){ return null; }
  }

  document.addEventListener('click', function(e){
    var t=e.target;
    if(!t||!t.closest) return;
    if(t.closest('[data-boot-close]')){ closeSheet(); return; }
    var open=t.closest('[data-open-event]');
    if(open){
      e.preventDefault();
      openSheet(open.getAttribute('data-open-event'));
    }
  });

  var cached=fromCache();
  if(cached) apply(cached);
  if(window.__PAKSOC_EVENTS_P__){
    window.__PAKSOC_EVENTS_P__.then(apply).catch(function(){ markInteractive(); goApp(); });
  } else if(!cached) {
    setTimeout(function(){ markInteractive(); goApp(); }, 400);
  }
  // Never start React before shell has had a chance — hard cap only if events hang
  setTimeout(function(){ if(!interactive){ markInteractive(); goApp(); } }, 2500);

  window.__PAKSOC_STOP_BOOT__=function(){
    stopped=true;
    if(timer) clearInterval(timer);
    timer=null;
    closeSheet();
    var sheet=document.getElementById('boot-sheet');
    if(sheet) sheet.remove();
    var shell=document.getElementById('boot-shell');
    if(shell) shell.remove();
    var root=document.getElementById('root');
    if(root) root.hidden=false;
  };
})();
</script>`
}

function paksocBootPlugin(supabaseUrl: string, anonKey: string): Plugin {
  return {
    name: 'paksoc-events-boot',
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        let out = html

        if (supabaseUrl && anonKey) {
          out = out.replace('<!-- EVENTS_BOOT -->', eventsBootScript(supabaseUrl, anonKey))
        } else {
          out = out.replace('<!-- EVENTS_BOOT -->', '')
        }

        out = out.replace(
          /<link\s+rel="stylesheet"([^>]*?)href="([^"]+\.css)"([^>]*)>/g,
          '<link rel="preload" href="$2" as="style" onload="this.onload=null;this.rel=\'stylesheet\'">'
          + '<noscript><link rel="stylesheet" href="$2"></noscript>',
        )
        out = out.replace(/<link\s+rel="modulepreload"[^>]*>\s*/g, '')

        const modRe = /<script\s+type="module"[^>]*\ssrc="([^"]+)"[^>]*><\/script>/
        const modMatch = out.match(modRe)
        const appSrc = modMatch?.[1] ?? ''
        if (modMatch) out = out.replace(modMatch[0], '')

        const loader = `<script>
(function(){
  var started=false;
  var src=${JSON.stringify(appSrc)};
  window.__PAKSOC_LOAD_APP__=function(){
    if(started||!src) return;
    started=true;
    var pre=document.createElement('link');
    pre.rel='modulepreload';
    pre.href=src;
    pre.crossOrigin='';
    document.head.appendChild(pre);
    var s=document.createElement('script');
    s.type='module';
    s.crossOrigin='';
    s.src=src;
    document.body.appendChild(s);
  };
})();
</script>`
        out = out.replace('<!--APP_LOADER-->', loader)
        out = out.replace('<!--BOOT_UI-->', bootUiScript())
        return out
      },
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  const supabaseUrl = env.VITE_SUPABASE_URL || ''
  const anonKey = env.VITE_SUPABASE_ANON_KEY || ''

  return {
    plugins: [
      react(),
      paksocBootPlugin(supabaseUrl, anonKey),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      modulePreload: { polyfill: false, resolveDependencies: () => [] },
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/@supabase')) return 'supabase'
            if (id.includes('node_modules/react-dom')) return 'react-vendor'
            if (id.includes('node_modules/react-router')) return 'router'
            if (id.includes('node_modules/react/')) return 'react-vendor'
          },
        },
      },
    },
    server: {
      port: 5173,
      host: true,
      allowedHosts: true,
      watch: {
        usePolling: true,
        interval: 500,
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
      },
      proxy: {
        '/api': {
          target: 'http://server:4000',
          changeOrigin: true,
        },
      },
    },
  }
})
