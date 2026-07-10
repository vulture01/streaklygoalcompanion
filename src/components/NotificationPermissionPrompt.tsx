import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STORAGE_KEY = 'reminder-permission-prompted';

export function NotificationPermissionPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    const alreadyPrompted = localStorage.getItem(STORAGE_KEY) === '1';
    if (alreadyPrompted) return;
    if (Notification.permission !== 'default') {
      localStorage.setItem(STORAGE_KEY, '1');
      return;
    }
    // Delay slightly to avoid interrupting first render
    const t = setTimeout(() => setShow(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  };

  const handleAllow = async () => {
    try {
      await Notification.requestPermission();
    } catch (e) {
      console.error(e);
    } finally {
      finish();
    }
  };

  return (
    <AnimatePresence>
      {show && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={finish}
          />
          <motion.div
            role="dialog"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed z-[70] left-1/2 -translate-x-1/2 bg-card border border-border rounded-2xl shadow-2xl w-[calc(100%-2rem)] max-w-sm p-5"
            style={{ bottom: 'calc(var(--safe-bottom) + var(--nav-height) + 16px)' }}
          >
            <button
              onClick={finish}
              aria-label="Dismiss"
              className="absolute top-3 right-3 text-muted-foreground tap-target flex items-center justify-center"
            >
              <X size={18} />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center shrink-0">
                <Bell size={20} className="text-primary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-foreground">
                  Enable reminders for your goals?
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Get a gentle nudge at your chosen time so you never break a streak.
                </p>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={finish}
                className="flex-1 py-2.5 rounded-lg bg-secondary text-secondary-foreground text-sm font-medium tap-target"
              >
                Not now
              </button>
              <button
                onClick={handleAllow}
                className="flex-1 py-2.5 rounded-lg gradient-primary text-primary-foreground text-sm font-semibold tap-target"
              >
                Allow
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
