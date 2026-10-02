export type Resource = {
  id: string;
  title: string;
  subject: string;
  type: "Notes" | "Book" | "Slides" | "Video" | "Cheatsheet";
  semester: string;
  rating: number;
  downloads: number;
  author: string;
};

export const resources: Resource[] = [
  {
    id: "r1",
    title: "Operating Systems — Complete Unit Notes",
    subject: "Operating Systems",
    type: "Notes",
    semester: "Sem 4",
    rating: 4.8,
    downloads: 2410,
    author: "Ananya R.",
  },
  {
    id: "r2",
    title: "DSA Patterns Cheatsheet (Top 80)",
    subject: "Data Structures",
    type: "Cheatsheet",
    semester: "Sem 3",
    rating: 4.9,
    downloads: 5120,
    author: "Kiran M.",
  },
  {
    id: "r3",
    title: "Digital Logic Design — Morris Mano",
    subject: "Digital Logic",
    type: "Book",
    semester: "Sem 2",
    rating: 4.5,
    downloads: 1870,
    author: "Library",
  },
  {
    id: "r4",
    title: "DBMS Normalization Walkthrough",
    subject: "DBMS",
    type: "Video",
    semester: "Sem 4",
    rating: 4.7,
    downloads: 990,
    author: "Prof. Iyer",
  },
  {
    id: "r5",
    title: "Computer Networks Lecture Slides",
    subject: "Networks",
    type: "Slides",
    semester: "Sem 5",
    rating: 4.3,
    downloads: 1320,
    author: "Prof. Rao",
  },
  {
    id: "r6",
    title: "Linear Algebra Quick Revision",
    subject: "Mathematics",
    type: "Notes",
    semester: "Sem 2",
    rating: 4.6,
    downloads: 2015,
    author: "Sneha P.",
  },
  {
    id: "r7",
    title: "Machine Learning Formula Sheet",
    subject: "Machine Learning",
    type: "Cheatsheet",
    semester: "Sem 6",
    rating: 4.9,
    downloads: 3440,
    author: "Rahul K.",
  },
  {
    id: "r8",
    title: "Compiler Design Parsing Notes",
    subject: "Compilers",
    type: "Notes",
    semester: "Sem 6",
    rating: 4.2,
    downloads: 760,
    author: "Meera S.",
  },
];

export type Course = {
  id: string;
  title: string;
  provider: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  hours: number;
  progress: number;
  track: string;
  lessons: { id: string; title: string; done: boolean; minutes: number }[];
};

export const courses: Course[] = [
  {
    id: "c1",
    title: "Data Structures Masterclass",
    provider: "Civora Learn",
    level: "Intermediate",
    hours: 28,
    progress: 62,
    track: "Core CS",
    lessons: [
      { id: "l1", title: "Arrays & Two Pointers", done: true, minutes: 45 },
      { id: "l2", title: "Linked Lists", done: true, minutes: 50 },
      { id: "l3", title: "Trees & Traversals", done: false, minutes: 65 },
      { id: "l4", title: "Graphs & Shortest Paths", done: false, minutes: 80 },
    ],
  },
  {
    id: "c2",
    title: "Full-Stack Web Engineering",
    provider: "Civora Learn",
    level: "Advanced",
    hours: 42,
    progress: 24,
    track: "Development",
    lessons: [
      { id: "l1", title: "Modern React Foundations", done: true, minutes: 60 },
      { id: "l2", title: "APIs and Data Fetching", done: false, minutes: 55 },
      { id: "l3", title: "Deployment Pipelines", done: false, minutes: 40 },
    ],
  },
  {
    id: "c3",
    title: "Applied Machine Learning",
    provider: "Civora Learn",
    level: "Advanced",
    hours: 36,
    progress: 8,
    track: "AI & Data",
    lessons: [
      { id: "l1", title: "Regression Refresher", done: true, minutes: 40 },
      { id: "l2", title: "Model Evaluation", done: false, minutes: 45 },
      { id: "l3", title: "Neural Networks Intro", done: false, minutes: 70 },
    ],
  },
  {
    id: "c4",
    title: "Aptitude & Placement Prep",
    provider: "Civora Learn",
    level: "Beginner",
    hours: 18,
    progress: 88,
    track: "Careers",
    lessons: [
      { id: "l1", title: "Quantitative Basics", done: true, minutes: 35 },
      { id: "l2", title: "Logical Reasoning", done: true, minutes: 35 },
      { id: "l3", title: "Verbal Ability", done: false, minutes: 30 },
    ],
  },
];

export type Paper = {
  id: string;
  subject: string;
  year: number;
  exam: string;
  questions: number;
  topics: { name: string; weight: number; repeats: number }[];
};

export const papers: Paper[] = [
  {
    id: "p1",
    subject: "Operating Systems",
    year: 2025,
    exam: "End Semester",
    questions: 42,
    topics: [
      { name: "Process Scheduling", weight: 26, repeats: 7 },
      { name: "Deadlocks", weight: 21, repeats: 6 },
      { name: "Memory Management", weight: 19, repeats: 5 },
      { name: "File Systems", weight: 18, repeats: 4 },
      { name: "Synchronization", weight: 16, repeats: 4 },
    ],
  },
  {
    id: "p2",
    subject: "DBMS",
    year: 2025,
    exam: "End Semester",
    questions: 38,
    topics: [
      { name: "Normalization", weight: 30, repeats: 8 },
      { name: "SQL Queries", weight: 24, repeats: 7 },
      { name: "Transactions", weight: 20, repeats: 5 },
      { name: "Indexing", weight: 14, repeats: 3 },
      { name: "ER Modelling", weight: 12, repeats: 3 },
    ],
  },
  {
    id: "p3",
    subject: "Computer Networks",
    year: 2024,
    exam: "Mid Semester",
    questions: 30,
    topics: [
      { name: "TCP/IP Stack", weight: 28, repeats: 6 },
      { name: "Routing Algorithms", weight: 25, repeats: 6 },
      { name: "Error Control", weight: 18, repeats: 4 },
      { name: "Application Layer", weight: 16, repeats: 4 },
      { name: "Physical Layer", weight: 13, repeats: 2 },
    ],
  },
];

export type Competition = {
  id: string;
  name: string;
  host: string;
  mode: "Online" | "On-campus" | "Hybrid";
  category: "Hackathon" | "Case Study" | "Coding" | "Design" | "Research";
  prize: string;
  deadline: string;
  teamSize: string;
  registered: boolean;
};

export const competitions: Competition[] = [
  {
    id: "k1",
    name: "Civora Build Sprint 2026",
    host: "Civora Labs",
    mode: "Online",
    category: "Hackathon",
    prize: "₹2,00,000",
    deadline: "2026-10-14",
    teamSize: "2-4",
    registered: true,
  },
  {
    id: "k2",
    name: "National Codeathon",
    host: "IIT Madras",
    mode: "Online",
    category: "Coding",
    prize: "₹1,50,000",
    deadline: "2026-10-22",
    teamSize: "1",
    registered: false,
  },
  {
    id: "k3",
    name: "Product Design Challenge",
    host: "Designverse",
    mode: "Hybrid",
    category: "Design",
    prize: "₹80,000",
    deadline: "2026-11-02",
    teamSize: "2-3",
    registered: false,
  },
  {
    id: "k4",
    name: "B-Plan Case Contest",
    host: "IIM Bangalore",
    mode: "On-campus",
    category: "Case Study",
    prize: "₹1,00,000",
    deadline: "2026-11-18",
    teamSize: "3-4",
    registered: false,
  },
  {
    id: "k5",
    name: "Undergrad Research Symposium",
    host: "Civora Academic Council",
    mode: "On-campus",
    category: "Research",
    prize: "Publication + ₹40,000",
    deadline: "2026-12-05",
    teamSize: "1-2",
    registered: false,
  },
];

export type TeamPost = {
  id: string;
  title: string;
  owner: string;
  event: string;
  needed: string[];
  slots: number;
  filled: number;
  note: string;
};

export const teamPosts: TeamPost[] = [
  {
    id: "t1",
    title: "Looking for a backend dev for Build Sprint",
    owner: "Aditya V.",
    event: "Civora Build Sprint 2026",
    needed: ["Node.js", "Postgres"],
    slots: 4,
    filled: 3,
    note: "We have UI + ML covered. Need someone for APIs.",
  },
  {
    id: "t2",
    title: "Design-heavy team for Product Design Challenge",
    owner: "Ishita B.",
    event: "Product Design Challenge",
    needed: ["Figma", "User Research"],
    slots: 3,
    filled: 1,
    note: "Weekly sync on Saturdays, remote friendly.",
  },
  {
    id: "t3",
    title: "Case-comp squad forming",
    owner: "Rohit N.",
    event: "B-Plan Case Contest",
    needed: ["Finance", "Market Research", "Presentation"],
    slots: 4,
    filled: 2,
    note: "Prior case-comp experience preferred but not required.",
  },
  {
    id: "t4",
    title: "ML research partner needed",
    owner: "Priya S.",
    event: "Undergrad Research Symposium",
    needed: ["PyTorch", "Paper Writing"],
    slots: 2,
    filled: 1,
    note: "Topic: efficient transformers for low-resource languages.",
  },
];

export type Deadline = {
  id: string;
  title: string;
  category: "Academic" | "Competition" | "Application" | "Project";
  due: string;
  priority: "High" | "Medium" | "Low";
  done: boolean;
};

export const deadlines: Deadline[] = [
  {
    id: "d1",
    title: "DBMS Assignment 3 submission",
    category: "Academic",
    due: "2026-10-02",
    priority: "High",
    done: false,
  },
  {
    id: "d2",
    title: "Build Sprint idea submission",
    category: "Competition",
    due: "2026-10-05",
    priority: "High",
    done: false,
  },
  {
    id: "d3",
    title: "Summer internship application — Zolve",
    category: "Application",
    due: "2026-10-09",
    priority: "Medium",
    done: false,
  },
  {
    id: "d4",
    title: "Mini project checkpoint demo",
    category: "Project",
    due: "2026-10-12",
    priority: "Medium",
    done: false,
  },
  {
    id: "d5",
    title: "OS lab record submission",
    category: "Academic",
    due: "2026-09-28",
    priority: "Low",
    done: true,
  },
  {
    id: "d6",
    title: "Research symposium abstract",
    category: "Competition",
    due: "2026-10-28",
    priority: "Medium",
    done: false,
  },
];

export type Achievement = {
  id: string;
  title: string;
  issuer: string;
  date: string;
  type: "Award" | "Certification" | "Publication" | "Milestone";
  points: number;
};

export const achievements: Achievement[] = [
  {
    id: "a1",
    title: "Runner-up — Intra-college Hackathon",
    issuer: "Civora University",
    date: "2026-08-21",
    type: "Award",
    points: 120,
  },
  {
    id: "a2",
    title: "Certified Cloud Practitioner",
    issuer: "Cloud Academy",
    date: "2026-07-04",
    type: "Certification",
    points: 80,
  },
  {
    id: "a3",
    title: "Paper accepted at UG Research Meet",
    issuer: "Academic Council",
    date: "2026-05-30",
    type: "Publication",
    points: 150,
  },
  {
    id: "a4",
    title: "500-day learning streak",
    issuer: "Civora Learn",
    date: "2026-09-12",
    type: "Milestone",
    points: 60,
  },
  {
    id: "a5",
    title: "Best UI — Design Jam",
    issuer: "Designverse",
    date: "2026-03-17",
    type: "Award",
    points: 100,
  },
];

export type Subject = {
  id: string;
  code: string;
  name: string;
  semester: number;
  credits: number;
  prerequisites: string[];
  unlocks: string[];
  difficulty: "Easy" | "Moderate" | "Hard";
};

export const subjects: Subject[] = [
  {
    id: "s1",
    code: "CS101",
    name: "Programming Fundamentals",
    semester: 1,
    credits: 4,
    prerequisites: [],
    unlocks: ["CS201", "CS202"],
    difficulty: "Easy",
  },
  {
    id: "s2",
    code: "CS201",
    name: "Data Structures",
    semester: 3,
    credits: 4,
    prerequisites: ["CS101"],
    unlocks: ["CS301", "CS305"],
    difficulty: "Hard",
  },
  {
    id: "s3",
    code: "CS202",
    name: "Discrete Mathematics",
    semester: 3,
    credits: 3,
    prerequisites: ["CS101"],
    unlocks: ["CS305"],
    difficulty: "Moderate",
  },
  {
    id: "s4",
    code: "CS301",
    name: "Operating Systems",
    semester: 4,
    credits: 4,
    prerequisites: ["CS201"],
    unlocks: ["CS402"],
    difficulty: "Hard",
  },
  {
    id: "s5",
    code: "CS305",
    name: "Design & Analysis of Algorithms",
    semester: 5,
    credits: 4,
    prerequisites: ["CS201", "CS202"],
    unlocks: ["CS410"],
    difficulty: "Hard",
  },
  {
    id: "s6",
    code: "CS402",
    name: "Distributed Systems",
    semester: 6,
    credits: 3,
    prerequisites: ["CS301"],
    unlocks: [],
    difficulty: "Moderate",
  },
  {
    id: "s7",
    code: "CS410",
    name: "Machine Learning",
    semester: 6,
    credits: 4,
    prerequisites: ["CS305"],
    unlocks: [],
    difficulty: "Hard",
  },
];

export type Project = {
  id: string;
  name: string;
  summary: string;
  stack: string[];
  status: "Planning" | "Building" | "Shipped";
  progress: number;
  collaborators: number;
};

export const projects: Project[] = [
  {
    id: "pr1",
    name: "Campus Lost & Found",
    summary: "A lightweight board for reporting and claiming lost items on campus.",
    stack: ["React", "TypeScript"],
    status: "Building",
    progress: 55,
    collaborators: 3,
  },
  {
    id: "pr2",
    name: "Attendance Predictor",
    summary: "Predicts how many classes you can skip while staying above 75%.",
    stack: ["Python", "Pandas"],
    status: "Shipped",
    progress: 100,
    collaborators: 2,
  },
  {
    id: "pr3",
    name: "Timetable Optimiser",
    summary: "Generates conflict-free elective timetables for the whole batch.",
    stack: ["Node.js", "Algorithms"],
    status: "Planning",
    progress: 12,
    collaborators: 4,
  },
  {
    id: "pr4",
    name: "Notes Summariser UI",
    summary: "Clean reading interface for long lecture notes with chapter jumps.",
    stack: ["React", "Tailwind"],
    status: "Building",
    progress: 38,
    collaborators: 2,
  },
];

export type Opportunity = {
  id: string;
  role: string;
  org: string;
  type: "Internship" | "Full-time" | "Research" | "Scholarship";
  location: string;
  stipend: string;
  posted: string;
  tags: string[];
  saved: boolean;
};

export const opportunities: Opportunity[] = [
  {
    id: "o1",
    role: "Frontend Engineering Intern",
    org: "Lumen Systems",
    type: "Internship",
    location: "Remote",
    stipend: "₹35,000 / month",
    posted: "2 days ago",
    tags: ["React", "TypeScript"],
    saved: true,
  },
  {
    id: "o2",
    role: "Research Assistant — NLP Lab",
    org: "Civora University",
    type: "Research",
    location: "On-campus",
    stipend: "₹15,000 / month",
    posted: "5 days ago",
    tags: ["Python", "NLP"],
    saved: false,
  },
  {
    id: "o3",
    role: "Graduate Merit Scholarship",
    org: "Vidya Foundation",
    type: "Scholarship",
    location: "India",
    stipend: "₹1,20,000 / year",
    posted: "1 week ago",
    tags: ["Merit", "Need-based"],
    saved: false,
  },
  {
    id: "o4",
    role: "Associate Software Engineer",
    org: "Northwind Tech",
    type: "Full-time",
    location: "Bengaluru",
    stipend: "₹12 LPA",
    posted: "3 days ago",
    tags: ["Backend", "Java"],
    saved: false,
  },
  {
    id: "o5",
    role: "Data Analyst Intern",
    org: "Metrika",
    type: "Internship",
    location: "Hyderabad",
    stipend: "₹25,000 / month",
    posted: "Today",
    tags: ["SQL", "Dashboards"],
    saved: false,
  },
];

export type Post = {
  id: string;
  author: string;
  role: string;
  space: string;
  time: string;
  body: string;
  likes: number;
  replies: number;
  liked: boolean;
};

export const posts: Post[] = [
  {
    id: "cm1",
    author: "Ananya R.",
    role: "CSE · Sem 5",
    space: "Placements",
    time: "20m",
    body: "Cleared the Northwind first round today. They focused heavily on DSA trees and one SQL join question. Happy to share my prep sheet.",
    likes: 42,
    replies: 11,
    liked: false,
  },
  {
    id: "cm2",
    author: "Kiran M.",
    role: "ECE · Sem 3",
    space: "Academics",
    time: "1h",
    body: "Reminder: the DBMS assignment deadline moved to Friday. Prof. Iyer announced it in the lab session only.",
    likes: 88,
    replies: 24,
    liked: true,
  },
  {
    id: "cm3",
    author: "Rohit N.",
    role: "MBA · Year 1",
    space: "Competitions",
    time: "3h",
    body: "Two slots left in our case-comp team. Looking for someone comfortable with financial modelling.",
    likes: 17,
    replies: 6,
    liked: false,
  },
  {
    id: "cm4",
    author: "Meera S.",
    role: "CSE · Sem 6",
    space: "Projects",
    time: "6h",
    body: "Shipped the first version of the timetable optimiser. It now handles elective clashes across three departments.",
    likes: 63,
    replies: 9,
    liked: false,
  },
];

export type Mistake = {
  id: string;
  subject: string;
  question: string;
  whatWentWrong: string;
  fix: string;
  tag: "Concept" | "Silly" | "Time" | "Formula";
  reviewed: boolean;
};

export const mistakes: Mistake[] = [
  {
    id: "m1",
    subject: "DBMS",
    question: "Decompose R(A,B,C,D) into BCNF",
    whatWentWrong: "Skipped checking whether the decomposition was dependency preserving.",
    fix: "Always list all FDs after decomposing and verify preservation explicitly.",
    tag: "Concept",
    reviewed: false,
  },
  {
    id: "m2",
    subject: "Operating Systems",
    question: "Banker's algorithm safe sequence",
    whatWentWrong: "Misread the Available vector row and used Max instead of Need.",
    fix: "Write Need = Max - Allocation as the first step, every time.",
    tag: "Silly",
    reviewed: true,
  },
  {
    id: "m3",
    subject: "Mathematics",
    question: "Eigenvalues of a 3x3 matrix",
    whatWentWrong: "Sign error while expanding the characteristic polynomial.",
    fix: "Expand along the row with the most zeros and re-check signs.",
    tag: "Formula",
    reviewed: false,
  },
  {
    id: "m4",
    subject: "Networks",
    question: "Subnetting a /22 block",
    whatWentWrong: "Spent 14 minutes on a 4-mark question.",
    fix: "Cap subnetting questions at 6 minutes, move on and return later.",
    tag: "Time",
    reviewed: false,
  },
];

export const campusPlaces = [
  {
    id: "cp1",
    name: "Central Library",
    category: "Study",
    hours: "8:00 AM – 11:00 PM",
    block: "Block A",
    note: "Silent floor on level 3. 240 seats, power at every desk.",
  },
  {
    id: "cp2",
    name: "Innovation Lab",
    category: "Labs",
    hours: "9:00 AM – 9:00 PM",
    block: "Block D",
    note: "3D printers and electronics bench. Book a slot at the front desk.",
  },
  {
    id: "cp3",
    name: "North Canteen",
    category: "Food",
    hours: "7:30 AM – 10:00 PM",
    block: "Block B",
    note: "Cheapest thali on campus. Rush between 1:00 and 2:00 PM.",
  },
  {
    id: "cp4",
    name: "Sports Complex",
    category: "Sports",
    hours: "6:00 AM – 9:00 PM",
    block: "West Campus",
    note: "Indoor courts, gym, and a 400m track.",
  },
  {
    id: "cp5",
    name: "Admin & Records",
    category: "Admin",
    hours: "10:00 AM – 4:00 PM",
    block: "Block A",
    note: "Bonafide certificates, transcripts, and fee queries.",
  },
  {
    id: "cp6",
    name: "Health Centre",
    category: "Support",
    hours: "24 hours",
    block: "Block C",
    note: "On-call doctor after 8:00 PM. Counselling by appointment.",
  },
];

export const departments = [
  { id: "dep1", name: "Computer Science", students: 1240, faculty: 64, hod: "Prof. S. Iyer" },
  { id: "dep2", name: "Electronics", students: 860, faculty: 48, hod: "Prof. R. Nambiar" },
  { id: "dep3", name: "Mechanical", students: 910, faculty: 52, hod: "Prof. A. Deshpande" },
  { id: "dep4", name: "Management", students: 540, faculty: 30, hod: "Prof. L. Fernandes" },
];

export const collegeNotices = [
  {
    id: "n1",
    title: "Mid-semester examination timetable released",
    date: "2026-09-29",
    tag: "Exams",
  },
  { id: "n2", title: "Elective registration closes Friday", date: "2026-09-30", tag: "Academics" },
  { id: "n3", title: "Annual tech fest volunteer signups open", date: "2026-10-03", tag: "Events" },
  { id: "n4", title: "Library extends late-night hours", date: "2026-10-06", tag: "Facilities" },
];

export const student = {
  name: "Joseph Harshith",
  program: "B.Tech Computer Science",
  semester: "Semester 5",
  cgpa: 8.74,
  attendance: 86,
  credits: 112,
  streak: 23,
};

export const weeklyStudy = [
  { day: "Mon", hours: 3.2 },
  { day: "Tue", hours: 4.1 },
  { day: "Wed", hours: 2.4 },
  { day: "Thu", hours: 5.0 },
  { day: "Fri", hours: 3.8 },
  { day: "Sat", hours: 6.2 },
  { day: "Sun", hours: 4.4 },
];

export function formatDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function daysUntil(iso: string) {
  const today = new Date("2026-09-30T00:00:00").getTime();
  const target = new Date(iso + "T00:00:00").getTime();
  return Math.round((target - today) / 86400000);
}
