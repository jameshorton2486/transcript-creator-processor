
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { formatGoogleResponse } from './responseFormatter';
import { preprocessAudioFile } from '../audio/preprocessor';
import { getAudioContext, fileToAudioBuffer } from '../audio/audioContext';

/**
 * Converts ArrayBuffer to base64 string
 */
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
};

/**
 * Process a single file (for files under 10MB)
 */
export const transcribeSingleFile = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS,
  customTerms: string[] = []
) => {
  try {
    console.log(`Processing file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
    
    // Preprocess audio to improve quality for better transcription
    console.log("Starting audio preprocessing...");
    const preprocessedAudio = await preprocessAudioFile(file);
    console.log("Audio preprocessing complete");

    // Detect actual sample rate from the audio file
    console.log("Detecting audio sample rate...");
    const audioContext = getAudioContext();
    const audioBuffer = await audioContext.decodeAudioData(preprocessedAudio.slice(0));
    const actualSampleRate = audioBuffer.sampleRate;
    console.log(`Detected actual sample rate: ${actualSampleRate} Hz`);
    
    const base64Audio = arrayBufferToBase64(preprocessedAudio);
    
    // Set up transcription options based on our default options
    const transcriptionOptions = {
      punctuate: options.punctuate,
      diarize: options.diarize,
      paragraphs: options.paragraphs,
      utterances: options.utterances,
      numerals: options.numerals,
      language: 'en-US'
    };
    
    // Detect audio encoding based on file type
    let encoding = "LINEAR16"; // Default for WAV (preprocessed audio is in WAV format)
    
    console.log(`Using encoding: ${encoding} for preprocessed audio with sample rate: ${actualSampleRate} Hz`);
    
    // Prepare request body for Google Speech-to-Text API with a more flexible type
    const requestBody: {
      config: {
        encoding: string;
        sampleRateHertz: number;
        languageCode: string;
        enableAutomaticPunctuation: boolean;
        model: string;
        diarizationConfig?: {
          enableSpeakerDiarization: boolean;
          minSpeakerCount: number;
          maxSpeakerCount: number;
        };
        speechContexts?: {
          phrases: string[];
          boost?: number;
        }[];
        profanityFilter?: boolean;
        useEnhanced?: boolean;
      };
      audio: {
        content: string;
      };
    } = {
      config: {
        encoding: encoding,
        sampleRateHertz: actualSampleRate, // Use detected sample rate instead of hardcoded value
        languageCode: transcriptionOptions.language,
        enableAutomaticPunctuation: transcriptionOptions.punctuate,
        model: "latest_long",
        useEnhanced: true, // Use enhanced model for better quality
      },
      audio: {
        content: base64Audio
      }
    };
    
    // Add diarization config if enabled (using the updated API format)
    if (transcriptionOptions.diarize) {
      requestBody.config.diarizationConfig = {
        enableSpeakerDiarization: true,
        minSpeakerCount: 2,
        maxSpeakerCount: 8
      };
    }
    
    // Enhanced speech adaptation with customTerms and improvements for legal terminology
    if (customTerms && customTerms.length > 0) {
      // Add speech contexts with a higher boost for legal terms
      requestBody.config.speechContexts = [{
        phrases: customTerms,
        boost: 20.0 // Increased boost for legal terminology
      }];
      
      // For legal transcripts, we might also want to add common legal phrases
      // even if not explicitly provided in custom terms
      const commonLegalTerms = [
        "plaintiff", "defendant", "counsel", "objection", "sustained", 
        "overruled", "witness", "testimony", "exhibit", "evidence",
        "deposition", "affidavit", "stipulation", "pursuant to"
      ];
      
      // Filter out any duplicates
      const additionalTerms = commonLegalTerms.filter(term => 
        !customTerms.includes(term)
      );
      
      if (additionalTerms.length > 0) {
        requestBody.config.speechContexts.push({
          phrases: additionalTerms,
          boost: 10.0 // Lower boost for common legal terms
        });
      }
      
      console.log(`Added ${customTerms.length} custom terms and ${additionalTerms.length} common legal terms to speech context`);
    } else {
      // If no custom terms provided, still add common legal terminology
      const commonLegalTerms = [
        "plaintiff", "defendant", "counsel", "objection", "sustained", 
        "overruled", "witness", "testimony", "exhibit", "evidence",
        "deposition", "affidavit", "stipulation", "pursuant to"
      ];
      
      requestBody.config.speechContexts = [{
        phrases: commonLegalTerms,
        boost: 10.0
      }];
      
      console.log(`Added ${commonLegalTerms.length} common legal terms to speech context`);
    }
    
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
