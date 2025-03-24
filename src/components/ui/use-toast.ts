
// Re-export useToast and toast from the hooks directory
import { useToast, toast } from "@/hooks/use-toast";

// Re-export the types from the toast component
export type { Toast, ToastActionElement } from "@/components/ui/toast";

export { useToast, toast };
