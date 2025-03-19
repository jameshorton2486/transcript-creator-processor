
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
    const audioProperties = await analyzeAudioFile(audioArrayBuffer).catch(error => {
      console.warn(`[AUDIO ANALYSIS] Failed to analyze audio, using fallback properties: ${error}`);
      // Return fallback properties if analysis fails
      return {
        numberOfChannels: 1,
        sampleRate: 16000,
        duration: (audioArrayBuffer.byteLength / 32000), // Rough estimate based on 16-bit, 16kHz mono
      };
    });
    
    console.info(`[AUDIO INFO] Original audio: ${audioProperties.numberOfChannels} channels, ${audioProperties.sampleRate} Hz, ${audioProperties.duration.toFixed(2)}s`);
    
    try {
      // Process audio - convert to mono and resample to 16000 Hz
      console.info(`[PROCESSING] Resampling audio to 16000 Hz and converting to mono...`);
      const { resampled } = await resampleAudio(audioArrayBuffer, 16000);
      console.info(`[PROCESSING] Successfully resampled audio to 16000 Hz (mono)`);
      
      return { resampled, audioProperties };
    } catch (resampleError) {
      console.error(`[PROCESSING] Resampling failed: ${resampleError}. Using original audio.`);
      
      // If resampling fails, return the original audio
      // This ensures the process doesn't completely fail if resampling has issues
      return {
        resampled: audioArrayBuffer,
        audioProperties
      };
    }
  } catch (error) {
    console.error('Error preprocessing audio:', error);
    
    // Instead of failing, provide a fallback that allows processing to continue
    console.info('[FALLBACK] Using original audio without preprocessing');
    
    return {
      resampled: audioArrayBuffer, 
      audioProperties: {
        numberOfChannels: 1,
        sampleRate: 16000,
        duration: (audioArrayBuffer.byteLength / 32000), // Rough estimate based on 16-bit, 16kHz mono
      }
    };
  }
};

/**
 * Converts an ArrayBuffer to base64 encoding
 */
export const arrayBufferToBase64 = async (buffer: ArrayBuffer): Promise<string> => {
  return new Promise<string>((resolve, reject) => {
    try {
      const blob = new Blob([buffer], { type: 'audio/wav' });
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          const base64 = result.split(',')[1];
          
          if (!base64) {
            console.warn('Failed to extract base64 data. Attempting alternative encoding method.');
            // Fallback method for base64 conversion
            const bytes = new Uint8Array(buffer);
            let binary = '';
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            resolve(window.btoa(binary));
            return;
          }
          
          resolve(base64);
        } catch (parseError) {
          console.error('Error parsing FileReader result:', parseError);
          // Fallback method
          const bytes = new Uint8Array(buffer);
          let binary = '';
          const len = bytes.byteLength;
          for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          resolve(window.btoa(binary));
        }
      };
      
      reader.onerror = (error) => {
        console.error('Error converting to base64:', error);
        reject(new Error('Failed to convert audio to base64 format.'));
      };
      
      reader.readAsDataURL(blob);
    } catch (blobError) {
      console.error('Error creating Blob:', blobError);
      reject(new Error('Failed to create Blob from audio data.'));
    }
  });
};

/**
 * Simple direct binary to base64 conversion
 * Used as a fallback when other methods fail
 */
export const directBufferToBase64 = (buffer: ArrayBuffer): string => {
  try {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  } catch (error) {
    console.error('Error in direct base64 conversion:', error);
    throw new Error('Failed to convert audio to base64 format using direct method.');
  }
};
