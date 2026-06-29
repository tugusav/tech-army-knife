// This service worker only exists to unregister itself.
// We removed the SW because the cache-first strategy caused white screens
// on every new deployment (stale index.html referencing dead asset hashes).
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', () => {
  self.registration.unregister();
});
