import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Users,
  Search,
  UserPlus,
  MessageCircle,
  FolderKanban,
  Check,
  X,
  Sparkles,
  Clock,
  ShieldCheck,
  Copy,
  CheckCircle2,
  Trash2,
  ArrowRight,
  AtSign,
} from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  useFriends,
  type FriendProfile,
  type FriendshipItem,
  type ProjectCollaborationItem,
} from "@/hooks/use-friends";
import { DirectMessageModal } from "@/components/friends/DirectMessageModal";
import { ProjectCollabModal } from "@/components/friends/ProjectCollabModal";
import { StudentPublicProfileModal } from "@/components/friends/StudentPublicProfileModal";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/friends")({
  head: () => ({
    meta: [
      { title: "Friends & Collaborators · Civora" },
      {
        name: "description",
        content:
          "Search students by Civora ID, manage friend requests, message peers, and send project collaboration invites.",
      },
    ],
  }),
  component: FriendsPage,
});

export function FriendsPage() {
  const {
    currentProfile,
    acceptedFriends,
    receivedFriendRequests,
    sentFriendRequests,
    receivedCollabs,
    sentCollabs,
    searchStudent,
    sendFriendRequest,
    acceptFriendRequest,
    removeOrRejectFriend,
    respondProjectCollab,
    seedStudents,
  } = useFriends();

  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<FriendProfile | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);

  // Modal states
  const [messageStudent, setMessageStudent] = useState<FriendProfile | null>(null);
  const [messageOpen, setMessageOpen] = useState(false);

  const [collabStudent, setCollabStudent] = useState<FriendProfile | null>(null);
  const [collabOpen, setCollabOpen] = useState(false);

  const [profileModalStudent, setProfileModalStudent] = useState<FriendProfile | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  const handleSearch = async (targetId?: string) => {
    const query = (targetId ?? searchQuery).trim();
    if (!query) {
      toast.error("Please enter a Civora ID to search.");
      return;
    }

    setSearching(true);
    setSearchAttempted(true);
    try {
      const student = await searchStudent(query);
      setSearchResult(student);
      if (!student) {
        toast.error(`No student found with Civora ID "@${query.replace(/^@/, "")}".`);
      }
    } finally {
      setSearching(false);
    }
  };

  const copyMyHandle = () => {
    if (!currentProfile?.civora_id) return;
    navigator.clipboard.writeText(`@${currentProfile.civora_id}`);
    toast.success(`Copied handle @${currentProfile.civora_id} to clipboard!`);
  };

  const openMessaging = (student: FriendProfile) => {
    setMessageStudent(student);
    setMessageOpen(true);
  };

  const openCollab = (student: FriendProfile) => {
    setCollabStudent(student);
    setCollabOpen(true);
  };

  const openProfile = (student: FriendProfile) => {
    setProfileModalStudent(student);
    setProfileModalOpen(true);
  };

  const totalPendingRequests = receivedFriendRequests.length + receivedCollabs.length;

  return (
    <div className="space-y-6">
      {/* Page Header with My Handle */}
      <PageHeader
        eyebrow="Campus Network"
        title="Friends & Peer Collaboration"
        description="Search students using unique Civora IDs, message peers 1-to-1, and send project collaboration invites."
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary-softer px-3.5 py-1.5 text-xs font-medium text-primary">
              <span className="text-muted-foreground">My Civora ID:</span>
              <span className="font-mono font-bold text-foreground">
                @{currentProfile?.civora_id || "joseph.klrcet"}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="size-5 hover:bg-primary/20 text-primary"
                onClick={copyMyHandle}
                title="Copy my Civora ID"
              >
                <Copy className="size-3" />
              </Button>
            </div>
          </div>
        }
      />

      {/* Civora ID Search Bar Card */}
      <div className="surface p-5 sm:p-6 space-y-4">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Search className="size-4 text-primary" />
            <span>Search Student by Exact Civora ID</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enter another student's unique Civora handle (e.g.{" "}
            <span className="font-mono text-primary">priya.cse26</span>,{" "}
            <span className="font-mono text-primary">rahul.dev</span>,{" "}
            <span className="font-mono text-primary">ananya.math</span>) to connect.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1">
            <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchAttempted(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
              placeholder="e.g. priya.cse26 or rahul.dev"
              className="pl-9 font-mono text-sm"
            />
          </div>
          <Button onClick={() => handleSearch()} disabled={searching} className="gap-2">
            <Search className="size-4" />
            <span>{searching ? "Searching..." : "Search ID"}</span>
          </Button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-muted-foreground text-[11px]">Quick Try:</span>
          {["priya.cse26", "rahul.dev", "ananya.math", "karthik.web"].map((handle) => (
            <button
              key={handle}
              type="button"
              onClick={() => {
                setSearchQuery(handle);
                handleSearch(handle);
              }}
              className="font-mono text-[11px] rounded-md border border-border bg-card px-2 py-0.5 hover:border-primary hover:text-primary transition-colors"
            >
              @{handle}
            </button>
          ))}
        </div>

        {/* Search Result Banner */}
        {searchAttempted && searchResult && (
          <div className="mt-4 rounded-xl border border-primary/40 bg-primary-softer/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <Avatar className="size-12 border border-primary/30">
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {searchResult.display_name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-sm">{searchResult.display_name}</h4>
                  <Badge
                    variant="outline"
                    className="font-mono text-xs border-primary/30 text-primary"
                  >
                    @{searchResult.civora_id}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {searchResult.program} · {searchResult.department}
                </p>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {searchResult.skills.slice(0, 3).map((s) => (
                    <span
                      key={s}
                      className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => openProfile(searchResult)}
              >
                View Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-primary/40 text-primary hover:bg-primary/10 text-xs gap-1"
                onClick={() => openCollab(searchResult)}
              >
                <FolderKanban className="size-3.5" />
                <span>Project Collab</span>
              </Button>
              <Button
                size="sm"
                className="text-xs gap-1"
                onClick={() => sendFriendRequest(searchResult)}
              >
                <UserPlus className="size-3.5" />
                <span>Add Friend</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Navigation Tabs */}
      <Tabs defaultValue="friends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 sm:w-auto sm:inline-grid">
          <TabsTrigger value="friends" className="gap-1.5">
            <Users className="size-3.5" />
            <span>Friends ({acceptedFriends.length})</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="gap-1.5 relative">
            <UserPlus className="size-3.5" />
            <span>Requests</span>
            {receivedFriendRequests.length > 0 && (
              <span className="size-4 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {receivedFriendRequests.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="collabs" className="gap-1.5 relative">
            <FolderKanban className="size-3.5" />
            <span>Project Collabs</span>
            {receivedCollabs.length > 0 && (
              <span className="size-4 rounded-full bg-emerald-600 text-[10px] font-bold text-white flex items-center justify-center">
                {receivedCollabs.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="directory" className="gap-1.5">
            <Sparkles className="size-3.5" />
            <span>Discover Peers</span>
          </TabsTrigger>
        </TabsList>

        {/* 1. Friends Tab */}
        <TabsContent value="friends" className="space-y-4">
          {acceptedFriends.length === 0 ? (
            <div className="surface p-12 text-center space-y-3">
              <span className="size-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                <Users className="size-6" />
              </span>
              <div className="max-w-md mx-auto">
                <h3 className="font-semibold text-base">No Friends Added Yet</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Connect with your classmates at KLRCET using their Civora IDs above to unlock
                  1-to-1 direct messaging and project collaborations.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {acceptedFriends.map((f) => {
                const friend = f.profile;
                return (
                  <div
                    key={f.id}
                    className="surface lift p-5 flex flex-col justify-between gap-4 border border-border transition-all hover:border-primary/40"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <Avatar className="size-12 border border-primary/20">
                            <AvatarImage
                              src={friend.avatar_url || undefined}
                              alt={friend.display_name}
                            />
                            <AvatarFallback className="bg-primary-softer text-primary font-bold">
                              {friend.display_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          {friend.is_online && (
                            <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-500 ring-2 ring-background" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4
                              className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
                              onClick={() => openProfile(friend)}
                            >
                              {friend.display_name}
                            </h4>
                            <span className="font-mono text-xs text-primary">
                              @{friend.civora_id}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {friend.department} · {friend.semester}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {friend.skills.slice(0, 3).map((s) => (
                              <span
                                key={s}
                                className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground font-medium"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10 text-xs h-8"
                        onClick={() => removeOrRejectFriend(f.id)}
                      >
                        <Trash2 className="size-3.5 mr-1" />
                        <span>Remove</span>
                      </Button>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1.5"
                          onClick={() => openCollab(friend)}
                        >
                          <FolderKanban className="size-3.5" />
                          <span>Project Collab</span>
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => openMessaging(friend)}
                        >
                          <MessageCircle className="size-3.5" />
                          <span>Message</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* 2. Requests Tab */}
        <TabsContent value="requests" className="space-y-6">
          {/* Received Requests */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <UserPlus className="size-4 text-primary" />
              <span>Received Friend Requests ({receivedFriendRequests.length})</span>
            </h3>

            {receivedFriendRequests.length === 0 ? (
              <div className="surface p-6 text-center text-xs text-muted-foreground">
                No incoming friend requests at the moment.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {receivedFriendRequests.map((r) => (
                  <div key={r.id} className="surface p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-primary-softer text-primary font-bold text-xs">
                          {r.profile.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm">{r.profile.display_name}</span>
                          <span className="font-mono text-xs text-primary">
                            @{r.profile.civora_id}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">{r.profile.department}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        size="icon"
                        variant="outline"
                        className="size-8 text-destructive hover:bg-destructive/10"
                        onClick={() => removeOrRejectFriend(r.id)}
                        title="Decline request"
                      >
                        <X className="size-4" />
                      </Button>
                      <Button
                        size="icon"
                        className="size-8"
                        onClick={() => acceptFriendRequest(r.id)}
                        title="Accept request"
                      >
                        <Check className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Requests */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span>Pending Requests You Sent ({sentFriendRequests.length})</span>
            </h3>

            {sentFriendRequests.length === 0 ? (
              <div className="surface p-6 text-center text-xs text-muted-foreground">
                You have no pending requests sent to other students.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {sentFriendRequests.map((r) => (
                  <div key={r.id} className="surface p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-muted text-muted-foreground font-bold text-xs">
                          {r.profile.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm">{r.profile.display_name}</span>
                          <span className="font-mono text-xs text-primary">
                            @{r.profile.civora_id}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                          Request sent {new Date(r.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => removeOrRejectFriend(r.id)}
                    >
                      Cancel
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 3. Project Collabs Tab */}
        <TabsContent value="collabs" className="space-y-6">
          {/* Received Collab Requests */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <FolderKanban className="size-4 text-primary" />
              <span>Received Project Collaboration Invites ({receivedCollabs.length})</span>
            </h3>

            {receivedCollabs.length === 0 ? (
              <div className="surface p-6 text-center text-xs text-muted-foreground">
                No pending project collaboration requests received.
              </div>
            ) : (
              <div className="space-y-3">
                {receivedCollabs.map((c) => (
                  <div key={c.id} className="surface p-5 space-y-3 border border-primary/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="border-primary/40 bg-primary-softer text-primary text-xs"
                          >
                            Collaboration Pitch
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            From @{c.other_profile.civora_id} ({c.other_profile.display_name})
                          </span>
                        </div>
                        <h4 className="mt-1 font-semibold text-base">{c.project_title}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => respondProjectCollab(c.id, "declined")}
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          className="gap-1.5"
                          onClick={() => respondProjectCollab(c.id, "accepted")}
                        >
                          <Check className="size-4" />
                          <span>Accept &amp; Join Team</span>
                        </Button>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 p-3 rounded-lg">
                      {c.project_pitch}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-semibold text-muted-foreground">
                        Skills Required:
                      </span>
                      {c.skills_needed.map((skill) => (
                        <span
                          key={skill}
                          className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium text-foreground"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sent Collab Requests */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm flex items-center gap-2">
              <Clock className="size-4 text-muted-foreground" />
              <span>Collaboration Invites You Sent ({sentCollabs.length})</span>
            </h3>

            {sentCollabs.length === 0 ? (
              <div className="surface p-6 text-center text-xs text-muted-foreground">
                You haven't sent any project collaboration invites yet.
              </div>
            ) : (
              <div className="space-y-3">
                {sentCollabs.map((c) => (
                  <div
                    key={c.id}
                    className="surface p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{c.project_title}</h4>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] ${
                            c.status === "accepted"
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                              : c.status === "declined"
                                ? "bg-destructive/15 text-destructive"
                                : "bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {c.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Sent to @{c.other_profile.civora_id} ({c.other_profile.display_name})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {c.status === "accepted" ? (
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1.5"
                          onClick={() => openMessaging(c.other_profile)}
                        >
                          <MessageCircle className="size-3.5" />
                          <span>Message Collaborator</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">Pending reply</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        {/* 4. Discover Peers Directory */}
        <TabsContent value="directory" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {seedStudents.map((student) => {
              const isFriend = acceptedFriends.some((f) => f.profile.id === student.id);
              const isPending = sentFriendRequests.some((f) => f.profile.id === student.id);

              return (
                <div
                  key={student.id}
                  className="surface lift p-5 flex flex-col justify-between gap-4"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="relative">
                      <Avatar className="size-12 border border-primary/20">
                        <AvatarFallback className="bg-primary-softer text-primary font-bold">
                          {student.display_name.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {student.is_online && (
                        <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className="font-semibold text-sm hover:text-primary transition-colors cursor-pointer"
                          onClick={() => openProfile(student)}
                        >
                          {student.display_name}
                        </h4>
                        <span className="font-mono text-xs text-primary font-medium">
                          @{student.civora_id}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {student.program} · {student.department}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {student.skills.slice(0, 3).map((skill) => (
                          <span
                            key={skill}
                            className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-8"
                      onClick={() => openProfile(student)}
                    >
                      View Profile
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/10 gap-1"
                        onClick={() => openCollab(student)}
                      >
                        <FolderKanban className="size-3.5" />
                        <span>Collab</span>
                      </Button>

                      {isFriend ? (
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => openMessaging(student)}
                        >
                          <MessageCircle className="size-3.5" />
                          <span>Chat</span>
                        </Button>
                      ) : isPending ? (
                        <Button variant="secondary" disabled size="sm" className="h-8 text-xs">
                          Requested
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 text-xs gap-1"
                          onClick={() => sendFriendRequest(student)}
                        >
                          <UserPlus className="size-3.5" />
                          <span>Add</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Direct Messaging Modal */}
      <DirectMessageModal
        friend={messageStudent}
        open={messageOpen}
        onOpenChange={setMessageOpen}
      />

      {/* Project Collaboration Modal */}
      <ProjectCollabModal student={collabStudent} open={collabOpen} onOpenChange={setCollabOpen} />

      {/* Public Profile View Modal */}
      <StudentPublicProfileModal
        student={profileModalStudent}
        open={profileModalOpen}
        onOpenChange={setProfileModalOpen}
        onOpenMessage={openMessaging}
        onOpenCollab={openCollab}
      />
    </div>
  );
}
