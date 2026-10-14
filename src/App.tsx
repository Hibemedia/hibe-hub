import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthContextProvider } from "@/context/AuthContext.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
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
import ResetPassword from "./pages/ResetPassword";
import Klanten from "./pages/Klanten";
import HibeDashboard from "./pages/hibe/HibeDashboard";
import HibeKlanten from "./pages/hibe/HibeKlanten";
import HibeGoedkeuringen from "./pages/hibe/HibeGoedkeuringen";
import HibeContentmomenten from "./pages/hibe/HibeContentmomenten";
import HibeInstellingen from "./pages/hibe/HibeInstellingen";
import { ClientProvider } from "@/context/ClientContext";
import { ClientEnv, HibeEnv, HibeClientScope } from "@/components/EnvRoutes";

const queryClient = new QueryClient();

const clientPages = (
  <>
    <Route index element={<Dashboard />} />
    <Route path="performance" element={<Performance />} />
    <Route path="video-approval" element={<VideoApproval />} />
    <Route path="content-moments" element={<ContentMoments />} />
    <Route path="branding" element={<Branding />} />
    <Route path="medals" element={<Medals />} />
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthContextProvider>
      <ClientProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/home" element={<Navigate to="/" replace />} />

              <Route path="/hibe" element={<HibeEnv />}>
                <Route index element={<HibeDashboard />} />
                <Route path="klanten" element={<HibeKlanten />} />
                <Route path="klanten/beheer" element={<Klanten />} />
                <Route path="klant/:id" element={<HibeClientScope />}>{clientPages}</Route>
                <Route path="goedkeuringen" element={<HibeGoedkeuringen />} />
                <Route path="contentmomenten" element={<HibeContentmomenten />} />
                <Route path="gebruikers" element={<GebruikersBeheer />} />
                <Route path="instellingen" element={<HibeInstellingen />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="/" element={<ClientEnv />}>
                {clientPages}
                <Route path="settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </ClientProvider>
    </AuthContextProvider>
  </QueryClientProvider>
);

export default App;
