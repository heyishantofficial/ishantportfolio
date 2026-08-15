import React from 'react';
import { X, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ProjectModal({ project, onClose }) {
  if (!project) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-3xl p-6 sm:p-10 shadow-2xl overflow-y-auto text-slate-900 border border-slate-200"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Info */}
        <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-widest block mb-2">
          // PROJECT DETAIL
        </span>

        <h2 className="font-serif-title italic text-3xl sm:text-5xl text-slate-900 mb-2">
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
          <div className="w-full p-8 rounded-2xl bg-slate-50 border border-slate-200 mb-8 text-center">
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
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-mono text-[11px] font-bold text-slate-400 uppercase mb-1">IMPACT & METRICS</h4>
            <span className="font-sans text-xs font-bold text-slate-900">{project.metrics}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <h4 className="font-mono text-[11px] font-bold text-slate-400 uppercase mb-1.5">STACK & TAGS</h4>
            <div className="flex flex-wrap gap-1.5">
              {project.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded bg-slate-200 font-mono text-[10px] font-bold text-slate-700">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-full bg-slate-100 font-mono text-xs font-bold text-slate-700 hover:bg-slate-200 transition-colors"
          >
            CLOSE
          </button>
          
          <a
            href="#"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-slate-900 text-white font-mono text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            <span>LAUNCH APP</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

      </div>
    </div>
  );
}
