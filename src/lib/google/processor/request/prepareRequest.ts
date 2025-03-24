
/**
 * Prepares the request payload for the Google Speech-to-Text API
 */
export const prepareRequest = (
  audioBuffer: Buffer, 
  apiKey: string, 
  config: any
) => {
  const requestBody: any = {
    audio: {
      content: audioBuffer.toString('base64')
    },
    config: {
      encoding: config.encoding,
      sampleRateHertz: config.sampleRateHertz || 16000,
      languageCode: config.languageCode || 'en-US',
      enableAutomaticPunctuation: config.enableAutomaticPunctuation !== false,
      model: config.model || 'latest_long',
      enableWordTimeOffsets: config.enableWordTimeOffsets === true,
      useEnhanced: config.useEnhanced === true
    }
  };

  // Add diarization config if it's provided
  if (config.diarizationConfig && config.diarizationConfig.enableSpeakerDiarization) {
    requestBody.config.diarizationConfig = {
      enableSpeakerDiarization: true,
      minSpeakerCount: config.diarizationConfig.minSpeakerCount || 2,
      maxSpeakerCount: config.diarizationConfig.maxSpeakerCount || 6
    };
    
    // Ensure word time offsets are enabled when using diarization
    requestBody.config.enableWordTimeOffsets = true;
  }

  // Add API key
  return requestBody;
};
