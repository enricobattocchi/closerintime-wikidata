"use client";

import { useLayoutEffect, useEffect, useMemo, useRef, useState, Fragment } from "react";
import type { MarkerData, SegmentData } from "@/lib/types";
import { formatMonthDayYear, createUTCDate, currentYear } from "@/lib/date-utils";
import TimelineMarker from "./TimelineMarker";
import TimelinePart from "./TimelinePart";
import styles from "@/styles/Timeline.module.css";

interface TimelineProps {
  markers: MarkerData[];
  segments: SegmentData[];
  onRemove?: (eventKey: string) => void;
  onToggleDeath?: (eventKey: string) => void;
  canRemoveNow?: boolean;
  zoomed?: boolean;
}

const nowMarker: MarkerData = {
  event: {
    id: "0", name: "Now", description: null, year: currentYear(),
    month: null, day: null, type: "", link: null, dateProperty: null,
    deathYear: null, deathMonth: null, deathDay: null, useDeath: false,
  },
  label: formatMonthDayYear(createUTCDate()),
  position: 100,
};

// Module-level: survives component remounts during client navigation
let prevMarkerPositions: Map<string, number> | null = null;
let prevTimelineData: { markers: MarkerData[]; segments: SegmentData[] } | null = null;

interface AnimatedTimelineProps extends TimelineProps {
  exit?: boolean;
  zoomed?: boolean;
}

function eventKey(marker: MarkerData): string {
  return `${marker.event.id}${marker.event.useDeath ? "~d" : ""}`;
}

function AnimatedTimeline({ markers, segments, exit = false, onRemove, onToggleDeath, canRemoveNow, zoomed }: AnimatedTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [flippedKeys, setFlippedKeys] = useState<Set<string>>(new Set());

  const zoomedWidth = useMemo(() => {
    if (!zoomed || markers.length < 2) return undefined;
    // Normalize positions to the actual visible range (handles hidden Now marker)
    const first = markers[0].position;
    const last = markers[markers.length - 1].position;
    const range = last - first;
    if (range <= 0) return undefined;
    let minGap = Infinity;
    for (let i = 1; i < markers.length; i++) {
      const gap = markers[i].position - markers[i - 1].position;
      if (gap > 0 && gap < minGap) minGap = gap;
    }
    if (minGap === Infinity || minGap === 0) return undefined;
    // Express minGap as percentage of the visible range
    const normalizedGap = (minGap / range) * 100;
    const requiredVw = Math.ceil((12 * 100) / normalizedGap);
    return `max(100%, ${requiredVw}vw)`;
  }, [zoomed, markers]);

  // Re-measure after fonts load (card sizes depend on the serif font)
  const [fontsReady, setFontsReady] = useState(false);
  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  // Detect overlapping info cards and flip alternating ones above the line
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isVertical = window.matchMedia("(max-width: 640px)").matches;
    if (isVertical || exit || zoomed) {
      if (flippedKeys.size > 0) setFlippedKeys(new Set());
      return;
    }

    const markerEls = Array.from(
      container.querySelectorAll<HTMLElement>(`:scope > .${styles.marker}`)
    );
    const rects = markerEls.map((el) => {
      const info = el.querySelector<HTMLElement>(`.${styles.markerInfo}`);
      return info?.getBoundingClientRect() ?? null;
    });

    const flipped = new Set<string>();
    let lastBelowRight = -Infinity;
    let lastAboveRight = -Infinity;

    for (let i = 0; i < markers.length; i++) {
      const rect = rects[i];
      if (!rect) continue;

      const overlapBelow = rect.left < lastBelowRight;
      const overlapAbove = rect.left < lastAboveRight;

      if (!overlapBelow) {
        lastBelowRight = rect.right;
      } else if (!overlapAbove) {
        flipped.add(eventKey(markers[i]));
        lastAboveRight = rect.right;
      } else {
        // Both tracks overlap — pick the less crowded one
        if (lastAboveRight - rect.left < lastBelowRight - rect.left) {
          flipped.add(eventKey(markers[i]));
          lastAboveRight = rect.right;
        } else {
          lastBelowRight = rect.right;
        }
      }
    }

    setFlippedKeys(flipped);
  }, [markers, segments, exit, fontsReady, zoomed]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const markerEls = Array.from(
      container.querySelectorAll<HTMLElement>(`:scope > .${styles.marker}`)
    );
    const partEls = Array.from(
      container.querySelectorAll<HTMLElement>(`:scope > .${styles.part}`)
    );
    if (markerEls.length < 2) return;

    const isVertical = window.matchMedia("(max-width: 640px)").matches;
    const containerRect = container.getBoundingClientRect();
    const posProp = isVertical ? "offsetTop" : "offsetLeft";
    const axis = isVertical ? "Y" : "X";
    const scaleAxis = isVertical ? "scaleY" : "scaleX";
    const duration = 1200;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const currentPositions = new Map<string, number>();
    markers.forEach((marker, i) => {
      currentPositions.set(marker.event.id, markerEls[i][posProp]);
    });

    if (prefersReducedMotion) {
      if (!exit) prevMarkerPositions = currentPositions;
      return;
    }

    const hasPrev = prevMarkerPositions !== null && prevMarkerPositions.size > 0;
    const center = isVertical
      ? containerRect.height / 2
      : containerRect.width / 2;

    const elCenterPos = (el: HTMLElement) => {
      const r = el.getBoundingClientRect();
      return isVertical
        ? r.top - containerRect.top + r.height / 2
        : r.left - containerRect.left + r.width / 2;
    };

    if (exit) {
      // ── EXIT: converge to center, line shrinks ──
      markerEls.forEach((el) => {
        el.animate(
          [
            { transform: `translate${axis}(0)` },
            { transform: `translate${axis}(${center - elCenterPos(el)}px)` },
          ],
          { duration: 800, easing: "ease-in", fill: "forwards" }
        );
      });

      partEls.forEach((el) => {
        el.style.transformOrigin = "center";
        el.animate(
          [
            { transform: `translate${axis}(0) ${scaleAxis}(1)` },
            { transform: `translate${axis}(${center - elCenterPos(el)}px) ${scaleAxis}(0)` },
          ],
          { duration: 800, easing: "ease-in", fill: "forwards" }
        );
      });
    } else if (!hasPrev) {
      // ── FIRST APPEARANCE: grow from center ──
      markerEls.forEach((el) => {
        el.animate(
          [
            { transform: `translate${axis}(${center - elCenterPos(el)}px)` },
            { transform: `translate${axis}(0)` },
          ],
          { duration, easing: "ease-out" }
        );
      });

      partEls.forEach((el) => {
        el.style.transformOrigin = "center";
        el.animate(
          [
            { transform: `translate${axis}(${center - elCenterPos(el)}px) ${scaleAxis}(0)` },
            { transform: `translate${axis}(0) ${scaleAxis}(1)` },
          ],
          { duration, easing: "ease-out" }
        );
      });
    } else {
      // ── SUBSEQUENT: new markers slide from Now, existing FLIP ──
      const nowPos = markerEls[markerEls.length - 1][posProp];

      markers.forEach((marker, i) => {
        const el = markerEls[i];
        const currentPos = el[posProp];
        let offset = 0;

        if (prevMarkerPositions!.has(marker.event.id)) {
          offset = prevMarkerPositions!.get(marker.event.id)! - currentPos;
        } else {
          offset = nowPos - currentPos;
        }

        if (Math.abs(offset) > 1) {
          el.animate(
            [
              { transform: `translate${axis}(${offset}px)` },
              { transform: `translate${axis}(0)` },
            ],
            { duration, easing: "ease-out" }
          );
        }
      });
    }

    if (!exit) {
      prevMarkerPositions = currentPositions;
    }
  }, [markers, segments, exit]);

  return (
    <div
      ref={containerRef}
      className={`${styles.timeline}${zoomed ? ` ${styles.timelineZoomed}` : ""}`}
      style={zoomedWidth ? { width: zoomedWidth } : undefined}
    >
      {markers.map((marker, i) => (
        <Fragment key={marker.event.id}>
          <TimelineMarker
            marker={marker}
            flipped={flippedKeys.has(eventKey(marker))}
            onRemove={onRemove && (marker.event.id !== "0" || canRemoveNow) ? () => onRemove(eventKey(marker)) : undefined}
            onToggleDeath={onToggleDeath && marker.event.id !== "0" ? () => onToggleDeath(eventKey(marker)) : undefined}
          />
          {i < segments.length && <TimelinePart segment={segments[i]} zoomed={zoomed} />}
        </Fragment>
      ))}
    </div>
  );
}

export default function Timeline({ markers, segments, onRemove, onToggleDeath, canRemoveNow, zoomed }: TimelineProps) {
  const hasMarkers = markers.length > 0;

  // Initialize exiting from module-level state (survives remounts)
  const [exiting, setExiting] = useState(
    () => !hasMarkers && prevTimelineData !== null
  );
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store data while we have markers
  if (hasMarkers) {
    prevTimelineData = { markers, segments };
  }

  // Handle enter/exit transitions
  useLayoutEffect(() => {
    if (hasMarkers) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
        exitTimerRef.current = null;
      }
      if (exiting) setExiting(false);
    } else if (exiting && !exitTimerRef.current) {
      const exitDuration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 900;
      exitTimerRef.current = setTimeout(() => {
        setExiting(false);
        prevMarkerPositions = null;
        prevTimelineData = null;
        exitTimerRef.current = null;
      }, exitDuration);
    }
  }, [hasMarkers, exiting]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // Exit: render old timeline with shrink animation
  if (exiting && prevTimelineData) {
    return (
      <AnimatedTimeline
        markers={prevTimelineData.markers}
        segments={prevTimelineData.segments}
        exit
      />
    );
  }

  // Empty state
  if (!hasMarkers) {
    prevMarkerPositions = null;
    return (
      <div className={`${styles.timeline} ${styles.timelineEmpty}`}>
        <TimelineMarker marker={nowMarker} />
      </div>
    );
  }

  return <AnimatedTimeline markers={markers} segments={segments} onRemove={onRemove} onToggleDeath={onToggleDeath} canRemoveNow={canRemoveNow} zoomed={zoomed} />;
}
