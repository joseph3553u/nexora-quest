import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, AlertTriangle, CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { StatCard } from "@/components/common/StatCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deadlines as seed, daysUntil, formatDate, type Deadline } from "@/data/demo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/deadlines")({
  head: () => ({
    meta: [
      { title: "Deadline Center · Civora" },
      {
        name: "description",
        content:
          "Every assignment, application and competition deadline in one prioritised list you can tick off.",
      },
      { property: "og:title", content: "Deadline Center · Civora" },
      {
        property: "og:description",
        content: "One prioritised list for every academic and competition deadline.",
      },
    ],
  }),
  component: Deadlines,
});

const categories = ["All", "Academic", "Competition", "Application", "Project"];

function Deadlines() {
  const [items, setItems] = useState<Deadline[]>(() => {
    if (typeof window === "undefined") return seed;
    try {
      const saved = localStorage.getItem("civora_deadlines");
      return saved ? JSON.parse(saved) : seed;
    } catch {
      return seed;
    }
  });

  const updateItems = (updater: (prev: Deadline[]) => Deadline[]) => {
    setItems((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem("civora_deadlines", JSON.stringify(next));
      } catch {
        // Ignore
      }
      return next;
    });
  };
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [showDone, setShowDone] = useState(false);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", due: "2026-10-15" });

  const list = useMemo(
    () =>
      items
        .filter(
          (d) =>
            (category === "All" || d.category === category) &&
            (showDone || !d.done) &&
            d.title.toLowerCase().includes(query.toLowerCase()),
        )
        .sort((a, b) => a.due.localeCompare(b.due)),
    [items, category, query, showDone],
  );

  const pending = items.filter((d) => !d.done);
  const urgent = pending.filter((d) => daysUntil(d.due) <= 7).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Time Management &amp; Due Dates"
        title="Deadline Center"
        description="Chronologically sorted so urgent deliverables and submissions are always right at the top."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="h-9.5 gap-1.5 font-semibold text-xs sm:text-sm">
                <Plus className="size-4" /> Add Deadline
              </Button>
            </DialogTrigger>
            <DialogContent className="surface border-border/80 sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="font-display">Add a New Deadline</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dtitle" className="text-xs font-semibold">
                    Title
                  </Label>
                  <Input
                    id="dtitle"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. PPS Lab Assignment 3 or Networks Quiz"
                    className="h-9.5 text-xs sm:text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ddue" className="text-xs font-semibold">
                    Due Date
                  </Label>
                  <Input
                    id="ddue"
                    type="date"
                    value={form.due}
                    onChange={(e) => setForm({ ...form, due: e.target.value })}
                    className="h-9.5 text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setOpen(false)} className="h-9 text-xs">
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!form.title.trim()) {
                      toast("Please enter a title for the deadline");
                      return;
                    }
                    updateItems((prev) => [
                      ...prev,
                      {
                        id: `d${Date.now()}`,
                        title: form.title,
                        category: "Academic",
                        due: form.due,
                        priority: "Medium",
                        done: false,
                      },
                    ]);
                    setForm({ title: "", due: "2026-10-15" });
                    setOpen(false);
                    toast.success("Deadline added to your schedule");
                  }}
                  className="h-9 text-xs font-semibold"
                >
                  Save Deadline
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Pending Tasks"
          value={`${pending.length}`}
          hint="Across all academic categories"
          icon={CalendarClock}
        />
        <StatCard
          label="Due This Week"
          value={`${urgent}`}
          hint="Requires immediate attention"
          icon={AlertTriangle}
        />
        <StatCard
          label="Completed"
          value={`${items.length - pending.length}`}
          hint="Verified submissions"
          icon={CheckCircle2}
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search deadlines…" />
        <div className="flex flex-wrap items-center gap-2">
          <FilterChips options={categories} value={category} onChange={setCategory} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDone((s) => !s)}
            className="h-8.5 text-xs text-muted-foreground hover:text-foreground"
          >
            {showDone ? "Hide Completed" : "Show Completed"}
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          title="No deadlines under this filter"
          message="You're all caught up or no items match your active filters."
        />
      ) : (
        <ul className="space-y-3">
          {list.map((d) => {
            const days = daysUntil(d.due);
            const isUrgent = !d.done && days <= 3;
            return (
              <li
                key={d.id}
                className={cn(
                  "surface lift group flex items-center gap-4 p-4.5 transition-all",
                  d.done && "opacity-60",
                )}
              >
                <Checkbox
                  checked={d.done}
                  onCheckedChange={() =>
                    updateItems((prev) =>
                      prev.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x)),
                    )
                  }
                  className="size-5 rounded-md border-border/80 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "font-display text-sm font-bold text-foreground transition-colors",
                      d.done && "line-through text-muted-foreground",
                    )}
                  >
                    {d.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                    <Clock className="size-3 text-muted-foreground" />
                    <span>{formatDate(d.due)}</span>
                    <span>·</span>
                    <span
                      className={cn(
                        d.done
                          ? "text-success font-semibold"
                          : isUrgent
                            ? "text-destructive font-bold"
                            : "text-muted-foreground",
                      )}
                    >
                      {d.done
                        ? "Completed"
                        : days < 0
                          ? `${Math.abs(days)} days overdue`
                          : days === 0
                            ? "Due today"
                            : `${days} days remaining`}
                    </span>
                  </p>
                </div>
                <Badge variant="secondary" className="hidden sm:inline-flex text-[11px]">
                  {d.category}
                </Badge>
                <Badge
                  variant={
                    d.priority === "High"
                      ? "destructive"
                      : d.priority === "Medium"
                        ? "warning"
                        : "secondary"
                  }
                  className="text-[10px] font-semibold"
                >
                  {d.priority}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default Deadlines;
