
import { formatDeepgramTranscript } from "../transcriptProcessor";

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
 * Transcribes an audio file using Deepgram API
 * 
 * @param file The audio file to transcribe
 * @param apiKey The Deepgram API key
 * @returns A promise that resolves to the transcription result
 */
export async function transcribeAudioFile(
  file: File,
  apiKey: string,
  options: any = {}
): Promise<DeepgramResponse> {
  if (!file) {
    throw new Error("No file provided for transcription");
  }

  if (!apiKey) {
    throw new Error("Deepgram API key is required");
  }

  try {
    // Create form data to send the audio file
    const formData = new FormData();
    formData.append("file", file);

    // Set up options for the Deepgram API request
    const queryParams = new URLSearchParams({
      model: options.model || "general",
      version: options.version || "latest",
      language: options.language || "en",
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
    return processDeepgramResponse(data);
  } catch (error) {
    console.error("Error transcribing with Deepgram:", error);
    throw error;
  }
}
