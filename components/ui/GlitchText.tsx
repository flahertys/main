"use client";
import React, { useState, useEffect, useCallback } from 'react';

interface GlitchTextProps {
  text: string;
  className?: string;
  speed?: number;
}

const CHARS = "ABCDEFGHIKLMNOPQRSTUVXYZ0123456789<>/-_[]{}*#$@!";

export const GlitchText: React.FC<GlitchTextProps> = ({ text, className = "", speed = 30 }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);

  const scramble = useCallback(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(prev => 
        text.split("")
          .map((char, index) => {
            if (index < iteration) return text[index];
            return CHARS[Math.floor(Math.random() * CHARS.length)];
          })
          .join("")
      );

      if (iteration >= text.length) {
        clearInterval(interval);
      }
      iteration += 1 / 3;
    }, speed);

    return () => clearInterval(interval);
  }, [text, speed]);

  useEffect(() => {
    if (isHovering) {
      scramble();
    } else {
      setDisplayText(text);
    }
  }, [isHovering, text, scramble]);

  return (
    <span 
      className={`inline-block font-mono ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {displayText}
    </span>
  );
};
