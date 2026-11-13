import { SearchParams, SearchResponse, SearchResultItem } from './types';

/**
 * 100% Free, zero-API-key Web Search implementation using DuckDuckGo
 */
export class DuckDuckGoSearchProvider {
  public static async search(params: SearchParams): Promise<SearchResponse> {
    const startTime = Date.now();
    const maxResults = params.maxResults || 5;

    try {
      const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(params.query)}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DuckDuckGo returned status ${response.status}`);
      }

      const html = await response.text();
      const results = this.parseResults(html, maxResults);

      return {
        query: params.query,
        results,
        provider: 'duckduckgo',
        executionTimeMs: Date.now() - startTime,
      };
    } catch {
      // In offline environments or sandboxes without outbound network, return graceful structured results
      return {
        query: params.query,
        results: [],
        provider: 'duckduckgo',
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  private static parseResults(html: string, maxResults: number): SearchResultItem[] {
    const results: SearchResultItem[] = [];

    // Match each result block: <div class="result results_links results_links_deep ...">
    const resultRegex = /<a class="result__url"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
    let match: RegExpExecArray | null;

    while ((match = resultRegex.exec(html)) !== null && results.length < maxResults) {
      let rawUrl = match[1];
      const snippet = this.stripHtml(match[3]).trim();

      // DuckDuckGo redirects links via /l/?uddg=<encodedUrl>
      if (rawUrl.includes('uddg=')) {
        const decoded = rawUrl.split('uddg=')[1]?.split('&')[0];
        if (decoded) {
          rawUrl = decodeURIComponent(decoded);
        }
      }

      let domain = 'web';
      try {
        domain = new URL(rawUrl).hostname.replace('www.', '');
      } catch {
        // fallback
      }

      if (rawUrl.startsWith('http') && snippet.length > 10) {
        results.push({
          title: domain.charAt(0).toUpperCase() + domain.slice(1) + ' Updates',
          url: rawUrl,
          snippet,
          sourceDomain: domain,
        });
      }
    }

    // Secondary fallback parser if structure is alternate HTML format
    if (results.length === 0) {
      const altRegex = /<h2 class="result__title">[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
      let altMatch: RegExpExecArray | null;
      while ((altMatch = altRegex.exec(html)) !== null && results.length < maxResults) {
        let rawUrl = altMatch[1];
        const title = this.stripHtml(altMatch[2]).trim();
        const snippet = this.stripHtml(altMatch[3]).trim();

        if (rawUrl.includes('uddg=')) {
          const decoded = rawUrl.split('uddg=')[1]?.split('&')[0];
          if (decoded) rawUrl = decodeURIComponent(decoded);
        }

        let domain = 'web';
        try {
          domain = new URL(rawUrl).hostname.replace('www.', '');
        } catch {
          // fallback
        }

        if (rawUrl.startsWith('http')) {
          results.push({
            title: title || domain,
            url: rawUrl,
            snippet,
            sourceDomain: domain,
          });
        }
      }
    }

    return results;
  }

  private static stripHtml(html: string): string {
    return html
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
  }
}
