import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileSearch, Repeat } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { papers } from "@/data/demo";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/paper-analyzer")({
  head: () => ({
    meta: [
      { title: "Previous-Paper Analyzer · Nexora" },
      {
        name: "description",
        content: "See which topics repeat across past exam papers and how much weight each one carries.",
      },
      { property: "og:title", content: "Previous-Paper Analyzer · Nexora" },
      {
        property: "og:description",
        content: "Topic weightage and repeat counts from past exam papers.",
      },
    ],
  }),
  component: PaperAnalyzer;
});

function PaperAnalyzer() {
  return null;
}
