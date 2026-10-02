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
            id: parsed.id || "google-user-joseph",
            email: parsed.email || "josephgorantla3553@gmail.com",
            user_metadata: {
              display_name: parsed.name || "Joseph Harshith",
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

    if (
      !user &&
      typeof window !== "undefined" &&
      localStorage.getItem("civora_guest_session") === "true"
    ) {
      user = {
        id: "demo-student-klrcet",
        email: "joseph@klrcet.ac.in",
        user_metadata: { display_name: "Joseph Harshith" },
        app_metadata: {},
        aud: "authenticated",
        created_at: new Date().toISOString(),
      };
    }

    if (!user) throw redirect({ to: "/auth" });

    if (location.pathname !== "/onboarding") {
      try {
        const { data: profile } = await backend
          .from("profiles")
          .select("onboarding_complete")
          .eq("id", user.id)
          .maybeSingle();
        if (profile && profile.onboarding_complete === false) {
          throw redirect({ to: "/onboarding" });
        }
      } catch (err) {
        if (err && typeof err === "object" && "to" in err) throw err;
        // Ignore backend connectivity errors in guest/demo mode
      }
    }
    return { user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
