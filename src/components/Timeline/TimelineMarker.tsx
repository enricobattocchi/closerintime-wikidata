import { useTranslations } from "next-intl";
import type { MarkerData } from "@/lib/types";
import { eventDisplayName } from "@/lib/event-label";
import CategoryIcon from "@/components/CategoryIcon";
import { EventAvailable, CloseIcon, SwapIcon } from "@/components/Icon";
import styles from "@/styles/Timeline.module.css";

interface TimelineMarkerProps {
  marker: MarkerData;
  flipped?: boolean;
  onRemove?: () => void;
  onToggleDeath?: () => void;
}

export default function TimelineMarker({ marker, flipped, onRemove, onToggleDeath }: TimelineMarkerProps) {
  const t = useTranslations("timeline");
  const tEvent = useTranslations("eventLabel");
  const { event, label } = marker;
  const isNow = event.id === "0";
  const hasLink = !isNow && event.link;
  const canToggleDeath = !isNow && event.deathYear !== null;

  const displayName = eventDisplayName(event, (key, values) => tEvent(key, values));

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
    <div className={`${styles.markerInfo} ${hasLink ? styles.markerClickable : ""} ${flipped ? styles.markerInfoFlipped : ""}`}>
      {onRemove && (
        <button
          className={styles.markerRemove}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(); }}
          aria-label={t("removeEvent")}
          title={t("removeEvent")}
          data-hide-on-export
        >
          <CloseIcon size={12} />
        </button>
      )}
      <span className={styles.markerDate}>{label}</span>
      <span className={styles.markerName}>{displayName}</span>
      {event.description && (
        <span className={styles.markerDesc}>{event.description}</span>
      )}
      {onToggleDeath && canToggleDeath && (
        <button
          className={styles.markerToggleDeath}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggleDeath(); }}
          aria-label={event.useDeath ? t("switchToBirth") : t("switchToDeath")}
          title={event.useDeath ? t("switchToBirth") : t("switchToDeath")}
          data-hide-on-export
        >
          <SwapIcon size={12} aria-hidden="true" /> {event.useDeath ? t("birth") : t("death")}
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
        aria-label={t("readWikipedia", { name: event.name })}
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
