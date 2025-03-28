
/**
 * Deepgram transcription service
 */
import { formatTranscriptionResult } from './formatter';
import { 
  DeepgramTranscriptionOptions, 
  DeepgramTranscriptionResponse, 
  TranscriptionResult 
} from '../../hooks/useDeepgramTranscription/types';

const DEEPGRAM_API_URL = 'https://api.deepgram.com/v1';

/**
 * Transcribes an audio file using Deepgram API
 */
export async function transcribeAudioFile(
  file: File, 
  apiKey: string, 
  options: DeepgramTranscriptionOptions = {}
): Promise<TranscriptionResult> {
  const { onProgress, abortSignal, ...apiOptions } = options;

  // Default options
  const fullOptions = {
    punctuate: true,
    diarize: true,
    language: 'en-US',
    model: 'nova-2',
    ...apiOptions
  };

  // Create query params
  const queryParams = new URLSearchParams();
  Object.entries(fullOptions).forEach(([key, value]) => {
    if (typeof value === 'boolean' || value !== undefined) {
      queryParams.append(key, String(value));
    }
  });

  try {
    // Simulate progress for UX purposes
    let progressInterval: number | undefined;
    if (onProgress) {
      let simulatedProgress = 0;
      progressInterval = window.setInterval(() => {
        simulatedProgress = Math.min(simulatedProgress + 2, 90);
        onProgress(simulatedProgress);
      }, 300);
    }

    // Setup request
    const endpoint = `${DEEPGRAM_API_URL}/listen?${queryParams.toString()}`;
    
    // Create form data with file
    const formData = new FormData();
    formData.append('file', file);

    // Perform request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
      },
      body: formData,
      signal: abortSignal,
    });

    // Clear progress interval
    if (progressInterval) {
      clearInterval(progressInterval);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new Error(
        errorData?.error?.message || 
        `Transcription failed with status: ${response.status} ${response.statusText}`
      );
    }

    // Set progress to 100%
    if (onProgress) {
      onProgress(100);
    }

    // Parse and return results
    const data: DeepgramTranscriptionResponse = await response.json();
    return formatTranscriptionResult(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Transcription was cancelled');
    }
    throw error;
  }
}
