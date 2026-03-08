"use client";

import { useLayoutEffect, useEffect, useRef, useState, Fragment } from "react";
import type { MarkerData, SegmentData } from "@/lib/types";
import { formatMonthDayYear, createUTCDate, currentYear } from "@/lib/date-utils";
import TimelineMarker from "./TimelineMarker";
import TimelinePart from "./TimelinePart";
import styles from "@/styles/Timeline.module.css";

interface TimelineProps {
  markers: MarkerData[];
  segments: SegmentData[];
}

const nowMarker: MarkerData = {
  event: {
    id: 0, name: "Now", year: currentYear(),
    month: null, day: null, type: "", enabled: 1, plural: 0, link: null,
  },
  label: formatMonthDayYear(createUTCDate()),
  position: 100,
};

// Module-level: survives component remounts during client navigation
let prevMarkerPositions: Map<number, number> | null = null;
let prevTimelineData: { markers: MarkerData[]; segments: SegmentData[] } | null = null;

interface AnimatedTimelineProps extends TimelineProps {
  exit?: boolean;
}

function AnimatedTimeline({ markers, segments, exit = false }: AnimatedTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);

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

    const currentPositions = new Map<number, number>();
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
        const label = el.querySelector<HTMLElement>(`.${styles.partLabel}`);
        if (label) {
          label.animate(
            [{ opacity: 1 }, { opacity: 0 }],
            { duration: 200, easing: "ease-in", fill: "forwards" }
          );
        }
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
        const label = el.querySelector<HTMLElement>(`.${styles.partLabel}`);
        if (label) {
          label.animate(
            [{ opacity: 0 }, { opacity: 1 }],
            { duration: 600, delay: 600, easing: "ease-out", fill: "backwards" }
          );
        }
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
    <div ref={containerRef} className={styles.timeline}>
      {markers.map((marker, i) => (
        <Fragment key={marker.event.id}>
          <TimelineMarker marker={marker} />
          {i < segments.length && <TimelinePart segment={segments[i]} />}
        </Fragment>
      ))}
    </div>
  );
}

export default function Timeline({ markers, segments }: TimelineProps) {
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

  return <AnimatedTimeline markers={markers} segments={segments} />;
}
