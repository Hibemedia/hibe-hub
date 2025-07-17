import { 
  BarChart3, 
  Brain, 
  Calendar, 
  CheckCircle, 
  Award, 
  Archive, 
  TrendingUp,
  Link,
  Settings,
  Home,
  LogOut,
  Play,
  Palette,
  Database,
  Bug
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
import { useAuth } from "@/lib/auth/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Menu items for clients
const clientMenuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Performance",
    url: "/dashboard/performance",
    icon: BarChart3,
  },
  {
    title: "Medailles",
    url: "/dashboard/medals",
    icon: Award,
  },
];

// Menu items for admin/manager
const adminMenuItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: Home,
  },
  {
    title: "Video Goedkeuring",
    url: "/admin/video-approval",
    icon: Play,
  },
  {
    title: "Branding & Archief",
    url: "/admin/branding",
    icon: Palette,
  },
  {
    title: "Contentmomenten",
    url: "/admin/content-moments",
    icon: Calendar,
  },
  {
    title: "Metricool Admin",
    url: "/admin/metricool-admin",
    icon: Database,
  },
  {
    title: "Social Analytics",
    url: "/admin/metricool-dashboard",
    icon: TrendingUp,
  },
  {
    title: "Link in Bio",
    url: "/admin/link-in-bio",
    icon: Link,
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { user } = useAuth();

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleDebugUser = async () => {
    console.log('=== DEBUG USER INFO ===');
    try {
      const { data: user, error } = await supabase.auth.getUser();
      console.log('Current user:', user, error);
      
      const { data: session } = await supabase.auth.getSession();
      console.log('Current session:', session);
      
      if (user.user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.user.id)
          .single();
        console.log('User data from public.users:', userData);
      }
    } catch (error) {
      console.error('Debug error:', error);
    }
    console.log('=== END DEBUG ===');
  };

  // Get menu items based on user role
  const menuItems = user?.role === 'klant' ? clientMenuItems : adminMenuItems;
  const settingsUrl = user?.role === 'klant' ? '/dashboard/settings' : '/admin/settings';
  const portalTitle = user?.role === 'klant' ? 'Klantportaal' : 'Admin Panel';

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
                {portalTitle}
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

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10">
                  <NavLink 
                    to={settingsUrl} 
                    className={getNavClasses(settingsUrl)}
                  >
                    <Settings className="h-4 w-4" />
                    {!collapsed && <span className="ml-3">Instellingen</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10">
                  <Button 
                    variant="ghost" 
                    onClick={handleDebugUser}
                    className="w-full justify-start text-muted-foreground hover:text-foreground h-10 px-3"
                  >
                    <Bug className="h-4 w-4" />
                    {!collapsed && <span className="ml-3">Debug User</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild className="h-10">
                  <Button 
                    variant="ghost" 
                    onClick={handleLogout}
                    className="w-full justify-start text-muted-foreground hover:text-foreground h-10 px-3"
                  >
                    <LogOut className="h-4 w-4" />
                    {!collapsed && <span className="ml-3">Uitloggen</span>}
                  </Button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}