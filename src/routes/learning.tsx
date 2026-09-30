import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, Circle, Clock, PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { courses as seedCourses } from "@/data/demo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learning")({
  head: () => ({
    meta: [
      { title: "Learning Center · Nexora" },
      {
        name: "description",
        content: "Track course progress, tick off lessons and pick up exactly where you left off.",
      },
      { property: "og:title", content: "Learning Center · Nexora" },
      {
        property: "og:description",
        content: "Course tracks, lesson checklists and learning progress.",
      },
    ],
  }),
  component: Learning();
});

function Learning() {
  return null;
}
