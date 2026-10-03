import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState, type FormEvent } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, Send } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";
import { EmptyState, FilterChips } from "@/components/common/FilterBar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { backend } from "@/integrations/supabase/backend";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/hooks/use-profile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { posts as seedPosts } from "@/data/demo";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({
    meta: [
      { title: "Student Community · Civora" },
      {
        name: "description",
        content: "Ask questions, share wins, and keep up with what your batch is talking about.",
      },
      { property: "og:title", content: "Student Community · Civora" },
    ],
  }),
  component: Community,
});
const spaces = ["All", "Academics", "Placements", "Competitions", "Projects"];
type Post = {
  id: string;
  author_id: string;
  author_name: string;
  author_role: string;
  space: string;
  body: string;
  created_at: string;
  likes: number;
  liked: boolean;
  replies: number;
};
type Comment = { id: string; author_name: string; body: string; created_at: string };
function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function Community() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const [space, setSpace] = useState("All");
  const [draft, setDraft] = useState("");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const { data: userId } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) throw error;
      return data.user?.id ?? "";
    },
  });
  const {
    data: items = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["community-posts", userId],
    queryFn: async (): Promise<Post[]> => {
      let remotePosts: Post[] = [];
      try {
        const [postsResult, likesResult, commentsResult] = await Promise.all([
          backend
            .from("community_posts")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100),
          backend.from("community_likes").select("post_id, user_id"),
          backend.from("community_comments").select("post_id"),
        ]);
        if (!postsResult.error && postsResult.data && postsResult.data.length > 0) {
          remotePosts = postsResult.data.map((post: Omit<Post, "likes" | "liked" | "replies">) => {
            const likes =
              likesResult.data?.filter((row: { post_id: string }) => row.post_id === post.id) ?? [];
            const replies =
              commentsResult.data?.filter((row: { post_id: string }) => row.post_id === post.id)
                .length ?? 0;
            return {
              ...post,
              likes: likes.length,
              liked: likes.some((row: { user_id: string }) => row.user_id === userId),
              replies,
            } as Post;
          });
        }
      } catch {
        // Fall back to local
      }

      let localPosts: Post[] = [];
      try {
        const raw = localStorage.getItem("civora_community_posts");
        if (raw) localPosts = JSON.parse(raw);
      } catch {
        // Ignore
      }

      if (remotePosts.length > 0) {
        const ids = new Set(remotePosts.map((p) => p.id));
        return [...localPosts.filter((p) => !ids.has(p.id)), ...remotePosts];
      }

      const defaultPosts: Post[] = seedPosts.map((p) => ({
        id: p.id,
        author_id: "author-" + p.id,
        author_name: p.author,
        author_role: p.role,
        space: p.space,
        body: p.body,
        created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
        likes: p.likes,
        liked: p.liked,
        replies: p.replies,
      }));

      return [...localPosts, ...defaultPosts];
    },
  });
  const list = useMemo(
    () => items.filter((post) => space === "All" || post.space === space),
    [items, space],
  );
  const { data: comments = [], isLoading: commentsLoading } = useQuery({
    queryKey: ["community-comments", selectedPost?.id],
    enabled: !!selectedPost,
    queryFn: async () => {
      let remoteComments: Comment[] = [];
      try {
        const { data, error } = await backend
          .from("community_comments")
          .select("id, author_name, body, created_at")
          .eq("post_id", selectedPost!.id)
          .order("created_at");
        if (!error && data) remoteComments = data as Comment[];
      } catch {
        // Fall back to local
      }

      let localComments: Comment[] = [];
      try {
        const raw = localStorage.getItem(`civora_comments_${selectedPost!.id}`);
        if (raw) localComments = JSON.parse(raw);
      } catch {
        // Ignore
      }

      return [...remoteComments, ...localComments];
    },
  });

  async function publish(event: FormEvent) {
    event.preventDefault();
    if (!draft.trim()) {
      toast("Write something first");
      return;
    }
    const authorName = profile?.display_name || "Alex";
    const authorRole =
      [profile?.department, profile?.semester].filter(Boolean).join(" · ") || "CSE · Semester 5";

    const newPost: Post = {
      id: `post-local-${Date.now()}`,
      author_id: userId || "local-user",
      author_name: authorName,
      author_role: authorRole,
      space: space === "All" ? "Academics" : space,
      body: draft.trim(),
      created_at: new Date().toISOString(),
      likes: 0,
      liked: false,
      replies: 0,
    };

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await backend.from("community_posts").insert({
          author_id: user.id,
          author_name: authorName,
          author_role: authorRole,
          space: space === "All" ? "Academics" : space,
          body: draft.trim(),
        });
      }
    } catch {
      // Handled via local storage
    }

    try {
      const raw = localStorage.getItem("civora_community_posts");
      const current = raw ? JSON.parse(raw) : [];
      localStorage.setItem("civora_community_posts", JSON.stringify([newPost, ...current]));
    } catch {
      // Ignore
    }

    setDraft("");
    await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
    toast("Posted to the community");
  }

  async function toggleLike(post: Post) {
    try {
      if (userId) {
        if (post.liked) {
          await backend
            .from("community_likes")
            .delete()
            .eq("post_id", post.id)
            .eq("user_id", userId);
        } else {
          await backend.from("community_likes").insert({ post_id: post.id, user_id: userId });
        }
      }
    } catch {
      // Fallback
    }

    // Update local post state in localStorage
    try {
      const raw = localStorage.getItem("civora_community_posts");
      const current: Post[] = raw ? JSON.parse(raw) : [];
      const updated = current.map((p) =>
        p.id === post.id
          ? { ...p, liked: !p.liked, likes: p.liked ? Math.max(0, p.likes - 1) : p.likes + 1 }
          : p,
      );
      localStorage.setItem("civora_community_posts", JSON.stringify(updated));
    } catch {
      // Ignore
    }

    await queryClient.invalidateQueries({ queryKey: ["community-posts"] });
  }

  async function addComment(event: FormEvent) {
    event.preventDefault();
    if (!selectedPost || !commentDraft.trim()) return;
    const authorName = profile?.display_name || "Alex";

    const newComment: Comment = {
      id: `comm-local-${Date.now()}`,
      author_name: authorName,
      body: commentDraft.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await backend.from("community_comments").insert({
          post_id: selectedPost.id,
          author_id: user.id,
          author_name: authorName,
          body: commentDraft.trim(),
        });
      }
    } catch {
      // Handled via local storage
    }

    try {
      const raw = localStorage.getItem(`civora_comments_${selectedPost.id}`);
      const current = raw ? JSON.parse(raw) : [];
      localStorage.setItem(
        `civora_comments_${selectedPost.id}`,
        JSON.stringify([...current, newComment]),
      );
    } catch {
      // Ignore
    }

    setCommentDraft("");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["community-comments", selectedPost.id] }),
      queryClient.invalidateQueries({ queryKey: ["community-posts"] }),
    ]);
    toast("Comment added");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your batch"
        title="Student Community"
        description="Threads from across departments. Post a question or share what you just learned."
      />
      <FilterChips options={spaces} value={space} onChange={setSpace} />
      <form className="surface p-5" onSubmit={publish}>
        <div className="flex gap-3">
          <Avatar className="size-9">
            <AvatarFallback className="bg-primary-soft text-xs font-semibold text-accent-foreground">
              {initials(profile?.display_name || "Student")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-3">
            <Textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Share an update, a question or a resource…"
              rows={3}
              maxLength={5000}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Posting to {space === "All" ? "Academics" : space}
              </p>
              <Button type="submit">
                <Send className="size-4" /> Post
              </Button>
            </div>
          </div>
        </div>
      </form>
      {isError ? (
        <p role="alert" className="text-sm text-destructive">
          Unable to load the community. Apply the Civora backend migration and try again.
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading posts…</p>
      ) : list.length === 0 ? (
        <EmptyState message="No posts in this space yet." />
      ) : (
        <div className="space-y-4">
          {list.map((post) => (
            <article key={post.id} className="surface p-5">
              <div className="flex items-center gap-3">
                <Avatar className="size-9">
                  <AvatarFallback className="bg-muted text-xs font-semibold">
                    {initials(post.author_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{post.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {post.author_role || "Civora student"} ·{" "}
                    {new Date(post.created_at).toLocaleString()}
                  </p>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {post.space}
                </Badge>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
              <div className="mt-4 flex items-center gap-5 text-sm text-muted-foreground">
                <button
                  className={cn(
                    "flex items-center gap-1.5 transition-colors hover:text-primary",
                    post.liked && "text-primary",
                  )}
                  onClick={() => void toggleLike(post)}
                >
                  <Heart className={cn("size-4", post.liked && "fill-primary")} /> {post.likes}
                </button>
                <button
                  className="flex items-center gap-1.5 transition-colors hover:text-primary"
                  onClick={() => setSelectedPost(post)}
                >
                  <MessageCircle className="size-4" /> {post.replies}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
      <Dialog
        open={!!selectedPost}
        onOpenChange={(open) => {
          if (!open) setSelectedPost(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replies</DialogTitle>
          </DialogHeader>
          <p className="line-clamp-3 rounded-md bg-muted p-3 text-sm">{selectedPost?.body}</p>
          <div className="max-h-[40vh] space-y-3 overflow-y-auto">
            {commentsLoading ? (
              <p className="text-sm text-muted-foreground">Loading replies…</p>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No replies yet. Start the conversation.
              </p>
            ) : (
              comments.map((comment) => (
                <article key={comment.id} className="rounded-md border border-border p-3">
                  <p className="text-xs font-semibold">
                    {comment.author_name} · {new Date(comment.created_at).toLocaleString()}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-sm">{comment.body}</p>
                </article>
              ))
            )}
          </div>
          <form onSubmit={addComment} className="flex gap-2">
            <Input
              value={commentDraft}
              onChange={(event) => setCommentDraft(event.target.value)}
              placeholder="Write a reply"
              maxLength={2000}
            />
            <Button type="submit" disabled={!commentDraft.trim()} aria-label="Send reply">
              <Send className="size-4" />
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
