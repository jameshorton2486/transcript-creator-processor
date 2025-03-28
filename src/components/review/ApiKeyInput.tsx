
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, KeyRound, Save, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  visible: boolean;
}

export const ReviewApiKeyInput = ({ apiKey, setApiKey, visible }: ApiKeyInputProps) => {
  const [isSaved, setIsSaved] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showKey, setShowKey] = useState(false);
  
  if (!visible) return null;
  
  const handleSaveKey = () => {
    if (apiKey && apiKey.length > 10) {
      // In a real implementation, this would securely store the key
      // in a user's authenticated session or encrypted storage
      sessionStorage.setItem('openai_api_key', apiKey);
      setIsSaved(true);
      setShowAlert(false);
      
      // This would eventually timeout and reset
      setTimeout(() => {
        setIsSaved(false);
      }, 3000);
    } else {
      setShowAlert(true);
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-slate-500" />
          <span className="text-sm font-medium">OpenAI API Key</span>
        </div>
        
        <div className="relative">
          <Textarea
            placeholder="Enter your OpenAI API key here"
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value);
              setShowAlert(false);
            }}
            className="w-full text-sm font-mono pr-10"
            type={showKey ? "text" : "password"}
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
            Your API key is only used for this session and is not permanently stored.
          </p>
          
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleSaveKey}
            className="gap-1"
          >
            <Save className="h-3.5 w-3.5" />
            {isSaved ? "Saved" : "Save for Session"}
          </Button>
        </div>
      </div>
      
      {showAlert && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please enter a valid OpenAI API key
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex items-center justify-between text-xs text-slate-500 border-t pt-2 mt-2">
        <span>Need an API key?</span>
        <a 
          href="https://platform.openai.com/account/api-keys" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          Get one from OpenAI
        </a>
      </div>
    </div>
  );
};
