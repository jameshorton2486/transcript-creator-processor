
/**
 * Compatibility adapter for existing code using AssemblyAI
 * This file maintains backward compatibility with AssemblyAI interfaces
 */
import { useDeepgramTranscription } from "@/hooks/useDeepgramTranscription";
import { transcribeAudioFile as deepgramTranscribe } from "@/lib/deepgram/transcriber";
import { mapModelName } from "@/lib/deepgram";
import { DeepgramTranscriptionOptions } from "@/hooks/useDeepgramTranscription/types";

/**
 * Adapter to provide AssemblyAI interface with Deepgram implementation
 */
export const useAssemblyAITranscription = (hookOptions?: any) => {
  // Simply use the Deepgram hook with the same interface
  return useDeepgramTranscription(hookOptions?.onTranscriptCreated, {
    // Map AssemblyAI options to Deepgram options
    diarize: hookOptions?.speakerLabels,
    punctuate: hookOptions?.punctuate,
    smart_format: hookOptions?.formatText,
    model: mapModelName(hookOptions?.model),
  });
};

/**
 * Direct adapter for AssemblyAI's transcribeAudioFile function
 */
export const transcribeAudioFile = async (
  file: File,
  apiKey: string,
  options: any = {}
) => {
  // Map AssemblyAI options to Deepgram options
  const deepgramOptions: DeepgramTranscriptionOptions = {
    language: options.language,
    diarize: options.speakerLabels,
    punctuate: options.punctuate,
    smart_format: options.formatText,
    model: mapModelName(options.model),
    onProgress: options.onProgress,
    abortSignal: options.abortSignal
  };

  return deepgramTranscribe(file, apiKey, deepgramOptions);
};
