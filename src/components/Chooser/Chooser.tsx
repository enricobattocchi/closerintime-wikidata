"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Event, MarkerData, SegmentData } from "@/lib/types";
import { useSettings } from "@/hooks/useSettings";
import { useExport } from "@/hooks/useExport";
import { computeTimeline } from "@/lib/timeline-math";
import { buildShareablePath } from "@/lib/custom-event-url";
import EventAutocomplete from "./EventAutocomplete";
import Timeline from "@/components/Timeline/Timeline";
import ShareToolbar from "@/components/ShareToolbar";
import styles from "@/styles/Chooser.module.css";

interface ChooserProps {
  selectedEvents: Event[];
  serverTimeline?: { markers: MarkerData[]; segments: SegmentData[] };
  serverHref?: string;
}

export default function Chooser({
  selectedEvents,
  serverTimeline,
  serverHref,
}: ChooserProps) {
  const router = useRouter();
  const { timespanFormat } = useSettings();
  const [selected, setSelected] = useState<Event[]>(selectedEvents);

  // Sync with server-provided events when they change (navigation)
  useEffect(() => {
    setSelected(selectedEvents);
  }, [selectedEvents]);

  const [loadingRandom, setLoadingRandom] = useState(false);
  const currentKeys = selected.map((e) => `${e.id}${e.useDeath ? "~d" : ""}`);

  const handleRandom = useCallback(
    async () => {
      setLoadingRandom(true);
      try {
        const exclude = currentKeys.join(",");
        const res = await fetch(`/api/random${exclude ? `?exclude=${exclude}` : ""}`);
        const event = await res.json();
        if (event?.id) {
          const next = [...selected, event];
          const path = buildShareablePath(next);
          router.push(path);
        }
      } finally {
        setLoadingRandom(false);
      }
    },
    [selected, currentKeys, router]
  );

  const handleSelect = useCallback(
    (event: Event) => {
      const next = [...selected, event];
      const path = buildShareablePath(next);
      router.push(path);
    },
    [selected, router]
  );

  const handleToggleDeath = useCallback(
    (eventKey: string) => {
      const eventIndex = selected.findIndex(
        (e) => `${e.id}${e.useDeath ? "~d" : ""}` === eventKey
      );
      if (eventIndex < 0) return;
      const event = selected[eventIndex];
      if (event.deathYear === null) return;

      const targetUseDeath = !event.useDeath;

      // Check if the target variant already exists in another slot
      const duplicateIndex = selected.findIndex(
        (e, i) => i !== eventIndex && e.id === event.id && e.useDeath === targetUseDeath
      );

      let updated;
      if (duplicateIndex >= 0) {
        // Target variant already selected — just remove this slot
        updated = selected.filter((_, i) => i !== eventIndex);
      } else {
        updated = selected.map((e, i) => {
          if (i !== eventIndex) return e;
          if (targetUseDeath) {
            return { ...e, useDeath: true, dateProperty: "P570" };
          } else {
            return { ...e, useDeath: false, dateProperty: "P569" };
          }
        });
      }

      if (updated.length > 0) {
        const path = buildShareablePath(updated);
        router.push(path);
      } else {
        router.push("/");
      }
    },
    [selected, router]
  );

  const handleRemove = useCallback(
    (eventKey: string) => {
      const remaining = selected.filter(
        (e) => `${e.id}${e.useDeath ? "~d" : ""}` !== eventKey
      );
      if (remaining.length > 0) {
        const path = buildShareablePath(remaining);
        router.push(path);
      } else {
        router.push("/");
      }
    },
    [selected, router]
  );

  // Recompute client-side when format differs from default
  const needsClientCompute = timespanFormat !== 2;

  let timeline: { markers: MarkerData[]; segments: SegmentData[] };
  let href: string;

  if (needsClientCompute && selected.length > 0) {
    const result = computeTimeline(selected, timespanFormat);
    timeline = { markers: result.markers, segments: result.segments };
    href = buildShareablePath(selected);
  } else {
    timeline = serverTimeline || { markers: [], segments: [] };
    href = serverHref || "/";
  }

  const { exportRef, handleExport } = useExport(selected);

  // Global "/" shortcut to focus search input
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "/" && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>(
          `.${styles.chooser} input:not(:disabled)`
        );
        input?.focus();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <>
      <div className={styles.chooser}>
        <div className={styles.headingRow}>
          <p className={styles.heading}>Search for events to compare</p>
        </div>
        <EventAutocomplete
          selectedKeys={currentKeys}
          onSelect={handleSelect}
          isLoadingRandom={loadingRandom}
          onRandom={handleRandom}
        />
      </div>
      <div ref={exportRef} className={styles.exportArea} aria-live="polite" aria-atomic="true">
        {selected.length > 0 && (
          <ShareToolbar
            href={href}
            onExport={timeline.markers.length >= 2 ? handleExport : undefined}
          />
        )}
        <Timeline
          markers={timeline.markers}
          segments={timeline.segments}
          onRemove={handleRemove}
          onToggleDeath={handleToggleDeath}
        />
      </div>
    </>
  );
}
