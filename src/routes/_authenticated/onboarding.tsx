import { createFileRoute } from "@tanstack/react-router";
import { StudentProfileForm } from "@/components/profile/StudentProfileForm";
import { useProfile } from "@/hooks/use-profile";
import { GraduationCap, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your student profile · Civora" }] }),
  component: Onboarding,
});

function Onboarding() {
  const { data: profile, isLoading } = useProfile();

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-in fade-in duration-300 py-3">
      {/* Onboarding Welcome Header Card */}
      <div className="surface p-6 sm:p-7 rounded-3xl border-2 border-primary/30 bg-primary/5 shadow-soft space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/20 text-primary shrink-0">
            <GraduationCap className="size-6" />
          </span>
          <div>
            <span className="text-[11px] font-mono text-primary font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="size-3.5" /> First-Time Student Setup
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-bold text-foreground">
              Welcome to Civora! Tell us about your academic journey
            </h1>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-2xl">
          Please fill in your academic institution, degree program, and verified skills below.
          Civora uses these details to personalize your courses, peer matching, timetable reminders,
          and study roadmaps. Once submitted, your profile is saved and you can continue directly to
          your workspace.
        </p>
      </div>

      {isLoading ? (
        <div className="surface p-8 text-center text-xs text-muted-foreground rounded-3xl border">
          Loading workspace setup…
        </div>
      ) : (
        <StudentProfileForm profile={profile ?? null} onboarding />
      )}
    </div>
  );
}
