"use client";

import { useLayoutEffect, useRef, Fragment } from "react";
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

function AnimatedTimeline({ markers, segments }: TimelineProps) {
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

    // Record final positions of all markers
    const currentPositions = new Map<number, number>();
    markers.forEach((marker, i) => {
      currentPositions.set(marker.event.id, markerEls[i][posProp]);
    });

    const hasPrev = prevMarkerPositions !== null && prevMarkerPositions.size > 0;

    if (!hasPrev) {
      // ── FIRST APPEARANCE: center-out animation ──
      const center = isVertical
        ? containerRect.height / 2
        : containerRect.width / 2;

      markerEls.forEach((el) => {
        const elRect = el.getBoundingClientRect();
        const elCenter = isVertical
          ? elRect.top - containerRect.top + elRect.height / 2
          : elRect.left - containerRect.left + elRect.width / 2;
        el.style.transform = `translate${axis}(${center - elCenter}px)`;
      });

      partEls.forEach((el) => {
        el.style.clipPath = isVertical
          ? "inset(50% 0 50% 0)"
          : "inset(0 50% 0 50%)";
        const label = el.querySelector<HTMLElement>(`.${styles.partLabel}`);
        if (label) label.style.opacity = "0";
      });

      container.getBoundingClientRect(); // force reflow

      const transition = "transform 1.2s ease-out";
      markerEls.forEach((el) => {
        el.style.transition = transition;
        el.style.transform = "";
      });
      partEls.forEach((el) => {
        el.style.transition = "clip-path 1.2s ease-out";
        el.style.clipPath = "inset(0 0 0 0)";
        const label = el.querySelector<HTMLElement>(`.${styles.partLabel}`);
        if (label) {
          label.style.transition = "opacity 0.6s ease-out 0.6s";
          label.style.opacity = "";
        }
      });
    } else {
      // ── SUBSEQUENT: new markers slide from Now, existing markers FLIP ──
      const nowPos = markerEls[markerEls.length - 1][posProp];

      markers.forEach((marker, i) => {
        const el = markerEls[i];
        const currentPos = el[posProp];

        if (prevMarkerPositions!.has(marker.event.id)) {
          // Existing marker — FLIP from old position
          const diff = prevMarkerPositions!.get(marker.event.id)! - currentPos;
          if (Math.abs(diff) > 1) {
            el.style.transform = `translate${axis}(${diff}px)`;
          }
        } else {
          // New marker — start at Now position
          el.style.transform = `translate${axis}(${nowPos - currentPos}px)`;
        }
      });

      // Hide segments and labels
      partEls.forEach((el) => {
        el.style.opacity = "0";
        const label = el.querySelector<HTMLElement>(`.${styles.partLabel}`);
        if (label) label.style.opacity = "0";
      });

      container.getBoundingClientRect(); // force reflow

      markerEls.forEach((el) => {
        el.style.transition = "transform 1.2s ease-out";
        el.style.transform = "";
      });
      partEls.forEach((el) => {
        el.style.transition = "opacity 0.5s ease-out 0.3s";
        el.style.opacity = "";
        const label = el.querySelector<HTMLElement>(`.${styles.partLabel}`);
        if (label) {
          label.style.transition = "opacity 0.4s ease-out 0.8s";
          label.style.opacity = "";
        }
      });
    }

    // Store for next render
    prevMarkerPositions = currentPositions;

    // Clean up inline styles after animation
    const cleanup = setTimeout(() => {
      [...markerEls, ...partEls].forEach((el) => {
        el.style.transition = "";
        el.style.transform = "";
        el.style.transformOrigin = "";
        el.style.clipPath = "";
        const label = el.querySelector<HTMLElement>(`.${styles.partLabel}`);
        if (label) {
          label.style.transition = "";
          label.style.opacity = "";
        }
      });
    }, 1500);

    return () => clearTimeout(cleanup);
  }, [markers, segments]);

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
  if (markers.length === 0) {
    // Reset so next appearance uses center-out animation
    prevMarkerPositions = null;
    return (
      <div className={`${styles.timeline} ${styles.timelineEmpty}`}>
        <TimelineMarker marker={nowMarker} />
      </div>
    );
  }

  return <AnimatedTimeline markers={markers} segments={segments} />;
}
