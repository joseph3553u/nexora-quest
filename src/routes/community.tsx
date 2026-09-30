import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, EmptyState } from "@/components/common/FilterBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { posts as seed, student, type Post } from "@/data/demo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/community")({
  head: () => ({
    meta: [
      { title: "Student Community · Nexora" },
      {
        name: "description",
        content: "Ask questions, share wins and keep up with what your batch is talking about.",
      },
      { property: "og:title", content: "Student Community · Nexora" },
      {
        property: "og:description",
        content: "Spaces for academics, placements, competitions and projects.",
      },
    ],
  }),
  component: Community,
});

const spaces = ["All", "Academics", "Placements", "Competitions", "Projects"];

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

function Community() {
  const [items, setItems] = useState<Post[]>(seed);
  const [space, setSpace] = useState("All");
  const [draft, setDraft] = useState("");

  const list = useMemo(
    () => items.filter((p) => space === "All" || p.space === space),
    [items, space],
  );

  function publish() {
    if (!draft.trim()) {
      toast("Write something first");
      return;
    }
    setItems((prev) => [
      {
        id: `cm${Date.now()}`,
        author: student.name,
        role: `CSE · ${student.semester}`,
        space: space === "All" ? "Academics" : space,
        time: "now",
        body: draft.trim(),
        likes: 0,
        replies: 0,
        liked: false,
      },
      ...prev,
    ]);
    setDraft("");
    toast("Posted to the community");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your batch"
        title="Student Community"
        description="Threads from across departments. Post a question or share what you just learned."
      />

      <FilterChips options={spaces} value={space} onChange={setSpace} />

      <div className="surface p-5">
        <div className="flex gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-accent-foreground">
              {initials(student.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Share an update, a question or a resource…"
              rows={3}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Posting to {space === "All" ? "Academics" : space}
              </p>
              <Button onClick={publish}>
                <Send className="size-4" /> Post
              </Button>
            </div>
          </div>
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState message="No posts in this space yet." />
      ) : (
        <div className="space-y-4">
          {list.map((p) => (
            <article key={p.id} className="surface p-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-muted text-xs font-semibold">
                    {initials(p.author)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{p.author}</p>
                  <p className="text-xs text-muted-foreground">
                    {p.role} · {p.time}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {p.space}
                </Badge>
              </div>
              <p className="mt-3 text-sm leading-relaxed">{p.body}</p>
              <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
                <button
                  className={cn(
                    "flex items-center gap-1.5 transition-colors hover:text-primary",
                    p.liked && "text-primary",
                  )}
                  onClick={() =>
                    setItems((prev) =>
                      prev.map((x) =>
                        x.id === p.id
                          ? { ...x, liked: !x.liked, likes: x.likes + (x.liked ? -1 : 1) }
                          : x,
                      ),
                    )
                  }
                >
                  <Heart className={cn("size-4", p.liked && "fill-primary")} /> {p.likes}
                </button>
                <button
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                  onClick={() => toast("Replies are coming soon")}
                >
                  <MessageCircle className="size-4" /> {p.replies}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
