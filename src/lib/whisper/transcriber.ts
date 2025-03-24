
/**
 * Client-side transcription using Whisper.js via the Hugging Face Transformers.js library
 */
import { 
  loadWhisperModel, 
  WHISPER_MODELS, 
  DEFAULT_MODEL, 
  preloadWhisperModel 
} from './core/modelLoader';
import { formatTranscriptionResult, getAvailableModels } from './core/formatter';

// Interface for transcription options
export interface WhisperTranscriptionOptions {
  model?: string;
  language?: string;
  taskType?: 'transcribe' | 'translate';
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

/**
 * Transcribes an audio file using Whisper.js
 */
export const transcribeAudio = async (
  file: File,
  options: WhisperTranscriptionOptions = {}
): Promise<any> => {
  try {
    const {
      model = DEFAULT_MODEL,
      language = 'en',
      taskType = 'transcribe',
      onProgress = () => {},
      abortSignal
    } = options;
    
    console.log(`[WHISPER] Starting transcription for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    onProgress(0);
    
    // Load the model (or reuse existing)
    const loadingProgress = (progress: number) => {
      const cappedProgress = Math.min(Math.max(Math.round(progress), 0), 100);
      onProgress(cappedProgress * 0.4); // 40% of progress for model loading
    };
    
    const whisperModel = await loadWhisperModel(model, loadingProgress);
    
    onProgress(40); // Model loaded at 40%
    
    // Check if operation was aborted during model loading
    if (abortSignal?.aborted) {
      throw new Error('Transcription cancelled');
    }
    
    // Create a signal to handle timeouts and cancellation
    const controller = new AbortController();
    const signal = controller.signal;
    
    // Merge with the provided signal if any
    if (abortSignal) {
      abortSignal.addEventListener('abort', () => controller.abort());
    }
    
    // Set a timeout (10 minutes) for large files
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 10 * 60 * 1000);
    
    try {
      onProgress(50); // Started transcription at 50%
      
      console.log('[WHISPER] Processing audio...');
      
      // Transcribe the audio file
      const result = await whisperModel(file, {
        language: language,
        task: taskType,
        chunk_length_s: 30, // Process in 30-second chunks
        stride_length_s: 5, // 5-second overlap for better continuity
        return_timestamps: true, // Get word timestamps
        callback_function: (progressInfo: any) => {
          const percent = 50 + Math.round((progressInfo?.progress || 0) * 50);
          const cappedPercent = Math.min(Math.max(Math.round(percent), 0), 100);
          onProgress(cappedPercent);
          console.log(`[WHISPER] Transcription progress: ${cappedPercent}%`);
        },
        signal: signal,
      });
      
      onProgress(100);
      console.log('[WHISPER] Transcription complete:', result);
      
      // Format result to match expected structure for the app
      return formatTranscriptionResult(result, file.name);
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('[WHISPER] Transcription error:', error);
    
    // Rethrow with a user-friendly message
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('abort') || errorMessage.includes('cancel')) {
      throw new Error('Transcription was cancelled');
    } else {
      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    }
  }
};

// Export helper functions
export { getAvailableModels, WHISPER_MODELS, preloadWhisperModel };

// Preload the model when this module is imported
preloadWhisperModel();
