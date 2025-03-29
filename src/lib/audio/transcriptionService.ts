
/**
 * Service for handling audio transcription requests
 * Uses a proxy endpoint to avoid CORS issues with direct API calls
 */

// Types for transcription responses
export interface TranscriptionResult {
  transcript: string;
  confidence: number;
  words?: Array<{
    word: string;
    start: number;
    end: number;
    confidence: number;
  }>;
  error?: string;
}

export interface TranscriptionStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string;
}

/**
 * Upload file to your backend server which will relay to the transcription service
 * This avoids CORS issues with direct API calls
 */
export const uploadFileForTranscription = async (
  file: File, 
  apiKey: string,
  options?: {
    language?: string;
    punctuate?: boolean;
    diarize?: boolean;
  }
): Promise<{ id: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('apiKey', apiKey);
  
  if (options) {
    Object.entries(options).forEach(([key, value]) => {
      formData.append(key, String(value));
    });
  }

  // Use your backend API endpoint that will proxy the request to Deepgram
  const response = await fetch('/api/transcription/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to upload file for transcription');
  }

  return response.json();
};

/**
 * Check the status of a transcription job
 */
export const checkTranscriptionStatus = async (
  jobId: string,
  apiKey: string
): Promise<TranscriptionStatus> => {
  const response = await fetch(`/api/transcription/status?id=${jobId}&apiKey=${apiKey}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to check transcription status');
  }

  return response.json();
};

/**
 * Get the result of a completed transcription
 */
export const getTranscriptionResult = async (
  jobId: string,
  apiKey: string
): Promise<TranscriptionResult> => {
  const response = await fetch(`/api/transcription/result?id=${jobId}&apiKey=${apiKey}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Failed to get transcription result');
  }

  return response.json();
};

/**
 * Simplified function to handle the entire transcription process
 * Performs upload, polls for status, and returns result when complete
 */
export const transcribeAudioFile = async (
  file: File,
  apiKey: string,
  options?: {
    language?: string;
    punctuate?: boolean;
    diarize?: boolean;
    onProgress?: (progress: number) => void;
    pollingInterval?: number; // ms
    maxAttempts?: number;
  }
): Promise<TranscriptionResult> => {
  // Set defaults
  const pollingInterval = options?.pollingInterval || 2000; // 2 seconds
  const maxAttempts = options?.maxAttempts || 30; // Maximum 1 minute (30 * 2s)
  
  try {
    // Step 1: Upload file
    console.log("Uploading file for transcription...");
    const { id } = await uploadFileForTranscription(file, apiKey, {
      language: options?.language,
      punctuate: options?.punctuate,
      diarize: options?.diarize
    });
    
    // Step 2: Poll for status
    let attempts = 0;
    let status: TranscriptionStatus = { id, status: 'queued' };
    
    while (status.status !== 'completed' && status.status !== 'failed' && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollingInterval));
      status = await checkTranscriptionStatus(id, apiKey);
      
      // Update progress if callback provided
      if (options?.onProgress && status.progress !== undefined) {
        options.onProgress(status.progress);
      }
      
      console.log(`Transcription status: ${status.status}, Progress: ${status.progress || 'unknown'}`);
      attempts++;
    }
    
    // Step 3: Handle completion or timeout
    if (status.status === 'completed') {
      // Get results
      console.log("Transcription complete, retrieving results...");
      const result = await getTranscriptionResult(id, apiKey);
      return result;
    } else if (status.status === 'failed') {
      throw new Error(`Transcription failed: ${status.error || 'Unknown error'}`);
    } else {
      throw new Error('Transcription timed out. The process is taking too long.');
    }
  } catch (error) {
    console.error("Transcription process failed:", error);
    return {
      transcript: '',
      confidence: 0,
      error: error instanceof Error ? error.message : 'Unknown error during transcription'
    };
  }
};
