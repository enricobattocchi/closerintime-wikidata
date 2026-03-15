import { NextRequest, NextResponse } from "next/server";
import { searchWikidata } from "@/lib/wikidata";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const lang = request.nextUrl.searchParams.get("lang") ?? "en";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  // Sanitize: remove control characters
  const sanitized = q.replace(/[\x00-\x1f]/g, "");

  try {
    const events = await searchWikidata(sanitized, lang);
    return NextResponse.json(events);
  } catch {
    return NextResponse.json(
      { error: "Failed to search Wikidata" },
      { status: 502 }
    );
  }
}
