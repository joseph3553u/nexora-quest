import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "Civora — Student Operating System" },
      {
        name: "description",
        content: "Your private workspace for learning, deadlines and student progress.",
      },
      { property: "og:title", content: "Civora — Student Operating System" },
      {
        property: "og:description",
        content: "Your private workspace for learning, deadlines and student progress.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});
