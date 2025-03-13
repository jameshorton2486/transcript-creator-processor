
import { createClient } from '@deepgram/sdk';
import { DEFAULT_TRANSCRIPTION_OPTIONS } from './config';

// This service handles communication with Deepgram API
export const transcribeAudio = async (
  file: File, 
  apiKey: string,
  options = DEFAULT_TRANSCRIPTION_OPTIONS
) => {
  try {
    // Create a Deepgram client
    const deepgram = createClient(apiKey);
    
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Set up transcription options based on our default options
    const transcriptionOptions = {
      punctuate: options.punctuate,
      diarize: options.diarize,
      paragraphs: options.paragraphs,
      utterances: options.utterances,
      numerals: options.numerals,
      model: 'nova-2',
      language: 'en',
      smart_format: true
    };
    
    // Log what we're doing
    console.log(`Transcribing ${file.name} with Deepgram`);
    console.log('Options:', transcriptionOptions);
    
    // Make the API call - Convert arrayBuffer to Buffer for Deepgram
    // Use the Buffer.from method to create a Buffer from the Uint8Array
    const buffer = Buffer.from(arrayBuffer);
    
    const response = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        mimetype: file.type,
        options: transcriptionOptions
      }
    );
    
    console.log('Deepgram transcription completed successfully');
    return response;
  } catch (error) {
    console.error('Deepgram transcription error:', error);
    throw error;
  }
};

// Helper function to extract plain text transcript from Deepgram response
export const extractTranscriptText = (response: any): string => {
  try {
    if (!response || !response.results || !response.results.channels || 
        response.results.channels.length === 0 || 
        !response.results.channels[0].alternatives || 
        response.results.channels[0].alternatives.length === 0) {
      return "No transcript available";
    }
    
    return response.results.channels[0].alternatives[0].transcript || "No transcript available";
  } catch (error) {
    console.error('Error extracting transcript text:', error);
    return "Error extracting transcript";
  }
};
