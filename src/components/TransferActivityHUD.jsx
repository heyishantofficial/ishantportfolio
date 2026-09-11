import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Check, AlertTriangle, X, CloudOff, Loader2 } from 'lucide-react';

import { useAdminAuth } from '../utils/useAdminAuth';
import {
  subscribeTransfers,
  dismissTransfer,
  clearFinishedTransfers,
  formatTransferBytes
} from '../utils/transferActivity';

/**
 * Admin-only activity panel.
 *
 * Uploads and saves used to happen invisibly, so a failure looked exactly
 * like a success: the file showed up in Finder either way. This puts the
 * network on screen — live per-file progress, and failures that stay put
 * until acknowledged, because a failed save means the change lives only in
 * this browser and will be lost on the next reload.
 *
 * Visitors never see this; it renders only in admin mode.
 */
export default function TransferActivityHUD() {
  const { isAdmin } = useAdminAuth();
  const [state, setState] = useState(null);
  const [saveFlash, setSaveFlash] = useState(false);

  useEffect(() => subscribeTransfers(setState), []);

  // Briefly surface a successful save, so "it saved" is something you see
  // rather than something you assume.
  useEffect(() => {
    if (state?.save?.status !== 'saved') return;
    setSaveFlash(true);
    const t = setTimeout(() => setSaveFlash(false), 3200);
    return () => clearTimeout(t);
  }, [state?.save?.status, state?.save?.lastSavedAt]);

  if (!isAdmin || !state) return null;

  const { active, failed, percent, sentBytes, totalBytes, save } = state;
  const saveFailed = save.status === 'error';
  const saving = save.status === 'saving';

  const hasSomethingToShow = active.length > 0 || failed.length > 0 || saveFailed || saving || saveFlash;
  if (!hasSomethingToShow) return null;

  return (
    <div className="fixed bottom-[86px] right-4 z-[240] w-[320px] max-w-[calc(100vw-32px)] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence initial={false}>

        {/* Save state — the one that matters most, so it sits on top */}
        {(saveFailed || saving || saveFlash) && (
          <motion.div
            key="save-state"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`pointer-events-auto rounded-xl border backdrop-blur-xl shadow-2xl px-3.5 py-3 ${
              saveFailed
                ? 'bg-red-950/85 border-red-400/40'
                : 'bg-black/70 border-white/15'
            }`}
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 shrink-0">
                {saveFailed ? (
                  <CloudOff className="w-4 h-4 text-red-300" />
                ) : saving ? (
                  <Loader2 className="w-4 h-4 text-sky-300 animate-spin" />
                ) : (
                  <Check className="w-4 h-4 text-emerald-300" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className={`text-[12px] font-semibold ${saveFailed ? 'text-red-100' : 'text-white'}`}>
                  {saveFailed ? 'Changes not saved' : saving ? 'Saving changes…' : 'Saved for all visitors'}
                </div>
                <div className={`text-[11px] leading-snug mt-0.5 ${saveFailed ? 'text-red-200/90' : 'text-white/60'}`}>
                  {saveFailed
                    ? save.message || 'This change exists only in this browser.'
                    : saving
                      ? save.payloadBytes
                        ? `Sending ${formatTransferBytes(save.payloadBytes)} to the server`
                        : 'Sending to the server'
                      : save.lastSavedAt
                        ? `at ${new Date(save.lastSavedAt).toLocaleTimeString()}`
                        : ''}
                </div>
                {saveFailed && (
                  <div className="text-[10.5px] text-red-200/70 mt-1.5 leading-snug">
                    Don't reload — reloading replaces it with the server's older copy. Try the change again.
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Live uploads */}
        {active.length > 0 && (
          <motion.div
            key="uploads"
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto rounded-xl border border-white/15 bg-black/70 backdrop-blur-xl shadow-2xl px-3.5 py-3"
          >
            <div className="flex items-center gap-2 mb-2">
              <UploadCloud className="w-4 h-4 text-sky-300 shrink-0" />
              <div className="text-[12px] font-semibold text-white flex-1">
                Uploading {active.length} {active.length === 1 ? 'file' : 'files'}
              </div>
              <div className="text-[11px] font-mono text-white/60 tabular-nums">{percent}%</div>
            </div>

            {/* Aggregate bar, so a multi-file drop reads as one operation */}
            <div className="h-1 rounded-full bg-white/15 overflow-hidden mb-2.5">
              <div
                className="h-full bg-sky-400 rounded-full transition-[width] duration-200 ease-out"
                style={{ width: `${percent}%` }}
              />
            </div>

            <div className="flex flex-col gap-2 max-h-[168px] overflow-y-auto">
              {active.map((t) => (
                <div key={t.id} className="min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[11px] text-white/85 truncate flex-1">{t.name}</span>
                    <span className="text-[10px] font-mono text-white/50 tabular-nums shrink-0">
                      {formatTransferBytes(t.sent)} / {formatTransferBytes(t.size)}
                    </span>
                  </div>
                  <div className="h-[3px] rounded-full bg-white/10 overflow-hidden mt-1">
                    <div
                      className="h-full bg-white/45 rounded-full transition-[width] duration-200 ease-out"
                      style={{ width: `${t.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {totalBytes > 0 && (
              <div className="text-[10px] font-mono text-white/40 mt-2 tabular-nums">
                {formatTransferBytes(sentBytes)} of {formatTransferBytes(totalBytes)}
              </div>
            )}
          </motion.div>
        )}

        {/* Failed uploads persist until dismissed */}
        {failed.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="pointer-events-auto rounded-xl border border-amber-400/40 bg-amber-950/85 backdrop-blur-xl shadow-2xl px-3.5 py-3"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-300 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-[12px] font-semibold text-amber-50 truncate">{t.name}</div>
                <div className="text-[11px] text-amber-200/90 mt-0.5 leading-snug">{t.error}</div>
                <div className="text-[10.5px] text-amber-200/60 mt-1.5 leading-snug">
                  Not on the server — visitors won't see this file.
                </div>
              </div>
              <button
                onClick={() => dismissTransfer(t.id)}
                title="Dismiss"
                className="shrink-0 p-1 -m-1 rounded text-amber-200/60 hover:text-amber-100 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}

      </AnimatePresence>

      {failed.length > 1 && (
        <button
          onClick={clearFinishedTransfers}
          className="pointer-events-auto self-end text-[10.5px] font-medium text-white/50 hover:text-white/80 transition-colors px-1"
        >
          Dismiss all
        </button>
      )}
    </div>
  );
}
