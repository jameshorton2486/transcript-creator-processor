
import { extractTranscriptText } from "@/lib/google";

// Validates transcript response
export const validateTranscript = (response: any): string => {
  try {
    // First check if the response is valid
    if (!response) {
      console.error("Empty response received from API");
      throw new Error("No response received from API");
    }
    
    // Check for API errors in the response
    if (response.error) {
      console.error("API error in response:", response.error);
      throw new Error(`API error: ${response.error.message || "Unknown API error"}`);
    }
    
    // Extract the transcript text
    const transcriptText = extractTranscriptText(response);
    
    if (!transcriptText || 
        transcriptText === "No transcript available" || 
        transcriptText === "Error extracting transcript") {
      console.error("Failed to extract transcript from response:", response);
      
      // Check for empty results which might indicate audio decoding issues
      if (!response.results || response.results.length === 0) {
        throw new Error("No transcription results. This could be due to silent audio or an unsupported format.");
      }
      
      if (response.results && Array.isArray(response.results) && 
          response.results.length > 0 && 
          (!response.results[0].alternatives || response.results[0].alternatives.length === 0)) {
        throw new Error("Google could not recognize any speech in this audio file.");
      }
      
      throw new Error("Failed to extract transcript from the API response.");
    }
    
    return transcriptText;
  } catch (error) {
    console.error("Error validating transcript:", error);
    throw error;
  }
};
