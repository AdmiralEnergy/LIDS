import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  AuthUser,
  validateEmailDomain,
  findMemberByEmail,
  validateMemberId,
  getStoredMemberId,
  storeUserSession,
  clearUserSession,
  hasFeatureAccess,
  canConfigureLeadSources,
  canApproveLead,
} from "@/lib/auth";

/**
 * Auth Context for Command Dashboard
 *
 * Phase 4: LiveWire AutoGen Intelligence - RBAC Implementation
 *
 * Authentication Flow:
 * 1. User enters email on login screen
 * 2. Validate email domain (@admiralenergy.ai or known admin)
 * 3. Query Twenty CRM workspace members via /api/twenty/graphql
 * 4. If valid, store workspaceMemberId + role in localStorage
 * 5. On subsequent visits, validate stored ID is still in workspace
 *
 * Role-Based Access:
 * - owner/coo: Full access including lead source configuration
 * - admin: Analytics and approval
 * - standard: Approve/reject leads only
 */

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isValidating: boolean;
  error: string | null;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  hasAccess: (feature: string) => boolean;
  canConfigure: boolean;
  canApprove: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize: check for stored session and validate
  useEffect(() => {
    async function init() {
      setIsLoading(true);
      setError(null);

      const storedMemberId = getStoredMemberId();

      if (storedMemberId) {
        setIsValidating(true);
        try {
          const validatedUser = await validateMemberId(storedMemberId);

          if (validatedUser) {
            setUser(validatedUser);
            storeUserSession(validatedUser); // Update with fresh role data
          } else {
            // Session invalid - clear storage
            console.warn("[AuthProvider] Stored session invalid, clearing...");
            clearUserSession();
          }
        } catch (err) {
          console.error("[AuthProvider] Validation error:", err);
          clearUserSession();
        }
        setIsValidating(false);
      }

      setIsLoading(false);
    }

    init();
  }, []);

  const login = async (email: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Validate email domain
      const domainCheck = validateEmailDomain(email);
      if (!domainCheck.valid) {
        setError(domainCheck.error || "Invalid email domain");
        setIsLoading(false);
        return { success: false, error: domainCheck.error };
      }

      // Step 2: Look up user in Twenty CRM
      const authUser = await findMemberByEmail(email);

      if (!authUser) {
        const errorMsg = "User not found in workspace. Contact admin.";
        setError(errorMsg);
        setIsLoading(false);
        return { success: false, error: errorMsg };
      }

      // Step 3: Store session and set user
      storeUserSession(authUser);
      setUser(authUser);
      setIsLoading(false);

      console.log(`[AuthProvider] Login successful: ${authUser.email} (${authUser.role})`);
      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Login failed";
      setError(errorMsg);
      setIsLoading(false);
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    clearUserSession();
    setUser(null);
    setError(null);
    console.log("[AuthProvider] User logged out");
  };

  const hasAccess = (feature: string): boolean => {
    return hasFeatureAccess(user, feature);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isValidating,
        error,
        login,
        logout,
        hasAccess,
        canConfigure: canConfigureLeadSources(user),
        canApprove: canApproveLead(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook to access auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

/**
 * HOC to require authentication
 */
export function RequireAuth({ children, feature }: { children: ReactNode; feature?: string }) {
  const { user, isLoading, hasAccess } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Validating session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Will be handled by App.tsx to show login
    return null;
  }

  if (feature && !hasAccess(feature)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 bg-card border border-border rounded-xl max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-lg font-bold mb-2">Access Denied</h2>
          <p className="text-sm text-muted-foreground">
            You don't have permission to access this feature.
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
