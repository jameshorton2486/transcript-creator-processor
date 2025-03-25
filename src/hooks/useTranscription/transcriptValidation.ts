
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
      responseSample: JSON.stringify(response).substring(0, 200)
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
      hasNonWhitespace: transcriptText?.trim()?.length > 0,
      firstChars: transcriptText?.substring(0, 20)?.replace(/\n/g, "\\n"),
      asciiCodes: transcriptText?.substring(0, 20)?.split('').map(c => c.charCodeAt(0))
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
    
    // Additional check for empty transcript
    if (transcriptText.trim().length === 0) {
      console.warn("Transcript validation: Extracted transcript is empty or whitespace only!");
      console.log("Raw transcript text (first 100 chars):", transcriptText.substring(0, 100));
      
      // Try to extract text directly if possible
      if (typeof response === 'string' && response.trim().length > 0) {
        console.log("Using raw response as transcript instead");
        return response;
      }
      
      if (response.results && Array.isArray(response.results)) {
        // Try a different approach to extract text
        const altTranscript = response.results
          .filter((result: any) => result.alternatives && result.alternatives.length > 0)
          .map((result: any) => result.alternatives[0].transcript)
          .join(' ');
        
        if (altTranscript.trim().length > 0) {
          console.log("Using alternative extraction method, found transcript:", 
                     altTranscript.substring(0, 100));
          return altTranscript;
        }
      }
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
