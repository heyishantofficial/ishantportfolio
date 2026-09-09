import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  BarChart3, 
  ExternalLink, 
  RefreshCw, 
  Monitor, 
  Smartphone, 
  Clock, 
  Folder, 
  Globe, 
  Music, 
  Gamepad2, 
  FileText, 
  Sliders, 
  Image, 
  Sparkles, 
  Eye, 
  Mail, 
  FileDown, 
  Share2, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle,
  Video
} from 'lucide-react';
import { fetchAnalyticsSummary, resetAnalyticsData, localSessionMetrics } from '../lib/posthog';
import { playMacClick } from '../utils/macAudioEngine';

export default function AnalyticsDashboard({ isMuted, adminPassword }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState(null);
  const [resetError, setResetError] = useState(null);

  // Live session timer
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - localSessionMetrics.sessionStartTime) / 1000);
      setSessionSeconds(elapsed);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    const summary = await fetchAnalyticsSummary();
    if (summary) {
      setData(summary);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds while the modal tab is open
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs}s`;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all visitor analytics counters? This cannot be undone.')) {
      return;
    }
    setIsResetting(true);
    setResetNotice(null);
    setResetError(null);

    const res = await resetAnalyticsData(adminPassword);
    if (res.ok) {
      setResetNotice('Analytics counters have been reset.');
      await loadData();
    } else {
      setResetError(res.error || 'Failed to reset analytics. Check admin password.');
    }
    setIsResetting(false);
  };

  const totalVisits = data?.totalVisits || 0;
  const macVisits = data?.platforms?.macos || 0;
  const iosVisits = data?.platforms?.ios || 0;
  const macPercent = totalVisits > 0 ? Math.round((macVisits / totalVisits) * 100) : 100;
  const iosPercent = totalVisits > 0 ? Math.round((iosVisits / totalVisits) * 100) : 0;

  // Aggregate app launches
  const appLaunchStats = [
    { id: 'finder', name: 'Finder / Files', icon: Folder, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'safari', name: 'Safari Browser', icon: Globe, color: 'text-sky-500 bg-sky-500/10' },
    { id: 'notes', name: 'Notes Workspace', icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'ipod', name: 'iTunes / Music', icon: Music, color: 'text-rose-500 bg-rose-500/10' },
    { id: 'arcade', name: 'Retro Arcade', icon: Gamepad2, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'settings', name: 'System Settings', icon: Sliders, color: 'text-slate-500 bg-slate-500/10' },
    { id: 'photos', name: 'Photos App', icon: Image, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'mail', name: 'Mail / Contact', icon: Mail, color: 'text-indigo-500 bg-indigo-500/10' }
  ].map(app => {
    const count = (data?.appsLaunched?.[app.id] || 0) + (localSessionMetrics.appsLaunchedInSession[app.id] || 0);
    return { ...app, count };
  }).sort((a, b) => b.count - a.count);

  const totalAppLaunches = appLaunchStats.reduce((sum, a) => sum + a.count, 0);

  const conversions = data?.conversions || { resumeViews: 0, emailCopies: 0, socialClicks: {} };
  const totalConversions = (conversions.resumeViews || 0) + (conversions.emailCopies || 0) + 
    Object.values(conversions.socialClicks || {}).reduce((s, c) => s + c, 0);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-black/10 dark:border-white/10">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span>Visitor Analytics & Replay Dashboard</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time engagement telemetry, app launch metrics, and PostHog session recordings.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => { playMacClick(isMuted); loadData(); }}
            disabled={loading}
            className="px-2.5 py-1.5 rounded-xl bg-white/40 dark:bg-white/10 hover:bg-white/60 dark:hover:bg-white/20 border border-black/10 dark:border-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh analytics data"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-500 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <a
            href="https://us.i.posthog.com"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => playMacClick(isMuted)}
            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
          >
            <span>PostHog Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {resetNotice && (
        <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2 shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{resetNotice}</span>
        </div>
      )}

      {resetError && (
        <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-800 dark:text-rose-200 text-xs flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <span>{resetError}</span>
        </div>
      )}

      {/* PostHog Live Status Hero Card */}
      <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-blue-500/10 dark:from-indigo-500/20 dark:via-purple-500/15 dark:to-blue-500/20 border border-indigo-500/30 dark:border-indigo-500/40 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                PostHog US Cloud Connected
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 text-[10px] font-bold">
                <Video className="w-3 h-3" />
                Session Replays Active
              </span>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" />
                Input Masking ON
              </span>
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Capturing Visitor Sessions & OS Interactions
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Project API Key: <code className="px-1.5 py-0.5 rounded bg-black/10 dark:bg-white/10 font-mono text-[11px]">phc_matwft...bxqw</code> • Sensitive password fields are never recorded.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://us.i.posthog.com/recordings"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto justify-center px-3 py-2 rounded-xl bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20 border border-black/10 dark:border-white/15 text-slate-800 dark:text-slate-100 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Video className="w-3.5 h-3.5 text-indigo-500" />
              <span>Watch Replays</span>
            </a>
          </div>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Total Hits */}
        <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Total Visits</span>
            <Eye className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalVisits}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
              <span>{macPercent}% Mac</span>
              <span>•</span>
              <span>{iosPercent}% Mobile</span>
            </div>
          </div>
        </div>

        {/* Current Session Duration */}
        <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Current Session</span>
            <Clock className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatDuration(sessionSeconds)}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Active tab duration
            </div>
          </div>
        </div>

        {/* App Launches */}
        <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">App Launches</span>
            <BarChart3 className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalAppLaunches}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Dock & icon clicks
            </div>
          </div>
        </div>

        {/* Conversion Intent */}
        <div className="p-3.5 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-[11px] font-semibold uppercase tracking-wider">Conversions</span>
            <Sparkles className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalConversions}
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
              Resume & contact actions
            </div>
          </div>
        </div>
      </div>

      {/* Main Breakdown: Apps Launched & Recruiter Intent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Dock App Popularity */}
        <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
              <span>Dock & App Launch Breakdown</span>
            </h4>
            <span className="text-[10px] text-slate-400 font-semibold">{totalAppLaunches} total</span>
          </div>

          <div className="space-y-2.5 pt-1">
            {appLaunchStats.map(app => {
              const Icon = app.icon;
              const pct = totalAppLaunches > 0 ? Math.round((app.count / totalAppLaunches) * 100) : 0;
              return (
                <div key={app.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-200">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center ${app.color}`}>
                        <Icon className="w-3 h-3" />
                      </div>
                      <span>{app.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 text-[11px]">{pct}%</span>
                      <span className="font-bold font-mono text-slate-900 dark:text-white text-xs">{app.count}</span>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                      style={{ width: `${Math.max(app.count > 0 ? 4 : 0, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recruiter Conversion & Device Metrics */}
        <div className="space-y-4">
          {/* Conversion Actions */}
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>High-Value Recruiter Actions</span>
            </h4>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-medium">Resume Views</span>
                  <FileDown className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
                  {conversions.resumeViews || 0}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-medium">Email Copied</span>
                  <Mail className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="text-xl font-bold mt-1 text-slate-900 dark:text-white">
                  {conversions.emailCopies || 0}
                </div>
              </div>
            </div>

            {/* Social Network Outbound Clicks */}
            <div className="pt-2 border-t border-black/5 dark:border-white/5 space-y-1.5">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Share2 className="w-3 h-3" />
                <span>Social Links Clicked</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {['youtube', 'linkedin', 'instagram', 'github', 'twitter'].map(net => (
                  <div key={net} className="px-2.5 py-1.5 rounded-lg bg-black/5 dark:bg-white/5 flex items-center justify-between">
                    <span className="capitalize text-slate-600 dark:text-slate-400 text-[11px]">{net}</span>
                    <span className="font-bold text-slate-900 dark:text-white text-xs">
                      {conversions.socialClicks?.[net] || 0}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Platform Distribution */}
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5 text-sky-500" />
              <span>Platform OS Distribution</span>
            </h4>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Monitor className="w-3.5 h-3.5 text-blue-500 shrink-0" /> macOS Desktop Experience
                </span>
                <span className="font-bold font-mono">{macVisits} ({macPercent}%)</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Smartphone className="w-3.5 h-3.5 text-indigo-500 shrink-0" /> iOS Mobile Experience
                </span>
                <span className="font-bold font-mono">{iosVisits} ({iosPercent}%)</span>
              </div>

              <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[11px]">
                <span className="text-slate-500 dark:text-slate-400">Current Device:</span>
                <span className="font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  {typeof window !== 'undefined' && window.innerWidth < 768 ? '📱 iOS Mobile View' : '💻 macOS Desktop View'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Activity Stream (Recent Events) */}
      <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-indigo-500" />
            <span>Recent Activity Stream (Live)</span>
          </h4>
          <span className="text-[10px] text-slate-400">
            Last {data?.recentEvents?.length || 0} events
          </span>
        </div>

        {(!data?.recentEvents || data.recentEvents.length === 0) ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No activity events recorded yet. Click on apps or projects to generate telemetry.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
            {data.recentEvents.slice(0, 15).map((ev, idx) => {
              const timeStr = ev.time ? new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '';
              return (
                <div key={idx} className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] text-xs gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    <span className="font-mono text-[10px] sm:text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase shrink-0">
                      {ev.event?.replace('_', ' ')}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 truncate text-[11px] sm:text-xs">
                      {ev.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-500 uppercase font-mono">
                      {ev.platform}
                    </span>
                    <span className="text-[9px] sm:text-[10px] text-slate-400 font-mono">
                      {timeStr}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Admin Reset Footer */}
      <div className="pt-3 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
        <span>Analytics stored locally in <code className="text-[11px] font-mono">data/analytics.json</code> & synced to PostHog.</span>
        <button
          onClick={handleReset}
          disabled={isResetting}
          className="self-start sm:self-auto px-2.5 py-1 rounded-lg text-rose-500 hover:bg-rose-500/10 active:scale-95 transition-all text-xs font-semibold flex items-center gap-1 cursor-pointer disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
          <span>Reset Counters</span>
        </button>
      </div>
    </div>
  );
}
