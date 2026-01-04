import { useState, useEffect, useCallback } from "react";
import { getWorkspaceMembers } from "../lib/twentyStatsApi";
import { getTwentyCrmUrl, getSettings } from "../lib/settings";

interface WorkspaceMember {
  id: string;
  name: { firstName: string; lastName: string };
  userEmail: string;
}

export function useLeadAssignment() {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getWorkspaceMembers();
        setMembers(data);
      } catch (e) {
        console.error("[useLeadAssignment] Failed to load members:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const assignLead = useCallback(async (leadId: string, workspaceMemberId: string | null) => {
    const settings = getSettings();
    const apiUrl = getTwentyCrmUrl();

    const mutation = `
      mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
        updatePerson(id: $id, data: $data) {
          id
          assignedToWorkspaceMemberId
        }
      }
    `;

    try {
      const response = await fetch(`${apiUrl}/graphql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${settings.twentyApiKey}`,
        },
        body: JSON.stringify({
          query: mutation,
          variables: {
            id: leadId,
            data: { assignedToWorkspaceMemberId: workspaceMemberId },
          },
        }),
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0]?.message || "GraphQL error");
      }
      return result.data?.updatePerson;
    } catch (error) {
      console.error("[useLeadAssignment] Failed to assign lead:", error);
      throw error;
    }
  }, []);

  const bulkAssign = useCallback(async (leadIds: string[], workspaceMemberId: string) => {
    const results = [];
    for (const id of leadIds) {
      try {
        const result = await assignLead(id, workspaceMemberId);
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error });
      }
    }
    return results;
  }, [assignLead]);

  const getMemberName = useCallback((workspaceMemberId: string | null | undefined) => {
    if (!workspaceMemberId) return "Unassigned";
    const member = members.find(m => m.id === workspaceMemberId);
    return member ? `${member.name.firstName} ${member.name.lastName}` : "Unknown";
  }, [members]);

  return {
    members,
    loading,
    assignLead,
    bulkAssign,
    getMemberName,
  };
}