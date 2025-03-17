
/**
 * Helper functions for building Google Speech-to-Text API configuration
 */
import { DEFAULT_TRANSCRIPTION_OPTIONS } from '../config';

type TranscriptionOptions = typeof DEFAULT_TRANSCRIPTION_OPTIONS;

/**
 * Builds the request configuration for Google Speech-to-Text API
 */
export const buildRequestConfig = (
  encoding: string,
  sampleRate: number,
  options: TranscriptionOptions,
  customTerms: string[] = []
) => {
  const config: {
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
  } = {
    encoding: encoding,
    sampleRateHertz: sampleRate,
    languageCode: options.language || 'en-US',
    enableAutomaticPunctuation: options.punctuate,
    model: "latest_long",
    useEnhanced: true, // Use enhanced model for better quality
  };
  
  // Add diarization config if enabled
  if (options.diarize) {
    config.diarizationConfig = {
      enableSpeakerDiarization: true,
      minSpeakerCount: 2,
      maxSpeakerCount: 8
    };
  }
  
  // Add speech adaptation with customTerms
  addSpeechAdaptation(config, customTerms);
  
  return config;
};

/**
 * Adds speech contexts with custom terms and legal terminology
 */
const addSpeechAdaptation = (
  config: any, 
  customTerms: string[] = []
) => {
  config.speechContexts = [];
  
  // Common legal terms that improve transcription accuracy
  const commonLegalTerms = [
    "plaintiff", "defendant", "counsel", "objection", "sustained", 
    "overruled", "witness", "testimony", "exhibit", "evidence",
    "deposition", "affidavit", "stipulation", "pursuant to"
  ];
  
  if (customTerms && customTerms.length > 0) {
    // Add custom terms with higher boost
    config.speechContexts.push({
      phrases: customTerms,
      boost: 20.0 // Increased boost for user-provided terminology
    });
    
    // Filter out duplicates from common terms
    const additionalTerms = commonLegalTerms.filter(term => 
      !customTerms.includes(term)
    );
    
    if (additionalTerms.length > 0) {
      config.speechContexts.push({
        phrases: additionalTerms,
        boost: 10.0 // Lower boost for common legal terms
      });
    }
    
    console.log(`Added ${customTerms.length} custom terms and ${additionalTerms.length} common legal terms`);
  } else {
    // If no custom terms, still add common legal terminology
    config.speechContexts.push({
      phrases: commonLegalTerms,
      boost: 10.0
    });
    
    console.log(`Added ${commonLegalTerms.length} common legal terms to speech context`);
  }
};
