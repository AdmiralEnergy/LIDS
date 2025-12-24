import { motion } from 'framer-motion';

interface AnimatedADSLogoProps {
  size?: number;
}

export function AnimatedADSLogo({ size = 40 }: AnimatedADSLogoProps) {
  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{
        width: size,
        height: size,
      }}
    >
      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #00ffff 0%, #0088aa 100%)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)',
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(0, 255, 255, 0.4)',
            '0 0 35px rgba(0, 255, 255, 0.6)',
            '0 0 20px rgba(0, 255, 255, 0.4)',
          ],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
        }}
        animate={{
          x: ['-100%', '200%'],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 2,
        }}
      />

      <motion.div
        className="absolute"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          border: '1px solid rgba(0, 255, 255, 0.3)',
          borderRadius: '50%',
        }}
        animate={{
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      <span
        className="relative z-10 font-bold tracking-wider"
        style={{
          fontSize: size * 0.32,
          color: '#050505',
          fontFamily: 'var(--font-mono)',
          textShadow: '0 1px 2px rgba(0,0,0,0.3)',
        }}
      >
        ADS
      </span>

      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2"
        style={{
          width: '60%',
          height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.8), transparent)',
        }}
        animate={{
          opacity: [0.5, 1, 0.5],
          scaleX: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}
