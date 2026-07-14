"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Preloader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const isDashboard = pathname?.startsWith("/dashboard");

  // Trigger loading state on route change
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate a loading delay for the animation to play
    // In a real scenario, this could wait for document.readyState or images to load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [pathname, searchParams]);

  // Handle body scroll locking
  useEffect(() => {
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLoading]);

  return (
    <AnimatePresence mode="wait">
      {isLoading && !isDashboard && (
        <motion.div
          key="preloader"
          initial={{ y: 0 }}
          exit={{ y: "-100%" }}
          transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
          className="fixed inset-0 z-[99999] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Animated Loader Content */}
          <div className="relative flex flex-col items-center z-10">
            {/* Morphing Shape */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: [0.8, 1.2, 0.9, 1],
                rotate: [0, 90, 180, 270, 360],
                borderRadius: ["20%", "50%", "30%", "40%", "20%"]
              }}
              transition={{
                duration: 2.5,
                ease: "easeInOut",
                repeat: Infinity,
                repeatType: "reverse"
              }}
              className="w-20 h-20 border-[3px] border-white/20 bg-white/5 shadow-[0_0_40px_rgba(255,255,255,0.1)] backdrop-blur-xl"
            />
            
            {/* Text reveal */}
            <div className="mt-12 overflow-hidden h-8 relative">
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
                className="font-jakarta text-white font-bold tracking-[0.4em] uppercase text-xs"
              >
                Cooking the Experience
              </motion.div>
            </div>
            
            {/* Progress line */}
            <div className="w-48 h-[1px] bg-white/10 mt-6 relative overflow-hidden">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity }}
                className="absolute inset-0 bg-white/60"
              />
            </div>
          </div>

          {/* Background Ambient Glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [0.1, 0.2, 0.1] 
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-[40vw] h-[40vw] bg-indigo-500/20 blur-[120px] rounded-full mix-blend-screen"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
