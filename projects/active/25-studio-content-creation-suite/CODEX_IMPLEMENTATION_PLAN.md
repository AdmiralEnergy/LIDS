# Codex Implementation Plan - Project 25: Studio Content Creation Suite

## Implementation Status (Updated 2026-01-02)

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1 | PENDING | Video generator service on admiral-server |
| Phase 2 | **COMPLETE** | All 7 wizard components created |
| Phase 3 | **READY** | Postiz deployed to Oracle ARM (193.122.153.249:3200) |
| Phase 4 | **COMPLETE** | Preview + Schedule panels done |
| Phase 5 | PENDING | Environment variables (when backend ready) |

**Completed Files:**
- `pages/create.tsx` - 6-step wizard page
- `components/create/WizardContainer.tsx` - Progress bar + navigation
- `components/create/steps/TypeSelector.tsx` - Content type selection
- `components/create/steps/ScriptEditor.tsx` - Script + Sarai integration
- `components/create/steps/GenerationPanel.tsx` - Provider + mock generation
- `components/create/steps/PreviewPanel.tsx` - Phone-frame preview
- `components/create/steps/SchedulePanel.tsx` - Platform + timing
- `components/create/steps/SuccessPanel.tsx` - Confetti + XP animation
- `App.tsx` - Updated with /create route and Video nav icon

**Modified Files:**
- `packages/compass-sales/package.json` - Fixed workspace:* → *
- `packages/compass-studio/package.json` - Fixed workspace:* → *

---

## System Prompt

```
You are implementing a content creation wizard for Studio, the marketing dashboard for Admiral Energy.

Context:
- App: apps/studio (React 18 + Vite + Tailwind + shadcn/ui)
- Router: Wouter (lightweight)
- State: React Context + TanStack Query + Dexie (IndexedDB)
- Backend: Express on port 3103
- Current nav: Home, Create, Calendar, Agents, Team (5 items) ✓ UPDATED

Target User: Leigh Edwards (CMO) - needs simple, guided workflow

Brand tokens:
- Gold: #D4AF37 (primary accent)
- Rose Pink: #E8B4BC (Sarai color)
- Dark gradient: #1a1510 → #0d0a07 (backgrounds)

Available Services:
- Sarai (content agent): admiral-server:4065
- Muse (strategy agent): admiral-server:4066
- Postiz (scheduling): Oracle ARM 193.122.153.249:3200
- Video Generator (NEW): admiral-server:4200

Key existing files:
- apps/studio/client/src/App.tsx - Router and nav
- apps/studio/server/routes.ts - API routes (1027 lines)
- apps/studio/client/src/lib/contentDb.ts - Dexie schema
- apps/studio/client/src/pages/marketing.tsx - Agent chat reference
```

---

## Phase 1: Video Generation Service (admiral-server)

**Location:** `C:\LifeOS\LifeOS-Core\agents\infrastructure\video-generator/`

### Task 1.1: Initialize Service

Create `package.json`:
```json
{
  "name": "video-generator",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  },
  "dependencies": {
    "express": "^4.18.2",
    "ws": "^8.14.2",
    "better-sqlite3": "^9.2.2",
    "uuid": "^9.0.0",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/ws": "^8.5.10",
    "@types/better-sqlite3": "^7.6.8",
    "tsx": "^4.7.0",
    "typescript": "^5.3.3"
  }
}
```

### Task 1.2: Create Express + WebSocket Server

**File:** `src/index.ts`

```typescript
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { generateRoutes } from './routes/generate.js';
import { templateRoutes } from './routes/templates.js';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws/progress' });

app.use(express.json());

// CORS for Studio
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Routes
app.use('/api', generateRoutes);
app.use('/api', templateRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', service: 'video-generator' }));

// WebSocket connections stored by jobId
export const wsClients = new Map<string, Set<WebSocket>>();

wss.on('connection', (ws, req) => {
  const jobId = new URL(req.url!, 'http://localhost').searchParams.get('jobId');
  if (jobId) {
    if (!wsClients.has(jobId)) wsClients.set(jobId, new Set());
    wsClients.get(jobId)!.add(ws);
    ws.on('close', () => wsClients.get(jobId)?.delete(ws));
  }
});

const PORT = process.env.PORT || 4200;
server.listen(PORT, () => console.log(`Video generator running on :${PORT}`));
```

### Task 1.3: Create Generation Routes

**File:** `src/routes/generate.ts`

```typescript
import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { addJob, getJob, updateJob } from '../queue/jobQueue.js';
import { generateWithComfyUI } from '../services/comfyui.js';
import { generateWithOpenArt } from '../services/openart.js';
import { wsClients } from '../index.js';

export const generateRoutes = Router();

generateRoutes.post('/generate', async (req, res) => {
  const { type, script, style, duration, provider = 'auto' } = req.body;

  const jobId = uuid();
  await addJob({
    id: jobId,
    type,
    script,
    style,
    duration,
    provider,
    status: 'queued',
    progress: 0,
    createdAt: new Date().toISOString(),
  });

  // Start generation in background
  processJob(jobId);

  res.json({ jobId, status: 'queued' });
});

generateRoutes.get('/status/:jobId', async (req, res) => {
  const job = await getJob(req.params.jobId);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

async function processJob(jobId: string) {
  const job = await getJob(jobId);
  if (!job) return;

  const broadcast = (data: any) => {
    wsClients.get(jobId)?.forEach(ws => ws.send(JSON.stringify(data)));
  };

  try {
    await updateJob(jobId, { status: 'processing', progress: 10 });
    broadcast({ jobId, status: 'processing', progress: 10 });

    let result;
    const provider = job.provider === 'auto' ? 'comfyui' : job.provider;

    if (provider === 'comfyui') {
      result = await generateWithComfyUI(job, (progress) => {
        updateJob(jobId, { progress });
        broadcast({ jobId, status: 'processing', progress });
      });
    } else {
      result = await generateWithOpenArt(job, (progress) => {
        updateJob(jobId, { progress });
        broadcast({ jobId, status: 'processing', progress });
      });
    }

    await updateJob(jobId, { status: 'complete', progress: 100, outputUrl: result.url });
    broadcast({ jobId, status: 'complete', progress: 100, outputUrl: result.url });
  } catch (error) {
    await updateJob(jobId, { status: 'failed', error: String(error) });
    broadcast({ jobId, status: 'failed', error: String(error) });
  }
}
```

### Task 1.4: Create ComfyUI Service

**File:** `src/services/comfyui.ts`

```typescript
const COMFYUI_URL = process.env.COMFYUI_URL || 'http://192.168.1.X:8188'; // AdmiralEnergy IP

export async function generateWithComfyUI(
  job: any,
  onProgress: (progress: number) => void
): Promise<{ url: string }> {
  // Load workflow template based on job.type
  const workflow = await loadWorkflow(job.type);

  // Inject prompt/script into workflow
  workflow.prompt = job.script;

  // Submit to ComfyUI
  const response = await fetch(`${COMFYUI_URL}/prompt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: workflow }),
  });

  const { prompt_id } = await response.json();

  // Poll for completion
  let progress = 10;
  while (progress < 95) {
    await new Promise(r => setTimeout(r, 2000));
    const history = await fetch(`${COMFYUI_URL}/history/${prompt_id}`).then(r => r.json());

    if (history[prompt_id]?.status?.completed) {
      // Get output file
      const outputs = history[prompt_id].outputs;
      const videoOutput = Object.values(outputs).find((o: any) => o.videos?.length);
      if (videoOutput) {
        const filename = (videoOutput as any).videos[0].filename;
        return { url: `${COMFYUI_URL}/view?filename=${filename}` };
      }
    }

    progress += 10;
    onProgress(Math.min(progress, 95));
  }

  throw new Error('ComfyUI generation timeout');
}

async function loadWorkflow(type: string) {
  const workflows: Record<string, any> = {
    'tiktok-short': { /* workflow JSON */ },
    'youtube-short': { /* workflow JSON */ },
    'image': { /* workflow JSON */ },
  };
  return workflows[type] || workflows['image'];
}
```

### Task 1.5: Create OpenArt Service

**File:** `src/services/openart.ts`

```typescript
const OPENART_API_KEY = process.env.OPENART_API_KEY;
const OPENART_URL = 'https://openart.ai/api/v1';

export async function generateWithOpenArt(
  job: any,
  onProgress: (progress: number) => void
): Promise<{ url: string }> {
  onProgress(20);

  const response = await fetch(`${OPENART_URL}/generate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENART_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      prompt: job.script,
      style: job.style,
      type: job.type === 'image' ? 'image' : 'video',
    }),
  });

  const { id } = await response.json();
  onProgress(40);

  // Poll for completion
  let attempts = 0;
  while (attempts < 60) {
    await new Promise(r => setTimeout(r, 3000));
    const status = await fetch(`${OPENART_URL}/status/${id}`, {
      headers: { 'Authorization': `Bearer ${OPENART_API_KEY}` },
    }).then(r => r.json());

    if (status.status === 'complete') {
      return { url: status.output_url };
    }

    attempts++;
    onProgress(40 + Math.min(attempts, 50));
  }

  throw new Error('OpenArt generation timeout');
}
```

### Task 1.6: Create Job Queue

**File:** `src/queue/jobQueue.ts`

```typescript
import Database from 'better-sqlite3';

const db = new Database('jobs.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    type TEXT,
    script TEXT,
    style TEXT,
    duration INTEGER,
    provider TEXT,
    status TEXT,
    progress INTEGER,
    outputUrl TEXT,
    error TEXT,
    createdAt TEXT,
    updatedAt TEXT
  )
`);

export async function addJob(job: any) {
  const stmt = db.prepare(`
    INSERT INTO jobs (id, type, script, style, duration, provider, status, progress, createdAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(job.id, job.type, job.script, job.style, job.duration, job.provider, job.status, job.progress, job.createdAt);
}

export async function getJob(id: string) {
  return db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
}

export async function updateJob(id: string, updates: any) {
  const fields = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), new Date().toISOString(), id];
  db.prepare(`UPDATE jobs SET ${fields}, updatedAt = ? WHERE id = ?`).run(...values);
}
```

---

## Phase 2: Studio Create Wizard UI

### Task 2.1: Add Create Route to App.tsx

**File:** `apps/studio/client/src/App.tsx`

Add import:
```typescript
import { Video } from "lucide-react";
import CreateWizard from "@/pages/create";
```

Update navItems:
```typescript
const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/create', icon: Video, label: 'Create' },  // NEW
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/chat', icon: MessageSquare, label: 'Agents' },
  { path: '/team', icon: Users, label: 'Team' },
];
```

Add route:
```typescript
<Route path="/create" component={CreateWizard} />
```

### Task 2.2: Create Wizard Page

**File:** `apps/studio/client/src/pages/create.tsx`

```typescript
import { useState } from 'react';
import { WizardContainer } from '@/components/create/WizardContainer';
import { TypeSelector } from '@/components/create/steps/TypeSelector';
import { ScriptEditor } from '@/components/create/steps/ScriptEditor';
import { GenerationPanel } from '@/components/create/steps/GenerationPanel';
import { PreviewPanel } from '@/components/create/steps/PreviewPanel';
import { SchedulePanel } from '@/components/create/steps/SchedulePanel';

export interface WizardState {
  contentType: 'tiktok-short' | 'youtube-short' | 'explainer' | 'image' | null;
  script: string;
  style: string;
  jobId: string | null;
  videoUrl: string | null;
  platforms: string[];
  scheduledDate: Date | null;
  caption: string;
}

const initialState: WizardState = {
  contentType: null,
  script: '',
  style: 'energetic',
  jobId: null,
  videoUrl: null,
  platforms: [],
  scheduledDate: null,
  caption: '',
};

export default function CreateWizard() {
  const [step, setStep] = useState(1);
  const [state, setState] = useState<WizardState>(initialState);

  const updateState = (updates: Partial<WizardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const steps = [
    { title: 'Type', component: TypeSelector },
    { title: 'Script', component: ScriptEditor },
    { title: 'Generate', component: GenerationPanel },
    { title: 'Preview', component: PreviewPanel },
    { title: 'Schedule', component: SchedulePanel },
  ];

  const CurrentStep = steps[step - 1].component;

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'linear-gradient(135deg, #1a1512 0%, #0d0a07 100%)' }}>
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-light mb-8" style={{ color: '#D4AF37' }}>
          Create Content
        </h1>

        <WizardContainer
          currentStep={step}
          totalSteps={5}
          stepTitles={steps.map(s => s.title)}
          onBack={() => setStep(s => Math.max(1, s - 1))}
        >
          <CurrentStep
            state={state}
            updateState={updateState}
            onNext={() => setStep(s => Math.min(5, s + 1))}
            onBack={() => setStep(s => Math.max(1, s - 1))}
          />
        </WizardContainer>
      </div>
    </div>
  );
}
```

### Task 2.3: Create WizardContainer

**File:** `apps/studio/client/src/components/create/WizardContainer.tsx`

```typescript
import { ReactNode } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WizardContainerProps {
  currentStep: number;
  totalSteps: number;
  stepTitles: string[];
  onBack: () => void;
  children: ReactNode;
}

export function WizardContainer({ currentStep, totalSteps, stepTitles, onBack, children }: WizardContainerProps) {
  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="flex items-center gap-2">
        {stepTitles.map((title, i) => (
          <div key={i} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                i + 1 <= currentStep ? 'bg-[#D4AF37] text-black' : 'bg-gray-700 text-gray-400'
              }`}
            >
              {i + 1}
            </div>
            <span className={`ml-2 text-sm ${i + 1 === currentStep ? 'text-[#D4AF37]' : 'text-gray-500'}`}>
              {title}
            </span>
            {i < totalSteps - 1 && <div className="w-8 h-0.5 bg-gray-700 mx-2" />}
          </div>
        ))}
      </div>

      {/* Back Button */}
      {currentStep > 1 && (
        <Button variant="ghost" onClick={onBack} className="text-gray-400">
          <ChevronLeft className="w-4 h-4 mr-1" /> Back
        </Button>
      )}

      {/* Step Content */}
      <div className="bg-black/40 rounded-xl p-6 border border-gray-800">
        {children}
      </div>
    </div>
  );
}
```

### Task 2.4: Create TypeSelector Step

**File:** `apps/studio/client/src/components/create/steps/TypeSelector.tsx`

```typescript
import { WizardState } from '@/pages/create';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

const contentTypes = [
  { id: 'tiktok-short', label: 'TikTok Short', description: '15-60 second vertical video', icon: '🎵' },
  { id: 'youtube-short', label: 'YouTube Short', description: '60 second vertical video', icon: '▶️' },
  { id: 'explainer', label: 'Explainer', description: '2-5 minute educational video', icon: '📊' },
  { id: 'image', label: 'Image/Carousel', description: 'Static image or carousel', icon: '🖼️' },
];

export function TypeSelector({ state, updateState, onNext }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl text-white">What are you creating?</h2>

      <div className="grid grid-cols-2 gap-4">
        {contentTypes.map(type => (
          <Card
            key={type.id}
            className={`p-4 cursor-pointer transition-all ${
              state.contentType === type.id
                ? 'border-[#D4AF37] bg-[#D4AF37]/10'
                : 'border-gray-700 hover:border-gray-600'
            }`}
            onClick={() => updateState({ contentType: type.id as any })}
          >
            <div className="text-3xl mb-2">{type.icon}</div>
            <h3 className="text-white font-medium">{type.label}</h3>
            <p className="text-gray-400 text-sm">{type.description}</p>
          </Card>
        ))}
      </div>

      <Button
        onClick={onNext}
        disabled={!state.contentType}
        className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black"
      >
        Continue
      </Button>
    </div>
  );
}
```

### Task 2.5: Create ScriptEditor Step

**File:** `apps/studio/client/src/components/create/steps/ScriptEditor.tsx`

```typescript
import { useState } from 'react';
import { WizardState } from '@/pages/create';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2 } from 'lucide-react';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

export function ScriptEditor({ state, updateState, onNext }: Props) {
  const [generating, setGenerating] = useState(false);

  const askSarai = async () => {
    setGenerating(true);
    try {
      const response = await fetch('/api/sarai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Write a ${state.contentType} script about solar energy savings. Make it engaging and under 60 seconds when read aloud.`,
        }),
      });
      const data = await response.json();
      updateState({ script: data.response || data.message });
    } catch (e) {
      console.error('Sarai error:', e);
    }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl text-white">Write your script</h2>
        <Button
          variant="outline"
          onClick={askSarai}
          disabled={generating}
          className="border-[#E8B4BC] text-[#E8B4BC]"
        >
          {generating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
          Ask Sarai
        </Button>
      </div>

      <Textarea
        value={state.script}
        onChange={(e) => updateState({ script: e.target.value })}
        placeholder="Enter your script or click 'Ask Sarai' to generate one..."
        className="min-h-[200px] bg-black/50 border-gray-700 text-white"
      />

      <div className="flex gap-2">
        <select
          value={state.style}
          onChange={(e) => updateState({ style: e.target.value })}
          className="bg-black/50 border border-gray-700 text-white rounded-md px-3 py-2"
        >
          <option value="energetic">Energetic</option>
          <option value="professional">Professional</option>
          <option value="casual">Casual</option>
          <option value="educational">Educational</option>
        </select>
      </div>

      <Button
        onClick={onNext}
        disabled={!state.script.trim()}
        className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black"
      >
        Continue to Generation
      </Button>
    </div>
  );
}
```

### Task 2.6: Create GenerationPanel Step

**File:** `apps/studio/client/src/components/create/steps/GenerationPanel.tsx`

```typescript
import { useState, useEffect } from 'react';
import { WizardState } from '@/pages/create';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useVideoGeneration } from '@/hooks/useVideoGeneration';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

export function GenerationPanel({ state, updateState, onNext }: Props) {
  const [provider, setProvider] = useState<'auto' | 'comfyui' | 'openart'>('auto');
  const { generate, status, progress, outputUrl, error } = useVideoGeneration();

  useEffect(() => {
    if (outputUrl) {
      updateState({ videoUrl: outputUrl });
    }
  }, [outputUrl]);

  const handleGenerate = async () => {
    const jobId = await generate({
      type: state.contentType!,
      script: state.script,
      style: state.style,
      provider,
    });
    updateState({ jobId });
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl text-white">Generate your content</h2>

      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm">Generation Provider</label>
          <div className="flex gap-2 mt-2">
            {(['auto', 'comfyui', 'openart'] as const).map(p => (
              <Button
                key={p}
                variant={provider === p ? 'default' : 'outline'}
                onClick={() => setProvider(p)}
                className={provider === p ? 'bg-[#D4AF37] text-black' : ''}
              >
                {p === 'auto' ? 'Auto' : p === 'comfyui' ? 'ComfyUI (Local)' : 'OpenArt.ai'}
              </Button>
            ))}
          </div>
        </div>

        {status === 'idle' && (
          <Button onClick={handleGenerate} className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black">
            Start Generation
          </Button>
        )}

        {(status === 'processing' || status === 'queued') && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-gray-400 text-sm text-center">
              {status === 'queued' ? 'Queued...' : `Generating... ${progress}%`}
            </p>
          </div>
        )}

        {status === 'complete' && (
          <div className="space-y-4">
            <div className="text-green-400 text-center">Generation complete!</div>
            <Button onClick={onNext} className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black">
              Preview Result
            </Button>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-2">
            <div className="text-red-400 text-center">Generation failed: {error}</div>
            <Button onClick={handleGenerate} variant="outline">
              Retry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
```

### Task 2.7: Create useVideoGeneration Hook

**File:** `apps/studio/client/src/hooks/useVideoGeneration.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';

interface GenerateOptions {
  type: string;
  script: string;
  style: string;
  provider: 'auto' | 'comfyui' | 'openart';
}

export function useVideoGeneration() {
  const [status, setStatus] = useState<'idle' | 'queued' | 'processing' | 'complete' | 'failed'>('idle');
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);

  // WebSocket connection for progress updates
  useEffect(() => {
    if (!jobId) return;

    const ws = new WebSocket(`ws://${window.location.hostname}:4200/ws/progress?jobId=${jobId}`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setStatus(data.status);
      setProgress(data.progress || 0);
      if (data.outputUrl) setOutputUrl(data.outputUrl);
      if (data.error) setError(data.error);
    };

    return () => ws.close();
  }, [jobId]);

  const generate = useCallback(async (options: GenerateOptions): Promise<string> => {
    setStatus('queued');
    setProgress(0);
    setError(null);
    setOutputUrl(null);

    const response = await fetch('/api/video-gen/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });

    const { jobId } = await response.json();
    setJobId(jobId);
    return jobId;
  }, []);

  return { generate, status, progress, outputUrl, error, jobId };
}
```

---

## Phase 3: Postiz Integration

### Task 3.1: Add Postiz Proxy Routes

**File:** `apps/studio/server/routes.ts`

Add after line ~987 (after existing agent routes):

```typescript
// ============================================
// POSTIZ SCHEDULING PROXY
// ============================================

const POSTIZ_URL = process.env.POSTIZ_URL || 'http://localhost:3200';
const POSTIZ_API_KEY = process.env.POSTIZ_API_KEY;

// List scheduled posts
app.get('/api/postiz/posts', async (req, res) => {
  try {
    const response = await fetch(`${POSTIZ_URL}/api/public/v1/posts`, {
      headers: { 'Authorization': `Bearer ${POSTIZ_API_KEY}` },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Postiz not available' });
  }
});

// Create/schedule post
app.post('/api/postiz/posts', async (req, res) => {
  try {
    const response = await fetch(`${POSTIZ_URL}/api/public/v1/posts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTIZ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Postiz not available' });
  }
});

// Upload media
app.post('/api/postiz/upload', async (req, res) => {
  try {
    const response = await fetch(`${POSTIZ_URL}/api/public/v1/upload-from-url`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${POSTIZ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: req.body.url }),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Postiz not available' });
  }
});

// Get connected integrations
app.get('/api/postiz/integrations', async (req, res) => {
  try {
    const response = await fetch(`${POSTIZ_URL}/api/public/v1/integrations`, {
      headers: { 'Authorization': `Bearer ${POSTIZ_API_KEY}` },
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Postiz not available' });
  }
});
```

### Task 3.2: Add Video Generator Proxy

**File:** `apps/studio/server/routes.ts`

```typescript
// ============================================
// VIDEO GENERATOR PROXY
// ============================================

const VIDEO_GEN_URL = process.env.VIDEO_GEN_URL || 'http://192.168.1.23:4200';

app.post('/api/video-gen/generate', async (req, res) => {
  try {
    const response = await fetch(`${VIDEO_GEN_URL}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Video generator not available' });
  }
});

app.get('/api/video-gen/status/:jobId', async (req, res) => {
  try {
    const response = await fetch(`${VIDEO_GEN_URL}/api/status/${req.params.jobId}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Video generator not available' });
  }
});

app.get('/api/video-gen/templates', async (req, res) => {
  try {
    const response = await fetch(`${VIDEO_GEN_URL}/api/templates`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(503).json({ error: 'Video generator not available' });
  }
});
```

---

## Phase 4: Preview and Schedule Steps

### Task 4.1: Create PreviewPanel

**File:** `apps/studio/client/src/components/create/steps/PreviewPanel.tsx`

```typescript
import { WizardState } from '@/pages/create';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function PreviewPanel({ state, updateState, onNext, onBack }: Props) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl text-white">Preview your content</h2>

      <div className="aspect-[9/16] max-w-sm mx-auto bg-black rounded-lg overflow-hidden">
        {state.videoUrl ? (
          <video
            src={state.videoUrl}
            controls
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500">
            No video generated
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-center">
        <Button variant="outline" onClick={onBack}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Regenerate
        </Button>
        <Button variant="outline" asChild>
          <a href={state.videoUrl || '#'} download>
            <Download className="w-4 h-4 mr-2" />
            Download
          </a>
        </Button>
      </div>

      <Button
        onClick={onNext}
        className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black"
      >
        Continue to Schedule
      </Button>
    </div>
  );
}
```

### Task 4.2: Create SchedulePanel

**File:** `apps/studio/client/src/components/create/steps/SchedulePanel.tsx`

```typescript
import { useState } from 'react';
import { WizardState } from '@/pages/create';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, Send, Clock } from 'lucide-react';
import { usePostiz } from '@/hooks/usePostiz';

interface Props {
  state: WizardState;
  updateState: (updates: Partial<WizardState>) => void;
  onNext: () => void;
}

const platforms = [
  { id: 'tiktok', label: 'TikTok', icon: '🎵' },
  { id: 'youtube', label: 'YouTube Shorts', icon: '▶️' },
];

export function SchedulePanel({ state, updateState, onNext }: Props) {
  const [scheduling, setScheduling] = useState(false);
  const { schedulePost, uploadMedia } = usePostiz();

  const handleSchedule = async () => {
    setScheduling(true);
    try {
      // Upload video to Postiz
      const mediaResult = await uploadMedia(state.videoUrl!);

      // Schedule to each platform
      for (const platform of state.platforms) {
        await schedulePost({
          platform,
          mediaId: mediaResult.id,
          caption: state.caption,
          scheduledDate: state.scheduledDate?.toISOString(),
        });
      }

      // Award XP
      await fetch('/api/progression/add-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'leighe@ripemerchant.host', // TODO: get from context
          eventType: 'video_scheduled',
          xpAmount: 15,
        }),
      });

      onNext(); // Success screen
    } catch (e) {
      console.error('Schedule error:', e);
    }
    setScheduling(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl text-white">Schedule your post</h2>

      {/* Platform Selection */}
      <div>
        <label className="text-gray-400 text-sm">Platforms</label>
        <div className="flex gap-4 mt-2">
          {platforms.map(p => (
            <label key={p.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={state.platforms.includes(p.id)}
                onCheckedChange={(checked) => {
                  updateState({
                    platforms: checked
                      ? [...state.platforms, p.id]
                      : state.platforms.filter(id => id !== p.id),
                  });
                }}
              />
              <span className="text-white">{p.icon} {p.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Caption */}
      <div>
        <label className="text-gray-400 text-sm">Caption</label>
        <Textarea
          value={state.caption}
          onChange={(e) => updateState({ caption: e.target.value })}
          placeholder="Write your caption..."
          className="mt-2 bg-black/50 border-gray-700 text-white"
        />
      </div>

      {/* Schedule Date */}
      <div>
        <label className="text-gray-400 text-sm">When to post</label>
        <div className="flex gap-2 mt-2">
          <Button
            variant={!state.scheduledDate ? 'default' : 'outline'}
            onClick={() => updateState({ scheduledDate: null })}
            className={!state.scheduledDate ? 'bg-[#D4AF37] text-black' : ''}
          >
            <Send className="w-4 h-4 mr-2" />
            Post Now
          </Button>
          <input
            type="datetime-local"
            className="bg-black/50 border border-gray-700 text-white rounded-md px-3 py-2"
            onChange={(e) => updateState({ scheduledDate: new Date(e.target.value) })}
          />
        </div>
      </div>

      <Button
        onClick={handleSchedule}
        disabled={state.platforms.length === 0 || scheduling}
        className="w-full bg-[#D4AF37] hover:bg-[#B8962F] text-black"
      >
        {scheduling ? 'Scheduling...' : state.scheduledDate ? 'Schedule Post' : 'Publish Now'}
      </Button>
    </div>
  );
}
```

### Task 4.3: Create usePostiz Hook

**File:** `apps/studio/client/src/hooks/usePostiz.ts`

```typescript
import { useCallback } from 'react';

export function usePostiz() {
  const uploadMedia = useCallback(async (url: string) => {
    const response = await fetch('/api/postiz/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    return response.json();
  }, []);

  const schedulePost = useCallback(async (data: {
    platform: string;
    mediaId: string;
    caption: string;
    scheduledDate?: string;
  }) => {
    const response = await fetch('/api/postiz/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  }, []);

  const getIntegrations = useCallback(async () => {
    const response = await fetch('/api/postiz/integrations');
    return response.json();
  }, []);

  return { uploadMedia, schedulePost, getIntegrations };
}
```

---

## Phase 5: Environment Variables

### Task 5.1: Update Studio .env

**File:** `apps/studio/.env` (droplet)

Add:
```env
# Video Generator
VIDEO_GEN_URL=http://100.66.42.81:4200

# Postiz
POSTIZ_URL=http://localhost:3200
POSTIZ_API_KEY=<get_from_postiz_settings>

# OpenArt (for video-generator service)
OPENART_API_KEY=<your_openart_key>
```

### Task 5.2: Create video-generator .env

**File:** `LifeOS-Core/agents/infrastructure/video-generator/.env`

```env
PORT=4200
COMFYUI_URL=http://192.168.1.X:8188  # AdmiralEnergy IP
OPENART_API_KEY=<your_openart_key>
```

---

## Verification Commands

```bash
# 1. Test video-generator health
curl http://192.168.1.23:4200/health

# 2. Test Studio proxy
curl https://studio.ripemerchant.host/api/video-gen/templates

# 3. Test Postiz integration
curl https://studio.ripemerchant.host/api/postiz/integrations

# 4. Load /create page
open https://studio.ripemerchant.host/create
```

---

## Rollback

```bash
# Phase 1: Remove video-generator service
ssh edwardsdavid913@192.168.1.23 "pm2 delete video-generator"

# Phase 2: Revert App.tsx
git checkout apps/studio/client/src/App.tsx

# Phase 3: Remove Postiz routes from routes.ts
git checkout apps/studio/server/routes.ts
```
