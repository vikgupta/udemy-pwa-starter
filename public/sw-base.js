importScripts('workbox-sw.prod.v2.1.3.js');
importScripts('/src/js/idb.js');
importScripts('/src/js/utility.js');

const workboxSW = new self.WorkboxSW();

const CACHE_STATIC_NAME = 'static';
const CACHE_DYNAMIC_NAME = 'dynamic';

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
        return fetch(args.event.request)
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

// Showing custom offline screen for trying to access offline html page
workboxSW.router.registerRoute(
    routeData => {
        return routeData.event.request.headers.get('accept').includes('text/html')
    }, 
    args => {
        return caches.match(args.event.request)
        .then(response => {
            if(response) {
                return response;
            }

            return fetch(args.event.request)
            .then(res => {
                return caches.open(CACHE_DYNAMIC_NAME)
                .then(cache => {
                    cache.put(args.event.request.url, res.clone());
                    return res;
                })
            })
            .catch(err => {
                // show the default offline.html page
                return caches.match('/offline.html')
                .then(response => {
                    return response;
                })
            });
        })
    }
);

workboxSW.precache([]);