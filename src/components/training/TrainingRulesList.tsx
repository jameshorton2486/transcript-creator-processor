
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Edit } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TrainingRule {
  id: string;
  name: string;
  description: string;
  rule: string;
}

export const TrainingRulesList = () => {
  const [rules, setRules] = useState<TrainingRule[]>([]);
  const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load rules from localStorage
    const savedRules = localStorage.getItem("transcriptRules");
    if (savedRules) {
      setRules(JSON.parse(savedRules));
    }
  }, []);

  const handleDeleteRule = (id: string) => {
    const updatedRules = rules.filter(rule => rule.id !== id);
    setRules(updatedRules);
    localStorage.setItem("transcriptRules", JSON.stringify(updatedRules));
    setRuleToDelete(null);
    
    toast({
      title: "Rule deleted",
      description: "The training rule has been removed.",
    });
  };

  if (rules.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-slate-50">
        <p className="text-slate-500">No custom rules added yet</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Name</TableHead>
            <TableHead className="hidden md:table-cell">Description</TableHead>
            <TableHead className="hidden lg:table-cell">Rule</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <TableRow key={rule.id}>
              <TableCell className="font-medium">{rule.name}</TableCell>
              <TableCell className="hidden md:table-cell">{rule.description || "—"}</TableCell>
              <TableCell className="hidden lg:table-cell">{rule.rule.length > 50 ? `${rule.rule.substring(0, 50)}...` : rule.rule}</TableCell>
              <TableCell className="text-right">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setRuleToDelete(rule.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Rule</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this rule? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDeleteRule(rule.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
