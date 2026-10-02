import { loadEnv } from "vite";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

function normalizeUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function isServerOnlySupabaseKey(value: string) {
  if (value.startsWith("sb_secret_")) return true;
  const payload = value.split(".")[1];
  if (!payload) return false;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")).role === "service_role";
  } catch {
    return false;
  }
}

const mode = process.argv.some((arg) => arg === "dev" || arg === "serve")
  ? "development"
  : "production";
const env = loadEnv(mode, process.cwd(), "");
const browserUrl = env["VITE_SUPABASE_URL"];
const serverUrl = env["SUPABASE_URL"];
const browserKey = env["VITE_SUPABASE_PUBLISHABLE_KEY"];
const serverKey = env["SUPABASE_PUBLISHABLE_KEY"];

if (browserUrl && serverUrl && normalizeUrl(browserUrl) !== normalizeUrl(serverUrl)) {
  throw new Error(
    "[Supabase] VITE_SUPABASE_URL and SUPABASE_URL target different projects. Point both at the same project.",
  );
}
if (
  (browserKey && isServerOnlySupabaseKey(browserKey)) ||
  (serverKey && isServerOnlySupabaseKey(serverKey))
) {
  throw new Error(
    "[Supabase] A server-only secret/service-role key is set as the publishable key. Use a publishable/anon key for the browser client.",
  );
}

const define: Record<string, string> = {};
if (serverUrl) define["import.meta.env.SUPABASE_URL"] = JSON.stringify(serverUrl);
if (serverKey) define["import.meta.env.SUPABASE_PUBLISHABLE_KEY"] = JSON.stringify(serverKey);

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  vite: {
    build: {
      rollupOptions: {},
    },
    // Expose only the two explicitly public Supabase values as a fallback;
    // never expose SUPABASE_SERVICE_ROLE_KEY.
    define,
  },
  nitro: {
    preset: "node-server",
  },
});
