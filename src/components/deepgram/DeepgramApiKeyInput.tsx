
import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, KeyRound, Save, Eye, EyeOff, Check } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";

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
    return key.trim().length >= 16;
  };
  
  const handleSaveKey = useCallback(async () => {
    if (apiKey && apiKey.length >= 16) {
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
  
  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium">Deepgram API Key</span>
        </div>
        
        <div className="relative">
          <Textarea
            placeholder="Enter your Deepgram API key here"
            value={showKey ? apiKey : apiKey.replace(/./g, '•')}
            onChange={(e) => {
              const newKey = e.target.value;
              setApiKey(newKey);
              setShowAlert(false);
              setKeyFormatValid(validateKeyFormat(newKey));
            }}
            className="w-full text-sm font-mono pr-10"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
            aria-label={showKey ? "Hide API key" : "Show API key"}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        <div className="flex justify-between items-center">
          <p className="text-xs text-slate-500">
            Your API key is stored locally and used only for transcription requests.
          </p>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleSaveKey}
            className="gap-1"
            disabled={testingKey || apiKey.length < 16}
          >
            {testingKey ? (
              <>
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-400 border-t-transparent"></span>
                Validating...
              </>
            ) : isSaved ? (
              <>
                <Check className="h-3.5 w-3.5 text-green-500" />
                Saved
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                Save Key
              </>
            )}
          </Button>
        </div>
      </div>
      
      {showAlert && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {keyErrorMessage || "Please enter a valid Deepgram API key"}
          </AlertDescription>
        </Alert>
      )}
      
      {keyStatus === "valid" && !showAlert && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200 py-2">
          <AlertDescription>
            API key is valid and has been saved
          </AlertDescription>
        </Alert>
      )}
      
      {keyFormatValid && !keyStatus && !showAlert && (
        <Alert variant="default" className="bg-amber-50 text-amber-800 border-amber-200 py-2">
          <AlertDescription>
            API key format appears valid. API validation was skipped due to a network issue.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-2 mt-2">
        <span>Need a Deepgram API key?</span>
        <a 
          href="https://console.deepgram.com/signup" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Get one from Deepgram
        </a>
      </div>
    </div>
  );
};
