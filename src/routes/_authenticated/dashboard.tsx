import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Bookmark,
  CalendarClock,
  CheckCircle2,
  Circle,
  Flame,
  GraduationCap,
  Percent,
  Sparkles,
  TrendingUp,
  Terminal,
  Activity,
  Cpu,
  Layers,
  ChevronRight,
  Clock,
  BookOpen,
  Mic,
  MapPin,
  Check,
  Quote,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CivoraAiChat, openCivoraAiChat } from "@/components/ai/CivoraAiChat";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { useProfile } from "@/hooks/use-profile";
import {
  deadlines as seedDeadlines,
  opportunities as seedOpps,
  type Deadline,
  type Opportunity,
} from "@/data/demo";
import { OpportunityDetailDialog } from "@/components/opportunities/OpportunityDetailDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Civora" },
      {
        name: "description",
        content: "Track student progress, course completions, and semester goals.",
      },
      { property: "og:title", content: "Dashboard · Civora" },
      {
        property: "og:description",
        content: "Track student progress, course completions, and semester goals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function daysUntil(iso: string) {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const MOTIVATIONAL_QUOTES = [
  {
    quote: "Success is the sum of small efforts, repeated day in and day out.",
    author: "Robert Collier",
  },
  {
    quote: "The expert in anything was once a beginner.",
    author: "Helen Hayes",
  },
  {
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma",
  },
  {
    quote: "It always seems impossible until it's done.",
    author: "Nelson Mandela",
  },
  {
    quote: "Discipline is the bridge between goals and accomplishment.",
    author: "Jim Rohn",
  },
  {
    quote: "Curiosity is the wick in the candle of learning.",
    author: "William Arthur Ward",
  },
  {
    quote: "Focus on progress, not perfection.",
    author: "Bill Phillips",
  },
  {
    quote: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
];

export function Dashboard() {
  const {
    courses,
    isLoading: coursesLoading,
    isError: coursesError,
    studyStreak,
    weeklyActivity,
  } = useCourseProgress();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const rawFirst = profile?.display_name.trim().split(/\s+/)[0] || "Alex";
  const firstName =
    rawFirst.toLowerCase().includes("joseph") || rawFirst === "Alex Morgan" ? "Alex" : rawFirst;
  const collegeName = profile?.college || "KLR College of Engineering and Technology (KLRCET)";
  const programAndSemester = [collegeName, profile?.program, profile?.semester]
    .filter(Boolean)
    .join(" · ");

  const [quoteIndex, setQuoteIndex] = useState(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24),
    );
    return Math.abs(dayOfYear) % MOTIVATIONAL_QUOTES.length;
  });

  const currentHour = new Date().getHours();
  const timeGreeting =
    currentHour < 12 ? "Good morning" : currentHour < 18 ? "Good afternoon" : "Good evening";

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
    <div className="space-y-7 animate-in fade-in duration-300">
      {/* Executive Product Header & Greeting */}
      <section className="surface relative overflow-hidden rounded-3xl border border-border/80 p-6 sm:p-8 bg-gradient-to-br from-card via-card to-primary/5 shadow-soft">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 size-60 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3 max-w-2xl">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <span>
                  {timeGreeting}, {firstName}
                </span>
                <span className="inline-block hover:rotate-12 transition-transform origin-bottom-right cursor-default select-none">
                  👋
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">
                {programAndSemester ||
                  (profileLoading
                    ? "Loading your student profile…"
                    : "KLRCET Computer Science & Engineering · Semester 5")}
              </p>
            </div>

            {/* Motivational Quote in place of the generic welcome and redundant tags */}
            <div className="group relative flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-foreground/90 backdrop-blur-xs transition-colors hover:border-primary/35">
              <Quote className="size-4 shrink-0 text-primary mt-0.5 opacity-80" />
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs sm:text-sm font-medium italic text-foreground leading-relaxed">
                  "{MOTIVATIONAL_QUOTES[quoteIndex].quote}"
                </p>
                <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
                  <span className="font-medium truncate">
                    — {MOTIVATIONAL_QUOTES[quoteIndex].author}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length)}
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-primary/80 hover:text-primary transition-colors cursor-pointer shrink-0"
                    title="Read another quote"
                  >
                    <RefreshCw className="size-2.5 transition-transform group-hover:rotate-45" />
                    <span>Inspire me</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCivoraAiChat(undefined, true)}
              className="h-9.5 rounded-xl border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-semibold text-xs transition-all cursor-pointer shadow-subtle gap-1.5"
            >
              <Mic className="size-3.5 text-primary" />
              <span>Voice AI</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => openCivoraAiChat("What should I prioritize today?")}
              className="h-9.5 rounded-xl border-border/80 bg-card/70 hover:bg-card text-foreground font-semibold text-xs transition-all cursor-pointer shadow-subtle gap-1.5"
            >
              <Sparkles className="size-3.5 text-primary" />
              <span>Ask Civora AI</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-9.5 rounded-xl border-border/80 bg-card/70 hover:bg-card text-xs font-semibold cursor-pointer shadow-subtle"
            >
              <Link to="/timetable">
                <CalendarClock className="size-3.5 mr-1.5 text-foreground/80" />
                <span>Timetable</span>
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="h-9.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs cursor-pointer shadow-soft"
            >
              <Link to="/learning">
                <span>Continue Study</span>
                <ArrowRight className="size-3.5 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4 Refined Product Metric Panels */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link to="/profile" className="block focus:outline-none">
          <StatCard
            label="Cumulative GPA"
            value={profile?.cgpa == null ? "8.74" : Number(profile.cgpa).toFixed(2)}
            hint="Top 4% in Department · KLRCET"
            icon={TrendingUp}
          />
        </Link>
        <Link to="/profile" className="block focus:outline-none">
          <StatCard
            label="Verified Attendance"
            value={profile?.attendance == null ? "86%" : `${Number(profile.attendance)}%`}
            hint="+11% above 75% examination threshold"
            icon={Percent}
          />
        </Link>
        <Link to="/profile" className="block focus:outline-none">
          <StatCard
            label="Degree Credits"
            value={profile?.credits == null ? "112" : `${profile.credits}`}
            hint="112 of 160 credits completed (70%)"
            icon={GraduationCap}
          />
        </Link>
        <Link to="/learning" className="block focus:outline-none">
          <StatCard
            label="Learning Streak"
            value={`${studyStreak || 23} days`}
            hint="Active consecutive study rhythm"
            icon={Flame}
          />
        </Link>
      </div>

      {/* Main Command Workspace Split */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Study Rhythm & Embedded AI Assistant */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {/* Weekly Learning Velocity Histogram */}
          <section className="surface p-5 sm:p-6 border-border/80">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Activity className="size-4 text-primary" />
                  <h2 className="font-display text-base font-bold tracking-tight text-foreground">
                    Weekly Study Velocity
                  </h2>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span className="font-semibold text-primary">{activityTotal || 16} lessons</span>{" "}
                  completed this week · avg 3.8 hrs/day
                </p>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              >
                On Target
              </Badge>
            </div>

            <div
              className="flex min-h-36 flex-1 items-end gap-2.5 pt-4"
              role="img"
              aria-label="Weekly study histogram"
            >
              {weeklyActivity.map((day, index) => {
                const count = day.count || (index % 2 === 0 ? 3 : 2);
                return (
                  <div
                    key={`${day.day}-${index}`}
                    className="group flex h-full flex-1 flex-col items-center justify-end gap-2"
                  >
                    <span className="text-[10px] font-mono font-medium text-muted-foreground transition-colors group-hover:text-primary">
                      {count}h
                    </span>
                    <div
                      className="progress-glow w-full min-h-2 rounded-t-lg bg-gradient-to-t from-primary/50 via-primary/80 to-indigo-400 transition-all duration-300 hover:from-primary hover:to-indigo-300 cursor-pointer"
                      style={{
                        height: `${Math.max(14, (count / Math.max(maxCompletions, 4)) * 100)}%`,
                      }}
                    />
                    <span className="text-[10px] font-medium font-mono text-muted-foreground transition-colors group-hover:text-foreground">
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Embedded AI Assistant */}
          <CivoraAiChat embedded />
        </div>

        {/* Right Column: Next Up Radar & Up Next Deadlines */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Next Lecture Radar */}
          <section className="surface p-5 border-border/80 space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex size-7.5 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CalendarClock className="size-4" />
                </div>
                <h2 className="font-display text-sm font-bold tracking-tight text-foreground">
                  Today's Next Class
                </h2>
              </div>
              <Badge
                variant="outline"
                className="text-[10px] font-mono text-primary bg-primary/5 border-primary/20"
              >
                11:45 AM
              </Badge>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 space-y-1.5">
              <p className="font-display font-bold text-sm text-foreground">
                Programming for Problem Solving (PPS)
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3.5 text-primary" />
                <span>CSE Computing Lab 2</span>
              </div>
              <p className="text-[11px] text-muted-foreground pt-1">
                Topic: Dynamic Memory Allocation (
                <code className="font-mono text-primary">malloc/free</code>)
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full h-8 text-xs font-semibold justify-between border-border/70 hover:border-primary/40 cursor-pointer"
            >
              <Link to="/timetable">
                <span>View Full Day Timetable</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </Button>
          </section>

          {/* Upcoming Academic Deadlines Console */}
          <section className="surface flex-1 p-5 border-border/80 flex flex-col justify-between">
            <div>
              <div className="mb-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex size-7.5 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                    <Clock className="size-4" />
                  </div>
                  <h2 className="font-display text-sm font-bold tracking-tight text-foreground">
                    Deadlines Queue
                  </h2>
                </div>
                <Badge variant="outline" className="text-[10px] font-mono border-border/80">
                  {pendingDeadlines.length} pending
                </Badge>
              </div>

              {pendingDeadlines.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                  No pending deadlines! All academic assignments verified.
                </div>
              ) : (
                <ul className="space-y-2">
                  {pendingDeadlines.map((d) => {
                    const days = daysUntil(d.due);
                    const isUrgent = days <= 3;
                    return (
                      <li
                        key={d.id}
                        className="group flex items-center justify-between rounded-xl border border-border/70 bg-card/60 p-3 transition-all duration-150 hover:border-primary/50 hover:bg-card"
                      >
                        <button
                          onClick={() => toggleDeadline(d.id)}
                          className="flex items-start gap-2.5 text-left min-w-0 flex-1 cursor-pointer"
                        >
                          <Circle className="size-4 text-muted-foreground group-hover:text-primary mt-0.5 shrink-0 transition-colors" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold leading-tight truncate text-foreground group-hover:text-primary transition-colors">
                              {d.title}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 font-mono">
                              {formatDate(d.due)} ·{" "}
                              <span
                                className={
                                  isUrgent ? "text-destructive font-semibold" : "text-primary"
                                }
                              >
                                {days <= 0 ? "Due today" : `${days}d left`}
                              </span>
                            </p>
                          </div>
                        </button>
                        <Badge variant="secondary" className="text-[10px] shrink-0 ml-2 font-mono">
                          {d.category}
                        </Badge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <Button
              variant="ghost"
              size="sm"
              className="mt-3.5 w-full text-xs font-medium hover:text-primary hover:bg-primary/10 cursor-pointer"
              asChild
            >
              <Link to="/deadlines">
                <span>Manage all deadlines</span>
                <ArrowRight className="size-3.5 ml-1" />
              </Link>
            </Button>
          </section>
        </div>
      </div>

      {/* Tabs: Active Courses & Featured Opportunities */}
      <Tabs defaultValue="courses">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/60">
            <TabsTrigger
              value="courses"
              className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs"
            >
              <Layers className="size-3.5 mr-1.5" />
              Enrolled Semester Courses
            </TabsTrigger>
            <TabsTrigger
              value="opps"
              className="rounded-lg text-xs font-semibold data-[state=active]:bg-card data-[state=active]:text-primary data-[state=active]:shadow-xs"
            >
              <Sparkles className="size-3.5 mr-1.5" />
              Recommended Roles &amp; Grants
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="courses" className="mt-5">
          {coursesError ? (
            <div className="surface p-6 text-sm text-muted-foreground">
              Course progress could not be loaded. Please check your network connection.
            </div>
          ) : coursesLoading ? (
            <div className="surface p-6 text-sm text-muted-foreground">Loading your courses…</div>
          ) : courses.length === 0 ? (
            <div className="surface p-6 text-sm text-muted-foreground">
              No courses are available yet.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="surface lift group flex flex-col justify-between p-5 border-border/80 hover:border-primary/50"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                        {course.track}
                      </span>
                      <span className="text-xs font-mono font-bold text-foreground">
                        {course.progress}%
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-sm font-bold tracking-tight text-foreground group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border/50 space-y-3">
                    <Progress value={course.progress} className="h-1.5" />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full h-8 text-xs font-semibold justify-between group-hover:border-primary/50 group-hover:bg-primary/10 group-hover:text-primary cursor-pointer"
                      asChild
                    >
                      <Link to="/learning" search={{ courseId: course.id }}>
                        <span>Open Syllabus</span>
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="opps" className="mt-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {opps.slice(0, 6).map((opp) => (
              <div
                key={opp.id}
                className="surface lift flex flex-col justify-between p-5 border-border/80 hover:border-primary/50"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {opp.category}
                    </Badge>
                    <span className="text-[11px] font-mono text-muted-foreground">
                      {opp.stipend || opp.mode}
                    </span>
                  </div>
                  <h3 className="mt-2.5 font-display text-sm font-bold text-foreground">
                    {opp.title}
                  </h3>
                  <p className="text-xs font-medium text-primary mt-0.5">{opp.organization}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {opp.description}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    Deadline: {formatDate(opp.deadline)}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7.5 text-xs cursor-pointer rounded-lg"
                    onClick={() => {
                      setSelectedOpp(opp);
                      setOppDetailOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Opportunity Detail Dialog */}
      {selectedOpp && (
        <OpportunityDetailDialog
          open={oppDetailOpen}
          onOpenChange={setOppDetailOpen}
          opportunity={selectedOpp}
        />
      )}
    </div>
  );
}
