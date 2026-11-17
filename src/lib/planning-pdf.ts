import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import logoUrl from "@/assets/hibe-logo.png";

export type PlanPost = { date: string | null; networks: string[]; text: string; image: string | null; video?: string | null };
const NET: Record<string, string> = { instagram: "Instagram", tiktok: "TikTok", facebook: "Facebook", linkedin: "LinkedIn", youtube: "YouTube", threads: "Threads", twitter: "X", pinterest: "Pinterest", gmb: "Google" };

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
export async function buildPlanningPdf(clientName: string, posts: PlanPost[]) {
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
  page.drawRectangle({ x: M + 18, y: y - 34, width: bold.widthOfTextAtSize("CONTENTPLANNING", 8) + 16, height: 18, color: lime });
  page.drawText("CONTENTPLANNING", { x: M + 26, y: y - 28, size: 8, font: bold, color: ink });
  page.drawText(pdfSafe(clientName), { x: M + 18, y: y - 62, size: 22, font: bold, color: ink });
  const today = new Date().toLocaleDateString("nl-NL", { day: "numeric", month: "long", year: "numeric" });
  page.drawText(`${posts.length} ingeplande posts · opgesteld ${today}`, { x: M + 18, y: y - 80, size: 9, font: reg, color: grey });
  y -= 116;
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
  return new Blob([await doc.save()], { type: "application/pdf" });
}
