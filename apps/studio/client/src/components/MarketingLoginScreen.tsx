import { useState, useEffect, useRef } from 'react';
import { useUser } from '@/lib/postiz-user-context';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Sparkles, AlertCircle, Loader2 } from 'lucide-react';

// Falling petals animation
function FallingPetals() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

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

    interface Petal {
      x: number;
      y: number;
      size: number;
      speedY: number;
      speedX: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      color: string;
    }

    const colors = ['#B76E79', '#D4AF37', '#E8C4C4', '#F5E6D3', '#C9A96E'];
    const petals: Petal[] = [];

    for (let i = 0; i < 40; i++) {
      petals.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        size: Math.random() * 12 + 6,
        speedY: Math.random() * 1.5 + 0.5,
        speedX: Math.random() * 1 - 0.5,
        rotation: Math.random() * 360,
        rotationSpeed: Math.random() * 2 - 1,
        opacity: Math.random() * 0.6 + 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }

    const drawPetal = (petal: Petal) => {
      ctx.save();
      ctx.translate(petal.x, petal.y);
      ctx.rotate((petal.rotation * Math.PI) / 180);
      ctx.globalAlpha = petal.opacity;

      ctx.beginPath();
      ctx.moveTo(0, -petal.size);
      ctx.bezierCurveTo(
        petal.size * 0.5, -petal.size * 0.5,
        petal.size * 0.5, petal.size * 0.5,
        0, petal.size
      );
      ctx.bezierCurveTo(
        -petal.size * 0.5, petal.size * 0.5,
        -petal.size * 0.5, -petal.size * 0.5,
        0, -petal.size
      );
      ctx.fillStyle = petal.color;
      ctx.fill();
      ctx.restore();
    };

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      petals.forEach((petal) => {
        petal.y += petal.speedY;
        petal.x += petal.speedX + Math.sin(petal.y * 0.01) * 0.5;
        petal.rotation += petal.rotationSpeed;

        if (petal.y > canvas.height + 20) {
          petal.y = -20;
          petal.x = Math.random() * canvas.width;
        }

        drawPetal(petal);
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
    />
  );
}

export function MarketingLoginScreen() {
  const { loginByEmail } = useUser();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await loginByEmail(email.trim().toLowerCase());

      if (!user) {
        setError('Email not found. Please register at postiz.ripemerchant.host first.');
      }
    } catch (err) {
      setError('Unable to connect. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #1a1512 0%, #2d2319 50%, #1a1512 100%)'
      }}
    >
      <FallingPetals />

      {/* Subtle glow effects */}
      <div
        className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20"
        style={{ background: 'radial-gradient(circle, #B76E79 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full blur-3xl opacity-15"
        style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)' }}
      />

      <Card
        className="w-full max-w-md relative z-10 border-0 shadow-2xl"
        style={{
          background: 'linear-gradient(145deg, rgba(45, 35, 25, 0.95) 0%, rgba(26, 21, 18, 0.98) 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 80px -20px rgba(183, 110, 121, 0.3)'
        }}
      >
        <CardHeader className="text-center pb-2">
          <div
            className="mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #B76E79 0%, #D4AF37 100%)',
              boxShadow: '0 10px 40px -10px rgba(183, 110, 121, 0.5)'
            }}
          >
            <Sparkles className="w-10 h-10 text-white relative z-10" />
            <div
              className="absolute inset-0 animate-pulse opacity-50"
              style={{ background: 'linear-gradient(135deg, #D4AF37 0%, #B76E79 100%)' }}
            />
          </div>
          <CardTitle
            className="text-3xl font-light tracking-wide"
            style={{
              background: 'linear-gradient(135deg, #E8C4C4 0%, #D4AF37 50%, #B76E79 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            STUDIO
          </CardTitle>
          <CardDescription className="text-base" style={{ color: '#9a8578' }}>
            Marketing Command Center
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: '#c4b5a8' }}>Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12 border-0 text-base placeholder:text-gray-600"
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#E8C4C4'
                }}
              />
            </div>

            {error && (
              <div
                className="flex items-center gap-2 text-sm p-3 rounded-lg"
                style={{ background: 'rgba(183, 110, 121, 0.2)', color: '#E8C4C4' }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium border-0 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
              disabled={isLoading}
              style={{
                background: 'linear-gradient(135deg, #B76E79 0%, #D4AF37 100%)',
                color: 'white'
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Enter STUDIO'
              )}
            </Button>
          </form>

          <p className="text-center text-sm mt-6" style={{ color: '#6b5c52' }}>
            Admiral Energy Marketing Suite
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
