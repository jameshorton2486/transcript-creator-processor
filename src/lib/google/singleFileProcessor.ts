
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';
import { formatGoogleResponse } from './responseFormatter';

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
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    const base64Audio = arrayBufferToBase64(arrayBuffer);
    
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
    let encoding = "LINEAR16"; // Default for WAV
    if (file.type.includes("mp3") || file.name.toLowerCase().endsWith(".mp3")) {
      encoding = "MP3";
    } else if (file.type.includes("flac") || file.name.toLowerCase().endsWith(".flac")) {
      encoding = "FLAC";
    } else if (file.type.includes("ogg") || file.name.toLowerCase().endsWith(".ogg")) {
      encoding = "OGG_OPUS";
    }
    
    console.log(`Using encoding: ${encoding} for file type: ${file.type}`);
    
    // Prepare request body for Google Speech-to-Text API with a more flexible type
    const requestBody: {
      config: {
        encoding: string;
        sampleRateHertz?: number;
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
      };
      audio: {
        content: string;
      };
    } = {
      config: {
        encoding: encoding,
        sampleRateHertz: 16000,
        languageCode: transcriptionOptions.language,
        enableAutomaticPunctuation: transcriptionOptions.punctuate,
        model: "latest_long",
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
    
    // Add speech contexts if custom terms are provided
    if (customTerms && customTerms.length > 0) {
      requestBody.config.speechContexts = [{
        phrases: customTerms,
        boost: 15.0 // Provide a significant boost for these custom terms
      }];
      
      console.log(`Added ${customTerms.length} custom terms to speech context`);
    }
    
    // Remove sampleRateHertz for MP3 files as Google auto-detects it
    if (encoding === "MP3" || encoding === "OGG_OPUS") {
      delete requestBody.config.sampleRateHertz;
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
