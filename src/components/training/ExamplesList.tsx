
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Trash2, Eye } from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getExamples, deleteExample, StoredTrainingExample } from "@/lib/storage/modelStorage";

export const ExamplesList = () => {
  const [examples, setExamples] = useState<StoredTrainingExample[]>([]);
  const [exampleToDelete, setExampleToDelete] = useState<string | null>(null);
  const [selectedExample, setSelectedExample] = useState<StoredTrainingExample | null>(null);
  const { toast } = useToast();

  // Load examples from storage
  const loadExamples = () => {
    const storedExamples = getExamples();
    setExamples(storedExamples);
  };

  useEffect(() => {
    loadExamples();
  }, []);

  const handleDeleteExample = (id: string) => {
    try {
      deleteExample(id);
      loadExamples(); // Reload examples after deletion
      setExampleToDelete(null);
      
      toast({
        title: "Example deleted",
        description: "The training example has been removed.",
      });
    } catch (error) {
      toast({
        title: "Failed to delete example",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (examples.length === 0) {
    return (
      <div className="text-center p-4 border rounded-md bg-slate-50">
        <p className="text-slate-500">No training examples added yet</p>
      </div>
    );
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[120px]">Date Added</TableHead>
            <TableHead>Incorrect Text Preview</TableHead>
            <TableHead className="hidden md:table-cell">Corrected Text Preview</TableHead>
            <TableHead className="w-[100px] text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {examples.map((example) => (
            <TableRow key={example.id}>
              <TableCell>{formatDate(example.createdAt)}</TableCell>
              <TableCell>
                {example.incorrect.length > 40 ? 
                  `${example.incorrect.substring(0, 40)}...` : 
                  example.incorrect}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {example.corrected.length > 40 ? 
                  `${example.corrected.substring(0, 40)}...` : 
                  example.corrected}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end space-x-1">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setSelectedExample(example)}
                      >
                        <Eye className="h-4 w-4 text-blue-500" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Training Example Details</DialogTitle>
                        <DialogDescription>
                          Added on {selectedExample && formatDate(selectedExample.createdAt)}
                        </DialogDescription>
                      </DialogHeader>
                      
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Incorrect Text:</h3>
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md whitespace-pre-wrap">
                            {selectedExample?.incorrect}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h3 className="text-sm font-medium">Corrected Text:</h3>
                          <div className="p-3 bg-green-50 border border-green-200 rounded-md whitespace-pre-wrap">
                            {selectedExample?.corrected}
                          </div>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => setExampleToDelete(example.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Training Example</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this training example? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteExample(example.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
