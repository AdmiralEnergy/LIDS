import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, subtitle, className, children }: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'flex items-center justify-between mb-8',
        className
      )}
    >
      <div className="relative">
        <motion.div
          className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full"
          style={{
            background: 'linear-gradient(180deg, #00ffff 0%, transparent 100%)',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.5)',
          }}
          animate={{
            opacity: [0.5, 1, 0.5],
            height: ['60%', '100%', '60%'],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        
        <motion.h1
          className="text-2xl md:text-3xl font-display font-semibold tracking-wide"
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, rgba(255,255,255,0.8) 50%, #00ffff 100%)',
            backgroundSize: '200% 100%',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {title}
        </motion.h1>
        
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xs font-mono text-white/40 tracking-widest uppercase mt-1"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
      
      {children && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}
