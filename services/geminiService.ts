import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { AICommentaryResult, LiveSessionConfig, CardData, PlayerStats } from "../types";
import { createPCMBlob, decodeBase64 } from "../utils/audioUtils";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateTurnCommentary = async (
  playedCards: CardData[],
  currentStats: PlayerStats,
  turn: number
): Promise<AICommentaryResult> => {
  if (!apiKey) throw new Error("API Key missing");

  const cardsDescription = playedCards.map(c => `${c.title} (${c.emoji})`).join(', ');
  const statsDescription = JSON.stringify(currentStats);

  const prompt = `
    用户正在玩一款大学生模拟游戏（第 ${turn}/50 周）。
    他们刚刚选择了：${cardsDescription}。
    当前属性状态：${statsDescription}。
    
    1. 请用中文提供简短、风趣的解说（最多2句话），评价这些选择对他们大学生活的影响。可以是鼓励的，也可以是带有幽默感的讽刺。
    2. 使用 Google Search 查找与其中一项活动相关的现实世界事实、统计数据或新闻（例如，如果他们学习AI，找最近的AI新闻；如果他们贷款，提及学生债务数据）。
    
    请直接返回内容，解说必须是中文。
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "继续加油！";
  // Extract grounding chunks if available
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.filter(
    (c: any) => c.web
  ) as any[];

  return { text, groundingChunks };
};

export const generateSpeech = async (text: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Kore' },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  return base64Audio;
};

export const connectLiveSession = async (
  config: LiveSessionConfig,
  initialContext: string,
  audioStream: MediaStream
) => {
  if (!apiKey) throw new Error("API Key missing");

  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
  
  // Use a promise to expose the session once connected
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: () => {
        console.log("Live session opened");
        config.onOpen();
        
        // Setup Audio Streaming
        const source = inputAudioContext.createMediaStreamSource(audioStream);
        const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
        
        scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
          const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
          const pcmBlob = createPCMBlob(inputData);
          
          sessionPromise.then((session) => {
            session.sendRealtimeInput({ media: pcmBlob });
          });
        };
        
        source.connect(scriptProcessor);
        scriptProcessor.connect(inputAudioContext.destination);
      },
      onmessage: (message: LiveServerMessage) => {
        const base64Audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
          config.onAudioData(base64Audio);
        }
      },
      onclose: () => {
        console.log("Live session closed");
        config.onClose();
        inputAudioContext.close();
      },
      onerror: (err) => {
        console.error("Live session error", err);
        config.onError(err);
      }
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: `你是一位乐于助人且富有同理心的大学辅导员。
      用户是一个模拟游戏中的大学生。
      帮助他们平衡生活、学业和心理健康。
      **请全程使用中文与用户交流**。
      
      Context: ${initialContext}`,
    },
  });

  return sessionPromise;
};