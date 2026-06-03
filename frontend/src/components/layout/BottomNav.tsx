import { Link, useLocation } from "react-router-dom";
import { Map, Camera, Clock } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/",        label: "Mapa",      Icon: Map    },
  { to: "/analyze", label: "Analizar",  Icon: Camera },
  { to: "/history", label: "Historial", Icon: Clock  },
];

export default function BottomNav() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const { pathname } = useLocation();

  if (!isAuthenticated) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/95 backdrop-blur-xl border-t border-stone-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ to, label, Icon }) => {
          const active = pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center justify-center gap-1 w-full h-full transition-colors",
                active ? "text-brand-600" : "text-stone-400 hover:text-stone-600"
              )}
            >
              <Icon
                className={cn("w-[22px] h-[22px] transition-all", active && "scale-110")}
                strokeWidth={active ? 2.5 : 1.8}
              />
              <span className={cn("text-[10px] font-medium", active && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
