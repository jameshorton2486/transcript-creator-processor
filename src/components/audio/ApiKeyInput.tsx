
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { testApiKey } from "@/lib/googleTranscribeService";
import { useToast } from "@/components/ui/use-toast";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export const ApiKeyInput = ({ apiKey, onApiKeyChange }: ApiKeyInputProps) => {
  const [testing, setTesting] = useState(false);
  const [keyStatus, setKeyStatus] = useState<"untested" | "valid" | "invalid">("untested");
  const { toast } = useToast();

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
    
    try {
      const isValid = await testApiKey(apiKey);
      setKeyStatus(isValid ? "valid" : "invalid");
      
      toast({
        title: isValid ? "API key is valid" : "API key is invalid",
        description: isValid 
          ? "Your Google API key is working correctly" 
          : "Please check your Google API key and make sure Speech-to-Text API is enabled",
        variant: isValid ? "default" : "destructive",
      });
    } catch (error) {
      setKeyStatus("invalid");
      toast({
        title: "Error testing API key",
        description: "Could not connect to Google API. Check your internet connection.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div>
      <Label htmlFor="api-key">Google API Key</Label>
      <div className="flex gap-2 mt-1">
        <Input 
          id="api-key"
          type="password" 
          placeholder="Enter your Google API key" 
          value={apiKey}
          onChange={(e) => {
            onApiKeyChange(e.target.value);
            setKeyStatus("untested");
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
      <p className="text-xs text-slate-500 mt-1">
        Your API key is required for transcription and is not stored permanently
      </p>
    </div>
  );
};
