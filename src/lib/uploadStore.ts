import { useSyncExternalStore } from "react";
import { uploadVideo } from "@/lib/r2Upload";

export type UploadJob = { id: string; name: string; clientId?: string; itemId?: string; progress: number; state: "uploading" | "done" | "error"; error?: string; abort: AbortController };
let jobs: UploadJob[] = [];
const subs = new Set<() => void>();
const emit = () => { jobs = [...jobs]; subs.forEach((f) => f()); };
const patch = (id: string, p: Partial<UploadJob>) => { jobs = jobs.map((j) => (j.id === id ? { ...j, ...p } : j)); emit(); };

/** Uploads keep running while you navigate between pages. */
export function startUpload(a: { file: File; clientId?: string; title?: string; itemId?: string; uploaderId?: string; onDone?: (t: { item_id: string; version_id: string }) => void }) {
  const id = crypto.randomUUID();
  const abort = new AbortController();
  jobs.push({ id, name: a.title ?? a.file.name, clientId: a.clientId, itemId: a.itemId, progress: 0, state: "uploading", abort });
  emit();
  uploadVideo({ file: a.file, clientId: a.clientId, title: a.title, itemId: a.itemId, uploaderId: a.uploaderId, signal: abort.signal, onProgress: (f) => patch(id, { progress: f }) })
    .then((t) => { patch(id, { state: "done", progress: 1 }); a.onDone?.(t); })
    .catch((e) => patch(id, { state: "error", error: e.message }));
  return id;
}
export const dismissUpload = (id: string) => { jobs = jobs.filter((j) => j.id !== id); emit(); };
export const useUploads = () => useSyncExternalStore((f) => { subs.add(f); return () => subs.delete(f); }, () => jobs);
