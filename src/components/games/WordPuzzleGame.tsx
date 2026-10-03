import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useGameScores } from "@/hooks/use-game-scores";
import {
  RotateCcw,
  Trophy,
  Flame,
  HelpCircle,
  CheckCircle2,
  Sparkles,
  Lightbulb,
} from "lucide-react";
import { toast } from "sonner";

interface WordItem {
  word: string;
  hint: string;
  category: string;
}

const WORDS: WordItem[] = [
  {
    word: "STACK",
    hint: "LIFO data structure used in recursion and execution memory.",
    category: "Data Structures",
  },
  {
    word: "LOGIC",
    hint: "Fundamental reasoning behind Boolean algebra and gate circuits.",
    category: "Theory",
  },
  {
    word: "ARRAY",
    hint: "Contiguous collection of items stored at memory offsets.",
    category: "Data Structures",
  },
  {
    word: "GRAPH",
    hint: "Non-linear data structure with vertices connected by edges.",
    category: "Algorithms",
  },
  {
    word: "BYTES",
    hint: "Unit of digital information consisting of eight bits.",
    category: "Hardware",
  },
  {
    word: "QUERY",
    hint: "Command to retrieve or manipulate database records.",
    category: "Databases",
  },
  {
    word: "NODES",
    hint: "Individual elements in linked lists, trees, and computer networks.",
    category: "Networking",
  },
  {
    word: "CACHE",
    hint: "High-speed temporary storage for rapid data retrieval.",
    category: "Architecture",
  },
  { word: "ASYNC", hint: "Non-blocking concurrent execution paradigm.", category: "Programming" },
  {
    word: "DEBUG",
    hint: "Process of identifying and resolving software defects.",
    category: "Software Eng",
  },
  {
    word: "CONST",
    hint: "Keyword denoting an immutable variable identifier.",
    category: "Languages",
  },
  {
    word: "FLOAT",
    hint: "Data type used to represent fractional numbers.",
    category: "Data Types",
  },
  {
    word: "INDEX",
    hint: "Search optimization structure in tables or array locator.",
    category: "Databases",
  },
  { word: "PARSE", hint: "Syntactic analysis of a string into an AST.", category: "Compilers" },
  {
    word: "SCOPE",
    hint: "Contextual visibility and lifecycle of variables.",
    category: "Programming",
  },
  {
    word: "TABLE",
    hint: "Structured relational entity containing rows and columns.",
    category: "Databases",
  },
  {
    word: "BUILD",
    hint: "Compiling source files into an executable artifact.",
    category: "DevOps",
  },
  {
    word: "ROUTE",
    hint: "Determining path for web request or network packet.",
    category: "Networking",
  },
  {
    word: "HOOKS",
    hint: "Stateful reactive primitives in modern UI libraries.",
    category: "Frontend",
  },
  {
    word: "TOKEN",
    hint: "Cryptographic credential or atomic lexer element.",
    category: "Security",
  },
];

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

function playTileSound(status: "match" | "present" | "win" | "error") {
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

    if (status === "match") {
      osc.frequency.setValueAtTime(540, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } else if (status === "present") {
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (status === "win") {
      osc.frequency.setValueAtTime(580, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (status === "error") {
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch {
    // Ignore
  }
}

export function WordPuzzleGame() {
  const { scores, recordWordleResult } = useGameScores();

  // Target word state
  const [wordItem, setWordItem] = useState<WordItem>(() => {
    return WORDS[Math.floor(Math.random() * WORDS.length)];
  });

  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [showHint, setShowHint] = useState(false);

  const targetWord = wordItem.word;

  // Handle character submission
  const submitGuess = useCallback(() => {
    if (currentGuess.length !== 5) {
      playTileSound("error");
      toast.error("Word must be exactly 5 letters");
      return;
    }

    const nextGuesses = [...guesses, currentGuess];
    setGuesses(nextGuesses);
    setCurrentGuess("");

    if (currentGuess === targetWord) {
      setGameStatus("won");
      playTileSound("win");
      recordWordleResult(true, nextGuesses.length);
      toast.success(`Incredible! Solved in ${nextGuesses.length} attempts!`);
    } else if (nextGuesses.length >= 6) {
      setGameStatus("lost");
      playTileSound("error");
      recordWordleResult(false, 6);
      toast.error(`Game over! The secret word was ${targetWord}.`);
    } else {
      playTileSound("present");
    }
  }, [currentGuess, guesses, targetWord, recordWordleResult]);

  // Handle keyboard typing
  const handleKey = useCallback(
    (key: string) => {
      if (gameStatus !== "playing") return;

      if (key === "ENTER") {
        submitGuess();
      } else if (key === "⌫" || key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key) && currentGuess.length < 5) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [gameStatus, currentGuess, submitGuess],
  );

  // Listen to physical keyboard
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (key === "ENTER" || key === "BACKSPACE" || /^[A-Z]$/.test(key)) {
        handleKey(key);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKey]);

  // Compute status for keyboard keys
  const keyStatusMap = useMemo(() => {
    const map: Record<string, "correct" | "present" | "absent"> = {};

    guesses.forEach((guess) => {
      for (let i = 0; i < 5; i++) {
        const char = guess[i];
        if (targetWord[i] === char) {
          map[char] = "correct";
        } else if (targetWord.includes(char) && map[char] !== "correct") {
          map[char] = "present";
        } else if (!targetWord.includes(char) && !map[char]) {
          map[char] = "absent";
        }
      }
    });

    return map;
  }, [guesses, targetWord]);

  const startNewWord = () => {
    const next = WORDS[Math.floor(Math.random() * WORDS.length)];
    setWordItem(next);
    setGuesses([]);
    setCurrentGuess("");
    setGameStatus("playing");
    setShowHint(false);
  };

  return (
    <div className="space-y-6">
      {/* Game Header */}
      <div className="surface p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-border/80">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg font-mono">
            W
          </span>
          <div>
            <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
              <span>Civora Lexicon (CS Wordle)</span>
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-primary border-primary/30"
              >
                {wordItem.category}
              </Badge>
            </h3>
            <p className="text-xs text-muted-foreground">
              Guess the 5-letter computer science &amp; engineering term in 6 tries.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowHint((h) => !h)}
            className="h-8.5 rounded-xl border-border/80 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <Lightbulb className="size-3.5 text-amber-500" />
            <span>{showHint ? "Hide Clue" : "Clue"}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={startNewWord}
            className="h-8.5 rounded-xl border-border/80 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Next Word</span>
          </Button>
        </div>
      </div>

      {/* Clue Banner */}
      {showHint && (
        <div className="surface p-3.5 sm:p-4 rounded-2xl border-amber-500/30 bg-amber-500/10 text-foreground flex items-start gap-2.5 animate-in fade-in">
          <Lightbulb className="size-4 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-xs space-y-0.5">
            <span className="font-semibold text-amber-600 dark:text-amber-400">
              Clue ({wordItem.category}):
            </span>
            <p className="text-muted-foreground">{wordItem.hint}</p>
          </div>
        </div>
      )}

      {/* Main Grid & Keyboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: 6x5 Wordle Matrix */}
        <div className="lg:col-span-8 flex flex-col items-center justify-center py-2">
          <div className="grid grid-rows-6 gap-2 w-full max-w-[340px]">
            {Array.from({ length: 6 }).map((_, rowIdx) => {
              const guess = guesses[rowIdx];
              const isCurrentRow = rowIdx === guesses.length;

              return (
                <div key={rowIdx} className="grid grid-cols-5 gap-2">
                  {Array.from({ length: 5 }).map((_, colIdx) => {
                    let letter = "";
                    let tileClass = "border-border/80 bg-card text-foreground";

                    if (guess) {
                      letter = guess[colIdx] || "";
                      if (targetWord[colIdx] === letter) {
                        tileClass = "border-emerald-500 bg-emerald-500 text-white font-bold";
                      } else if (targetWord.includes(letter)) {
                        tileClass = "border-amber-500 bg-amber-500 text-white font-bold";
                      } else {
                        tileClass = "border-muted bg-muted/60 text-muted-foreground font-semibold";
                      }
                    } else if (isCurrentRow) {
                      letter = currentGuess[colIdx] || "";
                      if (letter) {
                        tileClass =
                          "border-primary/80 bg-card text-foreground font-bold shadow-xs scale-105";
                      }
                    }

                    return (
                      <div
                        key={colIdx}
                        className={`size-14 sm:size-15 rounded-xl border flex items-center justify-center text-xl sm:text-2xl font-mono font-bold uppercase transition-all select-none ${tileClass}`}
                      >
                        {letter}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Virtual QWERTY Keyboard */}
          <div className="w-full max-w-[480px] space-y-1.5 pt-6">
            {KEYBOARD_ROWS.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1 sm:gap-1.5">
                {row.map((k) => {
                  const status = keyStatusMap[k];
                  let keyColor = "bg-card hover:bg-muted text-foreground border-border/80";

                  if (status === "correct") {
                    keyColor = "bg-emerald-500 text-white border-emerald-500 font-bold";
                  } else if (status === "present") {
                    keyColor = "bg-amber-500 text-white border-amber-500 font-bold";
                  } else if (status === "absent") {
                    keyColor = "bg-muted/40 text-muted-foreground/60 border-transparent opacity-60";
                  }

                  const isWide = k === "ENTER" || k === "⌫";

                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleKey(k)}
                      className={`h-11 rounded-lg border font-mono font-semibold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${keyColor} ${
                        isWide ? "px-2.5 sm:px-3 text-[11px]" : "w-8 sm:w-10"
                      }`}
                    >
                      {k}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Wordle Stats & Streaks */}
        <div className="lg:col-span-4 space-y-4">
          {/* Win/Loss Card */}
          {gameStatus !== "playing" && (
            <div
              className={`surface p-4 rounded-2xl border text-foreground animate-in zoom-in-95 ${
                gameStatus === "won"
                  ? "border-emerald-500/40 bg-emerald-500/10"
                  : "border-destructive/40 bg-destructive/10"
              }`}
            >
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-primary" />
                <h4 className="font-display font-bold text-sm">
                  {gameStatus === "won" ? "Word Decrypted!" : "Attempt Limit Reached"}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                The word was <strong className="text-foreground font-mono">{targetWord}</strong>.
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{wordItem.hint}</p>
              <Button size="sm" onClick={startNewWord} className="mt-3 w-full font-semibold">
                Play Next Word
              </Button>
            </div>
          )}

          {/* Lexicon Career Stats */}
          <div className="surface p-4 rounded-2xl border-border/80 space-y-3">
            <h4 className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Lexicon Record</span>
              <span className="text-emerald-500 font-mono text-[10px]">VERIFIED</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Played</p>
                <p className="text-lg font-bold font-display text-foreground">
                  {scores.wordle.gamesPlayed}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Solved</p>
                <p className="text-lg font-bold font-display text-emerald-500">
                  {scores.wordle.wordsSolved}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase flex items-center justify-center gap-1">
                  <Flame className="size-3 text-amber-500" />
                  <span>Streak</span>
                </p>
                <p className="text-lg font-bold font-display text-amber-500">
                  {scores.wordle.currentStreak}
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Total Score</p>
                <p className="text-lg font-bold font-display text-primary">
                  {scores.wordle.totalScore}
                </p>
              </div>
            </div>
          </div>

          {/* Quick How to Play Guide */}
          <div className="surface p-4 rounded-2xl border-border/80 space-y-2 text-xs text-muted-foreground">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <HelpCircle className="size-3.5 text-primary" />
              <span>Color System</span>
            </p>
            <div className="space-y-1.5 text-[11px] leading-relaxed">
              <p className="flex items-center gap-2">
                <span className="size-3 rounded bg-emerald-500 shrink-0" />
                <span>Green: Letter is in the word and in the exact spot.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="size-3 rounded bg-amber-500 shrink-0" />
                <span>Yellow: Letter is in the word but wrong spot.</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="size-3 rounded bg-muted-foreground/40 shrink-0" />
                <span>Grey: Letter is not anywhere in the word.</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
