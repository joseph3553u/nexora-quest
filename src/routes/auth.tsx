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

type Suggestion = "signup" | "signin" | "google" | "resend" | null;

const LOVABLE_HOST_ZONES = ["lovable.app", "lovableproject.com", "lovableproject-dev.com"];

// Lovable's OAuth broker (/~oauth/initiate) only exists on Lovable-hosted domains.
function onLovableHost() {
  const host = window.location.hostname;
  return LOVABLE_HOST_ZONES.some((zone) => host === zone || host.endsWith(`.${zone}`));
}

async function getAccountStatus(email: string) {
  const { data, error } = await supabase.rpc("auth_account_status", { _email: email });
  if (error) return null;
  return data as "none" | "unconfirmed" | "oauth_only" | "password";
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

  useEffect(() => {
    void supabase.auth.getUser().then(({ data }) => {
      if (data.user) void navigate({ to: "/dashboard", replace: true });
    });
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

  async function explainFailedSignIn() {
    const status = await getAccountStatus(email);
    if (status === "none") {
      report(
        "No account exists for this email yet. Create a new account to get started.",
        "signup",
      );
    } else if (status === "unconfirmed") {
      report(
        "This account hasn't been confirmed yet. Check your inbox for the confirmation link.",
        "resend",
      );
    } else if (status === "oauth_only") {
      report(
        "This account was created with Google. Use “Continue with Google” to sign in.",
        "google",
      );
    } else if (status === "password") {
      report("Incorrect password. Please try again.");
    } else {
      report("Invalid email or password.");
    }
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
            await explainFailedSignIn();
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
        // With email confirmation on, Supabase returns a user with no identities
        // instead of an error when the email is already registered.
        if (data.user && data.user.identities?.length === 0) {
          report("An account with this email already exists. Sign in instead.", "signin");
          return;
        }
        if (!data.session) {
          report("Check your email to confirm your account, then sign in.", "resend");
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

  async function signInWithGoogleViaSupabase() {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth`, skipBrowserRedirect: true },
    });
    if (error) return report(error.message);
    // Check the provider is configured before leaving the page, otherwise the
    // browser lands on a raw JSON error from Supabase.
    try {
      const probe = await fetch(data.url, { redirect: "manual" });
      if (probe.type !== "opaqueredirect" && !probe.ok) {
        report(
          "Google sign-in isn't set up for this site yet. Sign in with email and password instead.",
        );
        return;
      }
    } catch {
      // The probe is best-effort; fall through to the redirect.
    }
    window.location.assign(data.url);
  }

  async function signInWithGoogle() {
    setPending(true);
    report("");
    try {
      if (!onLovableHost()) {
        await signInWithGoogleViaSupabase();
        return;
      }
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        report(result.error.message);
        return;
      }
      if (!result.redirected) await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      report(error instanceof Error ? error.message : "Unable to start Google sign-in.");
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
        <Button className="w-full" variant="outline" disabled={pending} onClick={signInWithGoogle}>
          Continue with Google
        </Button>
        <button
          className="mt-6 w-full text-sm text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
        >
          {mode === "signin"
            ? "New to Civora? Create an account"
            : "Already have an account? Sign in"}
        </button>
      </section>
    </main>
  );
}
