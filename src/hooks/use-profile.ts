import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  preferences: Record<string, unknown>;
};

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!userData.user) return null;

      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, preferences")
        .eq("id", userData.user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) {
        return {
          ...data,
          preferences:
            data.preferences &&
            typeof data.preferences === "object" &&
            !Array.isArray(data.preferences)
              ? (data.preferences as Record<string, unknown>)
              : {},
        };
      }

      return {
        id: userData.user.id,
        display_name:
          userData.user.user_metadata?.display_name ||
          userData.user.email?.split("@")[0] ||
          "Student",
        avatar_url: userData.user.user_metadata?.avatar_url ?? null,
        preferences: {},
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}
