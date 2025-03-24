
import { ToastActionElement, toast } from "@/components/ui/toast";
import { ToastProps } from "@/components/ui/toast";

// Define the correct type for the toast function
export interface UseToastReturn {
  toast: typeof toast;
}
