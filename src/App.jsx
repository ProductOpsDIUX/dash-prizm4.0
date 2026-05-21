
import React from "react"; // Role toggle support
import { useActivityTracker, setGlobalTrackAction } from "./hooks/useActivityTracker";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { SidebarProvider } from "./components/ui/sidebar";
import AppSidebar from "./components/layout/AppSidebar";
import TopBar from "./components/layout/TopBar";
import FloatingAIChat from "./components/AI/FloatingAIChat";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import AppAnalytics from "./pages/AppAnalytics";
import NotFound from "./pages/NotFound";
import ChapterMetrics from "./pages/ChapterMetrics";
import PortfolioMetrics from "./pages/PortfolioMetrics";
import ProjectDetails from "./pages/ProjectDetails";
import ManageDatabase from "./pages/ManageDatabase";
import ManageProjects from "./pages/ManageProjects";
import ManageChapters from "./pages/ManageChapters";
import ManageNominalRoll from "./pages/ManageNominalRoll";
import CreateSurvey from "./pages/CreateSurvey";
import SurveyForm from "./pages/SurveyForm";
import Surveys from "./pages/Surveys";
import StaffView from "./pages/StaffView";
import AIAnalytics from "./pages/AIAnalytics";
import PulseCheck from "./pages/PulseCheck";
import QuestionBank from "./pages/QuestionBank";
import TestResults from "./pages/TestResults";
import Notifications from "./pages/Notifications";
import NotificationDetail from "./pages/NotificationDetail";
import Onboarding from "./pages/Onboarding";
import EmailVerification from "./pages/EmailVerification";
import ResetPassword from "./pages/ResetPassword";
import EmailNotifications from "./pages/EmailNotifications";
import HelpCentre from "./pages/HelpCentre";
import SubmitFeedback from "./pages/SubmitFeedback";
import AdminFeedback from "./pages/AdminFeedback";

import { Toaster } from "./components/ui/toaster";
import { Toaster as SonnerToaster } from "sonner";

const ActivityTrackerWrapper = () => {
  const { trackAction } = useActivityTracker();
  React.useEffect(() => {
    setGlobalTrackAction(trackAction);
    return () => setGlobalTrackAction(null);
  }, [trackAction]);
  return null;
};

const AppLayout = ({ children, isSurveyPage = false }) => {
  if (isSurveyPage) {
    return (
      <div className="min-h-screen">
        <ActivityTrackerWrapper />
        {children}
      </div>);

  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0 bg-sidebar">
          <TopBar />
          <main className="flex-1 rounded-tl-2xl overflow-y-auto overflow-x-hidden bg-gray-50">
            {children}
          </main>
        </div>
      </div>
      <FloatingAIChat />
      <ActivityTrackerWrapper />
    </SidebarProvider>);

};

const App = () => {
  return (
    <>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Landing />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/verify-email" element={<EmailVerification />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><Home /></AppLayout></ProtectedRoute>} />
            <Route path="/chapter/:chapterId" element={<ProtectedRoute><AppLayout><ChapterMetrics /></AppLayout></ProtectedRoute>} />
            <Route path="/portfolio/:portfolioId" element={<ProtectedRoute><AppLayout><PortfolioMetrics /></AppLayout></ProtectedRoute>} />
            <Route path="/project/:projectId" element={<ProtectedRoute><AppLayout><ProjectDetails /></AppLayout></ProtectedRoute>} />
            <Route path="/staff/:staffId" element={<ProtectedRoute><AppLayout><StaffView /></AppLayout></ProtectedRoute>} />
            <Route path="/manage-database" element={<ProtectedRoute><AppLayout><ManageDatabase /></AppLayout></ProtectedRoute>} />
            <Route path="/manage-database/projects" element={<ProtectedRoute><AppLayout><ManageProjects /></AppLayout></ProtectedRoute>} />
            <Route path="/manage-database/chapters" element={<ProtectedRoute><AppLayout><ManageChapters /></AppLayout></ProtectedRoute>} />
            <Route path="/manage-database/nominal-roll" element={<ProtectedRoute><AppLayout><ManageNominalRoll /></AppLayout></ProtectedRoute>} />
            <Route path="/create-survey" element={<ProtectedRoute><AppLayout><CreateSurvey /></AppLayout></ProtectedRoute>} />
            <Route path="/ai-analytics" element={<ProtectedRoute><AppLayout><AIAnalytics /></AppLayout></ProtectedRoute>} />
            <Route path="/pulse-check" element={<ProtectedRoute requireUXSC><AppLayout><PulseCheck /></AppLayout></ProtectedRoute>} />
            <Route path="/question-bank" element={<ProtectedRoute><AppLayout><QuestionBank /></AppLayout></ProtectedRoute>} />
            <Route path="/test-results" element={<ProtectedRoute><AppLayout><TestResults /></AppLayout></ProtectedRoute>} />
            <Route path="/survey" element={<AppLayout isSurveyPage><SurveyForm /></AppLayout>} />
            <Route path="/notifications" element={<ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>} />
            <Route path="/notifications/:id" element={<ProtectedRoute><AppLayout><Notifications /></AppLayout></ProtectedRoute>} />
            <Route path="/surveys" element={<ProtectedRoute><AppLayout><Surveys /></AppLayout></ProtectedRoute>} />
            <Route path="/email-notifications" element={<ProtectedRoute><AppLayout><EmailNotifications /></AppLayout></ProtectedRoute>} />
            <Route path="/help-centre" element={<ProtectedRoute><AppLayout><HelpCentre /></AppLayout></ProtectedRoute>} />
            <Route path="/submit-feedback" element={<ProtectedRoute><AppLayout><SubmitFeedback /></AppLayout></ProtectedRoute>} />
            <Route path="/admin-feedback" element={<ProtectedRoute><AppLayout><AdminFeedback /></AppLayout></ProtectedRoute>} />
            <Route path="/app-analytics" element={<ProtectedRoute><AppLayout><AppAnalytics /></AppLayout></ProtectedRoute>} />
            <Route path="*" element={<ProtectedRoute><AppLayout><NotFound /></AppLayout></ProtectedRoute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <Toaster />
      <SonnerToaster position="top-right" />
    </>);

};

export default App;
