
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { testApiKey } from "@/lib/assemblyai/auth";
import { useToast } from "@/hooks/use-toast";

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  keyStatus?: "untested" | "valid" | "invalid";
  isDisabled?: boolean;
  provider?: string;
  onVerify?: (isValid: boolean) => void;
}

export const ApiKeyInput = ({
  apiKey,
  setApiKey,
  keyStatus = "untested",
  isDisabled = false,
  provider = "AssemblyAI",
  onVerify
}: ApiKeyInputProps) => {
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

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
    } catch (error) {
      console.error("Error verifying API key:", error);
      // Call the onVerify callback with false
      if (onVerify) {
        onVerify(false);
      }
      toast({
        title: "Verification Failed",
        description: "Could not verify API key. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="api-key">{provider} API Key</Label>
        {keyStatus === "valid" && (
          <span className="text-xs text-green-600 flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" /> Valid key
          </span>
        )}
      </div>
      
      <div className="flex gap-2">
        <Input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder={`Enter your ${provider} API key`}
          disabled={isDisabled}
          className={`flex-1 ${keyStatus === "invalid" ? "border-red-400 focus-visible:ring-red-400" : ""}`}
          aria-invalid={keyStatus === "invalid"}
        />
        
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleVerifyKey}
          disabled={isTesting || !apiKey.trim() || isDisabled}
          className="whitespace-nowrap"
        >
          {isTesting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : keyStatus === "valid" ? (
            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
          ) : keyStatus === "invalid" ? (
            <XCircle className="mr-2 h-4 w-4 text-red-500" />
          ) : null}
          Verify
        </Button>
      </div>
      
      {keyStatus === "invalid" && (
        <p className="text-xs text-red-500">
          Invalid API key. Please check and try again.
        </p>
      )}
    </div>
  );
};
