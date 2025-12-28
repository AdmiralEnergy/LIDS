import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "coo" | "cmo" | "manager" | "rep";
  fieldops_agent_id: string;
  hasLiveWireAccess?: boolean;
  hasGuardianAccess?: boolean;
}

// Role to agent mapping
const ROLE_TO_AGENT: Record<string, string> = {
  owner: "guardian",
  coo: "fo-009",
  cmo: "fo-007",
  manager: "fo-010",
  rep: "fo-001",
};

// Infer role from email (central role detection)
function inferRole(email: string): User["role"] {
  const e = email.toLowerCase();
  if (e === "davide@admiralenergy.ai") return "owner";
  if (e === "nathanielj@admiralenergy.ai") return "coo";
  if (e === "leighe@ripemerchant.host") return "cmo";
  return "rep";
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User) => void;
  assignedAgentId: string;
  selectedAgentId: string;
  setSelectedAgentId: (agentId: string) => void;
  hasLiveWireAccess: boolean;
  hasGuardianAccess: boolean;
  isLoading: boolean;
  loginByEmail: (email: string) => Promise<User | null>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "compass_current_user";
const AGENT_STORAGE_KEY = "compass_selected_agent";

// Auth via backend proxy to Twenty CRM
async function fetchTwentyUser(email: string): Promise<User | null> {
  try {
    const response = await fetch("/api/twenty/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      const err = await response.json();
      console.warn("[Auth] Twenty lookup failed:", err.error);
      return null;
    }

    const data = await response.json();
    if (!data.success || !data.user) return null;

    const role = inferRole(email);
    return {
      id: data.user.id,
      name: data.user.name || email.split("@")[0],
      email: email.toLowerCase(),
      role,
      fieldops_agent_id: ROLE_TO_AGENT[role] || "fo-001",
      hasLiveWireAccess: ["owner", "coo", "cmo"].includes(role),
      hasGuardianAccess: role === "owner",
    };
  } catch (err) {
    console.error("[Auth] Error:", err);
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [selectedAgentId, setSelectedAgentIdState] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Initialize user from stored session
  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.email) {
            const user = await fetchTwentyUser(parsed.email);
            if (user) {
              setCurrentUserState(user);
              // Restore selected agent or use default
              const storedAgent = localStorage.getItem(AGENT_STORAGE_KEY);
              setSelectedAgentIdState(storedAgent || user.fieldops_agent_id);
              setIsLoading(false);
              return;
            }
          }
        } catch {
          // Invalid stored data, continue to show login
        }
      }
      setCurrentUserState(null);
      setIsLoading(false);
    }
    init();
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    setSelectedAgentIdState(user.fieldops_agent_id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
  };

  const setSelectedAgentId = (agentId: string) => {
    setSelectedAgentIdState(agentId);
    localStorage.setItem(AGENT_STORAGE_KEY, agentId);
  };

  const logout = () => {
    setCurrentUserState(null);
    setSelectedAgentIdState("");
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(AGENT_STORAGE_KEY);
  };

  const loginByEmail = async (email: string): Promise<User | null> => {
    const user = await fetchTwentyUser(email);
    if (user) {
      setCurrentUser(user);
      return user;
    }
    return null;
  };

  const assignedAgentId = currentUser?.fieldops_agent_id || "fo-001";
  const hasLiveWireAccess = currentUser?.hasLiveWireAccess || currentUser?.role === "owner" || false;
  const hasGuardianAccess = currentUser?.role === "owner";

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        assignedAgentId,
        selectedAgentId: selectedAgentId || assignedAgentId,
        setSelectedAgentId,
        hasLiveWireAccess,
        hasGuardianAccess,
        isLoading,
        loginByEmail,
        logout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
