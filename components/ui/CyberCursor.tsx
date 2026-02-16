"use client";
import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue } from 'framer-motion';

export const CyberCursor = () => {
  const [isHovering, setIsHovering] = useState(false);
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 250 };
  const springX = useSpring(cursorX, springConfig);
  const springY = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
    };

    const handleHover = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      setIsHovering(!!target.closest('button, a, input, [role="button"]'));
    };

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseover', handleHover);
    
    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseover', handleHover);
    };
  }, [cursorX, cursorY]);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] hidden md:block">
      {/* Central Point */}
      <motion.div
        className="fixed top-0 left-0 w-1.5 h-1.5 bg-white rounded-full mix-blend-difference"
        style={{ x: cursorX, y: cursorY, translateX: "-50%", translateY: "-50%" }}
      />
      
      {/* Reactive Outer Ring */}
      <motion.div
        className={`fixed top-0 left-0 border rounded-full transition-colors duration-300 ${isHovering ? 'border-cyan-400 w-12 h-12 bg-cyan-400/10' : 'border-cyan-500/30 w-8 h-8'}`}
        style={{ 
          x: springX, 
          y: springY, 
          translateX: "-50%", 
          translateY: "-50%" 
        }}
      />

      {/* Crosshair Lines */}
      <motion.div 
        className="fixed top-0 left-0 w-4 h-[1px] bg-cyan-500/20"
        style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div 
        className="fixed top-0 left-0 h-4 w-[1px] bg-cyan-500/20"
        style={{ x: springX, y: springY, translateX: "-50%", translateY: "-50%" }}
      />
    </div>
  );
};
