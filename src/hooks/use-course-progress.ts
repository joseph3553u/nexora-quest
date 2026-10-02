import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Course } from "@/data/demo";
import { backend } from "@/integrations/supabase/backend";

type ProgressCourse = Omit<Course, "lessons" | "progress"> & { lessons: Course["lessons"] };
type SavedProgress = {
  course_id: string;
  lesson_id: string;
  completed: boolean;
  completed_at: string | null;
};
type ActivityPoint = { day: string; count: number };
type CourseProgressData = {
  courses: Course[];
  studyStreak: number;
  weeklyActivity: ActivityPoint[];
};

function localDayKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function summarizeActivity(rows: SavedProgress[]) {
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!row.completed || !row.completed_at) continue;
    const completedAt = new Date(row.completed_at);
    if (Number.isNaN(completedAt.getTime())) continue;
    const key = localDayKey(completedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const cursor = new Date(today);
  if (!counts.has(localDayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  let studyStreak = 0;
  while (counts.has(localDayKey(cursor)) && studyStreak < counts.size) {
    studyStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const weeklyActivity: ActivityPoint[] = [];
  for (let daysAgo = 6; daysAgo >= 0; daysAgo -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    weeklyActivity.push({
      day: date.toLocaleDateString(undefined, { weekday: "short" }),
      count: counts.get(localDayKey(date)) ?? 0,
    });
  }
  return { studyStreak, weeklyActivity };
}

export function useCourseProgress() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["course-progress"],
    queryFn: async (): Promise<CourseProgressData> => {
      const [courseResult, lessonResult, progressResult] = await Promise.all([
        backend.from("courses").select("*").order("title"),
        backend.from("course_lessons").select("*").order("position"),
        backend.from("course_progress").select("course_id, lesson_id, completed, completed_at"),
      ]);
      if (courseResult.error) throw courseResult.error;
      if (lessonResult.error) throw lessonResult.error;
      if (progressResult.error) throw progressResult.error;

      const savedProgress = (progressResult.data ?? []) as SavedProgress[];
      const courses = (courseResult.data ?? []).map((course: ProgressCourse) => {
        const lessons = (lessonResult.data ?? [])
          .filter((lesson: { course_id: string }) => lesson.course_id === course.id)
          .map((lesson: { id: string; title: string; minutes: number }) => {
            const saved = savedProgress.find(
              (row) => row.course_id === course.id && row.lesson_id === lesson.id,
            );
            return {
              id: lesson.id,
              title: lesson.title,
              minutes: lesson.minutes,
              done: Boolean(saved?.completed),
            };
          });
        const progress = lessons.length
          ? Math.round((lessons.filter((lesson) => lesson.done).length / lessons.length) * 100)
          : 0;
        return { ...course, lessons, progress } as Course;
      });

      return { courses, ...summarizeActivity(savedProgress) };
    },
  });
  const courses = query.data?.courses ?? [];

  const mutation = useMutation({
    mutationFn: async (input: { courseId: string; lessonId: string; completed: boolean }) => {
      const { data: auth, error: authError } = await backend.auth.getUser();
      if (authError || !auth.user) throw new Error("Your session expired. Please sign in again.");
      const { error } = await backend.from("course_progress").upsert(
        {
          user_id: auth.user.id,
          course_id: input.courseId,
          lesson_id: input.lessonId,
          completed: input.completed,
          completed_at: input.completed ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id,lesson_id" },
      );
      if (error) throw error;
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["course-progress"] });
      const previous = queryClient.getQueryData<CourseProgressData>(["course-progress"]);
      queryClient.setQueryData<CourseProgressData>(["course-progress"], (current) => {
        if (!current) return current;
        return {
          ...current,
          courses: current.courses.map((course) => {
            if (course.id !== data.courseId) return course;
            const lessons = course.lessons.map((lesson) =>
              lesson.id === data.lessonId ? { ...lesson, done: data.completed } : lesson,
            );
            return {
              ...course,
              lessons,
              progress: lessons.length
                ? Math.round(
                    (lessons.filter((lesson) => lesson.done).length / lessons.length) * 100,
                  )
                : 0,
            };
          }),
        };
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData<CourseProgressData>(["course-progress"], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["course-progress"] }),
  });

  return {
    ...query,
    data: query.data?.courses,
    courses,
    studyStreak: query.data?.studyStreak ?? 0,
    weeklyActivity: query.data?.weeklyActivity ?? [],
    saveLesson: mutation.mutate,
    saving: mutation.isPending,
    saveError: mutation.error,
  };
}
