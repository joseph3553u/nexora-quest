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

export function getLocalProfile(specificUserId?: string): Partial<Profile> | null {
  if (typeof window === "undefined") return null;
  try {
    if (specificUserId) {
      const userRaw = localStorage.getItem(`civora_student_profile_${specificUserId}`);
      if (userRaw) return JSON.parse(userRaw);
    }
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveLocalProfile(profile: Partial<Profile>, specificUserId?: string) {
  if (typeof window === "undefined") return;
  try {
    const targetId = specificUserId || profile.id;
    const current = getLocalProfile(targetId) || {};
    const updated = { ...current, ...profile };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    if (targetId && targetId !== "demo-student-alex" && targetId !== "demo-student-id") {
      localStorage.setItem(`civora_student_profile_${targetId}`, JSON.stringify(updated));
      if (profile.onboarding_complete) {
        localStorage.setItem(`civora_onboarding_completed_${targetId}`, "true");
      }
    }
  } catch {
    // Ignore storage quota
  }
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<Profile | null> => {
      // 1. Detect active session
      let user: {
        id: string;
        user_metadata?: Record<string, unknown>;
        email?: string;
      } | null = null;
      let isGoogleSession = false;

      try {
        const res = await supabase.auth.getUser();
        user = res.data.user;
      } catch {
        // Fallback to guest session check
      }

      if (!user && typeof window !== "undefined") {
        const googleSessionRaw = localStorage.getItem("civora_google_session");
        if (googleSessionRaw) {
          try {
            const parsed = JSON.parse(googleSessionRaw);
            user = {
              id: parsed.id || `google-user-${parsed.email?.split("@")[0] || "user"}`,
              email: parsed.email,
              user_metadata: {
                display_name: parsed.name,
                avatar_url: parsed.avatar_url || null,
              },
            };
            isGoogleSession = true;
          } catch {
            // Ignore
          }
        }
      }

      // Check if this is explicitly DEMO MODE (Explore as Demo Student Alex)
      const isDemoMode =
        (typeof window !== "undefined" && localStorage.getItem("civora_demo_mode") === "true") ||
        (!user &&
          typeof window !== "undefined" &&
          localStorage.getItem("civora_guest_session") === "true" &&
          !localStorage.getItem("civora_google_session")) ||
        user?.id === "demo-student-alex" ||
        user?.id === "demo-student-id";

      // ----------------------------------------------------------------------
      // DEMO MODE: Keep untouched without any change! Full demo student Alex.
      // ----------------------------------------------------------------------
      if (isDemoMode) {
        return {
          id: "demo-student-alex",
          display_name: "Alex",
          civora_id: "alex.klrcet",
          avatar_url: null,
          preferences: {},
          college: "KLR College of Engineering and Technology (KLRCET)",
          skills: [
            "Programming for Problem Solving (PPS)",
            "Data Structures",
            "Python",
            "Web Development",
            "Database Systems",
          ],
          program: "B.Tech Computer Science & Engineering",
          department: "Computer Science & Engineering",
          semester: "Semester 5",
          cgpa: 8.74,
          attendance: 86,
          credits: 112,
          target_role: "Full-Stack Software Engineer",
          onboarding_answers: {
            challenge: "Balancing PPS lab assignments and placement prep",
            study_hours: "10-12 hours per week",
            study_style: "Hands-on projects and problem solving",
            strengths: "Programming for Problem Solving (PPS), Data Structures, Algorithms",
          },
          onboarding_complete: true,
        };
      }

      // ----------------------------------------------------------------------
      // REAL ACCOUNT (Google OAuth or Email Login)
      // ----------------------------------------------------------------------
      const userId = user?.id || "student-user";
      const userEmail = user?.email || "";
      const userMetaName =
        (user?.user_metadata?.["display_name"] as string) ||
        (user?.user_metadata?.["name"] as string) ||
        "";
      const derivedDisplayName = userMetaName || (userEmail ? userEmail.split("@")[0] : "Student");

      let dbData: Record<string, unknown> | null = null;
      if (user && !isGoogleSession) {
        try {
          const res = await backend.from("profiles").select("*").eq("id", userId).maybeSingle();
          dbData = res.data;
        } catch {
          // Fall back to local
        }
      }

      // Check local storage for this specific user
      const userLocal = getLocalProfile(userId);
      const isAlreadyOnboarded = Boolean(
        dbData?.onboarding_complete ||
        userLocal?.onboarding_complete ||
        (typeof window !== "undefined" &&
          localStorage.getItem(`civora_onboarding_completed_${userId}`) === "true"),
      );

      // Unique handle derived from email or clean name
      const defaultCivoraId =
        (userLocal?.civora_id as string) ||
        (dbData?.civora_id as string) ||
        (userEmail
          ? userEmail
              .split("@")[0]
              ?.toLowerCase()
              .replace(/[^a-z0-9._-]/g, "")
          : "") ||
        "student";

      if (!isAlreadyOnboarded) {
        // NEW ACCOUNT FIRST LOGIN:
        // DO NOT fill static dummy data by itself!
        // Start clean so student fills their real academic details and interests.
        return {
          id: userId,
          display_name:
            userLocal?.display_name || (dbData?.display_name as string) || derivedDisplayName || "",
          civora_id: defaultCivoraId,
          avatar_url:
            (dbData?.avatar_url as string) ||
            (user?.user_metadata?.["avatar_url"] as string) ||
            null,
          preferences: (dbData?.preferences as Record<string, unknown>) || {},
          college: (dbData?.college as string) || userLocal?.college || "",
          program: (dbData?.program as string) || userLocal?.program || "",
          department: (dbData?.department as string) || userLocal?.department || "",
          semester: (dbData?.semester as string) || userLocal?.semester || "",
          target_role: (dbData?.target_role as string) || userLocal?.target_role || "",
          cgpa: dbData?.cgpa != null ? Number(dbData.cgpa) : (userLocal?.cgpa ?? null),
          attendance:
            dbData?.attendance != null
              ? Number(dbData.attendance)
              : (userLocal?.attendance ?? null),
          credits: dbData?.credits != null ? Number(dbData.credits) : (userLocal?.credits ?? null),
          skills: (dbData?.skills as string[]) || userLocal?.skills || [],
          onboarding_answers: (dbData?.onboarding_answers as Record<string, string>) ||
            userLocal?.onboarding_answers || {
              challenge: "",
              study_hours: "",
              study_style: "",
              strengths: "",
            },
          onboarding_complete: false,
        };
      }

      // RETURNING USER (Stored login):
      // Return their saved details and mark onboarding_complete as true.
      return {
        id: userId,
        display_name:
          (dbData?.display_name as string) || userLocal?.display_name || derivedDisplayName,
        civora_id: (dbData?.civora_id as string) || userLocal?.civora_id || defaultCivoraId,
        avatar_url:
          (dbData?.avatar_url as string) || (user?.user_metadata?.["avatar_url"] as string) || null,
        preferences:
          (dbData?.preferences as Record<string, unknown>) || userLocal?.preferences || {},
        college: (dbData?.college as string) || userLocal?.college || "",
        program: (dbData?.program as string) || userLocal?.program || "",
        department: (dbData?.department as string) || userLocal?.department || "",
        semester: (dbData?.semester as string) || userLocal?.semester || "",
        target_role: (dbData?.target_role as string) || userLocal?.target_role || "",
        cgpa: dbData?.cgpa != null ? Number(dbData.cgpa) : (userLocal?.cgpa ?? null),
        attendance:
          dbData?.attendance != null ? Number(dbData.attendance) : (userLocal?.attendance ?? null),
        credits: dbData?.credits != null ? Number(dbData.credits) : (userLocal?.credits ?? null),
        skills: (dbData?.skills as string[]) || userLocal?.skills || [],
        onboarding_answers: (dbData?.onboarding_answers as Record<string, string>) ||
          userLocal?.onboarding_answers || {
            challenge: "",
            study_hours: "",
            study_style: "",
            strengths: "",
          },
        onboarding_complete: true,
      };
    },
    staleTime: 30 * 1000,
  });
}
