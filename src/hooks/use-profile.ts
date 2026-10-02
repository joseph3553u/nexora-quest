import { useQuery } from "@tanstack/react-query";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  program: string;
  department: string;
  semester: string;
  cgpa: number | null;
  attendance: number | null;
  credits: number | null;
  target_role: string;
  onboarding_answers: Record<string, string>;
  onboarding_complete: boolean;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) return null;

      const { data, error } = await backend
        .from("profiles")
        .select("*")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (error) throw error;
      return {
        id: userData.user.id,
        display_name:
          data?.display_name ||
          userData.user.user_metadata?.["display_name"] ||
          userData.user.email?.split("@")[0] ||
          "Student",
        avatar_url: data?.avatar_url ?? userData.user.user_metadata?.["avatar_url"] ?? null,
        preferences:
          data?.preferences &&
          typeof data.preferences === "object" &&
          !Array.isArray(data.preferences)
            ? (data.preferences as Record<string, unknown>)
            : {},
        program: data?.program ?? "",
        department: data?.department ?? "",
        semester: data?.semester ?? "",
        cgpa: data?.cgpa ?? null,
        attendance: data?.attendance ?? null,
        credits: data?.credits ?? null,
        target_role: data?.target_role ?? "",
        onboarding_answers:
          data?.onboarding_answers && typeof data.onboarding_answers === "object"
            ? (data.onboarding_answers as Record<string, string>)
            : {},
        onboarding_complete: Boolean(data?.onboarding_complete),
      };
    },
    staleTime: 60 * 1000,
  });
}
