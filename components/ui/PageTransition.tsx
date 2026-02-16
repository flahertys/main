"use client";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Kinetic Glitch Overlay during transition */}
        <motion.div 
          initial={{ height: "0%" }}
          animate={{ height: ["0%", "100%", "0%"] }}
          transition={{ duration: 0.6, times: [0, 0.5, 1], ease: "easeInOut" }}
          className="fixed inset-x-0 top-0 bg-cyan-500/10 z-[100] pointer-events-none border-b border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)]"
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
