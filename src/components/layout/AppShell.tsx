import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import {
  Bell,
  ChevronDown,
  DoorOpen,
  Flame,
  LogOut,
  Menu,
  Search,
  Sparkles,
  Mic,
  Clock,
  CheckCircle2,
  X,
  BookOpen,
  Calendar,
  Briefcase,
  Users,
  FolderGit2,
  Award,
  Layers,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Sun,
  Moon,
  Settings,
  Gamepad2,
} from "lucide-react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useRooms } from "@/hooks/use-rooms";
import { useProfile } from "@/hooks/use-profile";
import { useTimetableReminders } from "@/hooks/use-timetable-reminders";
import { useTheme } from "@/hooks/use-theme";
import { CivoraAiChat } from "@/components/ai/CivoraAiChat";
import { SettingsDialog } from "@/components/settings/SettingsDialog";

function RoomSwitcher() {
  const { rooms, activeRoom, setActiveId, leave } = useRooms();
  if (!activeRoom) {
    return (
      <Button
        asChild
        variant="outline"
        size="sm"
        className="h-8.5 text-xs border-border/80 bg-card/60 backdrop-blur-md hover:border-primary/50 text-foreground cursor-pointer"
      >
        <Link to="/rooms" className="flex items-center gap-1.5">
          <DoorOpen className="size-3.5 text-primary" />
          <span>Join Room</span>
        </Link>
      </Button>
    );
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8.5 max-w-44 gap-1.5 text-xs border-border/80 bg-card/70 backdrop-blur-md hover:border-primary/60 cursor-pointer"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex size-2 rounded-full bg-primary" />
          </span>
          <span className="truncate font-semibold">{activeRoom.name}</span>
          <ChevronDown className="size-3 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 surface shadow-lift border-border/80">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-mono">
          // Active Study Rooms
        </DropdownMenuLabel>
        {rooms.map((r) => (
          <DropdownMenuItem
            key={r.id}
            onSelect={() => setActiveId(r.id)}
            className="flex items-center justify-between text-xs py-2 cursor-pointer"
          >
            <span className="truncate font-medium">{r.name}</span>
            {r.id === activeRoom.id && (
              <span className="text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                Active
              </span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="text-xs cursor-pointer">
          <Link to="/rooms">Browse &amp; join another room</Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-xs text-destructive focus:text-destructive cursor-pointer"
          onSelect={() =>
            leave.mutate(activeRoom.id, { onSuccess: () => toast(`Left ${activeRoom.name}`) })
          }
        >
          <LogOut className="size-3.5 mr-2" /> Leave Room
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Brand({ onClick }: { onClick?: () => void }) {
  return (
    <Link to="/dashboard" onClick={onClick} className="group flex items-center gap-2.5 px-1 py-1">
      <div className="status-glow relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-tr from-primary via-indigo-500 to-cyan-400 text-primary-foreground shadow-sm transition-transform duration-200 group-hover:scale-105">
        <Sparkles className="size-4.5" />
      </div>
      <span className="font-display text-lg font-bold tracking-tight text-foreground">Civora</span>
    </Link>
  );
}

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });

  const groupLabels: Record<string, string> = {
    Overview: "OVERVIEW",
    Workspace: "WORKSPACE",
    Campus: "CAMPUS NETWORK",
  };

  return (
    <nav className="flex flex-col gap-5">
      {navGroups.map((group) => (
        <div key={group} className="flex flex-col gap-0.5">
          <p className="px-3 pb-1 text-[10px] font-mono font-bold uppercase tracking-widest text-muted-foreground/70">
            {groupLabels[group] || group.toUpperCase()}
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
                    "group relative flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium transition-all duration-150",
                    active
                      ? "bg-primary/12 text-primary font-semibold shadow-xs border border-primary/25"
                      : "text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-transparent",
                  )}
                >
                  {active && (
                    <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary shadow-glow" />
                  )}
                  <item.icon
                    className={cn(
                      "size-4 shrink-0 transition-colors",
                      active
                        ? "text-primary"
                        : "text-muted-foreground/80 group-hover:text-foreground",
                    )}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  <span className="truncate">{item.title}</span>
                </Link>
              );
            })}
        </div>
      ))}
    </nav>
  );
}

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  category: "academic" | "room" | "system";
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    title: "Engineering Physics Lab Scheduled",
    description: "Lab Room 204 at 09:30 AM today. Check equipment list.",
    time: "25m ago",
    read: false,
    category: "academic",
  },
  {
    id: "notif-2",
    title: "DBMS Assignment 3 Due Soon",
    description: "Submission portal closes in 2 days. 3 tasks pending.",
    time: "2h ago",
    read: false,
    category: "academic",
  },
  {
    id: "notif-3",
    title: "Study Room: Algorithm Solvers",
    description: "Priya started a live whiteboard session for Chapter 3.",
    time: "4h ago",
    read: true,
    category: "room",
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  useTimetableReminders();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [initialAiPrompt, setInitialAiPrompt] = useState<string | null>(null);
  const [commandOpen, setCommandOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [query, setQuery] = useState("");
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile } = useProfile();
  const { theme, resolvedTheme, toggleTheme } = useTheme();

  // Demo student name is strictly Alex
  const rawProfileName = profile?.display_name || "Alex";
  const profileName =
    rawProfileName.toLowerCase().includes("joseph") || rawProfileName === "Alex Morgan"
      ? "Alex"
      : rawProfileName;
  const profileInitials =
    profileName
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "AL";

  const [timeString, setTimeString] = useState<string>("");

  useEffect(() => {
    function updateClock() {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true }),
      );
    }
    updateClock();
    const interval = setInterval(updateClock, 30000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    function handleOpenAi(e: Event) {
      const customEvent = e as CustomEvent<{ prompt?: string; voice?: boolean }>;
      if (customEvent.detail?.prompt) {
        setInitialAiPrompt(customEvent.detail.prompt);
      } else {
        setInitialAiPrompt(null);
      }
      setVoiceModeActive(Boolean(customEvent.detail?.voice));
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

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllNotificationsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast.success("All notifications marked as read");
  }

  const commandItems = [
    { title: "Dashboard", subtitle: "Overview & metrics", to: "/dashboard", icon: Layers },
    {
      title: "Timetable",
      subtitle: "Class schedule & lecture rooms",
      to: "/timetable",
      icon: Calendar,
    },
    { title: "Deadlines", subtitle: "Assignments & exam dates", to: "/deadlines", icon: Clock },
    {
      title: "Learning Center",
      subtitle: "Course progress & modules",
      to: "/learning",
      icon: BookOpen,
    },
    {
      title: "Study Resources",
      subtitle: "PDF notes, pyqs & lab records",
      to: "/resources",
      icon: FolderGit2,
    },
    {
      title: "Opportunity Feed",
      subtitle: "Internships & hackathons",
      to: "/opportunities",
      icon: Briefcase,
    },
    {
      title: "Friends & Network",
      subtitle: "Direct messages & peers",
      to: "/friends",
      icon: Users,
    },
    {
      title: "Brain Games",
      subtitle: "Chess, Wordle & Neural Matrix",
      to: "/games",
      icon: Gamepad2,
    },
    { title: "Study Rooms", subtitle: "Group sessions & notes", to: "/rooms", icon: DoorOpen },
    {
      title: "Student Profile",
      subtitle: "Credentials & account handle",
      to: "/profile",
      icon: Sliders,
    },
  ];

  const filteredCommands = query
    ? commandItems.filter((i) => (i.title + i.subtitle).toLowerCase().includes(query.toLowerCase()))
    : commandItems;

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background antialiased selection:bg-primary/25 selection:text-primary">
      {/* Desktop Precision Sidebar */}
      <aside className="glass-panel fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-sidebar-border lg:flex shadow-xs">
        <div className="px-4 py-5 border-b border-sidebar-border/60">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <NavList />
        </div>

        {/* Sidebar Footer: Study Streak Gauge */}
        <div className="border-t border-sidebar-border/60 p-3">
          <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-3.5 backdrop-blur-md relative overflow-hidden shadow-subtle">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <Flame className="size-4 text-amber-500 fill-amber-500" />
                <span>Learning Velocity</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                23 DAYS
              </span>
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground leading-snug">
              Consistent daily study habit verified on your academic record.
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            aria-label="Close navigation"
            className="absolute inset-0 bg-foreground/30 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar border-r border-border shadow-lift animate-in slide-in-from-left duration-200">
            <div className="flex items-center justify-between px-4 py-5 border-b border-border/60">
              <Brand onClick={() => setMobileOpen(false)} />
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                <X className="size-4.5" />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-4">
              <NavList onNavigate={() => setMobileOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="lg:pl-64 min-w-0 max-w-full overflow-x-hidden">
        {/* Top Product Command Bar */}
        <header className="glass-panel sticky top-0 z-30 w-full max-w-full border-b border-border/70 border-x-0 border-t-0 backdrop-blur-xl">
          <div className="flex h-16 w-full max-w-full items-center justify-between gap-2 px-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden size-9 shrink-0"
                onClick={() => setMobileOpen(true)}
                aria-label="Open navigation"
              >
                <Menu className="size-5" />
              </Button>
              <div className="lg:hidden shrink-0">
                <Brand />
              </div>
            </div>

            {/* Quick Command Search Launcher */}
            <button
              onClick={() => setCommandOpen(true)}
              className="relative hidden max-w-sm flex-1 md:flex items-center gap-2 h-9 rounded-xl bg-muted/40 hover:bg-muted/70 border border-border/70 px-3 text-xs text-muted-foreground transition-all cursor-pointer text-left mx-2"
            >
              <Search className="size-3.5 text-muted-foreground/80 shrink-0" />
              <span className="truncate">Jump to course, notes, deadlines…</span>
              <kbd className="ml-auto flex items-center gap-0.5 rounded border border-border/80 bg-background/80 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto md:ml-0">
              {/* Mobile Quick Search trigger */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCommandOpen(true)}
                className="md:hidden size-8.5 rounded-xl hover:bg-muted/70 cursor-pointer"
                aria-label="Search"
              >
                <Search className="size-4 text-foreground/80" />
              </Button>

              {/* Telemetry Clock */}
              {timeString && (
                <div className="hidden xl:flex items-center gap-1.5 rounded-xl border border-border/60 bg-card/60 px-2.5 py-1 text-[11px] font-mono text-muted-foreground shadow-subtle">
                  <Clock className="size-3 text-primary" />
                  <span>{timeString}</span>
                  <span className="text-emerald-500 font-semibold">· ONLINE</span>
                </div>
              )}

              {/* Voice AI Assistant Direct Launcher */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVoiceModeActive(true);
                  setAiOpen(true);
                }}
                className="gap-1.5 h-8.5 rounded-xl border-primary/30 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs transition-all shadow-subtle cursor-pointer px-2.5 sm:px-3"
                title="Launch Voice Academic Assistant"
              >
                <Mic className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Voice AI</span>
              </Button>

              {/* Text AI Assistant Launcher */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setVoiceModeActive(false);
                  setAiOpen(true);
                }}
                className="gap-1.5 h-8.5 rounded-xl border-border/80 bg-card/70 hover:bg-card text-foreground font-semibold text-xs transition-all shadow-subtle cursor-pointer px-2.5 sm:px-3"
              >
                <Sparkles className="size-3.5 text-primary" />
                <span className="hidden sm:inline">Civora AI</span>
              </Button>

              {/* Room Switcher: hidden on mobile to prevent overflow, shown on sm+ */}
              <div className="hidden sm:block">
                <RoomSwitcher />
              </div>

              {/* Quick Dark/Light Mode Theme Toggle Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="size-8.5 rounded-xl hover:bg-muted/70 cursor-pointer"
                title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
                aria-label="Toggle theme"
              >
                {resolvedTheme === "dark" ? (
                  <Sun className="size-4 text-amber-400" />
                ) : (
                  <Moon className="size-4 text-foreground/80" />
                )}
              </Button>

              {/* Interactive Notifications Popover */}
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative size-8.5 rounded-xl hover:bg-muted/70 cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell className="size-4 text-foreground/80" />
                    {unreadCount > 0 && (
                      <span className="absolute right-2 top-2 size-2 rounded-full bg-primary ring-2 ring-background animate-pulse" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-80 surface shadow-lift border-border/80 p-0 overflow-hidden"
                >
                  <div className="flex items-center justify-between border-b border-border/60 bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">Notifications</span>
                      {unreadCount > 0 && (
                        <Badge
                          variant="default"
                          className="text-[10px] py-0 px-1.5 h-4.5 font-mono"
                        >
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] text-primary hover:underline cursor-pointer font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-border/40">
                    {notifications.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "p-3.5 transition-colors hover:bg-muted/40 cursor-pointer",
                          !item.read && "bg-primary/5",
                        )}
                        onClick={() => {
                          setNotifications((prev) =>
                            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n)),
                          );
                        }}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs font-semibold text-foreground leading-snug">
                            {item.title}
                          </p>
                          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                            {item.time}
                          </span>
                        </div>
                        <p className="mt-1 text-[11px] text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-border/60 bg-muted/20 p-2 text-center">
                    <Link
                      to="/timetable"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      View full academic timetable →
                    </Link>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Profile Pill Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-xl p-1 transition-colors hover:bg-muted/70 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 border border-transparent hover:border-border/60">
                    <Avatar className="size-8.5 border border-primary/30">
                      <AvatarFallback className="bg-primary/15 text-xs font-bold text-primary font-mono">
                        {profileInitials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden text-left leading-tight md:block pr-1">
                      <span className="block text-xs font-semibold text-foreground truncate max-w-28">
                        {profileName}
                      </span>
                      <span className="block text-[10px] text-muted-foreground truncate max-w-28 font-mono">
                        {profile?.semester || "Semester 5"}
                      </span>
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-56 surface shadow-lift border-border/80"
                >
                  <DropdownMenuLabel className="font-normal p-3 pb-2">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-foreground">{profileName}</p>
                      <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                        VERIFIED
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate font-mono mt-0.5">
                      {profile?.program || "KLRCET Student"}
                    </p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="text-xs py-2 cursor-pointer">
                    <Link to="/achievements">
                      <Award className="size-3.5 mr-2 text-primary" />
                      My achievements
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-xs py-2 cursor-pointer">
                    <Link to="/projects">
                      <FolderGit2 className="size-3.5 mr-2 text-primary" />
                      My projects
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild className="text-xs py-2 cursor-pointer">
                    <Link to="/profile">
                      <Sliders className="size-3.5 mr-2 text-primary" />
                      Profile settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => setSettingsOpen(true)}
                    className="text-xs py-2 cursor-pointer"
                  >
                    <Settings className="size-3.5 mr-2 text-primary" />
                    Settings &amp; Theme
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onSelect={handleSignOut}
                    className="text-xs py-2 text-destructive focus:text-destructive cursor-pointer"
                  >
                    <LogOut className="size-3.5 mr-2" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>

      {/* Floating Civora AI Copilot Trigger */}
      <button
        onClick={() => {
          setVoiceModeActive(false);
          setAiOpen(true);
        }}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r from-primary to-indigo-600 px-3.5 py-2.5 text-xs font-semibold text-primary-foreground shadow-lift status-glow transition-all duration-200 hover:scale-105 active:scale-95 sm:bottom-6 sm:right-6 sm:px-4 sm:py-3 sm:text-sm cursor-pointer"
        aria-label="Open Civora AI Assistant"
      >
        <Sparkles className="size-4 animate-pulse" />
        <span className="font-display font-medium tracking-tight">Civora AI</span>
      </button>

      {/* Global Central Civora AI Assistant Modal with Voice AI support */}
      <Dialog
        open={aiOpen}
        onOpenChange={(open) => {
          setAiOpen(open);
          if (!open) {
            setInitialAiPrompt(null);
            setVoiceModeActive(false);
          }
        }}
      >
        <DialogContent className="max-w-2xl p-0 h-[640px] border border-border/80 shadow-lift overflow-hidden surface rounded-2xl">
          <CivoraAiChat
            initialPrompt={initialAiPrompt}
            initialVoiceMode={voiceModeActive}
            onClose={() => {
              setAiOpen(false);
              setInitialAiPrompt(null);
              setVoiceModeActive(false);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Global Settings & Preferences Dialog (Dark/Light mode & Cognitive Game Settings) */}
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />

      {/* Command Palette Dialog (Cmd+K) */}
      <Dialog open={commandOpen} onOpenChange={setCommandOpen}>
        <DialogContent className="max-w-xl p-0 border border-border/80 surface shadow-lift rounded-2xl overflow-hidden">
          <div className="flex items-center border-b border-border/60 px-4 py-3 bg-muted/20">
            <Search className="size-4 text-muted-foreground mr-3 shrink-0" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Civora modules, syllabus, or type a page name…"
              className="border-0 bg-transparent p-0 text-sm focus-visible:ring-0 focus-visible:border-0 shadow-none h-8"
            />
            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">
              ESC
            </kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2 space-y-1">
            <p className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-muted-foreground">
              Quick Navigation
            </p>
            {filteredCommands.length === 0 ? (
              <p className="p-4 text-center text-xs text-muted-foreground">
                No matching page found for "{query}".
              </p>
            ) : (
              filteredCommands.map((cmd) => (
                <button
                  key={cmd.to}
                  onClick={() => {
                    setCommandOpen(false);
                    setQuery("");
                    void navigate({ to: cmd.to });
                  }}
                  className="w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left text-xs transition-colors hover:bg-muted/70 cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-7.5 items-center justify-center rounded-lg border border-border/70 bg-card group-hover:border-primary/40 text-primary">
                      <cmd.icon className="size-3.5" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {cmd.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{cmd.subtitle}</p>
                    </div>
                  </div>
                  <ArrowRight className="size-3.5 text-muted-foreground/60 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                </button>
              ))
            )}
          </div>
          <div className="border-t border-border/60 bg-muted/30 px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground font-mono">
            <span>Pro tip: Press ⌘K anywhere to jump</span>
            <div className="flex items-center gap-1">
              <ShieldCheck className="size-3 text-emerald-500" />
              <span>Civora OS</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mobile Bottom Dock */}
      <nav className="glass-panel fixed inset-x-0 bottom-0 z-40 border-t border-border/80 lg:hidden shadow-lg backdrop-blur-xl">
        <div className="grid grid-cols-5">
          {mobileNav.map((item) => {
            const active = pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-all duration-150 relative",
                  active
                    ? "text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {active && (
                  <span className="absolute top-0 inset-x-5 h-0.5 rounded-full bg-primary shadow-glow" />
                )}
                <item.icon className="size-4.5" strokeWidth={active ? 2.2 : 1.8} />
                <span className="truncate max-w-full px-1">{item.short}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
