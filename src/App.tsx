import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import SkyAtlas from "./pages/SkyAtlas";
import FovCalculator from "./pages/FovCalculator";
import EquipmentProfile from "./pages/EquipmentProfile";
import RigBuilder from "./pages/RigBuilder";
import LightPollutionMap from "./pages/LightPollutionMap";
import ObjectPage from "./pages/ObjectPage";
import TonightPage from "./pages/TonightPage";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/tonight" element={<TonightPage />} />
            <Route path="/sky-atlas" element={<SkyAtlas />} />
            <Route path="/fov-calculator" element={<FovCalculator />} />
            <Route path="/equipment" element={<EquipmentProfile />} />
            <Route path="/rig-builder" element={<RigBuilder />} />
            <Route path="/light-pollution" element={<LightPollutionMap />} />
            <Route path="/object/:catalogId" element={<ObjectPage />} />
            <Route path="/planner" element={<SessionPlanner />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
