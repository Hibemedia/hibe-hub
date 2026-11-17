import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import logoUrl from "@/assets/hibe-logo.png";

export type PlanPost = { date: string | null; networks: string[]; text: string; image: string | null; video?: string | null };
const NET: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", linkedin: "LinkedIn", youtube: "YouTube", threads: "Threads", twitter: "X", pinterest: "Pinterest", gmb: "Google", ig: "Instagram", tt: "TikTok", fb: "Facebook", yt: "YouTube", li: "LinkedIn", th: "Threads", tw: "X", pi: "Pinterest" };

/** Keep only characters the built-in PDF font can draw (drops emoji). */
export const pdfSafe = (s: string) => s.replace(/\s+/g, " ").replace(/[^\x20-\x7E\u00A0-\u00FF\u20AC\u2018-\u201E\u2013\u2014\u2026]/g, "").replace(/\s+/g, " ").trim();

async function still(p: PlanPost): Promise<Uint8Array | null> {
  try {
    const c = document.createElement("canvas"); c.width = 180; c.height = 320;
    const ctx = c.getContext("2d")!;
    const draw = (el: CanvasImageSource, w: number, h: number) => { const s = Math.max(180 / w, 320 / h); ctx.drawImage(el, (180 - w * s) / 2, (320 - h * s) / 2, w * s, h * s); };
    if (p.video) {
      const v = document.createElement("video"); v.crossOrigin = "anonymous"; v.muted = true; v.preload = "auto"; v.src = `${p.video}${p.video.includes("?") ? "&" : "?"}pdf=1`;
      await new Promise<void>((ok, bad) => { v.onseeked = () => ok(); v.onloadeddata = () => { v.currentTime = 0.6; }; v.onerror = () => bad(); setTimeout(() => (v.readyState >= 2 ? ok() : bad()), 20000); });
      draw(v, v.videoWidth, v.videoHeight);
    } else if (p.image) {
      const i = new Image(); i.crossOrigin = "anonymous"; i.src = p.image; await i.decode(); draw(i, i.naturalWidth, i.naturalHeight);
    } else return null;
    const b = await new Promise<Blob | null>((r) => c.toBlob(r, "image/jpeg", 0.85));
    return b ? new Uint8Array(await b.arrayBuffer()) : null;
  } catch { return null; }
}

function wrap(text: string, font: any, size: number, width: number, maxLines: number) {
  const lines: string[] = []; let cur = "";
  for (const w of text.split(" ")) {
    const t = cur ? `${cur} ${w}` : w;
    if (font.widthOfTextAtSize(t, size) > width && cur) { lines.push(cur); cur = w; } else cur = t;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  if (lines.length === maxLines && lines.join(" ").length < text.length) lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, "") + "…";
  return lines;
}

/** Branded A4 overview of scheduled posts. */
export type Results = { from: string; to: string; views: number; reach: number; interactions: number; posts: number; followers: number | null; prevViews: number;
  daily?: { date: string; views: number }[]; channels?: { network: string; views: number }[]; weekdays?: number[];
  top: { title: string | null; network: string; views: number | null; likes: number | null; published_at: string | null }[] };
export type PlanMoment = { title: string; date: string | null; start_time: string | null; location: string | null; type: string; status: string };
export async function buildPlanningPdf(clientName: string, posts: PlanPost[], results?: Results, moments: PlanMoment[] = []) {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const li = new Image(); li.src = logoUrl; await li.decode();
  const lc = document.createElement("canvas"); lc.width = li.naturalWidth; lc.height = li.naturalHeight;
  const lx = lc.getContext("2d")!; lx.drawImage(li, 0, 0); lx.globalCompositeOperation = "source-in"; lx.fillStyle = "#111111"; lx.fillRect(0, 0, lc.width, lc.height);
  const logo = await doc.embedPng(await (await new Promise<Blob>((r) => lc.toBlob((b) => r(b!), "image/png"))).arrayBuffer());
  const ink = rgb(0.07, 0.07, 0.07), grey = rgb(0.4, 0.4, 0.4), lime = rgb(0.784, 0.945, 0.208), card = rgb(0.957, 0.957, 0.949), line = rgb(0.906, 0.906, 0.89);
  const W = 595, H = 842, M = 40;
  const stills = await Promise.all(posts.map(still));
  let page = doc.addPage([W, H]); let y = 0; let n = 1;
  const header = () => {
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: rgb(1, 1, 1) });
    const lh = 22, lw = (logo.width / logo.height) * lh;
    page.drawImage(logo, { x: M, y: H - M - lh, width: lw, height: lh });
    page.drawText(`Pagina ${n}`, { x: W - M - reg.widthOfTextAtSize(`Pagina ${n}`, 9), y: H - M - 14, size: 9, font: reg, color: grey });
    y = H - M - 40;
  };
  header();
  page.drawRectangle({ x: M, y: y - 92, width: W - 2 * M, height: 92, color: card });
  page.drawRectangle({ x: M + 18, y: y - 34, width: bold.widthOfTextAtSize("OVERZICHT", 8) + 16, height: 18, color: lime });
  page.drawText("OVERZICHT", { x: M + 26, y: y - 28, size: 8, font: bold, color: ink });
  page.drawText(pdfSafe(clientName), { x: M + 18, y: y - 62, size: 22, font: bold, color: ink });
  const today = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  page.drawText(`Overzicht · ${posts.length} ingeplande posts · opgesteld ${today}`, { x: M + 18, y: y - 80, size: 9, font: reg, color: grey });
  y -= 116;
  const fmt = (v: number | null) => v == null ? "–" : v >= 1e6 ? `${(v / 1e6).toFixed(1).replace(".", ",")}M` : v >= 1e4 ? `${Math.round(v / 1e3)}K` : v.toLocaleString("nl-NL");
  const ensure = (h: number) => { if (y - h < M + 30) { page = doc.addPage([W, H]); n++; header(); } };
  const section = (t: string) => { ensure(60); page.drawText(t, { x: M, y: y - 14, size: 14, font: bold, color: ink }); y -= 28; };
  if (results) {
    const d = (x: string) => new Date(`${x}T12:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "long" });
    section("Resultaten");
    page.drawText(`Laatste 30 dagen · ${d(results.from)} t/m ${d(results.to)}`, { x: M, y: y - 2, size: 9, font: reg, color: grey }); y -= 16;
    const tiles: [string, string][] = [["Weergaven", fmt(results.views)], ["Bereik", fmt(results.reach)], ["Interacties", fmt(results.interactions)], ["Volgers", fmt(results.followers)], ["Posts", fmt(results.posts)]];
    const tw = (W - 2 * M - 4 * 8) / 5;
    tiles.forEach(([l, v], i) => { const x = M + i * (tw + 8);
      page.drawRectangle({ x, y: y - 72, width: tw, height: 72, color: card });
      page.drawText(l, { x: x + 10, y: y - 18, size: 8, font: reg, color: grey });
      page.drawText(v, { x: x + 10, y: y - 42, size: 17, font: bold, color: ink }); });
    if (results.prevViews > 0) { const ch = Math.round(((results.views - results.prevViews) / results.prevViews) * 100);
      const t = `${ch >= 0 ? "+" : ""}${ch}% t.o.v. vorige 30 dagen`; const w = reg.widthOfTextAtSize(t, 7) + 10;
      page.drawRectangle({ x: M + 10, y: y - 64, width: w, height: 12, color: ch >= 0 ? lime : line }); page.drawText(t, { x: M + 15, y: y - 60.5, size: 7, font: reg, color: ink }); }
    y -= 94;
    const daily = results.daily ?? [];
    if (daily.length > 1) {
      ensure(150);
      page.drawText("Weergaven per dag", { x: M, y: y - 10, size: 11, font: bold, color: ink }); y -= 20;
      const ch = 110, cw = W - 2 * M; page.drawRectangle({ x: M, y: y - ch, width: cw, height: ch, color: card });
      const max = Math.max(1, ...daily.map((d) => d.views)); const bw = (cw - 24) / daily.length;
      daily.forEach((d, i) => { const bh = (d.views / max) * (ch - 34);
        page.drawRectangle({ x: M + 12 + i * bw + bw * 0.15, y: y - ch + 18, width: bw * 0.7, height: Math.max(1, bh), color: d.views === max ? lime : rgb(0.75, 0.75, 0.73) }); });
      const dd = (x: string) => new Date(`${x}T12:00:00`).toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
      page.drawText(dd(daily[0].date), { x: M + 12, y: y - ch + 6, size: 7, font: reg, color: grey });
      const le = dd(daily[daily.length - 1].date); page.drawText(le, { x: M + cw - 12 - reg.widthOfTextAtSize(le, 7), y: y - ch + 6, size: 7, font: reg, color: grey });
      const pk = `Piek: ${fmt(max)}`; page.drawText(pk, { x: M + cw - 12 - bold.widthOfTextAtSize(pk, 8), y: y - 14, size: 8, font: bold, color: ink });
      y -= ch + 18;
    }
    const chans = (results.channels ?? []).filter((c, _i, a) => c.views > 0 && c.views / a.reduce((s, x) => s + x.views, 0) >= 0.005);
    const wd = results.weekdays ?? [];
    if (chans.length || wd.some((v) => v > 0)) {
      ensure(30 + Math.max(chans.length, 2) * 20 + 20);
      const half = (W - 2 * M - 12) / 2, top = y;
      page.drawText("Kanaalverdeling", { x: M, y: y - 10, size: 11, font: bold, color: ink });
      const tot = chans.reduce((a, c) => a + c.views, 0) || 1; let cy = y - 26;
      chans.forEach((c) => { const pct = Math.round((c.views / tot) * 100);
        page.drawText(NET[c.network] ?? c.network, { x: M, y: cy - 9, size: 8.5, font: reg, color: ink });
        page.drawRectangle({ x: M + 70, y: cy - 11, width: half - 110, height: 10, color: card });
        page.drawRectangle({ x: M + 70, y: cy - 11, width: Math.max(2, (half - 110) * (c.views / tot)), height: 10, color: lime });
        page.drawText(`${pct}%`, { x: M + half - 32, y: cy - 9, size: 8.5, font: bold, color: ink }); cy -= 20; });
      const days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
      if (wd.some((v) => v > 0)) {
        const bx = M + half + 12; page.drawText("Beste dag", { x: bx, y: top - 10, size: 11, font: bold, color: ink });
        page.drawRectangle({ x: bx, y: top - 76, width: half, height: 58, color: card });
        const best = wd.indexOf(Math.max(...wd));
        page.drawText(days[best].charAt(0).toUpperCase() + days[best].slice(1), { x: bx + 12, y: top - 44, size: 16, font: bold, color: ink });
        page.drawText(`Gemiddeld ${fmt(Math.round(wd[best]))} weergaven op ${days[best]}`, { x: bx + 12, y: top - 62, size: 8, font: reg, color: grey });
        cy = Math.min(cy, top - 76);
      }
      y = cy - 16;
    }
    if (results.top.length) { ensure(30 + results.top.length * 24);
      page.drawText("Best bekeken video's", { x: M, y: y - 10, size: 11, font: bold, color: ink }); y -= 20;
      results.top.forEach((v, i) => {
        page.drawRectangle({ x: M, y: y - 24, width: W - 2 * M, height: 24, color: i % 2 ? rgb(1, 1, 1) : card });
        page.drawText(String(i + 1), { x: M + 10, y: y - 16, size: 9, font: bold, color: ink });
        const t = wrap(pdfSafe(v.title ?? "") || "Zonder titel", reg, 9, 300, 1)[0];
        page.drawText(t, { x: M + 28, y: y - 16, size: 9, font: reg, color: ink });
        page.drawText(NET[v.network] ?? v.network, { x: M + 345, y: y - 16, size: 8, font: reg, color: grey });
        const vv = `${fmt(v.views)} weergaven`; page.drawText(vv, { x: W - M - 10 - bold.widthOfTextAtSize(vv, 9), y: y - 16, size: 9, font: bold, color: ink });
        y -= 24; });
      y -= 18;
    }
  }
  if (moments.length) {
    section("Aankomende contentmomenten");
    for (const m of moments) {
      ensure(48);
      page.drawRectangle({ x: M, y: y - 40, width: W - 2 * M, height: 40, color: card });
      const dl = m.date ? new Date(`${m.date}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "short", day: "numeric", month: "short" }) : "Datum volgt";
      page.drawText(dl, { x: M + 12, y: y - 16, size: 9, font: bold, color: ink });
      page.drawText(m.start_time ? m.start_time.slice(0, 5) : "", { x: M + 12, y: y - 30, size: 8, font: reg, color: grey });
      page.drawText(wrap(pdfSafe(m.title) || "Contentmoment", bold, 10, 300, 1)[0], { x: M + 110, y: y - 16, size: 10, font: bold, color: ink });
      if (m.location) page.drawText(wrap(pdfSafe(m.location), reg, 8, 300, 1)[0], { x: M + 110, y: y - 30, size: 8, font: reg, color: grey });
      const st = m.status === "optie" || m.status === "in_optie" ? "In optie" : "Bevestigd", sw = reg.widthOfTextAtSize(st, 8) + 14;
      page.drawRectangle({ x: W - M - 12 - sw, y: y - 26, width: sw, height: 14, color: st === "Bevestigd" ? lime : rgb(1, 1, 1) });
      page.drawText(st, { x: W - M - 5 - sw, y: y - 22, size: 8, font: reg, color: ink });
      y -= 48;
    }
    y -= 10;
  }
  section("Gepland");
  {
    const set = new Set(posts.map((p) => p.date?.slice(0, 10)));
    const free: string[] = []; for (let i = 1; i <= 14; i++) { const d = new Date(Date.now() + i * 86400000); const k = d.toISOString().slice(0, 10); if (!set.has(k)) free.push(d.toLocaleDateString("nl-NL", { weekday: "short", day: "numeric" })); }
    const t = free.length ? `Komende 14 dagen nog ${free.length} dagen zonder post: ${free.join(", ")}` : "Komende 14 dagen staat er elke dag iets ingepland";
    wrap(t, reg, 8.5, W - 2 * M, 2).forEach((l) => { page.drawText(l, { x: M, y: y - 4, size: 8.5, font: reg, color: grey }); y -= 12; }); y -= 10;
  }
  let lastDay = "";
  for (let i = 0; i < posts.length; i++) {
    const p = posts[i]; const day = p.date?.slice(0, 10) ?? "";
    const needDay = day !== lastDay; const h = 96;
    if (y - h - (needDay ? 24 : 0) < M + 20) { page = doc.addPage([W, H]); n++; header(); lastDay = ""; }
    if (day !== lastDay) {
      const label = day ? new Date(`${day}T12:00:00`).toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" }) : "Datum onbekend";
      page.drawText(label.charAt(0).toUpperCase() + label.slice(1), { x: M, y: y - 12, size: 11, font: bold, color: ink }); y -= 22; lastDay = day;
    }
    page.drawRectangle({ x: M, y: y - h, width: W - 2 * M, height: h, color: rgb(1, 1, 1), borderColor: line, borderWidth: 0.8 });
    const tx = M + 12, ty = y - 12;
    if (stills[i]) { const img = await doc.embedJpg(stills[i]!); page.drawImage(img, { x: tx, y: y - h + 10, width: 43, height: 76 }); }
    else page.drawRectangle({ x: tx, y: y - h + 10, width: 43, height: 76, color: card });
    const cx = tx + 58; let px = cx + bold.widthOfTextAtSize(p.date?.slice(11, 16) ?? "–", 10) + 10;
    page.drawText(p.date?.slice(11, 16) ?? "–", { x: cx, y: ty - 10, size: 10, font: bold, color: ink });
    for (const net of p.networks) {
      const t = NET[net] ?? net, w = reg.widthOfTextAtSize(t, 8) + 12;
      page.drawRectangle({ x: px, y: ty - 13, width: w, height: 15, color: card });
      page.drawText(t, { x: px + 6, y: ty - 9, size: 8, font: reg, color: ink }); px += w + 4;
    }
    wrap(pdfSafe(p.text) || "Zonder tekst", reg, 9.5, W - 2 * M - 82, 4).forEach((l, k) => page.drawText(l, { x: cx, y: ty - 30 - k * 13, size: 9.5, font: reg, color: rgb(0.2, 0.2, 0.2) }));
    y -= h + 8;
  }
  doc.getPages().forEach((pg) => pg.drawText("HIBE · hibespace.com", { x: M, y: 22, size: 8, font: reg, color: grey }));
  return new Blob([(await doc.save()) as BlobPart], { type: "application/pdf" });
}
