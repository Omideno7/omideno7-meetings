export const pwaService = {
  async registerServiceWorker(): Promise<void> {
    if (!("serviceWorker" in navigator)) return;

    try {
      await navigator.serviceWorker.register("/sw.js");
      console.info("[OmideNo7 PWA] Service worker registered.");
    } catch (error) {
      console.warn("[OmideNo7 PWA] Service worker registration failed.", error);
    }
  },

  isStandalone(): boolean {
    return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
  },

  getPlatform(): "ios" | "android" | "desktop" {
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) return "ios";
    if (/android/.test(ua)) return "android";
    return "desktop";
  }
};
