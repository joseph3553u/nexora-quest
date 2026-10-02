import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, BookOpen, Check, ChevronRight, DoorOpen, FileText, LogOut } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRoomFiles, useRooms } from "@/hooks/use-rooms";

export const Route = createFileRoute("/_authenticated/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms — Civora" },
      { name: "description", content: "Create or join a class Room with a code and browse subject files by chapter." },
      { property: "og:title", content: "Rooms — Civora" },
      { property: "og:description", content: "Create or join a class Room with a code and browse subject files by chapter." },
    ],
  }),
  component: RoomsPage,
});

function RoomsPage() {
  const { rooms, activeRoom, isLoading, setActiveId, join, leave } = useRooms();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const files = useRoomFiles(activeRoom?.id);

  const subjects = useMemo(() => {
    const map = new Map<string, number>();
    for (const f of files.data ?? []) map.set(f.subject, (map.get(f.subject) ?? 0) + 1);
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [files.data]);

  const chapters = useMemo(() => {
    const map = new Map<string, NonNullable<typeof files.data>>();
    for (const f of (files.data ?? []).filter((f) => f.subject === subject)) {
      map.set(f.chapter, [...(map.get(f.chapter) ?? []), f]);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [files.data, subject]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Rooms" description="Create or join a class Room — everyone using the same code lands in the same Room." />

      <section className="surface p-6">
        <h2 className="font-display text-lg font-semibold">Create or join a Room</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Type any code. If it exists you'll join it; if not, a new Room is created for your class. Demo:{" "}
          <span className="font-mono font-semibold text-primary">KLRCSE</span>
        </p>
        <form
          className="mt-4 grid max-w-xl gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            join.mutate(
              { code, name },
              {
                onSuccess: () => {
                  toast.success("You're in the Room");
                  setCode("");
                  setName("");
                  setSubject(null);
                },
                onError: (err) => toast.error(err.message),
              },
            );
          }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 20))}
            placeholder="Room code"
            className="font-mono uppercase"
            aria-label="Room code"
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="Room name (if new)"
            aria-label="Room name"
          />
          <Button type="submit" disabled={join.isPending || code.length < 3}>
            <DoorOpen className="size-4" /> {join.isPending ? "Joining…" : "Enter"}
          </Button>
        </form>
      </section>

      <section className="surface p-6">
        <h2 className="font-display text-lg font-semibold">My Rooms</h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : rooms.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">You haven't joined any Rooms yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {rooms.map((r) => {
              const active = r.id === activeRoom?.id;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {r.name} {active && <Badge className="ml-2">Active</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      Code <span className="font-mono">{r.code}</span>
                      {r.description && ` · ${r.description}`}
                    </p>
                  </div>
                  {!active && (
                    <Button variant="outline" size="sm" onClick={() => { setActiveId(r.id); setSubject(null); }}>
                      <Check className="size-4" /> Switch
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      leave.mutate(r.id, {
                        onSuccess: () => toast(`Left ${r.name}`),
                        onError: (err) => toast.error(err.message),
                      })
                    }
                  >
                    <LogOut className="size-4" /> Leave Room
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {activeRoom && (
        <section className="surface p-6">
          {subject === null ? (
            <>
              <h2 className="font-display text-lg font-semibold">{activeRoom.name} · Subjects</h2>
              {files.isLoading ? (
                <p className="mt-3 text-sm text-muted-foreground">Loading subjects…</p>
              ) : subjects.length === 0 ? (
                <p className="mt-3 text-sm text-muted-foreground">No subjects in this Room yet.</p>
              ) : (
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {subjects.map(([s, count]) => (
                    <li key={s}>
                      <button
                        onClick={() => setSubject(s)}
                        className="flex w-full items-center gap-3 rounded-md border border-border p-4 text-left transition-colors hover:bg-muted"
                      >
                        <BookOpen className="size-5 shrink-0 text-primary" />
                        <span className="min-w-0 flex-1">
                          <span className="block font-medium">{s}</span>
                          <span className="text-xs text-muted-foreground">{count} files</span>
                        </span>
                        <ChevronRight className="size-4 text-muted-foreground" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={() => setSubject(null)}>
                <ArrowLeft className="size-4" /> All subjects
              </Button>
              <h2 className="mt-2 font-display text-lg font-semibold">{subject}</h2>
              <div className="mt-4 flex flex-col gap-5">
                {chapters.map(([ch, list]) => (
                  <div key={ch}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">{ch}</p>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {list.map((f) => (
                        <li key={f.id} className="flex gap-3 rounded-md border border-border p-3">
                          <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{f.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {f.file_type} · {f.size_label} · {f.uploaded_by}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      )}
    </div>
  );
}
