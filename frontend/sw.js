const CACHE_NAME = 'saha-satis-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/style.css',
    '/css/responsive.css',
    '/js/app.js',
    '/js/auth.js',
    '/js/api.js',
    '/js/visits.js',
    '/js/offline.js',
    '/images/icon-192.png',
    '/images/icon-512.png',
    '/images/offline.png'
];

// Kurulum
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching files');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Aktivasyon
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        console.log('Service Worker: Clearing old cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch olayı
self.addEventListener('fetch', (event) => {
    // API isteklerini ağdan al, cache'ten değil
    if (event.request.url.includes('/api/')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // Çevrimdışı durumda özel mesaj döndür
                    return new Response(
                        JSON.stringify({ 
                            success: false, 
                            message: 'İnternet bağlantısı yok' 
                        }),
                        { 
                            status: 503,
                            headers: { 'Content-Type': 'application/json' }
                        }
                    );
                })
        );
    } else {
        // Diğer istekler için cache-first stratejisi
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    // Cache'te bulunursa cache'ten döndür
                    if (response) {
                        return response;
                    }
                    // Ağdan getir ve cache'e ekle
                    return fetch(event.request)
                        .then((response) => {
                            // Sadece başarılı response'ları cache'e ekle
                            if (!response || response.status !== 200 || response.type !== 'basic') {
                                return response;
                            }
                            const responseToCache = response.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseToCache);
                                });
                            return response;
                        });
                })
                .catch(() => {
                    // Çevrimdışı sayfa
                    if (event.request.destination === 'document') {
                        return caches.match('/');
                    }
                })
        );
    }
});