
import { type UseToastReturn } from "./toastTypes";

// Storage key for the API key
const API_KEY_STORAGE_KEY = "assembly_ai_api_key";

/**
 * Verifies if the provided API key is valid
 */
export const verifyApiKey = async (
  apiKey: string,
  setState: React.Dispatch<React.SetStateAction<any>>,
  toast: UseToastReturn
): Promise<boolean> => {
  if (!apiKey.trim()) {
    setState((prev: any) => ({
      ...prev,
      error: "Please enter your AssemblyAI API key",
      keyStatus: "invalid",
      testingKey: false
    }));
    toast.toast({
      title: "API Key Required",
      description: "Please enter your AssemblyAI API key",
      variant: "destructive",
    });
    return false;
  }

  setState((prev: any) => ({
    ...prev,
    testingKey: true,
    error: null
  }));

  try {
    // Import the testApiKey function dynamically to avoid circular dependencies
    const { testApiKey } = await import("@/lib/assemblyai");
    const isValid = await testApiKey(apiKey);

    if (isValid) {
      setState((prev: any) => ({
        ...prev,
        keyStatus: "valid",
        testingKey: false
      }));
      
      // Save the key to localStorage
      storeKey(apiKey);
      
      return true;
    } else {
      setState((prev: any) => ({
        ...prev,
        keyStatus: "invalid",
        testingKey: false,
        error: "Invalid API key. Please check and try again."
      }));
      
      toast.toast({
        title: "Invalid API Key",
        description: "The API key you provided seems to be invalid. Please check and try again.",
        variant: "destructive",
      });
      
      return false;
    }
  } catch (error) {
    console.error("Error testing API key:", error);
    
    setState((prev: any) => ({
      ...prev,
      keyStatus: "invalid",
      testingKey: false,
      error: error instanceof Error ? error.message : "Failed to verify API key"
    }));
    
    toast.toast({
      title: "Verification Failed",
      description: error instanceof Error ? error.message : "Failed to verify API key",
      variant: "destructive",
    });
    
    return false;
  }
};

/**
 * Loads the API key from localStorage
 */
export const getKey = (): string => {
  if (typeof window === "undefined") return "";
  
  try {
    const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY);
    return savedKey || "";
  } catch (e) {
    console.warn("Error loading API key from storage:", e);
    return "";
  }
};

/**
 * Saves the API key to localStorage
 */
export const storeKey = (apiKey: string): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.setItem(API_KEY_STORAGE_KEY, apiKey);
  } catch (e) {
    console.warn("Error saving API key to storage:", e);
  }
};

/**
 * Clears the API key from localStorage
 */
export const clearKey = (): void => {
  if (typeof window === "undefined") return;
  
  try {
    localStorage.removeItem(API_KEY_STORAGE_KEY);
  } catch (e) {
    console.warn("Error clearing API key from storage:", e);
  }
};
