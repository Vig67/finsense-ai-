import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, Sparkles } from "lucide-react";
import { CATEGORIES, formatZAR } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/budgets")({ component: BudgetsPage });

function BudgetsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: budgets = [] } = useQuery({
    queryKey: ["budgets", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("budgets").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const { data: txs = [] } = useQuery({
    queryKey: ["transactions", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("transactions").select("*")).data ?? [],
  });

  const create = useMutation({
    mutationFn: async (b: any) => {
      const { error } = await supabase.from("budgets").insert({ ...b, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["budgets"] }); toast.success("Budget created"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("budgets").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["budgets"] }),
  });

  const spent = (cat: string) => txs.filter((t: any) => t.category === cat).reduce((s, t: any) => s + Number(t.amount), 0);

  return (
    <div>
      <PageHeader
        title="Budget Planner"
        subtitle="Create personalised budgets and track them in real-time."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent text-background"><Plus className="mr-2 h-4 w-4" /> New Budget</Button>
            </DialogTrigger>
            <BudgetDialog onSubmit={(b) => create.mutate(b)} />
          </Dialog>
        }
      />

      {budgets.length === 0 ? (
        <div className="glass grid place-items-center rounded-3xl p-16 text-center text-muted-foreground">No budgets yet. Click "New Budget" to start.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b: any) => {
            const used = spent(b.category);
            const pct = Math.min(100, (used / Number(b.limit_amount)) * 100);
            const over = used > Number(b.limit_amount);
            return (
              <div key={b.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">{b.category} · {b.period}</div>
                    <div className="text-lg font-semibold">{b.name}</div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(b.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-4 text-2xl font-bold">{formatZAR(used)} <span className="text-sm font-normal text-muted-foreground">/ {formatZAR(Number(b.limit_amount))}</span></div>
                <Progress value={pct} className={`mt-3 ${over ? "[&>div]:bg-destructive" : "[&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent"}`} />
                <div className={`mt-2 text-xs ${over ? "text-destructive" : "text-muted-foreground"}`}>
                  {over ? `Over budget by ${formatZAR(used - Number(b.limit_amount))}` : `${formatZAR(Number(b.limit_amount) - used)} remaining`}
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/10 p-2 text-xs text-primary">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{over ? "Consider reducing discretionary spending in this category." : pct > 75 ? "Pace is tight — slow down spending." : "On track. Great discipline!"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function BudgetDialog({ onSubmit }: { onSubmit: (b: any) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Food");
  const [limit, setLimit] = useState("");
  const [period, setPeriod] = useState("monthly");
  return (
    <DialogContent className="glass">
      <DialogHeader><DialogTitle>New budget</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Groceries budget" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CATEGORIES.filter((c) => c !== "Income").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Period</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem><SelectItem value="yearly">Yearly</SelectItem></SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2"><Label>Limit (R)</Label><Input type="number" value={limit} onChange={(e) => setLimit(e.target.value)} placeholder="3000" /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit({ name, category, limit_amount: Number(limit), period })} className="bg-gradient-to-r from-primary to-accent text-background">Create budget</Button>
      </DialogFooter>
    </DialogContent>
  );
}