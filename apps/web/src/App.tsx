import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ThemeToggle } from "./components/ThemeToggle";
import { useAuth } from "./contexts/AuthContext";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";

function ProtectedRoutes() {
  const { isReady, user } = useAuth();

  if (!isReady) {
    return <div className="screen-loader">Carregando sessao...</div>;
  }

  if (!user) {
    return <Navigate replace to="/auth" />;
  }

  return <AppShell />;
}

export default function App() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <div className="screen-loader">Preparando ambiente...</div>;
  }

  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate replace to="/dashboard" /> : <AuthPage />} />
        <Route element={<ProtectedRoutes />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
          {user?.role === "admin" && <Route path="/analytics" element={<AnalyticsPage />} />}
        </Route>
        <Route path="*" element={<Navigate replace to={user ? "/dashboard" : "/auth"} />} />
      </Routes>
      <ThemeToggle />
    </>
  );
}
