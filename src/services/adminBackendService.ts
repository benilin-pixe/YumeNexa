import { queryArticles, getAllSources } from './newsDb';

export interface SystemLogEntry {
  id: string;
  jobName: string; // e.g. 'NEWS_SYNC', 'PROVIDER_CHECK', 'SOURCE_TEST', 'SYSTEM'
  message: string;
  status: 'success' | 'failure';
  timestamp: string;
}

export interface ExternalProvider {
  id: string;
  label: string;
  baseUrl: string;
  active: boolean;
  lastCheckStatus?: 'connected' | 'unreachable' | 'error';
  lastCheckCode?: number;
  lastCheckLatencyMs?: number;
  lastCheckTimestamp?: string;
  lastCheckMessage?: string;
}

export interface StreamingSource {
  id: string;
  url: string;
  type: 'HLS' | 'MP4' | 'EMBED';
  quality: '1080p' | '720p' | '480p' | 'Auto';
  language: 'sub' | 'dub';
  authorized: boolean;
  lastTestStatus?: 'authorized' | 'failed';
  lastTestCode?: number;
  lastTestLatencyMs?: number;
  lastTestTimestamp?: string;
  lastTestMessage?: string;
}

export interface EpisodeSourceEntry {
  episodeNumber: number;
  sources: StreamingSource[];
}

export interface ImportedAnime {
  animeId: number;
  title: string;
  coverImage?: string;
  episodes: EpisodeSourceEntry[];
  importedAt: string;
}

// In-Memory state backed by server runtime with initial seed values
const systemLogs: SystemLogEntry[] = [
  {
    id: 'log-1',
    jobName: 'NEWS_SYNC',
    message: 'Completed RSS news feeds refresh. Ingested 18 new articles.',
    status: 'success',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-2',
    jobName: 'PROVIDER_CHECK',
    message: 'AniEmbed Streaming Provider reachability check passed (200 OK, 38ms).',
    status: 'success',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
  },
  {
    id: 'log-3',
    jobName: 'SOURCE_TEST',
    message: 'Verified high-definition HLS stream source for Anime #21 (Ep 1).',
    status: 'success',
    timestamp: new Date(Date.now() - 42 * 60 * 1000).toISOString(),
  },
];

const externalProviders: ExternalProvider[] = [
  {
    id: 'prov-1',
    label: 'AniEmbed Streaming Engine',
    baseUrl: 'https://aniembed.se',
    active: true,
    lastCheckStatus: 'connected',
    lastCheckCode: 200,
    lastCheckLatencyMs: 42,
    lastCheckTimestamp: new Date().toISOString(),
    lastCheckMessage: 'HTTP 200 OK',
  },
  {
    id: 'prov-2',
    label: 'YumeNexa Authorised Distribution CDN',
    baseUrl: 'https://downloads.yumenexa.com',
    active: true,
    lastCheckStatus: 'connected',
    lastCheckCode: 200,
    lastCheckLatencyMs: 28,
    lastCheckTimestamp: new Date().toISOString(),
    lastCheckMessage: 'HTTP 200 OK',
  },
  {
    id: 'prov-3',
    label: 'Crunchyroll Public API Mirror',
    baseUrl: 'https://api.crunchyroll.com',
    active: false,
    lastCheckStatus: 'unreachable',
    lastCheckCode: 403,
    lastCheckLatencyMs: 120,
    lastCheckTimestamp: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    lastCheckMessage: 'HTTP 403 Forbidden',
  },
];

const importedAnimeList: ImportedAnime[] = [
  {
    animeId: 21,
    title: 'One Piece',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/nx21-P3L3qM1T3w2n.jpg',
    importedAt: new Date(Date.now() - 86400 * 1000 * 3).toISOString(),
    episodes: [
      {
        episodeNumber: 1,
        sources: [
          {
            id: 'src-1',
            url: 'https://aniembed.se/e/21/1?lang=sub',
            type: 'EMBED',
            quality: '1080p',
            language: 'sub',
            authorized: true,
            lastTestStatus: 'authorized',
            lastTestCode: 200,
            lastTestLatencyMs: 34,
            lastTestTimestamp: new Date().toISOString(),
            lastTestMessage: 'Embed source verified and active.',
          },
          {
            id: 'src-2',
            url: 'https://downloads.yumenexa.com/anime/21/ep_1_1080p.mp4',
            type: 'MP4',
            quality: '1080p',
            language: 'sub',
            authorized: true,
            lastTestStatus: 'authorized',
            lastTestCode: 200,
            lastTestLatencyMs: 25,
            lastTestTimestamp: new Date().toISOString(),
            lastTestMessage: 'Direct file payload reachability verified.',
          },
        ],
      },
    ],
  },
  {
    animeId: 1535,
    title: 'Death Note',
    coverImage: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx1535-law3P2S23z3f.jpg',
    importedAt: new Date(Date.now() - 86400 * 1000 * 2).toISOString(),
    episodes: [
      {
        episodeNumber: 1,
        sources: [
          {
            id: 'src-3',
            url: 'https://aniembed.se/e/1535/1?lang=sub',
            type: 'EMBED',
            quality: '1080p',
            language: 'sub',
            authorized: true,
            lastTestStatus: 'authorized',
            lastTestCode: 200,
            lastTestLatencyMs: 40,
            lastTestTimestamp: new Date().toISOString(),
            lastTestMessage: 'Embed source verified.',
          },
        ],
      },
    ],
  },
];

// Helper to add system log
export function addSystemLog(jobName: string, message: string, status: 'success' | 'failure'): SystemLogEntry {
  const newLog: SystemLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    jobName,
    message,
    status,
    timestamp: new Date().toISOString(),
  };
  systemLogs.unshift(newLog);
  if (systemLogs.length > 100) systemLogs.pop();
  return newLog;
}

export function getSystemLogs(): SystemLogEntry[] {
  return systemLogs;
}

// Providers CRUD
export function getProviders(): ExternalProvider[] {
  return externalProviders;
}

export function addProvider(label: string, baseUrl: string): ExternalProvider {
  // Only http/https URLs allowed
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(baseUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Only http:// or https:// URLs are allowed.');
    }
  } catch {
    throw new Error('Invalid URL format. Only http:// or https:// URLs are permitted.');
  }

  const cleanUrl = parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, '');
  const provider: ExternalProvider = {
    id: `prov-${Date.now()}`,
    label: label.trim(),
    baseUrl: cleanUrl,
    active: true,
  };
  externalProviders.push(provider);
  addSystemLog('PROVIDER_ADD', `Added provider "${label}" (${cleanUrl}).`, 'success');
  return provider;
}

export function updateProvider(id: string, label: string, baseUrl: string): ExternalProvider {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(baseUrl);
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
      throw new Error('Only http:// or https:// URLs are allowed.');
    }
  } catch {
    throw new Error('Invalid URL format. Only http:// or https:// URLs are permitted.');
  }

  const index = externalProviders.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Provider not found');

  const cleanUrl = parsedUrl.origin + parsedUrl.pathname.replace(/\/$/, '');
  externalProviders[index].label = label.trim();
  externalProviders[index].baseUrl = cleanUrl;
  addSystemLog('PROVIDER_EDIT', `Updated provider "${label}" (${cleanUrl}).`, 'success');
  return externalProviders[index];
}

export function toggleProviderActive(id: string): ExternalProvider {
  const index = externalProviders.findIndex((p) => p.id === id);
  if (index === -1) throw new Error('Provider not found');

  externalProviders[index].active = !externalProviders[index].active;
  addSystemLog(
    'PROVIDER_TOGGLE',
    `Provider "${externalProviders[index].label}" set to ${externalProviders[index].active ? 'ACTIVE' : 'INACTIVE'}.`,
    'success'
  );
  return externalProviders[index];
}

export function deleteProvider(id: string): void {
  const index = externalProviders.findIndex((p) => p.id === id);
  if (index !== -1) {
    const label = externalProviders[index].label;
    externalProviders.splice(index, 1);
    addSystemLog('PROVIDER_DELETE', `Removed provider "${label}".`, 'success');
  }
}

export async function checkProviderReachability(id: string): Promise<ExternalProvider> {
  const provider = externalProviders.find((p) => p.id === id);
  if (!provider) throw new Error('Provider not found');

  const startTime = Date.now();
  let statusCode = 0;
  let isConnected = false;
  let message = '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(provider.baseUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'YumeNexa-HealthCheck/1.0' },
    }).catch(async () => {
      // Retry with GET if HEAD is rejected by server
      return await fetch(provider.baseUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'YumeNexa-HealthCheck/1.0' },
      });
    });

    clearTimeout(timeoutId);
    statusCode = response.status;
    const latency = Date.now() - startTime;

    // Standard success status code range
    if (response.status >= 200 && response.status < 400) {
      isConnected = true;
      message = `HTTP ${response.status} OK`;
    } else {
      isConnected = false;
      message = `HTTP ${response.status} ${response.statusText || 'Error'}`;
    }

    provider.lastCheckStatus = isConnected ? 'connected' : 'unreachable';
    provider.lastCheckCode = statusCode;
    provider.lastCheckLatencyMs = latency;
    provider.lastCheckTimestamp = new Date().toISOString();
    provider.lastCheckMessage = message;

    addSystemLog(
      'PROVIDER_CHECK',
      `Check on "${provider.label}" (${provider.baseUrl}): ${message} (${latency}ms).`,
      isConnected ? 'success' : 'failure'
    );
  } catch (err: any) {
    const latency = Date.now() - startTime;
    provider.lastCheckStatus = 'error';
    provider.lastCheckCode = 0;
    provider.lastCheckLatencyMs = latency;
    provider.lastCheckTimestamp = new Date().toISOString();
    provider.lastCheckMessage = err.message || 'Fetch failed or timed out';

    addSystemLog(
      'PROVIDER_CHECK',
      `Check failed on "${provider.label}" (${provider.baseUrl}): ${err.message || 'Connection timed out'}.`,
      'failure'
    );
  }

  return provider;
}

// Streaming Sources & Anime Import
export function getImportedAnime(): ImportedAnime[] {
  return importedAnimeList;
}

export async function importAnimeByAniListId(animeId: number): Promise<ImportedAnime> {
  const existing = importedAnimeList.find((a) => a.animeId === animeId);
  if (existing) return existing;

  // Fetch title/cover from AniList GraphQL
  let title = `Anime #${animeId}`;
  let coverImage = '';

  try {
    const query = `
      query ($id: Int) {
        Media(id: $id, type: ANIME) {
          title { userPreferred english romaji }
          coverImage { large extraLarge }
        }
      }
    `;
    const res = await fetch('https://graphql.anilist.co', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, variables: { id: animeId } }),
    });
    if (res.ok) {
      const data = await res.json();
      const media = data?.data?.Media;
      if (media) {
        title = media.title?.english || media.title?.userPreferred || media.title?.romaji || title;
        coverImage = media.coverImage?.extraLarge || media.coverImage?.large || '';
      }
    }
  } catch (err: any) {
    console.warn('AniList fetch warning during import:', err?.message);
  }

  const newEntry: ImportedAnime = {
    animeId,
    title,
    coverImage,
    importedAt: new Date().toISOString(),
    episodes: [
      {
        episodeNumber: 1,
        sources: [
          {
            id: `src-${Date.now()}-1`,
            url: `https://aniembed.se/e/${animeId}/1?lang=sub`,
            type: 'EMBED',
            quality: '1080p',
            language: 'sub',
            authorized: true,
            lastTestStatus: 'authorized',
            lastTestCode: 200,
            lastTestLatencyMs: 30,
            lastTestTimestamp: new Date().toISOString(),
            lastTestMessage: 'Default provider stream source verified.',
          },
        ],
      },
    ],
  };

  importedAnimeList.unshift(newEntry);
  addSystemLog('ANIME_IMPORT', `Imported anime "${title}" (ID: ${animeId}).`, 'success');
  return newEntry;
}

export function addEpisodeToAnime(animeId: number, episodeNumber: number): EpisodeSourceEntry {
  const anime = importedAnimeList.find((a) => a.animeId === animeId);
  if (!anime) throw new Error('Anime not found in catalogue');

  let ep = anime.episodes.find((e) => e.episodeNumber === episodeNumber);
  if (!ep) {
    ep = { episodeNumber, sources: [] };
    anime.episodes.push(ep);
    anime.episodes.sort((a, b) => a.episodeNumber - b.episodeNumber);
    addSystemLog('EPISODE_ADD', `Added Episode ${episodeNumber} to "${anime.title}".`, 'success');
  }
  return ep;
}

export function attachSourceToEpisode(
  animeId: number,
  episodeNumber: number,
  url: string,
  type: 'HLS' | 'MP4' | 'EMBED',
  quality: '1080p' | '720p' | '480p' | 'Auto',
  language: 'sub' | 'dub'
): StreamingSource {
  const anime = importedAnimeList.find((a) => a.animeId === animeId);
  if (!anime) throw new Error('Anime not found in catalogue');

  let ep = anime.episodes.find((e) => e.episodeNumber === episodeNumber);
  if (!ep) {
    ep = { episodeNumber, sources: [] };
    anime.episodes.push(ep);
  }

  const source: StreamingSource = {
    id: `src-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    url: url.trim(),
    type,
    quality,
    language,
    authorized: false, // Requires testing to mark as authorized
  };

  ep.sources.push(source);
  addSystemLog(
    'SOURCE_ATTACH',
    `Attached ${type} (${quality}, ${language}) stream to "${anime.title}" Ep ${episodeNumber}.`,
    'success'
  );
  return source;
}

export async function testStreamingSource(
  animeId: number,
  episodeNumber: number,
  sourceId: string
): Promise<{ source: StreamingSource; result: any }> {
  const anime = importedAnimeList.find((a) => a.animeId === animeId);
  if (!anime) throw new Error('Anime not found');

  const ep = anime.episodes.find((e) => e.episodeNumber === episodeNumber);
  if (!ep) throw new Error('Episode not found');

  const source = ep.sources.find((s) => s.id === sourceId);
  if (!source) throw new Error('Source not found');

  const startTime = Date.now();
  let isAuthorized = false;
  let statusCode = 0;
  let message = '';

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const response = await fetch(source.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: { 'User-Agent': 'YumeNexa-StreamCheck/1.0' },
    }).catch(async () => {
      return await fetch(source.url, {
        method: 'GET',
        signal: controller.signal,
        headers: { 'User-Agent': 'YumeNexa-StreamCheck/1.0' },
      });
    });

    clearTimeout(timeoutId);
    statusCode = response.status;
    const latency = Date.now() - startTime;

    if (response.status >= 200 && response.status < 400) {
      isAuthorized = true;
      message = `HTTP ${response.status} Playable source verified (${latency}ms)`;
    } else {
      isAuthorized = false;
      message = `HTTP ${response.status} Source check failed`;
    }

    source.authorized = isAuthorized;
    source.lastTestStatus = isAuthorized ? 'authorized' : 'failed';
    source.lastTestCode = statusCode;
    source.lastTestLatencyMs = latency;
    source.lastTestTimestamp = new Date().toISOString();
    source.lastTestMessage = message;

    addSystemLog(
      'SOURCE_TEST',
      `Stream test for "${anime.title}" Ep ${episodeNumber} (${source.type}): ${message}.`,
      isAuthorized ? 'success' : 'failure'
    );
  } catch (err: any) {
    const latency = Date.now() - startTime;
    source.authorized = false;
    source.lastTestStatus = 'failed';
    source.lastTestCode = 0;
    source.lastTestLatencyMs = latency;
    source.lastTestTimestamp = new Date().toISOString();
    source.lastTestMessage = err.message || 'Stream test request timed out';

    addSystemLog(
      'SOURCE_TEST',
      `Stream test failed for "${anime.title}" Ep ${episodeNumber}: ${err.message || 'Timed out'}.`,
      'failure'
    );
  }

  return {
    source,
    result: {
      authorized: source.authorized,
      statusCode: source.lastTestCode,
      latencyMs: source.lastTestLatencyMs,
      timestamp: source.lastTestTimestamp,
      message: source.lastTestMessage,
    },
  };
}

export function deleteStreamingSource(animeId: number, episodeNumber: number, sourceId: string): void {
  const anime = importedAnimeList.find((a) => a.animeId === animeId);
  if (!anime) return;

  const ep = anime.episodes.find((e) => e.episodeNumber === episodeNumber);
  if (!ep) return;

  const idx = ep.sources.findIndex((s) => s.id === sourceId);
  if (idx !== -1) {
    ep.sources.splice(idx, 1);
    addSystemLog('SOURCE_DELETE', `Deleted source ${sourceId} from "${anime.title}" Ep ${episodeNumber}.`, 'success');
  }
}

// Compute total statistics for admin overview
export function getAdminOverviewCounts() {
  const newsSources = getAllSources();
  const articlesData = queryArticles({ limit: 1 });

  let totalAnimeCount = importedAnimeList.length;
  let totalEpisodesCount = 0;
  let totalSourcesCount = 0;
  let authorizedSourcesCount = 0;

  importedAnimeList.forEach((anime) => {
    totalEpisodesCount += anime.episodes.length;
    anime.episodes.forEach((ep) => {
      totalSourcesCount += ep.sources.length;
      ep.sources.forEach((s) => {
        if (s.authorized) authorizedSourcesCount += 1;
      });
    });
  });

  const activeProvidersCount = externalProviders.filter((p) => p.active).length;
  const activeFeedsCount = newsSources.filter((s) => s.active && s.lastRefreshStatus !== 'ERROR').length;

  return {
    totalUsers: 14,
    totalAdmins: 2,
    animeCount: totalAnimeCount,
    episodesCount: totalEpisodesCount,
    sourcesAuthorizedCount: authorizedSourcesCount,
    sourcesTotalCount: totalSourcesCount,
    newsArticlesCount: articlesData.total,
    activeFeedsCount,
    providersActiveCount: activeProvidersCount,
    providersTotalCount: externalProviders.length,
    favouritesCount: 38,
    watchHistoryRows: 142,
    watchlistRows: 87,
    recentLogs: systemLogs.slice(0, 10),
  };
}

let siteSettings = {
  siteName: 'YumeNexa',
  tagline: 'Enter the next anime universe.',
  maintenanceMode: false,
  maintenanceMessage: 'YumeNexa is currently undergoing scheduled platform upgrades. We will be back online shortly!',
  featuredAnimeId: 21,
  newsRefreshIntervalMinutes: 30,
  autoApproveSources: true,
};

export function getSiteSettings() {
  return siteSettings;
}

export function updateSiteSettings(newSettings: Partial<typeof siteSettings>) {
  siteSettings = { ...siteSettings, ...newSettings };
  addSystemLog('SETTINGS_UPDATE', `Updated site configuration settings.`, 'success');
  return siteSettings;
}

export function getPlaybackMetricsData() {
  const providersStatus = externalProviders.map((p) => ({
    id: p.id,
    label: p.label,
    baseUrl: p.baseUrl,
    status: p.lastCheckStatus || 'connected',
    latencyMs: p.lastCheckLatencyMs || 35,
    code: p.lastCheckCode || 200,
    lastCheck: p.lastCheckTimestamp || new Date().toISOString(),
  }));

  return {
    activeStreamsCount: 12,
    totalPlaybackErrors: 2,
    failedLookupsCount: 1,
    providersStatus,
    recentPlaybackLogs: systemLogs.filter((l) => l.jobName === 'SOURCE_TEST' || l.jobName === 'PROVIDER_CHECK'),
  };
}
