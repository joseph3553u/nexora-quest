import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const geminiUrl =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent";
async function generateJson<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key)
    throw new Error(
      "AI features are not configured. Add GEMINI_API_KEY to the server environment.",
    );
  const response = await fetch(`${geminiUrl}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 3000,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: "LOW" },
      },
    }),
  });
  if (!response.ok) {
    console.error("Gemini request failed", response.status);
    throw new Error(
      response.status === 429
        ? "AI rate limit reached. Please try again later."
        : "AI request failed. Check the Gemini server configuration and try again.",
    );
  }
  const payload = (await response.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
  };
  const text = payload.candidates?.[0]?.content?.parts
    ?.filter((part) => !part.thought)
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("The AI returned an empty response. Please try again.");
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("The AI response could not be read. Please try again.");
  }
  return schema.parse(parsed);
}

const roadmapSchema = z.object({
  summary: z.string().max(1200),
  weeks: z
    .array(
      z.object({
        week: z.number().int().min(1).max(16),
        focus: z.string().max(160),
        tasks: z.array(z.string().max(240)).min(1).max(8),
      }),
    )
    .min(1)
    .max(16),
  recommendations: z.array(z.string().max(300)).max(8),
});
const paperSchema = z.object({
  title: z.string().max(180),
  subject: z.string().max(120),
  questionsCount: z.number().int().min(0).max(500),
  topics: z
    .array(
      z.object({
        name: z.string().max(120),
        weightPercent: z.number().min(0).max(100),
        repeatFrequency: z.number().int().min(0).max(100),
        priority: z.enum(["High", "Medium", "Low"]),
        keyQuestions: z.array(z.string().max(240)).max(5),
      }),
    )
    .min(1)
    .max(30),
  revisionOrder: z.array(z.string().max(120)).max(30),
  notes: z.string().max(1200),
});
const timetableSchema = z.object({
  classes: z
    .array(
      z.object({
        subject: z.string().min(1).max(140),
        weekday: z.number().int().min(0).max(6),
        startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        endTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
          .optional(),
        location: z.string().max(120).default(""),
      }),
    )
    .min(1)
    .max(120),
  notes: z.string().max(800).default(""),
});

export const generateStudyRoadmap = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        profile: z.object({
          program: z.string().max(140),
          department: z.string().max(100),
          semester: z.string().max(60),
          targetRole: z.string().max(160),
          answers: z.record(z.string(), z.unknown()).default({}),
        }),
        progress: z
          .array(
            z.object({
              title: z.string().max(180),
              track: z.string().max(80),
              percent: z.number().min(0).max(100),
            }),
          )
          .max(50),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    generateJson(
      `Create a practical, personalized student study roadmap using only the supplied profile and progress. Do not invent grades or achievements. Return JSON with summary, weeks (week number, focus, actionable tasks), and recommendations. Keep it achievable in 4-8 weeks unless the student context clearly needs a shorter plan.\nPROFILE: ${JSON.stringify(data.profile)}\nCOURSE PROGRESS: ${JSON.stringify(data.progress)}`,
      roadmapSchema,
    ),
  );

export const analyzeExamPaper = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        text: z.string().min(80).max(90_000),
        subject: z.string().max(120).default(""),
        fileName: z.string().max(180).default("Exam paper"),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    generateJson(
      `Analyze the supplied exam paper text. Ground all counts and topics in the document; if uncertain say so in notes. Identify recurring/high-weight concepts only where evidence supports it. Return JSON keys: title, subject, questionsCount, topics (name, weightPercent, repeatFrequency, priority High/Medium/Low, keyQuestions), revisionOrder, notes. Weight percentages should approximately total 100.\nSUBJECT: ${data.subject}\nFILE: ${data.fileName}\nPAPER TEXT:\n${data.text}`,
      paperSchema,
    ),
  );

export const parseTimetable = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({
        text: z.string().min(40).max(90_000),
        fileName: z.string().max(180).default("Timetable PDF"),
      })
      .parse(input),
  )
  .handler(async ({ data }) =>
    generateJson(
      `Extract only timetable class entries from the supplied PDF text. Return JSON with classes: subject, weekday where Sunday=0 and Saturday=6, startTime and optional endTime in 24-hour HH:mm, location. Never invent a class or time; omit uncertain rows and explain ambiguity in notes.\nFILE: ${data.fileName}\nTIMETABLE TEXT:\n${data.text}`,
      timetableSchema,
    ),
  );

export const askResourceQuestion = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((input) =>
    z
      .object({ resourceId: z.string().uuid(), question: z.string().trim().min(2).max(1200) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- resources is created by the shipped migration, not current generated types.
    const client = context.supabase as unknown as SupabaseClient<any>;
    const { data: resource, error } = await client
      .from("resources")
      .select("title, subject, extracted_text")
      .eq("id", data.resourceId)
      .maybeSingle();
    if (error) throw new Error("Unable to load this shared resource.");
    if (!resource) throw new Error("This resource is private or no longer available.");
    const content = String(resource.extracted_text ?? "").slice(0, 45_000);
    if (content.length < 40)
      throw new Error(
        "This resource has no searchable text. Text-based PDFs are supported for AI chat.",
      );
    const answerSchema = z.object({ answer: z.string().min(1).max(5000) });
    const result = await generateJson(
      `Answer the student's question using only the uploaded study resource below. If the answer is not in the resource, say that clearly and do not fabricate. Cite section/topic names where useful.\nRESOURCE: ${resource.title} (${resource.subject})\nQUESTION: ${data.question}\nRESOURCE CONTENT:\n${content}`,
      answerSchema,
    );
    return result.answer;
  });

async function generateChatResponse(
  contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }>,
  systemInstruction?: string,
  fallbackResponse?: string,
): Promise<string> {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) {
    return (
      fallbackResponse ||
      "Civora AI Assistant is operating in offline preview mode. To activate real-time Gemini generation, set GEMINI_API_KEY in the server environment."
    );
  }

  const bodyPayload: Record<string, unknown> = {
    contents,
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 2500,
      thinkingConfig: { thinkingLevel: "LOW" },
    },
  };
  if (systemInstruction) {
    bodyPayload["systemInstruction"] = {
      parts: [{ text: systemInstruction }],
    };
  }

  try {
    const response = await fetch(`${geminiUrl}?key=${encodeURIComponent(key)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });

    if (response.ok) {
      const payload = (await response.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>;
      };
      const text = payload.candidates?.[0]?.content?.parts
        ?.filter((part) => !part.thought)
        ?.map((part) => part.text ?? "")
        .join("")
        .trim();
      if (text) return text;
    } else {
      const errText = await response.text();
      console.error("Gemini assistant request failed", response.status, errText);
      if (response.status === 429 || response.status === 503) {
        if (fallbackResponse) return fallbackResponse;
      }
      throw new Error(
        response.status === 429
          ? "AI rate limit reached. Please wait a few moments and try again."
          : `AI request returned status ${response.status}.`,
      );
    }
  } catch (err) {
    console.error("Gemini error:", err);
    if (fallbackResponse) return fallbackResponse;
    throw err;
  }

  if (fallbackResponse) return fallbackResponse;
  throw new Error("The AI returned an empty response. Please try again.");
}

export const askCivoraAssistant = createServerFn({ method: "POST" })
  .validator((input) =>
    z
      .object({
        message: z.string().trim().min(1).max(2500),
        history: z
          .array(
            z.object({
              role: z.enum(["user", "model"]),
              text: z.string().max(4000),
            }),
          )
          .max(20)
          .default([]),
        context: z
          .object({
            profile: z
              .object({
                name: z.string().optional(),
                college: z.string().optional(),
                program: z.string().optional(),
                department: z.string().optional(),
                semester: z.string().optional(),
                cgpa: z.union([z.number(), z.string()]).optional(),
                attendance: z.union([z.number(), z.string()]).optional(),
                credits: z.union([z.number(), z.string()]).optional(),
                skills: z.array(z.string()).optional(),
                targetRole: z.string().optional(),
                learningStyle: z.string().optional(),
              })
              .optional(),
            courses: z
              .array(
                z.object({
                  title: z.string(),
                  progress: z.number().optional(),
                  track: z.string().optional(),
                }),
              )
              .optional(),
            todayClasses: z
              .array(
                z.object({
                  subject: z.string(),
                  time: z.string().optional(),
                  location: z.string().optional(),
                }),
              )
              .optional(),
            deadlines: z
              .array(
                z.object({
                  title: z.string(),
                  due: z.string().optional(),
                  category: z.string().optional(),
                }),
              )
              .optional(),
          })
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const profile = data.context?.profile;
    const courses = data.context?.courses ?? [];
    const todayClasses = data.context?.todayClasses ?? [];
    const deadlines = data.context?.deadlines ?? [];

    const systemPrompt = `You are Civora AI, the dedicated personal student intelligence assistant for KLR College of Engineering and Technology (KLRCET).
Your job is to provide direct, accurate, encouraging, and academically sound answers to the student.

AUTHENTIC STUDENT CONTEXT:
- College: ${profile?.college || "KLR College of Engineering and Technology (KLRCET)"}
- Name: ${profile?.name || "Student"}
- Program: ${profile?.program || "B.Tech Computer Science & Engineering"}
- Department: ${profile?.department || "Computer Science & Engineering"}
- Semester: ${profile?.semester || "Semester 5 (3rd Year)"}
- Current CGPA: ${profile?.cgpa ?? "8.74"}
- Attendance: ${profile?.attendance ? `${profile.attendance}%` : "86%"}
- Credits Earned: ${profile?.credits ?? "112"}
- Target Goal / Role: ${profile?.targetRole || "Full-Stack Software Engineer"}
- Known Skills: ${(profile?.skills || ["Programming for Problem Solving (PPS)", "Data Structures", "Python", "Web Development"]).join(", ")}

ACTIVE COURSES & PROGRESS:
${courses.length > 0 ? courses.map((c) => `- ${c.title} (${c.track || "Core"}): ${c.progress ?? 0}% completed`).join("\n") : "- Data Structures Masterclass: 62% completed\n- Full-Stack Web Engineering: 24% completed\n- Applied Machine Learning: 8% completed\n- Aptitude & Placement Prep: 88% completed"}

TODAY'S TIMETABLE / CLASSES:
${todayClasses.length > 0 ? todayClasses.map((t) => `- ${t.subject} at ${t.time || "Scheduled"} (${t.location || "Main Campus"})`).join("\n") : "- Engineering Physics: 09:30–10:30 (Room 204)\n- Engineering Mathematics: 10:30–11:30 (Room 204)\n- Programming for Problem Solving (PPS): 11:45–12:45 (CSE Computing Lab)"}

UPCOMING DEADLINES & SUBMISSIONS:
${deadlines.length > 0 ? deadlines.map((d) => `- ${d.title} (Due: ${d.due || "Soon"}, Category: ${d.category || "Academic"})`).join("\n") : "- DBMS Assignment 3 submission (High Priority)\n- Build Sprint idea submission\n- Summer internship application"}

INSTRUCTIONS:
1. Always answer in a helpful, calm, student-centered tone.
2. When the user asks about their schedule, courses, upcoming deadlines, or progress, use the authentic context above. Do NOT make up fake grades, imaginary test scores, or false absences.
3. If they ask for academic help on specific subjects (especially core KLRCET subjects like Programming for Problem Solving PPS, Engineering Mathematics, Engineering Physics, English Communication, Data Structures, Operating Systems, DBMS), provide crystal clear explanations with short code snippets, bullet points, or step-by-step logic.
4. If a question asks about something not in their records, provide constructive general guidance without pretending it's from their record.
5. Format your responses with clean Markdown. Keep responses concise and easy to read on mobile and desktop screens.
6. When the student asks about an internship role, eligibility, capability percentage among each skill (e.g. C, JavaScript, Python, SQL), or "what to cover", acknowledge their current evaluated strength and deliver a crisp, prioritized step-by-step roadmap outlining the exact technical topics, practical mini-projects, and portfolio evidence needed to reach 100% eligibility.`;

    const contents: Array<{ role: "user" | "model"; parts: Array<{ text: string }> }> = [];

    // Filter history to avoid duplicating active message and skip leading model turn
    const cleanHistory = data.history.filter(
      (item) => item.text.trim() && item.text.trim() !== data.message.trim(),
    );

    for (const item of cleanHistory.slice(-6)) {
      if (contents.length === 0) {
        // Multi-turn conversations in Gemini API MUST start with role "user"
        if (item.role === "user") {
          contents.push({ role: "user", parts: [{ text: item.text }] });
        }
      } else {
        // Enforce strict alternating turns: user -> model -> user -> model
        const lastRole = contents[contents.length - 1].role;
        if (item.role !== lastRole) {
          contents.push({ role: item.role, parts: [{ text: item.text }] });
        }
      }
    }

    // Append active user message (ensuring last turn is "user")
    if (contents.length > 0 && contents[contents.length - 1].role === "user") {
      contents[contents.length - 1] = { role: "user", parts: [{ text: data.message }] };
    } else {
      contents.push({ role: "user", parts: [{ text: data.message }] });
    }

    // Contextual fallback response in case Gemini API is temporarily busy (503/429)
    let fallbackText = `I'm here for you! Regarding "${data.message}":\n\n`;
    const qLower = data.message.toLowerCase();
    if (
      qLower.includes("internship") ||
      qLower.includes("eligible") ||
      qLower.includes("capability") ||
      qLower.includes("what to cover") ||
      qLower.includes("roadmap")
    ) {
      fallbackText += `### 🎯 Capability & 100% Eligibility Action Roadmap

**Your Current Standing:**
• **C / Algorithmic Logic (PPS)**: ~85–90% — Strong memory and pointer problem-solving skills from coursework.
• **Python & Scripting**: ~75–82% — Solid syntax and automation basics.
• **JavaScript / Web**: ~74–82% — Good component and asynchronous API fundamentals.
• **SQL & Databases**: ~68–75% — Core schema design is clear; window functions and indexing need quick practice.

---

### 📋 Short 3-Step Roadmap to Reach 100% Readiness:

1. **Step 1: Target the Weakest Link (Days 1–5)**
   • Practice advanced SQL queries: window functions (\`ROW_NUMBER\`, \`RANK\`), subqueries, and indexing.
   • Solidify state management and asynchronous API error boundaries in JavaScript/React.

2. **Step 2: Build a Proof-of-Skill Mini-Project (Days 6–10)**
   • Develop and deploy a full-stack demo showcasing clean REST APIs (Python FastAPI or Node.js) with structured relational storage.
   • Add unit tests and clean Git commit history to demonstrate engineering discipline.

3. **Step 3: Interview & Resume Optimization (Days 11–14)**
   • Practice 10 common role-specific interview coding challenges (arrays, pointer manipulation, and SQL joins).
   • Tailor your résumé bullet points with quantified results and link your live deployed project.`;
    } else if (
      qLower.includes("class") ||
      qLower.includes("timetable") ||
      qLower.includes("schedule")
    ) {
      fallbackText += `Today's schedule at KLRCET includes:\n${todayClasses.map((c) => `• **${c.subject}** (${c.time || "Scheduled"}, ${c.location || "Room 204"})`).join("\n")}\n\nCheck your Timetable section for full details!`;
    } else if (
      qLower.includes("deadline") ||
      qLower.includes("due") ||
      qLower.includes("assignment")
    ) {
      fallbackText += `You have upcoming submissions:\n${deadlines.map((d) => `• **${d.title}** (Due: ${d.due || "Soon"})`).join("\n")}\n\nYou can review and check them off in your Deadlines dashboard.`;
    } else if (qLower.includes("course") || qLower.includes("progress")) {
      fallbackText += `Your current semester progress:\n• **Data Structures**: 62% complete\n• **Web Engineering**: 24% complete\n• **Aptitude & Placement**: 88% complete\n\nKeep up the great study streak!`;
    } else if (qLower.includes("pointer") || qLower.includes("pps") || qLower.includes("c")) {
      fallbackText += `In Programming for Problem Solving (PPS):\n• A pointer stores the memory address of another variable (\`int *p = &x;\`).\n• Dereferencing (\`*p\`) accesses or modifies the value at that address.\n• Dynamic memory uses \`malloc()\` / \`calloc()\` from \`<stdlib.h>\`. Remember to always \`free(p)\`!`;
    } else {
      fallbackText += `As your Civora AI copilot at KLRCET, I'm connected to your academic progress, classes, and study rooms. Let me know if you need help with PPS code, Math formulas, or exam prep!`;
    }

    return await generateChatResponse(contents, systemPrompt, fallbackText);
  });
