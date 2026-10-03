import {
  Building,
  GraduationCap,
  Target,
  Sparkles,
  UserPlus,
  MessageCircle,
  FolderKanban,
  CheckCircle2,
  Clock,
  ArrowLeftRight,
} from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFriends, type FriendProfile } from "@/hooks/use-friends";

interface StudentPublicProfileModalProps {
  student: FriendProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenMessage?: (student: FriendProfile) => void;
  onOpenCollab?: (student: FriendProfile) => void;
}

export function StudentPublicProfileModal({
  student,
  open,
  onOpenChange,
  onOpenMessage,
  onOpenCollab,
}: StudentPublicProfileModalProps) {
  const navigate = useNavigate();
  const { currentUserId, acceptedFriends, sentFriendRequests, sendFriendRequest } = useFriends();

  if (!student) return null;

  const isSelf = student.id === currentUserId;
  const isFriend = acceptedFriends.some((f) => f.profile.id === student.id);
  const isPendingSent = sentFriendRequests.some((f) => f.profile.id === student.id);

  const initials = student.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader className="space-y-4 text-center items-center">
          <div className="relative">
            <Avatar className="size-20 border-2 border-primary/30 shadow-md">
              <AvatarImage src={student.avatar_url || undefined} alt={student.display_name} />
              <AvatarFallback className="bg-primary-softer text-primary text-xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            {student.is_online && (
              <span className="absolute bottom-1 right-1 size-3.5 rounded-full bg-emerald-500 ring-2 ring-background" />
            )}
          </div>

          <div className="space-y-1">
            <DialogTitle className="text-xl font-bold flex items-center justify-center gap-1.5">
              <span>{student.display_name}</span>
              <CheckCircle2 className="size-4 text-primary fill-primary/20" />
            </DialogTitle>
            <p className="font-mono text-sm text-primary font-medium">@{student.civora_id}</p>
            <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Building className="size-3 text-muted-foreground" />
              <span>{student.college}</span>
            </p>
          </div>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          {/* Academic Info */}
          <div className="rounded-xl border border-border bg-card/60 p-4 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <GraduationCap className="size-3.5 text-primary" /> Program &amp; Branch:
              </span>
              <span className="font-medium text-foreground">{student.program}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Department:</span>
              <span className="font-medium text-foreground">{student.department}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Current Term:</span>
              <span className="font-medium text-foreground">{student.semester}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Target className="size-3.5 text-primary" /> Target Role:
              </span>
              <Badge variant="secondary" className="text-[11px] font-medium">
                {student.target_role}
              </Badge>
            </div>
          </div>

          {/* Technical Skills */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Verified Technical Skills
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {student.skills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-md border border-primary/20 bg-primary-softer px-2.5 py-1 text-xs font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          {!isSelf && (
            <div className="pt-3 border-t border-border flex flex-col gap-2">
              <div className="flex items-center gap-2">
                {isFriend ? (
                  <Button
                    className="flex-1 gap-1.5"
                    onClick={() => {
                      onOpenChange(false);
                      onOpenMessage?.(student);
                    }}
                  >
                    <MessageCircle className="size-4" />
                    <span>Message 1-to-1</span>
                  </Button>
                ) : isPendingSent ? (
                  <Button variant="secondary" disabled className="flex-1 gap-1.5 text-xs">
                    <Clock className="size-3.5" />
                    <span>Friend Request Pending</span>
                  </Button>
                ) : (
                  <Button className="flex-1 gap-1.5" onClick={() => sendFriendRequest(student)}>
                    <UserPlus className="size-4" />
                    <span>Add Friend</span>
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenCollab?.(student);
                  }}
                >
                  <FolderKanban className="size-4" />
                  <span>Project Collab</span>
                </Button>
              </div>

              <Button
                variant="secondary"
                className="w-full gap-2 border border-primary/20 text-xs font-semibold hover:border-primary/40"
                onClick={() => {
                  onOpenChange(false);
                  navigate({ to: "/skill-swapper" });
                }}
              >
                <ArrowLeftRight className="size-3.5 text-primary" />
                <span>1-on-1 Skill Swap Room</span>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
