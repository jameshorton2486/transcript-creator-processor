
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
      const preprocessedAudio = await preprocessAudioFile(file);
      console.log("Audio preprocessing complete");

      // Detect actual sample rate from the audio file
      console.log("Detecting audio sample rate...");
      const audioContext = getAudioContext();
      const audioBuffer = await audioContext.decodeAudioData(preprocessedAudio.slice(0));
      actualSampleRate = audioBuffer.sampleRate;
      console.log(`Detected actual sample rate: ${actualSampleRate} Hz`);
      
      base64Audio = arrayBufferToBase64(preprocessedAudio);
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
    console.log('Google transcription completed successfully');
    
    // Format Google's response to our app's expected format
    return formatGoogleResponse(data);
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
};

// Alias for backward compatibility
export const processSingleFile = transcribeSingleFile;
