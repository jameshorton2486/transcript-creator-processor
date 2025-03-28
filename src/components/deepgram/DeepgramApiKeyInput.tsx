
import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ApiKeyValidator } from "./ApiKeyValidator";
import { ApiKeyVisibilityToggle } from "./ApiKeyVisibilityToggle";
import { ApiKeySaveButton } from "./ApiKeySaveButton";
import { ApiKeyInfoFooter } from "./ApiKeyInfoFooter";

interface DeepgramApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  handleTestApiKey: (keyToTest?: string) => Promise<boolean>;
  keyStatus: 'untested' | 'valid' | 'invalid';
  testingKey: boolean;
  keyErrorMessage?: string;
  visible?: boolean;
}

export const DeepgramApiKeyInput = ({ 
  apiKey, 
  setApiKey, 
  handleTestApiKey, 
  keyStatus, 
  testingKey, 
  keyErrorMessage,
  visible = true
}: DeepgramApiKeyInputProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [keyFormatValid, setKeyFormatValid] = useState(false);
  const { toast } = useToast();
  
  if (!visible) return null;
  
  const validateKeyFormat = (key: string) => {
    // Basic format check - any string of reasonable length is acceptable
    // Using 20 characters minimum length as per the improved validation logic
    return key.trim().length >= 20;
  };
  
  const handleSaveKey = useCallback(async () => {
    if (apiKey && validateKeyFormat(apiKey)) {
      setShowAlert(false);
      
      try {
        const isValid = await handleTestApiKey(apiKey);
        
        if (isValid) {
          setIsSaved(true);
          toast({
            title: "API Key Saved",
            description: "Your Deepgram API key has been saved locally."
          });
          
          setTimeout(() => {
            setIsSaved(false);
          }, 3000);
        } else {
          setShowAlert(true);
        }
      } catch (error) {
        console.error("Error during key validation:", error);
        
        // If network error but format appears valid, still allow using the key
        if (validateKeyFormat(apiKey)) {
          setKeyFormatValid(true);
          setIsSaved(true);
          toast({
            title: "API Key Saved",
            description: "Network error during validation, but key format looks valid. You can try using it."
          });
          
          setTimeout(() => {
            setIsSaved(false);
          }, 3000);
        } else {
          setShowAlert(true);
          toast({
            title: "API Key Error",
            description: "Could not validate your API key. Please check the format.",
            variant: "destructive"
          });
        }
      }
    } else {
      setShowAlert(true);
    }
  }, [apiKey, handleTestApiKey, toast]);

  // Generate unique IDs for aria attributes
  const inputId = "deepgram-api-key-input";
  const errorId = "deepgram-api-key-error";
  const statusId = "deepgram-api-key-status";
  
  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-slate-500" aria-hidden="true" />
          <label htmlFor={inputId} className="text-sm font-medium">Deepgram API Key</label>
        </div>
        
        <div className="relative">
          <Textarea
            id={inputId}
            placeholder="Enter your Deepgram API key here"
            value={showKey ? apiKey : apiKey.replace(/./g, '•')}
            onChange={(e) => {
              const newKey = e.target.value;
              setApiKey(newKey);
              setShowAlert(false);
              setKeyFormatValid(validateKeyFormat(newKey));
            }}
            className="w-full text-sm font-mono pr-10"
            aria-describedby={keyStatus === 'invalid' ? errorId : statusId}
            aria-invalid={keyStatus === 'invalid'}
          />
          <ApiKeyVisibilityToggle 
            showKey={showKey} 
            setShowKey={setShowKey} 
            inputId={inputId}
          />
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500" id={statusId}>
            Your API key is stored locally and used only for transcription requests.
            {keyStatus === 'valid' && " Your key has been validated and is ready to use."}
            {keyStatus === 'untested' && " Your key has not been tested yet."}
          </p>
          
          <ApiKeySaveButton 
            handleSaveKey={handleSaveKey}
            testingKey={testingKey}
            isSaved={isSaved}
            disabled={apiKey.length < 20}
          />
        </div>
      </div>
      
      <ApiKeyValidator 
        keyStatus={keyStatus} 
        keyErrorMessage={keyErrorMessage} 
        keyFormatValid={keyFormatValid} 
        showAlert={showAlert}
        errorId={errorId}
      />
      
      <ApiKeyInfoFooter />
    </div>
  );
};
