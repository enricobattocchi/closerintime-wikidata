import { redirect } from "next/navigation";
import type { Metadata } from "next";
import type { Event } from "@/lib/types";
import { fetchWikidataEvents } from "@/lib/wikidata";
import { computeTimeline } from "@/lib/timeline-math";
import { generateSentence } from "@/lib/sentence";
import { buildShareablePath } from "@/lib/custom-event-url";
import { parseSegments } from "@/lib/url-params";
import Chooser from "@/components/Chooser/Chooser";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ ids: string[] }>;
}

/** Apply ~d (death date) flags to fetched events */
function applyDeathFlags(events: Event[], deathFlags: Map<string, boolean>): Event[] {
  return events.map((e) => {
    if (deathFlags.get(e.id) && e.deathYear !== null) {
      return {
        ...e,
        year: e.deathYear,
        month: e.deathMonth,
        day: e.deathDay,
        dateProperty: "P570",
        useDeath: true,
      };
    }
    return e;
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ids: rawIds } = await params;
  const segments = parseSegments(rawIds);
  if (!segments) return { title: "wiki:closerintime" };

  const qids = segments.map((s) => s.qid);
  const deathFlags = new Map(segments.map((s) => [s.qid, s.useDeath]));

  let events;
  try {
    events = applyDeathFlags(await fetchWikidataEvents(qids), deathFlags);
  } catch {
    return { title: "wiki:closerintime" };
  }
  if (events.length === 0) return { title: "wiki:closerintime" };

  const sentence = generateSentence(events);
  const title = sentence || "wiki:closerintime";
  const ogTitle = sentence ? `${sentence} wiki:closerintime` : "wiki:closerintime";
  const description = "Visualize the time between historical events.";
  const ogImage = `/api/og?ids=${rawIds.join(",")}`;

  return {
    title,
    description,
    openGraph: { title: ogTitle, description, images: [{ url: ogImage, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title: ogTitle, description, images: [ogImage] },
  };
}

export default async function EventPage({ params }: PageProps) {
  const { ids: rawIds } = await params;
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
    redirect("/" + sortedPath.join("/"));
  }

  const qids = sortedSegments.map((s) => s.qid);
  const deathFlags = new Map(sortedSegments.map((s) => [s.qid, s.useDeath]));

  let events;
  try {
    events = applyDeathFlags(await fetchWikidataEvents(qids), deathFlags);
  } catch {
    redirect("/");
  }

  if (events.length === 0) {
    redirect("/");
  }

  const timeline = computeTimeline(events);
  const sentence = generateSentence(events);
  const href = buildShareablePath(events);

  return (
    <Chooser
      selectedEvents={events}
      serverTimeline={{ markers: timeline.markers, segments: timeline.segments }}
      serverSentence={sentence}
      serverHref={href}
    />
  );
}
