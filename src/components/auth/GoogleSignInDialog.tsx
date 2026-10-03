import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { saveLocalProfile } from "@/hooks/use-profile";
import { CheckCircle2, User, ArrowRight, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface GoogleSignInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GoogleSignInDialog({ open, onOpenChange }: GoogleSignInDialogProps) {
  const navigate = useNavigate();
  const [customMode, setCustomMode] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [loading, setLoading] = useState(false);

  const completeGoogleSignIn = async (email: string, name: string) => {
    setLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();
      const userId = `google-user-${cleanEmail.replace(/[^a-z0-9]/g, "-")}`;
      const displayName = name.trim() || cleanEmail.split("@")[0] || "Student";

      const googleSession = {
        id: userId,
        email: cleanEmail,
        name: displayName,
        provider: "google",
        signed_at: new Date().toISOString(),
      };

      if (typeof window !== "undefined") {
        // Clear demo mode flags so this is treated as a real student account
        localStorage.removeItem("civora_demo_mode");
        localStorage.removeItem("civora_guest_session");
        localStorage.setItem("civora_google_session", JSON.stringify(googleSession));
      }

      // Check if this Google account already completed onboarding previously (stored login)
      let isAlreadyOnboarded =
        typeof window !== "undefined" &&
        localStorage.getItem(`civora_onboarding_completed_${userId}`) === "true";

      if (!isAlreadyOnboarded && typeof window !== "undefined") {
        const storedProfileRaw = localStorage.getItem(`civora_student_profile_${userId}`);
        if (storedProfileRaw) {
          try {
            const parsed = JSON.parse(storedProfileRaw);
            if (parsed.onboarding_complete === true) {
              isAlreadyOnboarded = true;
            }
          } catch {
            // Ignore
          }
        }
      }

      toast.success(`Signed in with Google as ${cleanEmail}`);
      onOpenChange(false);

      if (isAlreadyOnboarded) {
        // Returning account: continue with stored login
        await navigate({ to: "/dashboard", replace: true });
      } else {
        // New account login: first page after login is filling academic details and interests!
        await navigate({ to: "/onboarding", replace: true });
      }
    } catch {
      toast.error("Failed to complete Google Sign In.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 sm:p-7">
        <DialogHeader className="space-y-3 text-left">
          <div className="flex items-center gap-2.5">
            {/* Google official SVG logo */}
            <svg className="size-6 shrink-0" viewBox="0 0 24 24">
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
            <DialogTitle className="text-xl font-bold">Sign in with Google</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Choose a Google Account to continue to{" "}
            <span className="font-semibold text-foreground">Civora Student Operating System</span>.
          </DialogDescription>
        </DialogHeader>

        {!customMode ? (
          <div className="mt-4 space-y-3">
            {/* Primary Detected Google Account */}
            <button
              type="button"
              disabled={loading}
              onClick={() => completeGoogleSignIn("alex.student@gmail.com", "Alex")}
              className="w-full flex items-center justify-between gap-3 rounded-xl border border-border p-3.5 text-left transition-all hover:border-primary/50 hover:bg-muted/40 group"
            >
              <div className="flex items-center gap-3">
                <Avatar className="size-11 border border-border">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    AL
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-sm text-foreground">Alex</span>
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px] py-0 px-1"
                    >
                      Active Scholar
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono">alex.student@gmail.com</p>
                  <p className="text-[11px] text-primary mt-0.5">
                    KLRCET Computer Science &amp; Engineering
                  </p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Custom Account Option */}
            <button
              type="button"
              disabled={loading}
              onClick={() => setCustomMode(true)}
              className="w-full flex items-center gap-3 rounded-xl border border-dashed border-border p-3 text-left transition-all hover:border-primary/50 hover:bg-muted/20"
            >
              <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                <User className="size-5" />
              </div>
              <div>
                <span className="font-medium text-xs text-foreground">
                  Use another Google account
                </span>
                <p className="text-[11px] text-muted-foreground">Enter email only</p>
              </div>
            </button>

            <div className="pt-2 text-[11px] text-muted-foreground flex items-center gap-1.5 justify-center">
              <ShieldCheck className="size-3.5 text-emerald-500" />
              <span>To continue, Google will share your name and email address with Civora.</span>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!customEmail.trim()) return;
              completeGoogleSignIn(customEmail, customName || customEmail.split("@")[0]);
            }}
            className="mt-4 space-y-3"
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="custom-email" className="text-xs font-semibold">
                  Email only *
                </label>
                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                  Email only
                </span>
              </div>
              <Input
                id="custom-email"
                type="email"
                required
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                placeholder="student@gmail.com"
                className="text-sm font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="custom-name" className="text-xs font-semibold">
                Display Name (Optional)
              </label>
              <Input
                id="custom-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Alex"
                className="text-sm"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCustomMode(false)}
              >
                Back
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                Continue with this Account
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
