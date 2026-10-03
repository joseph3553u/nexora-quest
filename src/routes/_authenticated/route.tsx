import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { AppShell } from "@/components/layout/AppShell";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    let user: User | null = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data?.user ?? null;
    } catch {
      // Fall through to guest session check
    }

    if (!user && typeof window !== "undefined") {
      const googleSessionRaw = localStorage.getItem("civora_google_session");
      if (googleSessionRaw) {
        try {
          const parsed = JSON.parse(googleSessionRaw);
          user = {
            id: parsed.id || `google-user-${parsed.email?.split("@")[0] || "user"}`,
            email: parsed.email || "student@gmail.com",
            user_metadata: {
              display_name: parsed.name || parsed.email?.split("@")[0] || "Student",
              avatar_url: parsed.avatar_url || null,
            },
            app_metadata: { provider: "google" },
            aud: "authenticated",
            created_at: new Date().toISOString(),
          } as User;
        } catch {
          // Fall through
        }
      }
    }

    // Check if this is explicitly DEMO MODE (Explore as Demo Student Alex)
    const isDemo =
      typeof window !== "undefined" &&
      (localStorage.getItem("civora_demo_mode") === "true" ||
        (!user &&
          localStorage.getItem("civora_guest_session") === "true" &&
          !localStorage.getItem("civora_google_session")) ||
        user?.id === "demo-student-alex" ||
        user?.id === "demo-student-id");

    if (isDemo) {
      user = {
        id: "demo-student-alex",
        email: "alex@civora.edu",
        user_metadata: { display_name: "Alex" },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      } as User;
    }

    if (!user) throw redirect({ to: "/auth" });

    // ----------------------------------------------------------------------
    // DEMO MODE: Keep untouched without any change!
    // ----------------------------------------------------------------------
    if (isDemo) {
      if (location.pathname === "/onboarding") {
        throw redirect({ to: "/dashboard" });
      }
      return { user };
    }

    // ----------------------------------------------------------------------
    // REAL USERS (Google OAuth or Email Login):
    // Check if new account login / first login.
    // ----------------------------------------------------------------------
    const isCompletedLocally =
      typeof window !== "undefined" &&
      localStorage.getItem(`civora_onboarding_completed_${user.id}`) === "true";

    let isCompletedInDb = false;
    if (!isCompletedLocally) {
      try {
        const { data: profile } = await backend
          .from("profiles")
          .select("onboarding_complete, program, college")
          .eq("id", user.id)
          .maybeSingle();

        if (profile && profile.onboarding_complete === true) {
          isCompletedInDb = true;
          if (typeof window !== "undefined") {
            localStorage.setItem(`civora_onboarding_completed_${user.id}`, "true");
          }
        }
      } catch (err) {
        if (err && typeof err === "object" && "to" in err) throw err;
      }
    }

    const isOnboarded = isCompletedLocally || isCompletedInDb;

    // For new account logins on their first login, redirect to filling academic details & interests
    if (!isOnboarded && location.pathname !== "/onboarding") {
      throw redirect({ to: "/onboarding" });
    }

    return { user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
