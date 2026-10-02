import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowRight, GitBranch } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { subjects } from "@/data/demo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/prerequisites")({
  head: () => ({
    meta: [
      { title: "Prerequisite Finder · Civora" },
      {
        name: "description",
        content:
          "Trace which subjects you need before a course and which courses it unlocks later in the degree.",
      },
      { property: "og:title", content: "Prerequisite Finder · Civora" },
      {
        property: "og:description",
        content: "Map subject prerequisites and the courses they unlock.",
      },
    ],
  }),
  component: Prerequisites,
});

function Prerequisites() {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(subjects[4]!.id);

  const list = useMemo(
    () => subjects.filter((s) => (s.name + s.code).toLowerCase().includes(query.toLowerCase())),
    [query],
  );

  const selected = subjects.find((s) => s.id === selectedId)!;
  const byCode = (code: string) => subjects.find((s) => s.code === code);

  function chainFor(code: string, seen = new Set<string>()): string[] {
    const subject = byCode(code);
    if (!subject) return [];
    const out: string[] = [];
    for (const p of subject.prerequisites) {
      if (seen.has(p)) continue;
      seen.add(p);
      out.push(...chainFor(p, seen), p);
    }
    return out;
  }

  const chain = [...new Set(chainFor(selected.code))];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Plan your degree"
        title="Prerequisite Finder"
        description="Pick a subject to see the full chain of what comes before it and what it opens up."
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-4">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search subject or code"
            className="sm:max-w-none"
          />
          {list.length === 0 ? (
            <EmptyState message="No subject matches that search." />
          ) : (
            <ul className="space-y-2">
              {list.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setSelectedId(s.id)}
                    className={cn(
                      "w-full rounded-xl border px-4 py-3 text-left transition-colors",
                      s.id === selectedId
                        ? "border-primary bg-primary-softer"
                        : "border-border bg-card hover:border-primary/40",
                    )}
                  >
                    <p className="text-xs font-semibold text-primary">{s.code}</p>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Sem {s.semester} · {s.credits} credits
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-5">
          <section className="surface p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary">
                <GitBranch className="size-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold">{selected.name}</h2>
                <p className="text-sm text-muted-foreground">
                  {selected.code} · Semester {selected.semester} · {selected.credits} credits
                </p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {selected.difficulty}
              </Badge>
            </div>
          </section>

          <section className="surface p-6">
            <h3 className="font-semibold">Required before this</h3>
            {chain.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                No prerequisites — you can take this whenever it is offered.
              </p>
            ) : (
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {chain.map((code) => (
                  <span key={code} className="flex items-center gap-2">
                    <span className="rounded-lg border border-border bg-muted px-3 py-1.5 text-sm font-medium">
                      {code} · {byCode(code)?.name}
                    </span>
                    <ArrowRight className="size-4 text-muted-foreground" />
                  </span>
                ))}
                <span className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground">
                  {selected.code}
                </span>
              </div>
            )}
          </section>

          <section className="surface p-6">
            <h3 className="font-semibold">This unlocks</h3>
            {selected.unlocks.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                This is a terminal elective — nothing depends on it.
              </p>
            ) : (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {selected.unlocks.map((code) => {
                  const s = byCode(code);
                  return (
                    <button
                      key={code}
                      onClick={() => s && setSelectedId(s.id)}
                      className="rounded-xl border border-border p-4 text-left transition-colors hover:border-primary/50 hover:bg-muted"
                    >
                      <p className="text-xs font-semibold text-primary">{code}</p>
                      <p className="text-sm font-medium">{s?.name}</p>
                      <p className="text-xs text-muted-foreground">Semester {s?.semester}</p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
