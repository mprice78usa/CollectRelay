// CollectRelay Service Worker — offline fallback + push notifications

const CACHE_NAME = 'cr-cache-v1';
const OFFLINE_URL = '/offline.html';

// Install: pre-cache offline page
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => cache.add(OFFLINE_URL))
	);
	self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) =>
			Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			)
		)
	);
	self.clients.claim();
});

// Fetch: network-first, serve offline page on navigation failure
self.addEventListener('fetch', (event) => {
	if (event.request.mode !== 'navigate') return;

	event.respondWith(
		fetch(event.request).catch(() =>
			caches.match(OFFLINE_URL)
		)
	);
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
