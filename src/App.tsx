import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { WatchlistProvider } from './contexts/WatchlistContext';

import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';
import { MobileNav } from './components/common/MobileNav';
import { AnnouncementBanner } from './components/common/AnnouncementBanner';
import { GlobalSearchModal } from './components/common/GlobalSearchModal';
import { AuthModal } from './components/auth/AuthModal';
import { AnimeDetailModal } from './components/anime/AnimeDetailModal';

import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { WatchPage } from './pages/WatchPage';
import { SchedulePage } from './pages/SchedulePage';
import { NewsPage } from './pages/NewsPage';
import { WatchlistPage } from './pages/WatchlistPage';
import { AccountPage } from './pages/AccountPage';
import { AdminPage } from './pages/AdminPage';

import { AnimeMedia } from './types/anime';
import { NewsArticle } from './types/news';
import { updatePageSEO } from './utils/seo';

export function YumeNexaApp() {
  const [activeTab, setActiveTab] = useState<string>('home');

  // Modals & Active Selections
  const [detailAnimeId, setDetailAnimeId] = useState<number | null>(null);
  const [detailAnimeObj, setDetailAnimeObj] = useState<AnimeMedia | null>(null);

  const [watchAnime, setWatchAnime] = useState<AnimeMedia | null>(null);
  const [watchEpisode, setWatchEpisode] = useState<number>(1);

  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);

  // Sync SEO Title according to tab
  useEffect(() => {
    const tabTitles: Record<string, string> = {
      home: 'Enter the Next Anime Universe',
      explore: 'Explore Anime Directory',
      watch: 'Watch Anime & Streaming',
      schedule: 'Live Release Schedule & Countdowns',
      news: 'Anime News Centre',
      watchlist: 'My Personal Library',
      account: 'My Account Settings',
      admin: 'Admin Dashboard',
    };
    updatePageSEO(tabTitles[activeTab] || 'Anime Universe');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);

  const handleSelectAnime = (anime: AnimeMedia) => {
    setDetailAnimeId(anime.id);
    setDetailAnimeObj(anime);
  };

  const handleWatchAnime = (anime: AnimeMedia, ep = 1) => {
    setWatchAnime(anime);
    setWatchEpisode(ep);
    setActiveTab('watch');
  };

  const handleSelectNewsArticle = (article: NewsArticle) => {
    setActiveTab('news');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 dark:bg-slate-950 dark:text-slate-100 light:bg-slate-50 light:text-slate-900 transition-colors duration-200 selection:bg-violet-600 selection:text-white">
      {/* Top System Announcement */}
      <AnnouncementBanner />

      {/* Main Header Navbar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'home' && (
          <HomePage
            onSelectAnime={handleSelectAnime}
            onWatchAnime={handleWatchAnime}
            onNavigateTab={setActiveTab}
          />
        )}

        {activeTab === 'explore' && (
          <ExplorePage onSelectAnime={handleSelectAnime} onWatchAnime={handleWatchAnime} />
        )}

        {activeTab === 'watch' && (
          <WatchPage
            anime={watchAnime}
            initialEpisode={watchEpisode}
            onBackToExplore={() => setActiveTab('explore')}
            onSelectAnime={handleSelectAnime}
          />
        )}

        {activeTab === 'schedule' && (
          <SchedulePage onSelectAnime={handleSelectAnime} onWatchAnime={handleWatchAnime} />
        )}

        {activeTab === 'news' && <NewsPage />}

        {activeTab === 'watchlist' && (
          <WatchlistPage
            onSelectAnime={handleSelectAnime}
            onWatchAnime={handleWatchAnime}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}

        {activeTab === 'account' && <AccountPage />}

        {activeTab === 'admin' && <AdminPage />}
      </main>

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Anime Detail Modal Overlay */}
      {detailAnimeId && (
        <AnimeDetailModal
          animeId={detailAnimeId}
          initialAnime={detailAnimeObj}
          onClose={() => setDetailAnimeId(null)}
          onWatch={(anime, ep) => {
            setDetailAnimeId(null);
            handleWatchAnime(anime, ep);
          }}
          onSelectRelated={(related) => handleSelectAnime(related)}
        />
      )}

      {/* Global Search Modal Overlay */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectAnime={handleSelectAnime}
        onSelectNews={handleSelectNewsArticle}
      />

      {/* User Authentication Modal Overlay */}
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WatchlistProvider>
          <YumeNexaApp />
        </WatchlistProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
