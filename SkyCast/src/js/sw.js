const CACHE_VERSION = 'v1';
const STATIC_CACHE_NAME = `aero-static-${CACHE_VERSION}`;
const WEATHER_CACHE_NAME = `aero-weather-${CACHE_VERSION}`;

// Static assets forming the App Shell
const APP_SHELL_ASSETS = [
    '/',
    '/index.html',
    '/locations.html',
    '/profile.html',
    '/auth.html',
    '/src/css/variables.css',
    '/src/css/base.css',
    '/src/css/components.css',
    '/src/css/widgets.css',
    '/src/css/auth.css',
    '/src/css/animations.css',
    '/src/js/app.js',
    '/src/js/api/weather.js',
    '/src/js/components/WeatherCard.js',
    '/src/js/components/SearchController.js',
    '/src/js/utils/debounce.js',
    '/public/manifest.json',
    '/public/assets/icons/cloudy.svg',
    '/public/assets/icons/sun.svg',
    '/public/assets/icons/rain.svg',
    '/public/assets/icons/moon.svg'
];

/* ==========================================================================
   1. INSTALL EVENT — Pre-cache App Shell
   ========================================================================== */
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME).then((cache) => {
            console.log('[Service Worker] Pre-caching App Shell');
            return cache.addAll(APP_SHELL_ASSETS);
        }).then(() => self.skipWaiting())
    );
});

/* ==========================================================================
   2. ACTIVATE EVENT — Clean up stale caches
   ========================================================================== */
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE_NAME && cacheName !== WEATHER_CACHE_NAME) {
                        console.log('[Service Worker] Removing old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

/* ==========================================================================
   3. FETCH EVENT — Apply Caching Strategies
   ========================================================================== */
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Bypass non-GET requests and Firebase SDK endpoints
    if (request.method !== 'GET' || url.hostname.includes('firebase') || url.hostname.includes('firestore')) {
        return;
    }

    // STRATEGY 1: Weather API Requests -> Network First with Cache Fallback
    if (url.hostname.includes('api.weatherapi.com') || url.hostname.includes('openweathermap.org')) {
        event.respondWith(networkFirstWeatherStrategy(request));
        return;
    }

    // STRATEGY 2: App Shell & Static Assets -> Stale-While-Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request));
});

/**
 * Network First Strategy for live Weather API requests
 */
async function networkFirstWeatherStrategy(request) {
    const cache = await caches.open(WEATHER_CACHE_NAME);
    
    try {
        const networkResponse = await fetch(request);
        // Clone and store successful responses in cache
        if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch (error) {
        console.warn('[Service Worker] Network failed; serving cached weather data:', request.url);
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            return cachedResponse;
        }

        // Optional fallback object if no cached weather exists
        return new Response(
            JSON.stringify({ error: 'Offline', message: 'No cached weather data available.' }),
            { headers: { 'Content-Type': 'application/json' } }
        );
    }
}

/**
 * Stale-While-Revalidate Strategy for HTML, CSS, JS, and assets
 */
async function staleWhileRevalidateStrategy(request) {
    const cache = await caches.open(STATIC_CACHE_NAME);
    const cachedResponse = await cache.match(request);

    // Trigger background network fetch to revalidate cache
    const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    }).catch(() => {
        /* Ignore background fetch failures while offline */
    });

    // Return cached asset immediately if found, otherwise wait for network fetch
    return cachedResponse || fetchPromise;
}