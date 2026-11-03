import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="flex flex-col rounded-2xl bg-slate-900/40 border border-slate-800/60 overflow-hidden animate-pulse">
      <div className="aspect-[3/4] w-full bg-slate-800/60" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-slate-800 rounded w-3/4" />
        <div className="h-3 bg-slate-800/60 rounded w-1/2" />
        <div className="pt-2 border-t border-slate-800/40 flex justify-between">
          <div className="h-3 bg-slate-800/60 rounded w-1/4" />
          <div className="h-3 bg-slate-800/60 rounded w-1/4" />
        </div>
      </div>
    </div>
  );
};
