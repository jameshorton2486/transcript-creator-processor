
/**
 * Service for interacting with Deepgram API through server-side proxies
 */

import { DeepgramRequestOptions, DEFAULT_OPTIONS, PROXY_SERVER_URL, PROXY_ENDPOINTS } from './deepgramConfig';

// Types for API responses
export interface DeepgramTranscriptionResponse {
  id: string;
  results: {
    channels: DeepgramChannel[];
    utterances?: DeepgramUtterance[];
  };
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface DeepgramChannel {
  alternatives: DeepgramAlternative[];
  detected_language?: string;
  language_confidence?: number;
}

export interface DeepgramAlternative {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
  paragraphs?: {
    paragraphs: DeepgramParagraph[];
  };
}

export interface DeepgramWord {
  word: string;
  start: number;
  end: number;
  confidence: number;
  speaker?: number;
  punctuated_word?: string;
}

export interface DeepgramParagraph {
  start: number;
  end: number;
  text: string;
}

export interface DeepgramUtterance {
  start: number;
  end: number;
  confidence: number;
  channel: number;
  transcript: string;
  words: DeepgramWord[];
  speaker?: number;
  id?: string;
}

export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words: DeepgramWord[];
  paragraphs?: DeepgramParagraph[];
  utterances?: DeepgramUtterance[];
}

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
  try {
    if (!apiKey || apiKey.trim() === '') {
      return { 
        valid: false, 
        message: 'API key is required' 
      };
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

    if (!data.valid && !data.isValid) {
      return { 
        valid: false, 
        message: data.error || data.message || 'Invalid API key' 
      };
    }

    return { valid: true };
  } catch (error: any) {
    console.error('API key validation error:', error);
    return { 
      valid: false, 
      message: error.message || 'Failed to validate API key. Please check your network connection.' 
    };
  }
};

/**
 * Transcribe an audio or video file using Deepgram API
 */
export const transcribeFile = async (
  file: File, 
  apiKey: string,
  options: DeepgramRequestOptions = DEFAULT_OPTIONS
): Promise<DeepgramTranscriptionResponse> => {
  try {
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
  } catch (error: any) {
    console.error('Transcription error:', error);
    throw error;
  }
};

/**
 * Extract the main transcription result from the Deepgram response
 */
export const extractTranscriptionResult = (response: DeepgramTranscriptionResponse): TranscriptionResult => {
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

  return {
    transcript: alternative.transcript,
    confidence: alternative.confidence,
    words: alternative.words,
    paragraphs: alternative.paragraphs?.paragraphs,
    utterances: response.results.utterances
  };
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
