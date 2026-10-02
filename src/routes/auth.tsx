import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in · Civora" },
      { name: "description", content: "Sign in to securely sync your Civora learning progress." },
      { property: "og:title", content: "Sign in · Civora" },
      {
        property: "og:description",
        content: "Sign in to securely sync your Civora learning progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    try {
      const result =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: window.location.origin,
                data: { display_name: displayName },
              },
            });
      if (result.error) {
        setMessage(result.error.message);
        return;
      }
      if (mode === "signup" && !result.data.session) {
        setMessage("Check your email to confirm your account, then sign in.");
        return;
      }
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to complete authentication.");
    } finally {
      setPending(false);
    }
  }

  async function signInWithGoogle() {
    setPending(true);
    setMessage("");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setMessage(result.error.message);
        return;
      }
      if (!result.redirected) await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to start Google sign-in.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-canvas flex min-h-screen items-center justify-center px-4 py-10">
      <section className="glass-panel w-full max-w-md rounded-lg border border-border p-6 shadow-lift sm:p-8">
        <div className="mb-8 flex items-center gap-3">
          <span className="status-glow flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">Civora</h1>
            <p className="text-xs text-muted-foreground">Student Operating System</p>
          </div>
        </div>
        <h2 className="text-2xl font-semibold">
          {mode === "signin" ? "Welcome back" : "Create your workspace"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your learning progress stays private and follows you across devices.
        </p>
        <form className="mt-7 space-y-4" onSubmit={submit}>
          {mode === "signup" && (
            <Input
              aria-label="Display name"
              placeholder="Display name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              required
            />
          )}
          <Input
            aria-label="Email"
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <Input
            aria-label="Password"
            type="password"
            placeholder="Password"
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {message && (
            <p
              role="status"
              className="rounded-md border border-border bg-muted/60 p-3 text-sm text-muted-foreground"
            >
              {message}
            </p>
          )}
          <Button className="w-full" disabled={pending} type="submit">
            {pending ? <LoaderCircle className="animate-spin" /> : <ArrowRight />}
            {mode === "signin" ? "Sign in" : "Create account"}
          </Button>
        </form>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          or
          <span className="h-px flex-1 bg-border" />
        </div>
        <Button className="w-full" variant="outline" disabled={pending} onClick={signInWithGoogle}>
          Continue with Google
        </Button>
        <button
          className="mt-6 w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setMessage("");
          }}
        >
          {mode === "signin"
            ? "New to Civora? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
