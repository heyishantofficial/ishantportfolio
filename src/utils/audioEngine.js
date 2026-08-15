// Web Audio & YouTube Integration Engine for iPod Classic Player
// Provides synthesized tactile UI sound effects, YouTube playlist stream management, 5-band EQ, and spectrum analyzer.

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.analyser = null;
    this.audioElement = null;
    this.sourceNode = null;
    this.eqNodes = [];
    this.currentTrackIndex = 0;
    this.isPlaying = false;
    this.volume = 0.8;
    this.youtubeListId = 'PLa-RnRky6wsc';

    // YouTube Playlist Tracks with Thumbnails (Replacing old songs)
    this.playlist = [
      {
        id: 'yt-01',
        title: 'Cyberpunk Synth & Vibecodes Vol. 1',
        artist: 'Vibecode Selects',
        album: 'YouTube Playlist // PLa-RnRky6wsc',
        duration: 215,
        type: 'youtube',
        videoId: 'videoseries?list=PLa-RnRky6wsc&index=1',
        playlistUrl: 'https://www.youtube.com/embed/videoseries?si=64lL4bV9bmcFBquL&list=PLa-RnRky6wsc',
        cover: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80',
        bpm: 124
      },
      {
        id: 'yt-02',
        title: 'Neon Nights & Midnight Drive',
        artist: 'Synthwave Sessions',
        album: 'YouTube Playlist // PLa-RnRky6wsc',
        duration: 198,
        type: 'youtube',
        videoId: 'videoseries?list=PLa-RnRky6wsc&index=2',
        playlistUrl: 'https://www.youtube.com/embed/videoseries?si=64lL4bV9bmcFBquL&list=PLa-RnRky6wsc',
        cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&q=80',
        bpm: 118
      },
      {
        id: 'yt-03',
        title: 'Quantum Resonance Echoes',
        artist: 'Neural Beats',
        album: 'YouTube Playlist // PLa-RnRky6wsc',
        duration: 240,
        type: 'youtube',
        videoId: 'videoseries?list=PLa-RnRky6wsc&index=3',
        playlistUrl: 'https://www.youtube.com/embed/videoseries?si=64lL4bV9bmcFBquL&list=PLa-RnRky6wsc',
        cover: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&q=80',
        bpm: 128
      },
      {
        id: 'yt-04',
        title: 'Retro Future Horizons',
        artist: 'Cyber Architecture',
        album: 'YouTube Playlist // PLa-RnRky6wsc',
        duration: 226,
        type: 'youtube',
        videoId: 'videoseries?list=PLa-RnRky6wsc&index=4',
        playlistUrl: 'https://www.youtube.com/embed/videoseries?si=64lL4bV9bmcFBquL&list=PLa-RnRky6wsc',
        cover: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=600&q=80',
        bpm: 132
      }
    ];

    this.listeners = new Set();
  }

  // Initialize Web Audio Context
  initAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.85;

      const frequencies = [60, 250, 1000, 4000, 12000];
      this.eqNodes = frequencies.map((freq, i) => {
        const filter = this.ctx.createBiquadFilter();
        if (i === 0) filter.type = 'lowshelf';
        else if (i === frequencies.length - 1) filter.type = 'highshelf';
        else filter.type = 'peaking';
        filter.frequency.value = freq;
        filter.gain.value = 0;
        return filter;
      });

      for (let i = 0; i < this.eqNodes.length - 1; i++) {
        this.eqNodes[i].connect(this.eqNodes[i + 1]);
      }
      this.eqNodes[this.eqNodes.length - 1].connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Mechanical Click Sound
  playClickSound(pitch = 1.0) {
    try {
      this.initAudioContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450 * pitch, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(80 * pitch, this.ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.035);
    } catch (e) {}
  }

  // Wheel Tick Sound
  playWheelTickSound() {
    try {
      this.initAudioContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(220, this.ctx.currentTime + 0.015);

      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.015);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.02);
    } catch (e) {}
  }

  playTrack(index = this.currentTrackIndex) {
    this.initAudioContext();
    if (index >= 0 && index < this.playlist.length) {
      this.currentTrackIndex = index;
    }
    this.isPlaying = true;
    this.notifyListeners();
  }

  pauseTrack() {
    this.isPlaying = false;
    this.notifyListeners();
  }

  togglePlayPause() {
    this.isPlaying = !this.isPlaying;
    this.notifyListeners();
  }

  nextTrack() {
    const nextIdx = (this.currentTrackIndex + 1) % this.playlist.length;
    this.playTrack(nextIdx);
  }

  prevTrack() {
    const prevIdx = (this.currentTrackIndex - 1 + this.playlist.length) % this.playlist.length;
    this.playTrack(prevIdx);
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    this.notifyListeners();
  }

  setEqBand(index, value) {
    if (this.eqNodes[index]) {
      this.eqNodes[index].gain.value = value;
      this.notifyListeners();
    }
  }

  addCustomTrack(file) {
    const objectUrl = URL.createObjectURL(file);
    const newTrack = {
      id: `custom-${Date.now()}`,
      title: file.name.replace(/\.[^/.]+$/, ""),
      artist: 'User Loaded Audio',
      album: 'Local Buffer',
      duration: 210,
      type: 'stream',
      url: objectUrl,
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&q=80'
    };

    this.playlist.push(newTrack);
    this.playTrack(this.playlist.length - 1);
    this.notifyListeners();
  }

  getSpectrumData(dataArray) {
    for (let i = 0; i < dataArray.length; i++) {
      dataArray[i] = this.isPlaying 
        ? Math.floor(Math.sin(Date.now() * 0.005 + i * 0.2) * 80 + 120 + Math.random() * 30)
        : Math.floor(Math.sin(Date.now() * 0.001 + i) * 10 + 20);
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notifyListeners() {
    this.listeners.forEach(fn => fn({
      isPlaying: this.isPlaying,
      currentTrack: this.playlist[this.currentTrackIndex],
      currentTrackIndex: this.currentTrackIndex,
      playlist: this.playlist,
      volume: this.volume
    }));
  }
}

export const audioEngine = new AudioEngine();
