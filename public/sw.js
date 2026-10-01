// Network-first navigation keeps installed clients current after deployments.
const CACHE_NAME = 'yodh-v3'
const OFFLINE_ASSETS = ['/', '/manifest.json', '/favicon.ico', '/img/yodh.jpg']
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(OFFLINE_ASSETS)).then(() => self.skipWaiting()))
})
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(names => Promise.all(names.filter(name => name.startsWith('yodh-') && name !== CACHE_NAME).map(name => caches.delete(name)))).then(() => self.clients.claim()))
})
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url)
  // Never cache wallet requests or blockchain responses.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request, { cache: 'no-store' }).catch(() => caches.match('/').then(response => response || Response.error())))
  } else if (OFFLINE_ASSETS.includes(url.pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(event.request).then(response => response || Response.error())))
  }
})
