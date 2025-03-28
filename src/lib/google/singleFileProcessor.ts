
/**
 * Single file processor adapter for AssemblyAI (replacing Google Speech-to-Text)
 */
import { TranscriptionOptions } from '@/lib/config';
import { transcribeAudio } from '@/lib/assemblyai/transcriber';

/**
 * Process a single audio file using AssemblyAI
 */
export const processSingleFile = async (
  file: File,
  apiKey: string,
  options: TranscriptionOptions,
  onProgress?: (progress: number) => void
): Promise<any> => {
  try {
    // Map the options to AssemblyAI format
    const assemblyOptions = {
      language: options.language || 'en',
      speakerLabels: options.speakerLabels ?? true,
      punctuate: options.punctuate ?? true,
      formatText: options.formatText ?? true,
      model: options.model || 'default',
      onProgress: onProgress || (() => {}),
      wordBoost: options.customTerms || []
    };
    
    // Use the AssemblyAI transcriber directly
    const result = await transcribeAudio(file, apiKey, assemblyOptions);
    
    return result;
  } catch (error) {
    console.error('Error in single file processor:', error);
    throw error;
  }
};

/**
 * Helper method to estimate transcription time based on file size
 */
export const estimateTranscriptionTime = (fileSizeMB: number): number => {
  // Rough estimate: 1MB audio ≈ 1 minute processing time
  // This is a very rough estimate and can vary widely
  return Math.max(30, fileSizeMB * 60); // in seconds, minimum 30 seconds
};
