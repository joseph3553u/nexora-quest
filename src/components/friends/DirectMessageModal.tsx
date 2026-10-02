import { useState, useEffect, useRef } from "react";
import { Send, Sparkles, MessageCircle, X, CheckCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFriends, type FriendProfile } from "@/hooks/use-friends";

interface DirectMessageModalProps {
  friend: FriendProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const QUICK_PROMPTS = [
  "Hey! Free to study for the PPS lab exam?",
  "Want to team up on the next hackathon project?",
  "Can you share your notes on Data Structures?",
  "Are you attending the placement training session today?",
];

export function DirectMessageModal({ friend, open, onOpenChange }: DirectMessageModalProps) {
  const { currentUserId, allMessages, sendMessage } = useFriends();
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = allMessages.filter(
    (m) =>
      friend &&
      ((m.sender_id === currentUserId && m.receiver_id === friend.id) ||
        (m.sender_id === friend.id && m.receiver_id === currentUserId)),
  );

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [open, conversation.length]);

  if (!friend) return null;

  const initials = friend.display_name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleSend = () => {
    if (!text.trim()) return;
    sendMessage(friend.id, text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 h-[620px] flex flex-col border border-border shadow-lift overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar className="size-10 border border-primary/20">
                <AvatarImage src={friend.avatar_url || undefined} alt={friend.display_name} />
                <AvatarFallback className="bg-primary-softer text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {friend.is_online && (
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full bg-emerald-500 ring-2 ring-background" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm leading-none">{friend.display_name}</h3>
                <span className="font-mono text-xs text-primary">@{friend.civora_id}</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                {friend.department} · {friend.college}
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 text-[10px]"
          >
            Connected Friend
          </Badge>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
          {conversation.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <span className="size-12 rounded-full bg-primary-softer flex items-center justify-center text-primary">
                <MessageCircle className="size-6" />
              </span>
              <div>
                <p className="font-semibold text-sm">
                  Start your conversation with {friend.display_name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Send a message to discuss KLRCET coursework, projects, or exam prep.
                </p>
              </div>
            </div>
          ) : (
            conversation.map((msg) => {
              const isMine = msg.sender_id === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-xs"
                        : "bg-card border border-border text-foreground rounded-bl-xs"
                    }`}
                  >
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1 px-1 flex items-center gap-1">
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {isMine && <CheckCheck className="size-3 text-primary" />}
                  </span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt pills */}
        <div className="px-4 py-2 bg-card border-t border-border flex gap-1.5 overflow-x-auto no-scrollbar">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => {
                sendMessage(friend.id, prompt);
              }}
              className="shrink-0 rounded-full border border-border bg-muted/40 px-2.5 py-1 text-[11px] text-muted-foreground hover:bg-primary-softer hover:text-primary transition-colors"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-card border-t border-border flex items-center gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message @${friend.civora_id}...`}
            className="flex-1 text-sm bg-background"
          />
          <Button size="sm" onClick={handleSend} disabled={!text.trim()} className="gap-1.5 px-4">
            <Send className="size-3.5" />
            <span>Send</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
