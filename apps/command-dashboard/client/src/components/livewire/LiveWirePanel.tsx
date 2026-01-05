import { useState } from "react";
import { Activity, Search, Globe, Wifi, WifiOff } from "lucide-react";
import { LiveWireControl } from "./LiveWireControl";
import { KeywordManager } from "./KeywordManager";
import { SubredditManager } from "./SubredditManager";
import { useAuth } from "@/providers/AuthProvider";

/**
 * LiveWire Panel - Main container with tab navigation
 *
 * Tabs:
 * - Leads: Review and approve/reject discovered leads
 * - Keywords: Manage keyword weights and performance
 * - Subreddits: Manage subreddit tiers (Active/Test/Retired)
 */

type LiveWireTab = "leads" | "keywords" | "subreddits";

export function LiveWirePanel() {
  const { canConfigure } = useAuth();
  const [activeTab, setActiveTab] = useState<LiveWireTab>("leads");

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Tab Navigation */}
      <div className="flex items-center justify-between shrink-0">
        <nav className="flex items-center bg-muted/50 p-1 rounded-lg gap-1">
          <button
            onClick={() => setActiveTab("leads")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              activeTab === "leads"
                ? "bg-background text-[#00ffff] shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            LEADS
          </button>
          {canConfigure && (
            <>
              <button
                onClick={() => setActiveTab("keywords")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === "keywords"
                    ? "bg-background text-[#00ffff] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                KEYWORDS
              </button>
              <button
                onClick={() => setActiveTab("subreddits")}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                  activeTab === "subreddits"
                    ? "bg-background text-[#00ffff] shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                SUBREDDITS
              </button>
            </>
          )}
        </nav>

        {/* Status indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>LiveWire v1</span>
          <span className="text-green-500 flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Connected
          </span>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {activeTab === "leads" && <LiveWireControl />}
        {activeTab === "keywords" && (
          <div className="h-full overflow-auto">
            <KeywordManager />
          </div>
        )}
        {activeTab === "subreddits" && (
          <div className="h-full overflow-auto">
            <SubredditManager />
          </div>
        )}
      </div>
    </div>
  );
}
