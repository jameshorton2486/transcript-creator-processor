
import { useState, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { AlertCircle, KeyRound, Save, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  
  if (!visible) return null;
  
  const handleSaveKey = useCallback(async () => {
    if (apiKey && apiKey.length > 10) {
      const isValid = await handleTestApiKey(apiKey);
      
      if (isValid) {
        setIsSaved(true);
        setShowAlert(false);
        
        setTimeout(() => {
          setIsSaved(false);
        }, 3000);
      } else {
        setShowAlert(true);
      }
    } else {
      setShowAlert(true);
    }
  }, [apiKey, handleTestApiKey]);
  
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
            disabled={testingKey}
          >
            <Save className="h-3.5 w-3.5" />
            {testingKey ? "Validating..." : isSaved ? "Saved" : "Save Key"}
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
