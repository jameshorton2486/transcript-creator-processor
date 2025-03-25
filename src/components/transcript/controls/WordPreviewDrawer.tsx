
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";

interface WordPreviewDrawerProps {
  currentTranscript: string;
  fileName: string;
}

export const WordPreviewDrawer = ({ currentTranscript, fileName }: WordPreviewDrawerProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  return (
    <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
        >
          <FileText className="h-4 w-4" />
          Word Preview
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[80vh]">
        <DrawerHeader>
          <DrawerTitle>Transcript Word Preview</DrawerTitle>
        </DrawerHeader>
        <div className="p-6 overflow-auto h-[calc(80vh-70px)]">
          <div className="bg-white shadow-md rounded-md p-8 max-w-3xl mx-auto border border-gray-200 document-preview">
            <div className="relative">
              {/* Document header with page styling */}
              <div className="document-header mb-6 border-b pb-4">
                <h1 className="text-2xl font-serif text-center">{fileName || "Transcript"}</h1>
                <div className="text-xs text-gray-400 text-right mt-2">Page 1</div>
              </div>
              
              {/* Document content with proper formatting */}
              <div className="prose max-w-none font-serif leading-relaxed">
                {currentTranscript.split("\n").map((line, index) => {
                  if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
                    return <p key={index} className="font-bold mt-4">{line}</p>;
                  } else if (/^(Q|A):/.test(line)) {
                    return <p key={index} className="font-bold mt-3">{line}</p>;
                  } else {
                    return <p key={index} className="mt-1 text-justify">{line}</p>;
                  }
                })}
              </div>
              
              {/* Document footer with page number */}
              <div className="document-footer mt-6 pt-4 border-t text-center text-xs text-gray-400">
                {fileName || "Transcript"} | Page 1
              </div>
              
              {/* Document watermark */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-5 rotate-45 text-6xl font-bold text-gray-500 pointer-events-none">
                PREVIEW
              </div>
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
