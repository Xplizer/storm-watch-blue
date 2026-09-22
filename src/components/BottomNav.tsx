import { Link } from "@tanstack/react-router";
import { CloudLightning, Map } from "lucide-react";

export function BottomNav() {
  const base =
    "flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-medium transition-colors";
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md px-5 pb-5">
      <div className="glass-card shadow-lift flex gap-1 rounded-3xl p-1.5">
        <Link
          to="/"
          className={base}
          activeProps={{ className: `${base} bg-primary text-primary-foreground` }}
          activeOptions={{ exact: true }}
          inactiveProps={{ className: `${base} text-muted-foreground` }}
        >
          <CloudLightning className="size-5" />
          Tracker
        </Link>
        <Link
          to="/map"
          className={base}
          activeProps={{ className: `${base} bg-primary text-primary-foreground` }}
          inactiveProps={{ className: `${base} text-muted-foreground` }}
        >
          <Map className="size-5" />
          Map
        </Link>
      </div>
    </nav>
  );
}
