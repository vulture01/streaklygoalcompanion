import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence } from "framer-motion";
import { BottomNav } from "@/components/BottomNav";
import { PWAPrompts } from "@/components/PWAPrompts";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useSupabaseData";
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
import HabitsPage from "./pages/HabitsPage";
import WorkoutPage from "./pages/WorkoutPage";
import NewRoutinePage from "./pages/NewRoutinePage";
import WorkoutSessionPage from "./pages/WorkoutSessionPage";
import PhysiquePage from "./pages/PhysiquePage";
import CoachPage from "./pages/CoachPage";
import FriendsPage from "./pages/FriendsPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import UsernameSetupPage from "./pages/UsernameSetupPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, refetch } = useProfile();
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  useEffect(() => {
    if (!profileLoading) {
      if (profile) {
        // Treat existing accounts (with a name set) as onboarded for backward compat.
        const completed = (profile as any).onboarding_completed === true || (!!profile.name && profile.name !== '');
        setOnboarded(completed);
      } else if (user) {
        setOnboarded(false);
      }
    }
  }, [profile, profileLoading, user]);

  if (authLoading || (user && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (onboarded === false) {
    return <OnboardingPage onComplete={async () => { await refetch(); setOnboarded(true); }} />;
  }

  if (profile && !(profile as any).username) {
    return <UsernameSetupPage onComplete={async () => { await refetch(); }} />;
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage />} />
          <Route path="/friends" element={<FriendsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/focus" element={<FocusPage />} />
          <Route path="/todos" element={<TodosPage />} />
          <Route path="/habits" element={<HabitsPage />} />
          <Route path="/workout" element={<WorkoutPage />} />
          <Route path="/workout/new-routine" element={<NewRoutinePage />} />
          <Route path="/workout/session/:id" element={<WorkoutSessionPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/coach" element={<CoachPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/physique" element={<PhysiquePage />} />
          <Route path="/goal/:id" element={<GoalDetailPage />} />
          <Route path="/weekly-review" element={<WeeklyReviewPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AnimatePresence>
      <BottomNav />
      <PWAPrompts />
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
