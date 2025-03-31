
import { formatDeepgramTranscript } from "../transcriptProcessor";
import { formatTranscriptionResult } from "./formatter";
import { TranscriptionResult, DeepgramAPIResponse, DeepgramRequestOptions } from "./types";
import { DEFAULT_OPTIONS } from "./deepgramConfig";

export interface DeepgramResponse {
  transcript: string;
  confidenceScore: number;
  metadata: any;
}

/**
 * Processes the Deepgram API response to extract the transcript
 * and any additional metadata
 */
export function processDeepgramResponse(response: any): DeepgramResponse {
  console.log("Processing Deepgram response:", { 
    hasResponse: Boolean(response),
    hasResults: Boolean(response?.results),
    hasChannels: Boolean(response?.results?.channels)
  });

  try {
    // Extract the transcript from the API response
    const transcript = formatDeepgramTranscript(response);
    
    // Extract confidence scores if available
    const confidenceScore = response?.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;
    
    // Extract metadata from the API response
    const metadata = {
      request_id: response?.request_id || '',
      transaction_key: response?.transaction_key || '',
      // Only add duration if it exists in the response
      ...(response?.metadata?.duration && { duration: response.metadata.duration })
    };
    
    console.log("Deepgram transcript processed successfully:", {
      transcriptLength: transcript.length,
      confidence: confidenceScore,
      metadata: metadata
    });
    
    return {
      transcript,
      confidenceScore,
      metadata
    };
  } catch (error) {
    console.error("Error processing Deepgram response:", error);
    throw new Error(`Failed to process Deepgram response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Convert a DeepgramResponse to a TranscriptionResult
 */
function convertToTranscriptionResult(response: DeepgramAPIResponse, deepgramResponse: DeepgramResponse): TranscriptionResult {
  // Get the words array from the response
  const words = response?.results?.channels?.[0]?.alternatives?.[0]?.words || [];
  
  // Use the formatter to create a properly formatted result
  const formattedResult = formatTranscriptionResult(response);
  
  return {
    transcript: deepgramResponse.transcript,
    confidence: deepgramResponse.confidenceScore,
    words: words,
    formattedResult: formattedResult.formattedResult,
    rawResponse: response,
    language: response?.results?.channels?.[0]?.detected_language || 'en',
    duration: response?.metadata?.duration
  };
}

/**
 * Transcribes an audio file using Deepgram API
 * Attempts to use proxy server first, falls back to direct API call
 * 
 * @param file The audio file to transcribe
 * @param apiKey The Deepgram API key
 * @returns A promise that resolves to the transcription result
 */
export async function transcribeAudioFile(
  file: File,
  apiKey: string,
  options: DeepgramRequestOptions = {}
): Promise<TranscriptionResult> {
  if (!file) {
    throw new Error("No file provided for transcription");
  }

  if (!apiKey) {
    throw new Error("Deepgram API key is required");
  }

  // Try transcribing through the proxy server first
  try {
    console.log("Attempting to transcribe via proxy server...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("apiKey", apiKey);
    
    // Add options to formData
    Object.entries({...DEFAULT_OPTIONS, ...options}).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });
    
    // Try the Express proxy server
    const proxyResponse = await fetch("http://localhost:4000/transcribe", {
      method: "POST",
      body: formData,
    });
    
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      const deepgramResponse = processDeepgramResponse(data);
      return convertToTranscriptionResult(data, deepgramResponse);
    } else {
      console.log("Proxy server returned error, falling back to direct API");
    }
  } catch (proxyError) {
    console.log("Error using proxy server, falling back to direct API:", proxyError);
  }
  
  // Fall back to direct API call if proxy server is unavailable
  try {
    console.log("Attempting direct Deepgram API call...");
    // Create form data to send the audio file
    const formData = new FormData();
    formData.append("file", file);

    // Set up options for the Deepgram API request
    const queryParams = new URLSearchParams({
      model: options.model || DEFAULT_OPTIONS.model || "general",
      version: options.version || DEFAULT_OPTIONS.version || "latest",
      language: options.language || DEFAULT_OPTIONS.language || "en",
      punctuate: options.punctuate !== false ? "true" : "false",
      diarize: options.diarize !== false ? "true" : "false",
      smart_format: options.smartFormat !== false ? "true" : "false",
    });

    // Make the API request to Deepgram
    const response = await fetch(
      `https://api.deepgram.com/v1/listen?${queryParams}`,
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Deepgram API Error (${response.status}): ${
          errorData.error || response.statusText
        }`
      );
    }

    const data = await response.json();
    const deepgramResponse = processDeepgramResponse(data);
    return convertToTranscriptionResult(data, deepgramResponse);
  } catch (error) {
    console.error("Error transcribing with Deepgram:", error);
    throw error;
  }
}
