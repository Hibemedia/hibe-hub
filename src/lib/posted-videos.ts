export type PostedRow = { id: string; network: string; title: string | null; views: number | null; published_at: string | null; url: string | null; thumbnail_url: string | null };
export type PostedVideo = { id: string; title: string | null; views: number; published_at: string | null; thumbnail_url: string | null; posts: { network: string; url: string | null; views: number }[] };

const key = (t: string | null) => (t ?? "").toLocaleLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim().slice(0, 60);
const WINDOW = 7 * 86400000;

/** Same video posted on several channels (same caption, posted within 7 days) counts once, views summed. */
export function groupPosted(rows: PostedRow[]): PostedVideo[] {
  const out: (PostedVideo & { k: string; t: number })[] = [];
  const sorted = [...rows].sort((a, b) => (a.published_at ?? "").localeCompare(b.published_at ?? ""));
  for (const r of sorted) {
    const k = key(r.title), t = r.published_at ? Date.parse(r.published_at) : NaN, v = r.views ?? 0;
    const g = k ? out.find((o) => o.k === k && !o.posts.some((p) => p.network === r.network) && (isNaN(t) || isNaN(o.t) || Math.abs(o.t - t) <= WINDOW)) : undefined;
    if (g) { g.views += v; g.posts.push({ network: r.network, url: r.url, views: v }); g.thumbnail_url ??= r.thumbnail_url; }
    else out.push({ id: r.id, k, t, title: r.title, views: v, published_at: r.published_at, thumbnail_url: r.thumbnail_url, posts: [{ network: r.network, url: r.url, views: v }] });
  }
  return out.map(({ k: _k, t: _t, ...g }) => g).sort((a, b) => b.views - a.views);
}
