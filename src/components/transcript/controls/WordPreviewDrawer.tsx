
import React, { useState, useMemo } from 'react';
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { FileText } from "lucide-react";

interface WordPreviewDrawerProps {
  currentTranscript: string;
  fileName: string;
}

export const WordPreviewDrawer: React.FC<WordPreviewDrawerProps> = ({
  currentTranscript,
  fileName
}) => {
  const [open, setOpen] = useState(false);
  
  const wordCount = useMemo(() => {
    if (!currentTranscript) return 0;
    return currentTranscript.trim().split(/\s+/).length;
  }, [currentTranscript]);
  
  const topWords = useMemo(() => {
    if (!currentTranscript) return [];
    
    const words = currentTranscript.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2); // Filter out short words
    
    // Exclude common stop words
    const stopWords = new Set(['the', 'and', 'that', 'for', 'with', 'this', 'you', 'was', 'have', 'are', 'not']);
    
    const wordFrequency: Record<string, number> = {};
    words.forEach(word => {
      if (!stopWords.has(word)) {
        wordFrequency[word] = (wordFrequency[word] || 0) + 1;
      }
    });
    
    return Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [currentTranscript]);
  
  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8">
          <FileText className="h-4 w-4 mr-1" />
          {wordCount.toLocaleString()} words
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>Transcript Analysis: {fileName}</DrawerTitle>
        </DrawerHeader>
        <div className="p-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Statistics</h3>
              <dl className="space-y-2">
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Word count:</dt>
                  <dd className="text-sm font-medium">{wordCount.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Character count:</dt>
                  <dd className="text-sm font-medium">{currentTranscript.length.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-sm text-muted-foreground">Paragraphs:</dt>
                  <dd className="text-sm font-medium">
                    {currentTranscript.split(/\n+/).filter(Boolean).length.toLocaleString()}
                  </dd>
                </div>
              </dl>
            </div>
            
            <div className="rounded-lg border p-4">
              <h3 className="mb-2 font-medium">Most frequent words</h3>
              {topWords.length > 0 ? (
                <ul className="space-y-1">
                  {topWords.map(([word, count]) => (
                    <li key={word} className="flex justify-between">
                      <span className="text-sm">{word}</span>
                      <span className="text-sm text-muted-foreground">{count}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No words to analyze</p>
              )}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
