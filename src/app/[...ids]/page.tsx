import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import type { Event } from "@/lib/types";
import { getEventsByIds, getEnabledEvents } from "@/lib/events";
import { computeTimeline } from "@/lib/timeline-math";
import { generateSentence } from "@/lib/sentence";
import { decodeCustomEvent, buildShareablePath } from "@/lib/custom-event-url";
import Chooser from "@/components/Chooser/Chooser";

interface PageProps {
  params: Promise<{ ids: string[] }>;
}

function parseSegments(rawIds: string[]): {
  serverIds: number[];
  customEvents: Event[];
} | null {
  if (rawIds.length < 1 || rawIds.length > 3) return null;

  const serverIds: number[] = [];
  const customEvents: Event[] = [];

  for (let i = 0; i < rawIds.length; i++) {
    const seg = decodeURIComponent(rawIds[i]);
    if (seg.startsWith("c:")) {
      const custom = decodeCustomEvent(seg, i);
      if (!custom) return null;
      customEvents.push(custom);
    } else {
      const id = Number(seg);
      if (!Number.isInteger(id) || id <= 0) return null;
      serverIds.push(id);
    }
  }

  return { serverIds, customEvents };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ids: rawIds } = await params;
  const parsed = parseSegments(rawIds);
  if (!parsed) return { title: "closerintime" };

  const serverEvents = parsed.serverIds.length > 0
    ? await getEventsByIds(parsed.serverIds)
    : [];
  const allEvents = [...serverEvents, ...parsed.customEvents];
  if (allEvents.length === 0) return { title: "closerintime" };

  const sentence = generateSentence(allEvents);
  const title = sentence || "closerintime";
  const ogTitle = sentence ? `${sentence} #closerintime` : "#closerintime";
  const description = "Visualize the time between historical events.";

  return {
    title,
    description,
    openGraph: { title: ogTitle, description },
    twitter: { card: "summary", title: ogTitle, description },
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

  const serverEvents = sortedServerIds.length > 0
    ? await getEventsByIds(sortedServerIds)
    : [];

  if (sortedServerIds.length > 0 && serverEvents.length === 0) {
    redirect("/");
  }

  const allSelectedEvents = [...serverEvents, ...parsed.customEvents];
  const allEvents = await getEnabledEvents();
  const timeline = computeTimeline(allSelectedEvents);
  const sentence = generateSentence(allSelectedEvents);
  const href = buildShareablePath(serverEvents, parsed.customEvents);

  return (
    <main>
      <Chooser
        allEvents={allEvents}
        selectedEvents={serverEvents}
        urlCustomEvents={parsed.customEvents}
        serverTimeline={{ markers: timeline.markers, segments: timeline.segments }}
        serverSentence={sentence}
        serverHref={href}
      />
    </main>
  );
}
