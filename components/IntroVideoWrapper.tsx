'use client';

import { useState, useEffect } from 'react';
import { IntroVideo } from './IntroVideo';

export function IntroVideoWrapper({ children }: { children: React.ReactNode }) {
  const [showIntro, setShowIntro] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client-side flag
    setIsClient(true);
    
    // Check if intro has been shown in this session
    try {
      // Check if we're in a browser environment
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const introShown = sessionStorage.getItem('introVideoShown');
        if (!introShown) {
          setShowIntro(true);
        }
      }
    } catch {
      // If sessionStorage is not available, skip intro
      console.warn('SessionStorage unavailable, skipping intro');
    }
  }, []);

  const handleIntroComplete = () => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem('introVideoShown', 'true');
      }
    } catch {
      // If sessionStorage is not available, continue anyway
      console.warn('Unable to save intro state to sessionStorage');
    }
    setShowIntro(false);
  };

  // Don't render intro until client-side - show loading to prevent layout shift
  if (!isClient) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black" aria-hidden="true" />
    );
  }

  if (showIntro) {
    return <IntroVideo onComplete={handleIntroComplete} />;
  }

  return <>{children}</>;
}
