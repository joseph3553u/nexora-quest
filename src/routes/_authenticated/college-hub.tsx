import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bell, Building2, GraduationCap, Users } from "lucide-react";
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Your institution"
        title="College Hub"
        description="Everything official in one place — departments, notices, faculty strength and academic calendar."
        actions={
          <Button variant="outline" onClick={() => toast("Academic calendar downloaded")}>
            Academic calendar
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Departments" value="12" hint="Across 4 schools" icon={Building2} />
        <StatCard label="Students" value="3,550" hint="Enrolled this year" icon={Users} />
        <StatCard label="Faculty" value="194" hint="62 with doctorates" icon={GraduationCap} />
        <StatCard label="Open notices" value="4" hint="2 need action" icon={Bell} />
      </div>

      <Tabs defaultValue="notices">
        <TabsList>
          <TabsTrigger value="notices">Notices</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
        </TabsList>

        <TabsContent value="notices" className="mt-5 space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <SearchField value={query} onChange={setQuery} placeholder="Search notices" />
            <FilterChips options={tags} value={tag} onChange={setTag} />
          </div>
          {notices.length === 0 ? (
            <EmptyState message="No notices match that filter." />
          ) : (
            <div className="space-y-3">
              {notices.map((n) => (
                <article key={n.id} className="surface lift flex items-center gap-4 p-5">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">
                    <Bell className="size-4.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-medium">{n.title}</h3>
                    <p className="text-xs text-muted-foreground">{formatDate(n.date)}</p>
                  </div>
                  <Badge variant="secondary">{n.tag}</Badge>
                </article>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="departments" className="mt-5">
          <div className="grid gap-4 md:grid-cols-2">
            {departments.map((d) => (
              <div key={d.id} className="surface lift p-5">
                <h3 className="font-semibold">{d.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">Head: {d.hod}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground">Students</p>
                    <p className="font-semibold">{d.students}</p>
                  </div>
                  <div className="rounded-lg bg-muted px-3 py-2">
                    <p className="text-xs text-muted-foreground">Faculty</p>
                    <p className="font-semibold">{d.faculty}</p>
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
