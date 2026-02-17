
import React from 'react';
import { RELATION_BUTTONS, ICONS } from '../constants';
import { RelationNode } from '../types';

interface CalculatorProps {
  onAddRelation: (node: RelationNode) => void;
  onClear: () => void;
  onDelete: () => void;
  onConfirm: () => void;
  loading?: boolean;
  currentPath?: RelationNode[];
}

// Haptic feedback helper
const triggerButtonHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      switch (intensity) {
        case 'light': navigator.vibrate(5); break;
        case 'medium': navigator.vibrate(15); break;
        case 'heavy': navigator.vibrate(25); break;
      }
    }
  } catch (e) {
    // Ignore haptic errors
  }
};

export const Calculator: React.FC<CalculatorProps> = ({ 
  onAddRelation, 
  onClear, 
  onDelete, 
  onConfirm, 
  loading,
  currentPath = []
}) => {
  return (
    <div className="grid grid-cols-4 gap-2.5 w-full p-2">
      {/* Relation Buttons (14 items) */}
      {RELATION_BUTTONS.map((btn) => {
        const isActive = currentPath.some(node => node.label === btn.label);
        return (
          <button
            key={btn.type + btn.label}
            onClick={() => {
              triggerButtonHaptic('light');
              onAddRelation(btn);
            }}
            disabled={loading}
            className={`
              relative group overflow-hidden
              ${btn.color} text-white aspect-square rounded-2xl font-bold text-sm 
              transition-all duration-300 flex flex-col items-center justify-center gap-1 
              disabled:opacity-50 border 
              ${isActive 
                ? 'border-white/60 ring-4 ring-rose-100/50 ring-offset-0 scale-[1.05] shadow-[0_0_20px_-5px_rgba(255,255,255,0.7)] z-10' 
                : 'border-white/10 shadow-lg hover:brightness-110 active:scale-95 hover:shadow-xl hover:-translate-y-0.5'
              }
            `}
          >
            {/* Gradient Overlay for active state */}
            {isActive && (
              <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-white/10 pointer-events-none" />
            )}
            
            {/* Pulsating Glow Ring for active state */}
            {isActive && (
               <div className="absolute inset-0 rounded-2xl ring-2 ring-white/40 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite]"></div>
            )}

            <span className="text-base tracking-tighter relative z-10 drop-shadow-md">{btn.label}</span>
            
            {/* Active Indicator Dot */}
            {isActive && (
              <div className="w-1.5 h-1.5 bg-white rounded-full absolute top-2 right-2 shadow-[0_0_8px_rgba(255,255,255,0.8)] animate-in fade-in zoom-in duration-300"></div>
            )}
          </button>
        );
      })}
      
      {/* Control Row Items */}
      <button
        onClick={() => {
          triggerButtonHaptic('medium');
          onClear();
        }}
        className="bg-white/80 backdrop-blur-sm text-gray-500 aspect-square rounded-2xl font-bold text-xs shadow-sm active:scale-90 transition-all flex flex-col items-center justify-center gap-1 border border-gray-200 hover:bg-white hover:text-rose-500"
      >
        <ICONS.Refresh className="w-4 h-4" />
        清空
      </button>

      <button
        onClick={() => {
          triggerButtonHaptic('medium');
          onDelete();
        }}
        className="bg-gray-800 text-white aspect-square rounded-2xl font-bold text-xs shadow-lg active:scale-90 transition-all flex flex-col items-center justify-center gap-1 border border-gray-700 hover:bg-gray-700"
      >
        <ICONS.Delete className="w-4 h-4" />
        退格
      </button>

      {/* Primary Calculation Action */}
      <button
        onClick={() => {
          triggerButtonHaptic('heavy');
          onConfirm();
        }}
        disabled={loading}
        className="col-span-2 h-[52px] bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-rose-200 active:scale-95 transition-all flex items-center justify-center gap-3 border border-rose-400/20 disabled:opacity-70 relative overflow-hidden group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        
        {loading ? (
          <div className="flex gap-1.5">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]"></div>
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]"></div>
          </div>
        ) : (
          <>
            <span className="tracking-[0.2em] text-base relative z-10">開始計算</span>
            <div className="bg-white/20 p-1 rounded-full relative z-10 group-hover:bg-white/30 transition-colors">
                <ICONS.ArrowRight className="w-4 h-4" />
            </div>
          </>
        )}
      </button>
    </div>
  );
};
