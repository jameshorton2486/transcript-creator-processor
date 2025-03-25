
import { extractTranscriptText } from "@/lib/google";

// Simplifies transcript validation with reliable fallbacks for empty responses
export const validateTranscript = (response: any): string => {
  try {
    // Log received response for debugging
    console.log("Validating transcript response:", {
      responseType: typeof response,
      hasResults: Boolean(response?.results),
      responseSample: JSON.stringify(response).substring(0, 200)
    });
    
    // Check for empty responses
    if (!response) {
      console.error("Empty response received");
      return "No transcript content received from the API.";
    }
    
    // Direct string handling - if the response is already a string, use it
    if (typeof response === 'string' && response.trim().length > 0) {
      console.log("Response is already a string:", {
        length: response.length,
        sample: response.substring(0, 100)
      });
      return response;
    }
    
    // Try multiple extraction methods to ensure we get content
    let transcriptText = '';
    
    // Method 1: Use the standard extractor
    try {
      transcriptText = extractTranscriptText(response);
      console.log("Standard extraction result:", {
        length: transcriptText?.length,
        sample: transcriptText?.substring(0, 100)
      });
    } catch (extractError) {
      console.warn("Standard extraction failed:", extractError);
    }
    
    // Method 2: Try direct access to common response paths
    if (!transcriptText || transcriptText.trim().length === 0) {
      // Try typical Google API response format
      if (response.results && Array.isArray(response.results)) {
        transcriptText = response.results
          .filter((result: any) => result.alternatives && result.alternatives.length > 0)
          .map((result: any) => result.alternatives[0].transcript)
          .join(' ');
          
        console.log("Alternative extraction result:", {
          length: transcriptText?.length,
          sample: transcriptText?.substring(0, 100)
        });
      }
      // Try our formatted response structure
      else if (response.results?.transcripts?.[0]?.transcript) {
        transcriptText = response.results.transcripts[0].transcript;
        console.log("Found transcript at expected path:", {
          length: transcriptText?.length
        });
      }
      // Try channels format
      else if (response.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
        transcriptText = response.results.channels[0].alternatives[0].transcript;
        console.log("Found transcript in channels format:", {
          length: transcriptText?.length
        });
      }
    }
    
    // Final fallback - if we still don't have text, use a default message
    if (!transcriptText || transcriptText.trim().length === 0) {
      console.warn("Failed to extract any transcript text");
      return "No transcript content could be extracted. The audio may not contain recognizable speech.";
    }
    
    console.log("Successfully validated transcript:", {
      length: transcriptText.length,
      wordCount: transcriptText.split(' ').length
    });
    
    return transcriptText;
  } catch (error) {
    console.error("Error in transcript validation:", error);
    return "Error processing transcript. Please try again.";
  }
};
