import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  X, 
  Sparkles, 
  ListMusic, 
  Disc
} from 'lucide-react';

const YoutubeIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

// Default YouTube Playlist provided by user
const DEFAULT_PLAYLIST_ID = 'PLa-RnRky6wsc';
const DEFAULT_TITLE = "Ishant's Portfolio Playlist";

export default function CornerMusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSpeechBubble, setShowSpeechBubble] = useState(true);
  const [showIframeDrawer, setShowIframeDrawer] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);

  // Custom playlist state
  const [playlistInput, setPlaylistInput] = useState('');
  const [currentPlaylistId, setCurrentPlaylistId] = useState(DEFAULT_PLAYLIST_ID);
  const [playlistTitle, setPlaylistTitle] = useState(DEFAULT_TITLE);
  const [customVideoId, setCustomVideoId] = useState(null);

  const iframeRef = useRef(null);

  // Function to extract YouTube playlist ID or Video ID from user input URL
  const parseYouTubeUrl = (url) => {
    if (!url) return null;
    
    // Check for playlist parameter (list=...)
    const listMatch = url.match(/[?&]list=([^#&?]+)/);
    if (listMatch && listMatch[1]) {
      return { type: 'playlist', id: listMatch[1] };
    }

    // Check for standard YouTube video ID
    const videoMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (videoMatch && videoMatch[1]) {
      return { type: 'video', id: videoMatch[1] };
    }

    // Raw ID fallback
    if (/^[A-Za-z0-9_-]{10,40}$/.test(url.trim())) {
      return { type: 'playlist', id: url.trim() };
    }

    return null;
  };

  const handleApplyCustomPlaylist = (e) => {
    e.preventDefault();
    const result = parseYouTubeUrl(playlistInput);
    if (result) {
      if (result.type === 'playlist') {
        setCurrentPlaylistId(result.id);
        setCustomVideoId(null);
        setPlaylistTitle(`Custom YouTube Playlist`);
      } else {
        setCustomVideoId(result.id);
        setCurrentPlaylistId(null);
        setPlaylistTitle(`Custom YouTube Video`);
      }
      setIsPlaying(true);
      setShowSettingsModal(false);
      setPlaylistInput('');
    } else {
      alert('Please enter a valid YouTube Playlist link, Video URL, or Playlist ID.');
    }
  };

  // Helper to send postMessage commands to YT iFrame
  const postYTCommand = (func, args = []) => {
    if (iframeRef.current && iframeRef.current.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func, args }),
        '*'
      );
    }
  };

  const togglePlay = () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);
    if (nextState) {
      postYTCommand('playVideo');
    } else {
      postYTCommand('pauseVideo');
    }
  };

  const handleNextTrack = () => {
    postYTCommand('nextVideo');
    setIsPlaying(true);
  };

  const handlePrevTrack = () => {
    postYTCommand('previousVideo');
    setIsPlaying(true);
  };

  const toggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (nextMute) {
      postYTCommand('mute');
    } else {
      postYTCommand('unMute');
      postYTCommand('setVolume', [volume]);
    }
  };

  const handleVolumeChange = (e) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    if (newVol === 0) {
      setIsMuted(true);
      postYTCommand('mute');
    } else {
      setIsMuted(false);
      postYTCommand('unMute');
      postYTCommand('setVolume', [newVol]);
    }
  };

  // Construct iframe embed source URL
  let embedUrl = '';
  if (customVideoId) {
    embedUrl = `https://www.youtube-nocookie.com/embed/${customVideoId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&origin=${encodeURIComponent(window.location.origin)}`;
  } else {
    embedUrl = `https://www.youtube-nocookie.com/embed/videoseries?list=${currentPlaylistId}&enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&origin=${encodeURIComponent(window.location.origin)}`;
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end font-sans selection:bg-amber-400 selection:text-slate-900 pointer-events-auto">
      
      {/* 1. Welcome Speech Bubble */}
      {showSpeechBubble && (
        <div className="mb-3 relative animate-bounce-subtle max-w-[280px] bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-start gap-2.5">
          <div className="p-1 rounded-full bg-amber-400/20 text-amber-400 shrink-0 mt-0.5">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium leading-relaxed">
            <span className="font-bold text-amber-300">Hi 👋</span> Play my playlist while you scroll my portfolio!
          </div>
          <button 
            onClick={() => setShowSpeechBubble(false)}
            className="text-slate-400 hover:text-white transition-colors p-0.5 ml-1 shrink-0"
            title="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Speech bubble tail pointing to player */}
          <div className="absolute -bottom-1.5 right-6 w-3 h-3 bg-slate-900 border-r border-b border-slate-700/80 rotate-45" />
        </div>
      )}

      {/* 2. Hidden YouTube IFrame Engine / Visible Drawer */}
      <div 
        className={`transition-all duration-300 overflow-hidden mb-2 rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md shadow-2xl ${
          showIframeDrawer ? 'w-[320px] h-[200px] opacity-100' : 'w-0 h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs font-mono text-slate-300">
          <span className="flex items-center gap-1.5 text-amber-400 font-bold">
            <YoutubeIcon className="w-3.5 h-3.5 text-red-500" /> YouTube Playlist Live Stream
          </span>
          <button 
            onClick={() => setShowIframeDrawer(false)}
            className="hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="YouTube Music Player"
          className="w-full h-[calc(100%-29px)] border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Off-screen hidden player for audio mode when drawer is closed */}
      {!showIframeDrawer && (
        <iframe
          ref={iframeRef}
          src={embedUrl}
          title="YouTube Music Player Audio Engine"
          className="w-1 h-1 absolute top-0 left-0 opacity-0 pointer-events-none"
          allow="autoplay; encrypted-media"
        />
      )}

      {/* 3. Main Corner Music Player Card */}
      <div className="bg-slate-900/95 backdrop-blur-md text-white border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 w-[300px] sm:w-[320px]">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800/60 border-b border-slate-700/50">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="relative flex items-center justify-center">
              <Disc className={`w-4 h-4 text-amber-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
              {isPlaying && (
                <span className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
              )}
            </div>
            <span className="font-mono text-[11px] font-bold text-slate-200 uppercase tracking-wider truncate">
              Portfolio Vibe Player
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Embedded YouTube video preview toggle */}
            <button
              onClick={() => setShowIframeDrawer(!showIframeDrawer)}
              className={`p-1.5 rounded-lg transition-colors text-xs flex items-center gap-1 font-mono ${
                showIframeDrawer ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
              title="Toggle YouTube Video Stream"
            >
              <YoutubeIcon className="w-3.5 h-3.5 text-red-400" />
            </button>

            {/* Custom Playlist Settings */}
            <button
              onClick={() => setShowSettingsModal(!showSettingsModal)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Embed Custom YouTube Playlist"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Minimize/Collapse */}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
              title={isCollapsed ? "Expand Player" : "Collapse Player"}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Player Body (Visible when not collapsed) */}
        {!isCollapsed && (
          <div className="p-4 space-y-3">
            
            {/* Track Info & Equalizer */}
            <div className="flex items-center justify-between gap-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <ListMusic className="w-4 h-4 text-amber-400" />
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-slate-100 truncate">{playlistTitle}</p>
                  <p className="text-[10px] font-mono text-slate-400 truncate">
                    {isPlaying ? 'Playing live background stream' : 'Paused - Click play to listen'}
                  </p>
                </div>
              </div>

              {/* Animated Sound Wave Equalizer */}
              <div className="flex items-end gap-0.5 h-4 shrink-0 px-1">
                {[40, 80, 50, 90, 30].map((heightPct, idx) => (
                  <span
                    key={idx}
                    className={`w-0.5 rounded-full bg-amber-400 transition-all duration-300 ${
                      isPlaying ? 'animate-pulse' : 'opacity-40'
                    }`}
                    style={{
                      height: isPlaying ? `${heightPct}%` : '4px',
                      animationDelay: `${idx * 150}ms`
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Playback Controls & Volume */}
            <div className="flex items-center justify-between gap-2 pt-1">
              
              {/* Transport Buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrevTrack}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                  title="Previous Track"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                <button
                  onClick={togglePlay}
                  className={`p-2.5 rounded-xl font-bold transition-all active:scale-95 shadow-md flex items-center justify-center ${
                    isPlaying 
                      ? 'bg-amber-400 text-slate-950 hover:bg-amber-300' 
                      : 'bg-white text-slate-900 hover:bg-slate-200'
                  }`}
                  title={isPlaying ? "Pause Playlist" : "Play Playlist"}
                >
                  {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                </button>

                <button
                  onClick={handleNextTrack}
                  className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 active:scale-95 transition-all"
                  title="Next Track"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>

              {/* Volume Slider */}
              <div className="flex items-center gap-1.5 bg-slate-800/60 px-2.5 py-1.5 rounded-xl border border-slate-700/50">
                <button 
                  onClick={toggleMute}
                  className="text-slate-400 hover:text-amber-400 transition-colors"
                  title={isMuted ? "Unmute" : "Mute"}
                >
                  {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
              </div>

            </div>

          </div>
        )}

        {/* Collapsed Pill Summary (Shown when collapsed) */}
        {isCollapsed && (
          <div 
            onClick={() => setIsCollapsed(false)}
            className="p-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/40 transition-colors"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <div className={`p-1.5 rounded-full bg-amber-400/20 text-amber-400 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }}>
                <Disc className="w-4 h-4" />
              </div>
              <span className="text-xs font-mono text-slate-200 truncate">
                {isPlaying ? 'Playing Playlist' : 'Music Paused'}
              </span>
            </div>
            <button 
              onClick={(e) => { e.stopPropagation(); togglePlay(); }}
              className="p-1.5 rounded-lg bg-amber-400 text-slate-950 font-bold hover:bg-amber-300 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
          </div>
        )}

      </div>

      {/* 4. Settings Modal to Embed Custom YouTube Playlist */}
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white space-y-4 relative">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <YoutubeIcon className="w-5 h-5 text-red-500" />
              <h3 className="text-lg">Embed Your YouTube Playlist</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste any YouTube Playlist URL, Video Link, or Playlist ID below to stream your custom music while browsing the portfolio.
            </p>

            <form onSubmit={handleApplyCustomPlaylist} className="space-y-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1">
                  YouTube Playlist or Video URL:
                </label>
                <input
                  type="text"
                  value={playlistInput}
                  onChange={(e) => setPlaylistInput(e.target.value)}
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 transition-colors font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-mono transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs font-mono transition-colors shadow-md"
                >
                  Load & Play Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
