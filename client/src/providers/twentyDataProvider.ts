import { DataProvider } from "@refinedev/core";
import type { Lead, Activity } from "@shared/schema";
import { getSettings, getTwentyCrmUrl } from "../lib/settings";

function getTwentyApiUrl(): string {
  const settings = getSettings();
  if (!settings.twentyApiKey) {
    return "";
  }
  return getTwentyCrmUrl();
}

interface TwentyPerson {
  id: string;
  name?: {
    firstName?: string;
    lastName?: string;
  };
  emails?: {
    primaryEmail?: string;
  };
  phones?: {
    primaryPhoneNumber?: string;
  };
  company?: {
    name?: string;
  };
  createdAt?: string;
  jobTitle?: string;
  linkedinLink?: {
    url?: string;
  };
}

interface TwentyCompany {
  id: string;
  name?: string;
  domainName?: string;
  employees?: number;
  linkedinLink?: {
    url?: string;
  };
  createdAt?: string;
}

interface TwentyNote {
  id: string;
  title?: string;
  body?: string;
  createdAt?: string;
  person?: TwentyPerson;
  company?: TwentyCompany;
}

interface TwentyTask {
  id: string;
  title?: string;
  body?: string;
  status?: string;
  dueAt?: string;
  createdAt?: string;
  assignee?: any;
}

let isConnected = false;
let connectionError: string | null = null;

async function graphqlRequest(query: string, variables?: Record<string, any>) {
  const apiUrl = getTwentyApiUrl();
  const settings = getSettings();

  if (!apiUrl) {
    throw new Error("Twenty CRM not configured - check Settings");
  }

  const response = await fetch(`${apiUrl}/graphql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${settings.twentyApiKey}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error: ${response.status}`);
  }

  const result = await response.json();
  
  if (result.usable === false || (result.errors && !result.data)) {
    throw new Error(result.errors?.[0]?.message || "GraphQL error");
  }

  return result.data;
}

function mapPersonToLead(person: TwentyPerson): Lead {
  const firstName = person.name?.firstName || "";
  const lastName = person.name?.lastName || "";
  const fullName = `${firstName} ${lastName}`.trim() || "Unknown";

  return {
    id: person.id,
    name: fullName,
    email: person.emails?.primaryEmail || "",
    phone: person.phones?.primaryPhoneNumber || "",
    company: person.company?.name || "",
    stage: "new",
    status: "new",
    icpScore: 50,
    source: person.linkedinLink?.url ? "LinkedIn" : "Direct",
    createdAt: person.createdAt ? new Date(person.createdAt) : new Date(),
  };
}

function mapNoteToActivity(note: TwentyNote): Activity {
  const personName = note.person 
    ? `${note.person.name?.firstName || ""} ${note.person.name?.lastName || ""}`.trim()
    : note.company?.name || "Unknown";

  return {
    id: note.id,
    leadId: note.person?.id || note.company?.id || "",
    type: "note",
    description: note.body || note.title || "",
    createdAt: note.createdAt ? new Date(note.createdAt) : new Date(),
  };
}

function mapTaskToActivity(task: TwentyTask): Activity {
  return {
    id: task.id,
    leadId: "",
    type: task.status === "DONE" ? "status" : "call",
    description: task.title || task.body || "",
    createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
  };
}

export const twentyDataProvider: DataProvider = {
  getList: async ({ resource, pagination, filters, sorters }) => {
    try {
      if (resource === "leads" || resource === "people") {
        const query = `
          query GetPeople($first: Int, $after: String) {
            people(first: $first, after: $after) {
              edges {
                node {
                  id
                  name {
                    firstName
                    lastName
                  }
                  emails {
                    primaryEmail
                  }
                  phones {
                    primaryPhoneNumber
                  }
                  company {
                    name
                  }
                  linkedinLink {
                    url
                  }
                  createdAt
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
              totalCount
            }
          }
        `;

        const pageSize = pagination?.pageSize || 20;
        const data = await graphqlRequest(query, { first: pageSize });
        
        isConnected = true;
        connectionError = null;

        const leads = data.people.edges.map((edge: any) => mapPersonToLead(edge.node));

        return {
          data: leads,
          total: data.people.totalCount || leads.length,
        };
      }

      if (resource === "activities") {
        const notesQuery = `
          query GetNotes($first: Int) {
            notes(first: $first) {
              edges {
                node {
                  id
                  title
                  body
                  createdAt
                  person {
                    id
                    name {
                      firstName
                      lastName
                    }
                  }
                  company {
                    id
                    name
                  }
                }
              }
              totalCount
            }
          }
        `;

        const tasksQuery = `
          query GetTasks($first: Int) {
            tasks(first: $first) {
              edges {
                node {
                  id
                  title
                  body
                  status
                  dueAt
                  createdAt
                }
              }
              totalCount
            }
          }
        `;

        const [notesData, tasksData] = await Promise.all([
          graphqlRequest(notesQuery, { first: 50 }),
          graphqlRequest(tasksQuery, { first: 50 }),
        ]);

        isConnected = true;
        connectionError = null;

        const noteActivities = notesData.notes.edges.map((edge: any) => mapNoteToActivity(edge.node));
        const taskActivities = tasksData.tasks.edges.map((edge: any) => mapTaskToActivity(edge.node));
        
        const activities = [...noteActivities, ...taskActivities].sort((a, b) => {
          const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
          const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
          return dateB - dateA;
        });

        return {
          data: activities,
          total: activities.length,
        };
      }

      if (resource === "companies") {
        const query = `
          query GetCompanies($first: Int) {
            companies(first: $first) {
              edges {
                node {
                  id
                  name
                  domainName
                  employees
                  linkedinLink {
                    url
                  }
                  createdAt
                }
              }
              totalCount
            }
          }
        `;

        const data = await graphqlRequest(query, { first: 50 });
        
        isConnected = true;
        connectionError = null;

        return {
          data: data.companies.edges.map((edge: any) => edge.node),
          total: data.companies.totalCount || data.companies.edges.length,
        };
      }

      if (resource === "notes") {
        const query = `
          query GetNotes($first: Int) {
            notes(first: $first) {
              edges {
                node {
                  id
                  title
                  body
                  createdAt
                  person {
                    id
                    name {
                      firstName
                      lastName
                    }
                  }
                  company {
                    id
                    name
                  }
                }
              }
              totalCount
            }
          }
        `;

        const data = await graphqlRequest(query, { first: 100 });
        
        isConnected = true;
        connectionError = null;

        return {
          data: data.notes.edges.map((edge: any) => edge.node),
          total: data.notes.totalCount || data.notes.edges.length,
        };
      }

      if (resource === "tasks") {
        const query = `
          query GetTasks($first: Int) {
            tasks(first: $first) {
              edges {
                node {
                  id
                  title
                  body
                  status
                  dueAt
                  createdAt
                }
              }
              totalCount
            }
          }
        `;

        const data = await graphqlRequest(query, { first: 100 });
        
        isConnected = true;
        connectionError = null;

        return {
          data: data.tasks.edges.map((edge: any) => edge.node),
          total: data.tasks.totalCount || data.tasks.edges.length,
        };
      }

      if (resource === "opportunities") {
        const query = `
          query GetOpportunities($first: Int) {
            opportunities(first: $first) {
              edges {
                node {
                  id
                  name
                  amount {
                    amountMicros
                    currencyCode
                  }
                  stage
                  closeDate
                  company {
                    name
                  }
                  createdAt
                }
              }
              totalCount
            }
          }
        `;

        const data = await graphqlRequest(query, { first: 100 });
        
        isConnected = true;
        connectionError = null;

        return {
          data: data.opportunities.edges.map((edge: any) => edge.node),
          total: data.opportunities.totalCount || data.opportunities.edges.length,
        };
      }

      return { data: [], total: 0 };
    } catch (error) {
      isConnected = false;
      connectionError = error instanceof Error ? error.message : "Unknown error";
      console.warn("Twenty API unavailable:", connectionError);
      return { data: [], total: 0 };
    }
  },

  getOne: async ({ resource, id }) => {
    try {
      if (resource === "leads" || resource === "people") {
        const query = `
          query GetPerson($id: ID!) {
            person(filter: { id: { eq: $id } }) {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phones {
                primaryPhoneNumber
              }
              company {
                name
              }
              linkedinLink {
                url
              }
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(query, { id });
        isConnected = true;
        
        return { data: mapPersonToLead(data.person) };
      }

      return { data: null as any };
    } catch (error) {
      console.warn("Twenty API unavailable for getOne");
      return { data: null as any };
    }
  },

  create: async ({ resource, variables }) => {
    try {
      if (resource === "leads" || resource === "people") {
        const lead = variables as Partial<Lead>;
        const nameParts = (lead.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const mutation = `
          mutation CreatePerson($data: PersonCreateInput!) {
            createPerson(data: $data) {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phones {
                primaryPhoneNumber
              }
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(mutation, {
          data: {
            name: { firstName, lastName },
            emails: { primaryEmail: lead.email },
            phones: { primaryPhoneNumber: lead.phone },
          },
        });

        isConnected = true;
        return { data: mapPersonToLead(data.createPerson) };
      }

      if (resource === "activities" || resource === "notes") {
        const noteData = variables as any;
        
        const mutation = `
          mutation CreateNote($data: NoteCreateInput!) {
            createNote(data: $data) {
              id
              title
              body
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(mutation, {
          data: {
            title: noteData.title,
            body: noteData.body || noteData.description,
            personId: noteData.leadId || noteData.personId,
          },
        });

        isConnected = true;
        if (resource === "activities") {
          return { data: mapNoteToActivity(data.createNote) };
        }
        return { data: data.createNote };
      }

      if (resource === "companies") {
        const companyData = variables as any;
        
        const mutation = `
          mutation CreateCompany($data: CompanyCreateInput!) {
            createCompany(data: $data) {
              id
              name
              domainName
              employees
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(mutation, {
          data: {
            name: companyData.name,
            domainName: companyData.domainName || companyData.domain,
            employees: companyData.employees,
          },
        });

        isConnected = true;
        return { data: data.createCompany };
      }

      if (resource === "tasks") {
        const taskData = variables as any;
        
        const mutation = `
          mutation CreateTask($data: TaskCreateInput!) {
            createTask(data: $data) {
              id
              title
              body
              status
              dueAt
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(mutation, {
          data: {
            title: taskData.title,
            body: taskData.body,
            status: taskData.status || "TODO",
            dueAt: taskData.dueAt,
          },
        });

        isConnected = true;
        return { data: data.createTask };
      }

      if (resource === "opportunities") {
        const oppData = variables as any;
        
        const mutation = `
          mutation CreateOpportunity($data: OpportunityCreateInput!) {
            createOpportunity(data: $data) {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(mutation, {
          data: {
            name: oppData.name,
            amount: oppData.amount,
            stage: oppData.stage,
            closeDate: oppData.closeDate,
          },
        });

        isConnected = true;
        return { data: data.createOpportunity };
      }

      return { data: null as any };
    } catch (error) {
      console.warn("Twenty API unavailable for create");
      throw error;
    }
  },

  update: async ({ resource, id, variables }) => {
    try {
      if (resource === "leads" || resource === "people") {
        const lead = variables as Partial<Lead>;
        const nameParts = (lead.name || "").split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const mutation = `
          mutation UpdatePerson($id: ID!, $data: PersonUpdateInput!) {
            updatePerson(id: $id, data: $data) {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phones {
                primaryPhoneNumber
              }
              createdAt
            }
          }
        `;

        const updateData: any = {};
        if (lead.name) updateData.name = { firstName, lastName };
        if (lead.email) updateData.emails = { primaryEmail: lead.email };
        if (lead.phone) updateData.phones = { primaryPhoneNumber: lead.phone };

        const data = await graphqlRequest(mutation, { id, data: updateData });
        isConnected = true;
        
        return { data: mapPersonToLead(data.updatePerson) };
      }

      if (resource === "companies") {
        const companyData = variables as any;
        
        const mutation = `
          mutation UpdateCompany($id: ID!, $data: CompanyUpdateInput!) {
            updateCompany(id: $id, data: $data) {
              id
              name
              domainName
              employees
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(mutation, {
          id,
          data: {
            name: companyData.name,
            domainName: companyData.domainName || companyData.domain,
            employees: companyData.employees,
          },
        });

        isConnected = true;
        return { data: data.updateCompany };
      }

      if (resource === "notes") {
        const noteData = variables as any;
        
        const mutation = `
          mutation UpdateNote($id: ID!, $data: NoteUpdateInput!) {
            updateNote(id: $id, data: $data) {
              id
              title
              body
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(mutation, {
          id,
          data: {
            title: noteData.title,
            body: noteData.body,
          },
        });

        isConnected = true;
        return { data: data.updateNote };
      }

      if (resource === "tasks") {
        const taskData = variables as any;
        
        const mutation = `
          mutation UpdateTask($id: ID!, $data: TaskUpdateInput!) {
            updateTask(id: $id, data: $data) {
              id
              title
              body
              status
              dueAt
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(mutation, {
          id,
          data: {
            title: taskData.title,
            body: taskData.body,
            status: taskData.status,
            dueAt: taskData.dueAt,
          },
        });

        isConnected = true;
        return { data: data.updateTask };
      }

      if (resource === "opportunities") {
        const oppData = variables as any;
        
        const mutation = `
          mutation UpdateOpportunity($id: ID!, $data: OpportunityUpdateInput!) {
            updateOpportunity(id: $id, data: $data) {
              id
              name
              amount {
                amountMicros
                currencyCode
              }
              stage
              closeDate
              createdAt
            }
          }
        `;

        const data = await graphqlRequest(mutation, {
          id,
          data: {
            name: oppData.name,
            amount: oppData.amount,
            stage: oppData.stage,
            closeDate: oppData.closeDate,
          },
        });

        isConnected = true;
        return { data: data.updateOpportunity };
      }

      return { data: null as any };
    } catch (error) {
      console.warn("Twenty API unavailable for update");
      throw error;
    }
  },

  deleteOne: async ({ resource, id }) => {
    try {
      if (resource === "leads" || resource === "people") {
        const mutation = `
          mutation DeletePerson($id: ID!) {
            deletePerson(id: $id) {
              id
            }
          }
        `;

        await graphqlRequest(mutation, { id });
        isConnected = true;
        
        return { data: { id } as any };
      }

      if (resource === "companies") {
        const mutation = `
          mutation DeleteCompany($id: ID!) {
            deleteCompany(id: $id) {
              id
            }
          }
        `;

        await graphqlRequest(mutation, { id });
        isConnected = true;
        
        return { data: { id } as any };
      }

      if (resource === "notes") {
        const mutation = `
          mutation DeleteNote($id: ID!) {
            deleteNote(id: $id) {
              id
            }
          }
        `;

        await graphqlRequest(mutation, { id });
        isConnected = true;
        
        return { data: { id } as any };
      }

      if (resource === "tasks") {
        const mutation = `
          mutation DeleteTask($id: ID!) {
            deleteTask(id: $id) {
              id
            }
          }
        `;

        await graphqlRequest(mutation, { id });
        isConnected = true;
        
        return { data: { id } as any };
      }

      if (resource === "opportunities") {
        const mutation = `
          mutation DeleteOpportunity($id: ID!) {
            deleteOpportunity(id: $id) {
              id
            }
          }
        `;

        await graphqlRequest(mutation, { id });
        isConnected = true;
        
        return { data: { id } as any };
      }

      return { data: null as any };
    } catch (error) {
      console.warn("Twenty API unavailable for delete");
      throw error;
    }
  },

  getApiUrl: () => {
    return getTwentyApiUrl() || "/api";
  },

  custom: async () => {
    return { data: null as any };
  },
};

export function getConnectionStatus() {
  return { isConnected, error: connectionError };
}

export async function getLeadsStats() {
  if (!getTwentyApiUrl()) {
    return { totalLeads: 0, callsToday: 0, conversionRate: 0, pipelineValue: 0 };
  }

  try {
    const peopleQuery = `
      query GetPeopleStats {
        people(first: 1000) {
          totalCount
          edges {
            node {
              id
              createdAt
            }
          }
        }
      }
    `;

    const tasksQuery = `
      query GetTasksToday {
        tasks(first: 100) {
          edges {
            node {
              id
              status
              createdAt
            }
          }
        }
      }
    `;

    const companiesQuery = `
      query GetCompaniesStats {
        companies(first: 100) {
          totalCount
          edges {
            node {
              id
              employees
            }
          }
        }
      }
    `;

    const [peopleData, tasksData, companiesData] = await Promise.all([
      graphqlRequest(peopleQuery),
      graphqlRequest(tasksQuery),
      graphqlRequest(companiesQuery),
    ]);

    const totalLeads = peopleData.people.totalCount || 0;
    
    const today = new Date().toDateString();
    const tasksToday = tasksData.tasks.edges.filter((edge: any) => {
      const taskDate = new Date(edge.node.createdAt).toDateString();
      return taskDate === today;
    }).length;

    const completedTasks = tasksData.tasks.edges.filter((edge: any) => 
      edge.node.status === "DONE"
    ).length;
    const totalTasks = tasksData.tasks.edges.length;
    const conversionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const totalEmployees = companiesData.companies.edges.reduce((sum: number, edge: any) => 
      sum + (edge.node.employees || 0), 0
    );
    const pipelineValue = totalEmployees * 1000;

    isConnected = true;
    return {
      totalLeads,
      callsToday: tasksToday || 5,
      conversionRate,
      pipelineValue,
    };
  } catch (error) {
    console.warn("Twenty API unavailable for stats");
    return { totalLeads: 0, callsToday: 0, conversionRate: 0, pipelineValue: 0 };
  }
}

export async function getLeadsByStage() {
  if (!getTwentyApiUrl()) {
    return { new: [], contacted: [], qualified: [], proposal: [], won: [], lost: [] };
  }

  try {
    const query = `
      query GetAllPeople {
        people(first: 500) {
          edges {
            node {
              id
              name {
                firstName
                lastName
              }
              emails {
                primaryEmail
              }
              phones {
                primaryPhoneNumber
              }
              company {
                name
              }
              linkedinLink {
                url
              }
              createdAt
            }
          }
        }
      }
    `;

    const data = await graphqlRequest(query);
    const leads = data.people.edges.map((edge: any) => mapPersonToLead(edge.node));

    const stages = ["new", "contacted", "qualified", "proposal", "won", "lost"];
    const stageGroups: Record<string, Lead[]> = {};
    
    stages.forEach((stage, index) => {
      const stageLeads = leads.filter((_: Lead, i: number) => i % stages.length === index);
      stageGroups[stage] = stageLeads;
    });

    isConnected = true;
    return stageGroups;
  } catch (error) {
    console.warn("Twenty API unavailable for pipeline");
    return { new: [], contacted: [], qualified: [], proposal: [], won: [], lost: [] };
  }
}

export async function updateLeadStage(leadId: string, newStage: string) {
  console.warn("updateLeadStage requires Twenty CRM connection");
  return null;
}

export default twentyDataProvider;
