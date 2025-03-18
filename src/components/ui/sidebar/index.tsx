
import { TooltipProvider } from "@/components/ui/tooltip"

export { useSidebar, SidebarProvider } from "./context"
export { Sidebar, SidebarTrigger, SidebarRail } from "./sidebar"
export {
  SidebarInset,
  SidebarInput,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
  SidebarContent,
} from "./content"
export {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarGroupContent,
} from "./groups"
export {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuSkeleton,
} from "./menu"
export {
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "./submenu"

// Re-export TooltipProvider to ensure tooltips work properly with the sidebar
export { TooltipProvider as SidebarTooltipProvider }
