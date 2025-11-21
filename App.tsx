import React, { useState, useEffect, useRef } from 'react';
import { CardData, PlayerStats, GameState, GroundingChunk } from './types';
import { INITIAL_STATS, CARDS, MAX_TURNS, CARDS_TO_DRAW, CARDS_TO_PLAY } from './constants';
import { generateTurnCommentary, generateSpeech, connectLiveSession } from './services/geminiService';
import { decodeBase64, decodeAudioData, playAudioBuffer } from './utils/audioUtils';

const App: React.FC = () => {
  // --- Game State ---
  const [turn, setTurn] = useState(1);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [hand, setHand] = useState<CardData[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [history, setHistory] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // --- AI & UI State ---
  const [commentary, setCommentary] = useState<string>("欢迎来到大学！选择3个活动开始你的新学期。");
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // --- Live Session State ---
  const [isLiveOpen, setIsLiveOpen] = useState(false);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const liveSessionRef = useRef<any>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const liveAudioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // --- Refs ---
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Game
  useEffect(() => {
    drawCards();
  }, [turn]);

  const drawCards = () => {
    if (turn > MAX_TURNS) {
      setIsGameOver(true);
      return;
    }
    const shuffled = [...CARDS].sort(() => 0.5 - Math.random());
    setHand(shuffled.slice(0, CARDS_TO_DRAW));
    setSelectedCardIds([]);
  };

  const handleCardSelect = (cardId: string) => {
    if (selectedCardIds.includes(cardId)) {
      setSelectedCardIds(selectedCardIds.filter(id => id !== cardId));
    } else if (selectedCardIds.length < CARDS_TO_PLAY) {
      setSelectedCardIds([...selectedCardIds, cardId]);
    }
  };

  const submitTurn = async () => {
    if (selectedCardIds.length !== CARDS_TO_PLAY) return;

    const playedCards = hand.filter(c => selectedCardIds.includes(c.id));
    
    // Apply effects
    const newStats = { ...stats };
    playedCards.forEach(card => {
      Object.entries(card.effects).forEach(([key, value]) => {
        const k = key as keyof PlayerStats;
        if (value) newStats[k] = Math.max(0, Math.min(100, newStats[k] + value));
      });
    });

    setStats(newStats);
    setHistory(prev => [...prev, `第 ${turn} 周: ${playedCards.map(c => c.title).join(', ')}`]);

    // AI Commentary
    setIsLoadingCommentary(true);
    setCommentary("AI 辅导员正在分析你的选择...");
    setGroundingChunks([]);
    
    try {
      const result = await generateTurnCommentary(playedCards, newStats, turn);
      setCommentary(result.text);
      setGroundingChunks(result.groundingChunks || []);
      
      // Auto-play TTS if desired, or just cache. For now, we wait for user to click Listen.
    } catch (error) {
      console.error(error);
      setCommentary("AI 辅导员暂时掉线了。");
    } finally {
      setIsLoadingCommentary(false);
      setTurn(prev => prev + 1);
    }
  };

  // --- TTS Feature ---
  const handleSpeakCommentary = async () => {
    if (isAudioPlaying || !commentary) return;
    setIsAudioPlaying(true);
    try {
      const base64Audio = await generateSpeech(commentary);
      const audioBytes = decodeBase64(base64Audio);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.onended = () => setIsAudioPlaying(false);
      source.start(0);
    } catch (e) {
      console.error("TTS Error", e);
      setIsAudioPlaying(false);
    }
  };

  // --- Live API Feature ---
  const toggleLiveSession = async () => {
    if (isLiveOpen) {
      // Close Session
      setIsLiveOpen(false);
      setIsLiveConnected(false);
      if (liveSessionRef.current) {
        // Use close() on the session object if available, or simple refresh page logic for safety in prototype
        // However, `session.close` is not standard on the promise wrapper, usually on the session object.
        // We relies on the ref holding the session if we awaited it, or just component unmount cleanup.
        liveSessionRef.current.then((session: any) => session.close && session.close());
      }
      if (outputAudioContextRef.current) {
        outputAudioContextRef.current.close();
        outputAudioContextRef.current = null;
      }
      liveAudioSourcesRef.current.forEach(s => s.stop());
      liveAudioSourcesRef.current.clear();
    } else {
      // Open Session
      setIsLiveOpen(true);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        nextStartTimeRef.current = outputAudioContextRef.current.currentTime;

        const sessionPromise = connectLiveSession({
          onOpen: () => setIsLiveConnected(true),
          onClose: () => {
            setIsLiveConnected(false);
            setIsLiveOpen(false);
          },
          onError: () => setIsLiveConnected(false),
          onAudioData: async (base64) => {
            if (!outputAudioContextRef.current) return;
            
            const ctx = outputAudioContextRef.current;
            // Ensure smooth playback timing
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);

            const audioBuffer = await decodeAudioData(decodeBase64(base64), ctx, 24000, 1);
            const source = playAudioBuffer(audioBuffer, ctx, ctx.destination, nextStartTimeRef.current);
            
            liveAudioSourcesRef.current.add(source);
            source.onended = () => liveAudioSourcesRef.current.delete(source);
            
            nextStartTimeRef.current += audioBuffer.duration;
          }
        }, `当前周次: ${turn}. 状态: ${JSON.stringify(stats)}. 最近行动: ${history.slice(-1)[0] || '无'}.`, stream);
        
        liveSessionRef.current = sessionPromise;
      } catch (err) {
        console.error("Failed to start live session", err);
        setIsLiveOpen(false);
        alert("无法访问麦克风或 API Key 无效。");
      }
    }
  };

  // --- UI Components ---

  const StatBar = ({ label, value, icon, color }: any) => (
    <div className="flex flex-col w-full mb-2">
      <div className="flex justify-between text-xs mb-1 text-slate-300">
        <span className="flex items-center gap-1">{icon} {label}</span>
        <span>{value}%</span>
      </div>
      <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ${color}`} 
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );

  if (isGameOver) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6">
        <h1 className="text-4xl font-bold mb-4">毕业啦！ 🎓</h1>
        <p className="text-lg text-slate-400 mb-8">你度过了精彩的 50 周大学生活。</p>
        <div className="w-full max-w-md space-y-4">
          <div className="p-4 bg-slate-800 rounded-lg">
             <h2 className="text-xl font-bold mb-2">最终成绩单</h2>
             <p>财富: {stats.wealth}</p>
             <p>人脉: {stats.connections}</p>
             <p>成就: {stats.achievements}</p>
             <p>情绪: {stats.mood}</p>
          </div>
        </div>
        <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold">再玩一次</button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-slate-950 shadow-2xl relative overflow-hidden">
      {/* Header Stats */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 z-10">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-bold text-white">大学生模拟器 2025</h1>
          <div className="text-xs font-mono text-slate-400">第 {turn}/{MAX_TURNS} 周</div>
        </div>
        <div className="grid grid-cols-2 gap-x-4">
          <StatBar label="财富" value={stats.wealth} icon="💰" color="bg-emerald-500" />
          <StatBar label="人脉" value={stats.connections} icon="🤝" color="bg-blue-500" />
          <StatBar label="成就" value={stats.achievements} icon="🎓" color="bg-purple-500" />
          <StatBar label="精力" value={stats.energy} icon="⚡" color="bg-yellow-500" />
          <StatBar label="情绪" value={stats.mood} icon="😊" color="bg-pink-500" />
        </div>
      </div>

      {/* Main Game Area */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
        {/* Commentary Bubble */}
        <div className="mb-6 bg-indigo-900/30 border border-indigo-500/30 p-4 rounded-2xl relative">
            <div className="absolute -top-3 left-4 bg-indigo-600 text-xs px-2 py-1 rounded text-white font-bold">
              AI 辅导员
            </div>
            <p className="text-indigo-100 text-sm leading-relaxed mt-2">
              {isLoadingCommentary ? (
                <span className="animate-pulse">思考中...</span>
              ) : commentary}
            </p>
            
            {/* Grounding Sources */}
            {!isLoadingCommentary && groundingChunks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-indigo-500/20">
                <p className="text-xs text-slate-400 mb-1">来源:</p>
                <div className="flex flex-wrap gap-2">
                  {groundingChunks.map((chunk, i) => chunk.web && (
                    <a 
                      key={i} 
                      href={chunk.web.uri} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-indigo-400 hover:underline truncate max-w-full flex items-center gap-1"
                    >
                      🔗 {chunk.web.title}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* TTS Button */}
            {!isLoadingCommentary && (
              <button 
                onClick={handleSpeakCommentary}
                disabled={isAudioPlaying}
                className={`absolute bottom-2 right-2 p-2 rounded-full ${isAudioPlaying ? 'bg-indigo-500 text-white animate-pulse' : 'text-indigo-400 hover:bg-indigo-800/50'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.288a5.25 5.25 0 010 7.424M6.75 8.25l4.72-4.72a.75.75 0 011.28.53v15.88a.75.75 0 01-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.01 9.01 0 012.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75z" />
                </svg>
              </button>
            )}
        </div>

        {/* Cards Grid */}
        <div ref={cardsContainerRef} className="grid grid-cols-2 gap-3 pb-24">
          {hand.map(card => {
            const isSelected = selectedCardIds.includes(card.id);
            return (
              <div 
                key={card.id}
                onClick={() => handleCardSelect(card.id)}
                className={`
                  p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 relative
                  flex flex-col justify-between h-40
                  ${isSelected 
                    ? 'bg-indigo-600 border-indigo-400 shadow-lg shadow-indigo-900/50 scale-105' 
                    : 'bg-slate-800 border-slate-700 hover:border-slate-600 opacity-90'}
                `}
              >
                <div>
                  <div className="text-3xl mb-2">{card.emoji}</div>
                  <h3 className="font-bold text-sm text-white leading-tight mb-1">{card.title}</h3>
                  <p className="text-xs text-slate-400 leading-snug">{card.description}</p>
                </div>
                <div className="mt-2 flex gap-1 flex-wrap">
                  {Object.entries(card.effects).slice(0, 2).map(([key, val]) => (
                    <span key={key} className={`text-[10px] px-1.5 py-0.5 rounded ${(val as number) > 0 ? 'bg-emerald-900/50 text-emerald-300' : 'bg-red-900/50 text-red-300'}`}>
                      {key === 'wealth' ? '财富' : key === 'connections' ? '人脉' : key === 'achievements' ? '成就' : key === 'energy' ? '精力' : '情绪'} {(val as number) > 0 ? '+' : ''}{val as number}
                    </span>
                  ))}
                </div>
                
                {isSelected && (
                  <div className="absolute -top-2 -right-2 bg-white text-indigo-900 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs border-2 border-indigo-900">
                    {selectedCardIds.indexOf(card.id) + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-0 left-0 w-full p-4 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent z-20 flex items-center justify-between gap-4">
         <button 
           onClick={toggleLiveSession}
           className={`
             p-4 rounded-full shadow-lg transition-all
             ${isLiveOpen ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-slate-800 hover:bg-slate-700 border border-slate-600'}
           `}
           title="咨询学业导师"
         >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-white">
             <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
           </svg>
         </button>

         <button
            onClick={submitTurn}
            disabled={selectedCardIds.length !== CARDS_TO_PLAY || isLoadingCommentary}
            className={`
              flex-1 py-4 rounded-2xl font-bold text-lg tracking-wide shadow-lg transition-all
              ${selectedCardIds.length === CARDS_TO_PLAY 
                ? 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-900/50' 
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
            `}
         >
           {isLoadingCommentary ? '分析中...' : `结束第 ${turn} 周`}
         </button>
      </div>

      {/* Live Session Overlay */}
      {isLiveOpen && (
        <div className="absolute bottom-24 left-4 bg-slate-800 p-4 rounded-xl border border-slate-600 shadow-2xl w-64 z-30 animate-fade-in-up">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-white">学业导师</h3>
            <div className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-green-500' : 'bg-yellow-500 animate-ping'}`} />
          </div>
          <p className="text-xs text-slate-400 mb-3">
            {isLiveConnected ? "正在听... 请提问！" : "正在连接导师..."}
          </p>
          <div className="h-8 flex items-center justify-center gap-1">
             {[1,2,3,4,5].map(i => (
               <div 
                 key={i} 
                 className={`w-1 bg-indigo-400 rounded-full transition-all duration-75 ${isLiveConnected ? 'animate-music-bar' : 'h-1'}`}
                 style={{ height: isLiveConnected ? `${Math.random() * 20 + 4}px` : '4px', animationDelay: `${i * 0.1}s` }} 
               />
             ))}
          </div>
        </div>
      )}
      
      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 24px; }
        }
        .animate-music-bar {
          animation: music-bar 0.5s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default App;