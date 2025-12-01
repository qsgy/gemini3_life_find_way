import React, { useState, useEffect, useRef } from 'react';
import { CardData, PlayerStats, GroundingChunk, AppSettings } from './types';
import { INITIAL_STATS, CARDS, MAX_TURNS, CARDS_TO_DRAW, CARDS_TO_PLAY } from './constants';
import { generateTurnCommentary, speakText, getCounselorAdvice } from './services/geminiService';

const App: React.FC = () => {
  // --- Game State ---
  const [turn, setTurn] = useState(1);
  const [stats, setStats] = useState<PlayerStats>(INITIAL_STATS);
  const [hand, setHand] = useState<CardData[]>([]);
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);

  // --- Settings State ---
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    autoPlayTTS: false,
    soundEffects: true,
  });

  // --- Commentary & UI State ---
  const [commentary, setCommentary] = useState<string>("欢迎来到大学！我是你的AI辅导员。请选择3个活动开始你的新学期。");
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [isLoadingCommentary, setIsLoadingCommentary] = useState(false);
  const [isAdviceOpen, setIsAdviceOpen] = useState(false);
  const [adviceText, setAdviceText] = useState("");

  // --- Refs ---
  const cardsContainerRef = useRef<HTMLDivElement>(null);

  // Initialize Game
  useEffect(() => {
    drawCards();
  }, [turn]);

  // Auto-play TTS effect
  useEffect(() => {
    if (settings.autoPlayTTS && commentary && !isLoadingCommentary && turn > 1) {
       speakText(commentary);
    }
  }, [commentary, isLoadingCommentary, turn, settings.autoPlayTTS]);

  const drawCards = () => {
    if (turn > MAX_TURNS) {
      setIsGameOver(true);
      return;
    }
    // 简单的权重随机或完全随机
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
    // Removed history setting to avoid TS unused variable error

    // Generate Commentary (Local)
    setIsLoadingCommentary(true);
    setGroundingChunks([]);
    
    try {
      // Removed 'turn' argument as it is not used in the service function
      const result = await generateTurnCommentary(playedCards, newStats);
      setCommentary(result.text);
      setGroundingChunks(result.groundingChunks || []);
    } catch (error) {
      console.error(error);
      setCommentary("辅导员去开会了，暂时没空理你。");
    } finally {
      setIsLoadingCommentary(false);
      setTurn(prev => prev + 1);
    }
  };

  const handleManualTTS = () => {
    speakText(commentary);
  };

  const handleGetAdvice = async () => {
    setIsAdviceOpen(true);
    setAdviceText("正在思考...");
    const text = await getCounselorAdvice();
    setAdviceText(text);
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

  const SettingsModal = () => (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-800 p-6 rounded-2xl w-80 shadow-2xl border border-slate-700">
        <h2 className="text-xl font-bold mb-6 text-white flex items-center gap-2">
          ⚙️ 游戏设置
        </h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between">
            <span className="text-slate-300">自动播放语音</span>
            <button 
              onClick={() => setSettings(s => ({ ...s, autoPlayTTS: !s.autoPlayTTS }))}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${settings.autoPlayTTS ? 'bg-indigo-500' : 'bg-slate-600'}`}
            >
              <div className={`w-4 h-4 bg-white rounded-full transition-transform ${settings.autoPlayTTS ? 'translate-x-6' : ''}`} />
            </button>
          </div>
        </div>

        <div className="text-xs text-slate-500 mb-6 bg-slate-900/50 p-3 rounded border border-slate-700">
           <p className="mb-1 font-bold text-slate400">关于游戏:</p>
           本游戏现已完全本地化，无需联网 API 即可畅玩。
           <br/>
           支持 GitHub Pages / Cloudflare 部署。
        </div>

        <button 
          onClick={() => setIsSettingsOpen(false)}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg font-bold text-white transition-colors"
        >
          关闭
        </button>
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
      {/* Settings Modal */}
      {isSettingsOpen && <SettingsModal />}

      {/* Header Stats */}
      <div className="p-4 bg-slate-900 border-b border-slate-800 z-10 relative">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lg font-bold text-white">大学生模拟器 2025</h1>
          <div className="flex items-center gap-3">
             <div className="text-xs font-mono text-slate-400">第 {turn}/{MAX_TURNS} 周</div>
             <button onClick={() => setIsSettingsOpen(true)} className="text-slate-400 hover:text-white transition-colors">
               ⚙️
             </button>
          </div>
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
              辅导员
            </div>
            <p className="text-indigo-100 text-sm leading-relaxed mt-2 min-h-[3rem]">
              {isLoadingCommentary ? (
                <span className="animate-pulse">正在批改作业...</span>
              ) : commentary}
            </p>
            
            {/* Grounding Sources (Mocked) */}
            {!isLoadingCommentary && groundingChunks.length > 0 && (
              <div className="mt-3 pt-3 border-t border-indigo-500/20">
                <p className="text-xs text-slate-400 mb-1">相关资讯:</p>
                <div className="flex flex-wrap gap-2">
                  {groundingChunks.map((chunk, i) => chunk.web && (
                    <a 
                      key={i} 
                      href={chunk.web.uri} 
                      className="text-xs text-indigo-400 hover:underline truncate max-w-full flex items-center gap-1 cursor-pointer"
                      onClick={(e) => e.preventDefault()} // 阻止跳转，因为是假链接
                      title="模拟链接"
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
                onClick={handleManualTTS}
                className={`absolute bottom-2 right-2 p-2 rounded-full text-indigo-400 hover:bg-indigo-800/50`}
                title="播放语音"
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
           onClick={handleGetAdvice}
           className={`
             p-4 rounded-full shadow-lg transition-all bg-yellow-600 hover:bg-yellow-500 text-white
           `}
           title="辅导员锦囊"
         >
           💡
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

      {/* Advice Overlay */}
      {isAdviceOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 flex items-end justify-center p-4" onClick={() => setIsAdviceOpen(false)}>
           <div className="bg-slate-800 w-full max-w-md p-6 rounded-t-2xl shadow-2xl animate-fade-in-up" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-4">
                 <h3 className="font-bold text-lg text-yellow-400 flex items-center gap-2">💡 辅导员锦囊</h3>
                 <button onClick={() => setIsAdviceOpen(false)} className="text-slate-400">✕</button>
              </div>
              <p className="text-white text-lg leading-relaxed mb-6">
                 {adviceText}
              </p>
              <button 
                onClick={() => setIsAdviceOpen(false)}
                className="w-full py-3 bg-slate-700 rounded-xl font-bold text-white"
              >
                收到了
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;