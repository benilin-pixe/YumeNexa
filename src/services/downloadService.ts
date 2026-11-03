/**
 * YumeNexa Authorised Download Service
 * Enforces strict provider authorisation, allowlists, and backend validation.
 * Never treats streaming iframe embed URLs (e.g. AniEmbed) as downloadable file URLs.
 */

import { downloadAdapter, DownloadCheckResult, DownloadQualityOption } from './downloadProviderAdapter';

export interface DownloadableEpisodeInfo extends DownloadCheckResult {
  downloadUrl?: string;
  fileFormat?: string;
  fileSize?: string;
  episodeTitle?: string;
}

// Explicit allowlist of authorised provider domains for direct file downloads
export const AUTHORIZED_DOWNLOAD_DOMAINS = [
  'downloads.yumenexa.com',
  'cdn.crunchyroll.com',
  'archive.org',
  'staging.yumenexa.org',
];

/**
 * Check if direct authorised download is available for an episode
 */
export async function checkEpisodeDownloadAuthorization(
  animeId: number,
  animeTitle: string,
  episodeNumber: number
): Promise<DownloadableEpisodeInfo> {
  try {
    // Attempt backend API check first
    const res = await fetch(`/api/download/check?animeId=${animeId}&episode=${episodeNumber}`);
    if (res.ok) {
      const data = await res.json();
      if (data.downloadInfo) {
        return data.downloadInfo;
      }
    }
  } catch (err) {
    console.warn('[DownloadService] Backend API check fallback to client adapter:', err);
  }

  // Fallback to provider adapter verification
  const adapterResult = await downloadAdapter.checkAvailability(animeId, animeTitle, episodeNumber);
  
  const defaultQuality = adapterResult.qualities?.[0];
  return {
    ...adapterResult,
    downloadUrl: defaultQuality?.url,
    fileFormat: defaultQuality?.format,
    fileSize: defaultQuality?.fileSize,
    episodeTitle: defaultQuality ? `Episode ${episodeNumber} (${defaultQuality.quality})` : undefined,
  };
}

/**
 * Validates and triggers an authorised episode file download.
 * Rejects iframe embed URLs and non-allowlisted domains.
 */
export async function validateAndTriggerDownload(downloadUrl: string): Promise<{ success: boolean; message: string }> {
  if (!downloadUrl) {
    return { success: false, message: 'No download URL provided.' };
  }

  // Strict guard: Never attempt to download a streaming iframe URL
  if (downloadAdapter.isIframeStreamUrl(downloadUrl)) {
    console.error('[Download Security Block] Attempted to download streaming iframe embed URL:', downloadUrl);
    return {
      success: false,
      message: 'Streaming iframe URLs cannot be downloaded. Downloads are not available for this episode.',
    };
  }

  try {
    // Send backend validation request
    const res = await fetch('/api/download/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ downloadUrl }),
    });

    const data = await res.json();
    if (!res.ok || !data.allowed) {
      return {
        success: false,
        message: data.error || 'Download domain is not authorised by rights holder.',
      };
    }

    // Trigger secure file download
    const link = document.createElement('a');
    link.href = data.verifiedUrl || downloadUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('download', '');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return { success: true, message: 'Download initiated successfully.' };
  } catch (err: any) {
    console.error('[Download Service Error]:', err);
    return { success: false, message: err.message || 'Failed to initiate download.' };
  }
}
