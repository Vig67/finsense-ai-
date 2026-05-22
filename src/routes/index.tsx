import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (loading) return;
    navigate({ to: session ? "/dashboard" : "/auth", replace: true });
  }, [session, loading, navigate]);
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-br from-primary to-accent" />
    </div>
  );
}
