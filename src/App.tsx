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
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
const queryClient = new QueryClient();

const App = () => {

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Login />} />
            
            <Route path="/*"
              element={
                <SidebarProvider>
                  <div className="min-h-screen flex w-full">
                    <AppSidebar />
                    <main className="flex-1 overflow-auto">
                      <header className="h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
                        <div className="flex items-center h-full px-6">
                          <SidebarTrigger className="mr-4" />
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 bg-gradient-primary rounded-md flex items-center justify-center">
                              <span className="text-white font-bold text-xs">H</span>
                            </div>
                            <span className="font-semibold text-foreground">Hibe Media Portal</span>
                          </div>
                        </div>
                      </header>
                      <Routes>
                        <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                        <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                        <Route path="/video-approval" element={<ProtectedRoute><VideoApproval /></ProtectedRoute>} />
                        <Route path="/medals" element={<ProtectedRoute><Medals /></ProtectedRoute>} />
                        <Route path="/branding" element={<ProtectedRoute><Branding /></ProtectedRoute>} />
                        <Route path="/content-moments" element={<ProtectedRoute><ContentMoments /></ProtectedRoute>} />

                        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                  <AindyChat />
                </SidebarProvider>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
