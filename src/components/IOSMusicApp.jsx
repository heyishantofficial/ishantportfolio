import React, { useState, useRef, useEffect, useCallback } from 'react';
import './nexusCyberdeck.css';
import { 
  Play, Pause, SkipBack, SkipForward, Volume1, Volume2, VolumeX, 
  Shuffle, Repeat, Heart, ListMusic, Music, ChevronDown, Check,
  RefreshCw, SlidersHorizontal, Sparkles
} from 'lucide-react';
import { playMacClick, getAudioContext, getMasterGain } from '../utils/macAudioEngine';

export const MUSIC_PLAYLIST = [
  {
    videoId: "iSO4OErJT7U",
    title: "BOLLYWOOD NON STOP",
    subtitle: "Classics & 2000s Mashup",
    author: "AVNEET",
    artwork: "https://img.youtube.com/vi/iSO4OErJT7U/hqdefault.jpg",
    accent: "from-rose-500/25 via-red-900/30 to-black/80"
  },
  {
    videoId: "pU02OK1QHkU",
    title: "Teri Chunariya Dil Le Gyi",
    subtitle: "Bass Boosted Hindi Romantic",
    author: "Abhi The Wanderer",
    artwork: "https://img.youtube.com/vi/pU02OK1QHkU/hqdefault.jpg",
    accent: "from-amber-500/25 via-orange-950/30 to-black/80"
  },
  {
    videoId: "Hu0ZrBRNglo",
    title: "Levitating x Woh Ladki Jo",
    subtitle: "Dj Ruchir Mashup",
    author: "Dj Ruchir",
    artwork: "https://img.youtube.com/vi/Hu0ZrBRNglo/hqdefault.jpg",
    accent: "from-indigo-500/25 via-blue-950/30 to-black/80"
  },
  {
    videoId: "R4BsqPowUDo",
    title: "Piya Ghar Aaya",
    subtitle: "Remix",
    author: "Asad Khan",
    artwork: "https://img.youtube.com/vi/R4BsqPowUDo/hqdefault.jpg",
    accent: "from-pink-500/25 via-rose-950/30 to-black/80"
  },
  {
    videoId: "wqaF_so8RJs",
    title: "Mere Nishan",
    subtitle: "Soulful Acoustic",
    author: "Mohammed",
    artwork: "https://img.youtube.com/vi/wqaF_so8RJs/hqdefault.jpg",
    accent: "from-cyan-500/25 via-blue-950/30 to-black/80"
  },
  {
    videoId: "N5fvV08uRDY",
    title: "Khud Ko Tere",
    subtitle: "Melody Collection",
    author: "Mahalakshmi",
    artwork: "https://img.youtube.com/vi/N5fvV08uRDY/hqdefault.jpg",
    accent: "from-emerald-500/25 via-teal-950/30 to-black/80"
  },
  {
    videoId: "Nyj9eHWkPyM",
    title: "12 Saal",
    subtitle: "Original Classic",
    author: "Bilal Saeed",
    artwork: "https://img.youtube.com/vi/Nyj9eHWkPyM/hqdefault.jpg",
    accent: "from-violet-500/25 via-purple-950/30 to-black/80"
  },
  {
    videoId: "R7JjuceJzFY",
    title: "BLUE EYES",
    subtitle: "Blockbuster Hip-Hop",
    author: "Yo Yo Honey Singh",
    artwork: "https://img.youtube.com/vi/R7JjuceJzFY/hqdefault.jpg",
    accent: "from-blue-500/25 via-slate-950/30 to-black/80"
  },
  {
    videoId: "hhssZ5bDa8E",
    title: "Challa",
    subtitle: "Sufi Folk Classic",
    author: "Rabbi Shergill",
    artwork: "https://img.youtube.com/vi/hhssZ5bDa8E/hqdefault.jpg",
    accent: "from-orange-500/25 via-amber-950/30 to-black/80"
  },
  {
    videoId: "39fdxGmYfvg",
    title: "Gulabi Aankhen",
    subtitle: "Acoustic Pop",
    author: "Sanam",
    artwork: "https://img.youtube.com/vi/39fdxGmYfvg/hqdefault.jpg",
    accent: "from-rose-500/25 via-pink-950/30 to-black/80"
  },
  {
    videoId: "4ZyW3TQZftA",
    title: "Ab Tera Beta Mera Hai",
    subtitle: "Folk Vibes",
    author: "Sunita Bagri",
    artwork: "https://img.youtube.com/vi/4ZyW3TQZftA/hqdefault.jpg",
    accent: "from-yellow-500/25 via-amber-950/30 to-black/80"
  }
];

export default function IOSMusicApp({ onClose, masterVolume = 80, isMuted = false }) {
  // Mode: 'ipod' (default retro iPod Classic like desktop) vs 'apple-music' (modern iOS style)
  const [playerMode, setPlayerMode] = useState('ipod');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [activeTab, setActiveTab] = useState('player'); // for apple-music mode: 'player' | 'queue'
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(210);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [volume, setVolume] = useState(masterVolume || 80);
  const [isAudioMuted, setIsAudioMuted] = useState(isMuted);

  const iframeRef = useRef(null);
  const playerRef = useRef(null);
  const isDraggingScrubber = useRef(false);

  const currentTrack = MUSIC_PLAYLIST[currentTrackIndex] || MUSIC_PLAYLIST[0];

  // Authentic iPod click sound synthesizer
  const playClickSound = useCallback(() => {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const dest = getMasterGain(ctx) || ctx.destination;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.015);
      
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);
      
      osc.connect(gain);
      gain.connect(dest);
      
      osc.start(now);
      osc.stop(now + 0.015);
    } catch (e) {
      playMacClick(isAudioMuted);
    }
  }, [isAudioMuted]);

  // Load YouTube Iframe API if not already present
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      if (firstScriptTag && firstScriptTag.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      }
    }

    const initPlayer = () => {
      if (window.YT && window.YT.Player && iframeRef.current) {
        try {
          playerRef.current = new window.YT.Player(iframeRef.current, {
            events: {
              onReady: (e) => {
                e.target.setVolume(isAudioMuted ? 0 : volume);
              },
              onStateChange: (e) => {
                if (e.data === window.YT.PlayerState.PLAYING) {
                  setIsPlaying(true);
                } else if (e.data === window.YT.PlayerState.PAUSED) {
                  setIsPlaying(false);
                } else if (e.data === window.YT.PlayerState.ENDED) {
                  handleNextTrack();
                }
              }
            }
          });
        } catch (err) {}
      }
    };

    if (window.YT && window.YT.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }

    const timer = setInterval(() => {
      if (playerRef.current && !isDraggingScrubber.current) {
        try {
          if (typeof playerRef.current.getCurrentTime === 'function') {
            const curr = playerRef.current.getCurrentTime();
            setCurrentTime(curr || 0);
          }
          if (typeof playerRef.current.getDuration === 'function') {
            const dur = playerRef.current.getDuration();
            if (dur > 0) setDuration(dur);
          }
        } catch (err) {}
      }
    }, 800);

    return () => clearInterval(timer);
  }, [currentTrackIndex]);

  // Handle track switching
  const playTrack = useCallback((index) => {
    playClickSound();
    setCurrentTrackIndex(index);
    setIsPlaying(true);
    setCurrentTime(0);

    if (playerRef.current && typeof playerRef.current.loadVideoById === 'function') {
      try {
        playerRef.current.loadVideoById(MUSIC_PLAYLIST[index].videoId);
        playerRef.current.playVideo();
      } catch (err) {}
    }
  }, [playClickSound]);

  const handleTogglePlay = useCallback(() => {
    playClickSound();
    if (isPlaying) {
      setIsPlaying(false);
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        try { playerRef.current.pauseVideo(); } catch (err) {}
      }
    } else {
      setIsPlaying(true);
      if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
        try { playerRef.current.playVideo(); } catch (err) {}
      }
    }
  }, [isPlaying, playClickSound]);

  const handleNextTrack = useCallback(() => {
    playClickSound();
    let nextIdx;
    if (isShuffle) {
      nextIdx = Math.floor(Math.random() * MUSIC_PLAYLIST.length);
    } else {
      nextIdx = (currentTrackIndex + 1) % MUSIC_PLAYLIST.length;
    }
    playTrack(nextIdx);
  }, [currentTrackIndex, isShuffle, playClickSound, playTrack]);

  const handlePrevTrack = useCallback(() => {
    playClickSound();
    if (currentTime > 5) {
      setCurrentTime(0);
      if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
        try { playerRef.current.seekTo(0, true); } catch (err) {}
      }
      return;
    }
    const prevIdx = (currentTrackIndex - 1 + MUSIC_PLAYLIST.length) % MUSIC_PLAYLIST.length;
    playTrack(prevIdx);
  }, [currentTime, currentTrackIndex, playClickSound, playTrack]);

  const handleSeek = (e) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      try { playerRef.current.seekTo(val, true); } catch (err) {}
    }
  };

  const setVolumeLevel = (val) => {
    playClickSound();
    const clamped = Math.max(0, Math.min(100, val));
    setVolume(clamped);
    setIsAudioMuted(clamped === 0);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(clamped);
        if (clamped === 0) playerRef.current.mute();
        else playerRef.current.unMute();
      } catch (err) {}
    }
  };

  const toggleMute = () => {
    playClickSound();
    const nextMuted = !isAudioMuted;
    setIsAudioMuted(nextMuted);
    if (playerRef.current) {
      try {
        if (nextMuted) playerRef.current.mute();
        else {
          playerRef.current.unMute();
          playerRef.current.setVolume(volume || 50);
        }
      } catch (err) {}
    }
  };

  const toggleShuffle = () => {
    playClickSound();
    setIsShuffle(!isShuffle);
  };

  const toggleRepeat = () => {
    playClickSound();
    setIsRepeat(!isRepeat);
  };

  const formatTime = (secs) => {
    if (!secs || isNaN(secs) || secs < 0) return "0:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="w-full h-full bg-[#0a0a0c] text-white flex flex-col font-sans select-none relative overflow-hidden">
      
      {/* Hidden YouTube Iframe Audio Engine */}
      <div className="absolute -top-96 -left-96 w-1 h-1 opacity-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <iframe
          ref={iframeRef}
          src={`https://www.youtube.com/embed/${currentTrack.videoId}?enablejsapi=1&origin=${typeof window !== 'undefined' ? window.location.origin : ''}&playsinline=1&controls=0`}
          allow="autoplay; encrypted-media"
          title="iPod Audio Engine"
        />
      </div>

      {/* Dynamic Ambient Background Glow */}
      <div className={`absolute inset-0 bg-gradient-to-b ${currentTrack.accent} opacity-60 blur-3xl pointer-events-none transition-colors duration-700`} />
      <div className="absolute inset-0 bg-black/40 backdrop-blur-2xl pointer-events-none" />

      {/* 1. iOS Top Navigation Header with Mode Switcher */}
      <div className="relative z-20 w-full pt-3 pb-2.5 px-4 flex items-center justify-between border-b border-white/10 shrink-0">
        
        {/* Minimize Button */}
        <button
          onClick={onClose}
          className="flex items-center gap-1 text-slate-300 active:opacity-60 transition-opacity font-medium text-xs cursor-pointer py-1 px-1.5 -ml-1 rounded-lg hover:bg-white/5"
          aria-label="Close Music"
        >
          <ChevronDown className="w-5 h-5" />
          <span>Home</span>
        </button>

        {/* Player Mode Switcher: iPod Classic vs Apple Music */}
        <div className="flex items-center bg-white/10 p-0.5 rounded-full border border-white/10 shadow-inner">
          <button
            onClick={() => { playClickSound(); setPlayerMode('ipod'); }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
              playerMode === 'ipod'
                ? 'bg-gradient-to-r from-slate-200 to-white text-slate-900 shadow-md font-bold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <span>iPod Classic</span>
          </button>
          <button
            onClick={() => { playClickSound(); setPlayerMode('apple-music'); }}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
              playerMode === 'apple-music'
                ? 'bg-rose-600 text-white shadow-md font-bold'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <span>Apple Music</span>
          </button>
        </div>

        {/* Done Button */}
        <button
          onClick={onClose}
          className="px-3 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white font-semibold text-xs transition-all cursor-pointer"
        >
          Done
        </button>
      </div>

      {/* 2. Main Content View */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-3 flex flex-col justify-center items-center max-w-[440px] mx-auto w-full">
        
        {playerMode === 'ipod' ? (
          /* ========================================================================= */
          /* MODE 1: THE ICONIC RETRO IPOD CLASSIC (EXACTLY LIKE PORTFOLIO DESKTOP)   */
          /* ========================================================================= */
          <div className="flex flex-col items-center justify-center my-auto scale-[1.12] sm:scale-[1.25] transition-transform origin-center">
            
            {/* RETRO IPOD CHASSIS */}
            <div className="ipod shadow-[0_25px_60px_rgba(0,0,0,0.8),inset_5px_0px_15px_10px_rgba(0,0,0,0.56)]">
              
              {/* LCD Screen */}
              <div className="screen relative">
                
                {/* Screen Header */}
                <div className="screen-header flex items-center justify-between px-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-800 uppercase font-bold leading-none translate-y-[2px]">
                      {showPlaylistMenu ? "PLAYLIST" : "NOW PLAYING"}
                    </span>
                    {isPlaying && (
                      <div className="flex items-end gap-[1.5px] h-2.5 opacity-80">
                        <span className="w-[1.5px] bg-slate-900 rounded-xs animate-eq-bar-1" />
                        <span className="w-[1.5px] bg-slate-900 rounded-xs animate-eq-bar-2" />
                        <span className="w-[1.5px] bg-slate-900 rounded-xs animate-eq-bar-3" />
                        <span className="w-[1.5px] bg-slate-900 rounded-xs animate-eq-bar-4" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-slate-800">
                    {isShuffle && <Shuffle className="w-2.5 h-2.5 stroke-[2.5]" />}
                    {isRepeat && <Repeat className="w-2.5 h-2.5 stroke-[2.5]" />}
                  </div>
                </div>

                {/* PLAYLIST MENU SCREEN */}
                {showPlaylistMenu ? (
                  <div className="ipod-menu-container">
                    <div className="ipod-menu-header flex items-center justify-between px-2">
                      <span className="flex-1 text-center font-bold pl-3 text-[11px]">ishant's playlist</span>
                    </div>
                    <div className="ipod-menu-list custom-scrollbar">
                      {MUSIC_PLAYLIST.map((track, idx) => {
                        const isCurrent = currentTrackIndex === idx;
                        return (
                          <div
                            key={track.videoId}
                            onClick={() => { playTrack(idx); setShowPlaylistMenu(false); }}
                            className={`ipod-menu-item ${isCurrent ? 'active' : ''}`}
                          >
                            <div className="flex items-center gap-1.5 min-w-0 pr-1">
                              <span className="ipod-menu-track-num text-[9.5px] font-mono font-bold opacity-75 w-4 min-w-[16px] text-right shrink-0">
                                {idx + 1}
                              </span>
                              <span className="truncate text-[10px]" title={track.title}>
                                {track.title}
                              </span>
                            </div>
                            {isCurrent && <span className="text-[10px]">▶</span>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* NOW PLAYING SCREEN */
                  <>
                    <div className="music">
                      {/* Spinning Vinyl Record Art */}
                      <div className="relative w-[60px] h-[60px] min-w-[60px] min-h-[60px] rounded-full overflow-hidden border-2 border-slate-900 shadow-md flex-shrink-0 flex items-center justify-center bg-slate-950">
                        <img
                          id="poster"
                          src={currentTrack.artwork}
                          alt={currentTrack.title}
                          style={{ transform: isPlaying ? undefined : 'scale(1.65)' }}
                          className={`w-full h-full object-cover rounded-full ${isPlaying ? 'spin-vinyl' : ''}`}
                        />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-950 rounded-full border border-slate-700 pointer-events-none shadow-inner z-10" />
                        <svg className={`tonearm ${isPlaying ? 'playing' : 'paused'}`} viewBox="0 0 24 36" fill="none">
                          <circle cx="18" cy="4" r="3" fill="#475569" stroke="#0f172a" strokeWidth="1" />
                          <path d="M18 4 L12 24 L6 30" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                          <rect x="3" y="28" width="6" height="4" rx="1" fill="#0f172a" />
                        </svg>
                      </div>

                      {/* Song Details */}
                      <div className="content">
                        <b className="name truncate block" title={currentTrack.title}>
                          {currentTrack.title}
                        </b>
                        <p className="singer truncate">{currentTrack.author}</p>

                        {/* Volume Bar & Controls inside LCD */}
                        <div className="flex items-center gap-1 mt-1 text-[#313131] select-none">
                          <button
                            onClick={() => setVolumeLevel(volume - 10)}
                            className="p-0.5 rounded hover:bg-slate-300/60 active:scale-90 transition-all text-[#313131]"
                            title="Volume Down"
                          >
                            {volume === 0 ? <VolumeX className="w-3 h-3" /> : <Volume1 className="w-3 h-3" />}
                          </button>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={volume}
                            onChange={(e) => setVolumeLevel(Number(e.target.value))}
                            className="w-14 h-1 accent-slate-800 bg-slate-400/80 rounded-lg cursor-pointer transition-all"
                          />
                          <button
                            onClick={() => setVolumeLevel(volume + 10)}
                            className="p-0.5 rounded hover:bg-slate-300/60 active:scale-90 transition-all text-[#313131]"
                            title="Volume Up"
                          >
                            <Volume2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={toggleShuffle}
                            className={`p-0.5 ml-0.5 rounded active:scale-90 ${isShuffle ? 'text-blue-700 bg-slate-300/80' : 'text-slate-600'}`}
                          >
                            <Shuffle className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar inside LCD */}
                    <div className="bar-box">
                      <p className="current-time">{formatTime(currentTime)}</p>
                      <div className="bar">
                        <div className="progress" style={{ width: `${progressPercent}%` }} />
                      </div>
                      <p className="duration-time">{formatTime(duration)}</p>
                    </div>
                  </>
                )}

              </div>

              {/* Click Wheel Controls (Direct thumb touch friendly) */}
              <div className="controls">
                {/* MENU Button */}
                <button
                  className="menu font-bold tracking-widest text-slate-600 hover:text-slate-900 active:scale-95"
                  onClick={() => { playClickSound(); setShowPlaylistMenu(prev => !prev); }}
                  title="Playlist Menu"
                >
                  MENU
                </button>

                {/* Backward Button */}
                <button
                  className="btn-backward"
                  onClick={handlePrevTrack}
                  title="Previous Track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Forward Button */}
                <button
                  className="btn-forward"
                  onClick={handleNextTrack}
                  title="Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>

                {/* Play / Pause Bottom Button */}
                <button
                  className="play-pause-btn"
                  onClick={handleTogglePlay}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>
              </div>

            </div>

            <p className="text-[10px] text-white/50 font-mono tracking-wider text-center mt-3">
              Tap <span className="text-white font-bold">MENU</span> for Playlist • Click Wheel to Control
            </p>

          </div>
        ) : (
          /* ========================================================================= */
          /* MODE 2: MODERN APPLE MUSIC VIEW                                           */
          /* ========================================================================= */
          <div className="w-full flex-1 flex flex-col justify-between space-y-4 my-auto">
            {/* Segmented Switcher (Player / Up Next) */}
            <div className="flex items-center justify-center">
              <div className="flex items-center bg-white/10 p-0.5 rounded-full border border-white/10 shadow-inner">
                <button
                  onClick={() => { playClickSound(); setActiveTab('player'); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                    activeTab === 'player' ? 'bg-rose-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
                  }`}
                >
                  Now Playing
                </button>
                <button
                  onClick={() => { playClickSound(); setActiveTab('queue'); }}
                  className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1 ${
                    activeTab === 'queue' ? 'bg-rose-600 text-white shadow-sm' : 'text-white/70 hover:text-white'
                  }`}
                >
                  <ListMusic className="w-3.5 h-3.5" />
                  <span>Playlist ({MUSIC_PLAYLIST.length})</span>
                </button>
              </div>
            </div>

            {activeTab === 'player' ? (
              <div className="flex-1 flex flex-col justify-between space-y-3">
                {/* Album Artwork Squircle */}
                <div className="w-full flex items-center justify-center pt-1">
                  <div className="relative group w-[clamp(170px,46vw,220px)] aspect-square rounded-[22%] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] ring-1 ring-white/20">
                    <img src={currentTrack.artwork} alt={currentTrack.title} className="w-full h-full object-cover" />
                    {isPlaying && (
                      <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 border border-white/20">
                        <span className="w-1 h-3 bg-rose-500 rounded-full animate-pulse" />
                        <span className="w-1 h-4 bg-rose-400 rounded-full animate-pulse delay-75" />
                        <span className="w-1 h-2.5 bg-rose-300 rounded-full animate-pulse delay-150" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Track Info */}
                <div className="flex items-center justify-between gap-3 px-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="text-base font-bold text-white tracking-tight truncate drop-shadow-sm">
                      {currentTrack.title}
                    </h2>
                    <p className="text-xs text-rose-300/80 font-medium truncate mt-0.5">
                      {currentTrack.author} • {currentTrack.subtitle}
                    </p>
                  </div>
                  <button
                    onClick={() => { playClickSound(); setIsFavorite(!isFavorite); }}
                    className={`p-2 rounded-full active:scale-90 ${isFavorite ? 'text-rose-500 bg-rose-500/10' : 'text-white/40'}`}
                  >
                    <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 px-2">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    style={{
                      background: `linear-gradient(to right, #f43f5e ${progressPercent}%, rgba(255,255,255,0.2) ${progressPercent}%)`
                    }}
                  />
                  <div className="flex justify-between text-[11px] font-mono text-white/50">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(Math.max(0, (duration || 0) - currentTime))}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between px-3 py-1">
                  <button onClick={toggleShuffle} className={`p-2 rounded-full ${isShuffle ? 'text-rose-400 bg-rose-500/20' : 'text-white/40'}`}>
                    <Shuffle className="w-4 h-4" />
                  </button>
                  <button onClick={handlePrevTrack} className="p-3 text-white/90 active:scale-90">
                    <SkipBack className="w-6 h-6 fill-current" />
                  </button>
                  <button onClick={handleTogglePlay} className="w-14 h-14 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-95">
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                  </button>
                  <button onClick={handleNextTrack} className="p-3 text-white/90 active:scale-90">
                    <SkipForward className="w-6 h-6 fill-current" />
                  </button>
                  <button onClick={toggleRepeat} className={`p-2 rounded-full ${isRepeat ? 'text-rose-400 bg-rose-500/20' : 'text-white/40'}`}>
                    <Repeat className="w-4 h-4" />
                  </button>
                </div>

                {/* Volume Bar */}
                <div className="flex items-center gap-3 px-3 py-1.5 bg-white/5 rounded-2xl border border-white/10">
                  <button onClick={toggleMute} className="text-white/50 hover:text-white">
                    {isAudioMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume1 className="w-4 h-4" />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={isAudioMuted ? 0 : volume}
                    onChange={(e) => setVolumeLevel(Number(e.target.value))}
                    className="flex-1 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                  <Volume2 className="w-4 h-4 text-white/50" />
                </div>
              </div>
            ) : (
              /* Playlist Queue in Apple Music mode */
              <div className="space-y-2 overflow-y-auto max-h-[52vh] pr-1">
                {MUSIC_PLAYLIST.map((track, idx) => {
                  const isCurrent = idx === currentTrackIndex;
                  return (
                    <div
                      key={track.videoId}
                      onClick={() => playTrack(idx)}
                      className={`p-2 rounded-2xl flex items-center justify-between gap-3 cursor-pointer ${
                        isCurrent ? 'bg-rose-500/20 border border-rose-500/40' : 'bg-white/5'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <img src={track.artwork} alt={track.title} className="w-10 h-10 rounded-xl object-cover" />
                        <div className="min-w-0 flex-1">
                          <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-rose-400' : 'text-white'}`}>{track.title}</h4>
                          <p className="text-[10px] text-white/60 truncate">{track.author}</p>
                        </div>
                      </div>
                      {isCurrent && <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500 font-bold">Playing</span>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}
