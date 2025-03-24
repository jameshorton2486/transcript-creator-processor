
import { ToastActionElement, Toast } from "@/components/ui/toast";
import { toast } from "@/hooks/use-toast";

// Define the correct type for the toast function
export interface UseToastReturn {
  toast: typeof toast;
}
