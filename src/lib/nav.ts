import {
  LayoutDashboard,
  Building2,
  Library,
  GraduationCap,
  FileSearch,
  Trophy,
  Users,
  CalendarClock,
  Award,
  GitBranch,
  FolderKanban,
  Briefcase,
  MessagesSquare,
  Bug,
  MapPin,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  to: string;
  icon: LucideIcon;
  group: string;
  short: string;
};

export const navItems: NavItem[] = [
  { title: "Dashboard", short: "Home", to: "/dashboard", icon: LayoutDashboard, group: "Overview" },
  { title: "College Hub", short: "College", to: "/college-hub", icon: Building2, group: "Overview" },
  { title: "Campus Info", short: "Campus", to: "/campus", icon: MapPin, group: "Overview" },

  { title: "Resource Library", short: "Library", to: "/resources", icon: Library, group: "Learn" },
  { title: "Learning Center", short: "Learn", to: "/learning", icon: GraduationCap, group: "Learn" },
  {
    title: "Paper Analyzer",
    short: "Papers",
    to: "/paper-analyzer",
    icon: FileSearch,
    group: "Learn",
  },
  {
    title: "Prerequisite Finder",
    short: "Prereqs",
    to: "/prerequisites",
    icon: GitBranch,
    group: "Learn",
  },
  { title: "Mistake Bank", short: "Mistakes", to: "/mistake-bank", icon: Bug, group: "Learn" },

  { title: "Competitions", short: "Compete", to: "/competitions", icon: Trophy, group: "Grow" },
  { title: "Team Finder", short: "Teams", to: "/team-finder", icon: Users, group: "Grow" },
  { title: "Project Hub", short: "Projects", to: "/projects", icon: FolderKanban, group: "Grow" },
  {
    title: "Opportunity Feed",
    short: "Jobs",
    to: "/opportunities",
    icon: Briefcase,
    group: "Grow",
  },
  { title: "Achievements", short: "Awards", to: "/achievements", icon: Award, group: "Grow" },

  {
    title: "Deadline Center",
    short: "Deadlines",
    to: "/deadlines",
    icon: CalendarClock,
    group: "Connect",
  },
  {
    title: "Community",
    short: "Community",
    to: "/community",
    icon: MessagesSquare,
    group: "Connect",
  },
];

export const navGroups = ["Overview", "Learn", "Grow", "Connect"];

export const mobileNav = navItems.filter((i) =>
  ["/dashboard", "/resources", "/deadlines", "/competitions", "/community"].includes(i.to),
);
