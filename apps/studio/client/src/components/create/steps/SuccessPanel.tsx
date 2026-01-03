import { useEffect, useState } from 'react';
import { WizardState } from '@/pages/create';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, ExternalLink, Sparkles } from 'lucide-react';
import { Link } from 'wouter';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onReset: () => void;
}

// Simple confetti component using CSS animations
function Confetti() {
  const pieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: ['#D4AF37', '#F5E6A3', '#B8962F', '#E8B4BC', '#22c55e'][Math.floor(Math.random() * 5)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-sm animate-confetti"
          style={{
            left: `${piece.left}%`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes confetti {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </div>
  );
}

export function SuccessPanel({ state, onReset }: Props) {
  const [xpAwarded, setXpAwarded] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 5000);

    // Animate XP counter
    const targetXp = 50; // video_published
    const increment = targetXp / 20;
    let current = 0;
    const interval = setInterval(() => {
      current += increment;
      if (current >= targetXp) {
        setXpAwarded(targetXp);
        clearInterval(interval);
      } else {
        setXpAwarded(Math.floor(current));
      }
    }, 50);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="space-y-8 text-center py-8">
      {/* Confetti Animation */}
      {showConfetti && <Confetti />}

      {/* Success Icon */}
      <div className="relative">
        <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-[#D4AF37] to-[#B8962F] flex items-center justify-center shadow-lg shadow-[#D4AF37]/30">
          <svg className="w-12 h-12 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* XP Badge */}
        <div className="absolute -top-2 -right-2 left-1/2 -translate-x-1/2 w-max">
          <div className="px-4 py-1 rounded-full bg-green-500 text-white text-sm font-bold animate-bounce">
            +{xpAwarded} XP
          </div>
        </div>
      </div>

      {/* Message */}
      <div>
        <h2 className="text-2xl text-white font-medium mb-2">Content Published!</h2>
        <p className="text-gray-400">
          Your {state.contentType?.replace('-', ' ')} has been
          {state.scheduledDate ? ' scheduled' : ' published'} to{' '}
          {state.platforms.map((p, i) => (
            <span key={p}>
              {i > 0 && (i === state.platforms.length - 1 ? ' and ' : ', ')}
              <span className="text-[#D4AF37] capitalize">{p}</span>
            </span>
          ))}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
        <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
          <div className="text-2xl font-bold text-[#D4AF37]">{state.platforms.length}</div>
          <div className="text-gray-500 text-xs">Platforms</div>
        </div>
        <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
          <div className="text-2xl font-bold text-green-400">+{xpAwarded}</div>
          <div className="text-gray-500 text-xs">XP Earned</div>
        </div>
        <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
          <div className="text-2xl font-bold text-white">🔥</div>
          <div className="text-gray-500 text-xs">Streak</div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          onClick={onReset}
          className="bg-[#D4AF37] hover:bg-[#B8962F] text-black font-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Another
        </Button>
        <Link href="/calendar">
          <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-white/10 w-full sm:w-auto">
            <Calendar className="w-4 h-4 mr-2" />
            View Calendar
          </Button>
        </Link>
      </div>

      {/* Platform Links */}
      <div className="pt-4 border-t border-gray-800">
        <p className="text-gray-500 text-sm mb-3">Check your posts:</p>
        <div className="flex justify-center gap-4">
          {state.platforms.includes('tiktok') && (
            <a
              href="https://www.tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#00f2ea] hover:underline text-sm"
            >
              TikTok <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {state.platforms.includes('youtube') && (
            <a
              href="https://studio.youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-red-500 hover:underline text-sm"
            >
              YouTube <ExternalLink className="w-3 h-3" />
            </a>
          )}
          {state.platforms.includes('linkedin') && (
            <a
              href="https://www.linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[#0077b5] hover:underline text-sm"
            >
              LinkedIn <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
