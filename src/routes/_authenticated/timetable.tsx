import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useRef, useState } from "react";
import {
  Bell,
  BellOff,
  CalendarDays,
  Clock,
  LoaderCircle,
  Plus,
  Trash2,
  CalendarCheck,
  MapPin,
  Sparkles,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText } from "@/lib/pdf";
import { parseTimetable } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable & Schedule · Civora" },
      {
        name: "description",
        content:
          "Weekly class schedule, today's upcoming lectures, and browser notification reminders.",
      },
    ],
  }),
  component: Timetable,
});

const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

type ClassRow = {
  id: string;
  subject: string;
  weekday: number;
  starts_at: string;
  ends_at: string | null;
  location: string;
  remind_minutes: number;
  reminder_enabled: boolean;
};

const STORAGE_KEY = "civora_timetable_classes";

const DEFAULT_KLRCET_CLASSES: ClassRow[] = [
  // Monday
  {
    id: "klr-mon-1",
    subject: "Engineering Physics",
    weekday: 1,
    starts_at: "09:30:00",
    ends_at: "10:30:00",
    location: "Block A - Room 204",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  {
    id: "klr-mon-2",
    subject: "Engineering Mathematics",
    weekday: 1,
    starts_at: "10:30:00",
    ends_at: "11:30:00",
    location: "Block A - Room 204",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  {
    id: "klr-mon-3",
    subject: "Programming for Problem Solving (PPS)",
    weekday: 1,
    starts_at: "11:45:00",
    ends_at: "12:45:00",
    location: "CSE Computing Lab 2",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  {
    id: "klr-mon-4",
    subject: "English Communication Skills",
    weekday: 1,
    starts_at: "14:00:00",
    ends_at: "15:00:00",
    location: "Digital Language Lab",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  // Tuesday
  {
    id: "klr-tue-1",
    subject: "Programming for Problem Solving (PPS) Lab",
    weekday: 2,
    starts_at: "09:30:00",
    ends_at: "12:30:00",
    location: "KLRCET Central Computing Center",
    remind_minutes: 15,
    reminder_enabled: true,
  },
  {
    id: "klr-tue-2",
    subject: "Engineering Mathematics",
    weekday: 2,
    starts_at: "13:30:00",
    ends_at: "14:30:00",
    location: "Block A - Room 204",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  {
    id: "klr-tue-3",
    subject: "Engineering Physics",
    weekday: 2,
    starts_at: "14:30:00",
    ends_at: "15:30:00",
    location: "Block B - Physics Lab",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  // Wednesday
  {
    id: "klr-wed-1",
    subject: "Basic Electrical & Electronics",
    weekday: 3,
    starts_at: "09:30:00",
    ends_at: "10:30:00",
    location: "Block C - Room 302",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  {
    id: "klr-wed-2",
    subject: "English Communication Skills",
    weekday: 3,
    starts_at: "10:30:00",
    ends_at: "11:30:00",
    location: "Digital Language Lab",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  {
    id: "klr-wed-3",
    subject: "Programming for Problem Solving (PPS)",
    weekday: 3,
    starts_at: "11:45:00",
    ends_at: "12:45:00",
    location: "Block A - Room 204",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  // Thursday
  {
    id: "klr-thu-1",
    subject: "Engineering Mathematics",
    weekday: 4,
    starts_at: "09:30:00",
    ends_at: "10:30:00",
    location: "Block A - Room 204",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  {
    id: "klr-thu-2",
    subject: "Engineering Physics Lab Experiments",
    weekday: 4,
    starts_at: "10:30:00",
    ends_at: "13:30:00",
    location: "Physics Laboratory Complex",
    remind_minutes: 15,
    reminder_enabled: true,
  },
  // Friday
  {
    id: "klr-fri-1",
    subject: "Programming for Problem Solving (PPS)",
    weekday: 5,
    starts_at: "09:30:00",
    ends_at: "10:30:00",
    location: "CSE Computing Lab 1",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  {
    id: "klr-fri-2",
    subject: "Engineering Mathematics",
    weekday: 5,
    starts_at: "10:30:00",
    ends_at: "11:30:00",
    location: "Block A - Room 204",
    remind_minutes: 10,
    reminder_enabled: true,
  },
  {
    id: "klr-fri-3",
    subject: "English Language Interactive Practice",
    weekday: 5,
    starts_at: "13:30:00",
    ends_at: "15:30:00",
    location: "Interactive Language Center",
    remind_minutes: 10,
    reminder_enabled: true,
  },
];

function getStoredClasses(): ClassRow[] {
  if (typeof window === "undefined") return DEFAULT_KLRCET_CLASSES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_KLRCET_CLASSES));
      return DEFAULT_KLRCET_CLASSES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_KLRCET_CLASSES;
  }
}

function saveStoredClasses(classes: ClassRow[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
  } catch {
    // Ignore
  }
}

function formatTime(timeStr: string) {
  const parts = timeStr.split(":");
  if (parts.length < 2) return timeStr;
  const h = Number(parts[0]);
  const m = parts[1];
  const ampm = h >= 12 ? "PM" : "AM";
  const displayH = h % 12 || 12;
  return `${displayH}:${m} ${ampm}`;
}

export function Timetable() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [minutes, setMinutes] = useState("10");
  const [addOpen, setAddOpen] = useState(false);
  const parse = useServerFn(parseTimetable);

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    subject: "",
    weekday: "1", // Monday
    startTime: "09:30",
    endTime: "10:30",
    location: "Room 204",
    remindMinutes: "10",
  });

  const { data: classes = [], isLoading } = useQuery({
    queryKey: ["timetable-classes"],
    queryFn: async (): Promise<ClassRow[]> => {
      let remoteClasses: ClassRow[] = [];
      try {
        const { data, error } = await backend
          .from("timetable_classes")
          .select("*")
          .order("weekday")
          .order("starts_at");
        if (!error && data && data.length > 0) {
          remoteClasses = data as ClassRow[];
        }
      } catch {
        // Fall back to local
      }

      const local = getStoredClasses();
      if (remoteClasses.length > 0) {
        // Merge without duplicating IDs
        const existingIds = new Set(remoteClasses.map((c) => c.id));
        const merged = [...remoteClasses, ...local.filter((c) => !existingIds.has(c.id))];
        saveStoredClasses(merged);
        return merged;
      }

      return local;
    },
  });

  // Calculate Today's Classes and Upcoming / Next class
  const now = new Date();
  const todayWeekday = now.getDay();
  const currentHours = String(now.getHours()).padStart(2, "0");
  const currentMinutes = String(now.getMinutes()).padStart(2, "0");
  const currentTimeStr = `${currentHours}:${currentMinutes}:00`;

  const todayClasses = useMemo(() => {
    return classes
      .filter((c) => c.weekday === todayWeekday)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  }, [classes, todayWeekday]);

  const { nextClass, isClassActive } = useMemo(() => {
    for (const c of todayClasses) {
      const ends = c.ends_at || c.starts_at;
      if (c.starts_at <= currentTimeStr && currentTimeStr <= ends) {
        return { nextClass: c, isClassActive: true };
      }
      if (c.starts_at > currentTimeStr) {
        return { nextClass: c, isClassActive: false };
      }
    }

    return { nextClass: null, isClassActive: false };
  }, [todayClasses, currentTimeStr]);

  async function importPdf(file?: File) {
    if (!file) return;
    setUploading(true);
    let path = "";
    let documentId = "";
    try {
      const text = await extractPdfText(file, 90_000);
      const parsed = await parse({ data: { text, fileName: file.name } });

      const newRows: ClassRow[] = parsed.classes.map((item, idx) => ({
        id: `pdf-${Date.now()}-${idx}`,
        subject: item.subject,
        weekday: item.weekday,
        starts_at: `${item.startTime}:00`,
        ends_at: item.endTime ? `${item.endTime}:00` : null,
        location: item.location || "KLRCET Campus",
        remind_minutes: Number(minutes),
        reminder_enabled: true,
      }));

      // Try persisting to Supabase if connected
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          path = `${user.id}/timetables/${crypto.randomUUID()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`;
          await backend.storage
            .from("civora-files")
            .upload(path, file, { contentType: "application/pdf", upsert: false });

          const { data: document } = await backend
            .from("timetable_documents")
            .insert({ user_id: user.id, title: file.name, storage_path: path })
            .select("id")
            .single();

          if (document) {
            documentId = document.id;
            await backend.from("timetable_classes").insert(
              newRows.map((r) => ({
                document_id: document.id,
                user_id: user.id,
                subject: r.subject,
                weekday: r.weekday,
                starts_at: r.starts_at,
                ends_at: r.ends_at,
                location: r.location,
                remind_minutes: r.remind_minutes,
                reminder_enabled: r.reminder_enabled,
              })),
            );
          }
        }
      } catch {
        // Fall back to local store
      }

      const updated = [...newRows, ...classes];
      saveStoredClasses(updated);
      await queryClient.invalidateQueries({ queryKey: ["timetable-classes"] });
      toast(`Imported ${newRows.length} classes from ${file.name}`);
    } catch (error) {
      if (documentId)
        await backend
          .from("timetable_documents")
          .delete()
          .eq("id", documentId)
          .catch(() => {});
      if (path)
        await backend.storage
          .from("civora-files")
          .remove([path])
          .catch(() => {});
      toast(error instanceof Error ? error.message : "Unable to import this timetable PDF");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleAddManualClass() {
    if (!manualForm.subject.trim()) {
      toast("Please enter a subject name");
      return;
    }

    const newClass: ClassRow = {
      id: `manual-${Date.now()}`,
      subject: manualForm.subject.trim(),
      weekday: Number(manualForm.weekday),
      starts_at: `${manualForm.startTime}:00`,
      ends_at: manualForm.endTime ? `${manualForm.endTime}:00` : null,
      location: manualForm.location.trim() || "KLRCET Campus",
      remind_minutes: Number(manualForm.remindMinutes),
      reminder_enabled: true,
    };

    // Try Supabase insert
    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await backend.from("timetable_classes").insert({
            user_id: user.id,
            subject: newClass.subject,
            weekday: newClass.weekday,
            starts_at: newClass.starts_at,
            ends_at: newClass.ends_at,
            location: newClass.location,
            remind_minutes: newClass.remind_minutes,
            reminder_enabled: true,
          });
        }
      } catch {
        // Saved in local storage
      }
    })();

    const updated = [newClass, ...classes];
    saveStoredClasses(updated);
    void queryClient.invalidateQueries({ queryKey: ["timetable-classes"] });

    toast(`Added ${newClass.subject} to ${weekdays[newClass.weekday]}`);
    setAddOpen(false);
    setManualForm({
      subject: "",
      weekday: "1",
      startTime: "09:30",
      endTime: "10:30",
      location: "Room 204",
      remindMinutes: "10",
    });
  }

  async function enableNotifications() {
    if (!("Notification" in window)) {
      toast("This browser does not support notifications.");
      return;
    }
    const permission = await Notification.requestPermission();
    toast(
      permission === "granted"
        ? "Browser reminders are enabled while Civora is open."
        : "Allow notifications in your browser settings to receive reminders.",
    );
  }

  async function toggleReminder(item: ClassRow) {
    const updated = classes.map((c) =>
      c.id === item.id ? { ...c, reminder_enabled: !c.reminder_enabled } : c,
    );
    saveStoredClasses(updated);

    try {
      await backend
        .from("timetable_classes")
        .update({
          reminder_enabled: !item.reminder_enabled,
          remind_minutes: Number(minutes),
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);
    } catch {
      // Local state already updated
    }

    await queryClient.invalidateQueries({ queryKey: ["timetable-classes"] });
    toast(item.reminder_enabled ? "Reminder disabled" : "Reminder active");
  }

  async function removeClass(item: ClassRow) {
    const updated = classes.filter((c) => c.id !== item.id);
    saveStoredClasses(updated);

    try {
      await backend.from("timetable_classes").delete().eq("id", item.id);
    } catch {
      // Local state already updated
    }

    await queryClient.invalidateQueries({ queryKey: ["timetable-classes"] });
    toast(`Removed ${item.subject}`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stay on schedule · KLRCET"
        title="Timetable & Schedule"
        description="Weekly class schedule for KLR College of Engineering and Technology. Enter classes manually or import a syllabus/timetable PDF."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="size-4" /> Add class manually
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add class to schedule</DialogTitle>
                  <DialogDescription>
                    Add a lecture, lab, or tutorial to your weekly timetable.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="m-subject">Subject</Label>
                    <Input
                      id="m-subject"
                      placeholder="e.g. Programming for Problem Solving (PPS)"
                      value={manualForm.subject}
                      onChange={(e) => setManualForm({ ...manualForm, subject: e.target.value })}
                    />
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[
                        "PPS",
                        "Engineering Mathematics",
                        "Engineering Physics",
                        "English Communication",
                      ].map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setManualForm({ ...manualForm, subject: s })}
                          className="rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-primary/10 hover:text-primary"
                        >
                          + {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="m-weekday">Day of Week</Label>
                      <select
                        id="m-weekday"
                        className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={manualForm.weekday}
                        onChange={(e) => setManualForm({ ...manualForm, weekday: e.target.value })}
                      >
                        <option value="1">Monday</option>
                        <option value="2">Tuesday</option>
                        <option value="3">Wednesday</option>
                        <option value="4">Thursday</option>
                        <option value="5">Friday</option>
                        <option value="6">Saturday</option>
                        <option value="0">Sunday</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="m-location">Room / Lab</Label>
                      <Input
                        id="m-location"
                        placeholder="e.g. CSE Lab 2"
                        value={manualForm.location}
                        onChange={(e) => setManualForm({ ...manualForm, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="m-start">Start Time</Label>
                      <Input
                        id="m-start"
                        type="time"
                        value={manualForm.startTime}
                        onChange={(e) =>
                          setManualForm({ ...manualForm, startTime: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="m-end">End Time</Label>
                      <Input
                        id="m-end"
                        type="time"
                        value={manualForm.endTime}
                        onChange={(e) => setManualForm({ ...manualForm, endTime: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="m-remind">Remind Before</Label>
                    <select
                      id="m-remind"
                      className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={manualForm.remindMinutes}
                      onChange={(e) =>
                        setManualForm({ ...manualForm, remindMinutes: e.target.value })
                      }
                    >
                      <option value="5">5 minutes before</option>
                      <option value="10">10 minutes before</option>
                      <option value="15">15 minutes before</option>
                      <option value="30">30 minutes before</option>
                    </select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddManualClass}>Save Class</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={enableNotifications}>
              <Bell className="size-4" /> Enable reminders
            </Button>
          </div>
        }
      />

      {/* Today's Schedule & Next Class Banner */}
      <section className="grid gap-4 md:grid-cols-3">
        <div className="surface p-5 md:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="status-glow flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <CalendarCheck className="size-4" />
              </span>
              <div>
                <h2 className="font-semibold text-base">
                  Today's Schedule ({weekdays[todayWeekday]})
                </h2>
                <p className="text-xs text-muted-foreground">
                  {todayClasses.length} {todayClasses.length === 1 ? "class" : "classes"} scheduled
                  for today
                </p>
              </div>
            </div>
            <Badge variant="outline" className="font-mono text-xs">
              {weekdays[todayWeekday]}
            </Badge>
          </div>

          {todayClasses.length === 0 ? (
            <div className="mt-4 rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
              No classes scheduled for today ({weekdays[todayWeekday]}). Enjoy your study break or
              review lessons!
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {todayClasses.map((item) => {
                const isCurrent =
                  currentTimeStr >= item.starts_at &&
                  currentTimeStr <= (item.ends_at || item.starts_at);
                const isUpcoming = currentTimeStr < item.starts_at;

                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      isCurrent
                        ? "border-primary bg-primary/10 shadow-soft"
                        : "border-border bg-card/60"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{item.subject}</span>
                        {isCurrent && (
                          <Badge className="bg-primary text-[10px] text-primary-foreground">
                            In progress
                          </Badge>
                        )}
                        {isUpcoming && nextClass?.id === item.id && (
                          <Badge variant="secondary" className="text-[10px]">
                            Next class
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="size-3" />
                        <span>
                          {formatTime(item.starts_at)}{" "}
                          {item.ends_at && `– ${formatTime(item.ends_at)}`}
                        </span>
                        {item.location && (
                          <>
                            <span>·</span>
                            <MapPin className="size-3" />
                            <span>{item.location}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Next upcoming class spotlight */}
        <div className="surface flex flex-col justify-between p-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
              <Sparkles className="size-3.5" /> Upcoming Highlight
            </div>
            {nextClass ? (
              <div className="mt-3">
                <Badge variant={isClassActive ? "default" : "secondary"} className="mb-2">
                  {isClassActive ? "Happening Now" : "Next Class"}
                </Badge>
                <h3 className="font-display font-semibold text-lg leading-tight">
                  {nextClass.subject}
                </h3>
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  {formatTime(nextClass.starts_at)}
                  {nextClass.ends_at ? ` – ${formatTime(nextClass.ends_at)}` : ""}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" /> {nextClass.location}
                </p>
              </div>
            ) : (
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium">All classes completed</p>
                <p className="mt-1 text-xs">
                  You are all caught up for today! Review notes or check your course progress.
                </p>
              </div>
            )}
          </div>
          <div className="mt-4 border-t border-border pt-3">
            <span className="text-[11px] text-muted-foreground">
              Reminders active in this tab via Web Notifications.
            </span>
          </div>
        </div>
      </section>

      {/* PDF Upload Section */}
      <section className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="timetable-file">Import Timetable / Syllabus PDF</Label>
          <Input
            id="timetable-file"
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            disabled={uploading}
            onChange={(event) => void importPdf(event.target.files?.[0])}
          />
          <p className="text-xs text-muted-foreground">
            Upload any college timetable PDF. Gemini extracts days, subjects, and lab sessions
            automatically.
          </p>
        </div>
        <div className="w-full space-y-2 sm:w-48">
          <Label htmlFor="reminder-minutes">Default Reminder</Label>
          <select
            id="reminder-minutes"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          >
            <option value="0">At class time</option>
            <option value="5">5 minutes before</option>
            <option value="10">10 minutes before</option>
            <option value="15">15 minutes before</option>
            <option value="30">30 minutes before</option>
          </select>
        </div>
        {uploading && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin text-primary" /> Parsing PDF with AI…
          </span>
        )}
      </section>

      {/* Weekly Schedule list */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display font-semibold text-lg">Full Weekly Timetable</h2>
          <span className="text-xs text-muted-foreground">{classes.length} classes total</span>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading schedule…</p>
        ) : classes.length === 0 ? (
          <div className="surface p-8 text-center text-sm text-muted-foreground">
            No classes found. Click &quot;Add class manually&quot; or upload a timetable PDF.
          </div>
        ) : (
          <section className="surface divide-y divide-border">
            {classes.map((item) => (
              <article key={item.id} className="flex flex-wrap items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{item.subject}</p>
                    <Badge variant="outline" className="text-[11px]">
                      {weekdays[item.weekday]}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatTime(item.starts_at)}
                    {item.ends_at ? ` – ${formatTime(item.ends_at)}` : ""}
                    {item.location ? ` · ${item.location}` : ""}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3.5" /> {item.remind_minutes}m alert
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void toggleReminder(item)}
                  aria-label={item.reminder_enabled ? "Disable reminder" : "Enable reminder"}
                >
                  {item.reminder_enabled ? (
                    <Bell className="size-4 text-primary" />
                  ) : (
                    <BellOff className="size-4" />
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => void removeClass(item)}
                  aria-label="Remove class"
                >
                  <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                </Button>
              </article>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
export default Timetable;
