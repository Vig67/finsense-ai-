import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Sparkles, ShieldCheck, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/auth")({ component: AuthPage });

function AuthPage() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && session) navigate({ to: "/dashboard", replace: true });
  }, [session, loading, navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-primary/20 blur-[120px]" />
        <div className="absolute -right-32 bottom-20 h-96 w-96 rounded-full bg-accent/20 blur-[120px]" />
      </div>
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 gap-12 px-6 py-12 lg:grid-cols-2 lg:items-center">
        <div className="hidden flex-col gap-8 lg:flex">
          <Link to="/" className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-[var(--shadow-glow)]">
              <Sparkles className="h-6 w-6 text-background" />
            </div>
            <span className="text-xl font-semibold tracking-tight">FinSense AI</span>
          </Link>
          <div>
            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Your <span className="gradient-text">AI financial</span> wellness assistant.
            </h1>
            <p className="mt-5 max-w-md text-lg text-muted-foreground">
              Securely upload your bank statements and let AI build personalised budgets, savings goals and spending insights — in South African Rand.
            </p>
          </div>
          <div className="grid gap-4">
            {[
              { icon: ShieldCheck, t: "Bank-grade encryption", d: "Your statements are encrypted end-to-end." },
              { icon: TrendingUp, t: "Smart spending insights", d: "Automatic categorisation and recommendations." },
              { icon: Sparkles, t: "AI financial coach", d: "Get personalised advice on tap." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="glass flex items-start gap-3 rounded-2xl p-4">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="font-medium">{t}</div>
                  <div className="text-sm text-muted-foreground">{d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass mx-auto w-full max-w-md rounded-3xl p-8 shadow-[var(--shadow-card)]">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent">
              <Sparkles className="h-5 w-5 text-background" />
            </div>
            <span className="text-lg font-semibold">FinSense AI</span>
          </div>
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2 bg-secondary/50">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="signup">Sign up</TabsTrigger>
            </TabsList>
            <TabsContent value="login" className="mt-6">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup" className="mt-6">
              <SignupForm />
            </TabsContent>
          </Tabs>

          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />
            OR CONTINUE WITH
            <div className="h-px flex-1 bg-border" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              const res = await lovable.auth.signInWithOAuth("google", {
                redirect_uri: window.location.origin,
              });
              if (res.error) toast.error("Google sign-in failed");
            }}
          >
            <GoogleIcon className="mr-2 h-4 w-4" /> Continue with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        setBusy(false);
        if (error) toast.error(error.message);
        else toast.success("Welcome back");
      }}
    >
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
      </div>
      <div className="space-y-2">
        <Label>Password</Label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-primary to-accent text-background hover:opacity-90">
        {busy ? "Signing in…" : "Sign in securely"}
      </Button>
      <button
        type="button"
        className="block w-full text-center text-xs text-muted-foreground hover:text-primary"
        onClick={async () => {
          if (!email) return toast.error("Enter your email first");
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth`,
          });
          if (error) toast.error(error.message);
          else toast.success("Reset link sent");
        }}
      >
        Forgot your password?
      </button>
    </form>
  );
}

function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (password !== confirm) return toast.error("Passwords don't match");
        if (password.length < 8) return toast.error("Password must be 8+ characters");
        setBusy(true);
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        setBusy(false);
        if (error) toast.error(error.message);
        else toast.success("Account created");
      }}
    >
      <div className="space-y-2">
        <Label>Full name</Label>
        <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Thandi Khumalo" />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Password</Label>
          <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ chars" />
        </div>
        <div className="space-y-2">
          <Label>Confirm</Label>
          <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat" />
        </div>
      </div>
      <Button type="submit" disabled={busy} className="w-full bg-gradient-to-r from-primary to-accent text-background hover:opacity-90">
        {busy ? "Creating account…" : "Create my account"}
      </Button>
    </form>
  );
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.6 32.4 29.2 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.2 29.1 4.5 24 4.5 13.2 4.5 4.5 13.2 4.5 24S13.2 43.5 24 43.5c10.8 0 19.5-8.7 19.5-19.5 0-1.2-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.8 6.2 29.1 4.5 24 4.5 16.3 4.5 9.6 8.9 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 43.5c5 0 9.6-1.7 13.2-4.6l-6.1-5.2c-2 1.5-4.5 2.3-7.1 2.3-5.2 0-9.6-3.1-11.3-7.5l-6.5 5C9.5 39 16.2 43.5 24 43.5z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.9 2.5-2.6 4.6-4.7 6l6.1 5.2C40.7 36.7 43.5 30.9 43.5 24c0-1.2-.1-2.3-.4-3.5z" />
    </svg>
  );
}