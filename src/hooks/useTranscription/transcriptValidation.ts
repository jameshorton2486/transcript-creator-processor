
import { extractTranscriptText } from "@/lib/google";

// More permissive transcript validation with better fallbacks
export const validateTranscript = (response: any): string => {
  try {
    // Initial logging of what we received
    console.log("[TRANSCRIPT VALIDATION] Starting validation of transcript:", {
      responseType: typeof response,
      hasResults: Boolean(response?.results),
      isString: typeof response === 'string',
      responseSample: response ? (typeof response === 'string' ? response.substring(0, 100) : JSON.stringify(response).substring(0, 100)) + "..." : "null"
    });
    
    // CASE 1: Direct string handling - most permissive case
    if (typeof response === 'string') {
      console.log("[TRANSCRIPT VALIDATION] Using direct string response:", {
        length: response.length,
        sample: response.substring(0, 100) + "..."
      });
      return response;
    }
    
    // CASE 2: Empty response check
    if (!response) {
      console.error("[TRANSCRIPT VALIDATION] Empty response received");
      return "No transcript content received from the API.";
    }
    
    // CASE 3: Standard extractor method
    try {
      const extractedText = extractTranscriptText(response);
      
      if (extractedText) {
        console.log("[TRANSCRIPT VALIDATION] Successfully extracted text using standard method:", {
          length: extractedText.length,
          sample: extractedText.substring(0, 100) + "..."
        });
        return extractedText;
      }
    } catch (extractError) {
      console.warn("[TRANSCRIPT VALIDATION] Standard extraction failed:", extractError);
    }
    
    // CASE 4: Direct access to common paths
    
    // Try Google API format
    if (response.results && Array.isArray(response.results)) {
      const transcriptText = response.results
        .filter((result: any) => result.alternatives && result.alternatives.length > 0)
        .map((result: any) => result.alternatives[0].transcript)
        .join(' ');
        
      if (transcriptText) {
        console.log("[TRANSCRIPT VALIDATION] Extracted from results.alternatives:", {
          length: transcriptText.length,
          sample: transcriptText.substring(0, 100) + "..."
        });
        return transcriptText;
      }
    }
    
    // Try our formatted response structure
    if (response.results?.transcripts?.[0]?.transcript) {
      const transcriptText = response.results.transcripts[0].transcript;
      
      if (transcriptText) {
        console.log("[TRANSCRIPT VALIDATION] Found transcript at results.transcripts[0].transcript:", {
          length: transcriptText.length,
          sample: transcriptText.substring(0, 100) + "..."
        });
        return transcriptText;
      }
    }
    
    // Try channels format
    if (response.results?.channels?.[0]?.alternatives?.[0]?.transcript) {
      const transcriptText = response.results.channels[0].alternatives[0].transcript;
      
      if (transcriptText) {
        console.log("[TRANSCRIPT VALIDATION] Found transcript in channels format:", {
          length: transcriptText.length,
          sample: transcriptText.substring(0, 100) + "..."
        });
        return transcriptText;
      }
    }
    
    // CASE 5: Recursive search for any text content
    if (typeof response === 'object') {
      const findTextContent = (obj: any, depth: number = 0): string => {
        if (depth > 3) return ''; // Reduced max depth for performance
        
        for (const key in obj) {
          const value = obj[key];
          
          if (typeof value === 'string' && value.trim().length > 30) {
            console.log(`[TRANSCRIPT VALIDATION] Found text content in field "${key}":`, {
              length: value.length,
              sample: value.substring(0, 100) + "..."
            });
            return value;
          } else if (typeof value === 'object' && value !== null) {
            const nestedText = findTextContent(value, depth + 1);
            if (nestedText) {
              return nestedText;
            }
          }
        }
        return '';
      };
      
      const foundText = findTextContent(response);
      if (foundText) {
        return foundText;
      }
    }
    
    // CASE 6: Last resort fallback - return empty string instead of error message
    // This is important - an empty string is easier to handle in the UI than an error message
    console.warn("[TRANSCRIPT VALIDATION] Failed to extract any transcript text, returning empty string");
    return "";
  } catch (error) {
    console.error("[TRANSCRIPT VALIDATION] Error in transcript validation:", error);
    // Return empty string instead of error message
    return "";
  }
};
