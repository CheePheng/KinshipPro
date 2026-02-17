
import React from 'react';
import { RelationNode } from './types';

export const RELATION_BUTTONS: RelationNode[] = [
  // Grandparents
  { label: '爺爺', type: 'grandfather_paternal', color: 'bg-rose-400' },
  { label: '奶奶', type: 'grandmother_paternal', color: 'bg-rose-400' },
  { label: '外公', type: 'grandfather_maternal', color: 'bg-rose-400' },
  { label: '外婆', type: 'grandmother_maternal', color: 'bg-rose-400' },
  
  // Parents
  { label: '爸爸', type: 'father', color: 'bg-rose-600' },
  { label: '媽媽', type: 'mother', color: 'bg-rose-600' },
  
  // Spouse
  { label: '丈夫', type: 'husband', color: 'bg-indigo-500' },
  { label: '妻子', type: 'wife', color: 'bg-indigo-500' },
  
  // Siblings
  { label: '哥哥', type: 'brother_older', color: 'bg-emerald-500' },
  { label: '姊姊', type: 'sister_older', color: 'bg-emerald-500' },
  { label: '弟弟', type: 'brother_younger', color: 'bg-emerald-500' },
  { label: '妹妹', type: 'sister_younger', color: 'bg-emerald-500' },
  
  // Children
  { label: '兒子', type: 'son', color: 'bg-amber-500' },
  { label: '女兒', type: 'daughter', color: 'bg-amber-500' },
];

export const ICONS = {
  Mic: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/>
    </svg>
  ),
  Delete: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M20 5H9l-7 7 7 7h11a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"/><line x1="18" x2="12" y1="9" y2="15"/><line x1="12" x2="18" y1="9" y2="15"/>
    </svg>
  ),
  Refresh: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/>
    </svg>
  ),
  ArrowRight: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  ),
  Share: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/>
    </svg>
  ),
  Speaker: (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
    </svg>
  ),
};
