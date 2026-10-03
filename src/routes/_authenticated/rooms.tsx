import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowLeftRight,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  DoorOpen,
  FileText,
  LogOut,
  Plus,
  Share2,
  Sparkles,
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
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Peer Collaboration Spaces"
        title="Class Rooms"
        description="Enter any shared class code to instantly open or join a real-time study hub with your batchmates."
        actions={
          activeRoom ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyRoomCode(activeRoom.code)}
              className="gap-1.5 h-9 text-xs border-primary/30 bg-primary/10 text-primary font-mono font-semibold"
            >
              <Copy className="size-3.5" /> Code: {activeRoom.code}
            </Button>
          ) : undefined
        }
      />

      {/* 1-on-1 Skill Swapper Room Spotlight */}
      <section className="surface p-5 sm:p-6 rounded-3xl border-2 border-primary/30 bg-primary/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-soft">
        <div className="flex items-start gap-3.5">
          <span className="flex size-10 items-center justify-center rounded-2xl bg-primary/20 text-primary shrink-0 mt-0.5">
            <ArrowLeftRight className="size-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-foreground">
                Looking for 1-on-1 Peer Skill Swapping?
              </h2>
              <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                NEW
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground max-w-xl">
              Connect with a partner in an individual room environment to spend 1 hour daily
              teaching each other your best skills, keep your streak alive, and earn Skill Swapper
              Points.
            </p>
          </div>
        </div>

        <Button asChild className="h-9.5 px-4 font-semibold text-xs shrink-0 rounded-xl gap-2">
          <Link to="/skill-swapper">
            <span>Launch Skill Swapper</span>
            <DoorOpen className="size-4" />
          </Link>
        </Button>
      </section>

      {/* Enter or Create Room */}
      <section className="surface p-6 sm:p-7 relative overflow-hidden">
        <div className="flex items-center gap-2 mb-1">
          <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <DoorOpen className="size-4" />
          </span>
          <h2 className="font-display text-lg font-bold text-foreground">Join or Launch a Room</h2>
        </div>
        <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
          Enter any class code (e.g.{" "}
          <span className="font-mono text-primary font-semibold">CSE-2026</span>,{" "}
          <span className="font-mono text-primary font-semibold">PPS-HUB</span>, or{" "}
          <span className="font-mono text-primary font-semibold">MATH-KLRCET</span>). Classmates
          using the same code enter the same synchronized study room.
        </p>

        <form
          className="mt-5 grid max-w-xl gap-2.5 sm:grid-cols-[1fr_1fr_auto]"
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
            className="font-mono uppercase font-bold tracking-wider h-10"
            aria-label="Room code"
          />
          <Input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="Room title (optional)"
            className="h-10 text-xs sm:text-sm"
            aria-label="Room title"
          />
          <Button
            type="submit"
            disabled={join.isPending || code.length < 3}
            className="h-10 gap-1.5 font-semibold text-xs sm:text-sm"
          >
            <DoorOpen className="size-4" /> {join.isPending ? "Entering…" : "Enter Room"}
          </Button>
        </form>
      </section>

      {/* Joined Rooms List */}
      <section className="surface p-6 sm:p-7 space-y-4">
        <div className="flex items-center justify-between border-b border-border/50 pb-3">
          <h2 className="font-display text-base font-bold text-foreground">Active Session Rooms</h2>
          <span className="text-xs font-mono text-muted-foreground">{rooms.length} available</span>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground py-4">Loading active rooms…</p>
        ) : rooms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
            You haven't joined any Rooms yet. Type a class code above to start!
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((r) => {
              const active = r.id === activeRoom?.id;
              return (
                <li
                  key={r.id}
                  className={`surface lift flex flex-col justify-between p-4.5 transition-all ${
                    active ? "border-primary/60 bg-primary/5 shadow-soft" : "border-border/70"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-display font-bold text-sm text-foreground truncate">
                        {r.name}
                      </p>
                      {active && (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                          <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1.5 truncate text-xs text-muted-foreground">
                      Code: <span className="font-mono font-bold text-foreground">{r.code}</span>
                      {r.description && ` · ${r.description}`}
                    </p>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1 px-2"
                      onClick={() => copyRoomCode(r.code)}
                      title="Copy room code"
                    >
                      <Copy className="size-3" /> Copy
                    </Button>
                    <div className="flex items-center gap-1.5">
                      {!active && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs px-2.5 font-medium"
                          onClick={() => {
                            setActiveId(r.id);
                            setSubject(null);
                          }}
                        >
                          <Check className="size-3 mr-1 text-primary" /> Switch
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          leave.mutate(r.id, {
                            onSuccess: () => toast(`Left ${r.name}`),
                            onError: (err) => toast.error(err.message),
                          })
                        }
                      >
                        <LogOut className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Active Room Subject Files and Collaboration Board */}
      {activeRoom && (
        <section className="surface p-6 sm:p-7 space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/60 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-primary font-bold text-xs">
                  {activeRoom.code}
                </Badge>
                <h2 className="font-display text-xl font-bold text-foreground">
                  {activeRoom.name}
                </h2>
              </div>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Classroom study materials, chapter notes, and shared syllabus resources.
              </p>
            </div>

            <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
              <DialogTrigger asChild>
                <Button className="gap-1.5 self-start sm:self-auto h-9 font-semibold text-xs sm:text-sm">
                  <Plus className="size-4" /> Share Material
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md surface border-border/80">
                <DialogHeader>
                  <DialogTitle className="font-display">Share study material with Room</DialogTitle>
                  <DialogDescription className="text-xs">
                    Upload or add a lecture note, cheatsheet, or lab manual for {activeRoom.name}.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3.5 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="note-title" className="text-xs font-semibold">
                      Title / Topic
                    </Label>
                    <Input
                      id="note-title"
                      placeholder="e.g. PPS Dynamic Memory Allocation Summary"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                      className="h-9.5 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note-subj" className="text-xs font-semibold">
                      Subject
                    </Label>
                    <select
                      id="note-subj"
                      className="h-9.5 w-full rounded-lg border border-border/80 bg-card/60 px-3 text-xs sm:text-sm backdrop-blur-md"
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
                    <Label htmlFor="note-chapter" className="text-xs font-semibold">
                      Chapter / Unit
                    </Label>
                    <Input
                      id="note-chapter"
                      placeholder="e.g. Chapter 2: Pointers and Arrays"
                      value={noteForm.chapter}
                      onChange={(e) => setNoteForm({ ...noteForm, chapter: e.target.value })}
                      className="h-9.5 text-xs sm:text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="note-type" className="text-xs font-semibold">
                      Material Type
                    </Label>
                    <select
                      id="note-type"
                      className="h-9.5 w-full rounded-lg border border-border/80 bg-card/60 px-3 text-xs sm:text-sm backdrop-blur-md"
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
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setUploadOpen(false)}
                    className="h-9 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleShareNote} className="h-9 text-xs font-semibold">
                    Post to Room
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Subject view */}
          {subject === null ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-bold text-sm sm:text-base text-foreground">
                  Select a Subject to Browse
                </h3>
                <span className="text-xs font-mono text-muted-foreground">
                  {subjects.length} subjects
                </span>
              </div>

              {files.isLoading ? (
                <p className="text-xs text-muted-foreground py-4">Loading subject files…</p>
              ) : subjects.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/80 bg-muted/20 p-6 text-center text-xs text-muted-foreground">
                  No subjects found in this Room yet. Be the first to share!
                </div>
              ) : (
                <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
                  {subjects.map(([s, count]) => (
                    <button
                      key={s}
                      onClick={() => setSubject(s)}
                      className="surface lift flex flex-col justify-between p-5 text-left border border-border/70 hover:border-primary/50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between">
                        <span className="status-glow flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
                          <BookOpen className="size-5" />
                        </span>
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          {count} {count === 1 ? "file" : "files"}
                        </Badge>
                      </div>
                      <div className="mt-4">
                        <span className="block font-display font-bold text-sm leading-snug text-foreground group-hover:text-primary transition-colors">
                          {s}
                        </span>
                        <span className="mt-2 flex items-center text-xs text-primary font-medium gap-1">
                          Browse chapters <ChevronRight className="size-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSubject(null)}
                  className="h-8 gap-1.5 text-xs"
                >
                  <ArrowLeft className="size-3.5" /> All subjects
                </Button>
                <span className="text-muted-foreground">/</span>
                <h3 className="font-display text-base sm:text-lg font-bold text-foreground">
                  {subject}
                </h3>
              </div>

              <div className="flex flex-col gap-6">
                {chapters.map(([ch, list]) => (
                  <div key={ch} className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                      {ch}
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {list.map((f) => (
                        <div
                          key={f.id}
                          className="flex items-start gap-3 rounded-xl border border-border/70 bg-card/70 p-4 transition-all duration-150 hover:border-primary/40 hover:bg-card"
                        >
                          <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
                            <FileText className="size-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-bold leading-tight text-foreground truncate">
                              {f.title}
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {f.file_type} · {f.size_label} · Uploaded by {f.uploaded_by}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 shrink-0 rounded-lg text-muted-foreground hover:text-primary"
                            onClick={() => toast(`Downloading ${f.title}`)}
                            title="Download resource"
                          >
                            <Share2 className="size-3.5" />
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
