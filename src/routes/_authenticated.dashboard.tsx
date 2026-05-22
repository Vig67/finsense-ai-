import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, KpiCard } from "@/components/page-header";
import { formatZAR, CATEGORY_COLORS } from "@/lib/format";
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Upload, Sparkles } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
} from "recharts";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({ component: Dashboard });

function Dashboard() {
  const { user } = useAuth();
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });
  const { data: txs = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("transactions").select("*").order("date", { ascending: false }).limit(1000)).data ?? [],
  });
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("savings_goals").select("*")).data ?? [],
  });

  const expenses = txs.filter((t: any) => t.category !== "Income").reduce((s, t: any) => s + Number(t.amount), 0);
  const income = txs.filter((t: any) => t.category === "Income").reduce((s, t: any) => s + Number(t.amount), 0);
  const savedTotal = goals.reduce((s: number, g: any) => s + Number(g.current_amount), 0);
  const targetTotal = goals.reduce((s: number, g: any) => s + Number(g.target_amount), 0);

  // monthly trend
  const byMonth: Record<string, { month: string; income: number; expenses: number }> = {};
  txs.forEach((t: any) => {
    const m = String(t.date).slice(0, 7);
    byMonth[m] = byMonth[m] || { month: m, income: 0, expenses: 0 };
    if (t.category === "Income") byMonth[m].income += Number(t.amount);
    else byMonth[m].expenses += Number(t.amount);
  });
  const trend = Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)).slice(-6);

  const byCat: Record<string, number> = {};
  txs.forEach((t: any) => {
    if (t.category === "Income") return;
    byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount);
  });
  const pie = Object.entries(byCat).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${profile?.full_name?.split(" ")[0] || "friend"}.`}
        subtitle="Your personalised AI-powered financial intelligence dashboard."
        action={
          <Link to="/upload">
            <Button className="bg-gradient-to-r from-primary to-accent text-background">
              <Upload className="mr-2 h-4 w-4" /> Upload statement
            </Button>
          </Link>
        }
      />

      {txs.length === 0 ? (
        <div className="glass grid place-items-center rounded-3xl p-16 text-center">
          <Sparkles className="mb-4 h-10 w-10 text-primary" />
          <h2 className="text-2xl font-semibold">No financial data yet</h2>
          <p className="mt-2 max-w-md text-muted-foreground">Upload a bank statement to unlock AI-powered insights, budgets and savings recommendations.</p>
          <Link to="/upload" className="mt-6"><Button className="bg-gradient-to-r from-primary to-accent text-background">Upload bank statement</Button></Link>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total income" value={formatZAR(income)} icon={TrendingUp} accent="success" hint="From uploaded statements" />
            <KpiCard label="Total expenses" value={formatZAR(expenses)} icon={TrendingDown} accent="warning" />
            <KpiCard label="Net cash flow" value={formatZAR(income - expenses)} icon={Wallet} accent={income - expenses >= 0 ? "success" : "destructive"} />
            <KpiCard label="Total saved" value={formatZAR(savedTotal)} icon={PiggyBank} accent="primary" hint={targetTotal ? `of ${formatZAR(targetTotal)} target` : "Set a goal"} />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <div className="glass rounded-2xl p-5 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">Income vs expenses</h3>
                <span className="text-xs text-muted-foreground">Last 6 months</span>
              </div>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="gIncome" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#22C55E" stopOpacity={0.5}/><stop offset="100%" stopColor="#22C55E" stopOpacity={0}/></linearGradient>
                      <linearGradient id="gExp" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#14B8A6" stopOpacity={0.5}/><stop offset="100%" stopColor="#14B8A6" stopOpacity={0}/></linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `R${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12 }} formatter={(v: any) => formatZAR(Number(v))} />
                    <Area type="monotone" dataKey="income" stroke="#22C55E" fill="url(#gIncome)" strokeWidth={2} />
                    <Area type="monotone" dataKey="expenses" stroke="#14B8A6" fill="url(#gExp)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="mb-4 font-semibold">Spending by category</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={pie} dataKey="value" innerRadius={50} outerRadius={90} paddingAngle={3}>
                      {pie.map((p) => <Cell key={p.name} fill={CATEGORY_COLORS[p.name] || "#94a3b8"} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12 }} formatter={(v: any) => formatZAR(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 space-y-1">
                {pie.slice(0, 5).map((p) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[p.name] || "#94a3b8" }} />{p.name}</span>
                    <span className="text-muted-foreground">{formatZAR(p.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 glass rounded-2xl p-5">
            <h3 className="mb-4 font-semibold">Recent transactions</h3>
            <div className="divide-y divide-border">
              {txs.slice(0, 8).map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-3">
                  <div>
                    <div className="font-medium">{t.description}</div>
                    <div className="text-xs text-muted-foreground">{t.date} · {t.category}</div>
                  </div>
                  <div className={t.category === "Income" ? "font-semibold text-[color:var(--success)]" : "font-semibold"}>
                    {t.category === "Income" ? "+" : "−"}{formatZAR(Number(t.amount))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}