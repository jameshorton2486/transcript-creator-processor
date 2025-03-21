
/**
 * Type definitions for AssemblyAI transcription
 */

// Interface for transcription options
export interface AssemblyAITranscriptionOptions {
  language?: string;
  speakerLabels?: boolean;
  punctuate?: boolean;
  formatText?: boolean;
  onProgress?: (progress: number) => void;
  abortSignal?: AbortSignal;
}
