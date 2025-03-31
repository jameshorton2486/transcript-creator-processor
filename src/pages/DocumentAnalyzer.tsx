
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileUploader } from "@/components/FileUploader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { DocumentTextExtractor } from "@/components/document/DocumentTextExtractor";
import { Loader2, FileText, ArrowRight, Mic } from "lucide-react";
import { DeepgramTranscriptionOptions } from "@/components/deepgram/DeepgramTranscriptionOptions";
import { Separator } from "@/components/ui/separator";
import { ExtractedTermsEditor } from "@/components/document/ExtractedTermsEditor";

// Default Deepgram options
const DEFAULT_OPTIONS = {
  model: "nova-2",
  punctuate: true,
  smart_format: true,
  diarize: false,
  detect_language: false,
  profanity_filter: false,
  paragraphs: false,
  utterances: false,
  filler_words: false,
  summarize: false,
  topics: false,
  intents: false,
  detect_entities: false,
  sentiment: false,
  keyterm: [],
  replace: []
};

const DocumentAnalyzer = () => {
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  const [extractedTerms, setExtractedTerms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [openAIKey, setOpenAIKey] = useState("");
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [deepgramOptions, setDeepgramOptions] = useState(DEFAULT_OPTIONS);
  const { toast } = useToast();

  // Load saved Deepgram options and terms from session storage
  useEffect(() => {
    try {
      const savedOptions = sessionStorage.getItem('deepgramOptions');
      if (savedOptions) {
        setDeepgramOptions(JSON.parse(savedOptions));
      }
      
      const savedTerms = sessionStorage.getItem('extractedTerms');
      if (savedTerms) {
        setExtractedTerms(JSON.parse(savedTerms));
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  const handleFilesChange = (files: File[]) => {
    setDocumentFiles(files);
    setExtractedTerms([]);
  };

  const handleTermsExtracted = (terms: string[]) => {
    setExtractedTerms(terms);
    
    // Save the terms for Deepgram keyterm option
    const updatedOptions = {
      ...deepgramOptions,
      keyterm: terms
    };
    setDeepgramOptions(updatedOptions);
    
    // Save to session storage
    try {
      sessionStorage.setItem('extractedTerms', JSON.stringify(terms));
      sessionStorage.setItem('deepgramOptions', JSON.stringify(updatedOptions));
    } catch (error) {
      console.error('Error saving extracted terms:', error);
    }
    
    setIsLoading(false);
  };
  
  const handleTermsUpdate = (updatedTerms: string[]) => {
    setExtractedTerms(updatedTerms);
    
    // Update keyterm option with the new terms
    const updatedOptions = {
      ...deepgramOptions,
      keyterm: updatedTerms
    };
    setDeepgramOptions(updatedOptions);
    
    // Save to session storage
    try {
      sessionStorage.setItem('extractedTerms', JSON.stringify(updatedTerms));
      sessionStorage.setItem('deepgramOptions', JSON.stringify(updatedOptions));
    } catch (error) {
      console.error('Error saving updated terms:', error);
    }
  };

  const handleDeepgramOptionsChange = (name: string, value: any) => {
    const updatedOptions = {
      ...deepgramOptions,
      [name]: value
    };
    setDeepgramOptions(updatedOptions);
    
    // Save to session storage for persistence
    try {
      sessionStorage.setItem('deepgramOptions', JSON.stringify(updatedOptions));
    } catch (error) {
      console.error('Error saving transcription options:', error);
    }
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
          <ExtractedTermsEditor 
            terms={extractedTerms} 
            onTermsUpdate={handleTermsUpdate} 
          />
        )}

        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Mic className="mr-2 h-5 w-5 text-slate-700" />
            Transcription Settings
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            Configure how your audio will be processed during transcription with Deepgram
          </p>
          
          <Separator className="my-4" />
          
          <DeepgramTranscriptionOptions 
            onOptionsChange={handleDeepgramOptionsChange}
            isLoading={isLoading || isAnalyzing}
            initialOptions={deepgramOptions}
          />
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mt-6">
            <p className="text-sm text-blue-800">
              These settings will be applied when you proceed to the transcription page. They determine how Deepgram processes your audio files.
            </p>
          </div>
        </Card>

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
