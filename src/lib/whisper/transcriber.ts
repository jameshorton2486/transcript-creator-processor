
/**
 * Whisper functionality has been removed. This file is maintained as a stub to prevent import errors.
 * All transcription is now handled by AssemblyAI.
 */

// Export dummy types to avoid breaking imports
export interface WhisperTranscriptionOptions {
  model?: string;
  language?: string;
  taskType?: 'transcribe' | 'translate';
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

export const AVAILABLE_MODELS = [];
export const isModelAvailable = () => false;
export const transcribeAudio = async () => {
  throw new Error('Whisper functionality has been removed. Please use AssemblyAI for transcription.');
};
export const preloadWhisperModel = async () => false;
