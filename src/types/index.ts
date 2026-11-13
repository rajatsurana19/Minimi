export type Role = 'user' | 'assistant' | 'system';

export interface SearchSource {
  id: string;
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  domain?: string;
}

export type StepType = 
  | 'temporal'
  | 'memory_recall'
  | 'query_decomposition'
  | 'web_search'
  | 'fact_verification'
  | 'synthesis';

export interface AgentStep {
  id: string;
  type: StepType;
  title: string;
  description?: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  query?: string;
  timestamp: string;
  resultsCount?: number;
  metadata?: Record<string, unknown>;
}

export interface VerificationItem {
  entity: string;
  historicalClaim: string;
  currentFinding: string;
  status: 'unchanged' | 'changed' | 'new_feature' | 'unverified';
  details: string;
  sources: { title: string; url: string }[];
}

export interface VerificationDelta {
  subject: string;
  historicalDate?: string;
  items: VerificationItem[];
  summary: string;
}

export interface Message {
  id: string;
  sessionId: string;
  role: Role;
  content: string;
  createdAt: string; // ISO string
  steps?: AgentStep[];
  sources?: SearchSource[];
  verificationDelta?: VerificationDelta;
  entities?: string[];
}

export interface Session {
  id: string;
  title: string;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  messageCount?: number;
}

export interface StreamEvent {
  type: 'step_start' | 'step_update' | 'step_finish' | 'token' | 'sources' | 'delta' | 'done' | 'error';
  data: unknown;
}
