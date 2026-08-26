import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Sparkles } from 'lucide-react';

export default function ProjectModal({ project, onClose }) {
  return (
    <AnimatePresence>
      {project && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="modal-backdrop" 
          onClick={onClose}
        >
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[90vh] apple-glass-panel rounded-3xl p-6 sm:p-10 shadow-2xl overflow-y-auto text-slate-900 border border-white/60"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 p-2.5 rounded-full bg-slate-100/80 text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 apple-pressable cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Top Info */}
            <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
              // PROJECT DETAIL
            </span>

            <h2 className="font-serif-title italic text-3xl sm:text-5xl text-slate-900 apple-display-heading mb-2">
              {project.title.toLowerCase()}
            </h2>

            <p className="font-mono text-xs font-bold text-slate-600 mb-6">
              {project.tagline}
            </p>

            {/* Video / Sandbox Frame */}
            {project.videoUrl ? (
              <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-900 mb-8 shadow-md">
                <iframe
                  src={project.videoUrl}
                  title={project.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="w-full p-8 rounded-2xl bg-slate-50/80 border border-slate-200/80 mb-8 text-center">
                <Sparkles className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <h4 className="font-sans font-bold text-slate-800 text-sm mb-1">INTERACTIVE PLAYGROUND DEMO</h4>
                <p className="font-mono text-xs text-slate-500">
                  Built using Cursor + AI Vibecoding workflows.
                </p>
              </div>
            )}

            {/* Summary */}
            <div className="mb-8">
              <h3 className="font-mono text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                // OVERVIEW
              </h3>
              <p className="font-sans text-sm text-slate-700 leading-relaxed">
                {project.summary}
              </p>
            </div>

            {/* Metrics & Tags */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <h4 className="font-mono text-[11px] font-bold text-slate-400 uppercase mb-1">IMPACT & METRICS</h4>
                <span className="font-sans text-xs font-bold text-slate-900">{project.metrics}</span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80">
                <h4 className="font-mono text-[11px] font-bold text-slate-400 uppercase mb-1.5">STACK & TAGS</h4>
                <div className="flex flex-wrap gap-1.5">
                  {project.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 rounded bg-slate-200/80 font-mono text-[10px] font-bold text-slate-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200/80">
              <button
                onClick={onClose}
                className="px-5 py-2.5 rounded-full bg-slate-100/90 font-mono text-xs font-bold text-slate-700 hover:bg-slate-200 apple-pressable cursor-pointer"
              >
                CLOSE
              </button>
              
              <a
                href="#"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold hover:bg-slate-800 apple-pressable cursor-pointer shadow-sm"
              >
                <span>LAUNCH APP</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
