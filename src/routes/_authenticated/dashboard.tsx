import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  courses,
  deadlines as seedDeadlines,
  daysUntil,
  formatDate,
  opportunities,
  student,
  weeklyStudy,
} from "@/data/demo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · Nexora Student OS" },
      {
        name: "description",
        content:
          "Your semester at a glance: attendance, CGPA, study hours, upcoming deadlines and course progress.",
      },
      { property: "og:title", content: "Dashboard · Nexora Student OS" },
      {
        property: "og:description",
        content: "Your semester at a glance — deadlines, progress and study momentum.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const [tasks, setTasks] = useState(seedDeadlines);
  const maxHours = Math.max(...weeklyStudy.map((d) => d.hours));

  const upcoming = tasks
    .filter((t) => !t.done)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Welcome back"
        title={`Good to see you, ${student.name.split(" ")[0]}`}
        description={`${student.program} · ${student.semester}. Here is everything that needs you this week.`}
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
        <StatCard label="CGPA" value={student.cgpa.toFixed(2)} hint="+0.12 this semester" icon={TrendingUp} />
        <StatCard label="Attendance" value={`${student.attendance}%`} hint="Safe above 75%" icon={Percent} />
        <StatCard label="Credits earned" value={`${student.credits}`} hint="of 160 total" icon={GraduationCap} />
        <StatCard label="Study streak" value={`${student.streak} days`} hint="Best streak: 31" icon={Flame} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="surface flex flex-col p-6 lg:col-span-2">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Study hours this week</h2>
              <p className="text-sm text-muted-foreground">29.1 hours logged across 7 days</p>
            </div>
            <Badge variant="secondary">+14% vs last week</Badge>
          </div>
          <div className="flex min-h-48 flex-1 items-end gap-3">
            {weeklyStudy.map((d) => (
              <div
                key={d.day}
                className="flex h-full flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="text-xs font-medium text-muted-foreground">{d.hours}h</span>
                <div
                  className="w-full min-h-1 shrink-0 rounded-t-lg bg-primary/85 transition-all duration-500 hover:bg-primary"
                  style={{ height: `${(d.hours / maxHours) * 100}%` }}
                />
                <span className="text-xs text-muted-foreground">{d.day}</span>
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
            {upcoming.map((task) => {
              const days = daysUntil(task.due);
              return (
                <li key={task.id} className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted">
                  <Checkbox
                    checked={task.done}
                    onCheckedChange={() =>
                      setTasks((prev) =>
                        prev.map((t) => (t.id === task.id ? { ...t, done: !t.done } : t)),
                      )
                    }
                    className="mt-0.5"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(task.due)} ·{" "}
                      {days < 0 ? "overdue" : days === 0 ? "today" : `in ${days} days`}
                    </p>
                  </div>
                  <Badge
                    variant={task.priority === "High" ? "destructive" : "secondary"}
                    className="shrink-0"
                  >
                    {task.priority}
                  </Badge>
                </li>
              );
            })}
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
        </TabsContent>
        <TabsContent value="opps" className="mt-5">
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.slice(0, 4).map((o) => (
              <div key={o.id} className="surface lift flex items-start gap-4 p-5">
                <span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary">
                  <Target className="size-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="truncate font-semibold">{o.role}</h3>
                  <p className="text-sm text-muted-foreground">
                    {o.org} · {o.location}
                  </p>
                  <p className="mt-1 text-sm font-medium text-primary">{o.stipend}</p>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/opportunities">See all opportunities</Link>
          </Button>
        </TabsContent>
      </Tabs>
    </div>
  );
}
