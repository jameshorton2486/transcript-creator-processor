
import { extractTranscriptText } from "@/lib/google";

// Formats error messages based on error type
export const formatErrorMessage = (error: any): string => {
  let errorMessage = "Failed to transcribe file. ";
  
  if (!error) {
    return errorMessage + "Unknown error occurred.";
  }
  
  // Extract the error message
  const message = error.message || String(error);
  
  if (message.includes("API key")) {
    errorMessage += "Please check your API key is valid.";
  } else if (message.includes("Network") || message.includes("fetch") || message.includes("internet")) {
    errorMessage += "Network error. Please check your internet connection.";
  } else if (message.includes("quota")) {
    errorMessage += "API quota exceeded. Please try again later or use a different API key.";
  } else if (message.includes("payload size exceeds the limit") || message.includes("Request payload size exceeds")) {
    errorMessage += "This file will be automatically processed in smaller chunks.";
  } else if (message.includes("too large")) {
    errorMessage += "This file is too large for direct processing. The application will try to process it in batches.";
  } else if (message.includes("unsupported file type")) {
    errorMessage += "The file format is not supported. Please use MP3, WAV, FLAC, or OGG format.";
  } else if (message.includes("sample_rate_hertz") || message.includes("sample rate")) {
    errorMessage += "Sample rate mismatch detected. The system will attempt to correct this automatically.";
  } else if (message.includes("Unable to decode") || message.includes("decode audio")) {
    errorMessage += "Your browser couldn't decode this audio format. Try uploading a different format like MP3.";
  } else if (message.includes("permission") || message.includes("permission_denied")) {
    errorMessage += "Google API permission denied. Ensure your API key has access to Speech-to-Text.";
  } else if (message.includes("insufficient") || message.includes("billing")) {
    errorMessage += "Insufficient privileges. Check if billing is enabled for your Google Cloud project.";
  } else if (message.includes("Audio content is empty")) {
    errorMessage += "The audio file appears to be empty or could not be processed.";
  } else if (message.includes("asynchronous response") || message.includes("message channel closed")) {
    errorMessage += "A promise wasn't properly resolved. This is an application error that has been logged.";
  } else if (message.includes("Invalid request")) {
    errorMessage += "The request to Google's API was invalid. This could be due to an issue with the audio format.";
  } else if (message.includes("speech") && message.includes("not enabled")) {
    errorMessage += "Speech-to-Text API is not enabled for your Google Cloud project.";
  } else {
    errorMessage += `Error details: ${message}`;
  }
  
  return errorMessage;
};

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

// Creates error context for detailed logging
export const createErrorContext = (file: File | null, options: any, customTerms: string[], error: any) => {
  if (!file) return { error: String(error) };
  
  return {
    file: {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      estimatedBase64Size: `${((file.size * 1.33) / 1024 / 1024).toFixed(2)} MB`, // Add estimated base64 size
      lastModified: new Date(file.lastModified).toISOString(),
    },
    options,
    customTermsCount: customTerms.length,
    customTerms: customTerms.length <= 10 ? customTerms : `${customTerms.length} terms`,
    timestamp: new Date().toISOString(),
    errorMessage: error?.message || String(error),
    errorStack: error?.stack || 'No stack trace',
    browserInfo: {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
    }
  };
};

// Promise handler to safely resolve promises and avoid "message channel closed" errors
export const safePromise = async <T>(promise: Promise<T>, timeout = 30000): Promise<T> => {
  let timeoutId: number;
  
  // Create a timeout promise that rejects after specified timeout
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      reject(new Error(`Promise timed out after ${timeout}ms`));
    }, timeout);
  });
  
  try {
    // Race the original promise against the timeout
    const result = await Promise.race([promise, timeoutPromise]);
    window.clearTimeout(timeoutId);
    return result;
  } catch (error) {
    window.clearTimeout(timeoutId);
    throw error;
  }
};
