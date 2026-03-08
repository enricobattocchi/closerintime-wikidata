import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const revalidate = 3600;
import type { Event } from "@/lib/types";
import { getEventsByIds, getEnabledEvents } from "@/lib/events";
import { computeTimeline } from "@/lib/timeline-math";
import { generateSentence } from "@/lib/sentence";
import { buildShareablePath } from "@/lib/custom-event-url";
import { parseSegments } from "@/lib/url-params";
import Chooser from "@/components/Chooser/Chooser";

interface PageProps {
  params: Promise<{ ids: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ids: rawIds } = await params;
  const parsed = parseSegments(rawIds);
  if (!parsed) return { title: "closerintime" };

  let serverEvents: Event[] = [];
  try {
    serverEvents = parsed.serverIds.length > 0
      ? await getEventsByIds(parsed.serverIds)
      : [];
  } catch {
    // Offline — metadata will use defaults
  }
  const allEvents = [...serverEvents, ...parsed.customEvents];
  if (allEvents.length === 0) return { title: "closerintime" };

  const sentence = generateSentence(allEvents);
  const title = sentence || "closerintime";
  const ogTitle = sentence ? `${sentence} #closerintime` : "#closerintime";
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
  const parsed = parseSegments(rawIds);

  if (!parsed) {
    redirect("/");
  }

  // Redirect server IDs to sorted ascending order for canonical URLs
  const sortedServerIds = [...parsed.serverIds].sort((a, b) => a - b);
  if (parsed.serverIds.some((id, i) => id !== sortedServerIds[i])) {
    const canonical = buildShareablePath(
      sortedServerIds.map((id) => ({ id } as Event)),
      parsed.customEvents
    );
    redirect(canonical);
  }

  let serverEvents: Event[] = [];
  let allEvents: Event[] = [];
  try {
    serverEvents = sortedServerIds.length > 0
      ? await getEventsByIds(sortedServerIds)
      : [];
    allEvents = await getEnabledEvents();
  } catch {
    // Offline — Chooser will fall back to IndexedDB cached events
  }

  if (sortedServerIds.length > 0 && serverEvents.length === 0 && allEvents.length > 0) {
    // Only redirect if we're online (have events) but IDs are invalid
    redirect("/");
  }

  const allSelectedEvents = [...serverEvents, ...parsed.customEvents];
  const timeline = computeTimeline(allSelectedEvents);
  const sentence = generateSentence(allSelectedEvents);
  const href = buildShareablePath(serverEvents, parsed.customEvents);

  return (
    <Chooser
      allEvents={allEvents}
      selectedEvents={serverEvents}
      urlCustomEvents={parsed.customEvents}
      serverTimeline={{ markers: timeline.markers, segments: timeline.segments }}
      serverSentence={sentence}
      serverHref={href}
    />
  );
}
