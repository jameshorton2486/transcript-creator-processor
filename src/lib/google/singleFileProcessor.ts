
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { sendTranscriptionRequest } from './processor/apiRequest';
import { validateAudioFile, detectAudioEncoding } from './audio/audioValidation';
import { convertAudioToBase64 } from './audio/wavConverter';

/**
 * Process a single audio file with Google Speech-to-Text API
 */
export const transcribeSingleFile = async (
  file: File,
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS
): Promise<any> => {
  try {
    console.log(`[GOOGLE] Processing file: ${file.name} (${(file.size / 1024).toFixed(1)}KB)`);
    
    // Validate the file
    const validation = validateAudioFile(file);
    if (!validation.valid) {
      throw new Error(`Invalid audio file: ${validation.reason}`);
    }
    
    // Detect encoding from file
    const encoding = detectAudioEncoding(file);
    console.log(`[GOOGLE] Detected encoding: ${encoding}`);
    
    // Convert audio to base64
    const base64Audio = await convertAudioToBase64(file);
    
    // Create request config
    const requestOptions = {
      encoding: encoding,
      sampleRateHertz: options.sampleRateHertz || 16000,
      languageCode: options.languageCode || 'en-US',
      enableAutomaticPunctuation: options.enableAutomaticPunctuation,
      enableSpeakerDiarization: options.enableSpeakerDiarization,
      diarizationSpeakerCount: options.diarizationSpeakerCount,
      model: options.model || 'default',
      maxAlternatives: options.maxAlternatives || 1,
      enableWordTimeOffsets: options.enableWordTimeOffsets,
      profanityFilter: options.profanityFilter
    };
    
    // Send the request
    console.log('[GOOGLE] Sending transcription request...');
    const result = await sendTranscriptionRequest(base64Audio, apiKey, requestOptions);
    
    console.log('[GOOGLE] Transcription complete:', result);
    return result;
  } catch (error) {
    console.error('[GOOGLE] Transcription error:', error);
    throw error;
  }
};
