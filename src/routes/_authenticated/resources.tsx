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
    data: resources = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["resources"],
    queryFn: async () => {
      const [resourceResult, savedResult] = await Promise.all([
        backend
          .from("resources")
          .select(
            "id, owner_id, title, description, subject, resource_type, semester, author_name, file_name, storage_path, mime_type, size_bytes, is_public, has_text, download_count, created_at",
          )
          .order("created_at", { ascending: false }),
        backend.from("resource_saves").select("resource_id"),
      ]);
      if (resourceResult.error) throw resourceResult.error;
      if (savedResult.error) throw savedResult.error;
      const saved = new Set(
        (savedResult.data ?? []).map((row: { resource_id: string }) => row.resource_id),
      );
      return ((resourceResult.data ?? []) as ResourceRow[]).map((row) => ({
        ...row,
        saved: saved.has(row.id),
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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Your session expired. Please sign in again.");
      if (file.size > 20 * 1024 * 1024) throw new Error("Files must be 20 MB or smaller.");
      const ext = file.name.split(".").pop()?.toLowerCase();
      const allowed =
        file.type === "application/pdf" ||
        file.type === "text/plain" ||
        file.type === "text/markdown" ||
        ext === "md" ||
        ext === "txt" ||
        ext === "pdf";
      if (!allowed) throw new Error("Upload a PDF, Markdown, or text file.");
      const mimeType =
        file.type ||
        (ext === "md" ? "text/markdown" : ext === "txt" ? "text/plain" : "application/pdf");
      let extractedText = "";
      if (mimeType === "application/pdf") {
        try {
          extractedText = await extractPdfText(file, 100_000);
        } catch (error) {
          if (error instanceof Error && error.message.includes("No readable text"))
            toast("This PDF is scanned; it will upload, but AI chat needs selectable text.");
          else throw error;
        }
      } else {
        extractedText = (await file.text()).slice(0, 100_000);
      }
      path = `${user.id}/resources/${crypto.randomUUID()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100)}`;
      const { error: storageError } = await backend.storage
        .from("civora-files")
        .upload(path, file, { contentType: mimeType, upsert: false });
      if (storageError) throw storageError;
      const { error } = await backend.from("resources").insert({
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
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["resources"] });
      setUploadOpen(false);
      setUploadForm({ title: "", subject: "", semester: "", description: "" });
      toast(isPublic ? "Resource uploaded and shared" : "Resource uploaded privately");
    } catch (error) {
      if (path) await backend.storage.from("civora-files").remove([path]);
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const result = resource.saved
      ? await backend
          .from("resource_saves")
          .delete()
          .eq("resource_id", resource.id)
          .eq("user_id", user.id)
      : await backend.from("resource_saves").insert({ resource_id: resource.id, user_id: user.id });
    if (result.error) {
      toast(result.error.message);
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["resources"] });
  }
  async function download(resource: ResourceRow) {
    setDownloading(resource.id);
    try {
      const { data, error } = await backend.storage
        .from("civora-files")
        .createSignedUrl(resource.storage_path, 120);
      if (error) throw error;
      await backend.rpc("increment_resource_download", { _resource_id: resource.id });
      const anchor = document.createElement("a");
      anchor.href = data.signedUrl;
      anchor.download = resource.file_name;
      anchor.rel = "noopener noreferrer";
      anchor.click();
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
      const result = await askQuestion({
        data: { resourceId: chatResource.id, question: question.trim() },
      });
      setAnswer(result);
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
