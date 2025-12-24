import { DataProvider } from "@refinedev/core";
import type { Lead, Activity } from "@shared/schema";

const generateId = () => Math.random().toString(36).substring(2, 11);

let leads: Lead[] = [];
let activities: Activity[] = [];

export const mockDataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    let data: any[] = [];
    
    if (resource === "leads") {
      data = [...leads];
    } else if (resource === "activities") {
      data = [...activities];
      
      const leadIdFilter = filters?.find((f: any) => f.field === "leadId");
      if (leadIdFilter) {
        data = data.filter((a) => a.leadId === leadIdFilter.value);
      }
    }

    if (sorters && sorters.length > 0) {
      const sorter = sorters[0];
      data.sort((a, b) => {
        const aVal = a[sorter.field];
        const bVal = b[sorter.field];
        if (sorter.order === "asc") {
          return aVal > bVal ? 1 : -1;
        }
        return aVal < bVal ? 1 : -1;
      });
    }

    const paginationAny = pagination as any;
    const current = paginationAny?.current || 1;
    const pageSize = paginationAny?.pageSize || 10;
    const start = (current - 1) * pageSize;
    const paginatedData = data.slice(start, start + pageSize);

    return {
      data: paginatedData,
      total: data.length,
    };
  },

  getOne: async ({ resource, id }) => {
    if (resource === "leads") {
      const lead = leads.find((l) => l.id === id);
      return { data: lead as any };
    } else if (resource === "activities") {
      const activity = activities.find((a) => a.id === id);
      return { data: activity as any };
    }
    return { data: null as any };
  },

  create: async ({ resource, variables }) => {
    const newItem = { ...variables, id: generateId() } as any;
    
    if (resource === "leads") {
      newItem.createdAt = new Date();
      leads.push(newItem);
    } else if (resource === "activities") {
      newItem.createdAt = new Date();
      activities.push(newItem);
    }
    
    return { data: newItem };
  },

  update: async ({ resource, id, variables }) => {
    if (resource === "leads") {
      const index = leads.findIndex((l) => l.id === id);
      if (index !== -1) {
        leads[index] = { ...leads[index], ...variables } as Lead;
        return { data: leads[index] as any };
      }
    } else if (resource === "activities") {
      const index = activities.findIndex((a) => a.id === id);
      if (index !== -1) {
        activities[index] = { ...activities[index], ...variables } as Activity;
        return { data: activities[index] as any };
      }
    }
    return { data: null as any };
  },

  deleteOne: async ({ resource, id }) => {
    if (resource === "leads") {
      leads = leads.filter((l) => l.id !== id);
    } else if (resource === "activities") {
      activities = activities.filter((a) => a.id !== id);
    }
    return { data: null as any };
  },

  getApiUrl: () => {
    return import.meta.env.VITE_TWENTY_API_URL || "/api";
  },

  custom: async () => {
    return { data: null as any };
  },
};

export const getLeadsStats = () => {
  const totalLeads = leads.length;
  const callsToday = activities.filter(
    (a) => a.type === "call" && 
    new Date(a.createdAt!).toDateString() === new Date().toDateString()
  ).length;
  
  const convertedLeads = leads.filter((l) => l.stage === "won").length;
  const conversionRate = totalLeads > 0 ? Math.round((convertedLeads / totalLeads) * 100) : 0;
  
  const pipelineValue = leads
    .filter((l) => !["won", "lost"].includes(l.stage))
    .reduce((sum, l) => sum + (l.icpScore * 1000), 0);
    
  return {
    totalLeads,
    callsToday: callsToday || 5,
    conversionRate,
    pipelineValue,
  };
};

export const getLeadsByStage = () => {
  const stages = ["new", "contacted", "qualified", "proposal", "won", "lost"];
  return stages.reduce((acc, stage) => {
    acc[stage] = leads.filter((l) => l.stage === stage);
    return acc;
  }, {} as Record<string, Lead[]>);
};

export const updateLeadStage = (leadId: string, newStage: string) => {
  const index = leads.findIndex((l) => l.id === leadId);
  if (index !== -1) {
    leads[index] = { ...leads[index], stage: newStage };
    return leads[index];
  }
  return null;
};
