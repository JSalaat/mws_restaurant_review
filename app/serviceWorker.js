/**
 * Created by jsalaat on 6/20/18.
 */

const staticCacheName = 'restaurant-review-v1';
/**
 * Install service worker and cache assets
 */
// uncomment this if running in dev
/*const assets = [
 '/',
 'index.html',
 'restaurant.html',
 'scripts/main.js',
 'scripts/restaurant_info.js',
 'scripts/dbhelper.js',
 'styles/styles.css',
 'styles/media.css',
 'img/1.webp',
 'img/2.webp',
 'img/3.webp',
 'img/4.webp',
 'img/5.webp',
 'img/6.webp',
 'img/7.webp',
 'img/8.webp',
 'img/9.webp',
 'img/10.webp',
 'img/1_400.jpg',
 'img/1_800.jpg',
 'img/2_400.jpg',
 'img/2_800.jpg',
 'img/3_400.jpg',
 'img/3_800.jpg',
 'img/4_400.jpg',
 'img/4_800.jpg',
 'img/5_400.jpg',
 'img/5_800.jpg',
 'img/6_400.jpg',
 'img/6_800.jpg',
 'img/7_400.jpg',
 'img/7_800.jpg',
 'img/8_400.jpg',
 'img/8_800.jpg',
 'img/9_400.jpg',
 'img/9_800.jpg',
 'img/10_400.jpg',
 'img/10_800.jpg',
 'img/stars.png',
 '/bower_components/localforage/dist/localforage.js'
 ];*/

//TODO: Lazyload all images

const assets = [
  '/',
  'index.html',
  'restaurant.html',
  'scripts/index.js',
  'scripts/r_info.js',
  'scripts/vendor.js',
  'styles/styles.css',
  'img/1.webp',
  'img/2.webp',
  'img/3.webp',
  'img/4.webp',
  'img/5.webp',
  'img/6.webp',
  'img/7.webp',
  'img/8.webp',
  'img/9.webp',
  'img/10.webp',
  'img/1_400.jpg',
  'img/1_800.jpg',
  'img/2_400.jpg',
  'img/2_800.jpg',
  'img/3_400.jpg',
  'img/3_800.jpg',
  'img/4_400.jpg',
  'img/4_800.jpg',
  'img/5_400.jpg',
  'img/5_800.jpg',
  'img/6_400.jpg',
  'img/6_800.jpg',
  'img/7_400.jpg',
  'img/7_800.jpg',
  'img/8_400.jpg',
  'img/8_800.jpg',
  'img/9_400.jpg',
  'img/9_800.jpg',
  'img/10_400.jpg',
  'img/10_800.jpg',
  'img/stars.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName)
      .then(cache => {
        return cache.addAll(assets)
          .then(() => self.skipWaiting());
      })
  );
});

/*
 * activate service worker, get latest cache and delete old ones
 */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('restaurant-review-') &&
            cacheName !== staticCacheName;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

/**
 * Intercept requests and fetch them from cache first with network fallback
 */
self.addEventListener('fetch', function (event) {
  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin === location.origin) {
    if (requestUrl.pathname === '/') {
      event.respondWith(
        caches.match('index.html')
      );
      return;
    }
    if (requestUrl.pathname === '/restaurant.html') {
      event.respondWith(
        caches.match('restaurant.html')
      );
      return;
    }
  }

  event.respondWith(
    caches.match(event.request).then(function (response) {
      return response || fetch(event.request);
    })
  );
});
