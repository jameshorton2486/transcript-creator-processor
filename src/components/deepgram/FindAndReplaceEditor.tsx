
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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
  const [entries, setEntries] = useState<FindReplaceEntry[]>(initialEntries);
  const { toast } = useToast();

  useEffect(() => {
    setEntries(initialEntries);
  }, [initialEntries]);

  const addEntry = () => {
    setEntries([...entries, { find: '', replace: '' }]);
  };

  const removeEntry = (index: number) => {
    const newEntries = [...entries];
    newEntries.splice(index, 1);
    setEntries(newEntries);
    onEntriesChange(newEntries);
  };

  const updateEntry = (index: number, field: 'find' | 'replace', value: string) => {
    const newEntries = [...entries];
    newEntries[index][field] = value;
    setEntries(newEntries);
  };

  const saveEntries = () => {
    // Filter out incomplete entries
    const validEntries = entries.filter(entry => entry.find.trim() !== '');
    onEntriesChange(validEntries);
    
    toast({
      title: "Find & Replace Updated",
      description: `Saved ${validEntries.length} find & replace rules`
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Find & Replace Terms</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {entries.map((entry, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Label htmlFor={`find-${index}`} className="sr-only">Find</Label>
                <Input
                  id={`find-${index}`}
                  placeholder="Find term..."
                  value={entry.find}
                  onChange={(e) => updateEntry(index, 'find', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <div className="flex-1">
                <Label htmlFor={`replace-${index}`} className="sr-only">Replace</Label>
                <Input
                  id={`replace-${index}`}
                  placeholder="Replace with..."
                  value={entry.replace}
                  onChange={(e) => updateEntry(index, 'replace', e.target.value)}
                  disabled={disabled}
                />
              </div>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => removeEntry(index)}
                disabled={disabled}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={addEntry}
              disabled={disabled}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
            
            <Button
              onClick={saveEntries}
              disabled={disabled || entries.length === 0}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Rules
            </Button>
          </div>
          
          <p className="text-xs text-slate-500 mt-2">
            Define terms to search for in the audio and replace in the transcription. The "Find" term must be lowercase and will match words exactly.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
