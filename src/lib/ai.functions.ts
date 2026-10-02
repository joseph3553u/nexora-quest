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
