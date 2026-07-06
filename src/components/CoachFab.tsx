import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import CoachPage from '@/pages/CoachPage';

export function CoachFab() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  // Hide on the standalone Coach route to avoid duplicate UI
  if (pathname.startsWith('/coach')) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI Coach"
        className="fixed right-4 lg:right-6 bottom-[calc(var(--safe-bottom)+80px)] lg:bottom-6 z-50 w-14 h-14 rounded-full gradient-primary shadow-lg shadow-primary/30 flex items-center justify-center tap-target hover:scale-105 active:scale-95 transition-transform"
      >
        <Sparkles size={24} className="text-primary-foreground" />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="p-0 w-full sm:max-w-full lg:max-w-md border-l border-border bg-background flex flex-col h-full overflow-hidden"
        >
          <CoachPage embedded onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
