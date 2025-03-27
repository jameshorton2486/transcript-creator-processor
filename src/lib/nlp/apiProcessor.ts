
/**
 * API-based transcript and entity processing
 */

import { processWithOpenAI } from "./openaiService";
import { CategorizedEntities, processEntities } from "@/utils/entityProcessingUtils";

// Configuration for processing API requests
export interface ProcessingConfig {
  useAI: boolean;
  apiKey?: string;
  correctPunctuation: boolean;
  formatSpeakers: boolean;
  identifyParties: boolean;
  extractEntities: boolean;
  preserveFormatting: boolean;
  cleanFillers: boolean;
}

/**
 * Process a transcript file with OpenAI or local processing
 * 
 * @param file The transcript file to process
 * @param options Processing options
 * @returns Processed text and extracted entities
 */
export const processTranscript = async (
  file: File,
  options: ProcessingConfig
): Promise<{
  originalText: string;
  correctedText: string;
  entities: Record<string, string[]>;
}> => {
  try {
    // Read the file content
    const originalText = await readFileAsText(file);
    
    if (!originalText) {
      throw new Error("Failed to read file content");
    }
    
    // Process the text with OpenAI if API key is provided
    let correctedText = originalText;
    let entities: Record<string, string[]> = {};
    
    if (options.useAI && options.apiKey) {
      // Use OpenAI for text processing
      correctedText = await processWithOpenAI(
        originalText,
        {
          correctPunctuation: options.correctPunctuation,
          formatSpeakers: options.formatSpeakers,
          identifyParties: options.identifyParties,
          extractEntities: options.extractEntities,
          preserveFormatting: options.preserveFormatting,
          cleanFillers: options.cleanFillers
        },
        options.apiKey
      );
      
      // Extract entities using OpenAI if enabled
      if (options.extractEntities) {
        entities = await extractEntitiesWithAI(originalText, options.apiKey);
      }
    } else {
      // Use local processing fallback
      // Here we'd use a local NLP library if available
      // For now, we'll return mostly unprocessed text
      if (options.correctPunctuation) {
        correctedText = basicPunctuationFix(originalText);
      }
      if (options.cleanFillers) {
        correctedText = removeFillerWords(correctedText);
      }
    }
    
    return {
      originalText,
      correctedText,
      entities
    };
  } catch (error) {
    console.error("Error processing transcript:", error);
    throw new Error("Failed to process transcript");
  }
};

/**
 * Read file content as text
 */
const readFileAsText = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

/**
 * Basic punctuation fixes for local processing
 */
const basicPunctuationFix = (text: string): string => {
  return text
    // Add periods where needed
    .replace(/(\w)(\s+[A-Z])/g, '$1.$2')
    // Fix spacing around punctuation
    .replace(/\s+([.,;:!?])/g, '$1')
    // Add space after punctuation if not present
    .replace(/([.,;:!?])([A-Za-z])/g, '$1 $2')
    // Capitalize first letter of sentences
    .replace(/([.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
};

/**
 * Remove common filler words for local processing
 */
const removeFillerWords = (text: string): string => {
  const fillerWords = ['uh', 'um', 'er', 'ah', 'like', 'you know', 'i mean', 'sort of', 'kind of'];
  let result = text;
  
  fillerWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    result = result.replace(regex, '');
  });
  
  // Clean up double spaces created by removals
  return result.replace(/\s{2,}/g, ' ');
};

/**
 * Extract entities from text using OpenAI
 */
const extractEntitiesWithAI = async (text: string, apiKey: string): Promise<Record<string, string[]>> => {
  try {
    const prompt = `
You are an expert legal transcript analyzer. Extract and categorize all important entities from this transcript.
Format your response as a JSON object with these categories:
- PERSON: All individual names
- ORG: Organizations, law firms, companies
- COURT: Court names and references
- CASE: Case numbers, docket references
- LAW: Legal terms, statutes, regulations
- GPE: Locations, jurisdictions
- DATE: All dates mentioned

Transcript:
${text.substring(0, 3000)} // Limit length to avoid token limits
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_tokens: 1000,
        messages: [
          { role: "system", content: "You are a legal entity extraction specialist." },
          { role: "user", content: prompt }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const result = await response.json();
    const content = result.choices[0].message.content;
    
    // Extract JSON from the response
    try {
      // Find JSON structure in the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const jsonStr = jsonMatch[0];
        const entities = JSON.parse(jsonStr);
        return entities;
      }
    } catch (jsonError) {
      console.error("Error parsing entity JSON:", jsonError);
    }
    
    // Fallback: empty entities
    return {};
  } catch (error) {
    console.error("Error extracting entities with AI:", error);
    return {}; // Return empty entities on error
  }
};

/**
 * Process and categorize entities into a more user-friendly structure
 */
export const categorizeEntities = (rawEntities: Record<string, string[]>): CategorizedEntities => {
  return processEntities(rawEntities);
};
