
import { extractTranscriptText } from "@/lib/google";

// Validates transcript response with enhanced debugging and simpler validation
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
      responseType: typeof response,
      responseKeys: Object.keys(response),
      responseSample: JSON.stringify(response).substring(0, 200)
    });
    
    // Check for API errors in the response
    if (response.error) {
      console.error("API error in response:", response.error);
      throw new Error(`API error: ${response.error.message || "Unknown API error"}`);
    }
    
    // SIMPLIFIED APPROACH: Try multiple extraction methods to ensure we get text
    let transcriptText = '';
    
    // Method 1: Use the standard extractor
    try {
      transcriptText = extractTranscriptText(response);
      console.log("Standard extraction method result:", {
        length: transcriptText?.length,
        sample: transcriptText?.substring(0, 100)
      });
    } catch (extractError) {
      console.warn("Standard transcript extraction failed:", extractError);
    }
    
    // Method 2: If standard extraction failed or returned empty, try direct access
    if (!transcriptText || transcriptText.trim().length === 0) {
      if (response.results && Array.isArray(response.results)) {
        // Try to extract from alternatives
        transcriptText = response.results
          .filter((result: any) => result.alternatives && result.alternatives.length > 0)
          .map((result: any) => result.alternatives[0].transcript)
          .join(' ');
        
        console.log("Alternative extraction method result:", {
          length: transcriptText?.length,
          sample: transcriptText?.substring(0, 100)
        });
      }
    }
    
    // Method 3: If the response itself is a string, use it directly
    if ((!transcriptText || transcriptText.trim().length === 0) && typeof response === 'string') {
      transcriptText = response;
      console.log("Using raw response as transcript:", {
        length: transcriptText?.length,
        sample: transcriptText?.substring(0, 100)
      });
    }
    
    // Final check - if we still don't have text, this is an error
    if (!transcriptText || transcriptText.trim().length === 0) {
      console.error("Failed to extract any transcript text from response");
      
      // If we have results but no transcript, it might be a format issue
      if (response.results && response.results.length > 0) {
        console.error("Response has results but no extractable transcript:", 
                    JSON.stringify(response.results).substring(0, 300));
      }
      
      // Return a meaningful message instead of empty string
      return "No transcript content could be extracted from the API response.";
    }
    
    console.log("Successfully extracted transcript:", {
      length: transcriptText.length,
      wordCount: transcriptText.split(' ').length,
      sample: transcriptText.substring(0, 200)
    });
    
    return transcriptText;
  } catch (error) {
    console.error("Error validating transcript:", error);
    throw error;
  }
};
