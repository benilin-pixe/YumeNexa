/**
 * Pure string processing RSS and Atom feed parser.
 * Designed to run on edge / worker / Node runtimes with zero DOMParser or heavy dependencies.
 */

export interface ParsedFeedItem {
  id: string;
  title: string;
  link: string;
  excerpt: string;
  publishedAt: string;
  author: string;
  imageUrl?: string;
  videoId?: string;
  category: 'News' | 'Announcements' | 'Movies' | 'Releases';
}

/**
 * Decode common XML and HTML entities from plain text
 */
export function decodeXmlEntities(text: string): string {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&hellip;/g, '…')
    .replace(/&#8216;/g, '‘')
    .replace(/&#8217;/g, '’')
    .replace(/&#8220;/g, '“')
    .replace(/&#8221;/g, '”')
    .replace(/&#8211;/g, '–')
    .replace(/&#8212;/g, '—')
    .replace(/&#([0-9]+);/g, (_, code) => {
      try {
        return String.fromCharCode(parseInt(code, 10));
      } catch {
        return '';
      }
    });
}

/**
 * Strip CDATA blocks, HTML tags, and normalize whitespace
 */
export function cleanExcerpt(raw: string, maxLength = 400): string {
  if (!raw) return '';
  // Unwrap CDATA
  let cleaned = raw.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  // Remove scripts and styles
  cleaned = cleaned.replace(/<script[\s\S]*?<\/script>/gi, '');
  cleaned = cleaned.replace(/<style[\s\S]*?<\/style>/gi, '');
  // Remove all HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  // Decode entities
  cleaned = decodeXmlEntities(cleaned);
  // Collapse whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  // Truncate to max characters without breaking words awkwardly
  if (cleaned.length > maxLength) {
    const sub = cleaned.slice(0, maxLength);
    const lastSpace = sub.lastIndexOf(' ');
    if (lastSpace > maxLength * 0.7) {
      cleaned = sub.slice(0, lastSpace) + '…';
    } else {
      cleaned = sub + '…';
    }
  }
  return cleaned;
}

/**
 * Extract clean string value from XML tag, handling CDATA
 */
export function extractTagValue(xmlBlock: string, tagName: string): string {
  // Regex handles attributes in tag, e.g. <title type="text">
  const regex = new RegExp(`<${tagName}(?:\\s+[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = regex.exec(xmlBlock);
  if (!match) return '';
  let content = match[1];
  // Unwrap CDATA
  content = content.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1');
  return decodeXmlEntities(content.trim());
}

/**
 * Automatic category assignment based on keywords in headline and excerpt
 * film/movie/theatrical -> Movies
 * announces/reveals/confirmed/new season -> Announcements
 * release date/premieres/streaming/blu-ray -> Releases
 * everything else -> News
 */
export function assignNewsCategory(title: string, excerpt: string): 'Movies' | 'Announcements' | 'Releases' | 'News' {
  const combined = `${title} ${excerpt}`.toLowerCase();

  // 1. Movies check
  if (/\b(film|films|movie|movies|theatrical|cinema|box office|cinemas)\b/i.test(combined)) {
    return 'Movies';
  }

  // 2. Announcements check
  if (/\b(announces|announced|announcement|announcements|reveals|revealed|confirmed|confirm|new season|teaser|unveils|unveiled|greenlit|slated)\b/i.test(combined)) {
    return 'Announcements';
  }

  // 3. Releases check
  if (/\b(release date|premieres|premiere|streaming|blu-ray|bluray|broadcast|debut|debuts|schedule|drops on|hits theaters)\b/i.test(combined)) {
    return 'Releases';
  }

  // 4. Default to News
  return 'News';
}

/**
 * Normalize article link for reliable deduplication
 */
export function normalizeArticleUrl(url: string): string {
  if (!url) return '';
  try {
    const parsed = new URL(url.trim());
    // Strip common tracking query params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
    for (const p of trackingParams) {
      parsed.searchParams.delete(p);
    }
    // Remove hash
    parsed.hash = '';
    let result = parsed.toString();
    // Normalize trailing slash if only at root or path
    if (result.endsWith('/') && parsed.pathname.length > 1) {
      result = result.slice(0, -1);
    }
    return result;
  } catch {
    return url.trim().replace(/[?#].*$/, '').replace(/\/$/, '');
  }
}

/**
 * Generate a safe unique ID from canonical link URL
 */
export function generateArticleId(normalizedUrl: string): string {
  let hash = 0;
  for (let i = 0; i < normalizedUrl.length; i++) {
    hash = ((hash << 5) - hash) + normalizedUrl.charCodeAt(i);
    hash |= 0;
  }
  const safeStr = normalizedUrl.replace(/[^a-zA-Z0-9]/g, '').slice(-16);
  return `art_${Math.abs(hash).toString(36)}_${safeStr}`;
}

/**
 * Extract image URL from feed item if available
 */
export function extractFeedImage(xmlItem: string): string | undefined {
  // 1. media:thumbnail
  const thumbMatch = /<media:thumbnail[^>]+url=["']([^"']+)["']/i.exec(xmlItem);
  if (thumbMatch && isValidImageUrl(thumbMatch[1])) {
    return thumbMatch[1];
  }

  // 2. media:content (prefer images)
  const mediaMatches = xmlItem.matchAll(/<media:content[^>]+url=["']([^"']+)["'][^>]*>/gi);
  for (const match of mediaMatches) {
    const fullTag = match[0];
    const url = match[1];
    if (isValidImageUrl(url) || fullTag.includes('image/')) {
      return url;
    }
  }

  // 3. enclosure with image type
  const enclosureMatch = /<enclosure[^>]+url=["']([^"']+)["'][^>]*>/i.exec(xmlItem);
  if (enclosureMatch) {
    const fullTag = enclosureMatch[0];
    const url = enclosureMatch[1];
    if (fullTag.includes('image/') || isValidImageUrl(url)) {
      return url;
    }
  }

  // 4. image from description or content:encoded
  const imgMatch = /<img[^>]+src=["'](https?:\/\/[^"']+\.(?:png|jpe?g|webp|gif)[^"']*)["']/i.exec(xmlItem);
  if (imgMatch && !imgMatch[1].includes('feedburner') && !imgMatch[1].includes('analytics')) {
    return imgMatch[1];
  }

  return undefined;
}

function isValidImageUrl(url: string): boolean {
  if (!url || !url.startsWith('http')) return false;
  // Exclude tracker pixels and 1x1 gifs
  if (url.includes('1x1') || url.includes('tracker') || url.includes('beacon')) return false;
  return /\.(?:png|jpe?g|webp|gif|avif)(?:\?.*)?$/i.test(url) || url.includes('/wp-content/') || url.includes('/uploads/') || url.includes('storyblok.com') || url.includes('animecorner.me');
}

/**
 * Main feed parsing function supporting RSS 2.0 (<item>) and Atom (<entry>)
 */
export function parseFeedXml(xml: string): ParsedFeedItem[] {
  if (!xml || typeof xml !== 'string') return [];

  const items: ParsedFeedItem[] = [];
  const seenUrls = new Set<string>();

  // Determine if RSS (<item>) or Atom (<entry>)
  const isAtom = /<entry[\s>]/i.test(xml);
  const tag = isAtom ? 'entry' : 'item';
  const itemRegex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'gi');

  let match: RegExpExecArray | null;
  while ((match = itemRegex.exec(xml)) !== null) {
    const itemXml = match[1];

    // 1. Headline
    const title = extractTagValue(itemXml, 'title') || 'Untitled Anime Article';

    // 2. Link
    let rawLink = '';
    if (isAtom) {
      const linkMatch = /<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i.exec(itemXml) ||
                        /<link[^>]+href=["']([^"']+)["']/i.exec(itemXml);
      rawLink = linkMatch ? linkMatch[1] : '';
    } else {
      rawLink = extractTagValue(itemXml, 'link');
      if (!rawLink || !rawLink.startsWith('http')) {
        const guidMatch = /<guid[^>]*isPermaLink=["']true["'][^>]*>([^<]+)<\/guid>/i.exec(itemXml) ||
                          /<guid[^>]*>([^<]+)<\/guid>/i.exec(itemXml);
        if (guidMatch && guidMatch[1].startsWith('http')) {
          rawLink = guidMatch[1];
        }
      }
    }

    if (!rawLink || !rawLink.startsWith('http')) continue;
    const normalizedLink = normalizeArticleUrl(rawLink);
    if (seenUrls.has(normalizedLink)) continue;
    seenUrls.add(normalizedLink);

    // 3. Excerpt (max 400 chars, no full article text)
    const rawDesc = extractTagValue(itemXml, 'description') ||
                    extractTagValue(itemXml, 'summary') ||
                    extractTagValue(itemXml, 'content:encoded') ||
                    extractTagValue(itemXml, 'content');
    const excerpt = cleanExcerpt(rawDesc, 400) || title;

    // 4. Publication date
    const rawDate = extractTagValue(itemXml, 'pubDate') ||
                    extractTagValue(itemXml, 'dc:date') ||
                    extractTagValue(itemXml, 'updated') ||
                    extractTagValue(itemXml, 'published');
    let publishedAt: string;
    try {
      const parsed = new Date(rawDate);
      publishedAt = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
    } catch {
      publishedAt = new Date().toISOString();
    }

    // 5. Author
    const author = extractTagValue(itemXml, 'dc:creator') ||
                   extractTagValue(itemXml, 'author') ||
                   'Editorial Staff';

    // 6. Direct Image in feed
    const imageUrl = extractFeedImage(itemXml);

    // 7. Video ID in feed if any
    const videoMatch = /(?:youtube\.com\/(?:embed\/|watch\?v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i.exec(itemXml);
    const videoId = videoMatch ? videoMatch[1] : undefined;

    // 8. Automatic category
    const category = assignNewsCategory(title, excerpt);

    items.push({
      id: generateArticleId(normalizedLink),
      title,
      link: normalizedLink,
      excerpt,
      publishedAt,
      author: author.replace(/<[^>]+>/g, '').trim(),
      imageUrl,
      videoId,
      category,
    });
  }

  return items;
}

import Parser from 'rss-parser';

const rssParser = new Parser({
  customFields: {
    item: [
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:content', 'mediaContent'],
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'dcCreator'],
    ],
  },
});

/**
 * Robust RSS parser using official 'rss-parser' package with string parser fallback
 */
export async function parseFeedWithRssParser(xml: string): Promise<ParsedFeedItem[]> {
  try {
    const feed = await rssParser.parseString(xml);
    const items: ParsedFeedItem[] = [];
    const seenUrls = new Set<string>();

    for (const item of feed.items || []) {
      const rawLink = item.link || item.guid || '';
      if (!rawLink || !rawLink.startsWith('http')) continue;

      const normalizedLink = normalizeArticleUrl(rawLink);
      if (seenUrls.has(normalizedLink)) continue;
      seenUrls.add(normalizedLink);

      const title = item.title?.trim() || 'Untitled Anime Article';
      const rawDesc = item['contentEncoded'] || item.content || item.summary || item.contentSnippet || item.title || '';
      const excerpt = cleanExcerpt(rawDesc, 400);

      const rawDate = item.pubDate || item.isoDate || new Date().toISOString();
      let publishedAt: string;
      try {
        const parsed = new Date(rawDate);
        publishedAt = isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
      } catch {
        publishedAt = new Date().toISOString();
      }

      const author = item['dcCreator'] || item.creator || 'Editorial Staff';
      let imageUrl: string | undefined;

      if (item['mediaThumbnail'] && item['mediaThumbnail'].$ && item['mediaThumbnail'].$.url) {
        imageUrl = item['mediaThumbnail'].$.url;
      } else if (item['mediaContent'] && item['mediaContent'].$ && item['mediaContent'].$.url) {
        imageUrl = item['mediaContent'].$.url;
      } else if (item.enclosure && item.enclosure.url && item.enclosure.type?.includes('image')) {
        imageUrl = item.enclosure.url;
      }

      items.push({
        id: generateArticleId(normalizedLink),
        title,
        link: normalizedLink,
        excerpt,
        publishedAt,
        author: String(author).replace(/<[^>]+>/g, '').trim(),
        imageUrl,
        category: assignNewsCategory(title, excerpt),
      });
    }

    if (items.length > 0) return items;
  } catch (parserErr) {
    console.warn('[RSS Parser Warning] Falling back to custom string parser:', parserErr);
  }

  return parseFeedXml(xml);
}

