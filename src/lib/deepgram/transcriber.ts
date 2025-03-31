
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
  console.log("[DEEPGRAM PROCESSOR] Processing Deepgram response:", { 
    hasResponse: Boolean(response),
    hasResults: Boolean(response?.results),
    hasChannels: Boolean(response?.results?.channels),
    requestId: response?.request_id,
    responseStructure: JSON.stringify(Object.keys(response || {}))
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
    
    console.log("[DEEPGRAM PROCESSOR] Deepgram transcript processed successfully:", {
      transcriptLength: transcript.length,
      transcriptSample: transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''),
      confidence: confidenceScore,
      metadata: metadata
    });
    
    return {
      transcript,
      confidenceScore,
      metadata
    };
  } catch (error) {
    console.error("[DEEPGRAM PROCESSOR] Error processing Deepgram response:", error);
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

  // Try transcribing through the proxy server first
  try {
    console.log("[DEEPGRAM TRANSCRIBER] Attempting to transcribe via proxy server...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("apiKey", apiKey);
    
    // Add options to formData
    const mergedOptions = {...DEFAULT_OPTIONS, ...options};
    console.log("[DEEPGRAM TRANSCRIBER] Using request options:", mergedOptions);
    
    Object.entries(mergedOptions).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
        console.log(`[DEEPGRAM TRANSCRIBER] Added option to formData: ${key}=${value}`);
      }
    });
    
    // Try the Express proxy server
    console.log("[DEEPGRAM TRANSCRIBER] Sending request to proxy server...");
    const proxyResponse = await fetch("http://localhost:4000/transcribe", {
      method: "POST",
      body: formData,
    });
    
    console.log("[DEEPGRAM TRANSCRIBER] Proxy server response status:", proxyResponse.status);
    
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      console.log("[DEEPGRAM TRANSCRIBER] Proxy server returned successful response");
      const deepgramResponse = processDeepgramResponse(data);
      return convertToTranscriptionResult(data, deepgramResponse);
    } else {
      const errorText = await proxyResponse.text().catch(() => "Unknown error");
      console.log("[DEEPGRAM TRANSCRIBER] Proxy server returned error:", {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        errorText
      });
      console.log("[DEEPGRAM TRANSCRIBER] Falling back to direct API");
    }
  } catch (proxyError) {
    console.log("[DEEPGRAM TRANSCRIBER] Error using proxy server:", proxyError);
    console.log("[DEEPGRAM TRANSCRIBER] Falling back to direct API");
  }
  
  // Fall back to direct API call if proxy server is unavailable
  try {
    console.log("[DEEPGRAM TRANSCRIBER] Attempting direct Deepgram API call...");
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
      smart_format: options.smart_format !== false ? "true" : "false",
    });

    console.log("[DEEPGRAM TRANSCRIBER] Direct API request URL:", 
      `https://api.deepgram.com/v1/listen?${queryParams.toString()}`);

    // Make the API request to Deepgram
    console.log("[DEEPGRAM TRANSCRIBER] Sending direct request to Deepgram...");
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

    console.log("[DEEPGRAM TRANSCRIBER] Direct API response status:", response.status);

    if (!response.ok) {
      let errorMessage = "";
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || response.statusText;
        console.error("[DEEPGRAM TRANSCRIBER] Deepgram API error response:", errorData);
      } catch (e) {
        errorMessage = await response.text().catch(() => response.statusText);
        console.error("[DEEPGRAM TRANSCRIBER] Failed to parse error response:", errorMessage);
      }
      
      throw new Error(
        `Deepgram API Error (${response.status}): ${errorMessage}`
      );
    }

    const data = await response.json();
    console.log("[DEEPGRAM TRANSCRIBER] Received successful response from Deepgram direct API");
    const deepgramResponse = processDeepgramResponse(data);
    return convertToTranscriptionResult(data, deepgramResponse);
  } catch (error) {
    console.error("[DEEPGRAM TRANSCRIBER] Error transcribing with Deepgram:", error);
    throw error;
  }
}
