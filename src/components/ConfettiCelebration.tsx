import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  milestone: number | null;
  onDone: () => void;
}

export function ConfettiCelebration({ milestone, onDone }: Props) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string; delay: number }[]>([]);

  useEffect(() => {
    if (milestone === null) return;
    const colors = ['#7C3AED', '#EC4899', '#F59E0B', '#10B981', '#3B82F6'];
    const p = Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: colors[i % colors.length],
      delay: Math.random() * 0.5,
    }));
    setParticles(p);
    const timer = setTimeout(() => { onDone(); setParticles([]); }, 3000);
    return () => clearTimeout(timer);
  }, [milestone, onDone]);

  return (
    <AnimatePresence>
      {milestone !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
          {/* Confetti particles */}
          {particles.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 1, y: '50vh', x: `${p.x}vw`, scale: 1 }}
              animate={{
                y: [`50vh`, `${p.y - 50}vh`],
                x: [`${p.x}vw`, `${p.x + (Math.random() - 0.5) * 20}vw`],
                opacity: [1, 0],
                rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
              }}
              transition={{ duration: 2, delay: p.delay, ease: 'easeOut' }}
              className="absolute w-3 h-3 rounded-sm"
              style={{ background: p.color }}
            />
          ))}
          {/* Badge announcement */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            exit={{ scale: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-card border border-primary rounded-2xl p-8 text-center glow-violet"
          >
            <div className="text-5xl mb-3">🏆</div>
            <h2 className="text-xl font-bold text-foreground mb-1">{milestone}-Day Streak!</h2>
            <p className="text-sm text-muted-foreground">Badge unlocked!</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
