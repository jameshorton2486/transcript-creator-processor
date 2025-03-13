
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Mic, FileAudio } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface AudioTranscriberProps {
  onTranscriptCreated: (transcript: string, jsonData: any) => void;
}

export const AudioTranscriber = ({ onTranscriptCreated }: AudioTranscriberProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Check if file is audio or video
      if (selectedFile.type.startsWith("audio/") || selectedFile.type.startsWith("video/")) {
        setFile(selectedFile);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select an audio or video file.",
          variant: "destructive",
        });
      }
    }
  };

  const transcribeAudio = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an audio or video file first.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // In a real application, you would upload the file to a server
      // and call Deepgram API. For now, we'll use a mock.
      
      // Mock API call to transcribe audio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock response data
      const mockTranscript = `Speaker 1: Thank you for joining us today. We'll be discussing the case of Smith v. Jones.
Speaker 2: I'd like to present evidence regarding the contract signed on March 15, 2023.
Speaker 1: Please proceed with your argument.
Speaker 2: The defendant clearly violated section 3.4 of the agreement when they failed to provide the required services by April 30.`;
      
      const mockJsonData = {
        results: {
          channels: [{
            alternatives: [{
              transcript: mockTranscript,
              confidence: 0.98
            }]
          }],
          utterances: [
            {
              speaker: 0,
              start: 0.0,
              end: 5.2,
              confidence: 0.95,
              transcript: "Thank you for joining us today. We'll be discussing the case of Smith v. Jones."
            },
            {
              speaker: 1,
              start: 5.4,
              end: 10.3,
              confidence: 0.97,
              transcript: "I'd like to present evidence regarding the contract signed on March 15, 2023."
            }
          ]
        }
      };
      
      onTranscriptCreated(mockTranscript, mockJsonData);
      
      toast({
        title: "Transcription complete",
        description: "The audio has been successfully transcribed.",
      });
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Transcription failed",
        description: "There was an error transcribing your audio. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="bg-white">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex flex-col items-center p-6 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
            <FileAudio className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-sm text-slate-500 mb-2">Upload an audio or video file for transcription</p>
            <input
              type="file"
              id="audio-file"
              accept="audio/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <label
              htmlFor="audio-file"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-slate-100 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200 cursor-pointer"
            >
              <Mic className="h-4 w-4" />
              Select Audio File
            </label>
          </div>
          
          {file && (
            <div className="mt-4">
              <p className="text-sm font-medium text-slate-700">Selected file:</p>
              <p className="text-sm text-slate-500 truncate">{file.name}</p>
            </div>
          )}
          
          <Button 
            className="w-full" 
            onClick={transcribeAudio} 
            disabled={!file || isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Transcribing...
              </>
            ) : "Transcribe Audio"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
