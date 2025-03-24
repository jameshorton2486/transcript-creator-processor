
/**
 * Prepares the request object for the Google Speech-to-Text API
 */
export function prepareRequest(audioBytes: Buffer, apiKey: string, config: any): any {
  // Log the configuration for debugging
  console.log('Preparing Google Speech-to-Text request with config:', JSON.stringify(config, null, 2));
  
  // Ensure diarization config is properly set up
  if (config.enableSpeakerDiarization) {
    console.log('Speaker diarization is enabled with speaker count:', config.diarizationSpeakerCount);
    
    // Make sure the diarization config is properly formatted for the API
    if (!config.diarizationConfig) {
      console.log('Creating diarizationConfig object since it was not provided');
      config.diarizationConfig = {
        enableSpeakerDiarization: true,
        minSpeakerCount: 2,
        maxSpeakerCount: config.diarizationSpeakerCount || 6
      };
    }
  }
  
  // Audio content should be base64 encoded for the API
  const base64Audio = audioBytes.toString('base64');
  
  return {
    config: {
      encoding: config.encoding,
      sampleRateHertz: config.sampleRateHertz,
      languageCode: config.languageCode || 'en-US',
      maxAlternatives: config.maxAlternatives || 1,
      enableAutomaticPunctuation: config.enableAutomaticPunctuation !== false,
      enableWordTimeOffsets: config.enableWordTimeOffsets !== false,
      enableSpeakerDiarization: config.enableSpeakerDiarization === true,
      diarizationSpeakerCount: config.diarizationSpeakerCount || 2,
      model: config.model || 'latest_long',
      useEnhanced: config.useEnhanced !== false,
      
      // Speech adaptation for custom vocabulary if provided
      speechContexts: config.speechContexts || [],
      
      // Include proper diarization config structure for the API
      diarizationConfig: config.diarizationConfig || {
        enableSpeakerDiarization: config.enableSpeakerDiarization === true,
        minSpeakerCount: 2,
        maxSpeakerCount: config.diarizationSpeakerCount || 6
      }
    },
    audio: {
      content: base64Audio
    }
  };
}
