
import { Dispatch, SetStateAction } from "react";
import { AssemblyAITranscriptionHookState } from "./types";

const API_KEY_STORAGE_KEY = "assemblyai-api-key";

/**
 * Store AssemblyAI API key in localStorage
 * @param key API key to store
 */
export const storeKey = (key: string): void => {
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, key);
  } catch (error) {
    console.error("Failed to store API key:", error);
  }
};

/**
 * Retrieve AssemblyAI API key from localStorage
 * @returns The stored API key or empty string if not found
 */
export const getKey = (): string => {
  try {
    return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
  } catch (error) {
    console.error("Failed to retrieve API key:", error);
    return "";
  }
};

/**
 * Clear stored API key from localStorage
 */
export const clearKey = (): void => {
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear API key:", error);
  }
};

/**
 * Verify if an AssemblyAI API key is valid by making a test call to their API
 * 
 * @param apiKey The API key to verify
 * @param setState State update function to update keyStatus
 * @param toast Optional toast notification function
 * @returns Promise<boolean> - True if key is valid
 */
export const verifyApiKey = async (
  apiKey: string,
  setState: Dispatch<SetStateAction<AssemblyAITranscriptionHookState>>,
  toast?: any
): Promise<boolean> => {
  // Basic validation - check for empty key
  if (!apiKey || apiKey.trim() === "") {
    setState(state => ({ ...state, keyStatus: "invalid", testingKey: false }));
    if (toast) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key first.",
        variant: "destructive",
      });
    }
    return false;
  }

  // Format validation - AssemblyAI keys are typically 32+ character alphanumeric strings
  if (!/^[a-zA-Z0-9]{32,}$/.test(apiKey.trim())) {
    setState(state => ({ ...state, keyStatus: "invalid", testingKey: false }));
    if (toast) {
      toast({
        title: "Invalid API Key Format",
        description: "The API key format appears to be invalid. Please check your key.",
        variant: "destructive",
      });
    }
    return false;
  }

  try {
    // Create an AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      // AssemblyAI recommends using the /transcript endpoint with a GET request to validate a key
      const response = await fetch("https://api.assemblyai.com/v2/transcript", {
        method: "GET",
        headers: {
          "Authorization": apiKey.trim()
        },
        signal: controller.signal
      });
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      // Handle specific status codes for better user feedback
      if (response.status === 401) {
        setState(state => ({ ...state, keyStatus: "invalid", testingKey: false }));
        if (toast) {
          toast({
            title: "Invalid API Key",
            description: "The API key you provided is not valid or has expired.",
            variant: "destructive",
          });
        }
        return false;
      } else if (response.status === 403) {
        setState(state => ({ ...state, keyStatus: "invalid", testingKey: false }));
        if (toast) {
          toast({
            title: "Access Denied",
            description: "Your API key doesn't have permission to access the transcription service.",
            variant: "destructive",
          });
        }
        return false;
      } else if (response.status === 429) {
        // Rate limited, but key is valid
        setState(state => ({ ...state, keyStatus: "valid", testingKey: false }));
        if (toast) {
          toast({
            title: "API Key Valid but Rate Limited",
            description: "Your key is valid, but you've reached the rate limit. Try again later.",
            variant: "warning",
          });
        }
        return true;
      } else if (response.status >= 200 && response.status < 300) {
        // Success case - valid key
        setState(state => ({ ...state, keyStatus: "valid", testingKey: false }));
        if (toast) {
          toast({
            title: "API Key Valid",
            description: "Your AssemblyAI API key is valid and ready to use.",
          });
        }
        return true;
      } else {
        // Any other status code - uncertain validity
        console.warn(`Unexpected status code from AssemblyAI API: ${response.status}`);
        setState(state => ({ ...state, keyStatus: "untested", testingKey: false }));
        if (toast) {
          toast({
            title: "Verification Uncertain",
            description: `Received unexpected status (${response.status}) from AssemblyAI.`,
            variant: "warning",
          });
        }
        return false;
      }
    } catch (error: any) {
      // Clear the timeout in case of error
      clearTimeout(timeoutId);
      
      // Handle timeout errors
      if (error.name === 'AbortError') {
        setState(state => ({ ...state, keyStatus: "untested", testingKey: false }));
        if (toast) {
          toast({
            title: "Verification Timeout",
            description: "Connection to AssemblyAI timed out. Please try again.",
            variant: "destructive",
          });
        }
        console.error("API key verification timed out");
        return false;
      }
      
      throw error; // Re-throw for the outer catch block
    }
  } catch (error: any) {
    console.error("Error verifying API key:", error);
    
    setState(state => ({ ...state, keyStatus: "untested", testingKey: false }));
    
    // Provide specific message for network errors
    if (toast) {
      if (error.message && (
        error.message.includes('network') || 
        error.message.includes('fetch') ||
        error.message.includes('connect')
      )) {
        toast({
          title: "Network Error",
          description: "Could not connect to AssemblyAI. Please check your internet connection.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Verification Failed",
          description: "Could not verify API key. Please try again.",
          variant: "destructive",
        });
      }
    }
    
    return false;
  }
};
