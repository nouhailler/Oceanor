/**
 * Service Worker for NOAA SST Dashboard PWA
 * Handles caching and offline functionality
 */

const CACHE_NAME = 'noaa-sst-v1';
const DATA_CACHE_NAME = 'noaa-sst-data-v1';
const ASSETS_CACHE_NAME = 'noaa-sst-assets-v1';

// Static assets to cache
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/manifest.json'
];

// ERDDAP API pattern
const ERDDAP_API_PATTERN = /^https:\/\/coastwatch\.pfeg\.noaa\.gov\/erddap\/.*\.json/;

// Max cache size for data (in entries)
const MAX_DATA_ENTRIES = 50;

/**
 * Install event - Cache static assets
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ASSETS_CACHE_NAME)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
});

/**
 * Activate event - Clean up old caches
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== ASSETS_CACHE_NAME && 
              cacheName !== DATA_CACHE_NAME &&
              cacheName !== CACHE_NAME) {
            console.log(`Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log('Service worker activated');
      return self.clients.claim();
    })
  );
});

/**
 * Fetch event - Handle requests with caching strategies
 */
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip POST requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Handle ERDDAP API requests with NetworkFirst strategy
  if (ERDDAP_API_PATTERN.test(event.request.url)) {
    event.respondWith(
      handleErddapRequest(event.request)
    );
    return;
  }

  // Handle static assets with CacheFirst strategy
  if (ASSETS_TO_CACHE.some(asset => url.pathname === asset || url.pathname.endsWith(asset))) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request);
        })
    );
    return;
  }

  // Default: NetworkFirst for everything else
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

/**
 * Handle ERDDAP API requests with NetworkFirst strategy and cache management
 * @param {Request} request - The request to handle
 * @returns {Promise<Response>}
 */
async function handleErddapRequest(request) {
  const cache = await caches.open(DATA_CACHE_NAME);
  
  try {
    // Try to fetch fresh data
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response.ok) {
      // Clone the response to cache
      const responseClone = response.clone();
      
      // Generate cache key based on URL parameters
      const cacheKey = generateCacheKey(request.url);
      
      // Check cache size before adding
      const keys = await cache.keys();
      if (keys.length >= MAX_DATA_ENTRIES) {
        // Delete oldest entry
        const oldestKey = keys[0];
        await cache.delete(oldestKey);
      }
      
      // Cache the response
      await cache.put(cacheKey, responseClone);
    }
    
    return response;
  } catch (error) {
    console.log('Network request failed, serving from cache:', error);
    
    // Try to get from cache
    const cacheKey = generateCacheKey(request.url);
    const cachedResponse = await cache.match(cacheKey);
    
    if (cachedResponse) {
      console.log('Serving cached response for:', request.url);
      return cachedResponse;
    }
    
    // No cached response available
    return new Response(JSON.stringify({
      error: 'Network error and no cached data available',
      url: request.url
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * Generate cache key for ERDDAP requests
 * Extracts zone and time range from URL
 * @param {string} url - Request URL
 * @returns {string}
 */
function generateCacheKey(url) {
  try {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;
    
    // Extract time range from URL
    const timeParam = params.get('anom') || params.get('sst') || '';
    
    // Simple hash based on URL
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    return `erddap-${Math.abs(hash).toString(36)}`;
  } catch (error) {
    console.error('Failed to generate cache key:', error);
    return url;
  }
}

/**
 * Message event - Handle messages from client
 */
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Service Worker loaded');
