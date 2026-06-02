import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  async function handleLogout() {
    await authApi.logout().catch(() => {});
    clearAuth();
    navigate("/");
  }

  const navLink = (to: string, label: string) => (
    <Link
      to={to}
      className={cn(
        "text-sm font-medium transition-colors hover:text-brand-600",
        location.pathname === to ? "text-brand-600" : "text-gray-600"
      )}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to="/" className="font-bold text-brand-600 text-lg tracking-tight">
          SillarNet
        </Link>

        <nav className="flex items-center gap-5">
          {navLink("/", "Mapa")}
          {isAuthenticated && navLink("/analyze", "Analizar")}
          {isAuthenticated && navLink("/history", "Historial")}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-500 hidden sm:block">{user?.display_name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-600 hover:text-red-600 transition-colors"
              >
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm text-gray-600 hover:text-brand-600 transition-colors">
                Ingresar
              </Link>
              <Link
                to="/register"
                className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg hover:bg-brand-700 transition-colors"
              >
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
