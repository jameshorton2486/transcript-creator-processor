
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
  if (!apiKey || apiKey.trim() === '') {
    console.error("[DEEPGRAM REQUEST] No API key provided");
    throw new Error("Deepgram API key is required");
  }

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
  const queryParams = new URLSearchParams();
  
  // Add all options to query parameters
  if (options.model) queryParams.append("model", options.model);
  if (options.version) queryParams.append("version", options.version || "latest");
  if (options.language) queryParams.append("language", options.language || "en");
  
  // Handle boolean options correctly
  queryParams.append("punctuate", options.punctuate !== false ? "true" : "false");
  queryParams.append("diarize", options.diarize === true ? "true" : "false");
  queryParams.append("smart_format", options.smart_format !== false ? "true" : "false");
  
  // Log the request URL and API key length for debugging
  console.log("[DEEPGRAM REQUEST] Direct API request URL:", 
    `https://api.deepgram.com/v1/listen?${queryParams.toString()}`);
  console.log("[DEEPGRAM REQUEST] API Key provided:", 
    apiKey ? `Length: ${apiKey.length}, First 4 chars: ${apiKey.substring(0, 4)}...` : "No API key");

  // Make the direct API request with proper headers
  console.log("[DEEPGRAM REQUEST] Sending direct request to Deepgram...");
  const response = await fetch(
    `https://api.deepgram.com/v1/listen?${queryParams.toString()}`,
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
      errorMessage = errorData.error || errorData.err_msg || response.statusText;
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
