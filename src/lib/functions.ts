import { supabase } from "@/integrations/supabase/client";

/**
 * Calls one of the app's own server functions and returns its JSON body.
 * A rejected call carries the function's own message in `error.context`.
 */
export async function callFunction<T = any>(name: string, body: unknown): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(await errorMessage(error));
  return data as T;
}

/** The function's own text when it sent one, otherwise the generic failure. */
export async function errorMessage(error: unknown): Promise<string> {
  const context = (error as { context?: { json?: () => Promise<unknown> } })?.context;
  if (context && typeof context.json === "function") {
    try {
      const body = (await context.json()) as { error?: string } | null;
      if (body?.error) return String(body.error);
    } catch {
      /* no readable body — fall through to the generic message */
    }
  }
  return error instanceof Error ? error.message : "Opslaan mislukt";
}
