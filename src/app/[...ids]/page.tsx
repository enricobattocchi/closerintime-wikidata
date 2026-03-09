import { redirect } from "next/navigation";
import type { Metadata } from "next";
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ids: rawIds } = await params;
  const qids = parseSegments(rawIds);
  if (!qids) return { title: "wiki:closerintime" };

  let events;
  try {
    events = await fetchWikidataEvents(qids);
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
  const qids = parseSegments(rawIds);

  if (!qids) {
    redirect("/");
  }

  // Redirect to sorted order for canonical URLs
  const sorted = [...qids].sort();
  if (qids.some((id, i) => id !== sorted[i])) {
    redirect("/" + sorted.join("/"));
  }

  let events;
  try {
    events = await fetchWikidataEvents(sorted);
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
