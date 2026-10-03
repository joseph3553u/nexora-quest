import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, LoaderCircle, Sparkles, Terminal, ShieldCheck, Mail } from "lucide-react";
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
            data: { display_name: displayName || "Alex" },
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
          setGoogleDialogOpen(true);
          return;
        }

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
      setGoogleDialogOpen(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-canvas flex min-h-screen items-center justify-center px-4 py-12 antialiased">
      <div className="relative w-full max-w-md">
        {/* Futuristic glowing backdrop halo */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/30 via-cyan-400/20 to-primary/30 opacity-70 blur-xl pointer-events-none" />

        <section className="surface relative w-full rounded-3xl border border-primary/30 p-7 shadow-lift sm:p-9 backdrop-blur-2xl">
          {/* Top HUD header */}
          <div className="mb-6 flex items-center justify-between border-b border-border/60 pb-5">
            <div className="flex items-center gap-3">
              <div className="status-glow flex size-11 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-cyan-400 text-primary-foreground shadow-sm">
                <Sparkles className="size-5.5" />
              </div>
              <div>
                <h1 className="font-display text-xl font-bold tracking-tight text-foreground">
                  Civora
                </h1>
                <p className="text-xs text-muted-foreground">Student Operating System</p>
              </div>
            </div>
          </div>

          <h2 className="font-display text-2xl font-bold tracking-tight text-foreground">
            {mode === "signin" ? "Student Access" : "Create Workspace"}
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {mode === "signin"
              ? "Sign in with your email only and password to access courses & records."
              : "Set up your verified student workspace. Enter your email only."}
          </p>

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <label htmlFor="auth-name" className="text-xs font-semibold text-foreground">
                  Full Name
                </label>
                <Input
                  id="auth-name"
                  aria-label="Display name"
                  placeholder="e.g. Alex"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  required
                  className="h-10 text-xs sm:text-sm rounded-xl border-border/80 focus-visible:border-primary/60"
                />
              </div>
            )}

            {/* Changed from college email to email only */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="auth-email"
                  className="text-xs font-semibold text-foreground flex items-center gap-1.5"
                >
                  <Mail className="size-3.5 text-primary" />
                  <span>Email only</span>
                </label>
                <span className="text-[10px] font-mono text-primary font-medium tracking-wide uppercase">
                  Email only
                </span>
              </div>
              <Input
                id="auth-email"
                aria-label="Email only"
                type="email"
                placeholder="Email only (e.g. alex@example.com)"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="h-10 text-xs sm:text-sm rounded-xl border-border/80 focus-visible:border-primary/60 font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Enter your email only to access your private notes and study streak.
              </p>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="auth-password" className="text-xs font-semibold text-foreground">
                Password
              </label>
              <Input
                id="auth-password"
                aria-label="Password"
                type="password"
                placeholder="Password (minimum 6 characters)"
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                className="h-10 text-xs sm:text-sm rounded-xl border-border/80 focus-visible:border-primary/60"
              />
            </div>

            {message && (
              <div
                role="status"
                className="rounded-xl border border-border/80 bg-muted/50 p-3.5 text-xs text-muted-foreground backdrop-blur-md"
              >
                <p className="leading-relaxed">{message}</p>
                {suggestion === "signup" && (
                  <button
                    type="button"
                    className="mt-2 block font-semibold text-primary hover:underline cursor-pointer"
                    onClick={() => switchMode("signup")}
                  >
                    Create a new account →
                  </button>
                )}
                {suggestion === "signin" && (
                  <button
                    type="button"
                    className="mt-2 block font-semibold text-primary hover:underline cursor-pointer"
                    onClick={() => switchMode("signin")}
                  >
                    Return to sign in →
                  </button>
                )}
                {suggestion === "resend" && (
                  <button
                    type="button"
                    className="mt-2 block font-semibold text-primary hover:underline cursor-pointer"
                    disabled={pending}
                    onClick={resendConfirmation}
                  >
                    Resend confirmation email
                  </button>
                )}
              </div>
            )}

            <Button
              className="w-full h-10.5 rounded-xl font-semibold text-sm shadow-soft gap-2 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={pending}
              type="submit"
            >
              {pending ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ArrowRight className="size-4" />
              )}
              {mode === "signin" ? "Sign in to Civora" : "Create student account"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground font-mono">
            <span className="h-px flex-1 bg-border/60" />
            <span>or continue with</span>
            <span className="h-px flex-1 bg-border/60" />
          </div>

          <Button
            className="w-full h-10.5 rounded-xl flex items-center justify-center gap-2.5 font-medium text-xs sm:text-sm border-border/80 bg-card/60 hover:bg-card hover:border-primary/50 transition-all cursor-pointer"
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

          {/* 1-Click Demo Explore as Alex */}
          <div className="mt-3">
            <Button
              type="button"
              className="w-full h-10 rounded-xl border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 text-xs sm:text-sm font-semibold gap-2 transition-all cursor-pointer"
              variant="outline"
              onClick={() => {
                if (typeof window !== "undefined") {
                  localStorage.setItem("civora_guest_session", "true");
                }
                void navigate({ to: "/dashboard", replace: true });
              }}
            >
              <Sparkles className="size-4 text-primary" /> Explore as Demo Student (Alex)
            </Button>
          </div>

          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <button
              className="hover:text-primary transition-colors cursor-pointer"
              onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
            >
              {mode === "signin" ? "New to Civora? Create account" : "Already registered? Sign in"}
            </button>
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>Encrypted</span>
            </div>
          </div>
        </section>
      </div>

      {/* Google Account Selector Dialog */}
      <GoogleSignInDialog open={googleDialogOpen} onOpenChange={setGoogleDialogOpen} />
    </main>
  );
}
