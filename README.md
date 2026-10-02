# Civora Student Hub

Civora is an AI-powered student workspace built with React, TypeScript, TanStack Start, Supabase, and Gemini. The existing Civora navigation and visual structure remain in place while student-facing workflows use authenticated, persisted data.

## Backend-backed features

- Supabase authentication and session handling, with first-login profile onboarding.
- Editable student profiles and persisted learning Q&A.
- Course catalog, per-student lesson completion, and saved AI study roadmaps.
- Timetable PDF import, class review/removal, and browser notification reminders.
- Exam-paper PDF upload, Gemini analysis, saved history, and JSON export.
- Persistent community posts, likes, and comments.
- Private file uploads, public/private resource sharing, search/filtering, saved items, signed downloads, and Gemini Q&A grounded in extracted resource text.

## Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`; set the Supabase project URL and publishable key for your app's existing project.
3. Apply [`supabase/migrations/20261002_civora_backend.sql`](supabase/migrations/20261002_civora_backend.sql) to that project with the Supabase SQL editor or `supabase db push`.
4. Set `GEMINI_API_KEY` in the server/runtime environment. It is read only by server functions; do not prefix it with `VITE_` or expose it in client code. AI flows use Gemini 3.8 Flash in JSON mode.
5. Run `npm run dev`.

PDF text extraction is browser-side and supports selectable text. Image-only PDFs can be shared as resources, but need OCR before AI chat can use them. Timetable reminders use browser notifications while a Civora tab is open; they are not push notifications after the browser closes.

## Validation

```sh
npx tsc --noEmit
npm run build
```

The original UI/route hierarchy is retained; new profile and timetable routes are added within the authenticated shell.

## Development

Prefer working locally? Use Node.js and npm:

```sh
git clone <this-repository-url>
cd <repository-name>
npm install
npm run dev
```

This project was initially created with [Lovable](https://lovable.dev); repository changes can continue syncing through its GitHub integration.
