import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RefreshCw, AlertCircle, Tv, Download, CheckCircle2, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PlaybackStreamSource, getEpisodeStreams } from '../../services/playbackService';
import { SubDubLanguage } from '../../services/playbackProviderAdapter';
import { DownloadableEpisodeInfo, checkEpisodeDownloadAuthorization, validateAndTriggerDownload } from '../../services/downloadService';
import { useWatchlist } from '../../contexts/WatchlistContext';

interface VideoPlayerProps {
  animeId: number;
  animeTitle: string;
  coverImage: string;
  episodeNumber: number;
  trailerYoutubeId?: string;
  totalEpisodes?: number;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  animeId,
  animeTitle,
  coverImage,
  episodeNumber,
  trailerYoutubeId,
  totalEpisodes = 12,
  onNextEpisode,
  onPrevEpisode,
}) => {
  const { recordProgress, updateAnimeStatus, playbackPref, updatePlaybackPref, autoplayNext, updateAutoplay } = useWatchlist();
  
  const [sources, setSources] = useState<PlaybackStreamSource[]>([]);
  const [activeSource, setActiveSource] = useState<PlaybackStreamSource | null>(null);
  const [currentLang, setCurrentLang] = useState<SubDubLanguage>(playbackPref === 'DUB' ? 'dub' : 'sub');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Download state
  const [downloadInfo, setDownloadInfo] = useState<DownloadableEpisodeInfo | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string>('');
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  // Autoplay countdown state
  const [showCountdown, setShowCountdown] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const countdownTimer = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);
    setShowCountdown(false);
    setDownloadFeedback(null);

    async function loadStreams() {
      try {
        const result = await getEpisodeStreams(animeId, episodeNumber, currentLang, 0);
        if (!isMounted) return;
        setSources(result.sources);

        // Select source matching current language preference
        const matched = result.sources.find((s) => s.subType === currentLang) || result.sources[0];
        setActiveSource(matched || null);
      } catch (err) {
        if (!isMounted) return;
        setHasError(true);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    async function loadDownloadInfo() {
      try {
        const info = await checkEpisodeDownloadAuthorization(animeId, animeTitle, episodeNumber);
        if (isMounted) {
          setDownloadInfo(info);
          if (info.isAvailable && info.qualities && info.qualities.length > 0) {
            const matchedQuality = info.qualities.find((q) => q.language === currentLang) || info.qualities[0];
            setSelectedQualityUrl(matchedQuality.url);
          } else if (info.downloadUrl) {
            setSelectedQualityUrl(info.downloadUrl);
          }
        }
      } catch (err) {
        if (isMounted) {
          setDownloadInfo({
            animeId,
            animeTitle,
            episodeNumber,
            isAvailable: false,
            providerName: 'AniEmbed Streaming Provider',
            isStreamingOnly: true,
            reason: 'STREAMING_ONLY_PROVIDER',
            message: 'Downloads are not available for this episode.',
          });
        }
      }
    }

    loadStreams();
    loadDownloadInfo();

    recordProgress(animeId, animeTitle, coverImage, episodeNumber, 0, 1440);
    updateAnimeStatus(animeId, animeTitle, coverImage, 'WATCHING', episodeNumber, totalEpisodes);

    return () => {
      isMounted = false;
      if (countdownTimer.current) clearInterval(countdownTimer.current);
    };
  }, [animeId, episodeNumber, currentLang]);

  // Handle language switch
  const handleLanguageSwitch = (lang: SubDubLanguage) => {
    setCurrentLang(lang);
    updatePlaybackPref(lang === 'dub' ? 'DUB' : 'SUB');
    const matched = sources.find((s) => s.subType === lang);
    if (matched) {
      setActiveSource(matched);
    }
  };

  const cancelAutoplay = () => {
    if (countdownTimer.current) clearInterval(countdownTimer.current);
    setShowCountdown(false);
  };

  const handleDownloadClick = async () => {
    const urlToUse = selectedQualityUrl || downloadInfo?.downloadUrl;
    if (!urlToUse) return;
    setDownloading(true);
    setDownloadFeedback(null);
    try {
      const res = await validateAndTriggerDownload(urlToUse);
      setDownloadFeedback(res.message);
    } catch (err: any) {
      console.error('Download trigger error:', err);
      setDownloadFeedback(err.message || 'Download failed.');
    } finally {
      setDownloading(false);
    }
  };

  const hasSubSource = sources.some((s) => s.subType === 'sub');
  const hasDubSource = sources.some((s) => s.subType === 'dub');

  return (
    <div className="w-full space-y-6">
      {/* Video Iframe Container */}
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
        {activeSource && !hasError ? (
          <iframe
            key={`${activeSource.providerId}_ep${episodeNumber}_${currentLang}`}
            src={activeSource.embedUrl}
            title={`${animeTitle} - Episode ${episodeNumber} (${currentLang.toUpperCase()})`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            onLoad={() => setIsLoading(false)}
            className="w-full h-full border-0"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-slate-950 text-slate-400">
            <AlertCircle className="w-10 h-10 text-amber-400" />
            <h3 className="text-white font-bold text-base">Streaming Provider Unavailable</h3>
            <p className="text-xs max-w-md">
              {currentLang.toUpperCase()} stream for episode {episodeNumber} is currently unavailable or unconfirmed by the provider.
            </p>
          </div>
        )}

        {/* Autoplay Countdown Overlay */}
        {showCountdown && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-white z-20 animate-fade-in">
            <div className="w-16 h-16 rounded-full border-4 border-violet-500/30 border-t-violet-500 flex items-center justify-center text-xl font-bold font-display">
              {countdown}
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-lg font-bold">Up Next: Episode {episodeNumber + 1}</h4>
              <p className="text-xs text-slate-400">Autoplaying in {countdown} seconds...</p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={cancelAutoplay}
                className="px-5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  cancelAutoplay();
                  if (onNextEpisode) onNextEpisode();
                }}
                className="px-6 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition cursor-pointer"
              >
                Play Now
              </button>
            </div>
          </div>
        )}

        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Control Bar: Sub/Dub Selector, Episode Nav, Autoplay Toggle */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Language Selector (SUB / DUB) & Autoplay Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
            <button
              onClick={() => handleLanguageSwitch('sub')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentLang === 'sub'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SUB
            </button>

            <button
              onClick={() => handleLanguageSwitch('dub')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                currentLang === 'dub'
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              DUB
            </button>
          </div>

          <label className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={autoplayNext}
              onChange={(e) => updateAutoplay(e.target.checked)}
              className="rounded accent-violet-600"
            />
            <span>Autoplay Next</span>
          </label>
        </div>

        {/* Right: Previous & Next Episode controls */}
        <div className="flex items-center gap-3">
          {onPrevEpisode && (
            <button
              onClick={onPrevEpisode}
              disabled={episodeNumber <= 1}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Prev</span>
            </button>
          )}

          <div className="px-3 py-1.5 rounded-xl bg-violet-600/20 border border-violet-500/30 text-violet-300 text-xs font-bold font-display">
            EPISODE {episodeNumber} / {totalEpisodes || '??'}
          </div>

          {onNextEpisode && (
            <button
              onClick={onNextEpisode}
              disabled={totalEpisodes > 0 && episodeNumber >= totalEpisodes}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 hover:bg-violet-500 transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Authorised Episode Download Panel */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800/80 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-violet-400 shrink-0">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-white">Authorised Episode Download</h4>
                {downloadInfo?.isStreamingOnly && (
                  <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-[10px] text-amber-400 font-semibold">
                    Streaming Only Provider (AniEmbed)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {downloadInfo?.isAvailable && downloadInfo.qualities && downloadInfo.qualities.length > 0
                  ? `Authorised direct video files available (${downloadInfo.qualities.length} resolutions).`
                  : downloadInfo?.message || 'Downloads are not available for this episode.'}
              </p>
            </div>
          </div>

          {downloadInfo?.isAvailable && downloadInfo.qualities && downloadInfo.qualities.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
              {/* Quality selector */}
              <div className="flex items-center bg-slate-950 rounded-xl p-1 border border-slate-800">
                {downloadInfo.qualities.map((q) => (
                  <button
                    key={`${q.quality}_${q.url}`}
                    onClick={() => setSelectedQualityUrl(q.url)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      selectedQualityUrl === q.url
                        ? 'bg-violet-600 text-white shadow-md shadow-violet-600/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {q.quality} ({q.fileSize})
                  </button>
                ))}
              </div>

              <button
                onClick={handleDownloadClick}
                disabled={downloading}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition disabled:opacity-50 cursor-pointer shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>{downloading ? 'Verifying...' : 'Download File'}</span>
              </button>
            </div>
          ) : (
            <span className="px-4 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 font-medium self-end sm:self-auto">
              Downloads Unavailable
            </span>
          )}
        </div>

        {/* Feedback message banner */}
        {downloadFeedback && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-violet-400 shrink-0" />
            <span>{downloadFeedback}</span>
          </div>
        )}
      </div>
    </div>
  );
};
