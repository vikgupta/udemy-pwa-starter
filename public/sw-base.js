importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new self.WorkboxSW();

// We should use this file to add functionality to the service worker generated using workbox

// Caching google fonts
workboxSW.router.registerRoute(
    /.*(?:googleapis|gstatic)\.com.*$/, 
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'google-fonts',
        cacheExpiration: {
            maxEntries: 5,
            maxAgeSeconds: 30 * 24 * 60 * 60
        }
    })
);

// Caching material design library
workboxSW.router.registerRoute(
    "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css", 
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'material-css'
    })
);

// Caching images
workboxSW.router.registerRoute(
    /.*(?:firebasestorage\.googleapis)\.com.*$/, 
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'post-images'
    })
);

// Own handler for IndexedDB - need custom handler here
workboxSW.router.registerRoute(
    "https://pwagram-44966.firebaseio.com/posts.json", 
    args => {
        return fetch(args.evt.request)
        .then(response => {
            // Use the indexeddb to store the data
            var clonedResponse = response.clone();

            // Let's clear the cached data before creating new, since data in backend db would have changed
            clearAllData('posts')
            .then(() => {
                return clonedResponse.json();
            })
            .then(data => {
                for(var key in data) {
                    writeData('posts', data[key]);
                    // .then(() => {
                    //     deleteItemFromStore('posts', key);  // Just for testing - will be commented out after testing
                    // });
                }
            })

            return response;
        })
    }
);

workboxSW.precache([]);