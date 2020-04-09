var CACHE_STATIC_NAME = 'static';
var CACHE_DYNAMIC_NAME = 'dynamic';

var CACHE_STATIC_LIST = [
    '/',
    '/index.html',
    '/offline.html',
    '/src/js/app.js',
    '/src/js/feed.js',
    '/src/js/promise.js',
    '/src/js/fetch.js',
    '/src/js/material.min.js',
    '/src/css/app.css',
    '/src/css/feed.css',
    '/src/images/main-image.jpg',
    'https://fonts.googleapis.com/css?family=Roboto:400,700',
    'https://fonts.googleapis.com/icon?family=Material+Icons',
    'https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css'
];

const trimCache = (cacheName, maxItems) => {
    caches.open(cacheName)
    .then(cache => {
        cache.keys()
        .then(keys => {
            if(keys.length > maxItems) {
                cache.delete(keys[0])
                .then(trimCache(cacheName, maxItems))
            }
        })
    })
}

self.addEventListener('install', evt => {
    console.log('[Service Worker] - installing service worker...', evt);

    // start caching objects - caches.open is async so we want it to wait for it to finish
    evt.waitUntil(
        caches.open(CACHE_STATIC_NAME)   // it returns a promise
        .then(cache => {
            // we are ready to add stuff to the cache
            console.log('[Service Worker] - Precaching app shell');
            cache.addAll(CACHE_STATIC_LIST);
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
    var url = 'https://pwagram-44966.firebaseio.com/posts.json';
    if(evt.request.url.indexOf(url) > -1) {
        // Let's have 'network -> then put in cache (but do not fetch from cache)' strategy for the URL that is required for feed.js
        evt.respondWith(
            caches.open(CACHE_DYNAMIC_NAME)
            .then(cache => {
                return fetch(evt.request)
                .then(response => {
                    // trim the cache before adding the new key-value pair
                    trimCache(CACHE_DYNAMIC_NAME, 4);

                    cache.put(evt.request, response.clone());
                    return response;
                });
            })
        )
    } else if (new RegExp('\\b' + CACHE_STATIC_LIST.join('\\b|\\b') + '\\b').test(evt.request)) {
        // Let's have 'cache only strategy' since app shell and basic assets will always be cached
        console.log('RegEx Matched for - ', evt.request.url)
        evt.respondWith(
            caches.match(evt.request)
        );
    } else {
        // Let's have 'fetch from cache -> go to network if not found in cache -> store in cache if network call successful'
        // strategy for the other assets / pages
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
                        // trim the cache before adding the new key-value pair
                        trimCache(CACHE_DYNAMIC_NAME, 4);

                        cache.put(evt.request.url, res.clone());
                        return res;
                    })
                })
                .catch(err => {
                    // show the default offline.html page
                    return caches.open(CACHE_STATIC_NAME)
                    .then(cache => {
                        if(evt.request.headers.get('accept').includes('text/html')) {
                            return cache.match('/offline.html');
                        }
                    })
                });
            })
        );
    }
});