
import { TranscriptionConfig } from '../types';

/**
 * Prepares the request object for the Google Speech-to-Text API
 * This is a critical point where diarization settings MUST be properly configured
 */
export function prepareRequest(
  audioContent: Buffer, 
  apiKey: string, 
  config: TranscriptionConfig
) {
  const audio = {
    content: audioContent.toString('base64')
  };
  
  // Ensure diarization settings are properly configured
  const requestConfig: any = { ...config };
  
  // If speaker diarization is enabled, ensure we have the proper diarization config
  if (config.enableSpeakerDiarization || (config.diarizationConfig && config.diarizationConfig.enableSpeakerDiarization)) {
    // Make sure we always have a complete diarization config
    requestConfig.diarizationConfig = {
      enableSpeakerDiarization: true,
      minSpeakerCount: config.diarizationConfig?.minSpeakerCount || 2,
      maxSpeakerCount: config.diarizationConfig?.maxSpeakerCount || 6
    };
    
    // Ensure word time offsets are enabled - required for speaker diarization
    requestConfig.enableWordTimeOffsets = true;
    
    // Log the diarization configuration for debugging
    console.log('Prepared request with diarization config:', {
      enableSpeakerDiarization: requestConfig.diarizationConfig.enableSpeakerDiarization,
      minSpeakerCount: requestConfig.diarizationConfig.minSpeakerCount,
      maxSpeakerCount: requestConfig.diarizationConfig.maxSpeakerCount,
      enableWordTimeOffsets: requestConfig.enableWordTimeOffsets
    });
  }
  
  // Prepare the full request object
  return {
    audio,
    config: requestConfig
  };
}
