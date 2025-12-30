# Codex Implementation Plan - Project 23: LiveWire v3.0

## System Prompt

```
You are implementing LiveWire v3.0, a multi-agent intent training system.

Context:
- Current system: Node.js LiveWire at /agents/apex/livewire/ (admiral-server:5000)
- New system: Python AutoGen at /agents/apex/livewire-v3/ (admiral-server:5100)
- Frontend: COMPASS PWA at apps/compass/

Key principle: Intent cannot be derived from keywords alone.
"Just installed my Powerwall" ≠ "Want to buy a Powerwall"
Both contain "Powerwall" but have opposite intents.

Solution: Human labels posts → System learns patterns → Progressive autonomy (L0→L4)

Technology:
- Python 3.11 + FastAPI + AutoGen 0.4
- Claude 3.5 Sonnet for intent analysis
- PRAW for Reddit API
- SQLite for persistence
```

---

## Phase 1: Infrastructure Setup

### Task 1.1: Create Python Project Structure

**Location:** `admiral-server:/agents/apex/livewire-v3/`

```bash
mkdir -p /agents/apex/livewire-v3
cd /agents/apex/livewire-v3

# Create structure
mkdir -p src/{agents,api,db,utils}
mkdir -p data
mkdir -p tests

# Create files
touch src/__init__.py
touch src/main.py
touch src/config.py
touch src/agents/__init__.py
touch src/agents/post_scout.py
touch src/agents/intent_analyst.py
touch src/agents/subreddit_researcher.py
touch src/agents/dm_crafter.py
touch src/agents/orchestrator.py
touch src/api/__init__.py
touch src/api/routes.py
touch src/db/__init__.py
touch src/db/schema.py
touch src/db/queries.py
touch requirements.txt
touch .env.example
```

### Task 1.2: Create requirements.txt

```
# Core
fastapi>=0.104.0
uvicorn>=0.24.0
python-dotenv>=1.0.0

# AutoGen
pyautogen>=0.4.0

# Reddit
praw>=7.7.0

# Database
aiosqlite>=0.19.0

# LLM
anthropic>=0.18.0

# Utilities
pydantic>=2.5.0
httpx>=0.25.0
python-multipart>=0.0.6

# Development
pytest>=7.4.0
pytest-asyncio>=0.21.0
```

### Task 1.3: Create SQLite Schema

**File:** `src/db/schema.py`

```python
import aiosqlite
from pathlib import Path

DB_PATH = Path(__file__).parent.parent.parent / "data" / "livewire_v3.db"

SCHEMA = """
-- Training data from human labels
CREATE TABLE IF NOT EXISTS labeled_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reddit_id TEXT UNIQUE NOT NULL,
    subreddit TEXT NOT NULL,
    author TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT NOT NULL,
    post_created_at DATETIME,
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    -- AI analysis
    ai_intent TEXT,
    ai_confidence REAL,
    ai_reasoning TEXT,
    ai_analyzed_at DATETIME,

    -- Human labels (training gold)
    human_intent TEXT,
    human_reasoning TEXT,
    human_quality TEXT,
    human_labeled_at DATETIME,
    human_labeled_by TEXT,

    -- Outcome tracking
    status TEXT DEFAULT 'new',
    dm_sent_at DATETIME,
    reply_received_at DATETIME,
    converted_at DATETIME,

    -- ML features
    embedding BLOB
);

-- Patterns learned from aggregate labels
CREATE TABLE IF NOT EXISTS intent_patterns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intent_category TEXT NOT NULL,
    pattern_text TEXT NOT NULL,
    pattern_type TEXT NOT NULL,
    confidence_weight REAL DEFAULT 0.5,
    hit_count INTEGER DEFAULT 0,
    success_rate REAL DEFAULT 0.0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME
);

-- Subreddit intelligence
CREATE TABLE IF NOT EXISTS subreddit_intel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subreddit TEXT UNIQUE NOT NULL,
    tier TEXT DEFAULT 'test',
    quality_score REAL DEFAULT 50.0,
    total_posts_scanned INTEGER DEFAULT 0,
    high_intent_count INTEGER DEFAULT 0,
    conversion_count INTEGER DEFAULT 0,
    avg_response_rate REAL,
    best_posting_hours TEXT,
    demographics TEXT,
    mod_notes TEXT,
    last_analyzed_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- DM tracking with A/B testing
CREATE TABLE IF NOT EXISTS dm_drafts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lead_id INTEGER REFERENCES labeled_posts(id),
    template_style TEXT,
    subject TEXT,
    body TEXT NOT NULL,
    personalization_notes TEXT,
    confidence REAL,
    a_b_variant TEXT,
    status TEXT DEFAULT 'pending',
    approved_by TEXT,
    approved_at DATETIME,
    sent_at DATETIME,
    reply_received INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Autonomy level management
CREATE TABLE IF NOT EXISTS autonomy_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    current_level INTEGER DEFAULT 0,
    level_0_samples INTEGER DEFAULT 100,
    level_1_accuracy REAL DEFAULT 0.85,
    level_2_samples INTEGER DEFAULT 500,
    level_3_accuracy REAL DEFAULT 0.90,
    total_samples INTEGER DEFAULT 0,
    current_accuracy REAL DEFAULT 0.0,
    last_level_change DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Training log for accuracy tracking
CREATE TABLE IF NOT EXISTS training_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER REFERENCES labeled_posts(id),
    ai_prediction TEXT,
    human_label TEXT,
    was_correct INTEGER,
    disagreement_reason TEXT,
    logged_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize autonomy config if empty
INSERT OR IGNORE INTO autonomy_config (id, current_level) VALUES (1, 0);
"""

async def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript(SCHEMA)
        await db.commit()
```

---

## Phase 2: Core Agents

### Task 2.1: Post Scout Agent

**File:** `src/agents/post_scout.py`

```python
"""
Post Scout Agent - Finds Reddit posts about solar/energy topics.
Does NOT score or filter - just discovers and queues.
"""

import praw
import asyncio
from datetime import datetime
from typing import List, Dict
from ..config import settings
from ..db.queries import save_discovered_post

class PostScoutAgent:
    name = "post_scout"
    description = "Finds Reddit posts about solar energy topics"

    def __init__(self):
        self.reddit = praw.Reddit(
            client_id=settings.REDDIT_CLIENT_ID,
            client_secret=settings.REDDIT_CLIENT_SECRET,
            user_agent="LiveWire v3.0 Solar Lead Intelligence"
        )
        self.subreddits = [
            "solar", "SolarDIY", "homeowners", "HomeImprovement",
            "electricians", "NorthCarolina", "Charlotte", "Raleigh"
        ]

    async def scan_subreddit(self, subreddit: str, limit: int = 100) -> List[Dict]:
        """Scan a subreddit for posts - NO SCORING"""
        posts = []

        try:
            sub = self.reddit.subreddit(subreddit)
            for post in sub.new(limit=limit):
                post_data = {
                    "reddit_id": post.id,
                    "title": post.title,
                    "content": post.selftext,
                    "author": str(post.author) if post.author else "[deleted]",
                    "subreddit": subreddit,
                    "url": f"https://reddit.com{post.permalink}",
                    "post_created_at": datetime.fromtimestamp(post.created_utc),
                    "score": post.score,
                    "num_comments": post.num_comments,
                }
                posts.append(post_data)
                await save_discovered_post(post_data)
        except Exception as e:
            print(f"Error scanning r/{subreddit}: {e}")

        return posts

    async def scan_all(self) -> Dict:
        """Scan all configured subreddits"""
        results = {
            "total_posts": 0,
            "subreddits_scanned": 0,
            "errors": []
        }

        for sub in self.subreddits:
            try:
                posts = await self.scan_subreddit(sub)
                results["total_posts"] += len(posts)
                results["subreddits_scanned"] += 1
            except Exception as e:
                results["errors"].append({"subreddit": sub, "error": str(e)})

        return results
```

### Task 2.2: Intent Analyst Agent

**File:** `src/agents/intent_analyst.py`

```python
"""
Intent Analyst Agent - Analyzes post content, suggests intent classification.
Human confirms at L0-L1, auto-labels at L2+.
"""

from anthropic import AsyncAnthropic
from typing import Optional
from pydantic import BaseModel
from ..config import settings
from ..db.queries import get_autonomy_level

class IntentAnalysis(BaseModel):
    intent_category: str  # buying, researching, already_bought, upselling, not_relevant
    confidence: float     # 0.0 - 1.0
    reasoning: list[str]  # Key phrases detected
    requires_human_review: bool

INTENT_CATEGORIES = [
    "buying",              # Actively shopping for solar
    "researching",         # Gathering info, not ready
    "already_bought",      # Showing off their system
    "upselling_opportunity", # Has solar, wants more
    "negative_experience", # Complaining about their system
    "not_relevant",        # False positive
]

ANALYSIS_PROMPT = """Analyze this Reddit post for solar buying intent.

Title: {title}
Content: {content}
Subreddit: r/{subreddit}

Classify the intent into ONE of these categories:
- buying: Actively shopping for solar (asking for quotes, comparing installers)
- researching: Gathering information but not ready to buy
- already_bought: Already has solar, showing off or asking maintenance questions
- upselling_opportunity: Has solar system, interested in adding battery/EV charger
- negative_experience: Complaining about their solar system or installer
- not_relevant: Not actually about buying solar

Return JSON:
{{
  "intent": "<category>",
  "confidence": <0.0-1.0>,
  "reasoning": ["phrase1 indicates X", "phrase2 suggests Y"],
  "key_indicators": ["phrase1", "phrase2"]
}}
"""

class IntentAnalystAgent:
    name = "intent_analyst"
    description = "Analyzes Reddit posts for solar buying intent"

    def __init__(self):
        self.client = AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

    async def analyze_post(self, post: dict) -> IntentAnalysis:
        """Analyze a post and return intent suggestion with confidence"""

        prompt = ANALYSIS_PROMPT.format(
            title=post["title"],
            content=post.get("content", ""),
            subreddit=post["subreddit"]
        )

        response = await self.client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=500,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse response
        import json
        result = json.loads(response.content[0].text)

        # Check autonomy level for human review requirement
        autonomy_level = await get_autonomy_level()
        requires_review = self._check_review_requirement(
            result["confidence"],
            autonomy_level
        )

        return IntentAnalysis(
            intent_category=result["intent"],
            confidence=result["confidence"],
            reasoning=result["reasoning"],
            requires_human_review=requires_review
        )

    def _check_review_requirement(self, confidence: float, level: int) -> bool:
        """Determine if human review is required based on autonomy level"""
        if level <= 1:
            return True  # Always require review at L0-L1
        elif level == 2:
            return confidence < 0.90  # Review low confidence at L2
        else:
            return False  # L3+ auto-approve
```

---

## Phase 3: API Routes

### Task 3.1: FastAPI Main Application

**File:** `src/main.py`

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .db.schema import init_db
from .api.routes import router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db()
    yield
    # Shutdown

app = FastAPI(
    title="LiveWire v3.0",
    description="Multi-Agent Intent Training System",
    version="3.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/v3")

@app.get("/health")
async def health():
    return {"status": "ok", "version": "3.0.0"}
```

### Task 3.2: API Routes

**File:** `src/api/routes.py`

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from ..agents.post_scout import PostScoutAgent
from ..agents.intent_analyst import IntentAnalystAgent
from ..db import queries

router = APIRouter()
post_scout = PostScoutAgent()
intent_analyst = IntentAnalystAgent()

# ====================
# SCOUT ENDPOINTS
# ====================

@router.post("/scout/scan")
async def trigger_scan():
    """Manually trigger a Reddit scan"""
    results = await post_scout.scan_all()
    return results

@router.get("/scout/status")
async def scout_status():
    """Get scanner status"""
    pending = await queries.count_pending_posts()
    return {
        "pending_analysis": pending,
        "subreddits_configured": len(post_scout.subreddits)
    }

# ====================
# ANALYST ENDPOINTS
# ====================

@router.get("/analyst/pending")
async def get_pending_reviews():
    """Posts awaiting human labeling"""
    posts = await queries.get_posts_for_review()
    return {"posts": posts, "count": len(posts)}

class HumanLabel(BaseModel):
    post_id: int
    intent: str
    reasoning: str
    quality: str  # good_lead, bad_lead, maybe

@router.post("/analyst/label")
async def submit_label(label: HumanLabel):
    """Human submits label for a post"""
    await queries.save_human_label(
        post_id=label.post_id,
        intent=label.intent,
        reasoning=label.reasoning,
        quality=label.quality
    )

    # Check if we should level up
    await queries.check_autonomy_level_up()

    return {"success": True, "message": "Label saved"}

@router.get("/analyst/confidence")
async def get_confidence_stats():
    """Current autonomy level, accuracy metrics"""
    config = await queries.get_autonomy_config()
    recent_accuracy = await queries.calculate_recent_accuracy()

    return {
        "autonomy_level": config["current_level"],
        "total_samples": config["total_samples"],
        "current_accuracy": recent_accuracy,
        "level_requirements": {
            "L1": {"samples": config["level_0_samples"]},
            "L2": {"accuracy": config["level_1_accuracy"], "samples": 200},
            "L3": {"accuracy": config["level_2_accuracy"], "samples": 500},
        }
    }

# ====================
# TRAINING ENDPOINTS
# ====================

@router.get("/training/dashboard")
async def training_dashboard():
    """Full training progress dashboard"""
    return {
        "autonomy": await queries.get_autonomy_config(),
        "accuracy_by_intent": await queries.accuracy_by_intent(),
        "recent_labels": await queries.get_recent_labels(limit=10),
        "patterns_discovered": await queries.count_patterns()
    }

@router.get("/training/patterns")
async def get_learned_patterns():
    """Patterns discovered from labeled data"""
    patterns = await queries.get_intent_patterns()
    return {"patterns": patterns}
```

---

## Phase 4: COMPASS Frontend

### Task 4.1: Add v3 Proxy Routes

**File:** `apps/compass/server/routes.ts` (ADD to existing)

```typescript
// LiveWire v3.0 API proxy
const LIVEWIRE_V3_HOST = process.env.LIVEWIRE_V3_HOST || '100.66.42.81';
const LIVEWIRE_V3_PORT = '5100';

// Proxy all /api/livewire/v3/* to v3 backend
app.all('/api/livewire/v3/*', async (req, res) => {
  const path = req.path.replace('/api/livewire/v3', '/v3');
  const url = `http://${LIVEWIRE_V3_HOST}:${LIVEWIRE_V3_PORT}${path}`;

  try {
    const response = await fetch(url, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : undefined
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error(`[LiveWire v3 Proxy] Error:`, error);
    res.status(503).json({ error: 'LiveWire v3 unavailable' });
  }
});
```

### Task 4.2: Training Interface Page

**File:** `apps/compass/client/src/pages/livewire-training.tsx`

```tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const INTENT_CATEGORIES = [
  { value: 'buying', label: 'Buying', color: 'bg-green-500' },
  { value: 'researching', label: 'Researching', color: 'bg-blue-500' },
  { value: 'already_bought', label: 'Already Bought', color: 'bg-yellow-500' },
  { value: 'upselling_opportunity', label: 'Upselling', color: 'bg-purple-500' },
  { value: 'negative_experience', label: 'Negative', color: 'bg-red-500' },
  { value: 'not_relevant', label: 'Not Relevant', color: 'bg-gray-500' },
];

export default function LiveWireTrainingPage() {
  const [pendingPosts, setPendingPosts] = useState([]);
  const [currentPost, setCurrentPost] = useState(null);
  const [selectedIntent, setSelectedIntent] = useState('');
  const [reasoning, setReasoning] = useState('');
  const [quality, setQuality] = useState('');
  const [autonomyLevel, setAutonomyLevel] = useState(0);

  useEffect(() => {
    fetchPendingPosts();
    fetchAutonomyLevel();
  }, []);

  const fetchPendingPosts = async () => {
    const res = await fetch('/api/livewire/v3/analyst/pending');
    const data = await res.json();
    setPendingPosts(data.posts);
    if (data.posts.length > 0) {
      setCurrentPost(data.posts[0]);
    }
  };

  const fetchAutonomyLevel = async () => {
    const res = await fetch('/api/livewire/v3/analyst/confidence');
    const data = await res.json();
    setAutonomyLevel(data.autonomy_level);
  };

  const submitLabel = async () => {
    if (!currentPost || !selectedIntent || !quality) return;

    await fetch('/api/livewire/v3/analyst/label', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        post_id: currentPost.id,
        intent: selectedIntent,
        reasoning: reasoning,
        quality: quality
      })
    });

    // Reset and get next
    setSelectedIntent('');
    setReasoning('');
    setQuality('');
    fetchPendingPosts();
    fetchAutonomyLevel();
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Autonomy Level Banner */}
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Autonomy Level</p>
            <p className="text-3xl font-bold text-purple-400">L{autonomyLevel}</p>
          </div>
          <Badge className="text-lg px-4 py-2">
            {pendingPosts.length} posts to label
          </Badge>
        </CardContent>
      </Card>

      {/* Current Post to Label */}
      {currentPost && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">{currentPost.title}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  r/{currentPost.subreddit} • u/{currentPost.author}
                </p>
              </div>
              <a
                href={currentPost.url}
                target="_blank"
                className="text-blue-400 hover:underline text-sm"
              >
                View on Reddit →
              </a>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Post Content */}
            <div className="p-4 bg-muted/30 rounded-lg max-h-48 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">
                {currentPost.content || "(No text content)"}
              </p>
            </div>

            {/* AI Suggestion (only at L1+) */}
            {autonomyLevel >= 1 && currentPost.ai_intent && (
              <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                <p className="text-sm text-blue-400 font-medium">AI Suggestion</p>
                <p className="text-lg">{currentPost.ai_intent} ({Math.round(currentPost.ai_confidence * 100)}% confidence)</p>
                <p className="text-sm text-muted-foreground">{currentPost.ai_reasoning}</p>
              </div>
            )}

            {/* Intent Selection */}
            <div className="grid grid-cols-3 gap-2">
              {INTENT_CATEGORIES.map(cat => (
                <Button
                  key={cat.value}
                  variant={selectedIntent === cat.value ? 'default' : 'outline'}
                  onClick={() => setSelectedIntent(cat.value)}
                  className="w-full"
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {/* Reasoning */}
            <Textarea
              placeholder="Why did you choose this classification? (What phrases or context led to this?)"
              value={reasoning}
              onChange={(e) => setReasoning(e.target.value)}
              rows={3}
            />

            {/* Quality Rating */}
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger>
                <SelectValue placeholder="Lead Quality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="good_lead">Good Lead</SelectItem>
                <SelectItem value="bad_lead">Bad Lead</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
              </SelectContent>
            </Select>

            {/* Submit */}
            <Button
              onClick={submitLabel}
              disabled={!selectedIntent || !quality}
              className="w-full"
            >
              Submit Label & Next
            </Button>
          </CardContent>
        </Card>
      )}

      {pendingPosts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-xl">All caught up!</p>
            <p className="text-muted-foreground">No posts need labeling right now.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

---

## Verification Commands

```bash
# 1. Check Python service is running
curl http://192.168.1.23:5100/health

# 2. Trigger a scan
curl -X POST http://192.168.1.23:5100/v3/scout/scan

# 3. Check pending posts
curl http://192.168.1.23:5100/v3/analyst/pending

# 4. Check autonomy level
curl http://192.168.1.23:5100/v3/analyst/confidence

# 5. Test from COMPASS proxy
curl https://compass.ripemerchant.host/api/livewire/v3/health
```

---

## Deployment (PM2)

```bash
# On admiral-server
cd /agents/apex/livewire-v3

# Create virtualenv
python3.11 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Create .env
cp .env.example .env
# Edit with API keys

# Start with PM2
pm2 start "venv/bin/uvicorn src.main:app --host 0.0.0.0 --port 5100" --name livewire-v3

# Save PM2 config
pm2 save
```

---

## Rollback

If v3 fails, revert COMPASS proxy routes to point back to v2 (:5000):

```typescript
// In routes.ts, remove or comment out v3 proxy routes
// Keep v2 routes active
```

---

*Codex created: December 30, 2025*
