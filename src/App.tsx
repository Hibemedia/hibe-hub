import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthContextProvider } from "@/context/AuthContext.jsx"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { AppSidebar } from "@/components/AppSidebar";
import Dashboard from "./pages/Dashboard";
import Performance from "./pages/Performance";
import VideoApproval from "./pages/VideoApproval";
import Medals from "./pages/Medals";
import Branding from "./pages/Branding";
import ContentMoments from "./pages/ContentMoments";

import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import GebruikersBeheer from "./pages/GebruikersBeheer";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import ResetPassword from "./pages/ResetPassword";
import Klanten from "./pages/Klanten";
import { ClientProvider } from "@/context/ClientContext";
const queryClient = new QueryClient();

const App = () => {

  return (

    <QueryClientProvider client={queryClient}>
      <AuthContextProvider>
      <ClientProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/*"
                element={
                  <div className="flex min-h-screen w-full">
                      <AppSidebar />
                      <main className="min-w-0 flex-1 pb-24 md:pb-0">
                        <TopBar />
                        <Routes>
                          <Route path="/home" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                          <Route path="/performance" element={<ProtectedRoute><Performance /></ProtectedRoute>} />
                          <Route path="/video-approval" element={<ProtectedRoute><VideoApproval /></ProtectedRoute>} />
                          <Route path="/medals" element={<ProtectedRoute><Medals /></ProtectedRoute>} />
                          <Route path="/branding" element={<ProtectedRoute><Branding /></ProtectedRoute>} />
                          <Route path="/content-moments" element={<ProtectedRoute><ContentMoments /></ProtectedRoute>} />
                          <Route path="/gebruikersbeheer" element={<ProtectedRoute><AdminRoute><GebruikersBeheer /></AdminRoute></ProtectedRoute>} />
                          <Route path="/klanten" element={<ProtectedRoute><AdminRoute><Klanten /></AdminRoute></ProtectedRoute>} />

                          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                          <Route path="*" element={<ProtectedRoute><NotFound /></ProtectedRoute>} />
                        </Routes>
                      </main>
                  </div>
                }
              />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ClientProvider>
      </AuthContextProvider>

    </QueryClientProvider>
  );
};

export default App;
