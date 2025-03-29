import React from "react";
import { Link } from "react-router-dom";
import { BrainCircuit } from "lucide-react";

export const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-indigo-500" />
          <Link to="/" className="text-lg font-semibold text-gray-800">
            AI Training Center
          </Link>
        </div>
        
        <nav className="flex items-center space-x-4">
          <Link to="/" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Home
          </Link>
          <Link to="/deepgram-test" className="text-sm font-medium text-gray-600 hover:text-gray-900">
            Test API Key
          </Link>
        </nav>
      </div>
    </header>
  );
};
