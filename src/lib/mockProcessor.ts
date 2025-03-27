
/**
 * Transcript processing module (previously mock processor)
 * Now implements real processing via OpenAI or local fallback
 */

import { processTranscript as processWithAPI, categorizeEntities } from "./nlp/apiProcessor";
import { TextProcessingOptions } from "./nlp/textProcessor";

// Re-export the main function with the same interface as before
export const processTranscript = async (
  file: File,
  options: {
    correctPunctuation: boolean;
    extractEntities: boolean;
    preserveFormatting: boolean;
    useAI?: boolean;
    apiKey?: string;
    formatSpeakers?: boolean;
    identifyParties?: boolean;
    cleanFillers?: boolean;
  }
): Promise<{
  correctedText: string;
  originalText: string;
  entities: Record<string, string[]>;
}> => {
  // Normalize options to ensure all required fields exist
  const normalizedOptions = {
    correctPunctuation: options.correctPunctuation ?? true,
    extractEntities: options.extractEntities ?? false,
    preserveFormatting: options.preserveFormatting ?? true,
    useAI: options.useAI ?? false,
    apiKey: options.apiKey ?? "",
    formatSpeakers: options.formatSpeakers ?? true,
    identifyParties: options.identifyParties ?? true,
    cleanFillers: options.cleanFillers ?? true
  };
  
  try {
    // Process the transcript using our real implementation
    const result = await processWithAPI(file, normalizedOptions);
    
    // If entity extraction was requested, categorize the entities
    if (normalizedOptions.extractEntities && Object.keys(result.entities).length > 0) {
      const categorized = categorizeEntities(result.entities);
      return {
        ...result,
        entities: categorized
      };
    }
    
    return result;
  } catch (error) {
    console.error("Error processing transcript:", error);
    
    // In case of failure, return the original text and empty entities
    const originalText = await readFileContent(file);
    return {
      originalText,
      correctedText: originalText, // Return original text unchanged on error
      entities: {}
    };
  }
};

// Helper to read file content
const readFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};
