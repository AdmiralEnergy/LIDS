import { WizardState } from '@/pages/create';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

const contentTypes = [
  {
    id: 'tiktok-short',
    label: 'TikTok Short',
    description: '15-60 second vertical video',
    icon: '🎵',
    color: '#00f2ea',
  },
  {
    id: 'youtube-short',
    label: 'YouTube Short',
    description: '60 second vertical video',
    icon: '▶️',
    color: '#ff0000',
  },
  {
    id: 'explainer',
    label: 'Explainer',
    description: '2-5 minute educational video',
    icon: '📊',
    color: '#D4AF37',
  },
  {
    id: 'image',
    label: 'Image/Carousel',
    description: 'Static image or carousel',
    icon: '🖼️',
    color: '#E8B4BC',
  },
];

export function TypeSelector({ state, updateState, onNext }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl text-white font-medium">What are you creating?</h2>
        <p className="text-gray-400 text-sm mt-1">Choose the type of content you want to create</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contentTypes.map(type => (
          <Card
            key={type.id}
            className={`p-5 cursor-pointer transition-all duration-200 ${
              state.contentType === type.id
                ? 'border-[#D4AF37] bg-[#D4AF37]/10 shadow-lg shadow-[#D4AF37]/20'
                : 'border-gray-700 bg-black/30 hover:border-gray-600 hover:bg-black/50'
            }`}
            onClick={() => updateState({ contentType: type.id as any })}
          >
            <div className="flex items-start gap-4">
              <div
                className="text-3xl p-2 rounded-lg"
                style={{ backgroundColor: `${type.color}20` }}
              >
                {type.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">{type.label}</h3>
                <p className="text-gray-400 text-sm mt-0.5">{type.description}</p>
              </div>
              {state.contentType === type.id && (
                <div className="w-5 h-5 rounded-full bg-[#D4AF37] flex items-center justify-center">
                  <svg className="w-3 h-3 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Button
        onClick={onNext}
        disabled={!state.contentType}
        className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black font-medium h-12 text-base"
      >
        Continue to Script
      </Button>
    </div>
  );
}
