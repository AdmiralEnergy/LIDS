import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "owner" | "coo" | "cmo" | "manager" | "rep";
  fieldops_agent_id: string;
  hasLiveWireAccess?: boolean;
}

const ROLE_TO_AGENT: Record<string, string> = {
  owner: "fo-005",
  coo: "fo-009",
  cmo: "fo-007",
  manager: "fo-010",
  rep: "fo-001",
};

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
  hasLiveWireAccess: boolean;
  isLoading: boolean;
  loginByEmail: (email: string) => Promise<User | null>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);
const STORAGE_KEY = "compass_current_user";

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
    };
  } catch (err) {
    console.error("[Auth] Error:", err);
    return null;
  }
}

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const user = await fetchTwentyUser(parsed.email);
          if (user) {
            setCurrentUserState(user);
            setIsLoading(false);
            return;
          }
        } catch {}
      }
      setCurrentUserState(null);
      setIsLoading(false);
    }
    init();
  }, []);

  const setCurrentUser = (user: User) => {
    setCurrentUserState(user);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
  };

  const loginByEmail = async (email: string): Promise<User | null> => {
    const user = await fetchTwentyUser(email);
    if (user) setCurrentUser(user);
    return user;
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        assignedAgentId: currentUser?.fieldops_agent_id || "fo-001",
        hasLiveWireAccess: currentUser?.hasLiveWireAccess || false,
        isLoading,
        loginByEmail,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}

export const HELM_USERS: User[] = [];
export const DEMO_USERS = HELM_USERS;
