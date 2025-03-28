
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, KeyRound, Save, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { storeApiKey, testApiKey } from "@/lib/deepgram/auth";

interface DeepgramApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  visible: boolean;
}

export const DeepgramApiKeyInput = ({ apiKey, setApiKey, visible }: DeepgramApiKeyInputProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState("");
  const [keyStatus, setKeyStatus] = useState<"untested" | "valid" | "invalid">("untested");
  
  if (!visible) return null;
  
  const handleSaveKey = async () => {
    if (apiKey && apiKey.length > 10) {
      setIsValidating(true);
      try {
        // Test the API key before saving
        const validationResult = await testApiKey(apiKey);
        
        if (validationResult.isValid) {
          // Store the key if valid
          storeApiKey(apiKey);
          setIsSaved(true);
          setShowAlert(false);
          setKeyStatus("valid");
          setValidationMessage("API key is valid and has been saved");
          
          // Reset saved indicator after 3 seconds
          setTimeout(() => {
            setIsSaved(false);
          }, 3000);
        } else {
          setShowAlert(true);
          setKeyStatus("invalid");
          setValidationMessage(validationResult.message);
        }
      } catch (error) {
        setShowAlert(true);
        setKeyStatus("invalid");
        setValidationMessage("Failed to validate key");
      } finally {
        setIsValidating(false);
      }
    } else {
      setShowAlert(true);
      setValidationMessage("Please enter a valid Deepgram API key");
      setKeyStatus("invalid");
    }
  };
  
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
              setApiKey(e.target.value);
              setShowAlert(false);
              setKeyStatus("untested");
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
            disabled={isValidating}
          >
            <Save className="h-3.5 w-3.5" />
            {isValidating ? "Validating..." : isSaved ? "Saved" : "Save Key"}
          </Button>
        </div>
      </div>
      
      {showAlert && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {validationMessage}
          </AlertDescription>
        </Alert>
      )}
      
      {keyStatus === "valid" && !showAlert && (
        <Alert variant="default" className="bg-green-50 text-green-800 border-green-200 py-2">
          <AlertDescription>
            {validationMessage}
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
