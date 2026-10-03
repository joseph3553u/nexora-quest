import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/common/PageHeader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChessGame } from "@/components/games/ChessGame";
import { WordPuzzleGame } from "@/components/games/WordPuzzleGame";
import { MemoryMatrixGame } from "@/components/games/MemoryMatrixGame";
import { useGameScores } from "@/hooks/use-game-scores";
import { Trophy, Brain, Swords, SpellCheck, Flame } from "lucide-react";

export const Route = createFileRoute("/_authenticated/games")({
  head: () => ({
    meta: [
      { title: "Brain Games & Cognitive Hub · Civora" },
      {
        name: "description",
        content:
          "Offline cognitive exercises: Grandmaster Chess vs Bot/Friends, CS Wordle, and Neural Matrix.",
      },
    ],
  }),
  component: GamesPage,
});

function GamesPage() {
  const [activeTab, setActiveTab] = useState("chess");
  const { scores } = useGameScores();

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <PageHeader
        eyebrow="Cognitive Fitness &amp; Strategy"
        title="Brain Games"
        description="Offline strategic exercises to sharpen problem solving and tactical memory between study blocks. Earn verified scores visible on your profile."
      />

      {/* Cognitive Overview Quick Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface p-4 rounded-2xl border-border/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Chess Rating
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-foreground">
                {scores.chess.rating}
              </span>
              <span className="text-[11px] font-mono text-emerald-500 font-semibold">ELO</span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {scores.chess.wins}W · {scores.chess.losses}L ({scores.chess.botWins} Bot KOs)
            </p>
          </div>
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
            ♔
          </div>
        </div>

        <div className="surface p-4 rounded-2xl border-border/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Lexicon Solved
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-foreground">
                {scores.wordle.wordsSolved}
              </span>
              <span className="text-[11px] font-mono text-amber-500 font-semibold flex items-center gap-0.5">
                <Flame className="size-3 text-amber-500" />
                {scores.wordle.currentStreak} streak
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {scores.wordle.totalScore} total lexicon pts
            </p>
          </div>
          <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-lg font-mono">
            W
          </div>
        </div>

        <div className="surface p-4 rounded-2xl border-border/80 flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
              Memory Matrix High
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-bold text-foreground">
                {scores.memoryMatrix.highScore}
              </span>
              <span className="text-[11px] font-mono text-primary font-semibold">
                Lvl {scores.memoryMatrix.maxLevel}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground font-mono">
              {scores.memoryMatrix.gamesPlayed} sessions logged
            </p>
          </div>
          <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <Brain className="size-5" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation for Mini Games */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="surface h-11 p-1 rounded-2xl border border-border/80 grid grid-cols-3 max-w-lg">
          <TabsTrigger
            value="chess"
            className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <span>♔</span>
            <span>Chess</span>
          </TabsTrigger>

          <TabsTrigger
            value="wordle"
            className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <SpellCheck className="size-3.5" />
            <span>Word Puzzle</span>
          </TabsTrigger>

          <TabsTrigger
            value="matrix"
            className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Brain className="size-3.5" />
            <span>Memory Matrix</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chess" className="focus-visible:outline-none">
          <ChessGame />
        </TabsContent>

        <TabsContent value="wordle" className="focus-visible:outline-none">
          <WordPuzzleGame />
        </TabsContent>

        <TabsContent value="matrix" className="focus-visible:outline-none">
          <MemoryMatrixGame />
        </TabsContent>
      </Tabs>
    </div>
  );
}
