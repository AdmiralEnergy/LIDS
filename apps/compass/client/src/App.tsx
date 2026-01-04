import { useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AgentSidebar } from "@/components/compass/AgentSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserSelector } from "@/components/UserSelector";
import { OfflineBanner } from "@/components/OfflineBanner";
import { LoginScreen } from "@/components/LoginScreen";
import { UserProvider, useUser } from "@/lib/user-context";
import { OfflineProvider } from "@/lib/offline-context";
import { seedDemoData } from "@/lib/db";
import Home from "@/pages/home";
import CommandsPage from "@/pages/CommandsPage";
import LiveWirePage from "@/pages/livewire";
import LiveWireSettingsPage from "@/pages/livewire-settings";
import LiveWireFeedbackPage from "@/pages/livewire-feedback";
import PhonePage from "@/pages/phone";
import NotFound from "@/pages/not-found";

function Router() {
  const { selectedAgentId } = useUser();

  return (
    <Switch>
      <Route path="/">
        <CommandsPage />
      </Route>
      <Route path="/chat">
        <Home selectedAgentId={selectedAgentId} />
      </Route>
      <Route path="/livewire">
        <LiveWirePage />
      </Route>
      <Route path="/livewire/settings">
        <LiveWireSettingsPage />
      </Route>
      <Route path="/livewire/feedback">
        <LiveWireFeedbackPage />
      </Route>
      <Route path="/phone">
        <PhonePage />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const { selectedAgentId, currentUser, isLoading } = useUser();

  useEffect(() => {
    seedDemoData().catch(console.error);
  }, []);

  // Show login screen if no user is logged in
  if (!isLoading && !currentUser) {
    return <LoginScreen />;
  }

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AgentSidebar agentId={selectedAgentId} />
        <div className="flex flex-col flex-1 min-w-0">
          <OfflineBanner />
          <header className="h-12 border-b border-border flex items-center gap-2 px-3 flex-shrink-0 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <UserSelector />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-hidden">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
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
// Cache bust 1766889855
