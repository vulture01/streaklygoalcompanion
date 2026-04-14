import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile, useGoals } from "@/hooks/useSupabaseData";
import { useState, useEffect } from "react";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import FocusPage from "./pages/FocusPage";
import TodosPage from "./pages/TodosPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProfilePage from "./pages/ProfilePage";
import GoalDetailPage from "./pages/GoalDetailPage";
import OnboardingPage from "./pages/OnboardingPage";
import GroqSetupPage from "./pages/GroqSetupPage";
import WeeklyReviewPage from "./pages/WeeklyReviewPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, hasGroqKey } = useProfile();
  const { goals, loading: goalsLoading, seedDefaultGoals } = useGoals();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);
  const [groqSetupDone, setGroqSetupDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!profileLoading && profile) {
      setOnboarded(!!profile.name && profile.name !== '');
      setGroqSetupDone(hasGroqKey);
    }
    if (!profileLoading && !profile && user) {
      setOnboarded(false);
    }
  }, [profile, profileLoading, user]);

  // Seed default goals on first login (when no goals exist yet and onboarding done)
  useEffect(() => {
    if (!goalsLoading && goals.length === 0 && onboarded && user) {
      seedDefaultGoals();
    }
  }, [goalsLoading, goals.length, onboarded, user]);

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (onboarded === false) {
    return <OnboardingPage onComplete={() => setOnboarded(true)} />;
  }

  if (onboarded && groqSetupDone === false) {
    return <GroqSetupPage onComplete={() => setGroqSetupDone(true)} />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/goal/:id" element={<GoalDetailPage />} />
          <Route path="/weekly-review" element={<WeeklyReviewPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
