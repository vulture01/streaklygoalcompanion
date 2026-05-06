import { useEffect, useState } from 'react';
import { X, Share, Plus, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_DAYS = 7;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
}
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone === true;
}

export function PWAPrompts() {
  const [deferred, setDeferred] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [iosShow, setIosShow] = useState(false);
  const [offline, setOffline] = useState(typeof navigator !== 'undefined' && !navigator.onLine);

  useEffect(() => {
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) || 0);
    const recentlyDismissed = dismissedAt && (Date.now() - dismissedAt) < DISMISS_DAYS * 86400_000;
    if (isStandalone() || recentlyDismissed) return;

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onBIP);

    const t = setTimeout(() => {
      if (isStandalone()) return;
      if (isIOS()) setIosShow(true);
      else setShow(true);
    }, 30_000);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBIP);
      clearTimeout(t);
    };
  }, []);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
    setIosShow(false);
  };

  const install = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
    setShow(false);
  };

  return (
    <>
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-warning/90 text-background text-xs font-medium py-1.5 px-4 flex items-center justify-center gap-2"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 6px)' }}>
          <WifiOff size={14} />
          You are offline — some features may be unavailable
        </div>
      )}

      {show && (
        <div className="fixed left-3 right-3 z-[55] bg-card border border-border rounded-2xl p-4 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-4"
          style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 12px)' }}>
          <img src="/icon-96.png" alt="" width={44} height={44} className="rounded-xl" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Install Goal Companion</p>
            <p className="text-xs text-muted-foreground">Add to your home screen for quick access.</p>
          </div>
          <Button size="sm" onClick={install} disabled={!deferred} className="gradient-primary text-white">Install</Button>
          <button onClick={dismiss} aria-label="Dismiss" className="text-muted-foreground p-1"><X size={18} /></button>
        </div>
      )}

      {iosShow && (
        <div className="fixed left-3 right-3 z-[55] bg-card border border-border rounded-2xl p-4 shadow-2xl animate-in slide-in-from-bottom-4"
          style={{ bottom: 'calc(var(--nav-height) + var(--safe-bottom) + 12px)' }}>
          <div className="flex items-start gap-3">
            <img src="/icon-96.png" alt="" width={44} height={44} className="rounded-xl" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Add to Home Screen</p>
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 flex-wrap">
                Tap <Share size={14} className="inline" /> then <Plus size={14} className="inline" /> Add to Home Screen
              </p>
            </div>
            <button onClick={dismiss} aria-label="Dismiss" className="text-muted-foreground p-1"><X size={18} /></button>
          </div>
        </div>
      )}
    </>
  );
}
