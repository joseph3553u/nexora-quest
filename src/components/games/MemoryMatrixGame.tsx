import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGameScores } from "@/hooks/use-game-scores";
import { Brain, Trophy, RotateCcw, Zap, Target, Sparkles, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

function playSynthTone(freq: number, duration: number = 0.15) {
  if (typeof window === "undefined" || localStorage.getItem("civora_sound") === "false") return;
  try {
    const ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    )();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {
    // Ignore
  }
}

export function MemoryMatrixGame() {
  const { scores, recordMatrixResult } = useGameScores();

  const [level, setLevel] = useState(1);
  const [gridSize, setGridSize] = useState(4); // 4x4 initially, then 5x5 for higher levels
  const [activePattern, setActivePattern] = useState<number[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<number[]>([]);
  const [wrongTiles, setWrongTiles] = useState<number[]>([]);
  const [phase, setPhase] = useState<"idle" | "memorize" | "recall" | "round_clear" | "game_over">(
    "idle",
  );
  const [currentScore, setCurrentScore] = useState(0);

  // Generate pattern for current level
  const startRound = useCallback((currentLvl: number) => {
    const size = currentLvl >= 5 ? 5 : 4;
    setGridSize(size);
    const totalTiles = size * size;
    const tileCount = Math.min(12, 3 + currentLvl);

    // Pick random unique tile indices
    const pattern: number[] = [];
    while (pattern.length < tileCount) {
      const rand = Math.floor(Math.random() * totalTiles);
      if (!pattern.includes(rand)) pattern.push(rand);
    }

    setActivePattern(pattern);
    setSelectedTiles([]);
    setWrongTiles([]);
    setPhase("memorize");

    // Flash tiles
    playSynthTone(440, 0.2);

    // After 1400ms, hide pattern and switch to recall phase
    setTimeout(() => {
      setPhase("recall");
      playSynthTone(550, 0.1);
    }, 1400);
  }, []);

  const handleStartGame = () => {
    setLevel(1);
    setCurrentScore(0);
    startRound(1);
  };

  const handleTileClick = (index: number) => {
    if (phase !== "recall") return;
    if (selectedTiles.includes(index) || wrongTiles.includes(index)) return;

    if (activePattern.includes(index)) {
      // Correct tile clicked
      const nextSelected = [...selectedTiles, index];
      setSelectedTiles(nextSelected);
      playSynthTone(600 + nextSelected.length * 40, 0.12);

      // Check if all active tiles were clicked
      if (nextSelected.length === activePattern.length) {
        const roundPts = level * 150;
        const newScore = currentScore + roundPts;
        setCurrentScore(newScore);
        setPhase("round_clear");
        playSynthTone(880, 0.3);
        toast.success(`Level ${level} complete! +${roundPts} points`);

        setTimeout(() => {
          const nextLvl = level + 1;
          setLevel(nextLvl);
          startRound(nextLvl);
        }, 1000);
      }
    } else {
      // Wrong tile clicked
      setWrongTiles((prev) => [...prev, index]);
      setPhase("game_over");
      playSynthTone(200, 0.35);
      recordMatrixResult(level, currentScore);
      toast.error(`Mistake! Game ended at Level ${level}. Score: ${currentScore}`);
    }
  };

  const totalCells = gridSize * gridSize;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="surface p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-border/80">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
            <Brain className="size-5" />
          </span>
          <div>
            <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
              <span>Neural Memory Matrix</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-primary border-primary/30"
              >
                Level {level}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Cognitive pattern retention test: memorize the active tile pattern and recall it.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {phase === "idle" || phase === "game_over" ? (
            <Button
              onClick={handleStartGame}
              className="h-8.5 rounded-xl font-semibold gap-1.5 text-xs cursor-pointer"
            >
              <Zap className="size-3.5" />
              <span>{phase === "game_over" ? "Try Again" : "Start Exercise"}</span>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={handleStartGame}
              className="h-8.5 rounded-xl border-border/80 gap-1.5 text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="size-3.5" />
              <span>Restart</span>
            </Button>
          )}
        </div>
      </div>

      {/* Main Grid Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Matrix Grid */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center py-4">
          <div className="mb-4 text-center">
            {phase === "memorize" && (
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-primary animate-pulse flex items-center justify-center gap-1.5">
                <span className="size-2 rounded-full bg-primary" />
                Memorize glowing pattern…
              </p>
            )}
            {phase === "recall" && (
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-500 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="size-3.5" />
                Select recalled tiles ({selectedTiles.length}/{activePattern.length})
              </p>
            )}
            {phase === "idle" && (
              <p className="text-xs text-muted-foreground">
                Press "Start Exercise" to begin pattern sequencing.
              </p>
            )}
            {phase === "game_over" && (
              <p className="text-xs font-mono font-semibold text-destructive">
                Sequence terminated! Final Score: {currentScore} pts
              </p>
            )}
          </div>

          <div
            className={`surface p-4 rounded-3xl border-border/90 shadow-lift bg-card grid gap-2.5 sm:gap-3 transition-all ${
              gridSize === 5 ? "grid-cols-5" : "grid-cols-4"
            }`}
          >
            {Array.from({ length: totalCells }).map((_, idx) => {
              const isPattern = activePattern.includes(idx);
              const isSelected = selectedTiles.includes(idx);
              const isWrong = wrongTiles.includes(idx);

              let tileClass = "bg-muted/50 hover:bg-muted border-border/80";

              if (phase === "memorize" && isPattern) {
                tileClass = "bg-primary border-primary shadow-glow scale-105";
              } else if (phase === "recall") {
                if (isSelected) {
                  tileClass = "bg-primary border-primary shadow-xs scale-102";
                }
              } else if (phase === "game_over") {
                if (isWrong) {
                  tileClass = "bg-destructive border-destructive text-white";
                } else if (isPattern) {
                  tileClass = "bg-primary/40 border-primary/60";
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={phase !== "recall"}
                  onClick={() => handleTileClick(idx)}
                  className={`size-14 sm:size-18 md:size-20 rounded-2xl border transition-all duration-200 select-none cursor-pointer flex items-center justify-center ${tileClass}`}
                >
                  {isSelected && <span className="size-3 rounded-full bg-foreground/60" />}
                  {isWrong && <span className="text-xl font-bold font-mono">✕</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Cognitive Rating & Score HUD */}
        <div className="lg:col-span-4 space-y-4">
          {/* Live Round Score */}
          <div className="surface p-4 rounded-2xl border-primary/30 bg-primary/5 space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-primary font-semibold">
              Current Run Score
            </span>
            <div className="flex items-baseline justify-between">
              <span className="text-3xl font-display font-bold text-foreground">
                {currentScore}
              </span>
              <span className="text-xs font-mono text-muted-foreground">Level {level}</span>
            </div>
          </div>

          {/* Matrix Career Records */}
          <div className="surface p-4 rounded-2xl border-border/80 space-y-3">
            <h4 className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Cognitive Performance</span>
              <span className="text-[10px] font-mono text-muted-foreground">OFFLINE ENGINE</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">High Score</p>
                <p className="text-lg font-bold font-display text-primary">
                  {scores.memoryMatrix.highScore}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Max Level</p>
                <p className="text-lg font-bold font-display text-emerald-500">
                  Lvl {scores.memoryMatrix.maxLevel}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Exercises</p>
                <p className="text-lg font-bold font-display text-foreground">
                  {scores.memoryMatrix.gamesPlayed}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Rank</p>
                <p className="text-xs font-bold font-mono text-foreground mt-1">
                  {scores.memoryMatrix.maxLevel >= 8
                    ? "Grandmaster"
                    : scores.memoryMatrix.maxLevel >= 5
                      ? "Adept"
                      : "Novice"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
