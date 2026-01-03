import { useState, useEffect, useCallback } from 'react';
import { WizardState } from '@/pages/create';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Cpu, Cloud, Zap, RefreshCw } from 'lucide-react';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

type Provider = 'auto' | 'comfyui' | 'openart';
type Status = 'idle' | 'queued' | 'processing' | 'complete' | 'failed';

const providers = [
  {
    id: 'auto' as Provider,
    label: 'Auto',
    description: 'Best available',
    icon: Zap,
  },
  {
    id: 'comfyui' as Provider,
    label: 'ComfyUI',
    description: 'Local GPU',
    icon: Cpu,
  },
  {
    id: 'openart' as Provider,
    label: 'OpenArt.ai',
    description: 'Cloud',
    icon: Cloud,
  },
];

const statusMessages: Record<string, string> = {
  queued: 'Queued for processing...',
  processing: 'Generating your content...',
  complete: 'Generation complete!',
  failed: 'Generation failed',
};

export function GenerationPanel({ state, updateState, onNext }: Props) {
  const [provider, setProvider] = useState<Provider>('auto');
  const [status, setStatus] = useState<Status>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Simulate generation (will be replaced with real API)
  const handleGenerate = useCallback(async () => {
    setStatus('queued');
    setProgress(0);
    setError(null);

    try {
      // Try real API first
      const response = await fetch('/api/video-gen/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: state.contentType,
          script: state.script,
          style: state.style,
          provider,
        }),
      });

      if (response.ok) {
        const { jobId } = await response.json();
        updateState({ jobId });
        // Real WebSocket would go here
      } else {
        // Fall back to mock generation
        throw new Error('API not available');
      }
    } catch {
      // Mock generation for demo
      setStatus('processing');

      const steps = [10, 25, 40, 55, 70, 85, 95, 100];
      for (const step of steps) {
        await new Promise(r => setTimeout(r, 400 + Math.random() * 300));
        setProgress(step);
      }

      // Mock success
      updateState({
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        thumbnailUrl: 'https://picsum.photos/seed/solar/400/711',
        jobId: 'mock-' + Date.now(),
      });
      setStatus('complete');
    }
  }, [state.contentType, state.script, state.style, provider, updateState]);

  // Auto-proceed when complete
  useEffect(() => {
    if (status === 'complete' && state.videoUrl) {
      const timer = setTimeout(() => onNext(), 1500);
      return () => clearTimeout(timer);
    }
  }, [status, state.videoUrl, onNext]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl text-white font-medium">Generate your content</h2>
        <p className="text-gray-400 text-sm mt-1">
          Choose a provider and start generation
        </p>
      </div>

      {/* Provider Selection */}
      <div>
        <label className="text-gray-400 text-sm mb-3 block">Generation Provider</label>
        <div className="grid grid-cols-3 gap-3">
          {providers.map(p => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setProvider(p.id)}
                disabled={status !== 'idle'}
                className={`p-4 rounded-lg border text-left transition-all ${
                  provider === p.id
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                    : 'border-gray-700 bg-black/30 hover:border-gray-600'
                } ${status !== 'idle' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon
                  className={`w-5 h-5 mb-2 ${
                    provider === p.id ? 'text-[#D4AF37]' : 'text-gray-400'
                  }`}
                />
                <div className="text-white text-sm font-medium">{p.label}</div>
                <div className="text-gray-500 text-xs">{p.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Script Preview */}
      <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
        <div className="text-gray-400 text-xs uppercase tracking-wider mb-2">Script Preview</div>
        <div className="text-gray-300 text-sm line-clamp-4 whitespace-pre-wrap">
          {state.script}
        </div>
      </div>

      {/* Generation Status */}
      {status === 'idle' && (
        <Button
          onClick={handleGenerate}
          className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black font-medium h-12 text-base"
        >
          <Zap className="w-5 h-5 mr-2" />
          Start Generation
        </Button>
      )}

      {(status === 'queued' || status === 'processing') && (
        <div className="space-y-4">
          <div className="relative">
            <Progress value={progress} className="h-3 bg-gray-800" />
            <div
              className="absolute top-0 left-0 h-3 rounded-full transition-all duration-300"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #D4AF37 0%, #F5E6A3 50%, #D4AF37 100%)',
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-gray-300">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>{statusMessages[status]} {progress}%</span>
          </div>
        </div>
      )}

      {status === 'complete' && (
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="text-green-400 font-medium">{statusMessages.complete}</div>
          <p className="text-gray-400 text-sm">Taking you to preview...</p>
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-4">
          <div className="text-red-400 text-center p-4 bg-red-500/10 rounded-lg border border-red-500/30">
            {error || 'Generation failed. Please try again.'}
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setStatus('idle')}
              className="flex-1 border-gray-600"
            >
              Try Different Provider
            </Button>
            <Button
              onClick={handleGenerate}
              className="flex-1 bg-[#D4AF37] hover:bg-[#B8962F] text-black"
            >
              Retry
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
