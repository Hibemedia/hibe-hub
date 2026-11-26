import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import logoUrl from "@/assets/hibe-logo.png";
import { pdfSafe } from "@/lib/planning-pdf";

export type DayScript = { title: string; body: string; link?: string | null };

/** One branded PDF with every script of one shoot day, numbered Script 1..n. */
export async function scriptsDayPdf(opts: { client: string; day: string; date: string | null; scripts: DayScript[] }): Promise<Blob> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let logo: any = null;
  try { logo = await doc.embedPng(await (await fetch(logoUrl)).arrayBuffer()); } catch { /* no logo */ }
  const W = 595, H = 842, M = 50, TW = W - 2 * M;
  const lime = rgb(0.784, 0.945, 0.208), grey = rgb(0.42, 0.42, 0.42), black = rgb(0.07, 0.07, 0.07);
  let page = doc.addPage([W, H]); let y = H - M;
  const newPage = () => { page = doc.addPage([W, H]); y = H - M; };
  const need = (h: number) => { if (y - h < M) newPage(); };
  const lines = (text: string, f: any, size: number) => {
    const out: string[] = [];
    for (const para of text.split(/\r?\n/)) {
      const words = pdfSafe(para).split(" ").filter(Boolean);
      if (!words.length) { out.push(""); continue; }
      let cur = "";
      for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (f.widthOfTextAtSize(t, size) > TW && cur) { out.push(cur); cur = w; } else cur = t; }
      out.push(cur);
    }
    return out;
  };
  if (logo) { const s = 28 / logo.height; page.drawImage(logo, { x: M, y: y - 28, width: logo.width * s, height: 28 }); }
  y -= 52;
  const dateTxt = opts.date ? new Date(opts.date + "T12:00").toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" }) : "Geen datum";
  page.drawText(pdfSafe(`Scripts draaidag: ${opts.day}`).slice(0, 70), { x: M, y, size: 20, font: bold, color: black }); y -= 22;
  page.drawText(pdfSafe(`${opts.client} · ${dateTxt} · ${opts.scripts.length} scripts`), { x: M, y, size: 11, font, color: grey }); y -= 28;
  opts.scripts.forEach((s, i) => {
    need(70);
    page.drawRectangle({ x: M, y: y - 6, width: TW, height: 26, color: lime });
    page.drawText(pdfSafe(`Script ${i + 1}: ${s.title}`).slice(0, 80), { x: M + 10, y: y + 2, size: 13, font: bold, color: black }); y -= 30;
    const body = lines(s.body || "Geen tekst.", font, 11);
    if (s.link) body.push("", ...lines(`Link: ${s.link}`, font, 11));
    for (const l of body) { need(15); if (l) page.drawText(l, { x: M, y, size: 11, font, color: black }); y -= 15; }
    y -= 18;
  });
  const pages = doc.getPages();
  pages.forEach((p, i) => p.drawText(`HIBE · pagina ${i + 1} van ${pages.length}`, { x: M, y: 24, size: 8, font, color: grey }));
  return new Blob([await doc.save()], { type: "application/pdf" });
}
