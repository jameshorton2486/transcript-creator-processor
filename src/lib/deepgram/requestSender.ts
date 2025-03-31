
import { DeepgramRequestOptions } from "./types";
import { DEFAULT_OPTIONS } from "./deepgramConfig";

/**
 * Send a transcription request to Deepgram
 * First tries via proxy server, then falls back to direct API
 */
export async function sendTranscriptionRequest(
  file: File, 
  apiKey: string, 
  options: DeepgramRequestOptions
) {
  // Try transcribing through the proxy server first
  try {
    console.log("[DEEPGRAM REQUEST] Attempting to transcribe via proxy server...");
    const formData = new FormData();
    formData.append("file", file);
    formData.append("apiKey", apiKey);
    
    // Add options to formData
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
        console.log(`[DEEPGRAM REQUEST] Added option to formData: ${key}=${value}`);
      }
    });
    
    // Try the Express proxy server
    console.log("[DEEPGRAM REQUEST] Sending request to proxy server...");
    const proxyResponse = await fetch("http://localhost:4000/transcribe", {
      method: "POST",
      body: formData,
    });
    
    console.log("[DEEPGRAM REQUEST] Proxy server response status:", proxyResponse.status);
    
    if (proxyResponse.ok) {
      const data = await proxyResponse.json();
      console.log("[DEEPGRAM REQUEST] Proxy server returned successful response");
      return data;
    } else {
      const errorText = await proxyResponse.text().catch(() => "Unknown error");
      console.log("[DEEPGRAM REQUEST] Proxy server returned error:", {
        status: proxyResponse.status,
        statusText: proxyResponse.statusText,
        errorText
      });
      console.log("[DEEPGRAM REQUEST] Falling back to direct API");
    }
  } catch (proxyError) {
    console.log("[DEEPGRAM REQUEST] Error using proxy server:", proxyError);
    console.log("[DEEPGRAM REQUEST] Falling back to direct API");
  }
  
  // Fall back to direct API call
  console.log("[DEEPGRAM REQUEST] Attempting direct Deepgram API call...");
  
  // Create form data for the audio file
  const formData = new FormData();
  formData.append("file", file);

  // Set up query parameters
  const queryParams = new URLSearchParams({
    model: options.model || DEFAULT_OPTIONS.model || "general",
    version: options.version || DEFAULT_OPTIONS.version || "latest",
    language: options.language || DEFAULT_OPTIONS.language || "en",
    punctuate: options.punctuate !== false ? "true" : "false",
    diarize: options.diarize !== false ? "true" : "false",
    smart_format: options.smart_format !== false ? "true" : "false",
  });

  console.log("[DEEPGRAM REQUEST] Direct API request URL:", 
    `https://api.deepgram.com/v1/listen?${queryParams.toString()}`);

  // Make the direct API request
  console.log("[DEEPGRAM REQUEST] Sending direct request to Deepgram...");
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

  console.log("[DEEPGRAM REQUEST] Direct API response status:", response.status);

  if (!response.ok) {
    let errorMessage = "";
    try {
      const errorData = await response.json();
      errorMessage = errorData.error || response.statusText;
      console.error("[DEEPGRAM REQUEST] Deepgram API error response:", errorData);
    } catch (e) {
      errorMessage = await response.text().catch(() => response.statusText);
      console.error("[DEEPGRAM REQUEST] Failed to parse error response:", errorMessage);
    }
    
    throw new Error(
      `Deepgram API Error (${response.status}): ${errorMessage}`
    );
  }

  const data = await response.json();
  console.log("[DEEPGRAM REQUEST] Received successful response from Deepgram direct API");
  return data;
}
