"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Event, MarkerData, SegmentData } from "@/lib/types";
import { useSettings } from "@/hooks/useSettings";
import { useExport } from "@/hooks/useExport";
import { computeTimeline } from "@/lib/timeline-math";
import { generateSentence } from "@/lib/sentence";
import { buildShareablePath } from "@/lib/custom-event-url";
import EventAutocomplete from "./EventAutocomplete";
import Timeline from "@/components/Timeline/Timeline";
import Sentence from "@/components/Sentence";
import styles from "@/styles/Chooser.module.css";

interface ChooserProps {
  selectedEvents: Event[];
  serverTimeline?: { markers: MarkerData[]; segments: SegmentData[] };
  serverSentence?: string;
  serverHref?: string;
}

export default function Chooser({
  selectedEvents,
  serverTimeline,
  serverSentence,
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
  const currentIds = selected.map((e) => e.id);

  const handleRandom = useCallback(
    async (slotIndex: number) => {
      setLoadingRandom(true);
      try {
        const exclude = currentIds.join(",");
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
    [selected, currentIds, router]
  );

  const handleSelect = useCallback(
    (_slotIndex: number, event: Event) => {
      const next = [...selected, event];
      const path = buildShareablePath(next);
      router.push(path);
    },
    [selected, router]
  );

  const handleClear = useCallback(
    (slotIndex: number) => {
      const event = selected[slotIndex];
      if (!event) return;

      const remaining = selected.filter((e) => e.id !== event.id);
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
  let sentence: string;
  let href: string;

  if (needsClientCompute && selected.length > 0) {
    const result = computeTimeline(selected, timespanFormat);
    timeline = { markers: result.markers, segments: result.segments };
    sentence = generateSentence(selected, timespanFormat);
    href = buildShareablePath(selected);
  } else {
    timeline = serverTimeline || { markers: [], segments: [] };
    sentence = serverSentence || "";
    href = serverHref || "/";
  }

  // Build slots: filled + one empty if < 3
  const slots: (Event | null)[] = [...selected];
  if (slots.length < 3) {
    slots.push(null);
  }

  const { exportRef, handleExport } = useExport(selected);

  // Global "/" shortcut to focus first empty search input
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
        {slots.map((event, i) => (
          <div key={event ? event.id : `empty-${i}`} className={styles.slot}>
            <EventAutocomplete
              selectedIds={currentIds}
              value={event}
              onSelect={(e) => handleSelect(i, e)}
              onClear={() => handleClear(i)}
              isLoadingRandom={loadingRandom}
              onRandom={() => handleRandom(i)}
            />
          </div>
        ))}
      </div>
      <div ref={exportRef} className={styles.exportArea} aria-live="polite" aria-atomic="true">
        {selected.length > 0 && (
          <Sentence
            text={sentence}
            href={href}
            onExport={timeline.markers.length >= 2 ? handleExport : undefined}
          />
        )}
        <Timeline markers={timeline.markers} segments={timeline.segments} />
      </div>
    </>
  );
}
