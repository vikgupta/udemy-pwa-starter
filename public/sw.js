self.addEventListener('install', evt => {
    console.log('[Service Worker] - installing service worker...', evt);
});

self.addEventListener('activate', evt => {
    console.log('[Service Worker] - activating service worker...', evt);
    return self.clients.claim();
});