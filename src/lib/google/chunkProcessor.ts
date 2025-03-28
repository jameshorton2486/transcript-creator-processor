
/**
 * Adapter for AssemblyAI transcription on audio chunks
 * This file replaces the Google STT implementation with AssemblyAI
 */
import { TranscriptionOptions } from "@/lib/config";
import { transcribeAudio } from "@/lib/assemblyai/transcriber";

// Maps chunk index to transcription results
const chunkTranscriptionCache = new Map();

/**
 * Process an audio chunk using AssemblyAI
 */
export const processAudioChunk = async (
  chunk: ArrayBuffer,
  chunkIndex: number,
  apiKey: string,
  options: TranscriptionOptions,
  onProgress: (progress: number) => void
): Promise<any> => {
  // Check if we already processed this chunk
  if (chunkTranscriptionCache.has(chunkIndex)) {
    return chunkTranscriptionCache.get(chunkIndex);
  }

  try {
    // Convert ArrayBuffer to File for AssemblyAI API
    const fileName = `chunk-${chunkIndex}.wav`;
    const file = new File([chunk], fileName, { type: 'audio/wav' });
    
    // Map options to AssemblyAI format, ensuring model type compatibility
    const assemblyOptions = {
      language: options.language || 'en',
      speakerLabels: options.speakerLabels ?? true,
      punctuate: options.punctuate ?? true,
      formatText: options.formatText ?? true,
      model: (options.model || 'default') as "default" | "standard" | "enhanced" | "nova2",
      wordBoost: options.customTerms || [],
      onProgress
    };
    
    // Use the AssemblyAI transcriber
    const result = await transcribeAudio(file, apiKey, assemblyOptions);
    
    // Cache the result
    chunkTranscriptionCache.set(chunkIndex, result);
    
    return result;
  } catch (error) {
    console.error(`Error transcribing chunk ${chunkIndex}:`, error);
    throw error;
  }
};

/**
 * Clear the chunk transcription cache
 */
export const clearChunkCache = (): void => {
  chunkTranscriptionCache.clear();
};

/**
 * Process multiple audio chunks and combine results
 */
export const processAudioChunks = async (
  chunks: ArrayBuffer[],
  apiKey: string,
  options: TranscriptionOptions,
  onProgress: (progress: number) => void
): Promise<any> => {
  if (!chunks.length) {
    throw new Error('No audio chunks provided for transcription');
  }
  
  const results = [];
  let overallProgress = 0;
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const chunkProgress = (progress: number) => {
      // Calculate overall progress based on this chunk's progress and total chunks
      const chunkContribution = progress / chunks.length;
      const previousChunksContribution = (i / chunks.length) * 100;
      overallProgress = previousChunksContribution + chunkContribution;
      onProgress(overallProgress);
    };
    
    const result = await processAudioChunk(
      chunk,
      i,
      apiKey,
      options,
      chunkProgress
    );
    
    results.push(result);
  }
  
  // Combine results (simplified - in a real application, you'd want more sophisticated combining)
  const combinedResult = {
    results: {
      transcripts: [{
        transcript: results.map(r => r.results.transcripts[0].transcript).join(' '),
        confidence: results.reduce((acc, r) => acc + r.results.transcripts[0].confidence, 0) / results.length
      }]
    }
  };
  
  return combinedResult;
};
