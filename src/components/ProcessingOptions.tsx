
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ProcessingOptionsProps {
  options: {
    correctPunctuation: boolean;
    extractEntities: boolean;
    preserveFormatting: boolean;
  };
  onChange: (options: {
    correctPunctuation: boolean;
    extractEntities: boolean;
    preserveFormatting: boolean;
  }) => void;
}

export const ProcessingOptions = ({
  options,
  onChange,
}: ProcessingOptionsProps) => {
  const handleOptionChange = (
    option: keyof typeof options,
    value: boolean
  ) => {
    onChange({
      ...options,
      [option]: value,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="correctPunctuation" className="font-medium">
            Correct Punctuation
          </Label>
          <p className="text-sm text-slate-500">
            Improve capitalization and punctuation
          </p>
        </div>
        <Switch
          id="correctPunctuation"
          checked={options.correctPunctuation}
          onCheckedChange={(checked) =>
            handleOptionChange("correctPunctuation", checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="extractEntities" className="font-medium">
            Extract Entities
          </Label>
          <p className="text-sm text-slate-500">
            Identify legal entities (names, dates, etc.)
          </p>
        </div>
        <Switch
          id="extractEntities"
          checked={options.extractEntities}
          onCheckedChange={(checked) =>
            handleOptionChange("extractEntities", checked)
          }
        />
      </div>

      <div className="flex items-center justify-between">
        <div>
          <Label htmlFor="preserveFormatting" className="font-medium">
            Preserve Formatting
          </Label>
          <p className="text-sm text-slate-500">
            Maintain paragraph structure and formatting
          </p>
        </div>
        <Switch
          id="preserveFormatting"
          checked={options.preserveFormatting}
          onCheckedChange={(checked) =>
            handleOptionChange("preserveFormatting", checked)
          }
        />
      </div>
    </div>
  );
};
