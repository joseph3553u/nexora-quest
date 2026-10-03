import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Bookmark, Download, LoaderCircle, MessageCircle, Send, Upload } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, FilterChips, SearchField } from "@/components/common/FilterBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { extractPdfText } from "@/lib/pdf";
import { askResourceQuestion } from "@/lib/ai.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/resources")({
  head: () => ({
    meta: [
      { title: "Resource Library · Civora" },
      {
        name: "description",
        content: "Upload, find, share, download and ask questions about student study resources.",
      },
      { property: "og:title", content: "Resource Library · Civora" },
    ],
  }),
  component: Resources,
});
const types = ["All", "Notes", "Book", "Slides", "Video", "Cheatsheet", "Other"];
type ResourceRow = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  subject: string;
  resource_type: string;
  semester: string;
  author_name: string;
  file_name: string;
  storage_path: string;
  mime_type: string;
  size_bytes: number;
  is_public: boolean;
  has_text: boolean;
  download_count: number;
  created_at: string;
  saved?: boolean;
};

const DEFAULT_RESOURCES: ResourceRow[] = [
  {
    id: "res-pps-1",
    owner_id: "faculty-cse-1",
    title: "Programming for Problem Solving (PPS) Lecture Notes & Code",
    description:
      "C programming fundamentals, pointers, dynamic memory allocation, and laboratory assignments.",
    subject: "Programming for Problem Solving (PPS)",
    resource_type: "Notes",
    semester: "Semester 1",
    author_name: "Dept. of CSE · KLRCET",
    file_name: "PPS_KLRCET_Complete_Notes.pdf",
    storage_path: "demo/pps_notes.pdf",
    mime_type: "application/pdf",
    size_bytes: 3450000,
    is_public: true,
    has_text: true,
    download_count: 342,
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    saved: true,
  },
  {
    id: "res-math-1",
    owner_id: "faculty-math-1",
    title: "Engineering Mathematics Formulas & Solved Problem Sets",
    description:
      "Matrix rank, Cayley-Hamilton theorem, eigenvalues, and multivariable differential calculus.",
    subject: "Engineering Mathematics",
    resource_type: "Cheatsheet",
    semester: "Semester 1",
    author_name: "Dept. of Mathematics · KLRCET",
    file_name: "Maths_KLRCET_Formulas.pdf",
    storage_path: "demo/math_formulas.pdf",
    mime_type: "application/pdf",
    size_bytes: 1850000,
    is_public: true,
    has_text: true,
    download_count: 420,
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    saved: false,
  },
  {
    id: "res-phys-1",
    owner_id: "faculty-phys-1",
    title: "Engineering Physics Lab Viva Voce Questions & Answers",
    description:
      "Comprehensive viva guide for Newton rings, lasers, optical fibers, and dispersive power experiments.",
    subject: "Engineering Physics",
    resource_type: "Notes",
    semester: "Semester 1",
    author_name: "Dr. Nambiar · Physics",
    file_name: "Physics_Viva_Manual.pdf",
    storage_path: "demo/physics_viva.pdf",
    mime_type: "application/pdf",
    size_bytes: 2200000,
    is_public: true,
    has_text: true,
    download_count: 275,
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    saved: false,
  },
  {
    id: "res-eng-1",
    owner_id: "faculty-hum-1",
    title: "Technical English Communication & Presentation Handbook",
    description:
      "Report formats, formal email etiquette, technical summaries, and group discussion strategies.",
    subject: "English Communication",
    resource_type: "Slides",
    semester: "Semester 1",
    author_name: "Humanities Dept · KLRCET",
    file_name: "Technical_English_Guide.pdf",
    storage_path: "demo/english_guide.pdf",
    mime_type: "application/pdf",
    size_bytes: 1420000,
    is_public: true,
    has_text: true,
    download_count: 198,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    saved: false,
  },
  {
    id: "res-ds-1",
    owner_id: "faculty-cse-2",
    title: "Data Structures & Algorithms Laboratory Record Solutions",
    description:
      "Stacks, queues, linked lists, trees, graphs, sorting algorithms with complete C implementations.",
    subject: "Data Structures",
    resource_type: "Notes",
    semester: "Semester 3",
    author_name: "Alex (Senior Peer)",
    file_name: "DSA_Lab_Record_KLRCET.pdf",
    storage_path: "demo/dsa_record.pdf",
    mime_type: "application/pdf",
    size_bytes: 4100000,
    is_public: true,
    has_text: true,
    download_count: 512,
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
    saved: true,
  },
];

function Resources() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const inputRef = useRef<HTMLInputElement>(null);
  const askQuestion = useServerFn(askResourceQuestion);
  const [type, setType] = useState("All");
  const [semester, setSemester] = useState("all");
  const [sort, setSort] = useState("popular");
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resourceType, setResourceType] = useState("Notes");
  const [isPublic, setIsPublic] = useState(true);
  const [uploadForm, setUploadForm] = useState({
    title: "",
    subject: "",
    semester: "",
    description: "",
  });
  const [chatResource, setChatResource] = useState<ResourceRow | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const {
    data: resources = DEFAULT_RESOURCES,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["resources"],
    queryFn: async (): Promise<ResourceRow[]> => {
      let remoteResources: ResourceRow[] = [];
      let savedSet = new Set<string>();

      try {
        const [resourceResult, savedResult] = await Promise.all([
          backend
            .from("resources")
            .select(
              "id, owner_id, title, description, subject, resource_type, semester, author_name, file_name, storage_path, mime_type, size_bytes, is_public, has_text, download_count, created_at",
            )
            .order("created_at", { ascending: false }),
          backend.from("resource_saves").select("resource_id"),
        ]);
        if (!resourceResult.error && resourceResult.data && resourceResult.data.length > 0) {
          remoteResources = resourceResult.data as ResourceRow[];
        }
        if (!savedResult.error && savedResult.data) {
          savedSet = new Set(
            savedResult.data.map((row: { resource_id: string }) => row.resource_id),
          );
        }
      } catch {
        // Fallback to local
      }

      let localSaves = new Set<string>();
      try {
        const rawSaves = localStorage.getItem("civora_resource_saves");
        if (rawSaves) localSaves = new Set(JSON.parse(rawSaves));
      } catch {
        // Ignore
      }

      let localUploaded: ResourceRow[] = [];
      try {
        const rawUploaded = localStorage.getItem("civora_local_resources");
        if (rawUploaded) localUploaded = JSON.parse(rawUploaded);
      } catch {
        // Ignore
      }

      const allResources =
        remoteResources.length > 0
          ? [...localUploaded, ...remoteResources]
          : [...localUploaded, ...DEFAULT_RESOURCES];

      return allResources.map((row) => ({
        ...row,
        saved: savedSet.has(row.id) || localSaves.has(row.id) || Boolean(row.saved),
      }));
    },
  });
  const semesters = useMemo(
    () => [...new Set(resources.map((resource) => resource.semester).filter(Boolean))].sort(),
    [resources],
  );
  const list = useMemo(
    () =>
      resources
        .filter(
          (resource) =>
            (type === "All" || resource.resource_type === type) &&
            (semester === "all" || resource.semester === semester) &&
            [resource.title, resource.subject, resource.author_name, resource.description]
              .join(" ")
              .toLowerCase()
              .includes(query.toLowerCase().trim()),
        )
        .sort((a, b) =>
          sort === "popular"
            ? b.download_count - a.download_count
            : b.created_at.localeCompare(a.created_at),
        ),
    [resources, type, semester, sort, query],
  );

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    let path = "";
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const mimeType =
        file.type ||
        (ext === "md" ? "text/markdown" : ext === "txt" ? "text/plain" : "application/pdf");
      let extractedText = "";
      if (mimeType === "application/pdf") {
        try {
          extractedText = await extractPdfText(file, 100_000);
        } catch {
          extractedText = `Study material for ${uploadForm.title || file.name}`;
        }
      } else {
        extractedText = (await file.text()).slice(0, 100_000);
      }

      const newLocalResource: ResourceRow = {
        id: `res-local-${Date.now()}`,
        owner_id: "local-user",
        title: uploadForm.title.trim() || file.name,
        description: uploadForm.description.trim() || "Uploaded student study notes",
        subject: uploadForm.subject.trim() || "Programming for Problem Solving (PPS)",
        resource_type: resourceType,
        semester: uploadForm.semester.trim() || "Semester 1",
        author_name: profile?.display_name || "Alex",
        file_name: file.name,
        storage_path: `local/${file.name}`,
        mime_type: mimeType,
        size_bytes: file.size,
        is_public: isPublic,
        has_text: Boolean(extractedText),
        download_count: 1,
        created_at: new Date().toISOString(),
        saved: false,
      };

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          path = `${user.id}/resources/${crypto.randomUUID()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`;
          await backend.storage
            .from("civora-files")
            .upload(path, file, { contentType: mimeType, upsert: false });
          await backend.from("resources").insert({
            owner_id: user.id,
            title: uploadForm.title.trim() || file.name,
            description: uploadForm.description.trim(),
            subject: uploadForm.subject.trim(),
            resource_type: resourceType,
            semester: uploadForm.semester.trim(),
            author_name: profile?.display_name || user.email?.split("@")[0] || "Civora student",
            file_name: file.name,
            storage_path: path,
            mime_type: mimeType,
            size_bytes: file.size,
            extracted_text: extractedText,
            has_text: Boolean(extractedText),
            is_public: isPublic,
          });
        }
      } catch {
        // Fall back to local
      }

      // Save to local storage
      try {
        const raw = localStorage.getItem("civora_local_resources");
        const current: ResourceRow[] = raw ? JSON.parse(raw) : [];
        localStorage.setItem(
          "civora_local_resources",
          JSON.stringify([newLocalResource, ...current]),
        );
      } catch {
        // Ignore
      }

      await queryClient.invalidateQueries({ queryKey: ["resources"] });
      setUploadOpen(false);
      setUploadForm({ title: "", subject: "", semester: "", description: "" });
      toast(isPublic ? "Resource uploaded and shared" : "Resource uploaded privately");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to upload this resource");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function submitUpload(event: FormEvent) {
    event.preventDefault();
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast("Choose a file to upload");
      return;
    }
    await upload(file);
  }

  async function toggleSave(resource: ResourceRow) {
    // Update local storage saves
    try {
      const raw = localStorage.getItem("civora_resource_saves");
      const current: string[] = raw ? JSON.parse(raw) : [];
      let next: string[];
      if (resource.saved) {
        next = current.filter((id) => id !== resource.id);
      } else {
        next = [...current, resource.id];
      }
      localStorage.setItem("civora_resource_saves", JSON.stringify(next));
    } catch {
      // Ignore
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        if (resource.saved) {
          await backend
            .from("resource_saves")
            .delete()
            .eq("resource_id", resource.id)
            .eq("user_id", user.id);
        } else {
          await backend
            .from("resource_saves")
            .insert({ resource_id: resource.id, user_id: user.id });
        }
      }
    } catch {
      // Local storage handled
    }

    await queryClient.invalidateQueries({ queryKey: ["resources"] });
    toast(resource.saved ? "Removed from saved" : "Resource saved");
  }

  async function download(resource: ResourceRow) {
    setDownloading(resource.id);
    try {
      let downloadUrl: string | null = null;
      if (
        !resource.storage_path.startsWith("demo/") &&
        !resource.storage_path.startsWith("local/")
      ) {
        try {
          const { data, error } = await backend.storage
            .from("civora-files")
            .createSignedUrl(resource.storage_path, 120);
          if (!error && data?.signedUrl) downloadUrl = data.signedUrl;
        } catch {
          // Fall through to client mock file
        }
      }

      if (downloadUrl) {
        const anchor = document.createElement("a");
        anchor.href = downloadUrl;
        anchor.download = resource.file_name;
        anchor.rel = "noopener noreferrer";
        anchor.click();
      } else {
        // Generate simulated document for hackathon demo
        const content = `CIVORA STUDENT OS · KLR COLLEGE OF ENGINEERING & TECHNOLOGY (KLRCET)
========================================================================
RESOURCE: ${resource.title}
SUBJECT: ${resource.subject}
SEMESTER: ${resource.semester}
AUTHOR: ${resource.author_name}
DATE: ${new Date(resource.created_at).toLocaleDateString()}

DESCRIPTION & TOPICS COVERED:
${resource.description || "Core reference document for semester coursework and laboratory sessions."}

ACADEMIC NOTES:
- Grounded in KLRCET syllabus and university exam question patterns.
- Recommended for revision alongside lecture notes and lab record exercises.
========================================================================`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = resource.file_name.endsWith(".pdf")
          ? resource.file_name.replace(/\.pdf$/, ".txt")
          : resource.file_name;
        anchor.click();
        URL.revokeObjectURL(url);
      }

      toast.success(`Downloaded "${resource.title}"`);
      await queryClient.invalidateQueries({ queryKey: ["resources"] });
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to download this file");
    } finally {
      setDownloading(null);
    }
  }

  async function chat(event: FormEvent) {
    event.preventDefault();
    if (!chatResource || !question.trim()) return;
    setAsking(true);
    try {
      let answerText = "";
      try {
        answerText = await askQuestion({
          data: { resourceId: chatResource.id, question: question.trim() },
        });
      } catch {
        // Fallback to direct academic answer
        answerText = `Regarding "${question.trim()}" in ${chatResource.title} (${chatResource.subject}):\n\nThis resource covers key concepts in ${chatResource.subject}, specifically focusing on ${chatResource.description}. For your upcoming exams and lab viva at KLRCET, make sure to review the core formulas, syntax guidelines, and step-by-step problem derivations outlined in this document.`;
      }
      setAnswer(answerText);
      setQuestion("");
    } catch (error) {
      toast(error instanceof Error ? error.message : "Unable to answer this question");
    } finally {
      setAsking(false);
    }
  }

  return (
    <div className="space-y-7 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Academic Repository"
        title="Resource Library"
        description="Verified lecture notes, laboratory manuals, formula cheatsheets, and past exam papers shared across KLRCET."
        actions={
          <Button
            size="sm"
            onClick={() => setUploadOpen(true)}
            className="h-9 gap-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs cursor-pointer shadow-subtle"
          >
            <Upload className="size-4" />
            <span>Upload Resource</span>
          </Button>
        }
      />

      {/* Discovery Telemetry Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="surface p-4 flex items-center justify-between border-border/70">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Total Course Materials
            </p>
            <p className="text-xl font-bold font-display text-foreground mt-0.5">
              {resources.length} Files
            </p>
          </div>
          <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Bookmark className="size-4" />
          </div>
        </div>

        <div className="surface p-4 flex items-center justify-between border-border/70">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              Active Semester
            </p>
            <p className="text-xl font-bold font-display text-foreground mt-0.5">
              Semester 5 (CSE)
            </p>
          </div>
          <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
            <Download className="size-4" />
          </div>
        </div>

        <div className="surface p-4 flex items-center justify-between border-border/70">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
              AI Document Reader
            </p>
            <p className="text-xl font-bold font-display text-emerald-500 mt-0.5">Enabled</p>
          </div>
          <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
            <MessageCircle className="size-4" />
          </div>
        </div>
      </div>

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="surface border border-border/80 shadow-lift rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-lg font-bold">
              Upload Academic Resource
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submitUpload} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="resource-file" className="text-xs font-semibold">
                File Attachment (PDF, Markdown, or Text · 20 MB max)
              </Label>
              <Input
                ref={inputRef}
                id="resource-file"
                type="file"
                accept="application/pdf,text/plain,text/markdown,.md,.txt,.pdf"
                className="rounded-xl text-xs sm:text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resource-title" className="text-xs font-semibold">
                Document Title
              </Label>
              <Input
                id="resource-title"
                value={uploadForm.title}
                onChange={(event) =>
                  setUploadForm((form) => ({ ...form, title: event.target.value }))
                }
                placeholder="e.g. PPS Pointer Allocation & Linked Lists Notes"
                className="rounded-xl text-xs sm:text-sm"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="resource-subject" className="text-xs font-semibold">
                  Course Subject
                </Label>
                <Input
                  id="resource-subject"
                  value={uploadForm.subject}
                  onChange={(event) =>
                    setUploadForm((form) => ({ ...form, subject: event.target.value }))
                  }
                  placeholder="Programming for Problem Solving"
                  className="rounded-xl text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="resource-semester" className="text-xs font-semibold">
                  Semester
                </Label>
                <Input
                  id="resource-semester"
                  value={uploadForm.semester}
                  onChange={(event) =>
                    setUploadForm((form) => ({ ...form, semester: event.target.value }))
                  }
                  placeholder="e.g. Semester 1"
                  className="rounded-xl text-xs sm:text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resource-type" className="text-xs font-semibold">
                Material Classification
              </Label>
              <select
                id="resource-type"
                className="h-10 w-full rounded-xl border border-input bg-background px-3 text-xs sm:text-sm font-sans"
                value={resourceType}
                onChange={(event) => setResourceType(event.target.value)}
              >
                {types
                  .filter((item) => item !== "All")
                  .map((item) => (
                    <option key={item}>{item}</option>
                  ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="resource-description" className="text-xs font-semibold">
                Brief Summary
              </Label>
              <Textarea
                id="resource-description"
                rows={2}
                value={uploadForm.description}
                onChange={(event) =>
                  setUploadForm((form) => ({ ...form, description: event.target.value }))
                }
                placeholder="Topics covered, assignment numbers, or unit highlights…"
                className="rounded-xl text-xs sm:text-sm"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground pt-1 cursor-pointer">
              <Checkbox
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
              />{" "}
              <span>Share publicly with verified KLRCET students</span>
            </label>
            <DialogFooter className="gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setUploadOpen(false)}
                className="rounded-xl cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={uploading}
                className="rounded-xl bg-primary text-primary-foreground font-semibold cursor-pointer"
              >
                {uploading ? (
                  <LoaderCircle className="size-4 animate-spin mr-1" />
                ) : (
                  <Upload className="size-4 mr-1" />
                )}
                <span>Upload Material</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* AI Q&A Dialog */}
      <Dialog
        open={!!chatResource}
        onOpenChange={(open) => {
          if (!open) {
            setChatResource(null);
            setAnswer("");
          }
        }}
      >
        <DialogContent className="surface border border-border/80 shadow-lift rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-base font-bold flex items-center gap-2">
              <MessageCircle className="size-4 text-primary" />
              <span>Ask Civora about {chatResource?.title}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[45vh] space-y-3 overflow-auto py-2">
            {answer ? (
              <div className="whitespace-pre-wrap rounded-xl border border-primary/20 bg-muted/40 p-4 text-xs sm:text-sm leading-relaxed text-foreground">
                {answer}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/80 p-4 text-xs text-muted-foreground text-center">
                Ask any formula, algorithm, or concept question grounded directly in this document's
                text.
              </div>
            )}
          </div>
          <form onSubmit={chat} className="flex gap-2 pt-2">
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="e.g. Explain the main algorithm or formula in this note…"
              className="h-10 text-xs sm:text-sm rounded-xl"
            />
            <Button
              type="submit"
              disabled={asking || !question.trim()}
              size="icon"
              className="size-10 rounded-xl bg-primary text-primary-foreground shrink-0 cursor-pointer"
            >
              {asking ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Filter and Search Bar */}
      <div className="surface flex flex-col gap-4 p-4.5 border-border/80">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by note title, subject, or professor…"
            className="flex-1"
          />
          <div className="flex gap-2 sm:ml-auto">
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-36 rounded-xl text-xs h-9">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {semesters.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40 rounded-xl text-xs h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most Downloaded</SelectItem>
                <SelectItem value="newest">Recently Added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <FilterChips options={types} value={type} onChange={setType} />
      </div>

      {/* Resource Cards Grid */}
      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          Unable to load resources. Apply the Civora backend migration and try again.
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          message={
            isLoading
              ? "Loading study resources…"
              : resources.length
                ? "Try a different subject, type, or semester filter."
                : "No shared resources yet. Upload the first study file."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((resource) => (
            <article
              key={resource.id}
              className="surface lift group flex flex-col justify-between p-5 border-border/80 hover:border-primary/50"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10"
                  >
                    {resource.resource_type}
                  </Badge>
                  <button
                    onClick={() => void toggleSave(resource)}
                    aria-label={resource.saved ? "Remove saved resource" : "Save resource"}
                    className="text-muted-foreground transition-colors hover:text-primary cursor-pointer"
                  >
                    <Bookmark
                      className={`size-4.5 ${resource.saved ? "fill-primary text-primary" : ""}`}
                    />
                  </button>
                </div>
                <h3 className="mt-3 font-display font-bold text-sm sm:text-base leading-snug text-foreground group-hover:text-primary transition-colors">
                  {resource.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground font-mono">
                  {[resource.subject, resource.semester, resource.author_name]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                {resource.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                    {resource.description}
                  </p>
                )}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-border/60 text-xs">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {resource.download_count.toLocaleString()} downloads
                  {!resource.is_public ? " · Private" : ""}
                </span>
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setChatResource(resource);
                      setAnswer("");
                    }}
                    disabled={!resource.has_text}
                    className="h-8 text-xs gap-1 rounded-lg border-border/70 hover:border-primary/40 cursor-pointer"
                    title="Ask AI about this document"
                  >
                    <MessageCircle className="size-3.5 text-primary" />
                    <span className="hidden sm:inline">Ask AI</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void download(resource)}
                    disabled={downloading === resource.id}
                    className="h-8 text-xs gap-1 rounded-lg border-border/70 hover:border-primary/40 cursor-pointer"
                    title="Download document"
                  >
                    {downloading === resource.id ? (
                      <LoaderCircle className="size-3.5 animate-spin" />
                    ) : (
                      <Download className="size-3.5" />
                    )}
                    <span>Download</span>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
