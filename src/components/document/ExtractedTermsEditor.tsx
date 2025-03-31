
import React, { useState, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Save, Edit, ClipboardCopy } from "lucide-react";

interface ExtractedTermsEditorProps {
  terms: string[];
  onTermsUpdate: (updatedTerms: string[]) => void;
}

export const ExtractedTermsEditor = ({ terms, onTermsUpdate }: ExtractedTermsEditorProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editableText, setEditableText] = useState('');
  const { toast } = useToast();

  // Convert array to newline-separated string when terms change
  useEffect(() => {
    setEditableText(terms.join('\n'));
  }, [terms]);

  const handleSaveEdits = () => {
    // Convert the text back to an array, filtering out empty lines
    const updatedTerms = editableText
      .split('\n')
      .map(term => term.trim())
      .filter(term => term.length > 0);
    
    onTermsUpdate(updatedTerms);
    setIsEditing(false);
    
    toast({
      title: "Terms Updated",
      description: `Saved ${updatedTerms.length} terms for transcription adaptation`,
    });
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(editableText);
    toast({
      title: "Copied to Clipboard",
      description: "All terms copied to clipboard",
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Extracted Terms Editor</CardTitle>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(!isEditing)}
            >
              <Edit className="h-4 w-4 mr-2" />
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyToClipboard}
            >
              <ClipboardCopy className="h-4 w-4 mr-2" />
              Copy
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="extracted-terms">
              These terms will be used for speech adaptation in Deepgram
            </Label>
            <div className="mt-2">
              {isEditing ? (
                <>
                  <Textarea
                    id="extracted-terms"
                    value={editableText}
                    onChange={(e) => setEditableText(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                    placeholder="Each term on a new line..."
                  />
                  <Button 
                    className="mt-3" 
                    onClick={handleSaveEdits}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </Button>
                </>
              ) : (
                <div className="border rounded-md p-3 bg-slate-50 min-h-[150px] max-h-[300px] overflow-y-auto">
                  {terms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {terms.map((term, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm">
                          {term}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">No terms extracted yet</p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <p className="text-xs text-slate-500">
            These terms will help Deepgram better recognize domain-specific terminology in your audio.
            You can edit them to add or remove terms as needed.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
