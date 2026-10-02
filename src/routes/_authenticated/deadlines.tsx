import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
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
import { AlertTriangle, CalendarClock, CheckCircle2 } from "lucide-react";
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
  const [items, setItems] = useState<Deadline[]>(seed);
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Never miss a date"
        title="Deadline Center"
        description="Sorted by due date so the next thing is always at the top."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add deadline
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a deadline</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dtitle">Title</Label>
                  <Input
                    id="dtitle"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Networks quiz revision"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ddue">Due date</Label>
                  <Input
                    id="ddue"
                    type="date"
                    value={form.due}
                    onChange={(e) => setForm({ ...form, due: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!form.title.trim()) {
                      toast("Give the deadline a title");
                      return;
                    }
                    setItems((prev) => [
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
                    toast("Deadline added");
                  }}
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Pending" value={`${pending.length}`} hint="Across all categories" icon={CalendarClock} />
        <StatCard label="Due this week" value={`${urgent}`} hint="Needs attention now" icon={AlertTriangle} />
        <StatCard
          label="Completed"
          value={`${items.length - pending.length}`}
          hint="Nicely done"
          icon={CheckCircle2}
        />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search deadlines" />
        <div className="flex flex-wrap items-center gap-3">
          <FilterChips options={categories} value={category} onChange={setCategory} />
          <Button variant="ghost" size="sm" onClick={() => setShowDone((s) => !s)}>
            {showDone ? "Hide completed" : "Show completed"}
          </Button>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState message="Nothing due under this filter." />
      ) : (
        <ul className="space-y-3">
          {list.map((d) => {
            const days = daysUntil(d.due);
            return (
              <li key={d.id} className="surface flex items-center gap-4 p-4">
                <Checkbox
                  checked={d.done}
                  onCheckedChange={() =>
                    setItems((prev) =>
                      prev.map((x) => (x.id === d.id ? { ...x, done: !x.done } : x)),
                    )
                  }
                />
                <div className="min-w-0 flex-1">
                  <p className={cn("font-medium", d.done && "text-muted-foreground line-through")}>
                    {d.title}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(d.due)} ·{" "}
                    {d.done
                      ? "completed"
                      : days < 0
                        ? `${Math.abs(days)} days overdue`
                        : days === 0
                          ? "due today"
                          : `in ${days} days`}
                  </p>
                </div>
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {d.category}
                </Badge>
                <Badge variant={d.priority === "High" ? "destructive" : "secondary"}>
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
