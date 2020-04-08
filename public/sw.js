var CACHE_STATIC_NAME = 'static';
var CACHE_DYNAMIC_NAME = 'dynamic';

self.addEventListener('install', evt => {
    console.log('[Service Worker] - installing service worker...', evt);

    // start caching objects - caches.open is async so we want it to wait for it to finish
    evt.waitUntil(
        caches.open(CACHE_STATIC_NAME)   // it returns a promise
        .then(cache => {
            // we are ready to add stuff to the cache
            console.log('[Service Worker] - Precaching app shell');
            cache.addAll([
                '/',
                '/index.html',
                '/offline.html',
                '/src/js/app.js',
                '/src/js/feed.js',
                '/src/js/promise.js',
                '/src/js/fetch.js',
                '/src/js/material.min.js',
                'src/css/app.css',
                'src/css/feed.css',
                '/src/images/main-image.jpg',
                'https://fonts.googleapis.com/css?family=Roboto:400,700',
                'https://fonts.googleapis.com/icon?family=Material+Icons',
                'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
            ]);
        })
    );
});

self.addEventListener('activate', evt => {
    console.log('[Service Worker] - activating service worker...', evt);
    evt.waitUntil(
        caches.keys()
        .then(keys => {
            console.log(keys);
            return Promise.all(keys.map(key => {
                if(key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
                    console.log('[Service Worker] - Removing stale key: ', key);
                    return caches.delete(key);
                }
            }))
        })
    )
    return self.clients.claim();
});

// self.addEventListener('fetch', evt => {
//     // fetch data from cache if available
//     evt.respondWith(
//         caches.match(evt.request)
//         .then(response => {
//             if(response) {
//                 return response;
//             }

//             return fetch(evt.request)
//             .then(res => {
//                 return caches.open(CACHE_DYNAMIC_NAME)
//                 .then(cache => {
//                     cache.put(evt.request.url, res.clone());
//                     return res;
//                 })
//             })
//             .catch(err => {
//                 // show the default offline.html page
//                 return caches.open(CACHE_STATIC_NAME)
//                 .then(cache => {
//                     return cache.match('/offline.html');
//                 })
//             });
//         })
//     );
// });

// Network then cache strategy including dynamic caching
// self.addEventListener('fetch', evt => {
//     // fetch data from network first
//     evt.respondWith(
//         fetch(evt.request)
//         .then(res => {
//             return caches.open(CACHE_DYNAMIC_NAME)
//             .then(cache => {
//                 cache.put(evt.request.url, res.clone());
//                 return res;
//             })
//         })
//         .catch(err => {
//             return caches.match(evt.request)
//         })
//     );
// });

// Cache then network including dynamic caching
self.addEventListener('fetch', evt => {
    var url = 'https://httpbin.org/get';
    if(evt.request.url.indexOf(url) > -1) {
        evt.respondWith(
            caches.open(CACHE_DYNAMIC_NAME)
            .then(cache => {
                return fetch(evt.request)
                .then(response => {
                    cache.put(evt.request, response.clone());
                    return response;
                });
            })
        )
    } else {
        evt.respondWith(
            caches.match(evt.request)
            .then(response => {
                if(response) {
                    return response;
                }

                return fetch(evt.request)
                .then(res => {
                    return caches.open(CACHE_DYNAMIC_NAME)
                    .then(cache => {
                        cache.put(evt.request.url, res.clone());
                        return res;
                    })
                })
                .catch(err => {
                    // show the default offline.html page
                    return caches.open(CACHE_STATIC_NAME)
                    .then(cache => {
                        if(evt.request.url.indexOf('/help')) {
                            return cache.match('/offline.html');
                        }
                    })
                });
            })
        );
    }
});