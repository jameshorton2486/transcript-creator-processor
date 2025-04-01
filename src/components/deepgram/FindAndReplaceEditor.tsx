
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FindReplaceEntry {
  find: string;
  replace: string;
}

interface FindAndReplaceEditorProps {
  initialEntries?: FindReplaceEntry[];
  onEntriesChange: (entries: FindReplaceEntry[]) => void;
  disabled?: boolean;
}

export const FindAndReplaceEditor: React.FC<FindAndReplaceEditorProps> = ({
  initialEntries = [],
  onEntriesChange,
  disabled = false
}) => {
  const { toast } = useToast();
  const [entries, setEntries] = useState<FindReplaceEntry[]>(initialEntries);

  const addEntry = () => {
    const newEntries = [...entries, { find: '', replace: '' }];
    setEntries(newEntries);
    onEntriesChange(newEntries);
  };

  const removeEntry = (index: number) => {
    const newEntries = entries.filter((_, i) => i !== index);
    setEntries(newEntries);
    onEntriesChange(newEntries);
    
    toast({
      title: "Entry removed",
      description: "Find and replace entry has been removed.",
    });
  };

  const updateEntry = (index: number, field: 'find' | 'replace', value: string) => {
    const newEntries = entries.map((entry, i) => {
      if (i === index) {
        return { ...entry, [field]: value };
      }
      return entry;
    });
    setEntries(newEntries);
    onEntriesChange(newEntries);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Find & Replace</h3>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={addEntry} 
          disabled={disabled}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Entry
        </Button>
      </div>
      
      {entries.length === 0 ? (
        <div className="text-sm text-muted-foreground">
          No find and replace rules added yet. Add rules to automatically replace words or phrases during transcription.
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Find text"
                  value={entry.find}
                  onChange={(e) => updateEntry(index, 'find', e.target.value)}
                  disabled={disabled}
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <Input
                  placeholder="Replace with"
                  value={entry.replace}
                  onChange={(e) => updateEntry(index, 'replace', e.target.value)}
                  disabled={disabled}
                  className="w-full"
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeEntry(index)}
                disabled={disabled}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      
      {entries.length > 0 && (
        <div className="text-xs text-muted-foreground pt-2">
          These rules will be applied in the order listed above.
        </div>
      )}
    </div>
  );
};
