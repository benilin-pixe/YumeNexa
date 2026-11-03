/**
 * Secondary enrichment pass for articles missing images or video IDs.
 * Rules enforced:
 * - Only fetch from the publication's own HTTPS origin
 * - Follow up to 3 redirects
 * - Cap page size at ~2MB
 * - 10s fetch timeout
 * - Extract og:image / twitter:image
 * - Extract first embedded YouTube video ID
 * - Never store article HTML
 */

export interface EnrichmentResult {
  imageUrl?: string;
  videoId?: string;
}

const MAX_PAGE_BYTES = 2 * 1024 * 1024; // 2MB cap
const FETCH_TIMEOUT_MS = 10000; // 10s timeout

/**
 * Validates that the article link is HTTPS and belongs to the allowed publication origin
 */
export function isAllowedOrigin(articleUrl: string, allowedSourceUrl?: string): boolean {
  try {
    const articleParsed = new URL(articleUrl);
    if (articleParsed.protocol !== 'https:') return false;

    if (!allowedSourceUrl) return true;

    const sourceParsed = new URL(allowedSourceUrl);
    const articleHost = articleParsed.hostname.toLowerCase();
    const sourceHost = sourceParsed.hostname.toLowerCase();

    // Direct match or subdomain match (e.g., news.crunchyroll.com vs crunchyroll.com)
    return articleHost === sourceHost || articleHost.endsWith('.' + sourceHost) || sourceHost.endsWith('.' + articleHost);
  } catch {
    return false;
  }
}

/**
 * Extract YouTube video ID from HTML string
 */
export function extractYouTubeId(html: string): string | undefined {
  if (!html) return undefined;

  // Patterns for embeds, iframes, standard links
  const patterns = [
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]{11})/i,
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/i,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/i,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(html);
    if (match && match[1]) {
      return match[1];
    }
  }

  return undefined;
}

/**
 * Extract og:image or twitter:image from HTML string
 */
export function extractMetaImage(html: string, articleUrl: string): string | undefined {
  if (!html) return undefined;

  // 1. og:image
  const ogMatch = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(html) ||
                  /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i.exec(html);
  if (ogMatch && ogMatch[1]) {
    return resolveUrl(ogMatch[1].trim(), articleUrl);
  }

  // 2. twitter:image
  const twitterMatch = /<meta[^>]+(?:name|property)=["']twitter:image["'][^>]+content=["']([^"']+)["']/i.exec(html) ||
                       /<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']twitter:image["']/i.exec(html);
  if (twitterMatch && twitterMatch[1]) {
    return resolveUrl(twitterMatch[1].trim(), articleUrl);
  }

  // 3. featured image tag (common in WordPress anime sites)
  const wpImgMatch = /<img[^>]+class=["'][^"']*(?:wp-post-image|featured-image)[^"']*["'][^>]+src=["']([^"']+)["']/i.exec(html);
  if (wpImgMatch && wpImgMatch[1]) {
    return resolveUrl(wpImgMatch[1].trim(), articleUrl);
  }

  return undefined;
}

function resolveUrl(relativeOrAbsolute: string, base: string): string {
  try {
    return new URL(relativeOrAbsolute, base).toString();
  } catch {
    return relativeOrAbsolute;
  }
}

/**
 * Enrich single article by fetching its own page within strict boundaries
 */
export async function enrichArticlePage(
  articleUrl: string,
  sourceUrl?: string
): Promise<EnrichmentResult> {
  if (!isAllowedOrigin(articleUrl, sourceUrl)) {
    return {};
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(articleUrl, {
      signal: controller.signal,
      redirect: 'follow', // Follow up to redirects
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; YumeNexaNewsBot/1.0; +https://yumenexa.tv)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {};
    }

    // Verify content length header if present
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_PAGE_BYTES) {
      return {};
    }

    // Read response capped at MAX_PAGE_BYTES
    let html = '';
    if (response.body) {
      const reader = response.body.getReader();
      let bytesRead = 0;
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytesRead += value.length;
        html += decoder.decode(value, { stream: true });

        // Cap at 2MB
        if (bytesRead >= MAX_PAGE_BYTES) {
          reader.cancel();
          break;
        }

        // Optimization: if we already found both og:image and youtube embed in <head> or upper body, we can stop reading
        if (html.includes('</head>') && html.length > 50000 && html.includes('og:image')) {
          const hasYt = /(?:youtube\.com|youtu\.be)/i.test(html);
          if (hasYt) {
            reader.cancel();
            break;
          }
        }
      }
    } else {
      html = await response.text();
    }

    const imageUrl = extractMetaImage(html, articleUrl);
    const videoId = extractYouTubeId(html);

    return {
      imageUrl,
      videoId,
    };
  } catch (err: any) {
    clearTimeout(timeoutId);
    // Ignore fetch errors during enrichment, return empty object
    return {};
  }
}
