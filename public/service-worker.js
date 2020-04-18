importScripts('workbox-sw.prod.v2.1.3.js');

const workboxSW = new self.WorkboxSW();

// We should use this file to add functionality to the service worker generated using workbox
workboxSW.router.registerRoute(
    /.*(?:googleapis|gstatic)\.com.*$/, 
    workboxSW.strategies.staleWhileRevalidate({
        cacheName: 'google-fonts'
    })
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
    "revision": "3fa19002eb14a66dd3eea418116b3991"
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
    "revision": "4cb95be76c461f2d4d85bba8933dceb4"
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