/**
 * PWA utilities for service worker registration and update handling
 */

let updateAvailable = false;
let registration = null;

/**
 * Register service worker
 * @returns {Promise<ServiceWorkerRegistration|void>}
 */
export async function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        type: 'module'
      });
      
      console.log('ServiceWorker registration successful');
      
      // Check for updates
      setupUpdateCheck();
      
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
  return null;
}

/**
 * Setup periodic update checks
 */
function setupUpdateCheck() {
  if (!registration) return;

  // Check for updates every hour
  setInterval(() => {
    checkForUpdates();
  }, 60 * 60 * 1000);

  // Initial check
  checkForUpdates();
}

/**
 * Check for service worker updates
 */
async function checkForUpdates() {
  if (!registration) return;

  try {
    const response = await fetch('/version.json?t=' + Date.now());
    if (response.ok) {
      const versionData = await response.json();
      const currentVersion = localStorage.getItem('app-version');
      
      if (currentVersion !== versionData.version) {
        updateAvailable = true;
        console.log('New version available:', versionData.version);
      }
    }
  } catch (error) {
    console.error('Update check failed:', error);
  }
}

/**
 * Get update availability status
 * @returns {boolean}
 */
export function isUpdateAvailable() {
  return updateAvailable;
}

/**
 * Reload page to apply update
 */
export function reloadForUpdate() {
  if (updateAvailable && registration && registration.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  }
}

/**
 * Check if app is running as PWA
 * @returns {boolean}
 */
export function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: webapp)').matches ||
         window.matchMedia('(display-mode: pwa)').matches;
}

/**
 * Check if online
 * @returns {boolean}
 */
export function isOnline() {
  return navigator.onLine;
}

/**
 * Request notification permission
 * @returns {Promise<string>}
 */
export async function requestNotificationPermission() {
  if ('Notification' in window) {
    const permission = await Notification.requestPermission();
    return permission;
  }
  return 'denied';
}

/**
 * Show notification
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 */
export function showNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/pwa-192x192.png',
      ...options
    });
  }
}

export default {
  registerServiceWorker,
  isUpdateAvailable,
  reloadForUpdate,
  isPWA,
  isOnline,
  requestNotificationPermission,
  showNotification
};
