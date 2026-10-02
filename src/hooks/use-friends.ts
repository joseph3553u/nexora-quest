import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { backend } from "@/integrations/supabase/backend";
import { useProfile } from "@/hooks/use-profile";
import { toast } from "sonner";

export interface FriendProfile {
  id: string;
  display_name: string;
  civora_id: string;
  avatar_url: string | null;
  department: string;
  program: string;
  semester: string;
  college: string;
  skills: string[];
  target_role: string;
  is_online?: boolean;
}

export interface FriendshipItem {
  id: string;
  user_id: string;
  friend_id: string;
  status: "pending" | "accepted" | "rejected";
  created_at: string;
  profile: FriendProfile;
  is_sender: boolean;
}

export interface ProjectCollaborationItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  project_title: string;
  project_pitch: string;
  skills_needed: string[];
  status: "pending" | "accepted" | "declined";
  created_at: string;
  other_profile: FriendProfile;
  is_sender: boolean;
}

export interface DirectMessageItem {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read: boolean;
}

export const SEED_STUDENTS: FriendProfile[] = [
  {
    id: "seed-student-priya",
    display_name: "Priya Sharma",
    civora_id: "priya.cse26",
    avatar_url: null,
    department: "Computer Science & Engineering",
    program: "B.Tech CSE",
    semester: "Semester 5",
    college: "KLR College of Engineering and Technology (KLRCET)",
    skills: ["Python", "PyTorch", "React", "Data Structures"],
    target_role: "AI & ML Engineer",
    is_online: true,
  },
  {
    id: "seed-student-rahul",
    display_name: "Rahul Verma",
    civora_id: "rahul.dev",
    avatar_url: null,
    department: "Computer Science & Engineering",
    program: "B.Tech CSE",
    semester: "Semester 5",
    college: "KLR College of Engineering and Technology (KLRCET)",
    skills: ["C++", "Programming for Problem Solving (PPS)", "Backend", "PostgreSQL"],
    target_role: "Systems & Backend Architect",
    is_online: false,
  },
  {
    id: "seed-student-ananya",
    display_name: "Ananya Reddy",
    civora_id: "ananya.math",
    avatar_url: null,
    department: "Information Technology",
    program: "B.Tech IT",
    semester: "Semester 3",
    college: "KLR College of Engineering and Technology (KLRCET)",
    skills: ["Engineering Mathematics", "Algorithms", "Python", "SQL"],
    target_role: "Data Analyst & Quantitative Research",
    is_online: true,
  },
  {
    id: "seed-student-karthik",
    display_name: "Karthik Rao",
    civora_id: "karthik.web",
    avatar_url: null,
    department: "Computer Science & Engineering",
    program: "B.Tech CSE",
    semester: "Semester 5",
    college: "KLR College of Engineering and Technology (KLRCET)",
    skills: ["TypeScript", "Next.js", "Tailwind CSS", "REST APIs"],
    target_role: "Full-Stack Web Developer",
    is_online: true,
  },
];

const LOCAL_STORAGE_FRIENDSHIPS = "civora_friendships_v1";
const LOCAL_STORAGE_COLLABS = "civora_project_collabs_v1";
const LOCAL_STORAGE_MESSAGES = "civora_direct_messages_v1";

function getLocalData<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalData<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore
  }
}

// Initial default seeds for demo feel
const INITIAL_DEMO_FRIENDSHIPS: FriendshipItem[] = [
  {
    id: "f-demo-1",
    user_id: "seed-student-priya",
    friend_id: "demo-student-id",
    status: "accepted",
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    profile: SEED_STUDENTS[0],
    is_sender: false,
  },
  {
    id: "f-demo-2",
    user_id: "seed-student-rahul",
    friend_id: "demo-student-id",
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    profile: SEED_STUDENTS[1],
    is_sender: false,
  },
];

const INITIAL_DEMO_COLLABS: ProjectCollaborationItem[] = [
  {
    id: "collab-demo-1",
    sender_id: "seed-student-priya",
    receiver_id: "demo-student-id",
    project_title: "Campus AI Navigator & Subject Assistant",
    project_pitch:
      "Building a RAG-powered chatbot with KLRCET question bank syllabus embeddings for PPS and Math. Looking to team up on UI and API integration!",
    skills_needed: ["React", "FastAPI", "Vector Embeddings"],
    status: "pending",
    created_at: new Date(Date.now() - 3600000 * 6).toISOString(),
    other_profile: SEED_STUDENTS[0],
    is_sender: false,
  },
];

const INITIAL_DEMO_MESSAGES: DirectMessageItem[] = [
  {
    id: "msg-1",
    sender_id: "seed-student-priya",
    receiver_id: "demo-student-id",
    content: "Hey Joseph! Did you complete the PPS Pointer Assignment for Section B?",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    read: true,
  },
  {
    id: "msg-2",
    sender_id: "demo-student-id",
    receiver_id: "seed-student-priya",
    content:
      "Hey Priya! Yes, working on the dynamic array malloc part now. The roadmap looks good!",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    read: true,
  },
];

export function useFriends() {
  const queryClient = useQueryClient();
  const { data: currentProfile } = useProfile();
  const currentUserId = currentProfile?.id || "demo-student-id";

  // Friendships Query
  const { data: friendships = [], isLoading: loadingFriendships } = useQuery({
    queryKey: ["friendships", currentUserId],
    queryFn: async (): Promise<FriendshipItem[]> => {
      // Try Supabase first
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await backend
            .from("friendships")
            .select(
              `
              id,
              user_id,
              friend_id,
              status,
              created_at,
              sender_profile:profiles!friendships_user_id_fkey(id, display_name, civora_id, avatar_url, department, program, semester, college, skills, target_role),
              receiver_profile:profiles!friendships_friend_id_fkey(id, display_name, civora_id, avatar_url, department, program, semester, college, skills, target_role)
            `,
            )
            .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

          if (!error && data && data.length > 0) {
            return (data as Array<Record<string, unknown>>).map((row) => {
              const isSender = row["user_id"] === user.id;
              const other = (isSender ? row["receiver_profile"] : row["sender_profile"]) as
                Record<string, unknown> | undefined;
              return {
                id: String(row["id"]),
                user_id: String(row["user_id"]),
                friend_id: String(row["friend_id"]),
                status: (row["status"] as "pending" | "accepted" | "rejected") || "pending",
                created_at: String(row["created_at"]),
                is_sender: isSender,
                profile: {
                  id: String(other?.["id"] || (isSender ? row["friend_id"] : row["user_id"])),
                  display_name: String(other?.["display_name"] || "Student"),
                  civora_id: String(other?.["civora_id"] || "student"),
                  avatar_url: (other?.["avatar_url"] as string) || null,
                  department: String(other?.["department"] || "Computer Science"),
                  program: String(other?.["program"] || "B.Tech"),
                  semester: String(other?.["semester"] || "Semester 5"),
                  college: String(other?.["college"] || "KLRCET"),
                  skills: Array.isArray(other?.["skills"])
                    ? (other["skills"] as string[])
                    : ["Programming"],
                  target_role: String(other?.["target_role"] || "Engineer"),
                  is_online: true,
                },
              };
            });
          }
        }
      } catch {
        // Fall back to local
      }

      const local = getLocalData<FriendshipItem[]>(
        LOCAL_STORAGE_FRIENDSHIPS,
        INITIAL_DEMO_FRIENDSHIPS,
      );
      return local;
    },
    staleTime: 10 * 1000,
  });

  // Project Collaboration Requests Query
  const { data: collabRequests = [], isLoading: loadingCollabs } = useQuery({
    queryKey: ["project_collabs", currentUserId],
    queryFn: async (): Promise<ProjectCollaborationItem[]> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await backend
            .from("project_collaboration_requests")
            .select(
              `
              id,
              sender_id,
              receiver_id,
              project_title,
              project_pitch,
              skills_needed,
              status,
              created_at,
              sender_profile:profiles!project_collaboration_requests_sender_id_fkey(id, display_name, civora_id, avatar_url, department, program, semester, college, skills, target_role),
              receiver_profile:profiles!project_collaboration_requests_receiver_id_fkey(id, display_name, civora_id, avatar_url, department, program, semester, college, skills, target_role)
            `,
            )
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`);

          if (!error && data && data.length > 0) {
            return (data as Array<Record<string, unknown>>).map((row) => {
              const isSender = row["sender_id"] === user.id;
              const other = (isSender ? row["receiver_profile"] : row["sender_profile"]) as
                Record<string, unknown> | undefined;
              return {
                id: String(row["id"]),
                sender_id: String(row["sender_id"]),
                receiver_id: String(row["receiver_id"]),
                project_title: String(row["project_title"]),
                project_pitch: String(row["project_pitch"]),
                skills_needed: Array.isArray(row["skills_needed"])
                  ? (row["skills_needed"] as string[])
                  : [],
                status: (row["status"] as "pending" | "accepted" | "declined") || "pending",
                created_at: String(row["created_at"]),
                is_sender: isSender,
                other_profile: {
                  id: String(other?.["id"] || (isSender ? row["receiver_id"] : row["sender_id"])),
                  display_name: String(other?.["display_name"] || "Student"),
                  civora_id: String(other?.["civora_id"] || "student"),
                  avatar_url: (other?.["avatar_url"] as string) || null,
                  department: String(other?.["department"] || "Computer Science"),
                  program: String(other?.["program"] || "B.Tech"),
                  semester: String(other?.["semester"] || "Semester 5"),
                  college: String(other?.["college"] || "KLRCET"),
                  skills: Array.isArray(other?.["skills"]) ? (other["skills"] as string[]) : [],
                  target_role: String(other?.["target_role"] || "Engineer"),
                  is_online: true,
                },
              };
            });
          }
        }
      } catch {
        // Fall back
      }

      return getLocalData<ProjectCollaborationItem[]>(LOCAL_STORAGE_COLLABS, INITIAL_DEMO_COLLABS);
    },
    staleTime: 10 * 1000,
  });

  // Direct Messages Query
  const { data: allMessages = [] } = useQuery({
    queryKey: ["direct_messages", currentUserId],
    queryFn: async (): Promise<DirectMessageItem[]> => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await backend
            .from("direct_messages")
            .select("*")
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: true });

          if (!error && data && data.length > 0) {
            return data as DirectMessageItem[];
          }
        }
      } catch {
        // Fall back
      }

      return getLocalData<DirectMessageItem[]>(LOCAL_STORAGE_MESSAGES, INITIAL_DEMO_MESSAGES);
    },
    refetchInterval: 5000,
  });

  // Search exact Civora ID
  const searchStudent = useCallback(
    async (exactCivoraId: string): Promise<FriendProfile | null> => {
      const cleanId = exactCivoraId.trim().toLowerCase().replace(/^@/, "");
      if (!cleanId) return null;

      // 1. Check seed students
      const foundSeed = SEED_STUDENTS.find((s) => s.civora_id.toLowerCase() === cleanId);
      if (foundSeed) return foundSeed;

      // 2. Query Supabase
      try {
        const { data, error } = await backend
          .from("profiles")
          .select(
            "id, display_name, civora_id, avatar_url, department, program, semester, college, skills, target_role",
          )
          .ilike("civora_id", cleanId)
          .maybeSingle();

        if (!error && data) {
          return {
            id: data.id,
            display_name: data.display_name || "Student",
            civora_id: data.civora_id || cleanId,
            avatar_url: data.avatar_url || null,
            department: data.department || "Computer Science",
            program: data.program || "B.Tech",
            semester: data.semester || "Semester 5",
            college: data.college || "KLRCET",
            skills: data.skills || ["Programming"],
            target_role: data.target_role || "Engineer",
            is_online: true,
          };
        }
      } catch {
        // Not found
      }

      return null;
    },
    [],
  );

  // Send Friend Request
  const sendFriendRequest = async (targetStudent: FriendProfile) => {
    if (
      targetStudent.id === currentUserId ||
      targetStudent.civora_id === currentProfile?.civora_id
    ) {
      toast.error("You cannot send a friend request to yourself.");
      return;
    }

    // Check if already in list
    const existing = friendships.find((f) => f.profile.id === targetStudent.id);
    if (existing) {
      if (existing.status === "accepted") {
        toast.info(`You are already friends with ${targetStudent.display_name}.`);
      } else {
        toast.info("A request is already pending with this student.");
      }
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await backend.from("friendships").insert({
          user_id: user.id,
          friend_id: targetStudent.id,
          status: "pending",
        });
      }
    } catch {
      // Local fallback
    }

    const newFriendship: FriendshipItem = {
      id: `f-${Date.now()}`,
      user_id: currentUserId,
      friend_id: targetStudent.id,
      status: "pending",
      created_at: new Date().toISOString(),
      profile: targetStudent,
      is_sender: true,
    };

    const updated = [newFriendship, ...friendships];
    setLocalData(LOCAL_STORAGE_FRIENDSHIPS, updated);
    queryClient.setQueryData(["friendships", currentUserId], updated);
    toast.success(`Friend request sent to @${targetStudent.civora_id}!`);
  };

  // Accept Friend Request
  const acceptFriendRequest = async (friendshipId: string) => {
    try {
      await backend.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    } catch {
      // Local
    }

    const updated = friendships.map((f) =>
      f.id === friendshipId ? { ...f, status: "accepted" as const } : f,
    );
    setLocalData(LOCAL_STORAGE_FRIENDSHIPS, updated);
    queryClient.setQueryData(["friendships", currentUserId], updated);
    toast.success("Friend request accepted! You can now send 1-to-1 messages.");
  };

  // Reject / Remove Friend
  const removeOrRejectFriend = async (friendshipId: string) => {
    try {
      await backend.from("friendships").delete().eq("id", friendshipId);
    } catch {
      // Local
    }

    const updated = friendships.filter((f) => f.id !== friendshipId);
    setLocalData(LOCAL_STORAGE_FRIENDSHIPS, updated);
    queryClient.setQueryData(["friendships", currentUserId], updated);
    toast.success("Removed friend relationship.");
  };

  // Send Project Collaboration Request
  const sendProjectCollab = async (
    targetStudent: FriendProfile,
    title: string,
    pitch: string,
    skills: string[],
  ) => {
    if (targetStudent.id === currentUserId) {
      toast.error("You cannot send a collaboration request to yourself.");
      return;
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await backend.from("project_collaboration_requests").insert({
          sender_id: user.id,
          receiver_id: targetStudent.id,
          project_title: title.trim(),
          project_pitch: pitch.trim(),
          skills_needed: skills,
          status: "pending",
        });
      }
    } catch {
      // Local
    }

    const newCollab: ProjectCollaborationItem = {
      id: `collab-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: targetStudent.id,
      project_title: title.trim(),
      project_pitch: pitch.trim(),
      skills_needed: skills,
      status: "pending",
      created_at: new Date().toISOString(),
      other_profile: targetStudent,
      is_sender: true,
    };

    const updated = [newCollab, ...collabRequests];
    setLocalData(LOCAL_STORAGE_COLLABS, updated);
    queryClient.setQueryData(["project_collabs", currentUserId], updated);
    toast.success(`Project collaboration invite sent to @${targetStudent.civora_id}!`);
  };

  // Respond to Project Collaboration Request
  const respondProjectCollab = async (collabId: string, status: "accepted" | "declined") => {
    try {
      await backend.from("project_collaboration_requests").update({ status }).eq("id", collabId);
    } catch {
      // Local
    }

    const updated = collabRequests.map((c) => (c.id === collabId ? { ...c, status } : c));
    setLocalData(LOCAL_STORAGE_COLLABS, updated);
    queryClient.setQueryData(["project_collabs", currentUserId], updated);
    toast.success(
      status === "accepted" ? "Project collaboration accepted!" : "Collaboration request declined.",
    );
  };

  // Send Direct Message
  const sendMessage = async (receiverId: string, content: string) => {
    const text = content.trim();
    if (!text) return;

    const newMsg: DirectMessageItem = {
      id: `msg-${Date.now()}`,
      sender_id: currentUserId,
      receiver_id: receiverId,
      content: text,
      created_at: new Date().toISOString(),
      read: false,
    };

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        await backend.from("direct_messages").insert({
          sender_id: user.id,
          receiver_id: receiverId,
          content: text,
        });
      }
    } catch {
      // Local
    }

    const updated = [...allMessages, newMsg];
    setLocalData(LOCAL_STORAGE_MESSAGES, updated);
    queryClient.setQueryData(["direct_messages", currentUserId], updated);
  };

  // Partitioned friendships
  const acceptedFriends = friendships.filter((f) => f.status === "accepted");
  const receivedFriendRequests = friendships.filter((f) => f.status === "pending" && !f.is_sender);
  const sentFriendRequests = friendships.filter((f) => f.status === "pending" && f.is_sender);

  // Partitioned project collabs
  const receivedCollabs = collabRequests.filter((c) => !c.is_sender && c.status === "pending");
  const sentCollabs = collabRequests.filter((c) => c.is_sender);
  const acceptedCollabs = collabRequests.filter((c) => c.status === "accepted");

  return {
    currentProfile,
    currentUserId,
    acceptedFriends,
    receivedFriendRequests,
    sentFriendRequests,
    receivedCollabs,
    sentCollabs,
    acceptedCollabs,
    allMessages,
    loadingFriendships,
    loadingCollabs,
    searchStudent,
    sendFriendRequest,
    acceptFriendRequest,
    removeOrRejectFriend,
    sendProjectCollab,
    respondProjectCollab,
    sendMessage,
    seedStudents: SEED_STUDENTS,
  };
}
