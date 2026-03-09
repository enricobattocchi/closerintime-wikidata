export function parseSegments(rawIds: string[]): string[] | null {
  if (rawIds.length < 1 || rawIds.length > 3) return null;

  const qids: string[] = [];
  for (const raw of rawIds) {
    const seg = decodeURIComponent(raw);
    if (/^Q\d+$/.test(seg)) {
      qids.push(seg);
    } else {
      return null;
    }
  }

  return qids;
}
