import { useState } from 'react';
import { WizardState } from '@/pages/create';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, Lightbulb } from 'lucide-react';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

const styleOptions = [
  { id: 'energetic', label: 'Energetic', description: 'High energy, fast-paced' },
  { id: 'professional', label: 'Professional', description: 'Corporate, authoritative' },
  { id: 'casual', label: 'Casual', description: 'Friendly, conversational' },
  { id: 'educational', label: 'Educational', description: 'Informative, explanatory' },
];

const scriptPrompts: Record<string, string[]> = {
  'tiktok-short': [
    'Hook viewers in the first 3 seconds with a surprising fact',
    'Use a pattern interrupt - start with something unexpected',
    'Ask a question that makes viewers want to stay for the answer',
  ],
  'youtube-short': [
    'Start with the end result to hook viewers',
    'Use a listicle format (3 tips, 5 facts, etc.)',
    'Tell a quick before/after story',
  ],
  'explainer': [
    'Break down a complex solar topic into simple steps',
    'Use analogies to explain technical concepts',
    'Address common objections with clear answers',
  ],
  'image': [
    'Write a compelling headline that stops the scroll',
    'Use statistics that surprise and inform',
    'Create a call-to-action that drives engagement',
  ],
};

export function ScriptEditor({ state, updateState, onNext }: Props) {
  const [generating, setGenerating] = useState(false);
  const [showTips, setShowTips] = useState(false);

  const contentTypeLabel = {
    'tiktok-short': 'TikTok Short (15-60 seconds)',
    'youtube-short': 'YouTube Short (60 seconds)',
    'explainer': 'Explainer Video (2-5 minutes)',
    'image': 'Image/Carousel',
  }[state.contentType || 'tiktok-short'];

  const tips = scriptPrompts[state.contentType || 'tiktok-short'] || [];

  const askSarai = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/sarai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Write a ${contentTypeLabel} script about solar energy savings for Admiral Energy.
          Style: ${state.style}.
          Make it engaging and optimized for ${state.contentType?.includes('tiktok') ? 'TikTok' : 'YouTube'}.
          ${state.contentType === 'tiktok-short' ? 'Hook viewers in the first 3 seconds.' : ''}
          Include a clear call-to-action at the end.`,
        }),
      });
      const data = await response.json();
      updateState({ script: data.response || data.message || '' });
    } catch (e) {
      console.error('Sarai error:', e);
      // Fallback mock script
      updateState({
        script: `[HOOK - First 3 seconds]\n"Did you know solar panels could cut your electric bill by 80%?"\n\n[MAIN CONTENT]\nAt Admiral Energy, we've helped hundreds of homeowners save thousands on energy costs.\n\nHere's how it works:\n1. We analyze your roof and energy usage\n2. Design a custom solar system\n3. Handle all permits and installation\n4. You start saving from day one\n\n[CALL TO ACTION]\nComment "SAVE" below and we'll show you exactly how much you could save!`,
      });
    }
    setGenerating(false);
  };

  const wordCount = state.script.trim().split(/\s+/).filter(Boolean).length;
  const estimatedSeconds = Math.round(wordCount / 2.5); // ~150 words per minute

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl text-white font-medium">Write your script</h2>
          <p className="text-gray-400 text-sm mt-1">For: {contentTypeLabel}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowTips(!showTips)}
            className="border-gray-600 text-gray-300 hover:bg-white/10"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Tips
          </Button>
          <Button
            variant="outline"
            onClick={askSarai}
            disabled={generating}
            className="border-[#E8B4BC] text-[#E8B4BC] hover:bg-[#E8B4BC]/10"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            Ask Sarai
          </Button>
        </div>
      </div>

      {/* Tips Panel */}
      {showTips && (
        <div className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-4">
          <h4 className="text-[#D4AF37] font-medium mb-2">Script Tips</h4>
          <ul className="space-y-2">
            {tips.map((tip, i) => (
              <li key={i} className="text-gray-300 text-sm flex gap-2">
                <span className="text-[#D4AF37]">•</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Script Textarea */}
      <div className="relative">
        <Textarea
          value={state.script}
          onChange={(e) => updateState({ script: e.target.value })}
          placeholder="Enter your script or click 'Ask Sarai' to generate one...

Example structure:
[HOOK] - Grab attention in first 3 seconds
[MAIN CONTENT] - Deliver your message
[CALL TO ACTION] - Tell viewers what to do next"
          className="min-h-[250px] bg-black/50 border-gray-700 text-white placeholder:text-gray-500 resize-none"
        />
        <div className="absolute bottom-3 right-3 text-xs text-gray-500">
          {wordCount} words • ~{estimatedSeconds}s
        </div>
      </div>

      {/* Style Selection */}
      <div>
        <label className="text-gray-400 text-sm mb-2 block">Content Style</label>
        <div className="flex flex-wrap gap-2">
          {styleOptions.map(opt => (
            <Button
              key={opt.id}
              variant={state.style === opt.id ? 'default' : 'outline'}
              onClick={() => updateState({ style: opt.id })}
              className={
                state.style === opt.id
                  ? 'bg-[#D4AF37] text-black hover:bg-[#B8962F]'
                  : 'border-gray-600 text-gray-300 hover:bg-white/10'
              }
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!state.script.trim()}
        className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black font-medium h-12 text-base"
      >
        Continue to Generation
      </Button>
    </div>
  );
}
