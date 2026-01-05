import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Zap, AlertCircle, Loader2, Shield } from "lucide-react";

/**
 * Login Page for Command Dashboard
 *
 * Phase 4: LiveWire AutoGen Intelligence
 *
 * Security Features:
 * - Domain guard: Only @admiralenergy.ai emails allowed
 * - Twenty CRM workspace member validation
 * - Role-based access assignment on login
 */

export function LoginPage() {
  const { login, isLoading, error } = useAuth();
  const [email, setEmail] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }

    // Basic email format validation
    if (!email.includes("@")) {
      setLocalError("Please enter a valid email address");
      return;
    }

    const result = await login(email.trim());
    if (!result.success) {
      setLocalError(result.error || "Login failed");
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Command Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">LiveWire Intelligence Control Plane</p>
        </div>

        {/* Login Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
                Work Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@admiralenergy.ai"
                className="w-full px-4 py-3 text-sm bg-muted/30 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                disabled={isLoading}
                autoComplete="email"
                autoFocus
              />
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="flex items-start gap-3 p-3 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <p className="text-sm">{displayError}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-sm uppercase tracking-widest rounded-xl hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Shield className="w-3.5 h-3.5" />
              <span>Access restricted to Admiral Energy team members</span>
            </div>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Need access? Contact{" "}
          <a href="mailto:nathanielj@admiralenergy.ai" className="text-primary hover:underline">
            Nate Jenkins
          </a>
        </p>
      </div>
    </div>
  );
}
