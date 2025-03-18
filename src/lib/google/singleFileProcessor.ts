
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { formatGoogleResponse } from './formatters/responseFormatter';
import { preprocessAudioFile } from '../audio/preprocessor';
import { processAudioContent, detectActualSampleRate, shouldUseDirectUpload } from './processor/audioUtils';
import { sendTranscriptionRequest } from './processor/apiRequest';

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
    
    // Determine encoding and processing approach
    const { encoding, useDirectUpload } = shouldUseDirectUpload(file, skipBrowserDecoding);
    
    let base64Audio;
    let actualSampleRate;
    
    if (!useDirectUpload) {
      // Try preprocessing with browser audio processing first
      console.log("Starting audio preprocessing...");
      try {
        const preprocessedAudio = await preprocessAudioFile(file);
        console.log("Audio preprocessing complete");
        
        // Detect sample rate from preprocessed audio
        const detectedSampleRate = await detectActualSampleRate(preprocessedAudio.slice(0));
        
        if (detectedSampleRate) {
          actualSampleRate = detectedSampleRate;
          const audioBuffer = await preprocessedAudio.slice(0);
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64data = reader.result as string;
              resolve(base64data.split(',')[1]);
            };
            reader.readAsDataURL(new Blob([audioBuffer]));
          });
          base64Audio = base64;
        } else {
          // If sample rate detection fails, fall back to direct upload
          const result = await processAudioContent(file, true, encoding);
          base64Audio = result.base64Audio;
          actualSampleRate = result.actualSampleRate;
        }
      } catch (error) {
        console.error("Audio preprocessing failed, using direct upload:", error);
        // If preprocessing fails, fall back to direct upload
        const result = await processAudioContent(file, true, encoding);
        base64Audio = result.base64Audio;
        actualSampleRate = result.actualSampleRate;
      }
    } else {
      // Use direct upload for files that should skip browser processing
      const result = await processAudioContent(file, true, encoding);
      base64Audio = result.base64Audio;
      actualSampleRate = result.actualSampleRate;
    }
    
    // Send request to Google Speech API
    const data = await sendTranscriptionRequest(
      apiKey,
      base64Audio,
      encoding,
      actualSampleRate,
      options,
      customTerms
    );
    
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
