import { useState } from 'react';
import { WizardContainer } from '@/components/create/WizardContainer';
import { TypeSelector } from '@/components/create/steps/TypeSelector';
import { ScriptEditor } from '@/components/create/steps/ScriptEditor';
import { GenerationPanel } from '@/components/create/steps/GenerationPanel';
import { PreviewPanel } from '@/components/create/steps/PreviewPanel';
import { SchedulePanel } from '@/components/create/steps/SchedulePanel';
import { SuccessPanel } from '@/components/create/steps/SuccessPanel';

export interface WizardState {
  contentType: 'tiktok-short' | 'youtube-short' | 'explainer' | 'image' | null;
  script: string;
  style: string;
  jobId: string | null;
  videoUrl: string | null;
  thumbnailUrl: string | null;
  platforms: string[];
  scheduledDate: Date | null;
  caption: string;
  hashtags: string[];
}

const initialState: WizardState = {
  contentType: null,
  script: '',
  style: 'energetic',
  jobId: null,
  videoUrl: null,
  thumbnailUrl: null,
  platforms: [],
  scheduledDate: null,
  caption: '',
  hashtags: [],
};

export default function CreateWizard() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);

  const updateState = (updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const resetWizard = () => {
    setState(initialState);
    setStep(1);
  };

  const steps = [
    { title: 'Type', component: TypeSelector },
    { title: 'Script', component: ScriptEditor },
    { title: 'Generate', component: GenerationPanel },
    { title: 'Preview', component: PreviewPanel },
    { title: 'Schedule', component: SchedulePanel },
    { title: 'Success', component: SuccessPanel },
  ];

  const CurrentStep = steps[step - 1].component;

  // Don't show step indicator on success page
  const showProgress = step < 6;

  return (
    <div
      className="min-h-screen p-4 md:p-8 pb-24 md:pb-8"
      style={{ background: 'linear-gradient(135deg, #1a1512 0%, #0d0a07 100%)' }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-light mb-8 tracking-wide" style={{ color: '#D4AF37' }}>
          Create Content
        </h1>

        <WizardContainer
          currentStep={step}
          totalSteps={5}
          stepTitles={steps.slice(0, 5).map(s => s.title)}
          onBack={() => setStep(s => Math.max(1, s - 1))}
          showProgress={showProgress}
        >
          <CurrentStep
            state={state}
            updateState={updateState}
            onNext={() => setStep(s => Math.min(6, s + 1))}
            onBack={() => setStep(s => Math.max(1, s - 1))}
            onReset={resetWizard}
          />
        </WizardContainer>
      </div>
    </div>
  );
}
