import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

type Part = { PartNumber: number; ETag: string };
type Signed = { part_size: number; urls: string[]; done?: Part[] };

export async function invokeVideo<T = any>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("r2-video", { body });
  if (error) {
    let msg = error.message;
    if (error instanceof FunctionsHttpError) { try { msg = (await error.context.json()).error ?? msg; } catch { /* keep */ } }
    throw new Error(typeof msg === "string" ? msg : "Er ging iets mis");
  }
  return data as T;
}

const RESUME_KEY = "hibe.videoUploads";
const fp = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
type Resume = Record<string, { version_id: string; item_id: string }>;
const readResume = (): Resume => { try { return JSON.parse(localStorage.getItem(RESUME_KEY) ?? "{}"); } catch { return {}; } };
const writeResume = (r: Resume) => localStorage.setItem(RESUME_KEY, JSON.stringify(r));

function putPart(url: string, blob: Blob, onProgress: (n: number) => void, signal: AbortSignal) {
  return new Promise<string>((resolve, reject) => {
    const x = new XMLHttpRequest();
    x.open("PUT", url);
    x.upload.onprogress = (e) => onProgress(e.loaded);
    x.onload = () => {
      const tag = x.getResponseHeader("ETag");
      if (x.status >= 200 && x.status < 300 && tag) resolve(tag);
      else reject(new Error(tag ? `Upload-fout ${x.status}` : "Opslag gaf geen ETag terug (controleer de CORS-instelling)"));
    };
    x.onerror = () => reject(new Error("Verbinding verbroken"));
    signal.addEventListener("abort", () => x.abort());
    x.send(blob);
  });
}

/**
 * Multipart upload straight from the browser to R2. Resumes automatically when the same file
 * is uploaded again for the same target after a dropped connection.
 */
export async function uploadVideo(opts: {
  file: File; itemId?: string; clientId?: string; title?: string; uploaderId?: string;
  onProgress: (fraction: number) => void; signal: AbortSignal;
}) {
  const { file, signal } = opts;
  const key = `${fp(file)}|${opts.itemId ?? opts.clientId}|${opts.title ?? ""}`;
  const resume = readResume();
  let target = resume[key];
  let signed: Signed;
  if (target) {
    let r: (Signed & { gone?: boolean }) | null = null;
    try { r = await invokeVideo<Signed & { gone?: boolean }>({ action: "sign_parts", version_id: target.version_id }); } catch { r = null; }
    if (!r || r.gone) { delete resume[key]; writeResume(resume); target = undefined as any; } else signed = r;
  }
  if (!target) {
    const r = await invokeVideo<Signed & { version_id: string; item_id: string }>({
      action: "create", item_id: opts.itemId, client_id: opts.clientId, title: opts.title, uploader_id: opts.uploaderId,
      file_name: file.name, size: file.size, mime: file.type || undefined,
    });
    target = { version_id: r.version_id, item_id: r.item_id };
    signed = r;
    writeResume({ ...readResume(), [key]: target });
  }
  const s = signed!;
  const done = new Map<number, string>((s.done ?? []).map((p) => [p.PartNumber, p.ETag]));
  const loaded = new Map<number, number>();
  for (const n of done.keys()) loaded.set(n, Math.min(s.part_size, file.size - (n - 1) * s.part_size));
  const report = () => opts.onProgress([...loaded.values()].reduce((a, b) => a + b, 0) / file.size);
  report();

  const queue = s.urls.map((u, i) => ({ n: i + 1, url: u })).filter((p) => !done.has(p.n));
  const worker = async () => {
    while (queue.length) {
      if (signal.aborted) throw new Error("Geannuleerd");
      const p = queue.shift()!;
      const blob = file.slice((p.n - 1) * s.part_size, p.n * s.part_size);
      let tries = 0;
      for (;;) {
        try {
          const tag = await putPart(p.url, blob, (b) => { loaded.set(p.n, b); report(); }, signal);
          done.set(p.n, tag); loaded.set(p.n, blob.size); report(); break;
        } catch (e) {
          if (signal.aborted || ++tries >= 4) throw e;
          await new Promise((r) => setTimeout(r, 1000 * 2 ** tries));
        }
      }
    }
  };
  await Promise.all(Array.from({ length: 4 }, worker));
  const parts = [...done].map(([PartNumber, ETag]) => ({ PartNumber, ETag }));
  await invokeVideo({ action: "complete", version_id: target.version_id, parts });
  const after = readResume(); delete after[key]; writeResume(after);
  return target;
}

/** Forget local resume info for a deleted video so a new upload starts clean. */
export function forgetResume(itemId: string) {
  const r = readResume();
  for (const k of Object.keys(r)) if (r[k].item_id === itemId) delete r[k];
  writeResume(r);
}
