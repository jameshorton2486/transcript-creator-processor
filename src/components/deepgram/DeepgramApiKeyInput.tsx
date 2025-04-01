
import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Key, Check, X, Loader2 } from "lucide-react";

interface DeepgramApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  handleTestApiKey: (key?: string) => Promise<boolean>;
  keyStatus: 'untested' | 'valid' | 'invalid';
  testingKey: boolean;
  keyErrorMessage?: string;
}

export const DeepgramApiKeyInput: React.FC<DeepgramApiKeyInputProps> = ({
  apiKey,
  setApiKey,
  handleTestApiKey,
  keyStatus,
  testingKey,
  keyErrorMessage
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1.5">
        <div className="flex items-center justify-between">
          <label htmlFor="apiKey" className="text-sm font-medium leading-none">
            Deepgram API Key
          </label>
          {keyStatus === 'valid' && (
            <Badge variant="outline" className="bg-green-50 text-green-700 hover:bg-green-50 border-green-200">
              <Check className="h-3 w-3 mr-1" /> Valid
            </Badge>
          )}
          {keyStatus === 'invalid' && (
            <Badge variant="outline" className="bg-red-50 text-red-700 hover:bg-red-50 border-red-200">
              <X className="h-3 w-3 mr-1" /> Invalid
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="apiKey"
              type={isVisible ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Deepgram API key"
              className="pr-10"
            />
            <button
              type="button"
              onClick={toggleVisibility}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 hover:text-gray-700"
            >
              <span className="text-xs">{isVisible ? "Hide" : "Show"}</span>
            </button>
          </div>
          <Button 
            type="button"
            variant="secondary"
            size="sm"
            disabled={testingKey || !apiKey}
            onClick={() => handleTestApiKey()}
            className="min-w-20 h-10"
          >
            {testingKey ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Key className="h-4 w-4 mr-2" />
                Verify
              </>
            )}
          </Button>
        </div>
        {keyErrorMessage && (
          <p className="text-sm text-red-500 mt-1">{keyErrorMessage}</p>
        )}
      </div>
      <div className="text-sm text-gray-500">
        <p>
          Enter your Deepgram API key to transcribe audio files. 
          <a 
            href="https://console.deepgram.com/signup" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 ml-1"
          >
            Get a free API key
          </a>
        </p>
      </div>
    </div>
  );
};
