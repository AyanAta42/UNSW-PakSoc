import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const COLS = 'id,name,time,end_time,location,price,public,image_url,buttons,timeline'

function eventsBootScript(url: string, anonKey: string): string {
  // Inline, blocking-free: fires the events GET before any React/module JS.
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
          if (!supabaseUrl || !anonKey) return html
          return html.replace('<!-- EVENTS_BOOT -->', eventsBootScript(supabaseUrl, anonKey))
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
      modulePreload: { polyfill: false },
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
