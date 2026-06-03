import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "@/api/auth";
import { useAuthStore } from "@/store/authStore";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const setAuth  = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setAuth(data.access_token, data.user);
      navigate("/analyze");
    } catch {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4 py-12 bg-stone-50">

      <div className="mb-8 text-center">
        <span className="text-3xl font-bold text-brand-600 tracking-tight">SillarNet</span>
        <p className="text-sm text-stone-400 mt-1">Monitoreo patrimonial · Arequipa</p>
      </div>

      <div className="w-full max-w-sm">
        <div className="bg-white rounded-3xl shadow-sm border border-stone-100 p-7">
          <h1 className="text-xl font-bold text-stone-800 mb-1">Bienvenido de vuelta</h1>
          <p className="text-sm text-stone-400 mb-6">Ingresa a tu cuenta para continuar</p>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="l-email" className="block text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Correo electrónico
              </label>
              <input
                id="l-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="l-password" className="block text-xs font-semibold text-stone-500 uppercase tracking-wide">
                Contraseña
              </label>
              <input
                id="l-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-stone-200 rounded-xl px-4 py-3 text-sm bg-stone-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-brand-600 text-white rounded-xl text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-2 shadow-sm"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Ingresando…</> : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-stone-400 mt-6">
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="text-brand-600 font-semibold hover:underline">
            Regístrate gratis
          </Link>
        </p>
      </div>
    </div>
  );
}
