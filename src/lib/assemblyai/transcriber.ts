
/**
 * Client-side transcription using AssemblyAI's API
 */
import { uploadFile, submitTranscription, pollForTranscription } from './api';
import { formatTranscriptionResult } from './formatter';
import { testApiKey } from './auth';
import { AssemblyAITranscriptionOptions } from './types';

export { testApiKey } from './auth';
export type { AssemblyAITranscriptionOptions } from './types';

/**
 * Transcribes an audio file using AssemblyAI
 */
export const transcribeAudio = async (
  file: File,
  apiKey: string,
  options: AssemblyAITranscriptionOptions = {}
): Promise<any> => {
  try {
    const {
      language = 'en',
      speakerLabels = false,
      punctuate = true,
      formatText = true,
      model = 'default',
      onProgress = () => {},
      abortSignal
    } = options;
    
    // Validate API key format first to fail fast
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is required');
    }
    
    // Check if operation was aborted
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
    
    // Set a reduced timeout for large files (15 minutes instead of 30)
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 15 * 60 * 1000); // 15-minute timeout for large files
    
    try {
      // Step 1: Upload the file to AssemblyAI
      onProgress(10);
      
      const uploadUrl = await uploadFile(file, apiKey, signal);
      
      // Step 2: Submit the transcription request
      onProgress(30);
      
      // Simplified model mapping logic
      const modelMap = {
        'default': undefined,
        'standard': 'standard',
        'enhanced': 'nova',
        'nova2': 'nova-2',
      };
      const modelName = modelMap[model] || undefined;
      
      const transcriptionId = await submitTranscription(uploadUrl, apiKey, {
        language_code: language,
        speaker_labels: speakerLabels,
        punctuate: punctuate,
        format_text: formatText,
        model: modelName
      }, signal);
      
      // Step 3: Poll for the transcription result
      onProgress(40);
      
      const result = await pollForTranscription(
        transcriptionId, 
        apiKey, 
        progress => onProgress(40 + Math.floor(progress * 60)), // Map 0-100% to 40-100%
        signal
      );
      
      onProgress(100);
      
      // Format result to match expected structure for the app
      const formattedResult = formatTranscriptionResult(result, file.name);
      
      // Ensure the text property is properly set
      if (!formattedResult.text && result.text) {
        formattedResult.text = result.text;
      }
      
      return formattedResult;
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('[ASSEMBLY] Transcription error:', error);
    
    // Rethrow with a user-friendly message
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    if (errorMessage.includes('abort') || errorMessage.includes('cancel')) {
      throw new Error('Transcription was cancelled');
    } else if (
      errorMessage.toLowerCase().includes('authentication') || 
      errorMessage.toLowerCase().includes('auth') || 
      errorMessage.toLowerCase().includes('api key') || 
      errorMessage.toLowerCase().includes('token') ||
      errorMessage.toLowerCase().includes('unauthorized')
    ) {
      throw new Error('Authentication error: Your AssemblyAI API key appears to be invalid or missing');
    } else {
      throw new Error(`Failed to transcribe audio: ${errorMessage}`);
    }
  }
};
