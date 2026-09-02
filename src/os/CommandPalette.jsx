import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { CornerDownLeft } from 'lucide-react';
import NodeIcon from './NodeIcon';
import { findNode, searchNodes } from '../data/ishantOS';

// The recruiter's path: the five things someone evaluating Ishant actually
// needs, reachable without exploring a single folder.
const QUICK_ACCESS = ['experience', 'work', 'ai-lab', 'resume', 'contact'];

/**
 * Cmd + K. Opens on Quick Access, becomes a search as soon as you type.
 */
export default function CommandPalette({ onClose, onOpenNode }) {
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const listRef = useRef(null);
  const reduceMotion = useReducedMotion();

  const results = useMemo(() => {
    if (!query.trim()) return QUICK_ACCESS.map(findNode).filter(Boolean);
    return searchNodes(query).slice(0, 12);
  }, [query]);

  useEffect(() => { setIndex(0); }, [query]);

  // Keep the highlighted row in view when arrowing past the fold.
  useEffect(() => {
    listRef.current?.querySelector('[data-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index]);

  const choose = (node) => {
    if (!node) return;
    onOpenNode(node);
    onClose();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      choose(results[index]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[99991] bg-black/30 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
      onClick={onClose}
      role="presentation"
    >
      <motion.div
        initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: reduceMotion ? 0.1 : 0.16, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Quick access"
        className="w-full max-w-lg rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-black/10 dark:border-white/10">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What do you want to open?"
            aria-label="What do you want to open?"
            className="w-full bg-transparent outline-none text-[15px] font-medium text-slate-900 dark:text-slate-50 placeholder:text-slate-400"
          />
        </div>

        <div ref={listRef} className="max-h-80 overflow-y-auto p-2">
          <div className="px-2 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-slate-400">
            {query.trim() ? `${results.length} result${results.length === 1 ? '' : 's'}` : 'Quick Access'}
          </div>

          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] text-slate-400">
              Nothing matches &ldquo;{query}&rdquo;.
            </p>
          ) : (
            results.map((node, i) => (
              <button
                key={node.id}
                data-selected={i === index}
                onMouseEnter={() => setIndex(i)}
                onClick={() => choose(node)}
                className={`w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                  i === index ? 'bg-[var(--os-accent)] text-white' : 'hover:bg-black/5 dark:hover:bg-white/10'
                }`}
              >
                <NodeIcon node={node} size={26} />
                <span className="min-w-0 flex-1">
                  <span className={`block text-[12px] font-bold truncate ${i === index ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                    {node.name}
                  </span>
                  {node.description && (
                    <span className={`block text-[10px] truncate ${i === index ? 'text-white/80' : 'text-slate-500'}`}>
                      {node.description}
                    </span>
                  )}
                </span>
                {i === index && <CornerDownLeft className="w-3.5 h-3.5 shrink-0 opacity-80" />}
              </button>
            ))
          )}
        </div>

        <div className="px-4 py-2 border-t border-black/10 dark:border-white/10 flex items-center gap-4 text-[10px] text-slate-400">
          <span>↑ ↓ navigate</span>
          <span>↵ open</span>
          <span>esc close</span>
        </div>
      </motion.div>
    </div>
  );
}
