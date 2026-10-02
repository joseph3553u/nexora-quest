import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import { Download, FileSearch, LoaderCircle, Repeat, Upload } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";
import { extractPdfText } from "@/lib/pdf";
import { analyzeExamPaper } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/paper-analyzer")({
  head: () => ({
    meta: [
      { title: "Previous-Paper Analyzer · Civora" },
      {
        name: "description",
        content:
          "Analyze an exam paper PDF for topics, question weight, and a suggested revision order.",
      },
      { property: "og:title", content: "Previous-Paper Analyzer · Civora" },
      {
        property: "og:description",
        content: "AI-powered topic weightage and revision priorities from your exam papers.",
      },
    ],
  }),
  component: PaperAnalyzer,
});

type PaperAnalysis = {
  title: string;
  subject: string;
  questionsCount: number;
  topics: {
    name: string;
    weightPercent: number;
    repeatFrequency: number;
    priority: "High" | "Medium" | "Low";
    keyQuestions: string[];
  }[];
  revisionOrder: string[];
  notes: string;
};
type SavedAnalysis = {
  id: string;
  title: string;
  subject: string;
  source_name: string;
  analysis: PaperAnalysis;
  created_at: string;
};

function PaperAnalyzer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const runAnalysis = useServerFn(analyzeExamPaper);
  const [subject, setSubject] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const {
    data: history = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["paper-analyses"],
    queryFn: async () => {
      const { data, error } = await backend
        .from("paper_analyses")
        .select("id, title, subject, source_name, analysis, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SavedAnalysis[];
    },
  });
  const active = history.find((item) => item.id === selectedId) ?? history[0] ?? null;

  async function analyze(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const text = await extractPdfText(file, 90_000);
      const result = await runAnalysis({
        data: { text, subject: subject.trim(), fileName: file.name },
      });
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Your session expired. Please sign in again.");
      const title = result.title || file.name;
      const { data: saved, error } = await backend
        .from("paper_analyses")
        .insert({
          user_id: user.id,
          title,
          subject: result.subject || subject.trim(),
          source_name: file.name,
          analysis: result,
        })
        .select("id")
        .single();
      if (error) throw error;
      setSelectedId(saved.id);
      await queryClient.invalidateQueries({ queryKey: ["paper-analyses"] });
      toast("Paper analysis saved to your account");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to analyze this paper");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }
  function exportAnalysis() {
    if (!active) return;
    const blob = new Blob([JSON.stringify(active.analysis, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${active.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-analysis.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  const topTopic = active?.analysis.topics.reduce<
    (typeof active.analysis.topics)[number] | undefined
  >((best, topic) => (!best || topic.weightPercent > best.weightPercent ? topic : best), undefined);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Study smarter"
        title="Previous-Paper Analyzer"
        description="Upload an exam paper PDF to identify topics, question weight, and a suggested revision order."
        actions={
          <Button variant="outline" onClick={exportAnalysis} disabled={!active}>
            <Download className="size-4" /> Export analysis
          </Button>
        }
      />
      <section className="surface grid gap-4 p-5 sm:grid-cols-[1fr_auto] sm:items-end">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="paper-subject">Subject (optional)</Label>
            <Input
              id="paper-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Operating Systems"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="paper-file">Exam paper PDF</Label>
            <Input
              ref={inputRef}
              id="paper-file"
              type="file"
              accept="application/pdf,.pdf"
              disabled={busy}
              onChange={(event) => void analyze(event.target.files?.[0])}
            />
          </div>
        </div>
        {busy && (
          <span className="flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="size-4 animate-spin" /> Analyzing…
          </span>
        )}
      </section>
      {isError && (
        <p role="alert" className="text-sm text-destructive">
          Unable to load saved analyses. Apply the Civora backend migration and try again.
        </p>
      )}
      {history.length > 0 && (
        <section className="surface p-4">
          <Label htmlFor="paper-history">Saved analyses</Label>
          <select
            id="paper-history"
            className="mt-2 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={active?.id ?? ""}
            onChange={(event) => setSelectedId(event.target.value)}
          >
            {history.map((item) => (
              <option key={item.id} value={item.id}>
                {item.subject || "Paper"} · {item.title} ·{" "}
                {new Date(item.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </section>
      )}
      {!active ? (
        <div className="surface p-8 text-center">
          <FileSearch className="mx-auto size-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            {isLoading
              ? "Loading saved analyses…"
              : "Your analyses will appear here after you upload a readable exam paper PDF."}
          </p>
        </div>
      ) : (
        <>
          <div className="surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-softer text-primary">
                <FileSearch className="size-5" />
              </span>
              <div>
                <p className="text-sm text-muted-foreground">Selected paper</p>
                <p className="font-semibold">
                  {active.subject || "Exam paper"} · {active.title}
                </p>
              </div>
            </div>
            <Badge variant="secondary">
              Uploaded {new Date(active.created_at).toLocaleDateString()}
            </Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Questions analysed
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {active.analysis.questionsCount}
              </p>
            </div>
            <div className="surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Highest weight
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {topTopic?.weightPercent ?? 0}%
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {topTopic?.name ?? "No topics detected"}
              </p>
            </div>
            <div className="surface p-5">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Topics tracked
              </p>
              <p className="mt-2 font-display text-2xl font-semibold">
                {active.analysis.topics.length}
              </p>
            </div>
          </div>
          <section className="surface p-6">
            <h2 className="text-lg font-semibold">Topic weightage</h2>
            <p className="text-sm text-muted-foreground">
              AI estimates from this paper only; verify against your syllabus.
            </p>
            <ul className="mt-5 space-y-5">
              {active.analysis.topics.map((topic) => (
                <li key={topic.name}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium">{topic.name}</span>
                    <span className="flex items-center gap-3 text-muted-foreground">
                      <Badge variant={topic.priority === "High" ? "default" : "secondary"}>
                        {topic.priority}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Repeat className="size-3.5" /> {topic.repeatFrequency}x
                      </span>
                      <span className="font-semibold text-foreground">{topic.weightPercent}%</span>
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${topic.weightPercent}%` }}
                    />
                  </div>
                  {topic.keyQuestions.length > 0 && (
                    <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
                      {topic.keyQuestions.map((q) => (
                        <li key={q}>{q}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
            {active.analysis.notes && (
              <p className="mt-5 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {active.analysis.notes}
              </p>
            )}
          </section>
          <section className="surface p-6">
            <h2 className="text-lg font-semibold">Suggested revision order</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {active.analysis.revisionOrder.map((topic, index) => (
                <Badge
                  key={`${topic}-${index}`}
                  variant={index === 0 ? "default" : "secondary"}
                  className="px-3 py-1.5"
                >
                  {index + 1}. {topic}
                </Badge>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
