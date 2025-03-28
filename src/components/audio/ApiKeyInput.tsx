
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, KeyRound, Eye, EyeOff } from "lucide-react";
import { testApiKey } from "@/lib/deepgram/auth";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  keyStatus?: "untested" | "valid" | "invalid";
  isDisabled?: boolean;
  provider?: string;
  onVerify?: (isValid: boolean) => void;
  errorMessage?: string;
}

export const ApiKeyInput = ({
  apiKey,
  setApiKey,
  keyStatus = "untested",
  isDisabled = false,
  provider = "Deepgram",
  onVerify,
  errorMessage
}: ApiKeyInputProps) => {
  const [isTesting, setIsTesting] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [inputTouched, setInputTouched] = useState(false);
  const { toast } = useToast();

  // Auto-validate if key is in correct format once user has typed enough characters
  useEffect(() => {
    if (apiKey && apiKey.length >= 32 && inputTouched) {
      const timer = setTimeout(() => {
        handleVerifyKey();
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [apiKey, inputTouched]);

  const handleVerifyKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter an API key first.",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      // Test the API key with improved validation
      const result = await testApiKey(apiKey);
      
      // Call the onVerify callback if provided
      if (onVerify) {
        onVerify(result.isValid);
      }
      
      // Show detailed toast notification
      if (result.isValid) {
        toast({
          title: "API Key Valid",
          description: result.statusCode === 429 
            ? `Your ${provider} API key is valid but rate limited.` 
            : `Your ${provider} API key is valid.`,
          variant: "default" // Changed from "warning" to "default" for rate limited case
        });
      } else {
        toast({
          title: "Invalid API Key",
          description: result.message || `The ${provider} API key you provided is not valid.`,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error("Error verifying API key:", error);
      // Call the onVerify callback with false
      if (onVerify) {
        onVerify(false);
      }
      toast({
        title: "Verification Failed",
        description: error.message || "Could not verify API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };
  
  // Format key for display with proper spacing
  const formatKeyForDisplay = (key: string) => {
    return key.replace(/(.{4})/g, "$1 ").trim();
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="api-key">
          <span className="flex items-center">
            <KeyRound className="h-3 w-3 mr-1" />
            {provider} API Key
          </span>
        </Label>
        {keyStatus === "valid" && (
          <span className="text-xs text-green-600 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" /> Valid key
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id="api-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => {
              setApiKey(e.target.value.replace(/\s+/g, '')); // Remove any spaces
              if (!inputTouched) setInputTouched(true);
            }}
            placeholder={`Enter your ${provider} API key`}
            disabled={isDisabled}
            className={`flex-1 pr-10 font-mono ${keyStatus === "invalid" ? "border-red-400 focus-visible:ring-red-400" : ""}`}
            aria-invalid={keyStatus === "invalid"}
            // Better pattern matching for validation feedback
            pattern="[A-Za-z0-9]{32,}"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
            aria-label={showKey ? "Hide API key" : "Show API key"}
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleVerifyKey}
                disabled={isTesting || !apiKey.trim() || isDisabled || apiKey.length < 16}
                className="whitespace-nowrap"
              >
                {isTesting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : keyStatus === "valid" ? (
                  <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                ) : keyStatus === "invalid" ? (
                  <XCircle className="mr-2 h-4 w-4 text-red-500" />
                ) : null}
                {isTesting ? "Verifying..." : "Verify"}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isTesting ? 
                "Checking your API key with the Deepgram service" : 
                "Verify your API key with the Deepgram service"}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {keyStatus === "invalid" && (
        <p className="text-xs text-red-500">
          {errorMessage || "Invalid API key. Please check and try again."}
        </p>
      )}
      
      <div className="text-xs text-gray-500 mt-1">
        <p>Need a Deepgram API key? <a 
          href="https://console.deepgram.com/signup" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          Get one here
        </a></p>
      </div>
    </div>
  );
};
