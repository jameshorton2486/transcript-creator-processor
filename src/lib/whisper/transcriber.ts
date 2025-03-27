
/**
 * Client-side transcription using Whisper.js via the Hugging Face Transformers.js library
 */
import { 
  loadWhisperModel, 
  AVAILABLE_MODELS, 
  isModelAvailable 
} from './core/modelLoader';

// Default model is the first in the AVAILABLE_MODELS list
const DEFAULT_MODEL = AVAILABLE_MODELS[0].id;

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
    onProgress(10); // Start at 10% for model loading
    
    const modelResult = await loadWhisperModel(model);
    const whisperModel = modelResult.model;
    
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
      
      // For simulation purposes, we'll just wait and return a simulated result
      // In a real implementation, we would call the actual Whisper model
      
      // Simulate processing time based on file size
      const processingTimeMs = Math.min(file.size / 10000, 5000);
      
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        const currentProgress = 50 + Math.random() * 10;
        onProgress(Math.min(90, currentProgress));
      }, 500);
      
      await new Promise(resolve => setTimeout(resolve, processingTimeMs));
      
      clearInterval(progressInterval);
      onProgress(95);
      
      // Simulate a result
      const result = {
        text: `This is a simulated transcription of file ${file.name} using Whisper. In a real implementation, this would be the actual transcribed text from the audio.`,
        segments: [
          {
            id: 0,
            start: 0,
            end: 3.5,
            text: `This is a simulated transcription of file ${file.name} using Whisper.`
          },
          {
            id: 1,
            start: 3.5,
            end: 7,
            text: "In a real implementation, this would be the actual transcribed text from the audio."
          }
        ]
      };
      
      onProgress(100);
      console.log('[WHISPER] Transcription complete:', result);
      
      // Format result to match expected structure for the app
      return {
        text: result.text,
        segments: result.segments,
        filename: file.name
      };
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

// Preload the default model (in a real implementation)
export const preloadWhisperModel = async () => {
  try {
    console.log(`Preloading default Whisper model: ${DEFAULT_MODEL}`);
    // In a real implementation, this would actually preload the model
    // For now, we'll just wait a bit to simulate
    await new Promise(resolve => setTimeout(resolve, 500));
    return true;
  } catch (error) {
    console.error('Failed to preload Whisper model:', error);
    return false;
  }
};

// Export helper functions and constants
export { AVAILABLE_MODELS, isModelAvailable };

// Try to preload the model when this module is imported
preloadWhisperModel();
