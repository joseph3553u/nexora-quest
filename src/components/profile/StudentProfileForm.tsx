import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Profile } from "@/hooks/use-profile";

type FormValues = {
  display_name: string;
  program: string;
  department: string;
  semester: string;
  target_role: string;
  cgpa: string;
  attendance: string;
  credits: string;
  answers: { challenge: string; study_hours: string; study_style: string; strengths: string };
};
const empty: FormValues = {
  display_name: "",
  program: "",
  department: "",
  semester: "",
  target_role: "",
  cgpa: "",
  attendance: "",
  credits: "",
  answers: { challenge: "", study_hours: "", study_style: "", strengths: "" },
};

export function StudentProfileForm({
  profile,
  onboarding = false,
}: {
  profile: Profile | null;
  onboarding?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<FormValues>(empty);
  const [pending, setPending] = useState(false);
  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name,
      program: profile.program,
      department: profile.department,
      semester: profile.semester,
      target_role: profile.target_role,
      cgpa: profile.cgpa == null ? "" : String(profile.cgpa),
      attendance: profile.attendance == null ? "" : String(profile.attendance),
      credits: profile.credits == null ? "" : String(profile.credits),
      answers: {
        challenge: profile.onboarding_answers["challenge"] ?? "",
        study_hours: profile.onboarding_answers["study_hours"] ?? "",
        study_style: profile.onboarding_answers["study_style"] ?? "",
        strengths: profile.onboarding_answers["strengths"] ?? "",
      },
    });
  }, [profile]);

  async function save(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Your session expired. Please sign in again.");
      const { error } = await backend.from("profiles").upsert(
        {
          id: user.id,
          display_name: form.display_name.trim(),
          program: form.program.trim(),
          department: form.department.trim(),
          semester: form.semester.trim(),
          target_role: form.target_role.trim(),
          cgpa: form.cgpa ? Number(form.cgpa) : null,
          attendance: form.attendance ? Number(form.attendance) : null,
          credits: form.credits ? Number.parseInt(form.credits, 10) : null,
          onboarding_answers: form.answers,
          onboarding_complete: onboarding || profile?.onboarding_complete || false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast(onboarding ? "Your profile is ready" : "Profile updated");
      if (onboarding) await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to save your profile");
    } finally {
      setPending(false);
    }
  }

  function field(
    key: keyof Omit<FormValues, "answers">,
    label: string,
    placeholder: string,
    required = false,
  ) {
    return (
      <div className="space-y-2" key={key}>
        <Label htmlFor={key}>{label}</Label>
        <Input
          id={key}
          value={form[key]}
          onChange={(event) => setForm((old) => ({ ...old, [key]: event.target.value }))}
          placeholder={placeholder}
          required={required}
        />
      </div>
    );
  }
  return (
    <form onSubmit={save} className="space-y-6">
      <section className="surface grid gap-4 p-5 sm:grid-cols-2">
        {field("display_name", "Display name", "How classmates see you", true)}
        {field("program", "Program", "e.g. B.Tech", true)}
        {field("department", "Department", "e.g. Computer Science", true)}
        {field("semester", "Current semester", "e.g. Semester 4", true)}
        {field("target_role", "Goal or target role", "e.g. Data analyst, GATE 2027", true)}
      </section>
      {!onboarding && (
        <section className="surface grid gap-4 p-5 sm:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="cgpa">CGPA (optional)</Label>
            <Input
              id="cgpa"
              type="number"
              min="0"
              max="10"
              step="0.01"
              value={form.cgpa}
              onChange={(e) => setForm((v) => ({ ...v, cgpa: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="attendance">Attendance % (optional)</Label>
            <Input
              id="attendance"
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={form.attendance}
              onChange={(e) => setForm((v) => ({ ...v, attendance: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="credits">Credits earned (optional)</Label>
            <Input
              id="credits"
              type="number"
              min="0"
              step="1"
              value={form.credits}
              onChange={(e) => setForm((v) => ({ ...v, credits: e.target.value }))}
            />
          </div>
        </section>
      )}
      <section className="surface space-y-4 p-5">
        <div>
          <h2 className="font-semibold">A little about how you learn</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your answers are private and help personalize your roadmap.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="study_hours">Study time per week</Label>
            <Input
              id="study_hours"
              value={form.answers.study_hours}
              onChange={(e) =>
                setForm((v) => ({ ...v, answers: { ...v.answers, study_hours: e.target.value } }))
              }
              placeholder="e.g. 8–10 hours"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="study_style">Preferred learning style</Label>
            <Input
              id="study_style"
              value={form.answers.study_style}
              onChange={(e) =>
                setForm((v) => ({ ...v, answers: { ...v.answers, study_style: e.target.value } }))
              }
              placeholder="e.g. examples, videos, practice"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="strengths">Subjects or skills you enjoy</Label>
            <Input
              id="strengths"
              value={form.answers.strengths}
              onChange={(e) =>
                setForm((v) => ({ ...v, answers: { ...v.answers, strengths: e.target.value } }))
              }
              placeholder="What feels natural to you?"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="challenge">What would you most like to improve?</Label>
            <Textarea
              id="challenge"
              rows={2}
              value={form.answers.challenge}
              onChange={(e) =>
                setForm((v) => ({ ...v, answers: { ...v.answers, challenge: e.target.value } }))
              }
              placeholder="A topic, habit or upcoming goal"
            />
          </div>
        </div>
      </section>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : onboarding ? "Save and continue" : "Save profile"}
      </Button>
    </form>
  );
}
