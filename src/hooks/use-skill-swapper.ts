import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useProfile } from "@/hooks/use-profile";
import { SEED_STUDENTS, type FriendProfile } from "@/hooks/use-friends";

export interface SkillSwapPartner {
  id: string;
  name: string;
  civora_id: string;
  avatar_url: string | null;
  department: string;
  skill_teaching: string;
  points: number;
  is_online?: boolean;
}

export interface DailySessionAttempt {
  id: string;
  partnership_id: string;
  date: string; // YYYY-MM-DD
  minutes_spent: number;
  my_topic_taught: string;
  partner_topic_taught: string;
  notes: string;
  my_points_earned: number;
  partner_points_earned: number;
  timestamp: string;
}

export interface SkillSwapPartnership {
  id: string;
  partner: SkillSwapPartner;
  my_skill_teaching: string;
  room_code: string;
  status: "active" | "paused" | "completed";
  current_streak_days: number;
  my_points: number;
  partner_points: number;
  total_sessions_count: number;
  total_minutes_completed: number;
  last_session_at: string | null;
  is_today_completed: boolean;
  daily_goal_minutes: number;
  created_at: string;
}

export interface SwapChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  text: string;
  time: string;
}

const STORAGE_PARTNERSHIPS_KEY = "civora_skill_swapper_partnerships_v1";
const STORAGE_ACTIVE_ID_KEY = "civora_skill_swapper_active_id_v1";
const STORAGE_SESSIONS_KEY = "civora_skill_swapper_sessions_v1";
const STORAGE_MESSAGES_KEY = "civora_skill_swapper_messages_v1";
const STORAGE_SCRATCHPAD_KEY = "civora_skill_swapper_scratchpad_v1";

function getTodayString(): string {
  return new Date().toISOString().split("T")[0]!;
}

// Initial default seed partnership with Priya Sharma
const DEFAULT_PARTNERSHIPS: SkillSwapPartnership[] = [
  {
    id: "swap-priya-alex",
    room_code: "SWAP-PRIYA-701",
    status: "active",
    partner: {
      id: "seed-student-priya",
      name: "Priya Sharma",
      civora_id: "priya.cse26",
      avatar_url: null,
      department: "Computer Science & Engineering",
      skill_teaching: "PyTorch & Deep Learning Foundations",
      points: 350,
      is_online: true,
    },
    my_skill_teaching: "Programming for Problem Solving (PPS) & C++ Data Structures",
    current_streak_days: 5,
    my_points: 420,
    partner_points: 350,
    total_sessions_count: 5,
    total_minutes_completed: 300,
    last_session_at: new Date(Date.now() - 86400000).toISOString(),
    is_today_completed: false,
    daily_goal_minutes: 60,
    created_at: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: "swap-rahul-alex",
    room_code: "SWAP-RAHUL-304",
    status: "paused",
    partner: {
      id: "seed-student-rahul",
      name: "Rahul Verma",
      civora_id: "rahul.dev",
      avatar_url: null,
      department: "Computer Science & Engineering",
      skill_teaching: "Backend Architecture & PostgreSQL Query Optimization",
      points: 210,
      is_online: false,
    },
    my_skill_teaching: "React Component Patterns & State Management",
    current_streak_days: 2,
    my_points: 150,
    partner_points: 210,
    total_sessions_count: 3,
    total_minutes_completed: 180,
    last_session_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    is_today_completed: false,
    daily_goal_minutes: 60,
    created_at: new Date(Date.now() - 86400000 * 12).toISOString(),
  },
];

const DEFAULT_SESSIONS: DailySessionAttempt[] = [
  {
    id: "session-5",
    partnership_id: "swap-priya-alex",
    date: new Date(Date.now() - 86400000).toISOString().split("T")[0]!,
    minutes_spent: 60,
    my_topic_taught: "PPS Chapter 5: Pointer Arithmetic & Dynamic Array Allocation (malloc/free)",
    partner_topic_taught: "PyTorch Tensors, Tensor Operations & GPU Autograd Mechanics",
    notes:
      "Alex walked through pointer increments and edge cases. Priya demonstrated loss.backward() graph computation in PyTorch.",
    my_points_earned: 50,
    partner_points_earned: 50,
    timestamp: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "session-4",
    partnership_id: "swap-priya-alex",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0]!,
    minutes_spent: 60,
    my_topic_taught: "PPS Chapter 4: Multi-dimensional arrays and Matrix Multiplication in C",
    partner_topic_taught: "Linear Regression model from scratch using torch.nn.Linear",
    notes:
      "Tackled 2D memory layouts and cache locality, followed by forward-pass debugging in PyTorch.",
    my_points_earned: 50,
    partner_points_earned: 50,
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "session-3",
    partnership_id: "swap-priya-alex",
    date: new Date(Date.now() - 86400000 * 3).toISOString().split("T")[0]!,
    minutes_spent: 60,
    my_topic_taught: "PPS Chapter 3: Recursive Functions and Call Stack Trace Analysis",
    partner_topic_taught: "Neural Activation Functions: ReLU, Sigmoid and Leaky ReLU comparison",
    notes: "Analyzed call stack overhead in recursion and vanishing gradients in deep networks.",
    my_points_earned: 50,
    partner_points_earned: 50,
    timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

const DEFAULT_ROOM_MESSAGES: SwapChatMessage[] = [
  {
    id: "msg-init-1",
    sender_id: "seed-student-priya",
    sender_name: "Priya Sharma",
    text: "Hey Alex! Ready for today's 1-hour swap? I have the PyTorch Convolution slides ready on my side.",
    time: "10:02 AM",
  },
  {
    id: "msg-init-2",
    sender_id: "me",
    sender_name: "Alex",
    text: "Awesome! I prepared the PPS Linked List deletion and pointer manipulation diagrams in the code editor.",
    time: "10:04 AM",
  },
  {
    id: "msg-init-3",
    sender_id: "seed-student-priya",
    sender_name: "Priya Sharma",
    text: "Great! Let's do the first 30 minutes on PPS, then we flip to CNN filters so we both hit our 1-hour daily goal.",
    time: "10:05 AM",
  },
];

const DEFAULT_SCRATCHPAD_CODE = `// ==========================================
// CIVORA SKILL SWAPPER COLLABORATIVE WORKSPACE
// Student A: Alex (Teaching PPS & C++ Pointers)
// Student B: Priya (Teaching PyTorch Tensors)
// Daily Session Target: 60 Minutes (30m each)
// ==========================================

// PART 1 (0:00 - 30:00) — PPS C++ POINTER DYNAMICS
#include <iostream>
#include <cstdlib>

struct Node {
    int data;
    Node* next;
};

void insertHead(Node*& head, int val) {
    Node* newNode = new Node{val, head};
    head = newNode;
    std::cout << "[Alex] Node with val " << val << " created at " << newNode << std::endl;
}

// PART 2 (30:00 - 60:00) — PYTORCH CONV2D TENSOR SHAPES
/*
import torch
import torch.nn as nn

# Priya: Let's calculate the output dimension of Conv2d
# Output = ((W - K + 2P) / S) + 1
conv = nn.Conv2d(in_channels=3, out_channels=16, kernel_size=3, stride=1, padding=1)
sample_batch = torch.randn(4, 3, 32, 32)
out = conv(sample_batch)
print("Output tensor shape:", out.shape) # -> torch.Size([4, 16, 32, 32])
*/
`;

function loadFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveToStorage<T>(key: string, val: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // ignore
  }
}

export function useSkillSwapper() {
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const today = getTodayString();

  const [partnerships, setPartnerships] = useState<SkillSwapPartnership[]>(() =>
    loadFromStorage(STORAGE_PARTNERSHIPS_KEY, DEFAULT_PARTNERSHIPS),
  );

  const [activePartnerId, setActivePartnerIdState] = useState<string>(() =>
    loadFromStorage(STORAGE_ACTIVE_ID_KEY, "swap-priya-alex"),
  );

  const [sessionLogs, setSessionLogs] = useState<DailySessionAttempt[]>(() =>
    loadFromStorage(STORAGE_SESSIONS_KEY, DEFAULT_SESSIONS),
  );

  const [roomMessages, setRoomMessages] = useState<SwapChatMessage[]>(() =>
    loadFromStorage(STORAGE_MESSAGES_KEY, DEFAULT_ROOM_MESSAGES),
  );

  const [scratchpadCode, setScratchpadCodeState] = useState<string>(() =>
    loadFromStorage(STORAGE_SCRATCHPAD_KEY, DEFAULT_SCRATCHPAD_CODE),
  );

  // Sync state whenever storage changes
  useEffect(() => {
    saveToStorage(STORAGE_PARTNERSHIPS_KEY, partnerships);
  }, [partnerships]);

  useEffect(() => {
    saveToStorage(STORAGE_ACTIVE_ID_KEY, activePartnerId);
  }, [activePartnerId]);

  useEffect(() => {
    saveToStorage(STORAGE_SESSIONS_KEY, sessionLogs);
  }, [sessionLogs]);

  useEffect(() => {
    saveToStorage(STORAGE_MESSAGES_KEY, roomMessages);
  }, [roomMessages]);

  useEffect(() => {
    saveToStorage(STORAGE_SCRATCHPAD_KEY, scratchpadCode);
  }, [scratchpadCode]);

  // Find active partnership
  const activePartnership =
    partnerships.find((p) => p.id === activePartnerId) || partnerships[0] || null;

  // Check if today is completed for active partnership
  const isTodayCompleted = Boolean(
    activePartnership?.is_today_completed ||
    sessionLogs.some((s) => s.partnership_id === activePartnership?.id && s.date === today),
  );

  const setActivePartnerId = useCallback((id: string) => {
    setActivePartnerIdState(id);
  }, []);

  const updateScratchpadCode = useCallback((code: string) => {
    setScratchpadCodeState(code);
  }, []);

  // Send message in room
  const sendRoomMessage = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean) return;

      const userMsg: SwapChatMessage = {
        id: `msg-${Date.now()}`,
        sender_id: "me",
        sender_name: profile?.display_name || "Alex",
        text: clean,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setRoomMessages((prev) => [...prev, userMsg]);

      // Simulate helpful partner response after 1.2s if appropriate
      if (activePartnership) {
        setTimeout(() => {
          const partnerResponses = [
            `Got it! Let's verify the memory layout on that step.`,
            `Clear explanation on that concept! Now let's try the coding exercise.`,
            `Checked! That pointer trace makes complete sense. Ready to run the test.`,
            `Awesome progress! We are halfway through today's 60-minute session.`,
            `Thanks for clarifying that! I've noted it down in our shared session notes.`,
          ];
          const replyText = partnerResponses[Math.floor(Math.random() * partnerResponses.length)]!;
          const partnerMsg: SwapChatMessage = {
            id: `msg-partner-${Date.now()}`,
            sender_id: activePartnership.partner.id,
            sender_name: activePartnership.partner.name,
            text: replyText,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          };
          setRoomMessages((prev) => [...prev, partnerMsg]);
        }, 1200);
      }
    },
    [profile, activePartnership],
  );

  // Complete Today's 1-Hour Session Attempt
  const completeDailySession = useCallback(
    ({
      myTopicTaught,
      partnerTopicTaught,
      notes,
      minutesSpent = 60,
    }: {
      myTopicTaught?: string;
      partnerTopicTaught?: string;
      notes?: string;
      minutesSpent?: number;
    }) => {
      if (!activePartnership) return;

      const myTaught =
        myTopicTaught?.trim() ||
        "PPS: Pointer arithmetic, dynamic memory allocation and edge cases";
      const partnerTaught =
        partnerTopicTaught?.trim() ||
        "PyTorch: Conv2d layer parameters and forward propagation computation";
      const summaryNotes =
        notes?.trim() ||
        "Successfully completed today's 60-minute mutual exchange. Taught and attempted hands-on practice.";

      const pointsEarned = 50;

      const newSession: DailySessionAttempt = {
        id: `session-${Date.now()}`,
        partnership_id: activePartnership.id,
        date: today,
        minutes_spent: minutesSpent,
        my_topic_taught: myTaught,
        partner_topic_taught: partnerTaught,
        notes: summaryNotes,
        my_points_earned: pointsEarned,
        partner_points_earned: pointsEarned,
        timestamp: new Date().toISOString(),
      };

      // Add celebratory message to room
      const celebrateMsg: SwapChatMessage = {
        id: `msg-system-${Date.now()}`,
        sender_id: "system",
        sender_name: "Civora Room Bot",
        text: `🎉 Session Attempt Completed! ${activePartnership.partner.name} and ${profile?.display_name || "Alex"} completed their daily 1-hour swap. +${pointsEarned} Skill Swapper Points awarded to both!`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setSessionLogs((prev) => [newSession, ...prev]);
      setRoomMessages((prev) => [...prev, celebrateMsg]);

      // Update partnership points and streak
      setPartnerships((prev) =>
        prev.map((p) => {
          if (p.id === activePartnership.id) {
            const nextStreak = p.is_today_completed
              ? p.current_streak_days
              : p.current_streak_days + 1;
            return {
              ...p,
              my_points: p.my_points + pointsEarned,
              partner_points: p.partner_points + pointsEarned,
              current_streak_days: nextStreak,
              total_sessions_count: p.total_sessions_count + 1,
              total_minutes_completed: p.total_minutes_completed + minutesSpent,
              last_session_at: new Date().toISOString(),
              is_today_completed: true,
              partner: {
                ...p.partner,
                points: p.partner.points + pointsEarned,
              },
            };
          }
          return p;
        }),
      );

      toast.success(
        `Daily 1-Hour Swap verified! +${pointsEarned} Skill Swapper Points added to your profile!`,
      );
    },
    [activePartnership, profile, today],
  );

  // Start new swap partnership with student / peer
  const startNewSwapPartnership = useCallback(
    ({
      partner,
      mySkillTeaching,
      theirSkillTeaching,
    }: {
      partner: FriendProfile;
      mySkillTeaching: string;
      theirSkillTeaching: string;
    }) => {
      const code = `SWAP-${partner.civora_id.slice(0, 5).toUpperCase()}-${Math.floor(
        100 + Math.random() * 900,
      )}`;

      const newPartnership: SkillSwapPartnership = {
        id: `swap-${partner.id}-${Date.now()}`,
        room_code: code,
        status: "active",
        partner: {
          id: partner.id,
          name: partner.display_name,
          civora_id: partner.civora_id,
          avatar_url: partner.avatar_url,
          department: partner.department,
          skill_teaching: theirSkillTeaching,
          points: 100,
          is_online: true,
        },
        my_skill_teaching: mySkillTeaching,
        current_streak_days: 1,
        my_points: 100,
        partner_points: 100,
        total_sessions_count: 0,
        total_minutes_completed: 0,
        last_session_at: null,
        is_today_completed: false,
        daily_goal_minutes: 60,
        created_at: new Date().toISOString(),
      };

      setPartnerships((prev) => [newPartnership, ...prev]);
      setActivePartnerIdState(newPartnership.id);
      toast.success(`Skill Swap Studio launched with ${partner.display_name}! Room code: ${code}`);
      return newPartnership;
    },
    [],
  );

  // Available students to swap with
  const availablePeers = SEED_STUDENTS;

  return {
    partnerships,
    activePartnership,
    activePartnerId,
    setActivePartnerId,
    sessionLogs: sessionLogs.filter((s) => s.partnership_id === activePartnership?.id),
    allSessionLogs: sessionLogs,
    isTodayCompleted,
    roomMessages,
    scratchpadCode,
    updateScratchpadCode,
    sendRoomMessage,
    completeDailySession,
    startNewSwapPartnership,
    availablePeers,
  };
}
