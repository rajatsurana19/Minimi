export interface SearchParams {
  query: string;
  maxResults?: number;
  recencyDays?: number; // e.g., 7 for last week, 30 for last month
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  publishedDate?: string;
  sourceDomain: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResultItem[];
  provider: 'tavily' | 'duckduckgo' | 'simulation';
  executionTimeMs: number;
}
