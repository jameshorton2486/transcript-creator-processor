
import { formatDeepgramTranscript } from "../transcriptProcessor";
import { formatTranscriptionResult } from "./formatter";
import { TranscriptionResult, DeepgramAPIResponse, DeepgramRequestOptions } from "./types";
import { DEFAULT_OPTIONS } from "./deepgramConfig";
import { processResponse } from "./responseProcessor";
import { sendTranscriptionRequest } from "./requestSender";

export interface DeepgramResponse {
  transcript: string;
  confidenceScore: number;
  metadata: any;
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
  console.log("[DEEPGRAM TRANSCRIBER] Starting transcription:", {
    fileName: file?.name,
    fileType: file?.type,
    fileSize: file ? `${(file.size / 1024 / 1024).toFixed(2)}MB` : 'N/A',
    options: JSON.stringify(options)
  });

  if (!file) {
    console.error("[DEEPGRAM TRANSCRIBER] No file provided for transcription");
    throw new Error("No file provided for transcription");
  }

  if (!apiKey) {
    console.error("[DEEPGRAM TRANSCRIBER] No API key provided");
    throw new Error("Deepgram API key is required");
  }

  try {
    // Merge with default options
    const mergedOptions = {...DEFAULT_OPTIONS, ...options};
    console.log("[DEEPGRAM TRANSCRIBER] Using request options:", mergedOptions);
    
    // Send the request (first via proxy, then direct if needed)
    const response = await sendTranscriptionRequest(file, apiKey, mergedOptions);
    
    // Process the response
    const deepgramResponse = processResponse(response);
    
    // Convert to TranscriptionResult
    return convertToTranscriptionResult(response, deepgramResponse);
  } catch (error) {
    console.error("[DEEPGRAM TRANSCRIBER] Error transcribing with Deepgram:", error);
    throw error;
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
