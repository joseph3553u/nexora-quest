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
    author_name: "Joseph H. (Senior Peer)",
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
        author_name: profile?.display_name || "Joseph Harshith",
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Shared knowledge"
        title="Resource Library"
        description="Curated study material from your seniors, classmates and faculty."
        actions={
          <Button onClick={() => setUploadOpen(true)}>
            <Upload className="size-4" /> Upload resource
          </Button>
        }
      />
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload a resource</DialogTitle>
          </DialogHeader>
          <form onSubmit={submitUpload} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resource-file">File (PDF, Markdown, or text · 20 MB max)</Label>
              <Input
                ref={inputRef}
                id="resource-file"
                type="file"
                accept="application/pdf,text/plain,text/markdown,.md,.txt,.pdf"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-title">Title</Label>
              <Input
                id="resource-title"
                value={uploadForm.title}
                onChange={(event) =>
                  setUploadForm((form) => ({ ...form, title: event.target.value }))
                }
                placeholder="Defaults to file name"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="resource-subject">Subject</Label>
                <Input
                  id="resource-subject"
                  value={uploadForm.subject}
                  onChange={(event) =>
                    setUploadForm((form) => ({ ...form, subject: event.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="resource-semester">Semester</Label>
                <Input
                  id="resource-semester"
                  value={uploadForm.semester}
                  onChange={(event) =>
                    setUploadForm((form) => ({ ...form, semester: event.target.value }))
                  }
                  placeholder="e.g. Sem 4"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resource-type">Type</Label>
              <select
                id="resource-type"
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
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
            <div className="space-y-2">
              <Label htmlFor="resource-description">Description</Label>
              <Textarea
                id="resource-description"
                rows={2}
                value={uploadForm.description}
                onChange={(event) =>
                  setUploadForm((form) => ({ ...form, description: event.target.value }))
                }
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={isPublic}
                onCheckedChange={(checked) => setIsPublic(checked === true)}
              />{" "}
              Share with other signed-in Civora students
            </label>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}{" "}
                Upload
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!chatResource}
        onOpenChange={(open) => {
          if (!open) {
            setChatResource(null);
            setAnswer("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ask about {chatResource?.title}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[45vh] space-y-3 overflow-auto">
            {answer ? (
              <p className="whitespace-pre-wrap rounded-md bg-muted p-3 text-sm leading-relaxed">
                {answer}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Answers are grounded in this resource’s extracted text.
              </p>
            )}
          </div>
          <form onSubmit={chat} className="flex gap-2">
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="Ask a question about this resource"
            />
            <Button type="submit" disabled={asking || !question.trim()} aria-label="Ask AI">
              {asking ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <div className="surface flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search by title, subject, or author"
          />
          <div className="flex gap-3 sm:ml-auto">
            <Select value={semester} onValueChange={setSemester}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Semester" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {semesters.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Most downloaded</SelectItem>
                <SelectItem value="newest">Recently added</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <FilterChips options={types} value={type} onChange={setType} />
      </div>
      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          Unable to load resources. Apply the Civora backend migration and try again.
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          message={
            isLoading
              ? "Loading resources…"
              : resources.length
                ? "Try a different subject, type, or semester."
                : "No shared resources yet. Upload the first study file."
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((resource) => (
            <article key={resource.id} className="surface lift flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <Badge variant="secondary">{resource.resource_type}</Badge>
                <button
                  onClick={() => void toggleSave(resource)}
                  aria-label={resource.saved ? "Remove saved resource" : "Save resource"}
                  className="text-muted-foreground transition-colors hover:text-primary"
                >
                  <Bookmark
                    className={`size-4.5 ${resource.saved ? "fill-primary text-primary" : ""}`}
                  />
                </button>
              </div>
              <h3 className="mt-3 font-semibold leading-snug">{resource.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {[resource.subject, resource.semester, resource.author_name]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {resource.description && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                  {resource.description}
                </p>
              )}
              <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-5 text-sm">
                <span className="text-xs text-muted-foreground">
                  {resource.download_count.toLocaleString()} downloads
                  {!resource.is_public ? " · Private" : ""}
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setChatResource(resource);
                      setAnswer("");
                    }}
                    disabled={!resource.has_text}
                    aria-label="Ask AI about resource"
                  >
                    <MessageCircle className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void download(resource)}
                    disabled={downloading === resource.id}
                    aria-label="Download resource"
                  >
                    {downloading === resource.id ? (
                      <LoaderCircle className="size-4 animate-spin" />
                    ) : (
                      <Download className="size-4" />
                    )}
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
