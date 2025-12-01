import { CardData, PlayerStats, AICommentaryResult } from "../types";
import { COMMENTARY_TEMPLATES, ADVICE_DB } from "../constants";

// 本地生成解说（替代 AI）
export const generateTurnCommentary = async (
  playedCards: CardData[],
  currentStats: PlayerStats
  // Removed unused 'turn' parameter
): Promise<AICommentaryResult> => {
  
  // 模拟网络延迟，让体验更真实
  await new Promise(resolve => setTimeout(resolve, 600));

  let possibleLines: string[] = [];

  // 1. 遍历所有模板，找到符合条件的
  for (const template of COMMENTARY_TEMPLATES) {
    if (template.condition(currentStats, playedCards)) {
      possibleLines = [...possibleLines, ...template.lines];
      // 如果匹配到了特殊状态（如贫穷、抑郁），为了强调，不再匹配后续的普通模板
      // 但如果是普通行为匹配，可能希望多一些随机性
      if (template.lines.length < 5) break; 
    }
  }

  // 2. 如果没有匹配到（理论上不会，因为有默认模板），使用保底
  if (possibleLines.length === 0) {
    possibleLines = ["继续加油！"];
  }

  // 3. 随机选择一句
  const text = possibleLines[Math.floor(Math.random() * possibleLines.length)];

  // 4. 生成“模拟”的 Grounding 链接 (根据卡牌类型)
  // 为了增加趣味性，根据卡牌类型硬编码一些有趣的链接
  const groundingChunks = [];
  const cardTypes = playedCards.map(c => c.type);
  
  if (cardTypes.includes('study')) {
    groundingChunks.push({ web: { title: "2025年考研趋势分析", uri: "#" } });
    groundingChunks.push({ web: { title: "如何高效复习期末考试", uri: "#" } });
  } else if (cardTypes.includes('work')) {
    groundingChunks.push({ web: { title: "大学生兼职避坑指南", uri: "#" } });
  } else if (cardTypes.includes('event')) {
    groundingChunks.push({ web: { title: "校园突发事件处理手册", uri: "#" } });
  }

  // 只返回前2个模拟链接
  return { text, groundingChunks: groundingChunks.slice(0, 2) };
};

// 预加载语音列表，解决 Chrome 中 getVoices 首次为空的问题
let cachedVoices: SpeechSynthesisVoice[] = [];
if (typeof window !== 'undefined' && window.speechSynthesis) {
  window.speechSynthesis.onvoiceschanged = () => {
    cachedVoices = window.speechSynthesis.getVoices();
  };
}

// 本地语音合成（替代 API TTS）
export const speakText = (text: string) => {
  if (!window.speechSynthesis) {
    console.warn("Browser does not support speech synthesis");
    return;
  }
  
  // 停止之前的播放
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1.1; // 语速稍快
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  // 确保语音列表已加载
  if (cachedVoices.length === 0) {
    cachedVoices = window.speechSynthesis.getVoices();
  }

  // 智能选择最佳中文语音
  // 优先级: Google 普通话 > Microsoft Xiaoxiao > 任何包含 'zh' 或 'CN' 的语音
  const zhVoices = cachedVoices.filter(v => v.lang.includes('zh') || v.lang.includes('CN'));
  
  let bestVoice = zhVoices.find(v => v.name.includes('Google') && v.name.includes('Putonghua')); // Chrome 优质语音
  if (!bestVoice) {
    bestVoice = zhVoices.find(v => v.name.includes('Microsoft')); // Edge 优质语音
  }
  if (!bestVoice) {
    bestVoice = zhVoices[0]; // 默认中文
  }

  if (bestVoice) {
    utterance.voice = bestVoice;
    // 有些浏览器 voice.lang 可能不规范，强制设置一下
    utterance.lang = bestVoice.lang; 
  } else {
    // 如果实在没找到中文语音包，回退到通用设置
    utterance.lang = 'zh-CN';
  }

  window.speechSynthesis.speak(utterance);
};

// 获取随机建议（替代 Live API）
export const getCounselorAdvice = async (): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return ADVICE_DB[Math.floor(Math.random() * ADVICE_DB.length)];
};