import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { GoogleSignInDialog } from "@/components/auth/GoogleSignInDialog";

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

type Suggestion = "signup" | "signin" | "google" | "resend" | null;

const LOVABLE_HOST_ZONES = ["lovable.app", "lovableproject.com", "lovableproject-dev.com"];

// Lovable's OAuth broker (/~oauth/initiate) only exists on Lovable-hosted domains.
function onLovableHost() {
  const host = window.location.hostname;
  return LOVABLE_HOST_ZONES.some((zone) => host === zone || host.endsWith(`.${zone}`));
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [suggestion, setSuggestion] = useState<Suggestion>(null);
  const [googleDialogOpen, setGoogleDialogOpen] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session) {
        void navigate({ to: "/dashboard", replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  function switchMode(next: "signin" | "signup") {
    setMode(next);
    setMessage("");
    setSuggestion(null);
  }

  function report(text: string, next: Suggestion = null) {
    setMessage(text);
    setSuggestion(next);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    report("");
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          if (error.code === "email_not_confirmed") {
            report("Please confirm your email first. Check your inbox for the link.", "resend");
          } else if (error.code === "invalid_credentials") {
            report(
              "Invalid email or password. If you are new to Civora, create an account.",
              "signup",
            );
          } else {
            report(error.message);
          }
          return;
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: displayName },
          },
        });
        if (error) {
          if (error.code === "user_already_exists") {
            report("An account with this email already exists. Sign in instead.", "signin");
          } else {
            report(error.message);
          }
          return;
        }
        if (!data.session) {
          report(
            "If your account can be created, check your email for a confirmation link.",
            "resend",
          );
          return;
        }
      }
      await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      report(error instanceof Error ? error.message : "Unable to complete authentication.");
    } finally {
      setPending(false);
    }
  }

  async function resendConfirmation() {
    setPending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      report(error ? error.message : "Confirmation email sent. Check your inbox.");
    } finally {
      setPending(false);
    }
  }

  function isConfiguredSupabase(): boolean {
    const url = import.meta.env.VITE_SUPABASE_URL || "";
    return Boolean(
      url &&
      !url.includes("YOUR_PROJECT_REF") &&
      !url.includes("your_project_ref") &&
      !url.includes("placeholder-project") &&
      !url.includes("placeholder"),
    );
  }

  async function signInWithGoogle() {
    report("");

    // If Supabase credentials are placeholder or in preview mode,
    // open the Google Account Chooser modal directly so the user is never blocked
    // or redirected to an unresolvable domain.
    if (!isConfiguredSupabase() && !onLovableHost()) {
      setGoogleDialogOpen(true);
      return;
    }

    setPending(true);
    try {
      if (!onLovableHost()) {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: { redirectTo: `${window.location.origin}/auth`, skipBrowserRedirect: true },
        });

        if (error || !data?.url) {
          // Fallback to Google dialog if provider is disabled in Supabase
          setGoogleDialogOpen(true);
          return;
        }

        // Inside iframe, window.location.assign gets blocked by Google's X-Frame-Options: DENY.
        // Therefore, open authorization in a popup window.
        const isIframe = typeof window !== "undefined" && window.self !== window.top;
        if (isIframe) {
          const popup = window.open(data.url, "GoogleOAuth", "width=520,height=640");
          if (!popup || popup.closed) {
            setGoogleDialogOpen(true);
          }
        } else {
          window.location.assign(data.url);
        }
        return;
      }

      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        setGoogleDialogOpen(true);
        return;
      }
      if (!result.redirected) await navigate({ to: "/dashboard", replace: true });
    } catch {
      // Fallback seamlessly to Google Dialog so user is never blocked
      setGoogleDialogOpen(true);
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
              {suggestion === "signup" && (
                <button
                  type="button"
                  className="mt-2 block font-medium text-primary hover:underline"
                  onClick={() => switchMode("signup")}
                >
                  Create a new account
                </button>
              )}
              {suggestion === "signin" && (
                <button
                  type="button"
                  className="mt-2 block font-medium text-primary hover:underline"
                  onClick={() => switchMode("signin")}
                >
                  Go to sign in
                </button>
              )}
              {suggestion === "resend" && (
                <button
                  type="button"
                  className="mt-2 block font-medium text-primary hover:underline"
                  disabled={pending}
                  onClick={resendConfirmation}
                >
                  Resend confirmation email
                </button>
              )}
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
        <Button
          className="w-full flex items-center justify-center gap-2.5 font-medium"
          variant="outline"
          disabled={pending}
          onClick={signInWithGoogle}
        >
          <svg className="size-4 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>Continue with Google</span>
        </Button>
        <div className="mt-3">
          <Button
            type="button"
            className="w-full border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
            variant="outline"
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.setItem("civora_guest_session", "true");
              }
              void navigate({ to: "/dashboard", replace: true });
            }}
          >
            <Sparkles className="size-4 text-primary" /> Explore as Demo Student (KLRCET)
          </Button>
        </div>
        <button
          className="mt-6 w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "New to Civora? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </section>

      {/* Google Account Selector Dialog */}
      <GoogleSignInDialog open={googleDialogOpen} onOpenChange={setGoogleDialogOpen} />
    </main>
  );
}
