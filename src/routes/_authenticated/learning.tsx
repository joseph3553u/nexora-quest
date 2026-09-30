import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Cloud, CloudAlert, Clock, LoaderCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({
    meta: [
      { title: "Learning Center · Nexora" },
      {
        name: "description",
        content: "Track course progress, tick off lessons and pick up exactly where you left off.",
      },
      { property: "og:title", content: "Learning Center · Nexora" },
      {
        property: "og:description",
        content: "Course tracks, lesson checklists and learning progress.",
      },
    ],
  }),
  component: Learning,
});

const tracks = ["All", "Core CS", "Development", "AI & Data", "Careers"];

function Learning() {
  const { courses, isLoading, isError, saving, saveLesson } = useCourseProgress();
  const [track, setTrack] = useState("All");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState("c1");

  const list = useMemo(
    () =>
      courses.filter(
        (c) =>
          (track === "All" || c.track === track) &&
          c.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [courses, track, query],
  );

  function toggleLesson(courseId: string, lessonId: string) {
    const lesson = courses
      .find((course) => course.id === courseId)
      ?.lessons.find((item) => item.id === lessonId);
    if (!lesson) return;
    saveLesson({ courseId, lessonId, completed: !lesson.done });
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
            {saving ? "Saving…" : isError ? "Sync unavailable" : isLoading ? "Loading progress…" : "Progress saved"}
          </span>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search courses" />
        <FilterChips options={tracks} value={track} onChange={setTrack} />
      </div>

      {list.length === 0 ? (
        <EmptyState message="No courses in this track yet." />
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
                      {course.lessons.filter((l) => l.done).length}/{course.lessons.length} lessons
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
                    {course.lessons.map((l) => (
                      <li key={l.id}>
                        <button
                          onClick={() => toggleLesson(course.id, l.id)}
                          className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted"
                        >
                          {l.done ? (
                            <CheckCircle2 className="size-4.5 text-success" />
                          ) : (
                            <Circle className="size-4.5 text-muted-foreground" />
                          )}
                          <span
                            className={cn(
                              "flex-1 text-sm",
                              l.done && "text-muted-foreground line-through",
                            )}
                          >
                            {l.title}
                          </span>
                          <span className="text-xs text-muted-foreground">{l.minutes} min</span>
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
