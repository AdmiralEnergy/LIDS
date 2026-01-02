import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { DashboardPage } from "./pages/dashboard";

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-background text-foreground">
        <DashboardPage />
      </div>
    </QueryClientProvider>
  );
}

export default App;
