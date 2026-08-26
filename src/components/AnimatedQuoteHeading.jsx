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
        staggerChildren: 0.1,
        delayChildren: 0.15
      }
    }
  };

  const wordVariants = {
    hidden: { 
      opacity: 0, 
      y: 18,
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
      className="text-center max-w-7xl w-full px-2 mb-3 select-none relative z-10 flex justify-center"
    >
      <h1 className="font-serif-title text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-[2.65rem] font-extrabold text-white tracking-tight leading-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.85)] flex flex-nowrap whitespace-nowrap justify-center gap-x-1.5 sm:gap-x-2.5">
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
    </motion.div>
  );
}
