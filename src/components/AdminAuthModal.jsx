import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, X, KeyRound, AlertCircle } from 'lucide-react';
import { verifyAdminPassword } from '../utils/useAdminAuth';

export default function AdminAuthModal({ isOpen, onClose, onSuccess, initialPrompt }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShaking(false);
      setTimeout(() => inputRef.current?.focus(), 80);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!password.trim()) {
      setError('Please enter a password.');
      triggerShake();
      return;
    }

    const ok = verifyAdminPassword(password);
    if (ok) {
      setError('');
      onSuccess?.();
      onClose();
    } else {
      setError('Incorrect password. Access denied.');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
    inputRef.current?.select();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm select-none">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            x: shaking ? [-10, 10, -8, 8, -4, 4, 0] : 0
          }}
          exit={{ opacity: 0, scale: 0.94, y: 10 }}
          transition={{ duration: shaking ? 0.4 : 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-sm rounded-2xl bg-white/95 dark:bg-[#1e1e24]/95 backdrop-blur-2xl border border-black/10 dark:border-white/15 shadow-2xl p-6 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3.5 right-3.5 w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 shadow-md flex items-center justify-center text-white mb-3 shadow-amber-500/20">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h3 className="text-[16px] font-bold tracking-tight text-slate-900 dark:text-white">
              Admin Access
            </h3>
            <p className="text-[12px] text-slate-500 dark:text-slate-400 mt-1 max-w-[260px] leading-relaxed">
              {initialPrompt || 'Enter administrator password to modify folders, rename items, and upload files.'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-3.5">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Enter password"
                className={`w-full pl-9 pr-9 py-2 rounded-xl text-[13px] bg-black/[0.04] dark:bg-white/[0.07] border ${
                  error
                    ? 'border-red-500/70 focus:ring-red-500/30'
                    : 'border-black/10 dark:border-white/15 focus:border-[#007aff] focus:ring-2 focus:ring-[#007aff]/30'
                } text-slate-900 dark:text-white placeholder:text-slate-400 outline-none transition-all`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium px-1"
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 px-3 rounded-xl text-[12.5px] font-semibold text-slate-700 dark:text-slate-200 bg-black/[0.05] dark:bg-white/[0.08] hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!password.trim()}
                className="flex-1 py-2 px-3 rounded-xl text-[12.5px] font-semibold text-white bg-[#007aff] hover:bg-[#0069dc] disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-blue-500/20 transition-all active:scale-[0.98]"
              >
                Unlock
              </button>
            </div>
          </form>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
