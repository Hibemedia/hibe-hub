import { 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Award, 
  Archive,
  Settings,
  LogOut,
  Home,
  Users,
  Building2
} from "lucide-react";
import { useClient } from "@/context/ClientContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { UserAuth } from "@/context/AuthContext.jsx";

const menuItems = [
  {
    title: "Dashboard",
    url: "/home",
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
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const location = useLocation();
  const { isAdmin: isAdminUser, clients, clientId, setClientId, client } = useClient();
  
 const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } 

  }
  const getNavClasses = (url: string) => {
    const isActive = location.pathname === url;
    return cn(
      "transition-colors duration-200 rounded-lg text-sm font-medium",
      {
        "bg-primary text-primary-foreground": isActive,
        "text-foreground hover:bg-muted": !isActive,
      }
    );
  };
  

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="border-b border-border p-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-semibold text-sm">H</span>
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-base font-semibold text-foreground">
                Hibe Media
              </h2>
              <p className="text-xs text-muted-foreground">
                Klantportaal
              </p>
            </div>
          )}
        </div>
        {!collapsed && isAdminUser && clients.length > 0 && (
          <div className="mt-4">
            <Select value={clientId ?? ""} onValueChange={setClientId}>
              <SelectTrigger aria-label="Kies klant" className="h-9 text-sm"><SelectValue placeholder="Kies klant" /></SelectTrigger>
              <SelectContent>{clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}
        {!collapsed && !isAdminUser && client && (
          <p className="mt-3 text-sm font-medium text-foreground">{client.name}</p>
        )}
      </SidebarHeader>

      <SidebarContent className="p-4">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium text-muted-foreground mb-2 px-3">
            Navigatie
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavClasses(item.url)}
                    >
                      <item.icon className="h-4 w-4" strokeWidth={1.5} />
                      {!collapsed && (
                        <span className="ml-3 flex items-center gap-2">
                          {item.title}
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              {isAdminUser && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/klanten" className={getNavClasses("/klanten")}>
                      <Building2 className="h-4 w-4" strokeWidth={1.5} />
                      {!collapsed && <span className="ml-3">Klanten</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              {isAdminUser && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to="/gebruikersbeheer"
                      className={getNavClasses("/gebruikersbeheer")}
                    >
                      <Users className="h-4 w-4" strokeWidth={1.5} />
                      {!collapsed && <span className="ml-3">Gebruikers Beheer</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink 
                    to="/settings" 
                    className={getNavClasses("/settings")}
                  >
                    <Settings className="h-4 w-4" strokeWidth={1.5} />
                    {!collapsed && <span className="ml-3">Instellingen</span>}
                  </NavLink>
                </SidebarMenuButton>
                <SidebarMenuButton onClick={handleLogout}>
                  <LogOut className="h-4 w-4" strokeWidth={1.5}/>
                   {!collapsed && <span className="ml-3">Log uit</span>}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
