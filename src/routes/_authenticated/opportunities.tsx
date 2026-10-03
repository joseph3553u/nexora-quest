import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bookmark,
  Building,
  MapPin,
  Sparkles,
  TrendingUp,
  Briefcase,
  CheckCircle2,
  SlidersHorizontal,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OpportunityDetailDialog } from "@/components/opportunities/OpportunityDetailDialog";
import { triggerImproveEligibility } from "@/components/opportunities/opportunity-eligibility";
import { opportunities as seed, type Opportunity } from "@/data/demo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/opportunities")({
  head: () => ({
    meta: [
      { title: "Opportunity Feed · Civora" },
      {
        name: "description",
        content:
          "Internships, full-time roles, research positions and scholarships matched to your student capability profile.",
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

  const highMatchCount = items.filter((o) => (o.overallMatch ?? 75) >= 80).length;
  const savedCount = items.filter((o) => o.saved).length;

  function openDetail(opp: Opportunity) {
    setSelectedOpp(opp);
    setDetailOpen(true);
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Career & Research Discovery"
        title="Opportunity Feed"
        description="Curated internships, hackathons, and research grants matched directly to your coursework and programming capability."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSavedOnly((s) => !s)}
            className={cn(
              "h-9 text-xs font-semibold gap-1.5 rounded-xl border-border/80 cursor-pointer",
              savedOnly && "border-primary/40 bg-primary/10 text-primary",
            )}
          >
            <Bookmark className={cn("size-3.5", savedOnly && "fill-primary text-primary")} />
            <span>{savedOnly ? "Showing Saved" : `Saved (${savedCount})`}</span>
          </Button>
        }
      />

      {/* Discovery Telemetry Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="surface p-4 flex items-center justify-between border-border/70">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Total Verified Postings
            </p>
            <p className="text-xl font-bold font-display text-foreground mt-0.5">
              {items.length} Roles
            </p>
          </div>
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Briefcase className="size-4" />
          </div>
        </div>

        <div className="surface p-4 flex items-center justify-between border-border/70">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              High Match (≥80%)
            </p>
            <p className="text-xl font-bold font-display text-primary mt-0.5">
              {highMatchCount} Matches
            </p>
          </div>
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <Sparkles className="size-4" />
          </div>
        </div>

        <div className="surface p-4 flex items-center justify-between border-border/70">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Student Profile
            </p>
            <p className="text-xl font-bold font-display text-foreground mt-0.5">
              Alex · CSE Sem 5
            </p>
          </div>
          <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <TrendingUp className="size-4" />
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by role title, company, or technology stack…"
          className="sm:w-80"
        />
        <FilterChips options={types} value={type} onChange={setType} />
      </div>

      {/* Opportunity Cards List */}
      {list.length === 0 ? (
        <EmptyState message="No opportunities match your current filter parameters." />
      ) : (
        <div className="space-y-3.5">
          {list.map((o) => {
            const matchScore = o.overallMatch ?? 78;
            return (
              <article
                key={o.id}
                className="surface lift flex flex-col gap-4 p-5 sm:flex-row sm:items-center justify-between cursor-pointer transition-all border-border/80 hover:border-primary/50 group"
                onClick={() => openDetail(o)}
              >
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-card text-primary font-bold shadow-subtle group-hover:border-primary/40 group-hover:text-primary transition-colors">
                    <Building className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display font-bold text-sm sm:text-base text-foreground group-hover:text-primary transition-colors">
                        {o.role}
                      </h3>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {o.type}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="border-primary/30 bg-primary/10 text-primary text-[10px] font-mono font-semibold gap-1 py-0 h-4.5"
                      >
                        <Sparkles className="size-3" />
                        <span>{matchScore}% Match</span>
                      </Badge>
                    </div>

                    <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground/90">{o.org}</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="size-3 text-muted-foreground" /> {o.location}
                      </span>
                      <span className="font-mono text-[11px]">Posted {o.posted}</span>
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {o.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-md border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-mono text-muted-foreground"
                        >
                          {t}
                        </span>
                      ))}
                      <span className="text-[11px] text-primary font-medium hover:underline ml-1">
                        View skills breakdown &amp; AI roadmap →
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="flex items-center justify-between sm:flex-col sm:items-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50"
                  onClick={(e) => e.stopPropagation()}
                >
                  <p className="font-display font-bold text-sm sm:text-base text-primary">
                    {o.stipend}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Save opportunity"
                      className="size-8.5 rounded-lg border border-border/70 hover:bg-muted/70 cursor-pointer"
                      onClick={() =>
                        setItems((prev) =>
                          prev.map((x) => (x.id === o.id ? { ...x, saved: !x.saved } : x)),
                        )
                      }
                    >
                      <Bookmark className={cn("size-4", o.saved && "fill-primary text-primary")} />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8.5 text-xs font-semibold border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 gap-1 rounded-xl cursor-pointer"
                      onClick={() => triggerImproveEligibility(o)}
                    >
                      <Sparkles className="size-3 text-primary" />
                      <span>Boost Match</span>
                    </Button>
                    <Button
                      size="sm"
                      className="h-8.5 text-xs font-semibold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer shadow-subtle"
                      onClick={() => openDetail(o)}
                    >
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
