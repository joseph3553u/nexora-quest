import { useState, useEffect, useCallback } from "react";

export interface ChessStats {
  rating: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  botWins: number;
  friendWins: number;
}

export interface WordleStats {
  gamesPlayed: number;
  wordsSolved: number;
  currentStreak: number;
  bestStreak: number;
  totalScore: number;
}

export interface MemoryMatrixStats {
  gamesPlayed: number;
  highScore: number;
  maxLevel: number;
  totalScore: number;
}

export interface GameScoresData {
  chess: ChessStats;
  wordle: WordleStats;
  memoryMatrix: MemoryMatrixStats;
}

const DEFAULT_SCORES: GameScoresData = {
  chess: {
    rating: 1200,
    matchesPlayed: 4,
    wins: 3,
    losses: 1,
    draws: 0,
    botWins: 2,
    friendWins: 1,
  },
  wordle: {
    gamesPlayed: 8,
    wordsSolved: 7,
    currentStreak: 4,
    bestStreak: 6,
    totalScore: 780,
  },
  memoryMatrix: {
    gamesPlayed: 5,
    highScore: 1450,
    maxLevel: 7,
    totalScore: 4320,
  },
};

const STORAGE_KEY = "civora_game_scores";

function persistAndBroadcast(data: GameScoresData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Asynchronously broadcast so listening components are not updated during an active render
    setTimeout(() => {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("civora_game_scores_updated", { detail: data }));
      }
    }, 0);
  } catch {
    // Ignore
  }
}

export function useGameScores() {
  const [scores, setScores] = useState<GameScoresData>(() => {
    if (typeof window === "undefined") return DEFAULT_SCORES;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          chess: { ...DEFAULT_SCORES.chess, ...(parsed.chess || {}) },
          wordle: { ...DEFAULT_SCORES.wordle, ...(parsed.wordle || {}) },
          memoryMatrix: { ...DEFAULT_SCORES.memoryMatrix, ...(parsed.memoryMatrix || {}) },
        };
      }
      return DEFAULT_SCORES;
    } catch {
      return DEFAULT_SCORES;
    }
  });

  useEffect(() => {
    function handleUpdate(e: Event) {
      const custom = e as CustomEvent<GameScoresData>;
      if (custom.detail) {
        setScores(custom.detail);
      }
    }
    window.addEventListener("civora_game_scores_updated", handleUpdate);
    return () => window.removeEventListener("civora_game_scores_updated", handleUpdate);
  }, []);

  const recordChessResult = useCallback(
    (outcome: "win" | "loss" | "draw", opponentType: "bot" | "friend") => {
      setScores((prev) => {
        let ratingDelta = 0;
        if (outcome === "win") ratingDelta = 16;
        else if (outcome === "loss") ratingDelta = -12;
        else ratingDelta = 2;

        const newRating = Math.max(800, prev.chess.rating + ratingDelta);

        const next: GameScoresData = {
          ...prev,
          chess: {
            ...prev.chess,
            rating: newRating,
            matchesPlayed: prev.chess.matchesPlayed + 1,
            wins: outcome === "win" ? prev.chess.wins + 1 : prev.chess.wins,
            losses: outcome === "loss" ? prev.chess.losses + 1 : prev.chess.losses,
            draws: outcome === "draw" ? prev.chess.draws + 1 : prev.chess.draws,
            botWins:
              outcome === "win" && opponentType === "bot"
                ? prev.chess.botWins + 1
                : prev.chess.botWins,
            friendWins:
              outcome === "win" && opponentType === "friend"
                ? prev.chess.friendWins + 1
                : prev.chess.friendWins,
          },
        };
        persistAndBroadcast(next);
        return next;
      });
    },
    [],
  );

  const recordWordleResult = useCallback((won: boolean, attempts: number) => {
    setScores((prev) => {
      const nextStreak = won ? prev.wordle.currentStreak + 1 : 0;
      const bestStreak = Math.max(prev.wordle.bestStreak, nextStreak);
      const points = won ? Math.max(40, 120 - attempts * 15) : 0;

      const next: GameScoresData = {
        ...prev,
        wordle: {
          gamesPlayed: prev.wordle.gamesPlayed + 1,
          wordsSolved: won ? prev.wordle.wordsSolved + 1 : prev.wordle.wordsSolved,
          currentStreak: nextStreak,
          bestStreak,
          totalScore: prev.wordle.totalScore + points,
        },
      };
      persistAndBroadcast(next);
      return next;
    });
  }, []);

  const recordMatrixResult = useCallback((level: number, roundScore: number) => {
    setScores((prev) => {
      const next: GameScoresData = {
        ...prev,
        memoryMatrix: {
          gamesPlayed: prev.memoryMatrix.gamesPlayed + 1,
          highScore: Math.max(prev.memoryMatrix.highScore, roundScore),
          maxLevel: Math.max(prev.memoryMatrix.maxLevel, level),
          totalScore: prev.memoryMatrix.totalScore + roundScore,
        },
      };
      persistAndBroadcast(next);
      return next;
    });
  }, []);

  const resetScores = useCallback(() => {
    setScores(DEFAULT_SCORES);
    persistAndBroadcast(DEFAULT_SCORES);
  }, []);

  return {
    scores,
    recordChessResult,
    recordWordleResult,
    recordMatrixResult,
    resetScores,
  };
}
