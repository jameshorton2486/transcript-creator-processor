
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrainingRuleInput } from "./TrainingRuleInput";
import { TrainingRulesList } from "./TrainingRulesList";
import { ExampleBasedTraining } from "./ExampleBasedTraining";
import { ExamplesList } from "./ExamplesList";

export const AITrainingCenter = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>AI Training Center</CardTitle>
          <CardDescription>
            Train the AI by providing custom rules or correction examples
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="rules">
            <TabsList className="mb-4">
              <TabsTrigger value="rules">Custom Rules</TabsTrigger>
              <TabsTrigger value="examples">Learning by Example</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rules" className="space-y-6">
              <TrainingRuleInput />
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Saved Rules</h3>
                <TrainingRulesList />
              </div>
            </TabsContent>
            
            <TabsContent value="examples" className="space-y-6">
              <ExampleBasedTraining />
              
              <div className="space-y-3">
                <h3 className="text-lg font-medium">Saved Examples</h3>
                <ExamplesList />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
