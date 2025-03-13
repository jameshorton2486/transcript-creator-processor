
import { FileText, Mic, Wand2, Settings } from "lucide-react";
import { APP_INFO } from "@/lib/config";

export const Header = () => {
  return (
    <header className="bg-slate-800 text-white py-6 px-4">
      <div className="container mx-auto flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div className="flex items-center gap-2">
          <Mic className="h-6 w-6" />
          <h1 className="text-xl font-bold">{APP_INFO.name}</h1>
          <span className="text-xs bg-slate-700 px-2 py-1 rounded-full">v{APP_INFO.version}</span>
        </div>
        <div className="text-sm flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span>Transcribe audio files</span>
          </div>
          <div className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            <span>Process and format legal text</span>
          </div>
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Configure processing options</span>
          </div>
        </div>
      </div>
    </header>
  );
};
