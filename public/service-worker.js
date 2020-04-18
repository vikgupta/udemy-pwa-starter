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

workboxSW.precache([
  {
    "url": "404.html",
    "revision": "0a27a4163254fc8fce870c8cc3a3f94f"
  },
  {
    "url": "favicon.ico",
    "revision": "2cab47d9e04d664d93c8d91aec59e812"
  },
  {
    "url": "index.html",
    "revision": "f56f263237c9b1d01d69e97fd6a516bc"
  },
  {
    "url": "manifest.json",
    "revision": "cce6c1022be0ff0806099d86d16a9f56"
  },
  {
    "url": "offline.html",
    "revision": "84211fbca42d768b5c7840fd266eff26"
  },
  {
    "url": "service-worker.js",
    "revision": "53ed2546c7be1c2f6d904e9747ee05e9"
  },
  {
    "url": "src/css/app.css",
    "revision": "f27b4d5a6a99f7b6ed6d06f6583b73fa"
  },
  {
    "url": "src/css/feed.css",
    "revision": "66cc96ce5174491a69653c8575a33432"
  },
  {
    "url": "src/css/help.css",
    "revision": "1c6d81b27c9d423bece9869b07a7bd73"
  },
  {
    "url": "src/js/app.js",
    "revision": "0fc9b93ad18dfc648d0c6a257392817e"
  },
  {
    "url": "src/js/feed.js",
    "revision": "504742a94e7ea3210aaf8057db884a89"
  },
  {
    "url": "src/js/fetch.js",
    "revision": "6b82fbb55ae19be4935964ae8c338e92"
  },
  {
    "url": "src/js/idb.js",
    "revision": "017ced36d82bea1e08b08393361e354d"
  },
  {
    "url": "src/js/material.min.js",
    "revision": "713af0c6ce93dbbce2f00bf0a98d0541"
  },
  {
    "url": "src/js/promise.js",
    "revision": "10c2238dcd105eb23f703ee53067417f"
  },
  {
    "url": "src/js/utility.js",
    "revision": "3ad3173bf3484562e4693ad4a85abd15"
  },
  {
    "url": "sw-base.js",
    "revision": "fce86782dc5e18a91a29bb7d2e5271a7"
  },
  {
    "url": "sw.js",
    "revision": "c0a84e6c78f99572ee8937989007389b"
  },
  {
    "url": "workbox-sw.prod.v2.1.3.js",
    "revision": "a9890beda9e5f17e4c68f42324217941"
  },
  {
    "url": "src/images/main-image-lg.jpg",
    "revision": "31b19bffae4ea13ca0f2178ddb639403"
  },
  {
    "url": "src/images/main-image-sm.jpg",
    "revision": "c6bb733c2f39c60e3c139f814d2d14bb"
  },
  {
    "url": "src/images/main-image.jpg",
    "revision": "5c66d091b0dc200e8e89e56c589821fb"
  },
  {
    "url": "src/images/sf-boat.jpg",
    "revision": "0f282d64b0fb306daf12050e812d6a19"
  }
]);

// For push notifications and syncing

self.addEventListener('sync', (evt) => {
    console.log('[Service Worker] Background syncing')
    if(evt.tag === 'sync-new-posts') {
        console.log('[Service Worker] Syncing new post');
        evt.waitUntil(
            readAllData('sync-posts')
            .then(data => {
                for( var dt of data) {
                    var postData = new FormData();
                    postData.append('id', dt.id);
                    postData.append('title', dt.title);
                    postData.append('location', dt.location);
                    postData.append('lat', dt.rawLocation.lat);
                    postData.append('long', dt.rawLocation.long);
                    postData.append('image', dt.picture, dt.id + '.png');

                    fetch('https://us-central1-pwagram-44966.cloudfunctions.net/storePostData', {
                        method: 'POST',
                        body: postData
                    })
                    .then(response => {
                        console.log('[Service Worker] Data sync response - ', response);

                        // remove the data from DB
                        if(response.ok) {
                            response.json()
                            .then(respData => {
                                deleteItemFromStore('sync-posts', respData.id);
                            })
                        }
                    })
                    .catch(err => {
                        console.log('[Service Worker] error while syncing data - ', err);
                    })
                }
            })
        );
    }
})

self.addEventListener('notificationclick', (evt) => {
    var notification = evt.notification;
    var action = evt.action;
    if(action === 'confirm') {
        console.log('Confirm was chosen');
        evt.waitUntil(
            clients.matchAll()
            .then(clis => {
                var client = clis.find(c => {
                    return c.visibilityState === 'visible';
                })

                console.log('Client is - ', client);
                if(client !== undefined) {
                    client.navigate(notification.data.url);
                    client.focus();
                } else {
                    clients.openWindow(notification.data.url);
                }
            })
        );
    } else if (action === 'cancel') {
        console.log('Cancel was chosen');
    }

    // Better to close the notification since on some OSes, it's not done by default
    notification.close();
})

self.addEventListener('notificationclose', (evt) => {
    console.log('[Service Worker] Notification was closed - ', evt);
})

self.addEventListener('push', evt => {
    console.log('Push notification received');

    var data = {title: 'New', content: 'Something happened!', openUrl: '/'};
    if(evt.data) {
        data = JSON.parse(evt.data.text());
    }

    var options = {
        body: data.content,
        icon: '/src/images/icons/app-icon-96x96.png',
        image: '/src/images/sf-boat.jpg',
        dir: 'ltr', // direction is left to right
        lang: 'en-US',
        vibrate: [100, 50, 200],
        badge: '/src/images/icons/app-icon-96x96.png',
        tag: 'confirm-notification',
        renotify: true,
        actions: [
          {
            action: 'confirm',
            title: 'OK',
            icon: '/src/images/icons/app-icon-96x96.png'
          },
          {
            action: 'cancel',
            title: 'Cancel',
            icon: '/src/images/icons/app-icon-96x96.png'
          }
        ],
        data: {
            url: data.openUrl
        }
    }

    evt.waitUntil(
        self.registration.showNotification(data.title, options)
    )
})