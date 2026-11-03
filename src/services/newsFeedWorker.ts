export interface RSSArticle {
    title: string;
    link: string;
    publishedAt: string;
    author: string;
    summary: string;
    imageUrl?: string;
}

export function parseRSS(xml: string): RSSArticle[] {
    const articles: RSSArticle[] = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xml)) !== null) {
        const item = match[1];
        const title = /<title>(.*?)<\/title>/s.exec(item)?.[1] || 'No Title';
        const link = /<link>(.*?)<\/link>/s.exec(item)?.[1] || '';
        const pubDate = /<pubDate>(.*?)<\/pubDate>/s.exec(item)?.[1] || new Date().toISOString();
        const description = /<description>(.*?)<\/description>/s.exec(item)?.[1] || '';
        
        // Regex for image, simplified
        const enclosureMatch = /<enclosure.*?url="(.*?)"/s.exec(item) || /<media:content.*?url="(.*?)"/s.exec(item);
        const imageUrl = enclosureMatch?.[1];

        articles.push({
            title: title.replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1'),
            link,
            publishedAt: new Date(pubDate).toISOString(),
            author: 'Anime News Source',
            summary: description.replace(/<[^>]*>?/gm, '').slice(0, 400),
            imageUrl
        });
    }
    return articles;
}
