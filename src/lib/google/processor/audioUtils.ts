
/**
 * Audio utilities adapter for Deepgram (was previously for Google STT)
 * This file provides compatibility with the existing code structure
 */
import { getAudioContext } from '@/lib/audio/audioContext';

/**
 * Decode audio data using AudioContext
 */
export const decodeAudioData = async (audioData: ArrayBuffer): Promise<AudioBuffer> => {
  const audioContext = getAudioContext();
  return new Promise((resolve, reject) => {
    audioContext.decodeAudioData(
      audioData,
      (buffer) => resolve(buffer),
      (error) => reject(error)
    );
  });
};

/**
 * Convert audio to a format compatible with Deepgram
 */
export const convertAudioForDeepgram = async (audioData: ArrayBuffer): Promise<File> => {
  // Simply wrap the ArrayBuffer in a File object with appropriate type
  // Deepgram accepts various formats including WAV
  const file = new File([audioData], 'audio.wav', { type: 'audio/wav' });
  return file;
};

/**
 * Prepare audio data for transcription using Deepgram
 */
export const prepareAudioForTranscription = async (
  audioData: ArrayBuffer
): Promise<File> => {
  try {
    // For Deepgram, we can use the file directly without complex preprocessing
    return convertAudioForDeepgram(audioData);
  } catch (error) {
    console.error('Error preparing audio for transcription:', error);
    throw new Error('Failed to prepare audio for transcription');
  }
};
