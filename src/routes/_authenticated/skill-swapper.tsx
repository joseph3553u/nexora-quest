import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import {
  ArrowLeftRight,
  Flame,
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Copy,
  DoorOpen,
  MessageSquare,
  Code2,
  BookOpen,
  Video,
  Mic,
  MicOff,
  VideoOff,
  Share2,
  UserCheck,
  Send,
  Trophy,
  Calendar,
  Users2,
  ArrowRight,
  Terminal,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSkillSwapper, type SkillSwapPartnership } from "@/hooks/use-skill-swapper";
import { useProfile } from "@/hooks/use-profile";

export const Route = createFileRoute("/_authenticated/skill-swapper")({
  head: () => ({
    meta: [
      { title: "1-on-1 Skill Swapper Room · Civora" },
      {
        name: "description",
        content:
          "Connect in an individual 1-on-1 room to teach each other daily skills for an hour, maintain your daily session streak, and earn Skill Swapper points.",
      },
    ],
  }),
  component: SkillSwapperPage,
});

export function SkillSwapperPage() {
  const { data: userProfile } = useProfile();
  const {
    partnerships,
    activePartnership,
    setActivePartnerId,
    sessionLogs,
    isTodayCompleted,
    roomMessages,
    scratchpadCode,
    updateScratchpadCode,
    sendRoomMessage,
    completeDailySession,
    startNewSwapPartnership,
    availablePeers,
  } = useSkillSwapper();

  // Session 60-minute Timer (3600 seconds)
  const [secondsRemaining, setSecondsRemaining] = useState<number>(3600);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [hasFastForwarded, setHasFastForwarded] = useState<boolean>(false);

  // Audio/video simulation controls
  const [isMicOn, setIsMicOn] = useState<boolean>(true);
  const [isVideoOn, setIsVideoOn] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);

  // Room chat input
  const [chatInput, setChatInput] = useState<string>("");
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Completion modal state
  const [completeDialogOpen, setCompleteDialogOpen] = useState<boolean>(false);
  const [myTopicInput, setMyTopicInput] = useState<string>(
    "PPS: Dynamic Memory Allocation, Pointer Arithmetic & Edge Cases",
  );
  const [partnerTopicInput, setPartnerTopicInput] = useState<string>(
    "PyTorch: Conv2d Tensor Dimensions, Receptive Fields & Autograd",
  );
  const [sessionNotesInput, setSessionNotesInput] = useState<string>(
    "Taught the C memory layout heap vs stack. Priya guided through PyTorch convolutional layer shapes.",
  );

  // New Swap Dialog
  const [newSwapDialogOpen, setNewSwapDialogOpen] = useState<boolean>(false);
  const [selectedPeerId, setSelectedPeerId] = useState<string>("");
  const [mySkillInput, setMySkillInput] = useState<string>(
    "Programming for Problem Solving (PPS) & C++",
  );
  const [theirSkillInput, setTheirSkillInput] = useState<string>("Web Development & Next.js");

  // Code runner console simulation
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);

  // Timer countdown effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            toast.success(
              "1-Hour Daily Session Goal reached! You can now verify and claim points.",
            );
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerRunning, secondsRemaining]);

  // Scroll chat to bottom on new messages
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [roomMessages]);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  const elapsedMinutes = Math.floor((3600 - secondsRemaining) / 60);
  const progressPercent = Math.min(100, Math.round(((3600 - secondsRemaining) / 3600) * 100));

  // Determine current phase (first 30 min vs second 30 min)
  const isFirstHalf = secondsRemaining > 1800;
  const currentPhaseTitle = isFirstHalf
    ? `Phase 1: Your turn to teach (${activePartnership?.my_skill_teaching || "Your Skill"})`
    : `Phase 2: ${activePartnership?.partner.name || "Partner"}'s turn to teach (${activePartnership?.partner.skill_teaching || "Their Skill"})`;

  function copyCode(text: string) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success("Room code copied to clipboard!");
    } else {
      toast(`Room Code: ${text}`);
    }
  }

  function handleSendMessage(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!chatInput.trim()) return;
    sendRoomMessage(chatInput);
    setChatInput("");
  }

  function handleFastForward() {
    setSecondsRemaining(60); // 1 minute left
    setHasFastForwarded(true);
    toast.info("Fast-forwarded to final minute for quick session verification.");
  }

  function handleRunCode() {
    setConsoleOutput(
      `[Civora C++ & Python Runtime]
Executing test harness for Session Room ${activePartnership?.room_code || "ROOM"}...
> Allocating dynamic heap node at 0x7ffd98... OK
> Linking node -> next: [val: 42, ptr: 0x7ffd98]
> PyTorch sample batch forward pass: torch.Size([4, 16, 32, 32])
------------------------------------------------
Session exercise compiled successfully (0 errors, 0 warnings).`,
    );
    toast.success("Code executed in room workspace!");
  }

  function handleConfirmSession() {
    completeDailySession({
      myTopicTaught: myTopicInput,
      partnerTopicTaught: partnerTopicInput,
      notes: sessionNotesInput,
      minutesSpent: 60,
    });
    setCompleteDialogOpen(false);
    setIsTimerRunning(false);
  }

  function handleCreateNewSwap() {
    const peer = availablePeers.find((p) => p.id === selectedPeerId);
    if (!peer) {
      toast.error("Please select a student to start skill swapping with.");
      return;
    }
    startNewSwapPartnership({
      partner: peer,
      mySkillTeaching: mySkillInput,
      theirSkillTeaching: theirSkillInput,
    });
    setNewSwapDialogOpen(false);
  }

  if (!activePartnership) {
    return (
      <div className="surface p-8 text-center space-y-4">
        <p className="text-sm text-muted-foreground">No active skill swap found.</p>
        <Button onClick={() => window.location.reload()}>Reload</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="1-on-1 Peer Learning Environment"
        title="Skill Swapper Room"
        description="Daily spend an hour teaching each other the skills you excel at. Consistent daily sessions increase your Skill Swapper Points and build mutual mastery."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyCode(activePartnership.room_code)}
              className="gap-1.5 h-9 text-xs border-primary/30 bg-primary/10 text-primary font-mono font-semibold"
            >
              <Copy className="size-3.5" />
              <span>Room: {activePartnership.room_code}</span>
            </Button>

            <Dialog open={newSwapDialogOpen} onOpenChange={setNewSwapDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5 h-9 text-xs font-semibold">
                  <ArrowLeftRight className="size-3.5" />
                  <span>Switch / New Swap</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md surface border-border/80">
                <DialogHeader>
                  <DialogTitle className="font-display">Start a New 1-on-1 Skill Swap</DialogTitle>
                  <DialogDescription className="text-xs">
                    Choose a classmate to pair with. You will each teach what you are good at in
                    daily 1-hour sessions.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2 text-xs">
                  {/* Existing Partnerships */}
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground">
                      Switch to an Existing Partner
                    </label>
                    <div className="grid gap-2">
                      {partnerships.map((p) => {
                        const isCurrent = p.id === activePartnership.id;
                        return (
                          <div
                            key={p.id}
                            onClick={() => {
                              setActivePartnerId(p.id);
                              setNewSwapDialogOpen(false);
                              toast.success(`Switched active room to ${p.partner.name}`);
                            }}
                            className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                              isCurrent
                                ? "border-primary bg-primary/10"
                                : "border-border/70 hover:border-primary/50 bg-card/60"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-8">
                                <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                                  {p.partner.name.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-bold text-foreground">{p.partner.name}</p>
                                <p className="text-[11px] text-muted-foreground font-mono">
                                  @{p.partner.civora_id} · {p.partner.points} pts
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-[10px]">
                                {p.current_streak_days}d streak 🔥
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="border-t border-border/60 pt-3 space-y-3">
                    <label className="font-semibold text-foreground">
                      Or Launch Swap with New Peer
                    </label>
                    <div className="space-y-2">
                      <select
                        value={selectedPeerId}
                        onChange={(e) => setSelectedPeerId(e.target.value)}
                        className="w-full h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground"
                      >
                        <option value="">Select a student...</option>
                        {availablePeers
                          .filter((peer) => !partnerships.some((p) => p.partner.id === peer.id))
                          .map((peer) => (
                            <option key={peer.id} value={peer.id}>
                              {peer.display_name} (@{peer.civora_id}) — {peer.skills.join(", ")}
                            </option>
                          ))}
                      </select>

                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">
                          Skill you will teach:
                        </label>
                        <Input
                          value={mySkillInput}
                          onChange={(e) => setMySkillInput(e.target.value)}
                          placeholder="e.g. PPS & C++"
                          className="h-8.5 text-xs"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] text-muted-foreground">
                          Skill you want them to teach you:
                        </label>
                        <Input
                          value={theirSkillInput}
                          onChange={(e) => setTheirSkillInput(e.target.value)}
                          placeholder="e.g. Next.js & Frontend"
                          className="h-8.5 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    variant="outline"
                    onClick={() => setNewSwapDialogOpen(false)}
                    className="h-8.5 text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateNewSwap}
                    disabled={!selectedPeerId}
                    className="h-8.5 text-xs font-semibold"
                  >
                    Start Swap Studio
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        }
      />

      {/* Active Partnership HUD / Status Banner */}
      <section className="surface p-6 rounded-3xl border-border/80 shadow-soft relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/60 pb-5">
          {/* Partner & User Profiles Exchange info */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Student 1 (You) */}
            <div className="flex items-center gap-3">
              <Avatar className="size-12 border-2 border-primary/40 shadow-sm">
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                  {(userProfile?.display_name || "Alex").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm text-foreground">
                    {userProfile?.display_name || "Alex"}
                  </span>
                  <Badge variant="secondary" className="text-[10px] font-mono">
                    YOU
                  </Badge>
                </div>
                <p className="text-xs text-primary font-bold font-mono">
                  {activePartnership.my_points} Skill Swap Pts
                </p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[200px]">
                  Teaches: {activePartnership.my_skill_teaching}
                </p>
              </div>
            </div>

            {/* Swap Icon */}
            <div className="flex flex-col items-center justify-center px-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary animate-pulse">
                <ArrowLeftRight className="size-4" />
              </span>
              <span className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">
                Swapping
              </span>
            </div>

            {/* Student 2 (Partner) */}
            <div className="flex items-center gap-3">
              <Avatar className="size-12 border-2 border-primary/40 shadow-sm">
                <AvatarImage
                  src={activePartnership.partner.avatar_url || undefined}
                  alt={activePartnership.partner.name}
                />
                <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
                  {activePartnership.partner.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display font-bold text-sm text-foreground">
                    {activePartnership.partner.name}
                  </span>
                  <Badge
                    variant="outline"
                    className="text-[10px] text-emerald-500 border-emerald-500/30 font-semibold"
                  >
                    IN ROOM
                  </Badge>
                </div>
                <p className="text-xs text-primary font-bold font-mono">
                  {activePartnership.partner.points} Skill Swap Pts
                </p>
                <p className="text-[11px] text-muted-foreground truncate max-w-[220px]">
                  Teaches: {activePartnership.partner.skill_teaching}
                </p>
              </div>
            </div>
          </div>

          {/* Quick Stats: Daily Streak, Today Status, Link to Profile */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-center min-w-[110px]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Daily Streak
              </span>
              <span className="font-display text-lg font-bold text-amber-500 flex items-center justify-center gap-1">
                <Flame className="size-4 fill-amber-500 text-amber-500" />
                <span>{activePartnership.current_streak_days} Days</span>
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-muted/40 border border-border/60 text-center min-w-[120px]">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Today's 1h Goal
              </span>
              {isTodayCompleted ? (
                <span className="font-display text-xs font-bold text-emerald-500 flex items-center justify-center gap-1 mt-1">
                  <CheckCircle2 className="size-4" />
                  <span>Attempted (+50pts)</span>
                </span>
              ) : (
                <span className="font-display text-xs font-bold text-primary flex items-center justify-center gap-1 mt-1">
                  <Clock className="size-3.5" />
                  <span>Ready to Attempt</span>
                </span>
              )}
            </div>

            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-10 text-xs font-semibold rounded-xl gap-1.5"
            >
              <Link to="/profile">
                <span>View on Profile</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>
        </div>

        {/* 60-Minute Dual Session Timeline */}
        <div className="pt-4 space-y-2">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Sparkles className="size-3.5 text-primary" />
              <span>{currentPhaseTitle}</span>
            </span>
            <span className="font-mono text-muted-foreground">
              {elapsedMinutes}m elapsed / 60m daily goal ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} className="h-2 rounded-full" />
        </div>
      </section>

      {/* Main 1-on-1 Room Studio Environment */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Timer & Code Scratchpad (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Session Controller & Clock Card */}
          <div className="surface p-5 rounded-3xl border border-border/80 shadow-soft space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <Clock className="size-4 text-primary" />
                  <span>Live 60-Minute Session Clock</span>
                </h3>
                <p className="text-xs text-muted-foreground">
                  Spend 1 hour together: 30 minutes teaching, 30 minutes learning.
                </p>
              </div>

              {/* Big Digital Clock Display */}
              <div className="flex items-center gap-3">
                <div className="px-4 py-2 rounded-2xl bg-card border border-primary/30 shadow-subtle text-center">
                  <span className="font-mono text-2xl sm:text-3xl font-bold tracking-widest text-primary">
                    {timeFormatted}
                  </span>
                  <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-mono">
                    {secondsRemaining === 0 ? "Goal Met" : isTimerRunning ? "In Session" : "Paused"}
                  </span>
                </div>

                {/* Clock Controls */}
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    onClick={() => setIsTimerRunning(!isTimerRunning)}
                    className="h-9 px-3.5 gap-1.5 font-semibold text-xs"
                  >
                    {isTimerRunning ? (
                      <>
                        <Pause className="size-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="size-3.5" /> Start Hour
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      setIsTimerRunning(false);
                      setSecondsRemaining(3600);
                      toast("Session timer reset to 60:00");
                    }}
                    title="Reset to 60:00"
                    className="size-9"
                  >
                    <RotateCcw className="size-3.5" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleFastForward}
                    className="h-9 text-xs gap-1 font-semibold"
                    title="Quick demo jump for testing point addition"
                  >
                    <Sparkles className="size-3.5 text-amber-500" />
                    <span>Fast-Forward</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Split Schedule Markers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  isFirstHalf
                    ? "border-primary/70 bg-primary/10 shadow-subtle"
                    : "border-border/60 bg-muted/20 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground">0:00 - 30:00 (First Half)</span>
                  <Badge variant={isFirstHalf ? "default" : "outline"} className="text-[10px]">
                    {isFirstHalf ? "ACTIVE TEACHING" : "COMPLETED"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">
                    You teach {activePartnership.partner.name}:
                  </strong>{" "}
                  {activePartnership.my_skill_teaching}
                </p>
              </div>

              <div
                className={`p-3 rounded-2xl border transition-all ${
                  !isFirstHalf
                    ? "border-primary/70 bg-primary/10 shadow-subtle"
                    : "border-border/60 bg-muted/20 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-bold text-foreground">30:00 - 60:00 (Second Half)</span>
                  <Badge variant={!isFirstHalf ? "default" : "outline"} className="text-[10px]">
                    {!isFirstHalf ? "ACTIVE TEACHING" : "UPCOMING"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">
                    {activePartnership.partner.name} teaches you:
                  </strong>{" "}
                  {activePartnership.partner.skill_teaching}
                </p>
              </div>
            </div>
          </div>

          {/* Collaborative Code & Scratchpad Editor */}
          <div className="surface rounded-3xl border border-border/80 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-border/60 flex flex-wrap items-center justify-between gap-3 bg-card/60">
              <div className="flex items-center gap-2">
                <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Code2 className="size-4" />
                </span>
                <div>
                  <h3 className="font-display text-sm font-bold text-foreground">
                    Collaborative Code &amp; Concept Scratchpad
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Shared in real-time between you and {activePartnership.partner.name}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyCode(scratchpadCode)}
                  className="h-8 text-xs gap-1"
                >
                  <Copy className="size-3" /> Copy
                </Button>

                <Button
                  size="sm"
                  onClick={handleRunCode}
                  className="h-8 text-xs font-semibold gap-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Play className="size-3" /> Run Code
                </Button>
              </div>
            </div>

            <div className="p-4 bg-muted/20">
              <Textarea
                value={scratchpadCode}
                onChange={(e) => updateScratchpadCode(e.target.value)}
                rows={14}
                className="font-mono text-xs leading-relaxed bg-background/80 border-border/60 rounded-xl resize-y"
                placeholder="Type or paste shared code / notes here during the session..."
              />

              {consoleOutput && (
                <div className="mt-3 p-3 rounded-xl bg-card border border-border/80 font-mono text-[11px] text-foreground space-y-1">
                  <div className="flex items-center justify-between text-muted-foreground pb-1 border-b border-border/40 text-[10px]">
                    <span className="flex items-center gap-1">
                      <Terminal className="size-3 text-primary" /> Execution Output
                    </span>
                    <button
                      onClick={() => setConsoleOutput(null)}
                      className="hover:text-foreground text-xs"
                    >
                      ×
                    </button>
                  </div>
                  <pre className="whitespace-pre-wrap text-emerald-600 dark:text-emerald-400">
                    {consoleOutput}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Today's Attempt Verification & Point Claim Card */}
          <div className="surface p-6 rounded-3xl border-2 border-primary/30 shadow-soft bg-primary/5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Badge className="bg-primary text-primary-foreground font-semibold text-[10px] mb-1.5">
                  DAILY SESSION ATTEMPT &amp; VERIFICATION
                </Badge>
                <h3 className="font-display text-lg font-bold text-foreground">
                  Complete Today's 1-Hour Session
                </h3>
                <p className="text-xs text-muted-foreground max-w-lg">
                  Both partners must teach and attempt the session concepts. Upon verification, both
                  earn <strong className="text-primary">+50 Skill Swapper Points</strong> and
                  advance their streak!
                </p>
              </div>

              <Dialog open={completeDialogOpen} onOpenChange={setCompleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    size="lg"
                    className="h-11 px-5 rounded-2xl font-bold text-xs sm:text-sm gap-2 shadow-soft"
                  >
                    <Trophy className="size-4" />
                    <span>
                      {isTodayCompleted ? "Re-log Today's Session" : "Verify & Claim +50 Pts"}
                    </span>
                  </Button>
                </DialogTrigger>

                <DialogContent className="sm:max-w-lg surface border-border/80">
                  <DialogHeader>
                    <DialogTitle className="font-display flex items-center gap-2">
                      <Sparkles className="size-5 text-primary" />
                      <span>Verify &amp; Log 1-Hour Skill Swap</span>
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                      Document what you taught and what you learned with{" "}
                      {activePartnership.partner.name}. Points will be reflected on both profiles.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2 text-xs">
                    <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-foreground block">
                          Reward: +50 Skill Swapper Points
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          Streak will increase to{" "}
                          {activePartnership.current_streak_days + (isTodayCompleted ? 0 : 1)} Days
                          🔥
                        </span>
                      </div>
                      <Badge className="font-mono text-xs">+50 PTS</Badge>
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">
                        What you taught ({userProfile?.display_name || "Alex"}):
                      </label>
                      <Input
                        value={myTopicInput}
                        onChange={(e) => setMyTopicInput(e.target.value)}
                        placeholder="e.g. PPS Linked Lists and Dynamic Pointer Allocation"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">
                        What {activePartnership.partner.name} taught you:
                      </label>
                      <Input
                        value={partnerTopicInput}
                        onChange={(e) => setPartnerTopicInput(e.target.value)}
                        placeholder="e.g. PyTorch Convolutional Layer Dimensions"
                        className="h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="font-semibold text-foreground">
                        Session Summary &amp; Key Takeaways:
                      </label>
                      <Textarea
                        value={sessionNotesInput}
                        onChange={(e) => setSessionNotesInput(e.target.value)}
                        placeholder="Key problems solved, code tested, and takeaways..."
                        rows={3}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => setCompleteDialogOpen(false)}
                      className="h-9 text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleConfirmSession}
                      className="h-9 text-xs font-semibold gap-1.5"
                    >
                      <CheckCircle2 className="size-4" /> Confirm &amp; Earn +50 Pts
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Right Column: Audio/Video Presence & Real-time Room Chat (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1-on-1 Room Presence & Controls */}
          <div className="surface p-4 rounded-3xl border border-border/80 shadow-soft space-y-3">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <span className="font-display text-xs font-bold text-foreground flex items-center gap-1.5">
                <Users2 className="size-3.5 text-primary" />
                <span>1-on-1 Room Stream</span>
              </span>
              <Badge
                variant="outline"
                className="text-[10px] text-emerald-500 border-emerald-500/30"
              >
                2 Connected
              </Badge>
            </div>

            {/* Video boxes simulation */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Partner Tile */}
              <div className="relative aspect-video rounded-2xl bg-card border border-border/70 overflow-hidden flex flex-col items-center justify-center p-2 text-center shadow-subtle">
                <Avatar className="size-10 mb-1 border border-primary/30">
                  <AvatarImage src={activePartnership.partner.avatar_url || undefined} />
                  <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                    {activePartnership.partner.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] font-bold text-foreground truncate max-w-full">
                  {activePartnership.partner.name}
                </span>
                <span className="text-[9px] text-emerald-500 font-mono flex items-center gap-1">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" /> Speaking
                </span>
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <span className="p-1 rounded-md bg-background/80 text-[10px]">
                    <Mic className="size-2.5 text-emerald-500" />
                  </span>
                </div>
              </div>

              {/* Your Tile */}
              <div className="relative aspect-video rounded-2xl bg-card border border-border/70 overflow-hidden flex flex-col items-center justify-center p-2 text-center shadow-subtle">
                <Avatar className="size-10 mb-1 border border-primary/30">
                  <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                    {(userProfile?.display_name || "Alex").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-[11px] font-bold text-foreground truncate max-w-full">
                  {userProfile?.display_name || "Alex"} (You)
                </span>
                <span className="text-[9px] text-muted-foreground font-mono">Teaching Mode</span>
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                  <span className="p-1 rounded-md bg-background/80 text-[10px]">
                    {isMicOn ? (
                      <Mic className="size-2.5 text-emerald-500" />
                    ) : (
                      <MicOff className="size-2.5 text-rose-500" />
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* In-room media toggles */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <Button
                variant={isMicOn ? "outline" : "destructive"}
                size="sm"
                onClick={() => {
                  setIsMicOn(!isMicOn);
                  toast(isMicOn ? "Microphone muted" : "Microphone unmuted");
                }}
                className="h-8 text-xs gap-1"
              >
                {isMicOn ? <Mic className="size-3" /> : <MicOff className="size-3" />}
                <span>{isMicOn ? "Mute" : "Unmute"}</span>
              </Button>

              <Button
                variant={isVideoOn ? "outline" : "destructive"}
                size="sm"
                onClick={() => {
                  setIsVideoOn(!isVideoOn);
                  toast(isVideoOn ? "Camera turned off" : "Camera turned on");
                }}
                className="h-8 text-xs gap-1"
              >
                {isVideoOn ? <Video className="size-3" /> : <VideoOff className="size-3" />}
                <span>{isVideoOn ? "Stop Cam" : "Start Cam"}</span>
              </Button>

              <Button
                variant={isScreenSharing ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setIsScreenSharing(!isScreenSharing);
                  toast(isScreenSharing ? "Stopped screen share" : "Sharing screen in room");
                }}
                className="h-8 text-xs gap-1"
              >
                <Share2 className="size-3" />
                <span>Share</span>
              </Button>
            </div>
          </div>

          {/* Real-time Room Chat */}
          <div className="surface rounded-3xl border border-border/80 shadow-soft flex flex-col h-[420px]">
            <div className="p-3.5 border-b border-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="size-4 text-primary" />
                <h4 className="font-display text-xs font-bold text-foreground">
                  Room Chat ({activePartnership.partner.name})
                </h4>
              </div>
              <span className="text-[10px] text-muted-foreground font-mono">1-on-1 Encrypted</span>
            </div>

            {/* Chat Messages scroll area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
              {roomMessages.map((msg) => {
                const isMe = msg.sender_id === "me";
                const isSystem = msg.sender_id === "system";

                if (isSystem) {
                  return (
                    <div
                      key={msg.id}
                      className="p-2 rounded-xl bg-primary/10 border border-primary/20 text-center text-[11px] text-foreground font-medium"
                    >
                      {msg.text}
                    </div>
                  );
                }

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-0.5">
                      <span className="font-bold text-foreground">{msg.sender_name}</span>
                      <span>·</span>
                      <span>{msg.time}</span>
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-xs"
                          : "bg-muted/80 text-foreground border border-border/60 rounded-tl-xs"
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form
              onSubmit={handleSendMessage}
              className="p-2.5 border-t border-border/60 flex items-center gap-2 bg-card/60"
            >
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder={`Message ${activePartnership.partner.name}...`}
                className="h-8.5 text-xs"
              />
              <Button type="submit" size="icon" className="size-8.5 shrink-0 rounded-xl">
                <Send className="size-3.5" />
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* Daily Session Streak & History Log */}
      <section className="surface p-6 rounded-3xl border border-border/80 shadow-soft space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div>
            <h3 className="font-display text-base font-bold text-foreground flex items-center gap-2">
              <Calendar className="size-4 text-primary" />
              <span>Skill Swapper Session Log &amp; Streak History</span>
            </h3>
            <p className="text-xs text-muted-foreground">
              History of 1-hour sessions completed with {activePartnership.partner.name}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">Total Sessions:</span>
            <Badge variant="secondary" className="font-mono text-xs">
              {activePartnership.total_sessions_count} sessions (
              {activePartnership.total_minutes_completed} mins)
            </Badge>
          </div>
        </div>

        {/* Sessions table / cards */}
        {sessionLogs.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
            No completed sessions logged yet for this partnership. Complete your first 60-minute
            session above!
          </div>
        ) : (
          <div className="grid gap-3">
            {sessionLogs.map((log) => (
              <div
                key={log.id}
                className="p-4 rounded-2xl border border-border/70 bg-card/70 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold text-foreground">{log.date}</span>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {log.minutes_spent} MINUTES
                    </Badge>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] font-bold">
                      +{log.my_points_earned} PTS EACH
                    </Badge>
                  </div>
                  <div className="text-xs space-y-0.5">
                    <p className="text-foreground">
                      <strong className="text-primary font-semibold">Taught:</strong>{" "}
                      {log.my_topic_taught}
                    </p>
                    <p className="text-foreground">
                      <strong className="text-primary font-semibold">Learned:</strong>{" "}
                      {log.partner_topic_taught}
                    </p>
                    {log.notes && (
                      <p className="text-muted-foreground text-[11px] italic">"{log.notes}"</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant="outline"
                    className="text-emerald-500 border-emerald-500/30 text-xs font-semibold gap-1"
                  >
                    <CheckCircle2 className="size-3.5" /> Verified
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default SkillSwapperPage;
