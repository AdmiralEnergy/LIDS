import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface GlassCardProps extends HTMLMotionProps<'div'> {
  children: React.ReactNode;
  className?: string;
  glowColor?: 'cyan' | 'magenta' | 'lime' | 'amber' | 'none';
  pulse?: boolean;
}

const glowColors = {
  cyan: 'rgba(0, 255, 255, 0.15)',
  magenta: 'rgba(255, 0, 128, 0.15)',
  lime: 'rgba(0, 255, 0, 0.15)',
  amber: 'rgba(255, 191, 0, 0.15)',
  none: 'transparent',
};

export function GlassCard({
  children,
  className,
  glowColor = 'none',
  pulse = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(
        'relative overflow-hidden rounded-xl',
        'bg-[rgba(10,10,10,0.6)] backdrop-blur-xl',
        'border border-[rgba(255,255,255,0.08)]',
        pulse && 'pulse-success',
        className
      )}
      style={{
        boxShadow: glowColor !== 'none' 
          ? `0 0 40px ${glowColors[glowColor]}, 0 8px 32px rgba(0,0,0,0.4)` 
          : '0 8px 32px rgba(0,0,0,0.4)',
      }}
      {...props}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.15) 50%, transparent 100%)',
        }}
      />
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
}
