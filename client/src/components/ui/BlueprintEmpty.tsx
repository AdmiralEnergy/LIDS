import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface BlueprintEmptyProps {
  title?: string;
  description?: string;
  className?: string;
  icon?: React.ReactNode;
}

export function BlueprintEmpty({
  title = 'No Data Available',
  description = 'Configure your system to begin analysis',
  className,
  icon,
}: BlueprintEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8',
        className
      )}
    >
      <div className="relative mb-6">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          className="opacity-40"
        >
          <defs>
            <pattern
              id="blueprint-grid"
              patternUnits="userSpaceOnUse"
              width="10"
              height="10"
            >
              <path
                d="M 10 0 L 0 0 0 10"
                fill="none"
                stroke="rgba(0, 255, 255, 0.2)"
                strokeWidth="0.5"
              />
            </pattern>
          </defs>
          <rect width="120" height="120" fill="url(#blueprint-grid)" rx="8" />
          <circle
            cx="60"
            cy="60"
            r="35"
            stroke="rgba(0, 255, 255, 0.3)"
            strokeWidth="1"
            strokeDasharray="4 4"
            fill="none"
          />
          <circle
            cx="60"
            cy="60"
            r="25"
            stroke="rgba(0, 255, 255, 0.2)"
            strokeWidth="1"
            fill="none"
          />
          <line
            x1="20"
            y1="60"
            x2="40"
            y2="60"
            stroke="rgba(0, 255, 255, 0.3)"
            strokeWidth="1"
          />
          <line
            x1="80"
            y1="60"
            x2="100"
            y2="60"
            stroke="rgba(0, 255, 255, 0.3)"
            strokeWidth="1"
          />
          <line
            x1="60"
            y1="20"
            x2="60"
            y2="40"
            stroke="rgba(0, 255, 255, 0.3)"
            strokeWidth="1"
          />
          <line
            x1="60"
            y1="80"
            x2="60"
            y2="100"
            stroke="rgba(0, 255, 255, 0.3)"
            strokeWidth="1"
          />
          <motion.circle
            cx="60"
            cy="60"
            r="5"
            fill="rgba(0, 255, 255, 0.5)"
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </svg>
        {icon && (
          <div className="absolute inset-0 flex items-center justify-center">
            {icon}
          </div>
        )}
      </div>
      <h3 className="text-lg font-display text-white/80 mb-2 tracking-wide">
        {title}
      </h3>
      <p className="text-sm text-white/40 text-center max-w-xs font-mono">
        {description}
      </p>
      <div className="mt-6 flex items-center gap-2 text-xs text-cyan-500/50 font-mono">
        <motion.span
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          ●
        </motion.span>
        <span>AWAITING INPUT</span>
      </div>
    </motion.div>
  );
}
