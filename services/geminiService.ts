/**
 * Kinship Service - Offline Implementation
 * Replaces the Gemini API with a local calculation engine and browser TTS.
 */

import { calculateKinship, speakTextOffline } from './kinshipEngine';

export const getKinshipTitle = async (path: string[]): Promise<{ title: string; explanation: string }> => {
  // Small artificial delay to make it feel like it's "thinking"
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));
  return calculateKinship(path);
};

export const speakText = async (text: string): Promise<void> => {
  return speakTextOffline(text);
};
