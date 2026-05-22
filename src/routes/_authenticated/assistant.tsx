import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { chatWithAssistant } from "@/lib/ai.functions";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send } from "lucide-react";
import { formatZAR } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/assistant")({ component: AssistantPage });

const SUGGESTIONS = [
  "How can I save more money?",
  "What are my biggest expenses?",
  "Am I overspending?",
  "How can I improve my financial wellness?",
];

function AssistantPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const chat = useServerFn(chatWithAssistant);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const { data: messages = [] } = useQuery({
    queryKey: ["chat", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("chat_messages").select("*").order("created_at")).data ?? [],
  });
  const { data: txs = [] } = useQuery({
    queryKey: ["transactions", user?.id], enabled: !!user,
    queryFn: async () => (await supabase.from("transactions").select("*")).data ?? [],
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || !user) return;
    setInput("");
    setBusy(true);
    try {
      await supabase.from("chat_messages").insert({ user_id: user.id, role: "user", content: text });
      qc.invalidateQueries({ queryKey: ["chat"] });

      // build context summary
      const expenses = txs.filter((t: any) => t.category !== "Income");
      const totalExp = expenses.reduce((s, t: any) => s + Number(t.amount), 0);
      const income = txs.filter((t: any) => t.category === "Income").reduce((s, t: any) => s + Number(t.amount), 0);
      const byCat: Record<string, number> = {};
      expenses.forEach((t: any) => { byCat[t.category] = (byCat[t.category] || 0) + Number(t.amount); });
      const context = txs.length
        ? `Income: ${formatZAR(income)}\nExpenses: ${formatZAR(totalExp)}\nBy category:\n${Object.entries(byCat).map(([k, v]) => `- ${k}: ${formatZAR(v)}`).join("\n")}`
        : "No financial data uploaded yet.";

      const history = [...messages, { role: "user", content: text }].map((m: any) => ({ role: m.role, content: m.content }));
      const { reply } = await chat({ data: { messages: history, context } });

      await supabase.from("chat_messages").insert({ user_id: user.id, role: "assistant", content: reply });
      qc.invalidateQueries({ queryKey: ["chat"] });
    } catch (e: any) {
      const { toast } = await import("sonner");
      toast.error(e.message || "AI failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col">
      <PageHeader title="AI Financial Assistant" subtitle="Ask anything about your money. Personalised answers powered by your data." />

      <div className="glass flex-1 overflow-y-auto rounded-2xl p-6">
        {messages.length === 0 && (
          <div className="grid h-full place-items-center text-center">
            <div className="max-w-md">
              <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
                <Sparkles className="h-7 w-7 text-background" />
              </div>
              <h3 className="text-xl font-semibold">How can I help today?</h3>
              <p className="mt-2 text-sm text-muted-foreground">Try one of these prompts:</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-border bg-secondary/50 px-3 py-1.5 text-xs hover:border-primary hover:text-primary">{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm ${m.role === "user" ? "bg-gradient-to-br from-primary to-accent text-background" : "bg-secondary/70"}`}>
                <div className="whitespace-pre-wrap">{m.content}</div>
              </div>
            </div>
          ))}
          {busy && <div className="text-sm text-muted-foreground">Thinking…</div>}
          <div ref={endRef} />
        </div>
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(input); }}
        className="mt-4 flex gap-2"
      >
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your spending, budgets, savings…" disabled={busy} />
        <Button type="submit" disabled={busy || !input.trim()} className="bg-gradient-to-r from-primary to-accent text-background">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}