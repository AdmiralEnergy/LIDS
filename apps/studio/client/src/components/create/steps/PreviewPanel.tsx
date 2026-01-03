import { useState } from 'react';
import { WizardState } from '@/pages/create';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, Play, Pause, Volume2, VolumeX } from 'lucide-react';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PreviewPanel({ state, updateState, onNext, onBack }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const isVideo = state.contentType !== 'image';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl text-white font-medium">Preview your content</h2>
        <p className="text-gray-400 text-sm mt-1">
          Review and make any final adjustments
        </p>
      </div>

      {/* Preview Container - Phone-like frame */}
      <div className="flex justify-center">
        <div className="relative">
          {/* Phone frame */}
          <div
            className="w-[280px] md:w-[320px] rounded-[2.5rem] p-3 bg-gray-900 shadow-2xl"
            style={{ aspectRatio: '9/19.5' }}
          >
            {/* Screen */}
            <div className="w-full h-full rounded-[2rem] overflow-hidden bg-black relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-900 rounded-b-xl z-10" />

              {/* Content */}
              {isVideo && state.videoUrl ? (
                <video
                  src={state.videoUrl}
                  poster={state.thumbnailUrl || undefined}
                  className="w-full h-full object-cover"
                  muted={isMuted}
                  loop
                  playsInline
                  autoPlay
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
              ) : state.thumbnailUrl ? (
                <img
                  src={state.thumbnailUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  No preview available
                </div>
              )}

              {/* Video Controls Overlay */}
              {isVideo && (
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3 z-20">
                  <button
                    onClick={() => {
                      const video = document.querySelector('video');
                      if (video) {
                        isPlaying ? video.pause() : video.play();
                      }
                    }}
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                  </button>
                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Platform indicator */}
          <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full text-xs font-medium bg-[#D4AF37] text-black">
            {state.contentType === 'tiktok-short'
              ? 'TikTok'
              : state.contentType === 'youtube-short'
              ? 'YouTube'
              : state.contentType === 'explainer'
              ? 'Explainer'
              : 'Image'}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          onClick={onBack}
          className="border-gray-600 text-gray-300 hover:bg-white/10"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
        {state.videoUrl && (
          <Button
            variant="outline"
            asChild
            className="border-gray-600 text-gray-300 hover:bg-white/10"
          >
            <a href={state.videoUrl} download={`admiral-${state.contentType}-${Date.now()}.mp4`}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </a>
          </Button>
        )}
      </div>

      {/* Content Info */}
      <div className="bg-black/30 rounded-lg p-4 border border-gray-800">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Type</div>
            <div className="text-white capitalize">{state.contentType?.replace('-', ' ')}</div>
          </div>
          <div>
            <div className="text-gray-500">Style</div>
            <div className="text-white capitalize">{state.style}</div>
          </div>
          <div className="col-span-2">
            <div className="text-gray-500">Script</div>
            <div className="text-gray-300 text-xs line-clamp-2 mt-1">{state.script}</div>
          </div>
        </div>
      </div>

      <Button
        onClick={onNext}
        className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black font-medium h-12 text-base"
      >
        Continue to Schedule
      </Button>
    </div>
  );
}
