import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { FilterChips, SearchField, EmptyState } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { mistakes as seedMistakes, type Mistake } from "@/data/demo";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/mistake-bank")({
  head: () => ({
    meta: [
      { title: "Mistake Bank · Civora" },
      {
        name: "description",
        content:
          "Log every exam mistake with what went wrong and the fix, then review them before the next test.",
      },
      { property: "og:title", content: "Mistake Bank · Civora" },
      {
        property: "og:description",
        content: "Log mistakes, capture the fix and review before exams.",
      },
    ],
  }),
  component: MistakeBank,
});

const tags = ["All", "Concept", "Silly", "Time", "Formula"];

function MistakeBank() {
  const [items, setItems] = useState<Mistake[]>(seedMistakes);
  const [tag, setTag] = useState("All");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", question: "", whatWentWrong: "", fix: "" });

  const list = useMemo(
    () =>
      items.filter(
        (m) =>
          (tag === "All" || m.tag === tag) &&
          (m.subject + m.question + m.fix).toLowerCase().includes(query.toLowerCase()),
      ),
    [items, tag, query],
  );

  const pending = items.filter((m) => !m.reviewed).length;

  function addMistake() {
    if (!form.subject.trim() || !form.question.trim()) {
      toast("Add at least a subject and a question");
      return;
    }
    setItems((prev) => [
      {
        id: `m${Date.now()}`,
        subject: form.subject,
        question: form.question,
        whatWentWrong: form.whatWentWrong || "Not described yet.",
        fix: form.fix || "Add a fix after your next review.",
        tag: "Concept",
        reviewed: false,
      },
      ...prev,
    ]);
    setForm({ subject: "", question: "", whatWentWrong: "", fix: "" });
    setOpen(false);
    toast("Mistake logged");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Learn from errors"
        title="Mistake Bank"
        description={`${pending} mistakes still waiting for a review pass.`}
        actions={
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Log a mistake
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log a mistake</DialogTitle>
                <DialogDescription>
                  Capture it while it is fresh — you will thank yourself before the exam.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={form.subject}
                    onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Operating Systems"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="question">Question</Label>
                  <Input
                    id="question"
                    value={form.question}
                    onChange={(e) => setForm({ ...form, question: e.target.value })}
                    placeholder="What was asked?"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wrong">What went wrong</Label>
                  <Textarea
                    id="wrong"
                    value={form.whatWentWrong}
                    onChange={(e) => setForm({ ...form, whatWentWrong: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fix">The fix</Label>
                  <Textarea
                    id="fix"
                    value={form.fix}
                    onChange={(e) => setForm({ ...form, fix: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={addMistake}>Save mistake</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchField value={query} onChange={setQuery} placeholder="Search mistakes" />
        <FilterChips options={tags} value={tag} onChange={setTag} />
      </div>

      {list.length === 0 ? (
        <EmptyState message="No mistakes logged under this filter." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((m) => (
            <article key={m.id} className="surface flex flex-col p-5">
              <div className="flex items-center justify-between gap-3">
                <Badge variant="secondary">{m.subject}</Badge>
                <Badge variant="outline">{m.tag}</Badge>
              </div>
              <h3 className="mt-3 font-semibold leading-snug">{m.question}</h3>
              <p className="mt-3 text-sm">
                <span className="font-medium text-destructive">Went wrong: </span>
                <span className="text-muted-foreground">{m.whatWentWrong}</span>
              </p>
              <p className="mt-2 text-sm">
                <span className="font-medium text-success">Fix: </span>
                <span className="text-muted-foreground">{m.fix}</span>
              </p>
              <div className="mt-auto flex items-center justify-between pt-5">
                <span className="text-sm text-muted-foreground">Marked reviewed</span>
                <Switch
                  checked={m.reviewed}
                  onCheckedChange={() =>
                    setItems((prev) =>
                      prev.map((x) => (x.id === m.id ? { ...x, reviewed: !x.reviewed } : x)),
                    )
                  }
                />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
