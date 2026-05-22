import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader, KpiCard } from "@/components/page-header";
import { formatZAR, CATEGORY_COLORS } from "@/lib/format";
import { BarChart3, Repeat, Sparkles } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from "recharts";

export const Route = createFileRoute("/_authenticated/spending")({ component: SpendingPage });

function SpendingPage() {
  const { user } = useAuth();
  const { data: txs = [] } = useQuery({
    queryKey: ["transactions", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("transactions").select("*").order("date", { ascending: false })).data ?? [],
  });

  const expenses = txs.filter((t: any) => t.category !== "Income");
  const total = expenses.reduce((s, t: any) => s + Number(t.amount), 0);
  const byCat: Record<string, number> = {};
  expenses.forEach((t: any) => { byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount); });
  const catData = Object.entries(byCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  // recurring
  const grouped: Record<string, number> = {};
  expenses.forEach((t: any) => {
    const key = t.description.toLowerCase().replace(/\d/g, "").trim().slice(0, 30);
    grouped[key] = (grouped[key] || 0) + 1;
  });
  const recurring = Object.entries(grouped).filter(([, c]) => c >= 2).length;

  return (
    <div>
      <PageHeader title="Plan, Track, Optimize." subtitle="Personalised spending analysis powered by AI." />
      {txs.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard label="Total spent" value={formatZAR(total)} icon={BarChart3} />
            <KpiCard label="Transactions" value={String(expenses.length)} icon={BarChart3} accent="accent" />
            <KpiCard label="Recurring patterns" value={String(recurring)} icon={Repeat} accent="warning" />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="glass rounded-2xl p-5">
              <h3 className="mb-4 font-semibold">Spending by category</h3>
              <div className="h-72">
                <ResponsiveContainer>
                  <BarChart data={catData} layout="vertical" margin={{ left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} width={100} />
                    <Tooltip contentStyle={{ background: "#0F172A", border: "1px solid #334155", borderRadius: 12 }} formatter={(v: any) => formatZAR(Number(v))} />
                    <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                      {catData.map((d) => <Cell key={d.name} fill={CATEGORY_COLORS[d.name] || "#94a3b8"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">AI insights</h3>
              </div>
              <ul className="space-y-3 text-sm">
                {catData.slice(0, 3).map((c) => (
                  <li key={c.name} className="rounded-xl border border-border p-3">
                    <div className="font-medium">{c.name} — {formatZAR(c.value)} ({Math.round((c.value/total)*100)}%)</div>
                    <div className="mt-1 text-muted-foreground">{insight(c.name, c.value, total)}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-6 glass rounded-2xl p-5">
            <h3 className="mb-4 font-semibold">All transactions</h3>
            <div className="max-h-[480px] divide-y divide-border overflow-auto">
              {expenses.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <div className="font-medium">{t.description}</div>
                    <div className="text-xs text-muted-foreground">{t.date}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full px-2 py-0.5 text-xs" style={{ background: (CATEGORY_COLORS[t.category] || "#94a3b8") + "20", color: CATEGORY_COLORS[t.category] || "#94a3b8" }}>{t.category}</span>
                    <span className="w-24 text-right font-semibold">−{formatZAR(Number(t.amount))}</span>
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

function insight(cat: string, val: number, total: number) {
  const pct = (val / total) * 100;
  if (pct > 35) return `${cat} dominates your spend. Consider trimming non-essential items here by 15-20%.`;
  if (cat === "Subscriptions") return `Review subscriptions — cancelling unused ones could save ${formatZAR(val * 0.3)} monthly.`;
  if (cat === "Food") return `Try meal-planning weekly. Cooking at home could save 20-30%.`;
  if (cat === "Transport") return `Consider carpooling or fuel-efficient routes to reduce monthly transport costs.`;
  return `Healthy spend pattern. Keep tracking to maintain control.`;
}

function EmptyState() {
  return <div className="glass grid place-items-center rounded-3xl p-16 text-center text-muted-foreground">Upload a statement to see your spending analysis.</div>;
}