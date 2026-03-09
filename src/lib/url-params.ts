export interface ParsedSegment {
  qid: string;
  useDeath: boolean;
}

export function parseSegments(rawIds: string[]): ParsedSegment[] | null {
  if (rawIds.length < 1 || rawIds.length > 3) return null;

  const segments: ParsedSegment[] = [];
  for (const raw of rawIds) {
    const seg = decodeURIComponent(raw);
    const match = seg.match(/^(Q\d+)(~d)?$/);
    if (match) {
      segments.push({ qid: match[1], useDeath: match[2] === "~d" });
    } else {
      return null;
    }
  }

  return segments;
}
