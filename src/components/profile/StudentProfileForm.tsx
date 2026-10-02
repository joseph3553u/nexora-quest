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
import { Badge } from "@/components/ui/badge";
import { type Profile, saveLocalProfile, checkCivoraIdAvailability } from "@/hooks/use-profile";
import { CheckCircle2, AlertCircle, Loader2, AtSign } from "lucide-react";

type FormValues = {
  display_name: string;
  civora_id: string;
  college: string;
  program: string;
  department: string;
  semester: string;
  target_role: string;
  cgpa: string;
  attendance: string;
  credits: string;
  skills: string;
  answers: { challenge: string; study_hours: string; study_style: string; strengths: string };
};
const empty: FormValues = {
  display_name: "",
  civora_id: "",
  college: "KLR College of Engineering and Technology (KLRCET)",
  program: "",
  department: "",
  semester: "",
  target_role: "",
  cgpa: "",
  attendance: "",
  credits: "",
  skills: "",
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
  const [civoraIdStatus, setCivoraIdStatus] = useState<{
    checking: boolean;
    available?: boolean;
    message?: string;
  }>({ checking: false });

  useEffect(() => {
    if (!profile) return;
    setForm({
      display_name: profile.display_name,
      civora_id: profile.civora_id || "joseph.klrcet",
      college: profile.college || "KLR College of Engineering and Technology (KLRCET)",
      program: profile.program,
      department: profile.department,
      semester: profile.semester,
      target_role: profile.target_role,
      cgpa: profile.cgpa == null ? "" : String(profile.cgpa),
      attendance: profile.attendance == null ? "" : String(profile.attendance),
      credits: profile.credits == null ? "" : String(profile.credits),
      skills: (profile.skills || []).join(", "),
      answers: {
        challenge: profile.onboarding_answers["challenge"] ?? "",
        study_hours: profile.onboarding_answers["study_hours"] ?? "",
        study_style: profile.onboarding_answers["study_style"] ?? "",
        strengths: profile.onboarding_answers["strengths"] ?? "",
      },
    });
  }, [profile]);

  // Live validation for Civora ID
  useEffect(() => {
    const rawId = form.civora_id.trim().toLowerCase();
    if (!rawId) {
      setCivoraIdStatus({ checking: false, available: false, message: "Civora ID is required." });
      return;
    }

    if (profile?.civora_id && rawId === profile.civora_id.toLowerCase()) {
      setCivoraIdStatus({ checking: false, available: true, message: "Your current Civora ID." });
      return;
    }

    setCivoraIdStatus({ checking: true });
    const timer = setTimeout(async () => {
      const res = await checkCivoraIdAvailability(rawId, profile?.id);
      setCivoraIdStatus({ checking: false, available: res.available, message: res.message });
    }, 400);

    return () => clearTimeout(timer);
  }, [form.civora_id, profile?.civora_id, profile?.id]);

  async function save(event: FormEvent) {
    event.preventDefault();
    if (!form.civora_id.trim()) {
      toast.error("Please enter a unique Civora ID.");
      return;
    }

    const check = await checkCivoraIdAvailability(form.civora_id, profile?.id);
    if (
      !check.available &&
      (!profile?.civora_id ||
        form.civora_id.trim().toLowerCase() !== profile.civora_id.toLowerCase())
    ) {
      toast.error(check.message || "This Civora ID is already taken. Please choose another.");
      return;
    }

    setPending(true);
    try {
      const parsedSkills = form.skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const normalizedCivoraId = form.civora_id.trim().toLowerCase();

      const localPayload = {
        display_name: form.display_name.trim(),
        civora_id: normalizedCivoraId,
        college: form.college.trim(),
        program: form.program.trim(),
        department: form.department.trim(),
        semester: form.semester.trim(),
        target_role: form.target_role.trim(),
        cgpa: form.cgpa ? Number(form.cgpa) : null,
        attendance: form.attendance ? Number(form.attendance) : null,
        credits: form.credits ? Number.parseInt(form.credits, 10) : null,
        skills: parsedSkills,
        preferences: {
          ...profile?.preferences,
          college: form.college.trim(),
          skills: parsedSkills,
        },
        onboarding_answers: form.answers,
        onboarding_complete: true,
      };

      saveLocalProfile(localPayload);

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await backend.from("profiles").upsert(
            {
              id: user.id,
              display_name: form.display_name.trim(),
              civora_id: normalizedCivoraId,
              program: form.program.trim(),
              department: form.department.trim(),
              semester: form.semester.trim(),
              target_role: form.target_role.trim(),
              cgpa: form.cgpa ? Number(form.cgpa) : null,
              attendance: form.attendance ? Number(form.attendance) : null,
              credits: form.credits ? Number.parseInt(form.credits, 10) : null,
              preferences: {
                ...profile?.preferences,
                college: form.college.trim(),
                skills: parsedSkills,
              },
              onboarding_answers: form.answers,
              onboarding_complete: onboarding || profile?.onboarding_complete || true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          );
        }
      } catch {
        // Fall back seamlessly to local state
      }

      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success(
        onboarding ? "Your profile is ready" : "Profile and Civora ID updated successfully",
      );
      if (onboarding) await navigate({ to: "/dashboard", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save your profile");
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="civora_id" className="flex items-center gap-1.5 font-medium">
              <span>Civora ID (Unique Handle)</span>
            </Label>
            {civoraIdStatus.checking ? (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="size-3 animate-spin text-primary" /> Checking...
              </span>
            ) : civoraIdStatus.available ? (
              <Badge
                variant="outline"
                className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] py-0 gap-1"
              >
                <CheckCircle2 className="size-3" /> Available
              </Badge>
            ) : form.civora_id ? (
              <Badge
                variant="outline"
                className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] py-0 gap-1"
              >
                <AlertCircle className="size-3" /> {civoraIdStatus.message || "Invalid or Taken"}
              </Badge>
            ) : null}
          </div>
          <div className="relative">
            <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              id="civora_id"
              value={form.civora_id}
              onChange={(e) =>
                setForm((v) => ({
                  ...v,
                  civora_id: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ""),
                }))
              }
              placeholder="e.g. joseph.klrcet"
              required
              className="pl-9 font-mono text-sm"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Other students can search, connect, and collaborate with you using this exact handle.
          </p>
        </div>

        {field(
          "college",
          "College / Institute",
          "e.g. KLR College of Engineering and Technology (KLRCET)",
          true,
        )}
        {field("program", "Degree / Program", "e.g. B.Tech Computer Science & Engineering", true)}
        {field("department", "Department", "e.g. Computer Science & Engineering", true)}
        {field("semester", "Current Semester / Year", "e.g. Semester 5 (3rd Year)", true)}
        {field("target_role", "Goal or Target Role", "e.g. Full-Stack Engineer, GATE 2027", true)}
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="skills">Skills &amp; Technologies (comma separated)</Label>
          <Input
            id="skills"
            value={form.skills}
            onChange={(e) => setForm((v) => ({ ...v, skills: e.target.value }))}
            placeholder="e.g. Programming for Problem Solving (PPS), Data Structures, Python, Web Development"
          />
        </div>
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
            Your answers are private and help personalize your roadmap and AI assistance.
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
              placeholder="e.g. hands-on practice, video tutorials, notes"
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
              placeholder="e.g. PPS, Engineering Mathematics, Web Design"
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
              placeholder="A topic, exam, lab practice, or upcoming target"
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
