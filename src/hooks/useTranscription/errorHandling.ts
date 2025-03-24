
// Formats error messages based on error type
export const formatErrorMessage = (error: any): string => {
  let errorMessage = "Failed to transcribe file. ";
  
  if (!error) {
    return errorMessage + "Unknown error occurred.";
  }
  
  // Extract the error message
  const message = error.message || String(error);
  
  // Check for chunk failure patterns
  if (message.includes("Transcription failed for chunk")) {
    // Extract chunk number if possible
    const chunkMatch = message.match(/chunk (\d+)/i);
    const chunkNumber = chunkMatch ? chunkMatch[1] : "some chunks";
    
    // Determine if it's a format or API issue
    if (message.includes("format") || message.includes("encoding") || message.includes("sample rate")) {
      errorMessage += `Audio format issue in chunk ${chunkNumber}. The system will try to automatically resample and convert the audio.`;
    } else if (message.includes("API key")) {
      errorMessage += "Please check your API key is valid.";
    } else if (message.includes("permission") || message.includes("permission_denied")) {
      errorMessage += "Google API permission denied. Ensure your API key has access to Speech-to-Text.";
    } else if (message.includes("quota")) {
      errorMessage += "API quota exceeded. Please try again later or use a different API key.";
    } else {
      errorMessage += `Error in chunk ${chunkNumber}. This could be due to audio quality issues in that segment.`;
    }
    return errorMessage;
  }
  
  // Original error handling logic
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
  } else if (message.includes("No speech was detected")) {
    errorMessage += "No speech was detected in the audio file. The file may be silent or contain only background noise.";
  } else if (message.includes("All chunks failed")) {
    errorMessage += "All audio segments failed to process. This often indicates an issue with the audio format or quality.";
  } else {
    errorMessage += `Error details: ${message}`;
  }
  
  return errorMessage;
};

// Creates error context for detailed logging
export const createErrorContext = (file: File | null, options: any, customTerms: string[], error: any) => {
  if (!file) return { error: String(error) };
  
  return {
    file: {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      estimatedBase64Size: `${((file.size * 1.33) / 1024 / 1024).toFixed(2)} MB`,
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
