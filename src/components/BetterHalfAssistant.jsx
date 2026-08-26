import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Send,
  ArrowUpRight,
  Copy,
  Check,
  RotateCcw,
  Maximize2,
  Minimize2,
  Mic,
  MicOff,
  Terminal,
  Zap
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateBetterHalfResponse, speakBetterHalfText } from '../utils/betterHalfEngine';

export default function BetterHalfAssistant({ onSelectProject }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isImmersive, setIsImmersive] = useState(false);
  const [isTtsEnabled, setIsTtsEnabled] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: `Hello. I'm Ishant's **AI Portfolio Co-pilot** ⚡\n\nI have complete visibility into his engineering stack, products, content distribution engines, and personal branding playbooks.\n\nAsk me anything or use your mic to talk.`,
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

  // Web Speech Recognition Setup
  useEffect(() => {
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        if (transcript) handleSendMessage(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

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

    setTimeout(() => {
      const response = generateBetterHalfResponse(query);
      const botMsg = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        suggestedProjects: response.suggestedProjects || [],
        action: response.action || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);

      if (isTtsEnabled) {
        speakBetterHalfText(response.text);
      }
    }, 450);
  };

  const handleCopyEmail = (email) => {
    navigator.clipboard.writeText(email);
    setCopiedEmail(true);
    confetti({ particleCount: 35, spread: 50, origin: { y: 0.8 } });
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: `Session reset. Ready to answer questions about Ishant's work and stack. ⚡`,
        suggestedProjects: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const quickPrompts = [
    '🚀 Featured Apps',
    '💻 Tech Stack',
    '📈 Content Strategy',
    '📩 Direct Contact'
  ];

  return (
    <>
      {/* =========================================================================
          ZEN / FULL-FOCUS CO-PILOT MODE
          ========================================================================= */}
      {isImmersive && (
        <div className="fixed inset-0 z-[2000] bg-zinc-950/95 backdrop-blur-3xl flex flex-col justify-between p-4 sm:p-8 font-sans text-zinc-100 animate-fadeIn overflow-hidden">
          
          {/* LOUNGE HEADER */}
          <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-3 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-cyan-400">
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono font-bold text-base tracking-tight text-white">
                  <span>AI PORTFOLIO CO-PILOT</span>
                  <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] uppercase font-mono font-bold text-cyan-400">
                    ZEN VIEW
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Real-time Knowledge Sync</span>
                </div>
              </div>
            </div>

            {/* Header Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                className={`p-2.5 rounded-xl border font-mono text-xs transition-all ${
                  isTtsEnabled
                    ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                    : 'bg-zinc-900 border-zinc-800 text-zinc-500'
                }`}
                title={isTtsEnabled ? 'Voice Output ON' : 'Voice Output OFF'}
              >
                {isTtsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              <button
                onClick={() => setIsImmersive(false)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-xs font-bold transition-all cursor-pointer"
              >
                <Minimize2 className="w-4 h-4 text-cyan-400" />
                <span>MINIMIZE</span>
              </button>
            </div>
          </div>

          {/* LOUNGE MAIN STAGE */}
          <div className="w-full max-w-6xl mx-auto flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 my-4 overflow-hidden">
            
            {/* STAGE LEFT: MINIMAL VISUALIZER */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-8 rounded-2xl bg-zinc-900/40 border border-zinc-800 shadow-2xl relative overflow-hidden">
              <div className="relative w-36 h-36 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-inner mb-6">
                <div className={`w-28 h-28 rounded-full border border-cyan-500/30 flex items-center justify-center ${isTyping ? 'animate-pulse' : ''}`}>
                  <Zap className="w-10 h-10 text-cyan-400" />
                </div>
                <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping pointer-events-none" />
              </div>

              <span className="font-mono text-xs text-zinc-400 mb-6 text-center max-w-xs leading-relaxed">
                {isListening ? 'Listening for speech...' : isTyping ? 'Analyzing portfolio data...' : 'Ready to answer queries.'}
              </span>

              <button
                onClick={toggleMicListening}
                className={`flex items-center gap-2.5 px-5 py-3 rounded-xl font-mono text-xs font-bold transition-all shadow-xl cursor-pointer ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse border border-white/20'
                    : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-700 hover:border-cyan-500/50'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-cyan-400" />}
                <span>{isListening ? 'STOP LISTENING' : 'TALK WITH MIC'}</span>
              </button>
            </div>

            {/* STAGE RIGHT: CHAT */}
            <div className="lg:col-span-8 flex flex-col justify-between rounded-2xl bg-zinc-900/40 border border-zinc-800 p-6 shadow-2xl overflow-hidden">
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 font-sans text-sm scrollbar-thin scrollbar-thumb-zinc-800">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-lg ${
                        msg.sender === 'user'
                          ? 'bg-zinc-800 text-zinc-100 rounded-br-xs border border-zinc-700/50'
                          : 'bg-zinc-950/90 border border-zinc-800 text-zinc-200 rounded-bl-xs'
                      }`}
                    >
                      {msg.sender === 'assistant' && (
                        <div className="flex items-center gap-1.5 mb-2 font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          <Zap className="w-3 h-3 text-cyan-400" />
                          <span>CO-PILOT</span>
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

                      {/* Project suggestions */}
                      {msg.suggestedProjects && msg.suggestedProjects.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-zinc-800 space-y-2">
                          <span className="font-mono text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
                            // FEATURED PROJECT:
                          </span>
                          {msg.suggestedProjects.map((proj) => (
                            <div
                              key={proj.id}
                              onClick={() => {
                                setIsImmersive(false);
                                if (onSelectProject) onSelectProject(proj);
                              }}
                              className="p-3 rounded-xl bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between group"
                            >
                              <div>
                                <span className="font-bold text-xs text-white group-hover:text-cyan-400 transition-colors block">
                                  {proj.title}
                                </span>
                                <span className="font-mono text-[11px] text-zinc-400 line-clamp-1">
                                  {proj.tagline}
                                </span>
                              </div>
                              <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Email Action */}
                      {msg.action && msg.action.type === 'COPY_EMAIL' && (
                        <div className="mt-3 pt-2">
                          <button
                            onClick={() => handleCopyEmail(msg.action.email)}
                            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-cyan-500/50 text-white font-mono text-xs font-bold transition-all active:scale-95 shadow-md"
                          >
                            {copiedEmail ? (
                              <>
                                <Check className="w-4 h-4 text-emerald-400" />
                                <span className="text-emerald-400">COPIED ADDRESS</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 text-cyan-400" />
                                <span>{msg.action.label}</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="font-mono text-[9px] text-zinc-600 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-cyan-400 font-mono font-bold animate-pulse w-max">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                    <span>Processing query...</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* LOUNGE INPUT */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 pt-4 border-t border-zinc-800"
              >
                <input
                  type="text"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  placeholder="Ask about apps, tech stack, or strategy..."
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 focus:outline-none focus:border-zinc-700 text-sm text-zinc-100 placeholder:text-zinc-600 transition-all font-mono text-xs"
                />

                <button
                  type="submit"
                  disabled={!inputQuery.trim()}
                  className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all border border-zinc-700 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-cyan-400" />
                </button>
              </form>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          FLOATING MINIMAL WIDGET BUTTON
          ========================================================================= */}
      {!isOpen && !isImmersive && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="group relative flex items-center gap-3 px-4 py-2.5 rounded-full bg-zinc-950/90 hover:bg-zinc-900 text-zinc-100 border border-zinc-800 hover:border-zinc-700 shadow-2xl backdrop-blur-xl transition-all duration-300 cursor-pointer"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>

            <div className="flex items-center gap-1.5 font-mono text-xs font-bold tracking-wide text-zinc-200">
              <Zap className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition-transform" />
              <span>AI CO-PILOT</span>
            </div>
          </button>
        </div>
      )}

      {/* =========================================================================
          EXPANDED WIDGET PANEL (MINIMAL DARK GLASS)
          ========================================================================= */}
      {isOpen && !isImmersive && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px] sm:w-[420px] h-[560px] max-h-[85vh] bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 shadow-2xl rounded-2xl flex flex-col overflow-hidden animate-fadeIn transition-all">
          
          {/* HEADER */}
          <div className="px-4 py-3 bg-zinc-900/80 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-cyan-400">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-mono font-bold text-xs text-white">
                  <span>AI PORTFOLIO CO-PILOT</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
              </div>
            </div>

            {/* Header Action Tools */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsImmersive(true)}
                title="Zen View"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                title={isTtsEnabled ? 'Mute Audio' : 'Enable Audio'}
                className={`p-1.5 rounded-lg transition-colors ${
                  isTtsEnabled ? 'text-cyan-400 hover:bg-zinc-800' : 'text-zinc-600 hover:text-zinc-400'
                }`}
              >
                {isTtsEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                onClick={handleClearChat}
                title="Reset Chat"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsOpen(false)}
                title="Close"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-zinc-950 text-zinc-200 font-sans text-xs sm:text-sm">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] p-3.5 rounded-xl text-xs leading-relaxed shadow-sm ${
                    msg.sender === 'user'
                      ? 'bg-zinc-800 text-zinc-100 rounded-br-xs border border-zinc-700/60'
                      : 'bg-zinc-900/90 border border-zinc-800/90 text-zinc-200 rounded-bl-xs'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="flex items-center gap-1 mb-1.5 font-mono text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                      <Zap className="w-3 h-3 text-cyan-400" />
                      <span>CO-PILOT</span>
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

                  {msg.suggestedProjects && msg.suggestedProjects.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-zinc-800 space-y-1.5">
                      <span className="font-mono text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">
                        // FEATURED PROJECT:
                      </span>
                      {msg.suggestedProjects.map((proj) => (
                        <div
                          key={proj.id}
                          onClick={() => {
                            if (onSelectProject) onSelectProject(proj);
                          }}
                          className="group p-2 rounded-lg bg-zinc-950/80 hover:bg-zinc-800/80 border border-zinc-800/80 hover:border-zinc-700 transition-all cursor-pointer flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-xs text-white block group-hover:text-cyan-400 transition-colors">
                              {proj.title}
                            </span>
                            <span className="font-mono text-[10px] text-zinc-400 line-clamp-1">
                              {proj.tagline}
                            </span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.action && msg.action.type === 'COPY_EMAIL' && (
                    <div className="mt-2.5 pt-2">
                      <button
                        onClick={() => handleCopyEmail(msg.action.email)}
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-white font-mono text-xs font-bold transition-all active:scale-95"
                      >
                        {copiedEmail ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">COPIED EMAIL</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-cyan-400" />
                            <span>{msg.action.label}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <span className="font-mono text-[9px] text-zinc-600 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 w-max text-xs text-cyan-400 font-mono font-bold animate-pulse">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>Co-pilot thinking...</span>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* QUICK PROMPTS SLIDER */}
          <div className="px-3 py-2 bg-zinc-900/60 border-t border-zinc-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar scrollbar-none">
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-lg bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white font-mono text-[11px] whitespace-nowrap transition-all active:scale-95 cursor-pointer"
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
            className="p-2.5 bg-zinc-900/90 border-t border-zinc-800/80 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleMicListening}
              className={`p-2 rounded-lg transition-all ${
                isListening
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-zinc-950 text-zinc-400 hover:text-cyan-400 border border-zinc-800'
              }`}
              title={isListening ? 'Listening...' : 'Talk with Mic'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask AI Co-pilot..."
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-800 focus:outline-none focus:border-zinc-700 text-xs text-zinc-100 placeholder:text-zinc-500 font-mono transition-all"
            />

            <button
              type="submit"
              disabled={!inputQuery.trim()}
              className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all border border-zinc-700 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}
    </>
  );
}
