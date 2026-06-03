import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import axios from "axios";
import { useAuthStore } from "@/store/authStore";

import DashboardPage  from "@/pages/DashboardPage";
import LoginPage      from "@/pages/LoginPage";
import RegisterPage   from "@/pages/RegisterPage";
import AnalyzePage        from "@/pages/AnalyzePage";
import HistoryPage        from "@/pages/HistoryPage";
import AnalysisDetailPage from "@/pages/AnalysisDetailPage";
import ProtectedRoute from "@/components/layout/ProtectedRoute";
import Navbar         from "@/components/layout/Navbar";
import BottomNav      from "@/components/layout/BottomNav";

function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    axios
      .post<{ access_token: string; user: { id: string; email: string; display_name: string } }>(
        "/api/v1/auth/refresh",
        {},
        { withCredentials: true }
      )
      .then((res) => setAuth(res.data.access_token, res.data.user))
      .catch(() => {});
  }, [setAuth]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/"         element={<DashboardPage />} />
              <Route path="/login"    element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/analyze"      element={<AnalyzePage />} />
                <Route path="/history"      element={<HistoryPage />} />
                <Route path="/history/:id"  element={<AnalysisDetailPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <BottomNav />
        </div>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
