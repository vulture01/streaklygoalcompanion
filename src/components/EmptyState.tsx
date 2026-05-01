import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  emoji?: string;
  icon?: ReactNode;
  title: string;
  description?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

export function EmptyState({ emoji, icon, title, description, ctaLabel, onCta }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center text-center py-16 px-6"
    >
      <div className="w-20 h-20 rounded-full bg-muted/40 flex items-center justify-center mb-4">
        {icon ?? <span className="text-4xl">{emoji ?? '✨'}</span>}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground max-w-xs mb-5">{description}</p>
      )}
      {ctaLabel && onCta && (
        <button
          onClick={onCta}
          className="px-5 py-2.5 rounded-lg gradient-primary text-primary-foreground font-medium text-sm tap-target"
        >
          {ctaLabel}
        </button>
      )}
    </motion.div>
  );
}
