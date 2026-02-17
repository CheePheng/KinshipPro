
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Calculator } from './components/Calculator';
import { VoiceAssistant } from './components/VoiceAssistant';
import { RelationNode, CalculationState } from './types';
import { getKinshipTitle, speakText } from './services/geminiService';
import { ICONS } from './constants';
// Note: encode/decode removed — no longer needed without Gemini API

// Sound effect utility
const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
let sharedAudioCtx: AudioContext | null = null;

const playSound = (type: 'click' | 'delete' | 'success' | 'pop') => {
  try {
    if (!AudioContextClass) return;
    
    if (!sharedAudioCtx) {
      sharedAudioCtx = new AudioContextClass();
    }
    
    if (sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
    
    const ctx = sharedAudioCtx;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    const t = ctx.currentTime;

    switch (type) {
      case 'click':
        // Crisp high-pitch tick for adding items
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.05);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        osc.start(t);
        osc.stop(t + 0.05);
        break;
      case 'delete':
        // Lower thud for deletion/clearing
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, t);
        osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
      case 'success':
        // Ascending chime for confirmation
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.1);
        gain.gain.setValueAtTime(0.05, t);
        gain.gain.linearRampToValueAtTime(0, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;
      case 'pop':
        // Soft pop for notifications
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, t);
        gain.gain.setValueAtTime(0.03, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        osc.start(t);
        osc.stop(t + 0.1);
        break;
    }
  } catch (e) {
    console.error("Audio play failed", e);
  }
};

// Haptic feedback utility
const triggerSystemHaptic = (type: 'success' | 'error' | 'click') => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    switch (type) {
      case 'click':
        navigator.vibrate(5);
        break;
      case 'success':
        // Distinct pattern: short-long-short for success
        navigator.vibrate([20, 50, 20]);
        break;
      case 'error':
        navigator.vibrate([50, 50, 50]);
        break;
    }
  }
};

const App: React.FC = () => {
  const [state, setState] = useState<CalculationState>({
    path: [],
    result: '我',
    description: '請點擊按鈕組合親戚關係後，點擊「開始計算」',
  });
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('計算中');
  const [speaking, setSpeaking] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const lastRequestId = useRef(0);

  // Clear toast after 3 seconds
  useEffect(() => {
    if (toast) {
      playSound('pop');
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Cycle loading messages to provide feedback on the process
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (loading) {
      const messages = [
        '正在查找宗譜...',
        '分析親屬關係...',
        '翻閱傳統禮俗...',
        '生成深度解析...'
      ];
      let index = 0;
      setLoadingText(messages[0]);
      interval = setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingText(messages[index]);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  const handleSpeak = async (text: string) => {
    if (!text || text.startsWith('我') || speaking) return;
    setSpeaking(true);
    try {
      await speakText(text);
    } catch(e) {
      console.error(e);
    } finally {
      setSpeaking(false);
    }
  };

  const handleConfirm = useCallback(async () => {
    playSound('click'); // Play click sound on start
    if (state.path.length === 0) {
      setToast('請先選擇親戚關係');
      triggerSystemHaptic('error');
      return;
    }

    const currentRequestId = ++lastRequestId.current;
    setLoading(true);

    try {
      const labels = state.path.map(n => n.label);
      const data = await getKinshipTitle(labels);
      
      if (currentRequestId === lastRequestId.current) {
        setState(prev => ({
          ...prev,
          result: data.title,
          description: data.explanation
        }));
        setLoading(false);
        // Synchronized success feedback (Haptic + Sound)
        triggerSystemHaptic('success');
        playSound('success');
      }
    } catch (err) {
      if (currentRequestId === lastRequestId.current) {
        setLoading(false);
        setToast('計算失敗，請再試一次');
        triggerSystemHaptic('error');
      }
    }
  }, [state.path]);

  const handleVoiceResult = (title: string, explanation: string) => {
    setState({
      path: [], // Clear path when voice is used as it's a direct conversation
      result: title,
      description: explanation
    });
    setToast('語音辨識成功！');
    // Synchronized success feedback (Haptic + Sound)
    triggerSystemHaptic('success');
    playSound('success');
  };

  const handleAddRelation = (node: RelationNode) => {
    playSound('click');
    if (state.path.length >= 10) {
      setToast('關係太長啦！休息一下');
      triggerSystemHaptic('error');
      return;
    }
    setState(prev => ({ ...prev, path: [...prev.path, node] }));
  };

  const handleClear = () => {
    playSound('delete');
    lastRequestId.current++;
    setState({ path: [], result: '我', description: '請點擊按鈕組合親戚關係' });
    setLoading(false);
  };

  const handleDelete = () => {
    playSound('delete');
    setState(prev => ({ ...prev, path: prev.path.slice(0, -1) }));
  };

  const handleShare = async () => {
    playSound('click');
    triggerSystemHaptic('click');
    const shareData = {
      title: 'Pheng Kinship Pro',
      text: `這關係怎麼叫？我看「${state.result}」。過年必備神器！不再叫錯人。`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setToast('連結已複製！');
      } catch (err) {
        setToast('無法複製連結');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center selection:bg-rose-100 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-gray-900/90 backdrop-blur-md text-white px-6 py-3 rounded-full text-sm font-medium shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300">
          {toast}
        </div>
      )}

      {/* App Header */}
      <header className="w-full bg-white/70 backdrop-blur-xl border-b border-white/40 py-4 px-5 sticky top-0 z-40 pt-[env(safe-area-inset-top,16px)]">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-rose-200 ring-2 ring-white">
              宗
            </div>
            <div>
              <h1 className="text-lg font-black text-gray-900 leading-tight">
                Pheng Kinship <span className="text-rose-600">Pro</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-bold tracking-tighter uppercase opacity-60">Pheng Kinship Intelligence</p>
            </div>
          </div>
          
          <button 
            onClick={handleShare}
            className="group flex items-center gap-2 px-4 py-2 bg-white/50 hover:bg-white rounded-full border border-gray-200 transition-all active:scale-95 shadow-sm"
          >
            <ICONS.Share className="w-4 h-4 text-gray-600 group-hover:text-rose-600" />
            <span className="text-xs font-bold text-gray-600 group-hover:text-rose-600">分享</span>
          </button>
        </div>
      </header>

      <main className="w-full max-w-md px-4 flex-1 space-y-6 pt-6">
        {/* Result Card */}
        <div className="glass rounded-[2.5rem] p-8 shadow-2xl shadow-rose-900/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-rose-400 rounded-full opacity-10 blur-3xl group-hover:opacity-20 transition-opacity"></div>
          
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-end">
              <p className="text-rose-600 text-[10px] font-black uppercase tracking-[0.2em]">Title Result</p>
              {loading && (
                <div className="flex gap-1.5 pb-1">
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce"></div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <div 
                key={state.result + loading}
                className={`font-black text-gray-900 tracking-tight transition-all duration-300 ${loading ? 'text-2xl opacity-50 blur-[0.5px] animate-pulse' : 'text-6xl animate-result'}`}
              >
                {loading ? loadingText : state.result}
              </div>

              {!loading && state.result !== '我' && (
                <button
                  onClick={() => {
                    triggerSystemHaptic('click');
                    handleSpeak(`${state.result}。${state.description}`);
                  }}
                  disabled={speaking}
                  className="p-3 rounded-full bg-rose-100/50 hover:bg-rose-100 text-rose-600 transition-all active:scale-95 disabled:opacity-50 animate-in fade-in zoom-in"
                  aria-label="朗讀"
                >
                  {speaking ? (
                    <div className="w-6 h-6 flex items-center justify-center gap-0.5">
                       <div className="w-1 h-3 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                       <div className="w-1 h-5 bg-rose-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                       <div className="w-1 h-2 bg-rose-500 rounded-full animate-bounce"></div>
                    </div>
                  ) : (
                    <ICONS.Speaker className="w-6 h-6" />
                  )}
                </button>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] py-2">
              <span className="text-gray-400 text-[11px] font-bold">我的</span>
              {state.path.length > 0 && <ICONS.ArrowRight className="w-3 h-3 text-gray-300" />}
              
              {state.path.map((node, idx) => (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg ${node.color} text-white shadow-lg shadow-current/20`}>
                      {node.label}
                    </span>
                    {idx < state.path.length - 1 && (
                      <ICONS.ArrowRight className="w-2.5 h-2.5 text-gray-300" />
                    )}
                  </div>
                </React.Fragment>
              ))}
              {state.path.length === 0 && !loading && state.result !== '我' && (
                <span className="text-[10px] font-black px-2.5 py-1 rounded-lg bg-gray-100 text-gray-400">語音詢問結果</span>
              )}
            </div>

            <div key={state.description + loading} className={`pt-6 border-t border-gray-100/50 ${!loading && 'animate-in fade-in slide-in-from-bottom-2 duration-700'}`}>
              <p className="text-slate-500 text-xs leading-relaxed font-serif italic tracking-wide opacity-90">
                {loading ? '請稍候，正在諮詢民俗專家...' : `“${state.description}”`}
              </p>
            </div>
          </div>
        </div>

        {/* Calculator Grid */}
        <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-2 border border-white/60 shadow-xl">
          <Calculator 
            onAddRelation={handleAddRelation} 
            onClear={handleClear} 
            onDelete={handleDelete} 
            onConfirm={handleConfirm}
            loading={loading}
            currentPath={state.path}
          />
        </div>

        <footer className="text-center pt-10 pb-4">
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.4em] opacity-40">
            Heritage & Innovation
          </p>
          <p className="text-[9px] text-gray-300 mt-2 font-medium">© 2025 Pheng Kinship Pro - 傳承宗親文化</p>
        </footer>
      </main>

      <VoiceAssistant onResult={handleVoiceResult} />
    </div>
  );
};

export default App;