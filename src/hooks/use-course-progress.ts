import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Course } from "@/data/demo";
import { backend } from "@/integrations/supabase/backend";

type ProgressCourse = Omit<Course, "lessons" | "progress"> & { lessons: Course["lessons"] };

export function useCourseProgress() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["course-progress"],
    queryFn: async (): Promise<Course[]> => {
      const [courseResult, lessonResult, progressResult] = await Promise.all([
        backend.from("courses").select("*").order("title"),
        backend.from("course_lessons").select("*").order("position"),
        backend.from("course_progress").select("course_id, lesson_id, completed"),
      ]);
      if (courseResult.error) throw courseResult.error;
      if (lessonResult.error) throw lessonResult.error;
      if (progressResult.error) throw progressResult.error;
      return (courseResult.data ?? []).map((course: ProgressCourse) => {
        const lessons = (lessonResult.data ?? [])
          .filter((lesson: { course_id: string }) => lesson.course_id === course.id)
          .map((lesson: { id: string; title: string; minutes: number }) => {
            const saved = progressResult.data?.find(
              (row: { course_id: string; lesson_id: string }) =>
                row.course_id === course.id && row.lesson_id === lesson.id,
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
    },
  });
  const mergedCourses = query.data ?? [];

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
      const previous = queryClient.getQueryData<Course[]>(["course-progress"]);
      queryClient.setQueryData<Course[]>(["course-progress"], (current = []) => {
        return current.map((course) => {
          if (course.id !== data.courseId) return course;
          const lessons = course.lessons.map((lesson) =>
            lesson.id === data.lessonId ? { ...lesson, done: data.completed } : lesson,
          );
          return {
            ...course,
            lessons,
            progress: lessons.length
              ? Math.round((lessons.filter((lesson) => lesson.done).length / lessons.length) * 100)
              : 0,
          };
        });
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(["course-progress"], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["course-progress"] }),
  });

  return {
    ...query,
    courses: mergedCourses,
    saveLesson: mutation.mutate,
    saving: mutation.isPending,
    saveError: mutation.error,
  };
}
