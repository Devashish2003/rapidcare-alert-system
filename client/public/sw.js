/* RapidCare Service Worker — caching + web push */
/* global clients */
const CACHE_NAME = 'rapidcare-v1';
const HOSPITAL_API = '/api/hospital/hospitals/';

// On install, cache nothing explicitly — we populate lazily
self.addEventListener('install', () => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// NetworkFirst strategy for hospital list; cache-fallback for everything else
self.addEventListener('fetch', (event) => {
    const {request} = event;

    // Only intercept GET requests to our API
    if (request.method !== 'GET') return;

    const url = new URL(request.url);

    if (url.pathname === HOSPITAL_API) {
        event.respondWith(networkFirst(request));
        return;
    }

    // For other same-origin API calls, network-only (never block on stale data)
    if (url.pathname.startsWith('/api/')) return;

    // For static assets, cache-first
    event.respondWith(cacheFirst(request));
});

async function networkFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        const cached = await cache.match(request);
        return cached || new Response(JSON.stringify([]), {
            headers: {'Content-Type': 'application/json'},
        });
    }
}

async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch {
        return new Response('Offline', {status: 503});
    }
}

// ── Web Push ──────────────────────────────────────────────────────────────────

self.addEventListener('push', (event) => {
    if (!event.data) return;
    let payload = {};
    try {
        payload = event.data.json();
    } catch {
        payload = {title: 'RapidCare', body: event.data.text()};
    }

    const title = payload.title || 'RapidCare Alert';
    const options = {
        body: payload.body || '',
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        data: payload.data || {},
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        actions: [
            {action: 'view', title: 'View Alert'},
            {action: 'dismiss', title: 'Dismiss'},
        ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'dismiss') return;

    const targetUrl = event.notification.data?.url || '/alerts';

    event.waitUntil(
        clients.matchAll({type: 'window', includeUncontrolled: true}).then((clientList) => {
            for (const client of clientList) {
                if ('focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});
