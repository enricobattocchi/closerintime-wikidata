import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import type { Event } from "@/lib/types";
import { fetchWikidataEvents } from "@/lib/wikidata";
import { generateSentence } from "@/lib/sentence";
import { computeTimeline } from "@/lib/timeline-math";
import { parseSegments } from "@/lib/url-params";

export const revalidate = 3600;

let fontCache: ArrayBuffer | null = null;

async function getFont(): Promise<ArrayBuffer> {
  if (fontCache) return fontCache;
  const res = await fetch(
    "https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@600&display=swap"
  );
  const css = await res.text();
  const match = css.match(/src:\s*url\(([^)]+)\)/);
  if (!match) throw new Error("Could not find font URL");
  const fontRes = await fetch(match[1]);
  fontCache = await fontRes.arrayBuffer();
  return fontCache;
}

function segmentColor(order: number, total: number): string {
  const hue = 210 + (120 * order) / total;
  return `hsl(${hue}, 55%, 45%)`;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ids = searchParams.get("ids");

  let sentence = "";
  let allEvents: Event[] = [];
  if (ids) {
    const segments = parseSegments(ids.split(","));
    if (segments && segments.length > 0) {
      const uniqueQids = [...new Set(segments.map((s) => s.qid))];
      const fetched = await fetchWikidataEvents(uniqueQids);
      const byId = new Map(fetched.map((e) => [e.id, e]));
      for (const seg of segments) {
        const e = byId.get(seg.qid);
        if (!e) continue;
        if (seg.useDeath && e.deathYear !== null) {
          allEvents.push({ ...e, year: e.deathYear, month: e.deathMonth, day: e.deathDay, dateProperty: "P570", useDeath: true });
        } else {
          allEvents.push(e);
        }
      }
      if (allEvents.length > 0) {
        sentence = generateSentence(allEvents);
      }
    }
  }

  const font = await getFont();

  const timeline = allEvents.length > 0 ? computeTimeline(allEvents) : null;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          padding: "60px 80px",
          border: "4px solid #3366cc",
        }}
      >
        {sentence ? (
          <div
            style={{
              color: "#202122",
              fontSize: sentence.length > 100 ? 36 : 48,
              fontFamily: "Source Serif 4",
              textAlign: "center",
              lineHeight: 1.4,
              maxWidth: "1040px",
            }}
          >
            {sentence}
          </div>
        ) : null}
        {timeline && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              maxWidth: "1040px",
              marginTop: "50px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", width: "100%", marginBottom: "8px" }}>
              {timeline.segments.map((seg) => (
                <div
                  key={seg.order}
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    flexGrow: Math.max(seg.percentage, 1),
                    flexBasis: 0,
                    color: segmentColor(seg.order, seg.total),
                    fontSize: 18,
                    fontFamily: "Source Serif 4",
                    whiteSpace: "nowrap",
                  }}
                >
                  {seg.spanLabel}
                </div>
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", width: "100%", height: "24px" }}>
              {timeline.markers.map((marker, i) => {
                const seg = i < timeline.segments.length ? timeline.segments[i] : null;
                return (
                  <div key={marker.event.id} style={{ display: "flex", alignItems: "center", flexGrow: seg ? Math.max(seg.percentage, 1) : 0, flexBasis: seg ? 0 : "auto", flexShrink: 0 }}>
                    <div
                      style={{
                        width: "24px",
                        height: "24px",
                        borderRadius: "50%",
                        background: "#3366cc",
                        flexShrink: 0,
                      }}
                    />
                    {seg && (
                      <div
                        style={{
                          flexGrow: 1,
                          height: "8px",
                          background: segmentColor(seg.order, seg.total),
                          borderRadius: "4px",
                          minWidth: "8px",
                        }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", width: "100%", marginTop: "8px" }}>
              {timeline.markers.map((marker, i) => {
                const isNow = marker.event.id === "0";
                const seg = i < timeline.segments.length ? timeline.segments[i] : null;
                return (
                  <div key={marker.event.id} style={{ display: "flex", alignItems: "flex-start", flexGrow: seg ? Math.max(seg.percentage, 1) : 0, flexBasis: seg ? 0 : "auto", flexShrink: 0 }}>
                    <div
                      style={{
                        color: "#54595d",
                        fontSize: 16,
                        fontFamily: "Source Serif 4",
                        whiteSpace: "nowrap",
                        width: "24px",
                        textAlign: "center",
                        overflow: "visible",
                      }}
                    >
                      {isNow ? "Now" : capitalize(marker.event.name).length > 25
                        ? capitalize(marker.event.name).slice(0, 23) + "…"
                        : capitalize(marker.event.name)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div
          style={{
            color: "#3366cc",
            fontSize: 28,
            fontFamily: "Source Serif 4",
            position: "absolute",
            bottom: "40px",
          }}
        >
          wiki:closerintime
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: [
        {
          name: "Source Serif 4",
          data: font,
          weight: 600,
          style: "normal",
        },
      ],
    }
  );
}
