
/**
 * API interaction functions for AssemblyAI
 */

/**
 * Uploads a file to AssemblyAI for transcription
 */
export const uploadFile = async (
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
export const submitTranscription = async (
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
export const pollForTranscription = async (
  transcriptionId: string, 
  apiKey: string, 
  onProgress: (progress: number) => void,
  signal: AbortSignal
): Promise<any> => {
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
      
      const data = await response.json();
      
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
