import { useState, useEffect, useRef } from "react";
import { useUser } from "@/lib/user-context";
import { AlertCircle, Loader2 } from "lucide-react";

// ============================================
// NUCLEAR FIX: ALL ANIMATIONS IN ONE CANVAS
// No CSS keyframes for moving effects
// ============================================
function UnifiedEffectsCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    // Resize handler
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // ===== PARTICLE DATA =====
    interface Star {
      x: number;
      y: number;
      size: number;
      speed: number;
      opacity: number;
      twinkle: number;
    }

    interface Ember {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      opacity: number;
      maxOpacity: number;
      wobbleOffset: number;
    }

    interface GodRay {
      x: number;
      width: number;
      speed: number;
      opacity: number;
    }

    interface Nebula {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
    }

    // Initialize stars (60 - subtle)
    const stars: Star[] = [];
    for (let i = 0; i < 60; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.15 + 0.05,
        opacity: Math.random() * 0.4 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    // Initialize embers (40 - elegant, not overwhelming)
    const embers: Ember[] = [];
    for (let i = 0; i < 40; i++) {
      embers.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 3 + 2, // 2-5px
        speedY: -(Math.random() * 0.8 + 0.4), // Slower rise
        speedX: (Math.random() - 0.5) * 0.3,
        opacity: Math.random() * 0.3 + 0.2,
        maxOpacity: Math.random() * 0.3 + 0.4, // 0.4-0.7 max
        wobbleOffset: Math.random() * Math.PI * 2,
      });
    }

    // Initialize god rays (2 - subtle sweeps)
    const godRays: GodRay[] = [
      { x: -200, width: 300, speed: 0.5, opacity: 0.12 },
      { x: canvas.width + 100, width: 250, speed: -0.4, opacity: 0.10 },
    ];

    // Initialize nebula blobs (2 - ambient background)
    const nebulae: Nebula[] = [
      { x: canvas.width * 0.3, y: canvas.height * 0.3, size: 500, speedX: 0.08, speedY: 0.05, opacity: 0.08, color: "201, 166, 72" },
      { x: canvas.width * 0.7, y: canvas.height * 0.7, size: 400, speedX: -0.06, speedY: -0.04, opacity: 0.10, color: "30, 80, 140" },
    ];

    // Pulse ring state
    let pulseScale = 1;
    let pulseOpacity = 0.6;
    let pulsePhase = 0;

    // ===== MAIN ANIMATION LOOP =====
    const animate = () => {
      time += 1;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. DRAW NEBULA BLOBS (back layer, slow drift)
      nebulae.forEach((n) => {
        n.x += n.speedX;
        n.y += n.speedY;

        // Bounce off edges
        if (n.x < -n.size || n.x > canvas.width + n.size) n.speedX *= -1;
        if (n.y < -n.size || n.y > canvas.height + n.size) n.speedY *= -1;

        const gradient = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.size);
        gradient.addColorStop(0, `rgba(${n.color}, ${n.opacity})`);
        gradient.addColorStop(0.5, `rgba(${n.color}, ${n.opacity * 0.5})`);
        gradient.addColorStop(1, "transparent");

        ctx.fillStyle = gradient;
        ctx.fillRect(n.x - n.size, n.y - n.size, n.size * 2, n.size * 2);
      });

      // 2. DRAW GOD RAYS (sweeping beams)
      godRays.forEach((ray) => {
        ray.x += ray.speed;

        // Wrap around
        if (ray.speed > 0 && ray.x > canvas.width + ray.width) {
          ray.x = -ray.width;
        }
        if (ray.speed < 0 && ray.x < -ray.width) {
          ray.x = canvas.width + ray.width;
        }

        // Draw vertical gradient beam
        const gradient = ctx.createLinearGradient(ray.x, 0, ray.x + ray.width, 0);
        gradient.addColorStop(0, "rgba(201, 166, 72, 0)");
        gradient.addColorStop(0.5, `rgba(201, 166, 72, ${ray.opacity})`);
        gradient.addColorStop(1, "rgba(201, 166, 72, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(ray.x, 0, ray.width, canvas.height);
      });

      // 3. DRAW STARS (twinkling white dots)
      stars.forEach((star) => {
        star.x -= star.speed;
        if (star.x < 0) star.x = canvas.width;
        star.twinkle += 0.03;

        const twinkleOpacity = star.opacity * (0.7 + 0.3 * Math.sin(star.twinkle));

        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${twinkleOpacity})`;
        ctx.fill();
      });

      // 4. DRAW EMBERS (rising gold particles)
      embers.forEach((ember) => {
        ember.y += ember.speedY;
        ember.x += ember.speedX + Math.sin(time * 0.03 + ember.wobbleOffset) * 0.8;

        // Fade based on position
        const normalizedY = ember.y / canvas.height;
        if (normalizedY > 0.7) {
          ember.opacity = Math.min(ember.opacity + 0.02, ember.maxOpacity);
        } else if (normalizedY < 0.15) {
          ember.opacity = Math.max(ember.opacity - 0.02, 0);
        }

        // Reset at top
        if (ember.y < -30) {
          ember.y = canvas.height + 30;
          ember.x = Math.random() * canvas.width;
          ember.opacity = 0;
        }

        // Draw ember with glow
        const glowSize = ember.size * 4;
        const gradient = ctx.createRadialGradient(
          ember.x, ember.y, 0,
          ember.x, ember.y, glowSize
        );
        gradient.addColorStop(0, `rgba(255, 220, 120, ${ember.opacity})`);
        gradient.addColorStop(0.3, `rgba(255, 180, 80, ${ember.opacity * 0.6})`);
        gradient.addColorStop(0.6, `rgba(201, 166, 72, ${ember.opacity * 0.3})`);
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

      // 5. DRAW PULSE RING (center, expanding slowly every 6 seconds)
      pulsePhase += 0.008; // Slower
      if (pulsePhase > 1) {
        pulsePhase = 0;
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const baseRadius = 80;
      const maxRadius = Math.max(canvas.width, canvas.height) * 0.5;

      pulseScale = baseRadius + (maxRadius - baseRadius) * pulsePhase;
      pulseOpacity = 0.25 * (1 - pulsePhase); // More subtle

      if (pulseOpacity > 0.02) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, pulseScale, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(201, 166, 72, ${pulseOpacity})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0"
      style={{ zIndex: 1 }}
    />
  );
}


// ============================================
// LAYER 4 & 5: LOGO WITH ENERGY RING
// ============================================
function AnimatedLogo({ isVisible }: { isVisible: boolean }) {
  const [scale, setScale] = useState(1);
  const [glowIntensity, setGlowIntensity] = useState(0.5);
  const [arcRotation, setArcRotation] = useState(0);

  // JS-controlled animations - subtle and elegant
  useEffect(() => {
    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.015;

      // Float and scale: 0.98 to 1.02 (subtle)
      setScale(1 + Math.sin(time * 1.2) * 0.02);

      // Glow: 0.5 to 0.8 (subtle pulse)
      setGlowIntensity(0.65 + Math.sin(time * 1.5) * 0.15);

      // Rotating arcs - slower
      setArcRotation((r) => r + 0.8);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  const translateY = Math.sin(Date.now() / 500) * 8;

  return (
    <div
      className="relative flex justify-center mb-6"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? `scale(1) translateY(${translateY}px)` : "scale(0.7) translateY(30px)",
        transition: "opacity 1.2s ease-out",
      }}
    >
      {/* Outer glow */}
      <div
        className="absolute"
        style={{
          width: "350px",
          height: "350px",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          background: `radial-gradient(circle, rgba(201, 166, 72, ${glowIntensity * 0.3}) 0%, rgba(201, 166, 72, 0.1) 40%, transparent 70%)`,
        }}
      />

      {/* Energy ring */}
      <div
        className="absolute"
        style={{
          width: "260px",
          height: "260px",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) scale(${scale})`,
          border: "3px solid rgba(201, 166, 72, 0.5)",
          borderRadius: "50%",
          boxShadow: `0 0 ${60 * glowIntensity}px rgba(201, 166, 72, ${glowIntensity * 0.5}), inset 0 0 60px rgba(201, 166, 72, 0.15)`,
        }}
      />

      {/* Rotating arc */}
      <div
        className="absolute"
        style={{
          width: "280px",
          height: "280px",
          top: "50%",
          left: "50%",
          transform: `translate(-50%, -50%) rotate(${arcRotation}deg)`,
          borderRadius: "50%",
          border: "4px solid transparent",
          borderTopColor: "rgba(201, 166, 72, 0.8)",
          borderRightColor: "rgba(201, 166, 72, 0.4)",
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
          transform: `translate(-50%, -50%) rotate(${-arcRotation * 0.7}deg)`,
          borderRadius: "50%",
          border: "2px solid transparent",
          borderBottomColor: "rgba(201, 166, 72, 0.5)",
          borderLeftColor: "rgba(201, 166, 72, 0.2)",
        }}
      />

      {/* Logo */}
      <div style={{ transform: `scale(${scale})` }}>
        <img
          src="/admiral-logo.png"
          alt="Admiral Energy"
          className="relative w-44 h-44 object-contain"
          style={{
            filter: `drop-shadow(0 0 ${40 * glowIntensity}px rgba(201, 166, 72, ${glowIntensity}))`,
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
  const [borderRotation, setBorderRotation] = useState(0);

  // JS-controlled border rotation - slow and elegant
  useEffect(() => {
    let animationId: number;

    const animate = () => {
      setBorderRotation((r) => (r + 0.4) % 360);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div
      className="relative"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0) scale(1)" : "translateY(50px) scale(0.95)",
        transition: "all 1s ease-out",
        transitionDelay: "0.4s",
      }}
    >
      {/* Rotating gradient border */}
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
            transform: `rotate(${borderRotation}deg)`,
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
// LAYER 7: AMBIENT EFFECTS (vignette, lens flare)
// ============================================
function AmbientEffects() {
  const [flare1Opacity, setFlare1Opacity] = useState(0.3);
  const [flare2Opacity, setFlare2Opacity] = useState(0.2);

  useEffect(() => {
    let animationId: number;
    let time = 0;

    const animate = () => {
      time += 0.02;
      setFlare1Opacity(0.3 + Math.sin(time * 0.5) * 0.3);
      setFlare2Opacity(0.2 + Math.sin(time * 0.4 + 2) * 0.25);
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <>
      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center, transparent 0%, transparent 40%, rgba(0, 0, 0, 0.5) 100%)",
          zIndex: 15,
        }}
      />

      {/* Lens flare 1 */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "10%",
          right: "15%",
          width: "150px",
          height: "150px",
          background: `radial-gradient(circle, rgba(201, 166, 72, ${flare1Opacity}) 0%, rgba(201, 166, 72, ${flare1Opacity * 0.3}) 40%, transparent 70%)`,
          transform: `scale(${0.8 + flare1Opacity})`,
          zIndex: 5,
        }}
      />

      {/* Lens flare 2 */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: "20%",
          left: "10%",
          width: "100px",
          height: "100px",
          background: `radial-gradient(circle, rgba(201, 166, 72, ${flare2Opacity}) 0%, transparent 60%)`,
          transform: `scale(${0.8 + flare2Opacity})`,
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
  const [buttonGradientPos, setButtonGradientPos] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Button gradient animation
  useEffect(() => {
    let animationId: number;
    const animate = () => {
      setButtonGradientPos((p) => (p + 0.5) % 200);
      animationId = requestAnimationFrame(animate);
    };
    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
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
      {/* Deep space gradient background */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(180deg, #020508 0%, #061018 30%, #0c2f4a 60%, #061018 100%)",
        }}
      />

      {/* SINGLE UNIFIED CANVAS for all particle effects */}
      <UnifiedEffectsCanvas />

      {/* Ambient effects (vignette, lens flares) */}
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
                className="w-full py-4 rounded-lg font-bold text-sm tracking-[0.2em] uppercase transition-all duration-300 relative overflow-hidden"
                style={{
                  background: isLoading
                    ? "rgba(201, 166, 72, 0.5)"
                    : `linear-gradient(135deg, #a07d30 0%, #d4b65a 30%, #f0d080 50%, #d4b65a 70%, #a07d30 100%)`,
                  backgroundSize: "200% 200%",
                  backgroundPosition: `${buttonGradientPos}% 50%`,
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
    </div>
  );
}
