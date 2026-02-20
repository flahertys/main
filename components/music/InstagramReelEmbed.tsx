'use client';

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process?: () => void;
      };
    };
  }
}

interface InstagramReelEmbedProps {
  permalink: string;
  caption?: string;
}

export function InstagramReelEmbed({ permalink, caption }: InstagramReelEmbedProps) {
  useEffect(() => {
    window.instgrm?.Embeds?.process?.();
  }, [permalink]);

  return (
    <div>
      <blockquote
        className="instagram-media"
        data-instgrm-captioned={caption ? 'true' : undefined}
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
      >
        <a href={permalink} target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">
          View this reel on Instagram
        </a>
      </blockquote>

      <Script
        src="https://www.instagram.com/embed.js"
        strategy="lazyOnload"
        onLoad={() => {
          window.instgrm?.Embeds?.process?.();
        }}
      />

      {caption ? <p className="mt-2 text-xs text-cyan-100/70">{caption}</p> : null}

      <p className="mt-2 text-xs text-cyan-200/70">
        If the embed is blocked by browser privacy settings, open directly on{' '}
        <a href={permalink} target="_blank" rel="noopener noreferrer" className="underline text-cyan-300">
          Instagram
        </a>
        .
      </p>
    </div>
  );
}
