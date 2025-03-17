
import { Info, Volume2, Mic } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { TranscriptionOptions } from "@/lib/config";
import { Separator } from "@/components/ui/separator";

interface TranscriptionOptionsProps {
  options: TranscriptionOptions;
  onOptionsChange: (options: TranscriptionOptions) => void;
}

export const TranscriptionOptionsSelector = ({ options, onOptionsChange }: TranscriptionOptionsProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium flex items-center gap-2">
        <Mic className="h-4 w-4 text-slate-500" />
        Transcription Options
      </h3>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-slate-400" />
            <Label htmlFor="diarize">Speaker Identification</Label>
          </div>
          <Switch
            id="diarize"
            checked={options.diarize}
            onCheckedChange={(checked) => 
              onOptionsChange({...options, diarize: checked})
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-slate-400" />
            <Label htmlFor="punctuate">Automatic Punctuation</Label>
          </div>
          <Switch
            id="punctuate"
            checked={options.punctuate}
            onCheckedChange={(checked) => 
              onOptionsChange({...options, punctuate: checked})
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-slate-400" />
            <Label htmlFor="paragraphs">Paragraph Detection</Label>
          </div>
          <Switch
            id="paragraphs"
            checked={options.paragraphs}
            onCheckedChange={(checked) => 
              onOptionsChange({...options, paragraphs: checked})
            }
          />
        </div>
        
        <Separator className="my-2" />
        
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-slate-500" />
          Audio Preprocessing
        </h3>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-slate-400" />
            <Label htmlFor="normalize">Volume Normalization</Label>
          </div>
          <Switch
            id="normalize"
            checked={options.normalize ?? true}
            onCheckedChange={(checked) => 
              onOptionsChange({...options, normalize: checked})
            }
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="h-4 w-4 text-slate-400" />
            <Label htmlFor="noiseReduction">Noise Reduction</Label>
          </div>
          <Switch
            id="noiseReduction"
            checked={options.noiseReduction ?? true}
            onCheckedChange={(checked) => 
              onOptionsChange({...options, noiseReduction: checked})
            }
          />
        </div>
      </div>
    </div>
  );
};
