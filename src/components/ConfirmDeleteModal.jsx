import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, AlertTriangle } from 'lucide-react';
import { DESKTOP_ORDER } from '../data/ishantOS';

export default function ConfirmDeleteModal({ isOpen, target, onConfirm, onClose }) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Focus Cancel by default for safety against accidental Enter presses
    setTimeout(() => {
      cancelBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, onClose]);

  if (!isOpen || !target) return null;

  const isCoreSystemFolder = DESKTOP_ORDER.includes(target.id);
  const isFolder = target.kind === 'folder';

  return (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm select-none"
      onClick={onClose}
    >
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 12 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-[360px] rounded-2xl bg-white/95 dark:bg-[#1e1e24]/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl p-6 overflow-hidden text-center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top macOS Trash Icon */}
          <div className="flex justify-center mb-4">
            <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-b from-red-500/10 to-red-500/20 dark:from-red-500/20 dark:to-red-500/30 flex items-center justify-center border border-red-500/20 shadow-inner">
              <img
                src="/icons/Bin.png"
                alt="Trash"
                className="w-10 h-10 object-contain drop-shadow-sm"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling;
                  if (fallback) fallback.classList.remove('hidden');
                }}
              />
              <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400 hidden stroke-[2.2]" />
            </div>
          </div>

          {/* Dialog Title */}
          <h3 className="text-[16px] font-bold text-slate-900 dark:text-white tracking-tight leading-snug break-words px-2">
            Delete &ldquo;{target.name}&rdquo;?
          </h3>

          {/* Description & Warnings */}
          <div className="mt-2 text-[12.5px] text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">
            {isCoreSystemFolder ? (
              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 text-left text-amber-700 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span className="text-[11.5px] leading-tight">
                  <strong>Warning:</strong> &ldquo;{target.name}&rdquo; is a core portfolio section. Deleting it will remove it from the desktop and Finder.
                </span>
              </div>
            ) : (
              <p>
                {isFolder
                  ? 'This folder and all its contents will be moved to the Trash.'
                  : 'This item will be moved to the Trash.'}
              </p>
            )}
            <p className="text-[11.5px] text-slate-400 dark:text-slate-500">
              You can&rsquo;t undo this action.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex items-center justify-end gap-2.5">
            <button
              ref={cancelBtnRef}
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-3 rounded-xl text-[13px] font-medium text-slate-700 dark:text-slate-200 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 transition-colors active:scale-95"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-2 px-3 rounded-xl text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 active:scale-95 shadow-md shadow-red-600/25 flex items-center justify-center gap-1.5 transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
