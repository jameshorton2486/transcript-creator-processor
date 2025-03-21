
import { AssemblyAITranscriptionHookState } from "./types";
import { testApiKey } from "@/lib/assemblyai";
import { UseToastReturn } from "@/hooks/use-toast";

export const loadApiKeyFromStorage = (): string => {
  return localStorage.getItem("assemblyai-api-key") || "";
};

export const saveApiKeyToStorage = (apiKey: string): void => {
  localStorage.setItem("assemblyai-api-key", apiKey);
};

export const verifyApiKey = async (
  apiKey: string,
  setState: React.Dispatch<React.SetStateAction<AssemblyAITranscriptionHookState>>,
  toast: UseToastReturn
): Promise<boolean> => {
  if (!apiKey.trim()) {
    setState(prev => ({ 
      ...prev, 
      error: "AssemblyAI API key is required for transcription.",
      keyStatus: "invalid"
    }));
    
    toast({
      title: "API Key Required",
      description: "Please enter your AssemblyAI API key.",
      variant: "destructive",
    });
    
    return false;
  }
  
  setState(prev => ({ ...prev, testingKey: true }));
  
  try {
    const isKeyValid = await testApiKey(apiKey);
    
    setState(prev => ({ 
      ...prev, 
      keyStatus: isKeyValid ? "valid" : "invalid",
      testingKey: false 
    }));
    
    if (!isKeyValid) {
      setState(prev => ({ 
        ...prev, 
        error: "Invalid API key. Please check your AssemblyAI API key and try again." 
      }));
      
      toast({
        title: "Invalid API Key",
        description: "The API key you entered is invalid. Please check your AssemblyAI API key and try again.",
        variant: "destructive",
      });
    }
    
    return isKeyValid;
  } catch (error) {
    console.error("API key verification error:", error);
    
    setState(prev => ({ 
      ...prev, 
      keyStatus: "invalid", 
      testingKey: false,
      error: "Could not verify API key. Please check your internet connection."
    }));
    
    toast({
      title: "API Key Verification Failed",
      description: "Could not verify your API key. Please check your internet connection.",
      variant: "destructive",
    });
    
    return false;
  }
};
