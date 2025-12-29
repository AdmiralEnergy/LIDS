import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MarketingLoginScreen } from "@/components/MarketingLoginScreen";
import { UserProvider, useUser } from "@/lib/user-context";
import { OfflineProvider } from "@/lib/offline-context";
import { Route, Link, useLocation } from "wouter";
import { Home, Calendar, MessageSquare, Users } from "lucide-react";
import Dashboard from "@/pages/dashboard";
import ContentCalendar from "@/pages/calendar";
import MarketingChat from "@/pages/marketing";
import TeamChat from "@/pages/team-chat";

const theme = {
  gold: '#D4AF37',
  rosePink: '#E8B4BC',
};

function NavBar() {
  const [location] = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/chat', icon: MessageSquare, label: 'Agents' },
    { path: '/team', icon: Users, label: 'Team' },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:top-0 md:bottom-auto"
      style={{
        background: 'rgba(0, 0, 0, 0.9)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        borderBottom: 'none',
      }}
    >
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-around md:justify-start md:gap-6 h-16">
          {/* Logo - hidden on mobile */}
          <Link href="/" className="hidden md:flex items-center gap-2 mr-8">
            <span
              className="text-xl font-light tracking-widest"
              style={{ color: theme.gold }}
            >
              STUDIO
            </span>
          </Link>

          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <button
                  className="flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{
                    background: isActive ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
                  }}
                >
                  <item.icon
                    className="w-5 h-5"
                    style={{ color: isActive ? theme.gold : '#9CA3AF' }}
                  />
                  <span
                    className="text-xs md:text-sm"
                    style={{ color: isActive ? theme.gold : '#9CA3AF' }}
                  >
                    {item.label}
                  </span>
                </button>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

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

  // Show app with navigation
  return (
    <div className="pb-16 md:pt-16 md:pb-0">
      <NavBar />
      <Route path="/" component={Dashboard} />
      <Route path="/calendar" component={ContentCalendar} />
      <Route path="/chat" component={MarketingChat} />
      <Route path="/team" component={TeamChat} />
    </div>
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
