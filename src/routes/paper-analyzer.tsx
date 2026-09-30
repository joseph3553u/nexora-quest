import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { FileSearch, Repeat } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { papers } from "@/data/demo";
import { toast } from "sonner";

export const Route = createFileRoute("/paper-analyzer")({
  head: () => ({
    meta: [
      { title: "Previous-Paper Analyzer · Nexora" },
      {
        name: "description",
        content:
          "See which topics repeat across past exam papers and how much weight each one carries.",
      },
      { property: "og:title", content: "Previous-Paper Analyzer · Nexora" },
      {
        property: "og:description",
        content: "Topic weightage and repeat counts from past exam papers.",
      },
    ],
  }),
  component: PaperAnalyzer,
});

function PaperAnalyzer() {
  const [paperId, setPaperId] = useState(papers[0]!.id);
  const paper = useMemo(() => papers.find((p) => p.id === paperId)!, [paperId]);
  const topTopic = paper.topics[0]!;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Study smarter"
        title="Previous-Paper Analyzer"
        description="Pick a paper to see topic weightage, repeat frequency and a suggested revision order."
        actions={
          <Button variant="outline" onClick={() => toast("Analysis exported as PDF")}>
            Export analysis
          </Button>
        }
      />

      <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary">
            <FileSearch className="size-5" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">Selected paper</p>
            <p className="font-semibold">
              {paper.subject} · {paper.exam} {paper.year}
            </p>
          </div>
        </div>
        <Select value={paperId} onValueChange={setPaperId}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {papers.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.subject} — {p.exam} {p.year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Questions analysed</p>
          <p className="mt-2 font-display text-2xl font-semibold">{paper.questions}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Highest weight</p>
          <p className="mt-2 font-display text-2xl font-semibold">{topTopic.weight}%</p>
          <p className="mt-1 text-xs text-muted-foreground">{topTopic.name}</p>
        </div>
        <div className="surface p-5">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Topics tracked</p>
          <p className="mt-2 font-display text-2xl font-semibold">{paper.topics.length}</p>
        </div>
      </div>

      <section className="surface p-6">
        <h2 className="text-lg font-semibold">Topic weightage</h2>
        <p className="text-sm text-muted-foreground">
          Ordered by how much of the paper each topic typically covers.
        </p>
        <ul className="mt-5 space-y-5">
          {paper.topics.map((t) => (
            <li key={t.name}>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{t.name}</span>
                <span className="flex items-center gap-3 text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Repeat className="size-3.5" /> {t.repeats}x
                  </span>
                  <span className="font-semibold text-foreground">{t.weight}%</span>
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${t.weight * 3}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="surface p-6">
        <h2 className="text-lg font-semibold">Suggested revision order</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          {paper.topics.map((t, i) => (
            <Badge key={t.name} variant={i === 0 ? "default" : "secondary"} className="px-3 py-1.5">
              {i + 1}. {t.name}
            </Badge>
          ))}
        </div>
      </section>
    </div>
  );
}
