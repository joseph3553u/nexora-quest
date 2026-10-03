import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/common/PageHeader";
import { StudentProfileForm } from "@/components/profile/StudentProfileForm";
import { useProfile } from "@/hooks/use-profile";
import { useGameScores } from "@/hooks/use-game-scores";
import { useSkillSwapper } from "@/hooks/use-skill-swapper";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Trophy,
  Brain,
  Swords,
  SpellCheck,
  Flame,
  ArrowRight,
  Gamepad2,
  ArrowLeftRight,
  Clock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Student Profile · Civora" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { data: profile, isLoading, error } = useProfile();
  const { scores } = useGameScores();
  const { activePartnership, isTodayCompleted } = useSkillSwapper();

  return (
    <div className="mx-auto max-w-3xl space-y-8 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Your account"
        title="Student Profile"
        description="Update your academic credentials, verified skills, and track your cognitive brain scores."
      />

      {/* Active Skill Swapper Partnership Card */}
      {activePartnership && (
        <section className="surface p-6 rounded-3xl border-2 border-primary/30 shadow-soft space-y-4 bg-primary/5 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-primary/20 text-primary">
                <ArrowLeftRight className="size-5" />
              </span>
              <div>
                <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                  <span>Active Skill Swap Partnership</span>
                  <Badge
                    variant="outline"
                    className="font-mono text-[10px] text-primary border-primary/40 bg-primary/10"
                  >
                    1-ON-1 ROOM ACTIVE
                  </Badge>
                </h2>
                <p className="text-xs text-muted-foreground">
                  Daily 1-hour mutual skill exchange with your matched study partner.
                </p>
              </div>
            </div>

            <Button asChild size="sm" className="h-8.5 rounded-xl font-semibold gap-1.5 text-xs">
              <Link to="/skill-swapper">
                <span>Enter Swap Room</span>
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          </div>

          {/* Currently skill swapping with person2 and their points beside it */}
          <div className="p-4 rounded-2xl bg-card border border-border/80 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-11 border-2 border-primary/40">
                  <AvatarImage src={activePartnership.partner.avatar_url || undefined} />
                  <AvatarFallback className="text-xs font-bold bg-primary/20 text-primary">
                    {activePartnership.partner.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-muted-foreground">
                      Currently skill swapping with
                    </span>
                    <strong className="text-sm font-bold text-foreground">
                      {activePartnership.partner.name}
                    </strong>
                    <span className="font-mono text-xs text-primary font-semibold">
                      (@{activePartnership.partner.civora_id})
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Department: {activePartnership.partner.department}
                  </p>
                </div>
              </div>

              {/* Partner Points beside it & Your Points */}
              <div className="flex items-center gap-2 shrink-0">
                <div className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    {activePartnership.partner.name.split(" ")[0]}'s Points
                  </span>
                  <span className="font-mono text-sm font-bold text-primary">
                    {activePartnership.partner.points} pts
                  </span>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-muted/60 border border-border/60 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Your Points
                  </span>
                  <span className="font-mono text-sm font-bold text-foreground">
                    {activePartnership.my_points} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Skills & Daily Attempt Status */}
            <div className="pt-2 border-t border-border/50 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                  Mutual Exchange
                </span>
                <p className="text-foreground text-[11px] truncate">
                  <span className="font-semibold text-primary">You teach:</span>{" "}
                  {activePartnership.my_skill_teaching}
                </p>
                <p className="text-foreground text-[11px] truncate">
                  <span className="font-semibold text-primary">You learn:</span>{" "}
                  {activePartnership.partner.skill_teaching}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 flex flex-col justify-between">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-semibold">Daily 1h Attempt:</span>
                  {isTodayCompleted ? (
                    <span className="text-emerald-500 font-bold flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Completed (+50 pts)
                    </span>
                  ) : (
                    <span className="text-amber-500 font-semibold flex items-center gap-1">
                      <Clock className="size-3" /> Pending today
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px] mt-1 pt-1 border-t border-border/40">
                  <span className="text-muted-foreground">Active Streak:</span>
                  <span className="font-bold text-amber-500 flex items-center gap-1 font-mono">
                    <Flame className="size-3 fill-amber-500" />
                    {activePartnership.current_streak_days} Days
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Brain Games & Cognitive Performance Card */}
      <section className="surface p-6 rounded-3xl border-border/80 shadow-soft space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gamepad2 className="size-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-bold text-foreground flex items-center gap-2">
                <span>Cognitive Scores &amp; Brain Games</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-primary border-primary/30"
                >
                  OFFLINE SCORES
                </Badge>
              </h2>
              <p className="text-xs text-muted-foreground">
                Tactical performance metrics earned across Civora mini-games.
              </p>
            </div>
          </div>

          <Button asChild size="sm" className="h-8.5 rounded-xl font-semibold gap-1.5 text-xs">
            <Link to="/games">
              <span>Play Games</span>
              <ArrowRight className="size-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
          {/* Chess Stats */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <span className="text-base">♔</span>
                <span>Grandmaster Chess</span>
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                {scores.chess.rating} ELO
              </Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Record:</span>
                <span className="font-semibold text-foreground font-mono">
                  {scores.chess.wins}W · {scores.chess.losses}L · {scores.chess.draws}D
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Bot KOs:</span>
                <span className="font-semibold text-primary font-mono">{scores.chess.botWins}</span>
              </div>
            </div>
          </div>

          {/* Word Puzzle Stats */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <SpellCheck className="size-3.5 text-amber-500" />
                <span>CS Wordle Lexicon</span>
              </span>
              <Badge
                variant="secondary"
                className="font-mono text-[10px] text-amber-600 dark:text-amber-400"
              >
                {scores.wordle.wordsSolved} Solved
              </Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>Streak:</span>
                <span className="font-semibold text-amber-500 font-mono flex items-center gap-1">
                  <Flame className="size-3" />
                  {scores.wordle.currentStreak} (Best: {scores.wordle.bestStreak})
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Points:</span>
                <span className="font-semibold text-foreground font-mono">
                  {scores.wordle.totalScore} pts
                </span>
              </div>
            </div>
          </div>

          {/* Memory Matrix Stats */}
          <div className="p-3.5 rounded-2xl bg-muted/40 border border-border/60 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1.5">
                <Brain className="size-3.5 text-primary" />
                <span>Neural Matrix</span>
              </span>
              <Badge variant="secondary" className="font-mono text-[10px]">
                Lvl {scores.memoryMatrix.maxLevel}
              </Badge>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between text-muted-foreground">
                <span>High Score:</span>
                <span className="font-semibold text-primary font-mono">
                  {scores.memoryMatrix.highScore}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Exercises:</span>
                <span className="font-semibold text-foreground font-mono">
                  {scores.memoryMatrix.gamesPlayed} sessions
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Student Profile Edit Form */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-destructive">
          {error.message}
        </p>
      ) : (
        <StudentProfileForm profile={profile ?? null} />
      )}
    </div>
  );
}
