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

export async function checkEpisodeDownloadAuthorization(
  animeId: number,
  animeTitle: string,
  episodeNumber: number,
  signal?: AbortSignal
): Promise<DownloadableEpisodeInfo> {
  try {
    const res = await fetch(`/api/download/check?animeId=${animeId}&episode=${episodeNumber}`, { signal });
    if (res.ok) {
      const data = await res.json();
      if (data && data.downloadInfo) {
        return data.downloadInfo;
      }
    } else {
      console.warn(`[DownloadService] Backend API check returned status ${res.status}`);
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw err;
    }
    console.warn('[DownloadService] Backend API check unavailable:', err?.message || err);
  }

  // Security Fail-Closed:
  // If backend check fails or is unreachable, DO NOT fall back to client adapter url generation.
  // Return explicit unavailable status.
  return {
    animeId,
    animeTitle,
    episodeNumber,
    isAvailable: false,
    providerName: 'AniEmbed Streaming Provider',
    isStreamingOnly: true,
    reason: 'STREAMING_ONLY_PROVIDER',
    message: 'Downloads are not available for this episode.',
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

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.error || `Download validation failed with status ${res.status}.`,
      };
    }

    const data = await res.json();
    if (!data.allowed) {
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
