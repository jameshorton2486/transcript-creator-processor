
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { formatGoogleResponse } from './responseFormatter';
import { preprocessAudioFile } from '../audio/preprocessor';
import { getAudioContext, fileToAudioBuffer } from '../audio/audioContext';
import { 
  detectAudioEncoding, 
  getStandardSampleRate, 
  arrayBufferToBase64 
} from './audio';
import { buildRequestConfig } from './speechConfig';

/**
 * Process a single file (for files under 10MB)
 */
export const transcribeSingleFile = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  customTerms: string[] = [],
  skipBrowserDecoding: boolean = false
) => {
  try {
    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    let base64Audio;
    let actualSampleRate;
    
    // Detect encoding and decoding approach based on file type
    const { encoding, shouldSkipBrowserDecoding } = detectAudioEncoding(file);
    console.log(`Detected encoding: ${encoding}`);
    
    // Determine if we should use direct upload without browser decoding
    const useDirectUpload = skipBrowserDecoding || shouldSkipBrowserDecoding || encoding === "FLAC";
    
    if (useDirectUpload) {
      // For FLAC files or when browser decoding should be skipped, 
      // use direct upload without browser decoding
      console.log("Using direct upload without browser audio processing");
      const rawBuffer = await file.arrayBuffer();
      base64Audio = arrayBufferToBase64(rawBuffer);
      
      // Use standard sample rates based on file type
      actualSampleRate = getStandardSampleRate(encoding);
      console.log(`Using standard sample rate: ${actualSampleRate} Hz for direct upload`);
    } else {
      // Standard flow with preprocessing and sample rate detection
      console.log("Starting audio preprocessing...");
      try {
        const preprocessedAudio = await preprocessAudioFile(file);
        console.log("Audio preprocessing complete");

        // Detect actual sample rate from the audio file
        console.log("Detecting audio sample rate...");
        const audioContext = getAudioContext();
        
        try {
          const audioBuffer = await audioContext.decodeAudioData(preprocessedAudio.slice(0));
          actualSampleRate = audioBuffer.sampleRate;
          console.log(`Detected actual sample rate: ${actualSampleRate} Hz`);
          
          base64Audio = arrayBufferToBase64(preprocessedAudio);
        } catch (decodeError) {
          console.error("Browser failed to decode audio, falling back to direct upload:", decodeError);
          // If browser decoding fails, fall back to direct upload
          const rawBuffer = await file.arrayBuffer();
          base64Audio = arrayBufferToBase64(rawBuffer);
          actualSampleRate = getStandardSampleRate(encoding);
          console.log(`Using standard sample rate: ${actualSampleRate} Hz after decode error`);
        }
      } catch (preprocessError) {
        console.error("Audio preprocessing failed, using direct upload:", preprocessError);
        // If preprocessing fails, fall back to direct upload
        const rawBuffer = await file.arrayBuffer();
        base64Audio = arrayBufferToBase64(rawBuffer);
        actualSampleRate = getStandardSampleRate(encoding);
        console.log(`Using standard sample rate: ${actualSampleRate} Hz after preprocessing error`);
      }
    }
    
    // Build configuration for the API request
    const config = buildRequestConfig(encoding, actualSampleRate, options, customTerms);
    
    // Prepare the complete request body
    const requestBody = {
      config,
      audio: {
        content: base64Audio
      }
    };
    
    console.log('Sending request to Google Speech API...');
    console.log('Request config:', JSON.stringify({
      encoding: config.encoding,
      sampleRateHertz: config.sampleRateHertz,
      languageCode: config.languageCode,
      useEnhanced: config.useEnhanced,
      enableSpeakerDiarization: !!config.diarizationConfig?.enableSpeakerDiarization,
      hasCustomTerms: !!config.speechContexts && config.speechContexts.length > 0
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
    console.log('Google transcription raw response received:', data);
    
    // Validate API response
    if (!data || !data.results || data.results.length === 0) {
      console.error('Empty or invalid response from Google API:', data);
      throw new Error('No transcription results returned from Google API. The audio file may not contain recognizable speech or the format may be unsupported.');
    }
    
    // Format Google's response to our app's expected format
    const formattedResponse = formatGoogleResponse(data);
    console.log('Formatted response:', formattedResponse);
    
    return formattedResponse;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const processSingleFile = transcribeSingleFile;
