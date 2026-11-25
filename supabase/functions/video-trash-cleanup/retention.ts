// One calendar month, clamped at month ends, preserving the time in UTC.
export function trashCutoff(now: Date): string {
  const cutoff = new Date(now);
  cutoff.setUTCDate(1);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - 1);
  const lastDay = new Date(Date.UTC(cutoff.getUTCFullYear(), cutoff.getUTCMonth() + 1, 0)).getUTCDate();
  cutoff.setUTCDate(Math.min(now.getUTCDate(), lastDay));
  return cutoff.toISOString();
}

export function trashExpired(archivedAt: string | null, cutoff: string): boolean {
  return archivedAt !== null && new Date(archivedAt).getTime() < new Date(cutoff).getTime();
}

export async function purgeFilesBeforeItem<T>(versions: T[], removeFile: (version: T) => Promise<void>, removeItem: () => Promise<void>) {
  for (const version of versions) await removeFile(version);
  // A storage failure must keep the database records so the next run can retry.
  await removeItem();
}