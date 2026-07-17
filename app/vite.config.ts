import { defineConfig, loadEnv } from 'vite'
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
  var link=document.createElement('link');
  link.rel='preconnect'; link.href=base; link.crossOrigin='anonymous';
  document.head.appendChild(link);
  var q=base+'/rest/v1/events?select=${encodeURIComponent(COLS)}&public=eq.true&order=time.asc';
  window.__PAKSOC_EVENTS_P__=fetch(q,{headers:{apikey:key,Authorization:'Bearer '+key,Accept:'application/json'}})
    .then(function(r){ if(!r.ok) throw new Error('events '+r.status); return r.json(); })
    .then(function(rows){
      try{ localStorage.setItem('paksoc:public-events:v1', JSON.stringify({at:Date.now(),events:rows})); }catch(e){}
      return rows;
    });
})();
</script>`
}

/** Instant countdown + cards from cache/network — runs before React downloads. */
function bootUiScript(): string {
  return `<script>
(function(){
  var timer=null, target=null, stopped=false;
  function pad(n){ return (n<10?'0':'')+n; }
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
  function paintCd(){
    if(!target||stopped) return;
    var c=calc(target);
    var d=document.getElementById('boot-d');
    var h=document.getElementById('boot-h');
    var m=document.getElementById('boot-m');
    var s=document.getElementById('boot-s');
    if(d) d.textContent=pad(c.d);
    if(h) h.textContent=pad(c.h);
    if(m) m.textContent=pad(c.m);
    if(s) s.textContent=pad(c.s);
  }
  function startTimer(iso){
    target=iso;
    paintCd();
    if(timer) clearInterval(timer);
    timer=setInterval(paintCd,1000);
  }
  function esc(t){
    return String(t==null?'':t).replace(/[&<>"']/g,function(ch){
      return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[ch];
    });
  }
  function apply(rows){
    if(!rows||!rows.length||stopped) return;
    var now=Date.now();
    var upcoming=rows.filter(function(e){return new Date(e.time).getTime()>now;})
      .sort(function(a,b){return new Date(a.time)-new Date(b.time);});
    var past=rows.filter(function(e){return new Date(e.time).getTime()<=now;})
      .sort(function(a,b){return new Date(b.time)-new Date(a.time);});
    var banner=upcoming[0]||null;
    var nameEl=document.getElementById('boot-name');
    if(banner){
      if(nameEl) nameEl.textContent=banner.name||'Upcoming event';
      startTimer(banner.time);
    } else if(nameEl){
      nameEl.textContent='No upcoming events';
    }
    var list=(upcoming.length?upcoming:past).slice(0,3);
    var grid=document.getElementById('boot-events');
    if(!grid||!list.length) return;
    grid.innerHTML=list.map(function(ev){
      var img=ev.image_url
        ? '<img src="'+esc(ev.image_url)+'" alt="" width="400" height="120" loading="eager" decoding="async"/>'
        : '';
      return '<div class="card"><div class="poster">'+img+'</div><div class="body"><p class="t">'
        +esc(ev.name)+'</p><p class="m">'+esc(ev.location||'')+'</p></div></div>';
    }).join('');
  }
  function fromCache(){
    try{
      var raw=localStorage.getItem('paksoc:public-events:v1');
      if(!raw) return null;
      var parsed=JSON.parse(raw);
      return parsed&&parsed.events?parsed.events:null;
    }catch(e){ return null; }
  }
  var cached=fromCache();
  if(cached) apply(cached);
  if(window.__PAKSOC_EVENTS_P__){
    window.__PAKSOC_EVENTS_P__.then(apply).catch(function(){});
  }
  window.__PAKSOC_STOP_BOOT__=function(){
    stopped=true;
    if(timer) clearInterval(timer);
    timer=null;
  };
})();
</script>`
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, path.resolve(__dirname), '')
  const supabaseUrl = env.VITE_SUPABASE_URL || ''
  const anonKey = env.VITE_SUPABASE_ANON_KEY || ''

  return {
    plugins: [
      react(),
      {
        name: 'paksoc-events-boot',
        transformIndexHtml(html) {
          let out = html
          if (supabaseUrl && anonKey) {
            out = out.replace('<!-- EVENTS_BOOT -->', eventsBootScript(supabaseUrl, anonKey))
          } else {
            out = out.replace('<!-- EVENTS_BOOT -->', '')
          }
          out = out.replace('<!--BOOT_UI-->', bootUiScript())
          return out
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'es2020',
      cssCodeSplit: true,
      modulePreload: {
        polyfill: false,
        // Only preload React — leave router/app to load after first paint of boot shell
        resolveDependencies: (_filename, deps) =>
          deps.filter((d) => d.includes('react-vendor')),
      },
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
