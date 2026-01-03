import { ReactNode } from 'react';
import { ChevronLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardContainerProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onBack: () => void;
  showProgress?: boolean;
  children: ReactNode;
}

export function WizardContainer({
  currentStep,
  totalSteps,
  stepTitles,
  onBack,
  showProgress = true,
  children,
}: WizardContainerProps) {
  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      {showProgress && (
        <div className="flex items-center gap-1 md:gap-2 overflow-x-auto pb-2">
          {stepTitles.map((title, i) => {
            const stepNum = i + 1;
            const isComplete = stepNum < currentStep;
            const isCurrent = stepNum === currentStep;

            return (
              <div key={i} className="flex items-center flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    isComplete
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-[#D4AF37] text-black'
                      : 'bg-gray-700 text-gray-400'
                  }`}
                >
                  {isComplete ? <Check className="w-4 h-4" /> : stepNum}
                </div>
                <span
                  className={`ml-2 text-sm hidden md:inline ${
                    isCurrent ? 'text-[#D4AF37] font-medium' : 'text-gray-500'
                  }`}
                >
                  {title}
                </span>
                {i < totalSteps - 1 && (
                  <div
                    className={`w-4 md:w-8 h-0.5 mx-1 md:mx-2 transition-colors ${
                      isComplete ? 'bg-green-500' : 'bg-gray-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Back Button */}
      {currentStep > 1 && currentStep <= 5 && (
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-gray-400 hover:text-white hover:bg-white/10"
        >
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      )}

      {/* Step Content */}
      <div className="bg-black/40 rounded-xl p-6 border border-gray-800 backdrop-blur-sm">
        {children}
      </div>
    </div>
  );
}
