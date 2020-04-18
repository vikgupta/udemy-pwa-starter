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