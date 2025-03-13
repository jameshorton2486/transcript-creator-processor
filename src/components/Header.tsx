
import { FileText, Mic } from "lucide-react";

export const Header = () => {
  return (
    <header className="bg-slate-800 text-white py-6 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Mic className="h-6 w-6" />
          <h1 className="text-xl font-bold">Legal Transcript Processor</h1>
        </div>
        <div className="text-sm flex items-center gap-2">
          <FileText className="h-4 w-4" />
          <span>Transcribe, optimize and analyze legal recordings</span>
        </div>
      </div>
    </header>
  );
};
