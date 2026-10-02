import { useState, useEffect, useRef, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Send,
  LoaderCircle,
  RotateCcw,
  Bot,
  User,
  HelpCircle,
  Calendar,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { askCivoraAssistant } from "@/lib/ai.functions";
import { useProfile } from "@/hooks/use-profile";
import { useCourseProgress } from "@/hooks/use-course-progress";

export type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
};

const CHAT_STORAGE_KEY = "civora_ai_chat_session";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "model",
    text: "Hello Joseph! I'm Civora AI, your personal academic assistant for KLR College of Engineering and Technology (KLRCET). I can help answer questions about your courses, today's schedule, deadlines, or explain concepts in PPS, Mathematics, Physics, and more. How can I help you today?",
    timestamp: "Just now",
  },
];

const SUGGESTIONS = [
  "What classes do I have today?",
  "How is my course progress so far?",
  "Explain pointer concepts in PPS",
  "Study tips for Engineering Mathematics",
  "What deadlines are coming up?",
];

interface CivoraAiChatProps {
  embedded?: boolean;
  className?: string;
  onClose?: () => void;
  initialPrompt?: string | null;
}

export function openCivoraAiChat(prompt?: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-civora-ai", { detail: { prompt } }));
  }
}

export function CivoraAiChat({
  embedded = false,
  className = "",
  onClose,
  initialPrompt,
}: CivoraAiChatProps) {
  const { data: profile } = useProfile();
  const { courses } = useCourseProgress();
  const askFn = useServerFn(askCivoraAssistant);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return INITIAL_MESSAGES;
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastInitialPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      initialPrompt &&
      initialPrompt.trim() &&
      lastInitialPromptRef.current !== initialPrompt.trim()
    ) {
      lastInitialPromptRef.current = initialPrompt.trim();
      void handleSend(initialPrompt.trim());
    }
  }, [initialPrompt]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore quota
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSend(textToSend?: string) {
    const text = (textToSend ?? input).trim();
    if (!text || loading) return;

    setError(null);
    setInput("");

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      // Gather current timetable classes from storage if available
      let todayClasses: Array<{ subject: string; time: string; location: string }> = [];
      try {
        const raw = localStorage.getItem("civora_timetable_classes");
        if (raw) {
          const parsed = JSON.parse(raw);
          const currentWeekday = new Date().getDay();
          todayClasses = (
            parsed as Array<{
              weekday: number;
              subject: string;
              starts_at?: string;
              ends_at?: string;
              location?: string;
            }>
          )
            .filter((c) => c.weekday === currentWeekday)
            .map((c) => ({
              subject: c.subject,
              time: `${c.starts_at?.slice(0, 5) ?? ""}${c.ends_at ? `–${c.ends_at.slice(0, 5)}` : ""}`,
              location: c.location ?? "",
            }));
        }
      } catch {
        // Fallback
      }

      if (todayClasses.length === 0) {
        todayClasses = [
          { subject: "Engineering Physics", time: "09:30–10:30", location: "Room 204" },
          { subject: "Engineering Mathematics", time: "10:30–11:30", location: "Room 204" },
          {
            subject: "Programming for Problem Solving (PPS)",
            time: "11:45–12:45",
            location: "CSE Lab 2",
          },
        ];
      }

      // Gather deadlines
      let deadlines: Array<{ title: string; due: string; category: string }> = [];
      try {
        const rawD = localStorage.getItem("civora_deadlines");
        if (rawD) {
          const parsedD = JSON.parse(rawD);
          deadlines = (
            parsedD as Array<{ title: string; due: string; category: string; done?: boolean }>
          )
            .filter((d) => !d.done)
            .map((d) => ({
              title: d.title,
              due: d.due,
              category: d.category,
            }));
        }
      } catch {
        // Fallback
      }

      const replyText = await askFn({
        data: {
          message: text,
          history: messages.slice(-8).map((m) => ({
            role: m.role,
            text: m.text,
          })),
          context: {
            profile: {
              name: profile?.display_name,
              college: profile?.college || "KLR College of Engineering and Technology (KLRCET)",
              program: profile?.program,
              department: profile?.department,
              semester: profile?.semester,
              cgpa: profile?.cgpa ?? undefined,
              attendance: profile?.attendance ?? undefined,
              credits: profile?.credits ?? undefined,
              skills: profile?.skills,
              targetRole: profile?.target_role,
            },
            courses: courses?.map((c) => ({
              title: c.title,
              progress: c.progress,
              track: c.track,
            })),
            todayClasses,
            deadlines,
          },
        },
      });

      const aiMsg: ChatMessage = {
        id: `model-${Date.now()}`,
        role: "model",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to reach Civora AI assistant.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    setMessages(INITIAL_MESSAGES);
    setError(null);
    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }

  return (
    <div
      className={`surface flex flex-col overflow-hidden border border-border ${
        embedded ? "h-[540px] rounded-xl" : "h-full"
      } ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="status-glow flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          <div>
            <h3 className="font-display text-sm font-semibold leading-none">Civora AI Assistant</h3>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Connected to KLRCET profile &amp; timetable
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground"
            onClick={handleReset}
            title="Reset conversation"
          >
            <RotateCcw className="size-3.5" />
          </Button>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 px-2 text-xs">
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-primary-soft text-accent-foreground"
              }`}
            >
              {m.role === "user" ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
            </span>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 shadow-soft leading-relaxed ${
                m.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/70 text-foreground border border-border"
              }`}
            >
              <div className="whitespace-pre-wrap">{m.text}</div>
              <div
                className={`mt-1 text-[10px] ${
                  m.role === "user"
                    ? "text-primary-foreground/75 text-right"
                    : "text-muted-foreground"
                }`}
              >
                {m.timestamp}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-3">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary-soft text-accent-foreground">
              <Bot className="size-3.5" />
            </span>
            <div className="flex items-center gap-2 rounded-2xl border border-border bg-muted/60 px-4 py-2.5 text-xs text-muted-foreground">
              <LoaderCircle className="size-3.5 animate-spin text-primary" />
              <span>Civora AI is thinking…</span>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            <p className="font-semibold">Unable to generate response</p>
            <p className="mt-1">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 h-7 text-xs"
              onClick={() => handleSend(messages[messages.length - 1]?.text)}
            >
              Try again
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested chips if conversation is young */}
      {messages.length <= 3 && !loading && (
        <div className="border-t border-border/60 bg-muted/20 px-3 py-2">
          <p className="mb-1.5 text-[11px] font-medium text-muted-foreground">Suggestions:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((item) => (
              <button
                key={item}
                onClick={() => void handleSend(item)}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary hover:text-primary"
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
        className="border-t border-border bg-card p-3"
      >
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about timetable, courses, exams, or PPS & Math topics…"
            disabled={loading}
            className="flex-1 bg-background"
          />
          <Button type="submit" disabled={loading || !input.trim()} size="icon">
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
