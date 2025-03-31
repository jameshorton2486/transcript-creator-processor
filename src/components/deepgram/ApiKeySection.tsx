
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DeepgramApiKeyInput } from './DeepgramApiKeyInput';

interface ApiKeySectionProps {
  showApiKeyInput: boolean;
  apiKey: string;
  setApiKey: (key: string) => void;
  validateKeyManually: () => Promise<boolean>;
  isApiKeyValid: boolean;
  isValidatingApiKey: boolean;
  apiKeyError: string | null;
}

export const ApiKeySection: React.FC<ApiKeySectionProps> = ({
  showApiKeyInput,
  apiKey,
  setApiKey,
  validateKeyManually,
  isApiKeyValid,
  isValidatingApiKey,
  apiKeyError
}) => {
  if (!showApiKeyInput) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Key</CardTitle>
        <CardDescription>
          Enter your Deepgram API key to enable transcription
        </CardDescription>
      </CardHeader>
      <CardContent>
        <DeepgramApiKeyInput
          apiKey={apiKey}
          setApiKey={setApiKey}
          handleTestApiKey={validateKeyManually}
          keyStatus={isApiKeyValid ? 'valid' : apiKeyError ? 'invalid' : 'untested'}
          testingKey={isValidatingApiKey}
          keyErrorMessage={apiKeyError || undefined}
        />
      </CardContent>
    </Card>
  );
};
