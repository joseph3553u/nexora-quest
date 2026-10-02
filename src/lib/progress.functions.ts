import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const progressInput = z.object({
  courseId: z.string().min(1),
  lessonId: z.string().min(1),
  completed: z.boolean(),
});

export const getCourseProgress = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("course_progress")
      .select("course_id, lesson_id, completed")
      .eq("user_id", context.userId);
    if (error) throw error;
    return data;
  });

export const saveLessonProgress = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) => progressInput.parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("course_progress").upsert(
      {
        user_id: context.userId,
        course_id: data.courseId,
        lesson_id: data.lessonId,
        completed: data.completed,
        completed_at: data.completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,course_id,lesson_id" },
    );
    if (error) throw error;
    return { ok: true };
  });
