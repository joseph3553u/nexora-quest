import { useState } from "react";
import { FolderKanban, Sparkles, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useFriends, type FriendProfile } from "@/hooks/use-friends";
import { toast } from "sonner";

interface ProjectCollabModalProps {
  student: FriendProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProjectCollabModal({ student, open, onOpenChange }: ProjectCollabModalProps) {
  const { sendProjectCollab } = useFriends();
  const [title, setTitle] = useState("");
  const [pitch, setPitch] = useState("");
  const [skills, setSkills] = useState("React, Python, FastAPI");
  const [submitting, setSubmitting] = useState(false);

  if (!student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !pitch.trim()) {
      toast.error("Please enter a project title and description.");
      return;
    }

    setSubmitting(true);
    try {
      const parsedSkills = skills
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      await sendProjectCollab(student, title.trim(), pitch.trim(), parsedSkills);
      setTitle("");
      setPitch("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-6">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center gap-2">
            <span className="size-8 rounded-lg bg-primary-softer flex items-center justify-center text-primary">
              <FolderKanban className="size-4" />
            </span>
            <Badge variant="outline" className="text-primary border-primary/30">
              Project Collaboration Invite
            </Badge>
          </div>
          <DialogTitle className="text-xl font-semibold">
            Invite @{student.civora_id} to Collaborate
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Send an official project collaboration invite with your project vision and role
            requirements.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs font-semibold">
              Project Title *
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. AI Question Bank & Paper Analyzer"
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pitch" className="text-xs font-semibold">
              Project Pitch &amp; What You're Building *
            </Label>
            <Textarea
              id="pitch"
              value={pitch}
              onChange={(e) => setPitch(e.target.value)}
              placeholder="Explain the problem you're solving, tech stack, and what role you'd like them to take..."
              rows={4}
              required
              className="text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="skills" className="text-xs font-semibold">
              Skills Needed (comma-separated)
            </Label>
            <Input
              id="skills"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="e.g. React, Python, PostgreSQL, UI Design"
              className="text-sm font-mono"
            />
          </div>

          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" /> Recipient Overview:
            </p>
            <p>
              {student.display_name} specializes in{" "}
              <span className="font-semibold text-foreground">
                {student.skills.slice(0, 3).join(", ")}
              </span>{" "}
              and targets{" "}
              <span className="font-semibold text-foreground">{student.target_role}</span>.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="gap-1.5">
              <Send className="size-3.5" />
              <span>{submitting ? "Sending..." : "Send Collab Request"}</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
