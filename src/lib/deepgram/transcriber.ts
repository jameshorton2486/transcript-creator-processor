
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
  if (!file) {
    throw new Error("No file provided for transcription");
  }
  
  if (!apiKey) {
    throw new Error("Deepgram API key is required");
  }
  
  // Validate file type
  const validAudioTypes = [
    'audio/mp3', 'audio/mpeg', 'audio/wav', 
    'audio/x-wav', 'audio/ogg', 'audio/flac', 
    'audio/m4a', 'audio/x-m4a', 'audio/aac',
    'video/mp4', 'video/quicktime', 'video/webm'
  ];
  
  const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';
  const validExtensions = ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'mp4', 'mov', 'webm'];
  
  const isValidType = validAudioTypes.includes(file.type) || validExtensions.includes(fileExtension);
  
  if (!isValidType) {
    throw new Error(`Unsupported file type: ${file.type || fileExtension}. Please upload an audio or video file like MP3, WAV, MP4, etc.`);
  }
  
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
    
    console.log(`[DEEPGRAM] Transcribing file: ${file.name} (${file.type}, ${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    
    // Create form data with file
    const formData = new FormData();
    formData.append('file', file);

    // Perform request
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        // Note: Do NOT set Content-Type when sending FormData
        // The browser will automatically set the correct Content-Type with boundary
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

    // Parse response
    const data: DeepgramTranscriptionResponse = await response.json();
    
    // Check if we actually got some transcript content
    if (!data.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      console.error('[DEEPGRAM] Empty transcript result received:', data);
      throw new Error("No transcription content found. The audio file may not contain recognizable speech.");
    }
    
    // Format and return results
    const result = formatTranscriptionResult(data);
    
    console.log('[DEEPGRAM] Transcription successful:', {
      transcriptLength: result.transcript?.length || 0,
      hasContent: result.transcript?.trim().length > 0,
      duration: data.metadata?.duration || 'unknown'
    });
    
    return result;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('Transcription was cancelled');
    }
    throw error;
  }
}
