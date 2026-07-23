import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
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
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null, // registered manually in main.tsx
        manifest: false, // keep the hand-written public/manifest.webmanifest
        workbox: {
          // Precache the whole app shell: JS, CSS, HTML, fonts and every public image
          globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/api\//],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              // Public events data — try the network first (so realtime-triggered
              // reconcile fetches always see fresh rows instead of a stale cache
              // entry), falling back to cache only when offline/slow.
              urlPattern: /^https:\/\/[^/]+\.supabase\.co\/rest\/v1\/events/,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'events-api',
                networkTimeoutSeconds: 3,
                expiration: { maxEntries: 32, maxAgeSeconds: 7 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Event images from Supabase storage
              urlPattern: /^https:\/\/[^/]+\.supabase\.co\/storage\/v1\/object\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'event-images',
                expiration: { maxEntries: 120, maxAgeSeconds: 30 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Font stylesheets (Google Fonts / Fontshare)
              urlPattern: /^https:\/\/(fonts\.googleapis\.com|api\.fontshare\.com)\//,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'font-styles',
                expiration: { maxEntries: 16, maxAgeSeconds: 30 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            {
              // Font files — immutable, cache aggressively
              urlPattern: /^https:\/\/(fonts\.gstatic\.com|cdn\.fontshare\.com)\//,
              handler: 'CacheFirst',
              options: {
                cacheName: 'font-files',
                expiration: { maxEntries: 32, maxAgeSeconds: 365 * 24 * 60 * 60 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],
        },
      }),
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
