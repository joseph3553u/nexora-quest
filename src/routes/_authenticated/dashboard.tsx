import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarClock,
  Flame,
  GraduationCap,
  Percent,
  Target,
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

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · Civora Student OS" },
      {
        name: "description",
        content: "Your student profile, saved lesson progress, learning activity and next steps.",
      },
      { property: "og:title", content: "Dashboard · Civora Student OS" },
      {
        property: "og:description",
        content: "Your profile and saved learning progress at a glance.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const {
    courses,
    isLoading: coursesLoading,
    isError: coursesError,
    studyStreak,
    weeklyActivity,
  } = useCourseProgress();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const firstName = profile?.display_name.trim().split(/\s+/)[0] || "Student";
  const programAndSemester = [profile?.program, profile?.semester].filter(Boolean).join(" · ");
  const activityTotal = weeklyActivity.reduce((sum, day) => sum + day.count, 0);
  const maxCompletions = Math.max(1, ...weeklyActivity.map((day) => day.count));

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
              <Link to="/deadlines">View deadlines</Link>
            </Button>
            <Button asChild>
              <Link to="/learning">
                Continue learning <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="CGPA"
          value={profile?.cgpa == null ? "—" : Number(profile.cgpa).toFixed(2)}
          hint={profile?.cgpa == null ? "Add it in your profile" : "From your student profile"}
          icon={TrendingUp}
        />
        <StatCard
          label="Attendance"
          value={profile?.attendance == null ? "—" : `${Number(profile.attendance)}%`}
          hint={
            profile?.attendance == null ? "Add it in your profile" : "From your student profile"
          }
          icon={Percent}
        />
        <StatCard
          label="Credits earned"
          value={profile?.credits == null ? "—" : `${profile.credits}`}
          hint={profile?.credits == null ? "Add it in your profile" : "From your student profile"}
          icon={GraduationCap}
        />
        <StatCard
          label="Learning streak"
          value={`${studyStreak} ${studyStreak === 1 ? "day" : "days"}`}
          hint={
            studyStreak
              ? "Consecutive days with saved lesson completions"
              : "Complete a lesson to start"
          }
          icon={Flame}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface flex flex-col p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Lessons completed in the last 7 days</h2>
              <p className="text-sm text-muted-foreground">
                {coursesLoading
                  ? "Loading saved learning activity…"
                  : coursesError
                    ? "Learning activity could not be loaded."
                    : `${activityTotal} ${activityTotal === 1 ? "lesson" : "lessons"} completed`}
              </p>
            </div>
            <Badge variant="secondary">
              {activityTotal} {activityTotal === 1 ? "completion" : "completions"}
            </Badge>
          </div>
          <div
            className="flex min-h-48 flex-1 items-end gap-3"
            role="img"
            aria-label="Saved lesson completions for each of the last seven days"
          >
            {weeklyActivity.map((day, index) => (
              <div
                key={`${day.day}-${index}`}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-medium text-muted-foreground">{day.count}</span>
                <div
                  className="progress-glow w-full min-h-1 shrink-0 rounded-t-md bg-primary/85 transition-all duration-500 hover:bg-primary"
                  style={{ height: `${(day.count / maxCompletions) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{day.day}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Up next</h2>
            <CalendarClock className="size-4.5 text-muted-foreground" />
          </div>
          <ul className="space-y-3">
            <li className="rounded-lg border border-dashed border-border p-3">
              <p className="text-sm font-medium">No synced deadlines yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Deadline reminders need a connected deadline data source.
              </p>
            </li>
          </ul>
          <Button variant="ghost" className="mt-4 w-full" asChild>
            <Link to="/deadlines">Open deadline center</Link>
          </Button>
        </section>
      </div>

      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">Active courses</TabsTrigger>
          <TabsTrigger value="opps">Recommended for you</TabsTrigger>
        </TabsList>
        <TabsContent value="courses" className="mt-5">
          {coursesError ? (
            <div className="surface p-5 text-sm text-muted-foreground">
              Course progress could not be loaded. Check your connection and try again.
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
            <div className="surface flex items-start gap-4 p-5 md:col-span-2">
              <span className="status-glow flex size-10 items-center justify-center rounded-md bg-primary-softer text-primary">
                <Target className="size-5" />
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold">Live recommendations are not connected yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Opportunity listings need a live data source before they can be personalized here.
                </p>
              </div>
            </div>
          </div>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/opportunities">See all opportunities</Link>
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
