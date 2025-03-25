
import { extractTranscriptText } from "@/lib/google";

// Simplified transcript validation with reliable fallbacks
export const validateTranscript = (response: any): string => {
  try {
    // Initial logging of what we received
    console.log("[TRANSCRIPT VALIDATION] Starting validation of transcript:", {
      responseType: typeof response,
      hasResults: Boolean(response?.results),
      responseSample: response ? JSON.stringify(response).substring(0, 100) + "..." : "null"
    });
    
    // CASE 1: Direct string handling
    if (typeof response === 'string' && response.trim().length > 0) {
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
      
      if (extractedText && extractedText.trim().length > 0) {
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
        
      if (transcriptText && transcriptText.trim().length > 0) {
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
      
      if (transcriptText && transcriptText.trim().length > 0) {
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
      
      if (transcriptText && transcriptText.trim().length > 0) {
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
        if (depth > 3) return ''; // Reduced max depth from 5 to 3 for performance
        
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
    
    console.warn("[TRANSCRIPT VALIDATION] Failed to extract any transcript text");
    return "No transcript content could be extracted. The audio may not contain recognizable speech.";
  } catch (error) {
    console.error("[TRANSCRIPT VALIDATION] Error in transcript validation:", error);
    return "Error processing transcript. Please try again.";
  }
};
