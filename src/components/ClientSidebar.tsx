import { 
  BarChart3, 
  Brain, 
  Calendar, 
  CheckCircle, 
  Award, 
  Archive, 
  Link,
  Home
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Performance",
    url: "/performance",
    icon: BarChart3,
  },
  {
    title: "Video Goedkeuring",
    url: "/video-approval",
    icon: CheckCircle,
  },
  {
    title: "Medailles",
    url: "/medals",
    icon: Award,
  },
  {
    title: "Branding & Archief",
    url: "/branding",
    icon: Archive,
  },
  {
    title: "Contentmomenten",
    url: "/content-moments",
    icon: Calendar,
  },
  {
    title: "Link in Bio",
    url: "/link-in-bio",
    icon: Link,
  },
];

export function ClientSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();

  const getNavClasses = (url: string) => {
    const isActive = location.pathname === url;
    return cn(
      "transition-all duration-200 hover:bg-sidebar-accent rounded-lg",
      {
        "bg-gradient-primary text-white shadow-primary": isActive,
        "text-sidebar-foreground": !isActive,
      }
    );
  };

  return (
    <Sidebar className="border-r border-sidebar-border">
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">H</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-lg font-semibold text-sidebar-foreground">
                Hibe Media
              </h2>
              <p className="text-xs text-muted-foreground">
                Klantportaal
              </p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2">
            Navigatie
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-10">
                    <NavLink 
                      to={item.url} 
                      className={getNavClasses(item.url)}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span className="ml-3">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}