import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Clock,
  MapPin,
  Building,
  Utensils,
  Dumbbell,
  ShieldCheck,
  BookOpen,
  FlaskConical,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { campusPlaces } from "@/data/demo";

export const Route = createFileRoute("/_authenticated/campus")({
  head: () => ({
    meta: [
      { title: "Campus Information · Civora" },
      {
        name: "description",
        content:
          "Opening hours, locations and details for libraries, labs, canteens and support services.",
      },
      { property: "og:title", content: "Campus Information · Civora" },
      {
        property: "og:description",
        content: "Hours and locations for every facility on campus.",
      },
    ],
  }),
  component: Campus,
});

const categories = ["All", "Study", "Labs", "Food", "Sports", "Admin", "Support"];

function getCategoryIcon(cat: string) {
  switch (cat) {
    case "Study":
      return BookOpen;
    case "Labs":
      return FlaskConical;
    case "Food":
      return Utensils;
    case "Sports":
      return Dumbbell;
    case "Support":
      return ShieldCheck;
    default:
      return Building;
  }
}

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
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Facilities &amp; Campus Map"
        title="Campus Information"
        description="Locations, operating hours, and guidelines for campus facilities, research labs, study spaces, and amenities."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search a building, lab or facility…"
        />
        <FilterChips options={categories} value={category} onChange={setCategory} />
      </div>

      {places.length === 0 ? (
        <EmptyState
          title="No campus places found"
          message="No facilities match your search query or selected category filter."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {places.map((p) => {
            const Icon = getCategoryIcon(p.category);
            return (
              <article
                key={p.id}
                className="surface lift group flex flex-col justify-between p-5 sm:p-6 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-4.5" />
                      </span>
                      <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors">
                        {p.name}
                      </h3>
                    </div>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {p.category}
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-1.5 text-xs text-muted-foreground font-mono">
                    <p className="flex items-center gap-2">
                      <MapPin className="size-3.5 text-primary shrink-0" />
                      <span className="text-foreground/90 font-medium">{p.block}</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="size-3.5 text-muted-foreground shrink-0" />
                      <span>{p.hours}</span>
                    </p>
                  </div>
                  <p className="mt-3.5 text-xs sm:text-sm leading-relaxed text-muted-foreground border-t border-border/50 pt-3">
                    {p.note}
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Campus;
