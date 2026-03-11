import type { SegmentData } from "@/lib/types";
import styles from "@/styles/Timeline.module.css";

interface TimelinePartProps {
  segment: SegmentData;
  zoomed?: boolean;
}

export default function TimelinePart({ segment, zoomed }: TimelinePartProps) {
  const hue = 115 + (360 * segment.order) / segment.total;
  const color = `hsl(${hue}, 65%, var(--segment-lightness))`;

  return (
    <div
      className={`${styles.part}${zoomed ? ` ${styles.partZoomed}` : ""}`}
      style={{ flexGrow: segment.percentage, borderColor: color }}
    >
      <span className={styles.partLabel} style={{ color }}>
        {segment.spanLabel}
      </span>
    </div>
  );
}
