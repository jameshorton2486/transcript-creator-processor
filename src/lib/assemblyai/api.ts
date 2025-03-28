
/**
 * API interaction functions for AssemblyAI
 */

/**
 * Uploads a file to AssemblyAI for transcription
 * @param file File to upload
 * @param apiKey AssemblyAI API key
 * @param signal AbortSignal for cancellation
 * @returns Upload URL for the file
 */
export const uploadFile = async (
  file: File, 
  apiKey: string, 
  signal: AbortSignal
): Promise<string> => {
  try {
    // For larger files, consider using chunked upload
    const useChunkedUpload = file.size > 30 * 1024 * 1024; // 30MB threshold

    if (useChunkedUpload) {
      return await chunkedUpload(file, apiKey, signal);
    }
    
    // Standard upload for smaller files
    const response = await fetch('https://api.assemblyai.com/v2/upload', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/octet-stream',
        'Transfer-Encoding': 'chunked'
      },
      body: file,
      signal
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Upload failed: ${error.error || `HTTP error ${response.status}`}`);
    }
    
    const data = await response.json();
    
    if (!data.upload_url) {
      throw new Error('Invalid response from AssemblyAI upload endpoint');
    }
    
    return data.upload_url;
  } catch (error: any) {
    // Add more context to network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to AssemblyAI. Please check your internet connection.');
    }
    
    // Rethrow abort errors without modification
    if (error.name === 'AbortError') {
      throw error;
    }
    
    console.error('[ASSEMBLY] File upload error:', error);
    throw error;
  }
};

/**
 * Implements a chunked upload for large files
 * @param file Large file to upload in chunks
 * @param apiKey AssemblyAI API key
 * @param signal AbortSignal for cancellation
 * @returns Upload URL for the file
 */
const chunkedUpload = async (
  file: File,
  apiKey: string,
  signal: AbortSignal
): Promise<string> => {
  // Chunk size: 5MB
  const chunkSize = 5 * 1024 * 1024;
  const totalChunks = Math.ceil(file.size / chunkSize);
  
  console.log(`[ASSEMBLY] Using chunked upload for ${file.name}: ${totalChunks} chunks of ${chunkSize / 1024 / 1024}MB each`);
  
  // Initialize upload
  const initResponse = await fetch('https://api.assemblyai.com/v2/upload/begin', {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      file_name: file.name
    }),
    signal
  });
  
  if (!initResponse.ok) {
    const error = await initResponse.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to initialize chunked upload: ${error.error || `HTTP error ${initResponse.status}`}`);
  }
  
  const initData = await initResponse.json();
  const { upload_id, upload_url } = initData;
  
  if (!upload_id || !upload_url) {
    throw new Error('Invalid response from AssemblyAI upload initialization');
  }
  
  // Upload each chunk
  for (let i = 0; i < totalChunks; i++) {
    // Check for cancellation between chunks
    if (signal.aborted) {
      throw new Error('Upload cancelled');
    }
    
    const start = i * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const chunk = file.slice(start, end);
    
    const chunkResponse = await fetch(`https://api.assemblyai.com/v2/upload/chunk/${upload_id}/${i}`, {
      method: 'PUT',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/octet-stream'
      },
      body: chunk,
      signal
    });
    
    if (!chunkResponse.ok) {
      const error = await chunkResponse.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Failed to upload chunk ${i}: ${error.error || `HTTP error ${chunkResponse.status}`}`);
    }
    
    console.log(`[ASSEMBLY] Uploaded chunk ${i + 1}/${totalChunks}`);
  }
  
  // Complete the upload
  const completeResponse = await fetch(`https://api.assemblyai.com/v2/upload/complete/${upload_id}`, {
    method: 'POST',
    headers: {
      'Authorization': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({}),
    signal
  });
  
  if (!completeResponse.ok) {
    const error = await completeResponse.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(`Failed to complete chunked upload: ${error.error || `HTTP error ${completeResponse.status}`}`);
  }
  
  console.log('[ASSEMBLY] Chunked upload completed successfully');
  return upload_url;
};

/**
 * Submits a transcription request to AssemblyAI
 * @param audioUrl URL of the uploaded audio
 * @param apiKey AssemblyAI API key
 * @param config Transcription configuration options
 * @param signal AbortSignal for cancellation
 * @returns Transcription ID for polling
 */
export const submitTranscription = async (
  audioUrl: string, 
  apiKey: string, 
  config: any,
  signal: AbortSignal
): Promise<string> => {
  try {
    // Create the request body with all configured options
    const requestBody = {
      audio_url: audioUrl,
      language_code: config.language_code,
      speaker_labels: config.speaker_labels,
      punctuate: config.punctuate,
      format_text: config.format_text,
      word_boost: config.word_boost || [],
      boost_param: config.boost_param || "high",
      auto_chapters: true,
      entity_detection: true,
      auto_highlights: true,
      disfluencies: config.disfluencies ?? false,
      sentiment_analysis: config.sentiment_analysis ?? true
    };
    
    // Include model only if specified to use API defaults otherwise
    if (config.model) {
      requestBody['model'] = config.model;
    }
    
    // Submit the transcription request
    const response = await fetch('https://api.assemblyai.com/v2/transcript', {
      method: 'POST',
      headers: {
        'Authorization': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody),
      signal
    });
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Transcription request failed: ${error.error || `HTTP error ${response.status}`}`);
    }
    
    const data = await response.json();
    
    if (!data.id) {
      throw new Error('Invalid response from AssemblyAI transcription endpoint');
    }
    
    console.log(`[ASSEMBLY] Transcription submitted with ID: ${data.id}`);
    return data.id;
  } catch (error: any) {
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      throw new Error('Network error: Unable to connect to AssemblyAI. Please check your internet connection.');
    }
    
    // Rethrow abort errors without modification
    if (error.name === 'AbortError') {
      throw error;
    }
    
    console.error('[ASSEMBLY] Transcription submission error:', error);
    throw error;
  }
};

/**
 * Polls for the transcription result with exponential backoff
 * @param transcriptionId ID of the transcription to poll for
 * @param apiKey AssemblyAI API key
 * @param onProgress Progress callback function
 * @param signal AbortSignal for cancellation
 * @returns Completed transcription result
 */
export const pollForTranscription = async (
  transcriptionId: string, 
  apiKey: string, 
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<any> => {
  let completed = false;
  let attempts = 0;
  const maxAttempts = 600; // 10 minutes with dynamic intervals
  
  // Exponential backoff timing
  let pollInterval = 1000; // Start with 1 second
  const maxPollInterval = 10000; // Cap at 10 seconds
  
  while (!completed && attempts < maxAttempts) {
    try {
      // Check for cancellation before each polling attempt
      if (signal.aborted) {
        throw new Error('Polling cancelled');
      }
      
      const response = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': apiKey
        },
        signal
      });
      
      // Handle error responses
      if (response.status === 401) {
        throw new Error('Authentication error: API token is missing or invalid');
      }
      
      if (response.status === 404) {
        throw new Error('Transcription not found: The requested transcription ID does not exist');
      }
      
      if (response.status === 429) {
        console.warn('[ASSEMBLY] Rate limit hit, increasing backoff...');
        pollInterval = Math.min(pollInterval * 2, maxPollInterval);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        continue; // Skip to next attempt without incrementing counter
      }
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(`Polling failed: ${error.error || `HTTP error ${response.status}`}`);
      }
      
      const data = await response.json();
      
      // Update progress based on status
      if (data.status === 'queued') {
        onProgress(5);
        console.log('[ASSEMBLY] Transcription queued');
      } else if (data.status === 'processing') {
        // More accurate progress estimation
        if (data.words && data.words.length > 0 && data.text) {
          // Estimate progress based on processed words and audio duration
          const wordsProcessed = data.words.length;
          const textLength = data.text.split(' ').length;
          
          // If we have audio_duration, use it for more accurate progress
          if (data.audio_duration) {
            // Use timestamps from the words to determine how far in the audio we've processed
            const lastWordEnd = data.words[wordsProcessed - 1].end;
            const progressPercent = Math.min(90, (lastWordEnd / data.audio_duration) * 100);
            onProgress(progressPercent);
          } else {
            // Fallback to word-based estimation
            const progressEstimate = Math.min(85, Math.floor((wordsProcessed / Math.max(textLength, 1)) * 100));
            onProgress(progressEstimate);
          }
        } else if (data.percent_complete) {
          // Use the API's percent_complete if available
          onProgress(Math.min(90, data.percent_complete));
        } else {
          // Default progress when we don't have better metrics
          onProgress(30);
        }
        
        console.log(`[ASSEMBLY] Transcription processing: ${attempts + 1}/${maxAttempts} attempts`);
      } else if (data.status === 'completed') {
        onProgress(100);
        completed = true;
        console.log('[ASSEMBLY] Transcription completed successfully');
        return data;
      } else if (data.status === 'error') {
        throw new Error(`AssemblyAI error: ${data.error || 'Unknown error during transcription'}`);
      }
      
      // Adjust poll interval based on status
      if (data.status === 'queued') {
        // Longer intervals for queued status
        pollInterval = Math.min(pollInterval * 1.5, maxPollInterval);
      } else if (data.status === 'processing') {
        // Shorter intervals when processing for more responsive updates
        pollInterval = Math.max(1000, pollInterval / 1.2);
      }
      
      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      attempts++;
    } catch (error: any) {
      // Don't count network glitches against the attempt limit
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        console.warn('[ASSEMBLY] Network error during polling, retrying...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      console.error('[ASSEMBLY] Polling error:', error);
      throw error;
    }
  }
  
  throw new Error('Transcription timed out. Please try again with a smaller file or contact support.');
};
