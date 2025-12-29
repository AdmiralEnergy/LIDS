import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/user-context";
import { AlertCircle, Loader2 } from "lucide-react";

// Particle system for floating gold orbs
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let animationId: number;
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
    }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Create particles - fewer on mobile
    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 30 : 60;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 1,
        speedY: -(Math.random() * 0.5 + 0.2),
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.5 + 0.2,
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        // Update position
        p.y += p.speedY;
        p.x += p.speedX;

        // Reset when off screen
        if (p.y < -10) {
          p.y = canvas.height + 10;
          p.x = Math.random() * canvas.width;
        }
        if (p.x < -10) p.x = canvas.width + 10;
        if (p.x > canvas.width + 10) p.x = -10;

        // Draw particle with glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(201, 166, 72, ${p.opacity})`;
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(201, 166, 72, 0.5)";
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

// Grid overlay component
function GridOverlay() {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 0,
        backgroundImage: `
          linear-gradient(rgba(201, 166, 72, 0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(201, 166, 72, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: "50px 50px",
      }}
    />
  );
}

export function LoginScreen() {
  const { loginByEmail } = useUser();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Trigger entrance animation
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
      {/* Base gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #081c2c 0%, #0c2f4a 50%, #0a2540 100%)",
        }}
      />

      {/* Animated diagonal shimmer */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(
            135deg,
            transparent 0%,
            transparent 40%,
            rgba(201, 166, 72, 0.05) 45%,
            rgba(201, 166, 72, 0.1) 50%,
            rgba(201, 166, 72, 0.05) 55%,
            transparent 60%,
            transparent 100%
          )`,
          backgroundSize: "400% 400%",
          animation: "shimmer 8s ease-in-out infinite",
        }}
      />

      {/* Grid overlay */}
      <GridOverlay />

      {/* Particle field */}
      <ParticleField />

      {/* Content container */}
      <div
        className="relative z-10 w-full max-w-md px-4"
        style={{
          opacity: isVisible ? 1 : 0,
          transform: isVisible ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Logo with glow */}
        <div
          className="flex justify-center mb-8"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "scale(1)" : "scale(0.8)",
            transition: "all 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
            transitionDelay: "0.1s",
          }}
        >
          <div className="relative">
            {/* Glow effect behind logo */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle, rgba(201, 166, 72, 0.3) 0%, transparent 70%)",
                filter: "blur(20px)",
                animation: "pulse-glow 3s ease-in-out infinite",
                transform: "scale(1.5)",
              }}
            />
            <img
              src="/admiral-logo.png"
              alt="Admiral Energy"
              className="relative w-48 h-48 object-contain"
              style={{
                filter: "drop-shadow(0 0 20px rgba(201, 166, 72, 0.4))",
                animation: "float 4s ease-in-out infinite",
              }}
            />
          </div>
        </div>

        {/* Glassmorphism card */}
        <div
          className="relative rounded-2xl p-8 overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(201, 166, 72, 0.15)",
            boxShadow: `
              0 0 40px rgba(0, 0, 0, 0.3),
              inset 0 0 60px rgba(201, 166, 72, 0.03)
            `,
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(30px)",
            transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            transitionDelay: "0.3s",
          }}
        >
          {/* Card border glow on hover */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
            style={{
              boxShadow: "inset 0 0 30px rgba(201, 166, 72, 0.1)",
            }}
          />

          {/* Header */}
          <div className="text-center mb-8">
            <h1
              className="text-2xl font-bold tracking-wide mb-2"
              style={{
                color: "#f7f5f2",
                fontFamily: "var(--font-display, 'Inter', sans-serif)",
                textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
              }}
            >
              ADS COMMAND CENTER
            </h1>
            <p
              className="text-sm tracking-widest uppercase"
              style={{ color: "rgba(201, 166, 72, 0.8)" }}
            >
              Admiral Dialer System
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div
              style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(10px)",
                transition: "all 0.5s ease-out",
                transitionDelay: "0.5s",
              }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-2"
                style={{ color: "rgba(247, 245, 242, 0.7)" }}
              >
                Operator Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
                autoFocus
                className="w-full px-4 py-3 rounded-lg outline-none transition-all duration-300"
                style={{
                  background: "rgba(0, 0, 0, 0.4)",
                  border: "1px solid rgba(201, 166, 72, 0.2)",
                  color: "#f7f5f2",
                  fontSize: "16px",
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = "rgba(201, 166, 72, 0.6)";
                  e.target.style.boxShadow = "0 0 20px rgba(201, 166, 72, 0.2)";
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = "rgba(201, 166, 72, 0.2)";
                  e.target.style.boxShadow = "none";
                }}
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-sm p-3 rounded-lg"
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
                transition: "all 0.5s ease-out",
                transitionDelay: "0.6s",
              }}
            >
              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-4 rounded-lg font-semibold text-sm tracking-wider uppercase transition-all duration-300 relative overflow-hidden group"
                style={{
                  background: isLoading
                    ? "rgba(201, 166, 72, 0.5)"
                    : "linear-gradient(135deg, #c9a648 0%, #d4b65a 50%, #c9a648 100%)",
                  color: "#0c2f4a",
                  boxShadow: "0 4px 20px rgba(201, 166, 72, 0.3)",
                }}
                onMouseEnter={(e) => {
                  if (!isLoading) {
                    e.currentTarget.style.transform = "scale(1.02)";
                    e.currentTarget.style.boxShadow = "0 6px 30px rgba(201, 166, 72, 0.5)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 20px rgba(201, 166, 72, 0.3)";
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
                {/* Button shimmer effect */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                    animation: "button-shimmer 2s infinite",
                  }}
                />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    "Enter Command Center"
                  )}
                </span>
              </button>
            </div>

            <p
              className="text-xs text-center mt-6"
              style={{
                color: "rgba(247, 245, 242, 0.4)",
                opacity: isVisible ? 1 : 0,
                transition: "opacity 0.5s ease-out",
                transitionDelay: "0.8s",
              }}
            >
              Access restricted to Admiral Energy personnel.
              <br />
              Contact command if you need clearance.
            </p>
          </form>
        </div>

        {/* Version tag */}
        <div
          className="text-center mt-6"
          style={{
            opacity: isVisible ? 0.3 : 0,
            transition: "opacity 0.5s ease-out",
            transitionDelay: "1s",
          }}
        >
          <span
            className="text-xs tracking-widest"
            style={{ color: "rgba(201, 166, 72, 0.5)" }}
          >
            ADS v2.0 // LIDS PLATFORM
          </span>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes shimmer {
          0%, 100% {
            background-position: 200% 200%;
          }
          50% {
            background-position: -100% -100%;
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1.5);
          }
          50% {
            opacity: 1;
            transform: scale(1.7);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }

        @keyframes button-shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>
    </div>
  );
}
