
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
          <div className="bg-white shadow-md rounded-md p-8 max-w-3xl mx-auto border border-gray-200">
            <div className="prose max-w-none">
              <h1 className="text-2xl font-bold mb-6">{fileName || "Transcript"}</h1>
              {currentTranscript.split("\n").map((line, index) => {
                if (/^(Speaker \d+:|[A-Z][A-Z\s']+:)/.test(line)) {
                  return <p key={index} className="font-bold mt-4">{line}</p>;
                } else if (/^(Q|A):/.test(line)) {
                  return <p key={index} className="font-bold mt-3">{line}</p>;
                } else {
                  return <p key={index} className="mt-1">{line}</p>;
                }
              })}
            </div>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
