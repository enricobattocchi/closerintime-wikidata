import type { Metadata } from "next";
import { getEnabledEvents } from "@/lib/events";
import { ERAS, groupByEra } from "@/lib/eras";
import BrowseClient from "@/components/Browse/BrowseClient";

export const metadata: Metadata = {
  title: "Browse by era",
  description: "Explore historical events grouped by era.",
};

export const revalidate = 3600;

export default async function BrowsePage() {
  const events = await getEnabledEvents();
  const groups = groupByEra(events);

  // Serialize for client component
  const eraData = ERAS.map((era) => ({
    ...era,
    // Replace Infinity for JSON serialization
    minYear: era.minYear === -Infinity ? -99999 : era.minYear,
    maxYear: era.maxYear === Infinity ? 99999 : era.maxYear,
    events: groups.get(era.id) || [],
  }));

  return <BrowseClient eras={eraData} />;
}
