
import { CardFooter } from "@/components/ui/card";

export const TranscriberFooter = () => {
  return (
    <CardFooter className="bg-slate-50 text-xs text-slate-500 italic">
      Using batch processing for large audio files. Supports files up to 200MB through automatic chunking.
    </CardFooter>
  );
};
