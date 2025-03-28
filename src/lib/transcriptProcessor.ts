
/**
 * Transcript processing module
 * Implements processing via local fallback
 */
import { processWithOpenAI } from "./nlp/openaiService";

// Helper to read file content
const readFileContent = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Process transcript with AI or basic text processing
 */
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
    // Read file content
    const originalText = await readFileContent(file);
    
    if (!originalText || originalText.trim().length === 0) {
      throw new Error("The file does not contain any text to process");
    }
    
    let processedText = originalText;
    
    // If OpenAI processing is enabled and API key provided
    if (normalizedOptions.useAI && normalizedOptions.apiKey) {
      console.log("Processing transcript with OpenAI", {
        options: normalizedOptions,
        textLength: originalText.length
      });
      
      // Process with OpenAI
      processedText = await processWithOpenAI(
        originalText,
        {
          correctPunctuation: normalizedOptions.correctPunctuation,
          formatSpeakers: normalizedOptions.formatSpeakers,
          identifyParties: normalizedOptions.identifyParties,
          extractEntities: normalizedOptions.extractEntities,
          preserveFormatting: normalizedOptions.preserveFormatting,
          cleanFillers: normalizedOptions.cleanFillers
        },
        normalizedOptions.apiKey
      );
    } else {
      // Basic local processing
      console.log("Processing transcript with local methods", {
        options: normalizedOptions,
        textLength: originalText.length
      });
      
      // Apply basic formatting if needed
      if (normalizedOptions.correctPunctuation) {
        processedText = processedText
          // Add periods where needed
          .replace(/(\w)(\s+[A-Z])/g, '$1.$2')
          // Fix spacing around punctuation
          .replace(/\s+([.,;:!?])/g, '$1')
          // Add space after punctuation if not present
          .replace(/([.,;:!?])([A-Za-z])/g, '$1 $2')
          // Capitalize first letter of sentences
          .replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
      }
      
      // Format speaker labels
      if (normalizedOptions.formatSpeakers) {
        processedText = processedText
          .replace(/([a-z])(Speaker \d+:)/gi, '$1\n$2')
          .replace(/(Speaker \d+:)([a-zA-Z])/g, '$1 $2');
      }
      
      // Clean filler words
      if (normalizedOptions.cleanFillers) {
        const fillerWords = [' uh ', ' um ', ' er ', ' ah ', ' like ', ' you know ', ' i mean ', ' sort of ', ' kind of '];
        fillerWords.forEach(filler => {
          processedText = processedText.replace(new RegExp(filler, 'gi'), ' ');
        });
        // Clean up double spaces
        processedText = processedText.replace(/\s{2,}/g, ' ');
      }
    }
    
    // Apply basic entity extraction (simplified)
    const entities: Record<string, string[]> = {};
    
    if (normalizedOptions.extractEntities) {
      // Simple regex patterns for basic entity extraction
      const namePattern = /\b[A-Z][a-z]+ [A-Z][a-z]+\b/g;
      const datePattern = /\b\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}\b/g;
      const moneyPattern = /\$\d+(?:,\d{3})*(?:\.\d{2})?/g;
      
      // Extract entities with simple patterns
      const names = [...new Set([...(processedText.match(namePattern) || [])])];
      const dates = [...new Set([...(processedText.match(datePattern) || [])])];
      const money = [...new Set([...(processedText.match(moneyPattern) || [])])];
      
      if (names.length > 0) entities['People'] = names;
      if (dates.length > 0) entities['Dates'] = dates;
      if (money.length > 0) entities['Monetary Values'] = money;
    }
    
    return {
      originalText,
      correctedText: processedText,
      entities
    };
  } catch (error) {
    console.error("Error processing transcript:", error);
    
    // In case of failure, try to return the original text if available
    try {
      const originalText = await readFileContent(file);
      return {
        originalText,
        correctedText: originalText, // Return original text unchanged on error
        entities: {}
      };
    } catch {
      throw new Error("Failed to process the transcript file");
    }
  }
};
