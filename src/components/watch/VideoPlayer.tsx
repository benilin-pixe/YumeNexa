import React, { useState, useEffect } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { PlaybackStreamSource, getEpisodeStreams } from '../../services/playbackService';
import { SubDubLanguage } from '../../services/playbackProviderAdapter';
import { useWatchlist } from '../../contexts/WatchlistContext';

interface VideoPlayerProps {
  animeId: number;
  animeTitle: string;
  coverImage: string;
  episodeNumber: number;
  totalEpisodes?: number;
  onNextEpisode?: () => void;
  onPrevEpisode?: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  animeId,
  animeTitle,
  coverImage,
  episodeNumber,
  totalEpisodes = 12,
  onNextEpisode,
  onPrevEpisode,
}) => {
  const { recordProgress, updateAnimeStatus, playbackPref, updatePlaybackPref } = useWatchlist();
  
  const [sources, setSources] = useState<PlaybackStreamSource[]>([]);
  const [activeSource, setActiveSource] = useState<PlaybackStreamSource | null>(null);
  const [currentLang, setCurrentLang] = useState<SubDubLanguage>(playbackPref === 'DUB' ? 'dub' : 'sub');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setHasError(false);

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

    loadStreams();

    recordProgress(animeId, animeTitle, coverImage, episodeNumber, 0, 1440);
    updateAnimeStatus(animeId, animeTitle, coverImage, 'WATCHING', episodeNumber, totalEpisodes);

    return () => {
      isMounted = false;
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

  return (
    <div className="w-full space-y-6">
      {/* Video Iframe Container */}
      <div className="relative aspect-video w-full rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
        {activeSource && !hasError ? (
          <iframe
            key={`${activeSource.providerId}_ep${episodeNumber}_${currentLang}`}
            src={activeSource.embedUrl}
            title={`${animeTitle} - Episode ${episodeNumber} (${currentLang.toUpperCase()})`}
            allow="fullscreen; picture-in-picture"
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

        {/* Loading Spinner */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="w-10 h-10 border-4 border-violet-500/30 border-t-violet-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Control Bar: Sub/Dub Selector, Episode Nav */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left: Language Selector (SUB / DUB) */}
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
    </div>
  );
};
