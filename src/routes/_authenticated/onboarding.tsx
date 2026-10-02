import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentProfileForm } from "@/components/profile/StudentProfileForm";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile · Civora" }] }),
  component: Onboarding,
});
function Onboarding() {
  const { data: profile } = useProfile();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Your learning workspace"
        title="Set up your profile"
        description="A few details help Civora personalize your learning plan. You can change these any time."
      />
      <StudentProfileForm profile={profile ?? null} onboarding />
    </div>
  );
}
