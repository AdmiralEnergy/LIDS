import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { AuthProvider, useAuth } from "./providers/AuthProvider";
import { DashboardPage } from "./pages/dashboard";
import { LoginPage } from "./pages/login";

/**
 * Main App with Authentication
 *
 * Phase 4: LiveWire AutoGen Intelligence
 *
 * Auth Flow:
 * 1. AuthProvider checks localStorage for existing session
 * 2. If no session, show LoginPage
 * 3. If session exists, validate with Twenty CRM
 * 4. If valid, show DashboardPage
 */

function AppContent() {
  const { user, isLoading } = useAuth();

  // Show loading state during initial validation
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login if not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // Show dashboard if authenticated
  return <DashboardPage />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-background text-foreground">
          <AppContent />
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
