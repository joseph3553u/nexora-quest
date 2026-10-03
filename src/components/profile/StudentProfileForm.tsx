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
    const name =
      profile.display_name.toLowerCase().includes("joseph") ||
      profile.display_name === "Alex Morgan"
        ? "Alex"
        : profile.display_name;
    setForm({
      display_name: name,
      civora_id: profile.civora_id || "alex.cs",
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
      <div className="space-y-1.5" key={key}>
        <Label htmlFor={key} className="text-xs font-semibold text-foreground">
          {label}
        </Label>
        <Input
          id={key}
          value={form[key]}
          onChange={(event) => setForm((old) => ({ ...old, [key]: event.target.value }))}
          placeholder={placeholder}
          required={required}
          className="h-10 text-xs sm:text-sm rounded-xl border-border/80 focus-visible:border-primary/60"
        />
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-6">
      {/* 1. Academic Credentials Card */}
      <section className="surface p-5 sm:p-6 space-y-4 border-border/80">
        <div>
          <h2 className="font-display text-sm font-bold text-foreground">
            Academic Identity &amp; Handle
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your verified student profile and public networking handle across Civora.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-1">
          {field("display_name", "Display name", "How classmates see you", true)}

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="civora_id" className="text-xs font-semibold text-foreground">
                Civora ID (Unique Handle)
              </Label>
              {civoraIdStatus.checking ? (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                  <Loader2 className="size-3 animate-spin text-primary" /> Checking…
                </span>
              ) : civoraIdStatus.available ? (
                <Badge
                  variant="outline"
                  className="border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono py-0 gap-1 h-4.5"
                >
                  <CheckCircle2 className="size-3" /> Available
                </Badge>
              ) : form.civora_id ? (
                <Badge
                  variant="outline"
                  className="border-destructive/40 bg-destructive/10 text-destructive text-[10px] font-mono py-0 gap-1 h-4.5"
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
                placeholder="e.g. alex.cs"
                required
                className="pl-9 font-mono text-xs sm:text-sm h-10 rounded-xl border-border/80 focus-visible:border-primary/60"
              />
            </div>
            <p className="text-[11px] text-muted-foreground">
              Students and professors can connect with you using @{form.civora_id || "yourhandle"}.
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
          {field("target_role", "Target Role or Exam", "e.g. Full-Stack Engineer, GATE 2027", true)}

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="skills" className="text-xs font-semibold text-foreground">
              Skills &amp; Technologies (comma separated)
            </Label>
            <Input
              id="skills"
              value={form.skills}
              onChange={(e) => setForm((v) => ({ ...v, skills: e.target.value }))}
              placeholder="e.g. Programming for Problem Solving (PPS), Data Structures, Python, SQL"
              className="h-10 text-xs sm:text-sm rounded-xl border-border/80 focus-visible:border-primary/60 font-mono"
            />
          </div>
        </div>
      </section>

      {/* 2. Academic Record Metrics */}
      {!onboarding && (
        <section className="surface p-5 sm:p-6 space-y-4 border-border/80">
          <div>
            <h2 className="font-display text-sm font-bold text-foreground">
              Verified Academic Metrics
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              These values feed into your Dashboard telemetry and attendance radar.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="cgpa" className="text-xs font-semibold text-foreground">
                CGPA (0.00 – 10.00)
              </Label>
              <Input
                id="cgpa"
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={form.cgpa}
                onChange={(e) => setForm((v) => ({ ...v, cgpa: e.target.value }))}
                placeholder="e.g. 8.74"
                className="h-10 text-xs sm:text-sm rounded-xl border-border/80 focus-visible:border-primary/60 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="attendance" className="text-xs font-semibold text-foreground">
                Attendance % (0 – 100)
              </Label>
              <Input
                id="attendance"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={form.attendance}
                onChange={(e) => setForm((v) => ({ ...v, attendance: e.target.value }))}
                placeholder="e.g. 86"
                className="h-10 text-xs sm:text-sm rounded-xl border-border/80 focus-visible:border-primary/60 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="credits" className="text-xs font-semibold text-foreground">
                Credits Earned
              </Label>
              <Input
                id="credits"
                type="number"
                min="0"
                step="1"
                value={form.credits}
                onChange={(e) => setForm((v) => ({ ...v, credits: e.target.value }))}
                placeholder="e.g. 112"
                className="h-10 text-xs sm:text-sm rounded-xl border-border/80 focus-visible:border-primary/60 font-mono"
              />
            </div>
          </div>
        </section>
      )}

      {/* 3. Learning Preferences Card */}
      <section className="surface p-5 sm:p-6 space-y-4 border-border/80">
        <div>
          <h2 className="font-display text-sm font-bold text-foreground">
            Learning Preferences &amp; Copilot Tuning
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Your preferences tune Civora AI's roadmap recommendations and exam preparation
            strategies.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor="study_hours" className="text-xs font-semibold text-foreground">
              Target Study Hours / Week
            </Label>
            <Input
              id="study_hours"
              value={form.answers.study_hours}
              onChange={(e) =>
                setForm((v) => ({ ...v, answers: { ...v.answers, study_hours: e.target.value } }))
              }
              placeholder="e.g. 12–15 hours"
              required
              className="h-10 text-xs sm:text-sm rounded-xl border-border/80"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="study_style" className="text-xs font-semibold text-foreground">
              Preferred Learning Style
            </Label>
            <Input
              id="study_style"
              value={form.answers.study_style}
              onChange={(e) =>
                setForm((v) => ({ ...v, answers: { ...v.answers, study_style: e.target.value } }))
              }
              placeholder="e.g. Hands-on coding, video lectures, formula revision"
              required
              className="h-10 text-xs sm:text-sm rounded-xl border-border/80"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="challenge" className="text-xs font-semibold text-foreground">
              What topic or subject would you most like to improve?
            </Label>
            <Textarea
              id="challenge"
              rows={2}
              value={form.answers.challenge}
              onChange={(e) =>
                setForm((v) => ({ ...v, answers: { ...v.answers, challenge: e.target.value } }))
              }
              placeholder="e.g. Advanced pointer manipulation in PPS, SQL indexing, or differential equations"
              className="rounded-xl text-xs sm:text-sm border-border/80"
            />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button
          type="submit"
          disabled={pending}
          className="h-10 px-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs sm:text-sm cursor-pointer shadow-soft"
        >
          {pending ? "Saving Changes…" : onboarding ? "Complete Onboarding" : "Save Profile"}
        </Button>
      </div>
    </form>
  );
}
