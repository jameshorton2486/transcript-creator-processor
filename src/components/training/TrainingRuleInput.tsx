
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

interface TrainingRule {
  id: string;
  name: string;
  description: string;
  rule: string;
}

export const TrainingRuleInput = () => {
  const [ruleName, setRuleName] = useState("");
  const [ruleDescription, setRuleDescription] = useState("");
  const [ruleText, setRuleText] = useState("");
  const { toast } = useToast();

  const handleSaveRule = () => {
    if (!ruleName.trim() || !ruleText.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a name and rule text.",
        variant: "destructive",
      });
      return;
    }

    // Create a new rule object
    const newRule: TrainingRule = {
      id: Date.now().toString(),
      name: ruleName.trim(),
      description: ruleDescription.trim(),
      rule: ruleText.trim(),
    };

    // Get existing rules from localStorage or initialize empty array
    const existingRules = JSON.parse(localStorage.getItem("transcriptRules") || "[]");
    
    // Add new rule and save back to localStorage
    const updatedRules = [...existingRules, newRule];
    localStorage.setItem("transcriptRules", JSON.stringify(updatedRules));

    // Reset form
    setRuleName("");
    setRuleDescription("");
    setRuleText("");

    toast({
      title: "Rule saved",
      description: "Your custom rule has been saved and will be applied in future transcript processing.",
    });
  };

  return (
    <Card className="bg-white">
      <CardHeader className="pb-2">
        <CardTitle>Add Custom Rule</CardTitle>
        <CardDescription>Define a new transcript formatting or correction rule</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="ruleName">Rule Name</Label>
          <Input
            id="ruleName"
            placeholder="e.g., 'Capitalize Court Titles'"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ruleDescription">Description (Optional)</Label>
          <Input
            id="ruleDescription"
            placeholder="e.g., 'Ensures all court titles are properly capitalized'"
            value={ruleDescription}
            onChange={(e) => setRuleDescription(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="ruleText">Rule Definition</Label>
          <Textarea
            id="ruleText"
            placeholder="e.g., 'Always capitalize the word 'Court' when referring to a specific court'"
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            rows={4}
          />
        </div>
      </CardContent>
      
      <CardFooter>
        <Button onClick={handleSaveRule} className="w-full">
          <Save className="mr-2 h-4 w-4" />
          Save Rule
        </Button>
      </CardFooter>
    </Card>
  );
};
