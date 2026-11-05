import React, { useEffect, useState } from 'react';
import { Info, AlertTriangle, CheckCircle, X } from 'lucide-react';
import { SystemAnnouncement } from '../../types/user';
import { subscribeToActiveAnnouncements } from '../../services/firestoreService';

export const AnnouncementBanner: React.FC = () => {
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [dismissed, setDismissed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsubscribe = subscribeToActiveAnnouncements((data) => {
      setAnnouncements(data);
    });
    return () => unsubscribe();
  }, []);

  const activeBanner = announcements.find((a) => !dismissed[a.id]);
  if (!activeBanner) return null;

  const iconMap = {
    info: <Info className="w-4 h-4 text-violet-400 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    success: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
  };

  return (
    <div className="bg-violet-950/80 border-b border-violet-800/40 text-violet-100 text-xs sm:text-sm py-2 px-4 flex items-center justify-between backdrop-blur-md z-40">
      <div className="flex items-center gap-2 max-w-4xl mx-auto text-center sm:text-left">
        {iconMap[activeBanner.type]}
        <span className="font-semibold text-violet-200">{activeBanner.title}:</span>
        <span>{activeBanner.content}</span>
      </div>
      <button
        onClick={() => setDismissed((prev) => ({ ...prev, [activeBanner.id]: true }))}
        className="p-1 hover:bg-violet-900/60 rounded text-violet-300 hover:text-white transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
