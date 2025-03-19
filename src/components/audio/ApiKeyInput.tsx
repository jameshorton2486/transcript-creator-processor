
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, HelpCircle } from "lucide-react";
import { testApiKey, testSpeechApiAccess } from "@/lib/google";
import { useToast } from "@/components/ui/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export const ApiKeyInput = ({ apiKey, onApiKeyChange }: ApiKeyInputProps) => {
  const [testing, setTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"untested" | "valid" | "invalid">("untested");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Reset status when API key changes
    if (keyStatus !== "untested") {
      setKeyStatus("untested");
      setErrorMessage(null);
    }
  }, [apiKey]);

  const handleTestApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "No API key",
        description: "Please enter a Google API key to test",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setKeyStatus("untested");
    setErrorMessage(null);
    
    try {
      // First do a basic test
      const isBasicValid = await testApiKey(apiKey);
      
      if (!isBasicValid) {
        setKeyStatus("invalid");
        setErrorMessage("API key is invalid or unauthorized");
        toast({
          title: "API key is invalid",
          description: "The provided key was rejected by Google's API",
          variant: "destructive",
        });
        return;
      }
      
      // Then do a more comprehensive test
      const { isValid, message } = await testSpeechApiAccess(apiKey);
      setKeyStatus(isValid ? "valid" : "invalid");
      
      if (!isValid && message) {
        setErrorMessage(message);
      }
      
      toast({
        title: isValid ? "API key is valid" : "API key issue detected",
        description: isValid 
          ? "Your Google API key is working correctly with Speech-to-Text API" 
          : message || "Please check your Google API key and make sure Speech-to-Text API is enabled",
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      setKeyStatus("invalid");
      const errorMsg = error instanceof Error ? error.message : String(error);
      setErrorMessage("Connection error");
      
      toast({
        title: "Error testing API key",
        description: `Could not connect to Google API: ${errorMsg}`,
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <Label htmlFor="api-key">Google API Key</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                <HelpCircle className="h-4 w-4 text-slate-500" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>You need a Google Cloud API key with Speech-to-Text API enabled. Make sure billing is set up for your Google Cloud project.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <div className="flex gap-2 mt-1">
        <Input 
          id="api-key"
          type="password" 
          placeholder="Enter your Google API key" 
          value={apiKey}
          onChange={(e) => {
            onApiKeyChange(e.target.value);
          }}
          className="flex-1"
        />
        <Button 
          onClick={handleTestApiKey} 
          variant="outline" 
          size="sm" 
          disabled={testing || !apiKey.trim()}
          className="whitespace-nowrap"
        >
          {testing ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : keyStatus === "valid" ? (
            <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
          ) : keyStatus === "invalid" ? (
            <XCircle className="h-4 w-4 mr-1 text-red-500" />
          ) : null}
          Test Key
        </Button>
      </div>
      
      {errorMessage && (
        <p className="text-xs text-red-500 mt-1">
          Error: {errorMessage}
        </p>
      )}
      
      <p className="text-xs text-slate-500 mt-1">
        Your API key is required for transcription and is not stored permanently
      </p>
    </div>
  );
};
