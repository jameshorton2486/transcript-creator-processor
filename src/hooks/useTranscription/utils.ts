
import { extractTranscriptText } from "@/lib/google";

// Formats error messages based on error type
export const formatErrorMessage = (error: any): string => {
  let errorMessage = "Failed to transcribe file. ";
  
  if (error.message?.includes("API key")) {
    errorMessage += "Please check your API key is valid.";
  } else if (error.message?.includes("Network") || error.message?.includes("fetch")) {
    errorMessage += "Network error. Please check your internet connection.";
  } else if (error.message?.includes("quota")) {
    errorMessage += "API quota exceeded. Please try again later or use a different API key.";
  } else if (error.message?.includes("payload size exceeds the limit") || error.message?.includes("Request payload size exceeds")) {
    errorMessage += "This file will be automatically processed in smaller chunks.";
  } else if (error.message?.includes("too large")) {
    errorMessage += "This file is too large for direct processing. The application will try to process it in batches.";
  } else if (error.message?.includes("unsupported file type")) {
    errorMessage += "The file format is not supported. Please use MP3, WAV, FLAC, or OGG format.";
  } else if (error.message?.includes("sample_rate_hertz") || error.message?.includes("sample rate")) {
    errorMessage += "Sample rate mismatch detected. The system will attempt to correct this automatically.";
  } else if (error.message?.includes("Unable to decode") || error.message?.includes("decode audio")) {
    errorMessage += "Your browser couldn't decode this audio format. Try uploading a different format like MP3.";
  } else if (error.message?.includes("permission") || error.message?.includes("permission_denied")) {
    errorMessage += "Google API permission denied. Ensure your API key has access to Speech-to-Text.";
  } else if (error.message?.includes("insufficient") || error.message?.includes("billing")) {
    errorMessage += "Insufficient privileges. Check if billing is enabled for your Google Cloud project.";
  } else {
    errorMessage += `Error details: ${error.message || "Unknown error"}`;
  }
  
  return errorMessage;
};

// Validates transcript response
export const validateTranscript = (response: any): string => {
  try {
    const transcriptText = extractTranscriptText(response);
    
    if (transcriptText === "No transcript available" || transcriptText === "Error extracting transcript") {
      console.error("Failed to extract transcript from response:", response);
      
      // Check for empty results which might indicate audio decoding issues
      if (!response.results || 
          (response.results.channels?.[0]?.alternatives?.[0]?.transcript === "No transcript available" && 
           response.results.transcripts?.[0]?.transcript === "No transcript available")) {
        throw new Error("Unable to decode audio data. Try a different audio format or use the direct upload option.");
      }
      
      throw new Error("Failed to extract transcript from the API response.");
    }
    
    return transcriptText;
  } catch (error) {
    console.error("Error validating transcript:", error);
    throw error;
  }
};

// Creates error context for detailed logging
export const createErrorContext = (file: File | null, options: any, customTerms: string[], error: any) => {
  if (!file) return {};
  
  return {
    file: {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      estimatedBase64Size: `${((file.size * 1.33) / 1024 / 1024).toFixed(2)} MB`, // Add estimated base64 size
    },
    options,
    customTermsCount: customTerms.length,
    timestamp: new Date().toISOString(),
    errorMessage: error.message,
    errorStack: error.stack,
  };
};
