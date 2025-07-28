import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AuthProvider, useAuth } from "@/lib/auth/useAuth";
import { ProtectedRoute } from "@/lib/auth/ProtectedRoute";

// Auth pages
import Login from "./pages/auth/Login";
import AdminLogin from "./pages/auth/AdminLogin";

// Debug pages (TEMPORARY - Remove in production)
import AdminRegister from "./pages/debug/AdminRegister";
import UserManagement from "./pages/debug/UserManagement";

// Client dashboard pages
import ClientDashboard from "./pages/dashboard";

// Admin pages  
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";

// Existing pages
import Performance from "./pages/Performance";
import VideoApproval from "./pages/VideoApproval";
import Medals from "./pages/Medals";
import Branding from "./pages/Branding";
import ContentMoments from "./pages/ContentMoments";
import LinkInBio from "./pages/LinkInBio";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Root redirect component
function RootRedirect() {
  const { user, profile, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // Redirect based on role
  if (profile?.role === 'admin' || profile?.role === 'manager') {
    return <Navigate to="/admin/dashboard" replace />;
  }
  
  return <Navigate to="/dashboard" replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            
            {/* Debug routes (TEMPORARY - Remove in production) */}
            <Route path="/debug/admin-register" element={<AdminRegister />} />
            <Route path="/debug/user-management" element={<UserManagement />} />
            
            {/* Protected client routes */}
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['klant']}>
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected admin routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/users" 
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout>
                    <AdminUsers />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Legacy protected routes with sidebar */}
            <Route 
              path="/performance" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AdminLayout>
                    <Performance />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/video-approval" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AdminLayout>
                    <VideoApproval />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/medals" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AdminLayout>
                    <Medals />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/branding" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AdminLayout>
                    <Branding />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/content-moments" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AdminLayout>
                    <ContentMoments />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/link-in-bio" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AdminLayout>
                    <LinkInBio />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute allowedRoles={['admin', 'manager']}>
                  <AdminLayout>
                    <Settings />
                  </AdminLayout>
                </ProtectedRoute>
              } 
            />
            
            {/* Root redirect */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requireAuth={false}>
                  <RootRedirect />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

// Layout component for admin pages
function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
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
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}

export default App;
