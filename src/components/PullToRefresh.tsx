import { useRef, useState, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
  onRefresh: () => Promise<unknown> | void;
  children: ReactNode;
  threshold?: number;
}

/**
 * Mobile pull-to-refresh wrapper. Activates only when the page is scrolled to the top
 * and the user pulls down with a touch gesture. No-op on desktop.
 */
export function PullToRefresh({ onRefresh, children, threshold = 70 }: Props) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (startY.current == null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, threshold * 1.5));
  };

  const onTouchEnd = async () => {
    if (startY.current == null) return;
    startY.current = null;
    if (pull >= threshold && !refreshing) {
      setRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  const indicatorOpacity = Math.min(pull / threshold, 1);

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ transform: `translateY(${refreshing ? threshold * 0.6 : pull}px)`, transition: refreshing || pull === 0 ? 'transform 0.25s ease' : 'none' }}
    >
      <div
        className="flex items-center justify-center h-12 -mt-12 text-muted-foreground"
        style={{ opacity: indicatorOpacity }}
      >
        <Loader2 size={18} className={refreshing ? 'animate-spin' : ''} />
      </div>
      {children}
    </div>
  );
}
