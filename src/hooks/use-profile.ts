import { useQuery } from "@tanstack/react-query";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  display_name: string;
  civora_id: string;
  avatar_url: string | null;
  preferences: Record<string, unknown>;
  college: string;
  program: string;
  department: string;
  semester: string;
  cgpa: number | null;
  attendance: number | null;
  credits: number | null;
  skills: string[];
  target_role: string;
  onboarding_answers: Record<string, string>;
  onboarding_complete: boolean;
};

const LOCAL_STORAGE_KEY = "civora_student_profile";

export async function checkCivoraIdAvailability(
  civoraId: string,
  currentUserId?: string,
): Promise<{ available: boolean; message?: string }> {
  const normalized = civoraId.trim().toLowerCase();
  if (!normalized) {
    return { available: false, message: "Civora ID cannot be empty." };
  }
  if (!/^[a-z0-9._-]{3,24}$/.test(normalized)) {
    return {
      available: false,
      message:
        "Must be 3-24 characters containing only lowercase letters, numbers, dot, dash, or underscore.",
    };
  }

  // Check Supabase if configured
  try {
    let query = supabase.from("profiles").select("id").ilike("civora_id", normalized);
    if (currentUserId) {
      query = query.neq("id", currentUserId);
    }
    const { data, error } = await query.maybeSingle();
    if (!error && data) {
      return {
        available: false,
        message: "This Civora ID is already taken. Please choose another.",
      };
    }
  } catch {
    // Ignore network error in fallback mode
  }

  // Check against reserved/demo accounts in local demo storage
  const reservedDemoIds = ["priya.cse26", "rahul.dev", "ananya.math", "karthik.web"];
  if (reservedDemoIds.includes(normalized)) {
    return { available: false, message: "This Civora ID is already registered to a student." };
  }

  return { available: true };
}

export function getLocalProfile(): Partial<Profile> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: Partial<Profile>) {
  if (typeof window === "undefined") return;
  try {
    const current = getLocalProfile() || {};
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({ ...current, ...profile }));
  } catch {
    // Ignore storage quota
  }
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      const local = getLocalProfile();
      let userData: {
        user: { id: string; user_metadata?: Record<string, unknown>; email?: string } | null;
      } = { user: null };
      try {
        const res = await supabase.auth.getUser();
        userData = res.data;
      } catch {
        // Fallback to guest session
      }

      let data: Record<string, unknown> | null = null;
      if (userData.user) {
        try {
          const res = await backend
            .from("profiles")
            .select("*")
            .eq("id", userData.user.id)
            .maybeSingle();
          data = res.data;
        } catch {
          // Fall back to local
        }
      }

      const userId = userData.user?.id || local?.id || "demo-student-id";
      const preferences =
        data?.preferences &&
        typeof data.preferences === "object" &&
        !Array.isArray(data.preferences)
          ? (data.preferences as Record<string, unknown>)
          : (local?.preferences ?? {});

      const college =
        local?.college ||
        (preferences["college"] as string) ||
        data?.college ||
        "KLR College of Engineering and Technology (KLRCET)";

      const skills = local?.skills ||
        (preferences["skills"] as string[]) || [
          "Programming for Problem Solving (PPS)",
          "Data Structures",
          "Python",
          "Web Development",
          "Database Systems",
        ];

      let displayName =
        local?.display_name ||
        data?.display_name ||
        userData.user?.user_metadata?.["display_name"] ||
        userData.user?.email?.split("@")[0] ||
        "Alex";
      if (displayName.toLowerCase().includes("joseph") || displayName === "Alex Morgan") {
        displayName = "Alex";
      }

      let civoraId = local?.civora_id || (data?.civora_id as string) || "alex.klrcet";
      if (civoraId.toLowerCase().includes("joseph")) {
        civoraId = "alex.klrcet";
      }

      return {
        id: userId,
        display_name: displayName,
        civora_id: civoraId,
        avatar_url: data?.avatar_url ?? userData.user?.user_metadata?.["avatar_url"] ?? null,
        preferences,
        college,
        skills,
        program: local?.program || data?.program || "B.Tech Computer Science & Engineering",
        department: local?.department || data?.department || "Computer Science & Engineering",
        semester: local?.semester || data?.semester || "Semester 5",
        cgpa: local?.cgpa ?? (data?.cgpa != null ? Number(data.cgpa) : 8.74),
        attendance: local?.attendance ?? (data?.attendance != null ? Number(data.attendance) : 86),
        credits: local?.credits ?? (data?.credits != null ? Number(data.credits) : 112),
        target_role: local?.target_role || data?.target_role || "Full-Stack Software Engineer",
        onboarding_answers:
          local?.onboarding_answers ||
          (data?.onboarding_answers && typeof data.onboarding_answers === "object"
            ? (data.onboarding_answers as Record<string, string>)
            : {
                challenge: "Balancing PPS lab assignments and placement prep",
                study_hours: "10-12 hours per week",
                study_style: "Hands-on projects and problem solving",
                strengths: "Programming for Problem Solving (PPS), Data Structures, Algorithms",
              }),
        onboarding_complete: Boolean(
          (data?.onboarding_complete || local?.onboarding_complete) ?? true,
        ),
      };
    },
    staleTime: 30 * 1000,
  });
}
