
import { validateApiRequest, validateEncoding } from '../requestValidator';
import { buildRequestConfig } from '../configBuilder';

/**
 * Prepares and validates a Google Speech API request
 */
export function prepareTranscriptionRequest(
  apiKey: string, 
  audioContent: string, 
  options: any,
  actualEncoding?: string,
  requestId: string
) {
  try {
    // Validate inputs
    validateApiRequest(apiKey, audioContent);
    
    // If actualEncoding is provided (and not AUTO), use it instead of the options encoding
    const finalOptions = { ...options };
    if (actualEncoding && actualEncoding !== 'AUTO') {
      validateEncoding(actualEncoding);
      finalOptions.encoding = actualEncoding;
      
      // For WAV files, always let Google detect the sample rate from the header
      if (actualEncoding === 'LINEAR16') {
        delete finalOptions.sampleRateHertz;
        console.log(`[API:${requestId}] WAV format detected, omitting sampleRateHertz to use file header value`);
      }
    } else if (actualEncoding === 'AUTO') {
      // If set to AUTO, remove encoding and sampleRateHertz to let Google detect it
      delete finalOptions.encoding;
      delete finalOptions.sampleRateHertz;
      console.log(`[API:${requestId}] Auto-detecting encoding and sample rate from audio content`);
    } else {
      validateEncoding(options.encoding);
      
      // For WAV files, always let Google detect the sample rate from the header
      if (options.encoding === 'LINEAR16') {
        delete finalOptions.sampleRateHertz;
        console.log(`[API:${requestId}] WAV format detected, omitting sampleRateHertz to use file header value`);
      }
    }
    
    // Verify audio content seems valid
    if (audioContent.length < 1000) {
      console.warn(`[API:${requestId}] Audio content is suspiciously small (${audioContent.length} chars)`);
      throw new Error('Audio content appears to be too small or empty. Please check your audio file.');
    }
    
    // Build the configuration object
    const config = buildRequestConfig(finalOptions);
    
    // Log custom terms
    const customTerms = options.customTerms || [];
    if (customTerms.length > 0) {
      console.info(`[API:${requestId}] Added ${customTerms.length} custom terms with boost 15`);
    }
    
    // Log payload size for debugging
    const payloadSizeMB = (audioContent.length * 0.75 / 1024 / 1024).toFixed(2); // Convert base64 length to bytes, then to MB
    
    console.info(`[API:${requestId}] [${new Date().toISOString()}] Request config:`, {
      encoding: finalOptions.encoding || 'AUTO-DETECT',
      sampleRateHertz: config.sampleRateHertz || 'Omitted (using file header value)',
      languageCode: options.languageCode || 'en-US',
      model: config.model,
      useEnhanced: options.useEnhanced || true,
      enableSpeakerDiarization: options.enableSpeakerDiarization || false,
      hasCustomTerms: customTerms.length > 0,
      payloadSizeMB
    });
    
    // Prepare the request data
    const requestData = {
      config,
      audio: {
        content: audioContent,
      },
    };
    
    // For any audio larger than 1MB or potentially longer than 10 seconds, use longrunningrecognize
    // This ensures more reliable transcription for all but the smallest audio segments
    let apiEndpoint = 'speech:recognize';
    if (parseFloat(payloadSizeMB) > 0.3) { // If larger than 300KB, use longrunning
      apiEndpoint = 'speech:longrunningrecognize';
    }
    
    console.log(`[API:${requestId}] Using API endpoint: ${apiEndpoint} for ${payloadSizeMB}MB payload`);
    
    return { requestData, apiEndpoint };
  } catch (error) {
    console.error(`[API:${requestId}] Error preparing request:`, error);
    throw error;
  }
}
