
import { useState } from "react";
import { FileUploader } from "@/components/FileUploader";
import { TranscriptViewer } from "@/components/TranscriptViewer";
import { ProcessingOptions } from "@/components/ProcessingOptions";
import { EntityDisplay } from "@/components/EntityDisplay";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

// This is a mock of what would come from a real backend
import { processTranscript } from "@/lib/mockProcessor";

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [processing, setProcessing] = useState(false);
  const [processed, setProcessed] = useState(false);
  const [result, setResult] = useState<{
    correctedText: string;
    entities: Record<string, string[]>;
    originalText?: string;
  } | null>(null);
  const [options, setOptions] = useState({
    correctPunctuation: true,
    extractEntities: true,
    preserveFormatting: true,
  });
  
  const { toast } = useToast();

  const handleFileChange = (uploadedFile: File | null) => {
    setFile(uploadedFile);
    setProcessed(false);
    setResult(null);
  };

  const handleProcess = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please upload a transcript file to process.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    
    try {
      // In a real application, this would call your backend API
      const processedData = await processTranscript(file, options);
      setResult(processedData);
      setProcessed(true);
      
      toast({
        title: "Processing complete",
        description: "Your transcript has been successfully processed.",
      });
    } catch (error) {
      console.error("Processing error:", error);
      toast({
        title: "Processing failed",
        description: "There was an error processing your transcript. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Upload Transcript</h2>
              <FileUploader 
                onFileChange={handleFileChange} 
                file={file}
                acceptedFileTypes=".docx,.txt,.pdf"
              />
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Processing Options</h2>
              <ProcessingOptions 
                options={options} 
                onChange={setOptions} 
              />
              
              <Button 
                className="w-full mt-4" 
                onClick={handleProcess} 
                disabled={!file || processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : "Process Transcript"}
              </Button>
            </div>
          </div>
          
          <div className="lg:col-span-2">
            {processed && result ? (
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <Tabs defaultValue="corrected">
                  <TabsList className="mb-4">
                    <TabsTrigger value="corrected">Corrected Transcript</TabsTrigger>
                    {result.originalText && (
                      <TabsTrigger value="original">Original Transcript</TabsTrigger>
                    )}
                    {options.extractEntities && result.entities && (
                      <TabsTrigger value="entities">Extracted Entities</TabsTrigger>
                    )}
                  </TabsList>
                  
                  <TabsContent value="corrected">
                    <TranscriptViewer text={result.correctedText} />
                  </TabsContent>
                  
                  {result.originalText && (
                    <TabsContent value="original">
                      <TranscriptViewer text={result.originalText} />
                    </TabsContent>
                  )}
                  
                  {options.extractEntities && result.entities && (
                    <TabsContent value="entities">
                      <EntityDisplay entities={result.entities} />
                    </TabsContent>
                  )}
                </Tabs>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center justify-center min-h-[400px] text-center text-gray-500">
                {processing ? (
                  <>
                    <Loader2 className="h-12 w-12 animate-spin mb-4" />
                    <h3 className="text-lg font-medium">Processing your transcript...</h3>
                    <p className="mt-2">This may take a few moments depending on the file size.</p>
                  </>
                ) : (
                  <>
                    <h3 className="text-lg font-medium">No transcript processed yet</h3>
                    <p className="mt-2">Upload a transcript file and click "Process Transcript" to begin.</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
