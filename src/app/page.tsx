import { getEnabledEvents } from "@/lib/events";
import Chooser from "@/components/Chooser/Chooser";

export const dynamic = "force-dynamic";

export default async function Home() {
  const allEvents = await getEnabledEvents();

  return <Chooser allEvents={allEvents} selectedEvents={[]} />;
}
