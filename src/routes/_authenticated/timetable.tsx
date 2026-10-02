import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Bell, BellOff, CalendarDays, Clock, LoaderCircle, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText } from "@/lib/pdf";
import { parseTimetable } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/timetable")({
  head: () => ({ meta: [{ title: "Timetable & Reminders · Civora" }] }),
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

function Timetable() {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [minutes, setMinutes] = useState("10");
  const parse = useServerFn(parseTimetable);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["timetable-classes"],
    queryFn: async () => {
      const { data: classes, error } = await backend
        .from("timetable_classes")
        .select("*")
        .order("weekday")
        .order("starts_at");
      if (error) throw error;
      return (classes ?? []) as ClassRow[];
    },
  });

  async function importPdf(file?: File) {
    if (!file) return;
    setUploading(true);
    let path = "";
    let documentId = "";
    try {
      const text = await extractPdfText(file, 90_000);
      const parsed = await parse({ data: { text, fileName: file.name } });
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Your session expired. Please sign in again.");
      path = `${user.id}/timetables/${crypto.randomUUID()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`;
      const { error: storageError } = await backend.storage
        .from("civora-files")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (storageError) throw storageError;
      const { data: document, error: documentError } = await backend
        .from("timetable_documents")
        .insert({ user_id: user.id, title: file.name, storage_path: path })
        .select("id")
        .single();
      if (documentError) throw documentError;
      documentId = document.id;
      const rows = parsed.classes.map((item) => ({
        document_id: document.id,
        user_id: user.id,
        subject: item.subject,
        weekday: item.weekday,
        starts_at: `${item.startTime}:00`,
        ends_at: item.endTime ? `${item.endTime}:00` : null,
        location: item.location,
        remind_minutes: Number(minutes),
        reminder_enabled: true,
      }));
      const { error: classError } = await backend.from("timetable_classes").insert(rows);
      if (classError) throw classError;
      await queryClient.invalidateQueries({ queryKey: ["timetable-classes"] });
      toast(`Imported ${rows.length} classes from ${file.name}`);
    } catch (error) {
      if (documentId) await backend.from("timetable_documents").delete().eq("id", documentId);
      if (path) await backend.storage.from("civora-files").remove([path]);
      toast(error instanceof Error ? error.message : "Unable to import this timetable");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
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
    const { error } = await backend
      .from("timetable_classes")
      .update({
        reminder_enabled: !item.reminder_enabled,
        remind_minutes: Number(minutes),
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id);
    if (error) {
      toast(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["timetable-classes"] });
  }
  async function removeClass(item: ClassRow) {
    const { error } = await backend.from("timetable_classes").delete().eq("id", item.id);
    if (error) {
      toast(error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["timetable-classes"] });
  }
  const classes = data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stay on schedule"
        title="Timetable"
        description="Import a weekly timetable PDF and receive browser reminders before class."
        actions={
          <Button variant="outline" onClick={enableNotifications}>
            <Bell className="size-4" /> Enable reminders
          </Button>
        }
      />
      <section className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="timetable-file">Timetable PDF</Label>
          <Input
            id="timetable-file"
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            disabled={uploading}
            onChange={(event) => void importPdf(event.target.files?.[0])}
          />
          <p className="text-xs text-muted-foreground">
            Text-based PDFs up to 20 MB. Imported class times can be reviewed here.
          </p>
        </div>
        <div className="w-full space-y-2 sm:w-48">
          <Label htmlFor="reminder-minutes">Remind me before</Label>
          <select
            id="reminder-minutes"
            className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={minutes}
            onChange={(event) => setMinutes(event.target.value)}
          >
            <option value="0">At class time</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
          </select>
        </div>
        {uploading && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Parsing…
          </span>
        )}
      </section>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CalendarDays className="size-4" /> Reminders run in this browser while Civora is open;
        permission is stored by your browser.
      </div>
      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          Unable to load your timetable. Apply the Civora backend migration and try again.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading timetable…</p>
      ) : classes.length === 0 ? (
        <div className="surface p-8 text-center text-sm text-muted-foreground">
          No classes yet. Import a timetable PDF to get started.
        </div>
      ) : (
        <section className="surface divide-y divide-border">
          {classes.map((item) => (
            <article key={item.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-medium">{item.subject}</p>
                <p className="text-sm text-muted-foreground">
                  {weekdays[item.weekday]} · {item.starts_at.slice(0, 5)}
                  {item.ends_at ? `–${item.ends_at.slice(0, 5)}` : ""}
                  {item.location ? ` · ${item.location}` : ""}
                </p>
              </div>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="size-3.5" /> {item.remind_minutes} min
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
                <Trash2 className="size-4" />
              </Button>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
