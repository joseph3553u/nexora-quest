import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Users } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { teamPosts as seed, type TeamPost } from "@/data/demo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/team-finder")({
  head: () => ({
    meta: [
      { title: "Team Finder · Civora" },
      {
        name: "description",
        content: "Post an open slot or join a team that needs your skills for an upcoming event.",
      },
      { property: "og:title", content: "Team Finder · Civora" },
      {
        property: "og:description",
        content: "Find teammates for hackathons, case comps and research projects.",
      },
    ],
  }),
  component: TeamFinder,
});

function TeamFinder() {
  const [posts, setPosts] = useState<TeamPost[]>(seed);
  const [query, setQuery] = useState("");
  const [joined, setJoined] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", event: "", needed: "", note: "" });

  const list = useMemo(
    () =>
      posts.filter((p) =>
        (p.title + p.event + p.needed.join(" ")).toLowerCase().includes(query.toLowerCase()),
      ),
    [posts, query],
  );

  function createPost() {
    if (!form.title.trim() || !form.event.trim()) {
      toast("Add a title and an event");
      return;
    }
    setPosts((prev) => [
      {
        id: `t${Date.now()}`,
        title: form.title,
        owner: "You",
        event: form.event,
        needed: form.needed
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        slots: 4,
        filled: 1,
        note: form.note || "No extra notes.",
      },
      ...prev,
    ]);
    setForm({ title: "", event: "", needed: "", note: "" });
    setOpen(false);
    toast("Your team post is live");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Better together"
        title="Team Finder"
        description="Open team slots from students across departments. Request to join in one tap."
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Post a team
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Post a team request</DialogTitle>
                <DialogDescription>
                  Tell people what you are building and who you need.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Looking for a frontend dev"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="event">Event</Label>
                  <Input
                    id="event"
                    value={form.event}
                    onChange={(e) => setForm({ ...form, event: e.target.value })}
                    placeholder="Civora Build Sprint 2026"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="needed">Skills needed (comma separated)</Label>
                  <Input
                    id="needed"
                    value={form.needed}
                    onChange={(e) => setForm({ ...form, needed: e.target.value })}
                    placeholder="React, Figma"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="note">Notes</Label>
                  <Textarea
                    id="note"
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={createPost}>Publish post</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <SearchField value={query} onChange={setQuery} placeholder="Search by skill or event" />

      {list.length === 0 ? (
        <EmptyState message="No open team posts match that search." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((p) => {
            const isJoined = joined.includes(p.id);
            return (
              <article key={p.id} className="surface flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold leading-snug">{p.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {p.owner} · {p.event}
                    </p>
                  </div>
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-softer text-primary">
                    <Users className="size-5" />
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {p.needed.map((n) => (
                    <Badge key={n} variant="secondary">
                      {n}
                    </Badge>
                  ))}
                </div>

                <p className="mt-3 text-sm text-muted-foreground">{p.note}</p>

                <div className="mt-4">
                  <Progress value={((p.filled + (isJoined ? 1 : 0)) / p.slots) * 100} />
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {p.filled + (isJoined ? 1 : 0)} of {p.slots} slots filled
                  </p>
                </div>

                <Button
                  className="mt-4"
                  variant={isJoined ? "secondary" : "default"}
                  onClick={() => {
                    setJoined((prev) =>
                      isJoined ? prev.filter((i) => i !== p.id) : [...prev, p.id],
                    );
                    toast(isJoined ? "Request withdrawn" : "Join request sent");
                  }}
                >
                  {isJoined ? "Request sent" : "Request to join"}
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
