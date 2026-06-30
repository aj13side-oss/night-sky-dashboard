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
import LightPollutionMap from "./pages/LightPollutionMap";
import ObjectPage from "./pages/ObjectPage";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import PrivacyPage from "./pages/PrivacyPage";
import NotFound from "./pages/NotFound";
import LanguageRouteSync from "./components/LanguageRouteSync";

const queryClient = new QueryClient();

const localizedRoutes = (
  <>
    <Route index element={<Index />} />
    <Route path="sky-atlas" element={<SkyAtlas />} />
    <Route path="fov-calculator" element={<FovCalculator />} />
    <Route path="equipment" element={<EquipmentProfile />} />
    <Route path="rig-builder" element={<Navigate to="../equipment" replace />} />
    <Route path="light-pollution" element={<LightPollutionMap />} />
    <Route path="object/:catalogId" element={<ObjectPage />} />
    <Route path="privacy" element={<PrivacyPage />} />
    <Route path="admin" element={<Admin />} />
    <Route path="admin/login" element={<AdminLogin />} />
  </>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <LanguageRouteSync />
          <Routes>
            <Route path="/">{localizedRoutes}</Route>
            <Route path="/fr">{localizedRoutes}</Route>
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
