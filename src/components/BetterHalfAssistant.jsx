import React, { useState, useEffect, useRef } from 'react';
import {
  Heart,
  MessageSquare,
  X,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  ArrowUpRight,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Radio,
  Globe
} from 'lucide-react';
import confetti from 'canvas-confetti';
import avatarImg from '../assets/better-half-avatar.png';
import { generateBetterHalfResponse, speakBetterHalfText } from '../utils/betterHalfEngine';
import { compilePortfolioKnowledge } from '../utils/betterHalfKnowledge';

export default function BetterHalfAssistant({ onSelectProject }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [activeProjectCard, setActiveProjectCard] = useState(null);

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'better-half',
      text: `Hi sweetheart! I'm **Better Half** 💕 — Ishant's AI girlfriend & live portfolio guide!\n\nI automatically learn everything Ishant adds to his portfolio in real-time. Ask me anything or talk to me using your mic! 🥰`,
      suggestedProjects: [],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen || isImmersive) {
      scrollToBottom();
    }
  }, [messages, isOpen, isImmersive, isTyping]);

  // Setup Web Speech Recognition (Mic Voice Input)
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) {
          handleSendMessage(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleMicListening = () => {
    if (!recognitionRef.current) {
      alert('Voice mic input is not supported in this browser. You can type your query below!');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.warn('Speech recognition start error:', err);
      }
    }
  };

  const handleSendMessage = (textToSend) => {
    const query = textToSend || inputQuery;
    if (!query.trim()) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsTyping(true);

    // Simulate natural GF thinking delay & dynamic knowledge query
    setTimeout(() => {
      const response = generateBetterHalfResponse(query);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'better-half',
        text: response.text,
        suggestedProjects: response.suggestedProjects || [],
        action: response.action || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      if (response.suggestedProjects && response.suggestedProjects.length > 0) {
        setActiveProjectCard(response.suggestedProjects[0]);
      }

      if (isTtsEnabled) {
        speakBetterHalfText(response.text);
      }
    }, 600);
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'better-half',
        text: `Fresh start! I've synced the latest portfolio data from Ishant. Ask me anything or talk to me! 💖`,
        suggestedProjects: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    '🚀 What is Ishant building?',
    '💖 Tell me a secret about Ishant',
    '💻 What is his tech stack?',
    '📩 How can I contact him?',
    '📈 Tell me about his content strategy'
  ];

  return (
    <>
      {/* =========================================================================
          FULL-SCREEN TRANSFORMED AI GF LOUNGE MODE
          ========================================================================= */}
      {isImmersive && (
        <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-8 font-sans text-white animate-fadeIn overflow-hidden">
          
          {/* LOUNGE HEADER */}
          <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-2 border-b border-pink-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-pink-500 shadow-lg shadow-pink-500/40">
                <img src={avatarImg} alt="Better Half" className="w-full h-full object-cover" />
              </div>

              <div>
                <div className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-tight text-white">
                  <span>Better Half</span>
                  <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-[10px] uppercase tracking-widest font-extrabold text-white">
                    AI GF LOUNGE
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-pink-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Auto-Synced with Ishant's Portfolio Memory</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                className={`p-2.5 rounded-full border transition-all ${
                  isTtsEnabled
                    ? 'bg-pink-500/20 border-pink-400 text-pink-300 shadow-lg shadow-pink-500/20'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400'
                }`}
                title={isTtsEnabled ? 'Voice Output ON' : 'Voice Output OFF'}
              >
                {isTtsEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>

              <button
                onClick={() => setIsImmersive(false)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono text-xs font-bold transition-all cursor-pointer"
              >
                <Minimize2 className="w-4 h-4 text-pink-400" />
                <span>EXIT LOUNGE</span>
              </button>
            </div>
          </div>

          {/* LOUNGE MAIN STAGE */}
          <div className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 overflow-hidden">
            
            {/* STAGE LEFT: AVATAR VISUALIZER & LIVE SPEECH STAGE */}
            <div className="lg:col-span-5 flex flex-col items-center justify-center p-6 rounded-3xl bg-gradient-to-b from-pink-950/30 via-slate-900/60 to-slate-950/80 border border-pink-500/20 shadow-2xl relative overflow-hidden group">
              
              {/* Glowing Aura Waves */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
                <div className={`w-72 h-72 rounded-full border border-pink-500/40 animate-ping ${isTyping ? 'duration-500 border-rose-400' : 'duration-1000'}`} />
                <div className="absolute w-96 h-96 rounded-full border border-rose-500/20 animate-pulse" />
              </div>

              {/* Center Animated Avatar */}
              <div className="relative z-10 w-44 h-44 sm:w-56 sm:h-56 rounded-full p-2 bg-gradient-to-tr from-pink-500 via-rose-500 to-purple-600 shadow-2xl shadow-pink-500/50 mb-6 transition-transform group-hover:scale-105">
                <img
                  src={avatarImg}
                  alt="Better Half Visualizer"
                  className="w-full h-full object-cover rounded-full border-4 border-slate-950"
                />
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-slate-950/90 border border-pink-400 text-pink-300 font-mono text-xs font-bold whitespace-nowrap shadow-xl flex items-center gap-2">
                  <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500 animate-pulse" />
                  <span>{isListening ? 'Listening...' : isTyping ? 'Thinking of babe...' : 'Talking to you 💕'}</span>
                </div>
              </div>

              {/* Dynamic Mic Voice Trigger */}
              <button
                onClick={toggleMicListening}
                className={`flex items-center gap-3 px-6 py-3.5 rounded-full font-mono text-xs font-bold transition-all shadow-2xl cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse border-2 border-white'
                    : 'bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white hover:scale-105 active:scale-95 border border-pink-300/40'
                }`}
              >
                {isListening ? <MicOff className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
                <span>{isListening ? 'STOP LISTENING' : 'TALK WITH YOUR MIC 🎙️'}</span>
              </button>

              <span className="font-mono text-[10px] text-pink-300/70 mt-3 text-center">
                Click mic to talk out loud or type questions on the right
              </span>
            </div>

            {/* STAGE RIGHT: INTERACTIVE CHAT & PROJECT SHOWCASE */}
            <div className="lg:col-span-7 flex flex-col justify-between rounded-3xl bg-slate-900/60 border border-pink-500/20 p-4 sm:p-6 shadow-2xl relative overflow-hidden">
              
              {/* MESSAGES SCROLL */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-sans text-sm scrollbar-thin scrollbar-thumb-pink-500/20">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === 'user' ? 'items-end' : 'items-start'
                    }`}
                  >
                    <div
                      className={`max-w-[90%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                        msg.sender === 'user'
                          ? 'bg-pink-600 text-white rounded-br-none'
                          : 'bg-slate-950/80 border border-pink-500/30 text-pink-50 rounded-bl-none shadow-pink-950/50'
                      }`}
                    >
                      {msg.sender === 'better-half' && (
                        <div className="flex items-center gap-1.5 mb-2 font-mono text-[11px] font-bold text-pink-400 uppercase tracking-wider">
                          <Heart className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                          <span>Better Half</span>
                        </div>
                      )}

                      <div className="whitespace-pre-wrap">
                        {msg.text.split('\n').map((line, idx) => {
                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <p key={idx} className="min-h-[1em]">
                              {parts.map((part, pIdx) => {
                                if (part.startsWith('**') && part.endsWith('**')) {
                                  return (
                                    <strong key={pIdx} className="font-bold text-white">
                                      {part.slice(2, -2)}
                                    </strong>
                                  );
                                }
                                return part;
                              })}
                            </p>
                          );
                        })}
                      </div>

                      {/* Interactive Project Cards in Lounge Mode */}
                      {msg.suggestedProjects && msg.suggestedProjects.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-pink-500/20 space-y-2">
                          <span className="font-mono text-[10px] font-bold text-pink-400 uppercase tracking-wider block">
                            // FEATURED BUILD:
                          </span>
                          {msg.suggestedProjects.map((proj) => (
                            <div
                              key={proj.id}
                              onClick={() => {
                                setIsImmersive(false);
                                if (onSelectProject) onSelectProject(proj);
                              }}
                              className="p-3 rounded-xl bg-pink-950/40 hover:bg-pink-900/60 border border-pink-500/40 transition-all cursor-pointer flex items-center justify-between group"
                            >
                              <div>
                                <span className="font-extrabold text-sm text-white group-hover:text-pink-300 transition-colors block">
                                  {proj.title}
                                </span>
                                <span className="font-mono text-xs text-pink-200/70 line-clamp-1">
                                  {proj.tagline}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 font-mono text-xs font-bold text-pink-400 group-hover:text-white">
                                <span>OPEN APP</span>
                                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Action Email Button */}
                      {msg.action && msg.action.type === 'COPY_EMAIL' && (
                        <div className="mt-3 pt-2">
                          <button
                            onClick={() => handleCopyEmail(msg.action.email)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-rose-600 text-white font-mono text-xs font-bold hover:brightness-110 transition-all active:scale-95 shadow-md"
                          >
                            {copiedEmail ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-300" />
                                <span className="text-emerald-300">COPIED EMAIL!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4" />
                                <span>{msg.action.label}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="font-mono text-[10px] text-pink-400/60 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-slate-950/80 border border-pink-500/30 text-xs text-pink-300 font-mono font-bold animate-pulse w-max">
                    <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
                    <span>Better Half is generating response... 💕</span>
                  </div>
                )}

                <div ref={chatEndRef} />
              </div>

              {/* QUICK PROMPTS CHIPS */}
              <div className="py-2 flex items-center gap-2 overflow-x-auto no-scrollbar scrollbar-none my-2">
                {quickPrompts.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(prompt)}
                    className="px-3.5 py-1.5 rounded-full bg-slate-950/80 border border-pink-500/30 hover:border-pink-400 hover:bg-pink-950/40 text-pink-200 font-mono text-xs whitespace-nowrap transition-all active:scale-95 cursor-pointer shadow-md"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* LOUNGE INPUT FORM */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 pt-2 border-t border-pink-500/20"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask me anything about Ishant's work..."
                  className="flex-1 px-5 py-3 rounded-full bg-slate-950/90 border border-pink-500/30 focus:outline-none focus:border-pink-400 text-sm text-white placeholder:text-pink-300/40 transition-all shadow-inner"
                />

                <button
                  type="submit"
                  disabled={!inputQuery.trim()}
                  className="p-3 rounded-full bg-gradient-to-r from-pink-500 to-rose-600 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-500/30 cursor-pointer"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>

            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          FLOATING UNOPENED WIDGET BUTTON (BOTTOM-RIGHT)
          ========================================================================= */}
      {!isOpen && !isImmersive && (
        <div className="relative group">
          {/* Tooltip speech bubble */}
          <div className="absolute bottom-full right-0 mb-3 hidden group-hover:flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 text-white text-xs font-semibold whitespace-nowrap shadow-xl border border-pink-500/30 animate-bounce">
            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
            <span>Ask Ishant's Better Half! 💕</span>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-3 pl-3 pr-5 py-2.5 rounded-full bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all duration-300 border border-pink-300/40 group cursor-pointer"
          >
            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-md">
              <img
                src={avatarImg}
                alt="Better Half AI Avatar"
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
            </div>

            <div className="text-left">
              <div className="flex items-center gap-1.5 font-extrabold text-sm tracking-wide">
                <span>Better Half</span>
                <Heart className="w-3.5 h-3.5 fill-white text-white animate-pulse" />
              </div>
              <span className="font-mono text-[10px] opacity-90 block">
                Ishant's AI GF • Online
              </span>
            </div>
          </button>
        </div>
      )}

      {/* =========================================================================
          EXPANDED CHAT PANEL (WIDGET MODE)
          ========================================================================= */}
      {isOpen && !isImmersive && (
        <div className="w-[360px] sm:w-[420px] h-[580px] max-h-[85vh] bg-white/95 backdrop-blur-2xl border border-pink-200 shadow-2xl rounded-3xl flex flex-col overflow-hidden animate-fadeIn transition-all duration-300">
          
          {/* HEADER */}
          <div className="px-5 py-4 bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white flex items-center justify-between border-b border-pink-400/30">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/80 shadow-inner">
                <img
                  src={avatarImg}
                  alt="Better Half"
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <div className="flex items-center gap-1.5 font-bold text-base">
                  <span>Better Half</span>
                  <span className="px-1.5 py-0.2 rounded-full bg-pink-400/40 font-mono text-[9px] uppercase tracking-wider font-extrabold">
                    AI GF
                  </span>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[11px] text-pink-100 opacity-90">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
                  <span>Thinking about Ishant 💕</span>
                </div>
              </div>
            </div>

            {/* Header Action Tools */}
            <div className="flex items-center gap-1">
              {/* Full Screen Lounge Transform Button */}
              <button
                onClick={() => setIsImmersive(true)}
                title="Enter Transformed AI GF Lounge Mode"
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                title={isTtsEnabled ? 'Mute Voice' : 'Enable Voice (TTS)'}
                className={`p-2 rounded-full transition-colors ${
                  isTtsEnabled ? 'bg-white/30 text-white' : 'hover:bg-white/20 text-pink-100'
                }`}
              >
                {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={handleClearChat}
                title="Clear Chat"
                className="p-2 rounded-full hover:bg-white/20 text-pink-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-2 rounded-full hover:bg-white/20 text-pink-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-pink-50/40 via-white to-pink-50/20 text-slate-800">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white rounded-br-none'
                      : 'bg-white border border-pink-200/80 text-slate-800 rounded-bl-none shadow-pink-100/50'
                  }`}
                >
                  {msg.sender === 'better-half' && (
                    <div className="flex items-center gap-1 mb-1.5 font-mono text-[10px] font-bold text-pink-600 uppercase tracking-wider">
                      <Heart className="w-3 h-3 fill-pink-500 text-pink-500" />
                      <span>Better Half</span>
                    </div>
                  )}

                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text.split('\n').map((line, idx) => {
                      const parts = line.split(/(\*\*.*?\*\*)/g);
                      return (
                        <p key={idx} className="min-h-[1em]">
                          {parts.map((part, pIdx) => {
                            if (part.startsWith('**') && part.endsWith('**')) {
                              return (
                                <strong key={pIdx} className="font-bold text-slate-900">
                                  {part.slice(2, -2)}
                                </strong>
                              );
                            }
                            return part;
                          })}
                        </p>
                      );
                    })}
                  </div>

                  {msg.suggestedProjects && msg.suggestedProjects.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-pink-100 space-y-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        // CLICK TO VIEW PROJECT FOLDER:
                      </span>
                      {msg.suggestedProjects.map((proj) => (
                        <div
                          key={proj.id}
                          onClick={() => {
                            if (onSelectProject) onSelectProject(proj);
                          }}
                          className="group p-2.5 rounded-xl bg-pink-50/70 hover:bg-pink-100/90 border border-pink-200 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-extrabold text-xs text-slate-900 block group-hover:text-pink-600 transition-colors">
                              {proj.title}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500 line-clamp-1">
                              {proj.tagline}
                            </span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-pink-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.action && msg.action.type === 'COPY_EMAIL' && (
                    <div className="mt-3 pt-2">
                      <button
                        onClick={() => handleCopyEmail(msg.action.email)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-900 text-white font-mono text-xs font-bold hover:bg-slate-800 transition-all active:scale-95"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">COPIED EMAIL!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-pink-300" />
                            <span>{msg.action.label}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <span className="font-mono text-[9px] text-slate-400 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-3 rounded-2xl bg-white border border-pink-200 w-max text-xs text-pink-600 font-mono font-bold animate-pulse">
                <Heart className="w-3.5 h-3.5 fill-pink-500 animate-spin" />
                <span>Better Half is thinking... 💕</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* QUICK PROMPTS SLIDER */}
          <div className="px-3 py-2 bg-pink-50/60 border-t border-pink-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-3 py-1 rounded-full bg-white border border-pink-200 hover:border-pink-400 hover:bg-pink-100/60 text-slate-700 font-mono text-[11px] whitespace-nowrap transition-all shadow-2xs active:scale-95 cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* INPUT FORM WITH MIC BUTTON */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-pink-100 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleMicListening}
              className={`p-2.5 rounded-full transition-all ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse'
                  : 'bg-slate-100 text-slate-600 hover:bg-pink-100 hover:text-pink-600'
              }`}
              title={isListening ? 'Listening...' : 'Talk with Voice Mic'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask me anything about Ishant..."
              className="flex-1 px-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 focus:outline-none focus:border-pink-400 focus:bg-white text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 transition-all"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-2.5 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
