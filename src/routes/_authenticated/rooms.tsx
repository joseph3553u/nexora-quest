import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DoorOpen, FileText, LogOut, Check } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRoomFiles, useRooms } from "@/hooks/use-rooms";

export const Route = createFileRoute("/_authenticated/rooms")({
  head: () => ({
    meta: [
      { title: "Rooms — Nexora" },
      { name: "description", content: "Join your class Room with a code and access shared files." },
      { property: "og:title", content: "Rooms — Nexora" },
      { property: "og:description", content: "Join your class Room with a code and access shared files." },
    ],
  }),
  component: RoomsPage,
});

function RoomsPage() {
  const { rooms, activeRoom, isLoading, setActiveId, join, leave } = useRooms();
  const [code, setCode] = useState("");
  const files = useRoomFiles(activeRoom?.id);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Rooms" description="Join your class Room to share notes, papers and files." />

      <section className="surface p-6">
        <h2 className="font-display text-lg font-semibold">Join a Room</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the code from your class rep. Try <span className="font-mono font-semibold text-primary">KLRCSE</span>.
        </p>
        <form
          className="mt-4 flex max-w-md gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!code.trim()) return;
            join.mutate(code, {
              onSuccess: () => {
                toast.success("Joined Room");
                setCode("");
              },
              onError: (err) => toast.error(err.message),
            });
          }}
        >
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Room code"
            className="font-mono uppercase"
            aria-label="Room code"
          />
          <Button type="submit" disabled={join.isPending}>
            <DoorOpen className="size-4" /> {join.isPending ? "Joining…" : "Join"}
          </Button>
        </form>
      </section>

      <section className="surface p-6">
        <h2 className="font-display text-lg font-semibold">My Rooms</h2>
        {isLoading ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading…</p>
        ) : rooms.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">You haven't joined any Rooms yet.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-2">
            {rooms.map((r) => {
              const active = r.id === activeRoom?.id;
              return (
                <li key={r.id} className="flex flex-wrap items-center gap-3 rounded-md border border-border p-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">
                      {r.name} {active && <Badge className="ml-2">Active</Badge>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{r.description}</p>
                  </div>
                  {!active && (
                    <Button variant="outline" size="sm" onClick={() => setActiveId(r.id)}>
                      <Check className="size-4" /> Switch
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      leave.mutate(r.id, {
                        onSuccess: () => toast(`Left ${r.name}`),
                        onError: (err) => toast.error(err.message),
                      })
                    }
                  >
                    <LogOut className="size-4" /> Leave Room
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {activeRoom && (
        <section className="surface p-6">
          <h2 className="font-display text-lg font-semibold">{activeRoom.name} files</h2>
          {files.isLoading ? (
            <p className="mt-3 text-sm text-muted-foreground">Loading files…</p>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {(files.data ?? []).map((f) => (
                <li key={f.id} className="flex gap-3 rounded-md border border-border p-3">
                  <FileText className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{f.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {f.subject} · {f.file_type} · {f.size_label} · {f.uploaded_by}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
