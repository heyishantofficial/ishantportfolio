import React, { useState, useRef, useEffect } from 'react';
import './nexusCyberdeck.css';
import { Play, Pause, SkipBack, SkipForward, Minus, Maximize2, X, RefreshCw, Volume1, Volume2, VolumeX, Shuffle, Repeat } from 'lucide-react';

export default function NexusCyberdeckPlayer({ onClose }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progressWidth, setProgressWidth] = useState(0);
  const [currentTimeStr, setCurrentTimeStr] = useState("0:00");
  const [durationTimeStr, setDurationTimeStr] = useState("0:00");
  const [isScrolling, setIsScrolling] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [showPlaylistMenu, setShowPlaylistMenu] = useState(false);
  const [activeTrackIndex, setActiveTrackIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  const playClickSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.015);
      
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.015);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.015);
    } catch (e) {}
  };

  const setVolumeLevel = (newVol) => {
    playClickSound();
    const clampedVol = Math.max(0, Math.min(100, newVol));
    setVolume(clampedVol);
    if (playerRef.current && typeof playerRef.current.setVolume === 'function') {
      try {
        playerRef.current.setVolume(clampedVol);
      } catch (err) {}
    }
    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'setVolume', args: [clampedVol] }),
          '*'
        );
      } catch (err) {}
    }
  };

  const toggleShuffle = () => {
    playClickSound();
    const nextShuffle = !isShuffle;
    setIsShuffle(nextShuffle);
    if (playerRef.current && typeof playerRef.current.setShuffle === 'function') {
      try {
        playerRef.current.setShuffle(nextShuffle);
      } catch (err) {}
    }
  };

  const toggleRepeat = () => {
    playClickSound();
    const nextRepeat = !isRepeat;
    setIsRepeat(nextRepeat);
    if (playerRef.current && typeof playerRef.current.setLoop === 'function') {
      try {
        playerRef.current.setLoop(nextRepeat);
      } catch (err) {}
    }
  };
  
  // YouTube Playlist Integration State
  const [ytPlaylistId, setYtPlaylistId] = useState('PLa-RnRky6wsc');
  const [showYtInput, setShowYtInput] = useState(false);
  const [ytUrlInput, setYtUrlInput] = useState('https://www.youtube.com/embed/videoseries?si=wZpUvQDLhFD5G0-O&list=PLa-RnRky6wsc');
  
  // Real YouTube Track Metadata & Live Playlist Sync
  const [ytLiveTitle, setYtLiveTitle] = useState('BOLLYWOOD NON STOP | AVNEET MUSIC');
  const [ytLiveAuthor, setYtLiveAuthor] = useState('AVNEET');
  const [ytLiveThumbnail, setYtLiveThumbnail] = useState('https://img.youtube.com/vi/iSO4OErJT7U/hqdefault.jpg');
  const [ytAlbum, setYtAlbum] = useState('YouTube Playlist • PLa-RnRky6wsc');
  const [playlistTracks, setPlaylistTracks] = useState([
    {
      videoId: "iSO4OErJT7U",
      title: "BOLLYWOOD NON STOP | AVNEET MUSIC | BOLLYWOOD 2000s",
      author: "AVNEET"
    },
    {
      videoId: "pU02OK1QHkU",
      title: "Teri Chunariya Dil Le Gyi [Bass Boosted]",
      author: "Abhi The Wanderer"
    }
  ]);

  const nameRef = useRef(null);
  const iframeRef = useRef(null);
  const playerRef = useRef(null);

  // Helper to fetch uncached YouTube playlist RSS feed
  const fetchLatestPlaylistFeed = async () => {
    const timestamp = Date.now();
    const targetFeedUrl = `https://www.youtube.com/feeds/videos.xml?playlist_id=${ytPlaylistId}&_cb=${timestamp}`;
    
    // Proxy URLs with cache-busting timestamp
    const proxyUrls = [
      `https://api.allorigins.win/raw?timestamp=${timestamp}&url=${encodeURIComponent(targetFeedUrl)}`,
      `https://corsproxy.io/?url=${encodeURIComponent(targetFeedUrl)}`
    ];

    for (const url of proxyUrls) {
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache'
          }
        });
        if (res.ok) {
          const xmlText = await res.text();
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(xmlText, "text/xml");
          const entries = Array.from(xmlDoc.querySelectorAll("entry"));
          
          if (entries.length > 0) {
            const fetchedTracks = entries.map(entry => {
              const vId = entry.getElementsByTagName("yt:videoId")[0]?.textContent || entry.querySelector("videoId")?.textContent || "";
              const t = entry.querySelector("title")?.textContent || "YouTube Track";
              const a = entry.querySelector("author name")?.textContent || "YouTube Artist";
              return { videoId: vId, title: t, author: a };
            });
            return fetchedTracks;
          }
        }
      } catch (err) {}
    }
    return null;
  };

  // Live Sync with YouTube Playlist RSS Feed
  useEffect(() => {
    if (!ytPlaylistId) return;

    const syncPlaylistRSS = async () => {
      const latest = await fetchLatestPlaylistFeed();
      if (latest && latest.length > 0) {
        setPlaylistTracks(latest);
        if (latest[0]) {
          setYtLiveTitle(latest[0].title);
          setYtLiveAuthor(latest[0].author);
          if (latest[0].videoId) {
            setYtLiveThumbnail(`https://img.youtube.com/vi/${latest[0].videoId}/hqdefault.jpg`);
          }
        }
      }
    };

    syncPlaylistRSS();
  }, [ytPlaylistId]);

  const refreshPlaylist = async (e) => {
    if (e) e.stopPropagation();
    playClickSound();
    if (!ytPlaylistId || isRefreshing) return;
    setIsRefreshing(true);
    try {
      if (playerRef.current && typeof playerRef.current.loadPlaylist === 'function') {
        try {
          playerRef.current.loadPlaylist({
            list: ytPlaylistId,
            listType: 'playlist'
          });
        } catch (err) {}
      }

      const latestTracks = await fetchLatestPlaylistFeed();
      if (latestTracks && latestTracks.length > 0) {
        setPlaylistTracks(latestTracks);
      }
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  // Load YouTube Iframe API and subscribe to live track metadata updates
  useEffect(() => {
    // Inject YouTube Iframe API if missing
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    const updateTrackMeta = (targetPlayer) => {
      try {
        if (targetPlayer && typeof targetPlayer.getVideoData === 'function') {
          const data = targetPlayer.getVideoData();
          if (data) {
            if (data.title && data.title !== 'YouTube') {
              setYtLiveTitle(data.title);
              if (data.video_id) {
                setPlaylistTitlesMap(prev => ({ ...prev, [data.video_id]: data.title }));
              }
            }
            if (data.author) setYtLiveAuthor(data.author);
            if (data.video_id) {
              setYtLiveThumbnail(`https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`);
            }
          }
        }
        if (targetPlayer && typeof targetPlayer.getPlaylist === 'function') {
          const list = targetPlayer.getPlaylist();
          if (Array.isArray(list) && list.length > 0) {
            setPlaylistVideoIds(list);
            setPlaylistTracks(prev => {
              if (prev.length !== list.length) {
                const updated = list.map(vId => {
                  const found = prev.find(t => t.videoId === vId);
                  return found || { videoId: vId, title: `Track (${vId})`, author: "YouTube" };
                });
                return updated;
              }
              return prev;
            });
          }
        }
        if (targetPlayer && typeof targetPlayer.getPlaylistIndex === 'function') {
          const currentIdx = targetPlayer.getPlaylistIndex();
          if (currentIdx !== undefined && currentIdx >= 0) {
            setActiveTrackIndex(currentIdx);
          }
        }
      } catch (err) {}
    };

    const setupPlayer = () => {
      if (window.YT && window.YT.Player && iframeRef.current) {
        playerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: (e) => updateTrackMeta(e.target),
            onStateChange: (e) => {
              updateTrackMeta(e.target);
              if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
              else if (e.data === window.YT.PlayerState.PAUSED || e.data === window.YT.PlayerState.ENDED) setIsPlaying(false);
            }
          }
        });
      }
    };

    if (window.YT && window.YT.Player) {
      setupPlayer();
    } else {
      window.onYouTubeIframeAPIReady = setupPlayer;
    }

    // Interval fallback to poll current progress & metadata
    const interval = setInterval(() => {
      if (playerRef.current) {
        try {
          if (typeof playerRef.current.getVideoData === 'function') {
            const data = playerRef.current.getVideoData();
            if (data && data.title && data.title !== 'YouTube') {
              setYtLiveTitle(data.title);
              if (data.author) setYtLiveAuthor(data.author);
              if (data.video_id) {
                setYtLiveThumbnail(`https://img.youtube.com/vi/${data.video_id}/hqdefault.jpg`);
              }
            }
          }
          if (typeof playerRef.current.getCurrentTime === 'function' && typeof playerRef.current.getDuration === 'function') {
            const curr = playerRef.current.getCurrentTime();
            const dur = playerRef.current.getDuration();
            if (dur > 0) {
              setProgressWidth((curr / dur) * 100);
              let min_d = Math.floor(dur / 60);
              let sec_d = Math.floor(dur % 60);
              setDurationTimeStr(`${min_d}:${sec_d < 10 ? '0' + sec_d : sec_d}`);

              let min_c = Math.floor(curr / 60);
              let sec_c = Math.floor(curr % 60);
              setCurrentTimeStr(`${min_c}:${sec_c < 10 ? '0' + sec_c : sec_c}`);
            }
          }
        } catch (err) {}
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [ytPlaylistId]);

  // Listen to raw postMessage fallback as secondary backup
  useEffect(() => {
    const handleMsg = (e) => {
      try {
        if (typeof e.data === 'string') {
          const data = JSON.parse(e.data);
          if (data.event === 'infoDelivery' && data.info) {
            const info = data.info;
            if (info.videoData) {
              if (info.videoData.title && info.videoData.title !== 'YouTube') setYtLiveTitle(info.videoData.title);
              if (info.videoData.author) setYtLiveAuthor(info.videoData.author);
              if (info.videoData.video_id) {
                setYtLiveThumbnail(`https://img.youtube.com/vi/${info.videoData.video_id}/hqdefault.jpg`);
              }
            }
          }
        }
      } catch (err) {}
    };
    window.addEventListener('message', handleMsg);
    return () => window.removeEventListener('message', handleMsg);
  }, []);

  // Helper to send YouTube Iframe Commands
  const postYtCommand = (cmd) => {
    if (playerRef.current) {
      try {
        if (cmd === 'playVideo' && typeof playerRef.current.playVideo === 'function') {
          playerRef.current.playVideo();
          setIsPlaying(true);
          return;
        } else if (cmd === 'pauseVideo' && typeof playerRef.current.pauseVideo === 'function') {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
          return;
        } else if (cmd === 'nextVideo' && typeof playerRef.current.nextVideo === 'function') {
          playerRef.current.nextVideo();
          setIsPlaying(true);
          return;
        } else if (cmd === 'previousVideo' && typeof playerRef.current.previousVideo === 'function') {
          playerRef.current.previousVideo();
          setIsPlaying(true);
          return;
        }
      } catch (e) {}
    }

    if (iframeRef.current && iframeRef.current.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: cmd, args: '' }),
          '*'
        );
      } catch (err) {}
    }
  };

  // Helper to extract playlist ID from full URL or raw ID
  const loadYtPlaylist = (inputUrl) => {
    let extractedId = inputUrl.trim();
    if (inputUrl.includes('list=')) {
      const match = inputUrl.match(/list=([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        extractedId = match[1];
      }
    }
    if (extractedId) {
      setYtPlaylistId(extractedId);
      setYtAlbum(`YouTube Playlist • ${extractedId}`);
      setIsPlaying(true);
      setShowYtInput(false);
    }
  };

  // Auto-check title scroll width
  useEffect(() => {
    if (nameRef.current) {
      if (nameRef.current.scrollWidth > nameRef.current.clientWidth) {
        setIsScrolling(true);
      } else {
        setIsScrolling(false);
      }
    }
  }, [ytLiveTitle, isMinimized]);

  const togglePlayPause = (e) => {
    if (e) e.stopPropagation();
    playClickSound();
    if (isPlaying) {
      postYtCommand('pauseVideo');
    } else {
      postYtCommand('playVideo');
    }
  };

  const nextSong = (e) => {
    if (e) e.stopPropagation();
    playClickSound();
    postYtCommand('nextVideo');
  };

  const prevSong = (e) => {
    if (e) e.stopPropagation();
    playClickSound();
    postYtCommand('previousVideo');
  };

  const playPlaylistItem = (index) => {
    playClickSound();
    setActiveTrackIndex(index);
    const selectedTrack = playlistTracks[index];
    if (selectedTrack) {
      setYtLiveTitle(selectedTrack.title);
      setYtLiveAuthor(selectedTrack.author);
      if (selectedTrack.videoId) {
        setYtLiveThumbnail(`https://img.youtube.com/vi/${selectedTrack.videoId}/hqdefault.jpg`);
      }
    }
    if (playerRef.current && typeof playerRef.current.playVideoAt === 'function') {
      try {
        playerRef.current.playVideoAt(index);
        setIsPlaying(true);
      } catch (err) {}
    } else {
      postYtCommand('nextVideo');
    }
    setShowPlaylistMenu(false);
  };

  return (
    <div className="relative flex flex-col items-end">
      
      {/* SVG Filter Layer for Fluid Specular Highlights and Micro-Distortion */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <filter id="liquid-refraction">
            <feTurbulence type="fractalNoise" baseFrequency="0.015" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="8" xChannelSelector="R" yChannelSelector="G" result="displacement" />
            <feSpecularLighting in="noise" surfaceScale="3" specularConstant="1.2" specularExponent="40" lightingColor="#ffffff" result="light">
              <feDistantLight azimuth="50" elevation="60" />
            </feSpecularLighting>
            <feComposite in="light" in2="displacement" operator="in" result="lightOverlay" />
            <feBlend mode="screen" in="lightOverlay" in2="displacement" />
          </filter>
        </defs>
      </svg>

      {/* ALWAYS MOUNTED PERMANENT YOUTUBE AUDIO IFRAME */}
      <div className="fixed -bottom-[200px] -right-[200px] w-1 h-1 opacity-0 pointer-events-none overflow-hidden z-[-1]">
        <iframe 
          ref={iframeRef}
          id="yt-player-iframe"
          className="w-1 h-1 border-0"
          src={`https://www.youtube.com/embed/videoseries?si=wZpUvQDLhFD5G0-O&list=${ytPlaylistId}&autoplay=0&enablejsapi=1`} 
          title="YouTube background audio stream" 
          allow="autoplay"
        />
      </div>

      {/* Floating Speech Bubble Above iPod */}
      {showBubble && (
        <div className={`liquid-glass-bubble mb-4 text-[#313131] p-2.5 pl-3 pr-7 rounded-xl relative font-sans text-xs select-none z-50 transition-all duration-300 ${isMinimized ? 'w-[240px]' : 'w-[210px]'}`}>
          <button 
            onClick={() => setShowBubble(false)}
            className="absolute top-2 right-2 w-4 h-4 bg-[#313131]/10 hover:bg-[#313131]/20 text-[#313131] rounded-full flex items-center justify-center border border-[#313131]/20 text-[9px] transition-colors"
            title="Dismiss bubble"
          >
            <X className="w-2.5 h-2.5" />
          </button>
          
          <p className="speech-bubble-font font-bold text-[#313131] text-xs leading-snug tracking-wide">
            meanwhile you scrolling my portfolio , listen to my dope music playlist . at least you get the idea of my vibe 🎧
          </p>

          {/* Clean Downward SVG Speech Bubble Tail */}
          <svg className={`absolute -bottom-2 ${isMinimized ? 'right-8' : 'right-6'} w-3.5 h-2 text-[rgba(255,255,255,0.4)] fill-current pointer-events-none overflow-visible transition-all duration-300`} viewBox="0 0 14 8">
            <path d="M0 0 L7 8 L14 0 Z" className="stroke-white/40 stroke-[1]" />
          </svg>
        </div>
      )}

      <div className="ipod-wrapper">

      {isMinimized ? (
        /* MINIMIZED LIQUID GLASS PILL PLAYER */
        <div 
          onClick={() => setIsMinimized(false)}
          className="liquid-glass-pill flex items-center justify-between gap-3 p-2 px-3 w-[240px] text-[#313131] rounded-full cursor-pointer hover:scale-105 transition-all group font-sans text-xs select-none"
          title="Click to expand iPod"
        >
          {/* Perfect 1:1 Circle Mini Poster */}
          <div className="relative flex-shrink-0">
            <div className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-full overflow-hidden border border-[#313131]/30 bg-slate-900 shadow-md flex items-center justify-center">
              <img 
                src={ytLiveThumbnail} 
                alt={ytLiveTitle} 
                style={{ transform: isPlaying ? undefined : 'scale(1.65)' }}
                className={`w-full h-full object-cover rounded-full ${isPlaying ? 'spin-vinyl' : ''}`} 
              />
            </div>
            {isPlaying && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
              </span>
            )}
          </div>

          {/* Song Info */}
          <div className="flex flex-col min-w-0 max-w-[130px]">
            <span className="font-extrabold text-[#313131] text-[11px] truncate leading-tight">
              {ytLiveTitle}
            </span>
            <span className="text-[9.5px] text-[#313131]/80 truncate font-bold">
              {ytLiveAuthor}
            </span>
          </div>

          {/* Mini Play / Pause Controls */}
          <div className="flex items-center gap-1.5 pl-1">
            <button
              onClick={togglePlayPause}
              className="p-1.5 rounded-full bg-[#313131]/10 hover:bg-[#313131]/20 border border-[#313131]/20 text-[#313131] transition-all shadow-sm active:scale-90"
            >
              {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setIsMinimized(false); }}
              className="p-1.5 rounded-full bg-[#313131]/10 hover:bg-[#313131]/20 border border-[#313131]/20 text-[#313131] transition-all shadow-sm active:scale-90"
              title="Expand iPod"
            >
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>
        </div>
      ) : (
        /* FULL RETRO IPOD CLASSIC CHASSIS */
        <div className="ipod">
          
          {/* Minimize Button */}
          <button 
            onClick={() => setIsMinimized(true)} 
            className="ipod-close-btn" 
            title="Minimize iPod"
          >
            <Minus className="w-3.5 h-3.5 stroke-[3]" />
          </button>

          {/* LCD Screen - Pure Retro iPod UI */}
          <div className="screen relative">
            <div className="screen-header flex items-center justify-between px-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-800 uppercase font-bold leading-none translate-y-[2px]">
                  NOW PLAYING
                </span>
                {/* Animated LCD Equalizer Visualizer Bars */}
                {isPlaying && (
                  <div className="flex items-end gap-[1.5px] h-2.5 opacity-80">
                    <span className="w-[1.5px] bg-slate-900 rounded-xs animate-eq-bar-1"></span>
                    <span className="w-[1.5px] bg-slate-900 rounded-xs animate-eq-bar-2"></span>
                    <span className="w-[1.5px] bg-slate-900 rounded-xs animate-eq-bar-3"></span>
                    <span className="w-[1.5px] bg-slate-900 rounded-xs animate-eq-bar-4"></span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1 text-slate-800">
                {isShuffle && <Shuffle className="w-2.5 h-2.5 stroke-[2.5]" />}
                {isRepeat && <Repeat className="w-2.5 h-2.5 stroke-[2.5]" />}
              </div>
            </div>

            {/* RETRO IPOD CLASSIC PLAYLIST MENU SCREEN */}
            {showPlaylistMenu ? (
              <div className="ipod-menu-container">
                <div className="ipod-menu-header flex items-center justify-between px-2">
                  <span className="flex-1 text-center font-bold pl-3">ishant's playlist</span>
                  <button 
                    onClick={refreshPlaylist} 
                    className="p-0.5 text-slate-700 hover:text-slate-950 transition-colors"
                    title="Sync/Refresh YouTube Playlist"
                  >
                    <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                </div>
                <div className="ipod-menu-list custom-scrollbar">
                  {playlistTracks.map((track, idx) => {
                    const isCurrent = activeTrackIndex === idx;

                    return (
                      <div 
                        key={idx} 
                        onClick={() => playPlaylistItem(idx)}
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
                        {isCurrent && (
                          <span className="text-[10px]">▶</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : showYtInput ? (
              /* PLAYLIST URL INPUT OVERLAY */
              <div className="p-2 flex flex-col gap-1.5 bg-slate-900 text-white h-[115px] font-sans text-xs z-20 relative">
                <span className="text-[10px] font-mono text-cyan-400 font-bold">YouTube Playlist URL / ID:</span>
                <input 
                  type="text" 
                  value={ytUrlInput}
                  onChange={(e) => setYtUrlInput(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=..."
                  className="px-2 py-1 bg-slate-950 border border-slate-700 rounded text-[11px] font-mono text-white focus:outline-none focus:border-cyan-500"
                />
                <div className="flex gap-1.5 mt-1">
                  <button 
                    onClick={() => loadYtPlaylist(ytUrlInput)}
                    className="flex-1 py-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-[10px] rounded transition-colors"
                  >
                    LOAD YT AUDIO
                  </button>
                  <button 
                    onClick={() => setShowYtInput(false)}
                    className="px-2 py-1 bg-slate-800 text-slate-300 font-bold text-[10px] rounded"
                  >
                    CANCEL
                  </button>
                </div>
              </div>
            ) : (
              /* RETRO IPOD SCREEN DISPLAY */
              <>
                <div className="music">
                  <div className="relative w-[60px] h-[60px] min-w-[60px] min-h-[60px] rounded-full overflow-hidden border-2 border-slate-900 shadow-md flex-shrink-0 flex items-center justify-center bg-slate-950">
                    <img 
                      id="poster" 
                      src={ytLiveThumbnail} 
                      alt={ytLiveTitle} 
                      style={{ transform: isPlaying ? undefined : 'scale(1.65)' }}
                      className={`w-full h-full object-cover rounded-full ${isPlaying ? 'spin-vinyl' : ''}`} 
                    />
                    {/* Vinyl Center Hole Spindle Overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-slate-950 rounded-full border border-slate-700 pointer-events-none shadow-inner z-10" />

                    {/* Mechanical Vinyl Tonearm Arm Overlay */}
                    <svg 
                      className={`tonearm ${isPlaying ? 'playing' : 'paused'}`} 
                      viewBox="0 0 24 36" 
                      fill="none"
                    >
                      <circle cx="18" cy="4" r="3" fill="#475569" stroke="#0f172a" strokeWidth="1" />
                      <path d="M18 4 L12 24 L6 30" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
                      <rect x="3" y="28" width="6" height="4" rx="1" fill="#0f172a" />
                    </svg>
                  </div>
                  
                  <div className="content">
                    <b ref={nameRef} className={`name ${isScrolling ? 'scroll' : ''}`}>
                      {ytLiveTitle}
                    </b>
                    <p className="singer">{ytLiveAuthor}</p>

                    {/* Minimal Volume Up / Down Controller */}
                    <div className="flex items-center gap-1 mt-1 text-[#313131] select-none">
                      <button 
                        onClick={() => setVolumeLevel(volume - 10)}
                        className="p-0.5 rounded hover:bg-slate-300/60 active:scale-90 transition-all text-[#313131]"
                        title="Volume Down (-10%)"
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
                        title={`Volume: ${volume}%`}
                      />

                      <button 
                        onClick={() => setVolumeLevel(volume + 10)}
                        className="p-0.5 rounded hover:bg-slate-300/60 active:scale-90 transition-all text-[#313131]"
                        title="Volume Up (+10%)"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>

                      <button 
                        onClick={toggleShuffle}
                        className={`p-0.5 ml-0.5 rounded hover:bg-slate-300/60 active:scale-90 transition-all ${isShuffle ? 'text-blue-700 bg-slate-300/80' : 'text-slate-600'}`}
                        title={isShuffle ? "Shuffle On" : "Shuffle Off"}
                      >
                        <Shuffle className="w-2.5 h-2.5" />
                      </button>

                      <button 
                        onClick={toggleRepeat}
                        className={`p-0.5 rounded hover:bg-slate-300/60 active:scale-90 transition-all ${isRepeat ? 'text-blue-700 bg-slate-300/80' : 'text-slate-600'}`}
                        title={isRepeat ? "Repeat On" : "Repeat Off"}
                      >
                        <Repeat className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bar-box">
                  <p className="current-time">{currentTimeStr}</p>
                  <div className="bar">
                    <div className="progress" style={{ width: `${progressWidth}%` }}></div>
                  </div>
                  <p className="duration-time">{durationTimeStr}</p>
                </div>
              </>
            )}

          </div>

          {/* Click Wheel Controls */}
          <div className="controls">
            <button className="menu" onClick={() => { playClickSound(); setShowYtInput(false); setShowPlaylistMenu(prev => !prev); }} title="Playlist Menu">
              MENU
            </button>

            <button className="btn-backward" onClick={prevSong} title="Previous Track">
              <SkipBack className="w-4 h-4" />
            </button>

            <button className="btn-forward" onClick={nextSong} title="Next Track">
              <SkipForward className="w-4 h-4" />
            </button>

            <button className="play-pause-btn" onClick={togglePlayPause} title={isPlaying ? "Pause" : "Play"}>
              {isPlaying ? (
                <Pause className="w-4 h-4" />
              ) : (
                <Play className="w-4 h-4" />
              )}
            </button>
          </div>

        </div>
      )}

    </div>
  </div>
  );
}
