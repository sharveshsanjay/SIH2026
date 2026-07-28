import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { AdminRoute } from "./components/layout/ProtectedRoute";
import { AppLayout } from "./components/layout/AppLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import TeamPage from "./pages/TeamPage";
import DocumentsPage from "./pages/DocumentsPage";
import ResearchPage from "./pages/ResearchPage";
import MeetingsPage from "./pages/MeetingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import TimelinePage from "./pages/TimelinePage";
import AnnouncementsPage from "./pages/AnnouncementsPage";
import ActivityLogsPage from "./pages/ActivityLogsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ChatPage from "./pages/ChatPage";
import SettingsPage from "./pages/SettingsPage";
import ProblemStatementPage from "./pages/ProblemStatementPage";
import IdeasPage from "./pages/IdeasPage";

export default function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/meetings" element={<MeetingsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/timeline" element={<TimelinePage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/activity-logs" element={<ActivityLogsPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin/users" element={<AdminUsersPage />} />
            </Route>
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/problem-statement" element={<ProblemStatementPage />} />
            <Route path="/ideas" element={<IdeasPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
