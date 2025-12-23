import { DataProvider } from "@refinedev/core";
import type { Lead, Activity } from "@shared/schema";

const generateId = () => Math.random().toString(36).substring(2, 11);

const sampleLeads: Lead[] = [
  {
    id: "1",
    name: "Sarah Johnson",
    email: "sarah.johnson@techcorp.com",
    phone: "+1 (555) 123-4567",
    company: "TechCorp Inc",
    stage: "qualified",
    status: "qualified",
    icpScore: 87,
    source: "Website",
    createdAt: new Date("2024-12-15"),
  },
  {
    id: "2",
    name: "Michael Chen",
    email: "m.chen@innovate.io",
    phone: "+1 (555) 234-5678",
    company: "Innovate.io",
    stage: "contacted",
    status: "contacted",
    icpScore: 72,
    source: "LinkedIn",
    createdAt: new Date("2024-12-18"),
  },
  {
    id: "3",
    name: "Emily Rodriguez",
    email: "emily.r@startup.co",
    phone: "+1 (555) 345-6789",
    company: "StartupCo",
    stage: "new",
    status: "new",
    icpScore: 45,
    source: "Referral",
    createdAt: new Date("2024-12-20"),
  },
  {
    id: "4",
    name: "David Kim",
    email: "david.kim@enterprise.net",
    phone: "+1 (555) 456-7890",
    company: "Enterprise Networks",
    stage: "proposal",
    status: "qualified",
    icpScore: 93,
    source: "Trade Show",
    createdAt: new Date("2024-12-10"),
  },
  {
    id: "5",
    name: "Lisa Thompson",
    email: "lisa.t@growthtech.com",
    phone: "+1 (555) 567-8901",
    company: "GrowthTech",
    stage: "won",
    status: "converted",
    icpScore: 95,
    source: "Website",
    createdAt: new Date("2024-11-28"),
  },
  {
    id: "6",
    name: "James Wilson",
    email: "jwilson@digitalfirst.io",
    phone: "+1 (555) 678-9012",
    company: "Digital First",
    stage: "new",
    status: "new",
    icpScore: 58,
    source: "Cold Email",
    createdAt: new Date("2024-12-22"),
  },
  {
    id: "7",
    name: "Amanda Foster",
    email: "amanda@cloudservices.com",
    phone: "+1 (555) 789-0123",
    company: "Cloud Services Ltd",
    stage: "contacted",
    status: "contacted",
    icpScore: 81,
    source: "Webinar",
    createdAt: new Date("2024-12-19"),
  },
  {
    id: "8",
    name: "Robert Martinez",
    email: "robert.m@datapro.co",
    phone: "+1 (555) 890-1234",
    company: "DataPro Analytics",
    stage: "qualified",
    status: "qualified",
    icpScore: 76,
    source: "Partner",
    createdAt: new Date("2024-12-14"),
  },
  {
    id: "9",
    name: "Jennifer Lee",
    email: "jlee@nexgen.io",
    phone: "+1 (555) 901-2345",
    company: "NexGen Solutions",
    stage: "lost",
    status: "contacted",
    icpScore: 42,
    source: "LinkedIn",
    createdAt: new Date("2024-12-05"),
  },
  {
    id: "10",
    name: "Christopher Brown",
    email: "c.brown@scaleup.tech",
    phone: "+1 (555) 012-3456",
    company: "ScaleUp Technologies",
    stage: "proposal",
    status: "qualified",
    icpScore: 89,
    source: "Website",
    createdAt: new Date("2024-12-12"),
  },
];

const sampleActivities: Activity[] = [
  {
    id: "a1",
    leadId: "1",
    type: "call",
    description: "Discussed product requirements and pricing",
    createdAt: new Date("2024-12-22T10:30:00"),
  },
  {
    id: "a2",
    leadId: "2",
    type: "email",
    description: "Sent follow-up proposal document",
    createdAt: new Date("2024-12-22T09:15:00"),
  },
  {
    id: "a3",
    leadId: "4",
    type: "meeting",
    description: "Demo presentation with stakeholders",
    createdAt: new Date("2024-12-21T14:00:00"),
  },
  {
    id: "a4",
    leadId: "1",
    type: "note",
    description: "Budget approved, moving to contract phase",
    createdAt: new Date("2024-12-21T16:45:00"),
  },
  {
    id: "a5",
    leadId: "7",
    type: "call",
    description: "Initial discovery call completed",
    createdAt: new Date("2024-12-20T11:00:00"),
  },
];

let leads = [...sampleLeads];
let activities = [...sampleActivities];

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
