import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Clock, MapPin } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { campusPlaces } from "@/data/demo";

export const Route = createFileRoute("/campus")({
  head: () => ({
    meta: [
      { title: "Campus Information · Nexora" },
      {
        name: "description",
        content: "Opening hours, locations and details for libraries, labs, canteens and support services.",
      },
      { property: "og:title", content: "Campus Information · Nexora" },
      {
        property: "og:description",
        content: "Hours and locations for every facility on campus.",
      },
    ],
  }),
  component: Campus,
});

const categories = ["All", "Study", "Labs", "Food", "Sports", "Admin", "Support"];

function Campus() {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  const places = useMemo(
    () =>
      campusPlaces.filter(
        (p) =>
          (category === "All" || p.category === category) &&
          (p.name + p.note + p.block).toLowerCase().includes(query.toLowerCase()),
      ),
    [category, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Know your campus"
        title="Campus Information"
        description="Where things are, when they open and what to expect when you get there."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search a place" />
        <FilterChips options={categories} value={category} onChange={setCategory} />
      </div>

      {places.length === 0 ? (
        <EmptyState message="No campus places match that search." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {places.map((p) => (
            <article key={p.id} className="surface lift flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{p.name}</h3>
                <Badge variant="secondary">{p.category}</Badge>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" /> {p.block}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4" /> {p.hours}
              </p>
              <p className="mt-3 text-sm leading-relaxed">{p.note}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
