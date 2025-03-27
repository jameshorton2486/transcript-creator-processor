
import { FileText, Mic, Wand2, Settings } from "lucide-react";
import { APP_INFO } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AuthenticatedUser } from "@/components/auth/AuthenticatedUser";

export const Header = () => {
  const navigate = useNavigate();

  // Handler for the "Process and format legal text" button
  const handleProcessFormat = () => {
    // Set the active tab to "transcribe" in the main page
    navigate("/?tab=transcribe");
    // Select the process tab in the transcript viewer if possible
    const processTab = document.querySelector('[data-value="process"]');
    if (processTab) {
      (processTab as HTMLElement).click();
    }
  };

  // Handler for the "Configure processing options" button
  const handleConfigureOptions = () => {
    navigate("/?tab=train");
  };

  return (
    <header className="bg-slate-800 text-white py-5 px-4 shadow-md">
      <div className="container mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-md">
            <Mic className="h-5 w-5" />
          </div>
          <h1 className="text-xl font-bold">{APP_INFO.name}</h1>
          <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">v{APP_INFO.version}</span>
        </div>
        
        <div className="flex items-center justify-between w-full md:w-auto">
          <div className="text-sm flex flex-wrap items-center gap-3">
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-white hover:bg-slate-700"
              onClick={() => navigate("/")}
            >
              <FileText className="h-4 w-4" />
              <span>Transcribe</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-white hover:bg-slate-700"
              onClick={handleProcessFormat}
            >
              <Wand2 className="h-4 w-4" />
              <span>Process</span>
            </Button>
            <Button 
              variant="ghost" 
              className="flex items-center gap-2 text-white hover:bg-slate-700"
              onClick={handleConfigureOptions}
            >
              <Settings className="h-4 w-4" />
              <span>Configure</span>
            </Button>
          </div>
          
          <div className="ml-auto">
            <AuthenticatedUser />
          </div>
        </div>
      </div>
    </header>
  );
};
