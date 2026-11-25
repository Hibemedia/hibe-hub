import { createClient } from "npm:@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";
import { trashCutoff, trashExpired, purgeFilesBeforeItem } from "./retention.ts";

Deno.serve(async (request) => {
  const authFailure = authenticateCronRequest(request);
  if (authFailure) return authFailure;
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  try {
    const body = await request.json();
    if (body?.kind !== "daily") return Response.json({ error: "Invalid request" }, { status: 400 });
    const url = Deno.env.get("SUPABASE_URL"), serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const account = Deno.env.get("R2_ACCOUNT_ID"), accessKeyId = Deno.env.get("R2_ACCESS_KEY_ID");
    const secretAccessKey = Deno.env.get("R2_SECRET_ACCESS_KEY"), bucket = Deno.env.get("R2_BUCKET");
    if (!url || !serviceKey || !account || !accessKeyId || !secretAccessKey || !bucket) throw new Error("Missing cleanup configuration");
    const db = createClient(url, serviceKey);
    const aws = new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto" });
    const cutoff = trashCutoff(new Date());
    const started = Date.now();
    let deleted = 0, failed = 0, scanned = 0;
    let after: string | null = null;
    while (Date.now() - started < 45000) {
      let query = db.from("video_items").select("id,trashed_at").lt("trashed_at", cutoff).order("id").limit(100);
      if (after) query = query.gt("id", after);
      const { data: items, error } = await query;
      if (error) throw error;
      if (!items?.length) break;
      for (const item of items) {
        if (Date.now() - started >= 45000) break;
        after = item.id;
        scanned++;
        try {
          // Re-read to exclude anything restored since the batch was fetched.
          const { data: current, error: currentError } = await db.from("video_items").select("trashed_at").eq("id", item.id).maybeSingle();
          if (currentError) throw currentError;
          if (!current || !trashExpired(current.trashed_at, cutoff)) continue;
          const { data: versions, error: versionsError } = await db.from("video_versions").select("r2_key,upload_id,upload_status").eq("item_id", item.id);
          if (versionsError) throw versionsError;
          await purgeFilesBeforeItem(versions ?? [], async (version) => {
            const key = version.r2_key.split("/").map(encodeURIComponent).join("/");
            const target = `https://${account}.r2.cloudflarestorage.com/${bucket}/${key}`;
            if (version.upload_id) {
              const abort = await aws.fetch(`${target}?uploadId=${encodeURIComponent(version.upload_id)}`, { method: "DELETE", signal: AbortSignal.timeout(10000) });
              const text = await abort.text();
              if (!abort.ok && !(abort.status === 404 && text.includes("NoSuchUpload"))) throw new Error(`Multipart abort failed: ${abort.status}`);
            }
            // Idempotent object deletion also covers an upload completed just before interruption.
            const response = await aws.fetch(target, { method: "DELETE", signal: AbortSignal.timeout(10000) });
            await response.text();
            if (!response.ok && response.status !== 404) throw new Error(`Object deletion failed: ${response.status}`);
          }, async () => {
            const { data: removed, error: deleteError } = await db.from("video_items").delete().eq("id", item.id).eq("trashed_at", current.trashed_at).lt("trashed_at", cutoff).select("id");
            if (deleteError) throw deleteError;
            deleted += removed?.length ?? 0;
          });
        } catch {
          failed++;
          console.error("Trash cleanup failed for item", item.id);
        }
      }
      if (items.length < 100) break;
    }
    console.log("Trash cleanup", { cutoff, scanned, deleted, failed });
    return Response.json({ cutoff, scanned, deleted, failed }, { status: failed ? 500 : 200 });
  } catch {
    console.error("Trash cleanup could not complete");
    return Response.json({ error: "Cleanup failed" }, { status: 500 });
  }
});