
import { toast } from "@/hooks/use-toast";

// Define the correct type for the toast function
export interface UseToastReturn {
  toast: typeof toast;
}

// Re-export the toast types from the toast component
export type { Toast, ToastActionElement } from "@/components/ui/toast";
