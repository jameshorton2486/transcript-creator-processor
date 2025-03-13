
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (apiKey: string) => void;
}

export const ApiKeyInput = ({ apiKey, onApiKeyChange }: ApiKeyInputProps) => {
  return (
    <div>
      <Label htmlFor="api-key">Google API Key</Label>
      <Input 
        id="api-key"
        type="password" 
        placeholder="Enter your Google API key" 
        value={apiKey}
        onChange={(e) => onApiKeyChange(e.target.value)}
        className="mt-1"
      />
      <p className="text-xs text-slate-500 mt-1">
        Your API key is required for transcription and is not stored permanently
      </p>
    </div>
  );
};
