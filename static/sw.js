// CollectRelay Service Worker — offline caching, background sync, push notifications

const CACHE_VERSION = 2;
const STATIC_CACHE = `cr-static-v${CACHE_VERSION}`;
const SHELL_CACHE = `cr-shell-v${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// App shell pages to pre-cache for offline navigation
const SHELL_URLS = [OFFLINE_URL];

// Install: pre-cache offline page
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(SHELL_CACHE).then((cache) => cache.addAll(SHELL_URLS))
	);
	self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys
					.filter((key) => key !== STATIC_CACHE && key !== SHELL_CACHE)
					.map((key) => caches.delete(key))
			)
		)
	);
	self.clients.claim();
});

// Fetch: strategy depends on request type
self.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// API requests: network-only (never cache)
	if (url.pathname.startsWith('/api/')) return;

	// SvelteKit immutable assets: cache-first (content-hashed, safe to cache forever)
	if (url.pathname.startsWith('/_app/immutable/')) {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				if (cached) return cached;
				return fetch(event.request).then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
					}
					return response;
				});
			})
		);
		return;
	}

	// Static assets (icons, manifest, etc.): stale-while-revalidate
	if (url.pathname.match(/\.(png|jpg|svg|ico|webmanifest|woff2?)$/)) {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				const fetchPromise = fetch(event.request).then((response) => {
					if (response.ok) {
						const clone = response.clone();
						caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, clone));
					}
					return response;
				}).catch(() => cached);

				return cached || fetchPromise;
			})
		);
		return;
	}

	// Navigation: network-first, fallback to cached shell, then offline page
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch(() =>
				caches.match(event.request).then((cached) =>
					cached || caches.match(OFFLINE_URL)
				)
			)
		);
		return;
	}
});

// Background Sync: relay sync request to client page
self.addEventListener('sync', (event) => {
	if (event.tag === 'cr-sync-queue') {
		event.waitUntil(
			self.clients.matchAll({ type: 'window' }).then((clients) => {
				for (const client of clients) {
					client.postMessage({ type: 'SYNC_REQUESTED' });
				}
			})
		);
	}
});

// Push: show notification from server payload
self.addEventListener('push', (event) => {
	if (!event.data) return;

	let data;
	try {
		data = event.data.json();
	} catch {
		data = { title: 'CollectRelay', body: event.data.text() };
	}

	const options = {
		body: data.body || '',
		icon: '/icon-192.png',
		badge: '/icon-192.png',
		tag: data.tag || 'collectrelay',
		data: { url: data.url || '/' },
		vibrate: [200, 100, 200]
	};

	event.waitUntil(
		self.registration.showNotification(data.title || 'CollectRelay', options)
	);
});

// Notification click: open or focus the target URL
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	const targetUrl = event.notification.data?.url || '/';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
			// Focus existing tab if open
			for (const client of clients) {
				if (client.url.includes(targetUrl) && 'focus' in client) {
					return client.focus();
				}
			}
			// Otherwise open new tab
			return self.clients.openWindow(targetUrl);
		})
	);
});
