import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useGameScores } from "@/hooks/use-game-scores";
import { useFriends, type FriendProfile } from "@/hooks/use-friends";
import {
  RotateCcw,
  Bot,
  User,
  Swords,
  Trophy,
  Users,
  ChevronRight,
  Shield,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export type PieceType = "p" | "n" | "b" | "r" | "q" | "k";
export type PieceColor = "w" | "b";

export interface ChessPiece {
  type: PieceType;
  color: PieceColor;
}

export type BoardState = (ChessPiece | null)[][];

const INITIAL_BOARD: BoardState = [
  [
    { type: "r", color: "b" },
    { type: "n", color: "b" },
    { type: "b", color: "b" },
    { type: "q", color: "b" },
    { type: "k", color: "b" },
    { type: "b", color: "b" },
    { type: "n", color: "b" },
    { type: "r", color: "b" },
  ],
  Array(8).fill({ type: "p", color: "b" }),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill(null),
  Array(8).fill({ type: "p", color: "w" }),
  [
    { type: "r", color: "w" },
    { type: "n", color: "w" },
    { type: "b", color: "w" },
    { type: "q", color: "w" },
    { type: "k", color: "w" },
    { type: "b", color: "w" },
    { type: "n", color: "w" },
    { type: "r", color: "w" },
  ],
];

const PIECE_SYMBOLS: Record<PieceType, { w: string; b: string }> = {
  k: { w: "♔", b: "♚" },
  q: { w: "♕", b: "♛" },
  r: { w: "♖", b: "♜" },
  b: { w: "♗", b: "♝" },
  n: { w: "♘", b: "♞" },
  p: { w: "♙", b: "♟" },
};

const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000,
};

function playSound(type: "move" | "capture" | "win" | "loss") {
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

    if (type === "move") {
      osc.frequency.setValueAtTime(320, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (type === "capture") {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      gain.gain.setValueAtTime(0.14, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === "win") {
      osc.frequency.setValueAtTime(520, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch {
    // Audio context may be restricted before interaction
  }
}

export function ChessGame() {
  const { scores, recordChessResult } = useGameScores();
  const { acceptedFriends, seedStudents } = useFriends();

  const [board, setBoard] = useState<BoardState>(INITIAL_BOARD);
  const [turn, setTurn] = useState<PieceColor>("w");
  const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
  const [validMoves, setValidMoves] = useState<[number, number][]>([]);
  const [opponentType, setOpponentType] = useState<"bot" | "friend">("bot");
  const [botDifficulty, setBotDifficulty] = useState<"novice" | "medium" | "master">("medium");
  const [friendOpponent, setFriendOpponent] = useState<FriendProfile | null>(null);
  const [friendModalOpen, setFriendModalOpen] = useState(false);
  const [winner, setWinner] = useState<"w" | "b" | "draw" | null>(null);
  const [capturedWhite, setCapturedWhite] = useState<ChessPiece[]>([]);
  const [capturedBlack, setCapturedBlack] = useState<ChessPiece[]>([]);
  const [moveHistory, setMoveHistory] = useState<string[]>([]);

  // Calculate legal moves for a piece on the board
  const getMoves = useCallback((b: BoardState, r: number, c: number): [number, number][] => {
    const piece = b[r][c];
    if (!piece) return [];
    const moves: [number, number][] = [];
    const color = piece.color;
    const forward = color === "w" ? -1 : 1;

    // Helper: is within board
    const inBounds = (row: number, col: number) => row >= 0 && row < 8 && col >= 0 && col < 8;

    // Pawns
    if (piece.type === "p") {
      const nextR = r + forward;
      if (inBounds(nextR, c) && !b[nextR][c]) {
        moves.push([nextR, c]);
        // 2-square initial move
        const startRow = color === "w" ? 6 : 1;
        const doubleR = r + forward * 2;
        if (r === startRow && inBounds(doubleR, c) && !b[doubleR][c]) {
          moves.push([doubleR, c]);
        }
      }
      // Diagonal captures
      for (const dc of [-1, 1]) {
        const diagC = c + dc;
        if (inBounds(nextR, diagC)) {
          const target = b[nextR][diagC];
          if (target && target.color !== color) {
            moves.push([nextR, diagC]);
          }
        }
      }
    }

    // Knights
    if (piece.type === "n") {
      const knightOffsets = [
        [-2, -1],
        [-2, 1],
        [-1, -2],
        [-1, 2],
        [1, -2],
        [1, 2],
        [2, -1],
        [2, 1],
      ];
      for (const [dr, dc] of knightOffsets) {
        const nr = r + dr;
        const nc = c + dc;
        if (inBounds(nr, nc)) {
          const target = b[nr][nc];
          if (!target || target.color !== color) moves.push([nr, nc]);
        }
      }
    }

    // Ray pieces: Rook, Bishop, Queen
    const rayDirs: Record<"r" | "b" | "q", [number, number][]> = {
      r: [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
      ],
      b: [
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ],
      q: [
        [-1, 0],
        [1, 0],
        [0, -1],
        [0, 1],
        [-1, -1],
        [-1, 1],
        [1, -1],
        [1, 1],
      ],
    };

    if (piece.type === "r" || piece.type === "b" || piece.type === "q") {
      for (const [dr, dc] of rayDirs[piece.type]) {
        let step = 1;
        while (true) {
          const nr = r + dr * step;
          const nc = c + dc * step;
          if (!inBounds(nr, nc)) break;
          const target = b[nr][nc];
          if (!target) {
            moves.push([nr, nc]);
          } else {
            if (target.color !== color) moves.push([nr, nc]);
            break;
          }
          step++;
        }
      }
    }

    // Kings
    if (piece.type === "k") {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (inBounds(nr, nc)) {
            const target = b[nr][nc];
            if (!target || target.color !== color) moves.push([nr, nc]);
          }
        }
      }
    }

    return moves;
  }, []);

  // Execute a move
  const executeMove = useCallback(
    (fromR: number, fromC: number, toR: number, toC: number) => {
      const movingPiece = board[fromR][fromC];
      if (!movingPiece) return;

      const capturedPiece = board[toR][toC];

      // Pure board state transition
      setBoard((prev) => {
        const next = prev.map((row) => [...row]);
        const piece = next[fromR][fromC];
        if (!piece) return prev;

        next[toR][toC] = piece;
        next[fromR][fromC] = null;

        // Simple pawn promotion to Queen
        if (piece.type === "p") {
          if ((piece.color === "w" && toR === 0) || (piece.color === "b" && toR === 7)) {
            next[toR][toC] = { type: "q", color: piece.color };
          }
        }

        return next;
      });

      setSelectedSquare(null);
      setValidMoves([]);
      setTurn((t) => (t === "w" ? "b" : "w"));

      // Audio and captures graveyard updates outside of setBoard
      if (capturedPiece) {
        if (capturedPiece.color === "w") setCapturedWhite((c) => [...c, capturedPiece]);
        else setCapturedBlack((c) => [...c, capturedPiece]);
        playSound("capture");
      } else {
        playSound("move");
      }

      // Record algebraic shorthand
      const files = ["a", "b", "c", "d", "e", "f", "g", "h"];
      const moveStr = `${movingPiece.type.toUpperCase()}${files[fromC]}${8 - fromR}→${files[toC]}${8 - toR}`;
      setMoveHistory((h) => [...h, moveStr]);

      // Check if King was captured
      if (capturedPiece?.type === "k") {
        const winColor = movingPiece.color;
        setWinner(winColor);
        playSound(winColor === "w" ? "win" : "loss");
        recordChessResult(winColor === "w" ? "win" : "loss", opponentType);
        toast.success(
          winColor === "w"
            ? "Checkmate! You won the chess match!"
            : `${opponentType === "bot" ? "Civora Bot" : friendOpponent?.display_name || "Opponent"} won!`,
        );
      }
    },
    [board, opponentType, friendOpponent, recordChessResult],
  );

  // Bot AI Move Trigger
  useEffect(() => {
    if (turn !== "b" || winner || opponentType !== "bot") return;

    const timer = setTimeout(() => {
      // Collect all legal black moves
      const allMoves: { from: [number, number]; to: [number, number]; score: number }[] = [];

      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          if (board[r][c]?.color === "b") {
            const moves = getMoves(board, r, c);
            for (const [toR, toC] of moves) {
              const target = board[toR][toC];
              let score = 0;
              // Material capture heuristic
              if (target) score += PIECE_VALUES[target.type];
              // Center control heuristic
              if ((toR === 3 || toR === 4) && (toC === 3 || toC === 4)) score += 30;
              // Random slight noise for variety
              score += Math.random() * (botDifficulty === "novice" ? 60 : 15);
              allMoves.push({ from: [r, c], to: [toR, toC], score });
            }
          }
        }
      }

      if (allMoves.length === 0) {
        setWinner("draw");
        return;
      }

      // Sort by score descending and pick best (or top 3 for novice)
      allMoves.sort((a, b) => b.score - a.score);
      const chosen =
        botDifficulty === "novice"
          ? allMoves[Math.floor(Math.random() * Math.min(3, allMoves.length))]
          : allMoves[0];

      executeMove(chosen.from[0], chosen.from[1], chosen.to[0], chosen.to[1]);
    }, 450);

    return () => clearTimeout(timer);
  }, [turn, winner, opponentType, botDifficulty, board, getMoves, executeMove]);

  // Click on square
  const handleSquareClick = (r: number, c: number) => {
    if (winner) return;
    if (turn === "b" && opponentType === "bot") return;

    // If a piece is already selected, check if (r, c) is a valid move
    if (selectedSquare) {
      const isTarget = validMoves.some(([mr, mc]) => mr === r && mc === c);
      if (isTarget) {
        executeMove(selectedSquare[0], selectedSquare[1], r, c);
        return;
      }
    }

    // Select piece of current player's turn
    const clicked = board[r][c];
    if (clicked && clicked.color === turn) {
      setSelectedSquare([r, c]);
      setValidMoves(getMoves(board, r, c));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const resetGame = () => {
    setBoard(INITIAL_BOARD);
    setTurn("w");
    setSelectedSquare(null);
    setValidMoves([]);
    setWinner(null);
    setCapturedWhite([]);
    setCapturedBlack([]);
    setMoveHistory([]);
  };

  const startFriendMatch = (friend: FriendProfile) => {
    setFriendOpponent(friend);
    setOpponentType("friend");
    setFriendModalOpen(false);
    resetGame();
    toast.success(`Chess match started with ${friend.display_name}!`);
  };

  const challengeList = useMemo(() => {
    if (acceptedFriends && acceptedFriends.length > 0) {
      return acceptedFriends.map((f) => f.profile);
    }
    return (seedStudents || []).slice(0, 5);
  }, [acceptedFriends, seedStudents]);

  return (
    <div className="space-y-6">
      {/* Top Game Controls & HUD */}
      <div className="surface p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 border-border/80">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-lg">
              ♔
            </span>
            <div>
              <h3 className="font-display font-bold text-base text-foreground flex items-center gap-2">
                <span>Civora Grandmaster Chess</span>
                <Badge
                  variant="outline"
                  className="font-mono text-[10px] text-primary border-primary/30"
                >
                  ELO {scores?.chess?.rating ?? 1200}
                </Badge>
              </h3>
              <p className="text-xs text-muted-foreground">
                Offline engine with minimax evaluation &amp; friend challenges.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Opponent Selector */}
          <div className="flex rounded-xl border border-border/80 p-0.5 bg-muted/40">
            <button
              type="button"
              onClick={() => {
                setOpponentType("bot");
                setFriendOpponent(null);
                resetGame();
              }}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                opponentType === "bot"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Bot className="size-3.5 text-primary" />
              <span>Bot</span>
            </button>
            <button
              type="button"
              onClick={() => setFriendModalOpen(true)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer ${
                opponentType === "friend"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="size-3.5 text-primary" />
              <span>{friendOpponent ? friendOpponent.display_name.split(" ")[0] : "Friend"}</span>
            </button>
          </div>

          {opponentType === "bot" && (
            <select
              value={botDifficulty}
              onChange={(e) => setBotDifficulty(e.target.value as "novice" | "medium" | "master")}
              className="h-8.5 rounded-xl border border-border/80 bg-card px-2 text-xs font-medium text-foreground focus:outline-none focus:border-primary/60 cursor-pointer"
            >
              <option value="novice">Novice (1000)</option>
              <option value="medium">Club (1400)</option>
              <option value="master">Master (1800)</option>
            </select>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            className="h-8.5 rounded-xl border-border/80 gap-1.5 text-xs font-semibold cursor-pointer"
          >
            <RotateCcw className="size-3.5" />
            <span>Reset</span>
          </Button>
        </div>
      </div>

      {/* Main Board Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: 8x8 Board */}
        <div className="lg:col-span-8 flex flex-col items-center">
          {/* Opponent Tag Bar */}
          <div className="w-full max-w-[480px] flex items-center justify-between py-2 px-1 text-xs font-medium text-foreground">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-card border border-border text-foreground font-mono">
                {opponentType === "bot" ? "🤖" : "👤"}
              </span>
              <span className="font-semibold">
                {opponentType === "bot"
                  ? `Civora Bot (${botDifficulty})`
                  : friendOpponent?.display_name || "Friend"}
              </span>
              {turn === "b" && !winner && (
                <span className="size-2 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1 font-mono text-base">
              {capturedWhite.map((p, idx) => (
                <span key={idx} className="opacity-70">
                  {PIECE_SYMBOLS[p.type].w}
                </span>
              ))}
            </div>
          </div>

          {/* Chess Board Container */}
          <div className="surface p-2 sm:p-3 rounded-2xl shadow-lift border-border/90 bg-card">
            <div className="grid grid-cols-8 grid-rows-8 size-[320px] sm:size-[420px] md:size-[460px] border border-border/90 rounded-xl overflow-hidden select-none">
              {board.map((row, r) =>
                row.map((piece, c) => {
                  const isLight = (r + c) % 2 === 0;
                  const isSelected =
                    selectedSquare && selectedSquare[0] === r && selectedSquare[1] === c;
                  const isValidTarget = validMoves.some(([mr, mc]) => mr === r && mc === c);

                  return (
                    <button
                      key={`${r}-${c}`}
                      type="button"
                      onClick={() => handleSquareClick(r, c)}
                      className={`relative flex items-center justify-center transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-primary/45"
                          : isLight
                            ? "bg-muted/40 hover:bg-muted/70"
                            : "bg-muted/90 hover:bg-muted"
                      }`}
                    >
                      {/* Valid move target indicator */}
                      {isValidTarget && (
                        <div
                          className={`absolute size-3.5 rounded-full z-10 ${
                            piece ? "ring-4 ring-destructive/80 bg-transparent" : "bg-primary/70"
                          }`}
                        />
                      )}

                      {/* Chess Piece Symbol */}
                      {piece && (
                        <span
                          className={`text-2xl sm:text-3xl md:text-4xl transition-transform ${
                            piece.color === "w"
                              ? "text-foreground font-semibold drop-shadow-xs"
                              : "text-primary-ink font-bold drop-shadow-xs"
                          } ${isSelected ? "scale-115" : "hover:scale-105"}`}
                        >
                          {PIECE_SYMBOLS[piece.type][piece.color]}
                        </span>
                      )}

                      {/* Rank & File coordinates */}
                      {c === 0 && (
                        <span className="absolute left-0.5 top-0.5 text-[8px] font-mono opacity-40">
                          {8 - r}
                        </span>
                      )}
                      {r === 7 && (
                        <span className="absolute right-0.5 bottom-0.5 text-[8px] font-mono opacity-40">
                          {["a", "b", "c", "d", "e", "f", "g", "h"][c]}
                        </span>
                      )}
                    </button>
                  );
                }),
              )}
            </div>
          </div>

          {/* Player Tag Bar */}
          <div className="w-full max-w-[480px] flex items-center justify-between py-2 px-1 text-xs font-medium text-foreground">
            <div className="flex items-center gap-2">
              <span className="flex size-6 items-center justify-center rounded-lg bg-primary/20 text-primary font-bold">
                ♔
              </span>
              <span className="font-semibold">You (White)</span>
              {turn === "w" && !winner && (
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1 font-mono text-base">
              {capturedBlack.map((p, idx) => (
                <span key={idx} className="opacity-70">
                  {PIECE_SYMBOLS[p.type].b}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Stats, Move Log & Game State */}
        <div className="lg:col-span-4 space-y-4">
          {/* Game Outcome Announcement */}
          {winner && (
            <div className="surface p-4 border-primary/40 bg-primary/10 text-foreground rounded-2xl animate-in zoom-in-95">
              <div className="flex items-center gap-2">
                <Trophy className="size-5 text-primary" />
                <h4 className="font-display font-bold text-sm">
                  {winner === "w"
                    ? "Victory! Checkmate!"
                    : winner === "b"
                      ? "Match Finished!"
                      : "Stalemate / Draw"}
                </h4>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {winner === "w"
                  ? "+16 ELO added to your student profile rating!"
                  : winner === "b"
                    ? "Better luck next round! Analysis saved."
                    : "Evenly matched cognitive duel."}
              </p>
              <Button size="sm" onClick={resetGame} className="mt-3 w-full font-semibold">
                Play Another Match
              </Button>
            </div>
          )}

          {/* Quick Match Stats */}
          <div className="surface p-4 rounded-2xl border-border/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-foreground">Turn Indicator</span>
              <Badge
                variant={turn === "w" ? "default" : "secondary"}
                className="text-[10px] font-mono capitalize"
              >
                {turn === "w" ? "White's Turn (You)" : "Black's Turn"}
              </Badge>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/60">
              <div className="p-2 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Matches</p>
                <p className="text-base font-bold font-display text-foreground">
                  {scores?.chess?.matchesPlayed ?? 0}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Wins</p>
                <p className="text-base font-bold font-display text-emerald-500">
                  {scores?.chess?.wins ?? 0}
                </p>
              </div>
              <div className="p-2 rounded-xl bg-muted/40">
                <p className="text-[10px] font-mono text-muted-foreground uppercase">Bot KOs</p>
                <p className="text-base font-bold font-display text-primary">
                  {scores?.chess?.botWins ?? 0}
                </p>
              </div>
            </div>
          </div>

          {/* Move History */}
          <div className="surface p-4 rounded-2xl border-border/80 space-y-2">
            <h4 className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Move Log</span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {moveHistory.length} moves
              </span>
            </h4>
            <div className="max-h-48 overflow-y-auto font-mono text-xs text-muted-foreground space-y-1 pr-1">
              {moveHistory.length === 0 ? (
                <p className="text-[11px] italic py-2">Make your first move on the board…</p>
              ) : (
                <div className="grid grid-cols-2 gap-1.5">
                  {moveHistory.map((m, idx) => (
                    <div
                      key={idx}
                      className="rounded bg-muted/40 px-2 py-1 text-[11px] font-mono text-foreground flex items-center justify-between"
                    >
                      <span className="text-muted-foreground">#{idx + 1}</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Challenge a Live Member / Friend Dialog */}
      <Dialog open={friendModalOpen} onOpenChange={setFriendModalOpen}>
        <DialogContent className="max-w-md surface border border-border/80 shadow-lift rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Swords className="size-4" />
              </span>
              <DialogTitle className="font-display text-lg font-bold">
                Challenge Friend to Chess
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Send a chess match request to a peer from your Civora network.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 pt-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground font-mono">
              Available Friends &amp; Peers
            </p>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {challengeList.map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between p-3 rounded-2xl border border-border/70 hover:border-primary/50 transition-all bg-card/60"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="size-8 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                      {f.display_name?.slice(0, 2).toUpperCase() || "??"}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-foreground">
                        {f.display_name || "Civora Student"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        @{f.civora_id || "peer"} ·{" "}
                        {f.department ? f.department.split(" ")[0] : "Student"}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => startFriendMatch(f)}
                    className="h-8 text-xs font-semibold gap-1 rounded-xl cursor-pointer"
                  >
                    <span>Play</span>
                    <ChevronRight className="size-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
