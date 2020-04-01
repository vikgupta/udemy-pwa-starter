self.addEventListener('install', evt => {
    console.log('[Service Worker] - installing service worker...', evt);
});

self.addEventListener('activate', evt => {
    console.log('[Service Worker] - activating service worker...', evt);
    return self.clients.claim();
});

self.addEventListener('fetch', evt => {
    console.log('[Service Worker] - fetching...', evt);
    evt.respondWith(fetch(evt.request));
});