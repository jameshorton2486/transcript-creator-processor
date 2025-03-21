
import { ToastProps } from "@/components/ui/toast";

// Define the structure of the toast function return
export interface ToastActionReturn {
  id: string;
  dismiss: () => void;
  update: (props: ToastProps) => void;
}

// Define the structure of the useToast hook return
export interface UseToastReturn {
  toast: (props: ToastProps) => ToastActionReturn;
  dismiss: (toastId?: string) => void;
  toasts: any[];
}
