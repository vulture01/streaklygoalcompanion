import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import CoachPage from '@/pages/CoachPage';

export function CoachFab() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Hide on the standalone Coach route to avoid double UI
  if (pathname.startsWith('/coach')) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI Coach"
        className="fixed right-4 z-50 w-14 h-14 rounded-full gradient-primary shadow-lg shadow-primary/30 flex items-center justify-center tap-target hover:scale-105 active:scale-95 transition-transform"
        style={{
          bottom: 'calc(var(--safe-bottom) + 80px)',
        }}
      >
        <Sparkles size={24} className="text-primary-foreground" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="p-0 w-full sm:max-w-full lg:max-w-md border-l border-border bg-background flex flex-col h-full"
        >
          <CoachPage embedded onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <style>{`
        @media (min-width: 1024px) {
          .coach-fab-desktop-offset { bottom: 1.5rem !important; }
        }
      `}</style>
    </>
  );
}
