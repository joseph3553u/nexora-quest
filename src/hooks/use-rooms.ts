import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const KEY = "nexora-active-room";
const EVT = "nexora-active-room-change";

export type Room = { id: string; code: string; name: string; description: string };

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
      const { data, error } = await supabase
        .from("rooms")
        .select("id, code, name, description")
        .order("name");
      if (error) throw error;
      return data as Room[];
    },
  });

  const rooms = roomsQuery.data ?? [];
  const activeRoom = rooms.find((r) => r.id === activeId) ?? rooms[0] ?? null;

  const join = useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc("join_room", { _code: code });
      if (error) throw new Error(error.message.includes("not found") ? "No Room matches that code" : error.message);
      return data as string;
    },
    onSuccess: async (id) => {
      setActiveId(id);
      await qc.invalidateQueries({ queryKey: ["rooms"] });
    },
  });

  const leave = useMutation({
    mutationFn: async (roomId: string) => {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("room_members")
        .delete()
        .eq("room_id", roomId)
        .eq("user_id", u.user!.id);
      if (error) throw error;
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
  return useQuery({
    queryKey: ["room-files", roomId],
    enabled: !!roomId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("room_files")
        .select("*")
        .eq("room_id", roomId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
