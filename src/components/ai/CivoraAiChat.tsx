import { useState, useEffect, useRef, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Sparkles,
  Send,
  LoaderCircle,
  RotateCcw,
  Bot,
  User,
  X,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Terminal,
  Cpu,
  Radio,
  Copy,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { askCivoraAssistant } from "@/lib/ai.functions";
import { useProfile } from "@/hooks/use-profile";
import { useCourseProgress } from "@/hooks/use-course-progress";
import { toast } from "sonner";

export type ChatMessage = {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: string;
};

const CHAT_STORAGE_KEY = "civora_ai_chat_session_v3";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome-1",
    role: "model",
    text: "Hello Alex! I am your Civora Academic Intelligence Copilot for KLRCET. I have live access to your enrolled courses, class timetable, and deadline tracker. Ask me about your PPS pointer assignments, Engineering Mathematics, or what you should prioritize today.",
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
  initialVoiceMode?: boolean;
}

export function openCivoraAiChat(prompt?: string, voice?: boolean) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("open-civora-ai", { detail: { prompt, voice } }));
  }
}

export function CivoraAiChat({
  embedded = false,
  className = "",
  onClose,
  initialPrompt,
  initialVoiceMode = false,
}: CivoraAiChatProps) {
  const { data: profile } = useProfile();
  const { courses } = useCourseProgress();
  const askFn = useServerFn(askCivoraAssistant);

  const [mode, setMode] = useState<"text" | "voice">(initialVoiceMode ? "voice" : "text");
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (typeof window === "undefined") return INITIAL_MESSAGES;
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      if (saved && !saved.includes("Joseph")) return JSON.parse(saved);
      return INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Voice AI States
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechMuted, setSpeechMuted] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const lastTranscriptRef = useRef("");
  const recognitionRef = useRef<{
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    onstart: (() => void) | null;
    onresult:
      | ((event: {
          results: ArrayLike<{
            [index: number]: { transcript: string } | undefined;
          }>;
        }) => void)
      | null;
    onerror: ((event: unknown) => void) | null;
    onend: (() => void) | null;
    start: () => void;
    stop: () => void;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastInitialPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (initialVoiceMode) setMode("voice");
  }, [initialVoiceMode]);

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

  // Voice Synthesis: Speak responses if unmuted
  const speakResponse = (text: string) => {
    if (speechMuted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      // Clean markdown symbols for cleaner voice speech
      const cleanText = text
        .replace(/[#*`_~]/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .slice(0, 350);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Select natural English voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices && voices.length > 0) {
        const preferred =
          voices.find(
            (v) =>
              v.lang.startsWith("en") &&
              (v.name.includes("Natural") ||
                v.name.includes("Google") ||
                v.name.includes("Samantha") ||
                v.name.includes("Karen") ||
                v.name.includes("Female")),
          ) || voices.find((v) => v.lang.startsWith("en"));
        if (preferred) utterance.voice = preferred;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }
      window.speechSynthesis.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  };

  // Toggle Voice Recognition
  const toggleListening = () => {
    if (typeof window === "undefined") return;

    interface SpeechRecConstructable {
      new (): {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onstart: (() => void) | null;
        onresult:
          | ((event: {
              results: ArrayLike<{
                [index: number]: { transcript: string } | undefined;
              }>;
            }) => void)
          | null;
        onerror: ((event: unknown) => void) | null;
        onend: (() => void) | null;
        start: () => void;
        stop: () => void;
      };
    }

    const browserWindow = window as unknown as {
      SpeechRecognition?: SpeechRecConstructable;
      webkitSpeechRecognition?: SpeechRecConstructable;
    };

    const SpeechRec = browserWindow.SpeechRecognition || browserWindow.webkitSpeechRecognition;

    if (!SpeechRec) {
      toast.error(
        "Microphone speech recognition is not supported in this browser. You can tap any Quick Voice Prompt below to speak with Civora.",
      );
      return;
    }

    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      const pending = lastTranscriptRef.current.trim();
      if (pending && pending !== "Listening to your question…") {
        if (mode === "voice") {
          void handleSend(pending);
        } else {
          setInput(pending);
        }
        setVoiceTranscript("");
        lastTranscriptRef.current = "";
      }
      return;
    }

    try {
      const recognition = new SpeechRec();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      lastTranscriptRef.current = "";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript("Listening to your question…");
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0]?.transcript || "")
          .join("");
        lastTranscriptRef.current = transcript;
        setVoiceTranscript(transcript);
        if (mode === "text") {
          setInput(transcript);
        }
      };

      recognition.onerror = (event: unknown) => {
        setIsListening(false);
        setVoiceTranscript("");
        const errObj = event as { error?: string } | undefined;
        if (errObj?.error === "not-allowed" || errObj?.error === "service-not-allowed") {
          toast.error(
            "Microphone access was denied. Please allow microphone permissions in your browser.",
          );
        } else if (errObj?.error !== "no-speech") {
          // Normal reset
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const finalTranscript = lastTranscriptRef.current.trim();
        if (finalTranscript && finalTranscript !== "Listening to your question…") {
          if (mode === "voice") {
            void handleSend(finalTranscript);
          } else {
            setInput(finalTranscript);
          }
          setVoiceTranscript("");
          lastTranscriptRef.current = "";
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      setIsListening(false);
      toast.error("Could not activate microphone. Please verify browser permissions.");
    }
  };

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
              name: profile?.display_name || "Alex",
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
      if (mode === "voice") {
        speakResponse(replyText);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Unable to reach Civora AI assistant.");
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setMessages(INITIAL_MESSAGES);
    setError(null);
    try {
      sessionStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {
      // Ignore
    }
    toast.success("Conversation cleared");
  }

  function copyMessage(id: string, text: string) {
    void navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
    toast.success("Copied to clipboard");
  }

  return (
    <div
      className={`surface flex flex-col overflow-hidden border border-border/80 shadow-lift ${
        embedded ? "h-[540px] rounded-2xl" : "h-full"
      } ${className}`}
    >
      {/* Top Header & Mode Switcher */}
      <div className="flex items-center justify-between border-b border-border/70 bg-card/90 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="status-glow flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary to-indigo-500 text-primary-foreground shadow-xs">
            <Cpu className="size-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-sm font-bold tracking-tight text-foreground">
                Civora Academic Intelligence
              </h3>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-primary/30 text-primary bg-primary/10 py-0 px-1.5 h-4.5"
              >
                Gemini 3.8
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              Context: Alex · KLRCET Computer Science
            </p>
          </div>
        </div>

        {/* Dual Mode Switcher (Text / Voice) */}
        <div className="flex items-center gap-1.5">
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60">
            <button
              onClick={() => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                setMode("text");
              }}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === "text"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Text
            </button>
            <button
              onClick={() => setMode("voice")}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                mode === "voice"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mic className="size-3" />
              <span>Voice</span>
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg cursor-pointer"
            onClick={handleReset}
            title="Reset conversation"
          >
            <RotateCcw className="size-3.5" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                if (typeof window !== "undefined" && "speechSynthesis" in window) {
                  window.speechSynthesis.cancel();
                }
                onClose();
              }}
              className="size-8 text-muted-foreground hover:text-foreground hover:bg-muted/70 rounded-lg cursor-pointer"
            >
              <X className="size-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Mode 1: Voice AI Interface */}
      {mode === "voice" ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-card to-background relative overflow-hidden">
          {/* Ambient Voice Pulse Halos */}
          <div
            className={`absolute size-72 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
              isSpeaking
                ? "bg-indigo-500/20 scale-125"
                : isListening
                  ? "bg-emerald-500/20 scale-110"
                  : "bg-primary/10 scale-100"
            }`}
          />

          <div className="relative z-10 max-w-md space-y-6">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Radio className="size-3.5 animate-pulse text-primary" />
                <span>
                  {isSpeaking
                    ? "Civora Speaking…"
                    : isListening
                      ? "Listening to Alex…"
                      : loading
                        ? "Synthesizing answer…"
                        : "Ready to Converse"}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-display text-foreground">
                Voice Academic Assistant
              </h2>
              <p className="text-xs text-muted-foreground">
                Ask about today's timetable, syllabus topics, or assignment deadlines out loud.
              </p>
            </div>

            {/* Audio Waveform Equalizer Display */}
            <div className="flex items-center justify-center gap-1.5 h-16">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((bar) => (
                <div
                  key={bar}
                  className={`w-1.5 rounded-full transition-all duration-200 ${
                    isListening || isSpeaking
                      ? "voice-wave-bar bg-gradient-to-t from-primary to-cyan-400"
                      : "h-2 bg-muted-foreground/30"
                  }`}
                  style={{
                    animationDelay: `${bar * 0.1}s`,
                    height: isListening || isSpeaking ? `${Math.sin(bar) * 20 + 24}px` : "6px",
                  }}
                />
              ))}
            </div>

            {/* Live voice transcript box */}
            {voiceTranscript && (
              <div className="rounded-xl border border-primary/30 bg-card/90 p-3.5 text-xs text-foreground font-mono shadow-soft">
                "{voiceTranscript}"
              </div>
            )}

            {/* Main Microphone Action Trigger */}
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={toggleListening}
                className={`relative flex size-20 items-center justify-center rounded-full text-white shadow-lift transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                  isListening
                    ? "bg-rose-500 status-glow animate-pulse"
                    : "bg-gradient-to-tr from-primary to-indigo-600 status-glow"
                }`}
              >
                {isListening ? <MicOff className="size-8" /> : <Mic className="size-8" />}
              </button>
              <p className="text-xs font-mono text-muted-foreground">
                {isListening ? "Tap to stop & send" : "Tap to speak question"}
              </p>
            </div>

            {/* Quick Spoken Voice Prompts */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                Or tap a quick question
              </p>
              <div className="flex flex-wrap justify-center gap-1.5">
                {[
                  "What classes do I have today?",
                  "When is my next project deadline?",
                  "Summarize unit 2 of OS",
                  "Give me study motivation",
                ].map((promptText) => (
                  <button
                    key={promptText}
                    type="button"
                    onClick={() => {
                      if (typeof window !== "undefined" && "speechSynthesis" in window) {
                        window.speechSynthesis.cancel();
                      }
                      setVoiceTranscript(promptText);
                      void handleSend(promptText);
                    }}
                    className="rounded-full border border-border/80 bg-card/60 px-2.5 py-1 text-[11px] text-foreground hover:bg-muted/80 hover:border-primary/40 transition-all cursor-pointer font-medium"
                  >
                    "{promptText}"
                  </button>
                ))}
              </div>
            </div>

            {/* Voice Settings Controls */}
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (typeof window !== "undefined" && "speechSynthesis" in window) {
                    window.speechSynthesis.cancel();
                  }
                  setSpeechMuted(!speechMuted);
                }}
                className="h-8 text-xs gap-1.5 rounded-lg border-border/80"
              >
                {speechMuted ? (
                  <>
                    <VolumeX className="size-3.5 text-destructive" />
                    <span>Audio Muted</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="size-3.5 text-primary" />
                    <span>Voice Output Active</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Mode 2: Text Chat Interface */
        <>
          <div className="flex-1 space-y-4 overflow-y-auto p-4 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold shadow-xs ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "border border-border/80 bg-muted/60 text-primary"
                  }`}
                >
                  {m.role === "user" ? <User className="size-4" /> : <Bot className="size-4" />}
                </div>
                <div
                  className={`group relative max-w-[85%] rounded-2xl px-4 py-3 leading-relaxed text-xs sm:text-sm ${
                    m.role === "user"
                      ? "bg-primary text-primary-foreground shadow-soft"
                      : "surface border border-border/80 text-foreground bg-card/90"
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className="mt-2 flex items-center justify-between text-[10px] font-mono opacity-80">
                    <span>{m.timestamp}</span>
                    {m.role === "model" && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (isSpeaking) {
                              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                                window.speechSynthesis.cancel();
                              }
                              setIsSpeaking(false);
                            } else {
                              speakResponse(m.text);
                            }
                          }}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary flex items-center gap-1 cursor-pointer"
                          title="Read aloud"
                        >
                          {isSpeaking ? (
                            <>
                              <VolumeX className="size-3 text-destructive" />
                              <span>Stop</span>
                            </>
                          ) : (
                            <>
                              <Volume2 className="size-3 text-primary" />
                              <span>Listen</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => copyMessage(m.id, m.text)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary flex items-center gap-1 cursor-pointer"
                          title="Copy message"
                        >
                          {copiedId === m.id ? (
                            <Check className="size-3 text-emerald-500" />
                          ) : (
                            <Copy className="size-3" />
                          )}
                          <span>{copiedId === m.id ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-xl border border-border/80 bg-muted/60 text-primary">
                  <Bot className="size-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl border border-border/80 bg-card/80 px-4 py-2.5 text-xs text-muted-foreground backdrop-blur-md">
                  <LoaderCircle className="size-3.5 animate-spin text-primary" />
                  <span className="font-mono text-[11px]">
                    Consulting KLRCET syllabus & schedule…
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs text-destructive">
                <p className="font-semibold">Unable to reach Civora AI</p>
                <p className="mt-1">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2.5 h-7 text-xs border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20 cursor-pointer"
                  onClick={() => handleSend(messages[messages.length - 1]?.text)}
                >
                  Try again
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Bar */}
          {messages.length <= 3 && !loading && (
            <div className="border-t border-border/60 bg-muted/20 px-3.5 py-2.5 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 mb-2 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
                <Terminal className="size-3 text-primary" />
                <span>Suggested Queries:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => void handleSend(item)}
                    className="rounded-lg border border-border/80 bg-card px-2.5 py-1 text-xs text-muted-foreground transition hover:border-primary/50 hover:bg-primary/5 hover:text-primary cursor-pointer text-left"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Form */}
          <form
            onSubmit={(e: FormEvent) => {
              e.preventDefault();
              void handleSend();
            }}
            className="border-t border-border/70 bg-card/95 p-3 backdrop-blur-xl"
          >
            <div className="flex items-center gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about timetable, courses, exams, or PPS & Math topics…"
                disabled={loading}
                className="flex-1 bg-background/80 h-10 text-xs sm:text-sm rounded-xl border-border/80 focus-visible:border-primary/60"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={toggleListening}
                className={`size-10 rounded-xl shrink-0 cursor-pointer border-border/80 ${
                  isListening ? "bg-rose-500 text-white animate-pulse" : "hover:text-primary"
                }`}
                title="Voice input"
              >
                <Mic className="size-4" />
              </Button>
              <Button
                type="submit"
                disabled={loading || !input.trim()}
                size="icon"
                className="size-10 rounded-xl shrink-0 cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs"
              >
                {loading ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </Button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}
