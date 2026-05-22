import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { ShieldCheck, Lock, EyeOff, ServerCog, FileKey, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/privacy")({ component: PrivacyPage });

const ITEMS = [
  { icon: Lock, t: "Encrypted file uploads", d: "Bank statements are encrypted in transit and at rest in a private bucket only you can access." },
  { icon: EyeOff, t: "Only you can see your data", d: "Row-level security policies guarantee no other user — or the public — can read your information." },
  { icon: ServerCog, t: "No direct bank access", d: "FinSense AI never connects to your bank account. We only process statements you choose to upload." },
  { icon: FileKey, t: "User-controlled access", d: "Delete uploaded statements at any time and the linked transactions go with them." },
  { icon: Sparkles, t: "Responsible AI", d: "AI runs on a secure gateway and is used only to categorise and advise — never to share your data." },
  { icon: ShieldCheck, t: "Industry-grade authentication", d: "Sign-in is protected by leaked-password detection and secure OAuth providers." },
];

function PrivacyPage() {
  return (
    <div>
      <PageHeader title="Privacy & Security" subtitle="How FinSense AI protects your financial information." />
      <div className="glass mb-6 rounded-3xl p-6 text-center">
        <ShieldCheck className="mx-auto h-10 w-10 text-primary" />
        <h2 className="mt-3 text-xl font-semibold">Your financial files are encrypted and securely processed.</h2>
        <p className="mt-2 text-sm text-muted-foreground">FinSense AI does not access your bank account directly. Only you can see your information.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {ITEMS.map(({ icon: Icon, t, d }) => (
          <div key={t} className="glass flex items-start gap-4 rounded-2xl p-5">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></div>
            <div><div className="font-semibold">{t}</div><div className="mt-1 text-sm text-muted-foreground">{d}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}