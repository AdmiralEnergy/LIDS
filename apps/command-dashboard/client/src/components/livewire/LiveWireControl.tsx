import { useState, useEffect } from "react";
import { 
  Search, 
  Brain, 
  MessageSquare, 
  ThumbsUp, 
  ThumbsDown, 
  ChevronRight, 
  Activity, 
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight
} from "lucide-react";

interface ThoughtStep {
  agent: string;
  thought: string;
  status: 'complete' | 'processing' | 'rejected';
}

interface RedditPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  intentScore: number;
  ncRelevant: boolean;
  thoughtTrace: ThoughtStep[];
  suggestedMessage?: string;
}

export function LiveWireControl({ useMockData }: { useMockData: boolean }) {
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [activeView, setActiveTab] = useState<'discovery' | 'analysis' | 'outreach'>('discovery');

  // Mock data for initial UI build
  const mockPosts: RedditPost[] = [
    {
      id: "1",
      title: "Looking for solar recommendations in Charlotte",
      content: "Hi everyone, I just bought a home in Charlotte and I'm looking for a reputable solar installer. My Duke Energy bills are through the roof. Any suggestions?",
      subreddit: "r/Charlotte",
      author: "SolarSeeker704",
      intentScore: 92,
      ncRelevant: true,
      thoughtTrace: [
        { agent: "PostScout", thought: "Identified high-keyword density in r/Charlotte.", status: 'complete' },
        { agent: "TerritoryAnalyst", thought: "Matched Charlotte to North Carolina (Empower State). Post is highly relevant.", status: 'complete' },
        { agent: "IntentAnalyst", thought: "Detected buying intent: 'looking for installer' + ' Duke Energy bills'. Score: 92.", status: 'complete' },
        { agent: "OutreachArchitect", thought: "Drafting NC PowerPair specific hook.", status: 'complete' }
      ],
      suggestedMessage: "Hi SolarSeeker704! Welcome to the area. Since you mentioned those Duke Energy bills, have you looked into the new NC PowerPair rebate? It just opened up and can save you several thousand on top of the federal credit. I work with a team here in NC that specializes in maximizing those specific rebates. Would you like a quick breakdown of how the bridge rate affects Charlotte homeowners?"
    },
    {
      id: "2",
      title: "Just finished my DIY solar install!",
      content: "Spent the weekend putting up 10 panels on the garage. Works great! u/SolarDIY help was awesome.",
      subreddit: "r/SolarDIY",
      author: "DIYGuyNC",
      intentScore: 15,
      ncRelevant: true,
      thoughtTrace: [
        { agent: "PostScout", thought: "Found 'solar' keyword in r/SolarDIY.", status: 'complete' },
        { agent: "TerritoryAnalyst", thought: "NC detected via user flair.", status: 'complete' },
        { agent: "IntentAnalyst", thought: "Intent rejected: User is in DIY phase and already installed. Not a sales lead.", status: 'rejected' }
      ]
    }
  ];

  const posts = useMockData ? mockPosts : [];

  return (
    <div className="flex h-full gap-4">
      {/* Sidebar: Discovery Queue */}
      <div className="w-1/3 flex flex-col gap-4">
        <div className="bg-card border border-border rounded-lg flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-green-500" />
              Live Discovery
            </h3>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {posts.length} NEW
            </span>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-2">
            {posts.map(post => (
              <button
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedPost?.id === post.id 
                    ? "bg-primary/5 border-primary shadow-sm" 
                    : "bg-background border-border hover:border-muted-foreground/50"
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">
                    {post.subreddit}
                  </span>
                  <span className={`text-[10px] font-bold px-1.5 rounded ${
                    post.intentScore > 80 ? "text-green-500 bg-green-500/10" : "text-zinc-500 bg-zinc-500/10"
                  }`}>
                    {post.intentScore}%
                  </span>
                </div>
                <h4 className="text-xs font-semibold line-clamp-1">{post.title}</h4>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-1">
                    {post.thoughtTrace.map((_, i) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full border border-card ${
                        post.thoughtTrace[i].status === 'rejected' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                    ))}
                  </div>
                  <span className="text-[10px] text-muted-foreground italic">u/{post.author}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Panel: Sequential Thinking & Intent Analysis */}
      <div className="flex-1 flex flex-col gap-4">
        {selectedPost ? (
          <>
            {/* Top: The Post */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex justify-between items-start mb-3">
                <h2 className="text-lg font-bold">{selectedPost.title}</h2>
                <div className="flex gap-2">
                  <button className="p-1.5 hover:bg-muted rounded text-zinc-500"><Globe className="w-4 h-4" /></button>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {selectedPost.content}
              </p>
            </div>

            {/* Bottom: The Thinking Chain */}
            <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
              {/* Left Side: Agent Logic (Sequential Thinking) */}
              <div className="bg-card border border-border rounded-lg flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border bg-muted/30">
                  <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    Agent Logic Chain
                  </h3>
                </div>
                <div className="flex-1 overflow-auto p-4 space-y-4">
                  {selectedPost.thoughtTrace.map((step, i) => (
                    <div key={i} className="relative pl-6 border-l border-border pb-2 last:pb-0">
                      <div className={`absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full ${
                        step.status === 'rejected' ? 'bg-red-500' : 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]'
                      }`} />
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase">{step.agent}</span>
                        <p className="text-xs">{step.thought}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side: Action & Feedback (Human in the loop) */}
              <div className="bg-card border border-border rounded-lg flex flex-col overflow-hidden">
                <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
                  <h3 className="text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-[#00ffff]" />
                    Human Verification
                  </h3>
                </div>
                <div className="flex-1 p-4 flex flex-col gap-4">
                  {selectedPost.suggestedMessage ? (
                    <>
                      <div className="flex-1 bg-black/20 rounded-lg border border-white/5 p-3 relative overflow-hidden group">
                        <span className="absolute top-2 right-2 text-[8px] font-bold text-[#00ffff] bg-[#00ffff]/10 px-1.5 py-0.5 rounded uppercase opacity-50">Draft</span>
                        <p className="text-xs italic leading-relaxed text-zinc-300">
                          {selectedPost.suggestedMessage}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button className="flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all font-bold text-xs uppercase">
                          <ThumbsDown className="w-4 h-4" />
                          Reject Lead
                        </button>
                        <button className="flex items-center justify-center gap-2 py-3 bg-green-500 text-black rounded-xl hover:bg-green-400 transition-all font-bold text-xs uppercase shadow-lg shadow-green-500/20">
                          <ThumbsUp className="w-4 h-4" />
                          Approve & Send
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                      <XCircle className="w-12 h-12 mb-4 opacity-20" />
                      <p className="text-sm font-semibold">Lead Filtered Out</p>
                      <p className="text-xs mt-1">Agent chain terminated at IntentAnalyst</p>
                      <button className="mt-4 text-xs underline hover:text-primary">Why was this rejected?</button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 bg-card border border-border border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="w-12 h-12 mb-4 opacity-10 animate-pulse" />
            <p className="text-sm font-medium tracking-tight">Select a candidate from the queue to audit the thinking process</p>
          </div>
        )}
      </div>
    </div>
  );
}
