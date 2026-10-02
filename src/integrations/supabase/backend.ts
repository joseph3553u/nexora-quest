import type { SupabaseClient } from "@supabase/supabase-js";
import { supabase } from "./client";

/** Tables added by the Civora migration are queried through the same authenticated client. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generated Database types do not yet include these migration-owned tables.
export const backend = supabase as unknown as SupabaseClient<any>;
