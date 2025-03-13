
import { FileText } from "lucide-react";

export const Header = () => {
  return (
    <header className="bg-slate-800 text-white py-6 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6" />
          <h1 className="text-xl font-bold">Legal Clarity Machine</h1>
        </div>
        <div className="text-sm">
          Optimize and analyze legal transcripts
        </div>
      </div>
    </header>
  );
};
