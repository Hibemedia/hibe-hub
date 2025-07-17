import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider } from "@/lib/auth/useAuth";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";

// Auth pages
import Login from "./pages/auth/Login";
import AdminLogin from "./pages/auth/AdminLogin";

// Dashboard pages (for clients)
import Dashboard from "./pages/Dashboard";
import Performance from "./pages/Performance";
import Medals from "./pages/Medals";

// Admin pages (for Hibe staff)
import VideoApproval from "./pages/VideoApproval";
import Branding from "./pages/Branding";
import ContentMoments from "./pages/ContentMoments";
import MetricoolAdmin from "./pages/MetricoolAdmin";
import MetricoolDashboard from "./pages/MetricoolDashboard";
import LinkInBio from "./pages/LinkInBio";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Protected dashboard routes for clients */}
            <Route path="/dashboard/*" element={
              <ProtectedRoute allowedRoles={['klant']}>
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
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/performance" element={<Performance />} />
                        <Route path="/medals" element={<Medals />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            
            {/* Protected admin routes for Hibe staff */}
            <Route path="/admin/*" element={
              <ProtectedRoute allowedRoles={['admin', 'manager']}>
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
                            <span className="font-semibold text-foreground">Hibe Media Portal - Admin</span>
                          </div>
                        </div>
                      </header>
                      <Routes>
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/video-approval" element={<VideoApproval />} />
                        <Route path="/branding" element={<Branding />} />
                        <Route path="/content-moments" element={<ContentMoments />} />
                        <Route path="/metricool-admin" element={<MetricoolAdmin />} />
                        <Route path="/metricool-dashboard" element={<MetricoolDashboard />} />
                        <Route path="/link-in-bio" element={<LinkInBio />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </SidebarProvider>
              </ProtectedRoute>
            } />
            
            {/* Default redirects */}
            <Route path="/" element={<Login />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
