import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { courses, type Course } from "@/data/demo";
import { getCourseProgress, saveLessonProgress } from "@/lib/progress.functions";

export function useCourseProgress() {
  const queryClient = useQueryClient();
  const fetchProgress = useServerFn(getCourseProgress);
  const saveProgress = useServerFn(saveLessonProgress);
  const query = useQuery({ queryKey: ["course-progress"], queryFn: () => fetchProgress() });

  const mergedCourses: Course[] = courses.map((course) => {
    const lessons = course.lessons.map((lesson) => {
      const saved = query.data?.find(
        (row) => row.course_id === course.id && row.lesson_id === lesson.id,
      );
      return saved ? { ...lesson, done: saved.completed } : lesson;
    });
    const progress = Math.round((lessons.filter((lesson) => lesson.done).length / lessons.length) * 100);
    return { ...course, lessons, progress };
  });

  const mutation = useMutation({
    mutationFn: (input: { courseId: string; lessonId: string; completed: boolean }) =>
      saveProgress({ data: input }),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: ["course-progress"] });
      const previous = queryClient.getQueryData<typeof query.data>(["course-progress"]);
      queryClient.setQueryData<typeof query.data>(["course-progress"], (current = []) => {
        const next = current.filter(
          (row) => !(row.course_id === data.courseId && row.lesson_id === data.lessonId),
        );
        return [...next, { course_id: data.courseId, lesson_id: data.lessonId, completed: data.completed }];
      });
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(["course-progress"], context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["course-progress"] }),
  });

  return { ...query, courses: mergedCourses, saveLesson: mutation.mutate, saving: mutation.isPending, saveError: mutation.error };
}
