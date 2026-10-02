import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  DoorOpen,
  FileText,
  LogOut,
  Plus,
  Share2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRoomFiles, useRooms } from "@/hooks/use-rooms";

export const Route = createFileRoute("/_authenticated/rooms")({
  head: () => ({
    meta: [
      { title: "Class Rooms · Civora" },
      {
        name: "description",
        content:
          "Join or create a live study Room with any class code to share notes and browse subject chapters.",
      },
    ],
  }),
  component: RoomsPage,
});

export function RoomsPage() {
  const { rooms, activeRoom, isLoading, setActiveId, join, leave } = useRooms();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [subject, setSubject] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  // Upload/share note form
  const [noteForm, setNoteForm] = useState({
    title: "",
    subject: "Programming for Problem Solving (PPS)",
    chapter: "Chapter 1: Basics & Foundations",
    fileType: "Notes PDF",
  });

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
  }, [files, subject]);

  function handleShareNote() {
    if (!noteForm.title.trim()) {
      toast("Please provide a title for the study resource");
      return;
    }

    files.addFile.mutate(
      {
        title: noteForm.title.trim(),
        subject: noteForm.subject,
        chapter: noteForm.chapter,
        file_type: noteForm.fileType,
        size_label: "1.2 MB",
        uploaded_by: "You",
      },
      {
        onSuccess: () => {
          toast.success(`Shared "${noteForm.title}" in ${noteForm.subject}`);
          setUploadOpen(false);
          setNoteForm({
            title: "",
            subject: "Programming for Problem Solving (PPS)",
            chapter: "Chapter 1: Basics & Foundations",
            fileType: "Notes PDF",
          });
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function copyRoomCode(roomCode: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomCode);
      toast.success(`Room code "${roomCode}" copied to clipboard!`);
    } else {
      toast(`Room code: ${roomCode}`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Real-time Class Collaboration"
        title="Class Rooms"
        description="Enter any class code to instantly open or join a shared study Room with your classmates."
        actions={
          activeRoom ? (
            <Button variant="outline" size="sm" onClick={() => copyRoomCode(activeRoom.code)}>
              <Copy className="size-4" /> Share Code: {activeRoom.code}
            </Button>
          ) : undefined
        }
      />

      {/* Enter or Create Room */}
      <section className="surface p-6">
        <h2 className="font-display text-lg font-semibold">Join or Create a Room</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Type any class code (e.g.{" "}
          <span className="font-mono text-primary font-medium">CSE-2026</span>,{" "}
          <span className="font-mono text-primary font-medium">PPS-HUB</span>, or{" "}
          <span className="font-mono text-primary font-medium">MATH-KLRCET</span>). Everyone using
          the same code enters the same Room.
        </p>

        <form
          className="mt-4 grid max-w-xl gap-2 sm:grid-cols-[1fr_1fr_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            join.mutate(
              { code, name },
              {
                onSuccess: () => {
                  toast.success(`Entered Room ${code.toUpperCase()}`);
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
            onChange={(e) =>
              setCode(
                e.target.value
                  .toUpperCase()
                  .replace(/[^A-Z0-9-]/g, "")
                  .slice(0, 20),
              )
            }
            placeholder="e.g. CSE-2026"
            className="font-mono uppercase font-semibold"
            aria-label="Room code"
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="Room title (optional)"
            aria-label="Room title"
          />
          <Button type="submit" disabled={join.isPending || code.length < 3}>
            <DoorOpen className="size-4" /> {join.isPending ? "Entering…" : "Enter Room"}
          </Button>
        </form>
      </section>

      {/* Joined Rooms List */}
      <section className="surface p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Active Session Rooms</h2>
          <span className="text-xs text-muted-foreground">{rooms.length} available</span>
        </div>

        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading rooms…</p>
        ) : rooms.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            You haven't joined any Rooms yet. Type a code above!
          </p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2.5">
            {rooms.map((r) => {
              const active = r.id === activeRoom?.id;
              return (
                <li
                  key={r.id}
                  className={`flex flex-wrap items-center gap-3 rounded-lg border p-3.5 transition-colors ${
                    active ? "border-primary bg-primary/5 shadow-soft" : "border-border"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm">{r.name}</p>
                      {active && <Badge className="bg-primary text-xs">Active Room</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      Code: <span className="font-mono font-bold text-foreground">{r.code}</span>
                      {r.description && ` · ${r.description}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyRoomCode(r.code)}
                      title="Copy room code"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                    {!active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setActiveId(r.id);
                          setSubject(null);
                        }}
                      >
                        <Check className="size-3.5" /> Switch
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
                      <LogOut className="size-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Active Room Subject Files and Collaboration Board */}
      {activeRoom && (
        <section className="surface p-6 space-y-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-primary font-bold">
                  {activeRoom.code}
                </Badge>
                <h2 className="font-display text-xl font-bold">{activeRoom.name}</h2>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Classroom study materials, chapter notes, and shared syllabus resources.
              </p>
            </div>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 self-start sm:self-auto">
                  <Plus className="size-4" /> Share Material
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Share study material with Room</DialogTitle>
                  <DialogDescription>
                    Upload or add a lecture note, cheatsheet, or lab manual for {activeRoom.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="note-title">Title / Topic</Label>
                    <Input
                      id="note-title"
                      placeholder="e.g. PPS Dynamic Memory Allocation Summary"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note-subj">Subject</Label>
                    <select
                      id="note-subj"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={noteForm.subject}
                      onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                    >
                      <option value="Programming for Problem Solving (PPS)">
                        Programming for Problem Solving (PPS)
                      </option>
                      <option value="Engineering Mathematics">Engineering Mathematics</option>
                      <option value="Engineering Physics">Engineering Physics</option>
                      <option value="English Communication">English Communication</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note-chapter">Chapter / Unit</Label>
                    <Input
                      id="note-chapter"
                      placeholder="e.g. Chapter 2: Pointers and Arrays"
                      value={noteForm.chapter}
                      onChange={(e) => setNoteForm({ ...noteForm, chapter: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note-type">Material Type</Label>
                    <select
                      id="note-type"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={noteForm.fileType}
                      onChange={(e) => setNoteForm({ ...noteForm, fileType: e.target.value })}
                    >
                      <option value="PDF Notes">PDF Notes</option>
                      <option value="Handwritten Notes">Handwritten Notes</option>
                      <option value="Lecture Slides">Lecture Slides</option>
                      <option value="Lab Record & Code">Lab Record &amp; Code</option>
                      <option value="Cheatsheet">Cheatsheet</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setUploadOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleShareNote}>Post to Room</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Subject view */}
          {subject === null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-base">Select a Subject to Browse</h3>
                <span className="text-xs text-muted-foreground">{subjects.length} subjects</span>
              </div>

              {files.isLoading ? (
                <p className="text-sm text-muted-foreground">Loading subject files…</p>
              ) : subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground">No subjects found in this Room yet.</p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {subjects.map(([s, count]) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className="surface lift flex flex-col justify-between p-4 text-left border border-border hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <span className="status-glow flex size-10 items-center justify-center rounded-lg bg-primary-softer text-primary">
                          <BookOpen className="size-5" />
                        </span>
                        <Badge variant="secondary" className="text-xs">
                          {count} {count === 1 ? "file" : "files"}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <span className="block font-semibold text-sm leading-snug">{s}</span>
                        <span className="mt-1 flex items-center text-xs text-primary font-medium">
                          Browse chapters <ChevronRight className="size-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="sm" onClick={() => setSubject(null)}>
                  <ArrowLeft className="size-4" /> All subjects
                </Button>
                <span className="text-muted-foreground">/</span>
                <h3 className="font-display text-lg font-bold">{subject}</h3>
              </div>

              <div className="flex flex-col gap-6">
                {chapters.map(([ch, list]) => (
                  <div key={ch} className="space-y-2.5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      {ch}
                    </p>
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {list.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-start gap-3 rounded-lg border border-border bg-card/70 p-3.5 transition-colors hover:border-primary/40"
                        >
                          <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold leading-tight">{f.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">
                              {f.file_type} · {f.size_label} · By {f.uploaded_by}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="size-8 p-0"
                            onClick={() => toast(`Downloading ${f.title}`)}
                            title="Download resource"
                          >
                            <Share2 className="size-3.5 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
export default RoomsPage;
