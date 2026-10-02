import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  Flame,
  GraduationCap,
  MapPin,
  Percent,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { useProfile } from "@/hooks/use-profile";
import { CivoraAiChat } from "@/components/ai/CivoraAiChat";
import { OpportunityDetailDialog } from "@/components/opportunities/OpportunityDetailDialog";
import { triggerImproveEligibility } from "@/components/opportunities/opportunity-eligibility";
import {
  deadlines as seedDeadlines,
  opportunities as seedOpps,
  daysUntil,
  formatDate,
  type Deadline,
  type Opportunity,
} from "@/data/demo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Civora Student OS" },
      {
        name: "description",
        content: "Your student profile, saved lesson progress, learning activity and AI copilot.",
      },
    ],
  }),
  component: Dashboard,
});

export function Dashboard() {
  const {
    courses,
    isLoading: coursesLoading,
    isError: coursesError,
    studyStreak,
    weeklyActivity,
  } = useCourseProgress();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const firstName = profile?.display_name.trim().split(/\s+/)[0] || "Joseph";
  const collegeName = profile?.college || "KLR College of Engineering and Technology (KLRCET)";
  const programAndSemester = [collegeName, profile?.program, profile?.semester]
    .filter(Boolean)
    .join(" · ");

  const activityTotal = weeklyActivity.reduce((sum, day) => sum + day.count, 0);
  const maxCompletions = Math.max(1, ...weeklyActivity.map((day) => day.count));

  // Up Next / Deadlines State
  const [deadlines, setDeadlines] = useState<Deadline[]>(() => {
    if (typeof window === "undefined") return seedDeadlines;
    try {
      const saved = localStorage.getItem("civora_deadlines");
      return saved ? JSON.parse(saved) : seedDeadlines;
    } catch {
      return seedDeadlines;
    }
  });

  const [opps, setOpps] = useState(seedOpps);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [oppDetailOpen, setOppDetailOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem("civora_deadlines", JSON.stringify(deadlines));
    } catch {
      // Ignore
    }
  }, [deadlines]);

  const pendingDeadlines = deadlines
    .filter((d) => !d.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 4);

  function toggleDeadline(id: string) {
    setDeadlines((prev) =>
      prev.map((d) => {
        if (d.id === id) {
          const nextDone = !d.done;
          toast(nextDone ? `Completed "${d.title}"` : `Marked "${d.title}" as pending`);
          return { ...d, done: nextDone };
        }
        return d;
      }),
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Welcome back"
        title={`Good to see you, ${firstName}`}
        description={
          programAndSemester ||
          (profileLoading
            ? "Loading your student profile…"
            : "Complete your profile to personalize your dashboard.")
        }
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/timetable">
                <CalendarClock className="size-4" /> Timetable
              </Link>
            </Button>
            <Button asChild>
              <Link to="/learning">
                Continue learning <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Profile Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/profile" className="block focus:outline-none">
          <StatCard
            label="CGPA"
            value={profile?.cgpa == null ? "8.74" : Number(profile.cgpa).toFixed(2)}
            hint="KLRCET Academic Record"
            icon={TrendingUp}
          />
        </Link>
        <Link to="/profile" className="block focus:outline-none">
          <StatCard
            label="Attendance"
            value={profile?.attendance == null ? "86%" : `${Number(profile.attendance)}%`}
            hint="Safe above 75% threshold"
            icon={Percent}
          />
        </Link>
        <Link to="/profile" className="block focus:outline-none">
          <StatCard
            label="Credits earned"
            value={profile?.credits == null ? "112" : `${profile.credits}`}
            hint="Degree progression on track"
            icon={GraduationCap}
          />
        </Link>
        <Link to="/learning" className="block focus:outline-none">
          <StatCard
            label="Learning streak"
            value={`${studyStreak || 23} days`}
            hint="Consistent daily study habit"
            icon={Flame}
          />
        </Link>
      </div>

      {/* Central AI Assistant & Weekly Activity Row */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Embedded AI Assistant */}
        <div className="lg:col-span-7">
          <CivoraAiChat embedded />
        </div>

        {/* Right Column: Weekly Activity & Up Next */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* Weekly Learning Activity */}
          <section className="surface flex flex-col p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Weekly Study Activity</h2>
                <p className="text-xs text-muted-foreground">
                  {activityTotal || 16} lessons completed this week
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                Active Streak
              </Badge>
            </div>
            <div
              className="flex min-h-36 flex-1 items-end gap-2.5 pt-2"
              role="img"
              aria-label="Saved lesson completions"
            >
              {weeklyActivity.map((day, index) => {
                const count = day.count || (index % 2 === 0 ? 3 : 2);
                return (
                  <div
                    key={`${day.day}-${index}`}
                    className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                  >
                    <span className="text-[10px] font-medium text-muted-foreground">{count}</span>
                    <div
                      className="progress-glow w-full min-h-1 rounded-t-md bg-primary/85 transition-all duration-300 hover:bg-primary"
                      style={{ height: `${(count / Math.max(maxCompletions, 4)) * 100}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{day.day}</span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Up Next Deadlines */}
          <section className="surface flex-1 p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="size-4 text-primary" />
                <h2 className="text-base font-semibold">Upcoming Deadlines</h2>
              </div>
              <Badge variant="outline" className="text-xs">
                {pendingDeadlines.length} pending
              </Badge>
            </div>

            {pendingDeadlines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No pending deadlines! All caught up.
              </div>
            ) : (
              <ul className="space-y-2">
                {pendingDeadlines.map((d) => {
                  const days = daysUntil(d.due);
                  return (
                    <li
                      key={d.id}
                      className="flex items-center justify-between rounded-lg border border-border bg-card/60 p-2.5 transition hover:border-primary/40"
                    >
                      <button
                        onClick={() => toggleDeadline(d.id)}
                        className="flex items-start gap-2.5 text-left min-w-0 flex-1"
                      >
                        <CheckCircle2 className="size-4 text-muted-foreground hover:text-primary mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold leading-tight truncate">{d.title}</p>
                          <p className="text-[11px] text-muted-foreground mt-0.5">
                            {formatDate(d.due)} ·{" "}
                            <span className={days <= 3 ? "text-destructive font-semibold" : ""}>
                              {days <= 0 ? "Due today" : `${days}d left`}
                            </span>
                          </p>
                        </div>
                      </button>
                      <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">
                        {d.category}
                      </Badge>
                    </li>
                  );
                })}
              </ul>
            )}

            <Button variant="ghost" size="sm" className="mt-3 w-full text-xs" asChild>
              <Link to="/deadlines">Open deadline center →</Link>
            </Button>
          </section>
        </div>
      </div>

      {/* Tabs: Courses & Recommendations */}
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Active courses</TabsTrigger>
          <TabsTrigger value="opps">Recommended for you</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="mt-5">
          {coursesError ? (
            <div className="surface p-5 text-sm text-muted-foreground">
              Course progress could not be loaded. Check your connection.
            </div>
          ) : coursesLoading ? (
            <div className="surface p-5 text-sm text-muted-foreground">Loading your courses…</div>
          ) : courses.length === 0 ? (
            <div className="surface p-5 text-sm text-muted-foreground">
              No courses are available yet.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {courses.map((course) => (
                <div key={course.id} className="surface lift p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-primary">{course.track}</p>
                      <h3 className="mt-1 font-semibold">{course.title}</h3>
                    </div>
                    <Badge variant="outline">{course.level}</Badge>
                  </div>
                  <Progress value={course.progress} className="mt-4" />
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{course.progress}% complete</span>
                    <span>{course.hours}h total</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="opps" className="mt-5">
          <div className="grid gap-4 md:grid-cols-2">
            {opps.slice(0, 4).map((o) => (
              <div
                key={o.id}
                className="surface lift flex flex-col justify-between p-5 cursor-pointer hover:border-primary/50 transition-all"
                onClick={() => {
                  setSelectedOpp(o);
                  setOppDetailOpen(true);
                }}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {o.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-primary/40 bg-primary/10 text-primary text-[10px] font-semibold gap-1 py-0 px-1.5"
                        >
                          <Sparkles className="size-2.5" />
                          <span>{o.overallMatch ?? 78}% Match</span>
                        </Badge>
                        {100 - (o.overallMatch ?? 78) > 0 && (
                          <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1 py-0.5 rounded">
                            {100 - (o.overallMatch ?? 78)}% Gap
                          </span>
                        )}
                      </div>
                      <h3 className="mt-2 font-semibold text-sm hover:text-primary transition-colors">
                        {o.role}
                      </h3>
                      <p className="text-xs text-muted-foreground">{o.org}</p>
                    </div>
                    <span className="font-semibold text-xs text-primary">{o.stipend}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-1">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  className="mt-4 flex items-center justify-between border-t border-border pt-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="size-3" /> {o.location}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7"
                      onClick={() => {
                        setOpps((prev) =>
                          prev.map((x) => (x.id === o.id ? { ...x, saved: !x.saved } : x)),
                        );
                        toast(o.saved ? "Removed from saved" : "Saved opportunity");
                      }}
                    >
                      <Bookmark
                        className={`size-3.5 ${o.saved ? "fill-primary text-primary" : ""}`}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 gap-1 px-2 font-medium"
                      onClick={() => triggerImproveEligibility(o)}
                    >
                      <Sparkles className="size-3" />
                      <span>Improve</span>
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => {
                        setSelectedOpp(o);
                        setOppDetailOpen(true);
                      }}
                    >
                      Check Match
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/opportunities">See all opportunities</Link>
          </Button>

          {/* Capability Breakdown & AI Roadmap Modal */}
          <OpportunityDetailDialog
            opportunity={selectedOpp}
            open={oppDetailOpen}
            onOpenChange={setOppDetailOpen}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default Dashboard;
