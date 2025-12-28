import { useEffect, useRef, useState } from 'react';
import { Compass } from 'lucide-react';

interface Petal {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  fallSpeed: number;
  swayOffset: number;
  swaySpeed: number;
  opacity: number;
  color: string;
}

const COLORS = {
  roseGold: '#B76E79',
  gold: '#D4AF37',
  blush: '#E8B4BC',
  champagne: '#F5E6D3',
  cream: '#FFF8F0',
};

export function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setFadeOut(true), 300);
          setTimeout(() => onComplete(), 1000);
          return 100;
        }
        return prev + Math.random() * 15 + 5;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const petals: Petal[] = [];
    const petalColors = [COLORS.roseGold, COLORS.gold, COLORS.blush, COLORS.champagne];

    for (let i = 0; i < 60; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 15 + 8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 4,
        fallSpeed: Math.random() * 1.5 + 0.5,
        swayOffset: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
        opacity: Math.random() * 0.6 + 0.4,
        color: petalColors[Math.floor(Math.random() * petalColors.length)],
      });
    }

    const drawPetal = (petal: Petal, time: number) => {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate((petal.rotation * Math.PI) / 180);
      ctx.globalAlpha = petal.opacity;

      const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, petal.size);
      gradient.addColorStop(0, petal.color);
      gradient.addColorStop(0.7, petal.color + 'CC');
      gradient.addColorStop(1, petal.color + '00');

      ctx.beginPath();
      ctx.ellipse(0, 0, petal.size * 0.4, petal.size, 0, 0, Math.PI * 2);
      ctx.fillStyle = gradient;
      ctx.fill();

      const shimmer = Math.sin(time * 0.003 + petal.swayOffset) * 0.2 + 0.8;
      ctx.globalAlpha = petal.opacity * shimmer * 0.3;
      ctx.beginPath();
      ctx.ellipse(-petal.size * 0.1, -petal.size * 0.3, petal.size * 0.15, petal.size * 0.4, 0.3, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.cream;
      ctx.fill();

      ctx.restore();
    };

    let animationId: number;
    let time = 0;

    const animate = () => {
      time++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const ambientGradient = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height);
      ambientGradient.addColorStop(0, 'transparent');
      ambientGradient.addColorStop(1, 'rgba(183, 110, 121, 0.1)');
      ctx.fillStyle = ambientGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      petals.forEach((petal) => {
        petal.x += Math.sin(time * petal.swaySpeed + petal.swayOffset) * 0.8;
        petal.y += petal.fallSpeed;
        petal.rotation += petal.rotationSpeed;

        if (petal.y > canvas.height + 50) {
          petal.y = -50;
          petal.x = Math.random() * canvas.width;
        }

        drawPetal(petal, time);
      });

      for (let i = 0; i < 25; i++) {
        const sparkX = (Math.sin(time * 0.01 + i * 0.5) * 0.5 + 0.5) * canvas.width;
        const sparkY = (Math.cos(time * 0.008 + i * 0.7) * 0.5 + 0.5) * canvas.height;
        const sparkSize = Math.sin(time * 0.05 + i) * 1.5 + 2;
        const sparkAlpha = Math.sin(time * 0.03 + i * 0.3) * 0.3 + 0.3;

        const sparkGradient = ctx.createRadialGradient(sparkX, sparkY, 0, sparkX, sparkY, sparkSize * 3);
        sparkGradient.addColorStop(0, `rgba(212, 175, 55, ${sparkAlpha})`);
        sparkGradient.addColorStop(0.5, `rgba(212, 175, 55, ${sparkAlpha * 0.3})`);
        sparkGradient.addColorStop(1, 'transparent');

        ctx.beginPath();
        ctx.arc(sparkX, sparkY, sparkSize * 3, 0, Math.PI * 2);
        ctx.fillStyle = sparkGradient;
        ctx.fill();
      }

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 ${fadeOut ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}
      style={{
        background: 'linear-gradient(135deg, #1a1510 0%, #2d1f1a 50%, #1a0f0a 100%)',
      }}
    >
      <canvas ref={canvasRef} className="absolute inset-0" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative mb-8 animate-float">
          <div
            className="absolute inset-0 blur-2xl"
            style={{
              background: `radial-gradient(circle, ${COLORS.roseGold}60 0%, transparent 70%)`,
              transform: 'scale(2)',
            }}
          />
          <div
            className="relative w-24 h-24 rounded-2xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${COLORS.roseGold} 0%, ${COLORS.gold} 50%, ${COLORS.roseGold} 100%)`,
              boxShadow: `0 0 60px ${COLORS.roseGold}80, inset 0 1px 0 rgba(255,255,255,0.3)`,
            }}
          >
            <Compass className="w-12 h-12 text-white drop-shadow-lg" style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }} />
          </div>
        </div>

        <h1
          className="text-5xl font-light tracking-[0.3em] mb-3"
          style={{
            color: COLORS.champagne,
            textShadow: `0 0 40px ${COLORS.roseGold}80, 0 0 80px ${COLORS.gold}40`,
            fontFamily: "Georgia, serif",
          }}
        >
          COMPASS
        </h1>

        <p
          className="text-sm tracking-[0.2em] uppercase mb-12"
          style={{ color: `${COLORS.roseGold}99` }}
        >
          Marketing Creative Suite
        </p>

        <div className="relative w-64">
          <div
            className="h-0.5 rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          >
            <div
              className="h-full transition-all duration-300 ease-out"
              style={{
                width: `${Math.min(loadingProgress, 100)}%`,
                background: `linear-gradient(90deg, ${COLORS.roseGold}, ${COLORS.gold}, ${COLORS.roseGold})`,
                boxShadow: `0 0 20px ${COLORS.gold}`,
              }}
            />
          </div>

          <p
            className="text-center mt-4 text-xs tracking-widest"
            style={{ color: 'rgba(255,255,255,0.4)' }}
          >
            {loadingProgress < 100 ? 'Preparing your experience...' : 'Welcome'}
          </p>
        </div>
      </div>

      <div className="absolute top-8 left-8 w-16 h-16 opacity-20">
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M0 100 Q0 0 100 0" stroke={COLORS.gold} strokeWidth="1" fill="none" />
          <circle cx="100" cy="0" r="3" fill={COLORS.gold} />
        </svg>
      </div>
      <div className="absolute top-8 right-8 w-16 h-16 opacity-20 rotate-90">
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M0 100 Q0 0 100 0" stroke={COLORS.gold} strokeWidth="1" fill="none" />
          <circle cx="100" cy="0" r="3" fill={COLORS.gold} />
        </svg>
      </div>
      <div className="absolute bottom-8 left-8 w-16 h-16 opacity-20 -rotate-90">
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M0 100 Q0 0 100 0" stroke={COLORS.gold} strokeWidth="1" fill="none" />
          <circle cx="100" cy="0" r="3" fill={COLORS.gold} />
        </svg>
      </div>
      <div className="absolute bottom-8 right-8 w-16 h-16 opacity-20 rotate-180">
        <svg viewBox="0 0 100 100" fill="none">
          <path d="M0 100 Q0 0 100 0" stroke={COLORS.gold} strokeWidth="1" fill="none" />
          <circle cx="100" cy="0" r="3" fill={COLORS.gold} />
        </svg>
      </div>

      <div className="absolute bottom-6 text-center">
        <p
          className="text-xs tracking-widest"
          style={{ color: 'rgba(183, 110, 121, 0.4)' }}
        >
          ADMIRAL ENERGY
        </p>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
