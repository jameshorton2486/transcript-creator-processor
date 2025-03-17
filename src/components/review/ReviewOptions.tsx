
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

interface ReviewOption {
  id: string;
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface ReviewOptionsProps {
  options: ReviewOption[];
}

export const ReviewOptions = ({ options }: ReviewOptionsProps) => {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div key={option.id} className="flex items-center space-x-2">
          <Checkbox 
            id={option.id} 
            checked={option.checked}
            onCheckedChange={(checked) => 
              option.onChange(checked === true)
            }
          />
          <Label htmlFor={option.id}>{option.label}</Label>
        </div>
      ))}
    </div>
  );
};
