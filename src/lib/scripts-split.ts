export type SplitScript = { title: string; body: string };

const HEAD = /^\s*script\s*(\d+)\s*[:.\-–—)]?\s*(.*)$/i;

/** Split text from a shoot-day PDF into scripts on "Script 1: titel" headings. Without headings it stays one script. */
export function splitScripts(text: string, fallbackTitle = "Script"): SplitScript[] {
  const out: SplitScript[] = []; let cur: { title: string; lines: string[] } | null = null; const pre: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(HEAD);
    if (m) { if (cur) out.push(done(cur)); cur = { title: m[2].trim() || `Script ${m[1]}`, lines: [] }; }
    else (cur ? cur.lines : pre).push(line);
  }
  if (cur) out.push(done(cur));
  if (!out.length) { const body = pre.join("\n").trim(); return body ? [{ title: fallbackTitle, body }] : []; }
  return out;
}
const done = (c: { title: string; lines: string[] }) => ({ title: c.title, body: c.lines.join("\n").replace(/\n{3,}/g, "\n\n").trim() });

/** Read the plain text of a PDF in the browser, keeping line breaks. */
export async function pdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = worker;
  const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const pages: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const c = await (await pdf.getPage(i)).getTextContent();
    pages.push(c.items.map((it: any) => (it.str ?? "") + (it.hasEOL ? "\n" : "")).join(""));
  }
  return pages.join("\n").replace(/^HIBE · pagina \d+ van \d+\s*$/gm, "");
}
