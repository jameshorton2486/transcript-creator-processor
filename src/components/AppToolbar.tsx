
import { Mic, FileText, Wand2, Settings } from "lucide-react";
import { APP_INFO } from "@/lib/config";

interface AppToolbarProps {
  onTranscribeClick?: () => void;
  onProcessClick?: () => void;
  onConfigureClick?: () => void;
  activeTab: string;
}

export const AppToolbar = ({
  onTranscribeClick,
  onProcessClick,
  onConfigureClick,
  activeTab
}: AppToolbarProps) => {
  return (
    <div className="bg-slate-800 text-white py-3 px-4 rounded-md mb-6 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <Mic className="h-5 w-5" />
        <h1 className="text-lg font-medium">Audio Transcriber</h1>
        <span className="text-xs bg-slate-700 px-2 py-0.5 rounded">v{APP_INFO.version}</span>
      </div>
      
      <div className="flex items-center space-x-1">
        <button 
          onClick={onTranscribeClick}
          className={`flex items-center px-3 py-1.5 text-sm rounded-md ${activeTab === "transcribe" ? "bg-blue-600" : "hover:bg-slate-700"}`}
        >
          <FileText className="h-4 w-4 mr-2" />
          <span>Transcribe audio files</span>
        </button>
        
        <button 
          onClick={onProcessClick}
          className={`flex items-center px-3 py-1.5 text-sm rounded-md ${activeTab === "process" ? "bg-blue-600" : "hover:bg-slate-700"}`}
          disabled={!onProcessClick}
        >
          <Wand2 className="h-4 w-4 mr-2" />
          <span>Process and format legal text</span>
        </button>
        
        <button 
          onClick={onConfigureClick}
          className={`flex items-center px-3 py-1.5 text-sm rounded-md ${activeTab === "configure" ? "bg-blue-600" : "hover:bg-slate-700"}`}
          disabled={!onConfigureClick}
        >
          <Settings className="h-4 w-4 mr-2" />
          <span>Configure processing options</span>
        </button>
      </div>
    </div>
  );
};
