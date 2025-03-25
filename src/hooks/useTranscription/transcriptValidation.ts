
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
    
    // Direct string handling - if the response is already a string, use it
    if (typeof response === 'string' && response.trim().length > 0) {
      console.log("Response is already a string:", {
        length: response.length,
        sample: response.substring(0, 100)
      });
      return response;
    }
    
    // Check for empty responses
    if (!response) {
      console.error("Empty response received");
      return "No transcript content received from the API.";
    }
    
    // Try multiple extraction methods to ensure we get content
    let transcriptText = '';
    
    // Method 1: Use the standard extractor
    try {
      transcriptText = extractTranscriptText(response);
      console.log("Standard extraction result:", {
        length: transcriptText?.length,
        hasContent: Boolean(transcriptText && transcriptText.trim().length > 0),
        sample: transcriptText?.substring(0, 100)
      });
      
      if (transcriptText && transcriptText.trim().length > 0) {
        return transcriptText;
      }
    } catch (extractError) {
      console.warn("Standard extraction failed:", extractError);
    }
    
    // Method 2: Try direct access to common response paths
    console.log("Trying alternative extraction methods");
    
    // Try typical Google API response format
    if (response.results && Array.isArray(response.results)) {
      transcriptText = response.results
        .filter((result: any) => result.alternatives && result.alternatives.length > 0)
        .map((result: any) => result.alternatives[0].transcript)
        .join(' ');
        
      console.log("Alternative extraction from results.alternatives:", {
        length: transcriptText?.length,
        hasContent: Boolean(transcriptText && transcriptText.trim().length > 0),
        sample: transcriptText?.substring(0, 100)
      });
      
      if (transcriptText && transcriptText.trim().length > 0) {
        return transcriptText;
      }
    }
    
    // Try our formatted response structure
    if (response.results?.transcripts?.[0]?.transcript) {
      transcriptText = response.results.transcripts[0].transcript;
      console.log("Found transcript at results.transcripts[0].transcript:", {
        length: transcriptText?.length,
        hasContent: Boolean(transcriptText && transcriptText.trim().length > 0)
      });
      
      if (transcriptText && transcriptText.trim().length > 0) {
        return transcriptText;
      }
    }
    
    // Try channels format
    if (response.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      transcriptText = response.results.channels[0].alternatives[0].transcript;
      console.log("Found transcript in channels format:", {
        length: transcriptText?.length,
        hasContent: Boolean(transcriptText && transcriptText.trim().length > 0)
      });
      
      if (transcriptText && transcriptText.trim().length > 0) {
        return transcriptText;
      }
    }
    
    // Final fallback - try to find any text content in the response
    if (typeof response === 'object') {
      const findTextContent = (obj: any, depth: number = 0): string => {
        if (depth > 5) return ''; // Limit recursion depth
        
        for (const key in obj) {
          const value = obj[key];
          
          // If we find a string with meaningful content, return it
          if (typeof value === 'string' && value.trim().length > 50) {
            console.log(`Found text content in field "${key}":`, {
              length: value.length,
              sample: value.substring(0, 100)
            });
            return value;
          }
          // Recursively search nested objects
          else if (typeof value === 'object' && value !== null) {
            const nestedText = findTextContent(value, depth + 1);
            if (nestedText && nestedText.trim().length > 0) {
              return nestedText;
            }
          }
        }
        return '';
      };
      
      const foundText = findTextContent(response);
      if (foundText && foundText.trim().length > 0) {
        return foundText;
      }
    }
    
    // If we still don't have text, use a default message
    console.warn("Failed to extract any transcript text");
    return "No transcript content could be extracted. The audio may not contain recognizable speech.";
  } catch (error) {
    console.error("Error in transcript validation:", error);
    return "Error processing transcript. Please try again.";
  }
};
