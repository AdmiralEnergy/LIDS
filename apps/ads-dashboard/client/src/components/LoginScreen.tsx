import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/user-context";
import { AlertCircle, Loader2 } from "lucide-react";

// ============================================
// LAYER 0: NEBULA CLOUDS (slow drifting blobs)
// ============================================
function NebulaClouds() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ zIndex: 0 }}>
      {/* Large gold nebula */}
      <div
        className="absolute"
        style={{
          width: "800px",
          height: "800px",
          top: "-20%",
          left: "-10%",
          background: "radial-gradient(ellipse, rgba(201, 166, 72, 0.15) 0%, transparent 60%)",
          filter: "blur(60px)",
          animation: "nebulaFloat1 20s ease-in-out infinite",
        }}
      />
      {/* Blue nebula */}
      <div
        className="absolute"
        style={{
          width: "600px",
          height: "600px",
          bottom: "-10%",
          right: "-15%",
          background: "radial-gradient(ellipse, rgba(30, 80, 140, 0.2) 0%, transparent 60%)",
          filter: "blur(50px)",
          animation: "nebulaFloat2 25s ease-in-out infinite",
        }}
      />
      {/* Small gold accent */}
      <div
        className="absolute"
        style={{
          width: "400px",
          height: "400px",
          top: "40%",
          right: "20%",
          background: "radial-gradient(ellipse, rgba(201, 166, 72, 0.12) 0%, transparent 50%)",
          filter: "blur(40px)",
          animation: "nebulaFloat3 18s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ============================================
// LAYER 1: STAR FIELD (more visible)
// ============================================
function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationId: number;
    const stars: Array<{ x: number; y: number; size: number; speed: number; opacity: number; twinkle: number }> = [];
    const shootingStars: Array<{ x: number; y: number; length: number; speed: number; opacity: number; active: boolean }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // More stars, more visible
    const starCount = Math.floor((canvas.width * canvas.height) / 4000);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        opacity: Math.random() * 0.6 + 0.4,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // More frequent shooting stars
    let lastShootingStar = 0;
    const spawnShootingStar = (time: number) => {
      if (time - lastShootingStar > 3000 + Math.random() * 5000) {
        shootingStars.push({
          x: Math.random() * canvas.width * 0.6,
          y: Math.random() * canvas.height * 0.4,
          length: 100 + Math.random() * 150,
          speed: 12 + Math.random() * 8,
          opacity: 1,
          active: true,
        });
        lastShootingStar = time;
      }
    };

    let time = 0;
    const animate = (timestamp: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;

      // Draw stars with twinkle
      stars.forEach((star) => {
        if (!prefersReducedMotion) {
          star.x -= star.speed;
          if (star.x < 0) star.x = canvas.width;
          star.twinkle += 0.05;
        }

        const twinkleOpacity = star.opacity * (0.7 + 0.3 * Math.sin(star.twinkle));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
        ctx.fill();
      });

      // Shooting stars - brighter
      if (!prefersReducedMotion) {
        spawnShootingStar(timestamp);
        shootingStars.forEach((ss) => {
          if (!ss.active) return;

          ss.x += ss.speed;
          ss.y += ss.speed * 0.5;
          ss.opacity -= 0.012;

          if (ss.opacity <= 0 || ss.x > canvas.width) {
            ss.active = false;
            return;
          }

          const gradient = ctx.createLinearGradient(
            ss.x - ss.length, ss.y - ss.length * 0.5,
            ss.x, ss.y
          );
          gradient.addColorStop(0, "transparent");
          gradient.addColorStop(0.5, `rgba(201, 166, 72, ${ss.opacity * 0.5})`);
          gradient.addColorStop(1, `rgba(255, 220, 150, ${ss.opacity})`);

          ctx.beginPath();
          ctx.moveTo(ss.x - ss.length, ss.y - ss.length * 0.5);
          ctx.lineTo(ss.x, ss.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.stroke();
        });
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 1 }} />;
}

// ============================================
// LAYER 2: EMBER PARTICLES - CRANKED UP
// ============================================
function EmberParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let animationId: number;
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 80 : 150; // CRANKED: was 40/80

    interface Ember {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      maxOpacity: number;
      wobbleOffset: number;
      wobbleSpeed: number;
      wobbleAmount: number;
    }

    const embers: Ember[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create embers - BIGGER and FASTER - SPREAD ACROSS SCREEN
    for (let i = 0; i < particleCount; i++) {
      const startY = Math.random() * canvas.height; // Spread across full height
      embers.push({
        x: Math.random() * canvas.width,
        y: startY,
        size: Math.random() * 5 + 3, // 3-8px
        speedY: -(Math.random() * 2.5 + 1.5), // 1.5-4px per frame
        speedX: (Math.random() - 0.5) * 0.8,
        opacity: startY > canvas.height * 0.3 ? Math.random() * 0.5 + 0.5 : 0, // Start visible if in lower 70%
        maxOpacity: Math.random() * 0.4 + 0.6, // 0.6-1.0
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.08 + 0.04,
        wobbleAmount: Math.random() * 2 + 1,
      });
    }

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      embers.forEach((ember) => {
        // Move upward with sine wave drift
        ember.y += ember.speedY;
        ember.x += ember.speedX + Math.sin(time * ember.wobbleSpeed + ember.wobbleOffset) * ember.wobbleAmount;

        // Fade in quickly, fade out at top
        const normalizedY = ember.y / canvas.height;
        if (normalizedY > 0.7) {
          ember.opacity = Math.min(ember.opacity + 0.05, ember.maxOpacity);
        } else if (normalizedY < 0.15) {
          ember.opacity = Math.max(ember.opacity - 0.03, 0);
        }

        // Reset when off screen
        if (ember.y < -30 || ember.opacity <= 0) {
          ember.y = canvas.height + 30 + Math.random() * 50;
          ember.x = Math.random() * canvas.width;
          ember.opacity = 0;
        }

        // Draw ember with BIGGER glow
        const glowSize = ember.size * 4;
        const gradient = ctx.createRadialGradient(
          ember.x, ember.y, 0,
          ember.x, ember.y, glowSize
        );
        gradient.addColorStop(0, `rgba(255, 220, 120, ${ember.opacity})`);
        gradient.addColorStop(0.3, `rgba(255, 180, 80, ${ember.opacity * 0.7})`);
        gradient.addColorStop(0.6, `rgba(201, 166, 72, ${ember.opacity * 0.4})`);
        gradient.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.arc(ember.x, ember.y, glowSize, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Bright core
        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.size * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 250, 220, ${ember.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} />;
}

// ============================================
// LAYER 3: GOD RAYS - CRANKED UP
// ============================================
function GodRays() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 2 }}>
      {/* Ray 1 - Sweeping left to right */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-300px",
          width: "300px",
          height: "100%",
          background: "linear-gradient(90deg, transparent 0%, rgba(201, 166, 72, 0.3) 50%, transparent 100%)",
          animation: "sweepRay1 5s ease-in-out infinite",
        }}
      />
      {/* Ray 2 - Sweeping right to left */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: "-300px",
          width: "300px",
          height: "100%",
          background: "linear-gradient(90deg, transparent 0%, rgba(201, 166, 72, 0.25) 50%, transparent 100%)",
          animation: "sweepRay2 7s ease-in-out infinite",
        }}
      />
      {/* Ray 3 - Diagonal */}
      <div
        style={{
          position: "absolute",
          top: "-50%",
          left: "30%",
          width: "200px",
          height: "200%",
          background: "linear-gradient(180deg, transparent 0%, rgba(201, 166, 72, 0.2) 50%, transparent 100%)",
          transform: "rotate(20deg)",
          animation: "sweepRay3 8s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ============================================
// NEW: ENERGY PULSE WAVE
// ============================================
function EnergyPulseWave() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 4 }}>
      {/* Pulse ring 1 */}
      <div
        className="absolute rounded-full"
        style={{
          width: "100px",
          height: "100px",
          border: "3px solid rgba(201, 166, 72, 0.4)",
          boxShadow: "0 0 30px rgba(201, 166, 72, 0.3), inset 0 0 30px rgba(201, 166, 72, 0.1)",
          animation: "pulseWave 4s ease-out infinite",
        }}
      />
      {/* Pulse ring 2 - offset */}
      <div
        className="absolute rounded-full"
        style={{
          width: "100px",
          height: "100px",
          border: "2px solid rgba(201, 166, 72, 0.3)",
          boxShadow: "0 0 20px rgba(201, 166, 72, 0.2)",
          animation: "pulseWave 4s ease-out infinite",
          animationDelay: "2s",
        }}
      />
    </div>
  );
}

// ============================================
// LAYER 4 & 5: LOGO WITH ENERGY RING - CRANKED
// ============================================
function AnimatedLogo({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      className="relative flex justify-center mb-6"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1) translateY(0)" : "scale(0.7) translateY(30px)",
        transition: "all 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: "0.1s",
      }}
    >
      {/* Outer glow - BIGGER */}
      <div
        className="absolute"
        style={{
          width: "350px",
          height: "350px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(201, 166, 72, 0.25) 0%, rgba(201, 166, 72, 0.1) 40%, transparent 70%)",
          animation: "energyRingOuter 2s ease-in-out infinite", // CRANKED: was 4s
        }}
      />

      {/* Energy ring - MORE VISIBLE */}
      <div
        className="absolute"
        style={{
          width: "260px",
          height: "260px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          border: "3px solid rgba(201, 166, 72, 0.5)",
          borderRadius: "50%",
          boxShadow: "0 0 60px rgba(201, 166, 72, 0.4), inset 0 0 60px rgba(201, 166, 72, 0.15)",
          animation: "energyRingPulse 2s ease-in-out infinite", // CRANKED: was 3s
        }}
      />

      {/* Rotating arc - FASTER and BRIGHTER */}
      <div
        className="absolute"
        style={{
          width: "280px",
          height: "280px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: "4px solid transparent",
          borderTopColor: "rgba(201, 166, 72, 0.8)",
          borderRightColor: "rgba(201, 166, 72, 0.4)",
          animation: "rotateArc 3s linear infinite", // CRANKED: was 6s
          filter: "blur(1px)",
        }}
      />

      {/* Second rotating arc - opposite direction */}
      <div
        className="absolute"
        style={{
          width: "300px",
          height: "300px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: "2px solid transparent",
          borderBottomColor: "rgba(201, 166, 72, 0.5)",
          borderLeftColor: "rgba(201, 166, 72, 0.2)",
          animation: "rotateArcReverse 5s linear infinite",
        }}
      />

      {/* Logo container - MORE movement */}
      <div
        style={{
          animation: "logoFloat 3s ease-in-out infinite", // CRANKED: was 4s
        }}
      >
        <img
          src="/admiral-logo.png"
          alt="Admiral Energy"
          className="relative w-44 h-44 object-contain"
          style={{
            filter: "drop-shadow(0 0 40px rgba(201, 166, 72, 0.8))", // CRANKED: was 30px/0.6
            animation: "logoGlow 2s ease-in-out infinite", // CRANKED: was 3s
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// LAYER 6: GLASS CARD WITH ROTATING BORDER
// ============================================
function GlassCard({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) {
  return (
    <div
      className="relative"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0) scale(1)" : "translateY(50px) scale(0.95)",
        filter: isVisible ? "blur(0)" : "blur(15px)",
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: "0.4s",
      }}
    >
      {/* Rotating gradient border - MORE VISIBLE */}
      <div
        className="absolute -inset-[3px] rounded-2xl overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute"
          style={{
            top: "-50%",
            left: "-50%",
            width: "200%",
            height: "200%",
            background: "conic-gradient(from 0deg, rgba(201, 166, 72, 0.1) 0%, rgba(201, 166, 72, 0.9) 15%, rgba(255, 220, 150, 0.6) 20%, rgba(201, 166, 72, 0.1) 30%, rgba(201, 166, 72, 0.1) 50%, rgba(201, 166, 72, 0.9) 65%, rgba(255, 220, 150, 0.6) 70%, rgba(201, 166, 72, 0.1) 80%, rgba(201, 166, 72, 0.1) 100%)",
            animation: "rotateBorder 3s linear infinite",
          }}
        />
      </div>

      {/* Card content */}
      <div
        className="relative rounded-2xl p-8 overflow-hidden"
        style={{
          background: "rgba(8, 28, 44, 0.85)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 0 80px rgba(0, 0, 0, 0.6), inset 0 0 80px rgba(201, 166, 72, 0.05)",
          zIndex: 1,
        }}
      >
        {/* Animated noise texture */}
        <div
          className="absolute inset-0 opacity-[0.04] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            animation: "noiseMove 0.3s steps(8) infinite",
          }}
        />

        {/* Inner highlight */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.15), inset 0 0 50px rgba(201, 166, 72, 0.08)",
          }}
        />

        {children}
      </div>
    </div>
  );
}

// ============================================
// LAYER 7: AMBIENT EFFECTS
// ============================================
function AmbientEffects() {
  return (
    <>
      {/* Vignette - stronger */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0, 0, 0, 0.5) 100%)",
          zIndex: 15,
        }}
      />

      {/* Lens flare - more visible */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%",
          right: "15%",
          width: "150px",
          height: "150px",
          background: "radial-gradient(circle, rgba(201, 166, 72, 0.4) 0%, rgba(201, 166, 72, 0.1) 40%, transparent 70%)",
          animation: "lensFlare 6s ease-in-out infinite",
          zIndex: 5,
        }}
      />

      {/* Second lens flare */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "20%",
          left: "10%",
          width: "100px",
          height: "100px",
          background: "radial-gradient(circle, rgba(201, 166, 72, 0.3) 0%, transparent 60%)",
          animation: "lensFlare 8s ease-in-out infinite",
          animationDelay: "3s",
          zIndex: 5,
        }}
      />
    </>
  );
}

// ============================================
// MAIN LOGIN SCREEN
// ============================================
export function LoginScreen() {
  const { loginByEmail } = useUser();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setIsLoading(true);

    const user = await loginByEmail(email.trim().toLowerCase());

    if (!user) {
      setError("Access denied. You must be an Admiral Energy team member.");
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Deep space gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #020508 0%, #061018 30%, #0c2f4a 60%, #061018 100%)",
        }}
      />

      {/* Layer 0: Nebula clouds */}
      <NebulaClouds />

      {/* Layer 1: Star field */}
      <StarField />

      {/* Layer 2: God rays */}
      <GodRays />

      {/* Layer 3: Ember particles */}
      <EmberParticles />

      {/* Energy pulse waves */}
      <EnergyPulseWave />

      {/* Layer 7: Ambient effects */}
      <AmbientEffects />

      {/* Content */}
      <div className="relative z-20 w-full max-w-md px-4">
        {/* Logo with energy ring */}
        <AnimatedLogo isVisible={isVisible} />

        {/* Glass card */}
        <GlassCard isVisible={isVisible}>
          {/* Header */}
          <div className="text-center mb-8 relative">
            <h1
              className="text-2xl font-bold tracking-wider mb-2"
              style={{
                color: "#f7f5f2",
                textShadow: "0 0 40px rgba(201, 166, 72, 0.6)",
                animation: "textGlow 2s ease-in-out infinite",
              }}
            >
              COMMAND CENTER
            </h1>
            <p
              className="text-sm tracking-[0.3em] uppercase"
              style={{ color: "rgba(201, 166, 72, 0.9)" }}
            >
              Admiral Dialer System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6 relative">
            <div
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(15px)",
                transition: "all 0.6s ease-out",
                transitionDelay: "0.6s",
              }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 tracking-wide"
                style={{ color: "rgba(247, 245, 242, 0.8)" }}
              >
                OPERATOR CREDENTIALS
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                  autoFocus
                  className="w-full px-4 py-4 rounded-lg outline-none transition-all duration-300"
                  style={{
                    background: "rgba(0, 0, 0, 0.6)",
                    border: "2px solid rgba(201, 166, 72, 0.3)",
                    color: "#f7f5f2",
                    fontSize: "16px",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(201, 166, 72, 0.8)";
                    e.target.style.boxShadow = "0 0 40px rgba(201, 166, 72, 0.3), inset 0 0 30px rgba(201, 166, 72, 0.08)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(201, 166, 72, 0.3)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                {/* Input glow line */}
                <div
                  className="absolute bottom-0 left-1/2 h-[3px] bg-gradient-to-r from-transparent via-[#c9a648] to-transparent transition-all duration-300"
                  style={{
                    width: email ? "90%" : "0%",
                    transform: "translateX(-50%)",
                    opacity: email ? 1 : 0,
                    boxShadow: email ? "0 0 20px rgba(201, 166, 72, 0.5)" : "none",
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-sm p-3 rounded-lg"
                style={{
                  background: "rgba(239, 68, 68, 0.15)",
                  border: "1px solid rgba(239, 68, 68, 0.4)",
                  color: "#fca5a5",
                  animation: "errorPulse 1s ease-in-out infinite",
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(15px)",
                transition: "all 0.6s ease-out",
                transitionDelay: "0.7s",
              }}
            >
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-4 rounded-lg font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300 relative overflow-hidden group"
                style={{
                  background: isLoading
                    ? "rgba(201, 166, 72, 0.5)"
                    : "linear-gradient(135deg, #a07d30 0%, #d4b65a 30%, #f0d080 50%, #d4b65a 70%, #a07d30 100%)",
                  backgroundSize: "200% 200%",
                  animation: isLoading ? "none" : "buttonGradient 2s ease infinite",
                  color: "#0c2f4a",
                  boxShadow: "0 0 40px rgba(201, 166, 72, 0.5)",
                  fontWeight: 700,
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.boxShadow = "0 0 60px rgba(201, 166, 72, 0.7)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 0 40px rgba(201, 166, 72, 0.5)";
                }}
                onMouseDown={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(0.97)";
                  }
                }}
                onMouseUp={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(1.03)";
                  }
                }}
              >
                {/* Shimmer */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)",
                    animation: "buttonShimmer 1s ease-in-out infinite",
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AUTHENTICATING
                    </>
                  ) : (
                    "ENTER COMMAND CENTER"
                  )}
                </span>
              </button>
            </div>

            <p
              className="text-xs text-center pt-4"
              style={{
                color: "rgba(247, 245, 242, 0.5)",
                opacity: isVisible ? 1 : 0,
                transition: "opacity 0.6s ease-out",
                transitionDelay: "0.9s",
              }}
            >
              Restricted access • Admiral Energy personnel only
            </p>
          </form>
        </GlassCard>

        {/* Version */}
        <div
          className="text-center mt-8"
          style={{
            opacity: isVisible ? 0.5 : 0,
            transition: "opacity 0.6s ease-out",
            transitionDelay: "1s",
          }}
        >
          <span
            className="text-xs tracking-[0.3em] font-mono"
            style={{ color: "rgba(201, 166, 72, 0.7)" }}
          >
            ADS v2.0 // LIDS PLATFORM
          </span>
        </div>
      </div>

      {/* CSS Keyframes - ALL CRANKED UP */}
      <style>{`
        @keyframes rotateBorder {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @keyframes nebulaFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(50px, 30px) scale(1.1); }
        }

        @keyframes nebulaFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-40px, -20px) scale(1.15); }
        }

        @keyframes nebulaFloat3 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -40px) scale(1.2); }
        }

        @keyframes sweepRay1 {
          0% { left: -300px; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { left: 100%; opacity: 0; }
        }

        @keyframes sweepRay2 {
          0% { right: -300px; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { right: 100%; opacity: 0; }
        }

        @keyframes sweepRay3 {
          0%, 100% { transform: rotate(20deg) translateX(-100px); opacity: 0.3; }
          50% { transform: rotate(20deg) translateX(100px); opacity: 0.8; }
        }

        @keyframes pulseWave {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(15);
            opacity: 0;
          }
        }

        @keyframes energyRingOuter {
          0%, 100% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
        }

        @keyframes energyRingPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.4; box-shadow: 0 0 40px rgba(201, 166, 72, 0.3), inset 0 0 40px rgba(201, 166, 72, 0.1); }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 0.9; box-shadow: 0 0 80px rgba(201, 166, 72, 0.6), inset 0 0 60px rgba(201, 166, 72, 0.2); }
        }

        @keyframes rotateArc {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes rotateArcReverse {
          from { transform: translate(-50%, -50%) rotate(360deg); }
          to { transform: translate(-50%, -50%) rotate(0deg); }
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }

        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 25px rgba(201, 166, 72, 0.5)); }
          50% { filter: drop-shadow(0 0 50px rgba(201, 166, 72, 1)) drop-shadow(0 0 80px rgba(201, 166, 72, 0.5)); }
        }

        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(201, 166, 72, 0.4); }
          50% { text-shadow: 0 0 50px rgba(201, 166, 72, 0.8), 0 0 80px rgba(201, 166, 72, 0.4); }
        }

        @keyframes noiseMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(5%, 5%); }
        }

        @keyframes lensFlare {
          0%, 100% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.3); }
        }

        @keyframes buttonGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        @keyframes buttonShimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        @keyframes errorPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
