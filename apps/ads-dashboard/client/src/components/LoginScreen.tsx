import { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "@/lib/user-context";
import { AlertCircle, Loader2 } from "lucide-react";

// ============================================
// LAYER 1: STAR FIELD BACKGROUND
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
    const stars: Array<{ x: number; y: number; size: number; speed: number; opacity: number }> = [];
    const shootingStars: Array<{ x: number; y: number; length: number; speed: number; opacity: number; active: boolean }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create stars
    const starCount = Math.floor((canvas.width * canvas.height) / 8000);
    for (let i = 0; i < starCount; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.05 + 0.01,
        opacity: Math.random() * 0.8 + 0.2,
      });
    }

    // Shooting star spawner
    let lastShootingStar = 0;
    const spawnShootingStar = (time: number) => {
      if (time - lastShootingStar > 5000 + Math.random() * 10000) {
        shootingStars.push({
          x: Math.random() * canvas.width * 0.5,
          y: Math.random() * canvas.height * 0.3,
          length: 80 + Math.random() * 120,
          speed: 8 + Math.random() * 6,
          opacity: 1,
          active: true,
        });
        lastShootingStar = time;
      }
    };

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw stars
      stars.forEach((star) => {
        if (!prefersReducedMotion) {
          star.x -= star.speed;
          if (star.x < 0) star.x = canvas.width;
        }

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * 0.6})`;
        ctx.fill();
      });

      // Shooting stars
      if (!prefersReducedMotion) {
        spawnShootingStar(time);
        shootingStars.forEach((ss, i) => {
          if (!ss.active) return;

          ss.x += ss.speed;
          ss.y += ss.speed * 0.6;
          ss.opacity -= 0.015;

          if (ss.opacity <= 0) {
            ss.active = false;
            return;
          }

          const gradient = ctx.createLinearGradient(
            ss.x - ss.length, ss.y - ss.length * 0.6,
            ss.x, ss.y
          );
          gradient.addColorStop(0, "transparent");
          gradient.addColorStop(1, `rgba(201, 166, 72, ${ss.opacity})`);

          ctx.beginPath();
          ctx.moveTo(ss.x - ss.length, ss.y - ss.length * 0.6);
          ctx.lineTo(ss.x, ss.y);
          ctx.strokeStyle = gradient;
          ctx.lineWidth = 2;
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

  return <canvas ref={canvasRef} className="absolute inset-0" style={{ zIndex: 0 }} />;
}

// ============================================
// LAYER 2: EMBER PARTICLES (floating up)
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
    const particleCount = isMobile ? 40 : 80;

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
    }

    const embers: Ember[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create embers
    for (let i = 0; i < particleCount; i++) {
      embers.push({
        x: Math.random() * canvas.width,
        y: canvas.height + Math.random() * 200,
        size: Math.random() * 3 + 2,
        speedY: -(Math.random() * 1.2 + 0.4),
        speedX: (Math.random() - 0.5) * 0.5,
        opacity: 0,
        maxOpacity: Math.random() * 0.7 + 0.3,
        wobbleOffset: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.01,
      });
    }

    let time = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 1;

      embers.forEach((ember) => {
        // Move upward
        ember.y += ember.speedY;
        ember.x += ember.speedX + Math.sin(time * ember.wobbleSpeed + ember.wobbleOffset) * 0.3;

        // Fade in at bottom, fade out at top
        const normalizedY = ember.y / canvas.height;
        if (normalizedY > 0.8) {
          ember.opacity = Math.min(ember.opacity + 0.02, ember.maxOpacity);
        } else if (normalizedY < 0.2) {
          ember.opacity = Math.max(ember.opacity - 0.02, 0);
        }

        // Reset when off screen
        if (ember.y < -20 || ember.opacity <= 0) {
          ember.y = canvas.height + 20;
          ember.x = Math.random() * canvas.width;
          ember.opacity = 0;
        }

        // Draw ember with glow
        const gradient = ctx.createRadialGradient(
          ember.x, ember.y, 0,
          ember.x, ember.y, ember.size * 3
        );
        gradient.addColorStop(0, `rgba(255, 200, 100, ${ember.opacity})`);
        gradient.addColorStop(0.4, `rgba(201, 166, 72, ${ember.opacity * 0.6})`);
        gradient.addColorStop(1, "transparent");

        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 230, 180, ${ember.opacity})`;
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

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }} />;
}

// ============================================
// LAYER 3: GOD RAYS
// ============================================
function GodRays() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 1 }}>
      {/* Ray 1 */}
      <div
        className="absolute"
        style={{
          top: "-50%",
          left: "-20%",
          width: "80%",
          height: "200%",
          background: "linear-gradient(135deg, transparent 40%, rgba(201, 166, 72, 0.08) 50%, transparent 60%)",
          animation: "godRay1 12s ease-in-out infinite",
          transform: "rotate(25deg)",
        }}
      />
      {/* Ray 2 */}
      <div
        className="absolute"
        style={{
          top: "-30%",
          right: "-30%",
          width: "70%",
          height: "200%",
          background: "linear-gradient(135deg, transparent 40%, rgba(201, 166, 72, 0.06) 50%, transparent 60%)",
          animation: "godRay2 15s ease-in-out infinite",
          transform: "rotate(-15deg)",
        }}
      />
      {/* Ray 3 */}
      <div
        className="absolute"
        style={{
          top: "20%",
          left: "30%",
          width: "60%",
          height: "150%",
          background: "linear-gradient(180deg, transparent 30%, rgba(201, 166, 72, 0.04) 50%, transparent 70%)",
          animation: "godRay3 18s ease-in-out infinite",
        }}
      />
    </div>
  );
}

// ============================================
// LAYER 4 & 5: LOGO WITH ENERGY RING
// ============================================
function AnimatedLogo({ isVisible }: { isVisible: boolean }) {
  return (
    <div
      className="relative flex justify-center mb-8"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "scale(1) translateY(0)" : "scale(0.8) translateY(20px)",
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: "0.2s",
      }}
    >
      {/* Energy ring - outer glow */}
      <div
        className="absolute"
        style={{
          width: "280px",
          height: "280px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, transparent 30%, rgba(201, 166, 72, 0.15) 50%, transparent 70%)",
          animation: "energyRingOuter 4s ease-in-out infinite",
        }}
      />

      {/* Energy ring - inner pulse */}
      <div
        className="absolute"
        style={{
          width: "220px",
          height: "220px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          border: "2px solid rgba(201, 166, 72, 0.3)",
          borderRadius: "50%",
          boxShadow: "0 0 40px rgba(201, 166, 72, 0.3), inset 0 0 40px rgba(201, 166, 72, 0.1)",
          animation: "energyRingPulse 3s ease-in-out infinite",
        }}
      />

      {/* Rotating energy arc */}
      <div
        className="absolute"
        style={{
          width: "240px",
          height: "240px",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          border: "3px solid transparent",
          borderTopColor: "rgba(201, 166, 72, 0.6)",
          borderRightColor: "rgba(201, 166, 72, 0.3)",
          animation: "rotateArc 6s linear infinite",
          filter: "blur(1px)",
        }}
      />

      {/* Logo container */}
      <div
        style={{
          animation: "logoFloat 4s ease-in-out infinite, logoRotate 20s ease-in-out infinite",
        }}
      >
        <img
          src="/admiral-logo.png"
          alt="Admiral Energy"
          className="relative w-44 h-44 object-contain"
          style={{
            filter: "drop-shadow(0 0 30px rgba(201, 166, 72, 0.6))",
            animation: "logoGlow 3s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );
}

// ============================================
// LAYER 6: ANIMATED BORDER CARD
// ============================================
function GlassCard({ children, isVisible }: { children: React.ReactNode; isVisible: boolean }) {
  return (
    <div
      className="relative"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(40px)",
        filter: isVisible ? "blur(0)" : "blur(10px)",
        transition: "all 1s cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: "0.5s",
      }}
    >
      {/* Rotating gradient border */}
      <div
        className="absolute -inset-[2px] rounded-2xl overflow-hidden"
        style={{ zIndex: 0 }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "conic-gradient(from var(--border-angle, 0deg), transparent 0%, rgba(201, 166, 72, 0.8) 10%, transparent 20%, transparent 40%, rgba(201, 166, 72, 0.4) 50%, transparent 60%, transparent 80%, rgba(201, 166, 72, 0.6) 90%, transparent 100%)",
            animation: "rotateBorder 4s linear infinite",
          }}
        />
      </div>

      {/* Card content */}
      <div
        className="relative rounded-2xl p-8 overflow-hidden"
        style={{
          background: "rgba(8, 28, 44, 0.8)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 0 60px rgba(0, 0, 0, 0.5), inset 0 0 60px rgba(201, 166, 72, 0.03)",
          zIndex: 1,
        }}
      >
        {/* Animated noise texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
            animation: "noiseMove 0.5s steps(10) infinite",
          }}
        />

        {/* Inner glow */}
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none"
          style={{
            boxShadow: "inset 0 1px 0 rgba(255, 255, 255, 0.1), inset 0 0 40px rgba(201, 166, 72, 0.05)",
          }}
        />

        {children}
      </div>
    </div>
  );
}

// ============================================
// LAYER 7: AMBIENT EFFECTS (VIGNETTE + LENS FLARE)
// ============================================
function AmbientEffects() {
  return (
    <>
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, transparent 50%, rgba(0, 0, 0, 0.4) 100%)",
          zIndex: 10,
        }}
      />

      {/* Occasional lens flare */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "15%",
          right: "20%",
          width: "100px",
          height: "100px",
          background: "radial-gradient(circle, rgba(201, 166, 72, 0.3) 0%, transparent 70%)",
          animation: "lensFlare 8s ease-in-out infinite",
          zIndex: 3,
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
    const timer = setTimeout(() => setIsVisible(true), 100);
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
      {/* Deep space gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #040810 0%, #081c2c 40%, #0c2f4a 70%, #081c2c 100%)",
        }}
      />

      {/* Layer 1: Star field */}
      <StarField />

      {/* Layer 2: Ember particles */}
      <EmberParticles />

      {/* Layer 3: God rays */}
      <GodRays />

      {/* Layer 7: Ambient effects */}
      <AmbientEffects />

      {/* Content */}
      <div className="relative z-20 w-full max-w-md px-4">
        {/* Layer 4 & 5: Logo with energy ring */}
        <AnimatedLogo isVisible={isVisible} />

        {/* Layer 6: Glass card */}
        <GlassCard isVisible={isVisible}>
          {/* Header */}
          <div className="text-center mb-8 relative">
            <h1
              className="text-2xl font-bold tracking-wider mb-2"
              style={{
                color: "#f7f5f2",
                textShadow: "0 0 30px rgba(201, 166, 72, 0.5)",
                animation: "textGlow 3s ease-in-out infinite",
              }}
            >
              COMMAND CENTER
            </h1>
            <p
              className="text-sm tracking-[0.3em] uppercase"
              style={{ color: "rgba(201, 166, 72, 0.8)" }}
            >
              Admiral Dialer System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6 relative">
            <div
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.6s ease-out",
                transitionDelay: "0.7s",
              }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2 tracking-wide"
                style={{ color: "rgba(247, 245, 242, 0.7)" }}
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
                    background: "rgba(0, 0, 0, 0.5)",
                    border: "1px solid rgba(201, 166, 72, 0.2)",
                    color: "#f7f5f2",
                    fontSize: "16px",
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = "rgba(201, 166, 72, 0.6)";
                    e.target.style.boxShadow = "0 0 30px rgba(201, 166, 72, 0.2), inset 0 0 20px rgba(201, 166, 72, 0.05)";
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = "rgba(201, 166, 72, 0.2)";
                    e.target.style.boxShadow = "none";
                  }}
                />
                {/* Input glow line */}
                <div
                  className="absolute bottom-0 left-1/2 h-[2px] bg-gradient-to-r from-transparent via-[#c9a648] to-transparent transition-all duration-300"
                  style={{
                    width: email ? "80%" : "0%",
                    transform: "translateX(-50%)",
                    opacity: email ? 1 : 0,
                  }}
                />
              </div>
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-sm p-3 rounded-lg animate-pulse"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                  color: "#fca5a5",
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.6s ease-out",
                transitionDelay: "0.8s",
              }}
            >
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-4 rounded-lg font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300 relative overflow-hidden group"
                style={{
                  background: isLoading
                    ? "rgba(201, 166, 72, 0.5)"
                    : "linear-gradient(135deg, #b8953f 0%, #d4b65a 25%, #c9a648 50%, #d4b65a 75%, #b8953f 100%)",
                  backgroundSize: "200% 200%",
                  animation: isLoading ? "none" : "buttonGradient 3s ease infinite",
                  color: "#0c2f4a",
                  boxShadow: "0 0 30px rgba(201, 166, 72, 0.4)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 0 50px rgba(201, 166, 72, 0.6)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 0 30px rgba(201, 166, 72, 0.4)";
                }}
                onMouseDown={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(0.98)";
                  }
                }}
                onMouseUp={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(1.02)";
                  }
                }}
              >
                {/* Shimmer effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100"
                  style={{
                    background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
                    animation: "buttonShimmer 1.5s ease-in-out infinite",
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
                color: "rgba(247, 245, 242, 0.4)",
                opacity: isVisible ? 1 : 0,
                transition: "opacity 0.6s ease-out",
                transitionDelay: "1s",
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
            opacity: isVisible ? 0.4 : 0,
            transition: "opacity 0.6s ease-out",
            transitionDelay: "1.2s",
          }}
        >
          <span
            className="text-xs tracking-[0.3em] font-mono"
            style={{ color: "rgba(201, 166, 72, 0.6)" }}
          >
            ADS v2.0 // LIDS PLATFORM
          </span>
        </div>
      </div>

      {/* CSS Keyframes */}
      <style>{`
        @property --border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        @keyframes rotateBorder {
          from { --border-angle: 0deg; }
          to { --border-angle: 360deg; }
        }

        @keyframes godRay1 {
          0%, 100% { transform: rotate(25deg) translateX(-10%); opacity: 0.8; }
          50% { transform: rotate(25deg) translateX(10%); opacity: 1; }
        }

        @keyframes godRay2 {
          0%, 100% { transform: rotate(-15deg) translateX(10%); opacity: 0.6; }
          50% { transform: rotate(-15deg) translateX(-10%); opacity: 0.8; }
        }

        @keyframes godRay3 {
          0%, 100% { transform: translateY(-5%) scale(1); opacity: 0.5; }
          50% { transform: translateY(5%) scale(1.1); opacity: 0.7; }
        }

        @keyframes energyRingOuter {
          0%, 100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.05); opacity: 1; }
        }

        @keyframes energyRingPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(0.98); opacity: 0.5; }
          50% { transform: translate(-50%, -50%) scale(1.02); opacity: 0.8; }
        }

        @keyframes rotateArc {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes logoFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }

        @keyframes logoRotate {
          0%, 100% { transform: rotate(-1deg); }
          50% { transform: rotate(1deg); }
        }

        @keyframes logoGlow {
          0%, 100% { filter: drop-shadow(0 0 20px rgba(201, 166, 72, 0.4)); }
          50% { filter: drop-shadow(0 0 40px rgba(201, 166, 72, 0.8)); }
        }

        @keyframes textGlow {
          0%, 100% { text-shadow: 0 0 20px rgba(201, 166, 72, 0.3); }
          50% { text-shadow: 0 0 40px rgba(201, 166, 72, 0.6), 0 0 60px rgba(201, 166, 72, 0.3); }
        }

        @keyframes noiseMove {
          0% { transform: translate(0, 0); }
          100% { transform: translate(10%, 10%); }
        }

        @keyframes lensFlare {
          0%, 100% { opacity: 0; transform: scale(0.8); }
          50% { opacity: 0.6; transform: scale(1.2); }
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
