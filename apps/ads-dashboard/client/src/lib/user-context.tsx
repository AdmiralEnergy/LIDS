import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getTwentyApiUrl } from "./settings";

/**
 * User Context for ADS Dashboard
 *
 * Authentication Flow:
 * 1. User enters email on login screen
 * 2. Backend validates against Twenty CRM workspace members
 * 3. If valid, workspaceMemberId is stored in localStorage
 * 4. On subsequent visits, validates stored ID is still in workspace
 *
 * Key principle: workspaceMemberId is PERMANENT, email is MUTABLE
 * Users can change their email without losing progression/stats
 */

export interface User {
  id: string;              // workspaceMemberId - PERMANENT identifier
  name: string;
  email: string;           // Can be changed by user
}

interface UserContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  isLoading: boolean;
  isValidating: boolean;
  loginByEmail: (email: string) => Promise<User | null>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const STORAGE_KEY = "ads_current_user";
const WORKSPACE_MEMBER_ID_KEY = "twentyWorkspaceMemberId";

export function UserProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);

  // Fetch workspace members from Twenty CRM
  async function fetchWorkspaceMembers(): Promise<any[]> {
    const apiUrl = getTwentyApiUrl();
    if (!apiUrl) return [];

    try {
      const response = await fetch(`${apiUrl}/rest/workspaceMembers`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("twentyApiKey") || import.meta.env.VITE_TWENTY_API_KEY || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.data?.workspaceMembers || data.workspaceMembers || [];
    } catch (error) {
      console.error("[UserContext] Failed to fetch workspace members:", error);
      return [];
    }
  }

  // Find a workspace member by email
  async function findMemberByEmail(email: string): Promise<User | null> {
    const members = await fetchWorkspaceMembers();
    const lowerEmail = email.toLowerCase();

    const member = members.find((m: any) =>
      m.userEmail?.toLowerCase() === lowerEmail
    );

    if (member) {
      return {
        id: member.id,
        name: member.name?.firstName
          ? `${member.name.firstName} ${member.name.lastName || ""}`.trim()
          : email.split("@")[0],
        email: member.userEmail || email,
      };
    }

    return null;
  }

  // Validate that a workspaceMemberId is still valid
  async function validateMemberId(memberId: string): Promise<User | null> {
    const members = await fetchWorkspaceMembers();
    const member = members.find((m: any) => m.id === memberId);

    if (member) {
      return {
        id: member.id,
        name: member.name?.firstName
          ? `${member.name.firstName} ${member.name.lastName || ""}`.trim()
          : member.userEmail?.split("@")[0] || "User",
        email: member.userEmail || "",
      };
    }

    return null;
  }

  // Initialize: check for stored session and validate
  useEffect(() => {
    async function init() {
      setIsLoading(true);

      // Check for stored workspaceMemberId
      const storedMemberId = localStorage.getItem(WORKSPACE_MEMBER_ID_KEY);

      if (storedMemberId) {
        setIsValidating(true);
        const user = await validateMemberId(storedMemberId);
        setIsValidating(false);

        if (user) {
          setCurrentUserState(user);
          // Update stored email in case it changed
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
        } else {
          // Session invalid - clear storage
          console.warn("[UserContext] Stored session invalid, clearing...");
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(WORKSPACE_MEMBER_ID_KEY);
        }
      }

      setIsLoading(false);
    }

    init();
  }, []);

  const setCurrentUser = (user: User | null) => {
    setCurrentUserState(user);
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: user.id, email: user.email }));
      localStorage.setItem(WORKSPACE_MEMBER_ID_KEY, user.id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(WORKSPACE_MEMBER_ID_KEY);
    }
  };

  const loginByEmail = async (email: string): Promise<User | null> => {
    const user = await findMemberByEmail(email);
    if (user) {
      setCurrentUser(user);
    }
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
  };

  return (
    <UserContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        isLoading,
        isValidating,
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

/**
 * Get the current workspace member ID
 * Used by twentySync.ts for progression sync
 */
export function getCurrentWorkspaceMemberId(): string | null {
  return localStorage.getItem(WORKSPACE_MEMBER_ID_KEY);
}
