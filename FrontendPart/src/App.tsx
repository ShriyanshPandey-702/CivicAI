import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CitizenProvider } from "@/lib/CitizenContext";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import AgentPage from "./pages/AgentPage";
import SchemesPage from "./pages/SchemesPage";
import HowItWorksPage from "./pages/HowItWorksPage";
import PublicSchemesPage from "./pages/PublicSchemesPage";
import NotFound from "./pages/NotFound";
import SchemeDetailsPage from "./pages/SchemeDetailsPage";
import PersonalDetailsPage from "./pages/PersonalDetailsPage";
import DocumentVaultPage from "./pages/DocumentVaultPage";
import AppliedPage from "./pages/AppliedPage";
import NotificationsPage from "./pages/NotificationsPage";
import SettingsPage from "./pages/SettingsPage";
import { AuthProvider } from "@/lib/AuthContext";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/contexts/LanguageContext";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
    <LanguageProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CitizenProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/signup" element={<SignupPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/dashboard/agent" element={<AgentPage />} />
                  <Route path="/dashboard/schemes" element={<SchemesPage />} />
                  <Route path="/dashboard/schemes/:schemeId" element={<SchemeDetailsPage />} />
                  <Route path="/dashboard/profile" element={<PersonalDetailsPage />} />
                  <Route path="/dashboard/documents" element={<DocumentVaultPage />} />
                  <Route path="/dashboard/apply" element={<AppliedPage />} />
                  <Route path="/dashboard/notifications" element={<NotificationsPage />} />
                  <Route path="/dashboard/settings" element={<SettingsPage />} />
                  <Route path="/how-it-works" element={<HowItWorksPage />} />
                  <Route path="/schemes" element={<PublicSchemesPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CitizenProvider>
        </AuthProvider>
      </QueryClientProvider>
    </LanguageProvider>
  </ThemeProvider>
);

export default App;
