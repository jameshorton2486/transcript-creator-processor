
import React from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiKeySectionProps {
  apiKey: string;
  setApiKey: (value: string) => void;
  isProcessing: boolean;
}

export const ApiKeySection: React.FC<ApiKeySectionProps> = ({ 
  apiKey, 
  setApiKey, 
  isProcessing 
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="api-key">API Key</Label>
      <Input 
        id="api-key" 
        type="password" 
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        placeholder="Enter your transcription service API key"
        disabled={isProcessing}
      />
      <p className="text-xs text-slate-500">Your API key is stored locally and not sent to our servers.</p>
    </div>
  );
};
