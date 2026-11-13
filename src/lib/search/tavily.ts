import { SearchParams, SearchResponse, SearchResultItem } from './types';

/**
 * Tavily Search Provider (Used when TAVILY_API_KEY is configured in .env)
 */
export class TavilySearchProvider {
  public static async search(params: SearchParams, apiKey: string): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          api_key: apiKey,
          query: params.query,
          search_depth: 'basic',
          include_answer: false,
          max_results: params.maxResults || 5,
        }),
      });

      if (!response.ok) {
        throw new Error(`Tavily search API error: ${response.statusText}`);
      }

      const data = await response.json();
      const results: SearchResultItem[] = (data.results || []).map(
        (item: { title: string; url: string; content: string; published_date?: string }) => {
          let domain = 'web';
          try {
            domain = new URL(item.url).hostname.replace('www.', '');
          } catch {
            // fallback
          }

          return {
            title: item.title,
            url: item.url,
            snippet: item.content,
            publishedDate: item.published_date,
            sourceDomain: domain,
          };
        }
      );

      return {
        query: params.query,
        results,
        provider: 'tavily',
        executionTimeMs: Date.now() - startTime,
      };
    } catch (err) {
      console.error('Tavily provider failed:', err);
      return {
        query: params.query,
        results: [],
        provider: 'tavily',
        executionTimeMs: Date.now() - startTime,
      };
    }
  }
}
