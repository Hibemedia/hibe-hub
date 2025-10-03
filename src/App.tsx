import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AindyChat } from "@/components/AindyChat";
import Dashboard from "./pages/Dashboard";
import Performance from "./pages/Performance";
import VideoApproval from "./pages/VideoApproval";
import Medals from "./pages/Medals";
import Branding from "./pages/Branding";
import ContentMoments from "./pages/ContentMoments";

import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <SidebarProvider>
            <div className="min-h-screen flex w-full">
              <AppSidebar />
              <main className="flex-1 overflow-auto">
                <header className="h-16 border-b border-border bg-secondary backdrop-blur sticky top-0 z-50">
                  <div className="flex items-center h-full px-6">
                    <SidebarTrigger className="mr-4" />
                    <div className="flex items-center gap-3">
                      <img 
                        src={new URL('./assets/hibe-logo.png', import.meta.url).href} 
                        alt="Hibe Media Logo" 
                        className="h-8 w-auto"
                      />
                      <span className="font-semibold text-secondary-foreground">Hibe Media Portal</span>
                    </div>
                  </div>
                </header>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/video-approval" element={<VideoApproval />} />
                  <Route path="/medals" element={<Medals />} />
                  <Route path="/branding" element={<Branding />} />
                  <Route path="/content-moments" element={<ContentMoments />} />
                  
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            <AindyChat />
          </SidebarProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
