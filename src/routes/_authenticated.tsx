import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  LayoutDashboard, Upload, BarChart3, Wallet, Target, HeartPulse, Sparkles, ShieldCheck, LogOut, Menu, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({ component: AuthLayout });

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/upload", label: "Secure Upload", icon: Upload },
  { to: "/spending", label: "Spending Analysis", icon: BarChart3 },
  { to: "/budgets", label: "Budget Planner", icon: Wallet },
  { to: "/goals", label: "Savings Goals", icon: Target },
  { to: "/wellness", label: "Financial Wellness", icon: HeartPulse },
  { to: "/assistant", label: "AI Assistant", icon: Sparkles },
  { to: "/privacy", label: "Privacy & Security", icon: ShieldCheck },
] as const;

function AuthLayout() {
  const { session, loading, signOut, user } = useAuth();
  const navigate = useNavigate();
  const [openMobile, setOpenMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [session, loading, navigate]);

  useEffect(() => setOpenMobile(false), [location.pathname]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  if (loading || !session) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-primary to-accent" />
      </div>
    );
  }

  const initials = (profile?.full_name || user?.email || "U")
    .split(" ")
    .map((s: string) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen">
      {/* mobile topbar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Sparkles className="h-4 w-4 text-background" />
          </div>
          <span className="font-semibold">FinSense AI</span>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setOpenMobile((v) => !v)}>
          {openMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      <div className="lg:grid lg:grid-cols-[280px_1fr]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-72 transform border-r border-border bg-sidebar p-5 transition-transform lg:static lg:translate-x-0",
            openMobile ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="mb-8 hidden items-center gap-3 lg:flex">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5 text-background" />
            </div>
            <div>
              <div className="font-semibold tracking-tight">FinSense AI</div>
              <div className="text-xs text-muted-foreground">Financial intelligence</div>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground transition hover:bg-sidebar-accent"
                activeProps={{
                  className:
                    "bg-sidebar-accent text-primary shadow-[inset_0_0_0_1px_oklch(0.74_0.14_185/0.4),0_0_20px_oklch(0.74_0.14_185/0.15)]",
                }}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="absolute inset-x-5 bottom-5">
            <div className="glass flex items-center gap-3 rounded-xl p-3">
              <div className="grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-xs font-bold text-background">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{profile?.full_name || user?.email}</div>
                <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
              </div>
              <Button
                size="icon"
                variant="ghost"
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/auth", replace: true });
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-h-screen px-4 py-6 sm:px-8 lg:px-10 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}