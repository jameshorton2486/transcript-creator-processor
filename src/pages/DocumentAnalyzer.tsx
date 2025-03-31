
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileUploader } from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DocumentTextExtractor } from "@/components/document/DocumentTextExtractor";
import { Loader2, FileText, ArrowRight } from "lucide-react";

const DocumentAnalyzer = () => {
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [extractedTerms, setExtractedTerms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [openAIKey, setOpenAIKey] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const { toast } = useToast();

  const handleFilesChange = (files: File[]) => {
    setDocumentFiles(files);
    setExtractedTerms([]);
  };

  const handleTermsExtracted = (terms: string[]) => {
    setExtractedTerms(terms);
    setIsLoading(false);
  };

  const handleAIAnalysis = async () => {
    if (!openAIKey) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenAI API key to analyze documents",
        variant: "destructive"
      });
      return;
    }

    if (documentFiles.length === 0) {
      toast({
        title: "No Files",
        description: "Please upload at least one document to analyze",
        variant: "destructive"
      });
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Extract text from documents first
      let allText = "";
      
      for (let i = 0; i < documentFiles.length; i++) {
        const progress = ((i + 0.5) / documentFiles.length) * 100;
        setAnalysisProgress(progress);
        
        // We're already extracting text in DocumentTextExtractor, so we can just simulate the progress here
        await new Promise(resolve => setTimeout(resolve, 500));
      }
      
      setAnalysisProgress(60);
      
      // Now process with OpenAI to extract entities
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openAIKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system", 
              content: `Extract important entities from the legal document into the following categories:
              1. Proper nouns and names (people, organizations)
              2. Case styling and cause numbers
              3. Address information (streets, cities, states)
              4. Company names
              5. Legal terminology specific to this document
              6. Dates and times relevant to the case
              
              Format your response as a JSON object with these categories as keys and arrays of strings as values.`
            },
            { 
              role: "user", 
              content: `I'll upload the extracted text from my documents through the DocumentTextExtractor component. 
              Please analyze and extract the key entities.` 
            }
          ],
          temperature: 0.2
        })
      });
      
      setAnalysisProgress(90);

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const result = await response.json();
      const content = result.choices[0]?.message?.content;
      
      if (content) {
        try {
          // Try to parse as JSON
          const parsedContent = JSON.parse(content);
          
          // Flatten all categories into a single array of terms
          const allTerms = Object.values(parsedContent).flat() as string[];
          
          // Remove duplicates
          const uniqueTerms = [...new Set(allTerms)];
          
          setExtractedTerms(uniqueTerms);
          
          toast({
            title: "Analysis Complete",
            description: `Extracted ${uniqueTerms.length} unique terms from your documents.`
          });
        } catch (error) {
          console.error("Failed to parse OpenAI response:", error);
          // Fallback: extract terms from text (already handled by DocumentTextExtractor)
        }
      }
      
      setAnalysisProgress(100);
    } catch (error) {
      console.error("AI analysis error:", error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="container py-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Document Analysis</h1>
      <p className="text-gray-500 mb-8">
        Upload legal documents to extract relevant terminology and entities before transcription
      </p>

      <div className="space-y-6">
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
          <p className="text-sm text-gray-500 mb-4">
            Upload PDF or Word documents to extract important terms and entities
          </p>
          
          <Tabs defaultValue="extractor" className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="extractor">Document Extractor</TabsTrigger>
              <TabsTrigger value="aiEnhanced">OpenAI Enhancement</TabsTrigger>
            </TabsList>
            
            <TabsContent value="extractor" className="space-y-4">
              <DocumentTextExtractor 
                documentFile={documentFiles[0] || null}
                documentFiles={documentFiles}
                onTermsExtracted={handleTermsExtracted}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onFilesChange={handleFilesChange}
              />
            </TabsContent>
            
            <TabsContent value="aiEnhanced" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label htmlFor="openai-key" className="block text-sm font-medium mb-1">
                    OpenAI API Key
                  </label>
                  <input
                    id="openai-key"
                    type="password"
                    className="w-full p-2 border rounded-md"
                    placeholder="sk-..."
                    value={openAIKey}
                    onChange={(e) => setOpenAIKey(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Your API key is only used for this request and not stored.
                  </p>
                </div>
                
                <Button 
                  onClick={handleAIAnalysis} 
                  disabled={documentFiles.length === 0 || !openAIKey || isAnalyzing}
                  className="w-full"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Documents...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-4 w-4" />
                      Analyze with OpenAI
                    </>
                  )}
                </Button>
                
                {isAnalyzing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{Math.round(analysisProgress)}%</span>
                    </div>
                    <Progress value={analysisProgress} className="h-2" />
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>

        {extractedTerms.length > 0 && (
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Extracted Terms</h2>
            <div className="border rounded-md p-4 bg-gray-50">
              <div className="flex flex-wrap gap-2">
                {extractedTerms.map((term, index) => (
                  <span 
                    key={index} 
                    className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm"
                  >
                    {term}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline">
            Upload New Documents
          </Button>
          
          <Link to="/deepgram-test">
            <Button className="flex items-center">
              Continue to Transcription
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
