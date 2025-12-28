import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Send, Sparkles, Lightbulb, Linkedin, Video, Store, Calendar, Copy, Check } from 'lucide-react';

const theme = {
  gold: '#D4AF37',
  goldLight: '#F5E6A3',
  goldDark: '#B8962F',
  rosePink: '#E8B4BC',
  roseDark: '#C4959D',
};

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Animated gold particles background
const GoldParticles = () => {
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

    const particles: Array<{x: number; y: number; vx: number; vy: number; size: number; alpha: number; twinkle: number}> = [];

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        size: Math.random() * 3 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
        twinkle: Math.random() * Math.PI * 2,
      });
    }

    let animationId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        p.twinkle += 0.02;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        const twinkleAlpha = p.alpha * (0.7 + 0.3 * Math.sin(p.twinkle));

        // Glow effect
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, `rgba(212, 175, 55, ${twinkleAlpha})`);
        gradient.addColorStop(0.5, `rgba(212, 175, 55, ${twinkleAlpha * 0.3})`);
        gradient.addColorStop(1, 'rgba(212, 175, 55, 0)');

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(245, 230, 163, ${twinkleAlpha})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

// Quick platform buttons
const QuickPost = () => {
  const platforms = [
    { name: 'LinkedIn', icon: Linkedin, url: 'https://www.linkedin.com/company/admiral-energy-llc/admin/page-posts/published/', color: '#0077B5' },
    { name: 'TikTok', icon: Video, url: 'https://www.tiktok.com/@admiralenergyco', color: '#FF0050' },
    { name: 'Google', icon: Store, url: 'https://business.google.com/dashboard/l/04867903424436656640', color: '#4285F4' },
  ];

  return (
    <div className="flex gap-3 justify-center flex-wrap">
      {platforms.map(p => (
        <Button
          key={p.name}
          onClick={() => window.open(p.url, '_blank')}
          className="gap-2 px-5 py-2 h-auto"
          style={{ background: p.color, border: 'none' }}
        >
          <p.icon className="w-4 h-4" />
          {p.name}
        </Button>
      ))}
    </div>
  );
};

// Content ideas chips
const ContentIdeas = ({ onSelect }: { onSelect: (idea: string) => void }) => {
  const ideas = [
    'Holiday Solar Savings',
    'Year-End Tax Credits',
    '2025 Energy Goals',
    'Customer Success Story',
    'Solar Myth Busting',
    'Behind the Scenes',
    'Energy Bill Comparison',
    'Installation Day Post',
  ];

  return (
    <div className="flex gap-2 flex-wrap justify-center">
      {ideas.map(idea => (
        <button
          key={idea}
          onClick={() => onSelect(idea)}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105"
          style={{
            background: 'rgba(212, 175, 55, 0.15)',
            border: '1px solid rgba(212, 175, 55, 0.3)',
            color: theme.goldLight,
          }}
        >
          {idea}
        </button>
      ))}
    </div>
  );
};

// Agent chat component
const AgentChat = ({
  agent,
  messages,
  input,
  setInput,
  loading,
  onSend,
  onCopy
}: {
  agent: 'sarai' | 'muse';
  messages: Message[];
  input: string;
  setInput: (v: string) => void;
  loading: boolean;
  onSend: () => void;
  onCopy: (text: string) => void;
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleCopy = (text: string, index: number) => {
    onCopy(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const isSarai = agent === 'sarai';
  const agentColor = isSarai ? theme.rosePink : theme.gold;
  const agentName = isSarai ? 'SARAI' : 'MUSE';
  const agentRole = isSarai ? 'Content Creator' : 'Strategy Planner';
  const placeholder = isSarai
    ? 'Write a LinkedIn post about solar savings...'
    : 'What should we focus on this week?';

  return (
    <Card
      className="border backdrop-blur-md flex-1"
      style={{
        background: 'rgba(0, 0, 0, 0.4)',
        borderColor: `${agentColor}33`,
      }}
    >
      <CardContent className="p-4 flex flex-col h-full">
        {/* Agent Header */}
        <div className="flex items-center gap-3 mb-4 pb-3" style={{ borderBottom: `1px solid ${agentColor}33` }}>
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: isSarai
                ? `linear-gradient(135deg, ${theme.rosePink} 0%, ${theme.roseDark} 100%)`
                : `linear-gradient(135deg, ${theme.gold} 0%, ${theme.goldDark} 100%)`,
              boxShadow: `0 0 20px ${agentColor}40`,
            }}
          >
            {isSarai ? <Sparkles className="w-6 h-6 text-white" /> : <Lightbulb className="w-6 h-6 text-black" />}
          </div>
          <div>
            <h3 className="font-semibold text-lg" style={{ color: agentColor }}>{agentName}</h3>
            <p className="text-xs text-gray-400">{agentRole}</p>
          </div>
          <div className="ml-auto">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs"
              style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              Online
            </span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[200px] max-h-[300px]">
          {messages.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">{isSarai ? 'Ready to create content!' : 'Ready to strategize!'}</p>
              <p className="text-xs opacity-60">Type a message or select a content idea below</p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="relative group max-w-[85%]">
                <div
                  className="px-4 py-2.5 rounded-2xl whitespace-pre-wrap"
                  style={{
                    background: msg.role === 'user'
                      ? `linear-gradient(135deg, ${theme.gold} 0%, ${theme.goldDark} 100%)`
                      : 'rgba(255,255,255,0.08)',
                    color: msg.role === 'user' ? '#000' : '#fff',
                    borderBottomRightRadius: msg.role === 'user' ? '4px' : '16px',
                    borderBottomLeftRadius: msg.role === 'assistant' ? '4px' : '16px',
                  }}
                >
                  {msg.content}
                </div>
                {msg.role === 'assistant' && (
                  <button
                    onClick={() => handleCopy(msg.content, i)}
                    className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-white/10"
                    title="Copy to clipboard"
                  >
                    {copiedIndex === i ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl bg-white/10">
                <span className="flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-2 h-2 rounded-full bg-white/50 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </span>
                  <span className="text-gray-400 text-sm">Thinking...</span>
                </span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={placeholder}
            className="flex-1 resize-none bg-black/40 border-white/10 focus:border-white/30 text-white placeholder:text-gray-500"
            style={{ minHeight: '44px', maxHeight: '100px' }}
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
          />
          <Button
            onClick={onSend}
            disabled={loading || !input.trim()}
            className="px-4 self-end"
            style={{
              background: loading || !input.trim()
                ? 'rgba(255,255,255,0.1)'
                : `linear-gradient(135deg, ${agentColor} 0%, ${isSarai ? theme.roseDark : theme.goldDark} 100%)`,
              color: loading || !input.trim() ? '#666' : isSarai ? '#fff' : '#000',
              border: 'none',
            }}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default function MarketingDashboard() {
  const [saraiMessages, setSaraiMessages] = useState<Message[]>([]);
  const [museMessages, setMuseMessages] = useState<Message[]>([]);
  const [saraiInput, setSaraiInput] = useState('');
  const [museInput, setMuseInput] = useState('');
  const [saraiLoading, setSaraiLoading] = useState(false);
  const [museLoading, setMuseLoading] = useState(false);

  const sendToSarai = async () => {
    if (!saraiInput.trim() || saraiLoading) return;
    const userMsg: Message = { role: 'user', content: saraiInput };
    setSaraiMessages(prev => [...prev, userMsg]);
    const msg = saraiInput;
    setSaraiInput('');
    setSaraiLoading(true);

    try {
      const res = await fetch('/api/sarai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setSaraiMessages(prev => [...prev, { role: 'assistant', content: data.response || JSON.stringify(data) }]);
    } catch {
      setSaraiMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Is Sarai running on admiral-server?' }]);
    }
    setSaraiLoading(false);
  };

  const sendToMuse = async () => {
    if (!museInput.trim() || museLoading) return;
    const userMsg: Message = { role: 'user', content: museInput };
    setMuseMessages(prev => [...prev, userMsg]);
    const msg = museInput;
    setMuseInput('');
    setMuseLoading(true);

    try {
      const res = await fetch('/api/muse/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg }),
      });
      const data = await res.json();
      setMuseMessages(prev => [...prev, { role: 'assistant', content: data.response || JSON.stringify(data) }]);
    } catch {
      setMuseMessages(prev => [...prev, { role: 'assistant', content: 'Connection error. Is MUSE running on admiral-server?' }]);
    }
    setMuseLoading(false);
  };

  const handleContentIdea = (idea: string) => {
    setSaraiInput(`Write a LinkedIn post about: ${idea}`);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="min-h-screen relative" style={{ background: 'linear-gradient(135deg, #1a1510 0%, #0d0a07 100%)' }}>
      <GoldParticles />

      <div className="relative z-10 p-4 md:p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1
            className="text-3xl md:text-4xl font-light tracking-[0.2em] mb-2"
            style={{ color: theme.gold, textShadow: '0 0 40px rgba(212, 175, 55, 0.5)' }}
          >
            STUDIO
          </h1>
          <p style={{ color: 'rgba(212, 175, 55, 0.6)' }} className="tracking-wide text-sm">
            Marketing Command Center
          </p>
        </div>

        {/* Quick Post Buttons */}
        <Card className="border backdrop-blur-sm mb-6" style={{ background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.15)' }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5" style={{ color: theme.gold }} />
                <span className="text-sm font-medium" style={{ color: theme.goldLight }}>Quick Post</span>
              </div>
              <QuickPost />
            </div>
          </CardContent>
        </Card>

        {/* Dual Agent Chat */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <AgentChat
            agent="sarai"
            messages={saraiMessages}
            input={saraiInput}
            setInput={setSaraiInput}
            loading={saraiLoading}
            onSend={sendToSarai}
            onCopy={copyToClipboard}
          />
          <AgentChat
            agent="muse"
            messages={museMessages}
            input={museInput}
            setInput={setMuseInput}
            loading={museLoading}
            onSend={sendToMuse}
            onCopy={copyToClipboard}
          />
        </div>

        {/* Content Ideas */}
        <Card className="border backdrop-blur-sm" style={{ background: 'rgba(212, 175, 55, 0.05)', borderColor: 'rgba(212, 175, 55, 0.15)' }}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3 justify-center">
              <Sparkles className="w-4 h-4" style={{ color: theme.gold }} />
              <span className="text-sm font-medium" style={{ color: theme.goldLight }}>Content Ideas</span>
            </div>
            <ContentIdeas onSelect={handleContentIdea} />
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs" style={{ color: 'rgba(212, 175, 55, 0.4)' }}>
          Admiral Energy Marketing Suite
        </div>
      </div>
    </div>
  );
}
