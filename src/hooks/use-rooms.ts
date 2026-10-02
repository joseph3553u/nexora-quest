import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KEY = "civora-active-room";
const EVT = "civora-active-room-change";
const SESSION_ROOMS_KEY = "civora_session_rooms";
const ROOM_FILES_KEY = "civora_room_files";

export type Room = { id: string; code: string; name: string; description: string };

export type RoomFile = {
  id: string;
  room_id: string;
  subject: string;
  chapter: string;
  title: string;
  file_type: string;
  size_label: string;
  uploaded_by: string;
  created_at: string;
};

const DEFAULT_ROOMS: Room[] = [
  {
    id: "room-cse-2026",
    code: "CSE-2026",
    name: "KLRCET CSE Batch 2026",
    description: "Official 3rd Year Study Room · KLR College of Engineering & Technology",
  },
  {
    id: "room-pps-hub",
    code: "PPS-HUB",
    name: "PPS & Coding Study Circle",
    description: "Programming for Problem Solving practice, code reviews and lab records",
  },
];

function getStoredRooms(): Room[] {
  if (typeof window === "undefined") return DEFAULT_ROOMS;
  try {
    const raw = localStorage.getItem(SESSION_ROOMS_KEY);
    if (!raw) {
      localStorage.setItem(SESSION_ROOMS_KEY, JSON.stringify(DEFAULT_ROOMS));
      return DEFAULT_ROOMS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_ROOMS;
  }
}

function saveStoredRooms(rooms: Room[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SESSION_ROOMS_KEY, JSON.stringify(rooms));
  } catch {
    // Ignore
  }
}

export const SAMPLE_ROOM_FILES: Record<string, Omit<RoomFile, "id" | "room_id">[]> = {
  "Programming for Problem Solving (PPS)": [
    {
      subject: "Programming for Problem Solving (PPS)",
      chapter: "Chapter 1: C Basics & Conditionals",
      title: "C Syntax, Data Types & Operators Cheatsheet",
      file_type: "PDF Document",
      size_label: "1.4 MB",
      uploaded_by: "Prof. Iyer",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      subject: "Programming for Problem Solving (PPS)",
      chapter: "Chapter 1: C Basics & Conditionals",
      title: "Flowcharts & Algorithm Practice Questions",
      file_type: "PDF Document",
      size_label: "850 KB",
      uploaded_by: "Aditya V.",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      subject: "Programming for Problem Solving (PPS)",
      chapter: "Chapter 2: Arrays & Strings",
      title: "2D Array Matrix Multiplication & String Handling Notes",
      file_type: "Handwritten Notes",
      size_label: "2.8 MB",
      uploaded_by: "Meera S.",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      subject: "Programming for Problem Solving (PPS)",
      chapter: "Chapter 3: Pointers & Functions",
      title: "Pointer Arithmetic & Dynamic Memory (malloc/calloc) Guide",
      file_type: "PDF Notes",
      size_label: "3.1 MB",
      uploaded_by: "Joseph H.",
      created_at: new Date().toISOString(),
    },
    {
      subject: "Programming for Problem Solving (PPS)",
      chapter: "Lab Manual & Solutions",
      title: "KLRCET PPS Lab Experiments 1-12 Code & Output",
      file_type: "Lab Record",
      size_label: "4.5 MB",
      uploaded_by: "CSE Dept",
      created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
    },
  ],
  "Engineering Mathematics": [
    {
      subject: "Engineering Mathematics",
      chapter: "Chapter 1: Matrices & Linear Systems",
      title: "Rank of Matrix & Gauss Elimination Method",
      file_type: "Lecture Slides",
      size_label: "2.1 MB",
      uploaded_by: "Prof. Rao",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      subject: "Engineering Mathematics",
      chapter: "Chapter 2: Eigenvalues & Cayley-Hamilton",
      title: "Diagonalization & Powers of Matrices Worked Problems",
      file_type: "PDF Cheatsheet",
      size_label: "1.2 MB",
      uploaded_by: "Kiran M.",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      subject: "Engineering Mathematics",
      chapter: "Chapter 3: Differential Calculus",
      title: "Taylor Series & Maxima-Minima of Two Variables",
      file_type: "Notes",
      size_label: "1.9 MB",
      uploaded_by: "Sneha P.",
      created_at: new Date().toISOString(),
    },
  ],
  "Engineering Physics": [
    {
      subject: "Engineering Physics",
      chapter: "Chapter 1: Wave Optics",
      title: "Interference & Diffraction of Light Notes",
      file_type: "PDF Document",
      size_label: "3.4 MB",
      uploaded_by: "Dr. Nambiar",
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      subject: "Engineering Physics",
      chapter: "Chapter 2: Lasers & Fiber Optics",
      title: "Ruby Laser, He-Ne Laser & Numerical Aperture Guide",
      file_type: "Handwritten Notes",
      size_label: "2.6 MB",
      uploaded_by: "Ananya R.",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      subject: "Engineering Physics",
      chapter: "Physics Lab Manual",
      title: "Newton's Rings & Spectrometer Viva Q&A",
      file_type: "Lab Record",
      size_label: "1.8 MB",
      uploaded_by: "Physics Dept",
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ],
  "English Communication": [
    {
      subject: "English Communication",
      chapter: "Chapter 1: Professional Writing",
      title: "Technical Report Writing & Email Etiquette",
      file_type: "PDF Notes",
      size_label: "980 KB",
      uploaded_by: "Prof. Fernandes",
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      subject: "English Communication",
      chapter: "Chapter 2: Phonetics & Vocabulary",
      title: "Accent Neutralization & Group Discussion Starters",
      file_type: "Audio & Handout",
      size_label: "1.5 MB",
      uploaded_by: "Language Lab",
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
  ],
};

export function useRooms() {
  const qc = useQueryClient();
  const [activeId, setActiveIdState] = useState<string | null>(null);

  useEffect(() => {
    const read = () => setActiveIdState(localStorage.getItem(KEY));
    read();
    window.addEventListener(EVT, read);
    return () => window.removeEventListener(EVT, read);
  }, []);

  const setActiveId = (id: string | null) => {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(EVT));
  };

  const roomsQuery = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      let remoteRooms: Room[] = [];
      try {
        const { data, error } = await supabase
          .from("rooms")
          .select("id, code, name, description")
          .order("name");
        if (!error && data && data.length > 0) {
          remoteRooms = data as Room[];
        }
      } catch {
        // Fall back to local
      }

      const local = getStoredRooms();
      if (remoteRooms.length > 0) {
        const ids = new Set(remoteRooms.map((r) => r.id));
        const merged = [...remoteRooms, ...local.filter((r) => !ids.has(r.id))];
        saveStoredRooms(merged);
        return merged;
      }

      return local;
    },
  });

  const rooms = roomsQuery.data ?? [];
  const activeRoom = rooms.find((r) => r.id === activeId) ?? rooms[0] ?? null;

  const join = useMutation({
    mutationFn: async (input: { code: string; name?: string }) => {
      const code = input.code
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9-]/g, "");
      if (!/^[A-Z0-9-]{3,20}$/.test(code)) {
        throw new Error("Room code must be 3–20 letters, numbers, or dashes");
      }

      const nm = input.name?.trim().slice(0, 60) || `${code} Class Room`;
      let roomId = `room-${code.toLowerCase()}`;

      try {
        const { data, error } = await supabase.rpc(
          "create_or_join_room",
          nm ? { _code: code, _name: nm } : { _code: code },
        );
        if (!error && data) {
          roomId = data as string;
        }
      } catch {
        // Local session fallback
      }

      const currentRooms = getStoredRooms();
      const existing = currentRooms.find((r) => r.code === code);
      if (!existing) {
        const newRoom: Room = {
          id: roomId,
          code,
          name: nm,
          description: `KLR College of Engineering & Technology · ${code} Session Room`,
        };
        const updated = [newRoom, ...currentRooms];
        saveStoredRooms(updated);
      } else {
        roomId = existing.id;
      }

      return roomId;
    },
    onSuccess: async (id) => {
      setActiveId(id);
      await qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const leave = useMutation({
    mutationFn: async (roomId: string) => {
      try {
        const { data: u } = await supabase.auth.getUser();
        if (u.user) {
          await supabase
            .from("room_members")
            .delete()
            .eq("room_id", roomId)
            .eq("user_id", u.user.id);
        }
      } catch {
        // Fall back
      }

      const currentRooms = getStoredRooms();
      const filtered = currentRooms.filter((r) => r.id !== roomId);
      saveStoredRooms(filtered);
      return roomId;
    },
    onSuccess: async (roomId) => {
      if (activeId === roomId) setActiveId(null);
      await qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  return { rooms, activeRoom, isLoading: roomsQuery.isLoading, setActiveId, join, leave };
}

export function useRoomFiles(roomId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["room-files", roomId],
    enabled: !!roomId,
    queryFn: async (): Promise<RoomFile[]> => {
      if (!roomId) return [];

      let remoteFiles: RoomFile[] = [];
      try {
        const { data, error } = await supabase
          .from("room_files")
          .select("*")
          .eq("room_id", roomId)
          .order("created_at", { ascending: false });
        if (!error && data && data.length > 0) {
          remoteFiles = data as RoomFile[];
        }
      } catch {
        // Fallback
      }

      let localFiles: RoomFile[] = [];
      try {
        const raw = localStorage.getItem(`${ROOM_FILES_KEY}_${roomId}`);
        if (raw) {
          localFiles = JSON.parse(raw);
        }
      } catch {
        // Fallback
      }

      if (remoteFiles.length === 0 && localFiles.length === 0) {
        // Populate with realistic sample files for this room
        const generated: RoomFile[] = [];
        let idCounter = 1;
        for (const [subj, fileList] of Object.entries(SAMPLE_ROOM_FILES)) {
          for (const item of fileList) {
            generated.push({
              ...item,
              id: `rf-${roomId}-${idCounter++}`,
              room_id: roomId,
            });
          }
        }
        try {
          localStorage.setItem(`${ROOM_FILES_KEY}_${roomId}`, JSON.stringify(generated));
        } catch {
          // Ignore
        }
        return generated;
      }

      return [...remoteFiles, ...localFiles];
    },
  });

  const addFile = useMutation({
    mutationFn: async (newFile: Omit<RoomFile, "id" | "room_id" | "created_at">) => {
      if (!roomId) throw new Error("No active room");

      const item: RoomFile = {
        ...newFile,
        id: `rf-custom-${Date.now()}`,
        room_id: roomId,
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from("room_files").insert(item);
      } catch {
        // Fall back to local
      }

      let localFiles: RoomFile[] = [];
      try {
        const raw = localStorage.getItem(`${ROOM_FILES_KEY}_${roomId}`);
        if (raw) localFiles = JSON.parse(raw);
      } catch {
        // Ignore
      }

      const updated = [item, ...localFiles];
      try {
        localStorage.setItem(`${ROOM_FILES_KEY}_${roomId}`, JSON.stringify(updated));
      } catch {
        // Ignore
      }
      return item;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["room-files", roomId] });
    },
  });

  return { ...query, addFile };
}
