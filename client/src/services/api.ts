const API_BASE = "/api";

export async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.message || `Request failed with status ${res.status}`);
  }
  const json = await res.json();
  if (json && typeof json === "object" && "data" in json && json.data !== undefined) {
    return json.data as T;
  }
  return json as T;
}

// Challenges
export const getChallenges = (params?: Record<string, string>) => {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return fetchApi<any[]>(`/challenges${qs}`);
};

export const getChallengeById = (id: number | string) => {
  return fetchApi<any>(`/challenges/${id}`);
};

export const createChallenge = (data: any) => {
  return fetchApi<any>("/challenges", {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const assignChallenge = (id: number | string, data: { universityId: number; note?: string }) => {
  return fetchApi<any>(`/challenges/${id}/assign`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const upvoteChallenge = (id: number | string) => {
  return fetchApi<any>(`/challenges/${id}/upvote`, {
    method: "POST",
  });
};

// Projects
export const getProjects = (params?: Record<string, string>) => {
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  return fetchApi<any[]>(`/projects${qs}`);
};

export const getProjectById = (id: number | string) => {
  return fetchApi<any>(`/projects/${id}`);
};

export const updateProjectStage = (id: number | string, data: { stage: string; note?: string; responsibleParty?: string }) => {
  return fetchApi<any>(`/projects/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

export const draftAIProposal = (id: number | string) => {
  return fetchApi<any>(`/projects/${id}/proposal/draft`, {
    method: "POST",
  });
};

export const saveProposal = (id: number | string, data: any) => {
  return fetchApi<any>(`/projects/${id}/proposal`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

export const addMilestone = (id: number | string, data: { title: string; dueDate?: string }) => {
  return fetchApi<any>(`/projects/${id}/milestones`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const toggleMilestone = (projectId: number | string, milestoneId: number | string, done: boolean) => {
  return fetchApi<any>(`/projects/${projectId}/milestones/${milestoneId}`, {
    method: "PATCH",
    body: JSON.stringify({ done }),
  });
};

export const postProjectMessage = (id: number | string, data: { author: string; role: string; body: string }) => {
  return fetchApi<any>(`/projects/${id}/messages`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const addCollaboration = (id: number | string, data: { industryPartnerId: number; supportType: string; note: string }) => {
  return fetchApi<any>(`/projects/${id}/collaborations`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

export const recordProjectImpact = (id: number | string, data: any) => {
  return fetchApi<any>(`/projects/${id}/impact`, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

// Universities
export const getUniversities = () => {
  return fetchApi<any[]>("/universities");
};

export const getUniversityById = (id: number | string) => {
  return fetchApi<any>(`/universities/${id}`);
};

// Industry
export const getIndustryPartners = () => {
  return fetchApi<any[]>("/industry");
};

// Dashboard
export const getDashboardMetrics = () => {
  return fetchApi<any>("/dashboard");
};

// Knowledge Base
export const getKnowledgeBase = (params?: { q?: string; category?: string; type?: string }) => {
  const qs = params ? `?${new URLSearchParams(params as any).toString()}` : "";
  return fetchApi<any[]>(`/knowledge${qs}`);
};

// Mentor Chat
export const askMentorCopilot = (data: { question: string; context?: string }) => {
  return fetchApi<{ answer: string; sources: any[] }>("/mentor/chat", {
    method: "POST",
    body: JSON.stringify(data),
  });
};
