// PWA service worker registration with iframe/preview guard
const isInIframe = (() => {
  try { return window.self !== window.top; } catch { return true; }
})();
const host = window.location.hostname;
const isPreviewHost =
  host.includes('id-preview--') ||
  host.includes('lovableproject.com') ||
  host.includes('lovable.app') && host.includes('id-preview');

export async function registerPWA() {
  if (!('serviceWorker' in navigator)) return;
  if (isInIframe || isPreviewHost) {
    const regs = await navigator.serviceWorker.getRegistrations();
    regs.forEach(r => r.unregister());
    return;
  }
  try {
    const { registerSW } = await import('virtual:pwa-register');
    registerSW({ immediate: true });
  } catch {
    // ignore
  }
}
