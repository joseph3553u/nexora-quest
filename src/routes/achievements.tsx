import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Award, Medal, Plus, Sparkles, Star } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import { FilterChips, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { achievements as seed, formatDate, type Achievement } from "@/data/demo";
import { toast } from "sonner";

export const Route = createFileRoute("/achievements")({
  head: () => ({
    meta: [
      { title: "Student Achievements · Nexora" },
      {
        name: "description",
        content: "A verified record of awards, certifications, publications and milestones you have earned.",
      },
      { property: "og:title", content: "Student Achievements · Nexora" },
      {
        property: "og:description",
        content: "Your awards, certifications, publications and milestones in one profile.",
      },
    ],
  }),
  component: Achievements,
});

const types = ["All", "Award", "Certification", "Publication", "Milestone"];

function Achievements() {
  const [items] = useState<Achievement[]>(seed);
  const [type, setType] = useState("All");

  const list = useMemo(
    () => items.filter((a) => type === "All" || a.type === type),
    [items, type],
  );
  const points = items.reduce((sum, a) => sum + a.points, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your record"
        title="Student Achievements"
        description="Everything you have won, earned and published, ready to drop into a résumé."
        actions={
          <Button onClick={() => toast("Achievement submitted for verification")}>
            <Plus className="size-4" /> Add achievement
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total achievements" value={`${items.length}`} hint="Verified by college" icon={Medal} />
        <StatCard label="Merit points" value={`${points}`} hint="Rank 14 in your batch" icon={Star} />
        <StatCard label="This year" value="4" hint="+2 vs last year" icon={Sparkles} />
      </div>

      <FilterChips options={types} value={type} onChange={setType} />

      {list.length === 0 ? (
        <EmptyState message="No achievements of this type yet." />
      ) : (
        <ol className="relative space-y-4 border-l border-border pl-6">
          {list.map((a) => (
            <li key={a.id} className="relative">
              <span className="absolute -left-[31px] top-4 flex size-6 items-center justify-center rounded-full border border-border bg-card text-primary">
                <Award className="size-3.5" />
              </span>
              <article className="surface lift flex flex-col gap-2 p-5 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {a.issuer} · {formatDate(a.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{a.type}</Badge>
                  <Badge variant="outline">+{a.points} pts</Badge>
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
