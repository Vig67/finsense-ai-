import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3-flash-preview";

const TxSchema = z.object({
  text: z.string().max(200_000),
  fileName: z.string().max(200),
});

export const analyzeStatement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => TxSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI not configured");
    const system = `You are a financial parser for South African bank statements. Extract transactions and return STRICT JSON via the provided tool. All amounts in ZAR. Categorize each transaction as one of: Food, Transport, Shopping, Entertainment, Bills, Savings, Subscriptions, Income, Other. Expenses are positive numbers; income items use the "Income" category. If the input is unclear or not a statement, generate 20-35 realistic example South African transactions for the past month (typical groceries Pick n Pay/Checkers/Woolworths, fuel Engen/Sasol, Uber, Netflix, Vodacom, Eskom, salary deposit, etc.) totalling roughly R10000-R25000 in expenses.`;
    const body = {
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: `File: ${data.fileName}\n\n${data.text.slice(0, 60000)}` },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "save_transactions",
            description: "Save categorized transactions",
            parameters: {
              type: "object",
              properties: {
                transactions: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      date: { type: "string", description: "YYYY-MM-DD" },
                      description: { type: "string" },
                      category: {
                        type: "string",
                        enum: ["Food", "Transport", "Shopping", "Entertainment", "Bills", "Savings", "Subscriptions", "Income", "Other"],
                      },
                      amount: { type: "number", description: "Positive ZAR amount" },
                    },
                    required: ["date", "description", "category", "amount"],
                  },
                },
                summary: { type: "string", description: "One-paragraph AI insight about spending patterns" },
              },
              required: ["transactions", "summary"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "save_transactions" } },
    };

    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("AI gateway", res.status, t);
      if (res.status === 429) throw new Error("Rate limit hit. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Workspace settings.");
      throw new Error("AI analysis failed");
    }
    const json = await res.json();
    const call = json.choices?.[0]?.message?.tool_calls?.[0];
    const args = call ? JSON.parse(call.function.arguments) : { transactions: [], summary: "" };
    return args as {
      transactions: { date: string; description: string; category: string; amount: number }[];
      summary: string;
    };
  });

const ChatSchema = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(4000) })).max(40),
  context: z.string().max(20000).optional(),
});

export const chatWithAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => ChatSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("AI not configured");
    const system = `You are FinSense AI, a friendly South African financial wellness coach. All amounts in ZAR (R). Be concise, warm, practical. Use the user's actual financial context when given. Suggest concrete next steps.`;
    const msgs = [
      { role: "system", content: system },
      ...(data.context ? [{ role: "system" as const, content: `User's financial context:\n${data.context}` }] : []),
      ...data.messages,
    ];
    const res = await fetch(GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODEL, messages: msgs }),
    });
    if (!res.ok) {
      if (res.status === 429) throw new Error("Rate limit hit. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error("AI failed");
    }
    const json = await res.json();
    return { reply: json.choices?.[0]?.message?.content ?? "" };
  });