'use client';

import { useEffect, useRef, useState } from 'react';

interface IntroVideoProps {
  onComplete: () => void;
}

const MOBILE_BREAKPOINT = 768;
const MOBILE_PLAY_DELAY = 100;

export function IntroVideo({ onComplete }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Detect mobile device
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT || /iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Auto-play the video with enhanced mobile support
    if (videoRef.current) {
      const playVideo = async () => {
        try {
          // Add a small delay for mobile devices to ensure video is ready
          if (isMobile) {
            await new Promise(resolve => setTimeout(resolve, MOBILE_PLAY_DELAY));
          }
          await videoRef.current?.play();
        } catch (error) {
          console.error('Video autoplay failed:', error);
          // If autoplay fails, complete immediately
          onComplete();
        }
      };
      
      playVideo();
    }
  }, [onComplete, isMobile]);

  const handleVideoEnd = () => {
    onComplete();
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-full object-contain max-w-full max-h-full"
        onEnded={handleVideoEnd}
        playsInline
        muted
        autoPlay
        preload="auto"
        // @ts-ignore - vendor-specific attributes
        webkitPlaysinline="true"
        // @ts-ignore - vendor-specific attributes
        x5Playsinline="true"
      >
        <source src="/videos/intro-video.mp4" type="video/mp4" />
        Your browser does not support the video tag. Please upgrade your browser to view the intro video.
      </video>
      
      {/* Skip button - responsive sizing */}
      <button
        onClick={handleSkip}
        className="absolute top-4 right-4 sm:top-8 sm:right-8 px-4 py-2 sm:px-6 sm:py-3 bg-gray-900/80 hover:bg-gray-800/90 active:bg-gray-700/90 text-white rounded-lg backdrop-blur-sm transition-all border border-gray-700 hover:border-gray-600 text-xs sm:text-sm font-medium touch-manipulation"
        aria-label="Skip intro video"
      >
        Skip Intro →
      </button>
    </div>
  );
}
