import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentProfileForm } from "@/components/profile/StudentProfileForm";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Student Profile · Civora" }] }),
  component: ProfilePage,
});
function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        eyebrow="Your account"
        title="Student Profile"
        description="Update your details and learning preferences. Only you can see this information."
      />
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : (
        <StudentProfileForm profile={profile ?? null} />
      )}
    </div>
  );
}
