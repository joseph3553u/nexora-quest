import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { Bell, LogOut, Menu, Search, Sparkles, X } from "lucide-react";
import { navGroups, navItems, mobileNav } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRooms } from "@/hooks/use-rooms";
import { useProfile } from "@/hooks/use-profile";
import { useTimetableReminders } from "@/hooks/use-timetable-reminders";
import { DoorOpen, ChevronDown } from "lucide-react";
import { CivoraAiChat } from "@/components/ai/CivoraAiChat";

function RoomSwitcher() {
  const { rooms, activeRoom, setActiveId, leave } = useRooms();
  if (!activeRoom) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link to="/rooms">
          <DoorOpen className="size-4" /> Join a Room
        </Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="max-w-44 gap-1.5">
          <DoorOpen className="size-4 text-primary" />
          <span className="truncate font-semibold">{activeRoom.name}</span>
          <ChevronDown className="size-3.5 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Your Rooms</DropdownMenuLabel>
        {rooms.map((r) => (
          <DropdownMenuItem key={r.id} onSelect={() => setActiveId(r.id)}>
            {r.name}{" "}
            {r.id === activeRoom.id && <span className="ml-auto text-xs text-primary">Active</span>}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/rooms">Join another Room</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            leave.mutate(activeRoom.id, { onSuccess: () => toast(`Left ${activeRoom.name}`) })
          }
        >
          <LogOut className="size-4" /> Leave Room
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/dashboard" onClick={onClick} className="flex items-center gap-2.5 px-1">
      <span className="status-glow flex size-9 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <Sparkles className="size-4.5" />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-display text-base font-semibold tracking-tight">Civora</span>
        <span className="text-[11px] text-muted-foreground">Student OS</span>
      </span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  return (
    <nav className="flex flex-col gap-6">
      {navGroups.map((group) => (
        <div key={group} className="flex flex-col gap-1">
          <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {group}
          </p>
          {navItems
            .filter((i) => i.group === group)
            .map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-foreground/75 hover:bg-muted hover:text-sidebar-foreground",
                  )}
                >
                  <item.icon
                    className={cn("size-4.5 shrink-0", active && "text-sidebar-primary")}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {item.title}
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  useTimetableReminders();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [initialAiPrompt, setInitialAiPrompt] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const profileName = profile?.display_name || "Student";
  const profileInitials = profileName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleOpenAi(e: Event) {
      const customEvent = e as CustomEvent<{ prompt?: string }>;
      if (customEvent.detail?.prompt) {
        setInitialAiPrompt(customEvent.detail.prompt);
      } else {
        setInitialAiPrompt(null);
      }
      setAiOpen(true);
    }
    window.addEventListener("open-civora-ai", handleOpenAi);
    return () => window.removeEventListener("open-civora-ai", handleOpenAi);
  }, []);

  async function handleSignOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("civora_guest_session");
      localStorage.removeItem("civora_google_session");
    }
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    await navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Desktop sidebar */}
      <aside className="glass-panel fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border lg:flex">
        <div className="px-4 py-5">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-6">
          <NavList />
        </div>
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-md border border-primary/20 bg-primary-softer p-3.5">
            <p className="text-sm font-semibold">Study streak</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Track your weekly rhythm from your saved learning progress.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm animate-in fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar shadow-lift animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-5">
              <Brand onClick={() => setMobileOpen(false)} />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="size-4.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 pb-8">
              <NavList onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="glass-panel sticky top-0 z-30 border-b border-border">
          <div className="flex h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </Button>
            <div className="lg:hidden">
              <Brand />
            </div>

            <form
              className="relative ml-auto hidden max-w-md flex-1 sm:block lg:ml-0"
              onSubmit={(e) => {
                e.preventDefault();
                toast(query ? `Searching for "${query}"` : "Type something to search");
              }}
            >
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search notes, courses, deadlines…"
                className="h-10 rounded-md bg-muted/60 pl-9"
              />
            </form>

            <div className="ml-auto flex items-center gap-1.5 lg:ml-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAiOpen(true)}
                className="gap-1.5 border-primary/30 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-medium"
              >
                <Sparkles className="size-4 text-primary" />
                <span className="hidden sm:inline">Civora AI</span>
              </Button>
              <RoomSwitcher />
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                aria-label="Timetable reminders"
                onClick={() => void navigate({ to: "/timetable" })}
              >
                <Bell className="size-5" />
                <span className="absolute right-2 top-2 size-2 rounded-full bg-primary" />
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-muted">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-primary-soft text-xs font-semibold text-accent-foreground">
                        {profileInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-left leading-tight md:block">
                      <span className="block text-sm font-medium">{profileName}</span>
                      <span className="block text-[11px] text-muted-foreground">
                        {profile?.semester || "Student profile"}
                      </span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel>{profile?.program || "Civora Student"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/achievements">My achievements</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/projects">My projects</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile">Profile &amp; onboarding</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={handleSignOut}>
                    <LogOut className="size-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Floating Civora AI Copilot Trigger */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground shadow-lift transition hover:scale-105 hover:bg-primary/95 sm:bottom-6 sm:right-6 sm:px-4 sm:py-3 sm:text-sm"
        aria-label="Open Civora AI Assistant"
      >
        <Sparkles className="size-4" />
        <span className="font-display font-medium">Civora AI</span>
      </button>

      {/* Global Central Civora AI Assistant Modal */}
      <Dialog
        open={aiOpen}
        onOpenChange={(open) => {
          setAiOpen(open);
          if (!open) setInitialAiPrompt(null);
        }}
      >
        <DialogContent className="max-w-2xl p-0 h-[620px] border border-border shadow-lift overflow-hidden">
          <CivoraAiChat
            initialPrompt={initialAiPrompt}
            onClose={() => {
              setAiOpen(false);
              setInitialAiPrompt(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Mobile bottom nav */}
      <nav className="glass-panel fixed inset-x-0 bottom-0 z-40 border-t border-border lg:hidden">
        <div className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" strokeWidth={active ? 2.2 : 1.8} />
                {item.short}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
