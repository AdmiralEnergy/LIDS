import { motion, AnimatePresence } from 'framer-motion';

interface XPFloaterProps {
  recentXpGain: { amount: number; id: number } | null;
}

export function XPFloater({ recentXpGain }: XPFloaterProps) {
  return (
    <AnimatePresence>
      {recentXpGain && (
        <motion.div
          key={recentXpGain.id}
          data-testid="xp-floater"
          initial={{ opacity: 1, y: 0, scale: 1 }}
          animate={{ opacity: 0, y: -60, scale: 1.3 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.8, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            right: 24,
            bottom: 100,
            color: '#c9a648',
            fontWeight: 'bold',
            fontSize: '1.5rem',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            zIndex: 9999,
            pointerEvents: 'none',
          }}
        >
          +{recentXpGain.amount} XP
        </motion.div>
      )}
    </AnimatePresence>
  );
}
