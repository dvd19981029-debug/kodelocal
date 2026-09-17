// src/components/blog/ReadingProgressBar.tsx
'use client';

import React, { useEffect, useState } from 'react';

export default function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (totalHeight > 0) {
        const currentScroll = window.scrollY;
        const currentProgress = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
        setProgress(currentProgress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (progress <= 1) return null;

  return (
    <div className="fixed top-0 left-0 w-full h-1.5 z-50 bg-slate-200/50 backdrop-blur-xs pointer-events-none">
      <div 
        className="h-full bg-gradient-to-r from-purple-700 via-indigo-600 to-amber-400 transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}
