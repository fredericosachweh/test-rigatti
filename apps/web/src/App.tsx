import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { ThemeToggle } from "./components/ThemeToggle";
import { useAuth } from "./contexts/AuthContext";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AuthPage } from "./pages/AuthPage";
import { ChatPage } from "./pages/ChatPage";
import { DashboardPage } from "./pages/DashboardPage";
import { FavoritesPage } from "./pages/FavoritesPage";

function RequireAuth() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate replace to="/auth" />;
  }
  return <Outlet />;
}

function RequireAdmin() {
  const { user } = useAuth();
  if (user?.role !== "admin") {
    return <Navigate replace to="/catalogo" />;
  }
  return <Outlet />;
}

export default function App() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <div className="screen-loader">Preparando ambiente...</div>;
  }

  return (
    <>
      <Routes>
        <Route path="/auth" element={user ? <Navigate replace to="/catalogo" /> : <AuthPage />} />

        {/* Catálogo público + áreas logadas compartilham o mesmo shell */}
        <Route element={<AppShell />}>
          <Route path="/catalogo" element={<DashboardPage />} />

          <Route element={<RequireAuth />}>
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/chat" element={<ChatPage />} />
          </Route>

          <Route element={<RequireAdmin />}>
            <Route path="/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate replace to="/catalogo" />} />
      </Routes>
      <ThemeToggle />
    </>
  );
}
