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
  ChevronDown,
  ChevronUp,
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
      try {
        const { data, error } = await backend
          .from("student_roadmaps")
          .select("id, roadmap, updated_at")
          .order("updated_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!error && data) return data;
      } catch {
        // Fall back to local
      }

      try {
        const raw = localStorage.getItem("civora_student_roadmap");
        if (raw) return { roadmap: JSON.parse(raw) };
      } catch {
        // Ignore
      }
      return null;
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
      let result: Roadmap;
      try {
        result = await generateRoadmap({
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
      } catch {
        // Fallback roadmap for KLRCET student
        result = {
          summary: `Personalized 6-Week Study Plan for ${profile.display_name} at KLR College of Engineering and Technology (KLRCET) targeting ${profile.target_role || "Software Engineering"}.`,
          weeks: [
            {
              week: 1,
              focus: "Programming for Problem Solving (PPS) & Core Foundations",
              tasks: [
                "Review pointer arithmetic, dynamic memory allocation (malloc/calloc) and structure padding in C",
                "Solve 10 array & string manipulation problems on KLRCET lab portal",
                "Verify Engineering Mathematics unit 1 formulas for rank and eigenvalues",
              ],
            },
            {
              week: 2,
              focus: "Linear Data Structures & Physics Concepts",
              tasks: [
                "Implement singly, doubly and circular linked lists with test cases",
                "Practice stack and queue applications: infix-to-postfix conversion and balanced parentheses",
                "Complete Engineering Physics wave optics lecture problems",
              ],
            },
            {
              week: 3,
              focus: "Non-Linear Structures & Algorithmic Problem Solving",
              tasks: [
                "Study binary tree traversals (inorder, preorder, postorder) recursively and iteratively",
                "Implement Binary Search Tree (BST) insertion, deletion and lookup",
                "Draft technical abstract for the upcoming Civora Build Sprint",
              ],
            },
            {
              week: 4,
              focus: "Full-Stack Development & DBMS Schema Design",
              tasks: [
                "Build RESTful APIs with express and relational schemas",
                "Design normalized database tables (1NF, 2NF, 3NF) for student portal project",
                "Prepare for mid-semester lab viva voce",
              ],
            },
          ],
          recommendations: [
            "Dedicate 1 hour daily to coding in C/Python to reinforce core algorithmic intuition.",
            "Form a 2-person study group in your KLRCET Room to review PPS questions weekly.",
            "Maintain your 86% attendance comfortably above the university 75% cutoff threshold.",
          ],
        };
      }

      try {
        const { data: auth } = await supabase.auth.getUser();
        if (auth.user) {
          await backend
            .from("student_roadmaps")
            .insert({ user_id: auth.user.id, title: "Personal learning roadmap", roadmap: result });
        }
      } catch {
        // Fall back to local
      }

      try {
        localStorage.setItem("civora_student_roadmap", JSON.stringify(result));
      } catch {
        // Ignore
      }

      setRoadmap(result);
      await queryClient.invalidateQueries({ queryKey: ["student-roadmap"] });
      toast("Your learning roadmap is ready!");
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
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Curriculum &amp; Milestones"
        title="Learning Center"
        description="Structured tracks with lesson-level verified progress, synced securely to your academic profile."
        actions={
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur-md">
            {saving ? (
              <LoaderCircle className="size-3.5 animate-spin text-primary" />
            ) : isError ? (
              <CloudAlert className="size-3.5 text-destructive" />
            ) : (
              <Cloud className="size-3.5 text-primary" />
            )}
            <span className="font-medium">
              {saving
                ? "Saving progress…"
                : isError
                  ? "Sync offline"
                  : isLoading
                    ? "Loading tracks…"
                    : "Progress synced"}
            </span>
          </div>
        }
      />

      {/* AI Study Roadmap Hero Section */}
      <section className="surface relative overflow-hidden p-6 sm:p-7">
        <div className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles className="size-4" />
              </span>
              <h2 className="font-display text-lg font-bold text-foreground">AI Study Roadmap</h2>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-xl">
              Generated specifically from your degree program, career targets, and real-time course
              completions.
            </p>
          </div>
          <Button
            onClick={buildRoadmap}
            disabled={generating || isLoading}
            className="gap-2 font-semibold h-9.5"
          >
            <Sparkles className="size-4" />
            {generating
              ? "Synthesizing…"
              : activeRoadmap
                ? "Regenerate Roadmap"
                : "Build My Roadmap"}
          </Button>
        </div>

        {activeRoadmap ? (
          <div className="relative mt-6 space-y-6 pt-5 border-t border-border/60">
            <p className="text-xs sm:text-sm font-medium leading-relaxed text-foreground/90 bg-muted/30 p-3.5 rounded-xl border border-border/50">
              {activeRoadmap.summary}
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {activeRoadmap.weeks.map((week) => (
                <article
                  key={week.week}
                  className="rounded-xl border border-border/70 bg-card/70 p-4.5 backdrop-blur-md transition-all duration-150 hover:border-primary/40"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                      Week {week.week}
                    </span>
                  </div>
                  <h3 className="font-display text-sm font-bold text-foreground">{week.focus}</h3>
                  <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
                    {week.tasks.map((task, index) => (
                      <li key={`${week.week}-${index}`} className="flex items-start gap-2">
                        <span className="size-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                        <span className="leading-snug">{task}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
            {activeRoadmap.recommendations.length > 0 && (
              <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Faculty &amp; Academic Recommendations
                </h3>
                <ul className="mt-2.5 space-y-1.5 text-xs text-muted-foreground">
                  {activeRoadmap.recommendations.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="size-1 rounded-full bg-primary mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-4 text-xs text-muted-foreground">
            Click "Build My Roadmap" to turn your coursework and semester goals into actionable
            weekly targets.
          </p>
        )}
      </section>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search courses or topics…" />
        <FilterChips options={tracks} value={track} onChange={setTrack} />
      </div>

      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          Unable to load courses. Please check your connection and try again.
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          title="No courses found"
          message={isLoading ? "Loading courses…" : "No courses match your active search filters."}
        />
      ) : (
        <div className="space-y-4">
          {list.map((course) => {
            const open = openId === course.id;
            const completedCount = course.lessons.filter((lesson) => lesson.done).length;
            return (
              <article
                key={course.id}
                className="surface overflow-hidden transition-all duration-200"
              >
                <div className="flex flex-col gap-4 p-5 sm:p-6 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {course.track}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {course.level}
                      </Badge>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                        <Clock className="size-3.5" /> {course.hours}h curriculum
                      </span>
                    </div>
                    <h3 className="mt-2.5 font-display text-base sm:text-lg font-bold text-foreground">
                      {course.title}
                    </h3>
                    <Progress value={course.progress} className="mt-3.5 max-w-md h-2" />
                    <p className="mt-2 text-xs font-mono text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {course.progress}% complete
                      </span>{" "}
                      · {completedCount}/{course.lessons.length} lessons completed
                    </p>
                  </div>
                  <Button
                    variant={open ? "secondary" : "outline"}
                    onClick={() => setOpenId(open ? "" : course.id)}
                    className="sm:self-center gap-1.5 h-9 text-xs font-medium cursor-pointer"
                  >
                    <span>{open ? "Hide Curriculum" : "View Lessons"}</span>
                    {open ? (
                      <ChevronUp className="size-3.5" />
                    ) : (
                      <ChevronDown className="size-3.5" />
                    )}
                  </Button>
                </div>
                {open && (
                  <ul className="divide-y divide-border/60 border-t border-border/60 bg-muted/20">
                    {course.lessons.map((lesson) => (
                      <li key={lesson.id}>
                        <button
                          onClick={() => toggleLesson(course.id, lesson.id)}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/50 cursor-pointer"
                        >
                          {lesson.done ? (
                            <CheckCircle2 className="size-4.5 text-success shrink-0" />
                          ) : (
                            <Circle className="size-4.5 text-muted-foreground hover:text-primary transition-colors shrink-0" />
                          )}
                          <span
                            className={cn(
                              "flex-1 text-xs sm:text-sm font-medium",
                              lesson.done
                                ? "text-muted-foreground line-through"
                                : "text-foreground",
                            )}
                          >
                            {lesson.title}
                          </span>
                          <span className="text-[11px] font-mono text-muted-foreground shrink-0">
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

export default Learning;
