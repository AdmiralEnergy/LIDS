import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MarketingLoginScreen } from "@/components/MarketingLoginScreen";
import { UserProvider, useUser } from "@/lib/user-context";
import { OfflineProvider } from "@/lib/offline-context";
import MarketingDashboard from "@/pages/marketing";

function AppLayout() {
  const { currentUser, isLoading } = useUser();

  // Show beautiful marketing login if not logged in
  if (!isLoading && !currentUser) {
    return <MarketingLoginScreen />;
  }

  // Loading state
  if (isLoading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a1512 0%, #2d2319 50%, #1a1512 100%)' }}
      >
        <div className="animate-pulse">
          <div 
            className="w-16 h-16 rounded-xl"
            style={{ background: 'linear-gradient(135deg, #B76E79 0%, #D4AF37 100%)' }}
          />
        </div>
      </div>
    );
  }

  // Show marketing dashboard
  return <MarketingDashboard />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <OfflineProvider>
          <UserProvider>
            <Toaster />
            <AppLayout />
          </UserProvider>
        </OfflineProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
