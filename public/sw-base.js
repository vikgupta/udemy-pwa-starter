importScripts('workbox-sw.prod.v2.1.3.js');

const workboxSW = new self.WorkboxSW();

// We should use this file to add functionality to the service worker generated using workbox
workboxSW.router.registerRoute(
    /.*(?:googleapis|gstatic)\.com.*$/, 
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'google-fonts'
    })
);

workboxSW.precache([]);