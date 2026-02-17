import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { calculateKinship, speakTextOffline } from '../services/kinshipEngine';

interface VoiceAssistantProps {
  onResult: (title: string, explanation: string) => void;
}

const triggerHaptic = (type: 'light' | 'medium' | 'success') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (type) {
      case 'light': navigator.vibrate(5); break;
      case 'medium': navigator.vibrate(15); break;
      case 'success': navigator.vibrate([10, 40, 10]); break;
    }
  }
};

// Map spoken Chinese relationship words to our button labels
const RELATION_KEYWORDS: Record<string, string> = {
  '爸爸': '爸爸', '父親': '爸爸', '爸': '爸爸', '老爸': '爸爸', '阿爸': '爸爸', '拔拔': '爸爸',
  '媽媽': '媽媽', '母親': '媽媽', '媽': '媽媽', '老媽': '媽媽', '阿媽': '媽媽', '馬麻': '媽媽',
  '爺爺': '爺爺', '祖父': '爺爺', '阿公': '爺爺', '阿爺': '爺爺',
  '奶奶': '奶奶', '祖母': '奶奶', '阿嬤': '奶奶', '嫲嫲': '奶奶',
  '外公': '外公', '外祖父': '外公', '姥爺': '外公',
  '外婆': '外婆', '外祖母': '外婆', '姥姥': '外婆',
  '哥哥': '哥哥', '兄長': '哥哥', '大哥': '哥哥', '阿哥': '哥哥',
  '姊姊': '姊姊', '姐姐': '姊姊', '大姊': '姊姊', '阿姊': '姊姊', '大姐': '姊姊',
  '弟弟': '弟弟', '小弟': '弟弟', '阿弟': '弟弟',
  '妹妹': '妹妹', '小妹': '妹妹', '阿妹': '妹妹',
  '兒子': '兒子', '兒': '兒子', '阿仔': '兒子',
  '女兒': '女兒', '阿女': '女兒',
  '丈夫': '丈夫', '老公': '丈夫', '先生': '丈夫', '夫君': '丈夫',
  '妻子': '妻子', '老婆': '妻子', '太太': '妻子', '夫人': '妻子',
  // Extended terms people might say directly
  '伯父': '爸爸→哥哥', '伯伯': '爸爸→哥哥',
  '叔叔': '爸爸→弟弟', '叔父': '爸爸→弟弟',
  '姑姑': '爸爸→姊姊', '姑媽': '爸爸→姊姊', '姑母': '爸爸→姊姊',
  '舅舅': '媽媽→哥哥', '舅父': '媽媽→哥哥',
  '阿姨': '媽媽→姊姊', '姨母': '媽媽→姊姊', '姨媽': '媽媽→姊姊',
};

function parseVoiceInput(text: string): string[] | null {
  // Remove common filler words and punctuation
  const cleaned = text
    .replace(/[？?！!。，,、是誰呢啊呀嗎吧哦喔欸]/g, ' ')
    .replace(/^我/, '')
    .replace(/叫什麼/g, '')
    .replace(/怎麼叫/g, '')
    .replace(/怎麼稱呼/g, '')
    .replace(/什麼關係/g, '')
    .replace(/的/g, ' ')
    .trim();

  if (!cleaned) return null;

  const path: string[] = [];
  let remaining = cleaned;

  // Sort keywords by length (longest first) for greedy matching
  const sortedKeywords = Object.keys(RELATION_KEYWORDS).sort((a, b) => b.length - a.length);

  while (remaining.length > 0) {
    let matched = false;

    for (const keyword of sortedKeywords) {
      if (remaining.startsWith(keyword)) {
        const mapped = RELATION_KEYWORDS[keyword];
        if (mapped.includes('→')) {
          path.push(...mapped.split('→'));
        } else {
          path.push(mapped);
        }
        remaining = remaining.substring(keyword.length).trim();
        matched = true;
        break;
      }
    }

    if (!matched) {
      remaining = remaining.substring(1).trim();
    }
  }

  return path.length > 0 ? path : null;
}

// Get SpeechRecognition constructor
const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onResult }) => {
  const [isListening, setIsListening] = useState(false);
  const [userTranscript, setUserTranscript] = useState('');
  const [modelTranscript, setModelTranscript] = useState('');
  const [isSupported] = useState(!!SpeechRecognitionAPI);
  const recognitionRef = useRef<any>(null);

  const cleanup = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
    setUserTranscript('');
    setModelTranscript('');
  };

  const processTranscript = (text: string) => {
    const path = parseVoiceInput(text);

    if (path && path.length > 0) {
      const result = calculateKinship(path);
      setModelTranscript(`${result.title}：${result.explanation}`);

      speakTextOffline(`${result.title}。${result.explanation}`).catch(() => {});

      setTimeout(() => {
        onResult(result.title, result.explanation);
        triggerHaptic('success');
      }, 800);
    } else {
      setModelTranscript('抱歉，我沒有聽清楚親屬關係，請再試一次。');
      speakTextOffline('抱歉，我沒有聽清楚，請再試一次').catch(() => {});
    }
  };

  const toggleVoice = async () => {
    if (isListening) {
      cleanup();
      return;
    }

    if (!isSupported) {
      onResult('不支援', '您的瀏覽器不支援語音辨識功能，請使用按鈕輸入親屬關係。建議使用 Chrome 瀏覽器。');
      return;
    }

    triggerHaptic('light');

    try {
      const recognition = new SpeechRecognitionAPI();
      recognition.lang = 'zh-TW';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;

      recognition.onstart = () => {
        setIsListening(true);
        setUserTranscript('');
        setModelTranscript('');
      };

      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setUserTranscript(finalTranscript);
          triggerHaptic('medium');
          processTranscript(finalTranscript);
        } else if (interimTranscript) {
          setUserTranscript(interimTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setModelTranscript('請允許麥克風權限以使用語音功能。');
        } else if (event.error === 'no-speech') {
          setModelTranscript('沒有偵測到語音，請再試一次。');
        }
        setTimeout(() => cleanup(), 2000);
      };

      recognition.onend = () => {
        setTimeout(() => {
          setIsListening(false);
          recognitionRef.current = null;
        }, 2000);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Speech recognition failed:', err);
      cleanup();
    }
  };

  useEffect(() => {
    return () => cleanup();
  }, []);

  return (
    <div className="fixed bottom-6 right-6 flex flex-col items-end z-50 pointer-events-none pb-[env(safe-area-inset-bottom,0px)]">
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        .animate-text-shimmer {
          background-size: 200% auto;
          animation: shimmer 2s linear infinite;
        }
      `}</style>
      
      {isListening && (
        <div className="mb-4 p-5 bg-white/95 backdrop-blur-3xl rounded-[2rem] shadow-2xl max-w-[280px] border border-rose-100 animate-in fade-in slide-in-from-right-4 pointer-events-auto">
          <div className="flex items-center gap-2 mb-3">
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce"></span>
            </div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">語音辨識中</p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-start gap-2">
                <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <ICONS.Mic className="w-3 h-3 text-gray-400" />
                </div>
                <p className="text-xs text-gray-600 font-medium leading-relaxed">
                    {userTranscript || <span className="opacity-40 italic">聆聽中...</span>}
                </p>
            </div>

            {(modelTranscript || userTranscript) && (
                <div className="flex items-start gap-2">
                    <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></div>
                    </div>
                    <p 
                    className={`text-xs text-rose-900 font-medium leading-relaxed
                    ${!modelTranscript ? 'opacity-50' : ''}`}
                    >
                    {modelTranscript || "..."}
                    </p>
                </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-rose-50">
             <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">試試說：『爸爸的哥哥』或『媽媽的姊姊的兒子』</p>
          </div>
        </div>
      )}
      
      <div className="relative pointer-events-auto">
        {isListening && (
            <>
                <div className="absolute inset-0 rounded-full bg-rose-500 opacity-20 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                <div className="absolute -inset-2 rounded-full border-2 border-rose-400/30 opacity-0 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite] [animation-delay:0.5s]"></div>
                <div className="absolute -inset-1 rounded-full bg-rose-500/10 animate-[pulse_3s_ease-in-out_infinite]"></div>
            </>
        )}

        <button
            onClick={toggleVoice}
            className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 transform active:scale-90 relative overflow-visible group z-10 ${
            isListening 
                ? 'bg-rose-500 ring-4 ring-rose-200/50 shadow-[0_0_40px_-5px_rgba(244,63,94,0.6)] animate-[pulse_3s_ease-in-out_infinite]' 
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-200'
            } text-white`}
        >
            <div className={`absolute inset-0 bg-white/20 transition-transform duration-500 ${isListening ? 'translate-y-0' : 'translate-y-full'}`}></div>
            {isListening ? (
            <div className="flex gap-1.5 items-end relative z-10">
                <div className="w-1.5 h-4 bg-white rounded-full animate-[bounce_0.8s_infinite] [animation-delay:-0.4s]"></div>
                <div className="w-1.5 h-8 bg-white rounded-full animate-[bounce_0.8s_infinite] [animation-delay:-0.2s]"></div>
                <div className="w-1.5 h-6 bg-white rounded-full animate-[bounce_0.8s_infinite]"></div>
            </div>
            ) : (
            <ICONS.Mic className="w-7 h-7 relative z-10" />
            )}
        </button>
      </div>
    </div>
  );
};
