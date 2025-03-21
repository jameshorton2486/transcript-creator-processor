/**
 * Client-side transcription using AssemblyAI's API
 */

// Interface for transcription options
export interface AssemblyAITranscriptionOptions {
  language?: string;
  speakerLabels?: boolean;
  punctuate?: boolean;
  formatText?: boolean;
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}

// Response interface for AssemblyAI transcriptions
export interface AssemblyAITranscriptionResponse {
  id: string;
  status: string;
  text: string;
  words?: Array<{
    text: string;
    start: number;
    end: number;
    confidence: number;
    speaker?: string;
  }>;
  utterances?: Array<{
    speaker: string;
    text: string;
    start: number;
    end: number;
  }>;
  error?: string;
}

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
      onProgress = () => {},
      abortSignal
    } = options;
    
    // Validate API key format first to fail fast
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is required');
    }
    
    console.log(`[ASSEMBLY] Starting transcription for: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
    onProgress(0);
    
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
    
    // Set a timeout for large files
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, 30 * 60 * 1000); // 30-minute timeout for large files
    
    try {
      // Step 1: Upload the file to AssemblyAI
      onProgress(10);
      console.log('[ASSEMBLY] Uploading audio file...');
      
      const uploadUrl = await uploadFile(file, apiKey, signal);
      
      // Step 2: Submit the transcription request
      onProgress(30);
      console.log('[ASSEMBLY] Submitting transcription request...');
      
      const transcriptionId = await submitTranscription(uploadUrl, apiKey, {
        language_code: language,
        speaker_labels: speakerLabels,
        punctuate: punctuate,
        format_text: formatText
      }, signal);
      
      // Step 3: Poll for the transcription result
      onProgress(40);
      console.log('[ASSEMBLY] Processing audio, polling for results...');
      
      const result = await pollForTranscription(
        transcriptionId, 
        apiKey, 
        progress => onProgress(40 + Math.floor(progress * 60)), // Map 0-100% to 40-100%
        signal
      );
      
      onProgress(100);
      console.log('[ASSEMBLY] Transcription complete:', result);
      
      // Format result to match expected structure for the app
      return formatTranscriptionResult(result, file.name);
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

/**
 * Uploads a file to AssemblyAI for transcription
 */
const uploadFile = async (
  file: File, 
  apiKey: string, 
  signal: AbortSignal
): Promise<string> => {
  try {
    const response = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey
      },
      body: file,
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Upload failed: ${error.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.upload_url;
  } catch (error) {
    console.error('[ASSEMBLY] File upload error:', error);
    throw error;
  }
};

/**
 * Submits a transcription request to AssemblyAI
 */
const submitTranscription = async (
  audioUrl: string, 
  apiKey: string, 
  config: any,
  signal: AbortSignal
): Promise<string> => {
  try {
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio_url: audioUrl,
        language_code: config.language_code,
        speaker_labels: config.speaker_labels,
        punctuate: config.punctuate,
        format_text: config.format_text,
        word_boost: config.word_boost || [],
        boost_param: config.boost_param || "high",
        auto_chapters: true,
        entity_detection: true,
        auto_highlights: true
      }),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Transcription request failed: ${error.error || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data.id;
  } catch (error) {
    console.error('[ASSEMBLY] Transcription submission error:', error);
    throw error;
  }
};

/**
 * Polls for the transcription result
 */
const pollForTranscription = async (
  transcriptionId: string, 
  apiKey: string, 
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<AssemblyAITranscriptionResponse> => {
  let completed = false;
  let attempts = 0;
  const maxAttempts = 300; // 5 minutes at 1-second intervals
  
  while (!completed && attempts < maxAttempts) {
    try {
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': apiKey
        },
        signal
      });
      
      if (response.status === 401) {
        throw new Error('Authentication error, API token missing/invalid');
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Polling failed: ${error.error || 'Unknown error'}`);
      }
      
      const data: AssemblyAITranscriptionResponse = await response.json();
      
      // Update progress based on status
      if (data.status === 'queued') {
        onProgress(0);
      } else if (data.status === 'processing') {
        if (data.words && data.text) {
          // Estimate progress based on words processed compared to total text length
          const wordsProcessed = data.words.length;
          const totalEstimatedWords = data.text.split(' ').length;
          const progressEstimate = Math.min(90, Math.floor((wordsProcessed / totalEstimatedWords) * 100));
          onProgress(progressEstimate);
        } else {
          onProgress(30); // Default progress estimate
        }
      } else if (data.status === 'completed') {
        onProgress(100);
        completed = true;
        return data;
      } else if (data.status === 'error') {
        throw new Error(`AssemblyAI error: ${data.error || 'Unknown error'}`);
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, 1000));
      attempts++;
    } catch (error) {
      console.error('[ASSEMBLY] Polling error:', error);
      throw error;
    }
  }
  
  throw new Error('Transcription timed out. Please try again with a smaller file or contact support.');
};

/**
 * Tests if the API key is valid
 */
export const testApiKey = async (apiKey: string): Promise<boolean> => {
  try {
    console.log('[ASSEMBLY] Testing API key validity...');
    
    // Check for empty API key
    if (!apiKey || apiKey.trim() === '') {
      console.error('[ASSEMBLY] Empty API key provided');
      return false;
    }
    
    // Make a request to a lightweight endpoint to test the API key
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'GET',
      headers: {
        'Authorization': apiKey
      },
      // Set a timeout for the request
      signal: AbortSignal.timeout(10000)
    });
    
    console.log(`[ASSEMBLY] API key test status: ${response.status}`);
    
    if (response.status === 401) {
      console.error('[ASSEMBLY] API key invalid (unauthorized)');
      return false;
    }
    
    if (!response.ok) {
      // Even if the response isn't 200 OK, if it's not an auth error (401), 
      // the key might still be valid (e.g., rate limiting, server error)
      console.warn(`[ASSEMBLY] API key test returned status ${response.status}`);
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn('[ASSEMBLY] Error data:', errorData);
      
      // For most non-401 errors, we'll consider the key valid but log the issue
      return response.status !== 401;
    }
    
    console.log('[ASSEMBLY] API key is valid');
    return true;
  } catch (error) {
    console.error('[ASSEMBLY] API key test error:', error);
    return false;
  }
};

/**
 * Formats the AssemblyAI response to match the expected structure used by the app
 */
const formatTranscriptionResult = (assemblyResult: AssemblyAITranscriptionResponse, fileName: string): any => {
  // Extract the main text
  const transcript = assemblyResult.text || '';
  
  // Get the words with timestamps
  const words = assemblyResult.words || [];
  
  // Format to match the structure expected by the app
  return {
    results: {
      transcripts: [{ transcript, confidence: 0.9 }],
      channels: [{
        alternatives: [{ transcript, confidence: 0.9 }]
      }],
    },
    metadata: {
      fileName,
      modelUsed: 'assemblyai',
      words: words.map((word) => ({
        word: word.text,
        startTime: word.start / 1000, // Convert to seconds
        endTime: word.end / 1000, // Convert to seconds
        confidence: word.confidence,
        speaker: word.speaker
      })),
      utterances: assemblyResult.utterances || []
    },
    isAssemblyAI: true // Flag to indicate this came from AssemblyAI
  };
};
