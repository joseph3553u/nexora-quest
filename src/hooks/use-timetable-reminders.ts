import { useEffect } from "react";
import { backend } from "@/integrations/supabase/backend";

type ReminderClass = {
  id: string;
  subject: string;
  weekday: number;
  starts_at: string;
  remind_minutes: number;
  reminder_enabled: boolean;
};

export function useTimetableReminders() {
  useEffect(() => {
    let cancelled = false;
    let lastLoaded = 0;
    let classes: ReminderClass[] = [];
    async function check() {
      if (
        cancelled ||
        typeof window === "undefined" ||
        !("Notification" in window) ||
        Notification.permission !== "granted"
      )
        return;
      if (Date.now() - lastLoaded > 5 * 60 * 1000) {
        const { data, error } = await backend
          .from("timetable_classes")
          .select("id, subject, weekday, starts_at, remind_minutes, reminder_enabled");
        if (cancelled) return;
        if (!error) {
          classes = (data ?? []) as ReminderClass[];
          lastLoaded = Date.now();
        }
      }
      const now = new Date();
      for (const item of classes) {
        if (!item.reminder_enabled) continue;
        const [hour, minute] = item.starts_at.slice(0, 5).split(":").map(Number);
        const target = new Date(now);
        target.setDate(now.getDate() + ((item.weekday - now.getDay() + 7) % 7));
        target.setHours(hour ?? 0, minute ?? 0, 0, 0);
        if (target <= now) target.setDate(target.getDate() + 7);
        const remaining = Math.ceil((target.getTime() - now.getTime()) / 60_000);
        const windowMinutes = Math.max(item.remind_minutes, 1);
        if (remaining < 0 || remaining > windowMinutes) continue;
        const key = `civora-reminder:${item.id}:${target.toISOString()}`;
        if (localStorage.getItem(key)) continue;
        localStorage.setItem(key, "sent");
        new Notification(item.subject, {
          body: `Class starts in ${item.remind_minutes || "1"} minute(s).`,
        });
      }
    }
    void check();
    const interval = window.setInterval(() => void check(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);
}
