
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { HelpCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Update the interface to use WhisperModel instead of string
interface WhisperModelSelectorProps {
  availableModels: Array<{
    id: string;
    name: string;
    size: string;
  }>;
  selectedModel: {
    id: string;
    name: string;
    size: string;
  };
  onModelSelect: (model: {
    id: string;
    name: string;
    size: string;
  }) => void;
  disabled?: boolean;
}

export const WhisperModelSelector = ({
  availableModels,
  selectedModel,
  onModelSelect,
  disabled = false
}: WhisperModelSelectorProps) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label htmlFor="model-selector">Whisper Model</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="inline-flex items-center justify-center h-5 w-5 rounded-full">
                <HelpCircle className="h-4 w-4 text-slate-500" />
                <span className="sr-only">Model information</span>
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Larger models are more accurate but take longer to download and process. 
                 The model will be downloaded the first time you use it.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <Select 
        value={selectedModel.id} 
        onValueChange={(value) => {
          const model = availableModels.find(m => m.id === value);
          if (model) {
            onModelSelect(model);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger id="model-selector" className="w-full">
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.id} value={model.id}>
              {model.name} - {model.size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
