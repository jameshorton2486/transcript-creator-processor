
import { Toast, ToasterToast } from "@/components/ui/use-toast";

// Define the correct type for the toast function
export interface UseToastReturn {
  toast: (props: Toast) => {
    id: string;
    dismiss: () => void;
    update: (props: ToasterToast) => void;
  };
}
