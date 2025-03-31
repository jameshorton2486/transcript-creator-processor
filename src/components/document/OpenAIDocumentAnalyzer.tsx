
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Loader2, FileText, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OpenAIDocumentAnalyzerProps {
  documentText: string;
  isEnabled: boolean;
  onAnalysisComplete: (entities: string[]) => void;
}

export const OpenAIDocumentAnalyzer = ({
  documentText,
  isEnabled,
  onAnalysisComplete
}: OpenAIDocumentAnalyzerProps) => {
  const [apiKey, setApiKey] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key",
        variant: "destructive"
      });
      return;
    }

    if (!documentText) {
      toast({
        title: "No Content",
        description: "No document text available for analysis",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setProgress(10);

    try {
      // Simulating progress while API processes
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 5;
        });
      }, 300);

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `Extract important entities from the legal document into these categories:
              1. People names
              2. Organizations and companies
              3. Case numbers and case styling
              4. Addresses and locations
              5. Dates relevant to the case
              6. Legal terminology specific to this document
              
              Format response as a JSON object with these categories as keys and arrays of strings as values.`
            },
            {
              role: "user",
              content: documentText.slice(0, 15000) // First 15k characters to avoid token limits
            }
          ],
          temperature: 0.2,
          max_tokens: 1000
        })
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;

      if (content) {
        try {
          // Parse the response as JSON
          const parsedContent = JSON.parse(content);
          
          // Flatten all categories into a single array of terms
          const allEntities = Object.values(parsedContent).flat() as string[];
          
          // Remove duplicates
          const uniqueEntities = [...new Set(allEntities)];
          
          onAnalysisComplete(uniqueEntities);
          
          toast({
            title: "Analysis Complete",
            description: `Extracted ${uniqueEntities.length} unique entities from your document.`
          });
        } catch (error) {
          console.error("Failed to parse OpenAI response:", error);
          toast({
            title: "Processing Error",
            description: "Failed to parse the AI response",
            variant: "destructive"
          });
        }
      } else {
        throw new Error("No content in the OpenAI response");
      }

      setProgress(100);
    } catch (error) {
      console.error("AI analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  if (!isEnabled) return null;

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                OpenAI API Key
              </label>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <p className="text-xs text-slate-500">
                Your key is used only for this request and is not stored.
              </p>
            </div>

            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !apiKey || !documentText}
              className="w-full"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Analyze Document with AI
                </>
              )}
            </Button>

            {isAnalyzing && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-center text-slate-500">
                  Processing document with OpenAI...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
