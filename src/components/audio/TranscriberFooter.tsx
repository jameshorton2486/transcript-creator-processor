
import { CardFooter } from "@/components/ui/card";

export const TranscriberFooter = () => {
  return (
    <CardFooter className="bg-slate-50 text-xs text-slate-500 italic">
      Using memory-efficient batch processing. Supports files up to 200MB through automatic chunking.
      Large files are split into small segments to prevent browser memory issues.
    </CardFooter>
  );
};
