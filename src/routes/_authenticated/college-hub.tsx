import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Building2, Calendar, GraduationCap, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { collegeNotices, departments, formatDate } from "@/data/demo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/college-hub")({
  head: () => ({
    meta: [
      { title: "College Hub · Civora" },
      {
        name: "description",
        content: "Departments, notices, faculty and academic announcements for your college.",
      },
      { property: "og:title", content: "College Hub · Civora" },
      {
        property: "og:description",
        content: "Departments, notices and academic announcements in one place.",
      },
    ],
  }),
  component: CollegeHub,
});

const tags = ["All", "Exams", "Academics", "Events", "Facilities"];

function CollegeHub() {
  const [tag, setTag] = useState("All");
  const [query, setQuery] = useState("");

  const notices = useMemo(
    () =>
      collegeNotices.filter(
        (n) =>
          (tag === "All" || n.tag === tag) && n.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [tag, query],
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Institution &amp; Administration"
        title="College Hub"
        description="Official academic registry for KLR College of Engineering and Technology (KLRCET) — department directory, administrative circulars, and academic calendars."
        actions={
          <Button
            variant="outline"
            onClick={() => toast.success("Academic calendar (PDF) downloaded")}
            className="gap-1.5 h-9.5 text-xs font-semibold"
          >
            <Calendar className="size-4" /> Academic Calendar
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Departments"
          value="12"
          hint="Across 4 academic schools"
          icon={Building2}
        />
        <StatCard label="Students" value="3,550" hint="Active cohort enrollment" icon={Users} />
        <StatCard label="Faculty" value="194" hint="62 with PhD doctorates" icon={GraduationCap} />
        <StatCard label="Active notices" value="4" hint="2 requiring acknowledgment" icon={Bell} />
      </div>

      <Tabs defaultValue="notices">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <TabsList className="bg-muted/60 p-1 rounded-xl">
            <TabsTrigger value="notices" className="rounded-lg text-xs font-medium">
              Official Notices
            </TabsTrigger>
            <TabsTrigger value="departments" className="rounded-lg text-xs font-medium">
              Departments &amp; Faculty
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notices" className="mt-5 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchField
              value={query}
              onChange={setQuery}
              placeholder="Search circulars and notices…"
            />
            <FilterChips options={tags} value={tag} onChange={setTag} />
          </div>
          {notices.length === 0 ? (
            <EmptyState
              title="No notices found"
              message="No circulars match your search or selected tag."
            />
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <article
                  key={n.id}
                  className="surface lift flex items-center gap-4 p-5 sm:p-5.5 transition-all"
                >
                  <span className="status-glow flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bell className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display font-bold text-sm sm:text-base text-foreground truncate">
                      {n.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground font-mono">
                      {formatDate(n.date)}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">
                    {n.tag}
                  </Badge>
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="departments" className="mt-5">
          <div className="grid gap-4 md:grid-cols-2">
            {departments.map((d) => (
              <div key={d.id} className="surface lift p-5 sm:p-6 transition-all">
                <h3 className="font-display font-bold text-base sm:text-lg text-foreground">
                  {d.name}
                </h3>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Department Head: <span className="font-medium text-foreground">{d.hod}</span>
                </p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Students Enrolled
                    </p>
                    <p className="mt-1 font-display font-bold text-lg text-foreground tabular-nums">
                      {d.students}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/60 bg-muted/40 p-3.5 backdrop-blur-md">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      Teaching Faculty
                    </p>
                    <p className="mt-1 font-display font-bold text-lg text-foreground tabular-nums">
                      {d.faculty}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default CollegeHub;
