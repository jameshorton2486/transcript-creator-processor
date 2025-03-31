/**
 * Service for interacting with Deepgram API through server-side proxies
 */

import { 
  DeepgramRequestOptions, 
  DeepgramWord, 
  DeepgramParagraph, 
  DeepgramUtterance, 
  DeepgramAPIResponse, 
  TranscriptionResult,
  TranscriptionJobStatus,
  FormattedTranscript
} from './types';
import { DEFAULT_OPTIONS, PROXY_SERVER_URL, PROXY_ENDPOINTS, createQueryParams } from './deepgramConfig';
import { mockValidateApiKey, mockTranscribeFile, safeApiCall } from './mockDeepgramService';

// Re-export types
export type { 
  DeepgramRequestOptions,
  DeepgramWord,
  DeepgramParagraph,
  DeepgramUtterance,
  DeepgramAPIResponse,
  TranscriptionResult
};

/**
 * Try to use the proxy server, fallback to direct API if necessary
 * @param endpoint Proxy endpoint path
 * @param options Fetch options
 */
const fetchWithProxyFallback = async (endpoint: string, options: RequestInit): Promise<Response> => {
  try {
    // Try the proxy server first
    const proxyUrl = `${PROXY_SERVER_URL}${endpoint}`;
    console.log(`Attempting to connect to proxy server: ${proxyUrl}`);
    
    const response = await fetch(proxyUrl, {
      ...options,
      // Increase timeout for proxy requests
      signal: options.signal || (AbortSignal.timeout ? AbortSignal.timeout(30000) : undefined)
    });
    
    if (!response.ok) {
      throw new Error(`Proxy server returned status ${response.status}`);
    }
    
    return response;
  } catch (error) {
    console.warn(`Proxy server unavailable, falling back to direct API call: ${error}`);
    
    // Fallback to direct API call (may encounter CORS issues)
    if (endpoint.includes('validate-key')) {
      return fetch('/api/auth/validate-key', options);
    } else if (endpoint.includes('transcribe')) {
      return fetch('/api/transcription/upload', options);
    }
    
    throw new Error(`No fallback available for endpoint: ${endpoint}`);
  }
};

/**
 * Validate a Deepgram API key
 */
export const validateApiKey = async (apiKey: string): Promise<{ valid: boolean; message?: string }> => {
  return safeApiCall(
    // Real API call
    async () => {
      if (!apiKey || apiKey.trim() === '') {
        return { 
          valid: false, 
          message: 'API key is required' 
        } as const;
      }

      const response = await fetchWithProxyFallback(
        PROXY_ENDPOINTS.validateKey,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ apiKey }),
        }
      );

      const data = await response.json();

      if (!(data.valid || data.isValid)) {
        return { 
          valid: false, 
          message: data.error || data.message || 'Invalid API key' 
        } as const;
      }

      return { valid: true } as const;
    },
    // Mock response
    () => mockValidateApiKey(apiKey)
  );
};

/**
 * Transcribe an audio or video file using Deepgram API
 */
export const transcribeFile = async (
  file: File, 
  apiKey: string,
  options: DeepgramRequestOptions = DEFAULT_OPTIONS
): Promise<DeepgramAPIResponse> => {
  return safeApiCall(
    // Real API call
    async () => {
      // Create form data with file and options
      const formData = new FormData();
      formData.append('file', file);
      formData.append('apiKey', apiKey);
      
      // Add all options to the form data
      Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      // Send request to server-side proxy with fallback
      const response = await fetchWithProxyFallback(
        PROXY_ENDPOINTS.transcribe,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to transcribe file');
      }

      return await response.json();
    },
    // Mock response
    () => mockTranscribeFile(file, options)
  );
};

/**
 * Format transcript data for display with speaker segments
 */
export const formatTranscriptionResult = (response: DeepgramAPIResponse): {
  formattedResult: FormattedTranscript | string
} => {
  // If no utterances, just return the plain text
  if (!response.results?.utterances || response.results.utterances.length === 0) {
    const transcript = response.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
    return { formattedResult: transcript };
  }

  // Otherwise, create structured segments by speaker
  const speakerSegments = response.results.utterances.map(utterance => ({
    speaker: `Speaker ${utterance.speaker !== undefined ? utterance.speaker : 0}`,
    text: utterance.transcript,
    start: utterance.start,
    end: utterance.end
  }));

  // Create word timestamps with speaker info
  const wordTimestamps = response.results.channels[0].alternatives[0].words.map(word => ({
    word: word.word,
    start: word.start,
    end: word.end,
    speaker: word.speaker !== undefined ? `Speaker ${word.speaker}` : undefined
  }));

  return {
    formattedResult: {
      plainText: response.results.channels[0].alternatives[0].transcript,
      wordTimestamps,
      speakerSegments
    }
  };
};

/**
 * Extract the main transcription result from the Deepgram response
 */
export const extractTranscriptionResult = (response: DeepgramAPIResponse): TranscriptionResult => {
  // Default values if structure is unexpected
  const defaultResult: TranscriptionResult = {
    transcript: '',
    confidence: 0,
    words: []
  };

  if (!response.results?.channels?.length) {
    return defaultResult;
  }

  const channel = response.results.channels[0];
  const alternative = channel.alternatives[0];

  if (!alternative) {
    return defaultResult;
  }

  // Get the formatted result with speaker segments if available
  const { formattedResult } = formatTranscriptionResult(response);

  return {
    transcript: alternative.transcript,
    confidence: alternative.confidence,
    words: alternative.words,
    text: alternative.transcript,
    formattedResult,
    rawResponse: response,
    paragraphs: alternative.paragraphs?.paragraphs,
    utterances: response.results.utterances,
    language: channel.detected_language
  };
};

/**
 * Check the status of a transcription job
 */
export const checkTranscriptionStatus = async (
  jobId: string,
  apiKey: string
): Promise<TranscriptionJobStatus> => {
  try {
    const response = await fetchWithProxyFallback(
      `${PROXY_ENDPOINTS.checkStatus}?id=${jobId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Token ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Failed to check transcription status');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Status check error:', error);
    throw error;
  }
};

/**
 * Local storage utilities for API key management
 */
export const apiKeyStorage = {
  save: (apiKey: string): void => {
    try {
      localStorage.setItem('deepgram_api_key', apiKey);
    } catch (error) {
      console.error('Error saving API key to localStorage:', error);
    }
  },
  
  get: (): string | null => {
    try {
      return localStorage.getItem('deepgram_api_key');
    } catch (error) {
      console.error('Error reading API key from localStorage:', error);
      return null;
    }
  },
  
  clear: (): void => {
    try {
      localStorage.removeItem('deepgram_api_key');
    } catch (error) {
      console.error('Error clearing API key from localStorage:', error);
    }
  }
};
