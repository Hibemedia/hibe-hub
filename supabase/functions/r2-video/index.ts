import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { AwsClient } from "npm:aws4fetch@1.0.20";
import { z } from "npm:zod@3";

// Videos live in Cloudflare R2; the browser uploads/streams directly via presigned URLs.
const PART = 64 * 1024 * 1024;
const MAX = 5 * 1024 * 1024 * 1024;
const uuid = z.string().uuid();
const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("create"), item_id: uuid.optional(), client_id: uuid.optional(), title: z.string().trim().min(1).max(300).optional(), file_name: z.string().min(1).max(300), size: z.number().int().positive().max(MAX), mime: z.string().max(100).optional() }),
  z.object({ action: z.literal("sign_parts"), version_id: uuid }),
  z.object({ action: z.literal("complete"), version_id: uuid, parts: z.array(z.object({ PartNumber: z.number().int().min(1).max(10000), ETag: z.string().max(200) })).min(1).max(10000) }),
  z.object({ action: z.literal("abort"), version_id: uuid }),
  z.object({ action: z.literal("play_url"), version_id: uuid }),
  z.object({ action: z.literal("delete_item"), item_id: uuid }),
]);
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });

function r2() {
  const acc = Deno.env.get("R2_ACCOUNT_ID"), id = Deno.env.get("R2_ACCESS_KEY_ID"), sec = Deno.env.get("R2_SECRET_ACCESS_KEY"), bucket = Deno.env.get("R2_BUCKET");
  if (!acc || !id || !sec || !bucket) throw new Error("Videoopslag is nog niet ingesteld (R2-sleutels ontbreken)");
  return { aws: new AwsClient({ accessKeyId: id, secretAccessKey: sec, service: "s3", region: "auto" }), base: `https://${acc}.r2.cloudflarestorage.com/${bucket}` };
}
const enc = (k: string) => k.split("/").map(encodeURIComponent).join("/");
async function presign(method: string, key: string, params: Record<string, string> = {}, expires = 21600) {
  const { aws, base } = r2();
  const u = new URL(`${base}/${enc(key)}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("X-Amz-Expires", String(expires));
  const s = await aws.sign(new Request(u, { method }), { aws: { signQuery: true } });
  return s.url;
}
async function call(method: string, key: string, query = "", body?: string) {
  const { aws, base } = r2();
  const res = await aws.fetch(`${base}/${enc(key)}${query}`, { method, body });
  const text = await res.text();
  if (!res.ok) throw new Error(`Opslag gaf fout ${res.status}: ${text.slice(0, 300)}`);
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization") ?? "";
    const user = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: auth } } });
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: u } = await user.auth.getUser(auth.replace("Bearer ", ""));
    if (!u.user) return json({ error: "Niet ingelogd" }, 401);
    const p = Body.safeParse(await req.json());
    if (!p.success) return json({ error: p.error.flatten() }, 400);
    const b = p.data;

    if (b.action === "play_url") {
      // RLS decides visibility: clients only see ready versions of their own client-visible items.
      const { data: v } = await user.from("video_versions").select("r2_key,upload_status").eq("id", b.version_id).maybeSingle();
      if (!v || v.upload_status !== "ready") return json({ error: "Video niet gevonden" }, 404);
      return json({ url: await presign("GET", v.r2_key, {}, 14400) });
    }

    const { data: isAdmin } = await user.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Alleen HIBE" }, 403);


    if (b.action === "create") {
      let itemId = b.item_id, clientId = b.client_id;
      if (itemId) {
        const { data: it } = await admin.from("video_items").select("client_id").eq("id", itemId).single();
        if (!it) return json({ error: "Video niet gevonden" }, 404);
        clientId = it.client_id;
      } else {
        if (!clientId || !b.title) return json({ error: "Klant en titel zijn verplicht" }, 400);
        const { data: it, error } = await admin.from("video_items").insert({ client_id: clientId, title: b.title, created_by: u.user.id }).select("id").single();
        if (error) throw error; itemId = it.id;
      }
      const { data: last } = await admin.from("video_versions").select("version").eq("item_id", itemId).order("version", { ascending: false }).limit(1).maybeSingle();
      const version = (last?.version ?? 0) + 1;
      const safe = b.file_name.replace(/[^\w.\-]+/g, "_").slice(-120);
      const key = `${clientId}/${itemId}/v${version}-${crypto.randomUUID().slice(0, 8)}-${safe}`;
      const xml = await call("POST", key, "?uploads");
      const uploadId = xml.match(/<UploadId>([^<]+)<\/UploadId>/)?.[1];
      if (!uploadId) throw new Error("Upload kon niet starten");
      const { data: ver, error } = await admin.from("video_versions").insert({ item_id: itemId, version, r2_key: key, file_name: b.file_name, size_bytes: b.size, mime_type: b.mime ?? null, upload_id: uploadId, uploaded_by: u.user.id }).select("id").single();
      if (error) throw error;
      return json({ item_id: itemId, version_id: ver.id, version, ...(await signAll(key, uploadId, b.size)) });
    }

    const { data: ver } = await admin.from("video_versions").select("*").eq("id", (b as { version_id?: string }).version_id ?? "00000000-0000-0000-0000-000000000000").maybeSingle();

    if (b.action === "sign_parts") {
      // Stale resume (upload deleted or already finished): tell the browser to start fresh.
      if (!ver || ver.upload_status !== "uploading") return json({ gone: true });
      const xml = await call("GET", ver.r2_key, `?uploadId=${encodeURIComponent(ver.upload_id)}&max-parts=10000`);
      const done = [...xml.matchAll(/<Part>[\s\S]*?<PartNumber>(\d+)<\/PartNumber>[\s\S]*?<ETag>([^<]+)<\/ETag>[\s\S]*?<\/Part>/g)].map((m) => ({ PartNumber: Number(m[1]), ETag: m[2].replace(/&quot;/g, '"') }));
      return json({ done, ...(await signAll(ver.r2_key, ver.upload_id, ver.size_bytes)) });
    }
    if (b.action === "complete") {
      if (!ver || ver.upload_status !== "uploading") return json({ error: "Upload niet gevonden" }, 404);
      const parts = [...b.parts].sort((a, c) => a.PartNumber - c.PartNumber).map((x) => `<Part><PartNumber>${x.PartNumber}</PartNumber><ETag>${x.ETag.replace(/[<>&]/g, "")}</ETag></Part>`).join("");
      await call("POST", ver.r2_key, `?uploadId=${encodeURIComponent(ver.upload_id)}`, `<CompleteMultipartUpload>${parts}</CompleteMultipartUpload>`);
      await admin.from("video_versions").update({ upload_status: "ready", upload_id: null }).eq("id", ver.id);
      await admin.from("video_items").update({ current_version: ver.version, status: "internal_review" }).eq("id", ver.item_id);
      return json({ ok: true });
    }
    if (b.action === "abort") {
      if (!ver || ver.upload_status !== "uploading") return json({ ok: true });
      await call("DELETE", ver.r2_key, `?uploadId=${encodeURIComponent(ver.upload_id)}`).catch(() => {});
      await admin.from("video_versions").delete().eq("id", ver.id);
      const { count } = await admin.from("video_versions").select("id", { count: "exact", head: true }).eq("item_id", ver.item_id);
      if (!count) await admin.from("video_items").delete().eq("id", ver.item_id);
      return json({ ok: true });
    }
    if (b.action === "delete_item") {
      const { data: vs } = await admin.from("video_versions").select("r2_key,upload_id,upload_status").eq("item_id", b.item_id);
      for (const v of vs ?? []) {
        await (v.upload_status === "uploading" ? call("DELETE", v.r2_key, `?uploadId=${encodeURIComponent(v.upload_id)}`) : call("DELETE", v.r2_key)).catch(() => {});
      }
      await admin.from("video_items").delete().eq("id", b.item_id);
      return json({ ok: true });
    }
    return json({ error: "Onbekende actie" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

async function signAll(key: string, uploadId: string, size: number) {
  const count = Math.max(1, Math.ceil(size / PART));
  const urls = await Promise.all(Array.from({ length: count }, (_, i) => presign("PUT", key, { partNumber: String(i + 1), uploadId })));
  return { part_size: PART, urls };
}
