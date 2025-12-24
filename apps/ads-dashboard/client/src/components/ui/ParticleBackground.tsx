import { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  jitter: number;
}

interface Arc {
  from: number;
  to: number;
  progress: number;
  opacity: number;
}

export function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const arcsRef = useRef<Arc[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animationRef = useRef<number>();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const colors = ['#00ffff', '#00b4d8', '#ffd700', '#48cae4'];
    
    particlesRef.current = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      jitter: Math.random() * 2,
    }));

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const createArc = () => {
      if (particlesRef.current.length < 2) return;
      const from = Math.floor(Math.random() * particlesRef.current.length);
      let to = Math.floor(Math.random() * particlesRef.current.length);
      while (to === from) {
        to = Math.floor(Math.random() * particlesRef.current.length);
      }
      
      const p1 = particlesRef.current[from];
      const p2 = particlesRef.current[to];
      const dist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      
      if (dist < 200) {
        arcsRef.current.push({ from, to, progress: 0, opacity: 1 });
      }
    };

    const arcInterval = setInterval(createArc, 2000);

    const animate = () => {
      if (!ctx || !canvas) return;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const gridSize = 20;
      const parallaxX = (mouseRef.current.x / canvas.width - 0.5) * 5;
      const parallaxY = (mouseRef.current.y / canvas.height - 0.5) * 5;

      ctx.strokeStyle = 'rgba(0, 255, 255, 0.03)';
      ctx.lineWidth = 0.5;
      
      for (let x = parallaxX % gridSize; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = parallaxY % gridSize; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      particlesRef.current.forEach((p) => {
        p.x += p.vx + (Math.random() - 0.5) * p.jitter * 0.1;
        p.y += p.vy + (Math.random() - 0.5) * p.jitter * 0.1;

        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      arcsRef.current = arcsRef.current.filter((arc) => {
        arc.progress += 0.05;
        arc.opacity = 1 - arc.progress;

        if (arc.opacity <= 0) return false;

        const p1 = particlesRef.current[arc.from];
        const p2 = particlesRef.current[arc.to];

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.strokeStyle = `rgba(0, 255, 255, ${arc.opacity * 0.4})`;
        ctx.lineWidth = 1;
        ctx.shadowColor = '#00ffff';
        ctx.shadowBlur = 10;
        ctx.stroke();
        ctx.shadowBlur = 0;

        return true;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      clearInterval(arcInterval);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none',
      }}
    />
  );
}
