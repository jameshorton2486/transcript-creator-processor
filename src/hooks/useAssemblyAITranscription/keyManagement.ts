
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
 * @returns Boolean indicating if the key is valid
 */
export const verifyApiKey = async (
  apiKey: string,
  setState: Dispatch<SetStateAction<AssemblyAITranscriptionHookState>>,
  toast?: any
): Promise<boolean> => {
  if (!apiKey || apiKey.trim() === "") {
    setState(state => ({ ...state, keyStatus: "invalid", testingKey: false }));
    return false;
  }

  try {
    // AssemblyAI recommends using the /transcript endpoint with a GET request to validate a key
    const response = await fetch("https://api.assemblyai.com/v2/transcript", {
      method: "GET",
      headers: {
        "Authorization": apiKey
      }
    });

    const isValid = response.status < 400;
    
    setState(state => ({ 
      ...state, 
      keyStatus: isValid ? "valid" : "invalid", 
      testingKey: false 
    }));

    if (isValid && toast) {
      toast({
        title: "API Key Valid",
        description: "Your AssemblyAI API key is valid.",
      });
    } else if (!isValid && toast) {
      toast({
        title: "Invalid API Key",
        description: "The API key you provided is not valid.",
        variant: "destructive",
      });
    }

    return isValid;
  } catch (error) {
    console.error("Error verifying API key:", error);
    
    setState(state => ({ 
      ...state, 
      keyStatus: "invalid", 
      testingKey: false 
    }));

    if (toast) {
      toast({
        title: "Verification Failed",
        description: "Could not verify API key. Please try again.",
        variant: "destructive",
      });
    }
    
    return false;
  }
};
