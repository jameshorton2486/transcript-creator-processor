
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TrainingExample {
  id: string;
  incorrect: string;
  corrected: string;
  createdAt: number;
}

export const ExampleBasedTraining = () => {
  const [incorrectText, setIncorrectText] = useState("");
  const [correctedText, setCorrectedText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleSaveExample = () => {
    if (!incorrectText.trim() || !correctedText.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both incorrect and corrected text.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    // Simulate AI analysis of differences between the texts
    setTimeout(() => {
      // Create a new training example
      const newExample: TrainingExample = {
        id: Date.now().toString(),
        incorrect: incorrectText.trim(),
        corrected: correctedText.trim(),
        createdAt: Date.now(),
      };

      // Get existing examples from localStorage or initialize empty array
      const existingExamples = JSON.parse(localStorage.getItem("transcriptExamples") || "[]");
      
      // Add new example and save back to localStorage
      const updatedExamples = [...existingExamples, newExample];
      localStorage.setItem("transcriptExamples", JSON.stringify(updatedExamples));

      // Reset form
      setIncorrectText("");
      setCorrectedText("");
      setIsAnalyzing(false);

      toast({
        title: "Example saved",
        description: "Your correction example has been analyzed and saved.",
      });
    }, 1500);
  };

  const generateDifferenceAnalysis = () => {
    if (!incorrectText.trim() || !correctedText.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both incorrect and corrected text.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);

    // Simulate AI analysis of differences
    setTimeout(() => {
      // In a real implementation, this would call an API to analyze the differences

      // Simple mock differences for demonstration
      const mockDifferences = [
        "Capitalization of 'court' → 'Court'",
        "Format of date from '1/5/2023' → 'January 5, 2023'",
        "Correction of speaker label from 'Speaker 1' → 'THE COURT'",
      ];

      // Display the detected differences
      toast({
        title: "Differences Detected",
        description: (
          <ul className="list-disc pl-4 mt-2 space-y-1">
            {mockDifferences.map((diff, index) => (
              <li key={index} className="text-sm">{diff}</li>
            ))}
          </ul>
        ),
      });

      setIsAnalyzing(false);
    }, 2000);
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Example-Based Training</CardTitle>
        <CardDescription>Teach the system by providing correction examples</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="incorrectText">Incorrect Transcript</Label>
          <Textarea
            id="incorrectText"
            placeholder="Paste the original incorrect transcript here"
            value={incorrectText}
            onChange={(e) => setIncorrectText(e.target.value)}
            rows={6}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="correctedText">Corrected Transcript</Label>
          <Textarea
            id="correctedText"
            placeholder="Paste your corrected version here"
            value={correctedText}
            onChange={(e) => setCorrectedText(e.target.value)}
            rows={6}
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          onClick={generateDifferenceAnalysis}
          variant="outline" 
          className="w-full mb-2"
          disabled={isAnalyzing}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Analyze Differences
        </Button>
        
        <Button 
          onClick={handleSaveExample} 
          className="w-full"
          disabled={isAnalyzing}
        >
          <Save className="mr-2 h-4 w-4" />
          Save Example
        </Button>
      </CardFooter>
    </Card>
  );
};
