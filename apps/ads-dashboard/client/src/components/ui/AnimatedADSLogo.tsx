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
        className="absolute rounded-xl"
        style={{
          width: size * 1.4,
          height: size * 1.4,
          background: 'radial-gradient(circle, rgba(0, 255, 255, 0.15) 0%, transparent 70%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.6, 0.2, 0.6],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <motion.div
        className="absolute rounded-xl"
        style={{
          width: size * 1.2,
          height: size * 1.2,
          background: 'radial-gradient(circle, rgba(0, 255, 255, 0.1) 0%, transparent 60%)',
        }}
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.5,
        }}
      />

      <motion.div
        className="absolute inset-0 rounded-xl"
        style={{
          background: 'linear-gradient(135deg, #00ffff 0%, #0088aa 100%)',
          boxShadow: '0 0 20px rgba(0, 255, 255, 0.4)',
        }}
        animate={{
          boxShadow: [
            '0 0 15px rgba(0, 255, 255, 0.3)',
            '0 0 25px rgba(0, 255, 255, 0.5)',
            '0 0 15px rgba(0, 255, 255, 0.3)',
          ],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      <motion.div
        className="absolute inset-0 rounded-xl overflow-hidden"
        initial={{ x: '-100%' }}
        animate={{ x: '200%' }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          repeatDelay: 3,
        }}
      >
        <div
          style={{
            width: '50%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)',
          }}
        />
      </motion.div>

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
    </motion.div>
  );
}
