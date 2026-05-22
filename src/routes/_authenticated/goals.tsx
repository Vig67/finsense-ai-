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
import { Plus, Trash2, Target, Sparkles } from "lucide-react";
import { formatZAR } from "@/lib/format";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/goals")({ component: GoalsPage });

const GOAL_CATS = ["Emergency Fund", "Vacation", "Car Purchase", "Education", "Home Deposit", "Other"];

function GoalsPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const { data: goals = [] } = useQuery({
    queryKey: ["goals", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("savings_goals").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const create = useMutation({
    mutationFn: async (g: any) => {
      const { error } = await supabase.from("savings_goals").insert({ ...g, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["goals"] }); toast.success("Goal created"); setOpen(false); },
    onError: (e: any) => toast.error(e.message),
  });
  const update = useMutation({
    mutationFn: async ({ id, current }: { id: string; current: number }) => {
      await supabase.from("savings_goals").update({ current_amount: current }).eq("id", id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });
  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("savings_goals").delete().eq("id", id); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["goals"] }),
  });

  return (
    <div>
      <PageHeader
        title="Savings Goals"
        subtitle="Set financial milestones and track your progress with AI guidance."
        action={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-accent text-background"><Plus className="mr-2 h-4 w-4" /> Create New Goal</Button>
            </DialogTrigger>
            <GoalDialog onSubmit={(g) => create.mutate(g)} />
          </Dialog>
        }
      />
      {goals.length === 0 ? (
        <div className="glass grid place-items-center rounded-3xl p-16 text-center text-muted-foreground">No goals yet. Click "Create New Goal" to start.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {goals.map((g: any) => {
            const pct = Math.min(100, (Number(g.current_amount) / Number(g.target_amount)) * 100);
            return (
              <div key={g.id} className="glass rounded-2xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary"><Target className="h-5 w-5" /></div>
                    <div>
                      <div className="text-xs text-muted-foreground">{g.category}</div>
                      <div className="font-semibold">{g.name}</div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove.mutate(g.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-2xl font-bold gradient-text">{Math.round(pct)}%</span>
                  <span className="text-xs text-muted-foreground">{g.deadline ? `by ${g.deadline}` : "no deadline"}</span>
                </div>
                <Progress value={pct} className="mt-2 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:to-accent" />
                <div className="mt-2 text-sm">{formatZAR(Number(g.current_amount))} <span className="text-muted-foreground">of {formatZAR(Number(g.target_amount))}</span></div>
                <div className="mt-3 flex gap-2">
                  <Input type="number" placeholder="Add R" className="h-8" onKeyDown={(e: any) => {
                    if (e.key === "Enter" && e.currentTarget.value) {
                      update.mutate({ id: g.id, current: Number(g.current_amount) + Number(e.currentTarget.value) });
                      e.currentTarget.value = "";
                    }
                  }} />
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-primary/10 p-2 text-xs text-primary">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>{pct >= 100 ? "Goal smashed! Time to set a new one." : `Save ${formatZAR((Number(g.target_amount) - Number(g.current_amount)) / 6)} monthly to reach it in 6 months.`}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function GoalDialog({ onSubmit }: { onSubmit: (g: any) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(GOAL_CATS[0]);
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState("");
  return (
    <DialogContent className="glass">
      <DialogHeader><DialogTitle>Create savings goal</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Bali trip" /></div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2"><Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GOAL_CATS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Target (R)</Label><Input type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="25000" /></div>
        </div>
        <div className="space-y-2"><Label>Deadline (optional)</Label><Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} /></div>
      </div>
      <DialogFooter>
        <Button onClick={() => onSubmit({ name, category, target_amount: Number(target), deadline: deadline || null })} className="bg-gradient-to-r from-primary to-accent text-background">Create goal</Button>
      </DialogFooter>
    </DialogContent>
  );
}