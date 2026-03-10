import type { MarkerData } from "@/lib/types";
import { eventDisplayName } from "@/lib/event-label";
import CategoryIcon from "@/components/CategoryIcon";
import { EventAvailable, CloseIcon, SwapIcon } from "@/components/Icon";
import styles from "@/styles/Timeline.module.css";

interface TimelineMarkerProps {
  marker: MarkerData;
  onRemove?: () => void;
  onToggleDeath?: () => void;
}

export default function TimelineMarker({ marker, onRemove, onToggleDeath }: TimelineMarkerProps) {
  const { event, label } = marker;
  const isNow = event.id === "0";
  const hasLink = !isNow && event.link;
  const canToggleDeath = !isNow && event.deathYear !== null;

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
      {onRemove && (
        <button
          className={styles.markerRemove}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          aria-label="Remove event"
          title="Remove event"
          data-hide-on-export
        >
          <CloseIcon size={12} />
        </button>
      )}
      <span className={styles.markerDate}>{label}</span>
      <span className={styles.markerName}>{eventDisplayName(event)}</span>
      {event.description && (
        <span className={styles.markerDesc}>{event.description}</span>
      )}
      {onToggleDeath && canToggleDeath && (
        <button
          className={styles.markerToggleDeath}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleDeath(); }}
          aria-label={event.useDeath ? "Switch to birth date" : "Switch to death date"}
          title={event.useDeath ? "Switch to birth date" : "Switch to death date"}
          data-hide-on-export
        >
          <SwapIcon size={12} aria-hidden="true" /> {event.useDeath ? "birth" : "death"}
        </button>
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
