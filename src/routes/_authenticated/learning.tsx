import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  CheckCircle2,
  Circle,
  Cloud,
  CloudAlert,
  Clock,
  LoaderCircle,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { useProfile } from "@/hooks/use-profile";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";
import { generateStudyRoadmap } from "@/lib/ai.functions";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({
    meta: [
      { title: "Learning Center · Civora" },
      {
        name: "description",
        content: "Track course progress, tick off lessons and pick up exactly where you left off.",
      },
      { property: "og:title", content: "Learning Center · Civora" },
      {
        property: "og:description",
        content: "Course tracks, lesson checklists and learning progress.",
      },
    ],
  }),
  component: Learning,
});

const tracks = ["All", "Core CS", "Development", "AI & Data", "Careers"];
type Roadmap = {
  summary: string;
  weeks: { week: number; focus: string; tasks: string[] }[];
  recommendations: string[];
};

function Learning() {
  const { courses, isLoading, isError, saving, saveLesson } = useCourseProgress();
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const generateRoadmap = useServerFn(generateStudyRoadmap);
  const [track, setTrack] = useState("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState("c1");
  const [generating, setGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const { data: savedRoadmap } = useQuery({
    queryKey: ["student-roadmap"],
    queryFn: async () => {
      const { data, error } = await backend
        .from("student_roadmaps")
        .select("id, roadmap, updated_at")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const activeRoadmap = roadmap ?? (savedRoadmap?.roadmap as Roadmap | undefined) ?? null;
  const list = useMemo(
    () =>
      courses.filter(
        (course) =>
          (track === "All" || course.track === track) &&
          course.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [courses, track, query],
  );

  async function buildRoadmap() {
    if (!profile) {
      toast("Complete your student profile before generating a roadmap.");
      return;
    }
    setGenerating(true);
    try {
      const result = await generateRoadmap({
        data: {
          profile: {
            program: profile.program,
            department: profile.department,
            semester: profile.semester,
            targetRole: profile.target_role,
            answers: profile.onboarding_answers,
          },
          progress: courses.map((course) => ({
            title: course.title,
            track: course.track,
            percent: course.progress,
          })),
        },
      });
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Your session expired. Please sign in again.");
      const { error } = await backend
        .from("student_roadmaps")
        .insert({ user_id: auth.user.id, title: "Personal learning roadmap", roadmap: result });
      if (error) throw error;
      setRoadmap(result);
      await queryClient.invalidateQueries({ queryKey: ["student-roadmap"] });
      toast("Your learning roadmap is saved");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to generate your roadmap");
    } finally {
      setGenerating(false);
    }
  }

  function toggleLesson(courseId: string, lessonId: string) {
    const lesson = courses
      .find((course) => course.id === courseId)
      ?.lessons.find((item) => item.id === lessonId);
    if (lesson) saveLesson({ courseId, lessonId, completed: !lesson.done });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Keep moving"
        title="Learning Center"
        description="Structured tracks with lesson-level progress, securely synced to your account."
        actions={
          <span className="flex items-center gap-2 text-xs text-muted-foreground">
            {saving ? (
              <LoaderCircle className="size-4 animate-spin text-primary" />
            ) : isError ? (
              <CloudAlert className="size-4 text-destructive" />
            ) : (
              <Cloud className="size-4 text-primary" />
            )}
            {saving
              ? "Saving…"
              : isError
                ? "Sync unavailable"
                : isLoading
                  ? "Loading progress…"
                  : "Progress saved"}
          </span>
        }
      />

      <section className="surface space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">AI study roadmap</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Personalized from your profile, goals, and saved course progress.
            </p>
          </div>
          <Button onClick={buildRoadmap} disabled={generating || isLoading}>
            <Sparkles className="size-4" />
            {generating ? "Building…" : activeRoadmap ? "Refresh roadmap" : "Build my roadmap"}
          </Button>
        </div>
        {activeRoadmap ? (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed">{activeRoadmap.summary}</p>
            <div className="grid gap-3 md:grid-cols-2">
              {activeRoadmap.weeks.map((week) => (
                <article key={week.week} className="rounded-lg border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    Week {week.week}
                  </p>
                  <h3 className="mt-1 font-medium">{week.focus}</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {week.tasks.map((task, index) => (
                      <li key={`${week.week}-${index}`}>{task}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            {activeRoadmap.recommendations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold">Recommendations</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {activeRoadmap.recommendations.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Generate a plan to turn your goals and current progress into clear weekly next steps.
          </p>
        )}
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search courses" />
        <FilterChips options={tracks} value={track} onChange={setTrack} />
      </div>
      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          Unable to load courses. Apply the Civora backend migration and try again.
        </p>
      ) : list.length === 0 ? (
        <EmptyState message={isLoading ? "Loading courses…" : "No courses in this track yet."} />
      ) : (
        <div className="space-y-4">
          {list.map((course) => {
            const open = openId === course.id;
            return (
              <article key={course.id} className="surface overflow-hidden">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{course.track}</Badge>
                      <Badge variant="outline">{course.level}</Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="size-3.5" /> {course.hours}h
                      </span>
                    </div>
                    <h3 className="mt-2 font-semibold">{course.title}</h3>
                    <Progress value={course.progress} className="mt-3 max-w-md" />
                    <p className="mt-1.5 text-xs text-muted-foreground">
                      {course.progress}% complete ·{" "}
                      {course.lessons.filter((lesson) => lesson.done).length}/
                      {course.lessons.length} lessons
                    </p>
                  </div>
                  <Button
                    variant={open ? "secondary" : "default"}
                    onClick={() => setOpenId(open ? "" : course.id)}
                    className="sm:self-center"
                  >
                    {open ? "Hide lessons" : "View lessons"}
                  </Button>
                </div>
                {open && (
                  <ul className="divide-y divide-border border-t border-border bg-muted/40">
                    {course.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <button
                          onClick={() => toggleLesson(course.id, lesson.id)}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted"
                        >
                          {lesson.done ? (
                            <CheckCircle2 className="size-4.5 text-success" />
                          ) : (
                            <Circle className="size-4.5 text-muted-foreground" />
                          )}
                          <span
                            className={cn(
                              "flex-1 text-sm",
                              lesson.done && "text-muted-foreground line-through",
                            )}
                          >
                            {lesson.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {lesson.minutes} min
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
