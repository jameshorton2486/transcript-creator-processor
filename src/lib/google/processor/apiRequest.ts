
import { buildRequestConfig } from '../speechConfig';

// Builds and sends request to Google Speech API
export const sendTranscriptionRequest = async (
  apiKey: string,
  base64Audio: string,
  encoding: string,
  sampleRate: number,
  options: any,
  customTerms: string[] = []
) => {
  // Build configuration for the API request
  const config = buildRequestConfig(encoding, sampleRate, options, customTerms);
  
  // Prepare the complete request body
  const requestBody = {
    config,
    audio: {
      content: base64Audio
    }
  };
  
  // Check for payload size before sending
  const requestBodySize = JSON.stringify(requestBody).length;
  const maxPayloadSize = 10 * 1024 * 1024; // 10MB
  
  if (requestBodySize > maxPayloadSize) {
    console.error(`Request payload size (${Math.round(requestBodySize / (1024 * 1024))}MB) exceeds Google API limit (10MB)`);
    throw new Error(`Request payload size exceeds the limit: ${maxPayloadSize} bytes.`);
  }
  
  console.log('Sending request to Google Speech API...');
  console.log('Request config:', JSON.stringify({
    encoding: config.encoding,
    sampleRateHertz: config.sampleRateHertz,
    languageCode: config.languageCode,
    useEnhanced: config.useEnhanced,
    enableSpeakerDiarization: !!config.diarizationConfig?.enableSpeakerDiarization,
    hasCustomTerms: !!config.speechContexts && config.speechContexts.length > 0,
    payloadSizeMB: (requestBodySize / (1024 * 1024)).toFixed(2)
  }));
  
  // Make request to Google Speech-to-Text API
  const response = await fetch(
    `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json();
    console.error('Google API error:', errorData);
    throw new Error(`Google API error: ${errorData.error?.message || 'Unknown error'}`);
  }
  
  const data = await response.json();
  console.log('Google transcription raw response received');
  
  // Validate API response
  if (!data || !data.results || data.results.length === 0) {
    console.error('Empty or invalid response from Google API:', data);
    throw new Error('No transcription results returned from Google API. The audio file may not contain recognizable speech or the format may be unsupported.');
  }
  
  return data;
};
