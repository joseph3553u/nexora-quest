import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, Building, MapPin, Sparkles } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpportunityDetailDialog } from "@/components/opportunities/OpportunityDetailDialog";
import { triggerImproveEligibility } from "@/components/opportunities/opportunity-eligibility";
import { opportunities as seed, type Opportunity } from "@/data/demo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunity Feed · Civora" },
      {
        name: "description",
        content:
          "Internships, full-time roles, research positions and scholarships matched to your profile.",
      },
      { property: "og:title", content: "Opportunity Feed · Civora" },
      {
        property: "og:description",
        content: "Internships, jobs, research roles and scholarships for students.",
      },
    ],
  }),
  component: Opportunities,
});

const types = ["All", "Internship", "Full-time", "Research", "Scholarship"];

function Opportunities() {
  const [items, setItems] = useState<Opportunity[]>(seed);
  const [type, setType] = useState("All");
  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const list = useMemo(
    () =>
      items.filter(
        (o) =>
          (type === "All" || o.type === type) &&
          (!savedOnly || o.saved) &&
          (o.role + o.org + o.tags.join(" ")).toLowerCase().includes(query.toLowerCase()),
      ),
    [items, type, query, savedOnly],
  );

  function openDetail(opp: Opportunity) {
    setSelectedOpp(opp);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="What's out there"
        title="Opportunity Feed"
        description="Fresh roles and funding with automated student capability matching across C, JavaScript, Python, and databases."
        actions={
          <Button variant="outline" onClick={() => setSavedOnly((s) => !s)}>
            {savedOnly ? "Show all" : "Saved only"}
          </Button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search roles or companies" />
        <FilterChips options={types} value={type} onChange={setType} />
      </div>

      {list.length === 0 ? (
        <EmptyState message="No opportunities match these filters." />
      ) : (
        <div className="space-y-4">
          {list.map((o) => {
            const matchScore = o.overallMatch ?? 78;
            return (
              <article
                key={o.id}
                className="surface lift flex flex-col gap-4 p-5 sm:flex-row sm:items-center cursor-pointer transition-all hover:border-primary/50"
                onClick={() => openDetail(o)}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">
                  <Building className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                      {o.role}
                    </h3>
                    <Badge variant="secondary">{o.type}</Badge>
                    <Badge
                      variant="outline"
                      className="border-primary/40 bg-primary-softer text-primary text-xs font-semibold gap-1"
                    >
                      <Sparkles className="size-3" />
                      <span>{matchScore}% Capability Match</span>
                    </Badge>
                    {100 - matchScore > 0 && (
                      <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                        {100 - matchScore}% Gap
                      </span>
                    )}
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 text-sm text-muted-foreground">
                    <span>{o.org}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="size-3.5" /> {o.location}
                    </span>
                    <span>Posted {o.posted}</span>
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    {o.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                    <span className="text-xs text-primary font-medium ml-1">
                      View skills breakdown & AI roadmap →
                    </span>
                  </div>
                </div>
                <div
                  className="flex items-center gap-3 sm:flex-col sm:items-end"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-semibold text-primary">{o.stipend}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Save opportunity"
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((x) => (x.id === o.id ? { ...x, saved: !x.saved } : x)),
                        )
                      }
                    >
                      <Bookmark
                        className={cn("size-4.5", o.saved && "fill-primary text-primary")}
                      />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 gap-1 text-xs"
                      onClick={() => triggerImproveEligibility(o)}
                    >
                      <Sparkles className="size-3.5" />
                      <span>Improve Eligibility</span>
                    </Button>
                    <Button size="sm" onClick={() => openDetail(o)}>
                      Check Match
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* Capability Match Breakdown & AI Roadmap Dialog */}
      <OpportunityDetailDialog
        opportunity={selectedOpp}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
