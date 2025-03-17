
import { Textarea } from "@/components/ui/textarea";

interface ApiKeyInputProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  visible: boolean;
}

export const ReviewApiKeyInput = ({ apiKey, setApiKey, visible }: ApiKeyInputProps) => {
  if (!visible) return null;
  
  return (
    <div className="space-y-2">
      <Textarea
        placeholder="Enter your OpenAI API key here"
        value={apiKey}
        onChange={(e) => setApiKey(e.target.value)}
        className="w-full text-sm"
      />
      <p className="text-xs text-slate-500">
        Your API key is only used for this session and is not stored.
      </p>
    </div>
  );
};
