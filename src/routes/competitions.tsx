import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CalendarClock, Trophy, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { competitions as seed, daysUntil, formatDate } from "@/data/demo";
import { toast } from "sonner";

export const Route = createFileRoute("/competitions")({
  head: () => ({
    meta: [
      { title: "Competition Hub · Nexora" },
      {
        name: "description",
        content:
          "Hackathons, coding contests, case competitions and research meets with deadlines and prizes.",
      },
      { property: "og:title", content: "Competition Hub · Nexora" },
      {
        property: "og:description",
        content: "Find hackathons, contests and case competitions worth your time.",
      },
    ],
  }),
  component: Competitions,
});

const categories = ["All", "Hackathon", "Coding", "Design", "Case Study", "Research"];

function Competitions() {
  const [items, setItems] = useState(seed);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const list = useMemo(
    () =>
      items.filter(
        (c) =>
          (category === "All" || c.category === category) &&
          (c.name + c.host).toLowerCase().includes(query.toLowerCase()),
      ),
    [items, category, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Put skills to work"
        title="Competition Hub"
        description="Open competitions across coding, design, business and research, sorted by deadline."
        actions={
          <Button variant="outline" asChild>
            <Link to="/team-finder">Find a team</Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search competitions" />
        <FilterChips options={categories} value={category} onChange={setCategory} />
      </div>

      {list.length === 0 ? (
        <EmptyState message="No competitions in this category right now." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((c) => {
            const days = daysUntil(c.deadline);
            return (
              <article key={c.id} className="surface lift flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary">
                    <Trophy className="size-5" />
                  </span>
                  <Badge variant="secondary">{c.category}</Badge>
                </div>
                <h3 className="mt-3 font-semibold leading-snug">{c.name}</h3>
                <p className="text-sm text-muted-foreground">{c.host}</p>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarClock className="size-4" />
                    {formatDate(c.deadline)} · {days} days left
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="size-4" /> Team of {c.teamSize} · {c.mode}
                  </div>
                </dl>

                <p className="mt-4 font-display text-lg font-semibold text-primary">{c.prize}</p>

                <Button
                  className="mt-4"
                  variant={c.registered ? "secondary" : "default"}
                  onClick={() => {
                    setItems((prev) =>
                      prev.map((x) => (x.id === c.id ? { ...x, registered: !x.registered } : x)),
                    );
                    toast(c.registered ? "Registration withdrawn" : `Registered for ${c.name}`);
                  }}
                >
                  {c.registered ? "Registered" : "Register"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
