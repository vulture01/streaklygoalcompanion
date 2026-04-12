import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useTransform, type PanInfo } from 'framer-motion';

interface SwipeableCardProps {
  children: ReactNode;
  onSwipeRight?: () => void;
  onSwipeLeft?: () => void;
  rightLabel?: string;
  leftLabel?: string;
}

export function SwipeableCard({ children, onSwipeRight, onSwipeLeft, rightLabel = 'Log', leftLabel = 'Pause' }: SwipeableCardProps) {
  const x = useMotionValue(0);
  const bgRight = useTransform(x, [0, 100], ['rgba(34,197,94,0)', 'rgba(34,197,94,0.3)']);
  const bgLeft = useTransform(x, [-100, 0], ['rgba(239,68,68,0.3)', 'rgba(239,68,68,0)']);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > 80 && onSwipeRight) onSwipeRight();
    if (info.offset.x < -80 && onSwipeLeft) onSwipeLeft();
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden rounded-lg">
      {/* Background labels */}
      <motion.div className="absolute inset-0 flex items-center justify-start pl-4 rounded-lg" style={{ background: bgRight }}>
        <span className="text-xs font-medium text-green-400">{rightLabel}</span>
      </motion.div>
      <motion.div className="absolute inset-0 flex items-center justify-end pr-4 rounded-lg" style={{ background: bgLeft }}>
        <span className="text-xs font-medium text-red-400">{leftLabel}</span>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.3}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className="relative z-10"
      >
        {children}
      </motion.div>
    </div>
  );
}
