
import { extractTranscriptText } from "@/lib/google";

// Validates transcript response with enhanced debugging
export const validateTranscript = (response: any): string => {
  try {
    // First check if the response is valid
    if (!response) {
      console.error("Empty response received from API", { response });
      throw new Error("No response received from API");
    }
    
    // Log the response structure for debugging
    console.log("Validating transcript response:", {
      hasResults: Boolean(response.results),
      resultCount: response.results?.length,
      hasTranscripts: Boolean(response.results?.transcripts),
      hasChannels: Boolean(response.results?.channels),
      isArray: Array.isArray(response.results),
      firstResultHasAlternatives: response.results?.[0]?.alternatives?.length > 0,
      responseType: typeof response,
      responseKeys: Object.keys(response),
    });
    
    // Check for API errors in the response
    if (response.error) {
      console.error("API error in response:", response.error);
      throw new Error(`API error: ${response.error.message || "Unknown API error"}`);
    }
    
    // Extract the transcript text with enhanced logging
    const transcriptText = extractTranscriptText(response);
    console.log("extractTranscriptText returned:", {
      text: transcriptText?.substring(0, 100),
      length: transcriptText?.length,
      type: typeof transcriptText,
      isEmpty: transcriptText === '',
      isUndefined: transcriptText === undefined,
      isNull: transcriptText === null,
      hasNonWhitespace: transcriptText?.trim()?.length > 0
    });
    
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
    
    // Log success details
    console.log("Transcript validation successful:", {
      transcriptLength: transcriptText.length,
      firstFewWords: transcriptText.split(' ').slice(0, 5).join(' '),
      hasContent: transcriptText.trim().length > 0
    });
    
    return transcriptText;
  } catch (error) {
    console.error("Error validating transcript:", error);
    throw error;
  }
};
