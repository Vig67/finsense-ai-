import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, KpiCard } from "@/components/page-header";
import { HeartPulse, TrendingUp, AlertTriangle, Sparkles } from "lucide-react";
import { formatZAR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/wellness")({ component: WellnessPage });

function WellnessPage() {
  const { user } = useAuth();
  const { data: txs = [] } = useQuery({
    queryKey: ["transactions", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("transactions").select("*")).data ?? [],
  });
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("savings_goals").select("*")).data ?? [],
  });
  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("budgets").select("*")).data ?? [],
  });

  const income = txs.filter((t: any) => t.category === "Income").reduce((s, t: any) => s + Number(t.amount), 0);
  const expenses = txs.filter((t: any) => t.category !== "Income").reduce((s, t: any) => s + Number(t.amount), 0);
  const savingsRate = income > 0 ? Math.max(0, (income - expenses) / income) : 0;

  // score: budget discipline + savings rate + goal activity
  const score = Math.round(
    Math.min(100, 30 + savingsRate * 50 + Math.min(15, budgets.length * 5) + Math.min(15, goals.length * 5)),
  );
  const grade = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 40 ? "Fair" : "Needs work";
  const color = score >= 80 ? "var(--success)" : score >= 60 ? "var(--primary)" : score >= 40 ? "var(--warning)" : "var(--destructive)";

  const insights: { icon: any; t: string; d: string; accent: "success" | "warning" | "destructive" | "primary" }[] = [];
  if (savingsRate < 0.1) insights.push({ icon: AlertTriangle, t: "Low savings rate", d: `You're saving less than 10% of income. Aim for 15-20%.`, accent: "warning" });
  else insights.push({ icon: TrendingUp, t: "Healthy savings rate", d: `You're saving ${Math.round(savingsRate * 100)}% of income — great job!`, accent: "success" });
  if (budgets.length === 0) insights.push({ icon: AlertTriangle, t: "No active budgets", d: "Create a budget to gain control over discretionary spending.", accent: "warning" });
  if (goals.length === 0) insights.push({ icon: Sparkles, t: "Set a savings goal", d: "People with goals save 2x more on average.", accent: "primary" });
  if (expenses > income && income > 0) insights.push({ icon: AlertTriangle, t: "Overspending", d: `Expenses exceed income by ${formatZAR(expenses - income)}.`, accent: "destructive" });

  return (
    <div>
      <PageHeader title="Financial Wellness" subtitle="AI-generated health score, insights, and improvement suggestions." />
      <div className="grid gap-6 lg:grid-cols-[1fr_2fr]">
        <div className="glass rounded-3xl p-8 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Your wellness score</div>
          <div className="relative mx-auto mt-4 grid h-44 w-44 place-items-center">
            <svg className="absolute inset-0" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" stroke="oklch(0.3 0.025 258)" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="44" stroke={`oklch(0.74 0.14 185)`} strokeWidth="8" fill="none"
                strokeDasharray={`${(score / 100) * 276} 276`} strokeLinecap="round" transform="rotate(-90 50 50)" />
            </svg>
            <div>
              <div className="text-5xl font-bold gradient-text">{score}</div>
              <div className="text-xs text-muted-foreground">/ 100</div>
            </div>
          </div>
          <div className="mt-4 text-lg font-semibold" style={{ color: `oklch(var(--ring))` }}>{grade}</div>
          <p className="mt-2 text-sm text-muted-foreground">A balanced indicator of savings, budgeting and goal progress.</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <KpiCard label="Savings rate" value={`${Math.round(savingsRate * 100)}%`} accent="success" icon={TrendingUp} />
          <KpiCard label="Active budgets" value={String(budgets.length)} icon={HeartPulse} />
          <KpiCard label="Goals tracked" value={String(goals.length)} accent="accent" icon={Sparkles} />
          <KpiCard label="Monthly cashflow" value={formatZAR(income - expenses)} accent={income - expenses >= 0 ? "success" : "destructive"} icon={TrendingUp} />
        </div>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {insights.map((i, idx) => (
          <div key={idx} className="glass flex items-start gap-3 rounded-2xl p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl bg-${i.accent}/15`} style={{ color: `var(--${i.accent})` }}>
              <i.icon className="h-5 w-5" />
            </div>
            <div><div className="font-semibold">{i.t}</div><div className="text-sm text-muted-foreground">{i.d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}