
/**
 * Google Speech-to-Text API request handler
 */

export interface APIRequestOptions {
  encoding: string;
  sampleRateHertz: number;
  languageCode: string;
  enableAutomaticPunctuation?: boolean;
  enableSpeakerDiarization?: boolean;
  model?: string;
  diarizationSpeakerCount?: number;
  maxAlternatives?: number;
  audioChannelCount?: number;
  enableWordTimeOffsets?: boolean;
  profanityFilter?: boolean;
}

/**
 * Sends a transcription request to Google Speech-to-Text API
 */
export const sendTranscriptionRequest = async (
  audioContent: string,
  apiKey: string,
  options: APIRequestOptions
): Promise<any> => {
  try {
    console.log('[GOOGLE API] Sending transcription request');
    
    const requestUrl = `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`;
    
    const requestBody = {
      config: {
        encoding: options.encoding,
        sampleRateHertz: options.sampleRateHertz,
        languageCode: options.languageCode,
        enableAutomaticPunctuation: options.enableAutomaticPunctuation ?? true,
        enableSpeakerDiarization: options.enableSpeakerDiarization ?? false,
        model: options.model || 'default',
        diarizationSpeakerCount: options.diarizationSpeakerCount,
        maxAlternatives: options.maxAlternatives || 1,
        audioChannelCount: options.audioChannelCount || 1,
        enableWordTimeOffsets: options.enableWordTimeOffsets ?? true,
        profanityFilter: options.profanityFilter ?? false,
      },
      audio: {
        content: audioContent,
      },
    };
    
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[GOOGLE API] Request error:', error);
    throw error;
  }
};

/**
 * Makes a general API request to Google Speech-to-Text API
 */
export const makeApiRequest = async (
  endpoint: string,
  apiKey: string,
  method = 'GET',
  body?: any
): Promise<any> => {
  try {
    const url = `https://speech.googleapis.com/v1/${endpoint}?key=${apiKey}`;
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }
    
    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('[GOOGLE API] Request error:', error);
    throw error;
  }
};
