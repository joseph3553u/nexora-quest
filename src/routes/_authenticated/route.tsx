import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (location.pathname !== "/onboarding") {
      const { data: profile, error: profileError } = await backend
        .from("profiles")
        .select("onboarding_complete")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!profile?.onboarding_complete) throw redirect({ to: "/onboarding" });
    }
    return { user: data.user };
  },
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
