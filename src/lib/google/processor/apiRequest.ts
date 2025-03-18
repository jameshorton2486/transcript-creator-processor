import { buildRequestConfig } from '../speechConfig';

// Builds and sends request to Google Speech API with improved error handling
export const sendTranscriptionRequest = async (
  apiKey: string,
  base64Audio: string,
  encoding: string,
  sampleRate: number,
  options: any,
  customTerms: string[] = []
) => {
  try {
    // Build configuration for the API request
    const config = buildRequestConfig(encoding, sampleRate, options, customTerms);
    
    // Prepare the complete request body
    const requestBody = {
      config,
      audio: {
        content: base64Audio
      }
    };
    
    // Pre-check for payload size before sending
    const requestBodyJson = JSON.stringify(requestBody);
    const requestBodySize = requestBodyJson.length;
    const maxPayloadSize = 10 * 1024 * 1024; // 10MB
    
    if (requestBodySize > maxPayloadSize) {
      console.error(`[API ERROR] Request payload size (${Math.round(requestBodySize / (1024 * 1024))}MB) exceeds Google API limit (10MB)`);
      throw new Error(`Request payload size exceeds the limit: ${maxPayloadSize} bytes. This chunk is too large for the API.`);
    }
    
    console.log('[API] Sending request to Google Speech API...');
    console.log('[API] Request config:', JSON.stringify({
      encoding: config.encoding,
      sampleRateHertz: config.sampleRateHertz,
      languageCode: config.languageCode,
      useEnhanced: config.useEnhanced,
      enableSpeakerDiarization: !!config.diarizationConfig?.enableSpeakerDiarization,
      hasCustomTerms: !!config.speechContexts && config.speechContexts.length > 0,
      payloadSizeMB: (requestBodySize / (1024 * 1024)).toFixed(2)
    }));
    
    // Make request to Google Speech-to-Text API
    let response;
    try {
      response = await fetch(
        `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: requestBodyJson,
        }
      );
    } catch (fetchError) {
      console.error('[API ERROR] Network error during API request:', fetchError);
      throw new Error(`Network error while contacting Google API: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}`);
    }
    
    // Handle HTTP errors
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('[API ERROR] Failed to parse error response:', parseError);
        throw new Error(`Google API error: HTTP ${response.status} - ${response.statusText}`);
      }
      
      console.error('[API ERROR] Google API error response:', errorData);
      
      // Provide more specific error messages based on the API error
      const errorMessage = errorData.error?.message || 'Unknown API error';
      const errorCode = errorData.error?.code || response.status;
      
      // Handle common Google API errors
      let userFriendlyError = `Google API error (${errorCode}): ${errorMessage}`;
      
      if (errorCode === 400) {
        userFriendlyError = `Invalid request to Google API: ${errorMessage}`;
      } else if (errorCode === 401) {
        userFriendlyError = `Authentication error: Your API key may be invalid or expired`;
      } else if (errorCode === 403) {
        userFriendlyError = `Access denied: Verify that your API key has access to the Speech-to-Text API and billing is enabled`;
      } else if (errorCode === 429) {
        userFriendlyError = `Rate limit exceeded: Too many requests to the Google API`;
      } else if (errorCode >= 500) {
        userFriendlyError = `Google API server error (${errorCode}): This is a temporary issue with Google's servers`;
      }
      
      throw new Error(userFriendlyError);
    }
    
    // Parse successful response
    let data;
    try {
      data = await response.json();
      console.log('[API] Google transcription raw response received');
    } catch (parseError) {
      console.error('[API ERROR] Failed to parse success response:', parseError);
      throw new Error(`Failed to parse Google API response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
    
    // Validate API response
    if (!data || !data.results || data.results.length === 0) {
      console.error('[API ERROR] Empty or invalid response from Google API:', data);
      
      // Check if there's an error field in the response
      if (data.error) {
        throw new Error(`Google API error: ${data.error.message || 'Unknown API error'}`);
      }
      
      // If it's just empty results, that might mean no speech was detected
      if (data.results && data.results.length === 0) {
        throw new Error('No speech detected in this audio segment. The audio may be silent or contain unintelligible speech.');
      }
      
      throw new Error('Invalid response from Google API. The audio file may not contain recognizable speech or the format may be unsupported.');
    }
    
    return data;
  } catch (error) {
    // Log the error and re-throw with improved message
    console.error('[API ERROR] API request failed:', error);
    
    // If it's already our error, just re-throw it
    if (error instanceof Error) {
      throw error;
    }
    
    // Otherwise, wrap in a more helpful error
    throw new Error(`Failed to transcribe audio: ${String(error)}`);
  }
};
