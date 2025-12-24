import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MainLayout } from "./components/MainLayout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Modules from "@/pages/Modules";
import ModuleQuiz from "@/pages/ModuleQuiz";
import BossBattle from "@/pages/BossBattle";
import Certification from "@/pages/Certification";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/modules" component={Modules} />
        <Route path="/modules/:moduleId/quiz" component={ModuleQuiz} />
        <Route path="/battle" component={BossBattle} />
        <Route path="/certification" component={Certification} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function AppRouter() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <AuthenticatedApp />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <AppRouter />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
