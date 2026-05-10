import { ImageResponse } from "next/og";
import { type NextRequest } from "next/server";
import type { Event } from "@/lib/types";
import { fetchWikidataEvents } from "@/lib/wikidata";
import { computeTimeline } from "@/lib/timeline-math";
import { parseSegments } from "@/lib/url-params";
import { eventDisplayName } from "@/lib/event-label";
import enMessages from "@/i18n/messages/en.json";

export const revalidate = 86400;

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

async function loadMessages(lang: string): Promise<Record<string, Record<string, string>>> {
  if (lang === "en") return enMessages as Record<string, Record<string, string>>;
  try {
    return (await import(`@/i18n/messages/${lang}.json`)).default;
  } catch {
    return enMessages as Record<string, Record<string, string>>;
  }
}

/** Resolve `{name}`-style placeholders. */
function interpolate(template: string, values?: Record<string, string | number>): string {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (_, k) => (k in values ? String(values[k]) : `{${k}}`));
}

/** Resolve a single ICU plural message like `{count, plural, one {# year} other {# years}}`. */
function resolvePlural(template: string, locale: string, values?: Record<string, string | number>): string {
  const pluralMatch = template.match(/^\{(\w+),\s*plural,\s*([\s\S]+)\}$/);
  if (!pluralMatch) return interpolate(template, values);

  const [, varName, body] = pluralMatch;
  const count = Number(values?.[varName] ?? 0);

  // Parse branches like: one {# year} other {# years} =0 {no years}
  const branches = new Map<string, string>();
  const branchRegex = /(=?\w+)\s*\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = branchRegex.exec(body))) {
    branches.set(m[1], m[2]);
  }

  let chosen = branches.get(`=${count}`);
  if (chosen === undefined) {
    const cat = new Intl.PluralRules(locale).select(count);
    chosen = branches.get(cat) ?? branches.get("other") ?? template;
  }

  return interpolate(chosen.replace(/#/g, String(count)), values);
}

function makeTranslator(messages: Record<string, Record<string, string>>, namespace: string, locale: string) {
  return (key: string, values?: Record<string, string | number>): string => {
    const template = messages[namespace]?.[key];
    if (!template) return key;
    return resolvePlural(template, locale, values);
  };
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const ids = searchParams.get("ids");
  const customTitle = searchParams.get("t")?.slice(0, 100) || "";
  const hideNow = searchParams.get("now") === "0";
  const lang = searchParams.get("lang") ?? "en";

  const messages = await loadMessages(lang);

  let heading = "";
  let allEvents: Event[] = [];
  if (ids) {
    const segments = parseSegments(ids.split(","));
    if (segments && segments.length > 0) {
      try {
        const uniqueQids = [...new Set(segments.map((s) => s.qid))];
        const fetched = await fetchWikidataEvents(uniqueQids.join(","), lang);
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
          heading = customTitle || messages.meta?.defaultTitle || "Build your own timeline";
        }
      } catch {
        // Wikidata API unavailable — fall back to default image
      }
    }
  }

  const font = await getFont();

  const nowLabel = messages.common?.now || "Now";
  const spanT = makeTranslator(messages, "date", lang);
  const eventLabelT = makeTranslator(messages, "eventLabel", lang);
  let timeline = allEvents.length > 0 ? computeTimeline(allEvents, 2, lang, nowLabel, spanT, hideNow) : null;

  const fallbackDescription = messages.meta?.siteDescription || "Visualize the time between historical events.";

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
        {heading ? (
          <div
            style={{
              color: "#202122",
              fontSize: heading.length > 100 ? 36 : 48,
              fontFamily: "Source Serif 4",
              textAlign: "center",
              lineHeight: 1.4,
              maxWidth: "1040px",
            }}
          >
            {heading}
          </div>
        ) : (
          <div
            style={{
              color: "#54595d",
              fontSize: 36,
              fontFamily: "Source Serif 4",
              textAlign: "center",
              lineHeight: 1.4,
            }}
          >
            {fallbackDescription}
          </div>
        )}
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
                      {isNow ? nowLabel : eventDisplayName(marker.event, eventLabelT).length > 25
                        ? eventDisplayName(marker.event, eventLabelT).slice(0, 23) + "\u2026"
                        : eventDisplayName(marker.event, eventLabelT)}
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
