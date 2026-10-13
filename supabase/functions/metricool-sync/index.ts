import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { authenticateCronRequest } from "../_shared/cron-auth.ts";

const BASE = "https://app.metricool.com/api/v2/analytics";
const TZ = "Europe/Amsterdam";
const HISTORY_START = "2025-06-01";
const TOKEN = Deno.env.get("METRICOOL_API_TOKEN")!;
const MC_USER = Deno.env.get("METRICOOL_USER_ID")!;

type Mode = "daily" | "refresh" | "backfill" | "scheduled";
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ---------- dates ----------
const amsDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
const addDays = (iso: string, n: number) => {
  const d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10);
};
function chunks(from: string, to: string, size = 30): [string, string][] {
  const out: [string, string][] = [];
  for (let s = from; s <= to; s = addDays(s, size)) {
    const e = addDays(s, size - 1);
    out.push([s, e > to ? to : e]);
  }
  return out;
}
/** Convert a wall-clock time in a time zone to a UTC ISO string. */
function zonedToUtc(local: string, tz: string): string {
  const asUtc = new Date(local.slice(0, 19) + "Z");
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(asUtc);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const tzAsUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return new Date(asUtc.getTime() - (tzAsUtc - asUtc.getTime())).toISOString();
}
const cleanTitle = (s?: string | null) =>
  (s ?? "").split("\n")[0].replace(/#[^\s#]+/g, "").replace(/\s+/g, " ").trim() || null;

// ---------- metricool ----------
async function mc(path: string, blogId: string, params: Record<string, string>, base = BASE) {
  const qs = new URLSearchParams({ userId: MC_USER, blogId, ...params });
  const res = await fetch(`${base}/${path}?${qs}`, { headers: { "X-Mc-Auth": TOKEN } });
  if (!res.ok) throw new Error(`Metricool ${path} ${params.metric ?? ""} ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res.json();
}
const range = (s: string, e: string) => ({ from: `${s}T00:00:00+02:00`, to: `${e}T23:59:59+02:00` });

type Row = Record<string, number | string | null>;
const STAT_SPECS: { net: "ig" | "tt" | "yt"; col: string; params: Record<string, string> }[] = [
  ...(["followers:followers", "views:views", "reach:reach", "followers_gained:followers_gained", "followers_lost:followers_lost", "postsCount:posts"]
    .map((m) => { const [metric, col] = m.split(":"); return { net: "ig" as const, col, params: { network: "instagram", subject: "account", metric } }; })),
  { net: "ig", col: "interactions", params: { network: "instagram", subject: "posts", metric: "interactions" } },
  { net: "ig", col: "interactions", params: { network: "instagram", subject: "reels", metric: "interactions" } },
  { net: "tt", col: "followers", params: { network: "tiktok", metric: "followers_count", subject: "account" } },
  { net: "tt", col: "views", params: { network: "tiktok", metric: "video_views", metricType: "account" } },
  { net: "tt", col: "reach", params: { network: "tiktok", metric: "reach", subject: "video" } },
  { net: "tt", col: "interactions", params: { network: "tiktok", metric: "interactions" } },
  { net: "tt", col: "posts", params: { network: "tiktok", metric: "videos" } },
  { net: "tt", col: "followers_gained", params: { network: "tiktok", metric: "daily_new_followers", subject: "account" } },
  { net: "tt", col: "followers_lost", params: { network: "tiktok", metric: "daily_lost_followers", subject: "account" } },
  { net: "yt", col: "followers", params: { network: "youtube", subject: "account", metric: "totalSubscribers" } },
  { net: "yt", col: "views", params: { network: "youtube", subject: "account", metric: "views" } },
  { net: "yt", col: "followers_gained", params: { network: "youtube", subject: "account", metric: "subscribersGained" } },
  { net: "yt", col: "followers_lost", params: { network: "youtube", subject: "account", metric: "subscribersLost" } },
  { net: "fb", col: "followers", params: { network: "facebook", subject: "account", metric: "pageFollows" } },
  { net: "fb", col: "views", params: { network: "facebook", subject: "account", metric: "page_media_view" } },
  { net: "fb", col: "followers_gained", params: { network: "facebook", subject: "account", metric: "page_daily_follows_unique" } },
  { net: "fb", col: "followers_lost", params: { network: "facebook", subject: "account", metric: "page_daily_unfollows_unique" } },
  { net: "fb", col: "posts", params: { network: "facebook", subject: "account", metric: "postsCount" } },
  { net: "fb", col: "interactions", params: { network: "facebook", subject: "posts", metric: "interactions" } },
  { net: "li", col: "followers", params: { network: "linkedin", metricType: "account", metric: "Followers" } },
  { net: "li", col: "views", params: { network: "linkedin", metricType: "account", metric: "impression" } },
  { net: "li", col: "followers_gained", params: { network: "linkedin", metricType: "account", metric: "DeltaFollowers" } },
  { net: "li", col: "posts", params: { network: "linkedin", metricType: "posts", metric: "count" } },
  { net: "li", col: "interactions", params: { network: "linkedin", metricType: "posts", metric: "interactions" } },
  { net: "th", col: "followers", params: { network: "threads", subject: "account", metric: "followers_count" } },
  { net: "th", col: "views", params: { network: "threads", subject: "account", metric: "views" } },
  { net: "th", col: "followers_gained", params: { network: "threads", subject: "account", metric: "delta_followers" } },
  { net: "th", col: "posts", params: { network: "threads", subject: "posts", metric: "count" } },
  { net: "th", col: "interactions", params: { network: "threads", subject: "posts", metric: "interactions" } },
];
type Net = "ig" | "tt" | "yt" | "fb" | "li" | "th";
const ALL_NETS: Net[] = ["ig", "tt", "yt", "fb", "li", "th"];
/** Networks connected to a Metricool brand (simpleProfiles fields). */
function netsOf(b: any): Net[] {
  if (!b) return ["ig", "tt", "yt"];
  const m: Record<Net, unknown> = { ig: b.instagram, tt: b.tiktok, yt: b.youtube, fb: b.facebook ?? b.facebookPageId, li: b.linkedinCompany, th: b.threads };
  return ALL_NETS.filter((n) => !!m[n]);
}
const EMPTY: Row = { followers: null, views: null, reach: null, interactions: null, posts: null, followers_gained: null, followers_lost: null };

async function syncStats(db: any, client: { id: string; metricool_blog_id: string }, from: string, to: string, nets: Net[]) {
  const specs = STAT_SPECS.filter((x) => nets.includes(x.net as Net));
  let count = 0;
  for (const [s, e] of chunks(from, to)) {
    const rows = new Map<string, Row>();
    const results = await Promise.all(specs.map(async (spec) => {
      const r = await mc("timelines", client.metricool_blog_id, { ...range(s, e), timezone: TZ, ...spec.params });
      return { spec, values: (r?.data?.[0]?.values ?? []) as { dateTime: string; value: number | null }[] };
    }));
    for (const { spec, values } of results) {
      for (const v of values) {
        const date = v.dateTime.slice(0, 10);
        if (date < s || date > e) continue;
        const key = `${spec.net}|${date}`;
        const row = rows.get(key) ?? { client_id: client.id, network: spec.net, date, ...EMPTY };
        if (v.value != null) {
          row[spec.col] = spec.col === "interactions" ? Number(row[spec.col] ?? 0) + v.value : v.value;
        }
        rows.set(key, row);
      }
    }
    // YouTube posts = number of videos published that day (from videos table)
    const { data: ytv } = await db.from("videos").select("published_at").eq("client_id", client.id).eq("network", "yt")
      .gte("published_at", zonedToUtc(`${s}T00:00:00`, TZ)).lte("published_at", zonedToUtc(`${e}T23:59:59`, TZ));
    const perDay = new Map<string, number>();
    for (const v of ytv ?? []) { const d = amsDate(new Date(v.published_at)); perDay.set(d, (perDay.get(d) ?? 0) + 1); }
    for (const [k, row] of rows) if (k.startsWith("yt|")) row.posts = perDay.get(row.date as string) ?? 0;

    const list = Array.from(rows.values()).map((r) => {
      for (const c of ["followers", "posts", "followers_gained", "followers_lost", "views", "reach", "interactions"]) if (r[c] != null) r[c] = Math.round(Number(r[c]));
      return r;
    });
    if (list.length) {
      const { error } = await db.from("daily_stats").upsert(list, { onConflict: "client_id,network,date" });
      if (error) throw error;
      count += list.length;
    }
  }
  return count;
}

let ytLogged = false;
const logged = new Set<string>();
const VIDEO_PATHS: Record<"fb" | "li" | "th", string> = { fb: "reels/facebook", li: "posts/linkedin", th: "posts/threads" };
const dt = (v: any): string | null => {
  if (!v) return null;
  if (typeof v === "object" && v.dateTime) return zonedToUtc(v.dateTime, v.timezone || TZ);
  if (typeof v === "number") return new Date(v).toISOString();
  const d = new Date(String(v).replace(/([+-]\d{2})(\d{2})$/, "$1:$2")); return isNaN(+d) ? null : d.toISOString();
};
/** Generic mapper for Facebook reels / LinkedIn / Threads posts (fields confirmed via logged first item). */
function mapGeneric(net: string, clientId: string, r: any): Row | null {
  const id = r.id ?? r.postId ?? r.reelId ?? r.videoId ?? r.urn;
  if (id == null) return null;
  const n = (x: any) => (x == null ? null : typeof x === "object" ? Number(x.total ?? x.count ?? 0) : Number(x));
  return { client_id: clientId, network: net, external_id: String(id),
    published_at: dt(r.publishedAt ?? r.created ?? r.createdAt ?? r.timestamp ?? r.date),
    title: cleanTitle(r.text ?? r.content ?? r.message ?? r.description ?? r.title),
    views: n(r.views ?? r.videoViews ?? r.impressions ?? r.plays) ?? 0,
    likes: n(r.likes ?? r.reactions ?? r.totalReactions) ?? 0, comments: n(r.comments) ?? 0,
    shares: n(r.shares ?? r.reposts ?? r.reshares) ?? 0, saves: null,
    url: r.url ?? r.link ?? r.permalink ?? r.permalinkUrl ?? r.publicUrl ?? null,
    thumbnail_url: r.thumbnailUrl ?? r.picture ?? r.imageUrl ?? r.image ?? null };
}

async function syncVideos(db: any, client: { id: string; metricool_blog_id: string }, from: string, to: string, nets: Net[]) {
  let count = 0;
  for (const [s, e] of chunks(from, to)) {
    const blog = client.metricool_blog_id;
    const none = Promise.resolve(null);
    const [ig, tt, yt] = await Promise.all([
      nets.includes("ig") ? mc("reels/instagram", blog, { from: `${s}T00:00:00`, to: `${e}T23:59:59` }) : none,
      nets.includes("tt") ? mc("posts/tiktok", blog, range(s, e)) : none,
      nets.includes("yt") ? mc("posts/youtube", blog, { ...range(s, e), timezone: TZ, postsType: "publishedInRange" }) : none,
    ]);
    const extra: Row[] = [];
    for (const net of ["fb", "li", "th"] as const) {
      if (!nets.includes(net)) continue;
      try {
        const r = await mc(VIDEO_PATHS[net], blog, { from: `${s}T00:00:00`, to: `${e}T23:59:59`, timezone: TZ });
        const list: any[] = Array.isArray(r) ? r : (r?.data ?? []);
        if (list.length && !logged.has(net)) { console.log(`${net} first item:`, JSON.stringify(list[0]).slice(0, 2500)); logged.add(net); }
        for (const it of list) { const row = mapGeneric(net, client.id, it); if (row) extra.push(row); }
      } catch (err) { console.error(`${net} posts failed:`, String(err).slice(0, 300)); }
    }
    const rows: Row[] = [...extra];
    for (const r of ig?.data ?? []) {
      const code = /\/reel\/([^/?]+)/.exec(r.url ?? "")?.[1];
      if (!code) continue;
      rows.push({ client_id: client.id, network: "ig", external_id: code,
        published_at: r.publishedAt?.dateTime ? zonedToUtc(r.publishedAt.dateTime, r.publishedAt.timezone || TZ) : null,
        title: cleanTitle(r.content), views: r.views ?? 0, likes: r.likes ?? 0, comments: r.comments ?? 0,
        shares: r.shares ?? 0, saves: r.saved ?? 0, url: r.url, thumbnail_url: null, _image: r.imageUrl ?? null });
    }
    for (const r of tt?.data ?? []) {
      if (!r.videoId) continue;
      let url: string | null = r.shareUrl ?? null;
      if (url) { const u = new URL(url); [...u.searchParams.keys()].filter((k) => k.startsWith("utm_")).forEach((k) => u.searchParams.delete(k)); url = u.toString().replace(/\?$/, ""); }
      rows.push({ client_id: client.id, network: "tt", external_id: String(r.videoId),
        published_at: r.createTime ? new Date(r.createTime.replace(/([+-]\d{2})(\d{2})$/, "$1:$2")).toISOString() : null,
        title: cleanTitle(r.title), views: r.viewCount ?? 0, likes: r.likeCount ?? 0, comments: r.commentCount ?? 0,
        shares: r.shareCount ?? 0, saves: null, url, thumbnail_url: r.coverImageUrl ?? null });
    }
    for (const r of yt?.data ?? []) {
      if (!ytLogged) { console.log("YouTube first item:", JSON.stringify(r)); ytLogged = true; }
      if (!r.videoId) continue;
      rows.push({ client_id: client.id, network: "yt", external_id: r.videoId,
        published_at: r.publishedAt?.dateTime ? zonedToUtc(r.publishedAt.dateTime, r.publishedAt.timezone || TZ) : null,
        title: cleanTitle(r.title), views: r.views ?? 0, likes: r.likes ?? 0, comments: r.comments ?? 0,
        shares: r.shares ?? 0, saves: null, url: `https://youtu.be/${r.videoId}`, thumbnail_url: r.thumbnailUrl ?? null });
    }
    await storeIgThumbnails(db, client.id, rows);
    // de-dupe within batch (same id can appear twice in one response)
    const uniq = new Map(rows.map((r) => [`${r.network}|${r.external_id}`, r])); rows.length = 0; rows.push(...uniq.values());
    for (const r of rows) for (const c of ["views", "likes", "comments", "shares", "saves"]) if (r[c] != null) r[c] = Math.round(Number(r[c]));
    if (rows.length) {
      const { error } = await db.from("videos").upsert(rows, { onConflict: "network,external_id" });
      if (error) throw error;
      count += rows.length;
    }
  }
  return count;
}

/** Instagram image URLs expire: copy them once into our own storage. Keeps existing thumbnails. */
async function storeIgThumbnails(db: any, clientId: string, rows: Row[]) {
  const ig = rows.filter((r) => r.network === "ig");
  if (!ig.length) return;
  const { data: existing } = await db.from("videos").select("external_id,thumbnail_url").eq("network", "ig")
    .in("external_id", ig.map((r) => r.external_id));
  const have = new Map((existing ?? []).map((v: any) => [v.external_id, v.thumbnail_url]));
  for (const r of ig) {
    const img = r._image as string | null; delete r._image;
    const cur = have.get(r.external_id as string);
    if (cur) { r.thumbnail_url = cur; continue; }
    if (!img) continue;
    try {
      const res = await fetch(img);
      if (!res.ok) continue; // expired: keep grey box
      const path = `${clientId}/${r.external_id}.jpg`;
      const { error } = await db.storage.from("thumbnails").upload(path, await res.arrayBuffer(), { contentType: res.headers.get("content-type") ?? "image/jpeg", upsert: true });
      if (!error) r.thumbnail_url = `storage:thumbnails/${path}`;
    } catch { /* keep grey box */ }
  }
}

let schedLogged = false;
/** Scheduled Metricool posts become review items (source 'metricool'). Existing items keep their status. */
async function syncScheduled(db: any, client: { id: string; metricool_blog_id: string }, from: string, to: string) {
  const r = await mc("scheduler/posts", client.metricool_blog_id,
    { start: `${from}T00:00:00`, end: `${to}T23:59:59`, timezone: TZ }, "https://app.metricool.com/api/v2");
  const list: any[] = Array.isArray(r) ? r : (r?.data ?? []);
  if (!schedLogged) { console.log("Scheduler first item:", JSON.stringify(list[0] ?? r).slice(0, 3000)); schedLogged = true; }
  const items = list.filter((p) => p?.id != null && !p.draft && (p.providers ?? []).some((x: any) => x.status !== "PUBLISHED")).map((p) => {
    const nets = (p.providers ?? []).map((x: any) => String(x.network ?? x).toLowerCase()).filter(Boolean);
    const media = (p.media ?? [])[0];
    const text: string = p.text ?? "";
    const dt = p.publicationDate?.dateTime ?? null;
    return {
      client_id: client.id, source: "metricool", metricool_post_id: String(p.id), metricool_post_uuid: p.uuid ?? null,
      title: cleanTitle(text) ?? "Ingeplande post", caption: text || null,
      planned_date: dt ? zonedToUtc(dt, p.publicationDate?.timezone || TZ) : null,
      networks: nets, external_link: typeof media === "string" ? media : (media?.url ?? null),
    };
  });
  if (items.length) {
    const { error } = await db.from("review_items").upsert(items, { onConflict: "client_id,metricool_post_id", ignoreDuplicates: true });
    if (error) throw error;
  }
  return items.length;
}

/** Brand label per blogId from Metricool, as a guard against wrong client↔brand links. */
async function brandMap(): Promise<Map<string, any>> {
  const res = await fetch(`https://app.metricool.com/api/admin/simpleProfiles?userId=${MC_USER}`, { headers: { "X-Mc-Auth": TOKEN } });
  if (!res.ok) throw new Error(`Metricool simpleProfiles ${res.status}`);
  const list: any[] = await res.json();
  return new Map(list.map((b) => [String(b.id), b]));
}
async function brandLabels(): Promise<Map<string, string>> {
  const m = await brandMap();
  return new Map([...m].map(([k, b]) => [k, String(b.label ?? b.title ?? k)]));
}

/** Latest followers per network straight from Metricool (for verification). */
async function latestFollowers(blogId: string) {
  const t = amsDate(), f = addDays(t, -10);
  const specs: [string, Record<string, string>][] = [
    ["ig", { network: "instagram", subject: "account", metric: "followers" }],
    ["tt", { network: "tiktok", subject: "account", metric: "followers_count" }],
    ["yt", { network: "youtube", subject: "account", metric: "totalSubscribers" }],
  ];
  const out: Record<string, { date: string; value: number } | string> = {};
  for (const [net, p] of specs) {
    try {
      const r = await mc("timelines", blogId, { ...range(f, t), timezone: TZ, ...p });
      const v = ((r?.data?.[0]?.values ?? []) as any[]).filter((x) => x.value != null).sort((a, b) => b.dateTime.localeCompare(a.dateTime))[0];
      out[net] = v ? { date: v.dateTime.slice(0, 10), value: v.value } : "geen data";
    } catch (e) { out[net] = String(e).slice(0, 120); }
  }
  return out;
}

async function run(db: any, mode: Mode, clientId?: string) {
  const today = amsDate();
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" }).format(new Date());
  const statsFrom = mode === "backfill" ? HISTORY_START : addDays(today, -13);
  const videosFrom = mode === "backfill" || (mode === "scheduled" && weekday === "Mon") ? HISTORY_START : addDays(today, -89);

  let q = db.from("clients").select("id,name,metricool_blog_id,logo_url").not("metricool_blog_id", "is", null);
  if (clientId) q = q.eq("id", clientId);
  const { data: clients, error } = await q;
  if (error) throw error;

  const report: unknown[] = [];
  let brands = new Map<string, any>();
  try { brands = await brandMap(); } catch (e) { console.error(String(e)); }
  for (const c of clients ?? []) {
    const brand = brands.get(String(c.metricool_blog_id));
    const nets = netsOf(brand);
    const label = brand?.label ?? null;
    if (brand?.picture && !c.logo_url) {
      try {
        const res = await fetch(brand.picture);
        if (res.ok) {
          const path = `${c.id}/metricool-brand.jpg`;
          const { error: upErr } = await db.storage.from("client-logos").upload(path, await res.arrayBuffer(), { contentType: res.headers.get("content-type") ?? "image/jpeg", upsert: true });
          if (!upErr) await db.from("clients").update({ logo_url: path }).eq("id", c.id);
        }
      } catch { /* logo is optional */ }
    }
    if (label) await db.from("clients").update({ metricool_brand_label: label }).eq("id", c.id);
    const { data: runRow } = await db.from("sync_runs").insert({ client_id: c.id, mode }).select("id").single();
    let videos = 0, stats = 0;
    try {
      videos = await syncVideos(db, c, videosFrom, today, nets);
      stats = await syncStats(db, c, statsFrom, today, nets);
      let scheduled: number | string = 0;
      try { scheduled = await syncScheduled(db, c, today, addDays(today, 60)); }
      catch (e) { scheduled = String(e).slice(0, 300); console.error(`scheduler failed for ${c.name}:`, String(e)); }
      report.push({ client: c.name, nets, videos, stats, scheduled });
      if (runRow) await db.from("sync_runs").update({ status: "ok", finished_at: new Date().toISOString(), days_count: stats, videos_count: videos }).eq("id", runRow.id);
    } catch (e) {
      console.error(`sync failed for ${c.name}:`, String(e));
      const msg = e instanceof Error ? String(e) : JSON.stringify(e); e = msg;
      report.push({ client: c.name, error: msg });
      if (runRow) await db.from("sync_runs").update({ status: "fout", finished_at: new Date().toISOString(), days_count: stats, videos_count: videos, error: String(e).slice(0, 1000) }).eq("id", runRow.id);
    }
  }
  console.log("sync done", mode, JSON.stringify(report));
  return report;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  let body: { mode?: Mode; clientId?: string } = {};
  try { body = await req.json(); } catch { /* empty */ }

  const isCron = authenticateCronRequest(req) === null;
  if (isCron) {
    // Cron fires at two UTC times; only run when it's 07:xx in Amsterdam (handles DST).
    const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" }).format(new Date()));
    if (hour !== 7) return json({ skipped: true, hour });
    EdgeRuntime.waitUntil(run(db, "scheduled"));
    return json({ started: true });
  }

  // Otherwise: must be a signed-in admin
  const auth = req.headers.get("Authorization") ?? "";
  const { data: u } = await db.auth.getUser(auth.replace(/^Bearer /, ""));
  if (!u?.user) return json({ error: "Unauthorized" }, 401);
  const { data: isAdmin } = await db.rpc("has_role", { _user_id: u.user.id, _role: "admin" });
  if (!isAdmin) return json({ error: "Forbidden" }, 403);

  if ((body as any).probe === "posts" && body.clientId) {
    const { data: c } = await db.from("clients").select("metricool_blog_id").eq("id", body.clientId).single();
    const t = amsDate(), f = addDays(t, -29), out: Record<string, unknown> = {};
    for (const [net, p] of Object.entries(VIDEO_PATHS)) {
      try { const r = await mc(p, c.metricool_blog_id, { from: `${f}T00:00:00`, to: `${t}T23:59:59`, timezone: TZ });
        const l = Array.isArray(r) ? r : (r?.data ?? []); out[net] = { n: l.length, first: l[0] ?? null }; }
      catch (e) { out[net] = String(e).slice(0, 300); }
    }
    return json(out);
  }
  if ((body as any).probe === "brands") {
    const res = await fetch(`https://app.metricool.com/api/admin/simpleProfiles?userId=${MC_USER}`, { headers: { "X-Mc-Auth": TOKEN } });
    const list: any[] = await res.json();
    return json(list.map((b) => ({ id: b.id, label: b.label, keys: Object.keys(b), pic: b.picture ?? b.profilePicture ?? b.logo ?? null,
      nets: Object.fromEntries(Object.keys(b).filter((k) => k.endsWith("Data")).map((k) => [k, b[k] ? JSON.stringify(b[k]).slice(0, 80) : null])) })));
  }
  if ((body as any).verify) {
    const labels = await brandLabels();
    const { data: cs } = await db.from("clients").select("id,name,metricool_blog_id").not("metricool_blog_id", "is", null);
    const out = [];
    for (const c of cs ?? []) {
      const label = labels.get(String(c.metricool_blog_id)) ?? null;
      if (label) await db.from("clients").update({ metricool_brand_label: label }).eq("id", c.id);
      out.push({ client: c.name, blogId: c.metricool_blog_id, label, metricool: await latestFollowers(c.metricool_blog_id) });
    }
    return json({ brands: Object.fromEntries(labels), clients: out });
  }
  const mode: Mode = body.mode === "backfill" ? "backfill" : "refresh";
  if (mode === "backfill") {
    EdgeRuntime.waitUntil(run(db, "backfill", body.clientId));
    return json({ started: true, mode });
  }
  try {
    return json({ mode, report: await run(db, "refresh", body.clientId) });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
