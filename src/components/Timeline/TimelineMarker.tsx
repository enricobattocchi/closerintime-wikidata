import type { MarkerData } from "@/lib/types";
import { eventDisplayName } from "@/lib/event-label";
import CategoryIcon from "@/components/CategoryIcon";
import { EventAvailable } from "@/components/Icon";
import styles from "@/styles/Timeline.module.css";

interface TimelineMarkerProps {
  marker: MarkerData;
}

export default function TimelineMarker({ marker }: TimelineMarkerProps) {
  const { event, label } = marker;
  const isNow = event.id === "0";
  const hasLink = !isNow && event.link;

  const circle = (
    <div className={`${styles.markerCircle} ${hasLink ? styles.markerClickable : ""}`}>
      {isNow ? (
        <EventAvailable size={28} style={{ color: "white" }} />
      ) : (
        <CategoryIcon
          type={event.type}
          size={28}
          style={{ color: "white" }}
        />
      )}
    </div>
  );

  const info = (
    <div className={`${styles.markerInfo} ${hasLink ? styles.markerClickable : ""}`}>
      <span className={styles.markerDate}>{label}</span>
      <span className={styles.markerName}>{eventDisplayName(event)}</span>
      {event.description && (
        <span className={styles.markerDesc}>{event.description}</span>
      )}
    </div>
  );

  if (hasLink) {
    return (
      <a
        href={event.link!}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.marker}
        aria-label={`Read Wikipedia article about ${event.name}`}
      >
        {circle}
        {info}
      </a>
    );
  }

  return (
    <div className={styles.marker}>
      {circle}
      {info}
    </div>
  );
}
