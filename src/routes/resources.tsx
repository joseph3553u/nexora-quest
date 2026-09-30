import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bookmark, Download, Star, Upload } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { resources } from "@/data/demo";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/resources")({
  head: () => ({
    meta: [
      { title: "Resource Library · Nexora" },
      {
        name: "description",
        content: "Notes, books, slides and cheatsheets shared by students and faculty, filtered by subject and semester.",
      },
      { property: "og:title", content: "Resource Library · Nexora" },
      {
        property: "og:description",
        content: "Search notes, books, slides and cheatsheets by subject and semester.",
      },
    ],
  }),
  component: Resources,
});

const types = ["All", "Notes", "Book", "Slides", "Video", "Cheatsheet"];

function Resources() {
  const [type, setType] = useState("All");
  const [semester, setSemester] = useState("all");
  const [sort, setSort] = useState("popular");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<string[]>(["r2"]);

  const semesters = useMemo(() => [...new Set(resources.map((r) => r.semester))].sort(), []);

  const list = useMemo(() => {
    const filtered = resources.filter(
      (r) =>
        (type === "All" || r.type === type) &&
        (semester === "all" || r.semester === semester) &&
        (r.title + r.subject + r.author).toLowerCase().includes(query.toLowerCase()),
    );
    return [...filtered].sort((a, b) =>
      sort === "popular" ? b.downloads - a.downloads : b.rating - a.rating,
    );
  }, [type, semester, sort, query]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Shared knowledge"
        title="Resource Library"
        description="Curated study material from your seniors, classmates and faculty."
        actions={
          <Button onClick={() => toast("Upload flow coming soon")}>
            <Upload className="size-4" /> Upload resource
          </Button>
        }
      />

      <div className="surface flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchField value={query} onChange={setQuery} placeholder="Search by title or subject" />
          <div className="flex gap-3 sm:ml-auto">
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {semesters.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most downloaded</SelectItem>
                <SelectItem value="rating">Highest rated</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <FilterChips options={types} value={type} onChange={setType} />
      </div>

      {list.length === 0 ? (
        <EmptyState message="Try a different subject, type or semester." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((r) => {
            const isSaved = saved.includes(r.id);
            return (
              <article key={r.id} className="surface lift flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="secondary">{r.type}</Badge>
                  <button
                    onClick={() =>
                      setSaved((prev) =>
                        isSaved ? prev.filter((i) => i !== r.id) : [...prev, r.id],
                      )
                    }
                    aria-label="Save resource"
                    className="text-muted-foreground transition-colors hover:text-primary"
                  >
                    <Bookmark className={cn("size-4.5", isSaved && "fill-primary text-primary")} />
                  </button>
                </div>
                <h3 className="mt-3 font-semibold leading-snug">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.subject} · {r.semester} · {r.author}
                </p>
                <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Star className="size-4 fill-warning text-warning" /> {r.rating}
                    <span className="ml-2">{r.downloads.toLocaleString()} downloads</span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast(`Downloading “${r.title}”`)}
                  >
                    <Download className="size-4" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
