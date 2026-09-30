import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
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

export const Route = createFileRoute("/projects")({
  head: () => ({
    meta: [
      { title: "Project Hub · Nexora" },
      {
        name: "description",
        content: "Track your builds from idea to shipped, with stack, collaborators and progress.",
      },
      { property: "og:title", content: "Project Hub · Nexora" },
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
          (p.name + p.summary).toLowerCase().includes(query.toLowerCase()),
      ),
    [items, status, query],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Build things"
        title="Project Hub"
        description="Your active builds, who is on them and how far along they are."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> New project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create a project</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="pname">Project name</Label>
                  <Input
                    id="pname"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="psum">Summary</Label>
                  <Textarea
                    id="psum"
                    value={form.summary}
                    onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pstack">Stack (comma separated)</Label>
                  <Input
                    id="pstack"
                    value={form.stack}
                    onChange={(e) => setForm({ ...form, stack: e.target.value })}
                    placeholder="React, Node.js"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (!form.name.trim()) {
                      toast("Give the project a name");
                      return;
                    }
                    setItems((prev) => [
                      {
                        id: `pr${Date.now()}`,
                        name: form.name,
                        summary: form.summary || "No summary yet.",
                        stack: form.stack
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean),
                        status: "Planning",
                        progress: 0,
                        collaborators: 1,
                      },
                      ...prev,
                    ]);
                    setForm({ name: "", summary: "", stack: "" });
                    setOpen(false);
                    toast("Project created");
                  }}
                >
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search projects" />
        <FilterChips options={statuses} value={status} onChange={setStatus} />
      </div>

      {list.length === 0 ? (
        <EmptyState message="No projects with this status." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <article key={p.id} className="surface lift flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold">{p.name}</h3>
                <Badge
                  variant={
                    p.status === "Shipped"
                      ? "default"
                      : p.status === "Building"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {p.status}
                </Badge>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{p.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {p.stack.map((s) => (
                  <span
                    key={s}
                    className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-5">
                <Progress value={p.progress} />
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{p.progress}% complete</span>
                  <span className="flex items-center gap-1">
                    <Users className="size-3.5" /> {p.collaborators}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
