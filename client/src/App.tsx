import { useState } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AgentSidebar } from "@/components/compass/AgentSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Router({ selectedAgentId }: { selectedAgentId: string }) {
  return (
    <Switch>
      <Route path="/">
        <Home selectedAgentId={selectedAgentId} />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function AppLayout() {
  const [selectedAgentId, setSelectedAgentId] = useState('fo-001');

  const style = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AgentSidebar 
          selectedAgentId={selectedAgentId}
          onSelectAgent={setSelectedAgentId}
        />
        <div className="flex flex-col flex-1 min-w-0">
          <header className="h-12 border-b border-border flex items-center gap-2 px-3 flex-shrink-0 bg-background">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-hidden">
            <Router selectedAgentId={selectedAgentId} />
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
        <Toaster />
        <AppLayout />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
