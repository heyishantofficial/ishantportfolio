import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Square, Mic, MicOff, Volume2, VolumeX, Sparkles, Sliders, RefreshCw, Upload, Image as ImageIcon, Camera, Download, Eye, Zap, Code, Shield } from 'lucide-react';

export const DEFAULT_PARAMS = {
  renderMode: "dither",
  bgMode: "none",
  bgBlur: 12,
  bgOpacity: 90,
  cellSize: 9,
  coverage: 100,
  invert: false,
  styleBlend: "source-over",
  charSet: "standard",
  customChars: "",
  brightness: 0,
  contrast: 158,
  edgeEmphasis: 0,
  density: 20,
  toneCurve: [
    { x: 0, y: 0 },
    { x: 1, y: 1 }
  ],
  tint: "#3ca6ff",
  tintOpacity: 0,
  overlayBlend: "multiply",
  saturation: 100,
  grayscale: 0,
  blurType: "off",
  blurAmount: 35,
  blurAngle: 0,
  directionalBothSides: false,
  tiltFocus: 35,
  tiltPosition: 50,
  tiltFeather: 15,
  lensFocus: 40,
  blurCenterX: 50,
  blurCenterY: 50,
  progressivePosition: 55,
  progressiveReverse: false,
  pfx: {
    vignette: { enabled: false, intensity: 38 },
    scanLines: { enabled: false, intensity: 40 },
    chromatic: { enabled: false, intensity: 15 },
    bloom: { enabled: false, intensity: 25 },
    filmGrain: { enabled: false, intensity: 30 },
    glitch: { enabled: false, intensity: 20 },
    pixelate: { enabled: false, intensity: 15 },
    halftone: { enabled: false, intensity: 20 },
    filmDust: { enabled: false, intensity: 20 }
  },
  animated: true,
  animStyle: "shimmer",
  animSpeed: { enabled: true, intensity: 100 },
  animIntensity: { enabled: true, intensity: 60 },
  lights: {
    enabled: true,
    points: [
      { x: 0.42, y: 0.38, radius: 80, intensity: 90, color: "#3ca6ff" },
      { x: 0.58, y: 0.38, radius: 80, intensity: 90, color: "#3ca6ff" }
    ]
  },
  mask: {
    enabled: false,
    tool: "freehand",
    brushSize: 30,
    showOverlay: false,
    invert: false,
    dataUrl: null,
    shapes: []
  }
};

const CHAR_SETS = {
  standard: " .:-=+*#%@",
  blocks: " ░▒▓█",
  minimal: " .+#",
  matrix: " 01日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ",
  digits: " 0123456789",
  ascii_dense: " `'.^:\";~-_+i>l!I?/\\|()1{}[]rcvunxzjftLCJUYXZO0Qoahkbdpqwm*WMB8&%$#@",
  binary: " 01"
};

export default function ElectricGazeAscii({ 
  params = DEFAULT_PARAMS, 
  onParamsChange, 
  imageSrc = "/ascii-editor/demos/generated/ref-002.webp" 
}) {
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const imageRef = useRef(null);
  const videoRef = useRef(null);

  // Audio / Speech State
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechText, setSpeechText] = useState("I am the Electric Gaze. Look into the grid and hear my cybernetic voice.");
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [speechRate, setSpeechRate] = useState(0.95);
  const [speechPitch, setSpeechPitch] = useState(1.1);
  const [micActive, setMicActive] = useState(false);
  const [sourceType, setSourceType] = useState('image'); // 'image' | 'webcam'
  const [customImage, setCustomImage] = useState(null);

  // Speech Lip Sync Audio Value (0.0 to 1.0)
  const audioVolumeRef = useRef(0);
  const micAnalyserRef = useRef(null);

  // Load Image
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = customImage || imageSrc;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => {
      // Downstream fallback canvas drawing if image fails to load
      const fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.width = 600;
      fallbackCanvas.height = 600;
      const ctx = fallbackCanvas.getContext('2d');
      const grad = ctx.createRadialGradient(300, 250, 20, 300, 300, 350);
      grad.addColorStop(0, '#3ca6ff');
      grad.addColorStop(0.3, '#10172a');
      grad.addColorStop(1, '#020617');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      // Face silhouette
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(300, 320, 140, 190, 0, 0, Math.PI * 2);
      ctx.fill();

      // Glowing Eyes
      ctx.fillStyle = '#3ca6ff';
      ctx.shadowColor = '#3ca6ff';
      ctx.shadowBlur = 25;
      ctx.beginPath();
      ctx.arc(240, 280, 20, 0, Math.PI * 2);
      ctx.arc(360, 280, 20, 0, Math.PI * 2);
      ctx.fill();

      // Mouth
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(250, 410, 100, 15);

      const fallbackImg = new Image();
      fallbackImg.src = fallbackCanvas.toDataURL();
      fallbackImg.onload = () => {
        imageRef.current = fallbackImg;
        setImageLoaded(true);
      };
    };
  }, [imageSrc, customImage]);

  // Load Voices for Text-To-Speech
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        setVoices(availableVoices);
        if (availableVoices.length > 0 && !selectedVoice) {
          const preferred = availableVoices.find(v => v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Zira') || v.lang.startsWith('en')) || availableVoices[0];
          setSelectedVoice(preferred.name);
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  // Web Speech Speak Function
  const speakText = useCallback((textToSpeak) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-Speech is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(textToSpeak || speechText);
    
    if (selectedVoice) {
      const voiceObj = voices.find(v => v.name === selectedVoice);
      if (voiceObj) utterance.voice = voiceObj;
    }
    
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      audioVolumeRef.current = 0;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      audioVolumeRef.current = 0;
    };

    // Simulate phoneme volume animation loop while speaking
    let intervalId;
    const startSimulatedVolume = () => {
      intervalId = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          audioVolumeRef.current = 0.3 + Math.random() * 0.7;
        } else {
          audioVolumeRef.current = 0;
          clearInterval(intervalId);
        }
      }, 80);
    };

    window.speechSynthesis.speak(utterance);
    startSimulatedVolume();
  }, [speechText, selectedVoice, voices, speechRate, speechPitch]);

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    audioVolumeRef.current = 0;
  };

  // Microphone Input Listener
  const toggleMicrophone = async () => {
    if (micActive) {
      setMicActive(false);
      if (micAnalyserRef.current) {
        micAnalyserRef.current.context.close();
        micAnalyserRef.current = null;
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      micAnalyserRef.current = analyser;
      setMicActive(true);

      const updateMicVolume = () => {
        if (!micAnalyserRef.current) return;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        audioVolumeRef.current = Math.min(1.0, avg / 80.0);
        requestAnimationFrame(updateMicVolume);
      };
      updateMicVolume();
    } catch (err) {
      console.error("Microphone access error:", err);
      alert("Could not access microphone.");
    }
  };

  // Custom Image Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Webcam Start/Stop
  const toggleWebcam = async () => {
    if (sourceType === 'webcam') {
      setSourceType('image');
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 640 } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setSourceType('webcam');
    } catch (err) {
      alert("Could not access webcam: " + err.message);
    }
  };

  // Main Render Loop
  useEffect(() => {
    if (!imageLoaded && sourceType === 'image') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    const offscreen = offscreenCanvasRef.current;
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true });

    let animationTime = 0;
    const matrixColumns = [];

    const render = () => {
      animationTime += 0.03;
      const width = canvas.width || 600;
      const height = canvas.height || 600;

      if (offscreen.width !== width || offscreen.height !== height) {
        offscreen.width = width;
        offscreen.height = height;
      }

      // 1. Draw source photo into offscreen canvas
      offCtx.clearRect(0, 0, width, height);

      if (sourceType === 'webcam' && videoRef.current && videoRef.current.readyState >= 2) {
        offCtx.drawImage(videoRef.current, 0, 0, width, height);
      } else if (imageRef.current) {
        offCtx.drawImage(imageRef.current, 0, 0, width, height);
      }

      const imgData = offCtx.getImageData(0, 0, width, height);
      const pixels = imgData.data;

      // 2. Clear Main Canvas & Draw Background Layer
      ctx.clearRect(0, 0, width, height);

      if (params.bgMode === "solid") {
        ctx.fillStyle = params.tint || "#000000";
        ctx.fillRect(0, 0, width, height);
      } else if (params.bgMode === "original" || params.bgMode === "blurred") {
        ctx.save();
        ctx.globalAlpha = (params.bgOpacity ?? 90) / 100;
        if (params.bgMode === "blurred" && params.bgBlur > 0) {
          ctx.filter = `blur(${params.bgBlur}px)`;
        }
        ctx.drawImage(offscreen, 0, 0, width, height);
        ctx.restore();
      }

      // 3. Grid Sampling & Cell Primitives
      const cellSize = Math.max(3, params.cellSize || 9);
      const cols = Math.floor(width / cellSize);
      const rows = Math.floor(height / cellSize);
      const coverage = (params.coverage ?? 100) / 100;
      const density = (params.density ?? 20) / 20;
      const invert = params.invert || false;
      const edgeEmphasis = params.edgeEmphasis || 0;

      let charString = CHAR_SETS[params.charSet] || CHAR_SETS.standard;
      if (params.charSet === "custom" && params.customChars) {
        charString = params.customChars;
      }

      const animIntensityVal = (params.animIntensity?.enabled ? params.animIntensity.intensity : 60) / 100;
      const animSpeedVal = (params.animSpeed?.enabled ? params.animSpeed.intensity : 100) / 100;
      const speechVolume = audioVolumeRef.current;

      if (params.renderMode === "matrix" && matrixColumns.length !== cols) {
        for (let i = 0; i < cols; i++) {
          matrixColumns[i] = Math.random() * rows;
        }
      }

      ctx.save();
      ctx.globalCompositeOperation = params.styleBlend || "source-over";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (coverage < 1.0 && Math.random() > coverage) continue;

          const cx = Math.floor((c + 0.5) * cellSize);
          const cy = Math.floor((r + 0.5) * cellSize);
          const pixelIndex = (cy * width + cx) * 4;

          let red = pixels[pixelIndex] || 0;
          let green = pixels[pixelIndex + 1] || 0;
          let blue = pixels[pixelIndex + 2] || 0;

          if (edgeEmphasis > 0 && c > 0 && c < cols - 1 && r > 0 && r < rows - 1) {
            const leftIdx = (cy * width + (cx - cellSize)) * 4;
            const rightIdx = (cy * width + (cx + cellSize)) * 4;
            const edgeVal = Math.abs(pixels[leftIdx] - pixels[rightIdx]);
            red = Math.min(255, red + edgeVal * (edgeEmphasis / 50));
            green = Math.min(255, green + edgeVal * (edgeEmphasis / 50));
            blue = Math.min(255, blue + edgeVal * (edgeEmphasis / 50));
          }

          let lum = (0.299 * red + 0.587 * green + 0.114 * blue) / 255;
          if (invert) lum = 1.0 - lum;

          if (params.brightness) lum = Math.min(1, Math.max(0, lum + params.brightness / 200));
          if (params.contrast) {
            const factor = (259 * (params.contrast + 255)) / (255 * (259 - params.contrast));
            lum = Math.min(1, Math.max(0, factor * (lum - 0.5) + 0.5));
          }

          let animOffset = 0;
          if (params.animated) {
            const timeFactor = animationTime * animSpeedVal * 3;
            if (params.animStyle === "wave") {
              animOffset = Math.sin(c * 0.2 + timeFactor) * 0.15 * animIntensityVal;
            } else if (params.animStyle === "pulse") {
              animOffset = Math.sin(timeFactor) * 0.2 * animIntensityVal;
            } else if (params.animStyle === "shimmer") {
              animOffset = Math.sin(c * 0.5 + r * 0.5 + timeFactor * 2) * 0.1 * animIntensityVal;
            } else if (params.animStyle === "ripple") {
              const dist = Math.hypot(c - cols / 2, r - rows / 2);
              animOffset = Math.sin(dist * 0.3 - timeFactor * 2) * 0.2 * animIntensityVal;
            } else if (params.animStyle === "flicker") {
              animOffset = (Math.random() - 0.5) * 0.25 * animIntensityVal;
            }
          }

          const normX = c / cols;
          const normY = r / rows;
          const isMouthRegion = normX >= 0.40 && normX <= 0.60 && normY >= 0.62 && normY <= 0.78;
          const isEyeRegion = (normX >= 0.35 && normX <= 0.45 && normY >= 0.33 && normY <= 0.43) ||
                             (normX >= 0.55 && normX <= 0.65 && normY >= 0.33 && normY <= 0.43);

          if (speechVolume > 0) {
            if (isMouthRegion) {
              const mouthPulse = Math.sin(animationTime * 20 + c) * speechVolume * 0.4;
              lum = Math.min(1.0, lum + 0.3 * speechVolume + mouthPulse);
            }
            if (isEyeRegion) {
              lum = Math.min(1.0, lum + 0.4 * speechVolume);
              green = Math.min(255, green + 100 * speechVolume);
              blue = Math.min(255, blue + 150 * speechVolume);
            }
          }

          const finalLum = Math.min(1, Math.max(0, lum + animOffset));
          const drawX = c * cellSize;
          const drawY = r * cellSize;
          const halfCell = cellSize / 2;

          let finalR = red;
          let finalG = green;
          let finalB = blue;

          if (params.grayscale > 0) {
            const gray = 0.299 * red + 0.587 * green + 0.114 * blue;
            const factor = params.grayscale / 100;
            finalR = finalR * (1 - factor) + gray * factor;
            finalG = finalG * (1 - factor) + gray * factor;
            finalB = finalB * (1 - factor) + gray * factor;
          }

          if (params.saturation !== 100) {
            const gray = 0.299 * finalR + 0.587 * finalG + 0.114 * finalB;
            const factor = params.saturation / 100;
            finalR = gray + (finalR - gray) * factor;
            finalG = gray + (finalG - gray) * factor;
            finalB = gray + (finalB - gray) * factor;
          }

          const cellColor = `rgb(${Math.floor(finalR)}, ${Math.floor(finalG)}, ${Math.floor(finalB)})`;
          ctx.fillStyle = cellColor;
          ctx.strokeStyle = cellColor;

          switch (params.renderMode) {
            case "characters": {
              const glyphIdx = Math.floor(finalLum * (charString.length - 1));
              const glyph = charString[glyphIdx] || charString[0];
              ctx.font = `${Math.floor(cellSize * density)}px monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(glyph, drawX + halfCell, drawY + halfCell);
              break;
            }
            case "dither": {
              const ditherThreshold = (c % 2 === r % 2) ? 0.3 : 0.7;
              if (finalLum > ditherThreshold) {
                const dotRadius = (cellSize / 2) * (finalLum * density);
                ctx.beginPath();
                ctx.arc(drawX + halfCell, drawY + halfCell, dotRadius, 0, Math.PI * 2);
                ctx.fill();
              }
              break;
            }
            case "mosaic": {
              ctx.fillRect(drawX, drawY, cellSize, cellSize);
              break;
            }
            case "pixel": {
              ctx.fillRect(drawX + 1, drawY + 1, cellSize - 2, cellSize - 2);
              break;
            }
            case "dots": {
              const radius = (cellSize / 2) * finalLum * density;
              ctx.beginPath();
              ctx.arc(drawX + halfCell, drawY + halfCell, Math.max(1, radius), 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            case "cross": {
              const arm = (cellSize / 2) * finalLum * density;
              ctx.lineWidth = Math.max(1, finalLum * 3);
              ctx.beginPath();
              ctx.moveTo(drawX + halfCell - arm, drawY + halfCell);
              ctx.lineTo(drawX + halfCell + arm, drawY + halfCell);
              ctx.moveTo(drawX + halfCell, drawY + halfCell - arm);
              ctx.lineTo(drawX + halfCell, drawY + halfCell + arm);
              ctx.stroke();
              break;
            }
            case "diamond": {
              const size = halfCell * finalLum * density;
              ctx.beginPath();
              ctx.moveTo(drawX + halfCell, drawY + halfCell - size);
              ctx.lineTo(drawX + halfCell + size, drawY + halfCell);
              ctx.lineTo(drawX + halfCell, drawY + halfCell + size);
              ctx.lineTo(drawX + halfCell - size, drawY + halfCell);
              ctx.closePath();
              ctx.fill();
              break;
            }
            case "voxel": {
              const vSize = cellSize * finalLum * density;
              ctx.fillRect(drawX, drawY, vSize, vSize);
              ctx.fillStyle = "rgba(255,255,255,0.3)";
              ctx.fillRect(drawX, drawY, vSize, 2);
              ctx.fillStyle = "rgba(0,0,0,0.4)";
              ctx.fillRect(drawX + vSize - 2, drawY, 2, vSize);
              break;
            }
            case "lego": {
              ctx.fillRect(drawX + 1, drawY + 1, cellSize - 2, cellSize - 2);
              ctx.fillStyle = "rgba(255,255,255,0.4)";
              ctx.beginPath();
              ctx.arc(drawX + halfCell, drawY + halfCell, halfCell * 0.4, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            case "mixed": {
              if (finalLum > 0.7) {
                ctx.font = `${Math.floor(cellSize * density)}px monospace`;
                ctx.fillText("#", drawX + halfCell, drawY + halfCell);
              } else if (finalLum > 0.4) {
                ctx.beginPath();
                ctx.arc(drawX + halfCell, drawY + halfCell, halfCell * finalLum, 0, Math.PI * 2);
                ctx.fill();
              } else {
                ctx.fillRect(drawX + 2, drawY + 2, cellSize - 4, cellSize - 4);
              }
              break;
            }
            case "lines": {
              const len = cellSize * finalLum * density;
              ctx.lineWidth = Math.max(1, finalLum * 3);
              ctx.beginPath();
              ctx.moveTo(drawX + halfCell - len / 2, drawY + halfCell);
              ctx.lineTo(drawX + halfCell + len / 2, drawY + halfCell);
              ctx.stroke();
              break;
            }
            case "diagonal": {
              ctx.lineWidth = Math.max(1, finalLum * 3);
              ctx.beginPath();
              ctx.moveTo(drawX, drawY + cellSize);
              ctx.lineTo(drawX + cellSize, drawY);
              ctx.stroke();
              break;
            }
            case "braille": {
              const brailleCode = 0x2800 + Math.floor(finalLum * 255);
              ctx.font = `${Math.floor(cellSize * density)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(String.fromCharCode(brailleCode), drawX + halfCell, drawY + halfCell);
              break;
            }
            case "disco": {
              const discoRadius = halfCell * (0.5 + Math.sin(animationTime * 5 + c) * 0.5) * finalLum;
              ctx.fillStyle = `hsl(${(c * 10 + animationTime * 50) % 360}, 100%, 50%)`;
              ctx.beginPath();
              ctx.arc(drawX + halfCell, drawY + halfCell, Math.max(1, discoRadius), 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            case "hexdump": {
              const hexVal = Math.floor(finalLum * 15).toString(16).toUpperCase();
              ctx.font = `${Math.floor(cellSize * 0.9)}px monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(hexVal, drawX + halfCell, drawY + halfCell);
              break;
            }
            case "matrix": {
              const colY = matrixColumns[c] || 0;
              if (Math.abs(r - Math.floor(colY)) < 1) {
                ctx.fillStyle = "#ffffff";
              } else {
                ctx.fillStyle = `rgba(0, 255, 70, ${finalLum})`;
              }
              const matrixChar = String.fromCharCode(0x30A0 + ((c + r + Math.floor(animationTime * 5)) % 96));
              ctx.font = `${Math.floor(cellSize)}px monospace`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText(matrixChar, drawX + halfCell, drawY + halfCell);

              if (r === 0) {
                matrixColumns[c] = ((matrixColumns[c] || 0) + 0.2 * animSpeedVal) % rows;
              }
              break;
            }
            case "rings": {
              const maxR = halfCell * finalLum * density;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.arc(drawX + halfCell, drawY + halfCell, Math.max(1, maxR), 0, Math.PI * 2);
              ctx.stroke();
              if (maxR > 4) {
                ctx.beginPath();
                ctx.arc(drawX + halfCell, drawY + halfCell, maxR / 2, 0, Math.PI * 2);
                ctx.stroke();
              }
              break;
            }
            case "hearts": {
              ctx.font = `${Math.floor(cellSize * density)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("♥", drawX + halfCell, drawY + halfCell);
              break;
            }
            case "stars": {
              ctx.font = `${Math.floor(cellSize * density)}px sans-serif`;
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText("★", drawX + halfCell, drawY + halfCell);
              break;
            }
            case "hexagons": {
              const hSize = halfCell * finalLum * density;
              ctx.beginPath();
              for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const hx = drawX + halfCell + hSize * Math.cos(angle);
                const hy = drawY + halfCell + hSize * Math.sin(angle);
                if (i === 0) ctx.moveTo(hx, hy);
                else ctx.lineTo(hx, hy);
              }
              ctx.closePath();
              ctx.fill();
              break;
            }
            case "triangles": {
              const tSize = cellSize * finalLum;
              ctx.beginPath();
              ctx.moveTo(drawX + halfCell, drawY + halfCell - tSize / 2);
              ctx.lineTo(drawX + halfCell + tSize / 2, drawY + halfCell + tSize / 2);
              ctx.lineTo(drawX + halfCell - tSize / 2, drawY + halfCell + tSize / 2);
              ctx.closePath();
              ctx.fill();
              break;
            }
            case "bubbles": {
              ctx.fillStyle = `rgba(${Math.floor(finalR)}, ${Math.floor(finalG)}, ${Math.floor(finalB)}, ${finalLum * 0.7})`;
              ctx.beginPath();
              ctx.arc(drawX + halfCell, drawY + halfCell, halfCell * finalLum * 1.2, 0, Math.PI * 2);
              ctx.fill();
              break;
            }
            case "hatch": {
              ctx.lineWidth = 1;
              ctx.beginPath();
              ctx.moveTo(drawX, drawY + cellSize);
              ctx.lineTo(drawX + cellSize, drawY);
              if (finalLum > 0.5) {
                ctx.moveTo(drawX, drawY);
                ctx.lineTo(drawX + cellSize, drawY + cellSize);
              }
              ctx.stroke();
              break;
            }
            case "contour": {
              const contourStep = Math.floor(finalLum * 5);
              if (contourStep % 2 === 0) {
                ctx.strokeRect(drawX + 1, drawY + 1, cellSize - 2, cellSize - 2);
              }
              break;
            }
            case "halfblocks": {
              ctx.fillRect(drawX, drawY, cellSize, halfCell);
              ctx.fillStyle = `rgb(${Math.floor(finalR * 0.6)}, ${Math.floor(finalG * 0.6)}, ${Math.floor(finalB * 0.6)})`;
              ctx.fillRect(drawX, drawY + halfCell, cellSize, halfCell);
              break;
            }
            default: {
              ctx.fillRect(drawX, drawY, cellSize, cellSize);
            }
          }
        }
      }
      ctx.restore();

      // 4. Color Tint Overlay
      if (params.tintOpacity > 0 && params.tint) {
        ctx.save();
        ctx.globalCompositeOperation = params.overlayBlend || "multiply";
        ctx.globalAlpha = params.tintOpacity / 100;
        ctx.fillStyle = params.tint;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // 5. Post-Processing FX (PFX Stack)
      const pfx = params.pfx || {};

      if (pfx.bloom?.enabled) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = (pfx.bloom.intensity / 100) * 0.6;
        ctx.filter = "blur(12px)";
        ctx.drawImage(canvas, 0, 0);
        ctx.restore();
      }

      if (pfx.chromatic?.enabled) {
        const offset = Math.max(1, Math.floor((pfx.chromatic.intensity / 100) * 8));
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        ctx.globalAlpha = 0.5;
        ctx.drawImage(canvas, offset, 0, width, height, 0, 0, width, height);
        ctx.drawImage(canvas, -offset, 0, width, height, 0, 0, width, height);
        ctx.restore();
      }

      if (pfx.vignette?.enabled) {
        const vIntensity = (pfx.vignette.intensity / 100);
        ctx.save();
        const vGrad = ctx.createRadialGradient(width / 2, height / 2, width * 0.3, width / 2, height / 2, width * 0.7);
        vGrad.addColorStop(0, "rgba(0,0,0,0)");
        vGrad.addColorStop(1, `rgba(0,0,0,${vIntensity * 0.95})`);
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      if (pfx.scanLines?.enabled) {
        const slIntensity = (pfx.scanLines.intensity / 100) * 0.35;
        ctx.save();
        ctx.fillStyle = `rgba(0,0,0,${slIntensity})`;
        const scanLineOffset = Math.floor(animationTime * 20) % 4;
        for (let y = scanLineOffset; y < height; y += 4) {
          ctx.fillRect(0, y, width, 1.5);
        }
        ctx.restore();
      }

      if (pfx.filmGrain?.enabled) {
        const grainIntensity = (pfx.filmGrain.intensity / 100) * 0.15;
        ctx.save();
        ctx.fillStyle = "#ffffff";
        for (let i = 0; i < 400; i++) {
          const gx = Math.random() * width;
          const gy = Math.random() * height;
          ctx.globalAlpha = Math.random() * grainIntensity;
          ctx.fillRect(gx, gy, 1.5, 1.5);
        }
        ctx.restore();
      }

      if (pfx.glitch?.enabled && Math.random() < (pfx.glitch.intensity / 100) * 0.3) {
        ctx.save();
        const sliceY = Math.random() * height;
        const sliceH = Math.random() * 30 + 10;
        const sliceX = (Math.random() - 0.5) * (pfx.glitch.intensity / 100) * 40;
        ctx.drawImage(canvas, 0, sliceY, width, sliceH, sliceX, sliceY, width, sliceH);
        ctx.restore();
      }

      if (pfx.halftone?.enabled) {
        const htIntensity = (pfx.halftone.intensity / 100) * 0.3;
        ctx.save();
        ctx.fillStyle = `rgba(0,0,0,${htIntensity})`;
        for (let hy = 0; hy < height; hy += 12) {
          for (let hx = 0; hx < width; hx += 12) {
            ctx.beginPath();
            ctx.arc(hx, hy, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
      }

      if (pfx.filmDust?.enabled) {
        const dustIntensity = (pfx.filmDust.intensity / 100);
        ctx.save();
        ctx.strokeStyle = `rgba(255,255,255,${dustIntensity * 0.4})`;
        ctx.lineWidth = 0.8;
        if (Math.random() < dustIntensity * 0.4) {
          const sx = Math.random() * width;
          ctx.beginPath();
          ctx.moveTo(sx, 0);
          ctx.lineTo(sx + (Math.random() - 0.5) * 10, height);
          ctx.stroke();
        }
        ctx.restore();
      }

      // 6. Point Lights
      if (params.lights?.enabled && params.lights.points) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        params.lights.points.forEach(point => {
          const lx = point.x * width;
          const ly = point.y * height;
          const lRadius = point.radius || 80;
          const lIntensity = (point.intensity || 90) / 100;
          const lGrad = ctx.createRadialGradient(lx, ly, 0, lx, ly, lRadius);
          lGrad.addColorStop(0, point.color || "#3ca6ff");
          lGrad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.globalAlpha = lIntensity;
          ctx.fillStyle = lGrad;
          ctx.beginPath();
          ctx.arc(lx, ly, lRadius, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // SPEECH SOUNDWAVE RINGS OVERLAY WHEN TALKING
      if (speechVolume > 0) {
        ctx.save();
        ctx.globalCompositeOperation = "screen";
        const centerX = width * 0.5;
        const centerY = height * 0.45;
        const numRings = 3;
        for (let rIdx = 1; rIdx <= numRings; rIdx++) {
          const ringRadius = (animationTime * 80 * rIdx + speechVolume * 60) % (width * 0.5);
          const ringOpacity = Math.max(0, 1 - ringRadius / (width * 0.5)) * speechVolume * 0.7;
          ctx.strokeStyle = `rgba(60, 166, 255, ${ringOpacity})`;
          ctx.lineWidth = 2 + speechVolume * 3;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [imageLoaded, params, sourceType]);

  const downloadCanvasImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = 'electric-gaze-ascii.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <div className="flex flex-col items-center justify-center relative bg-slate-900/60 p-4 rounded-xl border border-slate-800/80 w-full">
      
      {/* Top Header Badge */}
      <div className="w-full flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
          </span>
          <h2 className="font-bold tracking-wide text-lg text-white font-mono flex items-center gap-2">
            ELECTRIC GAZE <span className="text-xs px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">CANVAS2D ENGINE</span>
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={downloadCanvasImage}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1 transition-all"
            title="Download PNG snapshot"
          >
            <Download className="w-3.5 h-3.5" /> Snapshot
          </button>
        </div>
      </div>

      {/* Canvas Display Frame */}
      <div className="relative group rounded-xl overflow-hidden shadow-2xl border-2 border-cyan-500/40 bg-black flex items-center justify-center max-w-full" style={{ width: 600, height: 600 }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          className="w-full h-full object-contain cursor-crosshair"
        />

        <video ref={videoRef} className="hidden" playsInline muted />

        {isSpeaking && (
          <div className="absolute top-4 left-4 bg-cyan-950/80 backdrop-blur-md border border-cyan-500/50 px-3 py-1.5 rounded-full flex items-center gap-2 text-cyan-300 font-mono text-xs animate-pulse">
            <Volume2 className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span>AI VOICE ACTIVE (TALKING...)</span>
          </div>
        )}
      </div>

      {/* BOTTOM: "MAKE HER SPEAK" Interactive Audio Controller */}
      <div className="w-full mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-mono text-sm font-bold text-slate-200">TALKING AVATAR (SPEECH SYNTHESIS)</span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMicrophone}
              className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                micActive 
                  ? 'bg-rose-600 text-white animate-pulse' 
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {micActive ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              {micActive ? 'Mic Active' : 'Mic React'}
            </button>

            <button
              onClick={toggleWebcam}
              className={`px-3 py-1 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
                sourceType === 'webcam'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              {sourceType === 'webcam' ? 'Live Webcam' : 'Use Webcam'}
            </button>

            <label className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all">
              <Upload className="w-3.5 h-3.5" />
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Speech Text Input Bar */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={speechText}
            onChange={(e) => setSpeechText(e.target.value)}
            placeholder="Type what you want her to say..."
            className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
          />
          {isSpeaking ? (
            <button
              onClick={stopSpeaking}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg"
            >
              <Square className="w-3.5 h-3.5" /> STOP
            </button>
          ) : (
            <button
              onClick={() => speakText(speechText)}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-600/30"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> SPEAK
            </button>
          )}
        </div>

        {/* Preset Speech Lines */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-mono text-slate-400">Presets:</span>
          {[
            "I am Electric Gaze. The digital revolution is now.",
            "Neural sync established. Electric field nominal.",
            "Welcome to 21st century ASCII art synthesis.",
            "Speak your command into the matrix."
          ].map((preset, pIdx) => (
            <button
              key={pIdx}
              onClick={() => {
                setSpeechText(preset);
                speakText(preset);
              }}
              className="px-2 py-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[11px] font-mono text-cyan-300 rounded transition-all truncate max-w-[220px]"
            >
              "{preset}"
            </button>
          ))}
        </div>

        {/* Speech Voice & Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs font-mono pt-1">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Voice:</span>
            <select
              value={selectedVoice || ''}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none"
            >
              {voices.map((v) => (
                <option key={v.name} value={v.name}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Pitch:</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speechPitch}
              onChange={(e) => setSpeechPitch(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-500"
            />
            <span className="w-8 text-right text-slate-300">{speechPitch}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">Speed:</span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speechRate}
              onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-500"
            />
            <span className="w-8 text-right text-slate-300">{speechRate}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
