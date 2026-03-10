import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Event } from "@/lib/types";
import { fetchWikidataEvents } from "@/lib/wikidata";
import { computeTimeline } from "@/lib/timeline-math";
import { buildShareablePath } from "@/lib/custom-event-url";
import { parseSegments } from "@/lib/url-params";
import { eventDisplayName } from "@/lib/event-label";
import Chooser from "@/components/Chooser/Chooser";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ ids: string[] }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

/** Expand fetched events according to parsed segments (handles same Q-ID for birth + death) */
function expandEvents(fetched: Event[], segments: { qid: string; useDeath: boolean }[]): Event[] {
  const byId = new Map(fetched.map((e) => [e.id, e]));
  const result: Event[] = [];
  for (const seg of segments) {
    const e = byId.get(seg.qid);
    if (!e) continue;
    if (seg.useDeath && e.deathYear !== null) {
      result.push({
        ...e,
        year: e.deathYear,
        month: e.deathMonth,
        day: e.deathDay,
        dateProperty: "P570",
        useDeath: true,
      });
    } else {
      result.push(e);
    }
  }
  return result;
}

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { ids: rawIds } = await params;
  const { t } = await searchParams;
  const customTitle = typeof t === "string" ? t.slice(0, 100) : "";
  const segments = parseSegments(rawIds);
  if (!segments) return { title: "wiki:closerintime" };

  const uniqueQids = [...new Set(segments.map((s) => s.qid))];

  let events;
  try {
    events = expandEvents(await fetchWikidataEvents(uniqueQids), segments);
  } catch {
    return { title: "wiki:closerintime" };
  }
  if (events.length === 0) return { title: "wiki:closerintime" };

  const names = events.map((e) => eventDisplayName(e));
  const title = customTitle
    ? `${customTitle} | wiki:closerintime`
    : `${names.join(", ")} | wiki:closerintime`;
  const description = "Visualize the time between historical events.";
  const ogParams = [`ids=${rawIds.join(",")}`];
  if (customTitle) ogParams.push(`t=${encodeURIComponent(customTitle)}`);
  const ogImage = `/api/og?${ogParams.join("&")}`;

  return {
    title,
    description,
    openGraph: { title, description, images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description, images: [ogImage] },
  };
}

export default async function EventPage({ params, searchParams }: PageProps) {
  const { ids: rawIds } = await params;
  const { t, now } = await searchParams;
  const customTitle = typeof t === "string" ? t.slice(0, 100) : "";
  const hideNow = now === "0";
  const segments = parseSegments(rawIds);

  if (!segments) {
    redirect("/");
  }

  // Redirect to sorted order for canonical URLs
  const sortedSegments = [...segments].sort((a, b) => {
    const sa = `${a.qid}${a.useDeath ? "~d" : ""}`;
    const sb = `${b.qid}${b.useDeath ? "~d" : ""}`;
    return sa.localeCompare(sb);
  });
  const sortedPath = sortedSegments.map((s) => `${s.qid}${s.useDeath ? "~d" : ""}`);
  const rawPath = segments.map((s) => `${s.qid}${s.useDeath ? "~d" : ""}`);
  if (rawPath.some((v, i) => v !== sortedPath[i])) {
    const redirectPath = "/" + sortedPath.join("/");
    redirect(customTitle ? `${redirectPath}?t=${encodeURIComponent(customTitle)}` : redirectPath);
  }

  const uniqueQids = [...new Set(sortedSegments.map((s) => s.qid))];

  let events;
  try {
    events = expandEvents(await fetchWikidataEvents(uniqueQids), sortedSegments);
  } catch {
    redirect("/");
  }

  if (events.length === 0) {
    redirect("/");
  }

  const timeline = computeTimeline(events);
  const href = buildShareablePath(events);

  return (
    <Chooser
      selectedEvents={events}
      serverTimeline={{ markers: timeline.markers, segments: timeline.segments }}
      serverHref={href}
      serverTitle={customTitle}
      serverHideNow={hideNow}
    />
  );
}
