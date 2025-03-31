
import { formatDeepgramTranscript } from "../transcriptProcessor";
import { DeepgramAPIResponse } from "./types";
import { DeepgramResponse } from "./transcriber";

/**
 * Processes the Deepgram API response to extract the transcript
 * and any additional metadata
 */
export function processResponse(response: DeepgramAPIResponse): DeepgramResponse {
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
