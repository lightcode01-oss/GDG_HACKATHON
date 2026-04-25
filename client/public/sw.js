// Service Worker disabled to prevent caching issues
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => {
  self.clients.claim();
  console.log('[SYSTEM]: SW Deactivated');
});
