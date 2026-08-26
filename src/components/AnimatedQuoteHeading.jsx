import React from "react";
import { motion } from "framer-motion";

export default function AnimatedQuoteHeading() {
  const quoteText = "I believe the best ideas usually start as weird ones.";
  const words = quoteText.split(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.2
      }
    }
  };

  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: 20,
      filter: "blur(8px)",
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      y: 0,
      filter: "blur(0px)",
      scale: 1,
      transition: {
        type: "spring",
        damping: 18,
        stiffness: 220
      }
    }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="text-center max-w-3xl px-4 mb-4 select-none relative z-10"
    >
      <h1 className="font-serif-title text-2xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] flex flex-wrap justify-center gap-x-2.5 gap-y-1">
        {words.map((word, index) => {
          const isHighlight = word.toLowerCase().includes("weird") || word.toLowerCase().includes("ones");
          return (
            <motion.span
              key={`${word}-${index}`}
              variants={wordVariants}
              className={`inline-block ${
                isHighlight 
                  ? "bg-gradient-to-r from-amber-300 via-amber-200 to-yellow-400 bg-clip-text text-transparent italic drop-shadow-[0_2px_12px_rgba(245,158,11,0.5)]" 
                  : "text-white"
              }`}
            >
              {word}
            </motion.span>
          );
        })}
      </h1>
      <motion.p 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="font-mono text-[10px] sm:text-xs text-amber-200/90 uppercase tracking-[0.25em] font-semibold mt-2.5 drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]"
      >
        — Ishant Chauhan // Creator Manifesto
      </motion.p>
    </motion.div>
  );
}
