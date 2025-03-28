import { formatDeepgramTranscript } from "@/lib/transcriptProcessor";

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
