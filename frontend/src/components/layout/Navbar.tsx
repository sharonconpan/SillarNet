import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";
import { authApi } from "@/api/auth";
import { cn } from "@/lib/utils";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const { isAuthenticated, user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  async function handleLogout() {
    await authApi.logout().catch(() => {});
    clearAuth();
    navigate("/");
  }

  const desktopLinks = [
    { to: "/", label: "Mapa" },
    ...(isAuthenticated
      ? [{ to: "/analyze", label: "Analizar" }, { to: "/history", label: "Historial" }]
      : []),
  ];

  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-stone-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        <Link to="/" className="font-bold text-brand-600 text-lg tracking-tight flex-shrink-0">
          SillarNet
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {desktopLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                "text-sm font-medium transition-colors hover:text-brand-600",
                pathname === to ? "text-brand-600" : "text-stone-500"
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <span className="hidden sm:block text-sm text-stone-500 truncate max-w-[140px]">
                {user?.display_name}
              </span>
              <button
                onClick={handleLogout}
                aria-label="Cerrar sesión"
                className="flex items-center gap-1.5 text-sm text-stone-500 hover:text-red-500 transition-colors p-1"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm text-stone-600 hover:text-brand-600 transition-colors px-1 py-1"
              >
                Ingresar
              </Link>
              <Link
                to="/register"
                className="text-sm bg-brand-600 text-white px-3.5 py-1.5 rounded-lg hover:bg-brand-700 transition-colors font-medium"
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
