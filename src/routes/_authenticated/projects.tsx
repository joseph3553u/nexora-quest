import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Plus,
  Users,
  FolderGit2,
  CheckCircle2,
  Hammer,
  Sparkles,
  Clock,
  ArrowRight,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { projects as seed, type Project } from "@/data/demo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Project Hub · Civora" },
      {
        name: "description",
        content:
          "Track your engineering builds from idea to shipped, with stack, collaborators and progress.",
      },
      { property: "og:title", content: "Project Hub · Civora" },
      {
        property: "og:description",
        content: "Track student projects from planning to shipped.",
      },
    ],
  }),
  component: Projects,
});

const statuses = ["All", "Planning", "Building", "Shipped"];

function Projects() {
  const [items, setItems] = useState<Project[]>(seed);
  const [status, setStatus] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", summary: "", stack: "" });

  const list = useMemo(
    () =>
      items.filter(
        (p) =>
          (status === "All" || p.status === status) &&
          (p.name + p.summary + p.stack.join(" ")).toLowerCase().includes(query.toLowerCase()),
      ),
    [items, status, query],
  );

  const buildingCount = items.filter((p) => p.status === "Building").length;
  const shippedCount = items.filter((p) => p.status === "Shipped").length;

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Student Engineering Portfolio"
        title="Project Hub"
        description="Track active semester builds, software prototypes, tech stacks, and team collaboration."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="h-9 gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs cursor-pointer shadow-subtle"
              >
                <Plus className="size-4" />
                <span>New Project</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="surface border border-border/80 shadow-lift rounded-2xl max-w-lg">
              <DialogHeader>
                <DialogTitle className="font-display text-lg font-bold">
                  Create Engineering Project
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pname" className="text-xs font-semibold">
                    Project Title
                  </Label>
                  <Input
                    id="pname"
                    placeholder="e.g. Civora Neural Notes Analyzer"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="h-10 text-xs sm:text-sm rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="psum" className="text-xs font-semibold">
                    Project Summary
                  </Label>
                  <Textarea
                    id="psum"
                    placeholder="Brief description of the architecture and academic purpose…"
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                    className="rounded-xl text-xs sm:text-sm min-h-24"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pstack" className="text-xs font-semibold">
                    Tech Stack (comma separated)
                  </Label>
                  <Input
                    id="pstack"
                    value={form.stack}
                    onChange={(e) => setForm({ ...form, stack: e.target.value })}
                    placeholder="React, TypeScript, FastAPI, PostgreSQL"
                    className="h-10 text-xs sm:text-sm rounded-xl font-mono"
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setOpen(false)}
                  className="rounded-xl cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="rounded-xl bg-primary text-primary-foreground cursor-pointer font-semibold"
                  onClick={() => {
                    if (!form.name.trim()) {
                      toast.error("Please enter a project title");
                      return;
                    }
                    setItems((prev) => [
                      {
                        id: `pr${Date.now()}`,
                        name: form.name.trim(),
                        summary: form.summary.trim() || "Independent student engineering project.",
                        stack: form.stack
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                        status: "Building",
                        progress: 25,
                        collaborators: 1,
                      },
                      ...prev,
                    ]);
                    setForm({ name: "", summary: "", stack: "" });
                    setOpen(false);
                    toast.success("Project created and added to your portfolio");
                  }}
                >
                  Save Project
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {/* Portfolio Overview Gauges */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="surface p-4 flex items-center justify-between border-border/70">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Total Portfolio Builds
            </p>
            <p className="text-xl font-bold font-display text-foreground mt-0.5">
              {items.length} Projects
            </p>
          </div>
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FolderGit2 className="size-4" />
          </div>
        </div>

        <div className="surface p-4 flex items-center justify-between border-border/70">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Active Builds
            </p>
            <p className="text-xl font-bold font-display text-amber-500 mt-0.5">
              {buildingCount} In Progress
            </p>
          </div>
          <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Hammer className="size-4" />
          </div>
        </div>

        <div className="surface p-4 flex items-center justify-between border-border/70">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Shipped &amp; Verified
            </p>
            <p className="text-xl font-bold font-display text-emerald-500 mt-0.5">
              {shippedCount} Complete
            </p>
          </div>
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <CheckCircle2 className="size-4" />
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search by project name or technology…"
          className="sm:w-80"
        />
        <FilterChips options={statuses} value={status} onChange={setStatus} />
      </div>

      {list.length === 0 ? (
        <EmptyState message="No projects found with the selected status filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => {
            const isShipped = p.status === "Shipped";
            const isBuilding = p.status === "Building";
            return (
              <article
                key={p.id}
                className="surface lift group flex flex-col justify-between p-5 border-border/80 hover:border-primary/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display font-bold text-base text-foreground group-hover:text-primary transition-colors">
                      {p.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className={`text-[10px] font-mono font-semibold py-0.5 px-2 ${
                        isShipped
                          ? "border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
                          : isBuilding
                            ? "border-primary/30 text-primary bg-primary/10"
                            : "border-border/80 text-muted-foreground bg-muted/40"
                      }`}
                    >
                      {p.status}
                    </Badge>
                  </div>

                  <p className="mt-2 text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                    {p.summary}
                  </p>

                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {p.stack.map((s) => (
                      <span
                        key={s}
                        className="rounded-md border border-border/60 bg-muted/40 px-2 py-0.5 text-[11px] font-mono text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-muted-foreground">{p.progress}% progress</span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="size-3 text-primary" /> {p.collaborators}{" "}
                      {p.collaborators === 1 ? "builder" : "collaborators"}
                    </span>
                  </div>
                  <Progress value={p.progress} className="h-1.5" />
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
