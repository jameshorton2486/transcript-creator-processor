
import { analyzeAudioFile, resampleAudio } from '../../audio/audioResampler';

/**
 * Handles the pre-processing of audio files before sending to the Google API
 * Includes analysis, resampling, and conversion to mono
 */
export const preprocessAudioFile = async (audioArrayBuffer: ArrayBuffer): Promise<{
  resampled: ArrayBuffer;
  audioProperties: {
    numberOfChannels: number;
    sampleRate: number;
    duration: number;
  };
}> => {
  try {
    // Analyze the audio to check channels and sample rate
    const audioProperties = await analyzeAudioFile(audioArrayBuffer);
    console.info(`[AUDIO INFO] Original audio: ${audioProperties.numberOfChannels} channels, ${audioProperties.sampleRate} Hz, ${audioProperties.duration.toFixed(2)}s`);
    
    // Process audio - convert to mono and resample to 16000 Hz
    console.info(`[PROCESSING] Resampling audio to 16000 Hz and converting to mono...`);
    const { resampled } = await resampleAudio(audioArrayBuffer, 16000);
    console.info(`[PROCESSING] Successfully resampled audio to 16000 Hz (mono)`);
    
    return { resampled, audioProperties };
  } catch (error) {
    console.error('Error preprocessing audio:', error);
    throw new Error(`Failed to preprocess audio: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Converts an ArrayBuffer to base64 encoding
 */
export const arrayBufferToBase64 = async (buffer: ArrayBuffer): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    const blob = new Blob([buffer], { type: 'audio/wav' });
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const result = e.target?.result as string;
      const base64 = result.split(',')[1];
      
      if (!base64) {
        reject(new Error('Failed to convert audio to base64 format.'));
        return;
      }
      
      resolve(base64);
    };
    
    reader.onerror = (error) => {
      console.error('Error converting to base64:', error);
      reject(new Error('Failed to convert audio to base64 format.'));
    };
    
    reader.readAsDataURL(blob);
  });
};
