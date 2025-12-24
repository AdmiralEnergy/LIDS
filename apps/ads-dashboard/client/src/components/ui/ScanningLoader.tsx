import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ScanningLoaderProps {
  className?: string;
  text?: string;
}

export function ScanningLoader({ className, text = 'SCANNING SYSTEMS' }: ScanningLoaderProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4', className)}>
      <div className="relative w-64 h-1 bg-black/40 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 w-1/3"
          style={{
            background: 'linear-gradient(90deg, transparent, hsl(180 100% 50%), transparent)',
          }}
          animate={{
            x: ['-100%', '400%'],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.2), transparent)',
          }}
        />
      </div>
      <motion.span
        className="text-xs font-mono tracking-[0.2em] text-cyan-400/60"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        {text}
      </motion.span>
    </div>
  );
}

export function FullPageLoader({ text = 'INITIALIZING SYSTEMS' }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]">
      <div className="flex flex-col items-center gap-8">
        <motion.div
          className="w-20 h-20 rounded-full border border-cyan-500/30"
          style={{
            boxShadow: '0 0 40px rgba(0, 255, 255, 0.2), inset 0 0 20px rgba(0, 255, 255, 0.1)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            borderColor: ['rgba(0, 255, 255, 0.3)', 'rgba(0, 255, 255, 0.6)', 'rgba(0, 255, 255, 0.3)'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          <motion.div
            className="w-full h-full rounded-full"
            style={{
              background: 'conic-gradient(from 0deg, transparent 0%, rgba(0, 255, 255, 0.4) 25%, transparent 50%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
        <ScanningLoader text={text} />
      </div>
    </div>
  );
}
