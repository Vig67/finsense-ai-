import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/page-header";
import { Upload as UploadIcon, FileText, ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { useServerFn } from "@tanstack/react-start";
import { analyzeStatement } from "@/lib/ai.functions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/upload")({ component: UploadPage });

function UploadPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const analyze = useServerFn(analyzeStatement);
  const [stage, setStage] = useState<"idle" | "uploading" | "analyzing" | "done">("idle");
  const [drag, setDrag] = useState(false);
  const [summary, setSummary] = useState<string>("");

  const handle = async (file: File) => {
    if (!user) return;
    if (file.size > 10 * 1024 * 1024) return toast.error("Max 10MB");
    const ok = ["application/pdf", "text/csv", "text/plain"].includes(file.type) || /\.(csv|pdf|txt)$/i.test(file.name);
    if (!ok) return toast.error("Upload a PDF or CSV file");
    try {
      setStage("uploading");
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("statements").upload(path, file);
      if (upErr) throw upErr;

      // Read text
      let text = "";
      try {
        text = await file.text();
      } catch {
        text = `Binary file: ${file.name}`;
      }

      setStage("analyzing");
      const { transactions, summary } = await analyze({ data: { text, fileName: file.name } });

      // Insert statement record
      const totalExpenses = transactions.filter((t) => t.category !== "Income").reduce((s, t) => s + t.amount, 0);
      const totalIncome = transactions.filter((t) => t.category === "Income").reduce((s, t) => s + t.amount, 0);
      const { data: stmt, error: stErr } = await supabase
        .from("statements")
        .insert({ user_id: user.id, file_name: file.name, file_path: path, total_income: totalIncome, total_expenses: totalExpenses })
        .select()
        .single();
      if (stErr) throw stErr;

      const rows = transactions.map((t) => ({
        user_id: user.id,
        statement_id: stmt.id,
        date: t.date,
        description: t.description,
        category: t.category,
        amount: t.amount,
      }));
      if (rows.length) await supabase.from("transactions").insert(rows);
      setSummary(summary);
      setStage("done");
      qc.invalidateQueries();
      toast.success(`Processed ${rows.length} transactions`);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Upload failed");
      setStage("idle");
    }
  };

  return (
    <div>
      <PageHeader title="Secure Upload" subtitle="Upload a bank statement (PDF or CSV). Your data is encrypted and only visible to you." />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            const f = e.dataTransfer.files?.[0];
            if (f) handle(f);
          }}
          className={`glass relative grid min-h-[340px] place-items-center rounded-3xl border-2 border-dashed p-10 text-center transition ${drag ? "border-primary bg-primary/5" : "border-border"}`}
        >
          {stage === "idle" && (
            <div>
              <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/30 to-accent/30">
                <UploadIcon className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Drop your statement here</h3>
              <p className="mt-2 text-sm text-muted-foreground">PDF or CSV · up to 10MB</p>
              <label className="mt-6 inline-block">
                <input type="file" accept=".pdf,.csv,.txt,application/pdf,text/csv,text/plain" className="hidden" onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
                <Button asChild className="bg-gradient-to-r from-primary to-accent text-background"><span>Browse files</span></Button>
              </label>
            </div>
          )}
          {(stage === "uploading" || stage === "analyzing") && (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="font-medium">{stage === "uploading" ? "Encrypting & uploading…" : "AI is analyzing your transactions…"}</div>
              <div className="text-xs text-muted-foreground">This may take a few seconds</div>
            </div>
          )}
          {stage === "done" && (
            <div className="max-w-xl">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-[color:var(--success)]" />
              <h3 className="text-xl font-semibold">All set!</h3>
              <p className="mt-2 text-sm text-muted-foreground">{summary}</p>
              <div className="mt-6 flex justify-center gap-3">
                <Button onClick={() => navigate({ to: "/dashboard" })} className="bg-gradient-to-r from-primary to-accent text-background">View dashboard</Button>
                <Button variant="outline" onClick={() => setStage("idle")}>Upload another</Button>
              </div>
            </div>
          )}
        </div>
        <div className="space-y-4">
          {[
            { icon: ShieldCheck, t: "Encrypted at rest", d: "Files stored in secure private buckets." },
            { icon: FileText, t: "PDF & CSV supported", d: "Most South African bank exports work." },
            { icon: UploadIcon, t: "Auto-categorized", d: "AI tags every transaction in seconds." },
          ].map(({ icon: Icon, t, d }) => (
            <div key={t} className="glass flex gap-3 rounded-2xl p-4">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
              <div><div className="font-medium">{t}</div><div className="text-sm text-muted-foreground">{d}</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}