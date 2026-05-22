export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function KpiCard({ label, value, hint, icon: Icon, accent = "primary" }: {
  label: string; value: string; hint?: string; icon?: React.ComponentType<{ className?: string }>; accent?: "primary" | "accent" | "success" | "warning" | "destructive";
}) {
  const colors: Record<string, string> = {
    primary: "from-primary/30 to-primary/0 text-primary",
    accent: "from-accent/30 to-accent/0 text-accent",
    success: "from-[color:var(--success)]/30 to-transparent text-[color:var(--success)]",
    warning: "from-[color:var(--warning)]/30 to-transparent text-[color:var(--warning)]",
    destructive: "from-destructive/30 to-transparent text-destructive",
  };
  return (
    <div className="glass relative overflow-hidden rounded-2xl p-5">
      <div className={`absolute inset-x-0 -top-10 h-32 bg-gradient-to-b ${colors[accent]} opacity-50 blur-3xl`} />
      <div className="relative flex items-start justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          <div className="mt-2 text-3xl font-semibold tracking-tight">{value}</div>
          {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
        </div>
        {Icon && (
          <div className={`grid h-10 w-10 place-items-center rounded-xl bg-secondary/60 ${colors[accent].split(" ").pop()}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}