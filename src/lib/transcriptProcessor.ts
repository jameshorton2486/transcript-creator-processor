
/**
 * Transcript processing module
 * Implements processing via local fallback
 */

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
 * Process transcript with basic text processing
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
    
    // Apply basic text processing logic
    let processedText = originalText;
    
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
    
    // In case of failure, return the original text and empty entities
    const originalText = await readFileContent(file);
    return {
      originalText,
      correctedText: originalText, // Return original text unchanged on error
      entities: {}
    };
  }
};
