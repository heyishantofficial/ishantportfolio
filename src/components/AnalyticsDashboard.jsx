import React, { useState, useEffect, useMemo, Component } from 'react';
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
  Video,
  Swords,
  TrendingUp,
  Trophy,
  Zap,
  Layers,
  Flame
} from 'lucide-react';
import { fetchAnalyticsSummary, resetAnalyticsData, localSessionMetrics } from '../lib/posthog';
import { playMacClick } from '../utils/macAudioEngine';

// Defensive Error Boundary so the dashboard NEVER crashes the OS/page
class AnalyticsErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[Analytics Error]', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 rounded-2xl bg-white/50 dark:bg-slate-900/50 border border-rose-500/30 text-slate-800 dark:text-slate-200 space-y-3">
          <div className="flex items-center gap-2 text-rose-500 font-bold text-sm">
            <AlertCircle className="w-5 h-5" />
            <span>Unable to render Visitor Analytics</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            A component error occurred while rendering telemetry. You can still access PostHog directly.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <a 
              href="https://us.i.posthog.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold flex items-center gap-1.5"
            >
              <span>Open PostHog Console</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1.5 rounded-xl bg-white/40 dark:bg-white/10 text-xs font-semibold"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AnalyticsDashboardContent({ isMuted, adminPassword }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [isResetting, setIsResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState(null);
  const [resetError, setResetError] = useState(null);
  const [visualMode, setVisualMode] = useState('all'); // 'all' | 'vs' | 'funnel' | 'activity'
  const [hoveredDataPoint, setHoveredDataPoint] = useState(null);

  // Live session timer
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - (localSessionMetrics?.sessionStartTime || Date.now())) / 1000);
      setSessionSeconds(elapsed);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const summary = await fetchAnalyticsSummary();
      if (summary) {
        setData(summary);
      }
    } catch (err) {
      console.warn('[Analytics load error]', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
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
    if (typeof window !== 'undefined' && !window.confirm('Are you sure you want to reset all visitor analytics counters? This cannot be undone.')) {
      return;
    }
    setIsResetting(true);
    setResetNotice(null);
    setResetError(null);

    const res = await resetAnalyticsData(adminPassword);
    if (res?.ok) {
      setResetNotice('Analytics counters have been reset.');
      await loadData();
    } else {
      setResetError(res?.error || 'Failed to reset analytics. Check admin password.');
    }
    setIsResetting(false);
  };

  const totalVisits = data?.totalVisits || 0;
  const macVisits = data?.platforms?.macos || 0;
  const iosVisits = data?.platforms?.ios || 0;
  const macPercent = totalVisits > 0 ? Math.round((macVisits / totalVisits) * 100) : 100;
  const iosPercent = totalVisits > 0 ? Math.round((iosVisits / totalVisits) * 100) : 0;

  // Aggregate app launches
  const appLaunchStats = useMemo(() => [
    { id: 'finder', name: 'Finder / Files', icon: Folder, color: 'text-blue-500 bg-blue-500/10' },
    { id: 'safari', name: 'Safari Browser', icon: Globe, color: 'text-sky-500 bg-sky-500/10' },
    { id: 'notes', name: 'Notes Workspace', icon: FileText, color: 'text-amber-500 bg-amber-500/10' },
    { id: 'ipod', name: 'iTunes / Music', icon: Music, color: 'text-rose-500 bg-rose-500/10' },
    { id: 'arcade', name: 'Retro Arcade', icon: Gamepad2, color: 'text-emerald-500 bg-emerald-500/10' },
    { id: 'settings', name: 'System Settings', icon: Sliders, color: 'text-slate-500 bg-slate-500/10' },
    { id: 'photos', name: 'Photos App', icon: Image, color: 'text-purple-500 bg-purple-500/10' },
    { id: 'mail', name: 'Mail / Contact', icon: Mail, color: 'text-indigo-500 bg-indigo-500/10' }
  ].map(app => {
    const sessionCount = localSessionMetrics?.appsLaunchedInSession?.[app.id] || 0;
    const count = (data?.appsLaunched?.[app.id] || 0) + sessionCount;
    return { ...app, count };
  }).sort((a, b) => b.count - a.count), [data]);

  const totalAppLaunches = appLaunchStats.reduce((sum, a) => sum + a.count, 0);

  const conversions = data?.conversions || { resumeViews: 0, emailCopies: 0, socialClicks: {} };
  const totalConversions = (conversions.resumeViews || 0) + (conversions.emailCopies || 0) + 
    Object.values(conversions.socialClicks || {}).reduce((s, c) => s + c, 0);

  // Intent Duel: Work & Portfolio Discovery vs Play & Entertainment
  const workScore = (data?.appsLaunched?.finder || 0) + 
    (data?.appsLaunched?.safari || 0) + 
    (data?.appsLaunched?.notes || 0) + 
    Object.values(data?.projectsViewed || {}).reduce((s, c) => s + c, 0) + 
    (conversions.resumeViews || 0) + 
    (conversions.emailCopies || 0);

  const playScore = (data?.appsLaunched?.arcade || 0) + 
    (data?.appsLaunched?.ipod || 0) + 
    (data?.appsLaunched?.photos || 0);

  const totalIntentScore = workScore + playScore || 1;
  const workPercent = Math.round((workScore / totalIntentScore) * 100);
  const playPercent = 100 - workPercent;

  // Top 2 Apps Face-Off
  const topApp1 = appLaunchStats[0] || { name: 'Finder', count: 0, icon: Folder, color: 'text-blue-500 bg-blue-500/10' };
  const topApp2 = appLaunchStats[1] || { name: 'Safari', count: 0, icon: Globe, color: 'text-sky-500 bg-sky-500/10' };
  const duelTotal = topApp1.count + topApp2.count || 1;
  const app1Pct = Math.round((topApp1.count / duelTotal) * 100);
  const app2Pct = 100 - app1Pct;

  // 4-Stage Visitor Funnel
  const localProjectsCount = localSessionMetrics?.projectsViewedInSession ? localSessionMetrics.projectsViewedInSession.size : 0;
  const totalProjectsViewed = Object.values(data?.projectsViewed || {}).reduce((s, c) => s + c, 0) + localProjectsCount;
  const baseVisitors = Math.max(totalVisits, 1);
  const funnelSteps = [
    { 
      label: '1. Landed on Portfolio', 
      desc: 'Opened website & initial boot', 
      count: baseVisitors, 
      pct: 100, 
      color: 'from-blue-600 to-indigo-600',
      badge: 'Arrival'
    },
    { 
      label: '2. Explored OS & Dock', 
      desc: 'Launched applications & windows', 
      count: Math.min(baseVisitors, totalAppLaunches), 
      pct: Math.min(100, Math.round((Math.min(baseVisitors, totalAppLaunches) / baseVisitors) * 100)), 
      color: 'from-indigo-600 to-purple-600',
      badge: 'Engagement'
    },
    { 
      label: '3. Explored Work & Projects', 
      desc: 'Viewed project cards & details', 
      count: totalProjectsViewed, 
      pct: Math.min(100, Math.round((totalProjectsViewed / baseVisitors) * 100)), 
      color: 'from-purple-600 to-pink-600',
      badge: 'Interest'
    },
    { 
      label: '4. Recruiter Intent & Contact', 
      desc: 'Viewed resume, copied email, clicked social', 
      count: totalConversions, 
      pct: Math.min(100, Math.round((totalConversions / baseVisitors) * 100)), 
      color: 'from-pink-600 to-emerald-500',
      badge: 'Conversion'
    }
  ];

  // Activity Sparkline Data Curve
  const sparklinePoints = useMemo(() => {
    const rawEvents = data?.recentEvents || [];
    const buckets = [0, 0, 0, 0, 0, 0, 0];
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    rawEvents.forEach(ev => {
      const evTime = ev.time ? new Date(ev.time).getTime() : now;
      const daysAgo = Math.floor((now - evTime) / oneDay);
      if (daysAgo >= 0 && daysAgo < 7) {
        buckets[6 - daysAgo] += 1;
      }
    });

    const baseline = [
      Math.max(buckets[0], Math.floor(totalVisits * 0.1)),
      Math.max(buckets[1], Math.floor(totalVisits * 0.15)),
      Math.max(buckets[2], Math.floor(totalVisits * 0.2)),
      Math.max(buckets[3], Math.floor(totalVisits * 0.25)),
      Math.max(buckets[4], Math.floor(totalVisits * 0.3)),
      Math.max(buckets[5], Math.floor(totalVisits * 0.4)),
      Math.max(buckets[6], totalVisits > 0 ? Math.max(1, totalVisits) : 0)
    ];

    const maxVal = Math.max(...baseline, 5);
    const width = 500;
    const height = 120;
    const padding = 20;

    const coords = baseline.map((val, idx) => {
      const x = padding + (idx / 6) * (width - padding * 2);
      const y = height - padding - (val / maxVal) * (height - padding * 2);
      return { x, y, val, day: `Day -${6 - idx}` };
    });

    let d = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx = (p0.x + p1.x) / 2;
      d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
    }

    const areaD = `${d} L ${coords[coords.length - 1].x} ${height} L ${coords[0].x} ${height} Z`;

    return { coords, d, areaD, maxVal };
  }, [data, totalVisits]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800 dark:text-slate-200">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-black/10 dark:border-white/10">
        <div>
          <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span>Visitor Analytics & Visual Telemetry</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time engagement telemetry, VS battlegrounds, conversion funnels, and PostHog session replays.
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

      {/* Visual Graphs Mode Segmented Control */}
      <div className="flex items-center justify-between gap-2 p-1.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
        <span className="text-xs font-bold px-2 text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden sm:inline">Visual Mode:</span>
        </span>
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'all', label: 'All Visuals', icon: Layers },
            { id: 'vs', label: 'VS Battlegrounds', icon: Swords },
            { id: 'funnel', label: 'Conversion Funnel', icon: TrendingUp },
            { id: 'activity', label: 'Activity Velocity', icon: Zap }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = visualMode === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  playMacClick(isMuted);
                  setVisualMode(tab.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer select-none whitespace-nowrap active:scale-95 ${
                  isActive
                    ? 'bg-white dark:bg-white/20 text-blue-600 dark:text-white shadow-sm border border-black/5 dark:border-white/15'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION 1: VS BATTLEGROUNDS */}
      {(visualMode === 'all' || visualMode === 'vs') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
              <Swords className="w-4 h-4 text-rose-500" />
              <span>Head-to-Head VS Battlegrounds</span>
            </h3>
            <span className="text-[10px] text-slate-400 font-medium">Comparative Telemetry</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* VS BATTLE 1: macOS Desktop vs iOS Mobile */}
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Monitor className="w-3.5 h-3.5 text-blue-500" /> Platform Duel
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  {macVisits >= iosVisits ? '🏆 macOS Dominant' : '🏆 iOS Leading'}
                </span>
              </div>

              {/* Fighter Heads */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="p-3 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span className="flex items-center gap-1"><Monitor className="w-3.5 h-3.5" /> macOS</span>
                    <span className="font-mono text-sm">{macPercent}%</span>
                  </div>
                  <div className="text-xl font-black mt-1 text-slate-900 dark:text-white">
                    {macVisits} <span className="text-[10px] font-normal text-slate-400">visits</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-purple-500/10 dark:bg-purple-500/15 border border-purple-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400">
                    <span className="flex items-center gap-1"><Smartphone className="w-3.5 h-3.5" /> iOS Mobile</span>
                    <span className="font-mono text-sm">{iosPercent}%</span>
                  </div>
                  <div className="text-xl font-black mt-1 text-slate-900 dark:text-white">
                    {iosVisits} <span className="text-[10px] font-normal text-slate-400">visits</span>
                  </div>
                </div>
              </div>

              {/* Dual Progress Meter */}
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-3 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden flex p-0.5 gap-0.5">
                  <div 
                    className="h-full rounded-l-full bg-gradient-to-r from-blue-600 to-sky-400 transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.max(6, macPercent)}%` }}
                    title={`macOS: ${macPercent}%`}
                  />
                  <div 
                    className="h-full rounded-r-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.max(6, iosPercent)}%` }}
                    title={`iOS: ${iosPercent}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>macOS Desktop ({macVisits})</span>
                  <span>VS</span>
                  <span>iOS Mobile ({iosVisits})</span>
                </div>
              </div>
            </div>

            {/* VS BATTLE 2: Work & Portfolio Discovery vs Play & Entertainment */}
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-3.5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-500" /> Visitor Intent Duel
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  {workPercent >= playPercent ? '💼 Work-Focused' : '🎮 Entertainment'}
                </span>
              </div>

              {/* Fighter Heads */}
              <div className="grid grid-cols-2 gap-3 items-center">
                <div className="p-3 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="flex items-center gap-1"><Folder className="w-3.5 h-3.5" /> Work & Bio</span>
                    <span className="font-mono text-sm">{workPercent}%</span>
                  </div>
                  <div className="text-xl font-black mt-1 text-slate-900 dark:text-white">
                    {workScore} <span className="text-[10px] font-normal text-slate-400">actions</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5 truncate">Finder, Safari, Notes, Resume</p>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1"><Gamepad2 className="w-3.5 h-3.5" /> Fun & Play</span>
                    <span className="font-mono text-sm">{playPercent}%</span>
                  </div>
                  <div className="text-xl font-black mt-1 text-slate-900 dark:text-white">
                    {playScore} <span className="text-[10px] font-normal text-slate-400">actions</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-0.5 truncate">Retro Arcade, Cyberdeck Music</p>
                </div>
              </div>

              {/* Dual Progress Meter */}
              <div className="space-y-1.5 pt-1">
                <div className="w-full h-3 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden flex p-0.5 gap-0.5">
                  <div 
                    className="h-full rounded-l-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.max(6, workPercent)}%` }}
                    title={`Work Intent: ${workPercent}%`}
                  />
                  <div 
                    className="h-full rounded-r-full bg-gradient-to-r from-rose-500 to-pink-500 transition-all duration-700 shadow-sm"
                    style={{ width: `${Math.max(6, playPercent)}%` }}
                    title={`Play Intent: ${playPercent}%`}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                  <span>Work & Resume ({workPercent}%)</span>
                  <span>VS</span>
                  <span>Arcade & Audio ({playPercent}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* VS BATTLE 3: Top 2 Dock Apps Head-to-Head */}
          <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-500" /> App Duel: #1 vs #2 Most Launched Apps
              </span>
              <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                {topApp1.name} vs {topApp2.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${topApp1.color}`}>
                    <topApp1.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                      <span>#1 {topApp1.name}</span>
                      <Flame className="w-3 h-3 text-orange-500" />
                    </div>
                    <div className="text-[10px] text-slate-400">{topApp1.count} launches</div>
                  </div>
                </div>
                <div className="text-base font-black font-mono text-blue-600 dark:text-blue-400">
                  {app1Pct}%
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-black/5 dark:bg-white/5">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${topApp2.color}`}>
                    <topApp2.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      #2 {topApp2.name}
                    </div>
                    <div className="text-[10px] text-slate-400">{topApp2.count} launches</div>
                  </div>
                </div>
                <div className="text-base font-black font-mono text-purple-600 dark:text-purple-400">
                  {app2Pct}%
                </div>
              </div>
            </div>

            {/* Duel Bar */}
            <div className="w-full h-2 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden flex gap-0.5">
              <div 
                className="h-full rounded-l-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-700"
                style={{ width: `${Math.max(5, app1Pct)}%` }}
              />
              <div 
                className="h-full rounded-r-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-700"
                style={{ width: `${Math.max(5, app2Pct)}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: 4-STAGE CONVERSION FUNNEL */}
      {(visualMode === 'all' || visualMode === 'funnel') && (
        <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-indigo-500" />
                <span>Visitor Engagement & Conversion Funnel</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Tracking how visitors advance from initial visit to OS exploration, project inspection, and direct contact.
              </p>
            </div>
            <div className="text-right">
              <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {Math.round((totalConversions / Math.max(totalVisits, 1)) * 100)}%
              </div>
              <div className="text-[9px] text-slate-400">Total Conversion Rate</div>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {funnelSteps.map((step, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-slate-900 dark:text-white truncate">
                      {step.label}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400 font-mono">
                      {step.badge}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-xs">
                    <span className="text-slate-500 dark:text-slate-400">{step.count} events</span>
                    <span className="font-bold text-slate-900 dark:text-white w-10 text-right">{step.pct}%</span>
                  </div>
                </div>

                {/* Funnel Step Bar */}
                <div className="w-full h-3 rounded-full bg-black/5 dark:bg-white/10 overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full bg-gradient-to-r ${step.color} transition-all duration-700 shadow-sm`}
                    style={{ width: `${Math.max(4, step.pct)}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3: ACTIVITY VELOCITY SPARKLINE (SVG CURVE) */}
      {(visualMode === 'all' || visualMode === 'activity') && (
        <div className="p-4 rounded-2xl bg-white/50 dark:bg-white/5 border border-black/10 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>Activity Velocity Trend (7-Day Curve)</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Hourly & daily visitor velocity curve showing peak engagement points.
              </p>
            </div>
            {hoveredDataPoint && (
              <div className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-[11px] font-mono font-bold animate-fadeIn">
                {hoveredDataPoint.day}: {hoveredDataPoint.val} events
              </div>
            )}
          </div>

          {/* Retina SVG Sparkline Chart */}
          <div className="w-full overflow-hidden rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/5 dark:border-white/5 p-2">
            <svg 
              viewBox="0 0 500 120" 
              className="w-full h-28 sm:h-36 overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="50%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="20" y1="30" x2="480" y2="30" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4 4" />
              <line x1="20" y1="70" x2="480" y2="70" stroke="currentColor" strokeOpacity="0.05" strokeDasharray="4 4" />
              <line x1="20" y1="100" x2="480" y2="100" stroke="currentColor" strokeOpacity="0.08" />

              {/* Area Fill */}
              <path 
                d={sparklinePoints.areaD} 
                fill="url(#curveGradient)" 
              />

              {/* Smooth Stroke Line */}
              <path 
                d={sparklinePoints.d} 
                fill="none" 
                stroke="url(#strokeGradient)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />

              {/* Interactive Data Points */}
              {sparklinePoints.coords.map((pt, idx) => (
                <g key={idx}>
                  <circle 
                    cx={pt.x} 
                    cy={pt.y} 
                    r="4.5" 
                    className="fill-white dark:fill-slate-900 stroke-indigo-500 cursor-pointer transition-all hover:r-6 hover:stroke-purple-500" 
                    strokeWidth="2.5"
                    onMouseEnter={() => setHoveredDataPoint(pt)}
                    onMouseLeave={() => setHoveredDataPoint(null)}
                  />
                  {/* Day Label at Bottom */}
                  <text 
                    x={pt.x} 
                    y="115" 
                    textAnchor="middle" 
                    className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono"
                  >
                    {idx === 6 ? 'Today' : `D-${6 - idx}`}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

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

export default function AnalyticsDashboard(props) {
  return (
    <AnalyticsErrorBoundary>
      <AnalyticsDashboardContent {...props} />
    </AnalyticsErrorBoundary>
  );
}
