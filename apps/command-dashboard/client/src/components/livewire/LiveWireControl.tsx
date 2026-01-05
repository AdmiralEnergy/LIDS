import { useState } from "react";
import {
  Activity,
  Globe,
  Settings2,
  Filter,
} from "lucide-react";
import { SequentialThinking, type ThinkingStep } from "./SequentialThinking";
import { LeadReviewCard, type LeadContent } from "./LeadReviewCard";
import { useAuth } from "@/providers/AuthProvider";

/**
 * LiveWire Control Component
 *
 * Phase 4: LiveWire AutoGen Intelligence
 *
 * Main control panel for LiveWire lead discovery and review.
 * Integrates SequentialThinking and LeadReviewCard components.
 */

interface RedditPost {
  id: string;
  title: string;
  content: string;
  subreddit: string;
  author: string;
  url?: string;
  intentScore: number;
  ncRelevant: boolean;
  thoughtTrace: ThinkingStep[];
  suggestedMessage?: string;
}

export function LiveWireControl({ useMockData }: { useMockData: boolean }) {
  const { canConfigure } = useAuth();
  const [selectedPost, setSelectedPost] = useState<RedditPost | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mock data for initial UI build - matches the new ThinkingStep interface
  const mockPosts: RedditPost[] = [
    {
      id: "1",
      title: "Looking for solar recommendations in Charlotte",
      content: "Hi everyone, I just bought a home in Charlotte and I'm looking for a reputable solar installer. My Duke Energy bills are through the roof. Any suggestions?",
      subreddit: "r/Charlotte",
      author: "SolarSeeker704",
      url: "https://reddit.com/r/Charlotte/comments/example1",
      intentScore: 92,
      ncRelevant: true,
      thoughtTrace: [
        {
          agent: "ProductSpecialist",
          thought: "Matched residential solar installation request. Keywords: 'solar installer', 'Duke Energy', 'home'.",
          status: 'complete',
          data: {
            products: ['Enphase IQ8+', 'REC Alpha Pure', 'Tesla Powerwall 3'],
            knowledgeBaseContext: 'Duke Energy Bridge Rate applicable'
          }
        },
        {
          agent: "LeadScout",
          thought: "High purchase intent detected. User is actively seeking installer recommendations after home purchase.",
          status: 'complete',
          data: {
            intentScore: 92,
            intentSignals: ['looking for', 'just bought', 'any suggestions']
          }
        },
        {
          agent: "TerritoryAnalyst",
          thought: "Charlotte, NC confirmed. PowerPair rebate and Duke Energy bridge rate available.",
          status: 'complete',
          data: {
            state: 'NC',
            eligible: true,
            rebates: ['NC PowerPair', 'Duke Bridge Rate', 'Federal ITC 30%']
          }
        },
        {
          agent: "DraftingAgent",
          thought: "Crafted personalized response with NC-specific rebate hooks and Duke Energy pain point address.",
          status: 'complete',
          data: {
            hooks: ['PowerPair Rebate', 'Duke Energy Bills', 'Local Installer']
          }
        }
      ],
      suggestedMessage: "Hi SolarSeeker704! Welcome to the area. Since you mentioned those Duke Energy bills, have you looked into the new NC PowerPair rebate? It just opened up and can save you several thousand on top of the federal credit. I work with a team here in NC that specializes in maximizing those specific rebates. Would you like a quick breakdown of how the bridge rate affects Charlotte homeowners?"
    },
    {
      id: "2",
      title: "Just finished my DIY solar install!",
      content: "Spent the weekend putting up 10 panels on the garage. Works great! u/SolarDIY help was awesome.",
      subreddit: "r/SolarDIY",
      author: "DIYGuyNC",
      url: "https://reddit.com/r/SolarDIY/comments/example2",
      intentScore: 15,
      ncRelevant: true,
      thoughtTrace: [
        {
          agent: "ProductSpecialist",
          thought: "Solar installation topic detected. Analyzing for product relevance.",
          status: 'complete',
          data: {
            products: ['DIY Panel Kit']
          }
        },
        {
          agent: "LeadScout",
          thought: "No buying intent. User has already completed installation. Celebrating DIY success.",
          status: 'rejected',
          data: {
            intentScore: 15,
            intentSignals: ['finished', 'works great', 'DIY']
          }
        }
      ]
    },
    {
      id: "3",
      title: "Anyone dealt with solar panel companies in Raleigh?",
      content: "Getting quotes but the prices seem all over the place. Looking for honest feedback on local installers. I have a south-facing roof and about 2000 sq ft.",
      subreddit: "r/raleigh",
      author: "RaleighHomeowner",
      url: "https://reddit.com/r/raleigh/comments/example3",
      intentScore: 88,
      ncRelevant: true,
      thoughtTrace: [
        {
          agent: "ProductSpecialist",
          thought: "Residential solar installation inquiry. South-facing roof mentioned - excellent solar potential.",
          status: 'complete',
          data: {
            products: ['REC Alpha Pure', 'Q Cells Q.Peak', 'Enphase IQ8M'],
            knowledgeBaseContext: 'South-facing roof optimal for NC latitude'
          }
        },
        {
          agent: "LeadScout",
          thought: "Strong buying intent. User is in quote-gathering phase and frustrated with pricing inconsistency.",
          status: 'complete',
          data: {
            intentScore: 88,
            intentSignals: ['getting quotes', 'looking for', 'honest feedback']
          }
        },
        {
          agent: "TerritoryAnalyst",
          thought: "Raleigh, NC confirmed. All NC incentives applicable. Wake County permits required.",
          status: 'complete',
          data: {
            state: 'NC',
            eligible: true,
            rebates: ['NC PowerPair', 'Federal ITC 30%', 'Duke Progress Rebate']
          }
        },
        {
          agent: "DraftingAgent",
          thought: "Response focused on pricing transparency and local expertise. Addresses quote frustration.",
          status: 'complete',
          data: {
            hooks: ['Pricing Transparency', 'Local Expertise', 'Free Quote']
          }
        }
      ],
      suggestedMessage: "Hey RaleighHomeowner! I totally get the frustration with wildly different quotes. A lot of that comes down to equipment quality and what incentives they're factoring in. With a south-facing roof in Raleigh, you're in a great spot for solar. Have you been given breakdowns that include the NC PowerPair rebate? Some installers don't even mention it. Happy to share what we typically see for 2000 sq ft systems in Wake County if that would help!"
    }
  ];

  const posts = useMockData ? mockPosts : [];

  // Convert RedditPost to LeadContent for LeadReviewCard
  const getLeadContent = (post: RedditPost): LeadContent => ({
    id: post.id,
    title: post.title,
    content: post.content,
    subreddit: post.subreddit,
    author: post.author,
    url: post.url,
  });

  // Handle approve action (mock for now)
  const handleApprove = async (message: string) => {
    setIsSubmitting(true);
    // TODO: Call /api/livewire/feedback endpoint
    console.log('[LiveWire] Approving lead:', selectedPost?.id, 'Message:', message);
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
    setIsSubmitting(false);
    setSelectedPost(null);
  };

  // Handle reject action (mock for now)
  const handleReject = async (reason: string) => {
    setIsSubmitting(true);
    // TODO: Call /api/livewire/feedback endpoint
    console.log('[LiveWire] Rejecting lead:', selectedPost?.id, 'Reason:', reason);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
    setIsSubmitting(false);
    setSelectedPost(null);
  };

  return (
    <div className="flex h-full gap-4">
      {/* Left Sidebar: Discovery Queue */}
      <div className="w-80 flex flex-col gap-4 shrink-0">
        <div className="bg-card border border-border rounded-xl flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border flex items-center justify-between bg-muted/30">
            <h3 className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest">
              <Activity className="w-4 h-4 text-green-500" />
              Discovery Queue
            </h3>
            <div className="flex items-center gap-1">
              <span className="text-[10px] bg-green-500/20 text-green-500 px-2 py-0.5 rounded-full font-bold">
                {posts.length} NEW
              </span>
              {canConfigure && (
                <button
                  className="p-1.5 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground"
                  title="Configure Lead Sources"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          <div className="p-2 border-b border-border bg-muted/10">
            <div className="flex items-center gap-2">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-[10px] font-bold uppercase bg-primary/10 text-primary rounded-lg">
                All ({posts.length})
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 text-[10px] font-bold uppercase text-muted-foreground hover:bg-muted rounded-lg transition-colors">
                High Intent
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-2 space-y-2">
            {posts.map(post => {
              const isRejected = post.thoughtTrace.some(t => t.status === 'rejected');

              return (
                <button
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedPost?.id === post.id
                      ? "bg-primary/5 border-primary shadow-sm"
                      : isRejected
                        ? "bg-muted/20 border-border hover:border-muted-foreground/30 opacity-60"
                        : "bg-background border-border hover:border-muted-foreground/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-tighter">
                      {post.subreddit}
                    </span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      post.intentScore >= 80 ? "text-green-500 bg-green-500/10" :
                      post.intentScore >= 50 ? "text-yellow-500 bg-yellow-500/10" :
                      "text-zinc-500 bg-zinc-500/10"
                    }`}>
                      {post.intentScore}%
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold line-clamp-2 mb-2">{post.title}</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {post.thoughtTrace.map((step, i) => (
                        <div key={i} className={`w-2 h-2 rounded-full ${
                          step.status === 'rejected' ? 'bg-red-500' :
                          step.status === 'complete' ? 'bg-green-500' :
                          step.status === 'processing' ? 'bg-yellow-500 animate-pulse' :
                          'bg-zinc-500'
                        }`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-muted-foreground italic">u/{post.author}</span>
                  </div>
                </button>
              );
            })}

            {posts.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Activity className="w-8 h-8 mb-3 opacity-20" />
                <p className="text-xs font-medium">No leads in queue</p>
                <p className="text-[10px] mt-1">Waiting for discovery...</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Panel: Detail View */}
      <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden">
        {selectedPost ? (
          <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
            {/* Left: Sequential Thinking */}
            <SequentialThinking
              steps={selectedPost.thoughtTrace}
              isProcessing={selectedPost.thoughtTrace.some(t => t.status === 'processing')}
            />

            {/* Right: Lead Review Card */}
            <LeadReviewCard
              lead={getLeadContent(selectedPost)}
              draftMessage={selectedPost.suggestedMessage}
              intentScore={selectedPost.intentScore}
              onApprove={handleApprove}
              onReject={handleReject}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          <div className="flex-1 bg-card border border-border border-dashed rounded-xl flex flex-col items-center justify-center text-muted-foreground">
            <Activity className="w-14 h-14 mb-4 opacity-10" />
            <p className="text-sm font-medium tracking-tight">Select a lead from the queue</p>
            <p className="text-xs mt-1 text-muted-foreground/70">
              Review the AI reasoning chain and approve or reject leads
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
