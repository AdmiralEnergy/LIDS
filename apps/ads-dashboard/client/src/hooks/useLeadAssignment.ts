import { useState, useEffect, useCallback } from "react";
import { getWorkspaceMembers } from "../lib/twentyStatsApi";
import { getTwentyCrmUrl, getSettings } from "../lib/settings";

interface WorkspaceMember {
  id: string;
  name: { firstName: string; lastName: string };
  userEmail: string;
}

// Convert name to SELECT field value format (SCREAMING_SNAKE_CASE)
function nameToSelectValue(firstName: string, lastName: string): string {
  const fullName = `${firstName} ${lastName}`.trim();
  return fullName.toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '_');
}

// Convert SELECT value back to display name
function selectValueToName(selectValue: string): string {
  if (!selectValue) return 'Unassigned';
  return selectValue.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
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

  // Assign lead using SELECT field value (SCREAMING_SNAKE_CASE name)
  const assignLead = useCallback(async (leadId: string, selectValue: string | null) => {
    const settings = getSettings();
    const apiUrl = getTwentyCrmUrl();

    const mutation = `
      mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
        updatePerson(id: $id, data: $data) {
          id
          assignedRep
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
            data: { assignedRep: selectValue },
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

  const bulkAssign = useCallback(async (leadIds: string[], selectValue: string) => {
    const results = [];
    for (const id of leadIds) {
      try {
        const result = await assignLead(id, selectValue);
        results.push({ id, success: true, result });
      } catch (error) {
        results.push({ id, success: false, error });
      }
    }
    return results;
  }, [assignLead]);

  // Get display name from SELECT value
  const getMemberName = useCallback((selectValue: string | null | undefined) => {
    return selectValueToName(selectValue || '');
  }, []);

  // Get SELECT options for dropdown (list of reps with their values)
  const getSelectOptions = useCallback(() => {
    return members.map(m => ({
      value: nameToSelectValue(m.name.firstName, m.name.lastName),
      label: `${m.name.firstName} ${m.name.lastName}`,
      email: m.userEmail,
    }));
  }, [members]);

  return {
    members,
    loading,
    assignLead,
    bulkAssign,
    getMemberName,
    getSelectOptions,
    nameToSelectValue,
    selectValueToName,
  };
}
