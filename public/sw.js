const CACHE_NAME = 'rentflow-v1'
const urlsToCache = [
  '/',
  '/auth',
  '/dashboard',
  '/dashboard/properties',
  '/dashboard/tenants',
  '/dashboard/payments',
  '/dashboard/calendar',
  '/dashboard/settings',
  '/tenant',
  '/manifest.json',
]

// Install service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('RentFlow PWA: Caching app shell')
      return cache.addAll(urlsToCache)
    })
  )
  self.skipWaiting()
})

// Activate and clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('RentFlow PWA: Clearing old cache', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  self.clients.claim()
})

// Fetch — network first, cache fallback
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  // Skip Supabase API calls
  if (event.request.url.includes('supabase.co')) return
  if (event.request.url.includes('safaricom.co.ke')) return

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone and cache successful responses
        if (response.status === 200) {
          const responseClone = response.clone()
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone)
          })
        }
        return response
      })
      .catch(() => {
        // Network failed - serve from cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) return cachedResponse
          // Return offline page for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/')
          }
        })
      })
  )
})

// Push notifications
self.addEventListener('push', event => {
  const data = event.data?.json() || {}
  const title = data.title || 'RentFlow'
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/dashboard' },
    actions: [
      { action: 'view', title: 'View' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Notification click
self.addEventListener('notificationclick', event => {
  event.notification.close()
  if (event.action === 'view' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/dashboard')
    )
  }
})